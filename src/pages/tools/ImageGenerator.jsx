import { useState, useRef } from 'react'
import {
  Loader2, Download, Wand2, RefreshCw, Zap, Gem, Shuffle,
  Save, Star, Search, X, Upload, History, Pencil, Expand,
  Image, Settings2, Palette, MessageSquare, Workflow,
  ToggleLeft, ToggleRight, ChevronDown, Grid2x2, Grid3x3,
} from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'
import { generateNanoBananaImage, isNanoBananaConfigured } from '../../config/nanoBanana'

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY

// ── Constants ─────────────────────────────────────────────────────────────────

const MODES = [
  { id: 'generate', label: 'Generate',  icon: Wand2 },
  { id: 'img2img',  label: 'Img→Img',   icon: RefreshCw },
  { id: 'inpaint',  label: 'Inpaint',   icon: Pencil },
  { id: 'outpaint', label: 'Outpaint',  icon: Expand },
  { id: 'history',  label: 'History',   icon: History },
]

const PANEL_TABS = [
  { id: 'prompt',    label: 'Prompt',    icon: MessageSquare },
  { id: 'style',     label: 'Style',     icon: Palette },
  { id: 'technical', label: 'Technical', icon: Settings2 },
  { id: 'workflow',  label: 'Workflow',  icon: Workflow },
]

const STYLE_PRESETS = [
  { id: 'Photorealistic', emoji: '📷' }, { id: 'Digital Art',  emoji: '🎨' },
  { id: 'Oil Painting',   emoji: '🖌️' }, { id: 'Watercolor',   emoji: '💧' },
  { id: 'Anime',          emoji: '⚡' }, { id: '3D Render',    emoji: '🎯' },
  { id: 'Pixel Art',      emoji: '🕹️' }, { id: 'Sketch',       emoji: '✏️' },
]

const LIGHTING_OPTIONS = [
  'Natural Light', 'Golden Hour', 'Blue Hour', 'Cinematic',
  'Studio', 'Cyberpunk Neon', 'Moonlight', 'Soft Diffused',
  'Hard Dramatic', 'God Rays', 'Volumetric Fog',
]

const LENS_OPTIONS = [
  '35mm Film', '50mm Standard', '85mm Portrait', '24mm Wide Angle',
  '135mm Telephoto', 'Macro 100mm', 'Fish-eye 8mm', 'Medium Format',
]

const ASPECT_RATIOS = [
  { id: '1:1',  w: 1,  h: 1  },
  { id: '4:3',  w: 4,  h: 3  },
  { id: '3:4',  w: 3,  h: 4  },
  { id: '16:9', w: 16, h: 9  },
  { id: '9:16', w: 9,  h: 16 },
  { id: '3:2',  w: 3,  h: 2  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function getResolution(arId, quality) {
  const base = { '4K': 4096, '2K': 2048, '1K': 1024, '512': 512 }[quality] || 1024
  const found = ASPECT_RATIOS.find(a => a.id === arId) || { w: 1, h: 1 }
  const scale = Math.sqrt((base * base) / (found.w * found.h))
  return `${Math.round(found.w * scale)}×${Math.round(found.h * scale)}`
}

function base64FromBlob(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const b64 = reader.result.split(',')[1]
      resolve({ b64, mimeType: file.type })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function blobUrlFromInlineData(inlineData) {
  const bytes = atob(inlineData.data)
  const arr   = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
  return URL.createObjectURL(new Blob([arr], { type: inlineData.mimeType }))
}

// ── API calls ─────────────────────────────────────────────────────────────────

async function geminiGenerate(fullPrompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
      }),
    }
  )
  if (!res.ok) { const e = await res.json(); throw new Error(e.error?.message || `API error ${res.status}`) }
  const data  = await res.json()
  const parts = data.candidates?.[0]?.content?.parts || []
  const img   = parts.find(p => p.inlineData)
  if (!img) throw new Error(parts.find(p => p.text)?.text || 'No image generated.')
  return blobUrlFromInlineData(img.inlineData)
}

async function geminiImg2Img(b64, mimeType, prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inlineData: { mimeType, data: b64 } },
            { text: `Transform or reimagine this image with the following style/instructions: ${prompt}. Output a visually transformed version.` },
          ],
        }],
        generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
      }),
    }
  )
  if (!res.ok) { const e = await res.json(); throw new Error(e.error?.message || `API error ${res.status}`) }
  const data  = await res.json()
  const parts = data.candidates?.[0]?.content?.parts || []
  const img   = parts.find(p => p.inlineData)
  if (!img) throw new Error('No image generated from reference. Try a different prompt.')
  return blobUrlFromInlineData(img.inlineData)
}

// ── Small shared UI pieces ────────────────────────────────────────────────────

function MetaChip({ label, value }) {
  return (
    <span className="flex items-center gap-1.5 text-gray-600 font-mono">
      <span className="text-gray-700 uppercase tracking-widest text-[9px]">{label}</span>
      <span className="text-gray-400">{value}</span>
    </span>
  )
}

function Toggle({ value, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="cursor-pointer"
    >
      {value
        ? <ToggleRight className="w-6 h-6 text-pink-500" />
        : <ToggleLeft  className="w-6 h-6 text-gray-600" />}
    </button>
  )
}

function SectionLabel({ children }) {
  return <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{children}</label>
}

// ── Canvas sub-views ──────────────────────────────────────────────────────────

function GenerateCanvas({ results, loading, progress, engine }) {
  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-4 border-pink-500/20 animate-ping" />
        <div className="absolute inset-2 rounded-full border-4 border-pink-500/40 animate-spin" />
        <Loader2 className="absolute inset-4 text-pink-400 animate-spin w-12 h-12" />
      </div>
      <p className="text-sm text-gray-400">{progress || 'Generating…'}</p>
      <p className="text-xs text-gray-600">{engine === 'nano-banana' ? 'Nano Banana 2 · 10–30 s' : 'AI · a few seconds'}</p>
    </div>
  )
  if (!results.length) return (
    <div className="flex flex-col items-center justify-center h-full text-center gap-3">
      <div className="w-24 h-24 rounded-3xl bg-pink-500/5 border border-pink-500/10 flex items-center justify-center">
        <Image className="w-10 h-10 text-pink-500/30" />
      </div>
      <p className="text-gray-500 text-sm">Your image will appear here</p>
      <p className="text-gray-700 text-xs">Set your prompt in the panel →</p>
    </div>
  )
  if (results.length === 1) return (
    <img src={results[0]} alt="Generated" className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" />
  )
  const cols = results.length === 4 ? 'grid-cols-2' : 'grid-cols-3'
  return (
    <div className={`grid ${cols} gap-2 w-full`}>
      {results.map((url, i) => (
        <img key={i} src={url} alt={`Batch ${i + 1}`} className="w-full h-full object-cover rounded-lg" />
      ))}
    </div>
  )
}

function Img2ImgCanvas({ sourceImg, onSourceImg, results, loading }) {
  const fileRef = useRef(null)
  async function handleFile(e) {
    const f = e.target.files?.[0]
    if (!f || !f.type.startsWith('image/')) return
    const { b64, mimeType } = await base64FromBlob(f)
    onSourceImg({ b64, mimeType, url: URL.createObjectURL(f) })
  }
  return (
    <div className="flex gap-3 w-full h-full">
      {/* Source */}
      <div className="flex-1 flex flex-col gap-2">
        <p className="text-xs text-gray-600 uppercase tracking-widest">Source</p>
        {sourceImg ? (
          <img src={sourceImg.url} alt="Source" className="flex-1 object-contain rounded-xl" />
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-700 hover:border-pink-500/50 rounded-xl transition-colors cursor-pointer gap-3"
          >
            <Upload className="w-10 h-10 text-gray-600" />
            <p className="text-sm text-gray-500">Drop or click to upload source image</p>
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      </div>
      {/* Result */}
      <div className="flex-1 flex flex-col gap-2">
        <p className="text-xs text-gray-600 uppercase tracking-widest">Result</p>
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-pink-400 animate-spin" />
          </div>
        ) : results.length ? (
          <img src={results[0]} alt="Transformed" className="flex-1 object-contain rounded-xl" />
        ) : (
          <div className="flex-1 border border-dashed border-gray-800 rounded-xl flex items-center justify-center">
            <p className="text-sm text-gray-700">Transformed image</p>
          </div>
        )}
      </div>
    </div>
  )
}

function HistoryCanvas({ history, onSelect }) {
  if (!history.length) return (
    <div className="flex items-center justify-center h-full text-gray-700 text-sm">
      No generation history yet.
    </div>
  )
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 w-full p-1">
      {history.map((item, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(item.imageUrl)}
          className="group relative aspect-square rounded-xl overflow-hidden border border-gray-800 hover:border-pink-500/60 transition-colors cursor-pointer"
        >
          <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-2">
            <p className="text-[10px] text-white text-center line-clamp-2">{item.prompt}</p>
            <span className="text-[9px] text-pink-300">{item.style}</span>
          </div>
        </button>
      ))}
    </div>
  )
}

function ComingSoonCanvas({ label }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-800/60 border border-gray-700 flex items-center justify-center text-3xl">🚧</div>
      <p className="text-gray-400 font-medium">{label}</p>
      <p className="text-xs text-gray-600">Coming soon in a future update</p>
    </div>
  )
}

// ── Side panel tabs ───────────────────────────────────────────────────────────

function PromptTab({ prompt, setPrompt, negativePrompt, setNegativePrompt, aspectRatio, setAspectRatio, quality, setQuality }) {
  const inputBase = 'w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 resize-none'
  return (
    <div className="p-4 space-y-5">
      <div>
        <SectionLabel>Positive Prompt</SectionLabel>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          rows={5}
          placeholder="A majestic dragon over a crystal lake at sunset, volumetric fog..."
          className={`${inputBase} bg-indigo-950/30 border border-indigo-500/30 text-white placeholder-indigo-900/60 focus:ring-indigo-500/50`}
        />
      </div>

      <div>
        <SectionLabel>Negative Prompt</SectionLabel>
        <textarea
          value={negativePrompt}
          onChange={e => setNegativePrompt(e.target.value)}
          rows={3}
          placeholder="blurry, distorted, low quality, watermark..."
          className={`${inputBase} bg-red-950/20 border border-red-500/25 text-red-100/80 placeholder-red-900/40 focus:ring-red-500/40`}
        />
        <p className="text-[10px] text-red-500/50 mt-1">What to EXCLUDE from the output</p>
      </div>

      <div>
        <SectionLabel>Aspect Ratio</SectionLabel>
        <div className="grid grid-cols-3 gap-2">
          {ASPECT_RATIOS.map(ar => {
            const isActive = aspectRatio === ar.id
            const pw = Math.min(ar.w, ar.h) === ar.w ? 24 : 32
            const ph = Math.min(ar.w, ar.h) === ar.h ? 24 : 32
            return (
              <button
                key={ar.id}
                type="button"
                onClick={() => setAspectRatio(ar.id)}
                className={`flex flex-col items-center gap-1.5 py-2 px-1 rounded-xl border text-[11px] font-medium transition-all cursor-pointer ${
                  isActive ? 'border-pink-500/60 bg-pink-500/10 text-pink-300' : 'border-gray-700 text-gray-500 hover:border-gray-600'
                }`}
              >
                <div
                  className={`rounded-sm ${isActive ? 'bg-pink-400' : 'bg-gray-600'} transition-colors`}
                  style={{ width: pw, height: ph }}
                />
                {ar.id}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <SectionLabel>Output Quality</SectionLabel>
        <div className="flex gap-2">
          {['512', '1K', '2K', '4K'].map(q => (
            <button
              key={q}
              type="button"
              onClick={() => setQuality(q)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                quality === q ? 'bg-pink-600 text-white shadow-lg shadow-pink-500/20' : 'bg-gray-800 text-gray-500 hover:text-white'
              }`}
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function StyleTab({ style, setStyle, lighting, setLighting, cameraLens, setCameraLens, engine, setEngine }) {
  const nanoBananaAvailable = isNanoBananaConfigured()
  return (
    <div className="p-4 space-y-5">
      <div>
        <SectionLabel>Style Preset</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          {STYLE_PRESETS.map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStyle(s.id)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                style === s.id
                  ? 'border-pink-500/60 bg-gradient-to-r from-pink-600/20 to-purple-600/20 text-pink-200'
                  : 'border-gray-700/50 bg-gray-800/40 text-gray-400 hover:border-gray-600 hover:text-gray-200'
              }`}
            >
              <span className="text-base">{s.emoji}</span>
              {s.id}
            </button>
          ))}
        </div>
      </div>

      <div>
        <SectionLabel>Lighting</SectionLabel>
        <div className="relative">
          <select
            value={lighting}
            onChange={e => setLighting(e.target.value)}
            className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/40 appearance-none cursor-pointer"
          >
            {LIGHTING_OPTIONS.map(l => <option key={l}>{l}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        </div>
      </div>

      <div>
        <SectionLabel>Camera / Lens</SectionLabel>
        <div className="relative">
          <select
            value={cameraLens}
            onChange={e => setCameraLens(e.target.value)}
            className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/40 appearance-none cursor-pointer"
          >
            {LENS_OPTIONS.map(l => <option key={l}>{l}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        </div>
      </div>

      <div>
        <SectionLabel>AI Engine</SectionLabel>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => nanoBananaAvailable && setEngine('nano-banana')}
            disabled={!nanoBananaAvailable}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              engine === 'nano-banana' ? 'bg-gradient-to-r from-yellow-600 to-orange-600 text-white' : 'bg-gray-800 text-gray-500'
            } ${!nanoBananaAvailable ? 'opacity-30 cursor-not-allowed' : ''}`}
          >
            <Zap className="w-3.5 h-3.5" /> Nano Banana 2
          </button>
          <button
            type="button"
            onClick={() => setEngine('gemini')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              engine === 'gemini' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' : 'bg-gray-800 text-gray-500'
            }`}
          >
            <Gem className="w-3.5 h-3.5" /> Gemini
          </button>
        </div>
      </div>
    </div>
  )
}

function TechnicalTab({ cfg, setCfg, steps, setSteps, seed, setSeed, upscaling, setUpscaling, embedExif, setEmbedExif }) {
  return (
    <div className="p-4 space-y-5">
      <div>
        <div className="flex justify-between mb-2">
          <SectionLabel>CFG Guidance Scale</SectionLabel>
          <span className="text-pink-400 font-mono text-sm">{cfg}</span>
        </div>
        <input
          type="range" min={1} max={20} value={cfg}
          onChange={e => setCfg(Number(e.target.value))}
          className="w-full accent-pink-500 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-gray-600 mt-1">
          <span>Creative ←</span><span>→ Strict</span>
        </div>
      </div>

      <div>
        <div className="flex justify-between mb-2">
          <SectionLabel>Diffusion Steps</SectionLabel>
          <span className="text-indigo-400 font-mono text-sm">{steps}</span>
        </div>
        <input
          type="range" min={10} max={150} step={5} value={steps}
          onChange={e => setSteps(Number(e.target.value))}
          className="w-full accent-indigo-500 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-gray-600 mt-1">
          <span>Fast ←</span><span>→ Quality</span>
        </div>
      </div>

      <div>
        <SectionLabel>Seed</SectionLabel>
        <div className="flex gap-2">
          <input
            type="number"
            value={seed === -1 ? '' : seed}
            onChange={e => setSeed(e.target.value === '' ? -1 : Number(e.target.value))}
            placeholder="-1 (random)"
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 font-mono"
          />
          <button
            type="button"
            onClick={() => setSeed(-1)}
            className="px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-lg cursor-pointer transition-colors"
            title="Randomize seed"
          >
            🎲
          </button>
        </div>
        <p className="text-[10px] text-gray-700 mt-1">−1 = new random seed each generation</p>
      </div>

      <div className="space-y-3 pt-1 border-t border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-300">AI Upscaling</p>
            <p className="text-[10px] text-gray-600">Enhance resolution post-generation</p>
          </div>
          <Toggle value={upscaling} onChange={setUpscaling} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-300">Embed EXIF Metadata</p>
            <p className="text-[10px] text-gray-600">Writes seed, cfg, steps into PNG</p>
          </div>
          <Toggle value={embedExif} onChange={setEmbedExif} />
        </div>
      </div>
    </div>
  )
}

function WorkflowTab({ batchSize, setBatchSize, promptLibrary, setPromptLibrary, favPrompts, setFavPrompts, prompt, setPrompt }) {
  const [search, setSearch] = useState('')

  function handleSavePrompt() {
    if (!prompt.trim() || promptLibrary.includes(prompt.trim())) return
    setPromptLibrary(prev => [prompt.trim(), ...prev].slice(0, 100))
  }
  function handleDelete(i) { setPromptLibrary(prev => prev.filter((_, idx) => idx !== i)) }
  function toggleFav(p) {
    setFavPrompts(prev => prev.includes(p) ? prev.filter(x => x !== p) : [p, ...prev])
  }

  const allPrompts = [...favPrompts, ...promptLibrary.filter(p => !favPrompts.includes(p))]
  const filtered = search ? allPrompts.filter(p => p.toLowerCase().includes(search.toLowerCase())) : allPrompts

  return (
    <div className="p-4 space-y-5">
      <div>
        <SectionLabel>Batch Output</SectionLabel>
        <div className="grid grid-cols-3 gap-2">
          {[1, 4, 9].map(n => {
            const cols = n === 1 ? 1 : n === 4 ? 2 : 3
            const isActive = batchSize === n
            return (
              <button
                key={n}
                type="button"
                onClick={() => setBatchSize(n)}
                className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                  isActive ? 'border-pink-500/60 bg-pink-500/10 text-pink-300' : 'border-gray-700 text-gray-500 hover:border-gray-600'
                }`}
              >
                <div className={`grid gap-0.5`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                  {Array.from({ length: n }).map((_, i) => (
                    <div key={i} className={`w-3 h-3 rounded-sm ${isActive ? 'bg-pink-400' : 'bg-gray-600'}`} />
                  ))}
                </div>
                {n}×
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <SectionLabel>Prompt Library</SectionLabel>
          <button
            type="button"
            onClick={handleSavePrompt}
            disabled={!prompt.trim()}
            className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 cursor-pointer disabled:opacity-40"
          >
            <Save className="w-3 h-3" /> Save current
          </button>
        </div>
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search saved prompts…"
            className="w-full pl-8 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-xs placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
          />
        </div>
        {filtered.length === 0 ? (
          <p className="text-xs text-gray-700 text-center py-4">No saved prompts yet. Generate something and save it!</p>
        ) : (
          <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
            {filtered.map((p, i) => {
              const isFav = favPrompts.includes(p)
              return (
                <div key={i} className="flex items-center gap-1 group hover:bg-gray-800/50 rounded-lg px-2 py-1.5">
                  <button type="button" onClick={() => setPrompt(p)} className="flex-1 text-left text-xs text-gray-400 hover:text-white truncate cursor-pointer">
                    {isFav && <span className="text-yellow-400 mr-1">★</span>}
                    {p}
                  </button>
                  <button type="button" onClick={() => toggleFav(p)} className="opacity-0 group-hover:opacity-100 cursor-pointer">
                    <Star className={`w-3 h-3 ${isFav ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
                  </button>
                  <button type="button" onClick={() => handleDelete(promptLibrary.indexOf(p))} className="opacity-0 group-hover:opacity-100 cursor-pointer">
                    <X className="w-3 h-3 text-gray-600 hover:text-red-400" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ImageGenerator() {
  // Mode & panel
  const [activeMode, setActiveMode] = useState('generate')
  const [activeTab,  setActiveTab]  = useState('prompt')
  const [batchCount, setBatchCount] = useState(1)

  // Prompt tab
  const [prompt,         setPrompt]         = useState('')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [aspectRatio,    setAspectRatio]    = useState('1:1')
  const [quality,        setQuality]        = useState('1K')

  // Style tab
  const [style,      setStyle]      = useState('Photorealistic')
  const [lighting,   setLighting]   = useState('Natural Light')
  const [cameraLens, setCameraLens] = useState('35mm Film')
  const [engine,     setEngine]     = useState(isNanoBananaConfigured() ? 'nano-banana' : 'gemini')

  // Technical tab
  const [cfg,       setCfg]       = useState(7)
  const [steps,     setSteps]     = useState(30)
  const [seed,      setSeed]      = useState(-1)
  const [upscaling, setUpscaling] = useState(false)
  const [embedExif, setEmbedExif] = useState(true)

  // Workflow tab
  const [batchSize,      setBatchSize]      = useState(1)
  const [promptLibrary,  setPromptLibrary]  = useState([])
  const [favPrompts,     setFavPrompts]     = useState([])

  // Canvas
  const [results,  setResults]  = useState([])
  const [loading,  setLoading]  = useState(false)
  const [progress, setProgress] = useState('')
  const [history,  setHistory]  = useState([])
  const [metadata, setMetadata] = useState(null)
  const [error,    setError]    = useState('')

  // Img2Img
  const [sourceImg, setSourceImg] = useState(null)

  // ── Generate ────────────────────────────────────────────────────────────────
  async function handleGenerate(e) {
    if (e) e.preventDefault()
    if (loading) return
    if (activeMode === 'generate' && !prompt.trim()) return
    if (activeMode === 'img2img' && !sourceImg) return

    setLoading(true)
    setResults([])
    setError('')
    setProgress('Starting…')

    const actualSeed = seed === -1 ? Math.floor(Math.random() * 999999) : seed
    const count = activeMode === 'generate' ? batchSize : 1

    try {
      let newResults = []

      if (activeMode === 'img2img') {
        setProgress('Transforming image with AI…')
        const url = await geminiImg2Img(sourceImg.b64, sourceImg.mimeType, prompt || 'Transform this image in an artistic way')
        newResults = [url]
      } else {
        // Build rich prompt from all settings
        let fullPrompt = `${style} style: ${prompt}`
        if (lighting !== 'Natural Light') fullPrompt += `, ${lighting} lighting`
        if (cameraLens !== '35mm Film') fullPrompt += `, shot on ${cameraLens}`
        if (negativePrompt.trim()) fullPrompt += `. Avoid: ${negativePrompt}`
        if (cfg > 12) fullPrompt += '. Be very literal and precise.'
        else if (cfg < 4) fullPrompt += '. Be creative and interpretive.'
        if (quality !== '1K') fullPrompt += ` Output ${quality} quality.`
        fullPrompt += ` Aspect ratio: ${aspectRatio}.`

        for (let i = 0; i < count; i++) {
          setProgress(count > 1 ? `Generating ${i + 1} of ${count}…` : 'Generating…')
          let url
          if (engine === 'nano-banana') {
            url = await generateNanoBananaImage(fullPrompt, { aspectRatio, quality })
          } else {
            url = await geminiGenerate(fullPrompt)
          }
          newResults.push(url)
          setResults(prev => [...prev, url])
        }
      }

      setMetadata({ seed: actualSeed, resolution: getResolution(aspectRatio, quality), style, timestamp: new Date().toLocaleTimeString() })
      setHistory(prev => [
        ...newResults.map(url => ({ imageUrl: url, prompt, style, engine, time: new Date(), seed: actualSeed })),
        ...prev,
      ].slice(0, 24))
    } catch (err) {
      setError(err.message)
    }

    setLoading(false)
    setProgress('')
  }

  function handleDownload(url) {
    const a = document.createElement('a')
    a.href = url
    a.download = `ai-image-${Date.now()}.png`
    a.click()
  }

  const currentSingleResult = results.length === 1 ? results[0] : null

  return (
    <ToolLayout icon={Image} title="Image Generator" description="Professional AI image generation studio" color="#ec4899">
      <div className="flex gap-3" style={{ height: 'calc(100vh - 165px)' }}>

        {/* ══════════════════════════════════════
            LEFT — Canvas
           ══════════════════════════════════════ */}
        <div className="flex-1 flex flex-col bg-gray-900 border border-gray-800/80 rounded-2xl overflow-hidden min-w-0">

          {/* Canvas top bar: mode tabs + batch toggle */}
          <div className="flex items-center justify-between px-3 py-0 border-b border-gray-800/60 bg-gray-950/40 flex-shrink-0">
            <div className="flex">
              {MODES.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveMode(id)}
                  className={`flex items-center gap-1.5 px-3 py-3 text-xs font-medium border-b-2 transition-all cursor-pointer ${
                    activeMode === id
                      ? 'border-pink-500 text-pink-300'
                      : 'border-transparent text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 pr-2">
              {/* Batch toggle */}
              <button
                type="button"
                onClick={() => setBatchCount(c => c === 1 ? 4 : 1)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                  batchCount > 1 ? 'border-pink-500/50 bg-pink-500/10 text-pink-300' : 'border-gray-700 text-gray-500 hover:text-white'
                }`}
                title="Toggle batch output"
              >
                {batchCount === 1 ? <><Grid2x2 className="w-3.5 h-3.5" /> 1×</> : <><Grid3x3 className="w-3.5 h-3.5" /> 4×</>}
              </button>
            </div>
          </div>

          {/* Canvas main area */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-[#080810]">
            {error && activeMode === 'generate' && (
              <div className="absolute top-4 left-4 right-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-3 py-2 rounded-lg z-10">
                {error}
              </div>
            )}
            {activeMode === 'generate' && <GenerateCanvas results={results} loading={loading} progress={progress} engine={engine} />}
            {activeMode === 'img2img'  && <Img2ImgCanvas sourceImg={sourceImg} onSourceImg={setSourceImg} results={results} loading={loading} />}
            {activeMode === 'inpaint'  && <ComingSoonCanvas label="Inpainting" />}
            {activeMode === 'outpaint' && <ComingSoonCanvas label="Outpainting" />}
            {activeMode === 'history'  && <HistoryCanvas history={history} onSelect={url => { setResults([url]); setActiveMode('generate') }} />}
          </div>

          {/* Download strip (when result available) */}
          {currentSingleResult && !loading && activeMode === 'generate' && (
            <div className="flex gap-2 px-4 py-2 border-t border-gray-800/50 bg-gray-950/30">
              <button
                type="button"
                onClick={() => handleDownload(currentSingleResult)}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-pink-600/20 hover:bg-pink-600/30 text-pink-300 text-xs font-medium rounded-lg border border-pink-500/30 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Regenerate
              </button>
            </div>
          )}

          {/* Metadata bar */}
          <div className="flex items-center gap-4 px-4 py-2 border-t border-gray-800/50 bg-gray-950/60 flex-shrink-0">
            <MetaChip label="SEED"  value={metadata?.seed ?? '—'} />
            <span className="text-gray-800">|</span>
            <MetaChip label="CFG"   value={cfg} />
            <span className="text-gray-800">|</span>
            <MetaChip label="STEPS" value={steps} />
            <span className="text-gray-800">|</span>
            <MetaChip label="RES"   value={metadata?.resolution ?? getResolution(aspectRatio, quality)} />
            <span className="text-gray-800">|</span>
            <MetaChip label="STYLE" value={style} />
            {metadata?.timestamp && (
              <span className="ml-auto text-gray-700 font-mono text-[10px]">{metadata.timestamp}</span>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════
            RIGHT — Side Panel
           ══════════════════════════════════════ */}
        <div className="w-72 flex flex-col bg-gray-900 border border-gray-800/80 rounded-2xl overflow-hidden flex-shrink-0">

          {/* Panel tab bar */}
          <div className="grid grid-cols-4 border-b border-gray-800/60 bg-gray-950/40 flex-shrink-0">
            {PANEL_TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-all cursor-pointer border-b-2 ${
                  activeTab === id
                    ? 'border-pink-500 text-pink-300 bg-pink-500/5'
                    : 'border-transparent text-gray-600 hover:text-gray-300'
                }`}
                title={label}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'prompt' && (
              <PromptTab
                prompt={prompt} setPrompt={setPrompt}
                negativePrompt={negativePrompt} setNegativePrompt={setNegativePrompt}
                aspectRatio={aspectRatio} setAspectRatio={setAspectRatio}
                quality={quality} setQuality={setQuality}
              />
            )}
            {activeTab === 'style' && (
              <StyleTab
                style={style} setStyle={setStyle}
                lighting={lighting} setLighting={setLighting}
                cameraLens={cameraLens} setCameraLens={setCameraLens}
                engine={engine} setEngine={setEngine}
              />
            )}
            {activeTab === 'technical' && (
              <TechnicalTab
                cfg={cfg} setCfg={setCfg}
                steps={steps} setSteps={setSteps}
                seed={seed} setSeed={setSeed}
                upscaling={upscaling} setUpscaling={setUpscaling}
                embedExif={embedExif} setEmbedExif={setEmbedExif}
              />
            )}
            {activeTab === 'workflow' && (
              <WorkflowTab
                batchSize={batchSize} setBatchSize={setBatchSize}
                promptLibrary={promptLibrary} setPromptLibrary={setPromptLibrary}
                favPrompts={favPrompts} setFavPrompts={setFavPrompts}
                prompt={prompt} setPrompt={setPrompt}
              />
            )}
          </div>

          {/* Generate button — always at bottom of panel */}
          <div className="p-3 border-t border-gray-800/60 bg-gray-950/30 flex-shrink-0">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading || (activeMode === 'generate' && !prompt.trim()) || (activeMode === 'img2img' && !sourceImg)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all disabled:opacity-40 cursor-pointer shadow-lg shadow-pink-500/20 text-sm"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> {progress || 'Generating…'}</>
                : <><Wand2 className="w-4 h-4" /> Generate{batchSize > 1 && activeMode === 'generate' ? ` (${batchSize}×)` : ''}</>
              }
            </button>
          </div>
        </div>

      </div>
    </ToolLayout>
  )
}
