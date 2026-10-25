import { env } from '../config/env.js'
import { getDatabaseStatus } from '../config/db.js'

export function getHealth(req, res) {
  res.status(200).json({
    success: true,
    message: 'API is running',
    data: {
      service: 'Smart Campus Service Booking and Management System',
      status: 'ok',
      environment: env.nodeEnv,
      database: getDatabaseStatus(),
    },
  })
}
