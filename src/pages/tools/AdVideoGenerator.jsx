import { useState, useRef, useEffect } from 'react'
import { Film, Loader2, Upload, X, Sparkles, Download, RefreshCw, ChevronDown, ChevronUp, Image as ImageIcon, CheckCircle2, Clock, Trash2, ArrowLeft, ArrowRight, Camera, Plus, Settings, Edit3, Save, Shield, Play, Pause } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../services/api'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const VEO_MODEL = 'veo-3.1-generate-preview'
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta'

const ADMIN_EMAILS = [import.meta.env.VITE_ADMIN_EMAIL || 'admin@example.com']

const INPUT_OPTIONS = [
  { id: 'product', label: 'Product Image' },
  { id: 'person', label: 'Person Photo' },
  { id: 'person1', label: 'Person 1' },
  { id: 'person2', label: 'Person 2' },
  { id: 'logo', label: 'Logo Image' },
  { id: 'poster', label: 'Reference Poster' },
  { id: 'scene', label: 'Scene / Background' },
]

const inputLabels = {
  product: { label: 'Product Image', icon: ImageIcon, desc: 'Upload your product photo' },
  person: { label: 'Person Photo', icon: Camera, desc: 'Upload a clear photo of the person' },
  person1: { label: 'Person 1', icon: Camera, desc: 'Upload first person photo' },
  person2: { label: 'Person 2', icon: Camera, desc: 'Upload second person photo' },
  logo: { label: 'Logo Image', icon: Sparkles, desc: 'Upload your brand logo' },
  poster: { label: 'Reference Poster', icon: ImageIcon, desc: 'Upload the poster to replicate' },
  scene: { label: 'Scene / Background', icon: ImageIcon, desc: 'Upload background or scene reference' },
}

const toneOptions = ['Cinematic', 'Luxury', 'Playful', 'Minimal', 'Bold', 'Professional', 'Urgent', 'Dramatic']
const aspectOptions = ['16:9', '9:16']
const durationOptions = ['4', '6', '8']
const resolutionOptions = ['720p', '1080p']
const CATEGORY_OPTIONS = ['Product', 'People', 'Creative', 'Custom']
const builtInTemplates = []

function fileToBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve({ base64: reader.result.split(',')[1], mimeType: file.type })
    reader.readAsDataURL(file)
  })
}

function fileToDataUrl(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.readAsDataURL(file)
  })
}

function compressThumbnail(file, maxWidth = 400, quality = 0.6) {
  return new Promise((resolve) => {
    const img = new window.Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
      canvas.width = Math.round(img.width * ratio)
      canvas.height = Math.round(img.height * ratio)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => resolve('')
    img.src = URL.createObjectURL(file)
  })
}

// ─── Veo Video Generation (async with polling) ───
async function generateVideo(promptText, firstFrameImage, params = {}) {
  const instances = [{ prompt: promptText }]

  // Attach first frame image — Veo uses bytesBase64Encoded, NOT inlineData
  if (firstFrameImage?.base64) {
    instances[0].image = {
      bytesBase64Encoded: firstFrameImage.base64,
      mimeType: firstFrameImage.mimeType || 'image/jpeg',
    }
  }

  // When using image input: must be 16:9 and 8s duration
  const hasImage = !!firstFrameImage?.base64
  const parameters = {
    aspectRatio: hasImage ? '16:9' : (params.aspectRatio || '16:9'),
    resolution: params.resolution || '720p',
    durationSeconds: hasImage ? 8 : Number(params.duration) || 8,
    personGeneration: hasImage ? 'allow_adult' : 'allow_all',
    sampleCount: 1,
  }

  // Step 1: Initiate generation
  const initRes = await fetch(`${BASE_URL}/models/${VEO_MODEL}:predictLongRunning`, {
    method: 'POST',
    headers: { 'x-goog-api-key': GEMINI_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ instances, parameters }),
  })

  if (!initRes.ok) {
    const err = await initRes.json().catch(() => ({}))
    const msg = err.error?.message || ''
    // Provide helpful error messages
    if (msg.includes('not supported')) throw new Error('This feature is not available in your region or API plan. Try text-only mode (without image).')
    if (msg.includes('quota')) throw new Error('API quota exceeded. Please try again later.')
    throw new Error(msg || `Video generation failed (${initRes.status})`)
  }

  const operation = await initRes.json()
  const operationName = operation.name
  if (!operationName) throw new Error('No operation ID returned. Check your API key has Veo access enabled.')

  // Step 2: Poll for completion (max 6 minutes)
  const maxAttempts = 36
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 10000))

    const pollRes = await fetch(`${BASE_URL}/${operationName}`, {
      headers: { 'x-goog-api-key': GEMINI_API_KEY },
    })

    if (!pollRes.ok) continue

    const status = await pollRes.json()

    if (status.done) {
      // Check for error in completed operation
      if (status.error) throw new Error(status.error.message || 'Video generation failed on server')

      const samples = status.response?.generateVideoResponse?.generatedSamples
      if (samples?.[0]?.video?.uri) {
        // Fetch the video via proxy to avoid CORS
        const videoUri = samples[0].video.uri
        try {
          const vidRes = await fetch(videoUri, { headers: { 'x-goog-api-key': GEMINI_API_KEY }, redirect: 'follow' })
          if (vidRes.ok) {
            const blob = await vidRes.blob()
            return URL.createObjectURL(blob)
          }
        } catch {
          // If direct fetch fails, return the URI for the video tag to try
        }
        return videoUri
      }
      throw new Error('Video generated but no download URL returned')
    }
  }
  throw new Error('Video generation timed out (6 minutes). Try a simpler prompt.')
}

// ─── Admin Panel ───
function AdminPanel({ onClose }) {
  const [firestoreTemplates, setFirestoreTemplates] = useState([])
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [preview, setPreview] = useState('')
  const [category, setCategory] = useState('Product')
  const [inputs, setInputs] = useState(['product'])
  const [prompt, setPrompt] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [thumbnailPreview, setThumbnailPreview] = useState('')
  const thumbRef = useRef(null)

  useEffect(() => {
    api.getAdVideoTemplates()
      .then(tpls => setFirestoreTemplates(tpls))
      .catch(err => console.error('Video templates load error:', err.message))
  }, [])

  function resetForm() {
    setName(''); setPreview(''); setCategory('Product'); setInputs(['product'])
    setPrompt(''); setThumbnailUrl(''); setThumbnailFile(null); setThumbnailPreview('')
  }

  function startNew() { resetForm(); setEditing('new') }

  function startEdit(tpl) {
    setName(tpl.name || ''); setPreview(tpl.preview || ''); setCategory(tpl.category || 'Product')
    setInputs(tpl.inputs || ['product']); setPrompt(tpl.prompt || '')
    setThumbnailUrl(tpl.thumbnail || ''); setThumbnailPreview(tpl.thumbnail || ''); setThumbnailFile(null)
    setEditing(tpl.id)
  }

  async function handleThumbnailUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setThumbnailFile(file)
    setThumbnailPreview(await compressThumbnail(file, 400, 0.6) || URL.createObjectURL(file))
  }

  function toggleInput(id) { setInputs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]) }

  async function handleSave() {
    if (!name.trim() || !prompt.trim()) { alert('Name and prompt are required'); return }
    setSaving(true)
    try {
      let thumb = thumbnailUrl || ''
      if (thumbnailFile) { thumb = await compressThumbnail(thumbnailFile, 400, 0.6); if (!thumb) thumb = '' }
      if (thumb.length > 500000) thumb = ''

      const data = {
        name: name.trim(), preview: preview.trim(), category, inputs, prompt: prompt.trim(),
        thumbnail: thumb || `https://placehold.co/400x300/1a1a2e/14b8a6?text=${encodeURIComponent(name.trim().slice(0, 15))}`,
      }
      if (editing === 'new') {
        const { id } = await api.createAdVideoTemplate(data)
        setFirestoreTemplates(prev => [{ ...data, id }, ...prev])
      } else {
        await api.updateAdVideoTemplate(editing, data)
        setFirestoreTemplates(prev => prev.map(t => t.id === editing ? { ...t, ...data } : t))
      }
      setEditing(null); resetForm()
    } catch (err) { console.error('Save error:', err); alert('Save failed: ' + err.message) }
    setSaving(false)
  }

  async function handleDelete(id) {
    if (!confirm('Delete this video template?')) return
    try {
      await api.deleteAdVideoTemplate(id)
      setFirestoreTemplates(prev => prev.filter(t => t.id !== id))
    } catch (err) { console.error('Delete failed:', err.message) }
  }

  return (
    <div className="bg-gray-900 border border-amber-500/30 rounded-2xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2"><Shield className="w-5 h-5 text-amber-400" /> Admin — Video Templates</h2>
        <div className="flex gap-2">
          {!editing && <button onClick={startNew} className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-xl cursor-pointer transition-colors"><Plus className="w-4 h-4" /> New Template</button>}
          <button onClick={onClose} className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 text-sm rounded-xl cursor-pointer transition-colors"><X className="w-4 h-4" /></button>
        </div>
      </div>

      {editing && (
        <div className="space-y-4 bg-gray-800/50 rounded-xl p-5 mb-4 border border-gray-700">
          <h3 className="text-sm font-semibold text-amber-400">{editing === 'new' ? 'Create Video Template' : 'Edit Template'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Template Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-500" placeholder="e.g., Product Spin Ad" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm cursor-pointer">{CATEGORY_OPTIONS.map(c => <option key={c}>{c}</option>)}</select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Short Description</label>
            <input value={preview} onChange={e => setPreview(e.target.value)} className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-500" placeholder="e.g., Product rotating with cinematic lighting" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Preview Image</label>
            <div className="flex items-start gap-4">
              {thumbnailPreview && (
                <div className="relative">
                  <img src={thumbnailPreview} alt="" className="w-24 h-16 object-cover rounded-xl border border-gray-700" />
                  <button onClick={() => { setThumbnailPreview(''); setThumbnailFile(null); setThumbnailUrl('') }} className="absolute -top-1 -right-1 p-0.5 bg-red-600 rounded-full cursor-pointer"><X className="w-3 h-3 text-white" /></button>
                </div>
              )}
              <div className="flex-1 space-y-2">
                <button onClick={() => thumbRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg cursor-pointer border border-gray-700"><Upload className="w-3.5 h-3.5" /> Upload</button>
                <input ref={thumbRef} type="file" accept="image/*" onChange={handleThumbnailUpload} className="hidden" />
                <input value={thumbnailUrl} onChange={e => { setThumbnailUrl(e.target.value); setThumbnailPreview(e.target.value); setThumbnailFile(null) }} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-xs placeholder-gray-500" placeholder="or paste URL" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Required Uploads</label>
            <div className="flex flex-wrap gap-2">
              {INPUT_OPTIONS.map(opt => (
                <button key={opt.id} onClick={() => toggleInput(opt.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${inputs.includes(opt.id) ? 'bg-amber-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>{opt.label}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Video Prompt * <span className="text-gray-600">(hidden from users)</span></label>
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={6} className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm font-mono placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none leading-relaxed" placeholder="Describe the video scene for Veo AI to generate..." />
            <p className="text-[10px] text-gray-600 mt-1">{prompt.length} chars — sent to Veo 3.1 for video generation</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving || !name.trim() || !prompt.trim()} className="flex items-center gap-1.5 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-xl cursor-pointer disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {saving ? 'Saving...' : editing === 'new' ? 'Create' : 'Save'}
            </button>
            <button onClick={() => { setEditing(null); resetForm() }} className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-400 text-sm rounded-xl cursor-pointer">Cancel</button>
          </div>
        </div>
      )}

      {!editing && (
        <div className="space-y-2">
          {firestoreTemplates.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">No video templates yet. Click "New Template" to create one.</p>
          ) : firestoreTemplates.map(tpl => (
            <div key={tpl.id} className="flex items-center gap-4 bg-gray-800/50 rounded-xl p-3 border border-gray-700/50">
              {tpl.thumbnail && <img src={tpl.thumbnail} alt="" className="w-16 h-10 object-cover rounded-lg border border-gray-700 flex-shrink-0" onError={e => { e.target.style.display = 'none' }} />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2"><h4 className="text-sm font-medium text-white">{tpl.name}</h4><span className="text-[10px] bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full">{tpl.category}</span></div>
                <p className="text-xs text-gray-500 truncate">{tpl.preview}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => startEdit(tpl)} className="p-2 bg-amber-600/15 hover:bg-amber-600/30 text-amber-400 rounded-lg cursor-pointer"><Edit3 className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(tpl.id)} className="p-2 bg-red-600/15 hover:bg-red-600/30 text-red-400 rounded-lg cursor-pointer"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───
export default function AdVideoGenerator() {
  const { currentUser } = useAuth()
  const isAdmin = currentUser && ADMIN_EMAILS.includes(currentUser.email)

  const [step, setStep] = useState('templates')
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [filterCategory, setFilterCategory] = useState('All')
  const [showAdmin, setShowAdmin] = useState(false)

  const [customTemplates, setCustomTemplates] = useState([])
  const [uploads, setUploads] = useState({})
  const fileRefs = useRef({})

  // Video settings
  const [brand, setBrand] = useState('')
  const [tone, setTone] = useState('Cinematic')
  const [aspectRatio, setAspectRatio] = useState('9:16')
  const [duration, setDuration] = useState('8')
  const [resolution, setResolution] = useState('720p')
  const [extraNotes, setExtraNotes] = useState('')

  // Result
  const [videoUrl, setVideoUrl] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')

  // History
  const [history, setHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const videoRef = useRef(null)

  // Load video templates from MongoDB
  useEffect(() => {
    api.getAdVideoTemplates()
      .then(tpls => setCustomTemplates(tpls.map(t => ({ ...t, isCustom: true }))))
      .catch(err => console.error('Video templates load error:', err.message))
  }, [])

  // Load video history from MongoDB
  useEffect(() => {
    if (!currentUser) return
    api.getVideoHistory(currentUser.uid)
      .then(list => setHistory(list))
      .catch(() => {})
  }, [currentUser])

  const allTemplates = [...customTemplates, ...builtInTemplates]
  const allCategories = ['All', ...new Set(allTemplates.map(t => t.category))]
  const filteredTemplates = filterCategory === 'All' ? allTemplates : allTemplates.filter(t => t.category === filterCategory)

  function handleSelectTemplate(tpl) {
    setSelectedTemplate(tpl); setUploads({}); setVideoUrl(null); setError(''); setStep('upload')
  }

  async function handleFileUpload(inputId, e) {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    const { base64, mimeType } = await fileToBase64(file)
    setUploads(prev => ({ ...prev, [inputId]: { file, preview: URL.createObjectURL(file), base64, mimeType } }))
  }

  function removeUpload(inputId) {
    setUploads(prev => { const n = { ...prev }; if (n[inputId]?.preview) URL.revokeObjectURL(n[inputId].preview); delete n[inputId]; return n })
  }

  const allUploaded = selectedTemplate?.inputs?.every(id => uploads[id]?.base64)

  async function handleGenerate() {
    if (!selectedTemplate || generating) return
    setGenerating(true); setVideoUrl(null); setError(''); setProgress('Preparing video generation...')

    try {
      const images = (selectedTemplate.inputs || []).map(id => uploads[id]).filter(Boolean)
      let promptText = selectedTemplate.prompt || ''
      if (brand) promptText += `. Brand: ${brand}`
      if (tone) promptText += `. Tone: ${tone}`
      if (extraNotes) promptText += `. ${extraNotes}`

      // Use first uploaded image as the first frame reference
      const firstFrame = images[0] || null

      setProgress('Sending to Veo 3.1 AI... (this takes 1-5 minutes)')
      const url = await generateVideo(promptText, firstFrame, { aspectRatio, duration, resolution })
      setVideoUrl(url)
      setStep('result')

      if (currentUser) {
        try {
          const entry = await api.addVideoHistory(currentUser.uid, {
            templateId: selectedTemplate.id, templateName: selectedTemplate.name,
            brand, tone, aspectRatio, duration, videoUrl: url,
          })
          setHistory(prev => [{ ...entry, id: entry.id }, ...prev].slice(0, 20))
        } catch {}
      }
    } catch (err) {
      setError(err.message)
    }
    setGenerating(false); setProgress('')
  }

  function handleDownload() {
    if (!videoUrl) return
    const a = document.createElement('a')
    a.href = videoUrl
    a.download = `${selectedTemplate?.name || 'ad-video'}-${Date.now()}.mp4`
    a.target = '_blank'
    a.click()
  }

  async function handleDeleteHistory(id) {
    if (!currentUser) return
    try {
      await api.deleteVideoHistory(currentUser.uid, id)
      setHistory(prev => prev.filter(h => h.id !== id))
    } catch {}
  }

  const stepLabels = ['Choose Template', 'Upload Images', 'Video Settings', 'Result']
  const steps = ['templates', 'upload', 'settings', 'result']

  return (
    <ToolLayout icon={Film} title="AI Ad Video Generator" description="Choose a template, upload images & generate stunning ad videos with AI" color="#14b8a6">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {steps.map((s, i) => {
          const isActive = step === s
          const stepNum = steps.indexOf(step)
          const isPast = i < stepNum
          return (
            <div key={s} className="flex items-center gap-2 flex-1 min-w-0">
              <button onClick={() => { if (isPast) setStep(s) }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${isActive ? 'bg-teal-600 text-white' : isPast ? 'bg-teal-600/20 text-teal-400 cursor-pointer' : 'bg-gray-800 text-gray-500'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${isActive ? 'bg-white text-teal-600' : isPast ? 'bg-teal-400 text-white' : 'bg-gray-700 text-gray-400'}`}>
                  {isPast ? <CheckCircle2 className="w-3 h-3" /> : i + 1}
                </span>
                {stepLabels[i]}
              </button>
              {i < 3 && <div className={`flex-1 h-px min-w-2 ${i < stepNum ? 'bg-teal-500' : 'bg-gray-800'}`} />}
            </div>
          )
        })}
        <div className="flex gap-1.5 ml-2">
          {isAdmin && (
            <button onClick={() => setShowAdmin(v => !v)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs cursor-pointer ${showAdmin ? 'bg-amber-600 text-white' : 'bg-amber-600/20 text-amber-400'}`}>
              <Settings className="w-3.5 h-3.5" /> Admin
            </button>
          )}
          <button onClick={() => setShowHistory(v => !v)} className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 text-xs rounded-xl cursor-pointer">
            <Clock className="w-3.5 h-3.5" /> {history.length}
          </button>
        </div>
      </div>

      {isAdmin && showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}

      {showHistory && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-semibold text-white mb-3">My Generated Videos</h3>
          {history.length === 0 ? <p className="text-xs text-gray-500">No videos yet</p> : (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {history.map(item => (
                <div key={item.id} className="bg-gray-800/50 rounded-xl p-3 group">
                  <p className="text-xs font-medium text-white truncate">{item.templateName || 'Video'}</p>
                  <p className="text-[10px] text-gray-500">{item.createdAt?.toDate?.()?.toLocaleDateString() || ''}</p>
                  {item.videoUrl && <a href={item.videoUrl} target="_blank" rel="noreferrer" className="text-[10px] text-teal-400 hover:underline">Watch</a>}
                  <button onClick={() => handleDeleteHistory(item.id)} className="text-[10px] text-gray-600 hover:text-red-400 cursor-pointer mt-1 opacity-0 group-hover:opacity-100 block">Delete</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* STEP 1: Templates */}
      {step === 'templates' && (
        <div className="space-y-4">
          {allTemplates.length === 0 && !isAdmin && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-center h-64">
              <div className="text-center text-gray-500"><Film className="w-12 h-12 mx-auto mb-3 text-gray-600" /><p className="text-sm">No video templates available yet</p><p className="text-xs text-gray-600 mt-1">Admin needs to create templates first</p></div>
            </div>
          )}
          {allTemplates.length > 0 && (
            <>
              <div className="flex gap-2 flex-wrap">
                {allCategories.map(c => (
                  <button key={c} onClick={() => setFilterCategory(c)} className={`px-4 py-2 rounded-xl text-xs font-medium cursor-pointer ${filterCategory === c ? 'bg-teal-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>{c}</button>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredTemplates.map(tpl => (
                  <div key={tpl.id} className="relative bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-teal-500/50 hover:shadow-lg hover:shadow-teal-500/10 transition-all group">
                    {isAdmin && tpl.isCustom && (
                      <div className="absolute top-2 right-2 z-20 flex gap-1">
                        <button onClick={(e) => { e.stopPropagation(); setShowAdmin(true) }} className="p-1.5 bg-amber-600/90 hover:bg-amber-700 text-white rounded-lg cursor-pointer shadow-lg"><Edit3 className="w-3.5 h-3.5" /></button>
                        <button onClick={async (e) => { e.stopPropagation(); if (confirm(`Delete "${tpl.name}"?`)) { try { await api.deleteAdVideoTemplate(tpl.id); setCustomTemplates(prev => prev.filter(t => t.id !== tpl.id)) } catch {} } }} className="p-1.5 bg-red-600/90 hover:bg-red-700 text-white rounded-lg cursor-pointer shadow-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    )}
                    <button onClick={() => handleSelectTemplate(tpl)} className="w-full text-left cursor-pointer">
                      <div className="relative aspect-video overflow-hidden bg-gray-800">
                        <img src={tpl.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={e => { e.target.src = `https://placehold.co/600x340/1a1a2e/14b8a6?text=${encodeURIComponent(tpl.name?.slice(0, 10) || 'Video')}` }} />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><div className="w-14 h-14 rounded-full bg-teal-600/80 flex items-center justify-center"><Play className="w-6 h-6 text-white ml-1" /></div></div>
                        <div className="absolute bottom-3 left-3 flex gap-1.5">
                          <span className="text-[10px] bg-teal-600/80 text-white px-2 py-0.5 rounded-full">{tpl.category}</span>
                          <span className="text-[10px] bg-gray-900/80 text-gray-300 px-2 py-0.5 rounded-full"><Film className="w-3 h-3 inline" /> Video</span>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="text-sm font-bold text-white mb-1">{tpl.name}</h3>
                        <p className="text-xs text-gray-400">{tpl.preview}</p>
                        <div className="flex items-center gap-1.5 mt-2">{(tpl.inputs || []).map(inp => (<span key={inp} className="text-[10px] bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full">{inputLabels[inp]?.label || inp}</span>))}</div>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* STEP 2: Upload */}
      {step === 'upload' && selectedTemplate && (
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => setStep('templates')} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-xl cursor-pointer"><ArrowLeft className="w-4 h-4 text-gray-400" /></button>
            <div><h2 className="text-lg font-bold text-white">{selectedTemplate.name}</h2><p className="text-xs text-gray-400">{selectedTemplate.preview}</p></div>
          </div>
          <div className="space-y-4">
            {(selectedTemplate.inputs || []).map(inputId => {
              const meta = inputLabels[inputId] || { label: inputId, icon: ImageIcon, desc: 'Upload image' }
              const Icon = meta.icon; const uploaded = uploads[inputId]
              return (
                <div key={inputId} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3"><Icon className="w-4 h-4 text-teal-400" /><span className="text-sm font-medium text-white">{meta.label}</span>{uploaded && <CheckCircle2 className="w-4 h-4 text-green-400 ml-auto" />}</div>
                  {uploaded ? (
                    <div className="relative"><img src={uploaded.preview} alt="" className="w-full h-48 object-contain bg-gray-800 rounded-xl" /><button onClick={() => removeUpload(inputId)} className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black rounded-full cursor-pointer"><X className="w-4 h-4 text-white" /></button></div>
                  ) : (
                    <button onClick={() => fileRefs.current[inputId]?.click()} className="w-full h-36 border-2 border-dashed border-gray-700 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-teal-500/50 hover:bg-teal-500/5 transition-colors"><Upload className="w-6 h-6 text-gray-500" /><span className="text-xs text-gray-400">{meta.desc}</span></button>
                  )}
                  <input ref={el => { fileRefs.current[inputId] = el }} type="file" accept="image/*" onChange={e => handleFileUpload(inputId, e)} className="hidden" />
                </div>
              )
            })}
          </div>
          <button onClick={() => setStep('settings')} disabled={!allUploaded} className="w-full flex items-center justify-center gap-2 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl disabled:opacity-40 cursor-pointer">Continue to Settings <ArrowRight className="w-4 h-4" /></button>
        </div>
      )}

      {/* STEP 3: Settings */}
      {step === 'settings' && selectedTemplate && (
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => setStep('upload')} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-xl cursor-pointer"><ArrowLeft className="w-4 h-4 text-gray-400" /></button>
            <div><h2 className="text-lg font-bold text-white">Video Settings</h2><p className="text-xs text-gray-400">Configure your ad video output</p></div>
          </div>

          <div className="flex gap-3">{(selectedTemplate.inputs || []).map(id => uploads[id] ? (<div key={id} className="relative"><img src={uploads[id].preview} alt="" className="w-20 h-20 object-cover rounded-xl border border-gray-700" /></div>) : null)}</div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Brand Name <span className="text-gray-600">(optional)</span></label>
              <input value={brand} onChange={e => setBrand(e.target.value)} className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-teal-500" placeholder="e.g., NovaTech" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Tone</label>
              <div className="flex flex-wrap gap-2">{toneOptions.map(t => (<button key={t} onClick={() => setTone(t)} className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${tone === t ? 'bg-teal-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>{t}</button>))}</div>
            </div>
            {/* Note: image-to-video forces 16:9 and 8s */}
            {Object.keys(uploads).length > 0 && (
              <div className="bg-teal-500/5 border border-teal-500/15 rounded-lg px-3 py-2">
                <p className="text-[11px] text-teal-400">Image-to-video mode: aspect ratio locked to 16:9 and duration to 8s (Veo 3.1 requirement)</p>
              </div>
            )}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">Aspect Ratio</label>
                <div className="flex gap-2">{aspectOptions.map(a => (<button key={a} onClick={() => setAspectRatio(a)} disabled={Object.keys(uploads).length > 0} className={`flex-1 py-2 rounded-lg text-xs font-medium cursor-pointer text-center ${aspectRatio === a ? 'bg-teal-600 text-white' : 'bg-gray-800 text-gray-400'} disabled:opacity-50`}>{a}</button>))}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">Duration</label>
                <div className="flex gap-2">{durationOptions.map(d => (<button key={d} onClick={() => setDuration(d)} disabled={Object.keys(uploads).length > 0} className={`flex-1 py-2 rounded-lg text-xs font-medium cursor-pointer text-center ${duration === d ? 'bg-teal-600 text-white' : 'bg-gray-800 text-gray-400'} disabled:opacity-50`}>{d}s</button>))}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">Resolution</label>
                <div className="flex gap-2">{resolutionOptions.map(r => (<button key={r} onClick={() => setResolution(r)} className={`flex-1 py-2 rounded-lg text-xs font-medium cursor-pointer text-center ${resolution === r ? 'bg-teal-600 text-white' : 'bg-gray-800 text-gray-400'}`}>{r}</button>))}</div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Extra Notes <span className="text-gray-600">(optional)</span></label>
              <textarea value={extraNotes} onChange={e => setExtraNotes(e.target.value)} rows={2} className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none" placeholder="Camera movement, mood, specific actions..." />
            </div>
          </div>

          {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>}

          <button onClick={handleGenerate} disabled={generating} className="w-full flex items-center justify-center gap-2 py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl disabled:opacity-50 cursor-pointer">
            {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {generating ? progress : 'Generate Ad Video'}
          </button>

          {generating && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden mb-3"><div className="h-full bg-teal-500 rounded-full animate-pulse" style={{ width: '60%' }} /></div>
              <p className="text-xs text-gray-400">{progress}</p>
              <p className="text-[10px] text-gray-600 mt-1">Veo 3.1 AI video generation typically takes 1-5 minutes. Please wait...</p>
            </div>
          )}
        </div>
      )}

      {/* STEP 4: Result */}
      {step === 'result' && (
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <button onClick={() => setStep('templates')} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-xl cursor-pointer"><ArrowLeft className="w-4 h-4 text-gray-400" /></button>
              <div><h2 className="text-lg font-bold text-white">{selectedTemplate?.name}</h2><p className="text-xs text-gray-400">AI Generated Ad Video</p></div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleDownload} className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-xl cursor-pointer"><Download className="w-4 h-4" /> Download</button>
              <button onClick={() => { setStep('settings'); setVideoUrl(null) }} disabled={generating} className="flex items-center gap-1.5 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-xl cursor-pointer disabled:opacity-50"><RefreshCw className="w-4 h-4" /> Regenerate</button>
              <button onClick={() => { setSelectedTemplate(null); setStep('templates'); setUploads({}); setVideoUrl(null) }} className="flex items-center gap-1.5 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-xl cursor-pointer"><Plus className="w-4 h-4" /> New</button>
            </div>
          </div>

          {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>}

          {videoUrl && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
              <video ref={videoRef} src={videoUrl} controls autoPlay loop className="w-full" style={{ aspectRatio: aspectRatio === '9:16' ? '9/16' : '16/9', maxHeight: '600px', objectFit: 'contain', backgroundColor: '#000' }} />
            </div>
          )}

          {selectedTemplate && Object.keys(uploads).length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">Source Images</h3>
              <div className="flex gap-3">{(selectedTemplate.inputs || []).map(id => uploads[id] ? (<div key={id} className="text-center"><img src={uploads[id].preview} alt="" className="w-16 h-16 object-cover rounded-xl border border-gray-700" /><span className="text-[10px] text-gray-500 mt-1 block">{inputLabels[id]?.label}</span></div>) : null)}</div>
            </div>
          )}

          <div className="bg-teal-500/5 border border-teal-500/15 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-400">Video generated by <span className="text-teal-400 font-medium">Google Veo 3.1</span> &middot; {duration}s &middot; {resolution} &middot; {aspectRatio}</p>
          </div>
        </div>
      )}
    </ToolLayout>
  )
}
