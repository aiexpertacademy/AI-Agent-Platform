import { useState, useRef, useEffect, useCallback } from 'react'
import { Video, Loader2, Sparkles, Film, Clock, Clapperboard, Play, Pause, SkipForward, SkipBack, ImageIcon, Download, Volume2, VolumeX, Zap, Gem, FileVideo, Music } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'
import { callGemini } from '../../config/gemini'
import { generateNanoBananaImage, isNanoBananaConfigured } from '../../config/nanoBanana'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const durations = ['15 seconds', '30 seconds', '60 seconds']
const styles = ['Cinematic', 'Animation', 'Motion Graphics', 'Documentary', 'Social Media Reel', 'Explainer']

// Generate scene image using Gemini
async function generateSceneImageGemini(visualDescription, style) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Generate a ${style.toLowerCase()} film frame: ${visualDescription}. Cinematic widescreen 16:9 aspect ratio, high quality, movie still.` }] }],
        generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
      }),
    }
  )
  if (!response.ok) throw new Error('Image generation failed')
  const data = await response.json()
  const parts = data.candidates?.[0]?.content?.parts || []
  const imagePart = parts.find((p) => p.inlineData)
  if (!imagePart) return null
  const byteString = atob(imagePart.inlineData.data)
  const bytes = new Uint8Array(byteString.length)
  for (let i = 0; i < byteString.length; i++) bytes[i] = byteString.charCodeAt(i)
  return URL.createObjectURL(new Blob([bytes], { type: imagePart.inlineData.mimeType }))
}

// Speak narration text using Web Speech API
function speakText(text) {
  return new Promise((resolve) => {
    if (!window.speechSynthesis || !text) { resolve(); return }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.9
    utterance.pitch = 1
    utterance.volume = 1
    // Pick a good voice
    const voices = window.speechSynthesis.getVoices()
    const preferred = voices.find((v) => v.name.includes('Google') && v.lang.startsWith('en')) ||
      voices.find((v) => v.lang.startsWith('en') && v.localService === false) ||
      voices.find((v) => v.lang.startsWith('en'))
    if (preferred) utterance.voice = preferred
    utterance.onend = resolve
    utterance.onerror = resolve
    window.speechSynthesis.speak(utterance)
  })
}

function stopSpeaking() {
  if (window.speechSynthesis) window.speechSynthesis.cancel()
}

// Load image into an HTMLImageElement
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export default function VideoGenerator() {
  const [prompt, setPrompt] = useState('')
  const [duration, setDuration] = useState('30 seconds')
  const [style, setStyle] = useState('Cinematic')
  const [imageEngine, setImageEngine] = useState(isNanoBananaConfigured() ? 'nano-banana' : 'gemini')
  const [loading, setLoading] = useState(false)
  const [storyboard, setStoryboard] = useState(null)
  const [sceneImages, setSceneImages] = useState({})
  const [generatingImages, setGeneratingImages] = useState({})
  const [allImagesLoading, setAllImagesLoading] = useState(false)

  // Player state
  const [currentScene, setCurrentScene] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const intervalRef = useRef(null)
  const playingRef = useRef(false)

  // Export state
  const [exporting, setExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState('')
  const canvasRef = useRef(null)

  // Load voices
  useEffect(() => {
    window.speechSynthesis?.getVoices()
    window.speechSynthesis?.addEventListener?.('voiceschanged', () => window.speechSynthesis.getVoices())
  }, [])

  // Auto-advance slideshow with narration
  useEffect(() => {
    if (!isPlaying || !storyboard) return
    playingRef.current = true

    let cancelled = false
    async function playScene(index) {
      if (cancelled || index >= storyboard.length) {
        setIsPlaying(false)
        playingRef.current = false
        return
      }
      setCurrentScene(index)
      setIsSpeaking(true)

      if (audioEnabled && storyboard[index]?.audio) {
        await speakText(storyboard[index].audio)
      } else {
        await new Promise((r) => setTimeout(r, 4000))
      }

      setIsSpeaking(false)
      if (!cancelled && playingRef.current) {
        // Small pause between scenes
        await new Promise((r) => setTimeout(r, 500))
        playScene(index + 1)
      }
    }

    playScene(currentScene)
    return () => {
      cancelled = true
      playingRef.current = false
      stopSpeaking()
      setIsSpeaking(false)
    }
  }, [isPlaying])

  async function handleGenerate(e) {
    e.preventDefault()
    if (!prompt.trim()) return
    setLoading(true)
    setStoryboard(null)
    setSceneImages({})
    setCurrentScene(0)
    setIsPlaying(false)
    stopSpeaking()
    try {
      const reply = await callGemini(
        `Create a detailed video storyboard for a ${duration} ${style.toLowerCase()} video based on this concept:

"${prompt}"

Return a JSON array (no markdown, no code fences) of scenes with this structure:
[{
  "scene": 1,
  "timestamp": "0:00 - 0:05",
  "visual": "Detailed description of what appears on screen",
  "audio": "Narration text that should be spoken aloud for this scene - write it as a natural voiceover script",
  "transition": "Cut/Fade/Zoom/Pan/etc",
  "cameraAngle": "Wide/Close-up/Aerial/etc",
  "mood": "Color palette and mood description"
}]

Generate 4-8 scenes that tell a complete story. The "audio" field must contain actual narration text to be read aloud, not sound effect descriptions.`,
        { temperature: 0.8 }
      )
      const cleaned = reply.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
      setStoryboard(JSON.parse(cleaned))
    } catch (err) {
      setStoryboard([{ scene: 1, visual: `Error: ${err.message}`, audio: '', transition: '', cameraAngle: '', mood: '', timestamp: '' }])
    }
    setLoading(false)
  }

  // Generate image for a single scene
  const generateSingleImage = useCallback(async (index, scene) => {
    setGeneratingImages((prev) => ({ ...prev, [index]: true }))
    try {
      let imageUrl
      if (imageEngine === 'nano-banana') {
        const scenePrompt = `${style} cinematic film frame: ${scene.visual}. Widescreen 16:9, high quality, movie still.`
        imageUrl = await generateNanoBananaImage(scenePrompt, { aspectRatio: '16:9', quality: '1K' })
      } else {
        imageUrl = await generateSceneImageGemini(scene.visual, style)
      }
      if (imageUrl) {
        setSceneImages((prev) => ({ ...prev, [index]: imageUrl }))
      }
    } catch {
      // silently skip failed scene
    }
    setGeneratingImages((prev) => ({ ...prev, [index]: false }))
  }, [style, imageEngine])

  // Generate all scene images
  async function handleGenerateAllImages() {
    if (!storyboard) return
    setAllImagesLoading(true)
    for (let i = 0; i < storyboard.length; i++) {
      if (!sceneImages[i]) {
        await generateSingleImage(i, storyboard[i])
      }
    }
    setAllImagesLoading(false)
  }

  // Export as video (WebM) using Canvas + MediaRecorder
  async function handleExportVideo() {
    if (!storyboard || Object.keys(sceneImages).length === 0) return
    setExporting(true)
    setExportProgress('Preparing video export...')

    try {
      const canvas = canvasRef.current || document.createElement('canvas')
      canvas.width = 1280
      canvas.height = 720
      const ctx = canvas.getContext('2d')

      const stream = canvas.captureStream(30)

      // Add audio track via oscillator (silent carrier for MediaRecorder)
      const audioCtx = new AudioContext()
      const oscillator = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()
      gainNode.gain.value = 0 // silent
      oscillator.connect(gainNode)
      gainNode.connect(audioCtx.destination)
      const audioStream = audioCtx.createMediaStreamDestination()
      gainNode.connect(audioStream)
      oscillator.start()

      // Combine video + audio
      const combined = new MediaStream([
        ...stream.getVideoTracks(),
        ...audioStream.stream.getAudioTracks(),
      ])

      const recorder = new MediaRecorder(combined, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 5000000,
      })
      const chunks = []
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }

      const donePromise = new Promise((resolve) => { recorder.onstop = resolve })
      recorder.start()

      // Render each scene
      const sceneDuration = 4000 // 4 seconds per scene
      for (let i = 0; i < storyboard.length; i++) {
        setExportProgress(`Rendering scene ${i + 1}/${storyboard.length}...`)

        // Draw scene image or black frame
        if (sceneImages[i]) {
          try {
            const img = await loadImage(sceneImages[i])
            ctx.fillStyle = '#000'
            ctx.fillRect(0, 0, 1280, 720)
            // Fit image to canvas
            const scale = Math.min(1280 / img.width, 720 / img.height)
            const w = img.width * scale
            const h = img.height * scale
            ctx.drawImage(img, (1280 - w) / 2, (720 - h) / 2, w, h)
          } catch {
            ctx.fillStyle = '#111'
            ctx.fillRect(0, 0, 1280, 720)
          }
        } else {
          ctx.fillStyle = '#111'
          ctx.fillRect(0, 0, 1280, 720)
        }

        // Overlay scene info
        ctx.fillStyle = 'rgba(0,0,0,0.5)'
        ctx.fillRect(0, 660, 1280, 60)
        ctx.fillStyle = '#fff'
        ctx.font = '16px sans-serif'
        ctx.fillText(`Scene ${i + 1} — ${storyboard[i]?.timestamp || ''}`, 20, 690)

        // Add narration text overlay
        if (storyboard[i]?.audio) {
          ctx.fillStyle = 'rgba(0,0,0,0.6)'
          ctx.fillRect(0, 600, 1280, 60)
          ctx.fillStyle = '#ddd'
          ctx.font = '14px sans-serif'
          const text = storyboard[i].audio.slice(0, 150)
          ctx.fillText(text, 20, 635)
        }

        // Wait for scene duration (render frames)
        await new Promise((r) => setTimeout(r, sceneDuration))

        // Transition: fade to black
        for (let f = 0; f < 10; f++) {
          ctx.fillStyle = `rgba(0,0,0,${f / 10})`
          ctx.fillRect(0, 0, 1280, 720)
          await new Promise((r) => setTimeout(r, 50))
        }
      }

      // Final black frame
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, 1280, 720)
      ctx.fillStyle = '#fff'
      ctx.font = '24px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Generated with AI Agent Platform', 640, 360)
      ctx.textAlign = 'start'
      await new Promise((r) => setTimeout(r, 2000))

      recorder.stop()
      oscillator.stop()
      audioCtx.close()
      await donePromise

      const blob = new Blob(chunks, { type: 'video/webm' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ai-video-${Date.now()}.webm`
      a.click()
      URL.revokeObjectURL(url)

      setExportProgress('Video exported successfully!')
      setTimeout(() => setExportProgress(''), 3000)
    } catch (err) {
      setExportProgress(`Export failed: ${err.message}`)
    }
    setExporting(false)
  }

  function handlePrev() {
    setIsPlaying(false)
    stopSpeaking()
    setCurrentScene((prev) => Math.max(0, prev - 1))
  }

  function handleNext() {
    setIsPlaying(false)
    stopSpeaking()
    setCurrentScene((prev) => Math.min((storyboard?.length || 1) - 1, prev + 1))
  }

  function togglePlay() {
    if (!storyboard) return
    if (isPlaying) {
      setIsPlaying(false)
      playingRef.current = false
      stopSpeaking()
    } else {
      if (currentScene >= storyboard.length - 1) setCurrentScene(0)
      setIsPlaying(true)
    }
  }

  // Speak current scene narration on click
  function handleSpeakScene() {
    if (!currentSceneData?.audio) return
    stopSpeaking()
    setIsSpeaking(true)
    speakText(currentSceneData.audio).then(() => setIsSpeaking(false))
  }

  const currentSceneData = storyboard?.[currentScene]
  const totalScenes = storyboard?.length || 0
  const generatedCount = Object.keys(sceneImages).length
  const nanoBananaAvailable = isNanoBananaConfigured()

  return (
    <ToolLayout icon={Video} title="Video Generator" description="Generate AI videos with scene images, narration & export" color="#14b8a6">
      <canvas ref={canvasRef} className="hidden" width={1280} height={720} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Controls */}
        <div className="space-y-4">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <label className="block text-sm font-medium text-gray-300 mb-2">Video Concept</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={5}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                placeholder="A product launch video for a futuristic smartwatch that can project holograms..."
              />
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
              {/* Image Engine */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2"><Zap className="w-4 h-4" /> Image Engine</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setImageEngine('nano-banana')}
                    disabled={!nanoBananaAvailable}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                      imageEngine === 'nano-banana' ? 'bg-gradient-to-r from-yellow-600 to-orange-600 text-white' : 'bg-gray-800 text-gray-400'
                    } ${!nanoBananaAvailable ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    Nano Banana 2
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageEngine('gemini')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                      imageEngine === 'gemini' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    Gemini
                  </button>
                </div>
                {!nanoBananaAvailable && (
                  <p className="text-[10px] text-yellow-500/60 mt-1">Add VITE_NANO_BANANA_API_KEY to .env</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2"><Clock className="w-4 h-4" /> Duration</label>
                <div className="flex gap-2">
                  {durations.map((d) => (
                    <button key={d} type="button" onClick={() => setDuration(d)} className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${duration === d ? 'bg-teal-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2"><Film className="w-4 h-4" /> Style</label>
                <div className="flex flex-wrap gap-2">
                  {styles.map((s) => (
                    <button key={s} type="button" onClick={() => setStyle(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${style === s ? 'bg-teal-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading || !prompt.trim()} className="w-full flex items-center justify-center gap-2 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 cursor-pointer">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Clapperboard className="w-5 h-5" />}
              {loading ? 'Generating Storyboard...' : 'Generate Storyboard'}
            </button>
          </form>

          {/* Action buttons */}
          {storyboard && storyboard.length > 0 && !storyboard[0]?.visual?.startsWith('Error') && (
            <div className="space-y-2">
              {/* Generate images button */}
              <button
                onClick={handleGenerateAllImages}
                disabled={allImagesLoading || generatedCount === totalScenes}
                className="w-full flex items-center justify-center gap-2 py-3 bg-pink-600 hover:bg-pink-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
              >
                {allImagesLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
                {allImagesLoading
                  ? `Generating Images (${generatedCount}/${totalScenes})...`
                  : generatedCount === totalScenes
                  ? `All ${totalScenes} Images Generated`
                  : `Generate All Scene Images`}
              </button>

              {/* Export video button */}
              {generatedCount > 0 && (
                <button
                  onClick={handleExportVideo}
                  disabled={exporting}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileVideo className="w-5 h-5" />}
                  {exporting ? exportProgress : 'Export as Video (.webm)'}
                </button>
              )}

              {exportProgress && !exporting && (
                <p className="text-xs text-center text-green-400">{exportProgress}</p>
              )}
            </div>
          )}

          {/* Scene thumbnails */}
          {storyboard && generatedCount > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <h3 className="text-xs font-medium text-gray-400 mb-3">Scene Thumbnails</h3>
              <div className="grid grid-cols-4 gap-2">
                {storyboard.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setCurrentScene(i); setIsPlaying(false); stopSpeaking() }}
                    className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                      currentScene === i ? 'border-teal-500 ring-2 ring-teal-500/30' : 'border-gray-700 hover:border-gray-500'
                    }`}
                  >
                    {sceneImages[i] ? (
                      <img src={sceneImages[i]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                        {generatingImages[i] ? (
                          <Loader2 className="w-3 h-3 text-teal-400 animate-spin" />
                        ) : (
                          <span className="text-[10px] text-gray-600">{i + 1}</span>
                        )}
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[9px] text-white text-center py-0.5">
                      Scene {i + 1}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Player + Scene details */}
        <div className="lg:col-span-2 space-y-4">
          {storyboard ? (
            <>
              {/* Video Player */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                {/* Preview area */}
                <div className="relative aspect-video bg-black">
                  {sceneImages[currentScene] ? (
                    <img
                      src={sceneImages[currentScene]}
                      alt={`Scene ${currentScene + 1}`}
                      className="w-full h-full object-contain transition-opacity duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {generatingImages[currentScene] ? (
                        <div className="text-center">
                          <Loader2 className="w-8 h-8 text-teal-400 animate-spin mx-auto mb-2" />
                          <p className="text-sm text-gray-400">Generating scene {currentScene + 1}...</p>
                        </div>
                      ) : (
                        <div className="text-center px-8">
                          <Film className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                          <p className="text-sm text-gray-400 mb-1">Scene {currentScene + 1}</p>
                          <p className="text-xs text-gray-500 leading-relaxed">{currentSceneData?.visual}</p>
                          <button
                            onClick={() => generateSingleImage(currentScene, currentSceneData)}
                            className="mt-3 px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs rounded-lg cursor-pointer transition-colors"
                          >
                            Generate This Scene
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Scene overlay info */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md font-mono">
                      {currentSceneData?.timestamp}
                    </span>
                    {currentSceneData?.cameraAngle && (
                      <span className="bg-black/70 backdrop-blur-sm text-teal-300 text-xs px-2 py-1 rounded-md">
                        {currentSceneData.cameraAngle}
                      </span>
                    )}
                  </div>
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <span className="bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md">
                      Scene {currentScene + 1} / {totalScenes}
                    </span>
                    {isSpeaking && (
                      <span className="bg-teal-600/80 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
                        <Music className="w-3 h-3 animate-pulse" /> Speaking
                      </span>
                    )}
                  </div>

                  {/* Narration subtitle overlay */}
                  {isPlaying && audioEnabled && currentSceneData?.audio && (
                    <div className="absolute bottom-12 left-4 right-4">
                      <div className="bg-black/80 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
                        <p className="text-sm text-white leading-relaxed">{currentSceneData.audio}</p>
                      </div>
                    </div>
                  )}

                  {/* Transition badge */}
                  {currentSceneData?.transition && (
                    <div className="absolute bottom-3 right-3">
                      <span className="bg-black/70 backdrop-blur-sm text-yellow-300 text-xs px-2 py-1 rounded-md">
                        {currentSceneData.transition}
                      </span>
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                <div className="h-1 bg-gray-800 flex">
                  {storyboard.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => { setCurrentScene(i); setIsPlaying(false); stopSpeaking() }}
                      className={`flex-1 transition-colors cursor-pointer ${
                        i < currentScene ? 'bg-teal-600' : i === currentScene ? 'bg-teal-400' : 'bg-gray-700'
                      }`}
                    />
                  ))}
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={handlePrev} disabled={currentScene === 0} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer disabled:opacity-30">
                      <SkipBack className="w-5 h-5" />
                    </button>
                    <button onClick={togglePlay} className="p-3 bg-teal-600 hover:bg-teal-700 rounded-full text-white transition-colors cursor-pointer">
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </button>
                    <button onClick={handleNext} disabled={currentScene >= totalScenes - 1} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer disabled:opacity-30">
                      <SkipForward className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Audio toggle */}
                    <button
                      onClick={() => { setAudioEnabled((v) => !v); if (audioEnabled) stopSpeaking() }}
                      className={`p-2 rounded-lg transition-colors cursor-pointer ${audioEnabled ? 'bg-teal-600/20 text-teal-400 hover:bg-teal-600/30' : 'bg-gray-800 text-gray-500 hover:text-white'}`}
                      title={audioEnabled ? 'Narration ON' : 'Narration OFF'}
                    >
                      {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </button>
                    {/* Speak this scene */}
                    {!isPlaying && currentSceneData?.audio && (
                      <button
                        onClick={handleSpeakScene}
                        className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
                        title="Read narration aloud"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    )}
                    <span className="text-xs text-gray-500">{duration} {style}</span>
                    {sceneImages[currentScene] && (
                      <button
                        onClick={() => {
                          const a = document.createElement('a')
                          a.href = sceneImages[currentScene]
                          a.download = `scene-${currentScene + 1}.png`
                          a.click()
                        }}
                        className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
                        title="Download scene image"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Current scene details */}
              {currentSceneData && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-8 h-8 rounded-lg bg-teal-600/20 text-teal-400 flex items-center justify-center text-sm font-bold">{currentSceneData.scene}</span>
                    <div>
                      <span className="text-sm font-medium text-white">Scene {currentSceneData.scene}</span>
                      <span className="text-xs text-gray-500 ml-2 font-mono">{currentSceneData.timestamp}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-xs font-medium text-teal-400 mb-1.5 uppercase tracking-wider">Visual</h4>
                      <p className="text-sm text-gray-200 leading-relaxed">{currentSceneData.visual}</p>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-xs font-medium text-teal-400 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                          <Volume2 className="w-3 h-3" /> Audio / Narration
                        </h4>
                        <p className="text-sm text-gray-300 leading-relaxed italic">"{currentSceneData.audio}"</p>
                        {!isPlaying && currentSceneData.audio && (
                          <button
                            onClick={handleSpeakScene}
                            className="mt-2 px-3 py-1 bg-teal-600/20 hover:bg-teal-600/30 text-teal-400 text-xs rounded-lg cursor-pointer transition-colors flex items-center gap-1"
                          >
                            <Play className="w-3 h-3" /> Play Narration
                          </button>
                        )}
                      </div>
                      {currentSceneData.mood && (
                        <div>
                          <h4 className="text-xs font-medium text-teal-400 mb-1.5 uppercase tracking-wider">Mood & Color</h4>
                          <p className="text-xs text-gray-400">{currentSceneData.mood}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* All scenes list */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-400" />
                  Full Storyboard — {totalScenes} scenes
                  <span className="ml-auto text-xs text-gray-500">
                    {imageEngine === 'nano-banana' ? 'Nano Banana 2' : 'Gemini'} images
                  </span>
                </h3>
                <div className="space-y-3">
                  {storyboard.map((scene, i) => (
                    <button
                      key={i}
                      onClick={() => { setCurrentScene(i); setIsPlaying(false); stopSpeaking() }}
                      className={`w-full flex items-center gap-4 p-3 rounded-xl text-left transition-all cursor-pointer ${
                        currentScene === i ? 'bg-teal-600/10 border border-teal-500/30' : 'bg-gray-800/50 border border-transparent hover:bg-gray-800'
                      }`}
                    >
                      <div className="w-20 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800">
                        {sceneImages[i] ? (
                          <img src={sceneImages[i]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {generatingImages[i] ? (
                              <Loader2 className="w-4 h-4 text-teal-400 animate-spin" />
                            ) : (
                              <Film className="w-4 h-4 text-gray-600" />
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${currentScene === i ? 'text-teal-400' : 'text-gray-400'}`}>Scene {scene.scene}</span>
                          <span className="text-[10px] text-gray-500 font-mono">{scene.timestamp}</span>
                          {scene.transition && <span className="text-[10px] bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded">{scene.transition}</span>}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{scene.visual}</p>
                        {scene.audio && (
                          <p className="text-[10px] text-gray-500 mt-0.5 truncate italic">{scene.audio}</p>
                        )}
                      </div>
                      {currentScene === i && isPlaying && (
                        <div className="flex gap-0.5 items-end h-4">
                          <div className="w-1 bg-teal-400 rounded-full animate-pulse" style={{ height: '60%' }} />
                          <div className="w-1 bg-teal-400 rounded-full animate-pulse" style={{ height: '100%', animationDelay: '0.15s' }} />
                          <div className="w-1 bg-teal-400 rounded-full animate-pulse" style={{ height: '40%', animationDelay: '0.3s' }} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-center h-96">
              <div className="text-center text-gray-500">
                <Video className="w-16 h-16 mx-auto mb-3 text-gray-600" />
                <p className="text-sm">Describe your video concept to generate a storyboard</p>
                <p className="text-xs text-gray-600 mt-1">AI will create scenes with images, narration & video export</p>
                <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-600">
                  <span className="flex items-center gap-1"><ImageIcon className="w-3 h-3" /> Scene Images</span>
                  <span className="flex items-center gap-1"><Volume2 className="w-3 h-3" /> Audio Narration</span>
                  <span className="flex items-center gap-1"><FileVideo className="w-3 h-3" /> Video Export</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  )
}
