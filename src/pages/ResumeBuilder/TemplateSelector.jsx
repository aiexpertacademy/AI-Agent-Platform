import { useState } from 'react'
import templates, { categories } from './templates'
import { Check, Trash2, Plus } from 'lucide-react'

// Scale for built-in template gradient thumbnails = existing card height 80px
// Scale for custom iframe thumbnails: A4 body ~794px wide, card ~72px → 72/794 ≈ 0.091
const CUSTOM_THUMB_SCALE = 0.091
const CUSTOM_THUMB_HEIGHT = 80 // px

export default function TemplateSelector({ selectedId, onSelect, customTemplates = [], onDeleteCustom, onToggleCreator, showCreatorButton = true }) {
  const [activeCategory, setActiveCategory] = useState('All')

  const isCustomTab = activeCategory === 'Custom'
  const filtered = isCustomTab
    ? customTemplates
    : activeCategory === 'All'
      ? templates
      : templates.filter((t) => t.category === activeCategory)

  const allCategoryTabs = ['All', ...categories, ...(customTemplates.length > 0 || showCreatorButton ? ['Custom'] : [])]

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-3">Choose Template</label>

      {/* Category tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {allCategoryTabs.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              activeCategory === cat
                ? cat === 'Custom'
                  ? 'bg-violet-600 text-white'
                  : 'bg-indigo-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {cat === 'Custom' ? `Custom (${customTemplates.length})` : cat === 'All' ? `All (${templates.length})` : cat}
          </button>
        ))}
      </div>

      {/* Custom tab: show custom templates + create button */}
      {isCustomTab ? (
        <div className="space-y-3">
          {customTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-gray-600 border border-dashed border-gray-700 rounded-xl">
              <p className="text-sm text-gray-500 mb-2">No custom templates yet</p>
              <p className="text-xs text-gray-600">Use the creator below to design your own</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-64 overflow-y-auto pr-1">
              {customTemplates.map((t) => (
                <div key={t.id} className="relative group">
                  <button
                    type="button"
                    onClick={() => onSelect(t)}
                    className={`w-full rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      selectedId === t.id
                        ? 'border-violet-500 ring-2 ring-violet-500/30'
                        : 'border-gray-700 hover:border-gray-500'
                    }`}
                  >
                    {/* Actual HTML iframe preview thumbnail */}
                    <div
                      className="bg-white overflow-hidden"
                      style={{ height: CUSTOM_THUMB_HEIGHT, position: 'relative' }}
                    >
                      <iframe
                        srcDoc={t.html}
                        title={t.name}
                        scrolling="no"
                        style={{
                          width: 794,
                          height: 1122,
                          border: 'none',
                          transform: `scale(${CUSTOM_THUMB_SCALE})`,
                          transformOrigin: 'top left',
                          pointerEvents: 'none',
                        }}
                      />
                    </div>
                    <div className="bg-gray-800 px-2 py-1.5">
                      <p className="text-[10px] font-medium text-gray-300 truncate">{t.name}</p>
                      <p className="text-[9px] text-violet-400">Custom</p>
                    </div>
                    {selectedId === t.id && (
                      <div className="absolute top-1.5 left-1.5 w-5 h-5 bg-violet-600 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>

                  {/* Delete button */}
                  {onDeleteCustom && (
                    <button
                      type="button"
                      onClick={() => onDeleteCustom(t.id)}
                      className="absolute top-1.5 right-1.5 w-5 h-5 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3 text-white" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Create new button */}
          {showCreatorButton && onToggleCreator && (
            <button
              type="button"
              onClick={onToggleCreator}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/40 hover:border-violet-500/60 text-violet-300 text-sm font-medium rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create New Template with AI
            </button>
          )}
        </div>
      ) : (
        /* Built-in templates grid */
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-64 overflow-y-auto pr-1">
          {filtered.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelect(t)}
              className={`relative group rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                selectedId === t.id
                  ? 'border-indigo-500 ring-2 ring-indigo-500/30'
                  : 'border-gray-700 hover:border-gray-500'
              }`}
            >
              <div className="h-20 w-full" style={{ background: t.preview }} />
              <div className="bg-gray-800 px-2 py-1.5">
                <p className="text-[10px] font-medium text-gray-300 truncate">{t.name}</p>
                <p className="text-[9px] text-gray-500">{t.category}</p>
              </div>
              {selectedId === t.id && (
                <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
