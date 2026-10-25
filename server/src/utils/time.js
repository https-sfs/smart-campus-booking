const TIME_ZONE = 'Asia/Kolkata'

export function campusParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]))
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  }
}

export function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

export function isValidTime(value) {
  if (!/^\d{2}:\d{2}$/.test(value)) {
    return false
  }

  const [hour, minute] = value.split(':').map(Number)
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59
}

export function addMinutes(time, minutesToAdd) {
  const [hour, minute] = time.split(':').map(Number)
  const total = hour * 60 + minute + minutesToAdd
  const nextHour = Math.floor(total / 60)
  const nextMinute = total % 60
  return `${String(nextHour).padStart(2, '0')}:${String(nextMinute).padStart(2, '0')}`
}

export function isPastSlot(bookingDate, startTime, now = new Date()) {
  const current = campusParts(now)

  if (bookingDate < current.date) {
    return true
  }

  if (bookingDate > current.date) {
    return false
  }

  return startTime <= current.time
}

export function buildSlots(durationMinutes) {
  const slots = []

  for (let minute = 8 * 60; minute + durationMinutes <= 20 * 60; minute += durationMinutes) {
    const startHour = Math.floor(minute / 60)
    const startMinute = minute % 60
    const end = minute + durationMinutes
    const start = `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`
    const endTime = `${String(Math.floor(end / 60)).padStart(2, '0')}:${String(end % 60).padStart(2, '0')}`
    slots.push({ start, end: endTime })
  }

  return slots
}
