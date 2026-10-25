import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { env } from '../config/env.js'
import { login, loginRules, logout, me, register, registerRules } from '../controllers/authController.js'
import { requireAuth } from '../middleware/auth.js'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => env.isTest,
  message: { success: false, message: 'Too many attempts. Try again in a few minutes.' },
})

export const authRouter = Router()

authRouter.post('/register', limiter, registerRules, register)
authRouter.post('/login', limiter, loginRules, login)
authRouter.post('/logout', logout)
authRouter.get('/me', requireAuth, me)
