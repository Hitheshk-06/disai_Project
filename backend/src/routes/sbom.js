const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const db = require('../db')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()

// Multer config — store uploads in backend/uploads/
const uploadDir = path.join(__dirname, '..', '..', 'uploads')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
})
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.json', '.xml', '.spdx', '.csv', '.txt']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowed.includes(ext)) cb(null, true)
    else cb(new Error('Unsupported file type'))
  },
})

// GET /api/sbom/components  — supports ?app=
router.get('/components', authMiddleware, (req, res) => {
  const { app } = req.query
  let rows
  if (app) {
    rows = db.prepare('SELECT * FROM sbom_components WHERE app_name = ? ORDER BY id').all(app)
  } else {
    rows = db.prepare('SELECT * FROM sbom_components ORDER BY app_name, id').all()
  }
  res.json(rows.map(mapComponent))
})

// GET /api/sbom/components/:id
router.get('/components/:id', authMiddleware, (req, res) => {
  const row = db.prepare('SELECT * FROM sbom_components WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ error: 'Component not found' })
  res.json(mapComponent(row))
})

// POST /api/sbom/upload — file upload + parse
router.post('/upload', authMiddleware, upload.single('sbom'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

  const { appName } = req.body
  if (!appName) return res.status(400).json({ error: 'appName is required' })

  try {
    const filePath = req.file.path
    const ext = path.extname(req.file.originalname).toLowerCase()
    let components = []

    if (ext === '.json') {
      const raw = fs.readFileSync(filePath, 'utf8')
      const parsed = JSON.parse(raw)
      // Support CycloneDX JSON format
      if (parsed.components) {
        components = parsed.components.map(c => ({
          app_name: appName,
          component_name: c.name || c['bom-ref'] || 'unknown',
          component_version: c.version || 'unknown',
          vendor: (c.publisher || c.group || c.supplier?.name || 'unknown'),
        }))
      }
    } else if (ext === '.csv') {
      const raw = fs.readFileSync(filePath, 'utf8')
      const lines = raw.split('\n').filter(Boolean)
      // Expect: name,version,vendor
      lines.slice(1).forEach(line => {
        const [name, version, vendor] = line.split(',').map(s => s.trim())
        if (name) components.push({ app_name: appName, component_name: name, component_version: version || 'unknown', vendor: vendor || 'unknown' })
      })
    }

    // Insert parsed components
    const insert = db.prepare(`
      INSERT INTO sbom_components (app_name, component_name, component_version, vendor)
      VALUES (@app_name, @component_name, @component_version, @vendor)
    `)
    const insertMany = db.transaction(comps => comps.forEach(c => insert.run(c)))
    if (components.length > 0) insertMany(components)

    // Update app last_scan
    db.prepare("UPDATE applications SET last_scan = 'Just now' WHERE name = ?").run(appName)

    // Clean up uploaded file
    fs.unlinkSync(filePath)

    res.json({
      message: 'SBOM processed successfully',
      appName,
      componentsFound: components.length,
      components: components.map((c, i) => ({ id: i + 1, ...c })),
    })
  } catch (err) {
    res.status(422).json({ error: 'Failed to parse SBOM file', detail: err.message })
  }
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
