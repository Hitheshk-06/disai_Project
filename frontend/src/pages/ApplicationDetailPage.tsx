import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api, type ApplicationDetail, type MatchedCVE } from '../lib/api'
import { Toast, useToast } from '../components/Toast'

const severityColor = (s: string) => {
  switch (s) {
    case 'CRITICAL': return { text: 'text-danger', bg: 'bg-danger/15', border: 'border-danger', score: 'bg-danger text-white' }
    case 'HIGH': return { text: 'text-warning', bg: 'bg-warning/15', border: 'border-warning', score: 'bg-warning text-black' }
    case 'MEDIUM': return { text: 'text-primary', bg: 'bg-primary/15', border: 'border-primary', score: 'bg-primary text-white' }
    default: return { text: 'text-secondary', bg: 'bg-secondary/15', border: 'border-secondary', score: 'bg-secondary text-white' }
  }
}

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [app, setApp] = useState<ApplicationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [selectedCVE, setSelectedCVE] = useState<MatchedCVE | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'components' | 'cves'>('overview')
  const { toast, show, hide } = useToast()

  const load = async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await api.applications.detail(Number(id))
      setApp(data)
    } catch (e: any) {
      show(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const handleScan = async () => {
    if (!app) return
    setScanning(true)
    try {
      const result = await api.sbom.scan(app.name)
      show(`Scan complete — ${result.cveMatches} CVEs matched, risk score: ${result.riskScore}`)
      await load()
    } catch (e: any) {
      show(e.message, 'error')
    } finally {
      setScanning(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
      </div>
    )
  }

  if (!app) {
    return (
      <div className="text-center py-16 text-outline">
        <span className="material-symbols-outlined text-4xl mb-2 block">error</span>
        Application not found
      </div>
    )
  }

  const isCritical = app.riskScore >= 8
  const isWarning = app.riskScore >= 6
  const scoreColor = isCritical ? 'text-danger' : isWarning ? 'text-warning' : 'text-secondary'
  const criticalCVEs = app.matchedCVEs.filter(c => c.severity === 'CRITICAL')
  const highCVEs = app.matchedCVEs.filter(c => c.severity === 'HIGH')

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hide} />}

      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/applications')}
          className="p-2 hover:bg-white/5 rounded-lg text-outline hover:text-on-surface transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-sm">
              {app.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-on-surface">{app.name}</h2>
              <p className="text-sm text-outline">{app.version} · {app.description}</p>
            </div>
          </div>
        </div>
        <button onClick={handleScan} disabled={scanning}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:brightness-110 transition-all disabled:opacity-60">
          {scanning
            ? <><span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>Scanning...</>
            : <><span className="material-symbols-outlined text-sm">radar</span>Re-scan</>
          }
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="col-span-2 bg-surface-container rounded-xl p-5 border border-outline-variant/10 flex items-center gap-4">
          <span className={`text-5xl font-black ${scoreColor}`}>{app.riskScore}</span>
          <div>
            <p className="text-xs text-outline">Risk Score</p>
            <div className="w-32 h-1.5 bg-surface-container-lowest rounded-full mt-1">
              <div className={`h-full rounded-full ${isCritical ? 'bg-danger' : isWarning ? 'bg-warning' : 'bg-secondary'}`}
                style={{ width: `${app.riskScore * 10}%` }}></div>
            </div>
          </div>
        </div>
        {[
          { label: 'Components', val: app.components, color: 'text-on-surface', icon: 'extension' },
          { label: 'CVE Matches', val: app.matchedCVEs.length, color: 'text-danger', icon: 'bug_report' },
          { label: 'Critical', val: app.criticalCount, color: 'text-danger', icon: 'local_fire_department' },
          { label: 'High', val: app.highCount, color: 'text-warning', icon: 'warning' },
        ].map(s => (
          <div key={s.label} className="bg-surface-container rounded-xl p-4 border border-outline-variant/10">
            <div className="flex items-center gap-2 mb-1">
              <span className={`material-symbols-outlined text-sm ${s.color}`}>{s.icon}</span>
              <span className="text-[10px] text-outline uppercase font-bold">{s.label}</span>
            </div>
            <div className={`text-2xl font-extrabold ${s.color}`}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Critical alert banner */}
      {criticalCVEs.length > 0 && (
        <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-danger text-xl shrink-0">local_fire_department</span>
          <div>
            <p className="text-sm font-bold text-danger">{criticalCVEs.length} Critical Vulnerabilit{criticalCVEs.length > 1 ? 'ies' : 'y'} Detected</p>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {criticalCVEs.map(c => c.cveId).join(', ')} — Immediate remediation required.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-container-low p-1 rounded-xl border border-outline-variant/10">
        {[
          { id: 'overview', label: 'Overview', icon: 'dashboard' },
          { id: 'components', label: `Components (${app.componentList.length})`, icon: 'extension' },
          { id: 'cves', label: `CVE Matches (${app.matchedCVEs.length})`, icon: 'bug_report' },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all
              ${activeTab === t.id ? 'bg-surface-container-high text-on-surface' : 'text-outline hover:text-on-surface'}`}>
            <span className="material-symbols-outlined text-sm">{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
          <div className="bg-surface-container rounded-xl p-6 border border-outline-variant/10">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-danger text-sm">priority_high</span>
              Top Vulnerabilities
            </h3>
            {app.matchedCVEs.length === 0 ? (
              <div className="text-center py-8 text-outline">
                <span className="material-symbols-outlined text-3xl mb-2 block">verified_user</span>
                No vulnerabilities detected
              </div>
            ) : (
              <div className="space-y-3">
                {app.matchedCVEs.slice(0, 5).map((cve, i) => {
                  const style = severityColor(cve.severity)
                  return (
                    <div key={i} onClick={() => setSelectedCVE(cve)}
                      className={`flex items-center gap-3 p-3 rounded-lg border-l-4 ${style.border} bg-surface-container-low cursor-pointer hover:bg-surface-container-high transition-colors`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-on-surface">{cve.cveId}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${style.bg} ${style.text}`}>{cve.severity}</span>
                        </div>
                        <p className="text-[10px] text-outline truncate">{cve.component} {cve.componentVersion}</p>
                      </div>
                      <span className={`text-sm font-extrabold ${style.text}`}>{cve.cvssScore}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="bg-surface-container rounded-xl p-6 border border-outline-variant/10">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-sm">info</span>
              Application Info
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Version', val: app.version },
                { label: 'Last Scan', val: app.lastScan },
                { label: 'Created', val: app.created },
                { label: 'Total Components', val: String(app.components) },
                { label: 'Vulnerable Components', val: String(app.componentList.filter(c => c.hasVulnerability).length) },
              ].map(f => (
                <div key={f.label} className="flex justify-between items-center py-2 border-b border-outline-variant/10 last:border-0">
                  <span className="text-xs text-outline">{f.label}</span>
                  <span className="text-xs font-semibold text-on-surface">{f.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Components Tab */}
      {activeTab === 'components' && (
        <div className="bg-surface-container rounded-xl overflow-hidden border border-outline-variant/10 animate-fade-in">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-high/30">
                {['Component', 'Version', 'Vendor', 'Status'].map(h => (
                  <th key={h} className="px-5 py-3 text-[10px] font-bold text-outline uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {app.componentList.map((comp, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${comp.hasVulnerability ? 'bg-danger' : 'bg-secondary'}`}></span>
                      <span className="text-sm font-semibold">{comp.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs font-mono text-on-surface-variant">{comp.version}</td>
                  <td className="px-5 py-3 text-xs text-on-surface-variant">{comp.vendor}</td>
                  <td className="px-5 py-3">
                    {comp.hasVulnerability
                      ? <span className="text-[9px] font-bold px-2 py-1 rounded-full bg-danger/15 text-danger uppercase">Vulnerable</span>
                      : <span className="text-[9px] font-bold px-2 py-1 rounded-full bg-secondary/15 text-secondary uppercase">Clean</span>
                    }
                  </td>
                </tr>
              ))}
              {app.componentList.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-outline text-sm">No components — upload an SBOM to scan</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* CVEs Tab */}
      {activeTab === 'cves' && (
        <div className="space-y-3 animate-fade-in">
          {app.matchedCVEs.length === 0 ? (
            <div className="text-center py-16 text-outline bg-surface-container rounded-xl border border-outline-variant/10">
              <span className="material-symbols-outlined text-4xl mb-2 block">verified_user</span>
              No CVEs matched for this application
            </div>
          ) : (
            app.matchedCVEs.map((cve, i) => {
              const style = severityColor(cve.severity)
              return (
                <div key={i} onClick={() => setSelectedCVE(cve)}
                  className={`bg-surface-container-low rounded-xl p-5 border-l-4 ${style.border} cursor-pointer hover:bg-surface-container transition-all`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className={`text-[9px] font-bold uppercase tracking-widest ${style.text}`}>{cve.severity}</span>
                      <h3 className="text-base font-bold text-on-surface">{cve.cveId}</h3>
                    </div>
                    <div className={`${style.score} px-3 py-1 rounded-lg text-sm font-extrabold`}>{cve.cvssScore}</div>
                  </div>
                  <p className="text-xs text-on-surface-variant line-clamp-2 mb-3">{cve.description}</p>
                  <div className="flex items-center gap-3 text-[10px] text-outline">
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">extension</span>{cve.component} {cve.componentVersion}</span>
                    <span>·</span>
                    <span>{cve.published}</span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* CVE Detail Drawer */}
      {selectedCVE && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end" onClick={() => setSelectedCVE(null)}>
          <div className="w-full max-w-lg bg-surface-container h-full overflow-y-auto p-8 border-l border-outline-variant/10 animate-slide-in" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${severityColor(selectedCVE.severity).text}`}>{selectedCVE.severity} SEVERITY</span>
                <h2 className="text-2xl font-extrabold text-on-surface mt-1">{selectedCVE.cveId}</h2>
              </div>
              <button onClick={() => setSelectedCVE(null)} className="p-2 hover:bg-white/5 rounded-lg">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className={`${severityColor(selectedCVE.severity).score} inline-flex items-center gap-2 px-4 py-2 rounded-xl mb-6`}>
              <span className="text-2xl font-black">{selectedCVE.cvssScore}</span>
              <span className="text-xs font-semibold">/10.0 CVSS</span>
            </div>
            <div className="space-y-5">
              <div>
                <h4 className="text-xs font-bold text-outline uppercase tracking-widest mb-2">Description</h4>
                <p className="text-sm text-on-surface-variant leading-relaxed">{selectedCVE.description}</p>
              </div>
              <div>
                <h4 className="text-xs font-bold text-outline uppercase tracking-widest mb-2">CVSS Vector</h4>
                <code className="text-xs bg-surface-container-low px-3 py-2 rounded-lg block text-primary font-mono break-all">{selectedCVE.vector}</code>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Affected Component', val: selectedCVE.component },
                  { label: 'Version', val: selectedCVE.componentVersion },
                  { label: 'Vendor', val: selectedCVE.vendor },
                  { label: 'Published', val: selectedCVE.published },
                ].map(f => (
                  <div key={f.label} className="bg-surface-container-low rounded-lg p-3">
                    <span className="text-[10px] text-outline block mb-1">{f.label}</span>
                    <span className="text-sm font-semibold">{f.val}</span>
                  </div>
                ))}
              </div>
              <div>
                <h4 className="text-xs font-bold text-outline uppercase tracking-widest mb-2">Remediation</h4>
                <p className="text-sm text-on-surface-variant">Update {selectedCVE.component} to the latest patched version. Consult the vendor advisory for specific mitigation steps.</p>
              </div>
              <a href={`https://nvd.nist.gov/vuln/detail/${selectedCVE.cveId}`} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 text-primary text-sm font-semibold hover:underline">
                <span className="material-symbols-outlined text-sm">open_in_new</span>View on NVD
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
