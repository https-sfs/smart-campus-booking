import mongoose from 'mongoose'

const paymentSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'INR', enum: ['INR'] },
    status: { type: String, enum: ['Pending', 'Paid', 'Failed'], default: 'Pending' },
    method: { type: String, enum: ['simulated_card', 'simulated_upi'], required: true },
    transactionRef: { type: String, required: true, unique: true },
    failureReason: { type: String, trim: true, maxlength: 200, default: '' },
    paidAt: { type: Date },
  },
  { timestamps: true },
)

paymentSchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = String(ret._id)
    delete ret._id
    delete ret.__v
    return ret
  },
})

paymentSchema.index({ user: 1, createdAt: -1 })
paymentSchema.index({ status: 1 })

export const Payment = mongoose.model('Payment', paymentSchema)
