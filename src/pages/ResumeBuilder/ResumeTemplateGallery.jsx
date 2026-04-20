import { useState, useEffect } from 'react'
import { Loader2, Star, LayoutTemplate, Wand2, ChevronLeft } from 'lucide-react'

const CATEGORIES = ['All', 'Professional', 'Creative', 'Tech', 'Academic', 'Executive']

// ── Mini CV preview drawn with CSS ────────────────────────────────────────────
function CvThumbnail({ template }) {
  const { layout, accentColor, headerBg, sidebarBg, headerText } = template
  const line = 'rgba(0,0,0,0.13)'
  const isLightHeader = headerText !== '#ffffff'

  if (layout === 'sidebar') {
    return (
      <div style={{ display: 'flex', height: '100%', background: '#fff', overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{ width: '33%', background: sidebarBg || accentColor, padding: '12px 7px', display: 'flex', flexDirection: 'column', gap: 3, boxSizing: 'border-box', flexShrink: 0 }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.3)', margin: '0 auto 5px', flexShrink: 0 }} />
          <div style={{ height: 5, background: 'rgba(255,255,255,0.85)', borderRadius: 2 }} />
          <div style={{ height: 3, background: 'rgba(255,255,255,0.5)', borderRadius: 2, width: '72%' }} />
          <div style={{ height: 1, background: 'rgba(255,255,255,0.18)', margin: '5px 0 2px' }} />
          {[0,1,2,3].map(i => <div key={i} style={{ height: 2.5, background: 'rgba(255,255,255,0.38)', borderRadius: 2, width: i % 2 === 0 ? '90%' : '68%' }} />)}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.18)', margin: '5px 0 2px' }} />
          {[0,1,2].map(i => <div key={i} style={{ height: 2.5, background: 'rgba(255,255,255,0.32)', borderRadius: 2 }} />)}
        </div>
        {/* Main */}
        <div style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 3, boxSizing: 'border-box' }}>
          <div style={{ height: 4, background: accentColor, borderRadius: 2, width: '60%', marginBottom: 4 }} />
          {[0,1,2].map(i => <div key={i} style={{ height: 2.5, background: line, borderRadius: 2, width: i === 2 ? '72%' : '100%' }} />)}
          <div style={{ height: 1, background: line, margin: '4px 0' }} />
          <div style={{ height: 3.5, background: accentColor, borderRadius: 2, width: '55%', marginBottom: 3 }} />
          {[0,1,2,3].map(i => <div key={i} style={{ height: 2.5, background: line, borderRadius: 2, width: i === 3 ? '80%' : '100%' }} />)}
        </div>
      </div>
    )
  }

  if (layout === 'two-column') {
    return (
      <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: headerBg, padding: '10px 10px' }}>
          <div style={{ height: 6, background: isLightHeader ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.92)', borderRadius: 3, width: '48%', marginBottom: 3 }} />
          <div style={{ height: 2.5, background: isLightHeader ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.6)', borderRadius: 2, width: '78%' }} />
        </div>
        <div style={{ flex: 1, display: 'flex', background: '#fff', padding: '8px' }}>
          <div style={{ flex: 1, paddingRight: 6, display: 'flex', flexDirection: 'column', gap: 3, borderRight: `1px solid ${line}` }}>
            <div style={{ height: 3, background: accentColor, borderRadius: 1, width: '52%', marginBottom: 2 }} />
            {[0,1,2,3,4].map(i => <div key={i} style={{ height: 2, background: line, borderRadius: 2 }} />)}
            <div style={{ height: 3, background: accentColor, borderRadius: 1, width: '52%', marginTop: 5, marginBottom: 2 }} />
            {[0,1,2].map(i => <div key={i} style={{ height: 2, background: line, borderRadius: 2 }} />)}
          </div>
          <div style={{ flex: 1, paddingLeft: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ height: 3, background: accentColor, borderRadius: 1, width: '52%', marginBottom: 2 }} />
            {[0,1,2,3,4].map(i => <div key={i} style={{ height: 2, background: line, borderRadius: 2, width: i === 4 ? '72%' : '100%' }} />)}
          </div>
        </div>
      </div>
    )
  }

  if (layout === 'timeline') {
    return (
      <div style={{ background: '#fff', padding: '10px', height: '100%', overflow: 'hidden', boxSizing: 'border-box' }}>
        <div style={{ marginBottom: 7 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 3 }}>
            <div style={{ height: 6, background: accentColor, borderRadius: 2, width: '38%' }} />
            <div style={{ height: 2.5, background: '#bbb', borderRadius: 2, width: '44%' }} />
          </div>
          <div style={{ height: 3, background: accentColor, borderRadius: 1, opacity: 0.7 }} />
        </div>
        {[0,1,2].map(i => (
          <div key={i} style={{ display: 'flex', gap: 5, marginBottom: 7 }}>
            <div style={{ width: 28, flexShrink: 0, paddingTop: 2 }}>
              <div style={{ height: 2.5, background: accentColor, borderRadius: 1 }} />
            </div>
            <div style={{ flex: 1, paddingLeft: 6, borderLeft: `2px solid ${accentColor}` }}>
              <div style={{ height: 3.5, background: '#2d2d2d', borderRadius: 2, width: '58%', marginBottom: 3 }} />
              <div style={{ height: 2, background: line, borderRadius: 2, marginBottom: 2 }} />
              <div style={{ height: 2, background: line, borderRadius: 2, width: '82%' }} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Default: single column
  return (
    <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: headerBg, padding: '12px 10px' }}>
        <div style={{ height: 7, background: isLightHeader ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.95)', borderRadius: 3, width: '48%', marginBottom: 4 }} />
        <div style={{ height: 3, background: isLightHeader ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.65)', borderRadius: 2, width: '76%' }} />
      </div>
      <div style={{ flex: 1, background: '#fff', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ height: 3.5, borderLeft: `3px solid ${accentColor}`, paddingLeft: 4, display: 'flex', alignItems: 'center', marginBottom: 3 }}>
          <div style={{ height: 3, background: accentColor, borderRadius: 1, width: 40 }} />
        </div>
        {[0,1,2].map(i => <div key={i} style={{ height: 2, background: line, borderRadius: 2, width: i === 2 ? '75%' : '100%' }} />)}
        <div style={{ height: 3.5, borderLeft: `3px solid ${accentColor}`, paddingLeft: 4, display: 'flex', alignItems: 'center', marginTop: 6, marginBottom: 3 }}>
          <div style={{ height: 3, background: accentColor, borderRadius: 1, width: 44 }} />
        </div>
        {[0,1,2,3].map(i => <div key={i} style={{ height: 2, background: line, borderRadius: 2, width: i === 3 ? '84%' : '100%' }} />)}
      </div>
    </div>
  )
}

// ── Template card ─────────────────────────────────────────────────────────────
function TemplateCard({ template, onUse }) {
  return (
    <div className="group bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-black/50 hover:-translate-y-0.5">
      {/* Thumbnail */}
      <div className="relative overflow-hidden" style={{ height: 172 }}>
        <div className="w-full h-full">
          <CvThumbnail template={template} />
        </div>
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button
            onClick={() => onUse(template)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer shadow-lg"
          >
            Use Template
          </button>
        </div>
        {/* Badges */}
        {template.featured && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-amber-500 text-black text-[10px] font-bold rounded-full">
            <Star className="w-3 h-3" /> Featured
          </div>
        )}
        <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm text-gray-300 text-[10px] rounded-full border border-gray-700">
          {template.style}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-sm font-semibold text-white">{template.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{template.description}</p>
          </div>
          <div className="w-3 h-3 rounded-full flex-shrink-0 mt-1 ml-2" style={{ background: template.accentColor }} />
        </div>
        <div className="flex flex-wrap gap-1 mb-3">
          {(template.tags || []).slice(0, 3).map(tag => (
            <span key={tag} className="text-[10px] text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">{tag}</span>
          ))}
        </div>
        <button
          onClick={() => onUse(template)}
          className="w-full py-2 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white text-xs font-semibold rounded-xl border border-indigo-600/30 hover:border-indigo-500 transition-all cursor-pointer"
        >
          Use This Template
        </button>
      </div>
    </div>
  )
}

// ── Main gallery component ────────────────────────────────────────────────────
export default function ResumeTemplateGallery({ onUseTemplate, onScratch }) {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('All')

  useEffect(() => {
    fetch('/api/resume-templates')
      .then(r => r.json())
      .then(data => { setTemplates(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => { setTemplates([]); setLoading(false) })
  }, [])

  const filtered = category === 'All' ? templates : templates.filter(t => t.category === category)

  const counts = {}
  templates.forEach(t => { counts[t.category] = (counts[t.category] || 0) + 1 })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center py-4">
        <h2 className="text-2xl font-bold text-white mb-2">AI Expert Resume Templates</h2>
        <p className="text-gray-400 text-sm">Choose a professional template, then fill in your details — AI does the rest</p>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
              category === cat
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
            }`}
          >
            {cat} {cat !== 'All' && counts[cat] ? `(${counts[cat]})` : cat === 'All' && templates.length ? `(${templates.length})` : ''}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <LayoutTemplate className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No templates found in this category.</p>
        </div>
      )}

      {/* Grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map(t => (
            <TemplateCard key={t.id} template={t} onUse={onUseTemplate} />
          ))}
        </div>
      )}

      {/* Start from scratch */}
      <div className="text-center pt-2 pb-4">
        <p className="text-gray-500 text-sm">
          Don't see what you want?{' '}
          <button onClick={onScratch} className="text-indigo-400 hover:text-indigo-300 underline cursor-pointer transition-colors">
            Start from scratch
          </button>
          {' '}or use the{' '}
          <button onClick={onScratch} className="text-violet-400 hover:text-violet-300 underline cursor-pointer transition-colors">
            AI Template Designer
          </button>
        </p>
      </div>
    </div>
  )
}
