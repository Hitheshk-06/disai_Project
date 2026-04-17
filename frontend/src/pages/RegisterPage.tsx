import { useState } from 'react'
import { api, type User } from '../lib/api'

interface RegisterPageProps {
  onLogin: (token: string, user: User) => void
  onBack: () => void
}

export default function RegisterPage({ onLogin, onBack }: RegisterPageProps) {
  const [form, setForm] = useState({ name: '', email: '', password: '', organization: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) { setError('All fields are required'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true); setError('')
    try {
      const { token, user } = await api.auth.register(form)
      onLogin(token, user)
    } catch (e: any) {
      setError(e.message || 'Registration failed')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="bg-surface-container/90 backdrop-blur-2xl rounded-2xl p-10 border border-outline-variant/10 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-blue-800 flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
            </div>
            <h1 className="text-2xl font-bold text-on-surface tracking-tight">Create Account</h1>
            <p className="text-sm text-outline mt-1">Join SBOM Shield</p>
          </div>

          <div className="space-y-4 mb-6">
            {[
              { label: 'Full Name', key: 'name', type: 'text', placeholder: 'John Doe' },
              { label: 'Email', key: 'email', type: 'email', placeholder: 'analyst@company.com' },
              { label: 'Password', key: 'password', type: 'password', placeholder: '••••••••' },
              { label: 'Organization', key: 'organization', type: 'text', placeholder: 'Acme Corp (optional)' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-semibold text-primary mb-1.5 uppercase tracking-wider">{f.label}</label>
                <input type={f.type} value={form[f.key as keyof typeof form]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && handleRegister()}
                  placeholder={f.placeholder}
                  className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 text-on-surface placeholder:text-outline/40 focus:ring-2 focus:ring-primary/40 transition-all focus:outline-none" />
              </div>
            ))}
          </div>

          {error && <p className="text-xs text-danger bg-danger/10 px-4 py-2 rounded-lg mb-4">{error}</p>}

          <button onClick={handleRegister} disabled={loading}
            className="w-full bg-gradient-to-r from-primary to-primary-dark text-white py-3.5 rounded-xl font-bold text-sm hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
            {loading
              ? <><span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>Creating account...</>
              : <><span className="material-symbols-outlined text-lg">person_add</span>Create Account</>
            }
          </button>

          <p className="text-center text-xs text-outline mt-6">
            Already have an account?{' '}
            <button onClick={onBack} className="text-primary font-semibold hover:underline">Sign in</button>
          </p>
        </div>
      </div>
    </div>
  )
}
