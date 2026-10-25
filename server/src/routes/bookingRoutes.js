import { Router } from 'express'
import { bookingRules, cancelBooking, createBooking, getBooking, listBookings } from '../controllers/bookingController.js'
import { requireAuth } from '../middleware/auth.js'

export const bookingRouter = Router()

bookingRouter.use(requireAuth)
bookingRouter.post('/', bookingRules, createBooking)
bookingRouter.get('/', listBookings)
bookingRouter.get('/:id', getBooking)
bookingRouter.patch('/:id/cancel', cancelBooking)
