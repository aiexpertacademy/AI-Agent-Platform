import { useState } from 'react'
import {
  Shield, AlertTriangle, CheckCircle2, XCircle, Loader2,
  Eye, MessageSquare, Image, Video, Mic, BarChart3, Users,
  FileText, Send, Bell, ToggleLeft, ToggleRight, Plus,
  Activity, Lock, Globe, Smile, Frown, Meh, Flag,
  Download, Share2, BookOpen, Info, Trash2,
} from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'
import { callGemini } from '../../config/gemini'

// ─── Mock Data ─────────────────────────────────────────────────────────────

const QUEUES = [
  { id: 'auto-blocked', label: 'Auto-Blocked', count: 7, color: '#ef4444', dot: 'bg-red-400' },
  { id: 'human-review', label: 'Human Review', count: 24, color: '#f59e0b', dot: 'bg-amber-400 animate-pulse' },
  { id: 'shadow-banned', label: 'Shadow Banned', count: 12, color: '#8b5cf6', dot: 'bg-violet-400' },
  { id: 'approved', label: 'Approved', count: 4820, color: '#22c55e', dot: 'bg-green-400' },
  { id: 'flagged-images', label: 'Flagged Images', count: 38, color: '#f97316', dot: 'bg-orange-400' },
  { id: 'video-scan', label: 'Video Scanning', count: 5, color: '#06b6d4', dot: 'bg-cyan-400 animate-pulse' },
]

const REVIEW_CARDS = [
  {
    id: 1,
    text: 'Haha bilkul sahi baat hai bhai, ye log toh sabse honest hain 🙄',
    user: '@rohan_k',
    lang: 'Hinglish',
    scores: { hate_speech: 0.12, insult: 0.18, threat: 0.04, sarcasm: 0.91, flirtation: 0.02, spam: 0.06 },
    toxicity: 0.68,
    action: 'human-review',
    reason: 'High sarcasm (0.91) but low toxicity (0.68) — requires human judgment',
    outcome: 'review',
  },
  {
    id: 2,
    text: "I know where you live and I'll make sure you regret posting this. Watch your back.",
    user: '@anon_9921',
    lang: 'English',
    scores: { hate_speech: 0.82, insult: 0.76, threat: 0.97, sarcasm: 0.04, flirtation: 0.01, spam: 0.08 },
    toxicity: 0.97,
    action: 'auto-delete',
    reason: 'Threat score 0.97 exceeded threshold 0.90 — auto-deleted, legal escalation triggered',
    outcome: 'deleted',
  },
  {
    id: 3,
    text: '🔥 EARN $5000/WEEK FROM HOME!! Click the link in my bio NOW!! Limited spots!! 🔥🔥',
    user: '@money_maker88',
    lang: 'English',
    scores: { hate_speech: 0.03, insult: 0.05, threat: 0.01, sarcasm: 0.09, flirtation: 0.04, spam: 0.96 },
    toxicity: 0.41,
    action: 'shadow-ban',
    reason: 'Spam score 0.96 — shadow banned. User sees their post, others do not.',
    outcome: 'shadow',
  },
]

const POLICY_RULES = [
  { id: 1, if: 'toxicity > 0.90', then: 'Auto-delete + legal escalation', active: true },
  { id: 2, if: 'spam > 0.80', then: 'Shadow ban for 7 days', active: true },
  { id: 3, if: 'flags ≥ 3 in 24h', then: 'Next 10 posts → human review', active: true },
  { id: 4, if: 'hate_speech > 0.75', then: 'Auto-delete + 30-day ban', active: true },
  { id: 5, if: 'threat > 0.85', then: 'Auto-delete + notify legal', active: true },
  { id: 6, if: 'new_account AND toxicity > 0.60', then: 'Hold for review', active: false },
]

const REPUTATION_USERS = [
  { user: '@anon_9921', score: 12, flags: 14, status: 'banned', color: '#ef4444', ring: 'border-red-500' },
  { user: '@money_maker88', score: 38, flags: 8, status: 'on watch', color: '#f59e0b', ring: 'border-amber-500' },
  { user: '@shadowy_user', score: 44, flags: 5, status: 'shadow banned', color: '#8b5cf6', ring: 'border-violet-500' },
  { user: '@rohan_k', score: 91, flags: 1, status: 'trusted', color: '#22c55e', ring: 'border-green-500' },
]

const DSA_DATA = [
  { type: 'Spam', count: 2840, pct: 48 },
  { type: 'Hate Speech', count: 1180, pct: 20 },
  { type: 'Threats', count: 590, pct: 10 },
  { type: 'Misinformation', count: 470, pct: 8 },
  { type: 'Nudity', count: 410, pct: 7 },
  { type: 'Other', count: 410, pct: 7 },
]

const LANG_DATA = [
  { lang: 'English', pct: 61, count: 2980 },
  { lang: 'Hinglish', pct: 14, count: 685 },
  { lang: 'Spanish', pct: 9, count: 440 },
  { lang: 'Hindi', pct: 7, count: 342 },
  { lang: 'Arabic', pct: 5, count: 244 },
  { lang: 'Other (45+)', pct: 4, count: 196 },
]

const LOG_ENTRIES = [
  { t: '14:44:12', type: 'error', msg: 'Auto-deleted: @anon_9921 — threat score 0.97' },
  { t: '14:44:08', type: 'warning', msg: 'Human review queued: @rohan_k — sarcasm 0.91' },
  { t: '14:44:05', type: 'info', msg: 'Shadow banned: @money_maker88 — spam 0.96' },
  { t: '14:43:58', type: 'success', msg: 'Approved: @priya_m — toxicity 0.08' },
  { t: '14:43:52', type: 'error', msg: 'Image flagged: nudity region detected (top-left 120×80px)' },
  { t: '14:43:44', type: 'info', msg: 'Video frame 4/7 — amber flag: potential violence' },
  { t: '14:43:40', type: 'success', msg: 'PII masked: email found in post by @dev_user' },
  { t: '14:43:35', type: 'warning', msg: 'Meme OCR: hate speech keyword cluster detected' },
  { t: '14:43:28', type: 'error', msg: 'Audio transcribed: implied threat in voice note' },
  { t: '14:43:21', type: 'success', msg: 'Approved: @travel_blog99 — toxicity 0.03' },
]

const PII_LOG = [
  { type: 'Email', count: 48, example: 'j***@gmail.com', masked: true },
  { type: 'Phone', count: 31, example: '+91-98**-***210', masked: true },
  { type: 'Address', count: 12, example: '14 M*** Road, Mumbai', masked: true },
  { type: 'Payment', count: 4, example: '4*** **** **** 7821', masked: true },
]

// ─── Helpers ───────────────────────────────────────────────────────────────

function Toggle({ value, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!value)} className="cursor-pointer shrink-0">
      {value ? <ToggleRight className="w-6 h-6 text-violet-400" /> : <ToggleLeft className="w-6 h-6 text-gray-600" />}
    </button>
  )
}

function ScoreBar({ label, value, color }) {
  const pct = Math.round(value * 100)
  const barColor = value > 0.8 ? '#ef4444' : value > 0.5 ? '#f59e0b' : '#22c55e'
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-gray-500 w-20 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-800 rounded-full h-1.5">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color || barColor }} />
      </div>
      <span className="text-[10px] font-mono text-gray-400 w-8 text-right">{value.toFixed(2)}</span>
    </div>
  )
}

// ─── Views ─────────────────────────────────────────────────────────────────

function ReviewQueueView() {
  const [actions, setActions] = useState({})
  const outcomeStyle = {
    deleted: 'bg-red-500/10 border border-red-500/30 text-red-400',
    shadow: 'bg-violet-500/10 border border-violet-500/30 text-violet-400',
    review: 'bg-amber-500/10 border border-amber-500/30 text-amber-400',
  }
  const outcomeLabel = { deleted: 'Auto-Deleted', shadow: 'Shadow Banned', review: 'In Human Review' }

  return (
    <div className="space-y-4 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 260px)' }}>
      {REVIEW_CARDS.map(card => (
        <div key={card.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-200">{card.user}</span>
              <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">{card.lang}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${outcomeStyle[card.outcome]}`}>{outcomeLabel[card.outcome]}</span>
            </div>
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${card.toxicity > 0.8 ? 'bg-red-500/20 text-red-300' : card.toxicity > 0.5 ? 'bg-amber-500/20 text-amber-300' : 'bg-green-500/20 text-green-300'}`}>
              Toxicity {card.toxicity.toFixed(2)}
            </span>
          </div>
          <div className="bg-gray-800/60 rounded-lg px-3 py-2.5 mb-3">
            <p className="text-sm text-gray-300 leading-relaxed">"{card.text}"</p>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-3">
            {Object.entries(card.scores).map(([k, v]) => (
              <ScoreBar key={k} label={k.replace('_', ' ')} value={v} />
            ))}
          </div>
          <div className="flex items-start gap-2 bg-blue-500/5 border border-blue-500/20 rounded-lg px-3 py-2 mb-3">
            <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-blue-300">{card.reason}</p>
          </div>
          {card.outcome === 'review' && (
            <div className="flex gap-2">
              {[
                { label: 'Approve', cls: 'bg-green-600/20 border-green-500/30 text-green-400 hover:bg-green-600/30' },
                { label: 'Delete', cls: 'bg-red-600/20 border-red-500/30 text-red-400 hover:bg-red-600/30' },
                { label: 'Warn User', cls: 'bg-amber-600/20 border-amber-500/30 text-amber-400 hover:bg-amber-600/30' },
                { label: 'Shadow Ban', cls: 'bg-violet-600/20 border-violet-500/30 text-violet-400 hover:bg-violet-600/30' },
              ].map(btn => (
                <button key={btn.label} className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium border cursor-pointer transition-colors ${btn.cls}`}>{btn.label}</button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function MultimodalView() {
  const frames = [
    { idx: 1, status: 'safe' }, { idx: 2, status: 'safe' }, { idx: 3, status: 'warn' },
    { idx: 4, status: 'warn' }, { idx: 5, status: 'danger' }, { idx: 6, status: 'safe' }, { idx: 7, status: 'safe' },
  ]
  const frameColor = { safe: 'bg-green-500/20 border-green-500/40', warn: 'bg-amber-500/20 border-amber-500/40', danger: 'bg-red-500/20 border-red-500/40' }
  return (
    <div className="space-y-4 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 260px)' }}>
      {/* Image scan */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2"><Image className="w-4 h-4 text-orange-400" /> Image Scan</p>
        <div className="flex gap-4">
          <div className="relative w-48 h-32 bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shrink-0 flex items-center justify-center">
            <div className="absolute inset-0 bg-gray-700/80 backdrop-blur-md flex items-center justify-center">
              <div className="text-center"><Eye className="w-6 h-6 text-red-400 mx-auto mb-1" /><p className="text-[10px] text-red-400 font-semibold">Nudity Detected</p><p className="text-[9px] text-gray-500">Content blurred</p></div>
            </div>
            <div className="absolute top-2 left-2 w-16 h-10 border-2 border-red-500 rounded" />
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-xs text-gray-400">Detection regions logged:</p>
            {[['Nudity region', 'top-left 120×80px', '0.94'], ['Face detected', 'center 200×180px', '0.88'], ['Text overlay', 'bottom 40×20px', '0.71']].map(([t, r, s]) => (
              <div key={t} className="flex items-center gap-2 text-xs">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span className="text-gray-300">{t}</span>
                <span className="text-gray-600 font-mono">{r}</span>
                <span className="ml-auto text-red-400 font-mono">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Video frames */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-200 flex items-center gap-2"><Video className="w-4 h-4 text-cyan-400" /> Video Frame Analysis</p>
          <span className="text-[10px] text-cyan-400">Scanning every 2s · 7 frames</span>
        </div>
        <div className="flex gap-2">
          {frames.map(f => (
            <div key={f.idx} className={`flex-1 aspect-video rounded-lg border flex items-center justify-center ${frameColor[f.status]}`}>
              <span className="text-[9px] text-gray-400">{f.idx}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-2 text-[10px] text-gray-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-400 rounded inline-block" /> Safe</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-400 rounded inline-block" /> Review</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-400 rounded inline-block" /> Danger</span>
        </div>
      </div>

      {/* OCR + Audio */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2"><Eye className="w-4 h-4 text-yellow-400" /> Meme OCR</p>
          <div className="bg-gray-800/60 rounded-lg p-2.5 mb-2 text-xs font-mono text-gray-300">"They are not real citizens"</div>
          <ScoreBar label="Hate speech" value={0.78} />
          <p className="text-[10px] text-red-400 mt-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Keyword cluster flagged</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2"><Mic className="w-4 h-4 text-violet-400" /> Audio Transcript</p>
          <div className="bg-gray-800/60 rounded-lg p-2.5 mb-2 text-xs text-gray-300">"Tu phir nahi dikhega yahan..." <span className="text-[9px] text-gray-600">[Hinglish]</span></div>
          <ScoreBar label="Threat" value={0.83} />
          <p className="text-[10px] text-amber-400 mt-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Implied threat detected</p>
        </div>
      </div>
    </div>
  )
}

function ScoringView() {
  const post = REVIEW_CARDS[0]
  return (
    <div className="space-y-4 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 260px)' }}>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-sm font-semibold text-gray-200 mb-1">Deep Score Breakdown</p>
        <p className="text-xs text-gray-500 mb-4">Post by {post.user} · {post.lang}</p>
        <div className="bg-gray-800/60 rounded-lg px-3 py-2.5 mb-4">
          <p className="text-sm text-gray-300">"{post.text}"</p>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Hate Speech', value: post.scores.hate_speech, note: 'No hate keywords found' },
            { label: 'Insult', value: post.scores.insult, note: 'Mild tone, no direct insult' },
            { label: 'Threat', value: post.scores.threat, note: 'No threat patterns' },
            { label: 'Sarcasm', value: post.scores.sarcasm, note: '⚠ Very high — context-dependent' },
            { label: 'Flirtation', value: post.scores.flirtation, note: 'None detected' },
            { label: 'Spam', value: post.scores.spam, note: 'No spam signals' },
          ].map(s => (
            <div key={s.label}>
              <ScoreBar label={s.label} value={s.value} />
              <p className="text-[10px] text-gray-600 ml-[5.5rem] mt-0.5">{s.note}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 bg-blue-500/10 border border-blue-500/25 rounded-xl p-3">
          <p className="text-xs font-semibold text-blue-300 mb-1">LLM Contextual Note — "Toxic-Positive"</p>
          <p className="text-xs text-gray-400 leading-relaxed">The phrase "ye log toh sabse honest hain" uses irony in Hinglish cultural context. A keyword filter would have missed this entirely — the word "honest" is positive, but the sarcasm score reveals the true intent is dismissive mockery. Human review is recommended before action.</p>
        </div>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2"><Lock className="w-4 h-4 text-green-400" /> PII Detection Log</p>
        <div className="space-y-2">
          {PII_LOG.map((p, i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 bg-gray-800/40 rounded-lg">
              <span className="text-[10px] text-gray-500 w-16 shrink-0">{p.type}</span>
              <span className="flex-1 font-mono text-xs text-gray-300">{p.example}</span>
              <span className="text-[9px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">Masked</span>
              <span className="text-[10px] text-gray-500">{p.count} found</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PolicyEngineView() {
  const [rules, setRules] = useState(POLICY_RULES)
  const [redactions, setRedactions] = useState({ starOut: true, imageBlur: true, piiMask: true, auditLog: true })

  return (
    <div className="space-y-4 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 260px)' }}>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-sm font-semibold text-gray-200 mb-3">Auto-Action Rules</p>
        <div className="space-y-2">
          {rules.map(r => (
            <div key={r.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${r.active ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-900 border-gray-800 opacity-50'}`}>
              <div className={`w-2 h-2 rounded-full shrink-0 ${r.active ? 'bg-green-400' : 'bg-gray-600'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] bg-amber-500/15 text-amber-300 px-2 py-0.5 rounded font-mono">IF {r.if}</span>
                  <span className="text-gray-600 text-[10px]">→</span>
                  <span className="text-[11px] bg-violet-500/15 text-violet-300 px-2 py-0.5 rounded font-mono">THEN {r.then}</span>
                </div>
              </div>
              <Toggle value={r.active} onChange={v => setRules(prev => prev.map(x => x.id === r.id ? { ...x, active: v } : x))} />
            </div>
          ))}
        </div>
        <button className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-gray-700 text-gray-500 hover:text-gray-300 rounded-xl text-xs cursor-pointer"><Plus className="w-3.5 h-3.5" /> Add rule</button>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-sm font-semibold text-gray-200 mb-3">Redaction Settings</p>
        <div className="space-y-2">
          {[
            { key: 'starOut', label: 'Star-out profanity', sub: 'Replace bad words with ***' },
            { key: 'imageBlur', label: 'Image blur on flag', sub: 'Auto-blur nudity/violence' },
            { key: 'piiMask', label: 'PII masking', sub: 'Mask email, phone, address' },
            { key: 'auditLog', label: 'Encrypted audit log', sub: 'GDPR-compliant action log' },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl">
              <div><p className="text-sm text-gray-300">{item.label}</p><p className="text-[10px] text-gray-600">{item.sub}</p></div>
              <Toggle value={redactions[item.key]} onChange={v => setRedactions(p => ({ ...p, [item.key]: v }))} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ReputationView() {
  return (
    <div className="space-y-3 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 260px)' }}>
      <div className="grid grid-cols-2 gap-3">
        {REPUTATION_USERS.map((u, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-12 h-12 rounded-full border-4 ${u.ring} flex items-center justify-center bg-gray-800 shrink-0`}>
                <span className="text-lg font-bold" style={{ color: u.color }}>{u.score}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-200">{u.user}</p>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: `${u.color}20`, color: u.color }}>{u.status}</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Flags</span>
              <span className="font-semibold text-gray-300">{u.flags}</span>
            </div>
            <div className="mt-2 w-full bg-gray-800 rounded-full h-1.5">
              <div className="h-full rounded-full" style={{ width: `${u.score}%`, backgroundColor: u.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ComplianceView() {
  return (
    <div className="space-y-4 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 260px)' }}>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-200">DSA Violation Breakdown</p>
          <div className="flex gap-2">
            {[['DSA PDF', Download], ['Reg. JSON', FileText], ['Legal Email', Share2]].map(([l, Icon]) => (
              <button key={l} className="flex items-center gap-1 px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-400 text-[10px] rounded-lg cursor-pointer border border-gray-700"><Icon className="w-3 h-3" /> {l}</button>
            ))}
          </div>
        </div>
        <div className="space-y-2.5">
          {DSA_DATA.map((d, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs text-gray-400 w-24 shrink-0">{d.type}</span>
              <div className="flex-1 bg-gray-800 rounded-full h-3 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${d.pct}%`, background: 'linear-gradient(90deg, #8b5cf6, #6366f1)' }} />
              </div>
              <span className="text-xs text-gray-300 font-mono w-14 text-right">{d.count.toLocaleString()}</span>
              <span className="text-[10px] text-gray-600 w-6">{d.pct}%</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2"><Globe className="w-4 h-4 text-cyan-400" /> Multilingual Breakdown</p>
        <div className="space-y-2">
          {LANG_DATA.map((l, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs text-gray-400 w-20 shrink-0">{l.lang}</span>
              <div className="flex-1 bg-gray-800 rounded-full h-2">
                <div className="h-full rounded-full bg-cyan-500" style={{ width: `${l.pct}%` }} />
              </div>
              <span className="text-[10px] text-gray-500 w-8">{l.pct}%</span>
              <span className="text-[10px] text-gray-600 w-10 text-right">{l.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Right Panel ───────────────────────────────────────────────────────────

function LiveLogTab() {
  const c = { info: 'text-blue-400', success: 'text-green-400', warning: 'text-amber-400', error: 'text-red-400' }
  return (
    <div className="p-3 space-y-1.5 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
      {LOG_ENTRIES.map((e, i) => (
        <div key={i} className="flex gap-2 text-[10px]">
          <span className="text-gray-700 font-mono shrink-0">{e.t}</span>
          <span className={c[e.type]}>{e.msg}</span>
        </div>
      ))}
    </div>
  )
}

function AIExplainTab() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'I can explain any moderation decision. Try: "Why was @rohan_k sent to human review?" or "Why was the spam post shadow banned instead of deleted?"' }
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
        `You are a content moderation AI explaining decisions to a human moderator.

Context: Platform content moderation system with these rules:
- toxicity > 0.90 → auto-delete
- spam > 0.80 → shadow ban
- flags ≥ 3 in 24h → next 10 posts to review

Post examples:
1. @rohan_k: Hinglish sarcasm post, sarcasm=0.91, toxicity=0.68 → human review (below 0.90 threshold)
2. @anon_9921: Threat post, threat=0.97 → auto-deleted + legal escalation
3. @money_maker88: Spam post, spam=0.96 → shadow banned

Question: ${q}

Explain the AI reasoning in plain language, referencing specific scores and policy rules.`,
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
          <div key={i} className={`text-xs leading-relaxed rounded-xl p-3 ${m.role === 'user' ? 'bg-violet-600/20 text-violet-100 ml-2' : 'bg-gray-800/80 text-gray-300 mr-2'}`}>{m.text}</div>
        ))}
        {loading && <div className="bg-gray-800/80 rounded-xl p-3 mr-2"><Loader2 className="w-4 h-4 animate-spin text-violet-400" /></div>}
      </div>
      <form onSubmit={handleSend} className="p-2 border-t border-gray-800 flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Why was this decision made?" className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50" />
        <button type="submit" disabled={loading || !input.trim()} className="p-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg cursor-pointer disabled:opacity-40 transition-colors"><Send className="w-3.5 h-3.5" /></button>
      </form>
    </div>
  )
}

function PIIShieldTab() {
  return (
    <div className="p-4 space-y-4">
      <div className="bg-green-500/10 border border-green-500/25 rounded-xl p-3 text-center">
        <Lock className="w-6 h-6 text-green-400 mx-auto mb-1" />
        <p className="text-xs font-semibold text-green-300">PII Shield Active</p>
        <p className="text-[10px] text-gray-500 mt-0.5">GDPR Article 17 compliant</p>
      </div>
      <div className="space-y-2">
        {PII_LOG.map((p, i) => (
          <div key={i} className="bg-gray-800/60 border border-gray-800 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-gray-300">{p.type}</span>
              <span className="text-lg font-bold text-white">{p.count}</span>
            </div>
            <p className="text-[10px] font-mono text-gray-500">{p.example}</p>
            <p className="text-[9px] text-green-400 mt-1">masked in last hour</p>
          </div>
        ))}
      </div>
      <div className="bg-gray-800/60 border border-gray-800 rounded-xl p-3">
        <p className="text-xs font-semibold text-gray-300 mb-1">Total Masked (24h)</p>
        <p className="text-2xl font-bold text-white">95</p>
        <p className="text-[10px] text-gray-500">across 4 PII categories · 50 languages</p>
      </div>
    </div>
  )
}

// ─── Main ──────────────────────────────────────────────────────────────────

const MODES = [
  { id: 'queue', label: 'Review Queue', icon: Flag },
  { id: 'multimodal', label: 'Multimodal', icon: Image },
  { id: 'scoring', label: 'Scoring', icon: BarChart3 },
  { id: 'policy', label: 'Policy Engine', icon: Shield },
  { id: 'reputation', label: 'Reputation', icon: Users },
  { id: 'compliance', label: 'Compliance', icon: FileText },
]
const RIGHT_TABS = [
  { id: 'log', label: 'Live Log', icon: Activity },
  { id: 'explain', label: 'AI Explain', icon: MessageSquare },
  { id: 'pii', label: 'PII Shield', icon: Lock },
]

export default function ContentModerator() {
  const [activeMode, setActiveMode] = useState('queue')
  const [rightTab, setRightTab] = useState('log')
  const [selectedQueue, setSelectedQueue] = useState('human-review')

  return (
    <ToolLayout icon={Shield} title="Content Moderator" description="AI-powered multimodal moderation — 50 languages, PII shield, policy engine" color="#ef4444">
      <div className="flex gap-3" style={{ height: 'calc(100vh - 165px)' }}>

        {/* Left Sidebar */}
        <div className="w-56 flex flex-col bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shrink-0">
          <div className="px-3 pt-3 pb-2 border-b border-gray-800">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Moderation Queues</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {QUEUES.map(q => (
              <button key={q.id} onClick={() => setSelectedQueue(q.id)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-left transition-all cursor-pointer ${selectedQueue === q.id ? 'bg-red-500/10 border border-red-500/20' : 'hover:bg-gray-800/70 border border-transparent'}`}>
                <span className={`w-2 h-2 rounded-full shrink-0 ${q.dot}`} />
                <span className="flex-1 text-[11px] text-gray-300 truncate">{q.label}</span>
                <span className="text-[10px] font-bold text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded-full">{q.count}</span>
              </button>
            ))}
          </div>
          <div className="p-3 border-t border-gray-800 space-y-2">
            <div className="bg-gray-800/60 rounded-xl px-3 py-2.5">
              <div className="flex items-center gap-2 mb-0.5">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <p className="text-[10px] text-gray-300 font-semibold">4,904 items/hr</p>
              </div>
              <p className="text-[9px] text-gray-600">50 languages · PII Shield ON</p>
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
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-[11px] font-medium transition-all cursor-pointer ${activeMode === m.id ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'}`}>
                  <Icon className="w-3.5 h-3.5" /><span className="hidden lg:block">{m.label}</span>
                </button>
              )
            })}
          </div>
          <div className="flex-1 min-h-0">
            {activeMode === 'queue' && <ReviewQueueView />}
            {activeMode === 'multimodal' && <MultimodalView />}
            {activeMode === 'scoring' && <ScoringView />}
            {activeMode === 'policy' && <PolicyEngineView />}
            {activeMode === 'reputation' && <ReputationView />}
            {activeMode === 'compliance' && <ComplianceView />}
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-64 flex flex-col bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shrink-0">
          <div className="grid grid-cols-3 border-b border-gray-800 shrink-0">
            {RIGHT_TABS.map(t => {
              const Icon = t.icon
              return (
                <button key={t.id} onClick={() => setRightTab(t.id)}
                  className={`flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-all cursor-pointer border-b-2 ${rightTab === t.id ? 'border-red-500 text-red-300' : 'border-transparent text-gray-600 hover:text-gray-300'}`}>
                  <Icon className="w-4 h-4" />{t.label}
                </button>
              )
            })}
          </div>
          <div className="flex-1 overflow-hidden">
            {rightTab === 'log' && <LiveLogTab />}
            {rightTab === 'explain' && <AIExplainTab />}
            {rightTab === 'pii' && <PIIShieldTab />}
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
