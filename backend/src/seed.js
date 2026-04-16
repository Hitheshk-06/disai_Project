const db = require('./db')
const bcrypt = require('bcryptjs')
const { v4: uuidv4 } = require('uuid')

function seed() {
  const alreadySeeded = db.prepare('SELECT COUNT(*) as count FROM applications').get()
  if (alreadySeeded.count > 0) return

  console.log('Seeding database...')

  // ─── Default user ─────────────────────────────
  const passwordHash = bcrypt.hashSync('password123', 10)
  db.prepare(`
    INSERT OR IGNORE INTO users (id, name, email, password_hash, role, organization)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), 'John Doe', 'admin@company.com', passwordHash, 'admin', 'Acme Corp Security')

  // ─── Applications ─────────────────────────────
  const apps = [
    { name: 'PaymentService', version: 'v2.1.0', description: 'Core payment processing microservice', components: 142, critical_count: 2, high_count: 5, medium_count: 12, low_count: 8, risk_score: 8.4, last_scan: '2 mins ago', created: '2024-01-15' },
    { name: 'AuthenticationAPI', version: 'v1.4.2', description: 'OAuth2/OIDC identity provider', components: 89, critical_count: 1, high_count: 3, medium_count: 7, low_count: 4, risk_score: 7.2, last_scan: '1 hour ago', created: '2024-02-20' },
    { name: 'DataPipeline', version: 'v3.0.1', description: 'ETL data processing pipeline', components: 234, critical_count: 3, high_count: 8, medium_count: 15, low_count: 11, risk_score: 9.1, last_scan: '14 mins ago', created: '2023-11-08' },
    { name: 'WebPortal', version: 'v5.2.0', description: 'Customer-facing web application', components: 312, critical_count: 0, high_count: 2, medium_count: 9, low_count: 18, risk_score: 4.3, last_scan: '3 days ago', created: '2023-06-12' },
    { name: 'ReportingEngine', version: 'v2.0.5', description: 'Business intelligence reporting', components: 67, critical_count: 1, high_count: 1, medium_count: 4, low_count: 2, risk_score: 6.8, last_scan: '5 hours ago', created: '2024-03-01' },
  ]
  const insertApp = db.prepare(`
    INSERT INTO applications (name, version, description, components, critical_count, high_count, medium_count, low_count, risk_score, last_scan, created)
    VALUES (@name, @version, @description, @components, @critical_count, @high_count, @medium_count, @low_count, @risk_score, @last_scan, @created)
  `)
  apps.forEach(a => insertApp.run(a))

  // ─── CVE Records ──────────────────────────────
  const cves = [
    { id: 'CVE-2021-44228', description: 'Apache Log4j2 JNDI features do not protect against attacker-controlled LDAP and other JNDI related endpoints, allowing remote code execution.', cvss_score: 10.0, severity: 'CRITICAL', vendor: 'Apache', product: 'Log4j', version: '2.14.1', published: '2021-12-10', vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H' },
    { id: 'CVE-2022-22965', description: 'Spring Framework RCE via Data Binding on JDK 9+. A Spring MVC or Spring WebFlux application running on JDK 9+ may be vulnerable.', cvss_score: 9.8, severity: 'CRITICAL', vendor: 'VMware', product: 'Spring Framework', version: '5.3.0', published: '2022-03-31', vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H' },
    { id: 'CVE-2021-3711', description: 'OpenSSL SM2 Decryption Buffer Overflow allows a malicious attacker to trigger a buffer overflow to change application behaviour.', cvss_score: 9.8, severity: 'CRITICAL', vendor: 'OpenSSL', product: 'OpenSSL', version: '1.1.1k', published: '2021-08-24', vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H' },
    { id: 'CVE-2020-36518', description: 'jackson-databind allows a Java StackOverflow exception and denial of service via a large depth of nested objects.', cvss_score: 7.5, severity: 'HIGH', vendor: 'FasterXML', product: 'jackson-databind', version: '2.12.0', published: '2022-03-11', vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H' },
    { id: 'CVE-2022-42889', description: 'Apache Commons Text performs variable interpolation, allowing properties to be looked up and evaluated, potentially leading to RCE.', cvss_score: 9.8, severity: 'CRITICAL', vendor: 'Apache', product: 'Commons Text', version: '1.9', published: '2022-10-13', vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H' },
    { id: 'CVE-2023-44487', description: 'HTTP/2 Rapid Reset Attack allows denial of service against HTTP/2 servers by rapidly resetting streams.', cvss_score: 7.5, severity: 'HIGH', vendor: 'IETF', product: 'HTTP/2', version: 'RFC 9113', published: '2023-10-10', vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H' },
    { id: 'CVE-2023-34062', description: 'Reactor Netty HTTP Server could allow a malicious user to send specially crafted requests to cause denial of service.', cvss_score: 5.3, severity: 'MEDIUM', vendor: 'VMware', product: 'Reactor Netty', version: '1.1.0', published: '2023-11-28', vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:L/A:N' },
    { id: 'CVE-2024-22232', description: 'Directory traversal vulnerability in Salt Project allows reading arbitrary files on the server.', cvss_score: 4.2, severity: 'MEDIUM', vendor: 'SaltStack', product: 'Salt', version: '3006.0', published: '2024-01-15', vector: 'CVSS:3.1/AV:N/AC:H/PR:L/UI:N/S:U/C:L/I:L/A:N' },
    { id: 'CVE-2023-5678', description: 'OpenSSL Excessive time spent in DH check affects applications generating or checking DH parameters.', cvss_score: 3.7, severity: 'LOW', vendor: 'OpenSSL', product: 'OpenSSL', version: '3.1.4', published: '2023-11-06', vector: 'CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:N/I:N/A:L' },
    { id: 'CVE-2024-21626', description: 'runc allows container breakout through leaked file descriptors in internal init process.', cvss_score: 8.6, severity: 'HIGH', vendor: 'Open Containers', product: 'runc', version: '1.1.11', published: '2024-01-31', vector: 'CVSS:3.1/AV:L/AC:L/PR:N/UI:R/S:C/C:H/I:H/A:H' },
  ]
  const insertCve = db.prepare(`
    INSERT OR IGNORE INTO cve_records (id, description, cvss_score, severity, vendor, product, version, published, vector)
    VALUES (@id, @description, @cvss_score, @severity, @vendor, @product, @version, @published, @vector)
  `)
  cves.forEach(c => insertCve.run(c))

  // ─── SBOM Components ──────────────────────────
  const components = [
    { app_name: 'PaymentService', component_name: 'log4j', component_version: '2.14.1', vendor: 'Apache' },
    { app_name: 'PaymentService', component_name: 'jackson-databind', component_version: '2.12.0', vendor: 'FasterXML' },
    { app_name: 'PaymentService', component_name: 'spring-core', component_version: '5.3.0', vendor: 'VMware' },
    { app_name: 'AuthenticationAPI', component_name: 'openssl', component_version: '1.1.1k', vendor: 'OpenSSL' },
    { app_name: 'AuthenticationAPI', component_name: 'commons-text', component_version: '1.9', vendor: 'Apache' },
    { app_name: 'DataPipeline', component_name: 'log4j', component_version: '2.14.1', vendor: 'Apache' },
    { app_name: 'DataPipeline', component_name: 'spring-core', component_version: '5.3.0', vendor: 'VMware' },
    { app_name: 'DataPipeline', component_name: 'commons-text', component_version: '1.9', vendor: 'Apache' },
    { app_name: 'WebPortal', component_name: 'jackson-databind', component_version: '2.12.0', vendor: 'FasterXML' },
    { app_name: 'WebPortal', component_name: 'reactor-netty', component_version: '1.1.0', vendor: 'VMware' },
    { app_name: 'ReportingEngine', component_name: 'openssl', component_version: '1.1.1k', vendor: 'OpenSSL' },
    { app_name: 'ReportingEngine', component_name: 'log4j', component_version: '2.14.1', vendor: 'Apache' },
  ]
  const insertComp = db.prepare(`
    INSERT INTO sbom_components (app_name, component_name, component_version, vendor)
    VALUES (@app_name, @component_name, @component_version, @vendor)
  `)
  components.forEach(c => insertComp.run(c))

  // ─── Trend Data ───────────────────────────────
  const trends = [
    { month: 'Sep', PaymentService: 6.8, AuthenticationAPI: 5.2, DataPipeline: 7.6, WebPortal: 3.1, ReportingEngine: 5.5 },
    { month: 'Oct', PaymentService: 7.1, AuthenticationAPI: 5.8, DataPipeline: 8.0, WebPortal: 3.4, ReportingEngine: 5.9 },
    { month: 'Nov', PaymentService: 7.4, AuthenticationAPI: 6.2, DataPipeline: 8.5, WebPortal: 3.2, ReportingEngine: 6.1 },
    { month: 'Dec', PaymentService: 7.9, AuthenticationAPI: 6.5, DataPipeline: 8.8, WebPortal: 3.8, ReportingEngine: 6.4 },
    { month: 'Jan', PaymentService: 8.1, AuthenticationAPI: 6.9, DataPipeline: 8.9, WebPortal: 4.0, ReportingEngine: 6.5 },
    { month: 'Feb', PaymentService: 8.3, AuthenticationAPI: 7.1, DataPipeline: 9.0, WebPortal: 4.2, ReportingEngine: 6.7 },
    { month: 'Mar', PaymentService: 8.4, AuthenticationAPI: 7.2, DataPipeline: 9.1, WebPortal: 4.3, ReportingEngine: 6.8 },
  ]
  const insertTrend = db.prepare(`
    INSERT INTO trend_data (month, app_name, score) VALUES (?, ?, ?)
  `)
  trends.forEach(row => {
    Object.entries(row).forEach(([key, val]) => {
      if (key !== 'month') insertTrend.run(row.month, key, val)
    })
  })

  console.log('Database seeded successfully.')
}

module.exports = seed
