import { useState, useEffect } from 'react'
import { api, type User, type APIKey, type Integration } from '../lib/api'

function Toggle({ checked = false, onChange }: { checked?: boolean; onChange?: () => void }) {
  const [on, setOn] = useState(checked)
  return (
    <button onClick={() => { setOn(!on); onChange?.() }}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${on ? 'bg-primary' : 'bg-surface-container-highest'}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform duration-200 ${on ? 'translate-x-5 bg-white' : 'translate-x-0 bg-outline'}`}></span>
    </button>
  )
}

type Tab = 'profile' | 'notifications' | 'integrations' | 'security' | 'api'

export default function SettingsPage({ user, onUserUpdate }: { user: User; onUserUpdate: (u: User) => void }) {
  const [tab, setTab] = useState<Tab>('profile')
  const [apiKeys, setApiKeys] = useState<APIKey[]>([])
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [profileForm, setProfileForm] = useState({ name: user.name, organization: user.organization || '' })
  const [pwForm, setPwForm] = useState({ current: '', next: '' })
  const [pwMsg, setPwMsg] = useState('')

  useEffect(() => {
    api.settings.apiKeys().then(setApiKeys).catch(console.error)
    api.settings.integrations().then(setIntegrations).catch(console.error)
  }, [])

  const saveProfile = async () => {
    try {
      const updated = await api.auth.updateProfile(profileForm)
      onUserUpdate({ ...user, ...updated })
    } catch (e: any) { alert(e.message) }
  }

  const changePassword = async () => {
    try {
      await api.auth.changePassword(pwForm.current, pwForm.next)
      setPwMsg('Password updated'); setPwForm({ current: '', next: '' })
    } catch (e: any) { setPwMsg(e.message) }
  }

  const generateKey = async () => {
    const name = prompt('Key name:')
    if (!name) return
    try {
      const key = await api.settings.createApiKey(name, 'Read Only')
      alert(`Your new API key (save it now):\n${key.rawKey}`)
      setApiKeys(prev => [...prev, key])
    } catch (e: any) { alert(e.message) }
  }

  const revokeKey = async (id: string) => {
    try {
      await api.settings.deleteApiKey(id)
      setApiKeys(prev => prev.filter(k => k.id !== id))
    } catch (e: any) { alert(e.message) }
  }

  const toggleIntegration = async (id: string) => {
    try {
      const updated = await api.settings.toggleIntegration(id)
      setIntegrations(prev => prev.map(i => i.id === id ? updated : i))
    } catch (e: any) { alert(e.message) }
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'profile', label: 'Profile', icon: 'person' },
    { id: 'notifications', label: 'Notifications', icon: 'notifications' },
    { id: 'integrations', label: 'Integrations', icon: 'hub' },
    { id: 'security', label: 'Security', icon: 'lock' },
    { id: 'api', label: 'API Keys', icon: 'key' },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">Settings</h2>
        <p className="text-on-surface-variant text-sm mt-1">Configure your SBOM Shield platform preferences.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-container-low p-1 rounded-xl border border-outline-variant/10 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap
              ${tab === t.id ? 'bg-surface-container-high text-on-surface' : 'text-outline hover:text-on-surface'}`}>
            <span className="material-symbols-outlined text-sm">{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* Profile */}
      {tab === 'profile' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-surface-container-low rounded-xl p-8 border border-outline-variant/10">
            <h3 className="text-lg font-bold mb-6">Account Profile</h3>
            <div className="flex items-center gap-5 mb-8">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-xl font-black text-white">
                {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
                <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-surface-container-high rounded-full flex items-center justify-center border-2 border-surface">
                  <span className="material-symbols-outlined text-[10px]">edit</span>
                </button>
              </div>
              <div>
                <p className="font-bold">{user.name}</p>
                <p className="text-xs text-outline capitalize">{user.role}</p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-bold rounded uppercase tracking-wider">Admin</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                { label: 'Full Name', key: 'name', type: 'text' },
                { label: 'Organization', key: 'organization', type: 'text' },
              ].map(f => (
                <div key={f.label}>
                  <label className="block text-[10px] font-bold text-primary uppercase tracking-wider mb-1.5">{f.label}</label>
                  <input type={f.type} value={profileForm[f.key as keyof typeof profileForm]}
                    onChange={e => setProfileForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full bg-surface-container-highest border-0 border-b-2 border-transparent focus:border-primary focus:ring-0 rounded-t-lg px-4 py-3 text-sm text-on-surface transition-all" />
                </div>
              ))}
              <div>
                <label className="block text-[10px] font-bold text-primary uppercase tracking-wider mb-1.5">Email</label>
                <input type="email" value={user.email} disabled
                  className="w-full bg-surface-container-highest border-0 border-b-2 border-transparent rounded-t-lg px-4 py-3 text-sm text-outline transition-all cursor-not-allowed" />
              </div>
            </div>
            <button onClick={saveProfile} className="mt-4 bg-primary text-white px-6 py-2 rounded-lg text-sm font-bold hover:brightness-110 transition-all">Save Profile</button>
          </div>

          <div className="bg-surface-container-low rounded-xl p-8 border border-outline-variant/10">
            <h3 className="text-lg font-bold mb-6">Interface Preferences</h3>
            <div className="space-y-5">
              {[
                { title: 'Dark Mode', desc: 'Always use dark interface theme', default: true },
                { title: 'Auto-refresh Dashboard', desc: 'Refresh data every 30 seconds', default: true },
                { title: 'Compact View', desc: 'Show more data in less space', default: false },
                { title: 'Sound Notifications', desc: 'Play sound for critical alerts', default: false },
              ].map(p => (
                <div key={p.title} className="flex items-center justify-between">
                  <div><p className="text-sm font-semibold">{p.title}</p><p className="text-xs text-outline">{p.desc}</p></div>
                  <Toggle checked={p.default} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      {tab === 'notifications' && (
        <div className="bg-surface-container-low rounded-xl p-8 border border-outline-variant/10 animate-fade-in">
          <h3 className="text-lg font-bold mb-6">Notification Preferences</h3>
          <div className="space-y-5">
            {[
              { title: 'Critical CVE Alerts', desc: 'Immediate alerts for CVSS 9.0+', default: true },
              { title: 'High Risk Alerts', desc: 'Alerts for CVSS 7.0-8.9', default: true },
              { title: 'Weekly Report', desc: 'Summary emailed every Monday', default: true },
              { title: 'SBOM Upload Status', desc: 'Notify when processing completes', default: false },
              { title: 'Patch Recommendations', desc: 'AI-powered remediation suggestions', default: true },
            ].map(n => (
              <div key={n.title} className="flex items-center justify-between py-3 border-b border-outline-variant/10 last:border-0">
                <div><p className="text-sm font-semibold">{n.title}</p><p className="text-xs text-outline">{n.desc}</p></div>
                <Toggle checked={n.default} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Integrations */}
      {tab === 'integrations' && (
        <div className="bg-surface-container-low rounded-xl p-8 border border-outline-variant/10 animate-fade-in">
          <h3 className="text-lg font-bold mb-6">Connected Integrations</h3>
          <div className="space-y-3">
            {integrations.map(int => (
              <div key={int.id} className="flex items-center justify-between p-4 bg-surface-container rounded-xl border border-outline-variant/10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center"><span className="material-symbols-outlined text-primary">{int.icon}</span></div>
                  <div><p className="text-sm font-semibold">{int.name}</p><p className="text-[10px] text-outline">{int.desc}</p></div>
                </div>
                {int.connected
                  ? <span onClick={() => toggleIntegration(int.id)} className="px-3 py-1 bg-secondary/15 text-secondary text-[9px] font-bold rounded-full uppercase cursor-pointer hover:bg-danger/15 hover:text-danger transition-colors">Connected</span>
                  : <button onClick={() => toggleIntegration(int.id)} className="px-4 py-1.5 bg-surface-container-high text-on-surface text-xs font-semibold rounded-lg hover:bg-primary hover:text-white transition-all">Connect</button>
                }
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security */}
      {tab === 'security' && (
        <div className="bg-surface-container-low rounded-xl p-8 border border-outline-variant/10 animate-fade-in">
          <h3 className="text-lg font-bold mb-6">Security Settings</h3>
          <div className="space-y-5">
            <div className="flex items-center justify-between py-3 border-b border-outline-variant/10">
              <div><p className="text-sm font-semibold">Two-Factor Authentication</p><p className="text-xs text-outline">TOTP via authenticator app</p></div>
              <Toggle checked={true} />
            </div>
            <div className="flex items-center justify-between py-3 border-b border-outline-variant/10">
              <div><p className="text-sm font-semibold">Session Timeout</p><p className="text-xs text-outline">Auto-logout after inactivity</p></div>
              <select className="bg-surface-container-highest border-none rounded-lg text-xs px-3 py-1.5 focus:ring-primary text-on-surface">
                <option>15 minutes</option><option>30 minutes</option><option>1 hour</option>
              </select>
            </div>
            <div className="py-3">
              <p className="text-sm font-semibold mb-3">Change Password</p>
              {pwMsg && <p className="text-xs text-primary mb-2">{pwMsg}</p>}
              <div className="space-y-3 max-w-md">
                <input type="password" placeholder="Current password" value={pwForm.current}
                  onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))}
                  className="w-full bg-surface-container-highest border-none rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary placeholder:text-outline/40" />
                <input type="password" placeholder="New password" value={pwForm.next}
                  onChange={e => setPwForm(p => ({ ...p, next: e.target.value }))}
                  className="w-full bg-surface-container-highest border-none rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary placeholder:text-outline/40" />
                <button onClick={changePassword} className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-bold hover:brightness-110 transition-all">Update Password</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API Keys */}
      {tab === 'api' && (
        <div className="bg-surface-container-low rounded-xl p-8 border border-outline-variant/10 animate-fade-in">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold">API Keys</h3>
            <button onClick={generateKey} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:brightness-110 transition-all">
              <span className="material-symbols-outlined text-sm">add</span>Generate Key
            </button>
          </div>
          {apiKeys.map(k => (
            <div key={k.id} className="p-5 bg-surface-container rounded-xl border border-outline-variant/10 mb-3">
              <div className="flex justify-between items-start mb-2">
                <div><p className="text-sm font-bold">{k.name}</p><p className="text-[10px] text-outline">Created {new Date(k.createdAt).toLocaleDateString()}</p></div>
                <span className="px-2 py-0.5 bg-secondary/15 text-secondary text-[9px] font-bold rounded uppercase">Active</span>
              </div>
              <div className="flex items-center gap-2 bg-surface-container-highest rounded-lg px-4 py-2.5 font-mono text-xs text-on-surface-variant mb-2">
                <span className="flex-1">{k.keyPreview}</span>
                <button onClick={() => revokeKey(k.id)} className="text-danger hover:text-white transition-colors" title="Revoke">
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
              <div className="flex gap-2 text-[10px] text-outline">
                <span>Last used: {k.lastUsed}</span><span>·</span><span>{k.scope}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Danger Zone */}
      <div className="bg-surface-container-low rounded-xl p-8 border border-danger/20">
        <h3 className="text-lg font-bold text-danger mb-2">Danger Zone</h3>
        <p className="text-xs text-outline mb-4">These actions are irreversible.</p>
        <div className="flex flex-wrap gap-2">
          <button className="px-4 py-2 border border-danger/30 text-danger rounded-lg text-xs font-semibold hover:bg-danger/10 transition-colors">Reset Settings</button>
          <button className="px-4 py-2 bg-danger/10 border border-danger text-danger rounded-lg text-xs font-bold hover:bg-danger hover:text-white transition-all">Delete Account</button>
        </div>
      </div>
    </div>
  )
}
