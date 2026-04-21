import { useState, useRef } from 'react'
import { Sparkles, Loader2, Download, RefreshCw, Upload, X, Image as ImageIcon, Palette, Eye, Wand2, Copy, Check, ChevronDown, ChevronUp, Star } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'
import { callGemini, parseGeminiJSON } from '../../config/gemini'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

const animeStyles = [
  { id: 'classic', label: 'Classic Anime', desc: 'Traditional anime look (Ghibli / 90s vibe)' },
  { id: 'modern', label: 'Modern Anime', desc: 'Clean lines, vivid colors (Makoto Shinkai)' },
  { id: 'chibi', label: 'Chibi', desc: 'Cute, super-deformed proportions' },
  { id: 'shonen', label: 'Shonen', desc: 'Action-packed, dynamic poses (Naruto / MHA)' },
  { id: 'shojo', label: 'Shojo', desc: 'Soft, elegant, dreamy (Sailor Moon)' },
  { id: 'cyberpunk', label: 'Cyberpunk Anime', desc: 'Neon-lit, futuristic (Ghost in the Shell)' },
  { id: 'watercolor', label: 'Watercolor Anime', desc: 'Soft washes, painterly edges' },
  { id: 'pixel', label: 'Pixel Art Anime', desc: 'Retro game-style sprites' },
  { id: 'dark', label: 'Dark / Gothic', desc: 'Moody atmosphere (Berserk / Tokyo Ghoul)' },
  { id: 'comic', label: 'Manga Panel', desc: 'Black & white manga illustration' },
]

const backgrounds = ['Auto', 'Cherry Blossoms', 'City Skyline', 'Forest', 'Classroom', 'Beach Sunset', 'Starry Night', 'Neon Alley', 'Mountain Temple', 'Plain White', 'None (Transparent feel)']
const expressions = ['Auto', 'Happy', 'Determined', 'Mysterious', 'Shy', 'Angry', 'Peaceful', 'Surprised', 'Cool / Stoic', 'Crying', 'Laughing']
const poses = ['Auto', 'Standing', 'Action / Fighting', 'Sitting', 'Running', 'Portrait (Headshot)', 'Full Body', 'Side Profile', 'Looking Back', 'Group Shot']

// Convert file to base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]
      resolve({ base64, mimeType: file.type })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Analyze uploaded photo with Gemini vision
async function analyzePhoto(base64, mimeType) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inlineData: { mimeType, data: base64 } },
            { text: `Analyze this photo for anime art conversion. Describe in detail:
1. The person's appearance: hair color, length, style; eye color; skin tone; facial features; body type
2. Their clothing and accessories
3. Their pose and expression
4. The background/setting
5. The overall mood and lighting

Be very specific and visual. This description will be used to generate anime art. Return only the description, no preamble.` },
          ],
        }],
        generationConfig: { temperature: 0.5, maxOutputTokens: 1024 },
      }),
    }
  )
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error?.message || 'Photo analysis failed')
  }
  const data = await response.json()
  const parts = data.candidates?.[0]?.content?.parts || []
  const text = parts.filter(p => p.text && !p.thought).map(p => p.text).join('\n').trim()
  return text || parts.find(p => p.text)?.text || ''
}

// Generate anime image with Gemini image model
async function generateAnimeImage(prompt) {
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
  if (!imgPart) throw new Error('No image returned — try rephrasing your description')
  const byteStr = atob(imgPart.inlineData.data)
  const bytes = new Uint8Array(byteStr.length)
  for (let i = 0; i < byteStr.length; i++) bytes[i] = byteStr.charCodeAt(i)
  return URL.createObjectURL(new Blob([bytes], { type: imgPart.inlineData.mimeType }))
}

// Craft an optimized anime prompt via Gemini text
async function craftAnimePrompt(description, style, background, expression, pose) {
  const styleObj = animeStyles.find(s => s.id === style)
  const reply = await callGemini(
    `You are an expert anime art prompt engineer. Convert this character description into a highly detailed anime art prompt optimized for AI image generation.

CHARACTER DESCRIPTION:
${description}

STYLE: ${styleObj?.label} — ${styleObj?.desc}
BACKGROUND: ${background}
EXPRESSION: ${expression}
POSE: ${pose}

Return a JSON object (no markdown, no code fences):
{
  "prompt": "The full, detailed anime art generation prompt. Include specific anime art keywords, quality boosters, and style references. Structure: subject description, pose, expression, clothing details, background, art style, lighting, quality tags. Make it vivid and specific.",
  "negativePrompt": "Things to avoid (low quality, blurry, deformed, etc.)",
  "characterSummary": "2-sentence summary of the character for display",
  "colorPalette": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"],
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}`,
    {
      systemInstruction: 'You are a master anime artist and prompt engineer. Return only valid JSON.',
      temperature: 0.8,
      maxTokens: 4096,
    }
  )
  return parseGeminiJSON(reply)
}

export default function AnimeArtMaker() {
  const [mode, setMode] = useState('text') // 'text' or 'photo'
  const [description, setDescription] = useState('')
  const [animeStyle, setAnimeStyle] = useState('modern')
  const [background, setBackground] = useState('Auto')
  const [expression, setExpression] = useState('Auto')
  const [pose, setPose] = useState('Auto')

  // Photo upload
  const [uploadedPhoto, setUploadedPhoto] = useState(null) // { file, preview, base64, mimeType }
  const fileRef = useRef(null)

  // Generation state
  const [loading, setLoading] = useState(false)
  const [phase, setPhase] = useState('')
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [copiedPrompt, setCopiedPrompt] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)
  const [generating2, setGenerating2] = useState(false)

  async function handleFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return
    const { base64, mimeType } = await fileToBase64(file)
    setUploadedPhoto({
      file,
      preview: URL.createObjectURL(file),
      base64,
      mimeType,
    })
    setDescription('')
  }

  function removePhoto() {
    if (uploadedPhoto?.preview) URL.revokeObjectURL(uploadedPhoto.preview)
    setUploadedPhoto(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleGenerate(e) {
    e.preventDefault()
    if (mode === 'text' && !description.trim()) return
    if (mode === 'photo' && !uploadedPhoto) return
    if (loading) return

    setLoading(true)
    setResult(null)

    try {
      let charDescription = description

      // Step 1: If photo mode, analyze the photo first
      if (mode === 'photo' && uploadedPhoto) {
        setPhase('Analyzing your photo...')
        charDescription = await analyzePhoto(uploadedPhoto.base64, uploadedPhoto.mimeType)
      }

      // Step 2: Craft the anime prompt
      setPhase('Crafting anime art prompt...')
      const promptData = await craftAnimePrompt(charDescription, animeStyle, background, expression, pose)

      // Step 3: Generate the anime image
      setPhase('Generating anime artwork...')
      const animePrompt = `${promptData.prompt}. Anime illustration, high quality anime art, detailed anime drawing, beautiful anime style.`
      let imageUrl = null
      try {
        imageUrl = await generateAnimeImage(animePrompt)
      } catch {
        // Try a simplified prompt on failure
        setPhase('Retrying with adjusted prompt...')
        const simpler = `Anime illustration of ${charDescription}. ${animeStyles.find(s => s.id === animeStyle)?.label} style. High quality anime art, detailed, vibrant colors.`
        imageUrl = await generateAnimeImage(simpler)
      }

      const res = {
        imageUrl,
        imageUrl2: null,
        promptData,
        charDescription,
        style: animeStyles.find(s => s.id === animeStyle)?.label,
      }
      setResult(res)
      setHistory(prev => [{
        imageUrl,
        style: res.style,
        time: new Date(),
        summary: promptData.characterSummary?.slice(0, 50),
      }, ...prev.slice(0, 11)])
    } catch (err) {
      setResult({ error: err.message })
    }
    setLoading(false)
    setPhase('')
  }

  // Generate a second variation
  async function handleGenerateVariation() {
    if (!result?.promptData || generating2) return
    setGenerating2(true)
    try {
      const altPrompt = `${result.promptData.prompt}. Alternative composition, different angle. Anime illustration, high quality anime art, detailed anime drawing.`
      const url2 = await generateAnimeImage(altPrompt)
      setResult(prev => ({ ...prev, imageUrl2: url2 }))
    } catch {
      // Silently fail
    }
    setGenerating2(false)
  }

  function handleDownload(url, suffix = '') {
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = `anime-art${suffix}-${Date.now()}.png`
    a.click()
  }

  function handleCopyPrompt() {
    if (!result?.promptData?.prompt) return
    navigator.clipboard.writeText(result.promptData.prompt)
    setCopiedPrompt(true)
    setTimeout(() => setCopiedPrompt(false), 2000)
  }

  const selectedStyleObj = animeStyles.find(s => s.id === animeStyle)

  return (
    <ToolLayout icon={Sparkles} title="Anime Art Maker" description="Transform photos or descriptions into anime art" color="#e879f9">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Controls */}
        <div className="space-y-4">
          <form onSubmit={handleGenerate} className="space-y-4">
            {/* Mode toggle */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-1.5 flex gap-1">
              <button type="button" onClick={() => setMode('text')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                  mode === 'text' ? 'bg-fuchsia-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}>
                <Wand2 className="w-4 h-4" /> Describe Character
              </button>
              <button type="button" onClick={() => setMode('photo')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                  mode === 'photo' ? 'bg-fuchsia-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}>
                <Upload className="w-4 h-4" /> Upload Photo
              </button>
            </div>

            {/* Text input OR Photo upload */}
            {mode === 'text' ? (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <label className="block text-sm font-medium text-gray-300 mb-2">Character Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 resize-none"
                  placeholder="A young warrior girl with long silver hair and bright blue eyes, wearing a dark cloak with golden armor underneath. She carries a glowing sword and has a small dragon perched on her shoulder..."
                />
              </div>
            ) : (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <label className="block text-sm font-medium text-gray-300 mb-3">Upload a Photo</label>
                {uploadedPhoto ? (
                  <div className="relative">
                    <img src={uploadedPhoto.preview} alt="Uploaded" className="w-full h-48 object-cover rounded-xl" />
                    <button type="button" onClick={removePhoto}
                      className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black rounded-full cursor-pointer transition-colors">
                      <X className="w-4 h-4 text-white" />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg">
                      <span className="text-xs text-green-400">Photo ready</span>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="w-full h-48 border-2 border-dashed border-gray-700 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-fuchsia-500/50 hover:bg-fuchsia-500/5 transition-colors">
                    <Upload className="w-8 h-8 text-gray-500" />
                    <span className="text-sm text-gray-400">Click to upload a photo</span>
                    <span className="text-xs text-gray-600">JPG, PNG, WebP</span>
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                <p className="text-[11px] text-gray-600 mt-2">AI will analyze your photo and convert it to anime style</p>
              </div>
            )}

            {/* Anime Style */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                <Palette className="w-4 h-4 text-fuchsia-400" /> Anime Style
              </label>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {animeStyles.map(s => (
                  <button key={s.id} type="button" onClick={() => setAnimeStyle(s.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left cursor-pointer transition-all ${
                      animeStyle === s.id
                        ? 'bg-fuchsia-600/15 border border-fuchsia-500/30 ring-1 ring-fuchsia-500/20'
                        : 'bg-gray-800/50 border border-transparent hover:bg-gray-800'
                    }`}>
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm font-medium ${animeStyle === s.id ? 'text-fuchsia-300' : 'text-gray-300'}`}>{s.label}</span>
                      <p className="text-[11px] text-gray-500 truncate">{s.desc}</p>
                    </div>
                    {animeStyle === s.id && <Star className="w-4 h-4 text-fuchsia-400 fill-fuchsia-400 flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Fine-tuning options */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Background</label>
                <div className="flex flex-wrap gap-1.5">
                  {backgrounds.map(bg => (
                    <button key={bg} type="button" onClick={() => setBackground(bg)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium cursor-pointer transition-colors ${
                        background === bg ? 'bg-fuchsia-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                      }`}>{bg}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Expression</label>
                <div className="flex flex-wrap gap-1.5">
                  {expressions.map(ex => (
                    <button key={ex} type="button" onClick={() => setExpression(ex)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium cursor-pointer transition-colors ${
                        expression === ex ? 'bg-fuchsia-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                      }`}>{ex}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Pose</label>
                <div className="flex flex-wrap gap-1.5">
                  {poses.map(p => (
                    <button key={p} type="button" onClick={() => setPose(p)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium cursor-pointer transition-colors ${
                        pose === p ? 'bg-fuchsia-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                      }`}>{p}</button>
                  ))}
                </div>
              </div>
            </div>

            <button type="submit"
              disabled={loading || (mode === 'text' ? !description.trim() : !uploadedPhoto)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 cursor-pointer">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              {loading ? (phase || 'Generating...') : 'Generate Anime Art'}
            </button>
          </form>

          {/* History thumbnails */}
          {history.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <h3 className="text-xs font-medium text-gray-400 mb-3 uppercase tracking-wider">Recent Creations</h3>
              <div className="grid grid-cols-4 gap-2">
                {history.map((h, i) => (
                  <button key={i} onClick={() => setResult(prev => prev ? { ...prev, imageUrl: h.imageUrl } : { imageUrl: h.imageUrl })}
                    className="aspect-square rounded-lg overflow-hidden border border-gray-700 hover:border-fuchsia-500 transition-colors cursor-pointer">
                    <img src={h.imageUrl} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Results */}
        <div className="lg:col-span-2 space-y-4">
          {result?.error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">{result.error}</div>
          )}

          {loading && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-center h-[28rem]">
              <div className="text-center">
                <div className="relative mx-auto w-16 h-16 mb-4">
                  <Loader2 className="w-16 h-16 text-fuchsia-400 animate-spin absolute" />
                  <Sparkles className="w-6 h-6 text-fuchsia-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-sm text-gray-400">{phase || 'Creating your anime art...'}</p>
                <p className="text-xs text-gray-600 mt-1">This usually takes 15-30 seconds</p>
              </div>
            </div>
          )}

          {!loading && !result && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-center h-[28rem]">
              <div className="text-center text-gray-500 px-8">
                <div className="text-6xl mb-4 opacity-40">
                  {/* Anime sparkle icon using unicode */}
                  <span className="inline-block animate-pulse">{'\u2728'}</span>
                </div>
                <p className="text-sm">Your anime artwork will appear here</p>
                <p className="text-xs text-gray-600 mt-2">Upload a photo or describe a character to get started</p>
                <div className="flex items-center justify-center gap-4 mt-5 text-xs text-gray-600">
                  <span className="flex items-center gap-1"><Upload className="w-3 h-3" /> Photo to Anime</span>
                  <span className="flex items-center gap-1"><Wand2 className="w-3 h-3" /> Text to Anime</span>
                  <span className="flex items-center gap-1"><Download className="w-3 h-3" /> Download HD</span>
                </div>
              </div>
            </div>
          )}

          {result && !result.error && (
            <>
              {/* Main artwork */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                {result.imageUrl && (
                  <div className="relative group">
                    <div className="bg-gray-950 flex items-center justify-center p-4 min-h-[22rem]">
                      <img src={result.imageUrl} alt="Anime art" className="max-w-full max-h-[32rem] object-contain rounded-lg" />
                    </div>
                    {/* Overlay controls */}
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleDownload(result.imageUrl)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-black/70 backdrop-blur-sm hover:bg-black text-white text-xs rounded-lg cursor-pointer transition-colors">
                        <Download className="w-3.5 h-3.5" /> Download
                      </button>
                    </div>
                    {/* Style badge */}
                    <div className="absolute top-3 left-3">
                      <span className="bg-fuchsia-600/80 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-lg font-medium">
                        {result.style}
                      </span>
                    </div>
                  </div>
                )}

                {/* Action bar */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleDownload(result.imageUrl)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-xs font-medium rounded-lg cursor-pointer transition-colors">
                      <Download className="w-3.5 h-3.5" /> Download HD
                    </button>
                    <button onClick={handleGenerate} disabled={loading}
                      className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white text-xs rounded-lg cursor-pointer transition-colors disabled:opacity-50">
                      <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                    </button>
                    <button onClick={handleGenerateVariation} disabled={generating2}
                      className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white text-xs rounded-lg cursor-pointer transition-colors disabled:opacity-50">
                      {generating2 ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
                      {generating2 ? 'Generating...' : 'Variation'}
                    </button>
                  </div>
                  <span className="text-xs text-gray-500">Powered by Gemini AI</span>
                </div>
              </div>

              {/* Second variation */}
              {result.imageUrl2 && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                  <div className="bg-gray-950 flex items-center justify-center p-4 min-h-[18rem]">
                    <img src={result.imageUrl2} alt="Anime art variation" className="max-w-full max-h-[28rem] object-contain rounded-lg" />
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
                    <span className="text-xs text-gray-500">Variation</span>
                    <button onClick={() => handleDownload(result.imageUrl2, '-v2')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white text-xs rounded-lg cursor-pointer transition-colors">
                      <Download className="w-3.5 h-3.5" /> Download
                    </button>
                  </div>
                </div>
              )}

              {/* Prompt & Details */}
              {result.promptData && (
                <>
                  {/* Character summary + tags */}
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                          <Eye className="w-4 h-4 text-fuchsia-400" /> Character
                        </h3>
                        <p className="text-sm text-gray-300 mt-1 leading-relaxed">{result.promptData.characterSummary}</p>
                      </div>
                    </div>
                    {/* Color palette */}
                    {result.promptData.colorPalette?.length > 0 && (
                      <div className="flex gap-2 mb-3">
                        {result.promptData.colorPalette.map((c, i) => (
                          <div key={i} className="flex flex-col items-center gap-1">
                            <div className="w-10 h-10 rounded-lg border border-gray-700" style={{ backgroundColor: c }} />
                            <span className="text-[9px] text-gray-500 font-mono">{c}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Tags */}
                    {result.promptData.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {result.promptData.tags.map((tag, i) => (
                          <span key={i} className="text-[11px] bg-fuchsia-500/10 text-fuchsia-300 px-2.5 py-1 rounded-full border border-fuchsia-500/20">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Expandable prompt section */}
                  <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                    <button onClick={() => setShowPrompt(v => !v)}
                      className="w-full flex items-center gap-2 px-5 py-3.5 cursor-pointer text-left">
                      <Wand2 className="w-4 h-4 text-fuchsia-400" />
                      <span className="flex-1 text-sm font-medium text-gray-300">Generated Prompt</span>
                      <span className="text-[10px] text-gray-500 mr-2">Use with Stable Diffusion / Midjourney</span>
                      {showPrompt ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                    </button>
                    {showPrompt && (
                      <div className="px-5 pb-5 space-y-3">
                        <div className="relative group">
                          <pre className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-xs text-gray-200 leading-relaxed whitespace-pre-wrap font-mono">
                            {result.promptData.prompt}
                          </pre>
                          <button onClick={handleCopyPrompt}
                            className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 bg-gray-700/80 hover:bg-gray-600 text-white text-xs rounded-lg cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                            {copiedPrompt ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                            {copiedPrompt ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                        {result.promptData.negativePrompt && (
                          <div>
                            <span className="text-xs font-medium text-red-400 mb-1 block">Negative Prompt</span>
                            <p className="text-xs text-gray-400 bg-gray-800 rounded-lg p-3 font-mono">{result.promptData.negativePrompt}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Photo comparison if in photo mode */}
                  {mode === 'photo' && uploadedPhoto && (
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                      <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-fuchsia-400" /> Before & After
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <img src={uploadedPhoto.preview} alt="Original" className="w-full aspect-square object-cover rounded-xl" />
                          <p className="text-xs text-gray-500 text-center mt-2">Original Photo</p>
                        </div>
                        <div>
                          <img src={result.imageUrl} alt="Anime" className="w-full aspect-square object-cover rounded-xl" />
                          <p className="text-xs text-fuchsia-400 text-center mt-2">Anime Version</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </ToolLayout>
  )
}
