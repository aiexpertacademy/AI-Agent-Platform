import { useState, useRef, useEffect } from 'react'
import {
  Phone, Bot, Shield, Database, Palette, Rocket, Inbox,
  MessageSquare, Check, Copy, Plus, X, Send, ChevronRight,
  Zap, Star, Upload, RefreshCw, Eye, EyeOff, ToggleLeft, ToggleRight,
  Link, Settings, AlertTriangle, FileText, Download, Search,
  CheckCircle, Circle, User, ArrowRight, Wifi, WifiOff,
} from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'

const WA_GREEN = '#25D366'

const CONTACTS = [
  { id: 1, name: 'Priya Sharma', phone: '+91 98765 43210', last: 'What are your business hours?', unread: 3, aiOn: true, flagged: false, init: 'PS', color: '#6366f1' },
  { id: 2, name: 'Rahul Mehta', phone: '+91 87654 32109', last: 'I want to track my order #4521', unread: 1, aiOn: true, flagged: false, init: 'RM', color: '#ec4899' },
  { id: 3, name: 'Ananya Patel', phone: '+91 76543 21098', last: 'Can I speak to a human?', unread: 0, aiOn: false, flagged: true, init: 'AP', color: '#f59e0b' },
  { id: 4, name: 'Vikram Singh', phone: '+91 65432 10987', last: 'Thanks for the quick help!', unread: 0, aiOn: true, flagged: false, init: 'VS', color: '#10b981' },
  { id: 5, name: 'Neha Gupta', phone: '+91 54321 09876', last: 'Is the premium plan worth it?', unread: 2, aiOn: true, flagged: false, init: 'NG', color: '#8b5cf6' },
]

const CHAT_MSGS = [
  { id: 1, role: 'user', text: 'Hi! What are your business hours?', time: '10:23 AM' },
  { id: 2, role: 'bot', text: 'Hello Priya! 👋 We are open Monday–Saturday, 9 AM to 7 PM IST. Sundays we are closed. Is there anything specific I can help you with today?', time: '10:23 AM' },
  { id: 3, role: 'user', text: 'Do you offer a free trial?', time: '10:24 AM' },
  { id: 4, role: 'bot', text: 'Yes! We offer a 14-day free trial with full access to all features — no credit card required. Would you like me to send you the sign-up link? 🎉', time: '10:24 AM' },
  { id: 5, role: 'user', text: 'Yes please!', time: '10:25 AM' },
  { id: 6, role: 'bot', text: 'Here you go: https://aiexpertacademy.com/trial 🔗\nYou can get started in under 2 minutes. Let me know if you need any help!', time: '10:25 AM' },
]

const PROMPT_TEMPLATES = [
  { id: 'cs', label: 'Customer Service', icon: '🎧', prompt: 'You are a friendly customer service AI for {business_name}. Help users with order tracking, returns, FAQs, and escalate complex issues to human agents. Always be polite and concise.' },
  { id: 'sales', label: 'Sales Assistant', icon: '💼', prompt: 'You are a sales AI for {business_name}. Qualify leads, explain product benefits, handle objections, share pricing, and schedule demos. Focus on value over features.' },
  { id: 'tech', label: 'Tech Support', icon: '🔧', prompt: 'You are a technical support AI for {business_name}. Troubleshoot issues step-by-step, check documentation, and escalate unresolved issues with full context.' },
  { id: 'ecom', label: 'E-Commerce', icon: '🛒', prompt: 'You are a shopping assistant for {business_name}. Help users find products, check stock, apply coupons, track orders, and process returns smoothly.' },
  { id: 'book', label: 'Booking Agent', icon: '📅', prompt: 'You are a booking AI for {business_name}. Help users check availability, book appointments, send confirmations, and handle cancellations or rescheduling.' },
]

const CONTACT_LISTS = [
  { id: 'all', label: 'All Customers', count: 1420, color: '#6366f1' },
  { id: 'premium', label: 'Premium Users', count: 284, color: '#f59e0b' },
  { id: 'inactive', label: 'Inactive (30d+)', count: 567, color: '#ef4444' },
  { id: 'new', label: 'New Signups', count: 89, color: '#10b981' },
  { id: 'cart', label: 'Cart Abandoned', count: 234, color: '#ec4899' },
]

const NAV_MODULES = [
  { id: 'link', label: 'WhatsApp Link', icon: Link },
  { id: 'ai', label: 'AI Engine', icon: Bot },
  { id: 'guardrails', label: 'Guardrails', icon: Shield },
  { id: 'kb', label: 'Knowledge Base', icon: Database },
  { id: 'branding', label: 'Branding & UI', icon: Palette },
  { id: 'deploy', label: 'Deploy', icon: Rocket },
  { id: 'inbox', label: 'Live Inbox', icon: Inbox },
]

const DEFAULT_CFG = {
  phone: '', countryCode: '+91', businessId: '', phoneId: '', apiToken: '',
  webhookUrl: 'https://api.aiexpertacademy.com/wa/webhook',
  systemPrompt: PROMPT_TEMPLATES[0].prompt,
  model: 'gemini-2.0-flash', apiKey: '', temperature: 0.7,
  header: '🤖 Powered by AI', footer: 'AI Expert Academy',
  stopKeywords: ['human', 'agent', 'support', 'help me'],
  retryLimit: 3, fallback: 'I\'m connecting you to a human agent. Please wait a moment.',
  botName: 'Aria', botSub: 'Your AI Assistant',
  welcome1: 'Hi! I\'m Aria 👋', welcome2: 'How can I help you today?',
  triggerWord: 'hi', brandColor: WA_GREEN, bubbleShape: 'rounded', whiteLabel: false,
}

function Toggle({ on, onChange }) {
  return (
    <button onClick={() => onChange(!on)} className={`relative w-11 h-6 rounded-full transition-colors ${on ? 'bg-green-500' : 'bg-gray-700'}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  )
}

function SectionHeader({ icon: Icon, title, desc }) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${WA_GREEN}20` }}>
        <Icon className="w-5 h-5" style={{ color: WA_GREEN }} />
      </div>
      <div>
        <h2 className="text-base font-semibold text-white">{title}</h2>
        <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
      </div>
    </div>
  )
}

function InputField({ label, value, onChange, placeholder, type = 'text', hint }) {
  const [show, setShow] = useState(false)
  const isPass = type === 'password'
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>
      <div className="relative">
        <input
          type={isPass && !show ? 'password' : 'text'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-500 transition-colors"
        />
        {isPass && (
          <button onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {hint && <p className="text-xs text-gray-600 mt-1">{hint}</p>}
    </div>
  )
}

function LinkModule({ cfg, setCfg, connected, setConnected }) {
  const [testing, setTesting] = useState(false)
  const steps = [
    { label: 'Meta Developer Account', done: true },
    { label: 'WhatsApp Business App', done: !!cfg.businessId },
    { label: 'Phone Number ID', done: !!cfg.phoneId },
    { label: 'API Token', done: !!cfg.apiToken },
  ]
  function testConnection() {
    setTesting(true)
    setTimeout(() => { setTesting(false); setConnected(cfg.apiToken.length > 10) }, 1800)
  }
  return (
    <div className="space-y-6">
      <SectionHeader icon={Link} title="WhatsApp Business API Link" desc="Connect your Meta WhatsApp Business account to get started" />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Country Code</label>
          <select value={cfg.countryCode} onChange={e => setCfg({ ...cfg, countryCode: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500">
            {['+91 India', '+1 USA', '+44 UK', '+971 UAE', '+65 SG'].map(c => (
              <option key={c} value={c.split(' ')[0]}>{c}</option>
            ))}
          </select>
        </div>
        <InputField label="Phone Number" value={cfg.phone} onChange={v => setCfg({ ...cfg, phone: v })} placeholder="98765 43210" />
      </div>
      <InputField label="WhatsApp Business ID" value={cfg.businessId} onChange={v => setCfg({ ...cfg, businessId: v })} placeholder="Enter your Business Account ID" hint="Found in Meta Business Manager → WhatsApp Accounts" />
      <InputField label="Phone Number ID" value={cfg.phoneId} onChange={v => setCfg({ ...cfg, phoneId: v })} placeholder="Enter Phone Number ID from Meta dashboard" />
      <InputField label="Permanent Access Token" value={cfg.apiToken} onChange={v => setCfg({ ...cfg, apiToken: v })} type="password" placeholder="Enter your Meta API access token" hint="Generate a permanent token in Meta System Users" />
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">Webhook URL (auto-generated)</label>
        <div className="flex gap-2">
          <input readOnly value={cfg.webhookUrl} className="flex-1 bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-400 cursor-default" />
          <button onClick={() => navigator.clipboard.writeText(cfg.webhookUrl)} className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 transition-colors"><Copy className="w-4 h-4" /></button>
        </div>
        <p className="text-xs text-gray-600 mt-1">Paste this in Meta Developer Portal → Webhooks → Callback URL</p>
      </div>
      <div className="bg-gray-800/50 rounded-xl p-4">
        <p className="text-xs font-medium text-gray-300 mb-3">Setup Progress</p>
        <div className="space-y-2">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              {s.done ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" /> : <Circle className="w-4 h-4 text-gray-600 flex-shrink-0" />}
              <span className={`text-xs ${s.done ? 'text-gray-300' : 'text-gray-600'}`}>{i + 1}. {s.label}</span>
            </div>
          ))}
        </div>
      </div>
      <button onClick={testConnection} disabled={testing || !cfg.apiToken}
        className="w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        style={{ background: WA_GREEN, color: '#fff' }}>
        {testing ? <><RefreshCw className="w-4 h-4 animate-spin" />Testing Connection…</> : connected ? <><CheckCircle className="w-4 h-4" />Connected — Re-test</> : <><Wifi className="w-4 h-4" />Test Connection</>}
      </button>
      {connected && (
        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
          <p className="text-xs text-green-400">WhatsApp Business API connected successfully!</p>
        </div>
      )}
    </div>
  )
}

function AIEngineModule({ cfg, setCfg }) {
  const [chatInput, setChatInput] = useState('')
  const [chatLog, setChatLog] = useState([{ role: 'bot', text: 'Hi! I\'m ready to assist. Test me below 👇' }])
  const [loading, setLoading] = useState(false)
  const [verified, setVerified] = useState(false)
  function sendTest() {
    if (!chatInput.trim()) return
    const userMsg = { role: 'user', text: chatInput }
    setChatLog(l => [...l, userMsg])
    setChatInput('')
    setLoading(true)
    setTimeout(() => {
      setChatLog(l => [...l, { role: 'bot', text: 'This is a simulated AI response based on your system prompt. In production, this uses your configured model and API key.' }])
      setLoading(false)
    }, 1200)
  }
  return (
    <div className="space-y-6">
      <SectionHeader icon={Bot} title="AI Engine Configuration" desc="Configure the AI model, prompt, and behavior for your chatbot" />
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">System Prompt</label>
        <textarea value={cfg.systemPrompt} onChange={e => setCfg({ ...cfg, systemPrompt: e.target.value })}
          rows={5} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-500 resize-none transition-colors" />
        <div className="flex flex-wrap gap-2 mt-2">
          {PROMPT_TEMPLATES.map(t => (
            <button key={t.id} onClick={() => setCfg({ ...cfg, systemPrompt: t.prompt })}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-xs text-gray-300 rounded-lg transition-colors">
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">AI Model</label>
          <select value={cfg.model} onChange={e => setCfg({ ...cfg, model: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500">
            <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
            <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
            <option value="gpt-4o">GPT-4o</option>
            <option value="gpt-4o-mini">GPT-4o Mini</option>
            <option value="claude-sonnet-4-6">Claude Sonnet 4.6</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Temperature: {cfg.temperature}</label>
          <input type="range" min="0" max="1" step="0.05" value={cfg.temperature}
            onChange={e => setCfg({ ...cfg, temperature: parseFloat(e.target.value) })}
            className="w-full mt-2 accent-green-500" />
          <div className="flex justify-between text-xs text-gray-600 mt-0.5"><span>Precise</span><span>Creative</span></div>
        </div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <InputField label="API Key" value={cfg.apiKey} onChange={v => setCfg({ ...cfg, apiKey: v })} type="password" placeholder="Enter your AI model API key" />
        </div>
        <div className="flex items-end">
          <button onClick={() => setVerified(cfg.apiKey.length > 10)}
            className="px-3 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/25 text-green-400 text-xs rounded-lg transition-colors flex items-center gap-1.5">
            {verified ? <><CheckCircle className="w-3.5 h-3.5" />Valid</> : <><Zap className="w-3.5 h-3.5" />Verify</>}
          </button>
        </div>
      </div>
      <div className="bg-gray-800/50 rounded-xl p-4">
        <p className="text-xs font-medium text-gray-300 mb-3 flex items-center gap-2"><MessageSquare className="w-3.5 h-3.5" /> Test Chat</p>
        <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
          {chatLog.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`px-3 py-1.5 rounded-xl text-xs max-w-[80%] ${m.role === 'user' ? 'text-white' : 'bg-gray-700 text-gray-200'}`}
                style={m.role === 'user' ? { background: WA_GREEN } : {}}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && <div className="flex justify-start"><div className="px-3 py-1.5 rounded-xl text-xs bg-gray-700 text-gray-400">Typing…</div></div>}
        </div>
        <div className="flex gap-2">
          <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendTest()}
            placeholder="Type a test message…" className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-green-500" />
          <button onClick={sendTest} style={{ background: WA_GREEN }} className="px-3 py-1.5 rounded-lg text-white"><Send className="w-3.5 h-3.5" /></button>
        </div>
      </div>
    </div>
  )
}

function GuardrailsModule({ cfg, setCfg }) {
  const [kw, setKw] = useState('')
  function addKw() {
    const v = kw.trim().toLowerCase()
    if (v && !cfg.stopKeywords.includes(v)) { setCfg({ ...cfg, stopKeywords: [...cfg.stopKeywords, v] }); setKw('') }
  }
  function removeKw(k) { setCfg({ ...cfg, stopKeywords: cfg.stopKeywords.filter(s => s !== k) }) }
  return (
    <div className="space-y-6">
      <SectionHeader icon={Shield} title="Guardrails & Safety" desc="Define rules that keep your bot safe and on-brand" />
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">Message Header <span className="text-gray-600">({cfg.header.length}/60)</span></label>
        <input value={cfg.header} onChange={e => e.target.value.length <= 60 && setCfg({ ...cfg, header: e.target.value })}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">Message Footer <span className="text-gray-600">({cfg.footer.length}/60)</span></label>
        <input value={cfg.footer} onChange={e => e.target.value.length <= 60 && setCfg({ ...cfg, footer: e.target.value })}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-2">Human Escalation Keywords</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {cfg.stopKeywords.map(k => (
            <span key={k} className="flex items-center gap-1 px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-full">
              {k} <button onClick={() => removeKw(k)}><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={kw} onChange={e => setKw(e.target.value)} onKeyDown={e => e.key === 'Enter' && addKw()}
            placeholder="Add keyword…" className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-500" />
          <button onClick={addKw} className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 transition-colors"><Plus className="w-4 h-4" /></button>
        </div>
        <p className="text-xs text-gray-600 mt-1">When detected, AI hands off to a human agent immediately</p>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">AI Retry Limit: {cfg.retryLimit} attempts</label>
        <input type="range" min="1" max="10" value={cfg.retryLimit} onChange={e => setCfg({ ...cfg, retryLimit: parseInt(e.target.value) })} className="w-full accent-green-500" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">Fallback Message</label>
        <textarea value={cfg.fallback} onChange={e => setCfg({ ...cfg, fallback: e.target.value })}
          rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-green-500" />
        <p className="text-xs text-gray-600 mt-1">Sent when AI cannot answer or escalation is triggered</p>
      </div>
    </div>
  )
}

function KnowledgeBaseModule() {
  const [files, setFiles] = useState([
    { name: 'product-catalog.pdf', size: '2.4 MB', status: 'indexed', chunks: 142 },
    { name: 'faq-2024.docx', size: '820 KB', status: 'indexed', chunks: 67 },
    { name: 'pricing-guide.pdf', size: '1.1 MB', status: 'processing', chunks: 0 },
  ])
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef()
  function addFile(name, size) {
    const newFile = { name, size, status: 'processing', chunks: 0 }
    setFiles(f => [...f, newFile])
    setTimeout(() => setFiles(f => f.map(x => x.name === name ? { ...x, status: 'indexed', chunks: Math.floor(Math.random() * 100) + 20 } : x)), 2500)
  }
  function handleDrop(e) {
    e.preventDefault(); setDragging(false)
    Array.from(e.dataTransfer.files).forEach(f => addFile(f.name, `${(f.size / 1048576).toFixed(1)} MB`))
  }
  function testRetrieval() {
    if (!query.trim()) return
    setResults([
      { text: 'Our premium plan includes unlimited API calls, priority support, and custom branding at ₹4,999/month.', score: 0.94 },
      { text: 'Free trial lasts 14 days with full feature access. No credit card required to start.', score: 0.87 },
    ])
  }
  return (
    <div className="space-y-6">
      <SectionHeader icon={Database} title="Knowledge Base" desc="Upload documents to power RAG-based answers in your chatbot" />
      <div onDrop={handleDrop} onDragOver={e => { e.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)}
        onClick={() => fileRef.current.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dragging ? 'border-green-500 bg-green-500/5' : 'border-gray-700 hover:border-gray-600'}`}>
        <Upload className="w-8 h-8 text-gray-600 mx-auto mb-2" />
        <p className="text-sm text-gray-400">Drag & drop files or <span style={{ color: WA_GREEN }}>browse</span></p>
        <p className="text-xs text-gray-600 mt-1">PDF, DOCX, TXT, CSV — Max 20 MB each</p>
        <input ref={fileRef} type="file" multiple accept=".pdf,.docx,.txt,.csv" className="hidden" onChange={e => Array.from(e.target.files).forEach(f => addFile(f.name, `${(f.size / 1048576).toFixed(1)} MB`))} />
      </div>
      <div className="space-y-2">
        {files.map((f, i) => (
          <div key={i} className="flex items-center gap-3 bg-gray-800/50 rounded-xl px-4 py-3">
            <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{f.name}</p>
              <p className="text-xs text-gray-600">{f.size} {f.status === 'indexed' ? `· ${f.chunks} chunks` : ''}</p>
              {f.status === 'processing' && <div className="w-full bg-gray-700 rounded-full h-1 mt-1.5 overflow-hidden"><div className="h-1 rounded-full animate-pulse" style={{ width: '60%', background: WA_GREEN }} /></div>}
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${f.status === 'indexed' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
              {f.status}
            </span>
            <button onClick={() => setFiles(fl => fl.filter((_, j) => j !== i))} className="text-gray-600 hover:text-red-400 transition-colors"><X className="w-3.5 h-3.5" /></button>
          </div>
        ))}
      </div>
      <div className="bg-gray-800/50 rounded-xl p-4">
        <p className="text-xs font-medium text-gray-300 mb-3 flex items-center gap-2"><Search className="w-3.5 h-3.5" /> Test Retrieval</p>
        <div className="flex gap-2 mb-3">
          <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && testRetrieval()}
            placeholder="Ask something from your docs…" className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-green-500" />
          <button onClick={testRetrieval} style={{ background: WA_GREEN }} className="px-3 py-1.5 rounded-lg text-white text-xs">Search</button>
        </div>
        {results.map((r, i) => (
          <div key={i} className="bg-gray-900 rounded-lg px-3 py-2 mb-2">
            <p className="text-xs text-gray-300">{r.text}</p>
            <p className="text-xs text-green-400 mt-1">Similarity: {(r.score * 100).toFixed(0)}%</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function BrandingModule({ cfg, setCfg }) {
  const COLORS = ['#25D366', '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#ef4444']
  const SHAPES = ['rounded', 'square', 'pill']
  return (
    <div className="space-y-6">
      <SectionHeader icon={Palette} title="Branding & UI" desc="Customize your chatbot's appearance and personality" />
      <div className="grid grid-cols-2 gap-4">
        <InputField label="Bot Name" value={cfg.botName} onChange={v => setCfg({ ...cfg, botName: v })} placeholder="Aria" />
        <InputField label="Bot Subtitle" value={cfg.botSub} onChange={v => setCfg({ ...cfg, botSub: v })} placeholder="Your AI Assistant" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <InputField label="Welcome Message 1" value={cfg.welcome1} onChange={v => setCfg({ ...cfg, welcome1: v })} placeholder="Hi! I'm Aria 👋" />
        <InputField label="Welcome Message 2" value={cfg.welcome2} onChange={v => setCfg({ ...cfg, welcome2: v })} placeholder="How can I help you today?" />
      </div>
      <InputField label="Trigger Word" value={cfg.triggerWord} onChange={v => setCfg({ ...cfg, triggerWord: v })} placeholder="hi" hint="Bot activates when user sends this keyword" />
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-2">Brand Color</label>
        <div className="flex items-center gap-2 flex-wrap">
          {COLORS.map(c => (
            <button key={c} onClick={() => setCfg({ ...cfg, brandColor: c })}
              className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
              style={{ background: c, borderColor: cfg.brandColor === c ? '#fff' : 'transparent' }} />
          ))}
          <input type="color" value={cfg.brandColor} onChange={e => setCfg({ ...cfg, brandColor: e.target.value })} className="w-8 h-8 rounded-full cursor-pointer border-0 p-0 bg-transparent" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-2">Bubble Shape</label>
        <div className="flex gap-2">
          {SHAPES.map(s => (
            <button key={s} onClick={() => setCfg({ ...cfg, bubbleShape: s })}
              className={`px-4 py-1.5 text-xs font-medium border transition-colors capitalize ${cfg.bubbleShape === s ? 'border-green-500 text-green-400 bg-green-500/10' : 'border-gray-700 text-gray-400 hover:border-gray-600'} rounded-lg`}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white">White Label</p>
          <p className="text-xs text-gray-500">Remove "AI Expert Academy" branding</p>
        </div>
        <Toggle on={cfg.whiteLabel} onChange={v => setCfg({ ...cfg, whiteLabel: v })} />
      </div>
      <div className="bg-gray-800/50 rounded-xl p-4">
        <p className="text-xs font-medium text-gray-400 mb-3">Live Preview</p>
        <div className="bg-[#0a1628] rounded-2xl p-3 max-w-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-white/10 mb-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: cfg.brandColor }}>{cfg.botName[0] || 'A'}</div>
            <div><p className="text-xs font-semibold text-white">{cfg.botName || 'Aria'}</p><p className="text-xs text-green-400">{cfg.botSub || 'Online'}</p></div>
          </div>
          <div className="space-y-2">
            <div className={`px-3 py-2 text-xs text-white max-w-[85%] ${cfg.bubbleShape === 'square' ? 'rounded' : cfg.bubbleShape === 'pill' ? 'rounded-full' : 'rounded-2xl'}`} style={{ background: cfg.brandColor }}>
              {cfg.welcome1 || 'Hi! I\'m here to help 👋'}
            </div>
            <div className={`px-3 py-2 text-xs text-white max-w-[85%] ${cfg.bubbleShape === 'square' ? 'rounded' : cfg.bubbleShape === 'pill' ? 'rounded-full' : 'rounded-2xl'}`} style={{ background: cfg.brandColor }}>
              {cfg.welcome2 || 'How can I assist you today?'}
            </div>
          </div>
          {!cfg.whiteLabel && <p className="text-center text-gray-600 text-xs mt-3">Powered by AI Expert Academy</p>}
        </div>
      </div>
    </div>
  )
}

function DeployModule({ cfg }) {
  const [tab, setTab] = useState('embed')
  const [contacts, setContacts] = useState(CONTACTS.map(c => ({ ...c, deployed: true })))
  const [selectedLists, setSelectedLists] = useState([])
  const [copied, setCopied] = useState(false)
  const script = `<!-- AI Expert Academy WhatsApp Bot -->
<script src="https://cdn.aiexpertacademy.com/wa-bot.js"
  data-phone="${cfg.countryCode}${cfg.phone || 'XXXXXXXXXX'}"
  data-color="${cfg.brandColor}"
  data-name="${cfg.botName}"
  data-trigger="${cfg.triggerWord}">
</script>`
  function copyScript() { navigator.clipboard.writeText(script); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  function toggleList(id) { setSelectedLists(l => l.includes(id) ? l.filter(x => x !== id) : [...l, id]) }
  const totalSelected = CONTACT_LISTS.filter(l => selectedLists.includes(l.id)).reduce((a, b) => a + b.count, 0)
  return (
    <div className="space-y-6">
      <SectionHeader icon={Rocket} title="Deploy Your Chatbot" desc="Go live on WhatsApp, embed on website, or blast to contact lists" />
      <div className="flex gap-1 bg-gray-800 rounded-xl p-1">
        {[['embed', 'Embed Code'], ['contacts', 'Per Contact'], ['blast', 'Blast Campaign']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${tab === id ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'embed' && (
        <div>
          <p className="text-xs text-gray-400 mb-2">Paste this snippet before <code className="text-green-400">&lt;/body&gt;</code> on your website:</p>
          <div className="relative">
            <pre className="bg-gray-800/80 rounded-xl p-4 text-xs text-green-400 overflow-x-auto whitespace-pre-wrap">{script}</pre>
            <button onClick={copyScript} className="absolute top-3 right-3 p-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-gray-300">
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}
      {tab === 'contacts' && (
        <div className="space-y-2">
          <p className="text-xs text-gray-400 mb-3">Toggle AI chatbot per individual contact:</p>
          {contacts.map(c => (
            <div key={c.id} className="flex items-center gap-3 bg-gray-800/50 rounded-xl px-4 py-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: c.color }}>{c.init}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white">{c.name}</p>
                <p className="text-xs text-gray-500">{c.phone}</p>
              </div>
              <Toggle on={c.deployed} onChange={v => setContacts(cs => cs.map(x => x.id === c.id ? { ...x, deployed: v } : x))} />
            </div>
          ))}
        </div>
      )}
      {tab === 'blast' && (
        <div className="space-y-4">
          <p className="text-xs text-gray-400">Select contact lists to send a campaign message:</p>
          <div className="space-y-2">
            {CONTACT_LISTS.map(l => (
              <div key={l.id} onClick={() => toggleList(l.id)}
                className={`flex items-center gap-3 bg-gray-800/50 rounded-xl px-4 py-3 cursor-pointer border transition-colors ${selectedLists.includes(l.id) ? 'border-green-500/30' : 'border-transparent hover:border-gray-700'}`}>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: l.color }} />
                <div className="flex-1"><p className="text-xs text-white">{l.label}</p></div>
                <span className="text-xs text-gray-500">{l.count.toLocaleString()}</span>
                {selectedLists.includes(l.id) ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Circle className="w-4 h-4 text-gray-700" />}
              </div>
            ))}
          </div>
          {selectedLists.length > 0 && (
            <button className="w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"
              style={{ background: WA_GREEN, color: '#fff' }}>
              <Send className="w-4 h-4" /> Send to {totalSelected.toLocaleString()} Contacts
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function LiveInboxModule() {
  const [activeContact, setActiveContact] = useState(CONTACTS[0])
  const [aiEnabled, setAiEnabled] = useState(true)
  const [reply, setReply] = useState('')
  const [msgs, setMsgs] = useState(CHAT_MSGS)
  const metrics = [
    { label: 'Active Chats', value: '24', color: WA_GREEN },
    { label: 'Resolved Today', value: '187', color: '#6366f1' },
    { label: 'Avg Response', value: '1.2s', color: '#f59e0b' },
    { label: 'AI Handled', value: '94%', color: '#10b981' },
  ]
  function sendReply() {
    if (!reply.trim()) return
    setMsgs(m => [...m, { id: Date.now(), role: 'bot', text: reply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }])
    setReply('')
  }
  return (
    <div className="space-y-4">
      <SectionHeader icon={Inbox} title="Live Inbox" desc="Monitor and manage all WhatsApp conversations in real time" />
      <div className="grid grid-cols-4 gap-3">
        {metrics.map((m, i) => (
          <div key={i} className="bg-gray-800/50 rounded-xl p-3 text-center">
            <p className="text-xl font-bold" style={{ color: m.color }}>{m.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{m.label}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-3 bg-gray-800/30 rounded-xl overflow-hidden" style={{ height: 380 }}>
        <div className="w-48 border-r border-gray-800 flex flex-col overflow-y-auto flex-shrink-0">
          {CONTACTS.map(c => (
            <div key={c.id} onClick={() => setActiveContact(c)}
              className={`px-3 py-3 cursor-pointer border-b border-gray-800 transition-colors ${activeContact.id === c.id ? 'bg-gray-800' : 'hover:bg-gray-800/50'}`}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: c.color }}>{c.init}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-white truncate">{c.name}</p>
                    {c.unread > 0 && <span className="w-4 h-4 rounded-full text-white text-xs flex items-center justify-center flex-shrink-0 ml-1" style={{ background: WA_GREEN, fontSize: 9 }}>{c.unread}</span>}
                  </div>
                  <div className="flex items-center gap-1">
                    {c.aiOn ? <Bot className="w-2.5 h-2.5 text-green-400 flex-shrink-0" /> : <User className="w-2.5 h-2.5 text-gray-500 flex-shrink-0" />}
                    {c.flagged && <AlertTriangle className="w-2.5 h-2.5 text-yellow-400 flex-shrink-0" />}
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-600 truncate">{c.last}</p>
            </div>
          ))}
        </div>
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: activeContact.color }}>{activeContact.init}</div>
              <div>
                <p className="text-xs font-medium text-white">{activeContact.name}</p>
                <p className="text-xs text-gray-500">{activeContact.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">AI</span>
              <Toggle on={aiEnabled} onChange={setAiEnabled} />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {msgs.map(m => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                <div className={`px-3 py-2 rounded-xl text-xs max-w-[75%] ${m.role === 'user' ? 'bg-gray-700 text-gray-200' : 'text-white'}`}
                  style={m.role === 'bot' ? { background: WA_GREEN } : {}}>
                  <p>{m.text}</p>
                  <p className={`text-xs mt-1 ${m.role === 'user' ? 'text-gray-500' : 'text-white/60'}`}>{m.time}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 p-3 border-t border-gray-800">
            <input value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendReply()}
              placeholder="Type a reply…" className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-green-500" />
            <button onClick={sendReply} style={{ background: WA_GREEN }} className="px-3 py-2 rounded-xl text-white"><Send className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function WhatsAppChatbot() {
  const [activeModule, setActiveModule] = useState('link')
  const [connected, setConnected] = useState(false)
  const [cfg, setCfg] = useState(() => {
    try { const s = localStorage.getItem('wa_expert_cfg'); return s ? { ...DEFAULT_CFG, ...JSON.parse(s) } : DEFAULT_CFG } catch { return DEFAULT_CFG }
  })
  useEffect(() => { try { localStorage.setItem('wa_expert_cfg', JSON.stringify(cfg)) } catch {} }, [cfg])

  const moduleComponents = {
    link: <LinkModule cfg={cfg} setCfg={setCfg} connected={connected} setConnected={setConnected} />,
    ai: <AIEngineModule cfg={cfg} setCfg={setCfg} />,
    guardrails: <GuardrailsModule cfg={cfg} setCfg={setCfg} />,
    kb: <KnowledgeBaseModule />,
    branding: <BrandingModule cfg={cfg} setCfg={setCfg} />,
    deploy: <DeployModule cfg={cfg} />,
    inbox: <LiveInboxModule />,
  }

  return (
    <ToolLayout
      icon={MessageSquare}
      title="WhatsApp AI Chatbot"
      description="Build & deploy AI-powered WhatsApp bots for your business — no code required"
      color={WA_GREEN}
    >
      <div className="flex gap-3" style={{ height: 'calc(100vh - 165px)' }}>
        {/* Left Sidebar */}
        <div className="w-52 flex flex-col bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex-shrink-0">
          <div className="px-4 py-3 border-b border-gray-800">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${connected ? 'bg-green-500/10 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
              {connected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              {connected ? 'Connected' : 'Not Connected'}
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto py-2">
            {NAV_MODULES.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveModule(id)}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium transition-colors text-left ${activeModule === id ? 'text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'}`}
                style={activeModule === id ? { background: `${WA_GREEN}18`, color: WA_GREEN, borderRight: `2px solid ${WA_GREEN}` } : {}}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </button>
            ))}
          </nav>
          <div className="p-3 border-t border-gray-800">
            <button onClick={() => { localStorage.setItem('wa_expert_cfg', JSON.stringify(cfg)) }}
              className="w-full py-2 text-xs font-medium rounded-xl transition-colors text-white"
              style={{ background: WA_GREEN }}>
              Save Config
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-gray-900 border border-gray-800 rounded-2xl overflow-y-auto p-6">
          {moduleComponents[activeModule]}
        </div>
      </div>
    </ToolLayout>
  )
}
