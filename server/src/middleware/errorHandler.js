import { env } from '../config/env.js'
import { sanitizeMessage } from '../utils/http.js'

export function errorHandler(error, req, res, next) {
  void next

  let statusCode = Number.isInteger(error.statusCode) ? error.statusCode : 500
  let message = sanitizeMessage(error.message)
  let errors = error.errors

  if (error.code === 11000) {
    statusCode = 409
    message = duplicateMessage(error)
    errors = undefined
  } else if (error.name === 'ValidationError') {
    statusCode = 400
    message = 'Validation failed.'
    errors = Object.fromEntries(
      Object.entries(error.errors || {}).map(([key, item]) => [key, item.message]),
    )
  } else if (error.name === 'CastError') {
    statusCode = 404
    message = 'The requested record was not found.'
  }

  if (statusCode === 500) {
    console.error(error.name || 'Error', sanitizeMessage(error.message))
  }

  if (statusCode === 500 && env.nodeEnv === 'production') {
    message = 'Something went wrong.'
    errors = undefined
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
  })
}

function duplicateMessage(error) {
  const key = Object.keys(error.keyPattern || {})[0]

  if (key === 'email') {
    return 'An account with that email already exists.'
  }

  if (key === 'booking') {
    return 'A record already exists for this booking.'
  }

  if (key === 'name') {
    return 'A service with that name already exists.'
  }

  return 'A record with that value already exists.'
}
