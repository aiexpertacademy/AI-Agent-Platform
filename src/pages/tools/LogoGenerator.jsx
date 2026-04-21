import { useState, useRef, useCallback } from 'react'
import { Hexagon, Loader2, Download, RefreshCw, Sparkles, Copy, Check, ChevronDown, ChevronUp, Palette, Type, Image, Code, Eye, Zap } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'
import { callGemini, parseGeminiJSON } from '../../config/gemini'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

const styleOptions = ['Modern', 'Minimal', 'Bold', 'Elegant', 'Playful', 'Geometric', 'Vintage', 'Futuristic', 'Hand-drawn', 'Abstract']
const colorSchemes = ['Auto (AI picks)', 'Monochrome', 'Vibrant', 'Pastel', 'Dark & Moody', 'Earth Tones', 'Neon', 'Corporate Blue', 'Warm Sunset', 'Cool Ocean']
const industries = ['Technology', 'Food & Beverage', 'Fashion', 'Finance', 'Health & Wellness', 'Education', 'Entertainment', 'Real Estate', 'Sports', 'Travel', 'Eco / Green', 'Art & Design', 'Other']
const logoTypes = ['Icon + Text', 'Icon Only', 'Text Only (Wordmark)', 'Lettermark', 'Emblem / Badge']

function ExpandSection({ title, icon: Icon, defaultOpen, children }) {
  const [open, setOpen] = useState(defaultOpen ?? true)
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center gap-2 px-5 py-3.5 cursor-pointer text-left">
        <Icon className="w-4 h-4 text-orange-400" />
        <span className="flex-1 text-sm font-medium text-gray-300">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
      </button>
      {open && <div className="px-5 pb-5 -mt-1">{children}</div>}
    </div>
  )
}

async function generateLogoImage(prompt) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
      }),
    }
  )
  if (!response.ok) throw new Error('Image generation failed')
  const data = await response.json()
  const parts = data.candidates?.[0]?.content?.parts || []
  const imgPart = parts.find(p => p.inlineData)
  if (!imgPart) return null
  const byteStr = atob(imgPart.inlineData.data)
  const bytes = new Uint8Array(byteStr.length)
  for (let i = 0; i < byteStr.length; i++) bytes[i] = byteStr.charCodeAt(i)
  return URL.createObjectURL(new Blob([bytes], { type: imgPart.inlineData.mimeType }))
}

export default function LogoGenerator() {
  const [brandName, setBrandName] = useState('')
  const [tagline, setTagline] = useState('')
  const [industry, setIndustry] = useState('Technology')
  const [style, setStyle] = useState('Modern')
  const [colorScheme, setColorScheme] = useState('Auto (AI picks)')
  const [logoType, setLogoType] = useState('Icon + Text')
  const [extraNotes, setExtraNotes] = useState('')

  const [loading, setLoading] = useState(false)
  const [loadingPhase, setLoadingPhase] = useState('')
  const [results, setResults] = useState(null)
  const [activeTab, setActiveTab] = useState('image')
  const [copiedSvg, setCopiedSvg] = useState(false)
  const [copiedBrief, setCopiedBrief] = useState(false)
  const [history, setHistory] = useState([])

  const svgContainerRef = useRef(null)

  async function handleGenerate(e) {
    e.preventDefault()
    if (!brandName.trim() || loading) return
    setLoading(true)
    setResults(null)
    setActiveTab('image')

    const context = `Brand: "${brandName}"${tagline ? `, Tagline: "${tagline}"` : ''}
Industry: ${industry}
Style: ${style}
Color Scheme: ${colorScheme}
Logo Type: ${logoType}
${extraNotes ? `Notes: ${extraNotes}` : ''}`

    try {
      // Step 1: Design brief only (no SVG — keeps JSON small and safe)
      setLoadingPhase('Creating design brief...')
      const briefReply = await callGemini(
        `You are an expert logo designer. Create a design brief for:

${context}

Return ONLY a JSON object (no markdown, no code fences):
{
  "brief": {
    "concept": "2-3 sentences describing the logo concept",
    "symbolism": "What the icon/shapes represent",
    "typography": "Recommended font family and why",
    "primaryColor": "#hex",
    "secondaryColor": "#hex",
    "accentColor": "#hex",
    "colorRationale": "Why these colors work",
    "usageTips": "Where and how to use this logo"
  },
  "variations": [
    { "name": "Light Background", "bgColor": "#ffffff", "note": "Primary usage" },
    { "name": "Dark Background", "bgColor": "#111827", "note": "Inverted colors" },
    { "name": "Single Color", "bgColor": "#f3f4f6", "note": "For embossing" }
  ],
  "imagePrompt": "Detailed prompt for a photorealistic mockup of this logo on a business card or product."
}`,
        {
          systemInstruction: 'You are a world-class brand identity designer. Return only valid JSON with no extra text.',
          temperature: 0.8,
          maxTokens: 2048,
        }
      )
      const parsed = parseGeminiJSON(briefReply)

      // Step 2: SVG as plain text (separate call — no JSON truncation risk)
      setLoadingPhase('Generating SVG logo...')
      let svgCode = ''
      try {
        const svgReply = await callGemini(
          `Create a complete, valid SVG logo for a brand called "${brandName}" (${industry}, ${style} style, ${logoType}).
Colors: primary ${parsed.brief?.primaryColor || '#6366f1'}, secondary ${parsed.brief?.secondaryColor || '#818cf8'}.
Concept: ${parsed.brief?.concept || ''}

Rules:
- viewBox="0 0 400 200"
- Include brand name "${brandName}" as <text> element
- Use shapes, paths, and fills — no external images or fonts
- Self-contained, renders in a browser <img> tag
- Return ONLY the raw SVG code starting with <svg and ending with </svg>. No explanation.`,
          {
            systemInstruction: 'Return only raw SVG code. No markdown, no explanation, no code fences.',
            temperature: 0.7,
            maxTokens: 4096,
          }
        )
        // Extract just the SVG tag
        const svgMatch = svgReply.match(/<svg[\s\S]*<\/svg>/i)
        svgCode = svgMatch ? svgMatch[0] : svgReply.trim()
      } catch { /* SVG is optional */ }

      parsed.svg = svgCode

      // Step 2: Generate logo image with Gemini
      setLoadingPhase('Generating logo image...')
      let imageUrl = null
      try {
        const imgPrompt = `Design a professional ${style.toLowerCase()} logo for a ${industry.toLowerCase()} brand called "${brandName}". ${logoType} style. ${colorScheme !== 'Auto (AI picks)' ? colorScheme + ' color palette.' : ''} Clean vector-style logo on a clean background. High quality, professional brand identity design. ${parsed.brief?.concept || ''}`
        imageUrl = await generateLogoImage(imgPrompt)
      } catch {
        // Image generation is optional
      }

      // Step 3: Generate a second variation
      setLoadingPhase('Creating variation...')
      let imageUrl2 = null
      try {
        const imgPrompt2 = `Design an alternative ${style.toLowerCase()} logo concept for "${brandName}", a ${industry.toLowerCase()} brand. ${logoType} format. Minimalist, scalable, iconic design. Different from the first concept but same brand feel. Professional logo on clean background.`
        imageUrl2 = await generateLogoImage(imgPrompt2)
      } catch {
        // Optional
      }

      const result = {
        ...parsed,
        imageUrl,
        imageUrl2,
        brandName,
      }
      setResults(result)
      setHistory(prev => [{ brandName, style, industry, time: new Date(), hasImage: !!imageUrl }, ...prev.slice(0, 9)])
    } catch (err) {
      setResults({ error: err.message })
    }
    setLoading(false)
    setLoadingPhase('')
  }

  const handleCopySvg = useCallback(() => {
    if (!results?.svg) return
    navigator.clipboard.writeText(results.svg)
    setCopiedSvg(true)
    setTimeout(() => setCopiedSvg(false), 2000)
  }, [results])

  const handleCopyBrief = useCallback(() => {
    if (!results?.brief) return
    const b = results.brief
    const text = `Logo Design Brief — ${brandName}\n\nConcept: ${b.concept}\nSymbolism: ${b.symbolism}\nTypography: ${b.typography}\nColors: ${b.primaryColor}, ${b.secondaryColor}, ${b.accentColor}\nRationale: ${b.colorRationale}\nUsage: ${b.usageTips}`
    navigator.clipboard.writeText(text)
    setCopiedBrief(true)
    setTimeout(() => setCopiedBrief(false), 2000)
  }, [results, brandName])

  function handleDownloadSvg() {
    if (!results?.svg) return
    const blob = new Blob([results.svg], { type: 'image/svg+xml' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${brandName.toLowerCase().replace(/\s+/g, '-')}-logo.svg`
    a.click()
  }

  function handleDownloadImage(url, suffix = '') {
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = `${brandName.toLowerCase().replace(/\s+/g, '-')}-logo${suffix}.png`
    a.click()
  }

  function handleDownloadPng() {
    if (!results?.svg) return
    const svgStr = results.svg
    const canvas = document.createElement('canvas')
    canvas.width = 1200
    canvas.height = 600
    const ctx = canvas.getContext('2d')
    const img = new window.Image()
    img.onload = () => {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, 1200, 600)
      ctx.drawImage(img, 0, 0, 1200, 600)
      const a = document.createElement('a')
      a.href = canvas.toDataURL('image/png')
      a.download = `${brandName.toLowerCase().replace(/\s+/g, '-')}-logo.png`
      a.click()
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgStr)))
  }

  return (
    <ToolLayout icon={Hexagon} title="Logo Generator" description="AI-powered brand logo design with SVG & image output" color="#f97316">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Form */}
        <div className="space-y-4">
          <form onSubmit={handleGenerate} className="space-y-4">
            {/* Brand info */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Brand Name *</label>
                <input
                  value={brandName}
                  onChange={e => setBrandName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g., NovaTech, Bloom, Apex"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tagline <span className="text-xs text-gray-500">(optional)</span></label>
                <input
                  value={tagline}
                  onChange={e => setTagline(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  placeholder="e.g., Innovation Redefined"
                />
              </div>
            </div>

            {/* Industry */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <label className="block text-sm font-medium text-gray-300 mb-3">Industry</label>
              <div className="flex flex-wrap gap-2">
                {industries.map(ind => (
                  <button key={ind} type="button" onClick={() => setIndustry(ind)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${industry === ind ? 'bg-orange-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                    {ind}
                  </button>
                ))}
              </div>
            </div>

            {/* Style */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2"><Palette className="w-4 h-4 text-orange-400" /> Style</label>
                <div className="flex flex-wrap gap-2">
                  {styleOptions.map(s => (
                    <button key={s} type="button" onClick={() => setStyle(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${style === s ? 'bg-orange-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2"><Type className="w-4 h-4 text-orange-400" /> Logo Type</label>
                <div className="flex flex-wrap gap-2">
                  {logoTypes.map(lt => (
                    <button key={lt} type="button" onClick={() => setLogoType(lt)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${logoType === lt ? 'bg-orange-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                      {lt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Color scheme */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2"><Palette className="w-4 h-4 text-orange-400" /> Color Scheme</label>
              <div className="flex flex-wrap gap-2">
                {colorSchemes.map(cs => (
                  <button key={cs} type="button" onClick={() => setColorScheme(cs)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${colorScheme === cs ? 'bg-orange-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                    {cs}
                  </button>
                ))}
              </div>
            </div>

            {/* Extra notes */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <label className="block text-sm font-medium text-gray-300 mb-2">Additional Notes <span className="text-xs text-gray-500">(optional)</span></label>
              <textarea
                value={extraNotes}
                onChange={e => setExtraNotes(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none"
                placeholder="e.g., Include a leaf motif, avoid red, target audience is Gen Z..."
              />
            </div>

            <button type="submit" disabled={loading || !brandName.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 cursor-pointer">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              {loading ? loadingPhase || 'Generating...' : 'Generate Logo'}
            </button>
          </form>

          {/* History */}
          {history.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <h3 className="text-xs font-medium text-gray-400 mb-3 uppercase tracking-wider">Recent</h3>
              <div className="space-y-2">
                {history.map((h, i) => (
                  <div key={i} className="text-xs text-gray-500 bg-gray-800/50 rounded-lg px-3 py-2">
                    <span className="text-gray-300 font-medium">{h.brandName}</span>
                    <span className="ml-2">{h.style} &middot; {h.industry}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Results */}
        <div className="lg:col-span-2 space-y-4">
          {results?.error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">{results.error}</div>
          )}

          {loading && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-center h-[28rem]">
              <div className="text-center">
                <Loader2 className="w-10 h-10 text-orange-400 animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-400">{loadingPhase || 'Designing your logo...'}</p>
                <p className="text-xs text-gray-600 mt-1">This may take 15-30 seconds</p>
              </div>
            </div>
          )}

          {!loading && !results && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-center h-[28rem]">
              <div className="text-center text-gray-500 px-8">
                <Hexagon className="w-16 h-16 mx-auto mb-3 text-gray-600" />
                <p className="text-sm">Your AI-generated logo will appear here</p>
                <p className="text-xs text-gray-600 mt-2">Get an SVG logo, AI image, design brief, and color palette</p>
                <div className="flex items-center justify-center gap-4 mt-5 text-xs text-gray-600">
                  <span className="flex items-center gap-1"><Code className="w-3 h-3" /> SVG Code</span>
                  <span className="flex items-center gap-1"><Image className="w-3 h-3" /> AI Image</span>
                  <span className="flex items-center gap-1"><Download className="w-3 h-3" /> Export</span>
                </div>
              </div>
            </div>
          )}

          {results && !results.error && (
            <>
              {/* Tab bar */}
              <div className="flex items-center gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1.5">
                {[
                  { id: 'image', label: 'AI Image', icon: Image },
                  { id: 'svg', label: 'SVG Logo', icon: Code },
                  { id: 'brief', label: 'Design Brief', icon: Eye },
                ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                      activeTab === tab.id ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}>
                    <tab.icon className="w-4 h-4" /> {tab.label}
                  </button>
                ))}
              </div>

              {/* Image tab */}
              {activeTab === 'image' && (
                <div className="space-y-4">
                  {results.imageUrl ? (
                    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                      <div className="relative bg-[#f8f8f8] flex items-center justify-center p-8 min-h-[20rem]">
                        <img src={results.imageUrl} alt={`${brandName} logo`} className="max-w-full max-h-80 object-contain" />
                      </div>
                      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
                        <span className="text-xs text-gray-500">Concept 1 — AI Generated</span>
                        <div className="flex gap-2">
                          <button onClick={() => handleDownloadImage(results.imageUrl, '-v1')}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white text-xs rounded-lg cursor-pointer transition-colors">
                            <Download className="w-3.5 h-3.5" /> Download
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-center h-64 text-gray-500 text-sm">
                      Image generation unavailable — check the SVG tab
                    </div>
                  )}

                  {results.imageUrl2 && (
                    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                      <div className="relative bg-[#f8f8f8] flex items-center justify-center p-8 min-h-[20rem]">
                        <img src={results.imageUrl2} alt={`${brandName} logo variation`} className="max-w-full max-h-80 object-contain" />
                      </div>
                      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
                        <span className="text-xs text-gray-500">Concept 2 — Alternative</span>
                        <button onClick={() => handleDownloadImage(results.imageUrl2, '-v2')}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white text-xs rounded-lg cursor-pointer transition-colors">
                          <Download className="w-3.5 h-3.5" /> Download
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Image prompt */}
                  {results.imagePrompt && (
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                      <h4 className="text-xs font-medium text-gray-400 mb-2 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-orange-400" /> Use this prompt with DALL-E or Midjourney</h4>
                      <p className="text-xs text-gray-300 bg-gray-800 rounded-lg p-3 font-mono leading-relaxed">{results.imagePrompt}</p>
                    </div>
                  )}
                </div>
              )}

              {/* SVG tab */}
              {activeTab === 'svg' && results.svg && (
                <div className="space-y-4">
                  {/* SVG preview with background variations */}
                  {results.variations?.map((v, i) => (
                    <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800">
                        <span className="text-xs font-medium text-gray-300">{v.name}</span>
                        <span className="text-[10px] text-gray-500">{v.note}</span>
                      </div>
                      <div
                        ref={i === 0 ? svgContainerRef : undefined}
                        className="flex items-center justify-center p-8 min-h-[12rem]"
                        style={{ backgroundColor: v.bgColor }}
                        dangerouslySetInnerHTML={{ __html: results.svg }}
                      />
                    </div>
                  ))}

                  {/* SVG code */}
                  <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                      <span className="text-xs font-medium text-gray-300">SVG Code</span>
                      <div className="flex items-center gap-2">
                        <button onClick={handleCopySvg}
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-white cursor-pointer">
                          {copiedSvg ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedSvg ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>
                    <pre className="p-4 text-xs text-gray-300 overflow-x-auto font-mono leading-relaxed max-h-60 overflow-y-auto">{results.svg}</pre>
                  </div>

                  {/* Download buttons */}
                  <div className="flex gap-3">
                    <button onClick={handleDownloadSvg}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-xl cursor-pointer transition-colors">
                      <Download className="w-4 h-4" /> Download SVG
                    </button>
                    <button onClick={handleDownloadPng}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl cursor-pointer transition-colors">
                      <Download className="w-4 h-4" /> Download PNG
                    </button>
                  </div>
                </div>
              )}

              {/* Brief tab */}
              {activeTab === 'brief' && results.brief && (
                <div className="space-y-4">
                  {/* Color palette */}
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Palette className="w-4 h-4 text-orange-400" /> Color Palette</h3>
                      <button onClick={handleCopyBrief}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-white cursor-pointer">
                        {copiedBrief ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedBrief ? 'Copied!' : 'Copy Brief'}
                      </button>
                    </div>
                    <div className="flex gap-3 mb-3">
                      {[
                        { label: 'Primary', color: results.brief.primaryColor },
                        { label: 'Secondary', color: results.brief.secondaryColor },
                        { label: 'Accent', color: results.brief.accentColor },
                      ].map((c, i) => (
                        <div key={i} className="flex-1 text-center">
                          <div className="w-full h-16 rounded-xl mb-2 border border-gray-700" style={{ backgroundColor: c.color }} />
                          <span className="text-xs text-gray-400 block">{c.label}</span>
                          <span className="text-[11px] text-gray-500 font-mono">{c.color}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-3 leading-relaxed">{results.brief.colorRationale}</p>
                  </div>

                  {/* Concept */}
                  <ExpandSection title="Concept & Symbolism" icon={Sparkles} defaultOpen>
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-xs font-medium text-orange-400 mb-1 uppercase tracking-wider">Concept</h4>
                        <p className="text-sm text-gray-200 leading-relaxed">{results.brief.concept}</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-medium text-orange-400 mb-1 uppercase tracking-wider">Symbolism</h4>
                        <p className="text-sm text-gray-300 leading-relaxed">{results.brief.symbolism}</p>
                      </div>
                    </div>
                  </ExpandSection>

                  {/* Typography */}
                  <ExpandSection title="Typography" icon={Type} defaultOpen>
                    <p className="text-sm text-gray-300 leading-relaxed">{results.brief.typography}</p>
                  </ExpandSection>

                  {/* Usage tips */}
                  <ExpandSection title="Usage Guidelines" icon={Eye}>
                    <p className="text-sm text-gray-300 leading-relaxed">{results.brief.usageTips}</p>
                  </ExpandSection>
                </div>
              )}

              {/* Regenerate */}
              <button onClick={handleGenerate} disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-xl cursor-pointer transition-colors disabled:opacity-50">
                <RefreshCw className="w-4 h-4" /> Generate New Concept
              </button>
            </>
          )}
        </div>
      </div>
    </ToolLayout>
  )
}
