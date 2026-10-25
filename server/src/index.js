import { createApp } from './app.js'
import { connectDatabase } from './config/db.js'
import { env } from './config/env.js'

function toSafeMessage(error) {
  return String(error?.message || 'Unknown database error').replace(/\/\/[^@\s]+@/g, '//***@')
}

async function start() {
  try {
    await connectDatabase(env.mongoUri)
    console.log('MongoDB connected')
  } catch (error) {
    console.error(`MongoDB connection failed: ${toSafeMessage(error)}`)
    console.error('Database status: disconnected. Start MongoDB or update MONGODB_URI, then restart the server.')
  }

  const server = createApp().listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port}`)
  })

  server.on('error', (error) => {
    console.error(`Server failed to start: ${error.message}`)
    process.exit(1)
  })
}

start().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
