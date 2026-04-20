import { useState } from 'react'
import { ScanEye, Loader2, Bot, UserCheck, AlertTriangle, ShieldAlert, Sparkles, Trash2, Plus, Copy, Check, ChevronDown, ChevronUp, BarChart3, Filter, Download, RefreshCw, MessageSquare, AtSign } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'
import { callGemini } from '../../config/gemini'

const sampleComments = [
  'Wow amazing content! Check my profile for free iPhone giveaway 🎁🎁🎁',
  'Great post! I just made $5000 working from home click link in my bio 💰',
  'This is so beautiful! Love the colors and composition 😍',
  'Follow @earn_money_fast for daily crypto signals 🚀📈 DM me now!!!',
  'Haha this is hilarious, reminds me of what happened to me last week 😂',
  'I gained 10K followers in 2 days using this secret method! Link in bio 🔥',
  'Nice photo! What camera do you use?',
  '🔥🔥🔥🔥🔥🔥🔥🔥',
  'Send me a DM to collab babe 💋 I promote pages for free',
  'Congrats on the milestone! Well deserved 🎉',
]

const sampleBios = [
  '💰 Make $500/day | DM "START" | 18+ Only | Not Financial Advice | Link Below 👇',
  'Photography enthusiast | Dog mom 🐕 | Coffee addict ☕ | Based in Mumbai',
  '🤑 FOREX TRADER | 98% Win Rate | FREE Signals | Join VIP Group ⬇️',
  'Software Engineer @Google | Building cool stuff | Open source contributor',
]

const classColors = {
  spam: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30', dot: 'bg-red-400' },
  bot: { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30', dot: 'bg-orange-400' },
  suspicious: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/30', dot: 'bg-yellow-400' },
  genuine: { bg: 'bg-green-500/15', text: 'text-green-400', border: 'border-green-500/30', dot: 'bg-green-400' },
}

const classIcons = {
  spam: ShieldAlert,
  bot: Bot,
  suspicious: AlertTriangle,
  genuine: UserCheck,
}

function ConfidenceBar({ value }) {
  const color = value >= 80 ? 'bg-green-500' : value >= 60 ? 'bg-yellow-500' : value >= 40 ? 'bg-orange-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-[11px] text-gray-400 font-mono w-8 text-right">{value}%</span>
    </div>
  )
}

function ResultRow({ item, index, expanded, onToggle }) {
  const cls = classColors[item.classification] || classColors.suspicious
  const Icon = classIcons[item.classification] || AlertTriangle

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${cls.border} ${expanded ? cls.bg : 'bg-gray-900 border-gray-800 hover:border-gray-700'}`}>
      <button onClick={() => onToggle(index)}
        className="w-full flex items-center gap-3 px-4 py-3 cursor-pointer text-left">
        <span className="text-xs text-gray-500 font-mono w-6">{index + 1}</span>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${cls.bg}`}>
          <Icon className="w-3.5 h-3.5" style={{ color: cls.text.replace('text-', '').includes('red') ? '#f87171' : cls.text.includes('orange') ? '#fb923c' : cls.text.includes('yellow') ? '#facc15' : '#4ade80' }} />
        </div>
        <p className="flex-1 text-sm text-gray-200 truncate min-w-0">{item.text}</p>
        <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full flex-shrink-0 ${cls.bg} ${cls.text}`}>
          {item.classification}
        </span>
        <span className="text-xs text-gray-500 font-mono w-10 text-right flex-shrink-0">{item.confidence}%</span>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />}
      </button>
      {expanded && (
        <div className="px-4 pb-4 pt-0 space-y-3 ml-9">
          <div className="bg-gray-800/60 rounded-lg px-3 py-2.5">
            <p className="text-xs text-gray-300 leading-relaxed">{item.text}</p>
          </div>
          <div>
            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Confidence</span>
            <ConfidenceBar value={item.confidence} />
          </div>
          <div>
            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Reason</span>
            <p className="text-xs text-gray-400 leading-relaxed mt-1">{item.reason}</p>
          </div>
          {item.indicators?.length > 0 && (
            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Indicators Detected</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {item.indicators.map((ind, i) => (
                  <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full border ${cls.bg} ${cls.text} ${cls.border}`}>{ind}</span>
                ))}
              </div>
            </div>
          )}
          {item.recommendation && (
            <div className="flex items-start gap-2 bg-violet-500/5 border border-violet-500/15 rounded-lg px-3 py-2">
              <Sparkles className="w-3 h-3 text-violet-400 mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-gray-400">{item.recommendation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function SpamDetector() {
  const [mode, setMode] = useState('bulk') // 'single' | 'bulk' | 'bio'
  const [singleText, setSingleText] = useState('')
  const [bulkText, setBulkText] = useState('')
  const [bioText, setBioText] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])
  const [expandedRow, setExpandedRow] = useState(null)
  const [filterClass, setFilterClass] = useState('all')
  const [copied, setCopied] = useState(false)
  const [stats, setStats] = useState(null)

  function getInputTexts() {
    if (mode === 'single') return singleText.trim() ? [singleText.trim()] : []
    if (mode === 'bio') return bioText.trim() ? [bioText.trim()] : []
    // Bulk: split by newlines, filter empties
    return bulkText.split('\n').map(l => l.trim()).filter(Boolean)
  }

  async function handleAnalyze(e) {
    e.preventDefault()
    const texts = getInputTexts()
    if (!texts.length || loading) return
    setLoading(true)
    setResults([])
    setStats(null)
    setExpandedRow(null)

    const contentType = mode === 'bio' ? 'Instagram bio' : 'Instagram comment'
    const numbered = texts.map((t, i) => `${i + 1}. "${t}"`).join('\n')

    try {
      const reply = await callGemini(
        `You are an expert social media spam and deception analyst specializing in Instagram. Analyze each ${contentType} below and classify it.

${numbered}

For EACH item, return a classification. Return a JSON object (no markdown, no code fences):
{
  "results": [
    {
      "index": 0,
      "text": "The original text",
      "classification": "spam" | "bot" | "genuine" | "suspicious",
      "confidence": 85,
      "reason": "Detailed 2-3 sentence explanation of why this was classified this way",
      "indicators": ["indicator1", "indicator2"],
      "recommendation": "What the user should do about this comment"
    }
  ],
  "summary": {
    "total": ${texts.length},
    "spam": 0,
    "bot": 0,
    "suspicious": 0,
    "genuine": 0,
    "overallRisk": "High / Medium / Low",
    "insight": "1-2 sentence overall assessment"
  }
}

CLASSIFICATION GUIDE:
- **spam**: Promotional content, scam links, giveaway bait, "DM me" money schemes, crypto scams, link-in-bio promotions, MLM pitches, phishing attempts
- **bot**: Auto-generated generic comments, emoji-only spam, repetitive templated responses, follow-for-follow bots, engagement-pod patterns
- **suspicious**: Could be spam but ambiguous, slightly off-tone comments, subtle self-promotion, engagement-baiting without clear scam
- **genuine**: Real human interaction, authentic opinions, relevant questions, meaningful conversation

INDICATOR EXAMPLES: "contains link bait", "money/income claims", "excessive emojis", "generic praise", "urgency language", "follow request", "DM solicitation", "crypto/forex mention", "too-good-to-be-true claim", "emoji-only", "templated response", "authentic question", "personal anecdote", "relevant to content"

Be accurate and specific. Confidence 0-100 (100 = absolutely certain).`,
        {
          systemInstruction: 'You are an Instagram spam detection AI. Be thorough and accurate. Return only valid JSON.',
          temperature: 0.3,
          maxTokens: 6144,
        }
      )

      const cleaned = reply.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
      const parsed = JSON.parse(cleaned)
      setResults(parsed.results || [])
      setStats(parsed.summary || null)
      if (parsed.results?.length === 1) setExpandedRow(0)
    } catch (err) {
      setResults([{ text: 'Error', classification: 'suspicious', confidence: 0, reason: err.message, indicators: [], recommendation: 'Try again' }])
    }
    setLoading(false)
  }

  function loadSample(sample) {
    if (mode === 'bio') {
      setBioText(sample)
    } else if (mode === 'single') {
      setSingleText(sample)
    } else {
      setBulkText(prev => prev ? prev + '\n' + sample : sample)
    }
  }

  function handleCopyResults() {
    const text = results.map((r, i) =>
      `${i + 1}. [${r.classification.toUpperCase()}] (${r.confidence}%) ${r.text}\n   Reason: ${r.reason}`
    ).join('\n\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownloadCSV() {
    const header = 'Index,Text,Classification,Confidence,Reason,Indicators\n'
    const rows = results.map((r, i) =>
      `${i + 1},"${r.text.replace(/"/g, '""')}",${r.classification},${r.confidence},"${r.reason.replace(/"/g, '""')}","${(r.indicators || []).join('; ')}"`
    ).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `spam-analysis-${Date.now()}.csv`
    a.click()
  }

  const filtered = filterClass === 'all' ? results : results.filter(r => r.classification === filterClass)
  const samples = mode === 'bio' ? sampleBios : sampleComments

  return (
    <ToolLayout icon={ScanEye} title="Instagram Spam Detector" description="Detect spam, bots & deception in Instagram comments and bios" color="#e11d48">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Input */}
        <div className="space-y-4">
          <form onSubmit={handleAnalyze} className="space-y-4">
            {/* Mode toggle */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-1.5 flex gap-1">
              {[
                { id: 'bulk', label: 'Bulk Comments', icon: MessageSquare },
                { id: 'single', label: 'Single Comment', icon: MessageSquare },
                { id: 'bio', label: 'Bio Text', icon: AtSign },
              ].map(m => (
                <button key={m.id} type="button" onClick={() => setMode(m.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    mode === m.id ? 'bg-rose-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}>
                  <m.icon className="w-3.5 h-3.5" /> {m.label}
                </button>
              ))}
            </div>

            {/* Input area */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              {mode === 'single' && (
                <>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Comment Text</label>
                  <textarea
                    value={singleText}
                    onChange={e => setSingleText(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                    placeholder="Paste a single Instagram comment here..."
                  />
                </>
              )}
              {mode === 'bulk' && (
                <>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Bulk Comments <span className="text-xs text-gray-500">(one per line)</span>
                  </label>
                  <textarea
                    value={bulkText}
                    onChange={e => setBulkText(e.target.value)}
                    rows={8}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none font-mono"
                    placeholder={"Paste multiple comments, one per line:\nWow amazing! Check my profile 🎁\nGreat photo, love this!\nDM me for free followers 🔥"}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-gray-600">{getInputTexts().length} comments</span>
                    <button type="button" onClick={() => setBulkText('')}
                      className="text-[10px] text-gray-600 hover:text-red-400 cursor-pointer flex items-center gap-1">
                      <Trash2 className="w-3 h-3" /> Clear all
                    </button>
                  </div>
                </>
              )}
              {mode === 'bio' && (
                <>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Instagram Bio</label>
                  <textarea
                    value={bioText}
                    onChange={e => setBioText(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                    placeholder="💰 Make $500/day | DM 'START' | Link Below 👇"
                  />
                </>
              )}
            </div>

            {/* Sample data */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <label className="block text-sm font-medium text-gray-300 mb-3">Try Samples</label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {samples.map((s, i) => (
                  <button key={i} type="button" onClick={() => loadSample(s)}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-gray-400 hover:bg-gray-800 hover:text-gray-300 cursor-pointer transition-colors truncate">
                    <Plus className="w-3 h-3 inline mr-1.5 text-gray-600" />"{s}"
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading || !getInputTexts().length}
              className="w-full flex items-center justify-center gap-2 py-3 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 cursor-pointer">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ScanEye className="w-5 h-5" />}
              {loading ? 'Analyzing...' : `Analyze ${getInputTexts().length || ''} ${mode === 'bio' ? 'Bio' : getInputTexts().length === 1 ? 'Comment' : 'Comments'}`}
            </button>
          </form>
        </div>

        {/* Right: Results */}
        <div className="lg:col-span-2 space-y-4">
          {loading && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-center h-[28rem]">
              <div className="text-center">
                <Loader2 className="w-10 h-10 text-rose-400 animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-400">Scanning {getInputTexts().length} {mode === 'bio' ? 'bio' : 'comments'} for spam & deception...</p>
                <p className="text-xs text-gray-600 mt-1">Checking for bots, scams, manipulation & authenticity</p>
              </div>
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-center h-[28rem]">
              <div className="text-center text-gray-500 px-8">
                <ScanEye className="w-16 h-16 mx-auto mb-3 text-gray-600" />
                <p className="text-sm">Paste Instagram comments or a bio to analyze</p>
                <p className="text-xs text-gray-600 mt-2">Detects spam, bots, scams & deceptive patterns with AI</p>
                <div className="flex items-center justify-center gap-4 mt-5 text-xs text-gray-600">
                  <span className="flex items-center gap-1"><ShieldAlert className="w-3 h-3 text-red-400" /> Spam</span>
                  <span className="flex items-center gap-1"><Bot className="w-3 h-3 text-orange-400" /> Bot</span>
                  <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-yellow-400" /> Suspicious</span>
                  <span className="flex items-center gap-1"><UserCheck className="w-3 h-3 text-green-400" /> Genuine</span>
                </div>
              </div>
            </div>
          )}

          {results.length > 0 && (
            <>
              {/* Stats summary */}
              {stats && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-rose-400" /> Analysis Summary
                    </h3>
                    <div className="flex gap-2">
                      <button onClick={handleCopyResults}
                        className="flex items-center gap-1 px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg cursor-pointer transition-colors">
                        {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                      <button onClick={handleDownloadCSV}
                        className="flex items-center gap-1 px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg cursor-pointer transition-colors">
                        <Download className="w-3 h-3" /> CSV
                      </button>
                    </div>
                  </div>

                  {/* Stat badges */}
                  <div className="grid grid-cols-5 gap-2 mb-4">
                    <div className="bg-gray-800/50 rounded-xl p-3 text-center">
                      <span className="text-xl font-black text-white">{stats.total}</span>
                      <p className="text-[10px] text-gray-500">Total</p>
                    </div>
                    {['spam', 'bot', 'suspicious', 'genuine'].map(cls => {
                      const c = classColors[cls]
                      return (
                        <div key={cls} className={`rounded-xl p-3 text-center ${c.bg}`}>
                          <span className={`text-xl font-black ${c.text}`}>{stats[cls] || 0}</span>
                          <p className="text-[10px] text-gray-500 capitalize">{cls}</p>
                        </div>
                      )
                    })}
                  </div>

                  {/* Risk bar */}
                  {stats.total > 0 && (
                    <div className="h-3 flex rounded-full overflow-hidden mb-3">
                      {stats.spam > 0 && <div className="bg-red-500 transition-all" style={{ width: `${(stats.spam / stats.total) * 100}%` }} />}
                      {stats.bot > 0 && <div className="bg-orange-500 transition-all" style={{ width: `${(stats.bot / stats.total) * 100}%` }} />}
                      {stats.suspicious > 0 && <div className="bg-yellow-500 transition-all" style={{ width: `${(stats.suspicious / stats.total) * 100}%` }} />}
                      {stats.genuine > 0 && <div className="bg-green-500 transition-all" style={{ width: `${(stats.genuine / stats.total) * 100}%` }} />}
                    </div>
                  )}

                  {/* Overall risk + insight */}
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      stats.overallRisk === 'High' ? 'bg-red-500/15 text-red-400'
                        : stats.overallRisk === 'Medium' ? 'bg-yellow-500/15 text-yellow-400'
                        : 'bg-green-500/15 text-green-400'
                    }`}>
                      {stats.overallRisk} Risk
                    </span>
                    <p className="text-xs text-gray-400 flex-1">{stats.insight}</p>
                  </div>
                </div>
              )}

              {/* Filter bar */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                {['all', 'spam', 'bot', 'suspicious', 'genuine'].map(f => {
                  const count = f === 'all' ? results.length : results.filter(r => r.classification === f).length
                  if (f !== 'all' && count === 0) return null
                  const c = f === 'all' ? { bg: 'bg-gray-800', text: 'text-gray-300' } : classColors[f]
                  return (
                    <button key={f} onClick={() => setFilterClass(f)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors capitalize ${
                        filterClass === f ? `${c.bg} ${c.text}` : 'bg-gray-900 text-gray-500 hover:text-gray-300'
                      }`}>
                      {f} ({count})
                    </button>
                  )
                })}
              </div>

              {/* Results list */}
              <div className="space-y-2">
                {filtered.map((item, i) => {
                  const realIndex = results.indexOf(item)
                  return (
                    <ResultRow
                      key={realIndex}
                      item={item}
                      index={realIndex}
                      expanded={expandedRow === realIndex}
                      onToggle={(idx) => setExpandedRow(expandedRow === idx ? null : idx)}
                    />
                  )
                })}
              </div>

              {/* Regenerate */}
              <button onClick={handleAnalyze} disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-xl cursor-pointer transition-colors disabled:opacity-50">
                <RefreshCw className="w-4 h-4" /> Re-analyze
              </button>
            </>
          )}
        </div>
      </div>
    </ToolLayout>
  )
}
