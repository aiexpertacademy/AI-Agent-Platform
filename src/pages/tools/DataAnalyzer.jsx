import { useState, useRef, useCallback } from 'react'
import {
  Database, Upload, Loader2, BarChart3, Sparkles, Table2, Wand2,
  Brain, FileText, TrendingUp, AlertTriangle, CheckCircle2, Info,
  XCircle, ChevronDown, Send, Zap, Plus, RefreshCw, Download,
  MessageSquare, Sliders, Activity, Globe, FileSpreadsheet,
  FileJson, Server, ShoppingBag, FileScan, HardDrive, X,
  ArrowUpRight, ArrowDownRight, Minus, MapPin, Target, Eye,
  Star, Smile, Frown, Meh, BookOpen, Share2, Bell, Filter,
} from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'
import { callGemini } from '../../config/gemini'

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_SOURCES = [
  { id: 1, type: 'excel', icon: FileSpreadsheet, label: 'sales_Q1_2025.xlsx', color: '#22c55e', rows: 12480, status: 'live', lastSync: '2m ago' },
  { id: 2, type: 'json', icon: FileJson, label: 'customers_api.json', color: '#f59e0b', rows: 3210, status: 'live', lastSync: '5m ago' },
  { id: 3, type: 'postgres', icon: Server, label: 'PostgreSQL · orders_db', color: '#3b82f6', rows: 88500, status: 'live', lastSync: '1m ago' },
  { id: 4, type: 'shopify', icon: ShoppingBag, label: 'Shopify · main store', color: '#8b5cf6', rows: 5100, status: 'syncing', lastSync: '5m refresh' },
  { id: 5, type: 'pdf', icon: FileScan, label: 'annual_report_2024.pdf', color: '#ef4444', rows: 340, status: 'live', lastSync: '1h ago' },
  { id: 6, type: 'parquet', icon: HardDrive, label: 'BigQuery · events.parquet', color: '#06b6d4', rows: 201000, status: 'live', lastSync: '3m ago' },
]

const CONNECTORS = ['MySQL', 'MongoDB', 'Amazon S3', 'Snowflake', 'Google Sheets', 'Salesforce', 'HubSpot', 'Stripe', 'Airtable', 'Notion']

const METRIC_CARDS = [
  { label: 'Total Revenue', value: '$2.47M', delta: '+14.2%', up: true, sub: 'vs last quarter' },
  { label: 'Orders Processed', value: '18,294', delta: '+8.7%', up: true, sub: 'vs last quarter' },
  { label: 'Avg Order Value', value: '$134.90', delta: '-2.1%', up: false, sub: 'vs last quarter' },
  { label: 'Churn Rate', value: '3.8%', delta: '+0.4%', up: false, sub: 'vs last quarter' },
]

const LINE_DATA = [
  { month: 'Oct', north: 310, south: 190, west: 240, east: 170 },
  { month: 'Nov', north: 340, south: 210, west: 260, east: 190 },
  { month: 'Dec', north: 420, south: 280, west: 310, east: 240 },
  { month: 'Jan', north: 380, south: 220, west: 290, east: 200 },
  { month: 'Feb', north: 360, south: 200, west: 270, east: 185 },
  { month: 'Mar', north: 520, south: 310, west: 390, east: 280, anomaly: true },
  { month: 'Apr', north: 450, south: 270, west: 340, east: 240 },
  { month: 'May', north: 490, south: 300, west: 370, east: 260 },
]

const TYPE_COLUMNS = [
  { name: 'order_date', type: 'Date', icon: '📅', color: 'text-blue-400', issues: 0 },
  { name: 'revenue', type: 'Currency', icon: '💰', color: 'text-green-400', issues: 3 },
  { name: 'customer_phone', type: 'Phone', icon: '📞', color: 'text-yellow-400', issues: 7 },
  { name: 'store_lat', type: 'Lat/Lng', icon: '🗺️', color: 'text-purple-400', issues: 0 },
  { name: 'store_lng', type: 'Lat/Lng', icon: '🗺️', color: 'text-purple-400', issues: 0 },
  { name: 'customer_name', type: 'String', icon: '🔤', color: 'text-gray-400', issues: 14 },
  { name: 'shipping_cost', type: 'Currency', icon: '💰', color: 'text-green-400', issues: 2 },
  { name: 'region', type: 'String', icon: '🔤', color: 'text-gray-400', issues: 0 },
]

const CLEAN_ACTIONS = [
  { id: 1, severity: 'critical', title: '14 rows with negative revenue values', desc: 'Revenue cannot be negative — likely data entry errors or refund misclassification.', action: 'Remove rows', applied: false },
  { id: 2, severity: 'critical', title: '3 duplicate order IDs detected', desc: 'Orders 10482, 10937, 11204 appear twice with conflicting timestamps.', action: 'Keep latest', applied: false },
  { id: 3, severity: 'warning', title: '7 phone numbers in invalid format', desc: 'Missing country code or non-numeric characters found.', action: 'Standardize to E.164', applied: false },
  { id: 4, severity: 'warning', title: '2 shipping_cost = $0 on international orders', desc: 'International orders with $0 shipping may indicate missing data.', action: 'Flag for review', applied: false },
  { id: 5, severity: 'warning', title: '38 missing values in customer_name', desc: 'Guest checkouts contributing to nulls in name field.', action: 'Fill → "Guest"', applied: false },
  { id: 6, severity: 'info', title: 'Inconsistent date formats (3 variants)', desc: 'Dates stored as MM/DD/YYYY, YYYY-MM-DD, and Unix timestamps.', action: 'Normalize to ISO 8601', applied: false },
  { id: 7, severity: 'info', title: '5 outlier order values > $10,000', desc: 'Potential bulk/enterprise orders. Verify before excluding.', action: 'Tag as bulk', applied: false },
]

const BAR_DATA = [
  { region: 'North America', value: 820 },
  { region: 'Europe', value: 610 },
  { region: 'Asia Pacific', value: 490 },
  { region: 'Latin America', value: 280 },
  { region: 'Middle East', value: 190 },
  { region: 'Africa', value: 110 },
]

const DONUT_DATA = [
  { label: 'Electronics', value: 34, color: '#8b5cf6' },
  { label: 'Apparel', value: 26, color: '#3b82f6' },
  { label: 'Home & Garden', value: 18, color: '#22c55e' },
  { label: 'Sports', value: 13, color: '#f59e0b' },
  { label: 'Other', value: 9, color: '#6b7280' },
]

const GEO_BUBBLES = [
  { label: 'New York', x: 23, y: 34, r: 22, color: '#8b5cf6' },
  { label: 'London', x: 47, y: 28, r: 18, color: '#3b82f6' },
  { label: 'Tokyo', x: 80, y: 32, r: 16, color: '#22c55e' },
  { label: 'São Paulo', x: 30, y: 62, r: 14, color: '#f59e0b' },
  { label: 'Sydney', x: 82, y: 68, r: 12, color: '#ef4444' },
  { label: 'Dubai', x: 60, y: 38, r: 10, color: '#06b6d4' },
]

const FORECAST_DATA = [
  { month: 'Jan', actual: 380, forecast: null, lo: null, hi: null },
  { month: 'Feb', actual: 360, forecast: null, lo: null, hi: null },
  { month: 'Mar', actual: 520, forecast: null, lo: null, hi: null },
  { month: 'Apr', actual: 450, forecast: null, lo: null, hi: null },
  { month: 'May', actual: 490, forecast: null, lo: null, hi: null },
  { month: 'Jun', actual: null, forecast: 510, lo: 470, hi: 550 },
  { month: 'Jul', actual: null, forecast: 545, lo: 490, hi: 600 },
  { month: 'Aug', actual: null, forecast: 580, lo: 505, hi: 655 },
  { month: 'Sep', actual: null, forecast: 620, lo: 525, hi: 715 },
]

const CORR_MATRIX = [
  { a: 'revenue', b: 'revenue', v: 1.00 },
  { a: 'revenue', b: 'order_val', v: 0.78 },
  { a: 'revenue', b: 'traffic', v: 0.64 },
  { a: 'revenue', b: 'temp', v: -0.61 },
  { a: 'order_val', b: 'revenue', v: 0.78 },
  { a: 'order_val', b: 'order_val', v: 1.00 },
  { a: 'order_val', b: 'traffic', v: 0.42 },
  { a: 'order_val', b: 'temp', v: -0.33 },
  { a: 'traffic', b: 'revenue', v: 0.64 },
  { a: 'traffic', b: 'order_val', v: 0.42 },
  { a: 'traffic', b: 'traffic', v: 1.00 },
  { a: 'traffic', b: 'temp', v: 0.18 },
  { a: 'temp', b: 'revenue', v: -0.61 },
  { a: 'temp', b: 'order_val', v: -0.33 },
  { a: 'temp', b: 'traffic', v: 0.18 },
  { a: 'temp', b: 'temp', v: 1.00 },
]
const CORR_LABELS = ['revenue', 'order_val', 'traffic', 'temp']

const SENTIMENT_ROWS = [
  { id: 1, text: 'Absolutely love the new checkout experience — so smooth!', label: 'Positive', score: 0.94 },
  { id: 2, text: 'Shipping took 3 weeks, completely unacceptable.', label: 'Negative', score: 0.88 },
  { id: 3, text: 'Product quality is decent for the price point.', label: 'Neutral', score: 0.61 },
  { id: 4, text: 'Customer support resolved my issue within minutes!', label: 'Positive', score: 0.97 },
  { id: 5, text: 'Wrong item delivered. Still waiting for replacement.', label: 'Negative', score: 0.91 },
  { id: 6, text: 'Good selection but website is a bit slow sometimes.', label: 'Neutral', score: 0.55 },
  { id: 7, text: 'Five stars — will definitely order again next month.', label: 'Positive', score: 0.96 },
  { id: 8, text: 'Charged twice for the same order, very frustrating.', label: 'Negative', score: 0.95 },
  { id: 9, text: 'Average experience, nothing special to report.', label: 'Neutral', score: 0.52 },
  { id: 10, text: 'The packaging was premium. Great unboxing experience.', label: 'Positive', score: 0.89 },
]

const ANOMALIES = [
  { id: 1, severity: 'critical', field: 'revenue', desc: 'Order #10482 shows revenue of -$4,200', type: 'Impossible value' },
  { id: 2, severity: 'critical', field: 'revenue', desc: 'Order #11099 shows revenue of -$1,870', type: 'Impossible value' },
  { id: 3, severity: 'critical', field: 'shipping_cost', desc: '2 international orders have $0 shipping cost', type: 'Zero on non-zero field' },
  { id: 4, severity: 'high', field: 'order_value', desc: 'Order #10023 — $18,400 (6.8σ above mean)', type: 'Statistical outlier' },
  { id: 5, severity: 'high', field: 'order_value', desc: 'Order #10891 — $14,200 (5.2σ above mean)', type: 'Statistical outlier' },
  { id: 6, severity: 'high', field: 'order_date', desc: '3 orders timestamped in the future (2026)', type: 'Future date' },
  { id: 7, severity: 'medium', field: 'customer_phone', desc: '7 entries with invalid phone format', type: 'Format mismatch' },
  { id: 8, severity: 'medium', field: 'region', desc: 'Region "APAC" used inconsistently (vs "Asia Pacific")', type: 'Inconsistency' },
  { id: 9, severity: 'medium', field: 'store_lat', desc: '1 coordinate pair falls in the ocean (51.5, -0.1 is ocean?)', type: 'Geo anomaly' },
  { id: 10, severity: 'medium', field: 'revenue', desc: 'March spike 44% above rolling avg — no promo recorded', type: 'Unexplained spike' },
  { id: 11, severity: 'low', field: 'customer_name', desc: '38 rows with null customer_name', type: 'Missing data' },
  { id: 12, severity: 'low', field: 'order_value', desc: '14 orders with value < $1 — likely test entries', type: 'Test data suspected' },
  { id: 13, severity: 'low', field: 'order_date', desc: 'Date formats inconsistent across 3 patterns', type: 'Format inconsistency' },
  { id: 14, severity: 'low', field: 'shipping_cost', desc: 'Shipping cost column has 2.3% null rate', type: 'Missing data' },
]

const EXEC_TRENDS = [
  'Revenue grew 14.2% QoQ driven by North American expansion, with March logging a record $520K — 44% above rolling average. Seasonal tailwinds and 2 flash sale events contributed to the spike.',
  'Customer acquisition improved sharply: CAC dropped 18% while LTV rose 11%, indicating marketing efficiency gains. Paid search and social channels both exceeded targets.',
  'Asia Pacific is the fastest-growing region (+31% YoY) with Tokyo and Sydney now ranking among the top 5 revenue cities globally. Localization investments show clear ROI.',
]
const EXEC_RISKS = [
  'Churn rate crept up 0.4% to 3.8% — driven primarily by customers in the $50–$80 order cohort. If unaddressed, projected annual revenue impact is -$340K.',
  'Temperature/revenue correlation of -0.61 signals strong seasonal dependency. Q3 (summer) typically underperforms by 22%; no mitigation strategy is currently active.',
  'Data integrity issues: 14 negative revenue values and 3 duplicate order IDs were detected. Until resolved, reported totals may be overstated by up to $12,000.',
]

// ─── SVG Chart Components ─────────────────────────────────────────────────────

function MultiLineChart({ data, height = 180 }) {
  const w = 520; const h = height
  const pad = { t: 20, r: 20, b: 30, l: 40 }
  const cw = w - pad.l - pad.r
  const ch = h - pad.t - pad.b
  const months = data.map(d => d.month)
  const allVals = data.flatMap(d => [d.north, d.south, d.west, d.east])
  const maxV = Math.max(...allVals)
  const xs = (i) => pad.l + (i / (data.length - 1)) * cw
  const ys = (v) => pad.t + ch - (v / maxV) * ch
  const lines = [
    { key: 'north', color: '#8b5cf6', label: 'North' },
    { key: 'south', color: '#3b82f6', label: 'South' },
    { key: 'west', color: '#22c55e', label: 'West' },
    { key: 'east', color: '#f59e0b', label: 'East' },
  ]
  function path(key) {
    return data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xs(i).toFixed(1)} ${ys(d[key]).toFixed(1)}`).join(' ')
  }
  const anomalyIdx = data.findIndex(d => d.anomaly)
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
      {/* Y grid */}
      {[0, 0.25, 0.5, 0.75, 1].map(t => (
        <g key={t}>
          <line x1={pad.l} x2={w - pad.r} y1={pad.t + ch * (1 - t)} y2={pad.t + ch * (1 - t)} stroke="#1f2937" strokeWidth="1" />
          <text x={pad.l - 6} y={pad.t + ch * (1 - t) + 4} textAnchor="end" fontSize="9" fill="#6b7280">{Math.round(maxV * t)}</text>
        </g>
      ))}
      {/* X labels */}
      {months.map((m, i) => (
        <text key={m} x={xs(i)} y={h - 8} textAnchor="middle" fontSize="9" fill="#6b7280">{m}</text>
      ))}
      {/* Lines */}
      {lines.map(l => (
        <path key={l.key} d={path(l.key)} fill="none" stroke={l.color} strokeWidth="2" strokeLinejoin="round" />
      ))}
      {/* Dots */}
      {lines.map(l => data.map((d, i) => (
        <circle key={`${l.key}-${i}`} cx={xs(i)} cy={ys(d[l.key])} r="3" fill={l.color} />
      )))}
      {/* Anomaly pin */}
      {anomalyIdx >= 0 && (
        <g>
          <line x1={xs(anomalyIdx)} x2={xs(anomalyIdx)} y1={pad.t} y2={pad.t + ch} stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4,3" />
          <circle cx={xs(anomalyIdx)} cy={ys(data[anomalyIdx].north)} r="6" fill="#ef4444" opacity="0.2" />
          <circle cx={xs(anomalyIdx)} cy={ys(data[anomalyIdx].north)} r="3.5" fill="#ef4444" />
          <rect x={xs(anomalyIdx) - 28} y={pad.t - 18} width="56" height="14" rx="3" fill="#ef4444" opacity="0.9" />
          <text x={xs(anomalyIdx)} y={pad.t - 7} textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">⚠ ANOMALY</text>
        </g>
      )}
      {/* Legend */}
      {lines.map((l, i) => (
        <g key={l.label} transform={`translate(${pad.l + i * 75}, ${h - 2})`}>
          <line x1="0" x2="12" y1="0" y2="0" stroke={l.color} strokeWidth="2" />
          <text x="16" y="4" fontSize="8" fill="#9ca3af">{l.label}</text>
        </g>
      ))}
    </svg>
  )
}

function HBarChart({ data, height = 200 }) {
  const max = Math.max(...data.map(d => d.value))
  return (
    <div className="space-y-2.5">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400 w-28 truncate shrink-0">{d.region}</span>
          <div className="flex-1 bg-gray-800 rounded-full h-4 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(d.value / max) * 100}%`, background: 'linear-gradient(90deg, #8b5cf6, #6366f1)' }}
            />
          </div>
          <span className="text-[10px] text-gray-300 w-10 text-right shrink-0">{d.value}</span>
        </div>
      ))}
    </div>
  )
}

function DonutChart({ data, size = 140 }) {
  const r = 45; const cx = size / 2; const cy = size / 2
  let cumAngle = -90
  const slices = data.map(d => {
    const angle = (d.value / 100) * 360
    const start = cumAngle
    cumAngle += angle
    return { ...d, startAngle: start, angle }
  })
  function polar(angle, radius = r) {
    const rad = (angle * Math.PI) / 180
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) }
  }
  function arcPath(startAngle, angle) {
    const s = polar(startAngle)
    const e = polar(startAngle + angle)
    const large = angle > 180 ? 1 : 0
    return `M ${cx} ${cy} L ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)} Z`
  }
  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        {slices.map((s, i) => (
          <path key={i} d={arcPath(s.startAngle, s.angle)} fill={s.color} stroke="#111827" strokeWidth="2" />
        ))}
        <circle cx={cx} cy={cy} r={r * 0.52} fill="#111827" />
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="10" fill="#e5e7eb" fontWeight="bold">Top</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="10" fill="#e5e7eb" fontWeight="bold">Cats</text>
      </svg>
      <div className="space-y-1.5">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: d.color }} />
            <span className="text-[10px] text-gray-400">{d.label}</span>
            <span className="text-[10px] text-gray-200 ml-auto pl-2 font-mono">{d.value}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function GeoMap({ bubbles }) {
  return (
    <div className="relative w-full h-36 bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      {/* Simple world grid overlay */}
      <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 75" preserveAspectRatio="none">
        {[10, 20, 30, 40, 50, 60, 70, 80, 90].map(x => <line key={x} x1={x} y1="0" x2={x} y2="75" stroke="#4b5563" strokeWidth="0.5" />)}
        {[15, 30, 45, 60].map(y => <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#4b5563" strokeWidth="0.5" />)}
        {/* Rough continent outlines */}
        <path d="M 15 20 Q 25 15 35 20 Q 38 30 30 38 Q 20 36 15 20 Z" fill="#374151" />
        <path d="M 45 22 Q 57 18 62 25 Q 58 35 50 35 Q 44 32 45 22 Z" fill="#374151" />
        <path d="M 68 22 Q 85 20 88 35 Q 85 50 78 55 Q 65 52 63 38 Q 66 28 68 22 Z" fill="#374151" />
        <path d="M 22 45 Q 35 42 38 60 Q 30 68 20 62 Q 16 50 22 45 Z" fill="#374151" />
        <path d="M 78 58 Q 88 60 90 70 Q 80 74 72 70 Q 70 62 78 58 Z" fill="#374151" />
        <path d="M 47 38 Q 58 35 62 48 Q 55 56 46 52 Q 44 44 47 38 Z" fill="#374151" />
      </svg>
      {/* Bubbles */}
      {bubbles.map((b, i) => (
        <div
          key={i}
          className="absolute flex items-center justify-center rounded-full border border-white/20 cursor-pointer hover:scale-110 transition-transform group"
          style={{
            left: `${b.x}%`, top: `${b.y}%`,
            width: b.r * 2, height: b.r * 2,
            background: `${b.color}55`,
            borderColor: b.color,
            transform: 'translate(-50%, -50%)',
          }}
          title={b.label}
        >
          <span className="text-[8px] text-white font-bold opacity-80">{b.r}</span>
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap border border-gray-700 z-10">
            {b.label}
          </div>
        </div>
      ))}
      <div className="absolute bottom-2 right-2 text-[9px] text-gray-600">Revenue by city · bubble = relative size</div>
    </div>
  )
}

function ForecastChart({ data, height = 180 }) {
  const w = 460; const h = height
  const pad = { t: 20, r: 20, b: 30, l: 44 }
  const cw = w - pad.l - pad.r; const ch = h - pad.t - pad.b
  const allVals = data.flatMap(d => [d.actual, d.hi].filter(Boolean))
  const maxV = Math.max(...allVals); const minV = 0
  const range = maxV - minV
  const xs = (i) => pad.l + (i / (data.length - 1)) * cw
  const ys = (v) => pad.t + ch - ((v - minV) / range) * ch
  const splitIdx = data.findIndex(d => d.actual == null)
  const actualPath = data.slice(0, splitIdx).map((d, i) => `${i === 0 ? 'M' : 'L'} ${xs(i).toFixed(1)} ${ys(d.actual).toFixed(1)}`).join(' ')
  const forecastPath = data.slice(splitIdx - 1).map((d, i) => {
    const di = splitIdx - 1 + i
    const v = i === 0 ? d.actual : d.forecast
    return `${i === 0 ? 'M' : 'L'} ${xs(di).toFixed(1)} ${ys(v).toFixed(1)}`
  }).join(' ')
  const bandPath = (() => {
    const upper = data.slice(splitIdx).map((d, i) => `${i === 0 ? 'M' : 'L'} ${xs(splitIdx + i).toFixed(1)} ${ys(d.hi).toFixed(1)}`).join(' ')
    const lower = data.slice(splitIdx).reverse().map((d, i, arr) => {
      const di = splitIdx + arr.length - 1 - i
      return `L ${xs(di).toFixed(1)} ${ys(d.lo).toFixed(1)}`
    }).join(' ')
    return `${upper} ${lower} Z`
  })()
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
      {[0, 0.25, 0.5, 0.75, 1].map(t => {
        const v = minV + range * t
        return (
          <g key={t}>
            <line x1={pad.l} x2={w - pad.r} y1={ys(v)} y2={ys(v)} stroke="#1f2937" strokeWidth="1" />
            <text x={pad.l - 6} y={ys(v) + 4} textAnchor="end" fontSize="9" fill="#6b7280">{Math.round(v)}</text>
          </g>
        )
      })}
      {data.map((d, i) => (
        <text key={i} x={xs(i)} y={h - 8} textAnchor="middle" fontSize="9" fill="#6b7280">{d.month}</text>
      ))}
      {/* Split line */}
      <line x1={xs(splitIdx - 1)} x2={xs(splitIdx - 1)} y1={pad.t} y2={pad.t + ch} stroke="#4b5563" strokeWidth="1" strokeDasharray="4,3" />
      {/* Confidence band */}
      <path d={bandPath} fill="#6366f1" opacity="0.15" />
      {/* Actual line */}
      <path d={actualPath} fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinejoin="round" />
      {/* Forecast line */}
      <path d={forecastPath} fill="none" stroke="#6366f1" strokeWidth="2" strokeDasharray="6,4" strokeLinejoin="round" />
      {/* Legend */}
      <rect x={pad.l} y={pad.t - 12} width="8" height="3" rx="1" fill="#8b5cf6" />
      <text x={pad.l + 12} y={pad.t - 6} fontSize="8" fill="#9ca3af">Actual</text>
      <rect x={pad.l + 55} y={pad.t - 12} width="8" height="3" rx="1" fill="#6366f1" opacity="0.6" />
      <text x={pad.l + 67} y={pad.t - 6} fontSize="8" fill="#9ca3af">ARIMA Forecast</text>
      <rect x={pad.l + 160} y={pad.t - 13} width="8" height="5" rx="1" fill="#6366f1" opacity="0.2" />
      <text x={pad.l + 172} y={pad.t - 6} fontSize="8" fill="#9ca3af">95% CI</text>
      <text x={xs(splitIdx - 1)} y={pad.t - 6} textAnchor="middle" fontSize="8" fill="#6b7280">Now →</text>
    </svg>
  )
}

function CorrelationMatrix({ labels, data }) {
  const n = labels.length
  const cellSize = 52
  const labelW = 58
  const totalW = labelW + n * cellSize
  const totalH = labelW + n * cellSize
  function getVal(a, b) {
    const entry = data.find(d => d.a === a && d.b === b)
    return entry ? entry.v : 0
  }
  function colorFor(v) {
    if (v >= 0.7) return '#7c3aed'
    if (v >= 0.4) return '#6366f1'
    if (v >= 0.1) return '#3b82f6'
    if (v >= -0.1) return '#374151'
    if (v >= -0.4) return '#0891b2'
    if (v >= -0.7) return '#0e7490'
    return '#164e63'
  }
  return (
    <svg viewBox={`0 0 ${totalW} ${totalH}`} className="w-full max-w-xs" style={{ height: totalH }}>
      {labels.map((la, ai) => (
        <text key={la} x={labelW + ai * cellSize + cellSize / 2} y={labelW - 4} textAnchor="middle" fontSize="9" fill="#9ca3af">{la}</text>
      ))}
      {labels.map((la, ai) => (
        <text key={la} x={labelW - 4} y={labelW + ai * cellSize + cellSize / 2 + 4} textAnchor="end" fontSize="9" fill="#9ca3af">{la}</text>
      ))}
      {labels.map((la, ai) =>
        labels.map((lb, bi) => {
          const v = getVal(la, lb)
          return (
            <g key={`${ai}-${bi}`}>
              <rect
                x={labelW + bi * cellSize + 2} y={labelW + ai * cellSize + 2}
                width={cellSize - 4} height={cellSize - 4}
                rx="4" fill={colorFor(v)}
              />
              <text
                x={labelW + bi * cellSize + cellSize / 2}
                y={labelW + ai * cellSize + cellSize / 2 + 4}
                textAnchor="middle" fontSize="10" fill="white" fontWeight="bold"
              >
                {v.toFixed(2)}
              </text>
            </g>
          )
        })
      )}
    </svg>
  )
}

// ─── Sub-views ────────────────────────────────────────────────────────────────

function OverviewView({ nlqInput, setNlqInput, onNlqSubmit }) {
  return (
    <div className="space-y-4 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 260px)' }}>
      {/* NLQ bar */}
      <form onSubmit={onNlqSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400" />
          <input
            value={nlqInput}
            onChange={e => setNlqInput(e.target.value)}
            placeholder='Ask anything: "What drove the March spike?" or "Show revenue by region"'
            className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-violet-500/30 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          />
        </div>
        <button type="submit" className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors cursor-pointer flex items-center gap-1.5">
          <Send className="w-3.5 h-3.5" /> Ask
        </button>
      </form>

      {/* Metric cards */}
      <div className="grid grid-cols-4 gap-3">
        {METRIC_CARDS.map((m, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-3.5">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{m.label}</p>
            <p className="text-xl font-bold text-white">{m.value}</p>
            <div className="flex items-center gap-1 mt-1">
              {m.up ? <ArrowUpRight className="w-3 h-3 text-green-400" /> : <ArrowDownRight className="w-3 h-3 text-red-400" />}
              <span className={`text-[11px] font-semibold ${m.up ? 'text-green-400' : 'text-red-400'}`}>{m.delta}</span>
              <span className="text-[10px] text-gray-600">{m.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Line chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-200">Revenue by Region — Last 8 Months</p>
          <span className="text-[10px] text-red-400 flex items-center gap-1"><Bell className="w-3 h-3" /> Anomaly detected in Mar</span>
        </div>
        <MultiLineChart data={LINE_DATA} />
      </div>

      {/* Type detection table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-sm font-semibold text-gray-200 mb-3">Smart Column Type Detection</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-2 px-3 text-gray-500">Column</th>
                <th className="text-left py-2 px-3 text-gray-500">Detected Type</th>
                <th className="text-center py-2 px-3 text-gray-500">Issues</th>
                <th className="text-left py-2 px-3 text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {TYPE_COLUMNS.map((col, i) => (
                <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="py-2 px-3 font-mono text-gray-300">{col.name}</td>
                  <td className="py-2 px-3">
                    <span className={`flex items-center gap-1.5 ${col.color}`}>
                      <span>{col.icon}</span> {col.type}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center">
                    {col.issues > 0
                      ? <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full text-[10px]">{col.issues}</span>
                      : <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mx-auto" />
                    }
                  </td>
                  <td className="py-2 px-3">
                    {col.issues > 0
                      ? <span className="text-red-400 text-[10px]">Needs review</span>
                      : <span className="text-green-400 text-[10px]">Clean</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function AutoCleanView() {
  const [actions, setActions] = useState(CLEAN_ACTIONS)
  function applyOne(id) { setActions(prev => prev.map(a => a.id === id ? { ...a, applied: true } : a)) }
  function applyAll() { setActions(prev => prev.map(a => ({ ...a, applied: true }))) }
  const sevColor = { critical: 'text-red-400 bg-red-500/10 border-red-500/30', warning: 'text-amber-400 bg-amber-500/10 border-amber-500/30', info: 'text-blue-400 bg-blue-500/10 border-blue-500/30' }
  const sevIcon = { critical: <XCircle className="w-3.5 h-3.5" />, warning: <AlertTriangle className="w-3.5 h-3.5" />, info: <Info className="w-3.5 h-3.5" /> }
  const pending = actions.filter(a => !a.applied).length
  return (
    <div className="space-y-3 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 260px)' }}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">{pending} issue{pending !== 1 ? 's' : ''} pending resolution</p>
        <button onClick={applyAll} className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium rounded-lg cursor-pointer transition-colors">
          <Wand2 className="w-3.5 h-3.5" /> Apply All Fixes
        </button>
      </div>
      {actions.map(a => (
        <div key={a.id} className={`border rounded-xl p-4 transition-all ${a.applied ? 'opacity-40 bg-gray-900' : 'bg-gray-900 border-gray-800'}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${sevColor[a.severity]} shrink-0 mt-0.5`}>
                {sevIcon[a.severity]} {a.severity}
              </span>
              <div>
                <p className="text-sm text-gray-200 font-medium">{a.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{a.desc}</p>
              </div>
            </div>
            {a.applied
              ? <span className="flex items-center gap-1 text-green-400 text-xs shrink-0"><CheckCircle2 className="w-3.5 h-3.5" /> Applied</span>
              : <button onClick={() => applyOne(a.id)} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg cursor-pointer transition-colors shrink-0 border border-gray-700 whitespace-nowrap">
                  {a.action}
                </button>
            }
          </div>
        </div>
      ))}
    </div>
  )
}

function VisualizeView() {
  return (
    <div className="space-y-4 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 260px)' }}>
      <div className="grid grid-cols-2 gap-4">
        {/* Bar chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-violet-400" /> Orders by Region
          </p>
          <HBarChart data={BAR_DATA} />
        </div>
        {/* Donut */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-400" /> Revenue by Category
          </p>
          <DonutChart data={DONUT_DATA} />
        </div>
      </div>
      {/* Geo map */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-200 flex items-center gap-2">
            <Globe className="w-4 h-4 text-green-400" /> Geographic Revenue Bubbles
            <span className="text-[10px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">Auto-detected Lat/Lng</span>
          </p>
        </div>
        <GeoMap bubbles={GEO_BUBBLES} />
      </div>
    </div>
  )
}

function PredictView() {
  return (
    <div className="space-y-4 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 260px)' }}>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-200 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" /> ARIMA Revenue Forecast — Next 4 Months
          </p>
          <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">95% Confidence Interval</span>
        </div>
        <ForecastChart data={FORECAST_DATA} />
        <div className="mt-3 grid grid-cols-3 gap-3">
          <div className="bg-gray-800/60 rounded-lg p-3 text-center">
            <p className="text-[10px] text-gray-500 mb-1">Jun Forecast</p>
            <p className="text-lg font-bold text-white">$510K</p>
            <p className="text-[10px] text-gray-600">±$40K CI</p>
          </div>
          <div className="bg-gray-800/60 rounded-lg p-3 text-center">
            <p className="text-[10px] text-gray-500 mb-1">Aug Forecast</p>
            <p className="text-lg font-bold text-white">$580K</p>
            <p className="text-[10px] text-gray-600">±$75K CI</p>
          </div>
          <div className="bg-gray-800/60 rounded-lg p-3 text-center">
            <p className="text-[10px] text-gray-500 mb-1">Trend</p>
            <p className="text-lg font-bold text-green-400">+5.8%</p>
            <p className="text-[10px] text-gray-600">per month avg</p>
          </div>
        </div>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-sm font-semibold text-gray-200 mb-1 flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" /> Correlation Matrix
        </p>
        <p className="text-[11px] text-red-400 mb-3 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> Key insight: temperature/revenue = -0.61 — strong inverse correlation detected
        </p>
        <div className="flex gap-6 items-start">
          <CorrelationMatrix labels={CORR_LABELS} data={CORR_MATRIX} />
          <div className="space-y-2 text-xs text-gray-400 flex-1">
            <p className="font-semibold text-gray-300 text-sm">Auto-detected correlations:</p>
            <div className="space-y-2">
              {[
                { pair: 'revenue ↔ order_val', v: '+0.78', color: 'text-violet-400', insight: 'Strong positive — higher orders drive revenue' },
                { pair: 'revenue ↔ traffic', v: '+0.64', color: 'text-blue-400', insight: 'Moderate — traffic converts well' },
                { pair: 'revenue ↔ temperature', v: '-0.61', color: 'text-red-400', insight: 'Inverse — hot weather suppresses spending' },
                { pair: 'order_val ↔ traffic', v: '+0.42', color: 'text-cyan-400', insight: 'Weak positive — quality traffic matters' },
              ].map((c, i) => (
                <div key={i} className="bg-gray-800/40 rounded-lg p-2.5">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono text-gray-300">{c.pair}</span>
                    <span className={`font-bold ${c.color}`}>{c.v}</span>
                  </div>
                  <p className="text-[10px] text-gray-500">{c.insight}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SentimentView() {
  const pos = SENTIMENT_ROWS.filter(r => r.label === 'Positive').length
  const neg = SENTIMENT_ROWS.filter(r => r.label === 'Negative').length
  const neu = SENTIMENT_ROWS.filter(r => r.label === 'Neutral').length
  const labelStyle = {
    Positive: 'bg-green-500/15 text-green-400 border-green-500/30',
    Negative: 'bg-red-500/15 text-red-400 border-red-500/30',
    Neutral: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  }
  const labelIcon = { Positive: <Smile className="w-3 h-3" />, Negative: <Frown className="w-3 h-3" />, Neutral: <Meh className="w-3 h-3" /> }
  return (
    <div className="space-y-4 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 260px)' }}>
      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Reviews', value: '4,210', color: 'text-white' },
          { label: 'Positive', value: `${Math.round((pos / SENTIMENT_ROWS.length) * 100)}%`, color: 'text-green-400' },
          { label: 'Neutral', value: `${Math.round((neu / SENTIMENT_ROWS.length) * 100)}%`, color: 'text-gray-400' },
          { label: 'Negative Trend', value: '+4% MoM', color: 'text-red-400' },
        ].map((m, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
            <p className="text-[10px] text-gray-500 mb-1">{m.label}</p>
            <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>
      {/* Bar breakdown */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-xs text-gray-500 mb-3">Sentiment breakdown (sample of 10 shown, 4,210 total scored)</p>
        <div className="flex gap-1 h-4 rounded-full overflow-hidden mb-2">
          <div className="bg-green-500" style={{ width: `${(pos / SENTIMENT_ROWS.length) * 100}%` }} />
          <div className="bg-gray-500" style={{ width: `${(neu / SENTIMENT_ROWS.length) * 100}%` }} />
          <div className="bg-red-500" style={{ width: `${(neg / SENTIMENT_ROWS.length) * 100}%` }} />
        </div>
        <div className="flex gap-4 text-[10px] text-gray-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Positive {pos * 421}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-500 inline-block" /> Neutral {neu * 421}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Negative {neg * 421}</span>
        </div>
      </div>
      {/* Row table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-gray-800/60">
            <tr>
              <th className="text-left py-2 px-4 text-gray-500">#</th>
              <th className="text-left py-2 px-4 text-gray-500">Review Text</th>
              <th className="text-left py-2 px-4 text-gray-500">Sentiment</th>
              <th className="text-left py-2 px-4 text-gray-500">Score</th>
            </tr>
          </thead>
          <tbody>
            {SENTIMENT_ROWS.map(r => (
              <tr key={r.id} className="border-t border-gray-800/50 hover:bg-gray-800/20">
                <td className="py-2.5 px-4 text-gray-600">{r.id}</td>
                <td className="py-2.5 px-4 text-gray-300 max-w-xs">{r.text}</td>
                <td className="py-2.5 px-4">
                  <span className={`flex items-center gap-1 w-fit px-2 py-0.5 rounded-full border text-[10px] font-semibold ${labelStyle[r.label]}`}>
                    {labelIcon[r.label]} {r.label}
                  </span>
                </td>
                <td className="py-2.5 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-800 rounded-full h-1.5">
                      <div className="h-full rounded-full bg-violet-500" style={{ width: `${r.score * 100}%` }} />
                    </div>
                    <span className="text-gray-400 font-mono">{r.score.toFixed(2)}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ExecSummaryView() {
  return (
    <div className="space-y-4 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 260px)' }}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">Auto-generated narrative · Last updated just now</p>
        <div className="flex gap-2">
          {[
            { label: 'Export PDF', icon: Download },
            { label: 'Slack', icon: Share2 },
            { label: 'Notion', icon: BookOpen },
          ].map(({ label, icon: Icon }) => (
            <button key={label} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg cursor-pointer transition-colors border border-gray-700">
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ArrowUpRight className="w-5 h-5 text-green-400" />
            <h3 className="text-base font-bold text-white">Top 3 Trends</h3>
          </div>
          <div className="space-y-3">
            {EXEC_TRENDS.map((t, i) => (
              <div key={i} className="flex gap-3 bg-green-500/5 border border-green-500/15 rounded-xl p-4">
                <span className="text-green-400 font-bold text-sm shrink-0 mt-0.5">#{i + 1}</span>
                <p className="text-sm text-gray-300 leading-relaxed">{t}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-gray-800" />
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h3 className="text-base font-bold text-white">Top 3 Risks</h3>
          </div>
          <div className="space-y-3">
            {EXEC_RISKS.map((r, i) => (
              <div key={i} className="flex gap-3 bg-red-500/5 border border-red-500/15 rounded-xl p-4">
                <span className="text-red-400 font-bold text-sm shrink-0 mt-0.5">⚠{i + 1}</span>
                <p className="text-sm text-gray-300 leading-relaxed">{r}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Right panel tabs ─────────────────────────────────────────────────────────

function InsightsTab() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hello! I have analyzed your 6 connected data sources. Ask me anything — "What caused the March spike?", "Which region has the highest churn?" or "Forecast Q3 revenue".' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef(null)

  async function handleSend(e) {
    e.preventDefault()
    if (!input.trim() || loading) return
    const userMsg = { role: 'user', text: input.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    try {
      const reply = await callGemini(
        `You are an AI data analyst assistant. The user has connected 6 data sources to an analytics platform:
- sales_Q1_2025.xlsx (12,480 rows, quarterly sales data)
- customers_api.json (3,210 customer records)
- PostgreSQL orders_db (88,500 order records)
- Shopify main store (5,100 product/sales entries)
- annual_report_2024.pdf (340 extracted table rows)
- BigQuery events.parquet (201,000 event rows)

Key stats: Total revenue $2.47M (+14.2% QoQ), 18,294 orders, avg order $134.90, churn 3.8%.
March had a 44% revenue spike with no promo. Temperature/revenue correlation is -0.61.
North America dominates, Asia Pacific growing fastest at +31% YoY.

User question: ${userMsg.text}

Answer concisely with data-backed insights. Reference specific numbers from the dataset context above.`,
        { maxTokens: 500 }
      )
      setMessages(prev => [...prev, { role: 'assistant', text: reply }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: `Error: ${err.message}` }])
    }
    setLoading(false)
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`text-xs leading-relaxed rounded-xl p-3 ${m.role === 'user' ? 'bg-violet-600/20 text-violet-100 ml-2' : 'bg-gray-800/80 text-gray-300 mr-2'}`}>
            {m.text}
          </div>
        ))}
        {loading && <div className="bg-gray-800/80 rounded-xl p-3 mr-2"><Loader2 className="w-4 h-4 animate-spin text-violet-400" /></div>}
        <div ref={endRef} />
      </div>
      <form onSubmit={handleSend} className="p-2 border-t border-gray-800 flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about your data…"
          className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
        />
        <button type="submit" disabled={loading || !input.trim()} className="p-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg cursor-pointer disabled:opacity-40 transition-colors">
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  )
}

function WhatIfTab() {
  const BASE_PROFIT = 284000
  const [shipping, setShipping] = useState(12)
  const [aov, setAov] = useState(135)
  const [churn, setChurn] = useState(3.8)

  const projected = Math.round(
    BASE_PROFIT
    + (18294 * (aov - 135))          // AOV delta
    - (18294 * (shipping - 12) * 0.8) // shipping cost delta
    - (BASE_PROFIT * ((churn - 3.8) / 100) * 8) // churn impact
  )
  const delta = projected - BASE_PROFIT
  const pct = ((delta / BASE_PROFIT) * 100).toFixed(1)

  return (
    <div className="p-4 space-y-5">
      <div className="bg-gray-800/60 rounded-xl p-4 text-center">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Projected Net Profit</p>
        <p className={`text-3xl font-bold ${delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          ${projected.toLocaleString()}
        </p>
        <div className="flex items-center justify-center gap-1 mt-1">
          {delta >= 0 ? <ArrowUpRight className="w-3.5 h-3.5 text-green-400" /> : <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />}
          <span className={`text-sm font-semibold ${delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {delta >= 0 ? '+' : ''}${delta.toLocaleString()} ({pct}%)
          </span>
        </div>
        <p className="text-[10px] text-gray-600 mt-1">vs. baseline $284,000</p>
      </div>

      {[
        { label: 'Avg Shipping Cost', value: shipping, set: setShipping, min: 4, max: 28, unit: '$', step: 0.5, hint: 'per order' },
        { label: 'Avg Order Value', value: aov, set: setAov, min: 80, max: 250, unit: '$', step: 1, hint: 'per order' },
        { label: 'Churn Rate', value: churn, set: setChurn, min: 1, max: 12, unit: '%', step: 0.1, hint: 'monthly' },
      ].map(s => (
        <div key={s.label}>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-gray-400">{s.label}</label>
            <span className="text-sm font-bold text-white font-mono">{s.unit}{s.value.toFixed(s.step < 1 ? 1 : 0)} <span className="text-gray-600 text-[10px] font-normal">{s.hint}</span></span>
          </div>
          <input
            type="range" min={s.min} max={s.max} step={s.step} value={s.value}
            onChange={e => s.set(Number(e.target.value))}
            className="w-full accent-violet-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-gray-700 mt-0.5">
            <span>{s.unit}{s.min}</span><span>{s.unit}{s.max}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function AnomaliesTab() {
  const sevColor = {
    critical: 'text-red-400 bg-red-500/10 border-red-500/30',
    high: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    medium: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    low: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  }
  return (
    <div className="p-3 space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
      <p className="text-[10px] text-gray-600 mb-2">{ANOMALIES.length} outliers detected · ranked by severity</p>
      {ANOMALIES.map(a => (
        <div key={a.id} className="bg-gray-800/50 border border-gray-800 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <span className="text-[10px] text-gray-600 font-mono mt-0.5 shrink-0">#{a.id}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-semibold ${sevColor[a.severity]}`}>{a.severity}</span>
                <span className="text-[9px] text-violet-400 font-mono">{a.field}</span>
              </div>
              <p className="text-[11px] text-gray-300 leading-relaxed">{a.desc}</p>
              <p className="text-[9px] text-gray-600 mt-0.5">{a.type}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

const MODES = [
  { id: 'overview', label: 'Overview', icon: Eye },
  { id: 'clean', label: 'Auto-Clean', icon: Wand2 },
  { id: 'visualize', label: 'Visualize', icon: BarChart3 },
  { id: 'predict', label: 'Predict', icon: TrendingUp },
  { id: 'sentiment', label: 'Sentiment', icon: Smile },
  { id: 'exec', label: 'Exec Summary', icon: BookOpen },
]

const RIGHT_TABS = [
  { id: 'insights', label: 'Insights', icon: MessageSquare },
  { id: 'whatif', label: 'What-If', icon: Sliders },
  { id: 'anomalies', label: 'Anomalies', icon: AlertTriangle },
]

export default function DataAnalyzer() {
  const [activeMode, setActiveMode] = useState('overview')
  const [rightTab, setRightTab] = useState('insights')
  const [nlqInput, setNlqInput] = useState('')
  const [showConnector, setShowConnector] = useState(false)
  const [selectedSource, setSelectedSource] = useState(1)

  function handleNlqSubmit(e) {
    e.preventDefault()
    if (!nlqInput.trim()) return
    setRightTab('insights')
    // The InsightsTab manages its own state; we just switch to it
  }

  return (
    <ToolLayout icon={Database} title="Data Analyzer" description="Universal analytics platform — connect any source, discover every insight" color="#8b5cf6">
      <div className="flex gap-3" style={{ height: 'calc(100vh - 165px)' }}>

        {/* ── Left Sidebar: Data Sources ── */}
        <div className="w-56 flex flex-col bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shrink-0">
          <div className="px-3 pt-3 pb-2 border-b border-gray-800">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Connected Sources</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {MOCK_SOURCES.map(src => {
              const Icon = src.icon
              return (
                <button
                  key={src.id}
                  onClick={() => setSelectedSource(src.id)}
                  className={`w-full flex items-start gap-2.5 px-2.5 py-2.5 rounded-xl text-left transition-all cursor-pointer group ${selectedSource === src.id ? 'bg-violet-500/10 border border-violet-500/25' : 'hover:bg-gray-800/70 border border-transparent'}`}
                >
                  <Icon className="w-4 h-4 shrink-0 mt-0.5" style={{ color: src.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-gray-300 truncate leading-tight">{src.label}</p>
                    <p className="text-[9px] text-gray-600 mt-0.5">{src.rows.toLocaleString()} rows · {src.lastSync}</p>
                  </div>
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${src.status === 'live' ? 'bg-green-400' : 'bg-amber-400 animate-pulse'}`} />
                </button>
              )
            })}
          </div>
          <div className="p-2 border-t border-gray-800">
            <div className="relative">
              <button
                onClick={() => setShowConnector(p => !p)}
                className="w-full flex items-center gap-2 px-3 py-2 bg-violet-600/15 hover:bg-violet-600/25 border border-violet-500/30 text-violet-400 text-xs font-medium rounded-xl cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Connect data source
              </button>
              {showConnector && (
                <div className="absolute bottom-10 left-0 right-0 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-20 p-2">
                  <p className="text-[9px] text-gray-500 px-2 pb-1 uppercase tracking-wider">Available connectors</p>
                  {CONNECTORS.map(c => (
                    <button key={c} onClick={() => setShowConnector(false)} className="w-full text-left px-2.5 py-1.5 text-xs text-gray-300 hover:bg-gray-700 rounded-lg cursor-pointer transition-colors">
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Main Content ── */}
        <div className="flex-1 flex flex-col min-w-0 gap-3">
          {/* Mode bar */}
          <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-2xl p-1 shrink-0">
            {MODES.map(m => {
              const Icon = m.icon
              return (
                <button
                  key={m.id}
                  onClick={() => setActiveMode(m.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-[11px] font-medium transition-all cursor-pointer ${activeMode === m.id ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:block">{m.label}</span>
                </button>
              )
            })}
          </div>

          {/* View content */}
          <div className="flex-1 min-h-0">
            {activeMode === 'overview' && <OverviewView nlqInput={nlqInput} setNlqInput={setNlqInput} onNlqSubmit={handleNlqSubmit} />}
            {activeMode === 'clean' && <AutoCleanView />}
            {activeMode === 'visualize' && <VisualizeView />}
            {activeMode === 'predict' && <PredictView />}
            {activeMode === 'sentiment' && <SentimentView />}
            {activeMode === 'exec' && <ExecSummaryView />}
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div className="w-72 flex flex-col bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shrink-0">
          {/* Tab bar */}
          <div className="grid grid-cols-3 border-b border-gray-800 shrink-0">
            {RIGHT_TABS.map(t => {
              const Icon = t.icon
              return (
                <button
                  key={t.id}
                  onClick={() => setRightTab(t.id)}
                  className={`flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-all cursor-pointer border-b-2 ${rightTab === t.id ? 'border-violet-500 text-violet-300 bg-violet-500/5' : 'border-transparent text-gray-600 hover:text-gray-300'}`}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              )
            })}
          </div>
          <div className="flex-1 overflow-hidden">
            {rightTab === 'insights' && <InsightsTab />}
            {rightTab === 'whatif' && <WhatIfTab />}
            {rightTab === 'anomalies' && <AnomaliesTab />}
          </div>
        </div>

      </div>
    </ToolLayout>
  )
}
