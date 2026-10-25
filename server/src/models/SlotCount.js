import mongoose from 'mongoose'

const slotCountSchema = new mongoose.Schema(
  {
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    bookingDate: { type: String, required: true },
    startTime: { type: String, required: true },
    count: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true },
)

slotCountSchema.index({ service: 1, bookingDate: 1, startTime: 1 }, { unique: true })

export const SlotCount = mongoose.model('SlotCount', slotCountSchema)
