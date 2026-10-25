import { body } from 'express-validator'
import { User } from '../models/User.js'
import { Service, serviceCategories } from '../models/Service.js'
import { Booking, occupiesCapacity } from '../models/Booking.js'
import { Payment } from '../models/Payment.js'
import { Feedback } from '../models/Feedback.js'
import { ApiError } from '../utils/apiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { escapeRegex, readPage } from '../utils/http.js'
import { releaseSlot } from '../services/slots.js'
import { validate } from '../middleware/validate.js'

const serviceFields = [
  body('name').trim().isLength({ min: 3, max: 80 }).withMessage('Enter a service name between 3 and 80 characters.'),
  body('description').trim().isLength({ min: 10, max: 500 }).withMessage('Describe the service in 10 to 500 characters.'),
  body('category').isIn(serviceCategories).withMessage('Choose a category.'),
  body('price').isInt({ min: 0 }).withMessage('Enter a whole price of 0 or more.'),
  body('durationMinutes').isIn([30, 60, '30', '60']).withMessage('Choose 30 or 60 minutes.'),
  body('capacity').isInt({ min: 1 }).withMessage('Capacity must be a whole number of at least 1.'),
  body('location').trim().isLength({ min: 3, max: 120 }).withMessage('Enter the campus location.'),
  body('icon').optional({ values: 'falsy' }).trim().isLength({ min: 2, max: 30 }),
]

export const serviceRules = validate(serviceFields)

export const userStatusRules = validate([
  body('isActive').isBoolean().withMessage('Choose whether the account is active.'),
])

export const bookingStatusRules = validate([
  body('status').isIn(['Completed', 'Cancelled']).withMessage('Choose Completed or Cancelled.'),
])

function servicePayload(body, current = {}) {
  return {
    name: body.name,
    description: body.description,
    category: body.category,
    price: Number(body.price),
    durationMinutes: Number(body.durationMinutes),
    capacity: Number(body.capacity),
    location: body.location,
    icon: body.icon || current.icon || 'library',
    ...(Object.prototype.hasOwnProperty.call(body, 'isActive') ? { isActive: Boolean(body.isActive) } : {}),
  }
}

export const stats = asyncHandler(async (req, res) => {
  const [users, services, bookings, payments, recent] = await Promise.all([
    User.countDocuments(),
    Service.countDocuments({ isActive: true }),
    Booking.countDocuments(),
    Payment.countDocuments(),
    Booking.find().populate('service', 'name').populate('user', 'name').sort({ createdAt: -1 }).limit(4),
  ])

  res.json({
    success: true,
    message: 'Statistics loaded.',
    data: {
      users,
      services,
      bookings,
      payments,
      recentBookings: recent.map((booking) => ({
        id: booking.id,
        status: booking.status,
        bookingDate: booking.bookingDate,
        startTime: booking.startTime,
        amount: booking.amount,
        serviceName: booking.service?.name || 'Service',
        userName: booking.user?.name || 'User',
      })),
    },
  })
})

export const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = readPage(req)
  const filter = {}

  if (req.query.role) {
    const role = String(req.query.role).toLowerCase()
    if (['student', 'staff', 'admin'].includes(role)) {
      filter.role = role
    }
  }

  if (req.query.search) {
    const pattern = new RegExp(escapeRegex(req.query.search), 'i')
    filter.$or = [{ name: pattern }, { email: pattern }]
  }

  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ])

  res.json({ success: true, message: 'Users loaded.', data: { items, page, limit, total } })
})

export const updateUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)

  if (!user) {
    throw new ApiError(404, 'User not found.')
  }

  const nextActive = Boolean(req.body.isActive)

  if (user.role === 'admin' && user.isActive && !nextActive) {
    const activeAdmins = await User.countDocuments({ role: 'admin', isActive: true, _id: { $ne: user._id } })

    if (activeAdmins === 0) {
      throw new ApiError(400, 'The only active administrator cannot be deactivated.')
    }
  }

  user.isActive = nextActive
  await user.save()
  res.json({ success: true, message: 'User status updated.', data: { user } })
})

export const createService = asyncHandler(async (req, res) => {
  const service = await Service.create(servicePayload(req.body))
  res.status(201).json({ success: true, message: 'Service created.', data: { service } })
})

export const updateService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id)

  if (!service) {
    throw new ApiError(404, 'Service not found.')
  }

  Object.assign(service, servicePayload(req.body, service))
  await service.save()
  res.json({ success: true, message: 'Service updated.', data: { service } })
})

export const deactivateService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id)

  if (!service) {
    throw new ApiError(404, 'Service not found.')
  }

  service.isActive = false
  await service.save()
  res.json({ success: true, message: 'Service deactivated. Existing bookings were kept.', data: { service } })
})

export const listAdminBookings = asyncHandler(async (req, res) => {
  const { page, limit, skip } = readPage(req)
  const filter = {}

  if (req.query.status) {
    filter.status = req.query.status
  }

  const [rows, total] = await Promise.all([
    Booking.find(filter).populate('service', 'name location').populate('user', 'name email role').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Booking.countDocuments(filter),
  ])

  res.json({
    success: true,
    message: 'Bookings loaded.',
    data: {
      items: rows.map((booking) => ({
        id: booking.id,
        bookingDate: booking.bookingDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        purpose: booking.purpose,
        status: booking.status,
        amount: booking.amount,
        serviceName: booking.service?.name || 'Service',
        userName: booking.user?.name || 'User',
        userEmail: booking.user?.email || '',
      })),
      page,
      limit,
      total,
    },
  })
})

export const updateBookingStatus = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)

  if (!booking) {
    throw new ApiError(404, 'Booking not found.')
  }

  const nextStatus = req.body.status

  if (!occupiesCapacity(booking.status)) {
    throw new ApiError(400, 'Completed and cancelled bookings are final.')
  }

  if (nextStatus === 'Completed' && booking.status !== 'Confirmed') {
    throw new ApiError(400, 'Only a confirmed booking can be marked completed.')
  }

  if (nextStatus === 'Cancelled' && booking.status !== 'Pending' && booking.status !== 'Confirmed') {
    throw new ApiError(400, 'This booking cannot be cancelled.')
  }

  const previous = booking.status
  booking.status = nextStatus
  await booking.save()

  if (occupiesCapacity(previous) && !occupiesCapacity(nextStatus)) {
    await releaseSlot(booking.service, booking.bookingDate, booking.startTime)
  }

  res.json({ success: true, message: 'Booking status updated.', data: { booking } })
})

export const listPayments = asyncHandler(async (req, res) => {
  const { page, limit, skip } = readPage(req)
  const filter = {}

  if (req.query.status) {
    filter.status = req.query.status
  }

  const [rows, total] = await Promise.all([
    Payment.find(filter).populate('user', 'name email').populate({ path: 'booking', populate: { path: 'service', select: 'name' } }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Payment.countDocuments(filter),
  ])

  res.json({
    success: true,
    message: 'Payments loaded.',
    data: {
      items: rows.map((payment) => ({
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        transactionRef: payment.transactionRef,
        failureReason: payment.failureReason || '',
        userName: payment.user?.name || 'User',
        serviceName: payment.booking?.service?.name || 'Booking',
      })),
      page,
      limit,
      total,
    },
  })
})

export const listFeedback = asyncHandler(async (req, res) => {
  const { page, limit, skip } = readPage(req)
  const filter = {}

  if (req.query.rating) {
    filter.rating = Number(req.query.rating)
  }

  const [rows, total] = await Promise.all([
    Feedback.find(filter).populate('user', 'name').populate('service', 'name').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Feedback.countDocuments(filter),
  ])

  res.json({
    success: true,
    message: 'Feedback loaded.',
    data: {
      items: rows.map((item) => ({
        id: item.id,
        rating: item.rating,
        comment: item.comment,
        userName: item.user?.name || 'Campus user',
        serviceName: item.service?.name || 'Service',
        createdAt: item.createdAt,
      })),
      page,
      limit,
      total,
    },
  })
})
