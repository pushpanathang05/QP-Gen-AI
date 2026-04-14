import express from 'express'

import Template from '../models/Template.js'
import { requireAuth } from '../middleware/auth.js'
import { requireRole } from '../middleware/requireRole.js'
import { writeAuditLog } from '../services/audit.js'

const router = express.Router()

router.use(requireAuth)

router.get('/', async (req, res, next) => {
  try {
    const { institutionId, type, status } = req.query
    const filter = { isActive: true }
    if (institutionId) filter.institutionId = institutionId
    if (type) filter.type = type
    if (status) filter.status = status

    const items = await Template.find(filter).sort({ createdAt: -1 })
    res.json({ items })
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const doc = await Template.findById(req.params.id)
    if (!doc) return res.status(404).json({ error: 'Not found' })
    res.json({ item: doc })
  } catch (err) {
    next(err)
  }
})

router.post('/', requireRole(['admin']), async (req, res, next) => {
  try {
    const { institutionId, name, description, type, format } = req.body || {}
    if (!institutionId || !name || !type || !format) {
      return res.status(400).json({ error: 'institutionId, name, type, format are required' })
    }

    const doc = await Template.create({
      institutionId,
      name,
      description,
      type,
      format,
      status: 'draft',
      isDefault: false,
      isActive: true,
      createdBy: req.user.id,
    })

    await writeAuditLog({
      req,
      userId: req.user.id,
      action: 'template_created',
      resourceType: 'template',
      resourceId: doc._id,
      details: { type: doc.type, name: doc.name },
    })

    res.status(201).json({ item: doc })
  } catch (err) {
    next(err)
  }
})

router.put('/:id', requireRole(['admin']), async (req, res, next) => {
  try {
    const updates = req.body || {}

    const doc = await Template.findByIdAndUpdate(req.params.id, updates, { new: true })
    if (!doc) return res.status(404).json({ error: 'Not found' })

    await writeAuditLog({
      req,
      userId: req.user.id,
      action: 'template_updated',
      resourceType: 'template',
      resourceId: doc._id,
      details: { updates: Object.keys(updates) },
    })

    res.json({ item: doc })
  } catch (err) {
    next(err)
  }
})

router.post('/:id/approve', requireRole(['admin']), async (req, res, next) => {
  try {
    const doc = await Template.findById(req.params.id)
    if (!doc) return res.status(404).json({ error: 'Not found' })

    doc.status = 'approved'
    doc.approvedBy = req.user.id
    doc.approvedAt = new Date()
    await doc.save()

    await writeAuditLog({
      req,
      userId: req.user.id,
      action: 'template_approved',
      resourceType: 'template',
      resourceId: doc._id,
      details: { type: doc.type, name: doc.name },
    })

    res.json({ item: doc })
  } catch (err) {
    next(err)
  }
})

router.post('/:id/set-default', requireRole(['admin']), async (req, res, next) => {
  try {
    const doc = await Template.findById(req.params.id)
    if (!doc) return res.status(404).json({ error: 'Not found' })

    await Template.updateMany(
      { institutionId: doc.institutionId, type: doc.type, isActive: true },
      { $set: { isDefault: false } },
    )

    doc.isDefault = true
    await doc.save()

    await writeAuditLog({
      req,
      userId: req.user.id,
      action: 'template_set_default',
      resourceType: 'template',
      resourceId: doc._id,
      details: { type: doc.type, name: doc.name },
    })

    res.json({ item: doc })
  } catch (err) {
    next(err)
  }
})

router.post('/:id/deactivate', requireRole(['admin']), async (req, res, next) => {
  try {
    const doc = await Template.findById(req.params.id)
    if (!doc) return res.status(404).json({ error: 'Not found' })

    doc.isActive = false
    doc.isDefault = false
    await doc.save()

    await writeAuditLog({
      req,
      userId: req.user.id,
      action: 'template_deactivated',
      resourceType: 'template',
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
