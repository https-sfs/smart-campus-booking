import { body } from 'express-validator'
import { Booking } from '../models/Booking.js'
import { Payment } from '../models/Payment.js'
import { ApiError } from '../utils/apiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { validate } from '../middleware/validate.js'
import { createTransactionRef } from './bookingController.js'

export const paymentRules = validate([
  body('bookingId').isMongoId().withMessage('Choose a booking.'),
  body('outcome').isIn(['success', 'failure']).withMessage('Choose a simulated success or failure.'),
  body('method').isIn(['simulated_card', 'simulated_upi']).withMessage('Choose a demonstration method.'),
])

export const simulatePayment = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.body.bookingId).populate('service')

  if (!booking) {
    throw new ApiError(404, 'Booking not found.')
  }

  if (String(booking.user) !== String(req.user._id)) {
    throw new ApiError(403, 'You can only pay for your own booking.')
  }

  if (booking.status === 'Cancelled' || booking.status === 'Completed') {
    throw new ApiError(400, 'This booking cannot be paid.')
  }

  let payment = await Payment.findOne({ booking: booking._id })

  if (payment?.status === 'Paid') {
    throw new ApiError(409, 'This booking is already paid.')
  }

  if (!payment) {
    payment = new Payment({
      booking: booking._id,
      user: req.user._id,
      amount: booking.amount,
      currency: 'INR',
      method: req.body.method,
      transactionRef: createTransactionRef(),
    })
  }

  payment.method = req.body.method
  payment.amount = booking.amount

  if (req.body.outcome === 'success') {
    payment.status = 'Paid'
    payment.failureReason = ''
    payment.paidAt = new Date()
    await payment.save()

    if (booking.status === 'Pending') {
      booking.status = 'Confirmed'
      await booking.save()
    }
  } else {
    payment.status = 'Failed'
    payment.failureReason = 'Simulated failure selected in the demonstration.'
    payment.paidAt = undefined
    await payment.save()
  }

  res.json({
    success: true,
    message: payment.status === 'Paid'
      ? 'Simulated payment recorded. No real money was collected.'
      : 'Simulated payment failed. The booking is still pending and can be retried.',
    data: {
      payment,
      bookingStatus: booking.status,
    },
  })
})

export const myPayments = asyncHandler(async (req, res) => {
  const rows = await Payment.find({ user: req.user._id }).sort({ createdAt: -1 }).populate({
    path: 'booking',
    select: 'bookingDate startTime status service',
    populate: { path: 'service', select: 'name' },
  })

  res.json({
    success: true,
    message: 'Payments loaded.',
    data: {
      items: rows.map((payment) => ({
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        transactionRef: payment.transactionRef,
        failureReason: payment.failureReason || '',
        paidAt: payment.paidAt || null,
        bookingId: payment.booking ? String(payment.booking._id) : '',
        bookingDate: payment.booking?.bookingDate || '',
        startTime: payment.booking?.startTime || '',
        bookingStatus: payment.booking?.status || '',
        serviceName: payment.booking?.service?.name || 'Booking',
      })),
    },
  })
})
