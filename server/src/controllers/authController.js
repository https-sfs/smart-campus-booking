import bcrypt from 'bcryptjs'
import { body } from 'express-validator'
import { User } from '../models/User.js'
import { ApiError } from '../utils/apiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { clearAuthCookie, setAuthCookie } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'

const emailRule = body('email').trim().isEmail().withMessage('Enter a valid email address.')
const passwordRule = body('password')
  .matches(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/)
  .withMessage('Use at least 8 characters with one letter and one number.')

export const registerRules = validate([
  body('name').trim().isLength({ min: 2, max: 60 }).withMessage('Enter a name between 2 and 60 characters.'),
  emailRule,
  passwordRule,
  body('role').isIn(['student', 'staff']).withMessage('Choose Student or Staff. Administrator accounts cannot be registered here.'),
  body('phone').optional({ values: 'falsy' }).matches(/^\d{10}$/).withMessage('Enter a 10-digit phone number, or leave it blank.'),
])

export const loginRules = validate([
  emailRule,
  body('password').notEmpty().withMessage('Enter your password.'),
])

export const register = asyncHandler(async (req, res) => {
  const passwordHash = await bcrypt.hash(req.body.password, 10)
  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    passwordHash,
    role: req.body.role,
    phone: req.body.phone || undefined,
  })

  setAuthCookie(res, user)
  res.status(201).json({
    success: true,
    message: 'Account created.',
    data: { user },
  })
})

export const login = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: String(req.body.email).toLowerCase() }).select('+passwordHash')

  if (!user) {
    console.warn('Login failed at account lookup.')
    throw new ApiError(401, 'Email or password is incorrect.')
  }

  const matches = await bcrypt.compare(req.body.password, user.passwordHash)

  if (!matches) {
    console.warn('Login failed at password check.')
    throw new ApiError(401, 'Email or password is incorrect.')
  }

  if (!user.isActive) {
    console.warn('Login failed because the account is inactive.')
    throw new ApiError(401, 'This account is inactive.')
  }

  setAuthCookie(res, user)
  res.json({
    success: true,
    message: 'Signed in.',
    data: { user },
  })
})

export const logout = asyncHandler(async (req, res) => {
  clearAuthCookie(res)
  res.json({ success: true, message: 'Signed out.', data: null })
})

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Session restored.', data: { user: req.user } })
})
