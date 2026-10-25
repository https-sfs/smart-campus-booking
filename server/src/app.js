import path from 'path'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { env, serverRootDir } from './config/env.js'
import { healthRouter } from './routes/healthRoutes.js'
import { authRouter } from './routes/authRoutes.js'
import { userRouter } from './routes/userRoutes.js'
import { serviceRouter } from './routes/serviceRoutes.js'
import { bookingRouter } from './routes/bookingRoutes.js'
import { paymentRouter } from './routes/paymentRoutes.js'
import { feedbackRouter } from './routes/feedbackRoutes.js'
import { adminRouter } from './routes/adminRoutes.js'
import { requireDatabase } from './middleware/requireDatabase.js'
import { notFound } from './middleware/notFound.js'
import { errorHandler } from './middleware/errorHandler.js'

export function createApp() {
  const app = express()

  if (env.nodeEnv === 'production') {
    app.set('trust proxy', 1)
  }

  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: env.nodeEnv === 'production'
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
            imgSrc: ["'self'", 'data:'],
            connectSrc: ["'self'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            frameAncestors: ["'self'"],
          },
        }
      : false,
  }))
  app.use(cors({
    origin: env.clientOrigin,
    credentials: true,
  }))
  app.use(express.json({ limit: '100kb' }))
  app.use(cookieParser())

  app.use('/api/health', healthRouter)
  app.use('/api', requireDatabase)
  app.use('/api/auth', authRouter)
  app.use('/api/users', userRouter)
  app.use('/api/services', serviceRouter)
  app.use('/api/bookings', bookingRouter)
  app.use('/api/payments', paymentRouter)
  app.use('/api/feedback', feedbackRouter)
  app.use('/api/admin', adminRouter)

  if (env.nodeEnv === 'production') {
    const distDir = path.resolve(serverRootDir, '../client/dist')
    app.use(express.static(distDir))
    app.use((req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next()
      }

      return res.sendFile(path.join(distDir, 'index.html'), (error) => {
        if (error) {
          next()
        }
      })
    })
  }

  app.use(notFound)
  app.use(errorHandler)

  return app
}
