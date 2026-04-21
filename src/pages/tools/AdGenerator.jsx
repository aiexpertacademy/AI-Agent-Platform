import { useState, useRef, useEffect } from 'react'
import { Megaphone, Loader2, Upload, X, Sparkles, Copy, Check, Download, RefreshCw, ChevronDown, ChevronUp, Image as ImageIcon, Palette, Type, Target, Hash, Eye, CheckCircle2, Clock, Trash2, ArrowLeft, ArrowRight, Camera, Plus, Settings, Edit3, Save, Shield } from 'lucide-react'
import html2canvas from 'html2canvas'
import ToolLayout from '../../components/ToolLayout'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../services/api'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_IMAGE_MODEL = 'gemini-2.0-flash-exp'
const API_URL = (model) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`

// Admin emails — add your email here
const ADMIN_EMAILS = [
  import.meta.env.VITE_ADMIN_EMAIL || 'admin@example.com',
]

// ─── BUILT-IN TEMPLATES (empty — all templates managed by admin via Firestore) ───
const builtInTemplates = []

const INPUT_OPTIONS = [
  { id: 'product', label: 'Product Image' },
  { id: 'person', label: 'Person Photo' },
  { id: 'person1', label: 'Person 1' },
  { id: 'person2', label: 'Person 2' },
  { id: 'logo', label: 'Logo Image' },
  { id: 'poster', label: 'Reference Poster' },
]

const inputLabels = {
  product: { label: 'Product Image', icon: ImageIcon, desc: 'Upload your product photo' },
  person: { label: 'Person Photo', icon: Camera, desc: 'Upload a clear photo of the person' },
  person1: { label: 'Person 1 (Selfie Taker)', icon: Camera, desc: 'Upload first person photo' },
  person2: { label: 'Person 2', icon: Camera, desc: 'Upload second person photo' },
  logo: { label: 'Logo Image', icon: Sparkles, desc: 'Upload your brand logo' },
  poster: { label: 'Reference Poster', icon: ImageIcon, desc: 'Upload the poster to replicate' },
}

const toneOptions = ['Luxury', 'Playful', 'Minimal', 'Bold', 'Professional', 'Urgent']
const CATEGORY_OPTIONS = ['Product', 'People', 'Creative', 'Custom']

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

// Compress image to small thumbnail for Firestore storage (max ~100KB)
function compressThumbnail(file, maxWidth = 400, quality = 0.6) {
  return new Promise((resolve) => {
    const img = new window.Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
      canvas.width = Math.round(img.width * ratio)
      canvas.height = Math.round(img.height * ratio)
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => resolve('')
    img.src = URL.createObjectURL(file)
  })
}

async function generateAdImage(promptText, images) {
  const parts = []
  for (const img of images) {
    if (img?.base64) parts.push({ inlineData: { mimeType: img.mimeType, data: img.base64 } })
  }
  parts.push({ text: promptText })
  const res = await fetch(`${API_URL(GEMINI_IMAGE_MODEL)}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts }], generationConfig: { responseModalities: ['TEXT', 'IMAGE'] } }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Image generation failed (${res.status})`)
  }
  const data = await res.json()
  const imgPart = (data.candidates?.[0]?.content?.parts || []).find(p => p.inlineData)
  if (!imgPart) throw new Error('No image was generated. Try again.')
  const byteStr = atob(imgPart.inlineData.data)
  const bytes = new Uint8Array(byteStr.length)
  for (let i = 0; i < byteStr.length; i++) bytes[i] = byteStr.charCodeAt(i)
  return URL.createObjectURL(new Blob([bytes], { type: imgPart.inlineData.mimeType }))
}

// ─── Admin Panel Component ───
function AdminPanel({ onClose }) {
  const [firestoreTemplates, setFirestoreTemplates] = useState([])
  const [editing, setEditing] = useState(null) // null = list, 'new' = creating, docId = editing
  const [saving, setSaving] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [preview, setPreview] = useState('')
  const [category, setCategory] = useState('Product')
  const [inputs, setInputs] = useState(['product'])
  const [prompt, setPrompt] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [thumbnailPreview, setThumbnailPreview] = useState('')
  const thumbRef = useRef(null)

  // Load ad templates from MongoDB
  useEffect(() => {
    api.getAdTemplates()
      .then(tpls => setFirestoreTemplates(tpls))
      .catch(err => console.error('Admin templates load error:', err.message))
  }, [])

  function resetForm() {
    setName(''); setPreview(''); setCategory('Product'); setInputs(['product'])
    setPrompt(''); setThumbnailUrl(''); setThumbnailFile(null); setThumbnailPreview('')
  }

  function startNew() {
    resetForm()
    setEditing('new')
  }

  function startEdit(tpl) {
    setName(tpl.name || '')
    setPreview(tpl.preview || '')
    setCategory(tpl.category || 'Product')
    setInputs(tpl.inputs || ['product'])
    setPrompt(tpl.prompt || '')
    setThumbnailUrl(tpl.thumbnail || '')
    setThumbnailPreview(tpl.thumbnail || '')
    setThumbnailFile(null)
    setEditing(tpl.id)
  }

  async function handleThumbnailUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setThumbnailFile(file)
    // Show compressed preview (same as what gets saved)
    const compressed = await compressThumbnail(file, 400, 0.6)
    setThumbnailPreview(compressed || URL.createObjectURL(file))
  }

  function toggleInput(id) {
    setInputs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  async function handleSave() {
    if (!name.trim() || !prompt.trim()) {
      alert('Template name and prompt are required')
      return
    }
    setSaving(true)

    try {
      // Compress thumbnail if file uploaded (Firestore 1MB doc limit)
      let thumb = thumbnailUrl || ''
      if (thumbnailFile) {
        thumb = await compressThumbnail(thumbnailFile, 400, 0.6)
        if (!thumb) thumb = ''
      }

      // If thumbnail is still too large (>500KB as base64), skip it
      if (thumb.length > 500000) {
        console.warn('Thumbnail too large, using placeholder')
        thumb = ''
      }

      const placeholder = `https://placehold.co/400x700/1a1a2e/f43f5e?text=${encodeURIComponent(name.trim().slice(0, 15))}`

      const data = {
        name: name.trim(),
        preview: preview.trim(),
        category,
        inputs,
        prompt: prompt.trim(),
        thumbnail: thumb || placeholder,
      }

      if (editing === 'new') {
        const { id } = await api.createAdTemplate(data)
        setFirestoreTemplates(prev => [{ ...data, id }, ...prev])
      } else {
        await api.updateAdTemplate(editing, data)
        setFirestoreTemplates(prev => prev.map(t => t.id === editing ? { ...t, ...data } : t))
      }
      setEditing(null)
      resetForm()
    } catch (err) {
      console.error('Save error:', err)
      alert('Save failed: ' + err.message)
    }
    setSaving(false)
  }

  async function handleDelete(id) {
    if (!confirm('Delete this template?')) return
    try {
      await api.deleteAdTemplate(id)
      setFirestoreTemplates(prev => prev.filter(t => t.id !== id))
    } catch (err) { console.error('Delete failed:', err.message) }
  }

  return (
    <div className="bg-gray-900 border border-amber-500/30 rounded-2xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-400" /> Admin — Manage Templates
        </h2>
        <div className="flex gap-2">
          {!editing && (
            <button onClick={startNew}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-xl cursor-pointer transition-colors">
              <Plus className="w-4 h-4" /> New Template
            </button>
          )}
          <button onClick={onClose}
            className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 text-sm rounded-xl cursor-pointer transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ─── Edit / Create Form ─── */}
      {editing && (
        <div className="space-y-4 bg-gray-800/50 rounded-xl p-5 mb-4 border border-gray-700">
          <h3 className="text-sm font-semibold text-amber-400">{editing === 'new' ? 'Create New Template' : 'Edit Template'}</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Template Name *</label>
              <input value={name} onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="e.g., Cinematic Product Shot" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer">
                {CATEGORY_OPTIONS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Short Description (shown to users)</label>
            <input value={preview} onChange={e => setPreview(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              placeholder="e.g., Product floating in space with cinematic lighting" />
          </div>

          {/* Thumbnail */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Preview Image (shown on template card)</label>
            <div className="flex items-start gap-4">
              {thumbnailPreview ? (
                <div className="relative">
                  <img src={thumbnailPreview} alt="" className="w-24 h-36 object-cover rounded-xl border border-gray-700" />
                  <button onClick={() => { setThumbnailPreview(''); setThumbnailFile(null); setThumbnailUrl('') }}
                    className="absolute -top-1 -right-1 p-0.5 bg-red-600 rounded-full cursor-pointer"><X className="w-3 h-3 text-white" /></button>
                </div>
              ) : null}
              <div className="flex-1 space-y-2">
                <button onClick={() => thumbRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg cursor-pointer border border-gray-700 transition-colors">
                  <Upload className="w-3.5 h-3.5" /> Upload Image
                </button>
                <input ref={thumbRef} type="file" accept="image/*" onChange={handleThumbnailUpload} className="hidden" />
                <span className="text-[10px] text-gray-600 block">or paste URL:</span>
                <input value={thumbnailUrl} onChange={e => { setThumbnailUrl(e.target.value); setThumbnailPreview(e.target.value); setThumbnailFile(null) }}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-xs placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  placeholder="https://example.com/preview.jpg" />
              </div>
            </div>
          </div>

          {/* Required Inputs */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Required Uploads (what user must upload)</label>
            <div className="flex flex-wrap gap-2">
              {INPUT_OPTIONS.map(opt => (
                <button key={opt.id} onClick={() => toggleInput(opt.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    inputs.includes(opt.id) ? 'bg-amber-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}>{opt.label}</button>
              ))}
            </div>
          </div>

          {/* Prompt */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              AI Prompt * <span className="text-gray-600">(hidden from users — sent to Gemini)</span>
            </label>
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={6}
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm font-mono placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none leading-relaxed"
              placeholder="Write the full Gemini prompt here. The uploaded images will be automatically attached. Use descriptive language for the AI to generate the ad image..." />
            <p className="text-[10px] text-gray-600 mt-1">{prompt.length} chars — Users will never see this prompt</p>
          </div>

          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving || !name.trim() || !prompt.trim()}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-xl cursor-pointer transition-colors disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : editing === 'new' ? 'Create Template' : 'Save Changes'}
            </button>
            <button onClick={() => { setEditing(null); resetForm() }}
              className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-400 text-sm rounded-xl cursor-pointer transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ─── Template List ─── */}
      {!editing && (
        <div className="space-y-2">
          {firestoreTemplates.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">No custom templates yet. Click "New Template" to create one.</p>
          ) : (
            firestoreTemplates.map(tpl => (
              <div key={tpl.id} className="flex items-center gap-4 bg-gray-800/50 rounded-xl p-3 border border-gray-700/50 group">
                {tpl.thumbnail && (
                  <img src={tpl.thumbnail} alt="" className="w-12 h-18 object-cover rounded-lg border border-gray-700 flex-shrink-0"
                    onError={e => { e.target.style.display = 'none' }} />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-white">{tpl.name}</h4>
                    <span className="text-[10px] bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full">{tpl.category}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{tpl.preview}</p>
                  <p className="text-[10px] text-gray-600 mt-0.5">Inputs: {(tpl.inputs || []).join(', ')} &middot; Prompt: {tpl.prompt?.length || 0} chars</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(tpl)}
                    className="p-2 bg-amber-600/15 hover:bg-amber-600/30 text-amber-400 rounded-lg cursor-pointer transition-colors" title="Edit template">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(tpl.id)}
                    className="p-2 bg-red-600/15 hover:bg-red-600/30 text-red-400 rounded-lg cursor-pointer transition-colors" title="Delete template">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}

        </div>
      )}
    </div>
  )
}

// ─── Main Component ───
export default function AdGenerator() {
  const { currentUser } = useAuth()
  const isAdmin = currentUser && ADMIN_EMAILS.includes(currentUser.email)

  const [step, setStep] = useState('templates')
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [filterCategory, setFilterCategory] = useState('All')
  const [showAdmin, setShowAdmin] = useState(false)

  // Firestore custom templates
  const [customTemplates, setCustomTemplates] = useState([])

  // Uploaded images
  const [uploads, setUploads] = useState({})
  const fileRefs = useRef({})

  // Ad settings
  const [brand, setBrand] = useState('')
  const [tone, setTone] = useState('Bold')
  const [extraNotes, setExtraNotes] = useState('')

  // Result
  const [generatedImage, setGeneratedImage] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  // History
  const [history, setHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const adRef = useRef(null)

  // Load ad templates from MongoDB (all users can read)
  useEffect(() => {
    api.getAdTemplates()
      .then(tpls => setCustomTemplates(tpls.map(t => ({ ...t, isCustom: true }))))
      .catch(err => console.error('Templates load error:', err.message))
  }, [])

  // Load ad history from MongoDB
  useEffect(() => {
    if (!currentUser) return
    api.getAdHistory(currentUser.uid)
      .then(list => setHistory(list))
      .catch(() => {})
  }, [currentUser])

  // Merge all templates
  const allTemplates = [...customTemplates, ...builtInTemplates]
  const allCategories = ['All', ...new Set(allTemplates.map(t => t.category))]
  const filteredTemplates = filterCategory === 'All' ? allTemplates : allTemplates.filter(t => t.category === filterCategory)

  function handleSelectTemplate(tpl) {
    setSelectedTemplate(tpl)
    setUploads({})
    setGeneratedImage(null)
    setError('')
    setStep('upload')
  }

  async function handleFileUpload(inputId, e) {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    const { base64, mimeType } = await fileToBase64(file)
    setUploads(prev => ({ ...prev, [inputId]: { file, preview: URL.createObjectURL(file), base64, mimeType } }))
  }

  function removeUpload(inputId) {
    setUploads(prev => {
      const next = { ...prev }
      if (next[inputId]?.preview) URL.revokeObjectURL(next[inputId].preview)
      delete next[inputId]
      return next
    })
  }

  const allUploaded = selectedTemplate?.inputs?.every(id => uploads[id]?.base64)

  async function handleGenerate() {
    if (!selectedTemplate || generating) return
    setGenerating(true)
    setGeneratedImage(null)
    setError('')

    try {
      const images = (selectedTemplate.inputs || []).map(id => uploads[id]).filter(Boolean)
      // Get prompt — either a string (Firestore) or function (built-in)
      let promptText = typeof selectedTemplate.prompt === 'function'
        ? selectedTemplate.prompt(images)
        : selectedTemplate.prompt

      if (brand) promptText += `. Brand name: ${brand}`
      if (tone) promptText += `. Tone: ${tone}`
      if (extraNotes) promptText += `. Additional notes: ${extraNotes}`

      const imageUrl = await generateAdImage(promptText, images)
      setGeneratedImage(imageUrl)
      setStep('result')

      if (currentUser) {
        try {
          const entry = await api.addAdHistory(currentUser.uid, {
            templateId: selectedTemplate.id, templateName: selectedTemplate.name,
            brand, tone, extraNotes,
          })
          setHistory(prev => [{ ...entry, id: entry.id }, ...prev].slice(0, 20))
        } catch { /* silent */ }
      }
    } catch (err) {
      setError(err.message)
    }
    setGenerating(false)
  }

  function handleDownload() {
    if (!generatedImage) return
    const a = document.createElement('a')
    a.href = generatedImage
    a.download = `${selectedTemplate?.name || 'ad'}-${Date.now()}.png`
    a.click()
  }

  async function handleDeleteHistory(id) {
    if (!currentUser) return
    try {
      await api.deleteAdHistory(currentUser.uid, id)
      setHistory(prev => prev.filter(h => h.id !== id))
    } catch { /* */ }
  }

  return (
    <ToolLayout icon={Megaphone} title="AI Ad Generator" description="Choose a template, upload images & generate stunning ads with AI" color="#f43f5e">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {['templates', 'upload', 'settings', 'result'].map((s, i) => {
          const labels = ['Choose Template', 'Upload Images', 'Ad Settings', 'Result']
          const isActive = step === s
          const stepNum = ['templates', 'upload', 'settings', 'result'].indexOf(step)
          const isPast = i < stepNum
          return (
            <div key={s} className="flex items-center gap-2 flex-1 min-w-0">
              <button onClick={() => { if (isPast) setStep(s) }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                  isActive ? 'bg-rose-600 text-white' : isPast ? 'bg-rose-600/20 text-rose-400 cursor-pointer' : 'bg-gray-800 text-gray-500'
                }`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isActive ? 'bg-white text-rose-600' : isPast ? 'bg-rose-400 text-white' : 'bg-gray-700 text-gray-400'
                }`}>{isPast ? <Check className="w-3 h-3" /> : i + 1}</span>
                {labels[i]}
              </button>
              {i < 3 && <div className={`flex-1 h-px min-w-2 ${i < stepNum ? 'bg-rose-500' : 'bg-gray-800'}`} />}
            </div>
          )
        })}

        <div className="flex gap-1.5 ml-2">
          {isAdmin && (
            <button onClick={() => setShowAdmin(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
                showAdmin ? 'bg-amber-600 text-white' : 'bg-amber-600/20 text-amber-400 hover:bg-amber-600/30'
              }`}>
              <Settings className="w-3.5 h-3.5" /> Admin
            </button>
          )}
          <button onClick={() => setShowHistory(v => !v)}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 text-xs rounded-xl cursor-pointer transition-colors">
            <Clock className="w-3.5 h-3.5" /> {history.length}
          </button>
        </div>
      </div>

      {/* Admin Panel */}
      {isAdmin && showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}

      {/* History */}
      {showHistory && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-semibold text-white mb-3">My Generated Ads</h3>
          {history.length === 0 ? (
            <p className="text-xs text-gray-500">No ads yet</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {history.map(item => (
                <div key={item.id} className="bg-gray-800/50 rounded-xl p-3 group">
                  <p className="text-xs font-medium text-white truncate">{item.templateName || item.brand || 'Ad'}</p>
                  <p className="text-[10px] text-gray-500">{item.createdAt?.toDate?.()?.toLocaleDateString() || ''}</p>
                  <button onClick={() => handleDeleteHistory(item.id)}
                    className="text-[10px] text-gray-600 hover:text-red-400 cursor-pointer mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Delete</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ STEP 1: Choose Template ═══ */}
      {step === 'templates' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {allCategories.map(c => (
              <button key={c} onClick={() => setFilterCategory(c)}
                className={`px-4 py-2 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                  filterCategory === c ? 'bg-rose-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}>{c}{c !== 'All' ? ` (${allTemplates.filter(t => t.category === c).length})` : ''}</button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTemplates.map(tpl => (
              <div key={tpl.id} className="relative bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-rose-500/50 hover:shadow-lg hover:shadow-rose-500/10 transition-all group">
                {/* Admin edit/delete overlay for custom templates */}
                {isAdmin && tpl.isCustom && (
                  <div className="absolute top-2 right-2 z-20 flex gap-1">
                    <button onClick={(e) => { e.stopPropagation(); setShowAdmin(true); /* AdminPanel will show and user can edit from there */ }}
                      className="p-1.5 bg-amber-600/90 hover:bg-amber-700 text-white rounded-lg cursor-pointer transition-colors shadow-lg" title="Edit in Admin Panel">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={async (e) => { e.stopPropagation(); if (confirm(`Delete "${tpl.name}"?`)) { try { await api.deleteAdTemplate(tpl.id); setCustomTemplates(prev => prev.filter(t => t.id !== tpl.id)) } catch {} } }}
                      className="p-1.5 bg-red-600/90 hover:bg-red-700 text-white rounded-lg cursor-pointer transition-colors shadow-lg" title="Delete template">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <button onClick={() => handleSelectTemplate(tpl)}
                  className="w-full text-left cursor-pointer">
                  <div className="relative aspect-[9/16] max-h-52 overflow-hidden bg-gray-800">
                    <img src={tpl.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={e => { e.target.src = `https://placehold.co/400x700/1a1a2e/f43f5e?text=${encodeURIComponent(tpl.name?.slice(0,10) || 'Ad')}` }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-center gap-1.5">
                      <span className="text-[10px] bg-rose-600/80 text-white px-2 py-0.5 rounded-full">{tpl.category}</span>
                      {tpl.isCustom && <span className="text-[10px] bg-amber-600/80 text-white px-2 py-0.5 rounded-full">Custom</span>}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-bold text-white mb-1">{tpl.name}</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">{tpl.preview}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      {(tpl.inputs || []).map(inp => (
                        <span key={inp} className="text-[10px] bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full">
                          {inputLabels[inp]?.label || inp}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ STEP 2: Upload Images ═══ */}
      {step === 'upload' && selectedTemplate && (
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => setStep('templates')} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-xl cursor-pointer transition-colors">
              <ArrowLeft className="w-4 h-4 text-gray-400" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-white">{selectedTemplate.name}</h2>
              <p className="text-xs text-gray-400">{selectedTemplate.preview}</p>
            </div>
          </div>

          <div className="space-y-4">
            {(selectedTemplate.inputs || []).map(inputId => {
              const meta = inputLabels[inputId] || { label: inputId, icon: ImageIcon, desc: 'Upload image' }
              const Icon = meta.icon
              const uploaded = uploads[inputId]
              return (
                <div key={inputId} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="w-4 h-4 text-rose-400" />
                    <span className="text-sm font-medium text-white">{meta.label}</span>
                    {uploaded && <CheckCircle2 className="w-4 h-4 text-green-400 ml-auto" />}
                  </div>
                  {uploaded ? (
                    <div className="relative">
                      <img src={uploaded.preview} alt="" className="w-full h-48 object-contain bg-gray-800 rounded-xl" />
                      <button onClick={() => removeUpload(inputId)}
                        className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black rounded-full cursor-pointer">
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => fileRefs.current[inputId]?.click()}
                      className="w-full h-36 border-2 border-dashed border-gray-700 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-rose-500/50 hover:bg-rose-500/5 transition-colors">
                      <Upload className="w-6 h-6 text-gray-500" />
                      <span className="text-xs text-gray-400">{meta.desc}</span>
                      <span className="text-[10px] text-gray-600">JPG, PNG, WEBP</span>
                    </button>
                  )}
                  <input ref={el => { fileRefs.current[inputId] = el }} type="file" accept="image/*"
                    onChange={e => handleFileUpload(inputId, e)} className="hidden" />
                </div>
              )
            })}
          </div>

          <button onClick={() => setStep('settings')} disabled={!allUploaded}
            className="w-full flex items-center justify-center gap-2 py-3 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-xl transition-colors disabled:opacity-40 cursor-pointer">
            Continue to Settings <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ═══ STEP 3: Settings ═══ */}
      {step === 'settings' && selectedTemplate && (
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => setStep('upload')} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-xl cursor-pointer transition-colors">
              <ArrowLeft className="w-4 h-4 text-gray-400" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-white">Ad Settings</h2>
              <p className="text-xs text-gray-400">Optional — customize output</p>
            </div>
          </div>

          <div className="flex gap-3">
            {(selectedTemplate.inputs || []).map(inputId => uploads[inputId] ? (
              <div key={inputId} className="relative">
                <img src={uploads[inputId].preview} alt="" className="w-20 h-20 object-cover rounded-xl border border-gray-700" />
                <span className="absolute -bottom-1 -right-1 text-[8px] bg-rose-600 text-white px-1.5 py-0.5 rounded-full">{(inputLabels[inputId]?.label || '').split(' ')[0]}</span>
              </div>
            ) : null)}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Brand Name <span className="text-gray-600">(optional)</span></label>
              <input value={brand} onChange={e => setBrand(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                placeholder="e.g., NovaTech" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Tone</label>
              <div className="flex flex-wrap gap-2">
                {toneOptions.map(t => (
                  <button key={t} onClick={() => setTone(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                      tone === t ? 'bg-rose-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                    }`}>{t}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Extra Notes <span className="text-gray-600">(optional)</span></label>
              <textarea value={extraNotes} onChange={e => setExtraNotes(e.target.value)} rows={2}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none"
                placeholder="Colors, mood, text to include..." />
            </div>
          </div>

          {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>}

          <button onClick={handleGenerate} disabled={generating}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 cursor-pointer">
            {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {generating ? 'Generating Ad Image...' : 'Generate Ad'}
          </button>
          {generating && <p className="text-xs text-gray-500 text-center">This may take 15-30 seconds...</p>}
        </div>
      )}

      {/* ═══ STEP 4: Result ═══ */}
      {step === 'result' && (
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <button onClick={() => setStep('templates')} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-xl cursor-pointer transition-colors">
                <ArrowLeft className="w-4 h-4 text-gray-400" />
              </button>
              <div>
                <h2 className="text-lg font-bold text-white">{selectedTemplate?.name}</h2>
                <p className="text-xs text-gray-400">AI Generated Ad</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleDownload}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-xl cursor-pointer transition-colors">
                <Download className="w-4 h-4" /> Download
              </button>
              <button onClick={() => { setStep('settings'); setGeneratedImage(null) }} disabled={generating}
                className="flex items-center gap-1.5 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-xl cursor-pointer transition-colors disabled:opacity-50">
                <RefreshCw className="w-4 h-4" /> Regenerate
              </button>
              <button onClick={() => { setSelectedTemplate(null); setStep('templates'); setUploads({}); setGeneratedImage(null) }}
                className="flex items-center gap-1.5 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-xl cursor-pointer transition-colors">
                <Plus className="w-4 h-4" /> New Ad
              </button>
            </div>
          </div>

          {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>}

          {generatedImage && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
              <img ref={adRef} src={generatedImage} alt="Generated Ad" className="w-full h-auto" />
            </div>
          )}

          {generating && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl flex items-center justify-center h-96">
              <div className="text-center">
                <Loader2 className="w-10 h-10 text-rose-400 animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-400">Creating your ad image...</p>
              </div>
            </div>
          )}

          {selectedTemplate && Object.keys(uploads).length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <h3 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">Source Images</h3>
              <div className="flex gap-3">
                {(selectedTemplate.inputs || []).map(inputId => uploads[inputId] ? (
                  <div key={inputId} className="text-center">
                    <img src={uploads[inputId].preview} alt="" className="w-16 h-16 object-cover rounded-xl border border-gray-700" />
                    <span className="text-[10px] text-gray-500 mt-1 block">{inputLabels[inputId]?.label}</span>
                  </div>
                ) : null)}
              </div>
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  )
}
