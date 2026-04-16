import { useState, useEffect } from 'react'
import { api, type Application } from '../lib/api'
import { Modal } from '../components/Modal'
import { Toast, useToast } from '../components/Toast'

const avatarColors = ['from-blue-600 to-indigo-700', 'from-emerald-500 to-teal-700', 'from-orange-500 to-red-600', 'from-purple-500 to-violet-700', 'from-cyan-500 to-blue-600']

type FilterType = 'All' | 'Critical' | 'High Risk' | 'Healthy'

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [activeFilter, setActiveFilter] = useState<FilterType>('All')
  const [showAddModal, setShowAddModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Application | null>(null)
  const [form, setForm] = useState({ name: '', version: '', description: '' })
  const [saving, setSaving] = useState(false)
  const { toast, show, hide } = useToast()

  const load = () => api.applications.list().then(setApplications).catch(console.error)
  useEffect(() => { load() }, [])

  const filtered = applications.filter(a => {
    if (activeFilter === 'Critical') return a.riskScore >= 8
    if (activeFilter === 'High Risk') return a.riskScore >= 6 && a.riskScore < 8
    if (activeFilter === 'Healthy') return a.riskScore < 6
    return true
  })

  const handleAdd = async () => {
    if (!form.name.trim() || !form.version.trim()) { show('Name and version are required', 'error'); return }
    setSaving(true)
    try {
      await api.applications.create(form)
      await load()
      setShowAddModal(false)
      setForm({ name: '', version: '', description: '' })
      show('Application added successfully')
    } catch (e: any) { show(e.message, 'error') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await api.applications.delete(deleteTarget.id)
      await load()
      setDeleteTarget(null)
      show('Application deleted')
    } catch (e: any) { show(e.message, 'error') }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hide} />}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">Applications</h2>
          <p className="text-on-surface-variant text-sm mt-1">Overview of your organization's application security posture.</p>
        </div>
        <button onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-primary to-primary-dark text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:brightness-110 transition-all shadow-lg shadow-primary/20 active:scale-95">
          <span className="material-symbols-outlined text-sm">add</span>Add Application
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(['All', 'Critical', 'High Risk', 'Healthy'] as FilterType[]).map(f => (
          <button key={f} onClick={() => setActiveFilter(f)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeFilter === f ? 'bg-primary text-white' : 'bg-surface-container text-outline hover:text-on-surface hover:bg-surface-container-high border border-outline-variant/10'}`}>
            {f}
          </button>
        ))}
        <span className="ml-auto text-xs text-outline self-center">{filtered.length} apps</span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map((app, i) => {
          const isCritical = app.riskScore >= 8
          const isWarning = app.riskScore >= 6 && app.riskScore < 8
          const borderColor = isCritical ? 'border-danger/20 hover:border-danger/40' : isWarning ? 'border-warning/20 hover:border-warning/40' : 'border-primary/10 hover:border-primary/30'
          const scoreColor = isCritical ? 'text-danger' : isWarning ? 'text-warning' : 'text-secondary'
          const badgeStyle = isCritical ? 'bg-danger/15 text-danger' : isWarning ? 'bg-warning/15 text-warning' : 'bg-secondary/15 text-secondary'

          return (
            <div key={app.id} className={`bg-surface-container rounded-xl p-6 border ${borderColor} group hover:bg-surface-container-high transition-all duration-300 animate-fade-in relative overflow-hidden`} style={{ animationDelay: `${i * 80}ms` }}>
              {isCritical && <div className="absolute top-0 left-0 w-full h-0.5 bg-danger opacity-60"></div>}

              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white font-bold text-sm shadow-lg group-hover:scale-110 transition-transform`}>
                    {app.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-on-surface">{app.name}</h3>
                    <p className="text-[10px] text-outline">{app.version} · {app.description.split(' ').slice(0, 3).join(' ')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`${badgeStyle} text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full`}>
                    {isCritical ? 'Critical' : isWarning ? 'Warning' : 'Healthy'}
                  </span>
                  <button onClick={() => setDeleteTarget(app)}
                    className="p-1 text-outline hover:text-danger transition-colors opacity-0 group-hover:opacity-100">
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              </div>

              <div className="flex items-baseline gap-2 mb-4">
                <span className={`text-4xl font-black ${scoreColor}`}>{app.riskScore}</span>
                <span className="text-xs text-outline">/10 Risk Score</span>
              </div>

              <div className="w-full h-1.5 bg-surface-container-lowest rounded-full overflow-hidden mb-5">
                <div className={`h-full rounded-full transition-all duration-1000 ${isCritical ? 'bg-danger' : isWarning ? 'bg-warning' : 'bg-secondary'}`}
                  style={{ width: `${app.riskScore * 10}%` }}></div>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-4">
                {[
                  { label: 'Critical', val: app.criticalCount, color: 'text-danger' },
                  { label: 'High', val: app.highCount, color: 'text-warning' },
                  { label: 'Medium', val: app.mediumCount, color: 'text-primary' },
                  { label: 'Low', val: app.lowCount, color: 'text-secondary' },
                ].map(s => (
                  <div key={s.label} className="text-center bg-surface-container-low rounded-lg p-2">
                    <div className={`text-sm font-bold ${s.color}`}>{s.val}</div>
                    <div className="text-[8px] text-outline uppercase font-bold">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-outline-variant/10">
                <div className="flex items-center gap-2 text-[10px] text-outline">
                  <span className="material-symbols-outlined text-xs">schedule</span>{app.lastScan}
                  <span>·</span>
                  <span>{app.components} components</span>
                </div>
                <button className="text-primary text-xs font-bold flex items-center gap-0.5 group-hover:gap-1.5 transition-all">
                  Report <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </button>
              </div>
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="col-span-3 text-center py-16 text-outline">
            <span className="material-symbols-outlined text-4xl mb-2 block">apps</span>
            No applications found
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <Modal title="Add Application" onClose={() => setShowAddModal(false)}>
          <div className="space-y-4">
            {[
              { label: 'Application Name', key: 'name', placeholder: 'e.g. PaymentService' },
              { label: 'Version', key: 'version', placeholder: 'e.g. v1.0.0' },
              { label: 'Description', key: 'description', placeholder: 'Brief description...' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-[10px] font-bold text-primary uppercase tracking-wider mb-1.5">{f.label}</label>
                <input
                  value={form[f.key as keyof typeof form]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full bg-surface-container-highest border border-outline-variant/10 rounded-lg px-4 py-2.5 text-sm text-on-surface placeholder:text-outline/40 focus:ring-2 focus:ring-primary/40 focus:outline-none transition-all"
                />
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold bg-surface-container-high text-on-surface hover:bg-surface-bright transition-colors">
                Cancel
              </button>
              <button onClick={handleAdd} disabled={saving}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold bg-primary text-white hover:brightness-110 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {saving && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
                Add Application
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <Modal title="Delete Application" onClose={() => setDeleteTarget(null)}>
          <p className="text-sm text-on-surface-variant mb-6">
            Are you sure you want to delete <span className="font-bold text-on-surface">{deleteTarget.name}</span>? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteTarget(null)}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold bg-surface-container-high text-on-surface hover:bg-surface-bright transition-colors">
              Cancel
            </button>
            <button onClick={handleDelete}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold bg-danger text-white hover:brightness-110 transition-all">
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
