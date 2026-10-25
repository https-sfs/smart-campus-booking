import { body } from 'express-validator'
import { Booking } from '../models/Booking.js'
import { Feedback } from '../models/Feedback.js'
import { ApiError } from '../utils/apiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { validate } from '../middleware/validate.js'

export const feedbackRules = validate([
  body('bookingId').isMongoId().withMessage('Choose a booking.'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Choose a rating from 1 to 5.'),
  body('comment').trim().isLength({ min: 10, max: 500 }).withMessage('Write feedback between 10 and 500 characters.'),
])

export const createFeedback = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.body.bookingId)

  if (!booking) {
    throw new ApiError(404, 'Booking not found.')
  }

  if (String(booking.user) !== String(req.user._id)) {
    throw new ApiError(403, 'You can only review your own booking.')
  }

  if (booking.status !== 'Completed') {
    throw new ApiError(400, 'Feedback is available after the booking is completed.')
  }

  const existing = await Feedback.findOne({ booking: booking._id })

  if (existing) {
    throw new ApiError(409, 'Feedback has already been submitted for this booking.')
  }

  const feedback = await Feedback.create({
    booking: booking._id,
    user: req.user._id,
    service: booking.service,
    rating: Number(req.body.rating),
    comment: req.body.comment,
  })

  res.status(201).json({ success: true, message: 'Feedback saved.', data: { feedback } })
})
