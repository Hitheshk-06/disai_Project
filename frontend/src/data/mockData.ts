// ─── Sample Applications ───────────────────────────
export const applications = [
  { id: 1, name: 'PaymentService', version: 'v2.1.0', description: 'Core payment processing microservice', components: 142, criticalCount: 2, highCount: 5, mediumCount: 12, lowCount: 8, riskScore: 8.4, lastScan: '2 mins ago', created: '2024-01-15' },
  { id: 2, name: 'AuthenticationAPI', version: 'v1.4.2', description: 'OAuth2/OIDC identity provider', components: 89, criticalCount: 1, highCount: 3, mediumCount: 7, lowCount: 4, riskScore: 7.2, lastScan: '1 hour ago', created: '2024-02-20' },
  { id: 3, name: 'DataPipeline', version: 'v3.0.1', description: 'ETL data processing pipeline', components: 234, criticalCount: 3, highCount: 8, mediumCount: 15, lowCount: 11, riskScore: 9.1, lastScan: '14 mins ago', created: '2023-11-08' },
  { id: 4, name: 'WebPortal', version: 'v5.2.0', description: 'Customer-facing web application', components: 312, criticalCount: 0, highCount: 2, mediumCount: 9, lowCount: 18, riskScore: 4.3, lastScan: '3 days ago', created: '2023-06-12' },
  { id: 5, name: 'ReportingEngine', version: 'v2.0.5', description: 'Business intelligence reporting', components: 67, criticalCount: 1, highCount: 1, mediumCount: 4, lowCount: 2, riskScore: 6.8, lastScan: '5 hours ago', created: '2024-03-01' },
]

// ─── Sample CVEs ──────────────────────────────────
export const cveRecords = [
  { id: 'CVE-2021-44228', description: 'Apache Log4j2 JNDI features do not protect against attacker-controlled LDAP and other JNDI related endpoints, allowing remote code execution.', cvssScore: 10.0, severity: 'CRITICAL' as const, vendor: 'Apache', product: 'Log4j', version: '2.14.1', published: '2021-12-10', vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H' },
  { id: 'CVE-2022-22965', description: 'Spring Framework RCE via Data Binding on JDK 9+. A Spring MVC or Spring WebFlux application running on JDK 9+ may be vulnerable.', cvssScore: 9.8, severity: 'CRITICAL' as const, vendor: 'VMware', product: 'Spring Framework', version: '5.3.0', published: '2022-03-31', vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H' },
  { id: 'CVE-2021-3711', description: 'OpenSSL SM2 Decryption Buffer Overflow allows a malicious attacker to trigger a buffer overflow to change application behaviour.', cvssScore: 9.8, severity: 'CRITICAL' as const, vendor: 'OpenSSL', product: 'OpenSSL', version: '1.1.1k', published: '2021-08-24', vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H' },
  { id: 'CVE-2020-36518', description: 'jackson-databind allows a Java StackOverflow exception and denial of service via a large depth of nested objects.', cvssScore: 7.5, severity: 'HIGH' as const, vendor: 'FasterXML', product: 'jackson-databind', version: '2.12.0', published: '2022-03-11', vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H' },
  { id: 'CVE-2022-42889', description: 'Apache Commons Text performs variable interpolation, allowing properties to be looked up and evaluated, potentially leading to RCE.', cvssScore: 9.8, severity: 'CRITICAL' as const, vendor: 'Apache', product: 'Commons Text', version: '1.9', published: '2022-10-13', vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H' },
  { id: 'CVE-2023-44487', description: 'HTTP/2 Rapid Reset Attack allows denial of service against HTTP/2 servers by rapidly resetting streams.', cvssScore: 7.5, severity: 'HIGH' as const, vendor: 'IETF', product: 'HTTP/2', version: 'RFC 9113', published: '2023-10-10', vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H' },
  { id: 'CVE-2023-34062', description: 'Reactor Netty HTTP Server could allow a malicious user to send specially crafted requests to cause denial of service.', cvssScore: 5.3, severity: 'MEDIUM' as const, vendor: 'VMware', product: 'Reactor Netty', version: '1.1.0', published: '2023-11-28', vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:L/A:N' },
  { id: 'CVE-2024-22232', description: 'Directory traversal vulnerability in Salt Project allows reading arbitrary files on the server.', cvssScore: 4.2, severity: 'MEDIUM' as const, vendor: 'SaltStack', product: 'Salt', version: '3006.0', published: '2024-01-15', vector: 'CVSS:3.1/AV:N/AC:H/PR:L/UI:N/S:U/C:L/I:L/A:N' },
  { id: 'CVE-2023-5678', description: 'OpenSSL Excessive time spent in DH check affects applications generating or checking DH parameters.', cvssScore: 3.7, severity: 'LOW' as const, vendor: 'OpenSSL', product: 'OpenSSL', version: '3.1.4', published: '2023-11-06', vector: 'CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:N/I:N/A:L' },
  { id: 'CVE-2024-21626', description: 'runc allows container breakout through leaked file descriptors in internal init process.', cvssScore: 8.6, severity: 'HIGH' as const, vendor: 'Open Containers', product: 'runc', version: '1.1.11', published: '2024-01-31', vector: 'CVSS:3.1/AV:L/AC:L/PR:N/UI:R/S:C/C:H/I:H/A:H' },
]

// ─── Component-CVE Mappings ──────────────────────
export const sbomComponents = [
  { id: 1, appName: 'PaymentService', componentName: 'log4j', componentVersion: '2.14.1', vendor: 'Apache' },
  { id: 2, appName: 'PaymentService', componentName: 'jackson-databind', componentVersion: '2.12.0', vendor: 'FasterXML' },
  { id: 3, appName: 'PaymentService', componentName: 'spring-core', componentVersion: '5.3.0', vendor: 'VMware' },
  { id: 4, appName: 'AuthenticationAPI', componentName: 'openssl', componentVersion: '1.1.1k', vendor: 'OpenSSL' },
  { id: 5, appName: 'AuthenticationAPI', componentName: 'commons-text', componentVersion: '1.9', vendor: 'Apache' },
  { id: 6, appName: 'DataPipeline', componentName: 'log4j', componentVersion: '2.14.1', vendor: 'Apache' },
  { id: 7, appName: 'DataPipeline', componentName: 'spring-core', componentVersion: '5.3.0', vendor: 'VMware' },
  { id: 8, appName: 'DataPipeline', componentName: 'commons-text', componentVersion: '1.9', vendor: 'Apache' },
  { id: 9, appName: 'WebPortal', componentName: 'jackson-databind', componentVersion: '2.12.0', vendor: 'FasterXML' },
  { id: 10, appName: 'WebPortal', componentName: 'reactor-netty', componentVersion: '1.1.0', vendor: 'VMware' },
  { id: 11, appName: 'ReportingEngine', componentName: 'openssl', componentVersion: '1.1.1k', vendor: 'OpenSSL' },
  { id: 12, appName: 'ReportingEngine', componentName: 'log4j', componentVersion: '2.14.1', vendor: 'Apache' },
]

// ─── Graph Data ──────────────────────────────────
export const graphData = {
  nodes: [
    // Applications
    { id: 'PaymentService', type: 'application' as const, label: 'PaymentService', riskScore: 8.4 },
    { id: 'AuthenticationAPI', type: 'application' as const, label: 'AuthenticationAPI', riskScore: 7.2 },
    { id: 'DataPipeline', type: 'application' as const, label: 'DataPipeline', riskScore: 9.1 },
    { id: 'WebPortal', type: 'application' as const, label: 'WebPortal', riskScore: 4.3 },
    { id: 'ReportingEngine', type: 'application' as const, label: 'ReportingEngine', riskScore: 6.8 },
    // Components
    { id: 'log4j-2.14.1', type: 'component' as const, label: 'log4j 2.14.1', riskScore: 10 },
    { id: 'spring-core-5.3.0', type: 'component' as const, label: 'spring-core 5.3.0', riskScore: 9.8 },
    { id: 'openssl-1.1.1k', type: 'component' as const, label: 'openssl 1.1.1k', riskScore: 9.8 },
    { id: 'jackson-databind-2.12.0', type: 'component' as const, label: 'jackson-databind 2.12.0', riskScore: 7.5 },
    { id: 'commons-text-1.9', type: 'component' as const, label: 'commons-text 1.9', riskScore: 9.8 },
    { id: 'reactor-netty-1.1.0', type: 'component' as const, label: 'reactor-netty 1.1.0', riskScore: 5.3 },
    // CVEs
    { id: 'CVE-2021-44228', type: 'cve' as const, label: 'CVE-2021-44228', riskScore: 10.0 },
    { id: 'CVE-2022-22965', type: 'cve' as const, label: 'CVE-2022-22965', riskScore: 9.8 },
    { id: 'CVE-2021-3711', type: 'cve' as const, label: 'CVE-2021-3711', riskScore: 9.8 },
    { id: 'CVE-2020-36518', type: 'cve' as const, label: 'CVE-2020-36518', riskScore: 7.5 },
    { id: 'CVE-2022-42889', type: 'cve' as const, label: 'CVE-2022-42889', riskScore: 9.8 },
    { id: 'CVE-2023-34062', type: 'cve' as const, label: 'CVE-2023-34062', riskScore: 5.3 },
  ],
  links: [
    // App → Component
    { source: 'PaymentService', target: 'log4j-2.14.1', type: 'DEPENDS_ON' as const },
    { source: 'PaymentService', target: 'jackson-databind-2.12.0', type: 'DEPENDS_ON' as const },
    { source: 'PaymentService', target: 'spring-core-5.3.0', type: 'DEPENDS_ON' as const },
    { source: 'AuthenticationAPI', target: 'openssl-1.1.1k', type: 'DEPENDS_ON' as const },
    { source: 'AuthenticationAPI', target: 'commons-text-1.9', type: 'DEPENDS_ON' as const },
    { source: 'DataPipeline', target: 'log4j-2.14.1', type: 'DEPENDS_ON' as const },
    { source: 'DataPipeline', target: 'spring-core-5.3.0', type: 'DEPENDS_ON' as const },
    { source: 'DataPipeline', target: 'commons-text-1.9', type: 'DEPENDS_ON' as const },
    { source: 'WebPortal', target: 'jackson-databind-2.12.0', type: 'DEPENDS_ON' as const },
    { source: 'WebPortal', target: 'reactor-netty-1.1.0', type: 'DEPENDS_ON' as const },
    { source: 'ReportingEngine', target: 'openssl-1.1.1k', type: 'DEPENDS_ON' as const },
    { source: 'ReportingEngine', target: 'log4j-2.14.1', type: 'DEPENDS_ON' as const },
    // Component → CVE
    { source: 'log4j-2.14.1', target: 'CVE-2021-44228', type: 'HAS_VULNERABILITY' as const },
    { source: 'spring-core-5.3.0', target: 'CVE-2022-22965', type: 'HAS_VULNERABILITY' as const },
    { source: 'openssl-1.1.1k', target: 'CVE-2021-3711', type: 'HAS_VULNERABILITY' as const },
    { source: 'jackson-databind-2.12.0', target: 'CVE-2020-36518', type: 'HAS_VULNERABILITY' as const },
    { source: 'commons-text-1.9', target: 'CVE-2022-42889', type: 'HAS_VULNERABILITY' as const },
    { source: 'reactor-netty-1.1.0', target: 'CVE-2023-34062', type: 'HAS_VULNERABILITY' as const },
  ],
}

// ─── Dashboard Stats ─────────────────────────────
export const dashboardStats = {
  totalApps: 5,
  totalCVEs: 10,
  criticalVulns: 7,
  overallRiskScore: 7.2,
}

// ─── Trend Data (for Recharts) ───────────────────
export const trendData = [
  { month: 'Sep', PaymentService: 6.8, AuthenticationAPI: 5.2, DataPipeline: 7.6, WebPortal: 3.1, ReportingEngine: 5.5 },
  { month: 'Oct', PaymentService: 7.1, AuthenticationAPI: 5.8, DataPipeline: 8.0, WebPortal: 3.4, ReportingEngine: 5.9 },
  { month: 'Nov', PaymentService: 7.4, AuthenticationAPI: 6.2, DataPipeline: 8.5, WebPortal: 3.2, ReportingEngine: 6.1 },
  { month: 'Dec', PaymentService: 7.9, AuthenticationAPI: 6.5, DataPipeline: 8.8, WebPortal: 3.8, ReportingEngine: 6.4 },
  { month: 'Jan', PaymentService: 8.1, AuthenticationAPI: 6.9, DataPipeline: 8.9, WebPortal: 4.0, ReportingEngine: 6.5 },
  { month: 'Feb', PaymentService: 8.3, AuthenticationAPI: 7.1, DataPipeline: 9.0, WebPortal: 4.2, ReportingEngine: 6.7 },
  { month: 'Mar', PaymentService: 8.4, AuthenticationAPI: 7.2, DataPipeline: 9.1, WebPortal: 4.3, ReportingEngine: 6.8 },
]
