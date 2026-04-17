const express = require('express')
const cors = require('cors')
const rateLimit = require('express-rate-limit')

// Initialize DB and seed
require('./db')
const seed = require('./seed')
seed()

// Routes
const authRoutes = require('./routes/auth')
const applicationRoutes = require('./routes/applications')
const cveRoutes = require('./routes/cves')
const sbomRoutes = require('./routes/sbom')
const dashboardRoutes = require('./routes/dashboard')
const graphRoutes = require('./routes/graph')
const analyticsRoutes = require('./routes/analytics')
const settingsRoutes = require('./routes/settings')
const nvdRoutes = require('./routes/nvd')

const app = express()
const PORT = process.env.PORT || 3001

// ─── Rate Limiters ────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // max 20 login attempts per 15 min
  message: { error: 'Too many login attempts, please try again later.' },
})

// ─── Middleware ────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:4173', 'http://localhost:3000'],
  credentials: true,
}))
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true, limit: '2mb' }))
app.use(globalLimiter)

// ─── Routes ───────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/applications', applicationRoutes)
app.use('/api/cves', cveRoutes)
app.use('/api/sbom', sbomRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/graph', graphRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/nvd', nvdRoutes)

// ─── Health check ─────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ─── 404 handler ──────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` })
})

// ─── Error handler ────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`SBOM Shield API running on http://localhost:${PORT}`)
})
