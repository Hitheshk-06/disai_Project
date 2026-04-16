import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'
import { api, type DashboardStats, type SeverityItem, type TopApp, type RecentCVE } from '../lib/api'

function AnimCounter({ target, duration = 1200 }: { target: number; duration?: number }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let start = 0; const step = target / (duration / 16)
    const id = setInterval(() => { start += step; if (start >= target) { setVal(target); clearInterval(id) } else setVal(Math.floor(start)) }, 16)
    return () => clearInterval(id)
  }, [target, duration])
  return <>{val.toFixed(target % 1 !== 0 ? 1 : 0)}</>
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({ totalApps: 0, totalCVEs: 0, criticalVulns: 0, overallRiskScore: 0 })
  const [severity, setSeverity] = useState<SeverityItem[]>([])
  const [topApps, setTopApps] = useState<TopApp[]>([])
  const [recentCVEs, setRecentCVEs] = useState<RecentCVE[]>([])

  useEffect(() => {
    api.dashboard.stats().then(setStats).catch(console.error)
    api.dashboard.severityBreakdown().then(setSeverity).catch(console.error)
    api.dashboard.topVulnerableApps().then(setTopApps).catch(console.error)
    api.dashboard.recentCVEs().then(setRecentCVEs).catch(console.error)
  }, [])

  const gaugeScore = stats.overallRiskScore
  const gaugeAngle = (gaugeScore / 10) * 180
  const gaugeColor = gaugeScore >= 7 ? '#EA4335' : gaugeScore >= 4 ? '#FBBC04' : '#34A853'

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Applications Scanned', value: stats.totalApps, icon: 'apps', color: 'from-primary/20 to-primary/5', iconColor: 'text-primary', borderColor: 'border-primary/20' },
          { label: 'Total CVEs Detected', value: stats.totalCVEs, icon: 'bug_report', color: 'from-danger/20 to-danger/5', iconColor: 'text-danger', borderColor: 'border-danger/20' },
          { label: 'Critical Vulnerabilities', value: stats.criticalVulns, icon: 'local_fire_department', color: 'from-[#7f1d1d]/30 to-[#7f1d1d]/5', iconColor: 'text-danger', borderColor: 'border-danger/30' },
          { label: 'Overall Risk Score', value: stats.overallRiskScore, icon: 'speed', color: 'from-warning/20 to-warning/5', iconColor: 'text-warning', borderColor: 'border-warning/20', isFloat: true },
        ].map((stat, i) => (
          <div key={i} className={`bg-gradient-to-br ${stat.color} rounded-xl p-5 border ${stat.borderColor} animate-fade-in group hover:scale-[1.02] transition-transform`} style={{ animationDelay: `${i * 100}ms` }}>
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{stat.label}</span>
              <div className={`p-2 rounded-lg bg-surface-container/50 ${stat.iconColor}`}>
                <span className="material-symbols-outlined text-lg">{stat.icon}</span>
              </div>
            </div>
            <div className="text-3xl font-extrabold text-on-surface">
              <AnimCounter target={stat.value} />
            </div>
          </div>
        ))}
      </div>

      {/* Gauge + Donut Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-surface-container rounded-xl p-6 border border-outline-variant/10">
          <h3 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-sm">speed</span>
            Overall Vulnerability Score
          </h3>
          <div className="flex items-center justify-center py-4">
            <svg width="280" height="160" viewBox="0 0 280 160">
              <path d="M 30 150 A 110 110 0 0 1 250 150" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="20" strokeLinecap="round" />
              <path d="M 30 150 A 110 110 0 0 1 86 52" fill="none" stroke="rgba(52,168,83,0.3)" strokeWidth="20" strokeLinecap="round" />
              <path d="M 86 52 A 110 110 0 0 1 194 52" fill="none" stroke="rgba(251,188,4,0.3)" strokeWidth="20" strokeLinecap="round" />
              <path d="M 194 52 A 110 110 0 0 1 250 150" fill="none" stroke="rgba(234,67,53,0.3)" strokeWidth="20" strokeLinecap="round" />
              <line x1="140" y1="150"
                x2={140 + 90 * Math.cos((Math.PI / 180) * (180 + gaugeAngle))}
                y2={150 + 90 * Math.sin((Math.PI / 180) * (180 + gaugeAngle))}
                stroke={gaugeColor} strokeWidth="3" strokeLinecap="round"
                style={{ transition: 'all 1.5s cubic-bezier(0.16,1,0.3,1)' }} />
              <circle cx="140" cy="150" r="6" fill={gaugeColor} />
              <text x="140" y="130" textAnchor="middle" fill="white" fontSize="32" fontWeight="800">{gaugeScore}</text>
              <text x="140" y="148" textAnchor="middle" fill="#8b909f" fontSize="11">/10.0 CVSS</text>
              <text x="35" y="160" fill="#34A853" fontSize="9" fontWeight="600">0</text>
              <text x="133" y="28" fill="#FBBC04" fontSize="9" fontWeight="600">5</text>
              <text x="245" y="160" fill="#EA4335" fontSize="9" fontWeight="600">10</text>
            </svg>
          </div>
        </div>

        <div className="lg:col-span-2 bg-surface-container rounded-xl p-6 border border-outline-variant/10">
          <h3 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-warning text-sm">donut_large</span>
            Severity Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={severity} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value" animationBegin={200} animationDuration={1200}>
                {severity.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
              </Pie>
              <Tooltip contentStyle={{ background: '#171f33', border: '1px solid #414754', borderRadius: '8px', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            {severity.map(s => (
              <div key={s.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }}></span>
                <span className="text-[10px] font-semibold text-on-surface-variant">{s.name} ({s.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bar chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-container rounded-xl p-6 border border-outline-variant/10">
          <h3 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-danger text-sm">warning</span>
            Top 5 Most Vulnerable Applications
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topApps} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" domain={[0, 10]} tick={{ fill: '#8b909f', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#c1c6d6', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} width={120} />
              <Tooltip contentStyle={{ background: '#171f33', border: '1px solid #414754', borderRadius: '8px', fontSize: '12px' }} />
              <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={20}>
                {topApps.map((entry, i) => (<Cell key={i} fill={entry.fill} />))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-surface-container rounded-xl p-6 border border-outline-variant/10">
          <h3 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary-blue text-sm">dynamic_feed</span>
            Recent CVE Activity
          </h3>
          <div className="space-y-3 max-h-[240px] overflow-y-auto pr-2">
            {recentCVEs.map((cve, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-surface-container-low hover:bg-surface-container-high transition-colors animate-slide-in" style={{ animationDelay: `${i * 80}ms` }}>
                <div className={`w-2 h-2 rounded-full shrink-0 ${cve.severity === 'CRITICAL' ? 'bg-danger animate-pulse-glow' : cve.severity === 'HIGH' ? 'bg-warning' : cve.severity === 'MEDIUM' ? 'bg-primary' : 'bg-secondary'}`}></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-on-surface">{cve.id}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${cve.severity === 'CRITICAL' ? 'bg-danger/20 text-danger' : cve.severity === 'HIGH' ? 'bg-warning/20 text-warning' : cve.severity === 'MEDIUM' ? 'bg-primary/20 text-primary' : 'bg-secondary/20 text-secondary'}`}>
                      {cve.severity}
                    </span>
                  </div>
                  <p className="text-[10px] text-outline truncate">{cve.product} — {cve.vendor}</p>
                </div>
                <span className="text-xs font-bold text-on-surface-variant">{cve.cvssScore}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
