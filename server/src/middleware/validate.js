import { validationResult } from 'express-validator'
import { ApiError } from '../utils/apiError.js'

export function validate(rules) {
  return [
    ...rules,
    (req, res, next) => {
      const result = validationResult(req)

      if (result.isEmpty()) {
        return next()
      }

      const errors = {}

      for (const item of result.array()) {
        const key = item.path || 'form'
        if (!errors[key]) {
          errors[key] = item.msg
        }
      }

      return next(new ApiError(400, 'Check the highlighted fields.', errors))
    },
  ]
}
