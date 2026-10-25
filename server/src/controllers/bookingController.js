import crypto from 'crypto'
import { body } from 'express-validator'
import { Booking, occupiesCapacity } from '../models/Booking.js'
import { Service } from '../models/Service.js'
import { Payment } from '../models/Payment.js'
import { ApiError } from '../utils/apiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { readPage } from '../utils/http.js'
import { addMinutes, buildSlots, isPastSlot, isValidDate } from '../utils/time.js'
import { releaseSlot, reserveSlot } from '../services/slots.js'
import { validate } from '../middleware/validate.js'

export const bookingRules = validate([
  body('serviceId').isMongoId().withMessage('Choose a campus service.'),
  body('bookingDate').custom((value) => isValidDate(value)).withMessage('Choose a valid date.'),
  body('startTime').matches(/^\d{2}:\d{2}$/).withMessage('Choose a time slot.'),
  body('purpose').trim().isLength({ min: 5, max: 200 }).withMessage('Describe the purpose in 5 to 200 characters.'),
  body('notes').optional({ values: 'falsy' }).isLength({ max: 500 }).withMessage('Notes must be 500 characters or fewer.'),
])

function presentBooking(booking, payment) {
  const service = booking.service && booking.service.name ? booking.service : null
  const user = booking.user && booking.user.name ? booking.user : null
  return {
    id: booking.id || String(booking._id),
    bookingDate: booking.bookingDate,
    startTime: booking.startTime,
    endTime: booking.endTime,
    purpose: booking.purpose,
    notes: booking.notes || '',
    status: booking.status,
    amount: booking.amount,
    service: service
      ? {
          id: service.id || String(service._id),
          name: service.name,
          location: service.location,
          category: service.category,
          icon: service.icon,
        }
      : { id: String(booking.service) },
    user: user
      ? { id: user.id || String(user._id), name: user.name, email: user.email, role: user.role }
      : undefined,
    payment: payment
      ? {
          id: payment.id || String(payment._id),
          status: payment.status,
          method: payment.method,
          amount: payment.amount,
          currency: payment.currency,
          transactionRef: payment.transactionRef,
          failureReason: payment.failureReason || '',
          paidAt: payment.paidAt || null,
        }
      : null,
  }
}

async function withPayments(bookings) {
  const payments = await Payment.find({ booking: { $in: bookings.map((booking) => booking._id) } })
  const byBooking = new Map(payments.map((payment) => [String(payment.booking), payment]))
  return bookings.map((booking) => presentBooking(booking, byBooking.get(String(booking._id))))
}

export const createBooking = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.body.serviceId)

  if (!service || !service.isActive) {
    throw new ApiError(400, 'That service is not available for booking.')
  }

  const allowed = buildSlots(service.durationMinutes).some((slot) => slot.start === req.body.startTime)

  if (!allowed) {
    throw new ApiError(400, 'Choose an available time slot.')
  }

  if (isPastSlot(req.body.bookingDate, req.body.startTime)) {
    throw new ApiError(400, 'Choose a future date and time.')
  }

  await reserveSlot(service, req.body.bookingDate, req.body.startTime)

  try {
    const booking = await Booking.create({
      user: req.user._id,
      service: service._id,
      bookingDate: req.body.bookingDate,
      startTime: req.body.startTime,
      endTime: addMinutes(req.body.startTime, service.durationMinutes),
      purpose: req.body.purpose,
      notes: req.body.notes || '',
      amount: service.price,
      status: 'Pending',
    })
    await booking.populate('service')
    res.status(201).json({
      success: true,
      message: 'Booking created. Complete the simulated payment to confirm it.',
      data: { booking: presentBooking(booking, null) },
    })
  } catch (error) {
    await releaseSlot(service._id, req.body.bookingDate, req.body.startTime)
    throw error
  }
})

export const listBookings = asyncHandler(async (req, res) => {
  const { page, limit, skip } = readPage(req, 20)
  const filter = req.user.role === 'admin' ? {} : { user: req.user._id }

  if (req.query.status) {
    filter.status = req.query.status
  }

  const [rows, total] = await Promise.all([
    Booking.find(filter).populate('service').populate('user', 'name email role').sort({ bookingDate: -1, startTime: -1 }).skip(skip).limit(limit),
    Booking.countDocuments(filter),
  ])

  res.json({
    success: true,
    message: 'Bookings loaded.',
    data: { items: await withPayments(rows), page, limit, total },
  })
})

export const getBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate('service').populate('user', 'name email role')

  if (!booking) {
    throw new ApiError(404, 'Booking not found.')
  }

  const owns = String(booking.user._id || booking.user) === String(req.user._id)

  if (!owns && req.user.role !== 'admin') {
    throw new ApiError(403, 'You can only open your own bookings.')
  }

  const payment = await Payment.findOne({ booking: booking._id })
  res.json({ success: true, message: 'Booking loaded.', data: { booking: presentBooking(booking, payment) } })
})

export const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)

  if (!booking) {
    throw new ApiError(404, 'Booking not found.')
  }

  const owns = String(booking.user) === String(req.user._id)

  if (!owns && req.user.role !== 'admin') {
    throw new ApiError(403, 'You can only cancel your own bookings.')
  }

  if (!occupiesCapacity(booking.status)) {
    throw new ApiError(400, 'Completed and cancelled bookings cannot be changed.')
  }

  if (isPastSlot(booking.bookingDate, booking.startTime)) {
    throw new ApiError(400, 'This booking can no longer be cancelled because the slot has started.')
  }

  booking.status = 'Cancelled'
  await booking.save()
  await releaseSlot(booking.service, booking.bookingDate, booking.startTime)
  await booking.populate('service')
  const payment = await Payment.findOne({ booking: booking._id })

  res.json({
    success: true,
    message: payment?.status === 'Paid'
      ? 'Booking cancelled. The simulated payment was not refunded.'
      : 'Booking cancelled.',
    data: { booking: presentBooking(booking, payment) },
  })
})

export function createTransactionRef() {
  return `SIM-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
}
