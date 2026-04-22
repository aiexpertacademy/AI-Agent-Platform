import { useState, useRef } from 'react'
import { Video, Sparkles, Film, Clock, Download, RotateCcw, Zap, AlertCircle, Wand2, ChevronDown, ChevronUp } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'
import { callGemini } from '../../config/gemini'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

const VEO_MODELS = [
  { id: 'veo-3.0-generate-preview', name: 'Veo 3', badge: 'Best', audio: true },
  { id: 'veo-2.0-generate-001',     name: 'Veo 2', badge: '',     audio: false },
]

const ASPECT_RATIOS = ['16:9', '9:16']
const DURATIONS = [5, 8]

const STYLE_PRESETS = [
  { label: 'Cinematic',      suffix: 'Cinematic film, dramatic lighting, shallow depth of field, movie-quality footage.' },
  { label: 'Animation',      suffix: 'Colorful 3D animation, smooth motion, vibrant colors, Pixar-style.' },
  { label: 'Documentary',    suffix: 'Documentary-style footage, natural lighting, realistic and grounded.' },
  { label: 'Drone Aerial',   suffix: 'Aerial drone shot, sweeping wide view, breathtaking perspective.' },
  { label: 'Social Reel',    suffix: 'Vertical social media reel style, fast-paced, modern, trendy.' },
  { label: 'No style',       suffix: '' },
]

// Use Gemini to convert a simple user idea into a detailed Veo-optimized prompt
async function enhancePromptForVeo(userPrompt, style, aspectRatio, duration) {
  const styleHint = style.suffix ? ` Style: ${style.label}.` : ''
  const orientHint = aspectRatio === '9:16' ? ' Vertical portrait video.' : ' Widescreen landscape video.'
  const reply = await callGemini(
    `You are a professional video prompt engineer specializing in Google Veo 3, a state-of-the-art AI video generation model.

Convert the following simple idea into a single, richly detailed Veo 3 video generation prompt. The prompt must:
- Describe the main subject and their action clearly
- Include camera movement (e.g., slow dolly in, aerial pan, tracking shot, static wide)
- Describe lighting (e.g., golden hour sunlight, soft studio lighting, neon glow, moonlight)
- Describe the environment/background in vivid detail
- Include mood, atmosphere, and color palette
- Mention motion details (e.g., hair flowing, leaves rustling, water splashing)
- Be written as a single paragraph of 3–5 sentences — NO bullet points, NO headers
- Be ${duration} seconds of video content${styleHint}${orientHint}

Simple idea: "${userPrompt}"

Return ONLY the enhanced prompt text. Nothing else — no labels, no explanation, no quotes.`,
    { temperature: 0.8, maxTokens: 300 }
  )
  return reply.trim()
}

// Start Veo video generation — returns the operation name
async function startVeoGeneration(prompt, { model, aspectRatio, durationSeconds }) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:predictLongRunning?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: {
          aspectRatio,
          durationSeconds,
          sampleCount: 1,
        },
      }),
    }
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Veo API error (${res.status})`)
  }
  const op = await res.json()
  if (!op.name) throw new Error('No operation returned from Veo API.')
  return op.name
}

// Extract video URL from a completed operation response
function extractVideoUrl(data) {
  // Standard path
  const samples = data.response?.generateVideoResponse?.generatedSamples
  if (samples?.length) {
    const video = samples[0].video
    if (video?.uri)  return { type: 'uri',    value: video.uri }
    if (video?.data) return { type: 'base64', value: video.data, mime: video.encoding || 'video/mp4' }
  }
  // Some Veo responses nest differently
  const alt = data.response?.videos?.[0] || data.response?.video
  if (alt) {
    if (alt.uri)  return { type: 'uri',    value: alt.uri }
    if (alt.data) return { type: 'base64', value: alt.data, mime: alt.mimeType || 'video/mp4' }
  }
  return null
}

// Poll the operation until done, calling onProgress(0-100) periodically
async function pollOperation(opName, onProgress) {
  const MAX_POLLS = 72   // 6 minutes max (72 × 5s)

  // opName may be absolute ("operations/xyz") or a full resource path
  const pollUrl = opName.startsWith('http')
    ? `${opName}?key=${GEMINI_API_KEY}`
    : `https://generativelanguage.googleapis.com/v1beta/${opName}?key=${GEMINI_API_KEY}`

  for (let i = 0; i < MAX_POLLS; i++) {
    await new Promise(r => setTimeout(r, 5000))
    const res = await fetch(pollUrl)
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error?.message || 'Failed to check video status.')
    }
    const data = await res.json()
    onProgress(Math.min(10 + Math.round((i / MAX_POLLS) * 85), 95))

    if (data.done) {
      if (data.error) throw new Error(data.error.message || 'Video generation failed.')

      const found = extractVideoUrl(data)
      if (!found) throw new Error('No video was generated. Try a different prompt.')

      if (found.type === 'base64') {
        const bytes = Uint8Array.from(atob(found.value), c => c.charCodeAt(0))
        return URL.createObjectURL(new Blob([bytes], { type: found.mime }))
      }
      // URI — append key if needed for auth
      const uri = found.value.startsWith('gs://')
        ? null  // GCS URIs need backend proxy — can't use directly in browser
        : found.value.includes('?')
          ? `${found.value}&key=${GEMINI_API_KEY}`
          : `${found.value}?key=${GEMINI_API_KEY}`
      if (!uri) throw new Error('Video is stored in Google Cloud Storage (gs://). A backend proxy is needed to serve it. Please contact support or use a different project setup.')
      return uri
    }
  }
  throw new Error('Video generation timed out (6 min). Please try a shorter prompt or try again.')
}

export default function VideoGenerator() {
  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState(VEO_MODELS[0].id)
  const [aspectRatio, setAspectRatio] = useState('16:9')
  const [duration, setDuration] = useState(8)
  const [style, setStyle] = useState(STYLE_PRESETS[0])

  const [status, setStatus] = useState('idle') // idle | generating | done | error
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState('')
  const [videoUrl, setVideoUrl] = useState(null)
  const [error, setError] = useState('')
  const [enhancedPrompt, setEnhancedPrompt] = useState('')
  const [showEnhanced, setShowEnhanced] = useState(false)

  const videoRef = useRef(null)
  const abortRef = useRef(false)

  async function handleGenerate(e) {
    e.preventDefault()
    if (!prompt.trim()) return

    abortRef.current = false
    setStatus('generating')
    setProgress(0)
    setError('')
    setVideoUrl(null)
    setEnhancedPrompt('')
    setShowEnhanced(false)

    // Step 1: Enhance the prompt with Gemini
    let finalPrompt = prompt.trim()
    try {
      setProgressLabel('Enhancing your prompt with AI...')
      setProgress(5)
      finalPrompt = await enhancePromptForVeo(prompt.trim(), style, aspectRatio, duration)
      if (abortRef.current) return
      setEnhancedPrompt(finalPrompt)
      setProgress(15)
    } catch {
      // If enhancement fails, fall back to raw prompt + style suffix
      finalPrompt = style.suffix ? `${prompt.trim()} ${style.suffix}` : prompt.trim()
    }

    // Step 2: Send enhanced prompt to Veo
    const orderedModels = [
      VEO_MODELS.find(m => m.id === model),
      VEO_MODELS.find(m => m.id !== model),
    ].filter(Boolean)

    let lastError = null
    for (const m of orderedModels) {
      if (abortRef.current) break
      try {
        setProgressLabel(`Starting ${m.name} generation...`)
        setProgress(20)
        const opName = await startVeoGeneration(finalPrompt, { model: m.id, aspectRatio, durationSeconds: duration })
        setProgressLabel(`${m.name} is rendering your video... (1–3 min)`)
        const url = await pollOperation(opName, (p) => {
          if (!abortRef.current) setProgress(20 + Math.round(p * 0.8))
        })
        if (abortRef.current) break
        setVideoUrl(url)
        setProgress(100)
        setProgressLabel('Done!')
        setStatus('done')
        setShowEnhanced(true)
        return
      } catch (err) {
        lastError = err
        const msg = err.message.toLowerCase()
        if (msg.includes('403') || msg.includes('404') || msg.includes('denied') || msg.includes('not found') || msg.includes('not supported')) {
          setProgressLabel(`${m.name} not available, trying ${orderedModels[1]?.name ?? 'fallback'}...`)
          continue
        }
        break
      }
    }

    if (!abortRef.current) {
      setError(lastError?.message || 'Video generation failed.')
      setStatus('error')
    }
  }

  function handleCancel() {
    abortRef.current = true
    setStatus('idle')
    setProgress(0)
    setProgressLabel('')
  }

  function handleReset() {
    abortRef.current = true
    setStatus('idle')
    setProgress(0)
    setProgressLabel('')
    setVideoUrl(null)
    setError('')
    setEnhancedPrompt('')
    setShowEnhanced(false)
  }

  function handleDownload() {
    if (!videoUrl) return
    const a = document.createElement('a')
    a.href = videoUrl
    a.download = `veo-video-${Date.now()}.mp4`
    a.click()
  }

  const selectedModel = VEO_MODELS.find(m => m.id === model)

  return (
    <ToolLayout icon={Video} title="Video Generator" description="Generate AI videos using Google Veo 3" color="#14b8a6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Controls */}
        <div className="space-y-4">
          <form onSubmit={handleGenerate} className="space-y-4">

            {/* Prompt */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <label className="block text-sm font-medium text-gray-300 mb-2">Video Prompt</label>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                rows={5}
                disabled={status === 'generating'}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none disabled:opacity-50"
                placeholder="A futuristic city at night with flying cars and neon lights..."
              />
            </div>

            {/* Settings */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">

              {/* Model */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4" /> Model
                </label>
                <div className="flex gap-2">
                  {VEO_MODELS.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setModel(m.id)}
                      disabled={status === 'generating'}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors disabled:opacity-50 flex items-center justify-center gap-1 ${
                        model === m.id ? 'bg-teal-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {m.name}
                      {m.badge && <span className="bg-yellow-500 text-black text-[9px] px-1 rounded font-bold">{m.badge}</span>}
                      {m.audio && <span className="text-[9px] text-teal-300 opacity-80">+Audio</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Duration
                </label>
                <div className="flex gap-2">
                  {DURATIONS.map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDuration(d)}
                      disabled={status === 'generating'}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors disabled:opacity-50 ${
                        duration === d ? 'bg-teal-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {d}s
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Aspect Ratio</label>
                <div className="flex gap-2">
                  {ASPECT_RATIOS.map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setAspectRatio(r)}
                      disabled={status === 'generating'}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors disabled:opacity-50 ${
                        aspectRatio === r ? 'bg-teal-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {r} {r === '16:9' ? '(Landscape)' : '(Portrait)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Style */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Film className="w-4 h-4" /> Style
                </label>
                <div className="flex flex-wrap gap-2">
                  {STYLE_PRESETS.map(s => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => setStyle(s)}
                      disabled={status === 'generating'}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors disabled:opacity-50 ${
                        style.label === s.label ? 'bg-teal-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Generate / Cancel */}
            {status !== 'generating' ? (
              <button
                type="submit"
                disabled={!prompt.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="w-5 h-5" />
                Generate Video with {selectedModel?.name}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCancel}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" /> Cancel
              </button>
            )}
          </form>

          {/* Tips */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-xs text-gray-500 space-y-1.5">
            <p className="text-gray-400 font-medium mb-2">Tips for best results</p>
            <p>• Describe motion: "slowly panning", "zooming in", "waves crashing"</p>
            <p>• Mention lighting: "golden hour", "neon lights", "soft morning glow"</p>
            <p>• Be specific about subjects and their actions</p>
            <p>• Generation takes 1–3 minutes — please wait</p>
            {selectedModel?.audio && <p className="text-teal-400">• Veo 3 generates audio automatically</p>}
          </div>
        </div>

        {/* Right: Video Player */}
        <div className="lg:col-span-2 space-y-4">

          {/* Player area */}
          <div className={`bg-gray-900 border border-gray-800 rounded-xl overflow-hidden ${aspectRatio === '9:16' ? 'max-w-xs mx-auto' : ''}`}>
            <div className={`relative bg-black ${aspectRatio === '16:9' ? 'aspect-video' : 'aspect-[9/16]'}`}>

              {status === 'done' && videoUrl ? (
                <video
                  ref={videoRef}
                  src={videoUrl}
                  controls
                  autoPlay
                  loop
                  className="w-full h-full object-contain"
                />
              ) : status === 'generating' ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-6 px-8">
                  {/* Animated ring */}
                  <div className="relative w-20 h-20">
                    <div className="absolute inset-0 rounded-full border-4 border-gray-800" />
                    <div
                      className="absolute inset-0 rounded-full border-4 border-teal-500 border-t-transparent animate-spin"
                      style={{ animationDuration: '1.2s' }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-teal-400 text-sm font-bold">{progress}%</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-white text-sm font-medium mb-1">{progressLabel}</p>
                    <p className="text-gray-500 text-xs">
                      {progress < 16
                        ? 'Gemini is crafting a detailed prompt for Veo...'
                        : 'Veo renders real video frames — this takes 1–3 min'}
                    </p>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full max-w-xs bg-gray-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-teal-500 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ) : status === 'error' ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 px-8 text-center">
                  <AlertCircle className="w-12 h-12 text-red-400" />
                  <div>
                    <p className="text-red-300 font-medium mb-2">Generation Failed</p>
                    <p className="text-gray-400 text-xs leading-relaxed">{error}</p>
                    {(error.includes('denied') || error.includes('403') || error.includes('permission')) && (
                      <p className="text-yellow-400 text-xs mt-3 leading-relaxed">
                        Veo may require special access. Make sure your Gemini API key is from a Google Cloud project
                        with the Generative Language API enabled and Veo model access granted.
                      </p>
                    )}
                  </div>
                  <button onClick={handleReset} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-xs rounded-lg cursor-pointer transition-colors">
                    Try Again
                  </button>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 px-8 text-center">
                  <Video className="w-16 h-16 text-gray-600" />
                  <div>
                    <p className="text-gray-400 text-sm">Your AI video will appear here</p>
                    <p className="text-gray-600 text-xs mt-1">Powered by Google Veo 3 — real video generation</p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom bar */}
            {status === 'done' && videoUrl && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="bg-teal-600/20 text-teal-400 px-2 py-1 rounded text-[10px] font-medium">
                    {selectedModel?.name}
                  </span>
                  <span>{aspectRatio}</span>
                  <span>{duration}s</span>
                  {selectedModel?.audio && <span className="text-teal-400">+ Audio</span>}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> New Video
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs rounded-lg cursor-pointer transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Download MP4
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Enhanced prompt card — shown during generation and after done */}
          {enhancedPrompt && (
            <div className="bg-gray-900 border border-teal-800/40 rounded-xl overflow-hidden">
              <button
                onClick={() => setShowEnhanced(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-800/40 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2 text-sm font-medium text-teal-300">
                  <Wand2 className="w-4 h-4" /> AI-Enhanced Prompt
                </span>
                {showEnhanced ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
              </button>
              {showEnhanced && (
                <div className="px-4 pb-4">
                  <p className="text-xs text-gray-300 leading-relaxed bg-gray-800/60 rounded-lg p-3 italic">
                    "{enhancedPrompt}"
                  </p>
                  <p className="text-[10px] text-gray-600 mt-2">This is the prompt that was actually sent to Veo 3.</p>
                </div>
              )}
            </div>
          )}

          {/* Info card */}
          {status === 'idle' && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-400" /> About Veo Video Generation
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs text-gray-400">
                <div className="bg-gray-800/60 rounded-lg p-3">
                  <p className="text-teal-400 font-medium mb-1">Veo 3</p>
                  <p>Google's latest model. Generates high-quality video with synchronized audio, realistic motion, and cinematic quality.</p>
                </div>
                <div className="bg-gray-800/60 rounded-lg p-3">
                  <p className="text-gray-300 font-medium mb-1">Veo 2</p>
                  <p>Previous generation model. Great quality, no audio. Use as fallback if Veo 3 is unavailable.</p>
                </div>
                <div className="bg-gray-800/60 rounded-lg p-3">
                  <p className="text-gray-300 font-medium mb-1">Generation Time</p>
                  <p>Veo renders real video frames — typically 1–3 minutes. The app will poll automatically.</p>
                </div>
                <div className="bg-gray-800/60 rounded-lg p-3">
                  <p className="text-gray-300 font-medium mb-1">API Access</p>
                  <p>Requires a Gemini API key with Veo model access enabled in your Google Cloud project.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  )
}
