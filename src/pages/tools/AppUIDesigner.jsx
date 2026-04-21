import { useState } from 'react'
import { Layout, Loader2, Palette, Type, Layers, Copy, Check, ChevronDown, ChevronUp, Figma, Smartphone, Monitor, Tablet, RefreshCw, Sparkles, Eye, Component, Navigation, ArrowRight, Box } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'
import { callGemini, parseGeminiJSON } from '../../config/gemini'

const platforms = [
  { id: 'mobile', label: 'Mobile App', icon: Smartphone },
  { id: 'web', label: 'Web App', icon: Monitor },
  { id: 'tablet', label: 'Tablet App', icon: Tablet },
  { id: 'responsive', label: 'Responsive (All)', icon: Layout },
]

const designStyles = ['Modern Minimal', 'Bold & Vibrant', 'Glassmorphism', 'Neomorphism', 'Material Design', 'iOS Native', 'Dashboard / Data-heavy', 'E-commerce', 'Social / Feed-based', 'Retro / Vintage']
const audiences = ['Gen Z (13-24)', 'Millennials (25-40)', 'Professionals (25-55)', 'Enterprise / B2B', 'Kids / Family', 'Seniors (55+)', 'Creators / Artists', 'Developers', 'General Public']
const complexityLevels = ['Simple (3-5 screens)', 'Medium (6-12 screens)', 'Complex (13+ screens)']

function Section({ icon: Icon, title, badge, color, defaultOpen, actions, children }) {
  const [open, setOpen] = useState(defaultOpen ?? false)
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden transition-all hover:border-gray-700">
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center gap-3 px-5 py-4 cursor-pointer text-left">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}20` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <span className="flex-1 text-sm font-semibold text-white">{title}</span>
        {badge && <span className="text-[10px] font-bold bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">{badge}</span>}
        {open ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
      </button>
      {open && (
        <div className="px-5 pb-5 pt-0">
          {children}
          {actions && <div className="flex gap-2 mt-4 pt-3 border-t border-gray-800">{actions}</div>}
        </div>
      )}
    </div>
  )
}

function ColorSwatch({ hex, name, usage }) {
  return (
    <div className="flex-1 min-w-[5rem]">
      <div className="h-14 rounded-xl border border-gray-700 mb-2" style={{ backgroundColor: hex }} />
      <p className="text-xs font-medium text-gray-300">{name}</p>
      <p className="text-[10px] text-gray-500 font-mono">{hex}</p>
      {usage && <p className="text-[10px] text-gray-600 mt-0.5">{usage}</p>}
    </div>
  )
}

function ScreenCard({ screen, index }) {
  return (
    <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-4 hover:border-gray-600 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-6 h-6 rounded-md bg-cyan-500/15 text-cyan-400 text-xs font-bold flex items-center justify-center">{index + 1}</span>
        <h4 className="text-sm font-medium text-white">{screen.name}</h4>
      </div>
      <p className="text-xs text-gray-400 leading-relaxed mb-3">{screen.description}</p>
      {screen.keyElements?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {screen.keyElements.map((el, i) => (
            <span key={i} className="text-[10px] bg-gray-700/60 text-gray-400 px-2 py-0.5 rounded-md">{el}</span>
          ))}
        </div>
      )}
      {screen.interactions && (
        <p className="text-[11px] text-cyan-400/70 mt-2 italic">{screen.interactions}</p>
      )}
    </div>
  )
}

function ComponentCard({ component }) {
  return (
    <div className="bg-gray-800/40 border border-gray-700/40 rounded-lg px-4 py-3">
      <div className="flex items-center justify-between mb-1">
        <h4 className="text-sm font-medium text-white">{component.name}</h4>
        {component.reusable && (
          <span className="text-[9px] font-bold bg-green-500/15 text-green-400 px-1.5 py-0.5 rounded-full uppercase">Reusable</span>
        )}
      </div>
      <p className="text-xs text-gray-400 leading-relaxed">{component.description}</p>
      {component.props?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {component.props.map((p, i) => (
            <span key={i} className="text-[10px] bg-violet-500/10 text-violet-300 px-2 py-0.5 rounded font-mono">{p}</span>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AppUIDesigner() {
  const [appIdea, setAppIdea] = useState('')
  const [platform, setPlatform] = useState('mobile')
  const [designStyle, setDesignStyle] = useState('Modern Minimal')
  const [audience, setAudience] = useState('General Public')
  const [complexity, setComplexity] = useState('Medium (6-12 screens)')
  const [brandColors, setBrandColors] = useState('')

  const [loading, setLoading] = useState(false)
  const [phase, setPhase] = useState('')
  const [result, setResult] = useState(null)
  const [figmaPrompt, setFigmaPrompt] = useState('')
  const [figmaLoading, setFigmaLoading] = useState(false)
  const [copied, setCopied] = useState({})

  function handleCopy(key, text) {
    navigator.clipboard.writeText(text)
    setCopied(prev => ({ ...prev, [key]: true }))
    setTimeout(() => setCopied(prev => ({ ...prev, [key]: false })), 2000)
  }

  async function handleGenerate(e) {
    e.preventDefault()
    if (!appIdea.trim() || loading) return
    setLoading(true)
    setResult(null)
    setFigmaPrompt('')

    try {
      setPhase('Analyzing app concept...')
      const reply = await callGemini(
        `You are an elite UI/UX designer and product strategist. Design a complete app UI/UX system for:

APP IDEA: ${appIdea}
PLATFORM: ${platform}
DESIGN STYLE: ${designStyle}
TARGET AUDIENCE: ${audience}
COMPLEXITY: ${complexity}
${brandColors ? `BRAND COLORS PREFERENCE: ${brandColors}` : ''}

Return a JSON object (no markdown, no code fences):
{
  "appName": "Suggested app name",
  "summary": "2-3 sentence design vision summary",
  "designPrinciples": ["principle1", "principle2", "principle3"],
  "colorPalette": {
    "primary": { "hex": "#hex", "name": "Color Name", "usage": "Buttons, CTAs, headers" },
    "secondary": { "hex": "#hex", "name": "Color Name", "usage": "Accents, links, highlights" },
    "accent": { "hex": "#hex", "name": "Color Name", "usage": "Notifications, badges" },
    "background": { "hex": "#hex", "name": "Color Name", "usage": "Main background" },
    "surface": { "hex": "#hex", "name": "Color Name", "usage": "Cards, modals" },
    "text": { "hex": "#hex", "name": "Color Name", "usage": "Primary text" },
    "textSecondary": { "hex": "#hex", "name": "Color Name", "usage": "Secondary text, labels" },
    "error": { "hex": "#hex", "name": "Color Name", "usage": "Error states" },
    "success": { "hex": "#hex", "name": "Color Name", "usage": "Success states" }
  },
  "typography": {
    "headingFont": "Font name",
    "bodyFont": "Font name",
    "monoFont": "Font name (if needed)",
    "rationale": "Why these fonts work",
    "scale": {
      "h1": "32px / Bold",
      "h2": "24px / Semibold",
      "h3": "18px / Semibold",
      "body": "16px / Regular",
      "caption": "12px / Regular"
    }
  },
  "screens": [
    {
      "name": "Screen Name",
      "description": "Detailed wireframe description: layout, sections, element placement",
      "keyElements": ["element1", "element2", "element3"],
      "interactions": "Key user interactions and animations"
    }
  ],
  "components": [
    {
      "name": "Component Name",
      "description": "Purpose, appearance, and behavior",
      "props": ["variant", "size", "disabled"],
      "reusable": true
    }
  ],
  "navigation": {
    "type": "Tab bar / Side drawer / Top nav / etc",
    "items": ["Tab1", "Tab2", "Tab3", "Tab4"],
    "rationale": "Why this navigation pattern fits"
  },
  "userFlows": [
    {
      "name": "Flow Name (e.g., Onboarding)",
      "steps": ["Step 1 description", "Step 2 description", "Step 3 description"]
    }
  ],
  "spacing": {
    "unit": "8px",
    "containerPadding": "16px",
    "cardPadding": "16px",
    "sectionGap": "24px",
    "borderRadius": "12px"
  },
  "accessibility": ["Tip 1", "Tip 2", "Tip 3"],
  "inspiration": ["App or website reference 1", "App or website reference 2", "App or website reference 3"]
}

Generate 6-12 screens, 8-15 components, and 2-4 user flows. Be extremely detailed in wireframe descriptions — a developer should be able to build it from these specs alone.`,
        {
          systemInstruction: 'You are a world-class product designer who has designed apps at Apple, Google, and top startups. Return only valid JSON.',
          temperature: 0.75,
          maxTokens: 8192,
        }
      )

      setResult(parseGeminiJSON(reply))
    } catch (err) {
      setResult({ error: err.message })
    }
    setLoading(false)
    setPhase('')
  }

  async function handleGenerateFigmaPrompt() {
    if (!result || figmaLoading) return
    setFigmaLoading(true)
    try {
      const prompt = await callGemini(
        `Based on this UI/UX design spec, generate a highly detailed Figma design prompt that a designer can paste into Figma AI or use as a brief for rapid prototyping.

APP: ${result.appName}
DESIGN STYLE: ${designStyle}
PLATFORM: ${platform}
COLOR PALETTE: ${Object.entries(result.colorPalette || {}).map(([k, v]) => `${k}: ${v.hex}`).join(', ')}
FONTS: ${result.typography?.headingFont}, ${result.typography?.bodyFont}
SCREENS: ${result.screens?.map(s => s.name).join(', ')}
NAVIGATION: ${result.navigation?.type} with ${result.navigation?.items?.join(', ')}
DESIGN PRINCIPLES: ${result.designPrinciples?.join(', ')}

Generate a single, comprehensive Figma design prompt (500-800 words) that covers:
1. Overall app layout and design system
2. Each screen's wireframe in detail
3. Component styles (buttons, inputs, cards, etc.)
4. Color usage and typography rules
5. Spacing and grid system
6. Micro-interactions and transitions

Make it actionable and specific. A designer should be able to create the full prototype from this prompt alone.`,
        {
          systemInstruction: 'You are a Figma expert. Write the prompt as clean, structured text with sections. No JSON.',
          temperature: 0.7,
          maxTokens: 4096,
        }
      )
      setFigmaPrompt(prompt)
    } catch (err) {
      setFigmaPrompt(`Error: ${err.message}`)
    }
    setFigmaLoading(false)
  }

  const palette = result?.colorPalette ? Object.values(result.colorPalette) : []

  return (
    <ToolLayout icon={Layout} title="App UI/UX Designer" description="AI-powered app design system, wireframes & Figma prompts" color="#06b6d4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Form */}
        <div className="space-y-4">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <label className="block text-sm font-medium text-gray-300 mb-2">App Idea *</label>
              <textarea
                value={appIdea}
                onChange={e => setAppIdea(e.target.value)}
                rows={5}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                placeholder="A fitness tracking app that uses AI to create personalized workout plans, tracks nutrition, and connects users with a community of fitness enthusiasts..."
              />
            </div>

            {/* Platform */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <label className="block text-sm font-medium text-gray-300 mb-3">Platform</label>
              <div className="grid grid-cols-2 gap-2">
                {platforms.map(p => (
                  <button key={p.id} type="button" onClick={() => setPlatform(p.id)}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                      platform === p.id ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20' : 'bg-gray-800 text-gray-400 hover:text-white'
                    }`}>
                    <p.icon className="w-4 h-4" /> {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Design Style */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                <Palette className="w-4 h-4 text-cyan-400" /> Design Style
              </label>
              <div className="flex flex-wrap gap-2">
                {designStyles.map(s => (
                  <button key={s} type="button" onClick={() => setDesignStyle(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                      designStyle === s ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                    }`}>{s}</button>
                ))}
              </div>
            </div>

            {/* Audience & Complexity */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Target Audience</label>
                <div className="flex flex-wrap gap-2">
                  {audiences.map(a => (
                    <button key={a} type="button" onClick={() => setAudience(a)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                        audience === a ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                      }`}>{a}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Complexity</label>
                <div className="flex flex-wrap gap-2">
                  {complexityLevels.map(c => (
                    <button key={c} type="button" onClick={() => setComplexity(c)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                        complexity === c ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                      }`}>{c}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Brand colors */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <label className="block text-sm font-medium text-gray-300 mb-2">Brand Colors <span className="text-xs text-gray-500">(optional)</span></label>
              <input
                value={brandColors}
                onChange={e => setBrandColors(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                placeholder="e.g., #FF6B00 orange, #1A1A2E dark navy"
              />
            </div>

            <button type="submit" disabled={loading || !appIdea.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 cursor-pointer">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              {loading ? (phase || 'Designing...') : 'Generate UI/UX Design'}
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
                <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-400">{phase || 'Crafting your design system...'}</p>
                <p className="text-xs text-gray-600 mt-1">Generating wireframes, palette, fonts & components</p>
              </div>
            </div>
          )}

          {!loading && !result && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-center h-[28rem]">
              <div className="text-center text-gray-500 px-8">
                <Layout className="w-16 h-16 mx-auto mb-3 text-gray-600" />
                <p className="text-sm">Your complete UI/UX design system will appear here</p>
                <p className="text-xs text-gray-600 mt-2">Get wireframes, color palette, typography, components & Figma prompt</p>
                <div className="flex items-center justify-center gap-4 mt-5 text-xs text-gray-600">
                  <span className="flex items-center gap-1"><Palette className="w-3 h-3" /> Colors</span>
                  <span className="flex items-center gap-1"><Type className="w-3 h-3" /> Fonts</span>
                  <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> Screens</span>
                  <span className="flex items-center gap-1"><Component className="w-3 h-3" /> Components</span>
                </div>
              </div>
            </div>
          )}

          {result && !result.error && (
            <>
              {/* Summary banner */}
              <div className="bg-gradient-to-br from-cyan-600/10 to-blue-600/10 border border-cyan-500/20 rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-bold text-white">{result.appName}</h2>
                  <span className="text-xs bg-cyan-500/15 text-cyan-300 px-2.5 py-1 rounded-full">{designStyle}</span>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed mb-3">{result.summary}</p>
                {result.designPrinciples?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {result.designPrinciples.map((p, i) => (
                      <span key={i} className="text-xs bg-cyan-500/10 text-cyan-400 px-2.5 py-1 rounded-lg border border-cyan-500/15">{p}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Color Palette */}
              <Section icon={Palette} title="Color Palette" badge={`${palette.length} colors`} color="#06b6d4" defaultOpen
                actions={
                  <button onClick={() => handleCopy('palette', palette.map(c => `${c.name}: ${c.hex}`).join('\n'))}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-white cursor-pointer">
                    {copied.palette ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied.palette ? 'Copied!' : 'Copy palette'}
                  </button>
                }>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  {palette.map((c, i) => (
                    <ColorSwatch key={i} hex={c.hex} name={c.name} usage={c.usage} />
                  ))}
                </div>
              </Section>

              {/* Typography */}
              <Section icon={Type} title="Typography" color="#8b5cf6" defaultOpen
                actions={
                  <button onClick={() => handleCopy('fonts', `Heading: ${result.typography?.headingFont}\nBody: ${result.typography?.bodyFont}\n${result.typography?.monoFont ? `Mono: ${result.typography.monoFont}` : ''}`)}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-white cursor-pointer">
                    {copied.fonts ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied.fonts ? 'Copied!' : 'Copy fonts'}
                  </button>
                }>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { label: 'Heading', font: result.typography?.headingFont },
                      { label: 'Body', font: result.typography?.bodyFont },
                      { label: 'Mono', font: result.typography?.monoFont },
                    ].filter(f => f.font).map((f, i) => (
                      <div key={i} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 text-center">
                        <p className="text-lg font-bold text-white mb-1" style={{ fontFamily: f.font }}>{f.font}</p>
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider">{f.label}</span>
                      </div>
                    ))}
                  </div>
                  {result.typography?.rationale && (
                    <p className="text-xs text-gray-400 leading-relaxed">{result.typography.rationale}</p>
                  )}
                  {result.typography?.scale && (
                    <div className="space-y-1.5">
                      {Object.entries(result.typography.scale).map(([key, val]) => (
                        <div key={key} className="flex items-center justify-between bg-gray-800/30 rounded-lg px-3 py-2">
                          <span className="text-xs font-mono text-violet-300">{key}</span>
                          <span className="text-xs text-gray-400">{val}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Section>

              {/* Screens / Wireframes */}
              <Section icon={Layers} title="Screens & Wireframes" badge={`${result.screens?.length || 0} screens`} color="#f59e0b" defaultOpen>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {result.screens?.map((screen, i) => (
                    <ScreenCard key={i} screen={screen} index={i} />
                  ))}
                </div>
              </Section>

              {/* Components */}
              <Section icon={Box} title="Component Library" badge={`${result.components?.length || 0}`} color="#10b981">
                <div className="space-y-2">
                  {result.components?.map((comp, i) => (
                    <ComponentCard key={i} component={comp} />
                  ))}
                </div>
              </Section>

              {/* Navigation */}
              {result.navigation && (
                <Section icon={Navigation} title="Navigation Pattern" color="#ec4899">
                  <div className="space-y-3">
                    <div className="bg-gray-800/50 rounded-xl p-4">
                      <span className="text-xs font-medium text-pink-400 uppercase tracking-wider">Type</span>
                      <p className="text-sm text-white font-medium mt-1">{result.navigation.type}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {result.navigation.items?.map((item, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <span className="bg-gray-800 text-gray-300 text-xs px-3 py-2 rounded-lg border border-gray-700">{item}</span>
                          {i < (result.navigation.items.length - 1) && <ArrowRight className="w-3 h-3 text-gray-600 mx-0.5" />}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{result.navigation.rationale}</p>
                  </div>
                </Section>
              )}

              {/* User Flows */}
              {result.userFlows?.length > 0 && (
                <Section icon={ArrowRight} title="User Flows" badge={`${result.userFlows.length} flows`} color="#6366f1">
                  <div className="space-y-4">
                    {result.userFlows.map((flow, fi) => (
                      <div key={fi}>
                        <h4 className="text-sm font-medium text-white mb-2">{flow.name}</h4>
                        <div className="flex flex-wrap items-center gap-1">
                          {flow.steps?.map((step, si) => (
                            <div key={si} className="flex items-center gap-1">
                              <span className="text-xs bg-indigo-500/10 text-indigo-300 px-2.5 py-1.5 rounded-lg border border-indigo-500/15">{step}</span>
                              {si < flow.steps.length - 1 && <ArrowRight className="w-3 h-3 text-gray-600 flex-shrink-0" />}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Spacing & Accessibility */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {result.spacing && (
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Layers className="w-4 h-4 text-cyan-400" /> Spacing System</h3>
                    <div className="space-y-2">
                      {Object.entries(result.spacing).map(([key, val]) => (
                        <div key={key} className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className="text-cyan-300 font-mono bg-gray-800 px-2 py-0.5 rounded">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {result.accessibility?.length > 0 && (
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Eye className="w-4 h-4 text-green-400" /> Accessibility</h3>
                    <ul className="space-y-2">
                      {result.accessibility.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Inspiration */}
              {result.inspiration?.length > 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-white mb-3">Design Inspiration</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.inspiration.map((ref, i) => (
                      <span key={i} className="text-xs bg-gray-800 text-gray-300 px-3 py-1.5 rounded-lg border border-gray-700">{ref}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Figma Prompt */}
              <div className="bg-gradient-to-br from-violet-600/10 to-fuchsia-600/10 border border-violet-500/20 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Figma className="w-4 h-4 text-violet-400" /> Figma Design Prompt
                  </h3>
                  {figmaPrompt && (
                    <button onClick={() => handleCopy('figma', figmaPrompt)}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-white cursor-pointer">
                      {copied.figma ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied.figma ? 'Copied!' : 'Copy'}
                    </button>
                  )}
                </div>
                {figmaPrompt ? (
                  <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 max-h-80 overflow-y-auto">
                    <pre className="text-xs text-gray-200 leading-relaxed whitespace-pre-wrap">{figmaPrompt}</pre>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-xs text-gray-500 mb-3">Generate a copy-paste Figma prompt from this design spec</p>
                    <button onClick={handleGenerateFigmaPrompt} disabled={figmaLoading}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl cursor-pointer transition-colors disabled:opacity-50">
                      {figmaLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Figma className="w-4 h-4" />}
                      {figmaLoading ? 'Generating Figma Prompt...' : 'Generate Figma Prompt'}
                    </button>
                  </div>
                )}
              </div>

              {/* Regenerate */}
              <button onClick={handleGenerate} disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-xl cursor-pointer transition-colors disabled:opacity-50">
                <RefreshCw className="w-4 h-4" /> Redesign from Scratch
              </button>
            </>
          )}
        </div>
      </div>
    </ToolLayout>
  )
}
