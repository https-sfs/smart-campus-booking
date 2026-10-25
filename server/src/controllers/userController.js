import { body } from 'express-validator'
import { asyncHandler } from '../utils/asyncHandler.js'
import { validate } from '../middleware/validate.js'

export const profileRules = validate([
  body('name').trim().isLength({ min: 2, max: 60 }).withMessage('Enter a name between 2 and 60 characters.'),
  body('phone').optional({ values: 'falsy' }).matches(/^\d{10}$/).withMessage('Enter a 10-digit phone number, or leave it blank.'),
])

export const updateProfile = asyncHandler(async (req, res) => {
  req.user.name = req.body.name
  req.user.phone = req.body.phone || undefined
  await req.user.save()
  res.json({ success: true, message: 'Profile updated.', data: { user: req.user } })
})
