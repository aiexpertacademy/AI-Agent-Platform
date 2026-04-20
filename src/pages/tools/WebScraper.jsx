import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Globe, Play, Pause, Square, Plus, Trash2, Download,
  Shield, Eye, Clock, AlertTriangle, CheckCircle2, XCircle, Loader2,
  ToggleLeft, ToggleRight, Bell, Filter, Zap,
  MousePointer, Bot, Server, BarChart3, Activity,
  Code, Calendar, Layout, Table2, X,
} from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'

// ─── Seed Data ─────────────────────────────────────────────────────────────

const INITIAL_TASKS = [
  { id: 1, name: 'amazon-products',   url: 'https://www.amazon.com/s?k=laptops',         status: 'running', rows: 1240, maxPages: 20, selector: '.s-result-item',    strategy: 'element-visible', headless: true,  infiniteScroll: true,  autoPaginate: true },
  { id: 2, name: 'linkedin-jobs',     url: 'https://www.linkedin.com/jobs/search',        status: 'captcha', rows: 342,  maxPages: 10, selector: '.job-card',          strategy: 'network-idle',   headless: true,  infiniteScroll: false, autoPaginate: true },
  { id: 3, name: 'twitter-trends',   url: 'https://twitter.com/trending',               status: 'blocked', rows: 88,   maxPages: 5,  selector: '[data-testid="trend"]', strategy: 'dom-loaded',   headless: true,  infiniteScroll: true,  autoPaginate: false },
  { id: 4, name: 'yelp-restaurants', url: 'https://www.yelp.com/search?find_desc=food', status: 'idle',    rows: 2100, maxPages: 50, selector: '.biz-listing',       strategy: 'element-visible', headless: false, infiniteScroll: false, autoPaginate: true },
  { id: 5, name: 'zillow-listings',  url: 'https://www.zillow.com/homes/for_sale',      status: 'running', rows: 560,  maxPages: 30, selector: '.property-card',     strategy: 'network-idle',   headless: true,  infiniteScroll: false, autoPaginate: true },
]

const INITIAL_PROXY_POOL = [
  { id: 1, ip: '104.21.14.82',   location: 'US-NY', speed: '42ms',  status: 'active',  requests: 1240 },
  { id: 2, ip: '172.67.188.10',  location: 'DE-BE', speed: '88ms',  status: 'active',  requests: 980 },
  { id: 3, ip: '185.220.101.47', location: 'NL-AM', speed: '134ms', status: 'slow',    requests: 420 },
  { id: 4, ip: '195.181.164.23', location: 'GB-LO', speed: '—',     status: 'blocked', requests: 210 },
  { id: 5, ip: '103.152.112.51', location: 'SG-SG', speed: '61ms',  status: 'active',  requests: 780 },
]

const INITIAL_RESULTS = [
  { id: 1, product_name: 'Dell XPS 15 Laptop',    price: 1299.99, rating: '4.6/5', reviews: 2840, anomaly: false },
  { id: 2, product_name: 'Apple MacBook Air M3',  price: 1099.00, rating: '4.8/5', reviews: 5120, anomaly: false },
  { id: 3, product_name: 'HP Spectre x360',        price: -1.00,   rating: '4.4/5', reviews: 1200, anomaly: true  },
  { id: 4, product_name: 'Lenovo ThinkPad X1',    price: 1449.00, rating: '4.5/5', reviews: 890,  anomaly: false },
  { id: 5, product_name: 'ASUS ROG Zephyrus',     price: 1599.99, rating: '4.7/5', reviews: 3400, anomaly: false },
  { id: 6, product_name: 'Microsoft Surface Pro', price: 999.00,  rating: '4.3/5', reviews: 2100, anomaly: false },
]

const INITIAL_SCHEDULES = [
  { id: 1, name: 'amazon-products',  freq: 'Every 6h',  nextRun: 'in 2h 14m',     active: true  },
  { id: 2, name: 'zillow-listings',  freq: 'Daily 8AM', nextRun: 'Tomorrow 08:00', active: true  },
  { id: 3, name: 'yelp-restaurants', freq: 'Weekly Mon', nextRun: 'Monday 09:00',  active: false },
]

const ALERT_LOG = [
  { time: '14:32', task: 'amazon-products', event: 'Price drop: Dell XPS 15 — $1299 → $1099', channel: 'Slack' },
  { time: '11:18', task: 'zillow-listings', event: '14 new listings added in ZIP 10001',       channel: 'Email' },
  { time: '09:45', task: 'amazon-products', event: 'Price drop: MacBook Air M3 — $1199 → $1099', channel: 'Webhook' },
  { time: 'Yesterday', task: 'zillow-listings', event: '3 listings removed from dataset',      channel: 'Slack' },
]

const HOUR_DATA = [8, 12, 18, 24, 30, 21, 36, 42, 38, 44, 50, 38, 29, 48, 52, 47, 60, 58, 52, 44, 38, 30, 24, 18]

const UA_POOL = [
  { browser: 'Chrome 121',  active: true,  ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/121.0.0.0 Safari/537.36' },
  { browser: 'Safari 17',   active: false, ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2_1) AppleWebKit/605.1.15 Version/17.2 Safari/605.1.15' },
  { browser: 'Firefox 122', active: false, ua: 'Mozilla/5.0 (Windows NT 10.0; rv:122.0) Gecko/20100101 Firefox/122.0' },
  { browser: 'Edge 121',    active: false, ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0' },
]

const SEED_LOG = [
  { t: '14:44:12', type: 'info',    msg: 'Task amazon-products — Page 14 loaded (1.2s)' },
  { t: '14:44:10', type: 'success', msg: 'Proxy rotated: 104.21.14.82 → 103.152.112.51 (auto)' },
  { t: '14:44:08', type: 'warning', msg: 'CAPTCHA detected on linkedin-jobs — queuing solver' },
  { t: '14:44:05', type: 'success', msg: 'CAPTCHA solved in 4.1s — resuming linkedin-jobs' },
  { t: '14:44:01', type: 'info',    msg: 'User-agent rotated to Firefox 122 (random pool)' },
  { t: '14:43:58', type: 'info',    msg: 'Infinite scroll triggered — 3 new batches loaded' },
  { t: '14:43:52', type: 'error',   msg: 'Proxy 195.181.164.23 blocked — removed from pool' },
  { t: '14:43:49', type: 'info',    msg: 'Mouse jitter + 1.4s random delay applied' },
  { t: '14:43:44', type: 'success', msg: 'Extracted 24 rows from amazon-products page 14' },
]

// ─── Helpers ───────────────────────────────────────────────────────────────

function Toggle({ value, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!value)} className="cursor-pointer shrink-0">
      {value ? <ToggleRight className="w-6 h-6 text-violet-400" /> : <ToggleLeft className="w-6 h-6 text-gray-600" />}
    </button>
  )
}

function StatusDot({ status }) {
  const cls = {
    running: 'bg-green-400 animate-pulse', captcha: 'bg-amber-400 animate-pulse',
    blocked: 'bg-red-400', idle: 'bg-gray-500', active: 'bg-green-400', slow: 'bg-amber-400',
  }[status] || 'bg-gray-500'
  return <span className={`w-2 h-2 rounded-full shrink-0 inline-block ${cls}`} />
}

function SparkBar({ data, height = 48 }) {
  const max = Math.max(...data)
  return (
    <div className="flex items-end gap-0.5" style={{ height }}>
      {data.map((v, i) => (
        <div key={i} className="flex-1 rounded-t-sm"
          style={{ height: `${(v / max) * 100}%`, background: v > 45 ? '#22c55e' : v > 25 ? '#f59e0b' : '#ef4444', opacity: 0.8 }} />
      ))}
    </div>
  )
}

function Toast({ msg, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t) }, [onClose])
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-gray-800 border border-violet-500/40 rounded-xl shadow-xl text-sm text-white">
      <CheckCircle2 className="w-4 h-4 text-violet-400 shrink-0" />
      {msg}
      <button onClick={onClose} className="ml-1 text-gray-500 hover:text-white cursor-pointer"><X className="w-3.5 h-3.5" /></button>
    </div>
  )
}

function nowTime() {
  return new Date().toLocaleTimeString('en-GB', { hour12: false })
}

// ─── Builder View ──────────────────────────────────────────────────────────

function BuilderView({ task, tasks, setTasks, setActiveMode, addLog, showToast }) {
  const [url, setUrl]                   = useState(task.url)
  const [headless, setHeadless]         = useState(task.headless)
  const [infiniteScroll, setInfiniteScroll] = useState(task.infiniteScroll)
  const [autoPaginate, setAutoPaginate] = useState(task.autoPaginate)
  const [maxPages, setMaxPages]         = useState(task.maxPages)
  const [waitSelector, setWaitSelector] = useState(task.selector)
  const [waitTimeout, setWaitTimeout]   = useState(8000)
  const [strategy, setStrategy]         = useState(task.strategy)
  const [scraping, setScraping]         = useState(task.status === 'running')
  const intervalRef = useRef(null)

  // sync fields when selected task changes
  useEffect(() => {
    setUrl(task.url); setHeadless(task.headless); setInfiniteScroll(task.infiniteScroll)
    setAutoPaginate(task.autoPaginate); setMaxPages(task.maxPages)
    setWaitSelector(task.selector); setStrategy(task.strategy)
    setScraping(task.status === 'running')
  }, [task.id])

  function startScraping() {
    if (!url.trim()) return
    setScraping(true)
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'running', url } : t))
    addLog({ type: 'info', msg: `Task ${task.name} — started. Target: ${url}` })
    addLog({ type: 'success', msg: `Proxy assigned: 104.21.14.82 (US-NY) · strategy: ${strategy}` })
    if (headless) addLog({ type: 'info', msg: 'Playwright headless browser launched' })

    let page = 1
    intervalRef.current = setInterval(() => {
      const rows = Math.floor(Math.random() * 18) + 8
      addLog({ type: 'success', msg: `Page ${page} scraped — ${rows} rows extracted (${(Math.random() * 1.5 + 0.8).toFixed(1)}s)` })
      if (infiniteScroll && Math.random() > 0.6) addLog({ type: 'info', msg: 'Infinite scroll triggered — loading next batch…' })
      if (Math.random() > 0.85) {
        const proxies = ['172.67.188.10', '103.152.112.51']
        addLog({ type: 'warning', msg: `Auto-rotating proxy → ${proxies[Math.floor(Math.random() * proxies.length)]}` })
      }
      if (Math.random() > 0.9) addLog({ type: 'warning', msg: 'CAPTCHA challenge detected — built-in AI solving…' })
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, rows: t.rows + rows } : t))
      page++
      if (page > maxPages) {
        clearInterval(intervalRef.current)
        setScraping(false)
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'idle' } : t))
        addLog({ type: 'success', msg: `Task ${task.name} complete — ${maxPages} pages scraped.` })
        setActiveMode('results')
        showToast(`Scraping complete! Switched to Results. ${maxPages} pages done.`)
      }
    }, 1800)
  }

  function stopScraping() {
    clearInterval(intervalRef.current)
    setScraping(false)
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'idle' } : t))
    addLog({ type: 'warning', msg: `Task ${task.name} — stopped by user.` })
    showToast('Task stopped.')
  }

  useEffect(() => () => clearInterval(intervalRef.current), [])

  return (
    <div className="space-y-4 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 260px)' }}>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Target URL — <span className="text-violet-400">{task.name}</span></label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input value={url} onChange={e => setUrl(e.target.value)} disabled={scraping}
                className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 disabled:opacity-50" placeholder="https://..." />
            </div>
            {scraping ? (
              <button onClick={stopScraping}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg cursor-pointer transition-colors flex items-center gap-2">
                <Square className="w-4 h-4" /> Stop
              </button>
            ) : (
              <button onClick={startScraping}
                className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg cursor-pointer transition-colors flex items-center gap-2">
                <Play className="w-4 h-4" /> Start
              </button>
            )}
          </div>
          {scraping && (
            <div className="mt-2 flex items-center gap-2 text-xs text-violet-400 bg-violet-500/10 border border-violet-500/25 rounded-lg px-3 py-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Scraping in progress — rows accumulating in real time…
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Headless Browser', sub: 'Playwright engine', value: headless, set: setHeadless },
            { label: 'Infinite Scroll',  sub: 'Auto-trigger on scroll-end', value: infiniteScroll, set: setInfiniteScroll },
            { label: 'Auto Pagination',  sub: 'Detect next-page links', value: autoPaginate, set: setAutoPaginate },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between bg-gray-800/50 rounded-lg px-4 py-3">
              <div><p className="text-sm text-gray-300">{item.label}</p><p className="text-[10px] text-gray-600">{item.sub}</p></div>
              <Toggle value={item.value} onChange={item.set} />
            </div>
          ))}
          <div className="bg-gray-800/50 rounded-lg px-4 py-3">
            <label className="text-xs text-gray-500 mb-1 block">Max Pages</label>
            <input type="number" value={maxPages} onChange={e => setMaxPages(Number(e.target.value))}
              className="w-full bg-transparent text-white text-sm focus:outline-none font-mono" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2 bg-gray-800/50 rounded-lg px-4 py-3">
            <label className="text-xs text-gray-500 mb-1 block">Wait-for Selector</label>
            <input value={waitSelector} onChange={e => setWaitSelector(e.target.value)}
              className="w-full bg-transparent text-sm text-violet-300 font-mono focus:outline-none" />
          </div>
          <div className="bg-gray-800/50 rounded-lg px-4 py-3">
            <label className="text-xs text-gray-500 mb-1 block">Timeout (ms)</label>
            <input type="number" value={waitTimeout} onChange={e => setWaitTimeout(Number(e.target.value))}
              className="w-full bg-transparent text-white text-sm focus:outline-none font-mono" />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-2 block">Wait Strategy</label>
          <div className="grid grid-cols-3 gap-2">
            {['element-visible', 'network-idle', 'dom-loaded'].map(s => (
              <button key={s} onClick={() => setStrategy(s)}
                className={`py-2 px-3 rounded-lg text-xs font-medium cursor-pointer transition-colors capitalize ${strategy === s ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                {s.replace(/-/g, ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Ghost Mode View ───────────────────────────────────────────────────────

function GhostModeView({ proxies, setProxies, showToast }) {
  const [autoRotate, setAutoRotate] = useState(true)
  const [minDelay, setMinDelay]     = useState(1.2)
  const [maxDelay, setMaxDelay]     = useState(4.8)
  const [mouseJitter, setMouseJitter] = useState(true)
  const [scrollSim, setScrollSim]   = useState(true)
  const [captchaEngine, setCaptchaEngine] = useState('built-in')
  const [uaPool, setUaPool]         = useState(UA_POOL)
  const [newProxy, setNewProxy]     = useState('')
  const statusBg = {
    active:  'bg-green-500/10 border-green-500/30 text-green-400',
    slow:    'bg-amber-500/10 border-amber-500/30 text-amber-400',
    blocked: 'bg-red-500/10  border-red-500/30  text-red-400',
  }

  function removeProxy(id) {
    setProxies(p => p.filter(x => x.id !== id))
    showToast('Proxy removed from pool.')
  }

  function addProxy() {
    const ip = newProxy.trim()
    if (!ip) return
    setProxies(p => [...p, { id: Date.now(), ip, location: 'UN', speed: '—', status: 'active', requests: 0 }])
    setNewProxy('')
    showToast(`Proxy ${ip} added to pool.`)
  }

  function rotateUA() {
    setUaPool(prev => {
      const activeIdx = prev.findIndex(u => u.active)
      const next = (activeIdx + 1) % prev.length
      return prev.map((u, i) => ({ ...u, active: i === next }))
    })
    showToast('User-agent rotated to next in pool.')
  }

  return (
    <div className="space-y-4 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 260px)' }}>
      {/* Proxy Pool */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-200 flex items-center gap-2"><Server className="w-4 h-4 text-violet-400" /> Proxy Pool ({proxies.length})</p>
          <div className="flex items-center gap-2"><span className="text-[10px] text-gray-500">Auto-rotate</span><Toggle value={autoRotate} onChange={setAutoRotate} /></div>
        </div>
        <table className="w-full text-xs mb-3">
          <thead><tr className="border-b border-gray-800">{['IP', 'Loc', 'Speed', 'Reqs', 'Status', ''].map(h => <th key={h} className="text-left py-2 px-2 text-gray-500">{h}</th>)}</tr></thead>
          <tbody>{proxies.map(p => (
            <tr key={p.id} className="border-b border-gray-800/40 hover:bg-gray-800/20 group">
              <td className="py-2 px-2 font-mono text-gray-300">{p.ip}</td>
              <td className="py-2 px-2 text-gray-400">{p.location}</td>
              <td className="py-2 px-2 font-mono text-gray-300">{p.speed}</td>
              <td className="py-2 px-2 text-gray-400">{p.requests.toLocaleString()}</td>
              <td className="py-2 px-2"><span className={`px-2 py-0.5 rounded-full text-[10px] border font-semibold ${statusBg[p.status]}`}>{p.status}</span></td>
              <td className="py-2 px-2"><button onClick={() => removeProxy(p.id)} className="opacity-0 group-hover:opacity-100 cursor-pointer text-red-400 hover:text-red-300"><Trash2 className="w-3 h-3" /></button></td>
            </tr>
          ))}</tbody>
        </table>
        <div className="flex gap-2">
          <input value={newProxy} onChange={e => setNewProxy(e.target.value)} onKeyDown={e => e.key === 'Enter' && addProxy()}
            placeholder="Add proxy IP (e.g. 91.108.4.1)" className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50 font-mono" />
          <button onClick={addProxy} className="px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs rounded-lg cursor-pointer transition-colors flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
        </div>
      </div>

      {/* User-Agent Pool */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-200 flex items-center gap-2"><Eye className="w-4 h-4 text-blue-400" /> User-Agent Pool</p>
          <button onClick={rotateUA} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 cursor-pointer bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/25">
            <ToggleRight className="w-3.5 h-3.5" /> Rotate
          </button>
        </div>
        <div className="space-y-2">
          {uaPool.map((ua, i) => (
            <div key={i} className={`flex items-center gap-3 p-2.5 rounded-lg border ${ua.active ? 'border-violet-500/40 bg-violet-500/5' : 'border-gray-800 bg-gray-800/30'}`}>
              <div className={`w-2 h-2 rounded-full shrink-0 ${ua.active ? 'bg-green-400' : 'bg-gray-600'}`} />
              <span className="text-xs font-medium text-gray-300 w-24 shrink-0">{ua.browser}</span>
              {ua.active && <span className="text-[10px] text-violet-400 truncate font-mono">{ua.ua.slice(0, 52)}…</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Human Behavior */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2"><MousePointer className="w-4 h-4 text-green-400" /> Human Behavior</p>
        <div className="space-y-3">
          {[{ label: 'Min Delay (s)', value: minDelay, set: setMinDelay, min: 0.5, max: 5 }, { label: 'Max Delay (s)', value: maxDelay, set: setMaxDelay, min: 1, max: 15 }].map(s => (
            <div key={s.label}>
              <div className="flex justify-between mb-1"><label className="text-xs text-gray-400">{s.label}</label><span className="text-xs text-white font-mono">{s.value.toFixed(1)}s</span></div>
              <input type="range" min={s.min} max={s.max} step={0.1} value={s.value} onChange={e => s.set(Number(e.target.value))} className="w-full accent-violet-500 cursor-pointer" />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-2">
            {[{ label: 'Mouse Jitter', value: mouseJitter, set: setMouseJitter }, { label: 'Scroll Sim', value: scrollSim, set: setScrollSim }].map(t => (
              <div key={t.label} className="flex items-center justify-between bg-gray-800/50 rounded-lg px-3 py-2.5">
                <span className="text-xs text-gray-300">{t.label}</span><Toggle value={t.value} onChange={t.set} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CAPTCHA */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2"><Bot className="w-4 h-4 text-yellow-400" /> CAPTCHA Solver</p>
        <div className="grid grid-cols-3 gap-2">
          {[['built-in', 'Built-in AI'], ['2captcha', '2Captcha'], ['capmonster', 'CapMonster']].map(([id, label]) => (
            <button key={id} onClick={() => { setCaptchaEngine(id); showToast(`CAPTCHA engine switched to ${label}`) }}
              className={`py-2 px-3 rounded-lg text-xs font-medium cursor-pointer transition-colors ${captchaEngine === id ? 'bg-yellow-500/20 border border-yellow-500/40 text-yellow-300' : 'bg-gray-800 text-gray-500 hover:text-white'}`}>{label}</button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Extraction View ───────────────────────────────────────────────────────

function ExtractionView({ showToast }) {
  const SEED_RULES = [
    { id: 1, field: 'product_name', selector: 'h2.product-title', type: 'text' },
    { id: 2, field: 'price', selector: 'span.a-price-whole', type: 'number' },
    { id: 3, field: 'rating', selector: 'span.a-icon-alt', type: 'text' },
    { id: 4, field: 'reviews_count', selector: 'span#acrCustomerReviewText', type: 'number' },
    { id: 5, field: 'image_url', selector: 'img#landingImage', type: 'attr:src' },
  ]
  const [rules, setRules]       = useState(SEED_RULES)
  const [nlqInput, setNlqInput] = useState('')
  const [nlqResult, setNlqResult] = useState(null)
  const [regex, setRegex]       = useState('\\$[\\d,]+\\.\\d{2}')
  const CHIPS = ['Product names', 'Prices', 'Ratings', 'Image URLs', 'Descriptions', 'Links', 'Availability', 'SKU']
  const SELECTOR_MAP = {
    'Product names': { selector: 'h2.a-size-mini span.a-color-base', confidence: 94 },
    'Prices':        { selector: 'span.a-price > span.a-offscreen', confidence: 97 },
    'Ratings':       { selector: 'span.a-icon-alt', confidence: 91 },
    'Image URLs':    { selector: 'img.s-image', confidence: 96, type: 'attr:src' },
    'Descriptions':  { selector: 'div.a-section p', confidence: 78 },
    'Links':         { selector: 'a.a-link-normal.s-underline-text', confidence: 93, type: 'attr:href' },
    'Availability':  { selector: 'span#availability span', confidence: 88 },
    'SKU':           { selector: 'span.a-size-base.a-color-secondary + span', confidence: 82 },
  }

  function handleNlq(e) {
    e.preventDefault()
    if (!nlqInput.trim()) return
    const mapped = SELECTOR_MAP[nlqInput] || { selector: `[data-field="${nlqInput.toLowerCase().replace(/\s+/g, '-')}"]`, confidence: 71 }
    setNlqResult({ ...mapped, field: nlqInput, type: mapped.type || 'text' })
    setNlqInput('')
  }

  function addResult() {
    setRules(prev => [...prev, {
      id: Date.now(),
      field: nlqResult.field.toLowerCase().replace(/\s+/g, '_'),
      selector: nlqResult.selector,
      type: nlqResult.type || 'text',
    }])
    setNlqResult(null)
    showToast('Rule added to extraction rules.')
  }

  return (
    <div className="space-y-4 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 260px)' }}>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-400" /> AI Auto-Label</p>
        <form onSubmit={handleNlq} className="flex gap-2 mb-3">
          <input value={nlqInput} onChange={e => setNlqInput(e.target.value)}
            placeholder='"find all product names" or "get the price"'
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500/40" />
          <button type="submit" className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm rounded-lg cursor-pointer">Detect</button>
        </form>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {CHIPS.map(c => <button key={c} onClick={() => { setNlqInput(c); setNlqResult(null) }} className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-400 text-xs rounded-full cursor-pointer">{c}</button>)}
        </div>
        {nlqResult && (
          <div className="bg-violet-500/10 border border-violet-500/30 rounded-lg p-3">
            <div className="flex justify-between mb-1">
              <span className="text-xs text-gray-400">For: <span className="text-violet-300">"{nlqResult.field}"</span></span>
              <span className="text-xs text-green-400 font-semibold">{nlqResult.confidence}% confidence</span>
            </div>
            <p className="text-xs font-mono text-violet-200 mb-2">{nlqResult.selector}</p>
            <button onClick={addResult} className="text-xs text-violet-400 hover:text-violet-300 cursor-pointer bg-violet-500/10 px-3 py-1 rounded-lg border border-violet-500/25">+ Add to rules</button>
          </div>
        )}
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-200">Extraction Rules ({rules.length})</p>
          <button onClick={() => setRules(prev => [...prev, { id: Date.now(), field: 'new_field', selector: '', type: 'text' }])}
            className="text-xs text-violet-400 hover:text-violet-300 cursor-pointer flex items-center gap-1 bg-violet-500/10 px-2.5 py-1 rounded-lg border border-violet-500/25"><Plus className="w-3 h-3" /> Add rule</button>
        </div>
        <table className="w-full text-xs">
          <thead><tr className="border-b border-gray-800">{['Field', 'Selector', 'Type', ''].map(h => <th key={h} className="text-left py-2 px-2 text-gray-500">{h}</th>)}</tr></thead>
          <tbody>{rules.map(r => (
            <tr key={r.id} className="border-b border-gray-800/40 hover:bg-gray-800/20 group">
              <td className="py-2 px-2 text-green-400 font-mono">{r.field}</td>
              <td className="py-2 px-2 text-violet-300 font-mono">{r.selector}</td>
              <td className="py-2 px-2 text-gray-400">{r.type}</td>
              <td className="py-2 px-2"><button onClick={() => setRules(p => p.filter(x => x.id !== r.id))} className="opacity-0 group-hover:opacity-100 cursor-pointer text-red-400 hover:text-red-300"><Trash2 className="w-3 h-3" /></button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2"><Filter className="w-4 h-4 text-cyan-400" /> Regex Filter</p>
        <input value={regex} onChange={e => setRegex(e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-mono text-cyan-300 focus:outline-none mb-3" />
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-800/40 rounded-lg p-2.5"><p className="text-[10px] text-gray-600 mb-1">Before</p><p className="text-xs text-gray-400 font-mono">Price: $1,299.99 (was $1,499)</p></div>
          <div className="bg-gray-800/40 rounded-lg p-2.5"><p className="text-[10px] text-gray-600 mb-1">After</p><p className="text-xs text-green-300 font-mono">$1,299.99</p></div>
        </div>
      </div>
    </div>
  )
}

// ─── Results View ──────────────────────────────────────────────────────────

function ResultsView({ results, setResults, taskName, showToast }) {
  function downloadCSV() {
    const clean = results.filter(r => !r.anomaly)
    const header = 'id,product_name,price,rating,reviews'
    const rows = clean.map(r => `${r.id},"${r.product_name}",${r.price},"${r.rating}",${r.reviews}`).join('\n')
    const blob = new Blob([header + '\n' + rows], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `${taskName}-results.csv`; a.click()
    showToast('CSV downloaded.')
  }

  function downloadJSON() {
    const clean = results.filter(r => !r.anomaly)
    const blob = new Blob([JSON.stringify(clean, null, 2)], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `${taskName}-results.json`; a.click()
    showToast('JSON downloaded.')
  }

  const anomalyCount = results.filter(r => r.anomaly).length
  const cleanCount   = results.filter(r => !r.anomaly).length

  return (
    <div className="space-y-3 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 260px)' }}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">
          {results.length} rows total · <span className="text-green-400">{cleanCount} clean</span>
          {anomalyCount > 0 && <> · <span className="text-red-400">{anomalyCount} anomaly auto-excluded</span></>}
        </p>
        <div className="flex gap-2">
          <button onClick={downloadCSV} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg cursor-pointer border border-gray-700"><Download className="w-3.5 h-3.5" /> CSV</button>
          <button onClick={downloadJSON} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg cursor-pointer border border-gray-700"><Code className="w-3.5 h-3.5" /> JSON</button>
        </div>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-gray-800/60 border-b border-gray-800">
            <tr>{['#', 'Product Name', 'Price', 'Rating', 'Reviews', 'Status'].map(h => <th key={h} className="text-left py-2.5 px-3 text-gray-500">{h}</th>)}</tr>
          </thead>
          <tbody>{results.map(row => (
            <tr key={row.id} className={`border-b border-gray-800/40 hover:bg-gray-800/20 ${row.anomaly ? 'bg-red-500/5' : ''}`}>
              <td className="py-2.5 px-3 text-gray-600">{row.id}</td>
              <td className="py-2.5 px-3 text-gray-300">{row.product_name}</td>
              <td className={`py-2.5 px-3 font-mono font-semibold ${row.anomaly ? 'text-red-400' : 'text-green-400'}`}>${row.price.toFixed(2)}</td>
              <td className="py-2.5 px-3 text-gray-400">{row.rating}</td>
              <td className="py-2.5 px-3 text-gray-400">{row.reviews.toLocaleString()}</td>
              <td className="py-2.5 px-3">
                {row.anomaly
                  ? <span className="flex items-center gap-1 text-red-400 text-[10px] font-semibold"><AlertTriangle className="w-3 h-3" /> Anomaly · excluded</span>
                  : <span className="flex items-center gap-1 text-green-400 text-[10px]"><CheckCircle2 className="w-3 h-3" /> Clean</span>}
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Scheduler View ────────────────────────────────────────────────────────

function SchedulerView({ schedules, setSchedules, showToast }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', freq: 'Every 6h', channel: 'Slack', condition: 'price drops > 5%' })
  const CHANNELS = ['Slack', 'Email', 'Webhook', 'Discord']

  function toggleSchedule(id) {
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s))
  }
  function deleteSchedule(id) {
    setSchedules(prev => prev.filter(s => s.id !== id))
    showToast('Schedule removed.')
  }
  function saveSchedule() {
    if (!form.name.trim()) return
    setSchedules(prev => [...prev, { id: Date.now(), name: form.name, freq: form.freq, nextRun: 'Scheduled', active: true }])
    setShowForm(false)
    setForm({ name: '', freq: 'Every 6h', channel: 'Slack', condition: 'price drops > 5%' })
    showToast(`Schedule "${form.name}" created.`)
  }

  return (
    <div className="space-y-4 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 260px)' }}>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2"><Calendar className="w-4 h-4 text-indigo-400" /> Active Schedules</p>
        <div className="space-y-2">
          {schedules.map(s => (
            <div key={s.id} className="flex items-center gap-3 p-3 bg-gray-800/50 border border-gray-800 rounded-xl group">
              <StatusDot status={s.active ? 'running' : 'idle'} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200 font-medium">{s.name}</p>
                <p className="text-[10px] text-gray-500">{s.freq} · Next: {s.nextRun}</p>
              </div>
              <button onClick={() => toggleSchedule(s.id)}
                className={`p-1.5 rounded-lg cursor-pointer text-xs ${s.active ? 'text-amber-400 hover:bg-amber-500/10' : 'text-green-400 hover:bg-green-500/10'}`}
                title={s.active ? 'Pause' : 'Resume'}>
                {s.active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => deleteSchedule(s.id)}
                className="p-1.5 text-gray-600 hover:text-red-400 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        {!showForm ? (
          <button onClick={() => setShowForm(true)}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2 border border-dashed border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-600 rounded-xl text-xs cursor-pointer transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add schedule
          </button>
        ) : (
          <div className="mt-3 space-y-2 bg-gray-800/40 border border-gray-700 rounded-xl p-3">
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Task name" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white placeholder-gray-600 focus:outline-none" />
            <div className="grid grid-cols-2 gap-2">
              {['Every 1h', 'Every 6h', 'Daily 8AM', 'Weekly Mon'].map(f => (
                <button key={f} onClick={() => setForm(p => ({ ...p, freq: f }))}
                  className={`py-1.5 px-2 rounded-lg text-[11px] cursor-pointer transition-colors ${form.freq === f ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>{f}</button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={saveSchedule} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg cursor-pointer">Save</button>
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 text-xs rounded-lg cursor-pointer">Cancel</button>
            </div>
          </div>
        )}
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2"><Bell className="w-4 h-4 text-yellow-400" /> Change Alert Log</p>
        <div className="space-y-2 mb-3">
          {ALERT_LOG.map((a, i) => (
            <div key={i} className="flex items-start gap-3 p-2.5 bg-gray-800/40 rounded-lg">
              <span className="text-[10px] text-gray-600 font-mono shrink-0 mt-0.5">{a.time}</span>
              <div className="flex-1 min-w-0"><p className="text-xs text-gray-300">{a.event}</p><p className="text-[10px] text-gray-600">{a.task}</p></div>
              <span className="text-[9px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full shrink-0">{a.channel}</span>
            </div>
          ))}
        </div>
        <div className="space-y-2 bg-gray-800/40 border border-gray-700 rounded-xl p-3">
          <p className="text-xs text-gray-400 font-medium">Alert Rule</p>
          <input value={form.condition} onChange={e => setForm(p => ({ ...p, condition: e.target.value }))}
            placeholder="e.g. price drops > 5%" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white placeholder-gray-600 focus:outline-none" />
          <div className="flex gap-2">
            {CHANNELS.map(c => <button key={c} onClick={() => setForm(p => ({ ...p, channel: c }))}
              className={`flex-1 py-1.5 rounded-lg text-[10px] cursor-pointer ${form.channel === c ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>{c}</button>)}
          </div>
          <button onClick={() => showToast(`Alert rule saved — notify via ${form.channel} when ${form.condition}`)}
            className="w-full py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 text-yellow-300 text-xs rounded-lg cursor-pointer transition-colors">Save Alert Rule</button>
        </div>
      </div>
    </div>
  )
}

// ─── Dashboard View ────────────────────────────────────────────────────────

function DashboardView({ tasks, proxies }) {
  const runningCount  = tasks.filter(t => t.status === 'running').length
  const totalRows     = tasks.reduce((a, t) => a + t.rows, 0)
  const activeProxies = proxies.filter(p => p.status === 'active').length

  return (
    <div className="space-y-4 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 260px)' }}>
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Active Tasks', value: `${runningCount}/${tasks.length}`, color: 'text-violet-400' },
          { label: 'Total Rows', value: totalRows.toLocaleString(), color: 'text-green-400' },
          { label: 'Active Proxies', value: `${activeProxies}/${proxies.length}`, color: 'text-blue-400' },
          { label: 'CAPTCHAs Solved', value: '38', color: 'text-yellow-400' },
        ].map((m, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-3.5">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{m.label}</p>
            <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-sm font-semibold text-gray-200 mb-3">Success vs Blocked — 24h</p>
        <SparkBar data={HOUR_DATA} height={60} />
        <div className="flex gap-4 mt-2 text-[10px] text-gray-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Success</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> CAPTCHA</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Blocked</span>
        </div>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-sm font-semibold text-gray-200 mb-3">Task Row Counts</p>
        <div className="space-y-3">
          {tasks.map(t => {
            const max = Math.max(...tasks.map(x => x.rows))
            const color = t.status === 'running' ? '#22c55e' : t.status === 'blocked' ? '#ef4444' : t.status === 'captcha' ? '#f59e0b' : '#6b7280'
            return (
              <div key={t.id} className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-gray-500 w-32 shrink-0 truncate">{t.name}</span>
                <div className="flex-1 bg-gray-800 rounded-full h-2"><div className="h-full rounded-full transition-all" style={{ width: `${(t.rows / max) * 100}%`, backgroundColor: color }} /></div>
                <span className="text-[10px] text-gray-400 w-14 text-right">{t.rows.toLocaleString()}</span>
              </div>
            )
          })}
        </div>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-sm font-semibold text-gray-200 mb-3">Per-Proxy Performance</p>
        <div className="space-y-2.5">
          {proxies.map((p, i) => {
            const pct   = p.status === 'blocked' ? 0 : p.status === 'slow' ? 40 : 70 + (i % 3) * 10
            const color = p.status === 'blocked' ? '#ef4444' : p.status === 'slow' ? '#f59e0b' : '#22c55e'
            return (
              <div key={p.id} className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-gray-500 w-32 shrink-0">{p.ip}</span>
                <div className="flex-1 bg-gray-800 rounded-full h-2"><div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} /></div>
                <span className="text-[10px] text-gray-400 w-10 text-right">{p.requests.toLocaleString()}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Right Panel ───────────────────────────────────────────────────────────

function LiveLogTab({ logs }) {
  const endRef = useRef(null)
  useEffect(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), [logs])
  const c = { info: 'text-gray-400', success: 'text-green-400', warning: 'text-amber-400', error: 'text-red-400' }
  return (
    <div className="p-3 space-y-1.5 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
      {logs.map((e, i) => (
        <div key={i} className="flex gap-2 text-[10px]">
          <span className="text-gray-700 font-mono shrink-0 w-16">{e.t}</span>
          <span className={c[e.type]}>{e.msg}</span>
        </div>
      ))}
      <div ref={endRef} />
    </div>
  )
}

function GhostTab({ proxies }) {
  const activeProxies = proxies.filter(p => p.status === 'active').length
  const hasBlocked    = proxies.some(p => p.status === 'blocked')
  const score         = hasBlocked ? 28 : 12
  const checks = [
    { label: 'Proxy rotation active', ok: activeProxies > 0 },
    { label: 'User-agent randomized', ok: true },
    { label: 'Request timing humanized', ok: true },
    { label: 'Mouse jitter enabled', ok: true },
    { label: 'WebDriver flag hidden', ok: true },
    { label: 'Canvas fingerprint spoofed', ok: true },
    { label: 'TLS JA3 fingerprint rotation', ok: !hasBlocked },
    { label: 'Referrer header set', ok: true },
  ]
  const riskColor = score < 30 ? 'text-green-400' : 'text-amber-400'
  const riskLabel = score < 30 ? 'LOW' : 'MEDIUM'
  return (
    <div className="p-4 space-y-4">
      <div className="text-center bg-gray-800/60 rounded-xl p-4">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Detection Risk</p>
        <p className={`text-5xl font-bold ${riskColor}`}>{score}</p>
        <p className={`text-sm font-semibold ${riskColor} mt-1`}>{riskLabel}</p>
        <p className="text-[10px] text-gray-600 mt-1">out of 100</p>
      </div>
      <div className="space-y-2">
        {checks.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            {c.ok ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />}
            <span className={`text-xs ${c.ok ? 'text-gray-300' : 'text-red-400'}`}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AlertsRightTab({ showToast }) {
  const [saved, setSaved] = useState(false)
  return (
    <div className="p-3 space-y-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
      {ALERT_LOG.slice(0, 3).map((a, i) => (
        <div key={i} className="bg-gray-800/60 border border-gray-800 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1"><Bell className="w-3 h-3 text-yellow-400" /><span className="text-[10px] text-gray-500">{a.time}</span><span className="ml-auto text-[9px] text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-full">{a.channel}</span></div>
          <p className="text-xs text-gray-300">{a.event}</p>
        </div>
      ))}
      <div className="bg-gray-900 border border-dashed border-gray-700 rounded-xl p-3 space-y-2">
        <p className="text-xs font-medium text-gray-400">New Alert Rule</p>
        {[['Watch field', 'price'], ['Condition', 'drops > 5%'], ['Notify via', 'Slack']].map(([l, v]) => (
          <div key={l} className="bg-gray-800 rounded-lg px-3 py-2"><p className="text-[9px] text-gray-600">{l}</p><p className="text-xs text-gray-300">{v}</p></div>
        ))}
        <button onClick={() => { setSaved(true); showToast('Alert rule saved — watching price for >5% drops.') }}
          className={`w-full py-1.5 text-xs rounded-lg cursor-pointer transition-colors ${saved ? 'bg-green-600/20 text-green-400 border border-green-500/30' : 'bg-violet-600 hover:bg-violet-500 text-white'}`}>
          {saved ? '✓ Rule Saved' : 'Save Rule'}
        </button>
      </div>
    </div>
  )
}

// ─── New Task Modal ────────────────────────────────────────────────────────

function NewTaskModal({ onAdd, onClose }) {
  const [name, setName] = useState('')
  const [url, setUrl]   = useState('')
  function handleAdd() {
    if (!name.trim() || !url.trim()) return
    onAdd({ id: Date.now(), name: name.trim(), url: url.trim(), status: 'idle', rows: 0, maxPages: 10, selector: '', strategy: 'element-visible', headless: true, infiniteScroll: false, autoPaginate: true })
    onClose()
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-96 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-white">New Scraping Task</p>
          <button onClick={onClose} className="text-gray-500 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Task name (e.g. etsy-watches)"
          className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50" />
        <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://target-url.com/path"
          className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50" />
        <div className="flex gap-2">
          <button onClick={handleAdd} className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg cursor-pointer">Create Task</button>
          <button onClick={onClose}   className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-400 text-sm rounded-lg cursor-pointer">Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ─── Main ──────────────────────────────────────────────────────────────────

const MODES = [
  { id: 'builder',   label: 'Builder',   icon: Layout   },
  { id: 'ghost',     label: 'Ghost Mode',icon: Shield    },
  { id: 'extract',   label: 'Extraction',icon: Code      },
  { id: 'results',   label: 'Results',   icon: Table2    },
  { id: 'scheduler', label: 'Scheduler', icon: Clock     },
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
]
const RIGHT_TABS = [
  { id: 'log',    label: 'Live Log', icon: Activity },
  { id: 'ghost',  label: 'Ghost',    icon: Shield   },
  { id: 'alerts', label: 'Alerts',   icon: Bell     },
]

export default function WebScraper() {
  const [activeMode,   setActiveMode]   = useState('builder')
  const [rightTab,     setRightTab]     = useState('log')
  const [tasks,        setTasks]        = useState(INITIAL_TASKS)
  const [selectedId,   setSelectedId]   = useState(1)
  const [proxies,      setProxies]      = useState(INITIAL_PROXY_POOL)
  const [results,      setResults]      = useState(INITIAL_RESULTS)
  const [schedules,    setSchedules]    = useState(INITIAL_SCHEDULES)
  const [logs,         setLogs]         = useState(SEED_LOG)
  const [toast,        setToast]        = useState(null)
  const [showNewTask,  setShowNewTask]  = useState(false)

  const selectedTask = tasks.find(t => t.id === selectedId) || tasks[0]

  const addLog = useCallback((entry) => {
    setLogs(prev => [{ t: nowTime(), ...entry }, ...prev].slice(0, 100))
    setRightTab('log')
  }, [])

  const showToast = useCallback((msg) => setToast(msg), [])

  function handleAddTask(task) {
    setTasks(prev => [...prev, task])
    setSelectedId(task.id)
    setActiveMode('builder')
    showToast(`Task "${task.name}" created. Configure and click Start.`)
  }

  return (
    <ToolLayout icon={Globe} title="Web Scraper" description="Professional stealth scraping — ghost mode, AI extraction, real-time monitoring" color="#8b5cf6">
      <div className="flex gap-3" style={{ height: 'calc(100vh - 165px)' }}>

        {/* Left Sidebar */}
        <div className="w-56 flex flex-col bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shrink-0">
          <div className="px-3 pt-3 pb-2 border-b border-gray-800">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Active Tasks</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {tasks.map(t => (
              <button key={t.id} onClick={() => { setSelectedId(t.id); setActiveMode('builder') }}
                className={`w-full flex items-start gap-2.5 px-2.5 py-2.5 rounded-xl text-left transition-all cursor-pointer ${selectedId === t.id ? 'bg-violet-500/10 border border-violet-500/25' : 'hover:bg-gray-800/70 border border-transparent'}`}>
                <StatusDot status={t.status} />
                <div className="flex-1 min-w-0 mt-0.5">
                  <p className="text-[11px] text-gray-300 truncate font-medium">{t.name}</p>
                  <p className="text-[9px] text-gray-600 truncate">{t.url.replace('https://', '')}</p>
                  <p className="text-[9px] text-gray-500 mt-0.5">{t.rows.toLocaleString()} rows · {t.status}</p>
                </div>
              </button>
            ))}
          </div>
          <div className="p-3 border-t border-gray-800 space-y-2">
            <button onClick={() => setShowNewTask(true)}
              className="w-full flex items-center gap-2 px-3 py-2 bg-violet-600/15 hover:bg-violet-600/25 border border-violet-500/30 text-violet-400 text-xs font-medium rounded-xl cursor-pointer transition-colors">
              <Plus className="w-3.5 h-3.5" /> New task
            </button>
            <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-800/60 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <div className="flex-1">
                <p className="text-[9px] text-gray-400">Ghost Mode · {proxies.filter(p => p.status === 'active').length} proxies</p>
                <p className="text-[9px] text-gray-600">{tasks.filter(t => t.status === 'running').length} running now</p>
              </div>
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
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-[11px] font-medium transition-all cursor-pointer ${activeMode === m.id ? 'bg-violet-600 text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'}`}>
                  <Icon className="w-3.5 h-3.5" /><span className="hidden lg:block">{m.label}</span>
                </button>
              )
            })}
          </div>
          <div className="flex-1 min-h-0">
            {activeMode === 'builder'   && <BuilderView task={selectedTask} tasks={tasks} setTasks={setTasks} setActiveMode={setActiveMode} addLog={addLog} showToast={showToast} />}
            {activeMode === 'ghost'     && <GhostModeView proxies={proxies} setProxies={setProxies} showToast={showToast} />}
            {activeMode === 'extract'   && <ExtractionView showToast={showToast} />}
            {activeMode === 'results'   && <ResultsView results={results} setResults={setResults} taskName={selectedTask.name} showToast={showToast} />}
            {activeMode === 'scheduler' && <SchedulerView schedules={schedules} setSchedules={setSchedules} showToast={showToast} />}
            {activeMode === 'dashboard' && <DashboardView tasks={tasks} proxies={proxies} />}
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-64 flex flex-col bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shrink-0">
          <div className="grid grid-cols-3 border-b border-gray-800 shrink-0">
            {RIGHT_TABS.map(t => {
              const Icon = t.icon
              return (
                <button key={t.id} onClick={() => setRightTab(t.id)}
                  className={`flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-all cursor-pointer border-b-2 ${rightTab === t.id ? 'border-violet-500 text-violet-300' : 'border-transparent text-gray-600 hover:text-gray-300'}`}>
                  <Icon className="w-4 h-4" />{t.label}
                </button>
              )
            })}
          </div>
          <div className="flex-1 overflow-hidden">
            {rightTab === 'log'    && <LiveLogTab logs={logs} />}
            {rightTab === 'ghost'  && <GhostTab proxies={proxies} />}
            {rightTab === 'alerts' && <AlertsRightTab showToast={showToast} />}
          </div>
        </div>
      </div>

      {showNewTask && <NewTaskModal onAdd={handleAddTask} onClose={() => setShowNewTask(false)} />}
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
    </ToolLayout>
  )
}
