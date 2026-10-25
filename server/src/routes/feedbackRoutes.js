import { Router } from 'express'
import { createFeedback, feedbackRules } from '../controllers/feedbackController.js'
import { requireAuth } from '../middleware/auth.js'

export const feedbackRouter = Router()

feedbackRouter.post('/', requireAuth, feedbackRules, createFeedback)
