import { useState } from 'react'
import { Wand2, Loader2, Copy, Check, Star, RefreshCw, Sparkles, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, Bookmark, BookmarkCheck, Info } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'
import { callGemini } from '../../config/gemini'

const categories = [
  { id: 'image', label: 'Image', emoji: '\u{1F3A8}' },
  { id: 'video', label: 'Video', emoji: '\u{1F3AC}' },
  { id: 'story', label: 'Story / Writing', emoji: '\u{1F4DD}' },
  { id: 'code', label: 'Code', emoji: '\u{1F4BB}' },
  { id: 'music', label: 'Music', emoji: '\u{1F3B5}' },
  { id: 'marketing', label: 'Marketing', emoji: '\u{1F4E3}' },
]

const aiTargets = {
  image: [
    { id: 'midjourney', name: 'Midjourney', color: '#5865F2', desc: 'Best for artistic, stylized images' },
    { id: 'dalle', name: 'DALL-E 3', color: '#10a37f', desc: 'Best for photorealistic & precise prompts' },
    { id: 'stable-diffusion', name: 'Stable Diffusion', color: '#a855f7', desc: 'Best for detailed technical prompts' },
    { id: 'flux', name: 'Flux', color: '#f97316', desc: 'Best for high-fidelity generation' },
    { id: 'nano-banana', name: 'Nano Banana 2', color: '#eab308', desc: 'Google Gemini image model' },
  ],
  video: [
    { id: 'sora', name: 'Sora', color: '#000000', desc: 'OpenAI cinematic video generation' },
    { id: 'runway', name: 'Runway Gen-3', color: '#06b6d4', desc: 'Professional video generation' },
    { id: 'kling', name: 'Kling AI', color: '#ec4899', desc: 'High-quality video synthesis' },
    { id: 'pika', name: 'Pika', color: '#f59e0b', desc: 'Creative video generation' },
  ],
  story: [
    { id: 'chatgpt', name: 'ChatGPT', color: '#10a37f', desc: 'OpenAI conversational AI' },
    { id: 'claude', name: 'Claude', color: '#d97706', desc: 'Anthropic long-form writing' },
    { id: 'gemini', name: 'Gemini', color: '#4285f4', desc: 'Google multimodal AI' },
  ],
  code: [
    { id: 'chatgpt', name: 'ChatGPT', color: '#10a37f', desc: 'General code generation' },
    { id: 'claude', name: 'Claude', color: '#d97706', desc: 'Complex code & reasoning' },
    { id: 'copilot', name: 'GitHub Copilot', color: '#6e40c9', desc: 'Inline code completion' },
    { id: 'cursor', name: 'Cursor', color: '#3b82f6', desc: 'AI-native code editor' },
  ],
  music: [
    { id: 'suno', name: 'Suno', color: '#ef4444', desc: 'Full song generation' },
    { id: 'udio', name: 'Udio', color: '#8b5cf6', desc: 'High-quality music AI' },
  ],
  marketing: [
    { id: 'chatgpt', name: 'ChatGPT', color: '#10a37f', desc: 'Versatile copy generation' },
    { id: 'jasper', name: 'Jasper', color: '#f43f5e', desc: 'Marketing-focused AI writing' },
    { id: 'copy-ai', name: 'Copy.ai', color: '#6366f1', desc: 'Ad & social media copy' },
  ],
}

const toneOptions = ['Default', 'Detailed', 'Minimal', 'Creative', 'Technical', 'Cinematic', 'Whimsical', 'Dark / Moody', 'Vibrant']

function RatingStars({ rating, onRate }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          onClick={() => onRate(s)}
          className="cursor-pointer transition-transform hover:scale-110"
        >
          <Star
            className={`w-5 h-5 transition-colors ${s <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-600 hover:text-gray-400'}`}
          />
        </button>
      ))}
    </div>
  )
}

function PromptResultCard({ result, index, onRate, onBookmark, onCopy }) {
  const [expanded, setExpanded] = useState(index === 0)
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState(null)

  function handleCopy() {
    onCopy(result.prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`bg-gray-900 border rounded-xl overflow-hidden transition-all ${
      index === 0 ? 'border-violet-500/40 ring-1 ring-violet-500/20' : 'border-gray-800 hover:border-gray-700'
    }`}>
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 cursor-pointer text-left"
      >
        {index === 0 && (
          <span className="text-[10px] font-bold bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
            Best
          </span>
        )}
        <span className="flex-1 text-sm font-medium text-white truncate">{result.title}</span>
        <span className="text-xs text-gray-500 flex-shrink-0">{result.targetName}</span>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />}
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4">
          {/* The Prompt */}
          <div className="relative group">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <pre className="text-sm text-gray-100 leading-relaxed whitespace-pre-wrap font-mono">{result.prompt}</pre>
            </div>
            <button
              onClick={handleCopy}
              className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-gray-700/80 backdrop-blur-sm hover:bg-gray-600 text-white text-xs rounded-lg cursor-pointer transition-colors opacity-0 group-hover:opacity-100"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          {/* Tips */}
          {result.tips && (
            <div className="bg-violet-500/5 border border-violet-500/15 rounded-lg px-4 py-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Info className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-xs font-medium text-violet-300">Pro Tips</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{result.tips}</p>
            </div>
          )}

          {/* Params / Tags */}
          {result.params && result.params.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {result.params.map((p, i) => (
                <span key={i} className="text-[11px] bg-gray-800 text-gray-400 px-2.5 py-1 rounded-lg border border-gray-700 font-mono">
                  {p}
                </span>
              ))}
            </div>
          )}

          {/* Actions: Rate, Feedback, Bookmark */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-800">
            <div className="flex items-center gap-4">
              <RatingStars rating={result.rating || 0} onRate={(r) => onRate(index, r)} />
              <div className="flex items-center gap-1.5 border-l border-gray-800 pl-4">
                <button
                  onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
                  className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                    feedback === 'up' ? 'bg-green-500/15 text-green-400' : 'text-gray-600 hover:text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <ThumbsUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setFeedback(feedback === 'down' ? null : 'down')}
                  className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                    feedback === 'down' ? 'bg-red-500/15 text-red-400' : 'text-gray-600 hover:text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <ThumbsDown className="w-4 h-4" />
                </button>
              </div>
            </div>
            <button
              onClick={() => onBookmark(index)}
              className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                result.bookmarked ? 'bg-amber-500/15 text-amber-400' : 'text-gray-600 hover:text-gray-300 hover:bg-gray-800'
              }`}
              title={result.bookmarked ? 'Bookmarked' : 'Bookmark'}
            >
              {result.bookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PromptGenerator() {
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('image')
  const [target, setTarget] = useState('midjourney')
  const [tone, setTone] = useState('Default')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])
  const [history, setHistory] = useState([])
  const [error, setError] = useState('')

  const currentTargets = aiTargets[category] || []
  const selectedTarget = currentTargets.find((t) => t.id === target)

  // Reset target when category changes
  function handleCategoryChange(cat) {
    setCategory(cat)
    const targets = aiTargets[cat]
    if (targets?.length) setTarget(targets[0].id)
  }

  async function handleGenerate(e) {
    e.preventDefault()
    if (!description.trim() || loading) return
    setLoading(true)
    setResults([])
    setError('')

    try {
      const reply = await callGemini(
        `You are a world-class prompt engineer. Generate 3 optimized prompts for the following request.

USER WANTS TO CREATE: ${description}
CATEGORY: ${category}
TARGET AI TOOL: ${selectedTarget?.name || target}
TONE / STYLE: ${tone}

Return a JSON array (no markdown, no code fences) with exactly 3 prompt variations:
[
  {
    "title": "Short descriptive title for this prompt variant (e.g., 'Cinematic Wide Shot', 'Detailed Technical')",
    "prompt": "The full, optimized prompt ready to paste into ${selectedTarget?.name || target}. Use the exact syntax, parameters, and formatting that ${selectedTarget?.name || target} expects. For Midjourney include --ar, --v, --style params. For DALL-E use natural language. For Sora include motion/camera descriptions. For ChatGPT/Claude use system-instruction style. For code tools use specific language and framework context. For Suno/Udio include genre, mood, instrument tags.",
    "tips": "1-2 sentences explaining why this prompt works well and how to tweak it",
    "params": ["param1:value", "param2:value"],
    "quality": 1
  }
]

CRITICAL RULES:
- The "prompt" field must be the EXACT text the user should paste — fully formatted for ${selectedTarget?.name || target}
- First result should be the highest quality (quality: 1), second is a creative alternative (quality: 2), third is a minimal/simple version (quality: 3)
- "params" should list key parameters or tags used in the prompt as short strings
- Make prompts specific, detailed, and leveraging the unique strengths of ${selectedTarget?.name || target}
- If tone is not "Default", strongly reflect that tone in the prompts`,
        {
          systemInstruction: `You are an expert prompt engineer who knows the exact syntax, best practices, and hidden features of every major AI tool. You always produce prompts that maximize output quality. Return only valid JSON.`,
          temperature: 0.85,
          maxTokens: 4096,
        }
      )

      const cleaned = reply.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
      const parsed = JSON.parse(cleaned)
      const enriched = parsed.map((r) => ({
        ...r,
        targetName: selectedTarget?.name || target,
        rating: 0,
        bookmarked: false,
      }))
      setResults(enriched)
      setHistory((prev) => [
        { description, category, target: selectedTarget?.name || target, time: new Date(), count: enriched.length },
        ...prev.slice(0, 19),
      ])
    } catch (err) {
      setError(`Failed to generate prompts: ${err.message}`)
    }
    setLoading(false)
  }

  function handleRate(index, rating) {
    setResults((prev) => prev.map((r, i) => i === index ? { ...r, rating } : r))
  }

  function handleBookmark(index) {
    setResults((prev) => prev.map((r, i) => i === index ? { ...r, bookmarked: !r.bookmarked } : r))
  }

  function handleCopy(text) {
    navigator.clipboard.writeText(text)
  }

  function handleCopyAll() {
    const all = results.map((r, i) => `--- Prompt ${i + 1}: ${r.title} ---\n${r.prompt}`).join('\n\n')
    navigator.clipboard.writeText(all)
  }

  return (
    <ToolLayout icon={Wand2} title="Prompt Generator" description="Generate optimized prompts for any AI tool" color="#8b5cf6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Controls */}
        <div className="space-y-4">
          <form onSubmit={handleGenerate} className="space-y-4">
            {/* Description */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <label className="block text-sm font-medium text-gray-300 mb-2">What do you want to create?</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                placeholder="e.g., A cyberpunk city at night with neon reflections on wet streets, flying cars overhead, and a lone figure walking..."
              />
            </div>

            {/* Category */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <label className="block text-sm font-medium text-gray-300 mb-3">Category</label>
              <div className="grid grid-cols-3 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryChange(cat.id)}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                      category === cat.id
                        ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                        : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-750'
                    }`}
                  >
                    <span>{cat.emoji}</span> {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Target */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <label className="block text-sm font-medium text-gray-300 mb-3">Target AI Tool</label>
              <div className="space-y-2">
                {currentTargets.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTarget(t.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left cursor-pointer transition-all ${
                      target === t.id
                        ? 'bg-gray-800 border-2 border-violet-500/50 ring-1 ring-violet-500/20'
                        : 'bg-gray-800/50 border-2 border-transparent hover:bg-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: t.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-white">{t.name}</span>
                      <p className="text-[11px] text-gray-500 truncate">{t.desc}</p>
                    </div>
                    {target === t.id && (
                      <Check className="w-4 h-4 text-violet-400 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tone */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <label className="block text-sm font-medium text-gray-300 mb-3">Tone / Style</label>
              <div className="flex flex-wrap gap-2">
                {toneOptions.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTone(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                      tone === t ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !description.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              {loading ? 'Generating Prompts...' : 'Generate Prompts'}
            </button>
          </form>

          {/* History */}
          {history.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <h3 className="text-xs font-medium text-gray-400 mb-3 uppercase tracking-wider">Recent</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {history.map((h, i) => (
                  <div key={i} className="text-xs text-gray-500 bg-gray-800/50 rounded-lg px-3 py-2">
                    <span className="text-gray-300 font-medium truncate block">{h.description.slice(0, 50)}{h.description.length > 50 ? '...' : ''}</span>
                    <span className="text-[10px]">{h.target} &middot; {h.count} prompts &middot; {h.time.toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Results */}
        <div className="lg:col-span-2 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          {loading && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-center h-96">
              <div className="text-center">
                <Loader2 className="w-10 h-10 text-violet-400 animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-400">Crafting optimized prompts for {selectedTarget?.name}...</p>
                <p className="text-xs text-gray-600 mt-1">Analyzing best patterns and syntax</p>
              </div>
            </div>
          )}

          {!loading && results.length === 0 && !error && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-center h-96">
              <div className="text-center text-gray-500 px-8">
                <Wand2 className="w-16 h-16 mx-auto mb-3 text-gray-600" />
                <p className="text-sm">Describe what you want to create</p>
                <p className="text-xs text-gray-600 mt-2">
                  Select a category and AI tool, then get 3 optimized prompt variations with tips, ratings, and one-click copy
                </p>
                <div className="flex items-center justify-center gap-3 mt-5 text-xs text-gray-600">
                  <span className="flex items-center gap-1"><Star className="w-3 h-3" /> Rate prompts</span>
                  <span className="flex items-center gap-1"><Copy className="w-3 h-3" /> One-click copy</span>
                  <span className="flex items-center gap-1"><Bookmark className="w-3 h-3" /> Bookmark favorites</span>
                </div>
              </div>
            </div>
          )}

          {results.length > 0 && (
            <>
              {/* Header bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-semibold text-white">{results.length} Prompt Variations</h2>
                  <span className="text-xs text-gray-500">for {selectedTarget?.name || target}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyAll}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg cursor-pointer transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy All
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs rounded-lg cursor-pointer transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                  </button>
                </div>
              </div>

              {/* Prompt cards */}
              <div className="space-y-3">
                {results.map((r, i) => (
                  <PromptResultCard
                    key={i}
                    result={r}
                    index={i}
                    onRate={handleRate}
                    onBookmark={handleBookmark}
                    onCopy={handleCopy}
                  />
                ))}
              </div>

              {/* Quick tips footer */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                <p className="text-xs text-gray-500 text-center">
                  <span className="text-gray-400 font-medium">Tip:</span> Rate prompts with stars to help refine future generations. Use
                  <span className="text-violet-400"> Regenerate</span> for fresh variations with the same settings.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </ToolLayout>
  )
}
