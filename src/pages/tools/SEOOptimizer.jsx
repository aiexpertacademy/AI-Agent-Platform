import { useState } from 'react'
import {
  BarChart3, Sparkles, CheckCircle, AlertTriangle, XCircle,
  Globe, Zap, Link2, Code2, Search, TrendingUp, TrendingDown,
  ChevronRight, Copy, ExternalLink, MessageSquare, Tag, Wrench,
  Eye, Cpu, ShieldAlert, ArrowUpRight, ArrowDownRight, Minus,
  Loader2, ScanSearch
} from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'
import { callGemini } from '../../config/gemini'

// ─── Mock data ───────────────────────────────────────────────────────────────
const PAGES = [
  { name: 'Homepage', url: '/', score: 68, rank: 4 },
  { name: 'Pricing', url: '/pricing', score: 41, rank: 18 },
  { name: 'Blog: SEO Tips', url: '/blog/seo-tips', score: 82, rank: 2 },
  { name: 'About Us', url: '/about', score: 57, rank: 11 },
]

const RANK_TREND = [12, 10, 9, 8, 6, 4]

const CORE_VITALS = [
  { name: 'LCP', value: '1.9s', pass: true, detail: 'Largest Contentful Paint' },
  { name: 'INP', value: '88ms', pass: true, detail: 'Interaction to Next Paint' },
  { name: 'CLS', value: '0.28', pass: false, detail: 'Cumulative Layout Shift — root cause: late-loading banner image missing explicit dimensions' },
]

const COMPETITORS = [
  { name: 'You', topics: [true, false, true, false, true, true, false] },
  { name: 'Competitor A', topics: [true, true, true, true, true, false, true] },
  { name: 'Competitor B', topics: [true, true, false, true, true, true, true] },
  { name: 'Competitor C', topics: [false, true, true, false, true, true, true] },
]
const TOPICS = ['On-Page SEO', 'Schema Markup', 'Page Speed', 'E-E-A-T Signals', 'Internal Linking', 'Core Web Vitals', 'AEO / AI Visibility']

const SERP_FEATURES = [
  { name: 'Featured Snippet', won: false },
  { name: 'People Also Ask', won: true },
  { name: 'Image Pack', won: false },
  { name: 'Video Carousel', won: false },
  { name: 'Site Links', won: true },
]

const BACKLINKS = [
  { domain: 'techblog.io', da: 62, spam: 3, status: 'healthy' },
  { domain: 'spammy-links.net', da: 14, spam: 82, status: 'toxic' },
  { domain: 'seoworld.co', da: 48, spam: 8, status: 'healthy' },
  { domain: 'freebacklinks.xyz', da: 7, spam: 91, status: 'toxic' },
  { domain: 'devdocs.org', da: 71, spam: 1, status: 'healthy' },
]

const INTERNAL_SUGGESTIONS = [
  { from: '/blog/seo-tips', anchor: 'schema markup guide', to: '/schema-guide' },
  { from: '/about', anchor: 'our SEO methodology', to: '/methodology' },
  { from: '/pricing', anchor: 'compare SEO tools', to: '/comparison' },
]

const KEYWORDS = [
  { kw: 'seo optimization tool', vol: 22000, diff: 'hard', pos: 4 },
  { kw: 'ai seo checker', vol: 8400, diff: 'medium', pos: 9 },
  { kw: 'free seo analyzer', vol: 14200, diff: 'medium', pos: 14 },
  { kw: 'technical seo audit', vol: 6100, diff: 'easy', pos: 22 },
  { kw: 'llm seo visibility', vol: 1800, diff: 'easy', pos: 31 },
]

const FIXES = [
  { p: 'P1', label: 'Penalty Risk', color: 'red', items: ['Disavow 2 toxic backlinks (spam score > 80) immediately to protect domain authority.'] },
  { p: 'P2', label: 'High Impact', color: 'yellow', items: ['Fix CLS on homepage by adding width/height to the hero banner image.', 'Add canonical tag to /pricing to resolve orphan page issue.', 'Reduce 3-hop redirect chain on /old-blog → /blog → /articles → /content.'] },
  { p: 'P3', label: 'Content', color: 'blue', items: ['Add FAQ block to homepage to target People Also Ask slots.', 'Include E-E-A-T author bio section on blog posts.', 'Expand /about page with trust signals and team credentials.'] },
]

const LLM_SCORES = [
  { name: 'ChatGPT', score: 91, status: 'pass' },
  { name: 'Perplexity', score: 87, status: 'pass' },
  { name: 'Gemini', score: 64, status: 'partial' },
]

const AI_SUB = [
  { name: 'Factual Density', score: 78 },
  { name: 'Entity Clarity', score: 85 },
  { name: 'Heading Structure', score: 62 },
]

const LSI_KEYWORDS = [
  { kw: 'schema markup', missing: false },
  { kw: 'E-E-A-T', missing: false },
  { kw: 'structured data', missing: true },
  { kw: 'crawl budget', missing: true },
  { kw: 'canonical URL', missing: false },
  { kw: 'LCP optimization', missing: true },
  { kw: 'internal linking', missing: false },
  { kw: 'featured snippet', missing: true },
  { kw: 'topical authority', missing: true },
  { kw: 'passage indexing', missing: false },
]

const SCHEMA_TEMPLATES = {
  FAQ: (items) => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }),
  Product: () => ({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'SEO Optimizer Pro',
    description: 'AI-powered SEO analysis and optimization platform.',
    brand: { '@type': 'Brand', name: 'YourBrand' },
    offers: { '@type': 'Offer', price: '29.00', priceCurrency: 'USD', availability: 'https://schema.org/InStock' },
    aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.8', reviewCount: '412' },
  }),
  Organization: () => ({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'YourBrand',
    url: 'https://yourbrand.com',
    logo: 'https://yourbrand.com/logo.png',
    sameAs: ['https://twitter.com/yourbrand', 'https://linkedin.com/company/yourbrand'],
    contactPoint: { '@type': 'ContactPoint', telephone: '+1-800-555-0100', contactType: 'customer service' },
  }),
  Breadcrumb: () => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://yourbrand.com' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://yourbrand.com/blog' },
      { '@type': 'ListItem', position: 3, name: 'SEO Tips', item: 'https://yourbrand.com/blog/seo-tips' },
    ],
  }),
}

const AI_QA = [
  {
    q: 'Why does Competitor A outrank us for "seo optimization tool"?',
    a: 'Competitor A has 3 key advantages on that SERP: (1) their page has 2,400 words vs your 1,100 — matching search intent for a comprehensive guide, (2) they hold the Featured Snippet with a concise 40-word answer box in their intro, (3) their DA is 58 vs your 44. The fastest win: add a 50-word TL;DR answer box at the very top of your page — this alone can claim the Featured Snippet within 4–6 weeks of re-indexing.',
  },
  {
    q: 'How do I win the Featured Snippet for "technical seo audit"?',
    a: 'For this query, Google shows a definition-style snippet. Add an H2 titled "What is a Technical SEO Audit?" followed immediately by a 40–60 word paragraph that directly defines it and mentions key sub-topics (crawlability, indexation, Core Web Vitals, structured data). Ensure the paragraph is self-contained — no pronouns relying on earlier context. Then add a step-by-step numbered list under an H3 "How to Run a Technical SEO Audit" — list-style snippets are the second most common format for this intent.',
  },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreRing({ score, size = 72 }) {
  const r = (size - 8) / 2
  const c = 2 * Math.PI * r
  const off = c - (score / 100) * c
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : score >= 40 ? '#f97316' : '#ef4444'
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#374151" strokeWidth="6" fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth="6" fill="none" strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-white">{score}</span>
      </div>
    </div>
  )
}

function MiniBar({ value, max = 100, color = '#22c55e' }) {
  return (
    <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${(value / max) * 100}%`, background: color }} />
    </div>
  )
}

function Sparkline({ data }) {
  const w = 200, h = 48, pad = 4
  const min = Math.min(...data), max = Math.max(...data)
  const xs = data.map((_, i) => pad + (i / (data.length - 1)) * (w - 2 * pad))
  const ys = data.map((v) => pad + ((max - v) / (max - min || 1)) * (h - 2 * pad))
  const d = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x},${ys[i]}`).join(' ')
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline fill="none" stroke="#22c55e" strokeWidth="2" points={xs.map((x, i) => `${x},${ys[i]}`).join(' ')} />
      {xs.map((x, i) => (
        <circle key={i} cx={x} cy={ys[i]} r="3" fill={i === xs.length - 1 ? '#22c55e' : '#374151'} stroke="#22c55e" strokeWidth="1.5" />
      ))}
    </svg>
  )
}

function DiffBadge({ diff }) {
  const map = { easy: 'bg-green-500/20 text-green-400', medium: 'bg-yellow-500/20 text-yellow-400', hard: 'bg-red-500/20 text-red-400' }
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${map[diff]}`}>{diff}</span>
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded border border-gray-700 hover:border-gray-500">
      <Copy className="w-3 h-3" />
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

// ─── Tab views ────────────────────────────────────────────────────────────────

function OverviewTab() {
  const metrics = [
    { label: 'SEO Health', value: '68/100', delta: '+4', up: true, icon: BarChart3, color: 'text-green-400' },
    { label: 'AI Visibility', value: '74%', delta: '+9%', up: true, icon: Cpu, color: 'text-blue-400' },
    { label: 'Avg. Position', value: '#4', delta: '-8', up: true, icon: TrendingUp, color: 'text-purple-400' },
    { label: 'Toxic Backlinks', value: '2', delta: '+2', up: false, icon: ShieldAlert, color: 'text-red-400' },
  ]
  const issues = [
    { p: 'P1', msg: 'Disavow 2 toxic backlinks (spam > 80)', tag: 'Backlinks' },
    { p: 'P2', msg: 'Fix CLS 0.28 — add image dimensions to hero banner', tag: 'Technical' },
    { p: 'P2', msg: 'Claim Featured Snippet for "technical seo audit"', tag: 'AEO' },
    { p: 'P2', msg: 'Add canonical to /pricing (orphan page)', tag: 'Technical' },
    { p: 'P3', msg: 'Add FAQ schema to homepage', tag: 'Schema' },
    { p: 'P3', msg: 'Expand blog posts with E-E-A-T author bios', tag: 'Content' },
  ]
  const pColor = { P1: 'bg-red-500/20 text-red-400', P2: 'bg-yellow-500/20 text-yellow-400', P3: 'bg-blue-500/20 text-blue-400' }
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {metrics.map((m) => (
          <div key={m.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">{m.label}</span>
              <m.icon className={`w-4 h-4 ${m.color}`} />
            </div>
            <p className="text-2xl font-bold text-white">{m.value}</p>
            <div className={`flex items-center gap-1 mt-1 text-xs ${m.up ? 'text-green-400' : 'text-red-400'}`}>
              {m.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {m.delta} vs last month
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-medium text-gray-300 mb-4">Rank Trend — "seo optimization tool"</h3>
        <div className="flex items-end gap-6">
          <Sparkline data={RANK_TREND} />
          <div className="text-sm text-gray-400">
            <p className="text-white font-semibold text-xl">#4</p>
            <p className="text-green-400 text-xs">↑ from #12 over 6 months</p>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          {RANK_TREND.map((r, i) => (
            <span key={i} className="text-xs text-gray-500">#{r}</span>
          ))}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Priority Issues</h3>
        <div className="space-y-2">
          {issues.map((item, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-800 last:border-0">
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${pColor[item.p]}`}>{item.p}</span>
              <span className="text-sm text-gray-300 flex-1">{item.msg}</span>
              <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">{item.tag}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AEOTab() {
  const [contentBrief, setContentBrief] = useState([])
  function toggleKw(kw) {
    setContentBrief((prev) => prev.includes(kw) ? prev.filter((k) => k !== kw) : [...prev, kw])
  }
  const llmIssues = [
    { type: 'warning', msg: 'Content chunks exceed 300 words — LLMs prefer shorter, self-contained paragraphs for citation.' },
    { type: 'error', msg: 'No FAQ block detected — FAQ sections are the #1 source of AI-cited content.' },
    { type: 'info', msg: 'Heading hierarchy is flat (all H2s) — add H3 sub-headings for better passage indexing.' },
  ]
  return (
    <div className="space-y-5">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-medium text-gray-300 mb-4">AI Visibility Score</h3>
        <div className="flex items-center gap-5 mb-5">
          <ScoreRing score={74} size={88} />
          <div className="flex-1 space-y-3">
            {AI_SUB.map((s) => (
              <div key={s.name}>
                <div className="flex justify-between text-xs text-gray-400 mb-1"><span>{s.name}</span><span>{s.score}</span></div>
                <MiniBar value={s.score} color={s.score >= 80 ? '#22c55e' : s.score >= 60 ? '#eab308' : '#ef4444'} />
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {LLM_SCORES.map((l) => (
            <div key={l.name} className={`rounded-lg p-3 text-center border ${l.status === 'pass' ? 'border-green-500/30 bg-green-500/5' : 'border-yellow-500/30 bg-yellow-500/5'}`}>
              <p className="text-sm font-semibold text-white">{l.name}</p>
              <p className={`text-lg font-bold mt-1 ${l.status === 'pass' ? 'text-green-400' : 'text-yellow-400'}`}>{l.score}</p>
              <p className={`text-xs ${l.status === 'pass' ? 'text-green-400' : 'text-yellow-400'}`}>{l.status === 'pass' ? '✓ Indexed' : '⚠ Partial'}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-medium text-gray-300 mb-3">LLM Readability Check</h3>
        <div className="space-y-2">
          {llmIssues.map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              {item.type === 'error' ? <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" /> : item.type === 'warning' ? <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" /> : <CheckCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />}
              <span className="text-sm text-gray-300">{item.msg}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-300">LSI / Semantic Keyword Cloud</h3>
          <span className="text-xs text-gray-500">Click missing keywords to add to content brief</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {LSI_KEYWORDS.map((item) => (
            <button
              key={item.kw}
              onClick={() => item.missing && toggleKw(item.kw)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${item.missing
                ? contentBrief.includes(item.kw)
                  ? 'bg-blue-600 text-white border border-blue-500'
                  : 'bg-blue-500/10 text-blue-400 border border-blue-500/40 hover:bg-blue-500/20 cursor-pointer'
                : 'bg-gray-700 text-gray-300 border border-gray-600 cursor-default'}`}
            >
              {item.missing && !contentBrief.includes(item.kw) && '+ '}
              {item.kw}
            </button>
          ))}
        </div>
        {contentBrief.length > 0 && (
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-xs text-blue-400 font-medium mb-1">Content Brief — {contentBrief.length} keyword{contentBrief.length > 1 ? 's' : ''} added:</p>
            <p className="text-xs text-gray-300">{contentBrief.join(', ')}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function TechnicalTab() {
  const [showBot, setShowBot] = useState(false)
  const crawlIssues = [
    { type: 'error', msg: '/pricing is an orphan page — no internal links point to it. Add canonical or link from nav.' },
    { type: 'warning', msg: '3-hop redirect chain detected: /old-blog → /blog → /articles → /content. Shorten to single hop.' },
    { type: 'info', msg: 'Crawl budget: 247 pages crawled in last 30 days. 12 pages not crawled in 60+ days.' },
  ]
  const botView = 'Googlebot sees your page as server-rendered HTML. React components render successfully. However, the hero banner lazy-loads after FCP — Googlebot may not process it. Move hero image to eager loading.'
  const userView = 'Full interactive React SPA with animations, sticky nav, and live chat widget. All content visible after 1.4s.'
  return (
    <div className="space-y-5">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-medium text-gray-300 mb-4">Core Web Vitals</h3>
        <div className="space-y-3">
          {CORE_VITALS.map((v) => (
            <div key={v.name} className={`p-4 rounded-lg border ${v.pass ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {v.pass ? <CheckCircle className="w-4 h-4 text-green-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
                  <span className="text-sm font-semibold text-white">{v.name}</span>
                  <span className="text-sm text-gray-300">{v.value}</span>
                </div>
                <span className={`text-xs font-medium ${v.pass ? 'text-green-400' : 'text-red-400'}`}>{v.pass ? 'Pass' : 'Fail'}</span>
              </div>
              <p className="text-xs text-gray-500 ml-6">{v.detail}</p>
              <div className="mt-2 ml-6">
                <MiniBar value={v.pass ? 85 : 35} color={v.pass ? '#22c55e' : '#ef4444'} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Crawl Budget Analysis</h3>
        <div className="space-y-2">
          {crawlIssues.map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              {item.type === 'error' ? <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" /> : item.type === 'warning' ? <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" /> : <CheckCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />}
              <span className="text-sm text-gray-300">{item.msg}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-300">JavaScript Rendering</h3>
          <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-0.5">
            <button onClick={() => setShowBot(false)} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${!showBot ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}>
              User View
            </button>
            <button onClick={() => setShowBot(true)} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${showBot ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>
              Googlebot View
            </button>
          </div>
        </div>
        <div className={`p-4 rounded-lg border ${showBot ? 'border-blue-500/30 bg-blue-500/5' : 'border-green-500/30 bg-green-500/5'}`}>
          <div className="flex items-start gap-2">
            {showBot ? <Cpu className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" /> : <Eye className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />}
            <p className="text-sm text-gray-300">{showBot ? botView : userView}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function CompetitiveTab() {
  return (
    <div className="space-y-5">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-medium text-gray-300 mb-4">Content Gap Analysis</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-xs text-gray-500 font-medium pb-2 pr-4">Topic</th>
                {COMPETITORS.map((c) => (
                  <th key={c.name} className={`text-center text-xs pb-2 px-2 font-medium ${c.name === 'You' ? 'text-green-400' : 'text-gray-500'}`}>{c.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TOPICS.map((topic, ti) => (
                <tr key={topic} className="border-b border-gray-800/50">
                  <td className="py-2 pr-4 text-gray-300 text-xs">{topic}</td>
                  {COMPETITORS.map((c) => (
                    <td key={c.name} className="text-center py-2 px-2">
                      <span className={`inline-block text-xs px-2 py-0.5 rounded ${c.topics[ti] ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {c.topics[ti] ? '✓' : '✗'}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-medium text-gray-300 mb-4">SERP Feature Tracker</h3>
        <div className="grid grid-cols-1 gap-2">
          {SERP_FEATURES.map((f) => (
            <div key={f.name} className={`flex items-center justify-between p-3 rounded-lg border ${f.won ? 'border-green-500/30 bg-green-500/5' : 'border-gray-700 bg-gray-800/50'}`}>
              <div className="flex items-center gap-2">
                {f.won ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Minus className="w-4 h-4 text-gray-500" />}
                <span className={`text-sm ${f.won ? 'text-white' : 'text-gray-400'}`}>{f.name}</span>
              </div>
              <span className={`text-xs font-medium ${f.won ? 'text-green-400' : 'text-gray-500'}`}>{f.won ? 'Won ✓' : 'Missing'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function BacklinksTab() {
  const [disavowed, setDisavowed] = useState([])
  return (
    <div className="space-y-5">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-medium text-gray-300 mb-4">DA Predictor</h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1"><span>Your DA</span><span className="font-semibold text-white">44</span></div>
            <MiniBar value={44} color="#eab308" />
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1"><span>DA needed for top 3</span><span className="font-semibold text-white">58</span></div>
            <MiniBar value={58} color="#22c55e" />
          </div>
          <p className="text-xs text-gray-500 mt-2">You need <span className="text-yellow-400 font-medium">+14 DA points</span> to consistently rank in top 3. Focus on earning links from DA 60+ domains in your niche.</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Backlink Health</h3>
        <div className="space-y-2">
          {BACKLINKS.map((b) => (
            <div key={b.domain} className={`flex items-center gap-3 p-3 rounded-lg border ${disavowed.includes(b.domain) ? 'border-gray-700 opacity-40' : b.status === 'toxic' ? 'border-red-500/30 bg-red-500/5' : 'border-gray-700 bg-gray-800/30'}`}>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{b.domain}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-gray-500">DA {b.da}</span>
                  <span className={`text-xs ${b.spam > 50 ? 'text-red-400' : 'text-gray-500'}`}>Spam {b.spam}%</span>
                </div>
              </div>
              {b.status === 'toxic' && !disavowed.includes(b.domain) && (
                <button onClick={() => setDisavowed((p) => [...p, b.domain])} className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded border border-red-500/30 hover:bg-red-500/30 transition-colors flex-shrink-0">
                  Disavow
                </button>
              )}
              {disavowed.includes(b.domain) && <span className="text-xs text-gray-500">Disavowed</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Internal Link Suggestions</h3>
        <div className="space-y-3">
          {INTERNAL_SUGGESTIONS.map((s, i) => (
            <div key={i} className="p-3 rounded-lg bg-gray-800 border border-gray-700">
              <p className="text-xs text-gray-500 mb-1">On page <span className="text-gray-300">{s.from}</span></p>
              <p className="text-sm text-gray-300">Add link with anchor: <span className="text-green-400 font-medium">"{s.anchor}"</span></p>
              <p className="text-xs text-gray-500 mt-0.5">→ pointing to <span className="text-blue-400">{s.to}</span></p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SchemaTab() {
  const [active, setActive] = useState('FAQ')
  const [faqItems] = useState([
    { q: 'What is technical SEO?', a: 'Technical SEO refers to optimizing a website\'s infrastructure so search engines can crawl, index, and render it effectively.' },
    { q: 'How do I improve Core Web Vitals?', a: 'Focus on LCP (optimize images, use CDN), INP (reduce JavaScript execution), and CLS (set explicit image dimensions).' },
  ])
  const getSchema = () => {
    if (active === 'FAQ') return SCHEMA_TEMPLATES.FAQ(faqItems)
    if (active === 'Product') return SCHEMA_TEMPLATES.Product()
    if (active === 'Organization') return SCHEMA_TEMPLATES.Organization()
    return SCHEMA_TEMPLATES.Breadcrumb()
  }
  const json = JSON.stringify(getSchema(), null, 2)
  const scriptTag = `<script type="application/ld+json">\n${json}\n</script>`
  return (
    <div className="space-y-5">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-medium text-gray-300 mb-4">Select Schema Type</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {['FAQ', 'Product', 'Organization', 'Breadcrumb'].map((t) => (
            <button key={t} onClick={() => setActive(t)} className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${active === t ? 'bg-green-600 border-green-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-300">Generated JSON-LD — {active}</h3>
          <CopyButton text={scriptTag} />
        </div>
        <pre className="text-xs text-gray-300 bg-gray-950 border border-gray-800 rounded-lg p-4 overflow-auto max-h-72 leading-relaxed">{scriptTag}</pre>
        <p className="text-xs text-gray-500 mt-2">Paste this block inside your page's <code className="text-green-400">&lt;head&gt;</code> tag.</p>
      </div>
    </div>
  )
}

// ─── Right panel tabs ─────────────────────────────────────────────────────────

function AskAIPanel() {
  const [open, setOpen] = useState(null)
  const [custom, setCustom] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)

  async function ask(q) {
    setLoading(true)
    setAnswer('')
    try {
      const res = await callGemini(
        `You are an expert SEO consultant. The user's site context: domain authority 44, target keyword "seo optimization tool", current rank #4, Core Web Vitals issue CLS 0.28 on homepage, 2 toxic backlinks. Answer concisely and specifically:\n\n${q}`,
        { temperature: 0.4 }
      )
      setAnswer(res)
    } catch (e) {
      setAnswer('Error: ' + e.message)
    }
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {AI_QA.map((qa, i) => (
          <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
            <button onClick={() => setOpen(open === i ? null : i)} className="w-full text-left p-3 flex items-start justify-between gap-2">
              <span className="text-xs text-gray-300 font-medium">{qa.q}</span>
              <ChevronRight className={`w-3 h-3 text-gray-500 flex-shrink-0 mt-0.5 transition-transform ${open === i ? 'rotate-90' : ''}`} />
            </button>
            {open === i && <div className="px-3 pb-3 text-xs text-gray-400 leading-relaxed border-t border-gray-700 pt-3">{qa.a}</div>}
          </div>
        ))}
      </div>
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
        <p className="text-xs text-gray-500 mb-2">Ask a custom question</p>
        <textarea value={custom} onChange={(e) => setCustom(e.target.value)} rows={3} className="w-full bg-gray-900 border border-gray-700 rounded text-xs text-white placeholder-gray-600 p-2 resize-none focus:outline-none focus:ring-1 focus:ring-green-500" placeholder="Why is my bounce rate so high on mobile?" />
        <button onClick={() => ask(custom)} disabled={loading || !custom.trim()} className="mt-2 w-full py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded transition-colors disabled:opacity-50">
          {loading ? 'Asking…' : 'Ask AI'}
        </button>
        {answer && <div className="mt-3 text-xs text-gray-300 leading-relaxed border-t border-gray-700 pt-3">{answer}</div>}
      </div>
    </div>
  )
}

function KeywordsPanel() {
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left text-gray-500 font-medium pb-2">Keyword</th>
              <th className="text-right text-gray-500 font-medium pb-2">Vol</th>
              <th className="text-center text-gray-500 font-medium pb-2">Diff</th>
              <th className="text-right text-gray-500 font-medium pb-2">Pos</th>
            </tr>
          </thead>
          <tbody>
            {KEYWORDS.map((k, i) => (
              <tr key={i} className={`border-b border-gray-800/50 ${k.diff === 'easy' ? 'bg-green-500/5' : ''}`}>
                <td className="py-2 pr-2 text-gray-300">{k.kw}</td>
                <td className="py-2 text-right text-gray-400">{k.vol.toLocaleString()}</td>
                <td className="py-2 text-center"><DiffBadge diff={k.diff} /></td>
                <td className={`py-2 text-right font-semibold ${k.pos <= 10 ? 'text-green-400' : k.pos <= 20 ? 'text-yellow-400' : 'text-gray-400'}`}>#{k.pos}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
        <p className="text-xs text-green-400 font-semibold mb-1">Easy Win Opportunity</p>
        <p className="text-xs text-gray-300">"technical seo audit" — easy difficulty, vol 6,100, currently #22. A targeted content update could move this into the top 10 within 30 days.</p>
      </div>
    </div>
  )
}

function FixesPanel() {
  const colorMap = { red: 'bg-red-500/20 text-red-400', yellow: 'bg-yellow-500/20 text-yellow-400', blue: 'bg-blue-500/20 text-blue-400' }
  return (
    <div className="space-y-4">
      {FIXES.map((group) => (
        <div key={group.p} className="bg-gray-800 border border-gray-700 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${colorMap[group.color]}`}>{group.p}</span>
            <span className="text-xs text-gray-400">{group.label}</span>
          </div>
          <ul className="space-y-2">
            {group.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                <ChevronRight className="w-3 h-3 text-gray-500 flex-shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

const MAIN_TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'aeo', label: 'AEO / AI', icon: Cpu },
  { id: 'technical', label: 'Technical', icon: Wrench },
  { id: 'competitive', label: 'Competitive', icon: TrendingUp },
  { id: 'backlinks', label: 'Backlinks', icon: Link2 },
  { id: 'schema', label: 'Schema', icon: Code2 },
]

const RIGHT_TABS = [
  { id: 'ai', label: 'Ask AI', icon: MessageSquare },
  { id: 'keywords', label: 'Keywords', icon: Search },
  { id: 'fixes', label: 'Fixes', icon: Tag },
]

export default function SEOOptimizer() {
  const [activePage, setActivePage] = useState(0)
  const [mainTab, setMainTab] = useState('overview')
  const [rightTab, setRightTab] = useState('ai')

  // Input state
  const [urlInput, setUrlInput] = useState('')
  const [keywordInput, setKeywordInput] = useState('')
  const [analyzed, setAnalyzed] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [siteUrl, setSiteUrl] = useState('')

  async function handleAnalyze(e) {
    e.preventDefault()
    if (!urlInput.trim()) return
    setAnalyzing(true)
    // Simulate a brief analysis delay for UX feedback, then show dashboard
    await new Promise((r) => setTimeout(r, 1200))
    setSiteUrl(urlInput.trim())
    setAnalyzing(false)
    setAnalyzed(true)
  }

  function handleReset() {
    setAnalyzed(false)
    setUrlInput('')
    setKeywordInput('')
    setSiteUrl('')
    setActivePage(0)
    setMainTab('overview')
  }

  const page = PAGES[activePage]
  const scoreColor = page.score >= 80 ? 'text-green-400' : page.score >= 60 ? 'text-yellow-400' : 'text-red-400'

  const quickTools = [
    { label: 'AI Visibility', tab: 'aeo', icon: Cpu },
    { label: 'Technical Audit', tab: 'technical', icon: Wrench },
    { label: 'Backlink Health', tab: 'backlinks', icon: Link2 },
    { label: 'Schema Generator', tab: 'schema', icon: Code2 },
  ]

  return (
    <ToolLayout icon={BarChart3} title="SEO Optimizer" description="Comprehensive SEO dashboard — AEO, Technical, Competitive, Backlinks & Schema" color="#22c55e">

      {/* ── Input bar (always visible at top) ── */}
      <form onSubmit={handleAnalyze} className="flex gap-2 mb-5">
        <div className="relative flex-1">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Enter your website URL — e.g. https://yoursite.com"
          />
        </div>
        <div className="relative w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          <input
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Target keyword"
          />
        </div>
        <button
          type="submit"
          disabled={analyzing || !urlInput.trim()}
          className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors whitespace-nowrap cursor-pointer"
        >
          {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanSearch className="w-4 h-4" />}
          {analyzing ? 'Analyzing…' : 'Analyze Site'}
        </button>
        {analyzed && (
          <button type="button" onClick={handleReset} className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-xl border border-gray-700 transition-colors whitespace-nowrap">
            Reset
          </button>
        )}
      </form>

      {/* ── Empty state ── */}
      {!analyzed && !analyzing && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-4">
            <BarChart3 className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Enter your site URL to get started</h3>
          <p className="text-sm text-gray-500 max-w-md">
            Type your website URL above and optionally a target keyword, then click <span className="text-green-400 font-medium">Analyze Site</span> to generate your full SEO dashboard — including AI visibility, technical audit, backlink health, and schema tools.
          </p>
          <div className="mt-6 grid grid-cols-3 gap-3 text-xs text-gray-500">
            {['AEO / AI Visibility', 'Core Web Vitals', 'Backlink Health', 'Content Gap Analysis', 'Schema Generator', 'Keyword Opportunities'].map((f) => (
              <div key={f} className="px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-400">{f}</div>
            ))}
          </div>
        </div>
      )}

      {/* ── Analyzing loader ── */}
      {analyzing && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Loader2 className="w-10 h-10 text-green-500 animate-spin mb-4" />
          <p className="text-white font-medium mb-1">Analyzing {urlInput}</p>
          <p className="text-sm text-gray-500">Scanning SEO health, backlinks, Core Web Vitals…</p>
        </div>
      )}

      {/* ── Full dashboard (shown after analysis) ── */}
      {analyzed && (
      <div className="flex gap-4 min-h-[700px]">
        {/* Left sidebar */}
        <div className="w-52 flex-shrink-0 space-y-3">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wider">Site Dashboard</p>
            {siteUrl && (
              <p className="text-xs text-green-400 truncate mb-3" title={siteUrl}>{siteUrl}</p>
            )}
            {!siteUrl && <div className="mb-3" />}
            <div className="flex items-center gap-3 mb-4">
              <ScoreRing score={page.score} size={60} />
              <div>
                <p className="text-xs text-gray-400">SEO Health</p>
                <p className={`text-lg font-bold ${scoreColor}`}>{page.score}/100</p>
              </div>
            </div>
            <div className="space-y-1">
              {PAGES.map((p, i) => (
                <button
                  key={p.url}
                  onClick={() => setActivePage(i)}
                  className={`w-full text-left px-2 py-2 rounded-lg transition-colors ${i === activePage ? 'bg-green-600/20 border border-green-600/40' : 'hover:bg-gray-800'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-300 truncate max-w-[110px]">{p.name}</span>
                    <span className={`text-xs font-semibold ${p.score >= 70 ? 'text-green-400' : p.score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{p.score}</span>
                  </div>
                  <p className="text-xs text-gray-600">Rank #{p.rank}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">Quick Tools</p>
            <div className="space-y-1">
              {quickTools.map((qt) => (
                <button key={qt.tab} onClick={() => setMainTab(qt.tab)} className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs transition-colors ${mainTab === qt.tab ? 'bg-green-600/20 text-green-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                  <qt.icon className="w-3.5 h-3.5" />
                  {qt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main area */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          {/* Tab bar */}
          <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 overflow-x-auto">
            {MAIN_TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setMainTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${mainTab === t.id ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
              >
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            {mainTab === 'overview' && <OverviewTab />}
            {mainTab === 'aeo' && <AEOTab />}
            {mainTab === 'technical' && <TechnicalTab />}
            {mainTab === 'competitive' && <CompetitiveTab />}
            {mainTab === 'backlinks' && <BacklinksTab />}
            {mainTab === 'schema' && <SchemaTab />}
          </div>
        </div>

        {/* Right panel */}
        <div className="w-72 flex-shrink-0 flex flex-col gap-3">
          <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1">
            {RIGHT_TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setRightTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition-colors ${rightTab === t.id ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
              >
                <t.icon className="w-3 h-3" />
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl p-4 overflow-y-auto">
            {rightTab === 'ai' && <AskAIPanel />}
            {rightTab === 'keywords' && <KeywordsPanel />}
            {rightTab === 'fixes' && <FixesPanel />}
          </div>
        </div>
      </div>
      )}
    </ToolLayout>
  )
}
