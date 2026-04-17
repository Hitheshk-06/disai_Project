const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const db = require('../db')
const { authMiddleware } = require('../middleware/auth')
const { matchComponentsToCVEs, recalculateAppRisk } = require('../utils/cveMatch')

const router = express.Router()

const uploadDir = path.join(__dirname, '..', '..', 'uploads')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
})
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.json', '.xml', '.spdx', '.csv', '.txt']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowed.includes(ext)) cb(null, true)
    else cb(new Error('Unsupported file type. Use .json, .csv, .spdx or .xml'))
  },
})

// GET /api/sbom/components
router.get('/components', authMiddleware, (req, res) => {
  const { app } = req.query
  const rows = app
    ? db.prepare('SELECT * FROM sbom_components WHERE app_name = ? ORDER BY id').all(app)
    : db.prepare('SELECT * FROM sbom_components ORDER BY app_name, id').all()
  res.json(rows.map(mapComponent))
})

// GET /api/sbom/components/:id
router.get('/components/:id', authMiddleware, (req, res) => {
  const row = db.prepare('SELECT * FROM sbom_components WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ error: 'Component not found' })
  res.json(mapComponent(row))
})

// POST /api/sbom/upload
router.post('/upload', authMiddleware, upload.single('sbom'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  const { appName } = req.body
  if (!appName || typeof appName !== 'string' || !appName.trim()) {
    return res.status(400).json({ error: 'appName is required' })
  }

  const filePath = req.file.path
  try {
    const ext = path.extname(req.file.originalname).toLowerCase()
    let components = []

    if (ext === '.json') {
      const raw = fs.readFileSync(filePath, 'utf8')
      const parsed = JSON.parse(raw)
      if (parsed.components && Array.isArray(parsed.components)) {
        // CycloneDX JSON
        components = parsed.components.map(c => ({
          app_name: appName.trim(),
          component_name: c.name || c['bom-ref'] || 'unknown',
          component_version: c.version || 'unknown',
          vendor: c.publisher || c.group || c.supplier?.name || 'unknown',
        }))
      } else if (Array.isArray(parsed)) {
        // Simple array format: [{name, version, vendor}]
        components = parsed.map(c => ({
          app_name: appName.trim(),
          component_name: c.name || 'unknown',
          component_version: c.version || 'unknown',
          vendor: c.vendor || c.publisher || 'unknown',
        }))
      }
    } else if (ext === '.csv') {
      const raw = fs.readFileSync(filePath, 'utf8')
      const lines = raw.split('\n').filter(l => l.trim())
      lines.slice(1).forEach(line => {
        const [name, version, vendor] = line.split(',').map(s => s.trim().replace(/^"|"$/g, ''))
        if (name) components.push({
          app_name: appName.trim(),
          component_name: name,
          component_version: version || 'unknown',
          vendor: vendor || 'unknown',
        })
      })
    }

    if (components.length === 0) {
      fs.unlinkSync(filePath)
      return res.status(422).json({ error: 'No components found in file. Check format.' })
    }

    // Insert components (replace existing for this app)
    db.prepare('DELETE FROM sbom_components WHERE app_name = ?').run(appName.trim())
    const insert = db.prepare(`
      INSERT INTO sbom_components (app_name, component_name, component_version, vendor)
      VALUES (@app_name, @component_name, @component_version, @vendor)
    `)
    const insertMany = db.transaction(comps => comps.forEach(c => insert.run(c)))
    insertMany(components)

    // Run CVE matching and update app risk score
    const { matches, counts, riskScore } = recalculateAppRisk(appName.trim())

    fs.unlinkSync(filePath)

    res.json({
      message: 'SBOM processed and CVE matching complete',
      appName: appName.trim(),
      componentsFound: components.length,
      cveMatches: matches.length,
      riskScore,
      severityCounts: counts,
      matchedCVEs: matches.map(m => ({
        cveId: m.cve.id,
        severity: m.cve.severity,
        cvssScore: m.cve.cvss_score,
        component: m.component.component_name,
      })),
    })
  } catch (err) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    res.status(422).json({ error: 'Failed to parse SBOM file', detail: err.message })
  }
})

// POST /api/sbom/scan/:appName — re-scan existing components
router.post('/scan/:appName', authMiddleware, (req, res) => {
  const appName = decodeURIComponent(req.params.appName)
  const app = db.prepare('SELECT * FROM applications WHERE name = ?').get(appName)
  if (!app) return res.status(404).json({ error: 'Application not found' })

  const { matches, counts, riskScore, totalComponents } = recalculateAppRisk(appName)

  res.json({
    appName,
    totalComponents,
    cveMatches: matches.length,
    riskScore,
    severityCounts: counts,
    matchedCVEs: matches.map(m => ({
      cveId: m.cve.id,
      severity: m.cve.severity,
      cvssScore: m.cve.cvss_score,
      description: m.cve.description,
      component: m.component.component_name,
      componentVersion: m.component.component_version,
    })),
  })
})

// DELETE /api/sbom/components/:id
router.delete('/components/:id', authMiddleware, (req, res) => {
  const row = db.prepare('SELECT * FROM sbom_components WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ error: 'Component not found' })
  db.prepare('DELETE FROM sbom_components WHERE id = ?').run(req.params.id)
  res.json({ message: 'Component deleted' })
})

function mapComponent(c) {
  return {
    id: c.id,
    appName: c.app_name,
    componentName: c.component_name,
    componentVersion: c.component_version,
    vendor: c.vendor,
  }
}

module.exports = router
