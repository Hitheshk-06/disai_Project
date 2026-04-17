const express = require('express')
const db = require('../db')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()

// GET /api/applications/:id/detail — full detail with components + matched CVEs
router.get('/:id/detail', authMiddleware, (req, res) => {
  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id)
  if (!app) return res.status(404).json({ error: 'Application not found' })

  const components = db.prepare('SELECT * FROM sbom_components WHERE app_name = ?').all(app.name)
  const { matchComponentsToCVEs } = require('../utils/cveMatch')
  const matches = matchComponentsToCVEs(components)

  const matchedCVEs = matches.map(m => ({
    cveId: m.cve.id,
    severity: m.cve.severity,
    cvssScore: m.cve.cvss_score,
    description: m.cve.description,
    vector: m.cve.vector,
    published: m.cve.published,
    component: m.component.component_name,
    componentVersion: m.component.component_version,
    vendor: m.component.vendor,
  }))

  res.json({
    ...mapApp(app),
    componentList: components.map(c => ({
      id: c.id,
      name: c.component_name,
      version: c.component_version,
      vendor: c.vendor,
      hasVulnerability: matches.some(m => m.component.id === c.id),
    })),
    matchedCVEs,
  })
})

// GET /api/applications — list all
router.get('/', authMiddleware, (req, res) => {
  const apps = db.prepare('SELECT * FROM applications ORDER BY risk_score DESC').all()
  // Map snake_case to camelCase to match frontend expectations
  const mapped = apps.map(mapApp)
  res.json(mapped)
})

// GET /api/applications/:id
router.get('/:id', authMiddleware, (req, res) => {
  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id)
  if (!app) return res.status(404).json({ error: 'Application not found' })
  res.json(mapApp(app))
})

// POST /api/applications
router.post('/', authMiddleware, (req, res) => {
  const { name, version, description } = req.body
  if (!name || typeof name !== 'string' || name.trim().length < 1) {
    return res.status(400).json({ error: 'Name is required' })
  }
  if (!version || typeof version !== 'string' || version.trim().length < 1) {
    return res.status(400).json({ error: 'Version is required' })
  }
  const safeName = name.trim().slice(0, 100)
  const safeVersion = version.trim().slice(0, 50)
  const safeDesc = (description || '').toString().slice(0, 500)

  const result = db.prepare(`
    INSERT INTO applications (name, version, description, components, critical_count, high_count, medium_count, low_count, risk_score, last_scan)
    VALUES (?, ?, ?, 0, 0, 0, 0, 0, 0, 'Never')
  `).run(safeName, safeVersion, safeDesc)

  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json(mapApp(app))
})

// PUT /api/applications/:id
router.put('/:id', authMiddleware, (req, res) => {
  const { name, version, description } = req.body
  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id)
  if (!app) return res.status(404).json({ error: 'Application not found' })

  db.prepare(`
    UPDATE applications SET name = COALESCE(?, name), version = COALESCE(?, version), description = COALESCE(?, description)
    WHERE id = ?
  `).run(name || null, version || null, description || null, req.params.id)

  const updated = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id)
  res.json(mapApp(updated))
})

// DELETE /api/applications/:id
router.delete('/:id', authMiddleware, (req, res) => {
  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id)
  if (!app) return res.status(404).json({ error: 'Application not found' })
  db.prepare('DELETE FROM applications WHERE id = ?').run(req.params.id)
  res.json({ message: 'Application deleted' })
})

function mapApp(a) {
  return {
    id: a.id,
    name: a.name,
    version: a.version,
    description: a.description,
    components: a.components,
    criticalCount: a.critical_count,
    highCount: a.high_count,
    mediumCount: a.medium_count,
    lowCount: a.low_count,
    riskScore: a.risk_score,
    lastScan: a.last_scan,
    created: a.created,
  }
}

module.exports = router
