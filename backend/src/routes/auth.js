const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { v4: uuidv4 } = require('uuid')
const db = require('../db')
const { authMiddleware, JWT_SECRET } = require('../middleware/auth')

const router = express.Router()

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required' })
  }
  if (!password || typeof password !== 'string' || password.length < 1) {
    return res.status(400).json({ error: 'Password is required' })
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const valid = bcrypt.compareSync(password, user.password_hash)
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  )

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, organization: user.organization }
  })
})

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { name, email, password, organization } = req.body
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ error: 'Name must be at least 2 characters' })
  }
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required' })
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' })
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' })
  }

  const passwordHash = bcrypt.hashSync(password, 10)
  const id = uuidv4()
  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, organization)
    VALUES (?, ?, ?, ?, 'analyst', ?)
  `).run(id, name, email, passwordHash, organization || '')

  const token = jwt.sign({ id, email, name, role: 'analyst' }, JWT_SECRET, { expiresIn: '24h' })
  res.status(201).json({ token, user: { id, name, email, role: 'analyst', organization: organization || '' } })
})

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, name, email, role, organization, nvd_api_key, created_at FROM users WHERE id = ?').get(req.user.id)
  if (!user) return res.status(404).json({ error: 'User not found' })
  res.json(user)
})

// PUT /api/auth/me
router.put('/me', authMiddleware, (req, res) => {
  const { name, organization, nvd_api_key } = req.body
  db.prepare(`
    UPDATE users SET name = COALESCE(?, name), organization = COALESCE(?, organization), nvd_api_key = COALESCE(?, nvd_api_key)
    WHERE id = ?
  `).run(name || null, organization || null, nvd_api_key || null, req.user.id)
  const updated = db.prepare('SELECT id, name, email, role, organization, nvd_api_key FROM users WHERE id = ?').get(req.user.id)
  res.json(updated)
})

// PUT /api/auth/password
router.put('/password', authMiddleware, (req, res) => {
  const { currentPassword, newPassword } = req.body
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Both current and new password are required' })
  }
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)
  if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
    return res.status(401).json({ error: 'Current password is incorrect' })
  }
  const hash = bcrypt.hashSync(newPassword, 10)
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, req.user.id)
  res.json({ message: 'Password updated successfully' })
})

module.exports = router
