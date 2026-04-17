const db = require('../db')

// Component name aliases for fuzzy matching
const ALIASES = {
  'log4j': ['log4j', 'log4j2', 'log4j-core', 'log4j-api'],
  'spring-core': ['spring-core', 'spring-framework', 'spring-web', 'spring-webmvc'],
  'openssl': ['openssl', 'libssl', 'libcrypto'],
  'jackson-databind': ['jackson-databind', 'jackson-core', 'jackson'],
  'commons-text': ['commons-text', 'apache-commons-text'],
  'reactor-netty': ['reactor-netty', 'reactor-netty-http'],
}

// CVE → component+version mapping
const CVE_COMPONENT_MAP = [
  { cveId: 'CVE-2021-44228', componentName: 'log4j', affectedVersions: ['2.14.1', '2.14.0', '2.13.3', '2.12.1'] },
  { cveId: 'CVE-2022-22965', componentName: 'spring-core', affectedVersions: ['5.3.0', '5.2.0', '5.1.0'] },
  { cveId: 'CVE-2021-3711', componentName: 'openssl', affectedVersions: ['1.1.1k', '1.1.1j', '1.1.1i'] },
  { cveId: 'CVE-2020-36518', componentName: 'jackson-databind', affectedVersions: ['2.12.0', '2.11.0', '2.10.0'] },
  { cveId: 'CVE-2022-42889', componentName: 'commons-text', affectedVersions: ['1.9', '1.8', '1.7'] },
  { cveId: 'CVE-2023-44487', componentName: 'reactor-netty', affectedVersions: ['1.1.0', '1.0.0'] },
  { cveId: 'CVE-2023-34062', componentName: 'reactor-netty', affectedVersions: ['1.1.0', '1.0.0'] },
  { cveId: 'CVE-2023-5678', componentName: 'openssl', affectedVersions: ['3.1.4', '3.0.0', '1.1.1k'] },
  { cveId: 'CVE-2024-21626', componentName: 'runc', affectedVersions: ['1.1.11', '1.1.10'] },
  { cveId: 'CVE-2024-22232', componentName: 'salt', affectedVersions: ['3006.0', '3005.0'] },
]

function normalizeComponentName(name) {
  const lower = name.toLowerCase().replace(/[_\s]/g, '-')
  for (const [canonical, aliases] of Object.entries(ALIASES)) {
    if (aliases.some(a => lower.includes(a) || a.includes(lower))) return canonical
  }
  return lower
}

/**
 * Match a list of components against the CVE database.
 * Returns matched CVE records with the component that triggered the match.
 */
function matchComponentsToCVEs(components) {
  const matches = []
  const seen = new Set()

  for (const comp of components) {
    const normalizedName = normalizeComponentName(comp.component_name || comp.componentName)
    const version = (comp.component_version || comp.componentVersion || '').toLowerCase()

    for (const mapping of CVE_COMPONENT_MAP) {
      const key = `${mapping.cveId}-${comp.component_name}`
      if (seen.has(key)) continue

      const mappingNorm = normalizeComponentName(mapping.componentName)
      const nameMatch = normalizedName === mappingNorm ||
        normalizedName.includes(mappingNorm) ||
        mappingNorm.includes(normalizedName)

      const versionMatch = mapping.affectedVersions.some(v =>
        version === v.toLowerCase() || version.startsWith(v.split('.').slice(0, 2).join('.'))
      )

      if (nameMatch && versionMatch) {
        const cve = db.prepare('SELECT * FROM cve_records WHERE id = ?').get(mapping.cveId)
        if (cve) {
          seen.add(key)
          matches.push({ cve, component: comp })
        }
      }
    }
  }

  return matches
}

/**
 * Recalculate and update an application's risk stats based on its components.
 */
function recalculateAppRisk(appName) {
  const components = db.prepare('SELECT * FROM sbom_components WHERE app_name = ?').all(appName)
  const matches = matchComponentsToCVEs(components)

  const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 }
  let maxScore = 0

  matches.forEach(({ cve }) => {
    counts[cve.severity] = (counts[cve.severity] || 0) + 1
    if (cve.cvss_score > maxScore) maxScore = cve.cvss_score
  })

  // Risk score = weighted average of matched CVEs, capped at 10
  const totalCVEs = matches.length
  let riskScore = 0
  if (totalCVEs > 0) {
    const weightedSum = matches.reduce((sum, { cve }) => sum + cve.cvss_score, 0)
    riskScore = Math.min(10, Math.round((weightedSum / totalCVEs) * 10) / 10)
  }

  db.prepare(`
    UPDATE applications
    SET critical_count = ?, high_count = ?, medium_count = ?, low_count = ?,
        risk_score = ?, components = ?, last_scan = datetime('now')
    WHERE name = ?
  `).run(
    counts.CRITICAL, counts.HIGH, counts.MEDIUM, counts.LOW,
    riskScore, components.length,
    appName
  )

  return { matches, counts, riskScore, totalComponents: components.length }
}

module.exports = { matchComponentsToCVEs, recalculateAppRisk }
