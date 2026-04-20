import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Brain, Search, Loader2, FileText, Trash2, MessageSquare,
  Upload, RefreshCw, CheckCircle2, AlertTriangle, Clock,
  Plus, Send, Download, BookOpen, Link, Star, ChevronDown,
  ChevronRight, Activity, Users, BarChart3, Eye, Zap,
  FileVideo, Image, Music, Github, Slack, HardDrive, Layers, X,
} from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'
import { callGemini } from '../../config/gemini'

// ─── Initial Data ──────────────────────────────────────────────────────────

const INIT_SOURCES = [
  { id: 1, label: 'Google Drive', icon: HardDrive, color: '#4285f4', docs: 18, status: 'synced', lastSync: '2m ago' },
  { id: 2, label: 'Notion', icon: BookOpen, color: '#ffffff', docs: 14, status: 'synced', lastSync: '5m ago' },
  { id: 3, label: 'Slack', icon: Slack, color: '#4a154b', docs: 11, status: 'syncing', lastSync: 'now' },
  { id: 4, label: 'GitHub', icon: Github, color: '#f0f6fc', docs: 7, status: 'synced', lastSync: '10m ago' },
]

const FOLDERS = [
  { label: 'Legal', count: 8, conflicts: 2 },
  { label: 'Technical', count: 14, conflicts: 0 },
  { label: 'HR', count: 9, conflicts: 0 },
  { label: 'Finance', count: 11, conflicts: 0 },
  { label: 'Product', count: 8, conflicts: 0 },
]

const INIT_DOCS = [
  { id: 1, title: 'Revenue Report Q1 2025', tags: ['#Finance', '#AI-tagged'], status: 'verified', source: 'Google Drive', type: 'pdf', conflict: false },
  { id: 2, title: 'SaaS Pricing Strategy 2026', tags: ['#Pricing', '#Finance'], status: 'pending', source: 'Notion', type: 'doc', conflict: false },
  { id: 3, title: 'Refund Policy — Customer Terms', tags: ['#Legal', '#AI-tagged'], status: 'stale', source: 'Google Drive', type: 'pdf', conflict: true },
  { id: 4, title: 'API Authentication Guide', tags: ['#Technical'], status: 'verified', source: 'GitHub', type: 'md', conflict: false },
  { id: 5, title: 'Q4 All-Hands Meeting Recording', tags: ['#HR', '#AI-tagged'], status: 'verified', source: 'Slack', type: 'mp4', conflict: false },
  { id: 6, title: 'Product Roadmap 2025–2026', tags: ['#Product', '#AI-tagged'], status: 'pending', source: 'Notion', type: 'doc', conflict: false },
  { id: 7, title: 'Competitor Pricing Analysis', tags: ['#Pricing', '#Finance'], status: 'stale', source: 'Google Drive', type: 'img', conflict: false },
]

const GAP_QUERIES = [
  { id: 1, query: 'How do I reset 2FA on my account?', count: 142, status: 'no-doc' },
  { id: 2, query: 'What is the SLA for enterprise support?', count: 98, status: 'partial' },
  { id: 3, query: 'How to export data in bulk?', count: 87, status: 'no-doc' },
  { id: 4, query: 'Can I use the API with Python SDK?', count: 74, status: 'partial' },
  { id: 5, query: 'What payment methods are accepted?', count: 61, status: 'no-doc' },
  { id: 6, query: 'How to invite team members?', count: 54, status: 'no-doc' },
  { id: 7, query: 'Is there a mobile app?', count: 48, status: 'partial' },
  { id: 8, query: 'How long does refund processing take?', count: 41, status: 'no-doc' },
]

const DRAFT_TEMPLATES = {
  1: `# How to Reset 2FA on Your Account\n\n## Steps\n1. Go to **Settings → Security → Two-Factor Auth**\n2. Click **"Reset 2FA"** and verify your identity via email\n3. Scan the new QR code with your authenticator app\n4. Enter the 6-digit code to confirm\n\n> If you've lost access to your authenticator, contact support@company.com with your account email and photo ID.\n\n*Source: Generated from support ticket patterns — 142 user asks*`,
  2: `# Enterprise Support SLA\n\n| Priority | Response Time | Resolution Target |\n|----------|--------------|------------------|\n| P1 – Critical | 1 hour | 4 hours |\n| P2 – High | 4 hours | 24 hours |\n| P3 – Medium | 1 business day | 5 business days |\n| P4 – Low | 3 business days | 14 business days |\n\nSLA applies to Enterprise and Business plans only.\n\n*Source: Generated from support patterns — 98 user asks*`,
  3: `# Bulk Data Export Guide\n\n## Via Dashboard\n1. Navigate to **Settings → Data → Export**\n2. Select date range and data types\n3. Click **"Generate Export"** — you'll receive an email when ready (typically 5–15 min)\n\n## Via API\n\`\`\`bash\ncurl -X POST https://api.yourapp.com/v2/exports \\\n  -H "Authorization: Bearer YOUR_TOKEN" \\\n  -d '{"format":"csv","range":"last_90_days"}'\n\`\`\`\n\n*Source: Generated from support patterns — 87 user asks*`,
  4: `# Python SDK Quickstart\n\n\`\`\`bash\npip install yourapp-sdk\n\`\`\`\n\n\`\`\`python\nfrom yourapp import Client\n\nclient = Client(api_key="YOUR_API_KEY")\nresults = client.query("your question here")\nprint(results.answer)\n\`\`\`\n\nFull SDK reference: https://docs.yourapp.com/sdk/python\n\n*Source: Generated from support patterns — 74 user asks*`,
  5: `# Accepted Payment Methods\n\n| Method | Plans | Notes |\n|--------|-------|-------|\n| Visa / Mastercard / Amex | All | Processed via Stripe |\n| PayPal | All | Linked account required |\n| Bank Transfer (ACH/SEPA) | Annual plans only | 3–5 business days |\n| Apple Pay / Google Pay | Mobile app only | |\n| Invoicing | Enterprise | Net-30 terms |\n\n*Source: Generated from support patterns — 61 user asks*`,
  6: `# How to Invite Team Members\n\n1. Go to **Settings → Team → Members**\n2. Click **"Invite Members"**\n3. Enter email addresses (comma-separated for bulk)\n4. Choose their role: Admin / Editor / Viewer\n5. Click **"Send Invites"** — invites expire after 7 days\n\n**Limits by plan:** Starter: 5 seats · Professional: 25 seats · Enterprise: Unlimited\n\n*Source: Generated from support patterns — 54 user asks*`,
  7: `# Mobile App\n\nYes! YourApp has native apps for iOS and Android.\n\n- **iOS:** Available on App Store (requires iOS 15+)\n- **Android:** Available on Google Play (requires Android 11+)\n\n**Features available on mobile:**\n- View dashboards and reports\n- Receive push notifications\n- Approve/reject items on the go\n\n*Source: Generated from support patterns — 48 user asks*`,
  8: `# Refund Processing Timeline\n\n> ⚠️ **Conflict detected** — two versions exist:\n\n| Version | Timeline |\n|---------|----------|\n| 2025 Policy (current) | 7–10 business days |\n| 2026 Draft | 3–5 business days |\n\n**Action required:** Resolve conflict in Health Check before publishing.\n\n*Source: Generated from support patterns — 41 user asks*`,
}

const QUIZ_CARDS = [
  { q: 'According to the Refund Policy, what is the standard processing time for approved refunds?', options: ['3–5 business days', '7–10 business days', '24 hours', '14–21 business days'], correct: 1, source: 'Refund Policy — Customer Terms, p.3' },
  { q: 'Which authentication method is recommended for the public API according to the API guide?', options: ['API Key in query string', 'Bearer Token in Authorization header', 'Basic Auth', 'OAuth 2.0 only'], correct: 1, source: 'API Authentication Guide, §2.1' },
  { q: 'What is the enterprise SLA response time for P1 (critical) incidents?', options: ['4 hours', '1 hour', '24 hours', 'Not documented'], correct: 3, source: 'Gap detected — no SLA document found' },
]

const INIT_SYNC_LOG = [
  { t: '14:44:18', type: 'success', msg: 'Google Drive synced — 3 new docs added' },
  { t: '14:43:55', type: 'info', msg: 'OCR complete: Competitor Pricing Analysis.jpg' },
  { t: '14:43:40', type: 'success', msg: 'MP4 transcript: Q4 All-Hands — 47 min → text' },
  { t: '14:43:22', type: 'warning', msg: 'Conflict detected: Refund Policy (2025 vs 2026 versions)' },
  { t: '14:43:08', type: 'info', msg: 'Notion synced — 1 doc updated' },
  { t: '14:42:50', type: 'warning', msg: 'Stale doc: SaaS Pricing Strategy (90 days old)' },
  { t: '14:42:33', type: 'success', msg: 'GitHub synced — API Authentication Guide v2.1' },
  { t: '14:42:10', type: 'info', msg: 'Slack: 4 new message threads indexed' },
]

const CITATIONS = [
  { id: 1, source: 'SaaS Pricing Strategy 2026', page: 'p.4', line: 'Line 18', text: '"Standard plan at $49/mo includes up to 5 team seats…"', conflict: false },
  { id: 2, source: 'Revenue Report Q1 2025', page: 'p.12', line: 'Table 3', text: '"Average revenue per user (ARPU): $134.90 in Q1…"', conflict: false },
  { id: 3, source: 'Refund Policy 2025', page: 'p.3', line: 'Line 7', text: '"Refunds processed within 7–10 business days of approval…"', conflict: true },
  { id: 4, source: 'Refund Policy 2026 (DRAFT)', page: 'p.2', line: 'Line 3', text: '"Approved refunds are processed within 3–5 business days…"', conflict: true },
]

function nowTime() {
  return new Date().toTimeString().slice(0, 8)
}

// ─── Toast ─────────────────────────────────────────────────────────────────

function Toast({ toasts }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="bg-gray-800 border border-gray-700 text-white text-sm rounded-xl px-4 py-3 shadow-2xl flex items-center gap-2.5 max-w-sm animate-in slide-in-from-right">
          {t.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
            : t.type === 'warning' ? <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            : <Zap className="w-4 h-4 text-indigo-400 shrink-0" />}
          <span className="text-sm text-gray-200">{t.msg}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const s = {
    verified: { cls: 'bg-green-500/15 text-green-400 border-green-500/30', icon: <CheckCircle2 className="w-3 h-3" />, label: 'Verified' },
    pending: { cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30', icon: <Clock className="w-3 h-3" />, label: 'Pending' },
    stale: { cls: 'bg-red-500/15 text-red-400 border-red-500/30', icon: <AlertTriangle className="w-3 h-3" />, label: 'Stale' },
  }[status]
  return <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${s.cls}`}>{s.icon}{s.label}</span>
}

function DocTypeIcon({ type }) {
  const icons = { pdf: <FileText className="w-4 h-4 text-red-400" />, doc: <FileText className="w-4 h-4 text-blue-400" />, md: <FileText className="w-4 h-4 text-green-400" />, mp4: <FileVideo className="w-4 h-4 text-violet-400" />, img: <Image className="w-4 h-4 text-yellow-400" /> }
  return icons[type] || <FileText className="w-4 h-4 text-gray-400" />
}

// ─── Views ─────────────────────────────────────────────────────────────────

function DocumentsView({ docs, setDocs, showToast }) {
  const [search, setSearch] = useState('')
  const fileRef = useRef(null)

  const filtered = docs.filter(d => d.title.toLowerCase().includes(search.toLowerCase()))

  function handleFileUpload(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return
    const newDocs = files.map((f, i) => {
      const ext = f.name.split('.').pop().toLowerCase()
      const typeMap = { pdf: 'pdf', doc: 'doc', docx: 'doc', md: 'md', txt: 'md', mp4: 'mp4', jpg: 'img', jpeg: 'img', png: 'img', gif: 'img' }
      return {
        id: Date.now() + i,
        title: f.name.replace(/\.[^/.]+$/, ''),
        tags: ['#Uploaded'],
        status: 'pending',
        source: 'Local Upload',
        type: typeMap[ext] || 'doc',
        conflict: false,
        size: (f.size / 1024).toFixed(1) + ' KB',
      }
    })
    setDocs(prev => [...newDocs, ...prev])
    showToast({ type: 'success', msg: `${files.length} file${files.length > 1 ? 's' : ''} uploaded successfully` })
    e.target.value = ''
  }

  function deleteDoc(id) {
    const doc = docs.find(d => d.id === id)
    setDocs(prev => prev.filter(d => d.id !== id))
    showToast({ type: 'info', msg: `"${doc?.title}" removed from knowledge base` })
  }

  return (
    <div className="space-y-3 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 260px)' }}>
      <input type="file" ref={fileRef} multiple accept=".pdf,.doc,.docx,.md,.txt,.mp4,.jpg,.jpeg,.png,.gif" className="hidden" onChange={handleFileUpload} />
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents…" className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40" />
        </div>
        <button onClick={() => fileRef.current?.click()} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg cursor-pointer transition-colors flex items-center gap-1.5">
          <Upload className="w-4 h-4" /> Upload
        </button>
      </div>
      <div className="space-y-2">
        {filtered.map(doc => (
          <div key={doc.id} className={`bg-gray-900 border rounded-xl p-3.5 flex items-center gap-3 ${doc.conflict ? 'border-red-500/30 bg-red-500/5' : 'border-gray-800'}`}>
            <DocTypeIcon type={doc.type} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <p className="text-sm text-gray-200 font-medium truncate">{doc.title}</p>
                {doc.conflict && <span className="text-[9px] text-red-400 bg-red-500/15 px-1.5 py-0.5 rounded border border-red-500/30">CONFLICT</span>}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {doc.tags.map(t => <span key={t} className="text-[10px] text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded">{t}</span>)}
                <span className="text-[10px] text-gray-600">· {doc.source}</span>
                {doc.size && <span className="text-[10px] text-gray-600">· {doc.size}</span>}
                {doc.type === 'mp4' && <span className="text-[9px] text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded">AI-transcribed</span>}
                {doc.type === 'img' && <span className="text-[9px] text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded">OCR-processed</span>}
              </div>
            </div>
            <StatusBadge status={doc.status} />
            <button onClick={() => deleteDoc(doc.id)} className="p-1.5 text-gray-600 hover:text-red-400 cursor-pointer transition-colors" title="Delete document">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-600 text-sm">No documents match "{search}"</div>
        )}
      </div>
    </div>
  )
}

function AskAIView() {
  const [roleMode, setRoleMode] = useState('developer')
  const [lang, setLang] = useState('en')
  const ROLE_ANSWERS = {
    developer: { label: 'Developer', answer: `Here's how to authenticate with the API:\n\n\`\`\`bash\ncurl -H "Authorization: Bearer YOUR_TOKEN" \\\n  https://api.yourapp.com/v2/endpoint\n\`\`\`\n\nGenerate your token at Settings → API Keys. Tokens expire after 90 days. Rotate using \`POST /auth/refresh\`.` },
    manager: { label: 'Manager', answer: `The API uses a secure token-based system. Each token costs nothing additional — it's included in all plans from Starter and above. Rotating tokens takes under 2 minutes and has zero downtime impact on current integrations.` },
    new_hire: { label: 'New Hire', answer: `Think of an API token like a keycard. You create it once in Settings, then attach it to every request so the system knows it's really you. It expires after 90 days, like a badge renewal — your manager can issue a new one anytime.` },
  }
  const COMPARE_ROWS = [
    { field: 'Price', v2025: '$49/mo', v2026: '$59/mo', conflict: false },
    { field: 'Seats included', v2025: '5 seats', v2026: '10 seats', conflict: false },
    { field: 'Refund window', v2025: '7–10 days', v2026: '3–5 days', conflict: true },
  ]
  return (
    <div className="space-y-4 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 260px)' }}>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-200">Role-Mode Answer</p>
          <div className="flex gap-2">
            {[['developer', 'Developer'], ['manager', 'Manager'], ['new_hire', 'New Hire']].map(([id, label]) => (
              <button key={id} onClick={() => setRoleMode(id)} className={`px-2.5 py-1 rounded-lg text-[11px] font-medium cursor-pointer transition-colors ${roleMode === id ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>{label}</button>
            ))}
          </div>
        </div>
        <p className="text-xs text-gray-500 mb-3">Query: "How do I authenticate with the API?"</p>
        <div className="bg-gray-800/60 rounded-xl p-4">
          <pre className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed font-mono">{ROLE_ANSWERS[roleMode].answer}</pre>
        </div>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-200">Multilingual Answer</p>
          <select value={lang} onChange={e => setLang(e.target.value)} className="bg-gray-800 text-white text-xs rounded-lg px-2 py-1.5 border border-gray-700 focus:outline-none cursor-pointer">
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="es">Spanish</option>
            <option value="ar">Arabic</option>
          </select>
        </div>
        <div className="bg-gray-800/60 rounded-xl p-4">
          {lang === 'hi'
            ? <p className="text-sm text-gray-300 leading-relaxed">API के साथ प्रमाणीकरण के लिए, आपको Settings → API Keys में जाकर एक Bearer Token बनाना होगा। फिर इसे हर request के Authorization header में इस तरह जोड़ें: <span className="font-mono text-indigo-300">"Authorization: Bearer YOUR_TOKEN"</span>। Token 90 दिनों में expire होता है।</p>
            : lang === 'es'
            ? <p className="text-sm text-gray-300 leading-relaxed">Para autenticarse con la API, cree un token en Configuración → Claves API. Incluya el token en el encabezado de autorización: <span className="font-mono text-indigo-300">"Authorization: Bearer TU_TOKEN"</span>. Los tokens expiran a los 90 días.</p>
            : lang === 'ar'
            ? <p className="text-sm text-gray-300 leading-relaxed" dir="rtl">للمصادقة مع API، أنشئ رمزاً في الإعدادات → مفاتيح API. أضف الرمز في رأس التفويض: <span className="font-mono text-indigo-300">"Authorization: Bearer TOKEN"</span>. تنتهي صلاحية الرموز بعد 90 يوماً.</p>
            : <p className="text-sm text-gray-300 leading-relaxed">Authenticate using a Bearer Token generated from Settings → API Keys. Pass it in the Authorization header on every request. Tokens expire after 90 days and can be refreshed with <span className="font-mono text-indigo-300">POST /auth/refresh</span>.</p>
          }
        </div>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-sm font-semibold text-gray-200 mb-1">Comparative Query</p>
        <p className="text-xs text-gray-500 mb-3">"What changed between the 2025 and 2026 pricing docs?"</p>
        <table className="w-full text-xs">
          <thead><tr className="border-b border-gray-800">{['Field', '2025 Doc', '2026 Doc', 'Conflict'].map(h => <th key={h} className="text-left py-2 px-2 text-gray-500">{h}</th>)}</tr></thead>
          <tbody>
            {COMPARE_ROWS.map((r, i) => (
              <tr key={i} className={`border-b border-gray-800/40 ${r.conflict ? 'bg-red-500/5' : ''}`}>
                <td className="py-2 px-2 text-gray-400 font-medium">{r.field}</td>
                <td className="py-2 px-2 text-gray-300">{r.v2025}</td>
                <td className="py-2 px-2 text-gray-300">{r.v2026}</td>
                <td className="py-2 px-2">{r.conflict ? <span className="text-red-400 text-[10px] flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Conflict</span> : <span className="text-green-400 text-[10px]">✓</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function HealthCheckView({ showToast }) {
  const [conflictResolved, setConflictResolved] = useState(null) // null | '2026' | '2025'
  const [staleStatus, setStaleStatus] = useState({ 0: null, 1: null })

  function resolveConflict(choice) {
    setConflictResolved(choice)
    if (choice === '2026') showToast({ type: 'success', msg: '2026 draft set as canonical Refund Policy' })
    else if (choice === '2025') showToast({ type: 'success', msg: '2025 version kept — 2026 draft archived' })
  }

  function pingAdmin(owner, docTitle) {
    showToast({ type: 'info', msg: `Review request sent to ${owner} for "${docTitle}"` })
  }

  const staleDocs = [
    { title: 'Refund Policy — Customer Terms', age: '90 days', owner: 'legal@company.com' },
    { title: 'Competitor Pricing Analysis', age: '67 days', owner: 'product@company.com' },
  ]

  return (
    <div className="space-y-4 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 260px)' }}>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Knowledge Health</p>
            <p className="text-5xl font-bold text-amber-400">74</p>
            <p className="text-xs text-amber-400 mt-0.5">/ 100</p>
          </div>
          <div className="flex-1 space-y-2">
            {[
              { label: 'Coverage', pct: 82, color: '#22c55e' },
              { label: 'Freshness', pct: 71, color: '#f59e0b' },
              { label: 'Accuracy', pct: 68, color: '#f59e0b' },
              { label: 'Conflicts', pct: 90, color: '#ef4444' },
            ].map(m => (
              <div key={m.label} className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500 w-20 shrink-0">{m.label}</span>
                <div className="flex-1 bg-gray-800 rounded-full h-1.5">
                  <div className="h-full rounded-full" style={{ width: `${m.pct}%`, backgroundColor: m.color }} />
                </div>
                <span className="text-[10px] text-gray-400 w-6">{m.pct}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-400" /> Conflict Log</p>
        {conflictResolved ? (
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <p className="text-sm text-green-300">
              Conflict resolved — {conflictResolved === '2026' ? '2026 draft is now canonical' : '2025 version kept'}
            </p>
          </div>
        ) : (
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3">
            <p className="text-xs font-semibold text-red-300 mb-2">Refund Policy — 2 contradicting versions</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-800/60 rounded-lg p-2.5">
                <p className="text-[9px] text-gray-600 mb-1">2025 version (Google Drive)</p>
                <p className="text-xs text-gray-300">"Refunds processed in 7–10 business days"</p>
              </div>
              <div className="bg-gray-800/60 rounded-lg p-2.5">
                <p className="text-[9px] text-gray-600 mb-1">2026 draft (Notion)</p>
                <p className="text-xs text-gray-300">"Approved refunds in 3–5 business days"</p>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => resolveConflict('2026')} className="flex-1 py-1.5 text-xs bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 rounded-lg cursor-pointer hover:bg-indigo-600/30 transition-colors">Keep 2026 draft</button>
              <button onClick={() => resolveConflict('2025')} className="flex-1 py-1.5 text-xs bg-gray-800 border border-gray-700 text-gray-400 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors">Keep 2025</button>
              <button onClick={() => pingAdmin('legal@company.com', 'Refund Policy')} className="flex-1 py-1.5 text-xs bg-gray-800 border border-gray-700 text-gray-400 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors">Ping admin</button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-amber-400" /> Stale Documents</p>
        {staleDocs.map((d, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-gray-800/40 rounded-xl mb-2">
            <div className="flex-1 min-w-0"><p className="text-xs text-gray-300 truncate">{d.title}</p><p className="text-[10px] text-gray-600">Last updated {d.age} ago · {d.owner}</p></div>
            {staleStatus[i] === 'pinged'
              ? <span className="text-[10px] text-green-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Sent</span>
              : <button onClick={() => { setStaleStatus(p => ({ ...p, [i]: 'pinged' })); pingAdmin(d.owner, d.title) }} className="px-3 py-1.5 bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] rounded-lg cursor-pointer hover:bg-amber-500/25 transition-colors whitespace-nowrap">Ping admin</button>
            }
          </div>
        ))}
      </div>
    </div>
  )
}

function GapAnalysisView({ showToast }) {
  const [expandedDraft, setExpandedDraft] = useState(null)
  const [autoDrafting, setAutoDrafting] = useState(false)
  const [autoDraftDone, setAutoDraftDone] = useState(false)
  const [faqCreated, setFaqCreated] = useState(false)
  const [editContent, setEditContent] = useState({})

  function startAutoDraft() {
    setAutoDrafting(true)
    setTimeout(() => {
      setAutoDrafting(false)
      setAutoDraftDone(true)
      showToast({ type: 'success', msg: '8 draft documents created — review in Documents tab' })
    }, 2400)
  }

  function createFAQ() {
    setFaqCreated(true)
    showToast({ type: 'success', msg: 'FAQ page created and published to knowledge base' })
  }

  function toggleDraft(id) {
    setExpandedDraft(expandedDraft === id ? null : id)
    if (!editContent[id]) {
      setEditContent(p => ({ ...p, [id]: DRAFT_TEMPLATES[id] || `# Draft for Query ${id}\n\nAuto-generated draft content here…` }))
    }
  }

  function saveDraft(id) {
    showToast({ type: 'success', msg: `Draft saved and added to knowledge base` })
    setExpandedDraft(null)
  }

  return (
    <div className="space-y-4 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 260px)' }}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">{GAP_QUERIES.length} unanswered queries from users</p>
        <div className="flex gap-2">
          <button onClick={startAutoDraft} disabled={autoDrafting || autoDraftDone}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs rounded-lg cursor-pointer transition-colors flex items-center gap-1.5">
            {autoDrafting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : autoDraftDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
            {autoDrafting ? 'Drafting…' : autoDraftDone ? 'All Drafted' : 'Auto-draft missing docs'}
          </button>
          <button onClick={createFAQ} disabled={faqCreated}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-60 text-gray-300 text-xs rounded-lg cursor-pointer transition-colors border border-gray-700 flex items-center gap-1.5">
            {faqCreated ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Plus className="w-3.5 h-3.5" />}
            {faqCreated ? 'FAQ Created' : 'Create FAQ page'}
          </button>
        </div>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-gray-800/60 border-b border-gray-800">
            <tr>{['#', 'Unanswered Query', 'Asks', 'Status', ''].map(h => <th key={h} className="text-left py-2.5 px-3 text-gray-500">{h}</th>)}</tr>
          </thead>
          <tbody>
            {GAP_QUERIES.map((g, i) => (
              <>
                <tr key={g.id} className="border-b border-gray-800/40 hover:bg-gray-800/20">
                  <td className="py-2.5 px-3 text-gray-600">{i + 1}</td>
                  <td className="py-2.5 px-3 text-gray-300">{g.query}</td>
                  <td className="py-2.5 px-3 font-semibold text-gray-200">{g.count}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${g.status === 'no-doc' ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'}`}>
                      {g.status === 'no-doc' ? 'No doc' : 'Partial'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <button onClick={() => toggleDraft(g.id)} className="text-[10px] text-indigo-400 hover:text-indigo-300 cursor-pointer flex items-center gap-0.5">
                      {expandedDraft === g.id ? 'Close' : 'Draft →'}
                    </button>
                  </td>
                </tr>
                {expandedDraft === g.id && (
                  <tr key={`draft-${g.id}`} className="border-b border-gray-800/40 bg-gray-800/10">
                    <td colSpan={5} className="px-3 pb-3 pt-1">
                      <div className="bg-gray-800/60 rounded-xl p-3 space-y-2">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[10px] text-indigo-400 font-semibold">AI-DRAFTED DOCUMENT</p>
                          <div className="flex gap-2">
                            <button onClick={() => saveDraft(g.id)} className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] rounded-lg cursor-pointer transition-colors flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Save to KB</button>
                            <button onClick={() => setExpandedDraft(null)} className="px-2.5 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-[10px] rounded-lg cursor-pointer transition-colors">Discard</button>
                          </div>
                        </div>
                        <textarea
                          value={editContent[g.id] || ''}
                          onChange={ev => setEditContent(p => ({ ...p, [g.id]: ev.target.value }))}
                          className="w-full bg-gray-900 text-gray-300 text-[11px] font-mono rounded-lg p-3 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500/40 border border-gray-700 leading-relaxed"
                          rows={8}
                        />
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CreateView({ showToast }) {
  const [openFaq, setOpenFaq] = useState(null)
  const FAQS = [
    { q: 'How do I reset my password?', a: 'Go to Settings → Security → Reset Password. Enter your registered email and you will receive a reset link within 2 minutes. The link expires after 15 minutes. Source: Account Management Guide, §3.2.' },
    { q: 'What payment methods are accepted?', a: 'We accept Visa, Mastercard, American Express, PayPal, and bank transfers (ACH/SEPA) for annual plans. Apple Pay and Google Pay are supported on mobile. Source: Billing FAQ, p.1.', conflict: true },
    { q: 'How do I invite team members?', a: 'Navigate to Settings → Team → Invite Members. Enter email addresses separated by commas. Invites expire after 7 days. Source: Team Management Guide.' },
  ]

  const docContent = `# Getting Started with YourApp\n\n## 1. Create your account\nSign up at app.yourapp.com using Google OAuth or email. Verify your email within 24 hours.\n\n## 2. Set up your workspace\nInvite team members via Settings → Team. Configure your timezone and notification preferences.\n\n## 3. Connect your first integration\nNavigate to Integrations → Browse. Over 50 connectors available including Slack, Notion, and GitHub.`

  function exportDoc(target) {
    if (target === 'Markdown') {
      const blob = new Blob([docContent], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'Getting_Started_Guide.md'
      a.click()
      URL.revokeObjectURL(url)
      showToast({ type: 'success', msg: 'Markdown file downloaded' })
    } else {
      showToast({ type: 'success', msg: `Exported to ${target} — check your ${target} workspace` })
    }
  }

  return (
    <div className="space-y-4 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 260px)' }}>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-200 flex items-center gap-2"><Zap className="w-4 h-4 text-indigo-400" /> Auto-Generated: Getting Started Guide</p>
          <div className="flex gap-2">
            {[['Notion', BookOpen], ['Markdown', FileText], ['GitHub', Github]].map(([l, Icon]) => (
              <button key={l} onClick={() => exportDoc(l)} className="flex items-center gap-1 px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 text-[10px] rounded-lg cursor-pointer border border-gray-700 transition-colors">
                <Icon className="w-3 h-3" /> {l}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-gray-800/60 rounded-xl p-4 space-y-2">
          {docContent.split('\n').filter(Boolean).map((line, i) => (
            <p key={i} className={`text-xs ${line.startsWith('##') ? 'text-indigo-300 font-semibold' : line.startsWith('#') ? 'text-white font-bold text-sm' : 'text-gray-400'} leading-relaxed`}>{line}</p>
          ))}
        </div>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-sm font-semibold text-gray-200 mb-3">AI-Generated FAQ</p>
        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <div key={i} className={`border rounded-xl overflow-hidden ${faq.conflict ? 'border-amber-500/30' : 'border-gray-800'}`}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-800/50 cursor-pointer transition-colors">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-sm text-gray-300 truncate">{faq.q}</span>
                  {faq.conflict && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                </div>
                {openFaq === i ? <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-500 shrink-0" />}
              </button>
              {openFaq === i && (
                <div className="px-4 pb-4">
                  {faq.conflict && <div className="flex items-center gap-2 mb-2 text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/25 rounded-lg px-3 py-2"><AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Conflict detected — verify before publishing</div>}
                  <p className="text-xs text-gray-400 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function QuizModeView() {
  const [answers, setAnswers] = useState({})
  const [quizKey, setQuizKey] = useState(0)

  function regenerate() {
    setAnswers({})
    setQuizKey(k => k + 1)
  }

  const score = Object.entries(answers).filter(([qi, oi]) => QUIZ_CARDS[qi]?.correct === oi).length
  const total = Object.keys(answers).length

  return (
    <div className="space-y-4 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 260px)' }}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">
          3 of 5 questions · Knowledge validation quiz
          {total > 0 && <span className="ml-2 text-indigo-300 font-semibold">{score}/{total} correct</span>}
        </p>
        <button onClick={regenerate} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg cursor-pointer border border-gray-700 flex items-center gap-1.5 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Regenerate quiz
        </button>
      </div>
      {QUIZ_CARDS.map((card, qi) => (
        <div key={`${quizKey}-${qi}`} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-[10px] text-gray-600 mb-2">Q{qi + 1} · {card.source}</p>
          <p className="text-sm text-gray-200 font-medium mb-4 leading-relaxed">{card.q}</p>
          <div className="space-y-2">
            {card.options.map((opt, oi) => {
              const selected = answers[qi] === oi
              const revealed = answers[qi] !== undefined
              const isCorrect = oi === card.correct
              let cls = 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-200'
              if (selected && isCorrect) cls = 'border-green-500 bg-green-500/10 text-green-300'
              else if (selected && !isCorrect) cls = 'border-red-500 bg-red-500/10 text-red-300'
              else if (revealed && isCorrect) cls = 'border-green-500/40 bg-green-500/5 text-green-400/60'
              return (
                <button key={oi} onClick={() => !revealed && setAnswers(p => ({ ...p, [qi]: oi }))}
                  className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm transition-all cursor-pointer ${cls} ${revealed ? 'cursor-default' : ''}`}>
                  <span className="text-gray-600 mr-2">{String.fromCharCode(65 + oi)}.</span>{opt}
                </button>
              )
            })}
          </div>
          {answers[qi] !== undefined && (
            <p className={`text-xs mt-3 flex items-center gap-1.5 ${answers[qi] === card.correct ? 'text-green-400' : 'text-red-400'}`}>
              {answers[qi] === card.correct ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              {answers[qi] === card.correct ? 'Correct!' : `Incorrect — answer: ${card.options[card.correct]}`}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Right Panel ───────────────────────────────────────────────────────────

function AskTab() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Ask me anything about your knowledge base. I\'ll cite exact sources.\n\nTry: "What is the refund processing time?" or "How do I invite team members?"' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSend(e) {
    e.preventDefault()
    if (!input.trim() || loading) return
    const q = input.trim()
    setMessages(p => [...p, { role: 'user', text: q }])
    setInput('')
    setLoading(true)
    try {
      const reply = await callGemini(
        `You are a RAG-powered knowledge base assistant. Available documents:
- Revenue Report Q1 2025 (Finance)
- SaaS Pricing Strategy 2026: $59/mo for Standard (10 seats)
- Refund Policy 2025: 7–10 business days | Refund Policy 2026 draft: 3–5 days (CONFLICT)
- API Authentication Guide: use Bearer token in Authorization header, rotate every 90 days
- Q4 All-Hands meeting transcript (HR)
- Product Roadmap 2025–2026

User question: ${q}

Answer concisely and cite the exact document, page/section. If there's a conflict between sources, flag it clearly.`,
        { maxTokens: 300 }
      )
      setMessages(p => [...p, { role: 'assistant', text: reply }])
    } catch (err) {
      setMessages(p => [...p, { role: 'assistant', text: `Error: ${err.message}` }])
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`text-xs leading-relaxed rounded-xl p-3 whitespace-pre-wrap ${m.role === 'user' ? 'bg-indigo-600/20 text-indigo-100 ml-2' : 'bg-gray-800/80 text-gray-300 mr-2'}`}>{m.text}</div>
        ))}
        {loading && <div className="bg-gray-800/80 rounded-xl p-3 mr-2"><Loader2 className="w-4 h-4 animate-spin text-indigo-400" /></div>}
      </div>
      <form onSubmit={handleSend} className="p-2 border-t border-gray-800 flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask your knowledge base…" className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50" />
        <button type="submit" disabled={loading || !input.trim()} className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg cursor-pointer disabled:opacity-40 transition-colors"><Send className="w-3.5 h-3.5" /></button>
      </form>
    </div>
  )
}

function CitationsTab() {
  return (
    <div className="p-3 space-y-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
      <p className="text-[10px] text-gray-600">All sources grounded to exact page/line</p>
      {CITATIONS.map((c, i) => (
        <div key={i} className={`border rounded-xl p-3 ${c.conflict ? 'border-red-500/30 bg-red-500/5' : 'border-gray-800 bg-gray-800/40'}`}>
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div>
              <p className="text-[11px] font-semibold text-gray-300">{c.source}</p>
              <p className="text-[9px] text-gray-600">{c.page} · {c.line}</p>
            </div>
            {c.conflict && <span className="text-[9px] text-red-400 bg-red-500/15 px-1.5 py-0.5 rounded border border-red-500/30 shrink-0">CONFLICT</span>}
          </div>
          <p className="text-[11px] text-gray-400 italic leading-relaxed">{c.text}</p>
          <button className="mt-1.5 text-[10px] text-indigo-400 hover:text-indigo-300 cursor-pointer">Jump to source →</button>
        </div>
      ))}
    </div>
  )
}

function SyncLogTab({ syncLog }) {
  const c = { info: 'text-blue-400', success: 'text-green-400', warning: 'text-amber-400', error: 'text-red-400' }
  return (
    <div className="p-3 space-y-1.5 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
      {[...syncLog].reverse().map((e, i) => (
        <div key={i} className="flex gap-2 text-[10px]">
          <span className="text-gray-700 font-mono shrink-0">{e.t}</span>
          <span className={c[e.type]}>{e.msg}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Sidebar Connector Row ─────────────────────────────────────────────────

function SourceRow({ src, onSync }) {
  const Icon = src.icon
  return (
    <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-gray-800/50 group cursor-default">
      <Icon className="w-4 h-4 shrink-0" style={{ color: src.color }} />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-gray-300 truncate">{src.label}</p>
        <p className="text-[9px] text-gray-600">{src.docs} docs · {src.lastSync}</p>
      </div>
      {src.status === 'syncing'
        ? <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-cyan-400 animate-pulse" />
        : <button onClick={() => onSync(src.id)} title="Sync now" className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-gray-600 hover:text-cyan-400">
            <RefreshCw className="w-3 h-3" />
          </button>
      }
      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${src.status === 'syncing' ? 'hidden' : 'bg-green-400'}`} />
    </div>
  )
}

// ─── Main ──────────────────────────────────────────────────────────────────

const MODES = [
  { id: 'docs', label: 'Documents', icon: FileText },
  { id: 'ask', label: 'Ask AI', icon: MessageSquare },
  { id: 'health', label: 'Health Check', icon: Activity },
  { id: 'gaps', label: 'Gap Analysis', icon: BarChart3 },
  { id: 'create', label: 'Create', icon: Zap },
  { id: 'quiz', label: 'Quiz Mode', icon: Star },
]
const RIGHT_TABS = [
  { id: 'ask', label: 'Ask', icon: MessageSquare },
  { id: 'citations', label: 'Citations', icon: Link },
  { id: 'sync', label: 'Sync Log', icon: RefreshCw },
]

let toastId = 0

export default function KnowledgeBase() {
  const [activeMode, setActiveMode] = useState('docs')
  const [rightTab, setRightTab] = useState('ask')
  const [selectedFolder, setSelectedFolder] = useState('Technical')
  const [docs, setDocs] = useState(INIT_DOCS)
  const [sources, setSources] = useState(INIT_SOURCES)
  const [syncLog, setSyncLog] = useState(INIT_SYNC_LOG)
  const [toasts, setToasts] = useState([])

  const showToast = useCallback(({ type = 'info', msg }) => {
    const id = ++toastId
    setToasts(p => [...p, { id, type, msg }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500)
  }, [])

  function syncSource(srcId) {
    const src = sources.find(s => s.id === srcId)
    if (!src || src.status === 'syncing') return
    setSources(p => p.map(s => s.id === srcId ? { ...s, status: 'syncing', lastSync: 'now' } : s))
    setSyncLog(p => [{ t: nowTime(), type: 'info', msg: `${src.label} — sync started…` }, ...p])
    setTimeout(() => {
      const newDocs = Math.floor(Math.random() * 4) + 1
      setSources(p => p.map(s => s.id === srcId ? { ...s, status: 'synced', lastSync: 'just now', docs: s.docs + newDocs } : s))
      setSyncLog(p => [{ t: nowTime(), type: 'success', msg: `${src.label} synced — ${newDocs} new doc${newDocs > 1 ? 's' : ''} added` }, ...p])
      showToast({ type: 'success', msg: `${src.label} synced — ${newDocs} new doc${newDocs > 1 ? 's' : ''} added` })
    }, 2200)
  }

  const totalDocs = sources.reduce((s, x) => s + x.docs, 0)
  const conflictCount = docs.filter(d => d.conflict).length

  return (
    <ToolLayout icon={Brain} title="Knowledge Base" description="RAG-powered knowledge hub — auto-sync, conflict detection, multilingual AI answers" color="#6366f1">
      <div className="flex gap-3" style={{ height: 'calc(100vh - 165px)' }}>

        {/* Left Sidebar */}
        <div className="w-56 flex flex-col bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shrink-0">
          <div className="px-3 pt-3 pb-2 border-b border-gray-800">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Live Connectors</p>
          </div>
          <div className="p-2 space-y-1 border-b border-gray-800">
            {sources.map(src => (
              <SourceRow key={src.id} src={src} onSync={syncSource} />
            ))}
          </div>
          <div className="px-3 pt-2 pb-1">
            <p className="text-[10px] text-gray-600 uppercase tracking-wider">Auto-Tagged Folders</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {FOLDERS.map(f => (
              <button key={f.label} onClick={() => setSelectedFolder(f.label)}
                className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl cursor-pointer transition-all ${selectedFolder === f.label ? 'bg-indigo-500/10 border border-indigo-500/25' : 'hover:bg-gray-800/50 border border-transparent'}`}>
                <span className="text-[11px] text-gray-300 flex-1 text-left">{f.label}</span>
                <span className="text-[9px] text-gray-600">{f.count}</span>
                {f.conflicts > 0 && <span className="text-[9px] text-red-400 bg-red-500/15 px-1.5 py-0.5 rounded-full font-semibold">{f.conflicts}</span>}
              </button>
            ))}
          </div>
          <div className="p-3 border-t border-gray-800">
            <div className="bg-gray-800/60 rounded-xl px-3 py-2">
              <p className="text-[10px] text-gray-300 font-semibold">{docs.length} docs · {sources.length} sources</p>
              <p className="text-[9px] text-gray-600">{conflictCount} conflict{conflictCount !== 1 ? 's' : ''} · 2 stale</p>
            </div>
          </div>
        </div>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0 gap-3">
          <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-2xl p-1 shrink-0">
            {MODES.map(m => {
              const Icon = m.icon
              return (
                <button key={m.id} onClick={() => setActiveMode(m.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-[11px] font-medium transition-all cursor-pointer ${activeMode === m.id ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'}`}>
                  <Icon className="w-3.5 h-3.5" /><span className="hidden lg:block">{m.label}</span>
                </button>
              )
            })}
          </div>
          <div className="flex-1 min-h-0">
            {activeMode === 'docs' && <DocumentsView docs={docs} setDocs={setDocs} showToast={showToast} />}
            {activeMode === 'ask' && <AskAIView />}
            {activeMode === 'health' && <HealthCheckView showToast={showToast} />}
            {activeMode === 'gaps' && <GapAnalysisView showToast={showToast} />}
            {activeMode === 'create' && <CreateView showToast={showToast} />}
            {activeMode === 'quiz' && <QuizModeView />}
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-64 flex flex-col bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shrink-0">
          <div className="grid grid-cols-3 border-b border-gray-800 shrink-0">
            {RIGHT_TABS.map(t => {
              const Icon = t.icon
              return (
                <button key={t.id} onClick={() => setRightTab(t.id)}
                  className={`flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-all cursor-pointer border-b-2 ${rightTab === t.id ? 'border-indigo-500 text-indigo-300' : 'border-transparent text-gray-600 hover:text-gray-300'}`}>
                  <Icon className="w-4 h-4" />{t.label}
                </button>
              )
            })}
          </div>
          <div className="flex-1 overflow-hidden">
            {rightTab === 'ask' && <AskTab />}
            {rightTab === 'citations' && <CitationsTab />}
            {rightTab === 'sync' && <SyncLogTab syncLog={syncLog} />}
          </div>
        </div>
      </div>
      <Toast toasts={toasts} />
    </ToolLayout>
  )
}
