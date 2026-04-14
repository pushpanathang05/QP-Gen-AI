import express from 'express'

import Course from '../models/Course.js'
import Institution from '../models/Institution.js'
import { requireAuth } from '../middleware/auth.js'
import { requireRole } from '../middleware/requireRole.js'
import { generateCourseId } from '../utils/generateCourseId.js'
import { writeAuditLog } from '../services/audit.js'

const router = express.Router()

router.use(requireAuth)

router.get('/', async (req, res, next) => {
  try {
    const { institutionId, q } = req.query
    const filter = {}
    if (institutionId) filter.institutionId = institutionId
    if (q) {
      filter.$or = [
        { courseId: { $regex: String(q), $options: 'i' } },
        { code: { $regex: String(q), $options: 'i' } },
        { title: { $regex: String(q), $options: 'i' } },
      ]
    }

    const items = await Course.find(filter).sort({ createdAt: -1 })
    res.json({ items })
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const doc = await Course.findById(req.params.id)
    if (!doc) return res.status(404).json({ error: 'Not found' })
    res.json({ item: doc })
  } catch (err) {
    next(err)
  }
})

router.post('/', requireRole(['admin']), async (req, res, next) => {
  try {
    const { institutionId, code, title, department, program, semester, credits } = req.body || {}

    if (!institutionId || !code || !title) {
      return res.status(400).json({ error: 'institutionId, code, title are required' })
    }

    const inst = await Institution.findById(institutionId)
    if (!inst) return res.status(400).json({ error: 'Invalid institutionId' })

    const courseId = generateCourseId({ institutionCode: inst.code, courseCode: code })

    const doc = await Course.create({
      institutionId,
      courseId,
      code,
      title,
      department,
      program,
      semester,
      credits,
      createdBy: req.user.id,
    })

    await writeAuditLog({
      req,
      userId: req.user.id,
      action: 'course_created',
      resourceType: 'course',
      resourceId: doc._id,
      details: { courseId: doc.courseId, code: doc.code, title: doc.title },
    })

    res.status(201).json({ item: doc })
  } catch (err) {
    next(err)
  }
})

router.put('/:id', requireRole(['admin']), async (req, res, next) => {
  try {
    const updates = req.body || {}
    delete updates.courseId
    delete updates.institutionId

    const doc = await Course.findByIdAndUpdate(req.params.id, updates, { new: true })
    if (!doc) return res.status(404).json({ error: 'Not found' })

    await writeAuditLog({
      req,
      userId: req.user.id,
      action: 'course_updated',
      resourceType: 'course',
      resourceId: doc._id,
      details: { updates: Object.keys(updates) },
    })

    res.json({ item: doc })
  } catch (err) {
    next(err)
  }
})

router.post('/:id/deactivate', requireRole(['admin']), async (req, res, next) => {
  try {
    const doc = await Course.findById(req.params.id)
    if (!doc) return res.status(404).json({ error: 'Not found' })

    doc.isActive = false
    await doc.save()

    await writeAuditLog({
      req,
      userId: req.user.id,
      action: 'course_deactivated',
      resourceType: 'course',
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
