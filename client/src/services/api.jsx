
const API_BASE_URL = (import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '')

async function readJsonSafe(res) {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export async function apiRequest(path, { method = 'GET', body, headers } = {}) {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`

  const isForm = typeof FormData !== 'undefined' && body instanceof FormData
  const reqHeaders = { ...(headers || {}) }
  if (!isForm && body !== undefined) reqHeaders['Content-Type'] = reqHeaders['Content-Type'] || 'application/json'

  const res = await fetch(url, {
    method,
    credentials: 'include',
    headers: reqHeaders,
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  })

  const data = await readJsonSafe(res)
  if (!res.ok) {
    const message = data?.error || `Request failed (${res.status})`
    const err = new Error(message)
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

