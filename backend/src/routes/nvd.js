const express = require('express')
const db = require('../db')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()

// POST /api/nvd/sync — fetch latest CVEs from NVD API 2.0
router.post('/sync', authMiddleware, async (req, res) => {
  try {
    const { resultsPerPage = 20, startIndex = 0 } = req.body

    const url = `https://services.nvd.nist.gov/rest/json/cves/2.0?resultsPerPage=${resultsPerPage}&startIndex=${startIndex}`
    const headers = { 'User-Agent': 'SBOM-Shield/1.0' }

    // Use NVD API key if configured
    const user = db.prepare('SELECT nvd_api_key FROM users WHERE id = ?').get(req.user.id)
    if (user?.nvd_api_key) headers['apiKey'] = user.nvd_api_key

    const response = await fetch(url, { headers })
    if (!response.ok) {
      return res.status(502).json({ error: `NVD API returned ${response.status}` })
    }

    const data = await response.json()
    const vulnerabilities = data.vulnerabilities || []

    let inserted = 0, updated = 0

    const upsert = db.prepare(`
      INSERT INTO cve_records (id, description, cvss_score, severity, vendor, product, version, published, vector)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        description = excluded.description,
        cvss_score = excluded.cvss_score,
        severity = excluded.severity
    `)

    const upsertMany = db.transaction(items => {
      for (const item of items) {
        const cve = item.cve
        const id = cve.id
        const desc = cve.descriptions?.find(d => d.lang === 'en')?.value || ''
        const published = cve.published?.split('T')[0] || ''

        // Extract CVSS score
        const metrics = cve.metrics || {}
        const cvssV31 = metrics.cvssMetricV31?.[0]?.cvssData
        const cvssV30 = metrics.cvssMetricV30?.[0]?.cvssData
        const cvssV2 = metrics.cvssMetricV2?.[0]?.cvssData
        const cvssData = cvssV31 || cvssV30 || cvssV2
        const cvssScore = cvssData?.baseScore || 0
        const vector = cvssData?.vectorString || ''

        // Severity
        let severity = cvssData?.baseSeverity || 'LOW'
        if (!severity && cvssScore >= 9) severity = 'CRITICAL'
        else if (!severity && cvssScore >= 7) severity = 'HIGH'
        else if (!severity && cvssScore >= 4) severity = 'MEDIUM'
        severity = severity.toUpperCase()

        // Extract product/vendor from CPE
        const cpeMatch = cve.configurations?.[0]?.nodes?.[0]?.cpeMatch?.[0]?.criteria || ''
        const cpeParts = cpeMatch.split(':')
        const vendor = cpeParts[3] || 'unknown'
        const product = cpeParts[4] || 'unknown'
        const version = cpeParts[5] || 'unknown'

        const existing = db.prepare('SELECT id FROM cve_records WHERE id = ?').get(id)
        upsert.run(id, desc, cvssScore, severity, vendor, product, version, published, vector)
        if (existing) updated++; else inserted++
      }
    })

    upsertMany(vulnerabilities)

    res.json({
      message: 'NVD sync complete',
      totalFetched: vulnerabilities.length,
      inserted,
      updated,
      totalInDB: db.prepare('SELECT COUNT(*) as count FROM cve_records').get().count,
    })
  } catch (err) {
    res.status(500).json({ error: 'NVD sync failed', detail: err.message })
  }
})

// GET /api/nvd/status
router.get('/status', authMiddleware, (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as count FROM cve_records').get().count
  const bySeverity = db.prepare('SELECT severity, COUNT(*) as count FROM cve_records GROUP BY severity').all()
  res.json({ totalCVEs: total, bySeverity })
})

module.exports = router
