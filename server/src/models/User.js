import mongoose from 'mongoose'

const phonePattern = /^\d{10}$/

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['student', 'staff', 'admin'], default: 'student' },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator(value) {
          return !value || phonePattern.test(value)
        },
        message: 'Phone must be 10 digits.',
      },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
)

userSchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = String(ret._id)
    delete ret._id
    delete ret.__v
    delete ret.passwordHash
    return ret
  },
})

userSchema.index({ role: 1 })

export const User = mongoose.model('User', userSchema)
