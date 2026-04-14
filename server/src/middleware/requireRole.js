export function requireRole(roles) {
  const allowed = Array.isArray(roles) ? roles : [roles]

  return function roleMiddleware(req, res, next) {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
    if (!allowed.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' })
    next()
  }
}
