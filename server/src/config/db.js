import dns from 'dns'
import mongoose from 'mongoose'

const statusLabels = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
}

function databaseName(mongoUri) {
  const withoutScheme = mongoUri.replace(/^mongodb(\+srv)?:\/\//, '')
  const at = withoutScheme.lastIndexOf('@')
  const rest = at >= 0 ? withoutScheme.slice(at + 1) : withoutScheme
  return (rest.split('/')[1] || '').split('?')[0]
}

async function useReachableDns() {
  const servers = dns.getServers()
  const loopbackOnly = servers.length > 0 && servers.every((server) => server === '127.0.0.1' || server === '::1')

  if (!loopbackOnly) {
    return
  }

  try {
    await dns.promises.resolve4('example.com')
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') {
      dns.setServers(['1.1.1.1', '8.8.8.8'])
    }
  }
}

export async function connectDatabase(mongoUri) {
  mongoose.set('strictQuery', true)
  await useReachableDns()

  const options = { serverSelectionTimeoutMS: 8000 }
  if (!databaseName(mongoUri)) {
    options.dbName = 'smart-campus-booking'
  }

  await mongoose.connect(mongoUri, options)

  return mongoose.connection
}

export function getDatabaseStatus() {
  return statusLabels[mongoose.connection.readyState] || 'disconnected'
}
