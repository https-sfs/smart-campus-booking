import { Router } from 'express'
import { getService, getServiceFeedback, getSlots, listServices } from '../controllers/serviceController.js'
import { optionalAuth, requireAuth } from '../middleware/auth.js'

export const serviceRouter = Router()

serviceRouter.get('/', optionalAuth, listServices)
serviceRouter.get('/:id/slots', requireAuth, getSlots)
serviceRouter.get('/:id/feedback', getServiceFeedback)
serviceRouter.get('/:id', optionalAuth, getService)
