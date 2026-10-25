import { ApiError } from '../utils/apiError.js'
import { SlotCount } from '../models/SlotCount.js'

export async function reserveSlot(service, bookingDate, startTime) {
  const key = { service: service._id, bookingDate, startTime }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const updated = await SlotCount.findOneAndUpdate(
      { ...key, count: { $lt: service.capacity } },
      { $inc: { count: 1 } },
      { returnDocument: 'after' },
    )

    if (updated) {
      return
    }

    try {
      await SlotCount.create({ ...key, count: 1 })
      return
    } catch (error) {
      if (error.code !== 11000) {
        throw error
      }
    }
  }

  throw new ApiError(409, 'That time slot is full.')
}

export async function releaseSlot(serviceId, bookingDate, startTime) {
  await SlotCount.findOneAndUpdate(
    { service: serviceId, bookingDate, startTime, count: { $gt: 0 } },
    { $inc: { count: -1 } },
  )
}

export async function slotUsage(serviceId, bookingDate) {
  const rows = await SlotCount.find({ service: serviceId, bookingDate })
  return new Map(rows.map((row) => [row.startTime, row.count]))
}
