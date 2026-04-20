import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../services/api'
import { generateResumeContent } from './gemini'
import templates from './templates'
import TemplateSelector from './TemplateSelector'
import ResumePreview from './ResumePreview'
import SavedResumes from './SavedResumes'
import CustomTemplateCreator from './CustomTemplateCreator'
import ResumeTemplateGallery from './ResumeTemplateGallery'
import {
  Sparkles,
  Download,
  Save,
  Loader2,
  ChevronDown,
  ChevronUp,
  FileText,
  Eye,
  RotateCcw,
  Camera,
  X,
  Printer,
  Code2,
  Wand2,
  ArrowLeft,
  LayoutTemplate,
} from 'lucide-react'

const emptyForm = {
  fullName: '',
  jobTitle: '',
  email: '',
  phone: '',
  location: '',
  linkedin: '',
  website: '',
  photo: '',
  summary: '',
  skills: '',
  languages: '',
  experience: '',
  education: '',
  projects: '',
  awards: '',
  hobbies: '',
}

export default function ResumeBuilder() {
  const { currentUser } = useAuth()
  const iframeRef = useRef(null)

  // Phase: 'gallery' → pick template, 'builder' → fill form
  const [phase, setPhase] = useState('gallery')

  const [formData, setFormData] = useState(emptyForm)
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0])
  const [generated, setGenerated] = useState(null) // HTML string | null
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showSaved, setShowSaved] = useState(false)
  const [activeResumeId, setActiveResumeId] = useState(null)
  const [activeTab, setActiveTab] = useState('form')

  // Custom templates — persisted to Firestore
  const [customTemplates, setCustomTemplates] = useState([])
  const [showCreator, setShowCreator] = useState(false)
  const [templateSaving, setTemplateSaving] = useState(false)

  // Seed resume templates on first load
  useEffect(() => {
    fetch('/api/resume-templates/seed', { method: 'POST' }).catch(() => {})
  }, [])

  // Load custom templates from MongoDB on mount / user change
  useEffect(() => {
    if (!currentUser) { setCustomTemplates([]); return }
    api.getCustomTemplates(currentUser.uid)
      .then(list => setCustomTemplates(list.map(t => ({ ...t, isCustom: true }))))
      .catch(err => console.error('Failed to load custom templates:', err.message))
  }, [currentUser])

  function handlePickTemplate(dbTemplate) {
    setSelectedTemplate(dbTemplate)
    setPhase('builder')
  }

  function handlePickScratch() {
    setSelectedTemplate(templates[0])
    setPhase('builder')
  }

  async function handleSaveCustomTemplate(tmpl) {
    if (!currentUser) { setError('Please log in to save templates'); return }
    if (customTemplates.some(t => t.html === tmpl.html)) return
    setTemplateSaving(true)
    try {
      const { id } = await api.saveCustomTemplate(currentUser.uid, {
        name: tmpl.name,
        prompt: tmpl.prompt,
        html: tmpl.html,
        accentColor: tmpl.accentColor,
        style: tmpl.style,
        preview: tmpl.preview,
        category: 'Custom',
        description: tmpl.description || tmpl.prompt,
        isCustom: true,
      })
      setCustomTemplates(prev => [{ ...tmpl, id, isCustom: true }, ...prev])
    } catch (err) {
      setError(`Failed to save template: ${err.message}`)
    }
    setTemplateSaving(false)
  }

  async function handleDeleteCustomTemplate(id) {
    if (!currentUser) return
    try {
      await api.deleteCustomTemplate(currentUser.uid, id)
      setCustomTemplates(prev => prev.filter(t => t.id !== id))
      if (selectedTemplate?.id === id) setSelectedTemplate(templates[0])
    } catch (err) {
      setError(`Failed to delete template: ${err.message}`)
    }
  }

  // Called when user clicks "Use Template" in the creator
  async function handleUseTemplate({ html, accentColor, usedPrompt, name }) {
    const existing = customTemplates.find(t => t.html === html)
    if (existing) {
      setSelectedTemplate(existing)
    } else {
      const tmplData = {
        name: name || 'Custom Template',
        prompt: usedPrompt,
        html,
        accentColor,
        isCustom: true,
        category: 'Custom',
        description: usedPrompt,
        preview: `linear-gradient(135deg, ${accentColor} 0%, #1a1a2e 100%)`,
        style: {
          fontFamily: 'Arial, sans-serif',
          headerBg: accentColor,
          headerText: '#ffffff',
          accentColor,
          bodyFont: 'Arial, sans-serif',
          sectionBorder: `2px solid ${accentColor}`,
        },
      }
      if (currentUser) {
        try {
          const { id } = await api.saveCustomTemplate(currentUser.uid, tmplData)
          const saved = { ...tmplData, id, isCustom: true }
          setCustomTemplates(prev => [saved, ...prev])
          setSelectedTemplate(saved)
        } catch (err) {
          console.error('Failed to save template:', err)
          setSelectedTemplate({ id: `custom_${Date.now()}`, ...tmplData })
        }
      } else {
        setSelectedTemplate({ id: `custom_${Date.now()}`, ...tmplData })
      }
    }
    setShowCreator(false)
  }

  function handleChange(e) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handlePhotoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Please upload an image file'); return }
    if (file.size > 2 * 1024 * 1024) { setError('Image must be under 2MB'); return }
    const reader = new FileReader()
    reader.onload = () => setFormData((prev) => ({ ...prev, photo: reader.result }))
    reader.readAsDataURL(file)
  }

  function handleRemovePhoto() {
    setFormData((prev) => ({ ...prev, photo: '' }))
  }

  async function handleGenerate(e) {
    e.preventDefault()
    if (!formData.fullName.trim()) { setError('Please enter your full name'); return }
    setError('')
    setSuccess('')
    setGenerating(true)
    try {
      const html = await generateResumeContent(formData, selectedTemplate)
      setGenerated(html)
      setActiveTab('preview')
    } catch (err) {
      setError(`Generation failed: ${err.message}`)
    }
    setGenerating(false)
  }

  // Print-to-PDF via browser's native print dialog (respects A4 @media print CSS in the generated HTML)
  function handlePrint() {
    if (!generated) return
    const iframe = iframeRef.current
    if (!iframe) return
    try {
      iframe.contentWindow.focus()
      iframe.contentWindow.print()
    } catch {
      // Fallback: open in new tab and print from there
      const blob = new Blob([generated], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const win = window.open(url, '_blank')
      win?.addEventListener('load', () => { win.print() })
    }
  }

  // Download the generated HTML file directly
  function handleDownloadHTML() {
    if (!generated) return
    setDownloading(true)
    try {
      const blob = new Blob([generated], { type: 'text/html;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${formData.fullName || 'resume'}_cv.html`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(`Download failed: ${err.message}`)
    }
    setDownloading(false)
  }

  async function handleSave() {
    if (!currentUser) return
    setSaving(true)
    setError('')
    try {
      const { id } = await api.saveResume(currentUser.uid, {
        resumeId: activeResumeId || null,
        formData,
        generated: generated || null,
        templateId: selectedTemplate.id,
        templateName: selectedTemplate.name,
      })
      setActiveResumeId(id)
      setSuccess('Resume saved!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(`Save failed: ${err.message}`)
    }
    setSaving(false)
  }

  function handleLoadResume(resume) {
    setFormData(resume.formData || emptyForm)
    const g = resume.generated
    setGenerated(typeof g === 'string' ? g : null)
    const tmpl = templates.find((t) => t.id === resume.templateId) || templates[0]
    setSelectedTemplate(tmpl)
    setActiveResumeId(resume.id)
    setShowSaved(false)
    setPhase('builder')
    setSuccess('Resume loaded!')
    setTimeout(() => setSuccess(''), 3000)
  }

  function handleReset() {
    setFormData(emptyForm)
    setGenerated(null)
    setActiveResumeId(null)
    setError('')
    setSuccess('')
  }

  const inputCls = 'w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
  const textareaCls = `${inputCls} resize-none`
  const labelCls = 'block text-sm font-medium text-gray-300 mb-1'
  const hintCls = 'text-xs text-gray-500 mt-1'

  // ── Gallery phase ─────────────────────────────────────────────────────────────
  if (phase === 'gallery' && !showCreator) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <FileText className="w-7 h-7 text-indigo-400" />
              Resume Builder
            </h1>
            <p className="text-gray-400 text-sm mt-1">AI-powered professional resume generator</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreator(true)}
              className="flex items-center gap-2 px-3 py-2 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/40 text-violet-300 rounded-lg text-sm transition-colors cursor-pointer"
            >
              <Wand2 className="w-4 h-4" /> AI Designer
            </button>
            <button
              onClick={() => setShowSaved(!showSaved)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors cursor-pointer"
            >
              {showSaved ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Saved
            </button>
          </div>
        </div>
        {showSaved && (
          <div className="mb-6 bg-gray-900 border border-gray-800 rounded-xl p-4">
            <SavedResumes onLoad={(resume) => { handleLoadResume(resume); setPhase('builder') }} />
          </div>
        )}
        <ResumeTemplateGallery
          onUseTemplate={handlePickTemplate}
          onScratch={handlePickScratch}
        />
      </div>
    )
  }

  // ── Template Designer full-width view ────────────────────────────────────────
  if (showCreator) {
    return (
      <div>
        {/* Creator top bar */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setShowCreator(false)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">AI Template Designer</h1>
              <p className="text-gray-400 text-sm">
                Describe a style — AI designs the full resume template. Saved templates appear in the Custom tab.
              </p>
            </div>
          </div>
        </div>

        <CustomTemplateCreator
          savedTemplates={customTemplates}
          onSave={handleSaveCustomTemplate}
          onDelete={handleDeleteCustomTemplate}
          onUse={handleUseTemplate}
        />
      </div>
    )
  }

  // ── Normal Resume Builder view ────────────────────────────────────────────────
  return (
    <div>
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPhase('gallery')}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
            title="Back to templates"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <FileText className="w-7 h-7 text-indigo-400" />
              Resume Builder
            </h1>
            {/* Selected template badge */}
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: selectedTemplate.accentColor || '#6366f1' }} />
              <span className="text-gray-400 text-sm">{selectedTemplate.name}</span>
              <button
                onClick={() => setPhase('gallery')}
                className="text-indigo-400 hover:text-indigo-300 text-xs underline cursor-pointer transition-colors"
              >
                Change
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreator(true)}
            className="flex items-center gap-2 px-3 py-2 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/40 text-violet-300 rounded-lg text-sm transition-colors cursor-pointer"
          >
            <Wand2 className="w-4 h-4" /> AI Designer
          </button>
          <button onClick={handleReset} className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors cursor-pointer">
            <RotateCcw className="w-4 h-4" /> New
          </button>
          <button onClick={() => setShowSaved(!showSaved)} className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors cursor-pointer">
            {showSaved ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Saved
          </button>
        </div>
      </div>

      {/* Saved resumes panel */}
      {showSaved && (
        <div className="mb-6 bg-gray-900 border border-gray-800 rounded-xl p-4">
          <SavedResumes onLoad={handleLoadResume} />
        </div>
      )}

      {/* Alerts */}
      {error && <div className="mb-4 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>}
      {success && <div className="mb-4 bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg text-sm">{success}</div>}

      {/* Mobile tabs */}
      <div className="flex lg:hidden mb-4 bg-gray-900 rounded-lg p-1">
        <button onClick={() => setActiveTab('form')} className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${activeTab === 'form' ? 'bg-indigo-600 text-white' : 'text-gray-400'}`}>
          <FileText className="w-4 h-4 inline mr-1" /> Form
        </button>
        <button onClick={() => setActiveTab('preview')} className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${activeTab === 'preview' ? 'bg-indigo-600 text-white' : 'text-gray-400'}`}>
          <Eye className="w-4 h-4 inline mr-1" /> Preview
        </button>
      </div>

      {/* Main grid */}
      <div className="flex gap-6">
        {/* ─── Left: Form ─── */}
        <div className={`w-full lg:w-[480px] lg:flex-shrink-0 ${activeTab === 'form' ? 'block' : 'hidden lg:block'}`}>
          <form onSubmit={handleGenerate} className="space-y-5">

            {/* Template selector */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <TemplateSelector
                selectedId={selectedTemplate.id}
                onSelect={setSelectedTemplate}
                customTemplates={customTemplates}
                onDeleteCustom={handleDeleteCustomTemplate}
                onToggleCreator={() => setShowCreator(true)}
                showCreatorButton
              />
            </div>

            {/* ── Personal Information ── */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
              <h2 className="text-white font-semibold text-sm">Personal Information</h2>

              {/* Photo upload */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  {formData.photo ? (
                    <div className="relative">
                      <img src={formData.photo} alt="Profile" className="w-20 h-20 rounded-full object-cover border-2 border-gray-700" />
                      <button type="button" onClick={handleRemovePhoto} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center cursor-pointer transition-colors">
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-20 h-20 rounded-full bg-gray-800 border-2 border-dashed border-gray-600 hover:border-indigo-500 flex flex-col items-center justify-center cursor-pointer transition-colors">
                      <Camera className="w-5 h-5 text-gray-500" />
                      <span className="text-[10px] text-gray-500 mt-1">Photo</span>
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  <p className="text-gray-400 font-medium">Profile Photo <span className="text-gray-600">(optional)</span></p>
                  <p className="mt-0.5">JPG or PNG, max 2MB</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelCls}>Full Name *</label>
                  <input name="fullName" value={formData.fullName} onChange={handleChange} className={inputCls} placeholder="John Doe" required />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Job Title / Tagline</label>
                  <input name="jobTitle" value={formData.jobTitle} onChange={handleChange} className={inputCls} placeholder="Senior Software Engineer | Full-Stack Developer" />
                </div>
                <div>
                  <label className={labelCls}>Email</label>
                  <input name="email" type="email" value={formData.email} onChange={handleChange} className={inputCls} placeholder="john@example.com" />
                </div>
                <div>
                  <label className={labelCls}>Phone</label>
                  <input name="phone" value={formData.phone} onChange={handleChange} className={inputCls} placeholder="+1 (555) 123-4567" />
                </div>
                <div>
                  <label className={labelCls}>Location</label>
                  <input name="location" value={formData.location} onChange={handleChange} className={inputCls} placeholder="San Francisco, CA" />
                </div>
                <div>
                  <label className={labelCls}>LinkedIn</label>
                  <input name="linkedin" value={formData.linkedin} onChange={handleChange} className={inputCls} placeholder="linkedin.com/in/johndoe" />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Portfolio / Website</label>
                  <input name="website" value={formData.website} onChange={handleChange} className={inputCls} placeholder="johndoe.dev" />
                </div>
              </div>
            </div>

            {/* ── Professional Summary ── */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <label className={labelCls}>Professional Summary</label>
              <textarea name="summary" value={formData.summary} onChange={handleChange} rows={3} className={textareaCls} placeholder="Brief overview of your career, key strengths, and what you bring to the table..." />
            </div>

            {/* ── Work Experience ── */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <label className={labelCls}>Work Experience</label>
              <textarea name="experience" value={formData.experience} onChange={handleChange} rows={8} className={textareaCls}
                placeholder={`Senior Software Engineer at Google (2021 - Present, Mountain View, CA)\n- Led frontend architecture redesign, improving load time by 40%\n- Mentored 5 junior developers\n\nSoftware Engineer at Startup Inc (2018 - 2021, San Francisco, CA)\n- Built microservices processing 1M+ events/day`}
              />
              <p className={hintCls}>Include job title, company, dates, location, and achievements. AI will enhance the bullet points.</p>
            </div>

            {/* ── Education ── */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <label className={labelCls}>Education</label>
              <textarea name="education" value={formData.education} onChange={handleChange} rows={4} className={textareaCls}
                placeholder={`B.S. Computer Science, Stanford University (2014 - 2018)\nGPA: 3.8/4.0, Dean's List`}
              />
            </div>

            {/* ── Skills ── */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <label className={labelCls}>Skills</label>
              <textarea name="skills" value={formData.skills} onChange={handleChange} rows={3} className={textareaCls} placeholder="JavaScript, React, Node.js, Python, AWS, Docker, SQL, Git, Agile, REST APIs..." />
              <p className={hintCls}>Comma-separated. AI will organize into categories.</p>
            </div>

            {/* ── Languages ── */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <label className={labelCls}>Languages</label>
              <input name="languages" value={formData.languages} onChange={handleChange} className={inputCls} placeholder="English (Native), Hindi (Fluent), Spanish (Intermediate)" />
            </div>

            {/* ── Projects ── */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <label className={labelCls}>Projects <span className="text-gray-600 font-normal">(optional)</span></label>
              <textarea name="projects" value={formData.projects} onChange={handleChange} rows={5} className={textareaCls}
                placeholder={`AI Chat Platform (React, Node.js, OpenAI)\n- Built a multi-user chat platform with AI responses, 500+ active users\n- Deployed on AWS with 99.9% uptime\n\nPortfolio Website (Next.js, Tailwind)\n- Personal portfolio with blog and project showcases`}
              />
            </div>

            {/* ── Awards & Achievements ── */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <label className={labelCls}>Awards & Achievements <span className="text-gray-600 font-normal">(optional)</span></label>
              <textarea name="awards" value={formData.awards} onChange={handleChange} rows={3} className={textareaCls}
                placeholder={`- Hackathon Winner, TechFest 2023 (1st place out of 200 teams)\n- Dean's List, 4 consecutive semesters\n- Google Developer Student Club Lead 2022`}
              />
            </div>

            {/* ── Hobbies ── */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <label className={labelCls}>Hobbies & Interests <span className="text-gray-600 font-normal">(optional)</span></label>
              <input name="hobbies" value={formData.hobbies} onChange={handleChange} className={inputCls} placeholder="Open-source contribution, Chess, Photography, Running" />
            </div>

            {/* Generate button */}
            <button
              type="submit"
              disabled={generating}
              className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              {generating ? 'Generating with AI...' : 'Generate Resume'}
            </button>

            {/* Post-generation actions */}
            {generated && (
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={handlePrint}
                  className="flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Print / PDF
                </button>
                <button type="button" onClick={handleDownloadHTML} disabled={downloading}
                  className="flex items-center justify-center gap-2 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Code2 className="w-4 h-4" />}
                  {downloading ? 'Saving...' : 'Download HTML'}
                </button>
                <button type="button" onClick={handleSave} disabled={saving}
                  className="col-span-2 flex items-center justify-center gap-2 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Saving...' : 'Save to Cloud'}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* ─── Right: Live preview ─── */}
        <div className={`flex-1 min-w-0 ${activeTab === 'preview' ? 'block' : 'hidden lg:block'}`}>
          <div className="sticky top-24">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-gray-400">
                {generated ? 'AI Generated — ' : 'Live Preview — '}
                <span className="text-indigo-400">{selectedTemplate.name}</span>
              </h2>
              {generated && (
                <div className="flex items-center gap-2">
                  <button onClick={handlePrint}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print / PDF
                  </button>
                  <button onClick={handleDownloadHTML}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> HTML
                  </button>
                </div>
              )}
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
              <div className="overflow-auto max-h-[calc(100vh-180px)]">
                <div
                  style={{
                    width: '210mm',
                    minHeight: '297mm',
                    transform: 'scale(0.55)',
                    transformOrigin: 'top left',
                    marginBottom: '-45%',
                  }}
                >
                  <ResumePreview
                    ref={iframeRef}
                    formData={formData}
                    generated={generated}
                    template={selectedTemplate}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
