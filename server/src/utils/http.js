export function sanitizeMessage(value) {
  return String(value || 'Something went wrong').replace(/\/\/([^/\s:@]+):([^@\s/]+)@/g, '//***:***@')
}

export function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function readPage(req, fallbackLimit = 10) {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1)
  const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || fallbackLimit))
  return { page, limit, skip: (page - 1) * limit }
}
