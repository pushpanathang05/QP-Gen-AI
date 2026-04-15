import express from 'express'
import mongoose from 'mongoose'
import Syllabus from '../models/Syllabus.js'
import Note from '../models/Note.js'
import Course from '../models/Course.js'
import Institution from '../models/Institution.js'
import { requireAuth } from '../middleware/auth.js'
import { requireRole } from '../middleware/requireRole.js'
import { generateCourseId } from '../utils/generateCourseId.js'
import { writeAuditLog } from '../services/audit.js'

const router = express.Router()

// @route   GET /api/courses/health
// @desc    Check system health (DB and AI Service)
router.get('/health', async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'online' : 'offline'
  
  // Try pinging AI service
  let aiStatus = 'offline'
  try {
    const pythonServiceUrl = process.env.ANNA_AI_SERVICE_URL || 'http://localhost:5001'
    await axios.get(`${pythonServiceUrl}/health`, { timeout: 2000 })
    aiStatus = 'online'
  } catch (err) {
    aiStatus = 'offline'
  }

  res.json({
    database: dbStatus,
    aiService: aiStatus,
    timestamp: new Date()
  })
})

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

    const items = await Course.find(filter).sort({ createdAt: -1 }).lean()
    
    console.log(`[Courses API]: Found ${items.length} courses for filter:`, filter)

    // Check for syllabus existence for each course
    const enrichedItems = await Promise.all(items.map(async (course) => {
      // Robust check: matches both ObjectId and String formats
      const syllabus = await Syllabus.findOne({ 
        courseId: { $in: [course._id, String(course._id)] } 
      })
      
      if (syllabus) {
        console.log(`  - Course ${course.code}: Syllabus found.`)
      } else {
        console.log(`  - Course ${course.code}: NO syllabus found. searched for courseId: ${course._id}`)
      }
      return {
        ...course,
        hasSyllabus: !!syllabus
      }
    }))

    res.json({ items: enrichedItems })
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

router.delete('/', requireRole(['admin']), async (req, res, next) => {
  try {
    // 🚨 Danger Zone: Clear everything
    await Syllabus.deleteMany({})
    await Note.deleteMany({})
    await Course.deleteMany({})

    await writeAuditLog({
      req,
      userId: req.user.id,
      action: 'all_courses_cleared',
      resourceType: 'system',
    })

    res.json({ ok: true, message: 'All courses, syllabuses, and notes have been cleared' })
  } catch (err) {
    next(err)
  }
})

router.delete('/:id', requireRole(['admin']), async (req, res, next) => {
  try {
    const courseId = req.params.id
    const doc = await Course.findById(courseId)
    if (!doc) return res.status(404).json({ error: 'Course not found' })

    // 1. Delete associated Syllabuses
    await Syllabus.deleteMany({ courseId })
    // 2. Delete associated Notes
    await Note.deleteMany({ courseId })
    // 3. Delete the Course itself
    await Course.findByIdAndDelete(courseId)

    await writeAuditLog({
      req,
      userId: req.user.id,
      action: 'course_deleted',
      resourceType: 'course',
      resourceId: courseId,
      details: { code: doc.code, title: doc.title }
    })

    res.json({ ok: true, message: 'Course and all related data deleted successfully' })
  } catch (err) {
    next(err)
  }
})

router.use((err, req, res, next) => {
  const message = err?.message || 'Unknown error'
  res.status(500).json({ error: message })
})

export default router
