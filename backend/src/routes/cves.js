const express = require('express')
const db = require('../db')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()

// GET /api/cves  — supports ?search=, ?severity=, ?minScore=, ?maxScore=
router.get('/', authMiddleware, (req, res) => {
  const { search, severity, minScore, maxScore } = req.query

  let query = 'SELECT * FROM cve_records WHERE 1=1'
  const params = []

  if (search) {
    query += ' AND (id LIKE ? OR product LIKE ? OR vendor LIKE ? OR description LIKE ?)'
    const like = `%${search}%`
    params.push(like, like, like, like)
  }
  if (severity) {
    const severities = severity.split(',').map(s => s.trim().toUpperCase())
    query += ` AND severity IN (${severities.map(() => '?').join(',')})`
    params.push(...severities)
  }
  if (minScore !== undefined) {
    query += ' AND cvss_score >= ?'
    params.push(Number(minScore))
  }
  if (maxScore !== undefined) {
    query += ' AND cvss_score <= ?'
    params.push(Number(maxScore))
  }

  query += ' ORDER BY cvss_score DESC'

  const cves = db.prepare(query).all(...params)
  res.json(cves.map(mapCve))
})

// GET /api/cves/:id
router.get('/:id', authMiddleware, (req, res) => {
  const cve = db.prepare('SELECT * FROM cve_records WHERE id = ?').get(req.params.id)
  if (!cve) return res.status(404).json({ error: 'CVE not found' })
  res.json(mapCve(cve))
})

function mapCve(c) {
  return {
    id: c.id,
    description: c.description,
    cvssScore: c.cvss_score,
    severity: c.severity,
    vendor: c.vendor,
    product: c.product,
    version: c.version,
    published: c.published,
    vector: c.vector,
  }
}

module.exports = router
