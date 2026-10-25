import mongoose from 'mongoose'
import { ApiError } from '../utils/apiError.js'

export function requireDatabase(req, res, next) {
  if (mongoose.connection.readyState === 1) {
    return next()
  }

  return next(new ApiError(503, 'Database is not connected.'))
}
