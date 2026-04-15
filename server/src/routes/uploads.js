import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import mongoose from 'mongoose'

import Syllabus from '../models/Syllabus.js'
import Note from '../models/Note.js'
import { sha256File } from '../utils/hashFile.js'
import { extractPdfText } from '../services/pdfExtract.js'
import { chunkText } from '../utils/chunkText.js'
import { requireAuth } from '../middleware/auth.js'
import { requireRole } from '../middleware/requireRole.js'

const router = express.Router()

const uploadDir = path.resolve(process.cwd(), 'uploads')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safeBase = String(file.originalname || 'file.pdf')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .slice(0, 120)
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `${unique}-${safeBase}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      cb(new Error('Only PDF files are allowed'))
      return
    }
    cb(null, true)
  },
})

// NOTE: Auth is not implemented yet. For now, pass uploadedBy in body.
// Later: replace with req.user._id via JWT.

router.post('/syllabus', requireAuth, requireRole(['admin']), upload.single('pdf'), async (req, res, next) => {
  try {
    const { courseId, version, uploadedBy: uploadedByBody } = req.body
    const uploadedBy = req.user?.id || uploadedByBody
    
    console.log('[Upload Payload]:', { courseId, version, uploadedBy, hasFile: !!req.file })

    if (!req.file) return res.status(400).json({ error: 'pdf is required' })
    if (!courseId || !version || !uploadedBy) {
      console.warn('[Upload Validation Failed]: Missing required fields')
      return res.status(400).json({ error: 'courseId, version, uploadedBy are required' })
    }

    const filePath = req.file.path
    const sha256 = await sha256File(filePath)

    // Force ObjectId casting to ensure strict type matching in queries
    let oid
    try {
      oid = new mongoose.Types.ObjectId(String(courseId))
    } catch (err) {
      return res.status(400).json({ error: 'Invalid [courseId] format' })
    }

    // Atomic Upsert: Update if exists, or Create if not. 
    // This is bulletproof against E11000 duplicate key errors.
    const updateData = {
      pdf: {
        originalFileName: req.file.originalname,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
        sha256,
        storage: { provider: 'local', path: filePath },
        uploadedBy,
        uploadedAt: new Date(),
      },
      extraction: { status: 'processing' },
      source: 'pdf'
    }

    const doc = await Syllabus.findOneAndUpdate(
      { courseId: oid, version: version.trim() },
      { $set: updateData },
      { upsert: true, new: true, runValidators: true }
    )

    console.log(`[Upsert]: Syllabus for course ${courseId} is now ID: ${doc._id}`)

    // Extract immediately (can be moved to background worker later)
    try {
      const { text, pageCount } = await extractPdfText(filePath)
      const chunks = chunkText(text)

      doc.extraction = {
        status: 'succeeded',
        pageCount,
        extractedText: text,
        extractedAt: new Date(),
        error: undefined,
        chunks,
      }
      await doc.save()
    } catch (err) {
      doc.extraction = {
        status: 'failed',
        extractedAt: new Date(),
        error: err?.message || 'PDF extraction failed',
        chunks: [],
      }
      await doc.save()
    }

    res.status(201).json(doc)
  } catch (err) {
    next(err)
  }
})

router.post('/notes', requireAuth, requireRole(['admin', 'faculty']), upload.single('pdf'), async (req, res, next) => {
  try {
    const { courseId, unitNumber, title, uploadedBy: uploadedByBody } = req.body
    const uploadedBy = req.user?.id || uploadedByBody
    if (!req.file) return res.status(400).json({ error: 'pdf is required' })
    
    if (!courseId || !unitNumber || !title || !uploadedBy) {
      return res
        .status(400)
        .json({ error: 'courseId, unitNumber, title, uploadedBy are required' })
    }

    const filePath = req.file.path
    const sha256 = await sha256File(filePath)

    const doc = await Note.create({
      courseId,
      unitNumber: Number(unitNumber),
      title,
      source: 'pdf',
      pdf: {
        originalFileName: req.file.originalname,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
        sha256,
        storage: { provider: 'local', path: filePath },
        uploadedBy,
        uploadedAt: new Date(),
      },
      extraction: { status: 'processing' },
    })

    try {
      const { text, pageCount } = await extractPdfText(filePath)
      const chunks = chunkText(text)

      doc.extraction = {
        status: 'succeeded',
        pageCount,
        extractedText: text,
        extractedAt: new Date(),
        error: undefined,
        chunks,
      }
      await doc.save()
    } catch (err) {
      doc.extraction = {
        status: 'failed',
        extractedAt: new Date(),
        error: err?.message || 'PDF extraction failed',
        chunks: [],
      }
      await doc.save()
    }

    res.status(201).json(doc)
  } catch (err) {
    next(err)
  }
})

router.use((err, req, res, next) => {
  console.error('[Upload Route Error]:', err)
  const message = err?.message || 'Unknown error'
  let status = 500

  if (message.includes('Only PDF')) {
    status = 400
  } else if (err.code === 11000 || message.includes('11000')) {
    status = 409 // Conflict
    return res.status(status).json({ 
      error: 'A syllabus for this course and version already exists. Please delete the old one or choose a different version.' 
    })
  }

  res.status(status).json({ error: message })
})

export default router
