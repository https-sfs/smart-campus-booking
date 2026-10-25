import path from 'node:path'
import { pathToFileURL } from 'node:url'
import bcrypt from 'bcryptjs'
import { connectDatabase } from '../config/db.js'
import { env } from '../config/env.js'
import { User } from '../models/User.js'
import { sanitizeMessage } from '../utils/http.js'

export async function seedAdministrator({ name, email, password }) {
  const normalizedEmail = email.trim().toLowerCase()
  const existing = await User.findOne({ email: normalizedEmail }).select('+passwordHash')

  if (!existing) {
    await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(password, 10),
      role: 'admin',
    })
    return 'created'
  }

  if (existing.role !== 'admin') {
    return 'email-taken'
  }

  const samePassword = await bcrypt.compare(password, existing.passwordHash)
  if (samePassword) {
    return 'unchanged'
  }

  existing.passwordHash = await bcrypt.hash(password, 10)
  await existing.save()
  return 'password-updated'
}

const messages = {
  created: 'Administrator created.',
  unchanged: 'Administrator already exists. No duplicate was created.',
  'password-updated': 'Administrator password was updated from the current environment settings.',
  'email-taken': 'That email is already registered. No administrator was created.',
}

function invokedDirectly() {
  const entry = process.argv[1]
  if (!entry) return false
  return import.meta.url === pathToFileURL(path.resolve(entry)).href
}

if (invokedDirectly()) {
  const name = process.env.ADMIN_NAME?.trim()
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD?.trim()

  if (!name || !email || !password) {
    console.error('Set ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD in server/.env before seeding an administrator.')
    process.exit(1)
  }

  if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password)) {
    console.error('ADMIN_PASSWORD must be at least 8 characters and include a letter and a number.')
    process.exit(1)
  }

  try {
    await connectDatabase(env.mongoUri)
    const result = await seedAdministrator({ name, email, password })
    console.log(messages[result])
  } catch (error) {
    console.error(`Administrator seed failed: ${sanitizeMessage(error.message)}`)
    process.exitCode = 1
  } finally {
    const mongoose = await import('mongoose')
    await mongoose.default.disconnect()
  }
}
