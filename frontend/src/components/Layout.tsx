import { useState, useEffect, useRef, type ReactNode } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import type { User } from '../lib/api'
import { api } from '../lib/api'

const navItems = [
  { path: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { path: '/sbom-manager', icon: 'inventory_2', label: 'SBOM Manager' },
  { path: '/cve-explorer', icon: 'search', label: 'CVE Explorer' },
  { path: '/vulnerability-graph', icon: 'hub', label: 'Vulnerability Graph' },
  { path: '/risk-analytics', icon: 'analytics', label: 'Risk Analytics' },
  { path: '/applications', icon: 'apps', label: 'Applications' },
  { path: '/settings', icon: 'settings', label: 'Settings' },
]

interface LayoutProps { children: ReactNode; onLogout: () => void; user?: User }

export default function Layout({ children, onLogout, user }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<{ id: string; severity: string; product: string; cvssScore: number }[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const currentTitle = navItems.find(i => location.pathname.startsWith(i.path))?.label || 'Dashboard'
  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'JD'

  // Load critical CVEs for notifications
  useEffect(() => {
    api.dashboard.recentCVEs().then(cves => {
      setNotifications(cves.filter(c => c.severity === 'CRITICAL' || c.severity === 'HIGH'))
    }).catch(() => {})
  }, [])

  // Focus search on open
  useEffect(() => {
    if (showSearch) searchRef.current?.focus()
  }, [showSearch])

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/cve-explorer`)
      setShowSearch(false)
      setSearchQuery('')
    }
    if (e.key === 'Escape') { setShowSearch(false); setSearchQuery('') }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* Sidebar */}
      <aside className={`hidden md:flex flex-col bg-[#0a1020] border-r border-outline-variant/10 transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-[260px]'}`}>
        <div className={`flex items-center gap-3 px-5 h-16 border-b border-outline-variant/10 shrink-0 ${collapsed ? 'justify-center px-0' : ''}`}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-white text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
          </div>
          {!collapsed && <span className="text-lg font-bold text-white tracking-tight">SBOM Shield</span>}
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2">
          {!collapsed && <div className="px-3 mb-4"><span className="text-[10px] font-bold uppercase tracking-widest text-outline">Intelligence Hub</span></div>}
          {navItems.map(item => (
            <NavLink key={item.path} to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg transition-all duration-200 mb-1
                ${collapsed ? 'justify-center p-3 mx-1' : 'px-3 py-2.5'}
                ${isActive ? 'bg-primary/10 text-primary border-r-2 border-primary' : 'text-outline hover:text-on-surface hover:bg-white/5'}`
              }>
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-outline-variant/10 p-3 space-y-2">
          <button onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-outline hover:text-on-surface hover:bg-white/5 transition-colors">
            <span className="material-symbols-outlined text-sm">{collapsed ? 'chevron_right' : 'chevron_left'}</span>
            {!collapsed && <span className="text-xs">Collapse</span>}
          </button>
          {!collapsed && (
            <div className="flex items-center gap-3 p-2 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white">{initials}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-on-surface truncate">{user?.name || 'User'}</p>
                <p className="text-[10px] text-outline truncate capitalize">{user?.role || 'analyst'}</p>
              </div>
              <button onClick={onLogout} className="text-outline hover:text-danger transition-colors">
                <span className="material-symbols-outlined text-sm">logout</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-[#0a1020]/60 backdrop-blur-xl border-b border-outline-variant/10 flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-1 text-outline hover:text-on-surface">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h1 className="text-lg font-bold text-on-surface">{currentTitle}</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Global Search */}
            <div className="hidden sm:flex items-center gap-2 bg-surface-container rounded-lg px-3 py-1.5 cursor-pointer"
              onClick={() => setShowSearch(true)}>
              <span className="material-symbols-outlined text-outline text-sm">search</span>
              <span className="text-sm text-outline w-36">Quick search...</span>
              <span className="text-[10px] text-outline border border-outline-variant/20 rounded px-1">⌘K</span>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-outline hover:text-on-surface hover:bg-white/5 rounded-lg transition-colors relative">
                <span className="material-symbols-outlined text-sm">notifications</span>
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full animate-pulse"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-12 w-80 bg-surface-container border border-outline-variant/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/10">
                    <span className="text-sm font-bold">Threat Alerts</span>
                    <button onClick={() => setShowNotifications(false)} className="text-outline hover:text-on-surface">
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-outline text-center py-6">No active alerts</p>
                    ) : notifications.map((n, i) => (
                      <div key={i} onClick={() => { navigate('/cve-explorer'); setShowNotifications(false) }}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 cursor-pointer border-b border-outline-variant/5 last:border-0">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${n.severity === 'CRITICAL' ? 'bg-danger' : 'bg-warning'}`}></span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-on-surface">{n.id}</p>
                          <p className="text-[10px] text-outline truncate">{n.product} — CVSS {n.cvssScore}</p>
                        </div>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${n.severity === 'CRITICAL' ? 'bg-danger/20 text-danger' : 'bg-warning/20 text-warning'}`}>
                          {n.severity}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-2 border-t border-outline-variant/10">
                    <button onClick={() => { navigate('/cve-explorer'); setShowNotifications(false) }}
                      className="text-xs text-primary font-semibold hover:underline">
                      View all CVEs →
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white md:hidden">{initials}</div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 animate-fade-in">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#0a1020] border-t border-outline-variant/10 flex justify-around items-center h-16 z-50">
        {navItems.slice(0, 5).map(item => {
          const isActive = location.pathname.startsWith(item.path)
          return (
            <NavLink key={item.path} to={item.path} className={`flex flex-col items-center gap-0.5 ${isActive ? 'text-primary' : 'text-outline'}`}>
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span className="text-[9px] font-medium">{item.label.split(' ')[0]}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* Global Search Overlay */}
      {showSearch && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-24 px-4"
          onClick={() => { setShowSearch(false); setSearchQuery('') }}>
          <div className="w-full max-w-xl bg-surface-container rounded-2xl border border-outline-variant/10 shadow-2xl overflow-hidden animate-fade-in"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-5 py-4 border-b border-outline-variant/10">
              <span className="material-symbols-outlined text-primary">search</span>
              <input ref={searchRef} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                className="flex-1 bg-transparent text-on-surface placeholder:text-outline text-base focus:outline-none"
                placeholder="Search CVEs, applications, vendors..." />
              <span className="text-[10px] text-outline">ESC to close</span>
            </div>
            <div className="p-4">
              <p className="text-[10px] text-outline uppercase tracking-widest mb-3">Quick Navigate</p>
              <div className="grid grid-cols-2 gap-2">
                {navItems.slice(0, 6).map(item => (
                  <button key={item.path} onClick={() => { navigate(item.path); setShowSearch(false) }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-left transition-colors">
                    <span className="material-symbols-outlined text-primary text-sm">{item.icon}</span>
                    <span className="text-sm text-on-surface-variant">{item.label}</span>
                  </button>
                ))}
              </div>
              {searchQuery && (
                <button onClick={() => { navigate('/cve-explorer'); setShowSearch(false) }}
                  className="w-full mt-3 px-4 py-2.5 bg-primary/10 text-primary rounded-lg text-sm font-semibold hover:bg-primary/20 transition-colors text-left">
                  Search "{searchQuery}" in CVE Explorer →
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
