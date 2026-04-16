const express = require('express')
const bcrypt = require('bcryptjs')
const { v4: uuidv4 } = require('uuid')
const db = require('../db')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()

// ─── API Keys ─────────────────────────────────────

// GET /api/settings/api-keys
router.get('/api-keys', authMiddleware, (req, res) => {
  const keys = db.prepare('SELECT * FROM api_keys WHERE user_id = ? AND active = 1 ORDER BY created_at DESC').all(req.user.id)
  res.json(keys.map(k => ({
    id: k.id,
    name: k.name,
    keyPreview: k.key_preview,
    scope: k.scope,
    createdAt: k.created_at,
    lastUsed: k.last_used,
  })))
})

// POST /api/settings/api-keys
router.post('/api-keys', authMiddleware, (req, res) => {
  const { name, scope } = req.body
  if (!name) return res.status(400).json({ error: 'Key name is required' })

  const rawKey = `sbom_${scope === 'Read + Write' ? 'prod' : 'ci'}_${uuidv4().replace(/-/g, '').slice(0, 16)}`
  const keyHash = bcrypt.hashSync(rawKey, 8)
  const keyPreview = rawKey.slice(0, 12) + '••••••••••' + rawKey.slice(-4)
  const id = uuidv4()

  db.prepare(`
    INSERT INTO api_keys (id, user_id, name, key_hash, key_preview, scope)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, req.user.id, name, keyHash, keyPreview, scope || 'Read Only')

  res.status(201).json({
    id,
    name,
    rawKey, // Only returned once on creation
    keyPreview,
    scope: scope || 'Read Only',
    createdAt: new Date().toISOString(),
    lastUsed: 'Never',
  })
})

// DELETE /api/settings/api-keys/:id
router.delete('/api-keys/:id', authMiddleware, (req, res) => {
  const key = db.prepare('SELECT * FROM api_keys WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id)
  if (!key) return res.status(404).json({ error: 'API key not found' })
  db.prepare('UPDATE api_keys SET active = 0 WHERE id = ?').run(req.params.id)
  res.json({ message: 'API key revoked' })
})

// ─── Integrations (static list, toggle state stored in memory for demo) ───

const integrations = [
  { id: 'github', name: 'GitHub Enterprise', desc: 'Repository scanning', icon: 'hub', connected: true },
  { id: 'aws', name: 'AWS Security Hub', desc: 'Cloud posture management', icon: 'cloud', connected: true },
  { id: 'jira', name: 'Jira', desc: 'Auto-create CVE tickets', icon: 'view_kanban', connected: false },
  { id: 'slack', name: 'Slack', desc: 'Real-time channel alerts', icon: 'chat', connected: false },
  { id: 'pagerduty', name: 'PagerDuty', desc: 'Incident escalation', icon: 'campaign', connected: false },
]

// GET /api/settings/integrations
router.get('/integrations', authMiddleware, (req, res) => {
  res.json(integrations)
})

// POST /api/settings/integrations/:id/toggle
router.post('/integrations/:id/toggle', authMiddleware, (req, res) => {
  const integration = integrations.find(i => i.id === req.params.id)
  if (!integration) return res.status(404).json({ error: 'Integration not found' })
  integration.connected = !integration.connected
  res.json(integration)
})

module.exports = router
