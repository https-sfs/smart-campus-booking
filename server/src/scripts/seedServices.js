import { connectDatabase } from '../config/db.js'
import { env } from '../config/env.js'
import { Service } from '../models/Service.js'
import { sanitizeMessage } from '../utils/http.js'

const services = [
  {
    name: 'Central Library Study Room',
    category: 'Library',
    description: 'A quiet room for group revision. Each booking covers one hour and can seat up to four students.',
    price: 50,
    durationMinutes: 60,
    capacity: 4,
    location: 'Central Library, Level 2',
    icon: 'library',
  },
  {
    name: 'Campus Shuttle',
    category: 'Transport',
    description: 'A seat on the campus shuttle between the main gate and the north campus during service hours.',
    price: 30,
    durationMinutes: 60,
    capacity: 20,
    location: 'Main Gate pickup',
    icon: 'shuttle',
  },
  {
    name: 'Laboratory Equipment',
    category: 'Laboratory',
    description: 'Reserve a supervised equipment bench for coursework. Bring your lab authorization to the session.',
    price: 80,
    durationMinutes: 60,
    capacity: 5,
    location: 'Engineering Block, Lab 3',
    icon: 'lab',
  },
  {
    name: 'Sports Court',
    category: 'Sports',
    description: 'An indoor court booking for practice or a short match. Sports shoes are required on the court.',
    price: 60,
    durationMinutes: 60,
    capacity: 2,
    location: 'Indoor Sports Complex, Court B',
    icon: 'sports',
  },
  {
    name: 'Main Auditorium',
    category: 'Events',
    description: 'The main auditorium for talks, rehearsals, and department events. One event can use a time slot.',
    price: 500,
    durationMinutes: 60,
    capacity: 1,
    location: 'Academic Block, Main Auditorium',
    icon: 'auditorium',
  },
  {
    name: 'Printing and Photocopying',
    category: 'Printing',
    description: 'A short counter slot for printing or photocopying course material at the student centre.',
    price: 20,
    durationMinutes: 30,
    capacity: 10,
    location: 'Student Centre Print Desk',
    icon: 'print',
  },
]

try {
  await connectDatabase(env.mongoUri)
  let created = 0

  for (const service of services) {
    const result = await Service.updateOne(
      { name: service.name },
      { $setOnInsert: { ...service, isActive: true } },
      { upsert: true },
    )

    if (result.upsertedCount) {
      created += 1
    }
  }

  console.log(`Service seed finished. Created ${created}. Existing services were left unchanged.`)
} catch (error) {
  console.error(`Service seed failed: ${sanitizeMessage(error.message)}`)
  process.exitCode = 1
} finally {
  const mongoose = await import('mongoose')
  await mongoose.default.disconnect()
}
