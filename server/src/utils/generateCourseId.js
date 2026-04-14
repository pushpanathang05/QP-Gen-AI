import crypto from 'crypto'

export function generateCourseId({ institutionCode, courseCode }) {
  const inst = String(institutionCode || '').trim().toUpperCase()
  const code = String(courseCode || '').trim().toUpperCase()
  const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase()
  const base = [inst, code].filter(Boolean).join('-')
  return `${base}-${suffix}`
}
