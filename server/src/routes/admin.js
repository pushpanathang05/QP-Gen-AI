import express from 'express'

import User from '../models/User.js'
import { requireAuth } from '../middleware/auth.js'
import { requireRole } from '../middleware/requireRole.js'

const router = express.Router()

router.use(requireAuth)
router.use(requireRole(['admin']))

router.get('/faculty/pending', async (req, res, next) => {
  try {
    const users = await User.find({ role: 'faculty', status: 'pending_admin_approval' })
      .select('_id email role status firstName lastName createdAt')
      .sort({ createdAt: -1 })

    res.json({ users })
  } catch (err) {
    next(err)
  }
})

router.post('/faculty/:id/approve', async (req, res, next) => {
  try {
    const { id } = req.params

    const user = await User.findOne({ _id: id, role: 'faculty' })
    if (!user) return res.status(404).json({ error: 'Faculty user not found' })

    user.status = 'approved'
    await user.save()

    res.json({ ok: true, user: { id: user._id, email: user.email, role: user.role, status: user.status } })
  } catch (err) {
    next(err)
  }
})

router.post('/users/:id/suspend', async (req, res, next) => {
  try {
    const { id } = req.params

    const user = await User.findById(id)
    if (!user) return res.status(404).json({ error: 'User not found' })

    user.status = 'suspended'
    await user.save()

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
