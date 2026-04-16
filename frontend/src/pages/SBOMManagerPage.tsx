import { useState, useCallback, useEffect, useRef } from 'react'
import { api, type Application } from '../lib/api'
import { Toast, useToast } from '../components/Toast'

export default function SBOMManagerPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadMsg, setUploadMsg] = useState('')
  const [filter, setFilter] = useState('')
  const [selectedApp, setSelectedApp] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast, show, hide } = useToast()

  const load = () => api.applications.list().then(setApplications).catch(console.error)
  useEffect(() => { load() }, [])

  const handleFile = useCallback(async (file: File) => {
    if (!selectedApp) { show('Select an application first', 'error'); return }
    setUploading(true); setProgress(0); setUploadMsg('Uploading...')

    // Animate progress while uploading
    let p = 0
    const ticker = setInterval(() => { p = Math.min(p + 5, 85); setProgress(p) }, 100)

    try {
      const result = await api.sbom.upload(file, selectedApp)
      clearInterval(ticker); setProgress(100)
      setUploadMsg(`Found ${result.componentsFound} components`)
      show(`SBOM processed — ${result.componentsFound} components extracted`, 'success')
      await load()
    } catch (e: any) {
      clearInterval(ticker)
      show(e.message || 'Upload failed', 'error')
    } finally {
      setTimeout(() => { setUploading(false); setProgress(0); setUploadMsg('') }, 1500)
    }
  }, [selectedApp, show])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  const filtered = applications.filter(a => a.name.toLowerCase().includes(filter.toLowerCase()))

  const getSeverityBadge = (score: number) => {
    if (score >= 8) return { label: 'Critical', cls: 'bg-danger/15 text-danger' }
    if (score >= 6) return { label: 'Warning', cls: 'bg-warning/15 text-warning' }
    return { label: 'Secure', cls: 'bg-secondary/15 text-secondary' }
  }

  const totalComponents = applications.reduce((s, a) => s + a.components, 0)
  const highRisk = applications.filter(a => a.riskScore >= 8).length

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hide} />}
      <input ref={fileInputRef} type="file" accept=".json,.xml,.spdx,.csv,.txt" className="hidden" onChange={handleFileInput} />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">SBOM Manager</h2>
          <p className="text-on-surface-variant text-sm mt-1">Upload and analyze Software Bill of Materials for vulnerability detection.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => load()}
            className="bg-surface-container-high text-on-surface px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-surface-bright transition-colors border border-outline-variant/10">
            <span className="material-symbols-outlined text-sm">sync</span>Refresh
          </button>
          <button onClick={() => fileInputRef.current?.click()}
            className="bg-gradient-to-r from-primary to-primary-dark text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:brightness-110 transition-all shadow-lg shadow-primary/20 active:scale-95">
            <span className="material-symbols-outlined text-sm">add</span>New Upload
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload Zone */}
        <div className="lg:col-span-4 space-y-4">
          {/* App selector */}
          <div>
            <label className="block text-[10px] font-bold text-outline uppercase tracking-widest mb-2">Target Application</label>
            <select value={selectedApp} onChange={e => setSelectedApp(e.target.value)}
              className="w-full bg-surface-container-highest border border-outline-variant/10 rounded-lg px-4 py-2.5 text-sm text-on-surface focus:ring-2 focus:ring-primary/40 focus:outline-none">
              <option value="">— Select application —</option>
              {applications.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
            </select>
          </div>

          <div
            onDragOver={e => { e.preventDefault(); setDragActive(true) }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`rounded-xl p-8 border-2 border-dashed transition-all duration-300 cursor-pointer min-h-[260px] flex flex-col items-center justify-center text-center group
              ${dragActive ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-outline-variant/30 bg-surface-container-low hover:border-primary/40'}`}
          >
            {uploading ? (
              <div className="w-full space-y-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-primary text-2xl animate-spin">progress_activity</span>
                </div>
                <p className="text-sm font-semibold text-on-surface">Processing SBOM...</p>
                <div className="w-full bg-surface-container-highest rounded-full h-2 overflow-hidden">
                  <div className="bg-primary h-full rounded-full transition-all duration-200" style={{ width: `${progress}%` }}></div>
                </div>
                <p className="text-xs text-outline">{progress}% — {uploadMsg}</p>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-primary text-3xl">upload_file</span>
                </div>
                <h3 className="text-lg font-bold text-on-surface mb-1">Upload SBOM Manifest</h3>
                <p className="text-on-surface-variant text-sm mb-4 max-w-[220px]">Drag & drop or click to browse</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {['CycloneDX', 'SPDX', 'CSV'].map(f => (
                    <span key={f} className="px-3 py-1 bg-surface-container-highest text-[10px] uppercase tracking-wider font-bold rounded-full text-outline">{f}</span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-surface-container rounded-xl p-4 text-center border border-outline-variant/10">
              <div className="text-2xl font-extrabold text-on-surface">{applications.length}</div>
              <div className="text-[10px] text-outline uppercase font-bold tracking-wider mt-1">Apps</div>
            </div>
            <div className="bg-surface-container rounded-xl p-4 text-center border-l-4 border-danger">
              <div className="text-2xl font-extrabold text-danger">{String(highRisk).padStart(2, '0')}</div>
              <div className="text-[10px] text-outline uppercase font-bold tracking-wider mt-1">High Risk</div>
            </div>
            <div className="bg-surface-container rounded-xl p-4 text-center border border-outline-variant/10">
              <div className="text-2xl font-extrabold text-on-surface">{totalComponents > 999 ? `${(totalComponents / 1000).toFixed(1)}k` : totalComponents}</div>
              <div className="text-[10px] text-outline uppercase font-bold tracking-wider mt-1">Components</div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="lg:col-span-8 bg-surface-container rounded-xl overflow-hidden border border-outline-variant/10">
          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-high/30">
            <div className="relative flex-1 max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">search</span>
              <input value={filter} onChange={e => setFilter(e.target.value)}
                className="w-full bg-surface-container-highest border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/30 placeholder:text-outline/40 focus:outline-none"
                placeholder="Filter by application..." />
            </div>
            <button onClick={() => {
              const csv = ['Application,Version,Components,Risk Score,Last Scan',
                ...applications.map(a => `${a.name},${a.version},${a.components},${a.riskScore},${a.lastScan}`)
              ].join('\n')
              const blob = new Blob([csv], { type: 'text/csv' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a'); a.href = url; a.download = 'sbom-report.csv'; a.click()
              URL.revokeObjectURL(url)
            }} className="bg-surface-container-highest px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-surface-bright transition-colors whitespace-nowrap">
              <span className="material-symbols-outlined text-sm">download</span>Export CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-high/20">
                  {['Application', 'Version', 'Components', 'Last Scan', 'Risk', 'Status'].map(h => (
                    <th key={h} className="px-5 py-3 text-[10px] font-bold text-outline uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {filtered.map((app, i) => {
                  const badge = getSeverityBadge(app.riskScore)
                  return (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${app.riskScore >= 8 ? 'bg-danger/10 text-danger' : app.riskScore >= 6 ? 'bg-warning/10 text-warning' : 'bg-secondary/10 text-secondary'}`}>
                            {app.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-on-surface">{app.name}</div>
                            <div className="text-[10px] text-outline">{app.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs font-mono text-on-surface-variant">{app.version}</td>
                      <td className="px-5 py-4 text-sm font-semibold">{app.components}</td>
                      <td className="px-5 py-4 text-xs text-on-surface-variant">{app.lastScan}</td>
                      <td className="px-5 py-4">
                        <span className={`text-lg font-black ${app.riskScore >= 8 ? 'text-danger' : app.riskScore >= 6 ? 'text-warning' : 'text-secondary'}`}>{app.riskScore}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full ${badge.cls} text-[10px] font-bold uppercase tracking-wider`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>{badge.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 text-xs text-outline border-t border-outline-variant/10">
            Showing {filtered.length} of {applications.length} applications
          </div>
        </div>
      </div>
    </div>
  )
}
