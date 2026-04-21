import { useState } from 'react'
import { ShieldAlert, Loader2, AlertTriangle, CheckCircle2, XCircle, HelpCircle, ChevronDown, ChevronUp, Copy, Check, RefreshCw, Sparkles, Eye, Brain, MessageSquare, Scale, Search, Flag, ThumbsUp, ThumbsDown, Info } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'
import { callGemini, parseGeminiJSON } from '../../config/gemini'

const sampleHeadlines = [
  'Scientists Discover New Planet Made Entirely of Diamond in Our Solar System',
  'Government Approves Free Laptops for All Students Starting Next Month',
  'WHO Declares New Pandemic After Mystery Virus Spreads to 50 Countries',
  'Elon Musk Buys Wikipedia for $10 Billion',
  'NASA Confirms Water Found on Mars Surface in Liquid Form',
  'India Becomes World\'s 3rd Largest Economy Overtaking Japan',
]

function ScoreMeter({ score }) {
  const getColor = (s) => {
    if (s >= 75) return { ring: '#22c55e', bg: '#22c55e15', text: 'text-green-400' }
    if (s >= 50) return { ring: '#eab308', bg: '#eab30815', text: 'text-yellow-400' }
    if (s >= 25) return { ring: '#f97316', bg: '#f9731615', text: 'text-orange-400' }
    return { ring: '#ef4444', bg: '#ef444415', text: 'text-red-400' }
  }
  const c = getColor(score)
  const circumference = 2 * Math.PI * 54
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" stroke="#1f2937" strokeWidth="8" fill="none" />
        <circle cx="60" cy="60" r="54" stroke={c.ring} strokeWidth="8" fill="none"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-black ${c.text}`}>{score}</span>
        <span className="text-[10px] text-gray-500 uppercase tracking-wider">/ 100</span>
      </div>
    </div>
  )
}

function VerdictBadge({ verdict }) {
  const config = {
    'Likely True': { icon: CheckCircle2, color: 'bg-green-500/15 text-green-400 border-green-500/30', iconColor: '#22c55e' },
    'Mostly True': { icon: CheckCircle2, color: 'bg-green-500/10 text-green-400/80 border-green-500/20', iconColor: '#22c55e' },
    'Uncertain': { icon: HelpCircle, color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', iconColor: '#eab308' },
    'Misleading': { icon: AlertTriangle, color: 'bg-orange-500/15 text-orange-400 border-orange-500/30', iconColor: '#f97316' },
    'Likely False': { icon: XCircle, color: 'bg-red-500/15 text-red-400 border-red-500/30', iconColor: '#ef4444' },
    'False': { icon: XCircle, color: 'bg-red-500/20 text-red-400 border-red-500/40', iconColor: '#ef4444' },
  }
  const c = config[verdict] || config['Uncertain']
  const Icon = c.icon

  return (
    <div className={`flex items-center gap-2.5 px-5 py-3 rounded-xl border ${c.color}`}>
      <Icon className="w-6 h-6" style={{ color: c.iconColor }} />
      <div>
        <span className="text-lg font-bold block">{verdict}</span>
        <span className="text-[10px] opacity-70 uppercase tracking-wider">AI Verdict</span>
      </div>
    </div>
  )
}

function AnalysisBar({ label, score, icon: Icon }) {
  const getColor = (s) => {
    if (s >= 75) return 'bg-green-500'
    if (s >= 50) return 'bg-yellow-500'
    if (s >= 25) return 'bg-orange-500'
    return 'bg-red-500'
  }
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400 flex items-center gap-1.5">
          {Icon && <Icon className="w-3.5 h-3.5" />} {label}
        </span>
        <span className="text-xs font-bold text-white">{score}/100</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${getColor(score)} transition-all duration-1000 ease-out`} style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}

function ExpandCard({ title, icon: Icon, color, defaultOpen, children }) {
  const [open, setOpen] = useState(defaultOpen ?? false)
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center gap-3 px-5 py-3.5 cursor-pointer text-left">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}20` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <span className="flex-1 text-sm font-semibold text-white">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  )
}

export default function FakeNewsDetector() {
  const [text, setText] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [phase, setPhase] = useState('')
  const [result, setResult] = useState(null)
  const [copied, setCopied] = useState(false)
  const [history, setHistory] = useState([])

  async function handleAnalyze(e) {
    e.preventDefault()
    if (!text.trim() || loading) return
    setLoading(true)
    setResult(null)

    try {
      setPhase('Analyzing credibility signals...')
      const reply = await callGemini(
        `You are an expert fact-checker and media literacy analyst. Analyze the following news text for credibility.

NEWS TEXT:
"${text}"
${sourceUrl ? `\nSOURCE URL: ${sourceUrl}` : ''}

Perform a thorough multi-dimensional analysis. Return a JSON object (no markdown, no code fences):
{
  "credibilityScore": 72,
  "verdict": "Likely True / Mostly True / Uncertain / Misleading / Likely False / False",
  "verdictExplanation": "2-3 sentence explanation of why this verdict was reached",
  "summary": "1 paragraph summary of what the article claims",
  "scores": {
    "factualAccuracy": { "score": 75, "explanation": "Assessment of factual claims" },
    "sourceReliability": { "score": 60, "explanation": "Assessment of the source" },
    "languageBias": { "score": 80, "explanation": "Assessment of neutral vs biased language" },
    "logicalCoherence": { "score": 70, "explanation": "Assessment of logical consistency" },
    "emotionalManipulation": { "score": 65, "explanation": "Assessment of emotional language use" },
    "evidenceQuality": { "score": 55, "explanation": "Assessment of supporting evidence" }
  },
  "redFlags": [
    { "flag": "Red flag name", "severity": "High / Medium / Low", "description": "Explanation" }
  ],
  "greenFlags": [
    { "flag": "Green flag name", "description": "Why this is a positive credibility signal" }
  ],
  "logicalFallacies": [
    { "fallacy": "Fallacy name", "example": "Specific text example", "explanation": "Why this is a fallacy" }
  ],
  "emotionalLanguage": [
    { "phrase": "The exact phrase", "type": "Fear / Anger / Urgency / Sensationalism / Appeal to Authority", "impact": "How it affects reader perception" }
  ],
  "factChecks": [
    { "claim": "Specific claim from the text", "assessment": "Verified / Unverified / False / Misleading / Needs Context", "detail": "Explanation with context" }
  ],
  "sourceAnalysis": {
    "identifiedSource": "Source name if detectable",
    "reliability": "High / Medium / Low / Unknown",
    "knownBias": "Left / Center-Left / Center / Center-Right / Right / Unknown",
    "notes": "Additional notes about the source"
  },
  "recommendations": [
    "What the reader should do to verify this information"
  ],
  "similarVerifiedStories": [
    { "title": "Real verified story that's similar", "source": "Reliable source name", "matches": true }
  ]
}

Be objective and thorough. Score 0-100 for each dimension (100 = most credible). The overall credibilityScore should be a weighted average.`,
        {
          systemInstruction: 'You are a senior fact-checker at a major news organization. Be thorough, objective, and specific. Return only valid JSON.',
          temperature: 0.3,
          maxTokens: 8192,
        }
      )
      const parsed = parseGeminiJSON(reply)
      setResult(parsed)

      setHistory(prev => [{
        text: text.slice(0, 80) + (text.length > 80 ? '...' : ''),
        score: parsed.credibilityScore,
        verdict: parsed.verdict,
        time: new Date(),
      }, ...prev.slice(0, 9)])
    } catch (err) {
      setResult({ error: err.message })
    }
    setLoading(false)
    setPhase('')
  }

  function handleCopy() {
    if (!result) return
    const text = [
      `Credibility Score: ${result.credibilityScore}/100`,
      `Verdict: ${result.verdict}`,
      result.verdictExplanation,
      '',
      '== SCORES ==',
      ...Object.entries(result.scores || {}).map(([k, v]) => `${k}: ${v.score}/100 — ${v.explanation}`),
      '',
      '== RED FLAGS ==',
      ...(result.redFlags || []).map(f => `[${f.severity}] ${f.flag}: ${f.description}`),
      '',
      '== FACT CHECKS ==',
      ...(result.factChecks || []).map(f => `[${f.assessment}] ${f.claim}: ${f.detail}`),
    ].join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const scores = result?.scores || {}
  const scoreEntries = [
    { key: 'factualAccuracy', label: 'Factual Accuracy', icon: CheckCircle2 },
    { key: 'sourceReliability', label: 'Source Reliability', icon: Search },
    { key: 'languageBias', label: 'Language Neutrality', icon: Scale },
    { key: 'logicalCoherence', label: 'Logical Coherence', icon: Brain },
    { key: 'emotionalManipulation', label: 'Emotional Neutrality', icon: MessageSquare },
    { key: 'evidenceQuality', label: 'Evidence Quality', icon: Eye },
  ]

  return (
    <ToolLayout icon={ShieldAlert} title="Fake News Detector" description="AI-powered credibility analysis for news articles & headlines" color="#ef4444">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Input */}
        <div className="space-y-4">
          <form onSubmit={handleAnalyze} className="space-y-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <label className="block text-sm font-medium text-gray-300 mb-2">News Headline or Article *</label>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                rows={7}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                placeholder="Paste a news headline, article excerpt, or social media post to analyze..."
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-gray-600">{text.length} characters</span>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <label className="block text-sm font-medium text-gray-300 mb-2">Source URL <span className="text-xs text-gray-500">(optional)</span></label>
              <input
                value={sourceUrl}
                onChange={e => setSourceUrl(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                placeholder="https://example.com/article"
              />
            </div>

            {/* Sample headlines */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <label className="block text-sm font-medium text-gray-300 mb-3">Try a Sample</label>
              <div className="space-y-1.5 max-h-44 overflow-y-auto">
                {sampleHeadlines.map((h, i) => (
                  <button key={i} type="button" onClick={() => setText(h)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
                      text === h ? 'bg-red-600/15 text-red-300 border border-red-500/20' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-300'
                    }`}>
                    "{h}"
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading || !text.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 cursor-pointer">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldAlert className="w-5 h-5" />}
              {loading ? (phase || 'Analyzing...') : 'Analyze Credibility'}
            </button>
          </form>

          {/* History */}
          {history.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">Recent Checks</h3>
              <div className="space-y-2">
                {history.map((h, i) => {
                  const scoreColor = h.score >= 60 ? 'text-green-400' : h.score >= 40 ? 'text-yellow-400' : 'text-red-400'
                  return (
                    <div key={i} className="bg-gray-800/50 rounded-lg px-3 py-2 flex items-center gap-2">
                      <span className={`text-sm font-bold ${scoreColor} w-8`}>{h.score}</span>
                      <span className="text-xs text-gray-400 flex-1 truncate">{h.text}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: Results */}
        <div className="lg:col-span-2 space-y-4">
          {loading && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-center h-[30rem]">
              <div className="text-center">
                <Loader2 className="w-10 h-10 text-red-400 animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-400">{phase || 'Running credibility analysis...'}</p>
                <p className="text-xs text-gray-600 mt-1">Checking facts, language bias, logical fallacies & source reliability</p>
              </div>
            </div>
          )}

          {!loading && !result && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-center h-[30rem]">
              <div className="text-center text-gray-500 px-8">
                <ShieldAlert className="w-16 h-16 mx-auto mb-3 text-gray-600" />
                <p className="text-sm">Paste a news article or headline to check its credibility</p>
                <p className="text-xs text-gray-600 mt-2">Get a detailed AI analysis with fact-checks, bias detection & credibility scoring</p>
                <div className="flex items-center justify-center gap-4 mt-5 text-xs text-gray-600">
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Fact Check</span>
                  <span className="flex items-center gap-1"><Brain className="w-3 h-3" /> Logic Analysis</span>
                  <span className="flex items-center gap-1"><Scale className="w-3 h-3" /> Bias Detection</span>
                </div>
              </div>
            </div>
          )}

          {result?.error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">{result.error}</div>
          )}

          {result && !result.error && (
            <>
              {/* Score + Verdict hero */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Credibility Analysis</h2>
                  <div className="flex gap-2">
                    <button onClick={handleCopy}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg cursor-pointer transition-colors">
                      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <button onClick={handleAnalyze} disabled={loading}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg cursor-pointer transition-colors disabled:opacity-50">
                      <RefreshCw className="w-3.5 h-3.5" /> Re-analyze
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
                  {/* Score ring */}
                  <div className="flex justify-center">
                    <ScoreMeter score={result.credibilityScore} />
                  </div>

                  {/* Verdict */}
                  <div className="flex flex-col items-center gap-3 sm:col-span-2">
                    <VerdictBadge verdict={result.verdict} />
                    <p className="text-sm text-gray-300 leading-relaxed text-center">{result.verdictExplanation}</p>
                  </div>
                </div>

                {/* Summary */}
                {result.summary && (
                  <div className="mt-5 pt-5 border-t border-gray-800">
                    <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-medium">Claim Summary</p>
                    <p className="text-sm text-gray-300 leading-relaxed">{result.summary}</p>
                  </div>
                )}
              </div>

              {/* Dimension scores */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-white mb-4">Credibility Dimensions</h3>
                <div className="space-y-4">
                  {scoreEntries.map(({ key, label, icon }) => (
                    scores[key] && (
                      <div key={key}>
                        <AnalysisBar label={label} score={scores[key].score} icon={icon} />
                        <p className="text-[11px] text-gray-500 mt-1 pl-5">{scores[key].explanation}</p>
                      </div>
                    )
                  ))}
                </div>
              </div>

              {/* Red Flags + Green Flags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {result.redFlags?.length > 0 && (
                  <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2"><Flag className="w-4 h-4" /> Red Flags ({result.redFlags.length})</h3>
                    <div className="space-y-2">
                      {result.redFlags.map((f, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className={`text-[9px] font-bold mt-0.5 px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                            f.severity === 'High' ? 'bg-red-500/20 text-red-400'
                              : f.severity === 'Medium' ? 'bg-orange-500/20 text-orange-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}>{f.severity}</span>
                          <div>
                            <span className="text-xs font-medium text-red-300">{f.flag}</span>
                            <p className="text-[11px] text-gray-500">{f.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.greenFlags?.length > 0 && (
                  <div className="bg-green-500/5 border border-green-500/15 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-2"><ThumbsUp className="w-4 h-4" /> Green Flags ({result.greenFlags.length})</h3>
                    <div className="space-y-2">
                      {result.greenFlags.map((f, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-xs font-medium text-green-300">{f.flag}</span>
                            <p className="text-[11px] text-gray-500">{f.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Fact Checks */}
              {result.factChecks?.length > 0 && (
                <ExpandCard title={`Fact Checks (${result.factChecks.length})`} icon={CheckCircle2} color="#22c55e" defaultOpen>
                  <div className="space-y-3">
                    {result.factChecks.map((f, i) => {
                      const colors = {
                        Verified: 'bg-green-500/15 text-green-400',
                        Unverified: 'bg-yellow-500/15 text-yellow-400',
                        False: 'bg-red-500/15 text-red-400',
                        Misleading: 'bg-orange-500/15 text-orange-400',
                        'Needs Context': 'bg-blue-500/15 text-blue-400',
                      }
                      return (
                        <div key={i} className="bg-gray-800/40 border border-gray-700/40 rounded-lg p-3">
                          <div className="flex items-start gap-2 mb-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${colors[f.assessment] || colors.Unverified}`}>
                              {f.assessment}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-gray-200 mb-1">"{f.claim}"</p>
                          <p className="text-[11px] text-gray-400">{f.detail}</p>
                        </div>
                      )
                    })}
                  </div>
                </ExpandCard>
              )}

              {/* Logical Fallacies */}
              {result.logicalFallacies?.length > 0 && (
                <ExpandCard title={`Logical Fallacies (${result.logicalFallacies.length})`} icon={Brain} color="#f97316">
                  <div className="space-y-3">
                    {result.logicalFallacies.map((f, i) => (
                      <div key={i} className="bg-gray-800/40 border border-gray-700/40 rounded-lg p-3">
                        <h4 className="text-xs font-semibold text-orange-300">{f.fallacy}</h4>
                        {f.example && <p className="text-[11px] text-gray-300 italic mt-1">"{f.example}"</p>}
                        <p className="text-[11px] text-gray-500 mt-1">{f.explanation}</p>
                      </div>
                    ))}
                  </div>
                </ExpandCard>
              )}

              {/* Emotional Language */}
              {result.emotionalLanguage?.length > 0 && (
                <ExpandCard title={`Emotional Language (${result.emotionalLanguage.length})`} icon={MessageSquare} color="#ec4899">
                  <div className="space-y-2">
                    {result.emotionalLanguage.map((e, i) => (
                      <div key={i} className="flex items-start gap-2 bg-gray-800/30 rounded-lg px-3 py-2.5">
                        <span className="text-[10px] font-bold bg-pink-500/15 text-pink-400 px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5">{e.type}</span>
                        <div>
                          <p className="text-xs text-gray-200">"{e.phrase}"</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">{e.impact}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ExpandCard>
              )}

              {/* Source Analysis */}
              {result.sourceAnalysis && (
                <ExpandCard title="Source Analysis" icon={Search} color="#06b6d4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Source', value: result.sourceAnalysis.identifiedSource || 'Unknown' },
                      { label: 'Reliability', value: result.sourceAnalysis.reliability },
                      { label: 'Known Bias', value: result.sourceAnalysis.knownBias },
                    ].map((item, i) => (
                      <div key={i} className="bg-gray-800/40 rounded-lg px-3 py-2.5">
                        <span className="text-[10px] text-gray-500 block">{item.label}</span>
                        <span className="text-sm font-medium text-white">{item.value || 'N/A'}</span>
                      </div>
                    ))}
                  </div>
                  {result.sourceAnalysis.notes && (
                    <p className="text-xs text-gray-400 mt-3 leading-relaxed">{result.sourceAnalysis.notes}</p>
                  )}
                </ExpandCard>
              )}

              {/* Verified Similar Stories */}
              {result.similarVerifiedStories?.length > 0 && (
                <ExpandCard title="Similar Verified Stories" icon={Sparkles} color="#8b5cf6">
                  <div className="space-y-2">
                    {result.similarVerifiedStories.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 bg-gray-800/40 rounded-lg px-3 py-2.5">
                        {s.matches ? <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" /> : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-200 truncate">{s.title}</p>
                          <span className="text-[10px] text-gray-500">{s.source}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ExpandCard>
              )}

              {/* Recommendations */}
              {result.recommendations?.length > 0 && (
                <div className="bg-violet-500/5 border border-violet-500/15 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-violet-400 mb-3 flex items-center gap-2"><Info className="w-4 h-4" /> What You Should Do</h3>
                  <div className="space-y-2">
                    {result.recommendations.map((r, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-violet-600/20 text-violet-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                        <p className="text-xs text-gray-300 leading-relaxed">{r}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ToolLayout>
  )
}
