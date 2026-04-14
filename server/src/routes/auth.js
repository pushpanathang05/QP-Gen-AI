import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

import User from '../models/User.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

function signToken(user) {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is not configured')

  const expiresIn = process.env.JWT_EXPIRES_IN || '7d'

  return jwt.sign(
    {
      role: user.role,
      email: user.email,
    },
    secret,
    {
      subject: String(user._id),
      expiresIn,
    },
  )
}

function setAuthCookie(res, token) {
  const cookieName = process.env.AUTH_COOKIE_NAME || 'qp_token'
  const secure = String(process.env.AUTH_COOKIE_SECURE || 'false').toLowerCase() === 'true'

  res.cookie(cookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
  })
}

// Demo-style admin verification endpoint.
// Production: this should be a signed, expiring token sent via email.
router.get('/verify-admin', async (req, res, next) => {
  try {
    const token = req.query.token || req.query.email
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'token is required' })
    }

    let decoded = ''
    try {
      decoded = decodeURIComponent(String(token)).trim()
    } catch {
      decoded = String(token).trim()
    }

    const emailCandidate = decoded.toLowerCase()

    const user = await User.findOne({
      role: 'admin',
      $or: [{ email: emailCandidate }, { _id: decoded }],
    })

    if (!user) return res.status(404).json({ error: 'Invalid or expired link' })

    user.status = 'approved'
    await user.save()

    return res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

router.post('/signup', async (req, res, next) => {
  try {
    const { email, password, role, firstName, lastName } = req.body || {}

    if (!email || !password || !role) {
      return res.status(400).json({ error: 'email, password, role are required' })
    }

    const normalized = String(email).trim().toLowerCase()
    const existing = await User.findOne({ email: normalized })
    if (existing) return res.status(409).json({ error: 'Email already exists' })

    const status = role === 'admin' ? 'pending_email' : 'pending_admin_approval'
    const passwordHash = await bcrypt.hash(String(password), 10)

    const user = await User.create({
      email: normalized,
      passwordHash,
      role,
      firstName,
      lastName,
      status,
    })

    const token = signToken(user)
    setAuthCookie(res, token)

    res.status(201).json({
      user: { id: user._id, email: user.email, role: user.role, status: user.status },
      token,
    })
  } catch (err) {
    next(err)
  }
})

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {}

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' })
    }

    const normalized = String(email).trim().toLowerCase()
    const user = await User.findOne({ email: normalized })
    if (!user) return res.status(401).json({ error: 'Invalid email or password' })

    const ok = await bcrypt.compare(String(password), user.passwordHash)
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' })

    if (user.status !== 'approved') {
      return res.status(403).json({ error: 'Account is not approved', status: user.status })
    }

    user.lastLoginAt = new Date()
    await user.save()

    const token = signToken(user)
    setAuthCookie(res, token)

    res.json({
      user: { id: user._id, email: user.email, role: user.role, status: user.status },
      token,
    })
  } catch (err) {
    next(err)
  }
})

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) return res.status(404).json({ error: 'User not found' })

    res.json({
      user: { id: user._id, email: user.email, role: user.role, status: user.status },
    })
  } catch (err) {
    next(err)
  }
})

router.post('/logout', (req, res) => {
  const cookieName = process.env.AUTH_COOKIE_NAME || 'qp_token'
  res.clearCookie(cookieName, { path: '/' })
  res.json({ ok: true })
})

router.use((err, req, res, next) => {
  const message = err?.message || 'Unknown error'
  res.status(500).json({ error: message })
})

export default router
