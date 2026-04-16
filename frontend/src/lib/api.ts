const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

function getToken(): string | null {
  return localStorage.getItem('token')
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || 'Request failed')
  }
  return res.json()
}

// ─── Auth ─────────────────────────────────────────
export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    register: (data: { name: string; email: string; password: string; organization?: string }) =>
      request<{ token: string; user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    me: () => request<User>('/auth/me'),
    updateProfile: (data: Partial<User>) =>
      request<User>('/auth/me', { method: 'PUT', body: JSON.stringify(data) }),
    changePassword: (currentPassword: string, newPassword: string) =>
      request('/auth/password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) }),
  },

  dashboard: {
    stats: () => request<DashboardStats>('/dashboard/stats'),
    severityBreakdown: () => request<SeverityItem[]>('/dashboard/severity-breakdown'),
    topVulnerableApps: () => request<TopApp[]>('/dashboard/top-vulnerable-apps'),
    recentCVEs: () => request<RecentCVE[]>('/dashboard/recent-cves'),
    trendData: () => request<TrendRow[]>('/dashboard/trend-data'),
  },

  applications: {
    list: () => request<Application[]>('/applications'),
    get: (id: number) => request<Application>(`/applications/${id}`),
    create: (data: { name: string; version: string; description?: string }) =>
      request<Application>('/applications', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Application>) =>
      request<Application>(`/applications/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request(`/applications/${id}`, { method: 'DELETE' }),
  },

  cves: {
    list: (params?: { search?: string; severity?: string; minScore?: number; maxScore?: number }) => {
      const qs = new URLSearchParams()
      if (params?.search) qs.set('search', params.search)
      if (params?.severity) qs.set('severity', params.severity)
      if (params?.minScore !== undefined) qs.set('minScore', String(params.minScore))
      if (params?.maxScore !== undefined) qs.set('maxScore', String(params.maxScore))
      return request<CVERecord[]>(`/cves?${qs}`)
    },
    get: (id: string) => request<CVERecord>(`/cves/${id}`),
  },

  sbom: {
    components: (app?: string) => {
      const qs = app ? `?app=${encodeURIComponent(app)}` : ''
      return request<SBOMComponent[]>(`/sbom/components${qs}`)
    },
    upload: (file: File, appName: string) => {
      const token = getToken()
      const form = new FormData()
      form.append('sbom', file)
      form.append('appName', appName)
      return fetch(`${BASE_URL}/sbom/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      }).then(r => r.json())
    },
    deleteComponent: (id: number) => request(`/sbom/components/${id}`, { method: 'DELETE' }),
  },

  graph: {
    data: () => request<GraphData>('/graph'),
  },

  analytics: {
    scorecard: () => request<ScorecardRow[]>('/analytics/scorecard'),
    heatmap: () => request<HeatmapRow[]>('/analytics/heatmap'),
    trends: () => request<TrendRow[]>('/analytics/trends'),
  },

  settings: {
    apiKeys: () => request<APIKey[]>('/settings/api-keys'),
    createApiKey: (name: string, scope: string) =>
      request<APIKey & { rawKey: string }>('/settings/api-keys', {
        method: 'POST',
        body: JSON.stringify({ name, scope }),
      }),
    deleteApiKey: (id: string) => request(`/settings/api-keys/${id}`, { method: 'DELETE' }),
    integrations: () => request<Integration[]>('/settings/integrations'),
    toggleIntegration: (id: string) =>
      request<Integration>(`/settings/integrations/${id}/toggle`, { method: 'POST' }),
  },
}

// ─── Types ────────────────────────────────────────
export interface User {
  id: string; name: string; email: string; role: string; organization: string; nvd_api_key?: string
}
export interface DashboardStats {
  totalApps: number; totalCVEs: number; criticalVulns: number; overallRiskScore: number
}
export interface SeverityItem { name: string; value: number; color: string }
export interface TopApp { name: string; score: number; fill: string }
export interface RecentCVE { id: string; severity: string; product: string; vendor: string; cvssScore: number }
export interface TrendRow { month: string; [app: string]: string | number }
export interface Application {
  id: number; name: string; version: string; description: string; components: number
  criticalCount: number; highCount: number; mediumCount: number; lowCount: number
  riskScore: number; lastScan: string; created: string
}
export interface CVERecord {
  id: string; description: string; cvssScore: number; severity: string
  vendor: string; product: string; version: string; published: string; vector: string
}
export interface SBOMComponent {
  id: number; appName: string; componentName: string; componentVersion: string; vendor: string
}
export interface GraphData {
  nodes: { id: string; type: 'application' | 'component' | 'cve'; label: string; riskScore: number }[]
  links: { source: string; target: string; type: string }[]
}
export interface ScorecardRow {
  name: string; components: number; totalCVEs: number; criticalCount: number
  highCount: number; mediumCount: number; lowCount: number; riskScore: number; trend: string
}
export interface HeatmapRow { app: string; critical: number; high: number; medium: number; low: number }
export interface APIKey {
  id: string; name: string; keyPreview: string; scope: string; createdAt: string; lastUsed: string
}
export interface Integration { id: string; name: string; desc: string; icon: string; connected: boolean }
