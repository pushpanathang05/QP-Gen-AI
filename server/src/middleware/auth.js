import jwt from 'jsonwebtoken'

function getTokenFromRequest(req) {
  const auth = req.headers.authorization
  if (auth && auth.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim()

  const cookieName = process.env.AUTH_COOKIE_NAME || 'qp_token'
  const fromCookie = req.cookies?.[cookieName]
  if (fromCookie) return fromCookie

  return null
}

export function requireAuth(req, res, next) {
  try {
    const token = getTokenFromRequest(req)
    if (!token) return res.status(401).json({ error: 'Unauthorized' })

    const secret = process.env.JWT_SECRET
    if (!secret) return res.status(500).json({ error: 'JWT_SECRET is not configured' })

    const payload = jwt.verify(token, secret)
    req.user = {
      id: payload.sub,
      role: payload.role,
      email: payload.email,
    }

    next()
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
}
