import { Router } from 'express'
import {
  bookingStatusRules,
  createService,
  deactivateService,
  listAdminBookings,
  listFeedback,
  listPayments,
  listUsers,
  serviceRules,
  stats,
  updateBookingStatus,
  updateService,
  updateUserStatus,
  userStatusRules,
} from '../controllers/adminController.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

export const adminRouter = Router()

adminRouter.use(requireAuth, requireRole('admin'))
adminRouter.get('/stats', stats)
adminRouter.get('/users', listUsers)
adminRouter.patch('/users/:id/status', userStatusRules, updateUserStatus)
adminRouter.post('/services', serviceRules, createService)
adminRouter.patch('/services/:id', serviceRules, updateService)
adminRouter.patch('/services/:id/deactivate', deactivateService)
adminRouter.get('/bookings', listAdminBookings)
adminRouter.patch('/bookings/:id/status', bookingStatusRules, updateBookingStatus)
adminRouter.get('/payments', listPayments)
adminRouter.get('/feedback', listFeedback)
