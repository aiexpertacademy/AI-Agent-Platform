import { useState, useRef, useEffect } from 'react'
import {
  Search, Loader2, Sparkles, BookOpen, Copy, Check, Plus,
  MessageSquare, FileText, Star, Send, X, ExternalLink,
} from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'
import { callGemini } from '../../config/gemini'

const depths = ['Quick', 'Standard', 'Deep Dive']
const formats = ['Report', 'Bullets', 'Q&A', 'Table']

const DEPTH_INSTRUCTIONS = {
  'Quick': 'Provide a concise 200-300 word overview.',
  'Standard': 'Provide a comprehensive 800-1200 word research report.',
  'Deep Dive': 'Provide an extremely thorough 1500-2500 word research report with extensive detail.',
}
const FORMAT_INSTRUCTIONS = {
  'Report': 'Format as a structured research report with sections and headings.',
  'Bullets': 'Format as organized bullet points grouped by subtopic.',
  'Q&A': 'Format as a series of questions and detailed answers about the topic.',
  'Table': 'Include comparison tables where relevant, with pros/cons and key metrics.',
}

const NOTEBOOK_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#10b981', '#3b82f6']

export default function ResearchAgent() {
  // Notebooks
  const [notebooks, setNotebooks] = useState([
    { id: 1, name: 'My Research', color: '#6366f1', createdAt: new Date().toLocaleDateString() }
  ])
  const [activeNotebook, setActiveNotebook] = useState(1)
  const [showNewNotebook, setShowNewNotebook] = useState(false)
  const [newNotebookName, setNewNotebookName] = useState('')

  // Research
  const [topic, setTopic] = useState('')
  const [depth, setDepth] = useState('Standard')
  const [format, setFormat] = useState('Report')
  const [focusAreas, setFocusAreas] = useState('')
  const [result, setResult] = useState('')
  const [currentTopic, setCurrentTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  // Notes per notebook
  const [notesByNotebook, setNotesByNotebook] = useState({ 1: [] })

  // Right panel
  const [activeRightTab, setActiveRightTab] = useState('notes')

  // Chat
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', text: 'I\'m your research assistant. Research a topic and then ask me questions about it — I\'ll have full context of your findings!' }
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef(null)

  // Sources
  const [sources, setSources] = useState([])
  const [newSource, setNewSource] = useState('')

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const currentNotes = notesByNotebook[activeNotebook] || []
  const activeNb = notebooks.find(n => n.id === activeNotebook)

  async function handleResearch(e) {
    e.preventDefault()
    if (!topic.trim()) return
    setLoading(true)
    setResult('')
    setCurrentTopic(topic)
    try {
      const reply = await callGemini(
        `Research this topic thoroughly: "${topic}"\n\n${focusAreas ? `Focus on: ${focusAreas}\n\n` : ''}Requirements:\n- ${DEPTH_INSTRUCTIONS[depth]}\n- ${FORMAT_INSTRUCTIONS[format]}\n- Include sourced facts and statistics where possible\n- Cover multiple perspectives and viewpoints\n- Include a "Key Takeaways" section at the end\n- Mention relevant recent developments\n- Add a "Further Reading" section with suggested topics to explore`,
        {
          systemInstruction: 'You are an expert research analyst. Provide well-sourced, comprehensive research. Use markdown formatting with ## headings for sections. Be objective and cover multiple angles.',
          maxTokens: 8192,
          temperature: 0.5,
        }
      )
      setResult(reply)
      if (!sources.find(s => s.text === topic)) {
        setSources(prev => [...prev, { id: Date.now(), text: topic, type: 'research' }])
      }
    } catch (err) {
      setResult(`Error: ${err.message}`)
    }
    setLoading(false)
  }

  function saveNote() {
    if (!result) return
    const note = {
      id: Date.now(),
      text: result.substring(0, 300) + (result.length > 300 ? '...' : ''),
      fullText: result,
      topic: currentTopic || topic,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      starred: false,
    }
    setNotesByNotebook(prev => ({
      ...prev,
      [activeNotebook]: [note, ...(prev[activeNotebook] || [])]
    }))
    setActiveRightTab('notes')
  }

  function deleteNote(id) {
    setNotesByNotebook(prev => ({
      ...prev,
      [activeNotebook]: (prev[activeNotebook] || []).filter(n => n.id !== id)
    }))
  }

  function toggleStar(id) {
    setNotesByNotebook(prev => ({
      ...prev,
      [activeNotebook]: (prev[activeNotebook] || []).map(n => n.id === id ? { ...n, starred: !n.starred } : n)
    }))
  }

  function createNotebook() {
    if (!newNotebookName.trim()) return
    const nb = {
      id: Date.now(),
      name: newNotebookName.trim(),
      color: NOTEBOOK_COLORS[notebooks.length % NOTEBOOK_COLORS.length],
      createdAt: new Date().toLocaleDateString(),
    }
    setNotebooks(prev => [...prev, nb])
    setNotesByNotebook(prev => ({ ...prev, [nb.id]: [] }))
    setActiveNotebook(nb.id)
    setNewNotebookName('')
    setShowNewNotebook(false)
  }

  function deleteNotebook(id) {
    if (notebooks.length <= 1) return
    setNotebooks(prev => prev.filter(n => n.id !== id))
    setNotesByNotebook(prev => { const p = { ...prev }; delete p[id]; return p })
    if (activeNotebook === id) setActiveNotebook(notebooks.find(n => n.id !== id)?.id || 1)
  }

  async function handleChat(e) {
    e.preventDefault()
    if (!chatInput.trim() || chatLoading) return
    const userMsg = chatInput.trim()
    setChatInput('')
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setChatLoading(true)
    try {
      const reply = await callGemini(userMsg, {
        temperature: 0.4,
        systemInstruction: `You are an AI research assistant helping explore a research topic.
Topic researched: "${currentTopic || topic || 'not yet specified'}"
${result ? `Research summary (first 1500 chars):\n${result.substring(0, 1500)}` : 'No research has been done yet — encourage the user to research a topic first.'}
${sources.length ? `Sources explored: ${sources.map(s => s.text).join(', ')}` : ''}
Answer concisely and helpfully, referencing specific details from the research when relevant.`,
        maxTokens: 600,
      })
      setChatMessages(prev => [...prev, { role: 'assistant', text: reply }])
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', text: `Error: ${err.message}` }])
    }
    setChatLoading(false)
  }

  function handleCopy() {
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function addSource() {
    if (!newSource.trim()) return
    setSources(prev => [...prev, { id: Date.now(), text: newSource.trim(), type: 'url' }])
    setNewSource('')
  }

  function exportNotes() {
    const text = currentNotes.map(n => `[${n.topic}] — ${n.createdAt}\n${n.fullText || n.text}`).join('\n\n---\n\n')
    navigator.clipboard.writeText(text)
  }

  return (
    <ToolLayout icon={Search} title="Research Agent" description="AI-powered research with notebooks, notes, and contextual chat" color="#64748b">
      <div className="flex gap-3" style={{ height: 'calc(100vh - 165px)' }}>

        {/* ── Left: Notebooks ── */}
        <div className="w-52 flex-shrink-0 flex flex-col bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-3 pt-3 pb-2 border-b border-gray-800 flex items-center justify-between">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <BookOpen className="w-3 h-3" /> Notebooks
            </p>
            <button
              onClick={() => setShowNewNotebook(p => !p)}
              className="w-5 h-5 flex items-center justify-center rounded-md bg-gray-800 hover:bg-gray-700 text-gray-400 cursor-pointer transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {showNewNotebook && (
            <div className="px-3 py-2.5 border-b border-gray-800 space-y-2">
              <input
                value={newNotebookName}
                onChange={e => setNewNotebookName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createNotebook()}
                autoFocus
                placeholder="Notebook name..."
                className="w-full px-2.5 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
              <div className="flex gap-1">
                <button onClick={createNotebook} className="flex-1 py-1 bg-slate-600 hover:bg-slate-500 text-white text-[10px] rounded-md cursor-pointer">Create</button>
                <button onClick={() => setShowNewNotebook(false)} className="flex-1 py-1 bg-gray-800 text-gray-400 text-[10px] rounded-md cursor-pointer">Cancel</button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {notebooks.map(nb => (
              <button
                key={nb.id}
                onClick={() => setActiveNotebook(nb.id)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-left transition-all cursor-pointer group ${activeNotebook === nb.id ? 'bg-slate-500/15 border border-slate-500/25' : 'hover:bg-gray-800/70 border border-transparent'}`}
              >
                <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: nb.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-gray-300 truncate font-medium">{nb.name}</p>
                  <p className="text-[9px] text-gray-600">{(notesByNotebook[nb.id] || []).length} notes</p>
                </div>
                {notebooks.length > 1 && (
                  <button
                    onClick={e => { e.stopPropagation(); deleteNotebook(nb.id) }}
                    className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 cursor-pointer transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </button>
            ))}
          </div>

          {activeNb && (
            <div className="px-3 py-2.5 border-t border-gray-800">
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: activeNb.color }} />
                <p className="text-[10px] text-gray-400 font-medium truncate">{activeNb.name}</p>
              </div>
              <p className="text-[9px] text-gray-600">{currentNotes.length} notes · {currentNotes.filter(n => n.starred).length} starred</p>
            </div>
          )}
        </div>

        {/* ── Center: Research ── */}
        <div className="flex-1 flex flex-col min-w-0 gap-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 165px)' }}>
          {/* Search form */}
          <form onSubmit={handleResearch} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3 flex-shrink-0">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Research Topic</label>
              <textarea
                value={topic}
                onChange={e => setTopic(e.target.value)}
                rows={2}
                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-slate-500 resize-none"
                placeholder="The impact of quantum computing on current encryption standards..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Depth</p>
                <div className="flex gap-1">
                  {depths.map(d => (
                    <button key={d} type="button" onClick={() => setDepth(d)}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium cursor-pointer transition-colors ${depth === d ? 'bg-slate-600 text-white' : 'bg-gray-800 text-gray-500 hover:text-gray-300'}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Format</p>
                <div className="flex gap-1 flex-wrap">
                  {formats.map(f => (
                    <button key={f} type="button" onClick={() => setFormat(f)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-medium cursor-pointer transition-colors ${format === f ? 'bg-slate-600 text-white' : 'bg-gray-800 text-gray-500 hover:text-gray-300'}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                value={focusAreas}
                onChange={e => setFocusAreas(e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white text-xs placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                placeholder="Specific focus areas or questions (optional)..."
              />
              <button type="submit" disabled={loading || !topic.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50 cursor-pointer flex-shrink-0">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                {loading ? 'Researching...' : 'Research'}
              </button>
            </div>
          </form>

          {/* Results */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 flex-shrink-0">
              <span className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-slate-400" /> Research Results
                {currentTopic && (
                  <span className="text-[10px] text-slate-400 bg-slate-500/15 px-2 py-0.5 rounded-full max-w-[180px] truncate">
                    {currentTopic}
                  </span>
                )}
              </span>
              {result && !loading && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={saveNote}
                    className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 cursor-pointer bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20 transition-colors"
                  >
                    <Star className="w-3 h-3" /> Save to Notes
                  </button>
                  <button onClick={handleCopy} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white cursor-pointer transition-colors">
                    {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              )}
            </div>
            <div className="p-5 overflow-y-auto" style={{ minHeight: 200, maxHeight: 'calc(100vh - 480px)' }}>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                    <p className="text-sm text-gray-400">Researching "{topic}"...</p>
                    <p className="text-xs text-gray-600">{depth} · {format} format</p>
                  </div>
                </div>
              ) : result ? (
                <div className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{result}</div>
              ) : (
                <div className="flex items-center justify-center py-12 text-gray-500 text-center">
                  <div>
                    <BookOpen className="w-10 h-10 mx-auto mb-3 text-gray-700" />
                    <p className="text-sm">Enter a topic to start researching</p>
                    <p className="text-xs text-gray-600 mt-1">Results will be saved to your notebook</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right: Notes & Chat & Sources ── */}
        <div className="w-72 flex-shrink-0 flex flex-col bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-3 border-b border-gray-800 flex-shrink-0">
            {[
              { id: 'notes', label: 'Notes', icon: FileText },
              { id: 'chat', label: 'Chat', icon: MessageSquare },
              { id: 'sources', label: 'Sources', icon: ExternalLink },
            ].map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveRightTab(id)}
                className={`flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-all cursor-pointer border-b-2 ${activeRightTab === id ? 'border-slate-500 text-slate-300 bg-slate-500/5' : 'border-transparent text-gray-600 hover:text-gray-300'}`}>
                <Icon className="w-4 h-4" />{label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-hidden">

            {/* Notes */}
            {activeRightTab === 'notes' && (
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {currentNotes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-8">
                      <Star className="w-8 h-8 text-gray-700 mb-2" />
                      <p className="text-xs text-gray-500">No notes yet</p>
                      <p className="text-[10px] text-gray-600 mt-1">Click "Save to Notes" after researching</p>
                    </div>
                  ) : (
                    currentNotes.map(note => (
                      <div key={note.id} className="bg-gray-800/60 border border-gray-700 rounded-xl p-3 group">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <span className="text-[9px] text-slate-400 bg-slate-500/10 px-2 py-0.5 rounded-full truncate max-w-[140px]">
                            {note.topic || 'Note'}
                          </span>
                          <div className="flex gap-1 flex-shrink-0">
                            <button onClick={() => toggleStar(note.id)} className="cursor-pointer">
                              <Star className={`w-3 h-3 ${note.starred ? 'text-amber-400 fill-amber-400' : 'text-gray-600 group-hover:text-gray-400'} transition-colors`} />
                            </button>
                            <button onClick={() => deleteNote(note.id)} className="opacity-0 group-hover:opacity-100 cursor-pointer text-gray-600 hover:text-red-400 transition-all">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <p className="text-[11px] text-gray-300 leading-relaxed line-clamp-4">{note.text}</p>
                        <p className="text-[9px] text-gray-600 mt-1.5">{note.createdAt}</p>
                      </div>
                    ))
                  )}
                </div>
                {currentNotes.length > 0 && (
                  <div className="flex-shrink-0 px-3 py-2 border-t border-gray-800 flex items-center justify-between">
                    <span className="text-[10px] text-gray-500">
                      {currentNotes.length} notes · {currentNotes.filter(n => n.starred).length} starred
                    </span>
                    <button onClick={exportNotes} className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-300 cursor-pointer transition-colors">
                      <Copy className="w-3 h-3" /> Copy all
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Chat */}
            {activeRightTab === 'chat' && (
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
                  {chatMessages.map((m, i) => (
                    <div key={i} className={`text-xs leading-relaxed rounded-xl p-3 ${m.role === 'user' ? 'bg-slate-600/20 text-slate-100 ml-4' : 'bg-gray-800/80 text-gray-300 mr-4'}`}>
                      {m.text}
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="bg-gray-800/80 rounded-xl p-3 mr-4">
                      <div className="flex gap-1">
                        {[0, 1, 2].map(i => (
                          <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <form onSubmit={handleChat} className="flex-shrink-0 p-2 border-t border-gray-800 flex gap-2">
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    placeholder="Ask about your research..."
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  />
                  <button type="submit" disabled={chatLoading || !chatInput.trim()}
                    className="p-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg cursor-pointer disabled:opacity-40 transition-colors flex-shrink-0">
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}

            {/* Sources */}
            {activeRightTab === 'sources' && (
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {sources.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-8">
                      <ExternalLink className="w-8 h-8 text-gray-700 mb-2" />
                      <p className="text-xs text-gray-500">No sources yet</p>
                      <p className="text-[10px] text-gray-600 mt-1">Sources appear when you research topics, or add them manually</p>
                    </div>
                  ) : (
                    sources.map(src => (
                      <div key={src.id} className="flex items-center gap-2 bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2.5 group">
                        {src.type === 'url'
                          ? <ExternalLink className="w-3 h-3 text-blue-400 flex-shrink-0" />
                          : <Search className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        }
                        <span className="flex-1 text-[11px] text-gray-300 truncate">{src.text}</span>
                        <button
                          onClick={() => setSources(p => p.filter(s => s.id !== src.id))}
                          className="opacity-0 group-hover:opacity-100 cursor-pointer text-gray-600 hover:text-red-400 transition-all"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex-shrink-0 p-3 border-t border-gray-800">
                  <div className="flex gap-2">
                    <input
                      value={newSource}
                      onChange={e => setNewSource(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addSource()}
                      placeholder="Add URL or source..."
                      className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    />
                    <button onClick={addSource} disabled={!newSource.trim()}
                      className="p-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg cursor-pointer disabled:opacity-40 transition-colors flex-shrink-0">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </ToolLayout>
  )
}
