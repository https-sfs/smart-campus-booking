import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { User } from '../models/User.js'
import { ApiError } from '../utils/apiError.js'

export const authCookieName = 'token'

export function signToken(user) {
  return jwt.sign({ sub: String(user._id), role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  })
}

export function authCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.cookieSecure,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  }
}

export function setAuthCookie(res, user) {
  res.cookie(authCookieName, signToken(user), authCookieOptions())
}

export function clearAuthCookie(res) {
  res.clearCookie(authCookieName, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.cookieSecure,
    path: '/',
  })
}

export async function optionalAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const bearer = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  const token = bearer || req.cookies?.[authCookieName]

  if (!token) {
    return next()
  }

  return requireAuth(req, res, next)
}

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const bearer = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  const token = bearer || req.cookies?.[authCookieName]

  if (!token) {
    return next(new ApiError(401, 'Sign in required.'))
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret)
    const user = await User.findById(payload.sub)

    if (!user || !user.isActive) {
      return next(new ApiError(401, 'This account is inactive or no longer exists.'))
    }

    req.user = user
    return next()
  } catch {
    return next(new ApiError(401, 'Sign in required.'))
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have access to this action.'))
    }

    return next()
  }
}
