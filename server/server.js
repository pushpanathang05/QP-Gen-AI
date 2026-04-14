import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'

import { connectDb } from './src/config/db.js'
import uploadsRouter from './src/routes/uploads.js'
import authRouter from './src/routes/auth.js'
import adminRouter from './src/routes/admin.js'
import institutionsRouter from './src/routes/institutions.js'
import coursesRouter from './src/routes/courses.js'
import templatesRouter from './src/routes/templates.js'
import auditRouter from './src/routes/audit.js'
import generationRouter from './src/routes/generation.js'
import papersRouter from './src/routes/papers.js'

dotenv.config()

const app = express()

app.use(helmet())
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim()) : true,
    credentials: true,
  }),
)
app.use(cookieParser())
app.use(express.json({ limit: '2mb' }))

app.use(
  rateLimit({
    windowMs: 60_000,
    limit: 120,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  }),
)

app.get('/health', (req, res) => {
  res.json({ ok: true })
})

app.use('/api/auth', authRouter)
app.use('/api/admin', adminRouter)
app.use('/api/institutions', institutionsRouter)
app.use('/api/courses', coursesRouter)
app.use('/api/templates', templatesRouter)
app.use('/api/audit', auditRouter)
app.use('/api/generation', generationRouter)
app.use('/api/papers', papersRouter)
app.use('/api/uploads', uploadsRouter)

app.use((err, req, res, next) => {
  const message = err?.message || 'Unknown error'
  res.status(500).json({ error: message })
})

const port = Number(process.env.PORT || 5000)

async function start() {
  await connectDb(process.env.MONGODB_URI)
  app.listen(port, () => {
    // Intentionally no console logging rules enforced here
    console.log(`Server listening on port ${port}`)
  })
}

start().catch((err) => {
  console.error(err)
  process.exit(1)
})
