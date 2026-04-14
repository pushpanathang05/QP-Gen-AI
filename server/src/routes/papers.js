import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import Paper from '../models/Paper.js'

const router = express.Router()

// Ensure user is authenticated for all paper routes
router.use(requireAuth)

/**
 * @route   POST /api/papers
 * @desc    Save a newly generated question paper
 * @access  Private (Faculty/Admin)
 */
router.post('/', async (req, res, next) => {
    try {
        const {
            courseId,
            templateId,
            institutionId,
            title,
            examType,
            sections,
            format,
            metadata
        } = req.body

        if (!courseId || !templateId || !title || !examType) {
            return res.status(400).json({ error: 'Missing required fields for saving paper' })
        }

        const paper = new Paper({
            institutionId,
            courseId,
            templateId,
            title,
            examType,
            sections,
            format,
            metadata,
            createdBy: req.user.id
        })

        await paper.save()
        res.status(201).json({ item: paper })
    } catch (err) {
        next(err)
    }
})

/**
 * @route   GET /api/papers
 * @desc    Get all papers for the logged-in user
 * @access  Private
 */
router.get('/', async (req, res, next) => {
    try {
        const query = { createdBy: req.user.id }

        // If admin, they might want to see all? 
        // For now, let's keep it per-user as "History" usually refers to personal history.
        // However, if the user requested "history", they might mean system-wide if they are admin.
        // Let's stick to per-user and allow query params later.

        const items = await Paper.find(query)
            .populate('courseId', 'courseId title code')
            .populate('templateId', 'name')
            .sort({ createdAt: -1 })

        res.json({ items })
    } catch (err) {
        next(err)
    }
})

/**
 * @route   GET /api/papers/:id
 * @desc    Get specific paper details
 * @access  Private
 */
router.get('/:id', async (req, res, next) => {
    try {
        const item = await Paper.findById(req.params.id)
            .populate('courseId')
            .populate('templateId')

        if (!item) return res.status(404).json({ error: 'Paper not found' })

        // Authorization check: Only creator or admin can view
        if (item.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized to view this paper' })
        }

        res.json({ item })
    } catch (err) {
        next(err)
    }
})

export default router
