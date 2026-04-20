import { useState } from 'react'
import { Search, Loader2, Sparkles, BookOpen, Copy, Check } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'
import { callGemini } from '../../config/gemini'

const depths = ['Quick Overview', 'Standard Research', 'Deep Dive']
const formats = ['Report', 'Bullet Points', 'Q&A Format', 'Comparison Table']

export default function ResearchAgent() {
  const [topic, setTopic] = useState('')
  const [depth, setDepth] = useState('Standard Research')
  const [format, setFormat] = useState('Report')
  const [additionalContext, setAdditionalContext] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleResearch(e) {
    e.preventDefault()
    if (!topic.trim()) return
    setLoading(true)
    setResult('')
    try {
      const depthInstructions = {
        'Quick Overview': 'Provide a concise 200-300 word overview.',
        'Standard Research': 'Provide a comprehensive 800-1200 word research report.',
        'Deep Dive': 'Provide an extremely thorough 1500-2500 word research report with extensive detail.',
      }

      const formatInstructions = {
        'Report': 'Format as a structured research report with sections, headings, and paragraphs.',
        'Bullet Points': 'Format as organized bullet points grouped by subtopic.',
        'Q&A Format': 'Format as a series of questions and detailed answers about the topic.',
        'Comparison Table': 'Include comparison tables where relevant, with pros/cons and key metrics.',
      }

      const reply = await callGemini(
        `Research this topic thoroughly: "${topic}"

${additionalContext ? `Additional context: ${additionalContext}` : ''}

Requirements:
- ${depthInstructions[depth]}
- ${formatInstructions[format]}
- Include sourced facts and statistics where possible
- Cover multiple perspectives and viewpoints
- Include a "Key Takeaways" section at the end
- Mention relevant recent developments
- Add a "Further Reading" section with suggested topics to explore`,
        {
          systemInstruction: 'You are an expert research analyst. Provide well-sourced, comprehensive research. Use markdown formatting. Be objective and cover multiple angles. Always cite when making factual claims.',
          maxTokens: 8192,
          temperature: 0.5,
        }
      )
      setResult(reply)
    } catch (err) {
      setResult(`Error: ${err.message}`)
    }
    setLoading(false)
  }

  function handleCopy() {
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <ToolLayout icon={Search} title="Research Agent" description="Deep-dive research on any topic with sourced citations" color="#64748b">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <form onSubmit={handleResearch} className="space-y-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <label className="block text-sm font-medium text-gray-300 mb-2">Research Topic</label>
              <textarea value={topic} onChange={(e) => setTopic(e.target.value)} rows={3} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-slate-500 resize-none" placeholder="The impact of quantum computing on current encryption standards..." />
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Research Depth</label>
                <div className="flex gap-2">
                  {depths.map((d) => (
                    <button key={d} type="button" onClick={() => setDepth(d)} className={`flex-1 py-2 rounded-lg text-xs font-medium cursor-pointer ${depth === d ? 'bg-slate-600 text-white' : 'bg-gray-800 text-gray-400'}`}>{d}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Output Format</label>
                <div className="flex flex-wrap gap-2">
                  {formats.map((f) => (
                    <button key={f} type="button" onClick={() => setFormat(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${format === f ? 'bg-slate-600 text-white' : 'bg-gray-800 text-gray-400'}`}>{f}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Focus Areas (optional)</label>
                <input value={additionalContext} onChange={(e) => setAdditionalContext(e.target.value)} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-slate-500" placeholder="Specific angles or questions to address..." />
              </div>
            </div>

            <button type="submit" disabled={loading || !topic.trim()} className="w-full flex items-center justify-center gap-2 py-3 bg-slate-600 hover:bg-slate-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 cursor-pointer">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <BookOpen className="w-5 h-5" />}
              {loading ? 'Researching...' : 'Start Research'}
            </button>
          </form>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl flex flex-col h-[calc(100vh-220px)]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <span className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-slate-400" /> Research Results
            </span>
            {result && (
              <button onClick={handleCopy} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white cursor-pointer">
                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            {result ? (
              <div className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{result}</div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 text-center">
                <div>
                  <Search className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                  <p className="text-sm">Enter a topic to start researching</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
