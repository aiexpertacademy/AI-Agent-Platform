import { useState, useRef, useEffect } from 'react'
import {
  FileText, Upload, Loader2, Copy, Check, Sparkles,
  List, AlignLeft, Target, Columns, Users, BookOpen,
  Book, Download, MessageSquare, Quote, AlertTriangle,
  X, Plus, Send, RotateCcw, BarChart2, Code,
  Hash, Layout, FileDown, Globe, Languages,
  ChevronRight, Tag, Zap,
} from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'
import { callGemini, parseGeminiJSON } from '../../config/gemini'

// ── Colour palette for documents ───────────────────────────────────────────────
const DOC_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#a855f7']

// ── Sample preloaded document ──────────────────────────────────────────────────
const SAMPLE_CONTENT = `Q4 2024 Strategic Planning Report — TechCorp Inc.
Prepared by: CFO David Park, CEO Jane Martinez, CTO Robert Chen
Date: October 3, 2024

EXECUTIVE SUMMARY
TechCorp's Q4 2024 strategy focuses on three pillars: APAC market expansion, a 15% operational cost reduction, and the launch of Suite X by December 1, 2024. The board approved a total Q4 budget of $4.2M.

MARKET EXPANSION — APAC
We will enter Singapore, Tokyo, and Seoul. Target APAC revenue: $2.1M by December 31, 2024. Our distribution partnership with Nexus Technologies (signed September 15, 2024) provides local channel access. Regional lead Maria Lopez must complete sales team training by November 15. We are hiring 5 APAC sales engineers with a deadline of November 1.

COST REDUCTION INITIATIVES
CFO David Park's plan targets 15% cost reduction through:
• Billing automation: saves ~$180K/month (implementation by October 31)
• Data center consolidation from 3 to 1 location: saves $240K/quarter (completion December 31)
• AWS contract renegotiation: targeting 12% discount (negotiation deadline October 31)

PRODUCT: SUITE X
Suite X integrates AI capabilities across CRM, analytics, and workflow automation. CTO Robert Chen leads development. A beta for 500 pilot users must launch by November 15.
Projected revenue: $1.8M in the first 6 months post-launch.

NOTE: A September 2024 internal memo projected Suite X first-6-month revenue at $2.4M. The revised estimate of $1.8M reflects updated market conditions. [Conflict: revenue projection changed from $2.4M to $1.8M]

KEY ACTION ITEMS
- Complete AWS renegotiation by October 31 — Owner: David Park
- Hire 5 APAC engineers by November 1 — Owner: Maria Lopez
- Launch Suite X beta (500 users) by November 15 — Owner: Robert Chen
- Data center migration complete by December 31 — Owner: IT Ops
- Board Q4 review: December 5, 2024

RISKS
1. Tokyo regulatory approval pending (expected October 25) — may delay APAC launch
2. Engineering velocity 20% below plan — may push Suite X past December 1
3. Unconfirmed: CTO Robert Chen may have received a competing offer

GLOSSARY & ACRONYMS
APAC — Asia-Pacific region
Suite X — TechCorp's integrated AI platform (CRM + Analytics + Automation)
CRM — Customer Relationship Management system
ARR — Annual Recurring Revenue
NPS — Net Promoter Score
AWS — Amazon Web Services
CFO — Chief Financial Officer | CTO — Chief Technology Officer | CEO — Chief Executive Officer`

const SAMPLE_DOCS = [
  {
    id: 'demo1',
    name: 'Q4-Strategy-Report.txt',
    content: SAMPLE_CONTENT,
    words: SAMPLE_CONTENT.split(/\s+/).length,
    pages: 4,
    color: DOC_COLORS[0],
  },
]

// ── Mode tabs ─────────────────────────────────────────────────────────────────
const MODES = [
  { id: 'summary',    label: 'Summary',      icon: AlignLeft  },
  { id: 'keypoints',  label: 'Key Points',   icon: List       },
  { id: 'action',     label: 'Action Items', icon: Target     },
  { id: 'eli5',       label: 'ELI5',          icon: Sparkles   },
  { id: 'compare',    label: 'Compare',      icon: Columns    },
  { id: 'entities',   label: 'Entities',     icon: Users      },
  { id: 'flashcards', label: 'Flashcards',   icon: BookOpen   },
  { id: 'glossary',   label: 'Glossary',     icon: Book       },
  { id: 'export',     label: 'Export',       icon: Download   },
]

// ── Right panel tabs ───────────────────────────────────────────────────────────
const RIGHT_TABS = [
  { id: 'chat',      label: 'Chat',      icon: MessageSquare  },
  { id: 'citations', label: 'Citations', icon: Quote          },
  { id: 'conflicts', label: 'Conflicts', icon: AlertTriangle  },
]

// ── Output languages ───────────────────────────────────────────────────────────
const LANGUAGES = ['English','Hindi','Spanish','French','German','Arabic','Chinese','Japanese','Portuguese','Russian']

// ── Export destinations ────────────────────────────────────────────────────────
const EXPORT_DESTS = [
  { id: 'notion',   label: 'Notion',    icon: Hash,     color: '#6b7280' },
  { id: 'slack',    label: 'Slack',     icon: MessageSquare, color: '#611f69' },
  { id: 'trello',   label: 'Trello',    icon: Layout,   color: '#0079BF' },
  { id: 'pdf',      label: 'PDF',       icon: FileDown, color: '#ef4444' },
  { id: 'markdown', label: 'Markdown',  icon: Code,     color: '#6366f1' },
  { id: 'anki',     label: 'Anki',      icon: BookOpen, color: '#25a0e2' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildContext(docs) {
  return docs.map((d, i) =>
    `--- Document ${i + 1}: ${d.name} (${d.words} words) ---\n${d.content}`
  ).join('\n\n')
}

function parseFlashcards(text) {
  return text
    .split(/---+/)
    .map(block => {
      const q = block.match(/Q:\s*(.+)/)?.[1]?.trim()
      const a = block.match(/A:\s*([\s\S]+?)(?=Q:|$)/)?.[1]?.trim()
      return q && a ? { q, a } : null
    })
    .filter(Boolean)
}

function parseSentiment(text) {
  const get = (key) => {
    const m = text.match(new RegExp(key + '\\s*:\\s*(\\d+)'))
    return m ? Math.min(100, parseInt(m[1])) : 50
  }
  return {
    professional: get('professional'),
    cautious:     get('cautious'),
    urgent:       get('urgent'),
    optimistic:   get('optimistic'),
  }
}

function parseEntities(text) {
  try { return parseGeminiJSON(text) } catch { return null }
}

function downloadFile(filename, content) {
  const blob = new Blob([content], { type: 'text/plain' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function DocSummarizer() {
  const [docs, setDocs]               = useState(SAMPLE_DOCS)
  const [selectedIds, setSelectedIds] = useState(['demo1'])
  const [mode, setMode]               = useState('summary')
  const [outputLang, setOutputLang]   = useState('English')

  // Mode results
  const [results, setResults]         = useState({})     // {modeId: string | object}
  const [sentiment, setSentiment]     = useState(null)   // {professional,cautious,urgent,optimistic}
  const [flashcards, setFlashcards]   = useState([])
  const [entities, setEntities]       = useState(null)
  const [flippedCards, setFlippedCards] = useState(new Set())

  // Right panel
  const [rightTab, setRightTab]       = useState('chat')
  const [citations, setCitations]     = useState('')
  const [conflicts, setConflicts]     = useState('')
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', text: `Hi! I have context of all ${SAMPLE_DOCS.length} document(s) you've loaded (${SAMPLE_CONTENT.split(/\s+/).length} words total). Ask me anything about the content — I'll answer with citations.` },
  ])
  const [chatInput, setChatInput]     = useState('')

  // Export
  const [exportChecks, setExportChecks] = useState({ summary: true, keypoints: true, action: true, entities: false, flashcards: false, glossary: false })

  // UI state
  const [loading, setLoading]         = useState(null)
  const [copied, setCopied]           = useState(null)

  const fileRef   = useRef(null)
  const chatEnd   = useRef(null)

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMessages])

  // ── Derived ──────────────────────────────────────────────────────────────
  const selectedDocs = docs.filter(d => selectedIds.includes(d.id))
  const langSuffix   = outputLang !== 'English' ? `\n\nIMPORTANT: Write the ENTIRE response in ${outputLang}.` : ''

  // ── File upload ──────────────────────────────────────────────────────────
  async function handleUpload(e) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    for (const file of files) {
      const content = await file.text()
      const id = `doc_${Date.now()}_${Math.random().toString(36).slice(2)}`
      const color = DOC_COLORS[docs.length % DOC_COLORS.length]
      setDocs(prev => [...prev, { id, name: file.name, content, words: content.split(/\s+/).length, pages: Math.ceil(content.length / 2000), color }])
      setSelectedIds(prev => [...prev, id])
    }
    e.target.value = ''
  }

  function removeDoc(id) {
    setDocs(prev => prev.filter(d => d.id !== id))
    setSelectedIds(prev => prev.filter(x => x !== id))
  }

  function toggleSelect(id) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function doCopy(text, id) {
    navigator.clipboard.writeText(typeof text === 'string' ? text : JSON.stringify(text, null, 2))
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  // ── Run mode analysis ────────────────────────────────────────────────────
  async function runMode() {
    if (!selectedDocs.length || loading) return
    const ctx = buildContext(selectedDocs)
    setLoading(mode)

    try {
      let result, prompt

      if (mode === 'summary') {
        prompt = `You are an expert document analyst. Analyze these documents and provide:

1. A cross-document synthesis summary (aim for 200-300 words). Insert citation markers like [Doc1:p2] for key claims. Where documents contradict each other, insert ⚠ CONFLICT: <description>.

2. After the summary, a SENTIMENT section with exactly these 4 lines (values 0–100):
professional: N
cautious: N
urgent: N
optimistic: N
${langSuffix}

Documents:
${ctx}`
        const raw = await callGemini(prompt, { temperature: 0.3 })
        const sentPart = raw.match(/professional:\s*\d+[\s\S]*?optimistic:\s*\d+/i)?.[0] || ''
        const summaryText = raw.replace(/SENTIMENT[\s\S]*$/, '').trim()
        setResults(prev => ({ ...prev, summary: summaryText }))
        if (sentPart) setSentiment(parseSentiment(sentPart))
        result = summaryText

      } else if (mode === 'keypoints') {
        prompt = `Extract the most important key points from these documents as a structured bulleted list. Group by theme if multiple documents. Use • for bullets and bold (**text**) for themes.${langSuffix}\n\nDocuments:\n${ctx}`
        result = await callGemini(prompt, { temperature: 0.3 })
        setResults(prev => ({ ...prev, keypoints: result }))

      } else if (mode === 'action') {
        prompt = `Extract ALL action items, decisions, and next steps. For each item include: the task, responsible person (if mentioned), deadline (if mentioned), and priority (High/Medium/Low based on context).
Format as:\n• [ ] Task — Owner: X — Due: Y — Priority: Z${langSuffix}\n\nDocuments:\n${ctx}`
        result = await callGemini(prompt, { temperature: 0.3 })
        setResults(prev => ({ ...prev, action: result }))

      } else if (mode === 'eli5') {
        prompt = `Explain the key ideas from these documents as if you're talking to a curious 10-year-old. Use simple words, relatable analogies, and a friendly tone. Avoid all jargon.${langSuffix}\n\nDocuments:\n${ctx}`
        result = await callGemini(prompt, { temperature: 0.5 })
        setResults(prev => ({ ...prev, eli5: result }))

      } else if (mode === 'compare') {
        if (selectedDocs.length < 2) {
          setResults(prev => ({ ...prev, compare: '__need_two__' }))
          setLoading(null); return
        }
        prompt = `Compare and contrast these ${selectedDocs.length} documents. Structure your comparison by theme/section. Show:
- What they AGREE on (prefix with ✓)
- What is UNIQUE to each doc (prefix with Doc N only:)
- Where they CONTRADICT each other (prefix with ⚠ CONFLICT:)${langSuffix}\n\nDocuments:\n${ctx}`
        result = await callGemini(prompt, { temperature: 0.3 })
        setResults(prev => ({ ...prev, compare: result }))

      } else if (mode === 'entities') {
        prompt = `Extract all named entities from these documents. Return ONLY a JSON object (no explanation, no markdown fences):
{
  "people": [{"name": "...", "mentions": N, "role": "..."}],
  "orgs": [{"name": "...", "mentions": N, "context": "..."}],
  "dates": [{"value": "...", "mentions": N, "context": "..."}],
  "monetary": [{"value": "...", "mentions": N, "context": "..."}]
}

Documents:\n${ctx}`
        const raw = await callGemini(prompt, { temperature: 0.1 })
        const parsed = parseEntities(raw)
        setEntities(parsed)
        setResults(prev => ({ ...prev, entities: raw }))
        result = parsed || raw

      } else if (mode === 'flashcards') {
        prompt = `Generate 8 high-quality study flashcard Q&A pairs covering the most important concepts, facts, and decisions from these documents.
Format EACH card exactly as:
Q: [clear question]
A: [concise answer]
---
${langSuffix}
Documents:\n${ctx}`
        const raw = await callGemini(prompt, { temperature: 0.4 })
        const cards = parseFlashcards(raw)
        setFlashcards(cards)
        setFlippedCards(new Set())
        setResults(prev => ({ ...prev, flashcards: raw }))
        result = raw

      } else if (mode === 'glossary') {
        prompt = `Extract all acronyms, technical terms, and domain-specific jargon from these documents. For each, provide:
- The full term/expansion
- A clear, context-aware definition from the document
- Example of how it's used in the document

Format as a clean definition list, alphabetically sorted.${langSuffix}\n\nDocuments:\n${ctx}`
        result = await callGemini(prompt, { temperature: 0.3 })
        setResults(prev => ({ ...prev, glossary: result }))
      }
    } catch (err) {
      setResults(prev => ({ ...prev, [mode]: `Error: ${err.message}` }))
    }
    setLoading(null)
  }

  // ── Right panel actions ──────────────────────────────────────────────────
  async function runCitations() {
    if (!selectedDocs.length) return
    setLoading('citations')
    try {
      const ctx = buildContext(selectedDocs)
      const r = await callGemini(
        `For each key claim or important statement in these documents, provide a grounded citation.
Format each citation as:
[Doc N, Page ~X] "exact quoted sentence or close paraphrase"
→ Significance: why this claim matters

List at least 10 citations.

Documents:\n${ctx}`,
        { temperature: 0.2 }
      )
      setCitations(r)
    } catch (err) { setCitations(`Error: ${err.message}`) }
    setLoading(null)
  }

  async function runConflicts() {
    if (!selectedDocs.length) return
    setLoading('conflicts')
    try {
      const ctx = buildContext(selectedDocs)
      const r = await callGemini(
        `Identify ALL contradictions and inconsistencies in these documents. For each conflict:
⚠ CONFLICT #N
Topic: <what it's about>
Statement A: "[quote]" — [Doc X]
Statement B: "[quote]" — [Doc Y]
Status: UNRESOLVED / RESOLVED (if one document clarifies)
Resolution: <suggested way to reconcile, or "Requires clarification">
---

Documents:\n${ctx}`,
        { temperature: 0.2 }
      )
      setConflicts(r)
    } catch (err) { setConflicts(`Error: ${err.message}`) }
    setLoading(null)
  }

  async function sendChat() {
    if (!chatInput.trim() || loading === 'chat') return
    const text = chatInput.trim()
    setChatInput('')
    setChatMessages(prev => [...prev, { role: 'user', text }])
    setLoading('chat')
    try {
      const ctx = buildContext(selectedDocs)
      const r = await callGemini(text, {
        temperature: 0.4,
        systemInstruction: `You are an expert document analyst with full access to ${selectedDocs.length} document(s) totalling ${selectedDocs.reduce((s, d) => s + d.words, 0)} words.
Documents: ${ctx.substring(0, 6000)}
Answer questions about the documents accurately and concisely. Always include a citation at the end of each key claim in the format [Doc N, ~p.X]. Be helpful and specific.`,
      })
      setChatMessages(prev => [...prev, { role: 'assistant', text: r }])
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', text: `Error: ${err.message}` }])
    }
    setLoading(null)
  }

  // ── Export ───────────────────────────────────────────────────────────────
  function buildExportText() {
    const parts = []
    if (exportChecks.summary    && results.summary)    parts.push('# Summary\n\n' + results.summary)
    if (exportChecks.keypoints  && results.keypoints)  parts.push('# Key Points\n\n' + results.keypoints)
    if (exportChecks.action     && results.action)     parts.push('# Action Items\n\n' + results.action)
    if (exportChecks.entities   && results.entities)   parts.push('# Entities\n\n' + results.entities)
    if (exportChecks.flashcards && results.flashcards) parts.push('# Flashcards\n\n' + results.flashcards)
    if (exportChecks.glossary   && results.glossary)   parts.push('# Glossary\n\n' + results.glossary)
    return parts.join('\n\n---\n\n') || '(No content generated yet — run analysis modes first)'
  }

  function handleExport(destId) {
    const content = buildExportText()
    if (destId === 'markdown') { downloadFile('document-analysis.md', content); return }
    if (destId === 'pdf') { downloadFile('document-analysis.txt', content); return }
    navigator.clipboard.writeText(content)
    doCopy(content, destId)
  }

  // ── Sentiment bars render ────────────────────────────────────────────────
  const SENTIMENT_META = [
    { key: 'professional', label: 'Professional', color: '#6366f1' },
    { key: 'cautious',     label: 'Cautious',     color: '#f59e0b' },
    { key: 'urgent',       label: 'Urgent',       color: '#ef4444' },
    { key: 'optimistic',   label: 'Optimistic',   color: '#10b981' },
  ]

  // ────────────────────────────────────────────────────────────────────────
  const currentResult = results[mode]
  const totalWords    = selectedDocs.reduce((s, d) => s + d.words, 0)
  const totalPages    = selectedDocs.reduce((s, d) => s + d.pages, 0)

  return (
    <ToolLayout icon={FileText} title="Doc Summarizer" description="Multi-document intelligence — summarize, compare, and extract insights" color="#f59e0b">
      <div
        className="flex border border-gray-800 rounded-xl overflow-hidden bg-gray-950"
        style={{ height: 'calc(100vh - 165px)' }}
      >

        {/* ══════════════════════════════════════════
            LEFT SIDEBAR — Multi-Document Workspace
           ══════════════════════════════════════════ */}
        <div className="w-56 flex-shrink-0 border-r border-gray-800 flex flex-col min-h-0">

          {/* Header */}
          <div className="px-3 py-3 border-b border-gray-800 flex-shrink-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-gray-400 tracking-wider">DOCUMENTS</span>
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1 px-2 py-1 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-600/30 text-amber-400 text-[10px] rounded-lg cursor-pointer transition-colors"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
              <input ref={fileRef} type="file" accept=".txt,.md,.csv,.json" multiple onChange={handleUpload} className="hidden" />
            </div>
            <p className="text-[10px] text-gray-600">{totalWords.toLocaleString()} words · ~{totalPages} pages</p>
          </div>

          {/* File list */}
          <div className="flex-1 overflow-y-auto min-h-0 py-1.5 px-2 space-y-1.5">
            {docs.map(doc => {
              const sel = selectedIds.includes(doc.id)
              return (
                <div
                  key={doc.id}
                  className={`rounded-xl p-2.5 cursor-pointer border transition-all ${
                    sel ? 'border-opacity-40 bg-opacity-10' : 'border-gray-800 opacity-50'
                  }`}
                  style={sel ? { borderColor: doc.color + '60', backgroundColor: doc.color + '10' } : {}}
                  onClick={() => toggleSelect(doc.id)}
                >
                  <div className="flex items-start gap-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: doc.color + '25' }}
                    >
                      <FileText className="w-3.5 h-3.5" style={{ color: doc.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-gray-300 truncate">{doc.name}</p>
                      <p className="text-[9px] text-gray-600">{doc.words.toLocaleString()} words · ~{doc.pages}p</p>
                    </div>
                    {doc.id !== 'demo1' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); removeDoc(doc.id) }}
                        className="p-0.5 hover:bg-gray-700 rounded cursor-pointer text-gray-600 hover:text-red-400 transition-colors flex-shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  {sel && (
                    <div className="mt-1.5 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: doc.color }} />
                      <span className="text-[9px]" style={{ color: doc.color }}>Included in analysis</span>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Drop zone */}
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full border border-dashed border-gray-800 hover:border-amber-600/40 rounded-xl p-3 text-center cursor-pointer transition-colors group"
            >
              <Upload className="w-4 h-4 text-gray-700 group-hover:text-amber-600 mx-auto mb-1 transition-colors" />
              <p className="text-[10px] text-gray-700 group-hover:text-gray-500">.txt · .md · .csv</p>
            </button>
          </div>

          {/* Output language */}
          <div className="border-t border-gray-800 px-3 py-2.5 flex-shrink-0">
            <div className="flex items-center gap-2 mb-1.5">
              <Languages className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              <span className="text-[10px] font-semibold text-gray-500">OUTPUT LANGUAGE</span>
            </div>
            <select
              value={outputLang}
              onChange={e => setOutputLang(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 text-gray-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
            >
              {LANGUAGES.map(l => <option key={l}>{l}</option>)}
            </select>
            {outputLang !== 'English' && (
              <p className="text-[9px] text-amber-600 mt-1">Results translated into {outputLang}</p>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════
            CENTER — 9-mode Analysis Panel
           ══════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">

          {/* Mode tabs */}
          <div className="flex items-center border-b border-gray-800 bg-[#0a0a12] flex-shrink-0 overflow-x-auto px-1">
            {MODES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setMode(id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors cursor-pointer border-b-2 -mb-px whitespace-nowrap flex-shrink-0 ${
                  mode === id
                    ? 'text-amber-400 border-amber-500 bg-gray-950'
                    : 'text-gray-600 border-transparent hover:text-gray-400'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Mode content */}
          <div className="flex-1 overflow-hidden min-h-0">

            {/* ── EXPORT mode (no API call) ── */}
            {mode === 'export' ? (
              <div className="h-full overflow-y-auto p-5">
                <p className="text-sm font-semibold text-gray-200 mb-1">Export Analysis</p>
                <p className="text-xs text-gray-500 mb-5">Choose what to include, then pick a destination</p>

                {/* Content checklist */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-5">
                  <p className="text-xs font-semibold text-gray-400 mb-3">Include in Export</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(exportChecks).map(([key, val]) => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer group">
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                            val ? 'bg-amber-600 border-amber-600' : 'border-gray-600 group-hover:border-gray-400'
                          }`}
                          onClick={() => setExportChecks(prev => ({ ...prev, [key]: !val }))}
                        >
                          {val && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <span className="text-xs text-gray-400 capitalize group-hover:text-gray-300 transition-colors">
                          {key === 'keypoints' ? 'Key Points' : key === 'action' ? 'Action Items' : key.charAt(0).toUpperCase() + key.slice(1)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Destination buttons */}
                <p className="text-xs font-semibold text-gray-400 mb-3">Export Destination</p>
                <div className="grid grid-cols-3 gap-3">
                  {EXPORT_DESTS.map(({ id, label, icon: Icon, color }) => (
                    <button
                      key={id}
                      onClick={() => handleExport(id)}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-800 hover:border-opacity-60 cursor-pointer transition-all group"
                      style={{ ':hover': { borderColor: color } }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = color + '80'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = ''}
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: color + '20' }}>
                        {copied === id
                          ? <Check className="w-5 h-5 text-green-400" />
                          : <Icon className="w-5 h-5" style={{ color }} />
                        }
                      </div>
                      <span className="text-xs font-medium text-gray-400 group-hover:text-gray-200 transition-colors">
                        {copied === id ? 'Copied!' : label}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Preview */}
                <div className="mt-5 bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <p className="text-[10px] text-gray-600 mb-2">EXPORT PREVIEW</p>
                  <pre className="text-xs text-gray-500 font-mono whitespace-pre-wrap line-clamp-6 leading-relaxed">
                    {buildExportText().slice(0, 400)}{buildExportText().length > 400 ? '\n…' : ''}
                  </pre>
                </div>
              </div>
            ) : (

              /* ── All other modes ── */
              <div className="h-full flex flex-col min-h-0">

                {/* Run button bar */}
                <div className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-800 bg-gray-900/40 flex-shrink-0">
                  <button
                    onClick={runMode}
                    disabled={!selectedDocs.length || !!loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {loading === mode
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Zap className="w-3.5 h-3.5" />
                    }
                    {loading === mode ? 'Analyzing…' : `Run ${MODES.find(m => m.id === mode)?.label}`}
                  </button>
                  {selectedDocs.length === 0 && (
                    <p className="text-xs text-red-400">Select at least one document</p>
                  )}
                  {mode === 'compare' && selectedDocs.length < 2 && selectedDocs.length > 0 && (
                    <p className="text-xs text-amber-400">Select 2+ documents to compare</p>
                  )}
                  {currentResult && (
                    <button
                      onClick={() => doCopy(typeof currentResult === 'string' ? currentResult : JSON.stringify(currentResult, null, 2), 'main')}
                      className="ml-auto flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 cursor-pointer transition-colors"
                    >
                      {copied === 'main' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                      Copy
                    </button>
                  )}
                </div>

                {/* Result area */}
                <div className="flex-1 overflow-y-auto min-h-0">

                  {/* Loading */}
                  {loading === mode && (
                    <div className="flex flex-col items-center justify-center h-full gap-3">
                      <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                      <p className="text-sm text-gray-400">Analyzing {selectedDocs.length} document{selectedDocs.length > 1 ? 's' : ''}…</p>
                    </div>
                  )}

                  {/* Empty state */}
                  {!loading && !currentResult && (
                    <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                      {(() => { const m = MODES.find(x => x.id === mode); const I = m?.icon || FileText; return <I className="w-10 h-10 text-gray-800" /> })()}
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          {mode === 'compare' && selectedDocs.length < 2
                            ? 'Select 2 or more documents to compare'
                            : `Click "Run ${MODES.find(m => m.id === mode)?.label}" to analyze`}
                        </p>
                        <p className="text-xs text-gray-700 mt-1">{selectedDocs.length} document{selectedDocs.length !== 1 ? 's' : ''} selected</p>
                      </div>
                    </div>
                  )}

                  {/* ── SUMMARY result ── */}
                  {!loading && mode === 'summary' && currentResult && (
                    <div className="p-5 space-y-5">
                      <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{currentResult}</div>
                      {/* Sentiment bars */}
                      {sentiment && (
                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
                          <p className="text-xs font-semibold text-gray-500">DOCUMENT TONE ANALYSIS</p>
                          {SENTIMENT_META.map(({ key, label, color }) => (
                            <div key={key} className="flex items-center gap-3">
                              <span className="w-24 text-xs text-gray-500 flex-shrink-0">{label}</span>
                              <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                <div
                                  className="h-1.5 rounded-full transition-all duration-700"
                                  style={{ width: `${sentiment[key]}%`, backgroundColor: color }}
                                />
                              </div>
                              <span className="text-xs font-medium w-8 text-right flex-shrink-0" style={{ color }}>{sentiment[key]}%</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── KEY POINTS / ACTION / ELI5 / COMPARE / GLOSSARY result ── */}
                  {!loading && ['keypoints','action','eli5','compare','glossary'].includes(mode) && currentResult && (
                    <div className="p-5">
                      {mode === 'compare' && currentResult === '__need_two__' ? (
                        <div className="flex items-center justify-center h-40 text-amber-400 text-sm">
                          Select 2+ documents to enable comparison
                        </div>
                      ) : (
                        <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{currentResult}</div>
                      )}
                    </div>
                  )}

                  {/* ── ENTITIES result ── */}
                  {!loading && mode === 'entities' && currentResult && (
                    <div className="p-4 space-y-4">
                      {entities ? (
                        <>
                          {[
                            { key: 'people',   label: 'People',       color: '#6366f1' },
                            { key: 'orgs',     label: 'Organizations',color: '#ec4899' },
                            { key: 'dates',    label: 'Dates',        color: '#f59e0b' },
                            { key: 'monetary', label: 'Monetary',     color: '#10b981' },
                          ].map(({ key, label, color }) => (
                            entities[key]?.length > 0 && (
                              <div key={key} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-800"
                                  style={{ background: color + '10' }}>
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                                  <span className="text-xs font-semibold" style={{ color }}>{label}</span>
                                  <span className="ml-auto text-[10px] text-gray-600">{entities[key].length} found</span>
                                </div>
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="border-b border-gray-800">
                                      <th className="text-left px-4 py-2 text-gray-600 font-medium">Name / Value</th>
                                      <th className="text-left px-4 py-2 text-gray-600 font-medium">Mentions</th>
                                      <th className="text-left px-4 py-2 text-gray-600 font-medium">Context</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {entities[key].map((item, i) => (
                                      <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/40">
                                        <td className="px-4 py-2 font-medium text-gray-300">{item.name || item.value}</td>
                                        <td className="px-4 py-2">
                                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{ background: color + '20', color }}>
                                            ×{item.mentions}
                                          </span>
                                        </td>
                                        <td className="px-4 py-2 text-gray-500 truncate max-w-xs">{item.context || item.role || '—'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )
                          ))}
                        </>
                      ) : (
                        <pre className="text-xs text-gray-400 font-mono whitespace-pre-wrap leading-relaxed">{currentResult}</pre>
                      )}
                    </div>
                  )}

                  {/* ── FLASHCARDS result ── */}
                  {!loading && mode === 'flashcards' && currentResult && (
                    <div className="p-4">
                      {flashcards.length > 0 ? (
                        <>
                          <p className="text-xs text-gray-600 mb-3">Click a card to reveal the answer</p>
                          <div className="grid grid-cols-2 gap-3">
                            {flashcards.map((card, i) => {
                              const flipped = flippedCards.has(i)
                              return (
                                <div
                                  key={i}
                                  onClick={() => setFlippedCards(prev => {
                                    const next = new Set(prev)
                                    flipped ? next.delete(i) : next.add(i)
                                    return next
                                  })}
                                  className="rounded-xl border cursor-pointer transition-all min-h-[100px] p-4 flex flex-col justify-between"
                                  style={{
                                    borderColor: flipped ? '#f59e0b60' : '#374151',
                                    background: flipped ? '#f59e0b0a' : '#111827',
                                  }}
                                >
                                  {!flipped ? (
                                    <>
                                      <p className="text-xs font-semibold text-amber-400 mb-1">Q{i + 1}</p>
                                      <p className="text-sm text-gray-200 leading-snug">{card.q}</p>
                                      <p className="text-[10px] text-gray-700 mt-2">Tap to reveal answer →</p>
                                    </>
                                  ) : (
                                    <>
                                      <p className="text-xs font-semibold text-green-400 mb-1">Answer</p>
                                      <p className="text-sm text-gray-300 leading-snug">{card.a}</p>
                                      <p className="text-[10px] text-gray-700 mt-2">Tap to flip back</p>
                                    </>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                          <div className="flex gap-2 mt-4">
                            <button
                              onClick={() => setFlippedCards(new Set(flashcards.map((_, i) => i)))}
                              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg cursor-pointer"
                            >
                              Reveal All
                            </button>
                            <button
                              onClick={() => setFlippedCards(new Set())}
                              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg cursor-pointer"
                            >
                              Reset
                            </button>
                            <button
                              onClick={() => {
                                const text = flashcards.map((c, i) => `Q${i+1}: ${c.q}\nA: ${c.a}`).join('\n\n')
                                downloadFile('flashcards.txt', text)
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-600/30 text-amber-400 text-xs rounded-lg cursor-pointer"
                            >
                              <FileDown className="w-3 h-3" /> Export to Anki
                            </button>
                          </div>
                        </>
                      ) : (
                        <pre className="text-xs text-gray-400 whitespace-pre-wrap">{currentResult}</pre>
                      )}
                    </div>
                  )}

                </div>
              </div>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════
            RIGHT PANEL — Chat / Citations / Conflicts
           ══════════════════════════════════════════ */}
        <div className="w-72 flex-shrink-0 border-l border-gray-800 flex flex-col min-h-0">

          {/* Right tab bar */}
          <div className="flex border-b border-gray-800 flex-shrink-0">
            {RIGHT_TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  setRightTab(id)
                  if (id === 'citations' && !citations && !loading) runCitations()
                  if (id === 'conflicts' && !conflicts && !loading) runConflicts()
                }}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors cursor-pointer border-b-2 -mb-px ${
                  rightTab === id
                    ? 'text-amber-400 border-amber-500'
                    : 'text-gray-700 border-transparent hover:text-gray-400'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Right content */}
          <div className="flex-1 overflow-hidden min-h-0">

            {/* ── CHAT ── */}
            {rightTab === 'chat' && (
              <div className="flex flex-col h-full min-h-0">
                <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[92%] rounded-xl px-3 py-2 text-[11px] leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-amber-700 text-white rounded-br-sm'
                          : 'bg-gray-800 text-gray-300 rounded-bl-sm'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {loading === 'chat' && (
                    <div className="flex justify-start">
                      <div className="bg-gray-800 rounded-xl rounded-bl-sm px-3 py-2.5">
                        <div className="flex gap-1">
                          {[0,1,2].map(i => (
                            <div key={i} className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce"
                              style={{ animationDelay: `${i * 150}ms` }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEnd} />
                </div>
                <div className="flex-shrink-0 px-3 py-1.5 border-t border-gray-800 bg-gray-900/50">
                  <p className="text-[10px] text-gray-700">
                    <span className="text-amber-700">◉</span> RAG · {selectedDocs.length} doc{selectedDocs.length !== 1 ? 's' : ''} · {totalWords.toLocaleString()} words
                  </p>
                </div>
                <div className="flex-shrink-0 border-t border-gray-800 p-2 flex gap-1.5">
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()}
                    placeholder="Ask about the documents…"
                    className="flex-1 px-2.5 py-1.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <button
                    onClick={sendChat}
                    disabled={!chatInput.trim() || loading === 'chat'}
                    className="p-1.5 bg-amber-600 hover:bg-amber-700 rounded-lg disabled:opacity-50 cursor-pointer flex-shrink-0"
                  >
                    <Send className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              </div>
            )}

            {/* ── CITATIONS ── */}
            {rightTab === 'citations' && (
              <div className="h-full overflow-y-auto">
                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800 flex-shrink-0">
                  <span className="text-[10px] font-semibold text-gray-600">SOURCE CITATIONS</span>
                  <button
                    onClick={runCitations}
                    disabled={!!loading || !selectedDocs.length}
                    className="flex items-center gap-1 text-[10px] text-amber-500 hover:text-amber-400 cursor-pointer disabled:opacity-50"
                  >
                    {loading === 'citations' ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                    Refresh
                  </button>
                </div>
                {loading === 'citations' && (
                  <div className="flex items-center justify-center h-32"><Loader2 className="w-5 h-5 text-amber-500 animate-spin" /></div>
                )}
                {!loading && !citations && (
                  <div className="flex flex-col items-center justify-center h-40 text-center px-4">
                    <Quote className="w-8 h-8 text-gray-800 mb-2" />
                    <p className="text-xs text-gray-600">Auto-generates when you open this tab</p>
                  </div>
                )}
                {citations && (
                  <pre className="text-[11px] text-gray-400 font-mono whitespace-pre-wrap leading-relaxed p-3">{citations}</pre>
                )}
              </div>
            )}

            {/* ── CONFLICTS ── */}
            {rightTab === 'conflicts' && (
              <div className="h-full overflow-y-auto">
                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800 flex-shrink-0">
                  <span className="text-[10px] font-semibold text-gray-600">CONTRADICTION LOG</span>
                  <button
                    onClick={runConflicts}
                    disabled={!!loading || !selectedDocs.length}
                    className="flex items-center gap-1 text-[10px] text-amber-500 hover:text-amber-400 cursor-pointer disabled:opacity-50"
                  >
                    {loading === 'conflicts' ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                    Refresh
                  </button>
                </div>
                {loading === 'conflicts' && (
                  <div className="flex items-center justify-center h-32"><Loader2 className="w-5 h-5 text-amber-500 animate-spin" /></div>
                )}
                {!loading && !conflicts && (
                  <div className="flex flex-col items-center justify-center h-40 text-center px-4">
                    <AlertTriangle className="w-8 h-8 text-gray-800 mb-2" />
                    <p className="text-xs text-gray-600">Auto-generates when you open this tab</p>
                  </div>
                )}
                {conflicts && (
                  <div className="p-3 space-y-3">
                    {conflicts.split('---').filter(s => s.trim()).map((block, i) => (
                      <div key={i} className="bg-gray-900 border border-amber-500/20 rounded-xl p-3">
                        <pre className="text-[11px] text-gray-400 font-mono whitespace-pre-wrap leading-relaxed">{block.trim()}</pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
