import { useState, useEffect, useRef } from 'react'

import { api, type User } from '../lib/api'
interface LoginPageProps { onLogin: (token: string, user: User) => void }

export default function LoginPage({ onLogin }: LoginPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Animated background - floating nodes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let animId: number
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)

    const nodes: { x: number; y: number; vx: number; vy: number; r: number }[] = []
    for (let i = 0; i < 50; i++) {
      nodes.push({
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
        r: Math.random() * 2 + 1,
      })
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      // Draw edges
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < 150) {
            ctx.beginPath()
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.strokeStyle = `rgba(26,115,232,${0.08 * (1 - d / 150)})`
            ctx.lineWidth = 1
            ctx.stroke()
          }
        }
      }
      // Draw nodes
      nodes.forEach(n => {
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(26,115,232,0.3)'
        ctx.fill()
        n.x += n.vx; n.y += n.vy
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1
      })
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])

  const handleLogin = async () => {
    if (!email || !password) { setError('Enter email and password'); return }
    setLoading(true); setError('')
    try {
      const { token, user } = await api.auth.login(email, password)
      onLogin(token, user)
    } catch (e: any) {
      setError(e.message || 'Login failed')
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-surface overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md mx-4 animate-fade-in">
        <div className="bg-surface-container/90 backdrop-blur-2xl rounded-2xl p-10 border border-outline-variant/10 shadow-2xl">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-blue-800 flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
            </div>
            <h1 className="text-2xl font-bold text-on-surface tracking-tight">SBOM Shield</h1>
            <p className="text-sm text-outline mt-1 tracking-widest uppercase font-semibold">Map. Identify. Secure.</p>
          </div>

          {/* Form */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-semibold text-primary mb-1.5 uppercase tracking-wider">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 text-on-surface placeholder:text-outline/40 focus:ring-2 focus:ring-primary/40 transition-all"
                placeholder="analyst@company.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-primary mb-1.5 uppercase tracking-wider">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-3 text-on-surface placeholder:text-outline/40 focus:ring-2 focus:ring-primary/40 transition-all"
                placeholder="••••••••••"
              />
            </div>
          </div>

          {error && <p className="text-xs text-danger bg-danger/10 px-4 py-2 rounded-lg">{error}</p>}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary to-primary-dark text-white py-3.5 rounded-xl font-bold text-sm tracking-wide hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
          >
            {loading ? (
              <><span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>Authenticating...</>
            ) : (
              <><span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>login</span>Sign In Securely</>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-outline-variant/20"></div>
            <span className="text-[10px] text-outline uppercase tracking-widest font-semibold">or</span>
            <div className="flex-1 h-px bg-outline-variant/20"></div>
          </div>

          {/* Google Sign In */}
          <button
            onClick={handleLogin}
            className="w-full bg-surface-container-highest hover:bg-surface-bright text-on-surface py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-3 transition-all border border-outline-variant/10"
          >
            <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.72v2.26h2.92a8.78 8.78 0 002.68-6.62z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.83.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.34A9 9 0 009 18z"/><path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 013.68 9c0-.6.1-1.18.29-1.72V4.94H.96A9 9 0 000 9c0 1.45.35 2.83.96 4.06l3.01-2.34z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 00.96 4.94l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58z"/></svg>
            Sign in with Google
          </button>

          <p className="text-center text-[10px] text-outline mt-6 leading-relaxed">
            Protected by enterprise-grade security. <br />
            <span className="text-primary cursor-pointer hover:underline">Terms</span> · <span className="text-primary cursor-pointer hover:underline">Privacy</span>
          </p>
        </div>
      </div>
    </div>
  )
}
