import { Service } from '../models/Service.js'
import { Feedback } from '../models/Feedback.js'
import { User } from '../models/User.js'
import { ApiError } from '../utils/apiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { escapeRegex, readPage } from '../utils/http.js'
import { buildSlots, isPastSlot, isValidDate } from '../utils/time.js'
import { slotUsage } from '../services/slots.js'

export const listServices = asyncHandler(async (req, res) => {
  const { page, limit, skip } = readPage(req, 12)
  const filter = {}

  if (!(req.user?.role === 'admin' && req.query.includeInactive === 'true')) {
    filter.isActive = true
  }

  if (req.query.category) {
    filter.category = req.query.category
  }

  if (req.query.search) {
    const pattern = new RegExp(escapeRegex(req.query.search), 'i')
    filter.$or = [{ name: pattern }, { description: pattern }, { location: pattern }]
  }

  const [items, total] = await Promise.all([
    Service.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
    Service.countDocuments(filter),
  ])

  res.json({
    success: true,
    message: 'Services loaded.',
    data: { items, page, limit, total },
  })
})

export const getService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id)

  if (!service || (!service.isActive && req.user?.role !== 'admin')) {
    throw new ApiError(404, 'Service not found.')
  }

  res.json({ success: true, message: 'Service loaded.', data: { service } })
})

export const getSlots = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id)

  if (!service || !service.isActive) {
    throw new ApiError(404, 'Service not found.')
  }

  const date = String(req.query.date || '')

  if (!isValidDate(date)) {
    throw new ApiError(400, 'Choose a valid date.')
  }

  const usage = await slotUsage(service._id, date)
  const slots = buildSlots(service.durationMinutes).map((slot) => {
    const used = usage.get(slot.start) || 0
    const past = isPastSlot(date, slot.start)
    const remaining = Math.max(0, service.capacity - used)
    return {
      ...slot,
      remaining,
      available: !past && remaining > 0,
      reason: past ? 'past' : remaining > 0 ? '' : 'full',
    }
  })

  res.json({ success: true, message: 'Slots loaded.', data: { slots, price: service.price } })
})

export const getServiceFeedback = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id)

  if (!service) {
    throw new ApiError(404, 'Service not found.')
  }

  const rows = await Feedback.find({ service: service._id }).sort({ createdAt: -1 }).limit(20)
  const users = await User.find({ _id: { $in: rows.map((row) => row.user) } }).select('name')
  const names = new Map(users.map((user) => [String(user._id), user.name]))

  res.json({
    success: true,
    message: 'Feedback loaded.',
    data: {
      items: rows.map((row) => ({
        id: row.id,
        rating: row.rating,
        comment: row.comment,
        userName: names.get(String(row.user)) || 'Campus user',
        createdAt: row.createdAt,
      })),
    },
  })
})
