import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

dotenv.config({
  path: path.join(serverRoot, '.env'),
  quiet: true,
})

function required(name) {
  const value = process.env[name]

  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value.trim()
}

function optional(name, fallback) {
  const value = process.env[name]
  return value && value.trim() ? value.trim() : fallback
}

const port = Number(optional('PORT', '5000'))

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer from 1 to 65535')
}

const mongoUri = required('MONGODB_URI')

if (!/^mongodb(\+srv)?:\/\//.test(mongoUri)) {
  throw new Error('MONGODB_URI must start with mongodb:// or mongodb+srv://')
}

const jwtSecret = required('JWT_SECRET')

if (jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters.')
}

const nodeEnv = optional('NODE_ENV', 'development')
const clientOrigin = required('CLIENT_ORIGIN').replace(/\/$/, '')

export const env = {
  port,
  nodeEnv,
  mongoUri,
  clientOrigin,
  jwtSecret,
  jwtExpiresIn: optional('JWT_EXPIRES_IN', '7d'),
  cookieSecure: nodeEnv === 'production' && clientOrigin.startsWith('https://'),
  isTest: nodeEnv === 'test',
}

export const serverRootDir = serverRoot
