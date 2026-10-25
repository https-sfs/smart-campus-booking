import { Router } from 'express'
import { myPayments, paymentRules, simulatePayment } from '../controllers/paymentController.js'
import { requireAuth } from '../middleware/auth.js'

export const paymentRouter = Router()

paymentRouter.use(requireAuth)
paymentRouter.post('/simulate', paymentRules, simulatePayment)
paymentRouter.get('/mine', myPayments)
