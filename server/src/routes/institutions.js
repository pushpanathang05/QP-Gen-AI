import express from 'express'

import Institution from '../models/Institution.js'
import { requireAuth } from '../middleware/auth.js'
import { requireRole } from '../middleware/requireRole.js'
import { writeAuditLog } from '../services/audit.js'

const router = express.Router()

router.use(requireAuth)

router.get('/', async (req, res, next) => {
  try {
    const items = await Institution.find({ isActive: true }).sort({ createdAt: -1 })
    res.json({ items })
  } catch (err) {
    next(err)
  }
})

// Restricted routes below
router.use(requireRole(['admin']))

router.post('/', async (req, res, next) => {
  try {
    const { name, code, address, logoUrl, headerText, footerText } = req.body || {}
    if (!name || !code) return res.status(400).json({ error: 'name and code are required' })

    const doc = await Institution.create({
      name,
      code,
      address,
      logoUrl,
      headerText,
      footerText,
      createdBy: req.user.id,
    })

    await writeAuditLog({
      req,
      userId: req.user.id,
      action: 'institution_created',
      resourceType: 'institution',
      resourceId: doc._id,
      details: { code: doc.code, name: doc.name },
    })

    res.status(201).json({ item: doc })
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const doc = await Institution.findById(req.params.id)
    if (!doc) return res.status(404).json({ error: 'Not found' })
    res.json({ item: doc })
  } catch (err) {
    next(err)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const updates = req.body || {}
    const doc = await Institution.findByIdAndUpdate(req.params.id, updates, { new: true })
    if (!doc) return res.status(404).json({ error: 'Not found' })

    await writeAuditLog({
      req,
      userId: req.user.id,
      action: 'institution_updated',
      resourceType: 'institution',
      resourceId: doc._id,
      details: { updates: Object.keys(updates) },
    })

    res.json({ item: doc })
  } catch (err) {
    next(err)
  }
})

router.post('/:id/deactivate', async (req, res, next) => {
  try {
    const doc = await Institution.findById(req.params.id)
    if (!doc) return res.status(404).json({ error: 'Not found' })

    doc.isActive = false
    await doc.save()

    await writeAuditLog({
      req,
      userId: req.user.id,
      action: 'institution_deactivated',
      resourceType: 'institution',
      resourceId: doc._id,
    })

    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

router.use((err, req, res, next) => {
  const message = err?.message || 'Unknown error'
  res.status(500).json({ error: message })
})

export default router
