import { useState, useRef } from 'react'
import { TrendingUp, Loader2, RefreshCw, Sparkles, Download, BarChart3, Target, Lightbulb, Globe, Users, ChevronDown, ChevronUp, ArrowUpRight, ArrowDownRight, Minus, Copy, Check, Clock, Zap } from 'lucide-react'
import html2pdf from 'html2pdf.js'
import ToolLayout from '../../components/ToolLayout'
import { callGemini } from '../../config/gemini'

const presetIndustries = [
  'Artificial Intelligence', 'FinTech', 'HealthTech', 'E-commerce', 'Cybersecurity',
  'EdTech', 'SaaS', 'Blockchain / Web3', 'Electric Vehicles', 'Renewable Energy',
  'Cloud Computing', 'Gaming', 'Biotech', 'Robotics', 'Space Tech',
  'Social Media', 'Real Estate Tech', 'AgriTech', 'Quantum Computing', 'Creator Economy',
]

const depthOptions = [
  { id: 'quick', label: 'Quick Scan', desc: '~30 sec', tokens: 4096 },
  { id: 'standard', label: 'Standard Report', desc: '~1 min', tokens: 6144 },
  { id: 'deep', label: 'Deep Dive', desc: '~2 min', tokens: 8192 },
]

const regionOptions = ['Global', 'India', 'USA', 'Europe', 'Asia Pacific', 'Middle East & Africa']

function Section({ title, icon: Icon, color, id, children }) {
  const [open, setOpen] = useState(true)
  return (
    <div id={id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden print-section">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 cursor-pointer text-left">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}20` }}>
          <Icon className="w-4.5 h-4.5" style={{ color }} />
        </div>
        <span className="flex-1 text-sm font-bold text-white">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  )
}

function StatCard({ label, value, change, changeType }) {
  const colors = { up: 'text-green-400', down: 'text-red-400', neutral: 'text-gray-400' }
  const icons = { up: ArrowUpRight, down: ArrowDownRight, neutral: Minus }
  const ChangeIcon = icons[changeType] || icons.neutral

  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-xl font-bold text-white">{value}</p>
      {change && (
        <div className={`flex items-center gap-1 mt-1 text-xs ${colors[changeType] || colors.neutral}`}>
          <ChangeIcon className="w-3.5 h-3.5" />
          <span>{change}</span>
        </div>
      )}
    </div>
  )
}

function TrendCard({ trend, index }) {
  const [open, setOpen] = useState(index < 3)
  return (
    <div className="bg-gray-800/40 border border-gray-700/40 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 cursor-pointer text-left">
        <span className="w-7 h-7 rounded-lg bg-violet-600/20 text-violet-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white truncate">{trend.name}</h4>
          {trend.momentum && (
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
              trend.momentum === 'Rising' ? 'bg-green-500/15 text-green-400'
                : trend.momentum === 'Declining' ? 'bg-red-500/15 text-red-400'
                : 'bg-yellow-500/15 text-yellow-400'
            }`}>
              {trend.momentum}
            </span>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2">
          <p className="text-xs text-gray-300 leading-relaxed">{trend.description}</p>
          {trend.impact && (
            <div className="flex items-start gap-2">
              <Zap className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
              <span className="text-xs text-gray-400"><span className="text-amber-300 font-medium">Impact:</span> {trend.impact}</span>
            </div>
          )}
          {trend.keyPlayers?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {trend.keyPlayers.map((p, i) => (
                <span key={i} className="text-[10px] bg-gray-700/60 text-gray-400 px-2 py-0.5 rounded-md">{p}</span>
              ))}
            </div>
          )}
          {trend.timeframe && (
            <p className="text-[11px] text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" /> {trend.timeframe}</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function TrendAnalyst() {
  const [keyword, setKeyword] = useState('')
  const [depth, setDepth] = useState('standard')
  const [region, setRegion] = useState('Global')
  const [loading, setLoading] = useState(false)
  const [phase, setPhase] = useState('')
  const [report, setReport] = useState(null)
  const [copied, setCopied] = useState(false)
  const [exporting, setExporting] = useState(false)

  const reportRef = useRef(null)

  const depthObj = depthOptions.find(d => d.id === depth)

  async function handleGenerate(e) {
    e.preventDefault()
    if (!keyword.trim() || loading) return
    setLoading(true)
    setReport(null)

    const today = new Date().toISOString().split('T')[0]

    try {
      setPhase('Researching current trends...')
      const reply = await callGemini(
        `You are a world-class industry analyst and trends researcher. Generate a comprehensive trend analysis report for:

INDUSTRY / KEYWORD: ${keyword}
REGION FOCUS: ${region}
DEPTH: ${depthObj?.label}
DATE: ${today}

You MUST use your knowledge of the most current, real-world data and trends. Be specific with numbers, company names, and dates. Do NOT use placeholders.

Return a JSON object (no markdown, no code fences):
{
  "title": "Trend Analysis: ${keyword}",
  "subtitle": "Generated ${today} | ${region} Focus",
  "overview": {
    "summary": "3-4 sentence executive summary of the current state of this industry",
    "marketSize": "Current market size (e.g., $150B in 2025)",
    "growthRate": "CAGR or YoY growth (e.g., 24.5% CAGR)",
    "maturityStage": "Emerging / Growth / Mature / Declining",
    "outlook": "Bullish / Neutral / Bearish"
  },
  "keyStats": [
    { "label": "Market Size", "value": "$XXB", "change": "+XX% YoY", "changeType": "up" },
    { "label": "Active Companies", "value": "X,XXX+", "change": "+XX% from 2024", "changeType": "up" },
    { "label": "Total Funding (2025)", "value": "$XXB", "change": "description", "changeType": "up/down/neutral" },
    { "label": "Job Openings", "value": "XXK+", "change": "trend", "changeType": "up/down/neutral" }
  ],
  "topTrends": [
    {
      "name": "Trend name",
      "description": "Detailed 3-4 sentence description of this trend and why it matters",
      "momentum": "Rising / Stable / Declining",
      "impact": "High / Medium — explanation of business impact",
      "keyPlayers": ["Company1", "Company2", "Company3"],
      "timeframe": "Short-term (0-1yr) / Mid-term (1-3yr) / Long-term (3-5yr)"
    }
  ],
  "keyPlayers": [
    {
      "name": "Company Name",
      "role": "What they do in this space",
      "region": "HQ region",
      "notableMove": "Recent significant action or achievement"
    }
  ],
  "growthSignals": [
    {
      "signal": "Signal name",
      "description": "Why this indicates growth",
      "strength": "Strong / Moderate / Weak"
    }
  ],
  "risks": [
    {
      "risk": "Risk name",
      "severity": "High / Medium / Low",
      "description": "Brief explanation"
    }
  ],
  "predictions": [
    {
      "timeframe": "2025 / 2026 / 2027-2030",
      "prediction": "Specific prediction",
      "confidence": "High / Medium / Low"
    }
  ],
  "recommendations": [
    {
      "for": "Investors / Startups / Enterprises / Job Seekers",
      "action": "Specific actionable recommendation",
      "priority": "High / Medium / Low"
    }
  ],
  "sources": ["Source 1", "Source 2", "Source 3"]
}

Generate ${depth === 'quick' ? '5' : depth === 'deep' ? '10-12' : '7-8'} top trends, ${depth === 'quick' ? '4' : depth === 'deep' ? '10' : '6-8'} key players, ${depth === 'quick' ? '3' : depth === 'deep' ? '8' : '5'} growth signals, ${depth === 'quick' ? '3' : depth === 'deep' ? '6' : '4'} risks, ${depth === 'quick' ? '3' : depth === 'deep' ? '6' : '4'} predictions, and ${depth === 'quick' ? '3' : depth === 'deep' ? '8' : '5'} recommendations.
Use REAL data, REAL company names, and REAL numbers. This is a professional analyst report.`,
        {
          systemInstruction: 'You are a McKinsey-level industry analyst. Return only valid JSON. Use factual, real-world data. Be specific with numbers and names.',
          temperature: 0.5,
          maxTokens: depthObj?.tokens || 6144,
        }
      )

      const cleaned = reply.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
      setReport(JSON.parse(cleaned))
    } catch (err) {
      setReport({ error: err.message })
    }
    setLoading(false)
    setPhase('')
  }

  async function handleExportPDF() {
    if (!reportRef.current || exporting) return
    setExporting(true)

    try {
      const el = reportRef.current
      // Temporarily make all sections visible for PDF
      el.querySelectorAll('.print-section').forEach(s => s.style.breakInside = 'avoid')

      await html2pdf().set({
        margin: [10, 10, 10, 10],
        filename: `trend-report-${keyword.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#111827' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      }).from(el).save()
    } catch {
      // Silent
    }
    setExporting(false)
  }

  function handleCopyReport() {
    if (!report) return
    const text = [
      report.title,
      report.subtitle,
      '',
      '== OVERVIEW ==',
      report.overview?.summary,
      `Market Size: ${report.overview?.marketSize}`,
      `Growth: ${report.overview?.growthRate}`,
      `Outlook: ${report.overview?.outlook}`,
      '',
      '== TOP TRENDS ==',
      ...(report.topTrends || []).map((t, i) => `${i + 1}. ${t.name} [${t.momentum}]\n   ${t.description}`),
      '',
      '== KEY PLAYERS ==',
      ...(report.keyPlayers || []).map(p => `- ${p.name}: ${p.role} — ${p.notableMove}`),
      '',
      '== PREDICTIONS ==',
      ...(report.predictions || []).map(p => `[${p.timeframe}] ${p.prediction} (${p.confidence} confidence)`),
      '',
      '== RECOMMENDATIONS ==',
      ...(report.recommendations || []).map(r => `[${r.for}] ${r.action} (${r.priority} priority)`),
    ].join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const outlookColors = { Bullish: 'text-green-400 bg-green-500/15', Neutral: 'text-yellow-400 bg-yellow-500/15', Bearish: 'text-red-400 bg-red-500/15' }
  const stageColors = { Emerging: 'text-cyan-400 bg-cyan-500/15', Growth: 'text-green-400 bg-green-500/15', Mature: 'text-yellow-400 bg-yellow-500/15', Declining: 'text-red-400 bg-red-500/15' }

  return (
    <ToolLayout icon={TrendingUp} title="AI Trend Analyst" description="AI-powered industry trend analysis with real-time insights" color="#8b5cf6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Form */}
        <div className="space-y-4">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <label className="block text-sm font-medium text-gray-300 mb-2">Industry / Keyword *</label>
              <input
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="e.g., Artificial Intelligence, FinTech, Electric Vehicles..."
              />
            </div>

            {/* Quick picks */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <label className="block text-sm font-medium text-gray-300 mb-3">Quick Pick</label>
              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                {presetIndustries.map(ind => (
                  <button key={ind} type="button" onClick={() => setKeyword(ind)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer transition-colors ${
                      keyword === ind ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-500 hover:text-gray-300'
                    }`}>{ind}</button>
                ))}
              </div>
            </div>

            {/* Depth */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <label className="block text-sm font-medium text-gray-300 mb-3">Report Depth</label>
              <div className="space-y-2">
                {depthOptions.map(d => (
                  <button key={d.id} type="button" onClick={() => setDepth(d.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left cursor-pointer transition-all ${
                      depth === d.id
                        ? 'bg-violet-600/15 border border-violet-500/30 ring-1 ring-violet-500/20'
                        : 'bg-gray-800/50 border border-transparent hover:bg-gray-800'
                    }`}>
                    <span className={`text-sm font-medium ${depth === d.id ? 'text-violet-300' : 'text-gray-300'}`}>{d.label}</span>
                    <span className="text-[10px] text-gray-500">{d.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Region */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <label className="block text-sm font-medium text-gray-300 mb-3">Region Focus</label>
              <div className="flex flex-wrap gap-2">
                {regionOptions.map(r => (
                  <button key={r} type="button" onClick={() => setRegion(r)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                      region === r ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                    }`}>{r}</button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading || !keyword.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 cursor-pointer">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              {loading ? (phase || 'Analyzing...') : 'Analyze Trends'}
            </button>
          </form>
        </div>

        {/* Right: Report */}
        <div className="lg:col-span-2 space-y-4">
          {loading && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-center h-[30rem]">
              <div className="text-center">
                <Loader2 className="w-10 h-10 text-violet-400 animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-400">{phase || 'Generating trend report...'}</p>
                <p className="text-xs text-gray-600 mt-1">Analyzing {keyword} trends across {region}</p>
              </div>
            </div>
          )}

          {!loading && !report && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-center h-[30rem]">
              <div className="text-center text-gray-500 px-8">
                <TrendingUp className="w-16 h-16 mx-auto mb-3 text-gray-600" />
                <p className="text-sm">Your trend analysis report will appear here</p>
                <p className="text-xs text-gray-600 mt-2">Enter an industry or keyword to analyze market trends, key players & predictions</p>
                <div className="flex items-center justify-center gap-4 mt-5 text-xs text-gray-600">
                  <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" /> Key Stats</span>
                  <span className="flex items-center gap-1"><Target className="w-3 h-3" /> Trends</span>
                  <span className="flex items-center gap-1"><Lightbulb className="w-3 h-3" /> Predictions</span>
                  <span className="flex items-center gap-1"><Download className="w-3 h-3" /> Export PDF</span>
                </div>
              </div>
            </div>
          )}

          {report?.error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">{report.error}</div>
          )}

          {report && !report.error && (
            <>
              {/* Action bar */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-lg font-bold text-white">{report.title}</h2>
                  <p className="text-xs text-gray-500">{report.subtitle}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleCopyReport}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg cursor-pointer transition-colors">
                    {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied!' : 'Copy Text'}
                  </button>
                  <button onClick={handleExportPDF} disabled={exporting}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium rounded-lg cursor-pointer transition-colors disabled:opacity-50">
                    {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    {exporting ? 'Exporting...' : 'Export PDF'}
                  </button>
                  <button onClick={handleGenerate} disabled={loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg cursor-pointer transition-colors disabled:opacity-50">
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh
                  </button>
                </div>
              </div>

              {/* Report content */}
              <div ref={reportRef} className="space-y-4">
                {/* Overview */}
                <Section title="Overview" icon={Globe} color="#6366f1" id="sec-overview">
                  <div className="space-y-3">
                    <p className="text-sm text-gray-200 leading-relaxed">{report.overview?.summary}</p>
                    <div className="flex flex-wrap gap-3">
                      {report.overview?.marketSize && (
                        <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2">
                          <span className="text-[10px] text-gray-500 block">Market Size</span>
                          <span className="text-sm font-bold text-white">{report.overview.marketSize}</span>
                        </div>
                      )}
                      {report.overview?.growthRate && (
                        <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2">
                          <span className="text-[10px] text-gray-500 block">Growth Rate</span>
                          <span className="text-sm font-bold text-green-400">{report.overview.growthRate}</span>
                        </div>
                      )}
                      {report.overview?.maturityStage && (
                        <div className={`rounded-lg px-3 py-2 ${stageColors[report.overview.maturityStage] || 'bg-gray-800/50 text-gray-400'}`}>
                          <span className="text-[10px] block opacity-70">Stage</span>
                          <span className="text-sm font-bold">{report.overview.maturityStage}</span>
                        </div>
                      )}
                      {report.overview?.outlook && (
                        <div className={`rounded-lg px-3 py-2 ${outlookColors[report.overview.outlook] || 'bg-gray-800/50 text-gray-400'}`}>
                          <span className="text-[10px] block opacity-70">Outlook</span>
                          <span className="text-sm font-bold">{report.overview.outlook}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Section>

                {/* Key Stats */}
                {report.keyStats?.length > 0 && (
                  <Section title="Key Statistics" icon={BarChart3} color="#f59e0b" id="sec-stats">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {report.keyStats.map((stat, i) => (
                        <StatCard key={i} {...stat} />
                      ))}
                    </div>
                  </Section>
                )}

                {/* Top Trends */}
                {report.topTrends?.length > 0 && (
                  <Section title={`Top Trends (${report.topTrends.length})`} icon={TrendingUp} color="#8b5cf6" id="sec-trends">
                    <div className="space-y-2">
                      {report.topTrends.map((trend, i) => (
                        <TrendCard key={i} trend={trend} index={i} />
                      ))}
                    </div>
                  </Section>
                )}

                {/* Key Players */}
                {report.keyPlayers?.length > 0 && (
                  <Section title={`Key Players (${report.keyPlayers.length})`} icon={Users} color="#06b6d4" id="sec-players">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {report.keyPlayers.map((p, i) => (
                        <div key={i} className="bg-gray-800/40 border border-gray-700/40 rounded-xl p-3.5">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-semibold text-white">{p.name}</h4>
                            <span className="text-[10px] text-gray-500">{p.region}</span>
                          </div>
                          <p className="text-xs text-gray-400">{p.role}</p>
                          {p.notableMove && (
                            <p className="text-xs text-cyan-400/80 mt-1.5 flex items-start gap-1">
                              <Zap className="w-3 h-3 mt-0.5 flex-shrink-0" /> {p.notableMove}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </Section>
                )}

                {/* Growth Signals */}
                {report.growthSignals?.length > 0 && (
                  <Section title="Growth Signals" icon={Zap} color="#22c55e" id="sec-signals">
                    <div className="space-y-2">
                      {report.growthSignals.map((s, i) => (
                        <div key={i} className="flex items-start gap-3 bg-gray-800/30 rounded-lg px-4 py-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 flex-shrink-0 ${
                            s.strength === 'Strong' ? 'bg-green-500/15 text-green-400'
                              : s.strength === 'Moderate' ? 'bg-yellow-500/15 text-yellow-400'
                              : 'bg-gray-700 text-gray-400'
                          }`}>{s.strength}</span>
                          <div>
                            <h4 className="text-sm font-medium text-white">{s.signal}</h4>
                            <p className="text-xs text-gray-400 mt-0.5">{s.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Section>
                )}

                {/* Risks */}
                {report.risks?.length > 0 && (
                  <Section title="Risk Factors" icon={Target} color="#ef4444" id="sec-risks">
                    <div className="space-y-2">
                      {report.risks.map((r, i) => (
                        <div key={i} className="flex items-start gap-3 bg-gray-800/30 rounded-lg px-4 py-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 flex-shrink-0 ${
                            r.severity === 'High' ? 'bg-red-500/15 text-red-400'
                              : r.severity === 'Medium' ? 'bg-yellow-500/15 text-yellow-400'
                              : 'bg-gray-700 text-gray-400'
                          }`}>{r.severity}</span>
                          <div>
                            <h4 className="text-sm font-medium text-white">{r.risk}</h4>
                            <p className="text-xs text-gray-400 mt-0.5">{r.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Section>
                )}

                {/* Predictions */}
                {report.predictions?.length > 0 && (
                  <Section title="Future Predictions" icon={Lightbulb} color="#f97316" id="sec-predictions">
                    <div className="space-y-3">
                      {report.predictions.map((p, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="w-20 flex-shrink-0">
                            <span className="text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-1 rounded-lg block text-center">{p.timeframe}</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-200">{p.prediction}</p>
                            <span className={`text-[10px] mt-1 inline-block px-1.5 py-0.5 rounded-full ${
                              p.confidence === 'High' ? 'bg-green-500/15 text-green-400'
                                : p.confidence === 'Medium' ? 'bg-yellow-500/15 text-yellow-400'
                                : 'bg-gray-700 text-gray-400'
                            }`}>{p.confidence} confidence</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Section>
                )}

                {/* Recommendations */}
                {report.recommendations?.length > 0 && (
                  <Section title="Recommendations" icon={Sparkles} color="#ec4899" id="sec-recs">
                    <div className="space-y-2">
                      {report.recommendations.map((r, i) => (
                        <div key={i} className="bg-gray-800/40 border border-gray-700/40 rounded-xl p-3.5">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold bg-pink-500/15 text-pink-400 px-2 py-0.5 rounded-full">{r.for}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              r.priority === 'High' ? 'bg-red-500/15 text-red-400'
                                : r.priority === 'Medium' ? 'bg-yellow-500/15 text-yellow-400'
                                : 'bg-gray-700 text-gray-400'
                            }`}>{r.priority}</span>
                          </div>
                          <p className="text-sm text-gray-200">{r.action}</p>
                        </div>
                      ))}
                    </div>
                  </Section>
                )}

                {/* Sources */}
                {report.sources?.length > 0 && (
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <h3 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Sources & References</h3>
                    <div className="flex flex-wrap gap-2">
                      {report.sources.map((s, i) => (
                        <span key={i} className="text-[11px] bg-gray-800 text-gray-400 px-2.5 py-1 rounded-lg border border-gray-700">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </ToolLayout>
  )
}
