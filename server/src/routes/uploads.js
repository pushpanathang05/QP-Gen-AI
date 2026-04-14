import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'

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
    if (!req.file) return res.status(400).json({ error: 'pdf is required' })
    if (!courseId || !version || !uploadedBy) {
      return res.status(400).json({ error: 'courseId, version, uploadedBy are required' })
    }

    const filePath = req.file.path
    const sha256 = await sha256File(filePath)

    const doc = await Syllabus.create({
      courseId,
      version,
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
  const message = err?.message || 'Unknown error'
  const status = message.includes('Only PDF') ? 400 : 500
  res.status(status).json({ error: message })
})

export default router
