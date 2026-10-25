const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(message, status, errors) {
    super(message)
    this.status = status
    this.errors = errors || {}
  }
}

export async function api(path, { method = 'GET', body } = {}) {
  let response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      credentials: 'include',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError('The API could not be reached. Start the server and try again.', 0)
  }

  let payload = null

  try {
    payload = await response.json()
  } catch {
    throw new ApiError('The API returned a response that was not JSON.', response.status)
  }

  if (!response.ok || payload.success === false) {
    throw new ApiError(payload.message || 'Request failed.', response.status, payload.errors)
  }

  return payload
}

export function fetchHealth() {
  return api('/health')
}
