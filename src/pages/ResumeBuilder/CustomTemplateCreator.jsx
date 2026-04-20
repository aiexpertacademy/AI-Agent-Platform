import { useState } from 'react'
import {
  Wand2, Loader2, Save, Trash2, Check, RefreshCw,
  Layout, Sparkles, CheckCircle2, CloudUpload,
} from 'lucide-react'
import { generateTemplateFromPrompt } from './gemini'

// ── Thumbnail scale (history grid, 4 cols ≈ 110px each) ──────────────────────
// A4 body at 96 dpi ≈ 794 px wide. scale = 110 / 794 ≈ 0.138 → 0.135
const THUMB_SCALE  = 0.135
const THUMB_W      = 794            // actual iframe width
const THUMB_H      = 1122           // actual iframe height (A4)
const THUMB_VIS_H  = Math.round(THUMB_W * THUMB_SCALE * (4 / 3)) // visible crop height

// ── Style preset chips (mirrors Image Generator art-style chips) ──────────────
const STYLE_PRESETS = [
  'Minimal White', 'Dark Professional', 'Creative Colorful',
  'Executive Navy', 'Tech Dark', 'Academic Serif',
  'Modern Sidebar', 'Startup Bold', 'Warm Earthy', 'Swiss Grid',
]

// ── Curated prompt suggestions (like Image Generator placeholder examples) ────
const PROMPT_EXAMPLES = [
  'Dark theme, neon teal sidebar, modern sans-serif, two-column layout',
  'Elegant single column, gold accent rule, serif typography, white background',
  'Vibrant coral header, bold typography, timeline experience section',
  'Executive navy with white text header, classic Garamond, formal sections',
  'Tech-focused dark mode with green monospace accents and grid layout',
  'Clean minimalist, indigo accent, Helvetica, generous whitespace',
  'Academic LaTeX-inspired, black & white, formal serif, section rules',
  'Warm terracotta, rounded cards, friendly sans-serif, sidebar layout',
]

export default function CustomTemplateCreator({ savedTemplates, onSave, onDelete, onUse }) {
  const [prompt, setPrompt]         = useState('')
  const [activeStyle, setActiveStyle] = useState('Minimal White')
  const [loading, setLoading]       = useState(false)
  const [saving, setSaving]         = useState(false)
  const [result, setResult]         = useState(null)   // { html, accentColor, prompt, name }
  const [templateName, setTemplateName] = useState('')
  const [error, setError]           = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  // ── Combine style preset into prompt ────────────────────────────────────────
  function buildFullPrompt() {
    const base = prompt.trim()
    if (!base) return activeStyle + ' resume template style'
    // If user already mentioned the preset, don't repeat
    if (base.toLowerCase().includes(activeStyle.toLowerCase())) return base
    return `${activeStyle} style: ${base}`
  }

  // ── Generate ────────────────────────────────────────────────────────────────
  async function handleGenerate(e) {
    if (e) e.preventDefault()
    if (loading) return
    setLoading(true)
    setError('')
    try {
      const full   = buildFullPrompt()
      const res    = await generateTemplateFromPrompt(full)
      const words  = full.split(' ').slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      setResult({ ...res, usedPrompt: full })
      setTemplateName(words)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  // ── Save current result to Firebase ─────────────────────────────────────────
  async function handleSave() {
    if (!result || !templateName.trim()) return
    setSaving(true)
    setSaveSuccess(false)
    const tmpl = {
      id: `custom_${Date.now()}`,
      name: templateName.trim(),
      prompt: result.usedPrompt,
      html: result.html,
      accentColor: result.accentColor,
      isCustom: true,
      category: 'Custom',
      description: result.usedPrompt,
      preview: `linear-gradient(135deg, ${result.accentColor} 0%, #1a1a2e 100%)`,
      style: {
        fontFamily: 'Arial, sans-serif',
        headerBg: result.accentColor,
        headerText: '#ffffff',
        accentColor: result.accentColor,
        bodyFont: 'Arial, sans-serif',
        sectionBorder: `2px solid ${result.accentColor}`,
      },
      createdAt: Date.now(),
    }
    await onSave(tmpl)
    setSaving(false)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  // ── Restore a saved template into the right-column preview ───────────────────
  function handleRestoreFromHistory(tmpl) {
    setResult({ html: tmpl.html, accentColor: tmpl.accentColor, usedPrompt: tmpl.prompt })
    setPrompt(tmpl.prompt)
    setTemplateName(tmpl.name)
  }

  const isSaved = saveSuccess || (result && savedTemplates.some(t => t.html === result.html))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* ══════════════════════════════════════════════
          LEFT — Controls (matches ImageGenerator left)
         ══════════════════════════════════════════════ */}
      <div className="space-y-5">
        <form onSubmit={handleGenerate} className="space-y-4">

          {/* Style presets — like art-style chips in Image Generator */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <label className="block text-sm font-medium text-gray-300 mb-3">Style Preset</label>
            <div className="flex flex-wrap gap-2">
              {STYLE_PRESETS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setActiveStyle(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                    activeStyle === s ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt textarea */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <label className="block text-sm font-medium text-gray-300 mb-2">Style Description</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              placeholder="Describe your ideal resume design... or leave blank to use the preset above."
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            />
            {/* Quick example prompts */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {PROMPT_EXAMPLES.slice(0, 4).map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setPrompt(ex)}
                  className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-violet-500/50 text-gray-500 hover:text-gray-200 text-[10px] rounded-lg cursor-pointer transition-colors text-left"
                >
                  {ex.length > 50 ? ex.slice(0, 50) + '…' : ex}
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
            {loading ? 'Designing template…' : 'Generate Template'}
          </button>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
        </form>

        {/* ── History grid — matches Image Generator "Recent Generations" ── */}
        {savedTemplates.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-medium text-gray-300 mb-3">
              Saved Templates
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {savedTemplates.map((tmpl) => (
                <div key={tmpl.id} className="relative group">
                  <button
                    type="button"
                    onClick={() => handleRestoreFromHistory(tmpl)}
                    className="relative w-full rounded-lg overflow-hidden border border-gray-700 hover:border-violet-500 transition-colors cursor-pointer"
                    title={tmpl.name}
                  >
                    {/* Actual HTML iframe thumbnail */}
                    <div
                      className="bg-white overflow-hidden"
                      style={{ height: THUMB_VIS_H, position: 'relative' }}
                    >
                      <iframe
                        srcDoc={tmpl.html}
                        title={tmpl.name}
                        scrolling="no"
                        style={{
                          width: THUMB_W,
                          height: THUMB_H,
                          border: 'none',
                          transform: `scale(${THUMB_SCALE})`,
                          transformOrigin: 'top left',
                          pointerEvents: 'none',
                        }}
                      />
                    </div>
                    {/* Label bar like image generator's engine badge */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[9px] text-center py-0.5 text-gray-300 truncate px-1">
                      {tmpl.name}
                    </div>
                  </button>

                  {/* Delete on hover */}
                  <button
                    type="button"
                    onClick={() => onDelete(tmpl.id)}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500/90 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════
          RIGHT — Result preview (matches ImageGenerator right)
         ══════════════════════════════════════════════ */}
      <div>
        {/* Loading state */}
        {loading && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-center h-96">
            <div className="text-center">
              <Loader2 className="w-10 h-10 text-violet-400 animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-400">Designing your template…</p>
              <p className="text-xs text-gray-600 mt-1">This may take 10–20 seconds</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !result && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-center h-96">
            <div className="text-center text-gray-500">
              <Layout className="w-16 h-16 mx-auto mb-3 text-gray-600" />
              <p className="text-sm">Your generated template will appear here</p>
              <p className="text-xs text-gray-600 mt-2">Choose a style preset and click Generate</p>
            </div>
          </div>
        )}

        {/* Generated result */}
        {!loading && result?.html && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            {/* Scaled iframe preview — same pattern as resume preview */}
            <div className="overflow-hidden bg-white" style={{ height: 480 }}>
              <div
                style={{
                  width: 794,
                  minHeight: 1122,
                  transform: 'scale(0.605)',
                  transformOrigin: 'top left',
                  marginBottom: '-43%',
                }}
              >
                <iframe
                  srcDoc={result.html}
                  title="Template preview"
                  scrolling="no"
                  style={{
                    width: 794,
                    minHeight: 1122,
                    border: 'none',
                    display: 'block',
                    pointerEvents: 'none',
                  }}
                  onLoad={(e) => {
                    try {
                      const h = e.target.contentDocument?.body?.scrollHeight
                      if (h) e.target.style.height = h + 'px'
                    } catch (_) {}
                  }}
                />
              </div>
            </div>

            {/* Actions below preview */}
            <div className="p-4 space-y-3">
              {/* Accent swatch */}
              <div className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded-full border border-gray-600 flex-shrink-0"
                  style={{ backgroundColor: result.accentColor }}
                />
                <span className="text-xs text-gray-400">
                  Accent: <code className="text-violet-300">{result.accentColor}</code>
                </span>
              </div>

              {/* Name input */}
              <input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Give this template a name…"
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />

              {/* Button row — matches Image Generator's Download + Regenerate row */}
              <div className="flex gap-3">
                {/* Use Template — primary action */}
                <button
                  type="button"
                  onClick={() => onUse({ ...result, name: templateName || 'Custom Template' })}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" /> Use Template
                </button>

                {/* Save to Firebase */}
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!templateName.trim() || isSaved || saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {saving
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                    : isSaved
                      ? <><Check className="w-4 h-4 text-green-400" /> Saved</>
                      : <><Save className="w-4 h-4" /> Save</>
                  }
                </button>
              </div>

              {/* Regenerate — matches Image Generator's Regenerate button */}
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4" />
                Regenerate
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
