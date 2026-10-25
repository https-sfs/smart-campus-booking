import mongoose from 'mongoose'

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    bookingDate: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    purpose: { type: String, required: true, trim: true, minlength: 5, maxlength: 200 },
    notes: { type: String, trim: true, maxlength: 500, default: '' },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
      default: 'Pending',
    },
    amount: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
)

bookingSchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = String(ret._id)
    delete ret._id
    delete ret.__v
    return ret
  },
})

bookingSchema.index({ user: 1, createdAt: -1 })
bookingSchema.index({ service: 1, bookingDate: 1, startTime: 1, status: 1 })

export const Booking = mongoose.model('Booking', bookingSchema)

export function occupiesCapacity(status) {
  return status === 'Pending' || status === 'Confirmed'
}
