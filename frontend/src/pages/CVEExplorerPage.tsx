import { useState, useEffect, useCallback } from 'react'
import { api, type CVERecord } from '../lib/api'

type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

export default function CVEExplorerPage() {
  const [cves, setCves] = useState<CVERecord[]>([])
  const [allCves, setAllCves] = useState<CVERecord[]>([])
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState<Record<Severity, boolean>>({ CRITICAL: true, HIGH: true, MEDIUM: true, LOW: true })
  const [selectedCVE, setSelectedCVE] = useState<CVERecord | null>(null)
  const [cvssRange, setCvssRange] = useState([0, 10])
  const [loading, setLoading] = useState(false)

  // Load all on mount for stats
  useEffect(() => {
    api.cves.list().then(data => { setAllCves(data); setCves(data) }).catch(console.error)
  }, [])

  // Debounced API search
  const fetchFiltered = useCallback(() => {
    setLoading(true)
    const activeSeverities = (Object.keys(severityFilter) as Severity[]).filter(s => severityFilter[s])
    api.cves.list({
      search: search || undefined,
      severity: activeSeverities.length < 4 ? activeSeverities.join(',') : undefined,
      minScore: cvssRange[0] > 0 ? cvssRange[0] : undefined,
      maxScore: cvssRange[1] < 10 ? cvssRange[1] : undefined,
    }).then(setCves).catch(console.error).finally(() => setLoading(false))
  }, [search, severityFilter, cvssRange])

  useEffect(() => {
    const t = setTimeout(fetchFiltered, 300)
    return () => clearTimeout(t)
  }, [fetchFiltered])

  const toggleSeverity = (s: Severity) => setSeverityFilter(f => ({ ...f, [s]: !f[s] }))

  const getSeverityStyle = (s: string) => {
    switch (s) {
      case 'CRITICAL': return { bg: 'bg-danger/15', text: 'text-danger', border: 'border-danger', score: 'bg-danger text-white' }
      case 'HIGH': return { bg: 'bg-warning/15', text: 'text-warning', border: 'border-warning', score: 'bg-warning text-black' }
      case 'MEDIUM': return { bg: 'bg-primary/15', text: 'text-primary', border: 'border-primary', score: 'bg-primary text-white' }
      default: return { bg: 'bg-secondary/15', text: 'text-secondary', border: 'border-secondary', score: 'bg-secondary text-white' }
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">CVE Explorer</h2>
          <p className="text-on-surface-variant text-sm mt-1">Search the vulnerability database with real-time threat intelligence.</p>
        </div>
        <div className="flex gap-2 items-center text-xs text-outline font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            NVD 2.0 Connected
          </span>
          <span>•</span>
          <span>{allCves.length} CVEs indexed</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative group">
        <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-primary text-xl">search</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-14 pr-36 py-5 bg-surface-container-highest border border-outline-variant/10 rounded-xl text-on-surface text-base placeholder:text-outline focus:ring-2 focus:ring-primary/40 transition-all shadow-xl"
          placeholder="Search CVE ID, vendor, product (e.g. Log4j, CVE-2024-...)"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {loading && <span className="material-symbols-outlined animate-spin text-outline text-sm">progress_activity</span>}
          <button onClick={fetchFiltered}
            className="bg-primary hover:bg-primary-dark text-white font-bold px-6 py-2.5 rounded-lg transition-all active:scale-95 text-sm">
            Analyze
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Filters */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/10">
            <div className="flex justify-between mb-4">
              <h4 className="text-sm font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">filter_list</span>Filters
              </h4>
              <button className="text-[10px] text-primary font-bold hover:underline"
                onClick={() => { setSeverityFilter({ CRITICAL: true, HIGH: true, MEDIUM: true, LOW: true }); setCvssRange([0, 10]); setSearch('') }}>
                Reset All
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-3">Severity Level</label>
              {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as Severity[]).map(s => {
                const style = getSeverityStyle(s)
                return (
                  <label key={s} className="flex items-center gap-3 mb-2.5 cursor-pointer group">
                    <input type="checkbox" checked={severityFilter[s]} onChange={() => toggleSeverity(s)}
                      className="w-4 h-4 rounded border-outline-variant bg-surface-container accent-primary" />
                    <span className={`text-xs font-semibold ${style.text}`}>{s}</span>
                  </label>
                )
              })}
            </div>

            <div className="mb-6">
              <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-3">
                CVSS Range: {cvssRange[0]} – {cvssRange[1]}
              </label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-outline w-4">Min</span>
                  <input type="range" min="0" max="10" step="0.5" value={cvssRange[0]}
                    onChange={e => setCvssRange([Number(e.target.value), cvssRange[1]])}
                    className="flex-1 accent-primary h-1" />
                  <span className="text-xs font-bold w-6">{cvssRange[0]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-outline w-4">Max</span>
                  <input type="range" min="0" max="10" step="0.5" value={cvssRange[1]}
                    onChange={e => setCvssRange([cvssRange[0], Number(e.target.value)])}
                    className="flex-1 accent-primary h-1" />
                  <span className="text-xs font-bold w-6">{cvssRange[1]}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-3">Quick Vendor</label>
              <div className="flex flex-wrap gap-1.5">
                {['Apache', 'VMware', 'OpenSSL', 'FasterXML'].map(v => (
                  <span key={v} onClick={() => setSearch(v)}
                    className="px-2.5 py-1 rounded-full bg-surface-container-highest text-[10px] font-semibold text-on-surface-variant cursor-pointer hover:bg-primary/20 hover:text-primary transition-colors">
                    {v}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Threat Pulse */}
          <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/10">
            <h4 className="text-xs font-bold text-on-surface mb-4">Threat Pulse</h4>
            <div className="space-y-3">
              {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as Severity[]).map(s => {
                const count = allCves.filter(c => c.severity === s).length
                const pct = allCves.length ? (count / allCves.length) * 100 : 0
                const style = getSeverityStyle(s)
                return (
                  <div key={s}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className={`${style.text} font-semibold`}>{s}</span>
                      <span className="font-bold">{count}</span>
                    </div>
                    <div className="h-1 bg-surface-container-highest rounded-full">
                      <div className={`h-full rounded-full ${s === 'CRITICAL' ? 'bg-danger' : s === 'HIGH' ? 'bg-warning' : s === 'MEDIUM' ? 'bg-primary' : 'bg-secondary'}`}
                        style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </aside>

        {/* Results */}
        <div className="lg:col-span-9">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-on-surface">{cves.length} Results</span>
            {search && <span className="text-xs text-outline">Searching: "{search}"</span>}
          </div>

          {cves.length === 0 && !loading && (
            <div className="text-center py-16 text-outline">
              <span className="material-symbols-outlined text-4xl mb-2 block">search_off</span>
              No CVEs match your filters
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cves.map((cve, i) => {
              const style = getSeverityStyle(cve.severity)
              return (
                <div key={cve.id} onClick={() => setSelectedCVE(cve)}
                  className={`bg-surface-container-low rounded-xl p-5 border-l-4 ${style.border} cursor-pointer hover:bg-surface-container transition-all animate-fade-in group`}
                  style={{ animationDelay: `${i * 40}ms` }}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className={`text-[9px] font-bold uppercase tracking-widest mb-1 block ${style.text}`}>{cve.severity}</span>
                      <h3 className="text-base font-bold text-on-surface group-hover:text-primary transition-colors">{cve.id}</h3>
                    </div>
                    <div className={`${style.score} px-2.5 py-1 rounded-lg text-sm font-extrabold`}>{cve.cvssScore}</div>
                  </div>
                  <p className="text-xs text-on-surface-variant line-clamp-2 mb-3 leading-relaxed">{cve.description}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-outline-variant/10">
                    <div className="flex gap-1.5">
                      <span className="text-[9px] bg-surface-container-highest px-2 py-0.5 rounded text-on-surface-variant">{cve.product}</span>
                      <span className="text-[9px] bg-surface-container-highest px-2 py-0.5 rounded text-on-surface-variant">{cve.vendor}</span>
                    </div>
                    <span className="text-[10px] text-primary font-bold flex items-center gap-0.5 group-hover:gap-1.5 transition-all">
                      Details <span className="material-symbols-outlined text-[10px]">arrow_forward</span>
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Detail Drawer */}
      {selectedCVE && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end" onClick={() => setSelectedCVE(null)}>
          <div className="w-full max-w-lg bg-surface-container h-full overflow-y-auto p-8 animate-slide-in border-l border-outline-variant/10" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${getSeverityStyle(selectedCVE.severity).text}`}>{selectedCVE.severity} SEVERITY</span>
                <h2 className="text-2xl font-extrabold text-on-surface mt-1">{selectedCVE.id}</h2>
              </div>
              <button onClick={() => setSelectedCVE(null)} className="p-2 hover:bg-white/5 rounded-lg">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className={`${getSeverityStyle(selectedCVE.severity).score} inline-flex items-center gap-2 px-4 py-2 rounded-xl mb-6`}>
              <span className="text-2xl font-black">{selectedCVE.cvssScore}</span>
              <span className="text-xs font-semibold">/10.0 CVSS</span>
            </div>

            <div className="space-y-6">
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
                  { label: 'Vendor', val: selectedCVE.vendor },
                  { label: 'Product', val: selectedCVE.product },
                  { label: 'Version', val: selectedCVE.version },
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
                <p className="text-sm text-on-surface-variant">Update {selectedCVE.product} to the latest patched version. Consult the vendor advisory for specific mitigation steps.</p>
              </div>
              <a href={`https://nvd.nist.gov/vuln/detail/${selectedCVE.id}`} target="_blank" rel="noreferrer"
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
