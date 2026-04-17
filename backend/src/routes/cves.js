const express = require('express')
const db = require('../db')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()

// GET /api/cves  — supports ?search=, ?severity=, ?minScore=, ?maxScore=, ?page=, ?limit=
router.get('/', authMiddleware, (req, res) => {
  const { search, severity, minScore, maxScore, page, limit } = req.query

  let query = 'SELECT * FROM cve_records WHERE 1=1'
  let countQuery = 'SELECT COUNT(*) as total FROM cve_records WHERE 1=1'
  const params = []

  if (search) {
    const clause = ' AND (id LIKE ? OR product LIKE ? OR vendor LIKE ? OR description LIKE ?)'
    query += clause; countQuery += clause
    const like = `%${search}%`
    params.push(like, like, like, like)
  }
  if (severity) {
    const severities = severity.split(',').map(s => s.trim().toUpperCase())
    const clause = ` AND severity IN (${severities.map(() => '?').join(',')})`
    query += clause; countQuery += clause
    params.push(...severities)
  }
  if (minScore !== undefined) {
    query += ' AND cvss_score >= ?'; countQuery += ' AND cvss_score >= ?'
    params.push(Number(minScore))
  }
  if (maxScore !== undefined) {
    query += ' AND cvss_score <= ?'; countQuery += ' AND cvss_score <= ?'
    params.push(Number(maxScore))
  }

  query += ' ORDER BY cvss_score DESC'

  const pageNum = Math.max(1, parseInt(page) || 1)
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50))
  const offset = (pageNum - 1) * limitNum

  const total = db.prepare(countQuery).get(...params).total
  query += ' LIMIT ? OFFSET ?'

  const cves = db.prepare(query).all(...params, limitNum, offset)
  res.json({
    data: cves.map(mapCve),
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  })
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
