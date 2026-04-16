const express = require('express')
const db = require('../db')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()

// GET /api/analytics/scorecard
router.get('/scorecard', authMiddleware, (req, res) => {
  const apps = db.prepare('SELECT * FROM applications ORDER BY risk_score DESC').all()
  const result = apps.map(a => ({
    name: a.name,
    components: a.components,
    totalCVEs: a.critical_count + a.high_count + a.medium_count + a.low_count,
    criticalCount: a.critical_count,
    highCount: a.high_count,
    mediumCount: a.medium_count,
    lowCount: a.low_count,
    riskScore: a.risk_score,
    trend: a.risk_score >= 7 ? 'up' : 'down',
  }))
  res.json(result)
})

// GET /api/analytics/heatmap
router.get('/heatmap', authMiddleware, (req, res) => {
  const apps = db.prepare('SELECT name, critical_count, high_count, medium_count, low_count FROM applications').all()
  const result = apps.map(a => ({
    app: a.name,
    critical: a.critical_count,
    high: a.high_count,
    medium: a.medium_count,
    low: a.low_count,
  }))
  res.json(result)
})

// GET /api/analytics/trends
router.get('/trends', authMiddleware, (req, res) => {
  const rows = db.prepare('SELECT month, app_name, score FROM trend_data ORDER BY id').all()
  const monthMap = {}
  rows.forEach(r => {
    if (!monthMap[r.month]) monthMap[r.month] = { month: r.month }
    monthMap[r.month][r.app_name] = r.score
  })
  res.json(Object.values(monthMap))
})

module.exports = router
