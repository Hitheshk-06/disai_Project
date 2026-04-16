import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import SBOMManagerPage from './pages/SBOMManagerPage'
import CVEExplorerPage from './pages/CVEExplorerPage'
import VulnerabilityGraphPage from './pages/VulnerabilityGraphPage'
import RiskAnalyticsPage from './pages/RiskAnalyticsPage'
import ApplicationsPage from './pages/ApplicationsPage'
import SettingsPage from './pages/SettingsPage'
import { api, type User } from './lib/api'

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      api.auth.me()
        .then(u => setUser(u))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const handleLogin = (token: string, u: User) => {
    localStorage.setItem('token', token)
    setUser(u)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
      </div>
    )
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <Layout onLogout={handleLogout} user={user}>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/sbom-manager" element={<SBOMManagerPage />} />
        <Route path="/cve-explorer" element={<CVEExplorerPage />} />
        <Route path="/vulnerability-graph" element={<VulnerabilityGraphPage />} />
        <Route path="/risk-analytics" element={<RiskAnalyticsPage />} />
        <Route path="/applications" element={<ApplicationsPage />} />
        <Route path="/settings" element={<SettingsPage user={user} onUserUpdate={setUser} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  )
}
