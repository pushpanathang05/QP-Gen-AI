import express from 'express'

import AuditLog from '../models/AuditLog.js'
import { requireAuth } from '../middleware/auth.js'
import { requireRole } from '../middleware/requireRole.js'

const router = express.Router()

router.use(requireAuth)
router.use(requireRole(['admin']))

router.get('/', async (req, res, next) => {
  try {
    const { resourceType, resourceId, userId, action, limit } = req.query

    const filter = {}
    if (resourceType) filter.resourceType = resourceType
    if (resourceId) filter.resourceId = resourceId
    if (userId) filter.userId = userId
    if (action) filter.action = action

    const lim = Math.min(200, Math.max(1, Number(limit || 50)))

    const items = await AuditLog.find(filter).sort({ timestamp: -1 }).limit(lim)
    res.json({ items })
  } catch (err) {
    next(err)
  }
})

router.use((err, req, res, next) => {
  const message = err?.message || 'Unknown error'
  res.status(500).json({ error: message })
})

export default router
