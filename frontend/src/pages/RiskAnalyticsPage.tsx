import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { api, type ScorecardRow, type HeatmapRow, type TrendRow } from '../lib/api'

const getHeatColor = (val: number, max: number) => {
  if (val === 0) return 'bg-surface-container-highest'
  const intensity = val / max
  if (intensity > 0.7) return 'bg-danger/70'
  if (intensity > 0.4) return 'bg-warning/50'
  if (intensity > 0.2) return 'bg-primary/40'
  return 'bg-primary/20'
}

const trendColors = ['#EA4335', '#FBBC04', '#1A73E8', '#34A853', '#ffb691']

export default function RiskAnalyticsPage() {
  const [scorecard, setScorecard] = useState<ScorecardRow[]>([])
  const [heatmapData, setHeatmapData] = useState<HeatmapRow[]>([])
  const [trendData, setTrendData] = useState<TrendRow[]>([])

  useEffect(() => {
    api.analytics.scorecard().then(setScorecard).catch(console.error)
    api.analytics.heatmap().then(setHeatmapData).catch(console.error)
    api.analytics.trends().then(setTrendData).catch(console.error)
  }, [])

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">Risk Analytics</h2>
          <p className="text-on-surface-variant text-sm mt-1">Vulnerability synthesis and predictive risk assessment across your application portfolio.</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-surface-container-high text-on-surface px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-surface-bright transition-colors border border-outline-variant/10">
            <span className="material-symbols-outlined text-sm">calendar_today</span>Last 30 Days
          </button>
          <button onClick={() => window.print()}
            className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:brightness-110 transition-all shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-sm">download</span>Export PDF
          </button>
        </div>
      </div>

      {/* Risk Scorecard Table */}
      <div className="bg-surface-container rounded-xl overflow-hidden border border-outline-variant/10">
        <div className="p-5 flex items-center justify-between">
          <h3 className="text-sm font-bold flex items-center gap-2"><span className="material-symbols-outlined text-primary text-sm">assessment</span>Enterprise Risk Scorecard</h3>
          <span className="bg-danger/15 text-danger text-[9px] uppercase tracking-widest font-bold px-2 py-1 rounded">High Priority</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-high/30">
                <th className="px-5 py-3 text-[10px] font-bold text-outline uppercase tracking-widest">Application</th>
                <th className="px-5 py-3 text-[10px] font-bold text-outline uppercase tracking-widest text-center">Components</th>
                <th className="px-5 py-3 text-[10px] font-bold text-outline uppercase tracking-widest text-center">CVEs</th>
                <th className="px-5 py-3 text-[10px] font-bold text-outline uppercase tracking-widest text-center">Critical</th>
                <th className="px-5 py-3 text-[10px] font-bold text-outline uppercase tracking-widest text-center">High</th>
                <th className="px-5 py-3 text-[10px] font-bold text-outline uppercase tracking-widest text-center">Medium</th>
                <th className="px-5 py-3 text-[10px] font-bold text-outline uppercase tracking-widest text-center">Low</th>
                <th className="px-5 py-3 text-[10px] font-bold text-outline uppercase tracking-widest text-center">Risk Score</th>
                <th className="px-5 py-3 text-[10px] font-bold text-outline uppercase tracking-widest text-center">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {scorecard.map((app, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${app.riskScore >= 8 ? 'bg-danger' : app.riskScore >= 6 ? 'bg-warning' : 'bg-secondary'}`}></div>
                      <span className="font-semibold text-sm">{app.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-center text-sm">{app.components}</td>
                  <td className="px-5 py-4 text-center text-sm font-semibold">{app.totalCVEs}</td>
                  <td className="px-5 py-4 text-center"><span className={`text-sm font-bold ${app.criticalCount > 0 ? 'text-danger' : 'text-outline'}`}>{app.criticalCount}</span></td>
                  <td className="px-5 py-4 text-center"><span className={`text-sm font-bold ${app.highCount > 0 ? 'text-warning' : 'text-outline'}`}>{app.highCount}</span></td>
                  <td className="px-5 py-4 text-center text-sm text-on-surface-variant">{app.mediumCount}</td>
                  <td className="px-5 py-4 text-center text-sm text-outline">{app.lowCount}</td>
                  <td className="px-5 py-4 text-center"><span className={`text-lg font-black ${app.riskScore >= 8 ? 'text-danger' : app.riskScore >= 6 ? 'text-warning' : 'text-secondary'}`}>{app.riskScore}</span></td>
                  <td className="px-5 py-4 text-center">
                    <span className={`material-symbols-outlined text-sm ${app.riskScore >= 8 ? 'text-danger' : app.riskScore >= 6 ? 'text-warning' : 'text-secondary'}`}>
                      {app.trend === 'up' ? 'trending_up' : 'trending_down'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <div className="bg-surface-container rounded-xl p-6 border border-outline-variant/10">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-warning text-sm">show_chart</span>Risk Score Trends</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <XAxis dataKey="month" tick={{ fill: '#8b909f', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 10]} tick={{ fill: '#8b909f', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#171f33', border: '1px solid #414754', borderRadius: '8px', fontSize: '11px' }} />
              {scorecard.map((app, i) => (
                <Line key={app.name} type="monotone" dataKey={app.name} stroke={trendColors[i]} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-3 justify-center">
            {scorecard.map((app, i) => (
              <div key={app.name} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: trendColors[i] }}></span>
                <span className="text-[10px] text-outline font-semibold">{app.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Heatmap */}
        <div className="bg-surface-container rounded-xl p-6 border border-outline-variant/10">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-danger text-sm">grid_on</span>Severity Heatmap</h3>
          <div className="space-y-1">
            <div className="grid grid-cols-5 gap-1 mb-2">
              <div></div>
              {['Critical', 'High', 'Medium', 'Low'].map(s => (
                <div key={s} className="text-center text-[9px] font-bold text-outline uppercase tracking-tighter">{s}</div>
              ))}
            </div>
            {heatmapData.map((row, i) => (
              <div key={i} className="grid grid-cols-5 gap-1">
                <div className="text-xs font-semibold py-2 truncate">{row.app}</div>
                {[row.critical, row.high, row.medium, row.low].map((val, j) => (
                  <div key={j} className={`h-10 rounded-md flex items-center justify-center text-xs font-bold ${getHeatColor(val, 18)} transition-colors hover:brightness-125`}>
                    {val > 0 && val}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4 justify-center">
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-surface-container-highest"></span><span className="text-[9px] text-outline">None</span></div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-primary/30"></span><span className="text-[9px] text-outline">Low</span></div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-warning/50"></span><span className="text-[9px] text-outline">Medium</span></div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-danger/70"></span><span className="text-[9px] text-outline">High</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}
