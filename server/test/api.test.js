import assert from 'node:assert/strict'
import { after, before, beforeEach, test } from 'node:test'
import bcrypt from 'bcryptjs'

process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret-value-0123456789abcdef'
process.env.JWT_EXPIRES_IN = '1d'
process.env.CLIENT_ORIGIN = 'http://localhost:5173'
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/smart-campus-booking-test'

const { MongoMemoryServer } = await import('mongodb-memory-server')
const mongoose = (await import('mongoose')).default
const request = (await import('supertest')).default
const { createApp } = await import('../src/app.js')
const { User } = await import('../src/models/User.js')
const { Service } = await import('../src/models/Service.js')
const { campusParts } = await import('../src/utils/time.js')

let memoryServer
let app

const password = 'secret12'

function futureDate(daysAhead) {
  return campusParts(new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000)).date
}

async function createService(overrides = {}) {
  return Service.create({
    name: 'Main Auditorium',
    description: 'The main auditorium for talks, rehearsals, and department events.',
    category: 'Events',
    price: 500,
    durationMinutes: 60,
    capacity: 1,
    location: 'Academic Block, Main Auditorium',
    icon: 'auditorium',
    isActive: true,
    ...overrides,
  })
}

before(async () => {
  memoryServer = await MongoMemoryServer.create()
  await mongoose.connect(memoryServer.getUri(), { serverSelectionTimeoutMS: 10000 })
  app = createApp()
})

after(async () => {
  await mongoose.disconnect()
  if (memoryServer) {
    await memoryServer.stop()
  }
})

beforeEach(async () => {
  const collections = await mongoose.connection.db.collections()
  await Promise.all(collections.map((collection) => collection.deleteMany({})))
})

test('registers a student, hashes the password, and restores the session', async () => {
  const agent = request.agent(app)
  const created = await agent.post('/api/auth/register').send({
    name: 'Demo Student',
    email: 'Student@Campus.Test',
    password,
    role: 'student',
    phone: '9845012345',
  })

  assert.equal(created.status, 201)
  assert.equal(created.body.data.user.email, 'student@campus.test')
  assert.equal(created.body.data.user.role, 'student')
  assert.equal(created.body.data.user.passwordHash, undefined)

  const stored = await User.findOne({ email: 'student@campus.test' }).select('+passwordHash')
  assert.notEqual(stored.passwordHash, password)
  assert.equal(await bcrypt.compare(password, stored.passwordHash), true)

  const me = await agent.get('/api/auth/me')
  assert.equal(me.status, 200)
  assert.equal(me.body.data.user.email, 'student@campus.test')

  const loggedOut = await agent.post('/api/auth/logout')
  assert.equal(loggedOut.status, 200)
  const afterLogout = await agent.get('/api/auth/me')
  assert.equal(afterLogout.status, 401)
})

test('rejects duplicate email, bad passwords, and admin registration', async () => {
  await request(app).post('/api/auth/register').send({
    name: 'Demo Student',
    email: 'student@campus.test',
    password,
    role: 'student',
  })

  const duplicate = await request(app).post('/api/auth/register').send({
    name: 'Another Student',
    email: 'student@campus.test',
    password,
    role: 'student',
  })
  assert.equal(duplicate.status, 409)

  const invalid = await request(app).post('/api/auth/register').send({
    name: 'A',
    email: 'not-an-email',
    password: 'short',
    role: 'student',
  })
  assert.equal(invalid.status, 400)

  const adminAttempt = await request(app).post('/api/auth/register').send({
    name: 'Sneaky Admin',
    email: 'sneaky@campus.test',
    password,
    role: 'admin',
  })
  assert.equal(adminAttempt.status, 400)
  assert.equal(await User.countDocuments({ role: 'admin' }), 0)
})

test('signs in a seeded administrator and replaces an outdated password', async () => {
  const { seedAdministrator } = await import('../src/scripts/seedAdmin.js')
  assert.equal(await seedAdministrator({
    name: 'Campus Admin',
    email: 'Admin@Campus.test',
    password: 'Adminpass1',
  }), 'created')

  const first = await request(app).post('/api/auth/login').send({
    email: 'admin@campus.test',
    password: 'Adminpass1',
  })
  assert.equal(first.status, 200)
  assert.equal(first.body.data.user.role, 'admin')
  assert.equal(first.body.data.user.passwordHash, undefined)

  const wrong = await request(app).post('/api/auth/login').send({
    email: 'admin@campus.test',
    password: 'wrongpass1',
  })
  assert.equal(wrong.status, 401)

  assert.equal(await seedAdministrator({
    name: 'Campus Admin',
    email: 'admin@campus.test',
    password: 'Adminpass2',
  }), 'password-updated')

  assert.equal((await request(app).post('/api/auth/login').send({
    email: 'admin@campus.test',
    password: 'Adminpass1',
  })).status, 401)
  const updated = await request(app).post('/api/auth/login').send({
    email: 'admin@campus.test',
    password: 'Adminpass2',
  })
  assert.equal(updated.status, 200)
  assert.equal(updated.body.data.user.role, 'admin')
})

test('rejects bad login and inactive accounts', async () => {
  await request(app).post('/api/auth/register').send({
    name: 'Demo Student',
    email: 'student@campus.test',
    password,
    role: 'student',
  })

  const wrong = await request(app).post('/api/auth/login').send({
    email: 'student@campus.test',
    password: 'wrongpass1',
  })
  assert.equal(wrong.status, 401)

  await User.updateOne({ email: 'student@campus.test' }, { isActive: false })
  const inactive = await request(app).post('/api/auth/login').send({
    email: 'student@campus.test',
    password,
  })
  assert.equal(inactive.status, 401)
})

test('keeps profile role and email read-only', async () => {
  const agent = request.agent(app)
  await agent.post('/api/auth/register').send({
    name: 'Demo Student',
    email: 'student@campus.test',
    password,
    role: 'student',
  })

  const updated = await agent.patch('/api/users/me').send({
    name: 'Updated Student',
    phone: '9845098765',
    role: 'admin',
    email: 'hacked@campus.test',
  })

  assert.equal(updated.status, 200)
  assert.equal(updated.body.data.user.name, 'Updated Student')
  assert.equal(updated.body.data.user.phone, '9845098765')
  assert.equal(updated.body.data.user.role, 'student')
  assert.equal(updated.body.data.user.email, 'student@campus.test')
})

test('filters services and blocks students from admin routes', async () => {
  await createService({ name: 'Campus Shuttle', category: 'Transport', price: 30, icon: 'shuttle', location: 'Main Gate pickup' })
  await createService({ name: 'Sports Court', category: 'Sports', price: 60, icon: 'sports', location: 'Indoor Sports Complex' })

  const results = await request(app).get('/api/services').query({ search: 'shuttle', category: 'Transport' })
  assert.equal(results.status, 200)
  assert.equal(results.body.data.total, 1)
  assert.equal(results.body.data.items[0].name, 'Campus Shuttle')

  const student = request.agent(app)
  await student.post('/api/auth/register').send({
    name: 'Demo Student',
    email: 'student@campus.test',
    password,
    role: 'student',
  })
  const forbidden = await student.get('/api/admin/stats')
  assert.equal(forbidden.status, 403)
})

test('enforces capacity, ownership, payment amount, and status rules', async () => {
  const service = await createService()
  const date = futureDate(3)
  const payload = {
    serviceId: String(service._id),
    bookingDate: date,
    startTime: '16:00',
    purpose: 'Department orientation rehearsal',
  }

  const first = request.agent(app)
  const second = request.agent(app)
  await first.post('/api/auth/register').send({ name: 'Demo Student', email: 'one@campus.test', password, role: 'student' })
  await second.post('/api/auth/register').send({ name: 'Demo Staff', email: 'two@campus.test', password, role: 'staff' })

  const responses = await Promise.all([
    first.post('/api/bookings').send(payload),
    second.post('/api/bookings').send(payload),
  ])
  const statuses = responses.map((response) => response.status).sort()
  assert.deepEqual(statuses, [201, 409])

  const winner = responses.find((response) => response.status === 201)
  const owner = winner === responses[0] ? first : second
  const other = owner === first ? second : first
  const bookingId = winner.body.data.booking.id
  assert.equal(winner.body.data.booking.amount, 500)

  const otherView = await other.get(`/api/bookings/${bookingId}`)
  assert.equal(otherView.status, 403)

  const ignoredAmount = await owner.post('/api/payments/simulate').send({
    bookingId,
    outcome: 'failure',
    method: 'simulated_upi',
    amount: 1,
  })
  assert.equal(ignoredAmount.status, 200)
  assert.equal(ignoredAmount.body.data.payment.amount, 500)
  assert.equal(ignoredAmount.body.data.payment.status, 'Failed')
  assert.equal(ignoredAmount.body.data.bookingStatus, 'Pending')

  const paid = await owner.post('/api/payments/simulate').send({
    bookingId,
    outcome: 'success',
    method: 'simulated_card',
    amount: 1,
  })
  assert.equal(paid.status, 200)
  assert.equal(paid.body.data.payment.amount, 500)
  assert.equal(paid.body.data.bookingStatus, 'Confirmed')

  const mine = await owner.get('/api/payments/mine')
  assert.equal(mine.status, 200)
  assert.equal(mine.body.data.items.length, 1)
  assert.equal(mine.body.data.items[0].amount, 500)
  assert.equal(mine.body.data.items[0].status, 'Paid')

  const otherPayments = await other.get('/api/payments/mine')
  assert.equal(otherPayments.status, 200)
  assert.equal(otherPayments.body.data.items.length, 0)

  const duplicatePay = await owner.post('/api/payments/simulate').send({
    bookingId,
    outcome: 'success',
    method: 'simulated_upi',
  })
  assert.equal(duplicatePay.status, 409)

  await User.create({
    name: 'Campus Admin',
    email: 'admin@campus.test',
    passwordHash: await bcrypt.hash(password, 10),
    role: 'admin',
  })
  const admin = request.agent(app)
  await admin.post('/api/auth/login').send({ email: 'admin@campus.test', password })

  const tooEarly = await admin.patch(`/api/admin/bookings/${bookingId}/status`).send({ status: 'Completed' })
  assert.equal(tooEarly.status, 200)

  const feedbackTooLate = await owner.post('/api/feedback').send({
    bookingId,
    rating: 5,
    comment: 'The auditorium booking was clear and the room was ready.',
  })
  assert.equal(feedbackTooLate.status, 201)

  const duplicateFeedback = await owner.post('/api/feedback').send({
    bookingId,
    rating: 4,
    comment: 'Trying to send a second comment for the same booking.',
  })
  assert.equal(duplicateFeedback.status, 409)

  const missing = await owner.get('/api/bookings/507f1f77bcf86cd799439011')
  assert.equal(missing.status, 404)
})

test('lets an administrator see another user booking while hiding it from other users', async () => {
  const service = await createService({
    name: 'Central Library Study Room',
    category: 'Library',
    price: 50,
    capacity: 4,
    icon: 'library',
    location: 'Central Library, Level 2',
  })
  const student = request.agent(app)
  const staff = request.agent(app)
  await student.post('/api/auth/register').send({ name: 'Demo Student', email: 'student@campus.test', password, role: 'student' })
  await staff.post('/api/auth/register').send({ name: 'Demo Staff', email: 'staff@campus.test', password, role: 'staff' })

  const created = await student.post('/api/bookings').send({
    serviceId: String(service._id),
    bookingDate: futureDate(5),
    startTime: '09:00',
    purpose: 'Group revision before the exam',
  })
  assert.equal(created.status, 201)
  const bookingId = created.body.data.booking.id

  const staffList = await staff.get('/api/bookings')
  assert.equal(staffList.status, 200)
  assert.equal(staffList.body.data.items.some((item) => item.id === bookingId), false)
  assert.equal((await staff.get(`/api/bookings/${bookingId}`)).status, 403)

  await User.create({
    name: 'Campus Admin',
    email: 'admin@campus.test',
    passwordHash: await bcrypt.hash(password, 10),
    role: 'admin',
  })
  const admin = request.agent(app)
  assert.equal((await admin.post('/api/auth/login').send({ email: 'admin@campus.test', password })).status, 200)

  const adminList = await admin.get('/api/admin/bookings')
  assert.equal(adminList.status, 200)
  assert.equal(adminList.body.data.items.some((item) => item.id === bookingId && item.userName === 'Demo Student'), true)

  const stats = await admin.get('/api/admin/stats')
  assert.equal(stats.status, 200)
  assert.ok(stats.body.data.bookings >= 1)
  assert.equal(stats.body.data.recentBookings.some((item) => item.id === bookingId && item.userName === 'Demo Student'), true)
})

test('rejects a past slot, cancels a future booking, and lets the slot be booked again', async () => {
  const service = await createService({ name: 'Sports Court', category: 'Sports', price: 60, capacity: 1, icon: 'sports', location: 'Indoor Sports Complex' })
  const agent = request.agent(app)
  await agent.post('/api/auth/register').send({ name: 'Demo Student', email: 'sport@campus.test', password, role: 'student' })
  const past = await agent.post('/api/bookings').send({
    serviceId: String(service._id),
    bookingDate: '2000-01-01',
    startTime: '09:00',
    purpose: 'Practice session for the campus team',
  })
  assert.equal(past.status, 400)

  const created = await agent.post('/api/bookings').send({
    serviceId: String(service._id),
    bookingDate: futureDate(4),
    startTime: '09:00',
    purpose: 'Practice session for the campus team',
  })
  assert.equal(created.status, 201)
  const cancelled = await agent.patch(`/api/bookings/${created.body.data.booking.id}/cancel`)
  assert.equal(cancelled.status, 200)
  assert.equal(cancelled.body.data.booking.status, 'Cancelled')

  const again = await agent.post('/api/bookings').send({
    serviceId: String(service._id),
    bookingDate: futureDate(4),
    startTime: '09:00',
    purpose: 'Practice session after the cancellation',
  })
  assert.equal(again.status, 201)
})

test('rejects a booking for an inactive service', async () => {
  const service = await createService({
    name: 'Closed Laboratory',
    category: 'Laboratory',
    price: 80,
    icon: 'lab',
    location: 'Engineering Block, Lab 3',
    isActive: false,
  })
  const agent = request.agent(app)
  await agent.post('/api/auth/register').send({
    name: 'Demo Staff',
    email: 'staff@campus.test',
    password,
    role: 'staff',
  })
  const blocked = await agent.post('/api/bookings').send({
    serviceId: String(service._id),
    bookingDate: futureDate(2),
    startTime: '10:00',
    purpose: 'Coursework that should not be accepted',
  })
  assert.equal(blocked.status, 400)
  const adminAttempt = await agent.get('/api/admin/users')
  assert.equal(adminAttempt.status, 403)
})

test('does not let the only administrator deactivate themselves', async () => {
  await User.create({
    name: 'Campus Admin',
    email: 'admin@campus.test',
    passwordHash: await bcrypt.hash(password, 10),
    role: 'admin',
  })
  const admin = request.agent(app)
  const login = await admin.post('/api/auth/login').send({ email: 'admin@campus.test', password })
  const response = await admin.patch(`/api/admin/users/${login.body.data.user.id}/status`).send({ isActive: false })
  assert.equal(response.status, 400)
})

test('service seed insert does not duplicate an existing name', async () => {
  await createService({ name: 'Campus Shuttle', category: 'Transport', price: 30, icon: 'shuttle' })
  await Service.updateOne(
    { name: 'Campus Shuttle' },
    { $setOnInsert: { name: 'Campus Shuttle', description: 'Different description that should not replace the original service text.', category: 'Transport', price: 99, durationMinutes: 60, capacity: 20, location: 'Main Gate pickup', icon: 'shuttle', isActive: true } },
    { upsert: true },
  )
  const rows = await Service.find({ name: 'Campus Shuttle' })
  assert.equal(rows.length, 1)
  assert.equal(rows[0].price, 30)
})
