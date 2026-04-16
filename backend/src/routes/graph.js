const express = require('express')
const db = require('../db')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()

// GET /api/graph  — builds graph nodes + links from DB
router.get('/', authMiddleware, (req, res) => {
  const apps = db.prepare('SELECT name, risk_score FROM applications').all()
  const components = db.prepare('SELECT DISTINCT component_name, component_version, vendor FROM sbom_components').all()
  const cves = db.prepare('SELECT id, cvss_score FROM cve_records').all()
  const appComponents = db.prepare('SELECT app_name, component_name, component_version FROM sbom_components').all()

  // Component → CVE mapping (static, based on known vulnerable versions)
  const compCveMap = {
    'log4j-2.14.1': 'CVE-2021-44228',
    'spring-core-5.3.0': 'CVE-2022-22965',
    'openssl-1.1.1k': 'CVE-2021-3711',
    'jackson-databind-2.12.0': 'CVE-2020-36518',
    'commons-text-1.9': 'CVE-2022-42889',
    'reactor-netty-1.1.0': 'CVE-2023-34062',
  }

  const nodes = []
  const links = []

  // App nodes
  apps.forEach(a => {
    nodes.push({ id: a.name, type: 'application', label: a.name, riskScore: a.risk_score })
  })

  // Component nodes
  const addedComponents = new Set()
  components.forEach(c => {
    const compId = `${c.component_name}-${c.component_version}`
    if (!addedComponents.has(compId)) {
      addedComponents.add(compId)
      const cveId = compCveMap[compId]
      const cve = cveId ? db.prepare('SELECT cvss_score FROM cve_records WHERE id = ?').get(cveId) : null
      nodes.push({
        id: compId,
        type: 'component',
        label: `${c.component_name} ${c.component_version}`,
        riskScore: cve ? cve.cvss_score : 0,
      })
    }
  })

  // CVE nodes
  cves.forEach(c => {
    nodes.push({ id: c.id, type: 'cve', label: c.id, riskScore: c.cvss_score })
  })

  // App → Component links
  appComponents.forEach(ac => {
    const compId = `${ac.component_name}-${ac.component_version}`
    links.push({ source: ac.app_name, target: compId, type: 'DEPENDS_ON' })
  })

  // Component → CVE links
  Object.entries(compCveMap).forEach(([compId, cveId]) => {
    const cveExists = cves.find(c => c.id === cveId)
    const compExists = nodes.find(n => n.id === compId)
    if (cveExists && compExists) {
      links.push({ source: compId, target: cveId, type: 'HAS_VULNERABILITY' })
    }
  })

  res.json({ nodes, links })
})

module.exports = router
