import mongoose from 'mongoose'

export const serviceCategories = ['Library', 'Transport', 'Laboratory', 'Sports', 'Events', 'Printing']

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 80 },
    description: { type: String, required: true, trim: true, minlength: 10, maxlength: 500 },
    category: { type: String, required: true, enum: serviceCategories },
    price: { type: Number, required: true, min: 0 },
    durationMinutes: { type: Number, required: true, enum: [30, 60] },
    capacity: { type: Number, required: true, min: 1 },
    location: { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
    icon: { type: String, required: true, trim: true, default: 'library' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
)

serviceSchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = String(ret._id)
    delete ret._id
    delete ret.__v
    return ret
  },
})

serviceSchema.index({ category: 1, isActive: 1 })

export const Service = mongoose.model('Service', serviceSchema)
