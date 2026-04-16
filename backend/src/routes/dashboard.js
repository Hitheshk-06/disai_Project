const express = require('express')
const db = require('../db')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()

// GET /api/dashboard/stats
router.get('/stats', authMiddleware, (req, res) => {
  const totalApps = db.prepare('SELECT COUNT(*) as count FROM applications').get().count
  const totalCVEs = db.prepare('SELECT COUNT(*) as count FROM cve_records').get().count
  const criticalVulns = db.prepare("SELECT COUNT(*) as count FROM cve_records WHERE severity = 'CRITICAL'").get().count
  const avgRisk = db.prepare('SELECT AVG(risk_score) as avg FROM applications').get().avg || 0

  res.json({
    totalApps,
    totalCVEs,
    criticalVulns,
    overallRiskScore: Math.round(avgRisk * 10) / 10,
  })
})

// GET /api/dashboard/severity-breakdown
router.get('/severity-breakdown', authMiddleware, (req, res) => {
  const rows = db.prepare(`
    SELECT severity, COUNT(*) as value FROM cve_records GROUP BY severity
  `).all()

  const colorMap = { CRITICAL: '#EA4335', HIGH: '#FBBC04', MEDIUM: '#1A73E8', LOW: '#34A853' }
  const result = rows.map(r => ({
    name: r.severity.charAt(0) + r.severity.slice(1).toLowerCase(),
    value: r.value,
    color: colorMap[r.severity] || '#8b909f',
  }))
  res.json(result)
})

// GET /api/dashboard/top-vulnerable-apps
router.get('/top-vulnerable-apps', authMiddleware, (req, res) => {
  const apps = db.prepare('SELECT name, risk_score FROM applications ORDER BY risk_score DESC LIMIT 5').all()
  const result = apps.map(a => ({
    name: a.name,
    score: a.risk_score,
    fill: a.risk_score >= 8 ? '#EA4335' : a.risk_score >= 6 ? '#FBBC04' : '#34A853',
  }))
  res.json(result)
})

// GET /api/dashboard/recent-cves
router.get('/recent-cves', authMiddleware, (req, res) => {
  const cves = db.prepare('SELECT * FROM cve_records ORDER BY published DESC LIMIT 6').all()
  res.json(cves.map(c => ({
    id: c.id,
    severity: c.severity,
    product: c.product,
    vendor: c.vendor,
    cvssScore: c.cvss_score,
  })))
})

// GET /api/dashboard/trend-data
router.get('/trend-data', authMiddleware, (req, res) => {
  const rows = db.prepare('SELECT month, app_name, score FROM trend_data ORDER BY id').all()

  // Pivot: group by month
  const monthMap = {}
  rows.forEach(r => {
    if (!monthMap[r.month]) monthMap[r.month] = { month: r.month }
    monthMap[r.month][r.app_name] = r.score
  })

  res.json(Object.values(monthMap))
})

module.exports = router
