import { Router } from 'express'
import { profileRules, updateProfile } from '../controllers/userController.js'
import { requireAuth } from '../middleware/auth.js'

export const userRouter = Router()

userRouter.patch('/me', requireAuth, profileRules, updateProfile)
