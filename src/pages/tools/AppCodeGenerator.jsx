import { useState, useEffect, useRef } from 'react'
import { Terminal, Loader2, Copy, Check, ChevronDown, ChevronUp, FolderTree, FileCode, Download, RefreshCw, Sparkles, Smartphone, Globe, Tablet, CheckSquare, Square, Play, BookOpen, Monitor } from 'lucide-react'
import Prism from 'prismjs'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-tsx'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-dart'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-yaml'
import 'prismjs/components/prism-css'
import 'prismjs/themes/prism-tomorrow.css'
import ToolLayout from '../../components/ToolLayout'
import { callGemini, parseGeminiJSON } from '../../config/gemini'

const platforms = [
  { id: 'react-native', label: 'React Native', icon: Smartphone, lang: 'jsx', color: '#61dafb' },
  { id: 'flutter', label: 'Flutter / Dart', icon: Tablet, lang: 'dart', color: '#02569B' },
  { id: 'nextjs', label: 'Next.js (Web)', icon: Globe, lang: 'jsx', color: '#ffffff' },
  { id: 'react-vite', label: 'React + Vite', icon: Globe, lang: 'jsx', color: '#646cff' },
  { id: 'express-api', label: 'Express API', icon: Terminal, lang: 'javascript', color: '#68a063' },
]

const featureGroups = [
  {
    group: 'Auth & Users',
    features: [
      { id: 'auth-email', label: 'Email / Password Auth' },
      { id: 'auth-google', label: 'Google OAuth' },
      { id: 'auth-phone', label: 'Phone OTP Auth' },
      { id: 'user-profile', label: 'User Profile Page' },
      { id: 'role-based', label: 'Role-Based Access' },
    ],
  },
  {
    group: 'Data & Backend',
    features: [
      { id: 'firebase', label: 'Firebase Integration' },
      { id: 'supabase', label: 'Supabase Integration' },
      { id: 'rest-api', label: 'REST API Layer' },
      { id: 'graphql', label: 'GraphQL Client' },
      { id: 'local-storage', label: 'Local Storage / Cache' },
    ],
  },
  {
    group: 'UI & Navigation',
    features: [
      { id: 'bottom-tabs', label: 'Bottom Tab Navigation' },
      { id: 'drawer-nav', label: 'Drawer / Sidebar Nav' },
      { id: 'dark-mode', label: 'Dark Mode Toggle' },
      { id: 'onboarding', label: 'Onboarding Screens' },
      { id: 'responsive', label: 'Responsive Layout' },
    ],
  },
  {
    group: 'Features',
    features: [
      { id: 'push-notif', label: 'Push Notifications' },
      { id: 'camera', label: 'Camera / Image Picker' },
      { id: 'maps', label: 'Maps Integration' },
      { id: 'payments', label: 'Payments (Stripe)' },
      { id: 'search', label: 'Search with Filters' },
      { id: 'chat', label: 'Real-time Chat' },
      { id: 'file-upload', label: 'File Upload' },
      { id: 'analytics', label: 'Analytics Tracking' },
    ],
  },
]

const stateManagement = {
  'react-native': ['React Context', 'Redux Toolkit', 'Zustand', 'Jotai'],
  flutter: ['Provider', 'Riverpod', 'BLoC', 'GetX'],
  nextjs: ['React Context', 'Zustand', 'Redux Toolkit', 'Jotai'],
  'react-vite': ['React Context', 'Zustand', 'Redux Toolkit', 'Jotai'],
  'express-api': ['N/A (Stateless)'],
}

// Robust JSON parser that handles Gemini's broken escape sequences inside code strings
function safeParseJSON(raw) {
  // 1. Strip markdown fences
  let text = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()

  // 2. Try direct parse first
  try { return JSON.parse(text) } catch { /* continue */ }

  // 3. Extract code fields, replace with placeholders, parse, then restore
  const codeParts = []
  // Match "code": "..." or "code": '...' — greedily capture between boundaries
  const codeRegex = /"code"\s*:\s*"/g
  let match
  let result = text
  const replacements = []

  // Find each "code": " and extract until the closing " that's followed by , or } (next key or end)
  while ((match = codeRegex.exec(text)) !== null) {
    const startOfValue = match.index + match[0].length
    let depth = 0
    let i = startOfValue
    let escaped = false
    // Walk through the string to find the true end
    while (i < text.length) {
      const ch = text[i]
      if (escaped) { escaped = false; i++; continue }
      if (ch === '\\') { escaped = true; i++; continue }
      if (ch === '"') { break }
      i++
    }
    const codeContent = text.slice(startOfValue, i)
    const placeholder = `__CODE_PLACEHOLDER_${codeParts.length}__`
    codeParts.push(codeContent)
    replacements.push({ from: startOfValue, to: i, placeholder })
  }

  // Apply replacements in reverse order to preserve indices
  let modified = text
  for (let r = replacements.length - 1; r >= 0; r--) {
    const { from, to, placeholder } = replacements[r]
    modified = modified.slice(0, from) + placeholder + modified.slice(to)
  }

  // Try parsing with placeholders
  try {
    const parsed = JSON.parse(modified)
    // Restore code fields
    const json = JSON.stringify(parsed)
    let restored = json
    codeParts.forEach((code, idx) => {
      // The placeholder is inside a JSON string already, so it's safe
      restored = restored.replace(`__CODE_PLACEHOLDER_${idx}__`, code)
    })
    return JSON.parse(restored)
  } catch { /* continue */ }

  // 4. Last resort: ask Gemini returned text, extract what we can between first { and last }
  const firstBrace = text.indexOf('{')
  const lastBrace = text.lastIndexOf('}')
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    text = text.slice(firstBrace, lastBrace + 1)
  }

  // 5. Fix common JSON issues from LLM output
  // Fix unescaped newlines inside strings
  text = text.replace(/(?<=:\s*")([\s\S]*?)(?="(?:\s*[,}\]]))/g, (match) => {
    return match
      .replace(/\\/g, '\\\\')    // escape backslashes first
      .replace(/\n/g, '\\n')     // real newlines
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
      .replace(/"/g, '\\"')      // unescaped quotes
  })

  // This aggressive approach might double-escape, so try both
  try { return JSON.parse(text) } catch { /* continue */ }

  // 6. Final: split code out via two-pass approach
  // Ask for files separately
  throw new Error('Failed to parse AI response. Please try regenerating.')
}

function CodeBlock({ code, language, filename }) {
  const [copied, setCopied] = useState(false)
  const codeRef = useRef(null)

  useEffect(() => {
    if (codeRef.current) Prism.highlightElement(codeRef.current)
  }, [code, language])

  function handleCopy() {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const langMap = { jsx: 'jsx', tsx: 'tsx', dart: 'dart', javascript: 'javascript', typescript: 'typescript', bash: 'bash', json: 'json', yaml: 'yaml', css: 'css' }
  const prismLang = langMap[language] || 'javascript'

  return (
    <div className="bg-[#1d1f21] rounded-xl overflow-hidden border border-gray-800">
      <div className="flex items-center justify-between px-4 py-2 bg-[#16181a] border-b border-gray-800">
        <div className="flex items-center gap-2">
          <FileCode className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-xs text-gray-400 font-mono">{filename || `code.${language}`}</span>
        </div>
        <button onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-white rounded cursor-pointer transition-colors">
          {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div className="overflow-x-auto p-4 max-h-[32rem] overflow-y-auto">
        <pre className="!bg-transparent !m-0 !p-0 text-sm leading-relaxed">
          <code ref={codeRef} className={`language-${prismLang}`}>{code}</code>
        </pre>
      </div>
    </div>
  )
}

function FileTreeItem({ item, depth = 0 }) {
  const [open, setOpen] = useState(depth < 2)
  const isDir = item.type === 'dir'
  const indent = depth * 16

  return (
    <div>
      <button
        onClick={() => isDir && setOpen(v => !v)}
        className={`w-full flex items-center gap-1.5 py-1 text-left text-xs ${isDir ? 'cursor-pointer hover:bg-gray-800/50' : ''} rounded`}
        style={{ paddingLeft: `${indent + 8}px` }}
      >
        {isDir ? (
          <>
            <span className="text-yellow-400">{open ? '\u{1F4C2}' : '\u{1F4C1}'}</span>
            <span className="text-gray-300 font-medium">{item.name}/</span>
          </>
        ) : (
          <>
            <span className="text-gray-500">{'\u{1F4C4}'}</span>
            <span className="text-gray-400">{item.name}</span>
            {item.description && <span className="text-gray-600 ml-1 truncate">— {item.description}</span>}
          </>
        )}
      </button>
      {isDir && open && item.children?.map((child, i) => (
        <FileTreeItem key={i} item={child} depth={depth + 1} />
      ))}
    </div>
  )
}

// Mobile device preview mockup
function MobilePreview({ screens, appName, primaryColor }) {
  const [activeScreen, setActiveScreen] = useState(0)
  const screen = screens?.[activeScreen]
  if (!screens?.length) return null

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Phone frame */}
      <div className="relative w-[280px] mx-auto">
        {/* Phone outer shell */}
        <div className="bg-gray-800 rounded-[2.5rem] p-3 shadow-2xl shadow-black/50 border border-gray-700">
          {/* Notch */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-6 bg-gray-900 rounded-b-2xl z-10 flex items-center justify-center">
            <div className="w-12 h-3 bg-gray-800 rounded-full" />
          </div>
          {/* Screen */}
          <div className="bg-gray-950 rounded-[2rem] overflow-hidden" style={{ minHeight: '480px' }}>
            {/* Status bar */}
            <div className="flex items-center justify-between px-6 pt-8 pb-2 bg-gray-900">
              <span className="text-[10px] text-gray-500 font-medium">9:41</span>
              <div className="flex items-center gap-1">
                <div className="w-3.5 h-2 border border-gray-500 rounded-sm relative">
                  <div className="absolute inset-0.5 bg-green-400 rounded-[1px]" style={{ width: '60%' }} />
                </div>
              </div>
            </div>

            {/* App header */}
            <div className="px-5 py-3 border-b border-gray-800" style={{ backgroundColor: `${primaryColor || '#22c55e'}15` }}>
              <h3 className="text-sm font-bold text-white">{screen?.name || appName}</h3>
            </div>

            {/* Screen content mockup */}
            <div className="px-5 py-4 space-y-3">
              {screen?.keyElements?.map((el, i) => {
                // Render different mockup shapes based on element type keywords
                const lower = el.toLowerCase()
                if (lower.includes('button') || lower.includes('cta') || lower.includes('submit')) {
                  return (
                    <div key={i} className="rounded-xl py-3 px-4 text-center" style={{ backgroundColor: primaryColor || '#22c55e' }}>
                      <span className="text-xs font-semibold text-white">{el}</span>
                    </div>
                  )
                }
                if (lower.includes('input') || lower.includes('field') || lower.includes('search') || lower.includes('text')) {
                  return (
                    <div key={i} className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3">
                      <span className="text-[11px] text-gray-500">{el}</span>
                    </div>
                  )
                }
                if (lower.includes('image') || lower.includes('photo') || lower.includes('avatar') || lower.includes('banner') || lower.includes('hero')) {
                  return (
                    <div key={i} className="bg-gray-800 rounded-xl h-20 flex items-center justify-center border border-gray-700">
                      <span className="text-[10px] text-gray-500">{el}</span>
                    </div>
                  )
                }
                if (lower.includes('list') || lower.includes('card') || lower.includes('item')) {
                  return (
                    <div key={i} className="space-y-2">
                      {[0, 1, 2].map(j => (
                        <div key={j} className="bg-gray-800/60 border border-gray-700/50 rounded-lg px-3 py-2.5 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-gray-700 flex-shrink-0" />
                          <div className="flex-1 space-y-1">
                            <div className="h-2 bg-gray-700 rounded w-3/4" />
                            <div className="h-1.5 bg-gray-700/50 rounded w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                }
                if (lower.includes('nav') || lower.includes('tab') || lower.includes('menu')) {
                  return (
                    <div key={i} className="flex gap-2 justify-center">
                      {['', '', '', ''].map((_, j) => (
                        <div key={j} className={`flex-1 rounded-lg py-2 text-center ${j === 0 ? 'bg-gray-700' : 'bg-gray-800/50'}`}>
                          <div className="w-4 h-4 bg-gray-600 rounded mx-auto mb-1" />
                          <div className="h-1 bg-gray-600 rounded w-6 mx-auto" />
                        </div>
                      ))}
                    </div>
                  )
                }
                // Default: generic block
                return (
                  <div key={i} className="bg-gray-800/40 border border-gray-700/40 rounded-lg px-3 py-2.5">
                    <span className="text-[11px] text-gray-500">{el}</span>
                  </div>
                )
              })}
              {(!screen?.keyElements || screen.keyElements.length === 0) && (
                <div className="space-y-3 pt-2">
                  <div className="h-10 bg-gray-800 rounded-xl" />
                  <div className="h-24 bg-gray-800 rounded-xl" />
                  <div className="h-10 bg-gray-800 rounded-xl" />
                  <div className="h-10 rounded-xl" style={{ backgroundColor: primaryColor || '#22c55e', opacity: 0.3 }} />
                </div>
              )}
            </div>

            {/* Bottom nav mockup */}
            <div className="absolute bottom-3 left-3 right-3">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl px-4 py-2.5 flex items-center justify-around">
                {(screens.length > 4 ? screens.slice(0, 4) : screens).map((s, i) => (
                  <button key={i} onClick={() => setActiveScreen(i)}
                    className={`flex flex-col items-center gap-0.5 cursor-pointer ${activeScreen === i ? 'opacity-100' : 'opacity-40'}`}>
                    <div className="w-5 h-5 rounded-md" style={{ backgroundColor: activeScreen === i ? (primaryColor || '#22c55e') : '#4b5563' }} />
                    <span className="text-[8px] text-gray-400 truncate max-w-[50px]">{s.name?.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Home indicator */}
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-24 h-1 bg-gray-600 rounded-full" />
      </div>

      {/* Screen selector */}
      <div className="flex flex-wrap justify-center gap-1.5 max-w-[300px]">
        {screens.map((s, i) => (
          <button key={i} onClick={() => setActiveScreen(i)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-medium cursor-pointer transition-colors ${
              activeScreen === i ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-500 hover:text-gray-300'
            }`}>{s.name}</button>
        ))}
      </div>

      {/* Screen description */}
      {screen && (
        <div className="w-full max-w-[300px] bg-gray-800/50 rounded-xl p-3 text-center">
          <p className="text-[11px] text-gray-400 leading-relaxed">{screen.description}</p>
        </div>
      )}
    </div>
  )
}

export default function AppCodeGenerator() {
  const [appDescription, setAppDescription] = useState('')
  const [platform, setPlatform] = useState('react-vite')
  const [selectedFeatures, setSelectedFeatures] = useState(['auth-email', 'dark-mode', 'responsive'])
  const [stateLib, setStateLib] = useState('Zustand')
  const [appName, setAppName] = useState('')

  const [loading, setLoading] = useState(false)
  const [phase, setPhase] = useState('')
  const [result, setResult] = useState(null)
  const [activeFile, setActiveFile] = useState(0)
  const [showTree, setShowTree] = useState(true)
  const [showSetup, setShowSetup] = useState(false)
  const [viewMode, setViewMode] = useState('code') // 'code' or 'preview'

  const currentPlatform = platforms.find(p => p.id === platform)
  const stateOptions = stateManagement[platform] || []

  function toggleFeature(id) {
    setSelectedFeatures(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    )
  }

  const allFeatures = featureGroups.flatMap(g => g.features)

  async function handleGenerate(e) {
    e.preventDefault()
    if (!appDescription.trim() || loading) return
    setLoading(true)
    setResult(null)
    setActiveFile(0)

    const featureLabels = selectedFeatures.map(id => allFeatures.find(f => f.id === id)?.label).filter(Boolean)
    const name = appName.trim() || 'my-app'

    try {
      setPhase('Generating architecture & code...')
      const reply = await callGemini(
        `You are a senior full-stack developer. Generate production-ready boilerplate code for this app:

APP NAME: ${name}
DESCRIPTION: ${appDescription}
PLATFORM: ${currentPlatform?.label} (${platform})
STATE MANAGEMENT: ${stateLib}
SELECTED FEATURES: ${featureLabels.join(', ') || 'None specified'}

IMPORTANT: Return ONLY a valid JSON object. Do NOT use markdown or code fences.
IMPORTANT: For the "code" field in each file, use ONLY single-line strings with \\n for newlines. Do NOT put real newlines inside JSON string values. Escape all special characters properly: use \\\\ for backslash, \\n for newline, \\" for quotes, \\t for tabs.

Return this exact JSON structure:
{
  "appName": "${name}",
  "summary": "2-3 sentence summary of the generated project",
  "primaryColor": "#22c55e",
  "techStack": ["tech1", "tech2", "tech3"],
  "fileTree": [
    {
      "type": "dir",
      "name": "src",
      "children": [
        { "type": "dir", "name": "components", "children": [
          { "type": "file", "name": "Button.jsx", "description": "Reusable button" }
        ]},
        { "type": "file", "name": "App.jsx", "description": "Root component" }
      ]
    },
    { "type": "file", "name": "package.json", "description": "Dependencies" }
  ],
  "files": [
    {
      "filename": "src/App.${platform === 'flutter' ? 'dart' : 'jsx'}",
      "language": "${currentPlatform?.lang || 'jsx'}",
      "description": "Root application component",
      "code": "// Complete code here using \\n for newlines"
    }
  ],
  "screens": [
    {
      "name": "Home",
      "description": "Main dashboard with user stats and quick actions",
      "keyElements": ["Hero Banner", "Stats Cards", "Action Buttons", "Recent List", "Bottom Navigation"],
      "interactions": "Tap cards to navigate, pull to refresh"
    }
  ],
  "setupInstructions": {
    "steps": ["step 1", "step 2"],
    "envVars": [{ "key": "VAR", "description": "desc", "example": "value" }],
    "dependencies": ["pkg1", "pkg2"]
  },
  "commands": {
    "install": "npm install",
    "dev": "npm run dev",
    "build": "npm run build",
    "test": "npm test"
  }
}

CRITICAL RULES:
- Generate 6-10 complete, working code files
- Every file must have FULL code, not placeholders
- Code strings must use \\n for line breaks — never put actual newlines inside a JSON string value
- Include 4-8 screens with detailed keyElements arrays for mobile preview rendering
- keyElements should use descriptive names like: "Search Input", "User Avatar", "Product Card List", "Submit Button", "Hero Image", "Tab Navigation", "Settings List"
- Include a proper package.json / pubspec.yaml
- Use ${stateLib} for state management
- Include all features: ${featureLabels.join(', ')}`,
        {
          systemInstruction: `You are a 10x developer. Return ONLY valid JSON. All string values must be single-line with \\n for newlines. Never use real line breaks inside JSON strings. Escape all backslashes, quotes, and special characters properly.`,
          temperature: 0.6,
          maxTokens: 8192,
        }
      )

      let parsed
      try { parsed = safeParseJSON(reply) } catch { parsed = parseGeminiJSON(reply) }

      // Post-process: unescape \\n in code strings to real newlines for display
      if (parsed.files) {
        parsed.files = parsed.files.map(f => ({
          ...f,
          code: typeof f.code === 'string' ? f.code.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\"/g, '"') : f.code,
        }))
      }

      setResult(parsed)
    } catch (err) {
      setResult({ error: err.message })
    }
    setLoading(false)
    setPhase('')
  }

  function handleDownloadAll() {
    if (!result?.files) return
    const content = result.files.map(f =>
      `${'='.repeat(60)}\n// FILE: ${f.filename}\n// ${f.description}\n${'='.repeat(60)}\n\n${f.code}\n\n`
    ).join('')
    const blob = new Blob([content], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${result.appName || 'app'}-code.txt`
    a.click()
  }

  function handleDownloadFile(file) {
    const blob = new Blob([file.code], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = file.filename.split('/').pop()
    a.click()
  }

  return (
    <ToolLayout icon={Terminal} title="App Code Generator" description="Generate production-ready app boilerplate with AI" color="#22c55e">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Form */}
        <div className="space-y-4">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">App Name</label>
                <input
                  value={appName}
                  onChange={e => setAppName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-green-500 font-mono"
                  placeholder="my-awesome-app"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">App Description *</label>
                <textarea
                  value={appDescription}
                  onChange={e => setAppDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  placeholder="A task management app with team collaboration, real-time updates, and kanban boards..."
                />
              </div>
            </div>

            {/* Platform */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <label className="block text-sm font-medium text-gray-300 mb-3">Platform</label>
              <div className="space-y-1.5">
                {platforms.map(p => (
                  <button key={p.id} type="button" onClick={() => { setPlatform(p.id); setStateLib(stateManagement[p.id]?.[0] || '') }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left cursor-pointer transition-all ${
                      platform === p.id
                        ? 'bg-green-600/10 border border-green-500/30 ring-1 ring-green-500/20'
                        : 'bg-gray-800/50 border border-transparent hover:bg-gray-800'
                    }`}>
                    <p.icon className="w-4 h-4 flex-shrink-0" style={{ color: p.color }} />
                    <span className={`text-sm font-medium ${platform === p.id ? 'text-green-300' : 'text-gray-300'}`}>{p.label}</span>
                    {platform === p.id && <Check className="w-4 h-4 text-green-400 ml-auto" />}
                  </button>
                ))}
              </div>
            </div>

            {/* State Management */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <label className="block text-sm font-medium text-gray-300 mb-3">State Management</label>
              <div className="flex flex-wrap gap-2">
                {stateOptions.map(s => (
                  <button key={s} type="button" onClick={() => setStateLib(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                      stateLib === s ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                    }`}>{s}</button>
                ))}
              </div>
            </div>

            {/* Features checklist */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <label className="block text-sm font-medium text-gray-300 mb-3">Features</label>
              <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                {featureGroups.map(group => (
                  <div key={group.group}>
                    <span className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">{group.group}</span>
                    <div className="mt-1.5 space-y-1">
                      {group.features.map(feat => {
                        const checked = selectedFeatures.includes(feat.id)
                        return (
                          <button key={feat.id} type="button" onClick={() => toggleFeature(feat.id)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left cursor-pointer transition-colors ${
                              checked ? 'bg-green-600/10 text-green-300' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-300'
                            }`}>
                            {checked
                              ? <CheckSquare className="w-4 h-4 text-green-400 flex-shrink-0" />
                              : <Square className="w-4 h-4 text-gray-600 flex-shrink-0" />
                            }
                            <span className="text-xs">{feat.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-600 mt-3">{selectedFeatures.length} features selected</p>
            </div>

            <button type="submit" disabled={loading || !appDescription.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 cursor-pointer">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              {loading ? (phase || 'Generating...') : 'Generate Code'}
            </button>
          </form>
        </div>

        {/* Right: Results */}
        <div className="lg:col-span-2 space-y-4">
          {result?.error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">{result.error}</div>
          )}

          {loading && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-center h-[28rem]">
              <div className="text-center">
                <Loader2 className="w-10 h-10 text-green-400 animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-400">{phase || 'Generating your app...'}</p>
                <p className="text-xs text-gray-600 mt-1">Writing production-ready code with {currentPlatform?.label}</p>
              </div>
            </div>
          )}

          {!loading && !result && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-center h-[28rem]">
              <div className="text-center text-gray-500 px-8">
                <Terminal className="w-16 h-16 mx-auto mb-3 text-gray-600" />
                <p className="text-sm">Your generated app code will appear here</p>
                <p className="text-xs text-gray-600 mt-2">Describe your app, pick a platform & features, and get complete boilerplate</p>
                <div className="flex items-center justify-center gap-4 mt-5 text-xs text-gray-600">
                  <span className="flex items-center gap-1"><FolderTree className="w-3 h-3" /> File Structure</span>
                  <span className="flex items-center gap-1"><FileCode className="w-3 h-3" /> Full Code</span>
                  <span className="flex items-center gap-1"><Smartphone className="w-3 h-3" /> Mobile Preview</span>
                </div>
              </div>
            </div>
          )}

          {result && !result.error && (
            <>
              {/* Summary */}
              <div className="bg-gradient-to-br from-green-600/10 to-emerald-600/10 border border-green-500/20 rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-bold text-white font-mono">{result.appName}</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-green-500/15 text-green-300 px-2.5 py-1 rounded-full">{currentPlatform?.label}</span>
                    <button onClick={handleDownloadAll}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg cursor-pointer transition-colors">
                      <Download className="w-3.5 h-3.5" /> All Files
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed mb-3">{result.summary}</p>
                {result.techStack?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {result.techStack.map((t, i) => (
                      <span key={i} className="text-[11px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-md border border-green-500/15 font-mono">{t}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* View mode toggle: Code vs Preview */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-1.5 flex gap-1">
                <button onClick={() => setViewMode('code')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                    viewMode === 'code' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}>
                  <FileCode className="w-4 h-4" /> Code Editor
                </button>
                <button onClick={() => setViewMode('preview')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                    viewMode === 'preview' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}>
                  <Smartphone className="w-4 h-4" /> Mobile Preview
                </button>
              </div>

              {/* Code View */}
              {viewMode === 'code' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* File tree sidebar */}
                  <div className="md:col-span-1">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                      <button onClick={() => setShowTree(v => !v)}
                        className="w-full flex items-center gap-2 px-4 py-3 cursor-pointer text-left border-b border-gray-800">
                        <FolderTree className="w-4 h-4 text-green-400" />
                        <span className="flex-1 text-xs font-semibold text-gray-300 uppercase tracking-wider">File Tree</span>
                        {showTree ? <ChevronUp className="w-3 h-3 text-gray-500" /> : <ChevronDown className="w-3 h-3 text-gray-500" />}
                      </button>
                      {showTree && (
                        <div className="p-2 max-h-80 overflow-y-auto">
                          {result.fileTree?.map((item, i) => (
                            <FileTreeItem key={i} item={item} />
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="bg-gray-900 border border-gray-800 rounded-xl mt-4 overflow-hidden">
                      <div className="px-4 py-2.5 border-b border-gray-800">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Files ({result.files?.length || 0})</span>
                      </div>
                      <div className="max-h-72 overflow-y-auto">
                        {result.files?.map((f, i) => (
                          <button key={i} onClick={() => setActiveFile(i)}
                            className={`w-full flex items-center gap-2 px-4 py-2 text-left cursor-pointer transition-colors border-l-2 ${
                              activeFile === i
                                ? 'bg-green-600/10 border-green-500 text-green-300'
                                : 'border-transparent text-gray-400 hover:bg-gray-800 hover:text-gray-300'
                            }`}>
                            <FileCode className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="text-xs font-mono truncate">{f.filename}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Code viewer */}
                  <div className="md:col-span-3">
                    {result.files?.[activeFile] && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono text-white">{result.files[activeFile].filename}</span>
                            <span className="text-[10px] text-gray-500">{result.files[activeFile].description}</span>
                          </div>
                          <button onClick={() => handleDownloadFile(result.files[activeFile])}
                            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-white cursor-pointer transition-colors">
                            <Download className="w-3 h-3" /> Download
                          </button>
                        </div>
                        <CodeBlock
                          code={result.files[activeFile].code}
                          language={result.files[activeFile].language}
                          filename={result.files[activeFile].filename}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Preview View */}
              {viewMode === 'preview' && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
                  {result.screens?.length > 0 ? (
                    <MobilePreview
                      screens={result.screens}
                      appName={result.appName}
                      primaryColor={result.primaryColor}
                    />
                  ) : (
                    <div className="text-center py-16 text-gray-500">
                      <Smartphone className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                      <p className="text-sm">No screen data available for preview</p>
                      <p className="text-xs text-gray-600 mt-1">Try regenerating with a mobile platform selected</p>
                    </div>
                  )}
                </div>
              )}

              {/* Setup Instructions */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <button onClick={() => setShowSetup(v => !v)}
                  className="w-full flex items-center gap-3 px-5 py-4 cursor-pointer text-left">
                  <div className="w-8 h-8 rounded-lg bg-green-500/15 flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-green-400" />
                  </div>
                  <span className="flex-1 text-sm font-semibold text-white">Setup Instructions</span>
                  {showSetup ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                </button>
                {showSetup && result.setupInstructions && (
                  <div className="px-5 pb-5 space-y-4">
                    <div>
                      <h4 className="text-xs font-medium text-green-400 mb-2 uppercase tracking-wider">Steps</h4>
                      <div className="space-y-2">
                        {result.setupInstructions.steps?.map((step, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <span className="w-6 h-6 rounded-full bg-green-600/20 text-green-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                            <pre className="text-sm text-gray-300 font-mono bg-gray-800 rounded-lg px-3 py-2 flex-1 whitespace-pre-wrap">{step}</pre>
                          </div>
                        ))}
                      </div>
                    </div>

                    {result.commands && (
                      <div>
                        <h4 className="text-xs font-medium text-green-400 mb-2 uppercase tracking-wider">Quick Commands</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(result.commands).map(([key, cmd]) => (
                            <div key={key} className="bg-gray-800/50 rounded-lg px-3 py-2.5 flex items-center justify-between group">
                              <div>
                                <span className="text-[10px] text-gray-500 uppercase">{key}</span>
                                <p className="text-xs text-gray-300 font-mono">{cmd}</p>
                              </div>
                              <button onClick={() => navigator.clipboard.writeText(cmd)}
                                className="p-1 text-gray-600 hover:text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.setupInstructions.envVars?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-green-400 mb-2 uppercase tracking-wider">Environment Variables</h4>
                        <div className="space-y-1.5">
                          {result.setupInstructions.envVars.map((v, i) => (
                            <div key={i} className="bg-gray-800/50 rounded-lg px-3 py-2 flex items-center gap-3">
                              <code className="text-xs text-green-300 font-mono">{v.key}</code>
                              <span className="text-[11px] text-gray-500 flex-1">{v.description}</span>
                              <code className="text-[10px] text-gray-600 font-mono">{v.example}</code>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.setupInstructions.dependencies?.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-green-400 mb-2 uppercase tracking-wider">Dependencies</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {result.setupInstructions.dependencies.map((dep, i) => (
                            <span key={i} className="text-[11px] bg-gray-800 text-gray-400 px-2.5 py-1 rounded-lg font-mono border border-gray-700">{dep}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Regenerate */}
              <button onClick={handleGenerate} disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-xl cursor-pointer transition-colors disabled:opacity-50">
                <RefreshCw className="w-4 h-4" /> Regenerate Code
              </button>
            </>
          )}
        </div>
      </div>
    </ToolLayout>
  )
}
