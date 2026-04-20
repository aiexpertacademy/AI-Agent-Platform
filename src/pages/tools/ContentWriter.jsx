import { useState } from 'react'
import { PenTool, Loader2, Copy, Check, Sparkles } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'
import { callGemini } from '../../config/gemini'

const contentTypes = ['Blog Post', 'LinkedIn Post', 'Twitter Thread', 'Product Description', 'Landing Page Copy', 'Press Release', 'Newsletter', 'Ad Copy']
const tones = ['Professional', 'Casual', 'Humorous', 'Persuasive', 'Inspirational', 'Technical', 'Conversational', 'Formal']

export default function ContentWriter() {
  const [topic, setTopic] = useState('')
  const [contentType, setContentType] = useState('Blog Post')
  const [tone, setTone] = useState('Professional')
  const [keywords, setKeywords] = useState('')
  const [wordCount, setWordCount] = useState('500')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleGenerate(e) {
    e.preventDefault()
    if (!topic.trim()) return
    setLoading(true)
    setResult('')
    try {
      const reply = await callGemini(
        `Write a ${contentType.toLowerCase()} about: "${topic}"

Requirements:
- Tone: ${tone}
- Target length: ~${wordCount} words
${keywords ? `- Include these keywords naturally: ${keywords}` : ''}
- Make it engaging, well-structured, and ready to publish
- Include a compelling headline/title
- Use appropriate formatting (headers, bullet points, etc.)
- End with a call-to-action if appropriate for the content type`,
        {
          systemInstruction: `You are an expert content writer who creates engaging, high-quality ${contentType.toLowerCase()} content. Write naturally without AI-sounding phrases.`,
          maxTokens: 6144,
          temperature: 0.8,
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

  const resultWords = result.trim() ? result.trim().split(/\s+/).length : 0

  return (
    <ToolLayout icon={PenTool} title="Content Writer" description="Generate blog posts, emails, and marketing copy" color="#3b82f6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <label className="block text-sm font-medium text-gray-300 mb-2">Topic / Subject</label>
              <textarea value={topic} onChange={(e) => setTopic(e.target.value)} rows={3} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="The future of remote work and its impact on productivity..." />
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Content Type</label>
                <div className="flex flex-wrap gap-2">
                  {contentTypes.map((t) => (
                    <button key={t} type="button" onClick={() => setContentType(t)} className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${contentType === t ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Tone</label>
                <div className="flex flex-wrap gap-2">
                  {tones.map((t) => (
                    <button key={t} type="button" onClick={() => setTone(t)} className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${tone === t ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>{t}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Target Words</label>
                  <select value={wordCount} onChange={(e) => setWordCount(e.target.value)} className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700">
                    <option value="200">~200 words</option>
                    <option value="500">~500 words</option>
                    <option value="1000">~1000 words</option>
                    <option value="1500">~1500 words</option>
                    <option value="2000">~2000 words</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Keywords</label>
                  <input value={keywords} onChange={(e) => setKeywords(e.target.value)} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="SEO keywords..." />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading || !topic.trim()} className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 cursor-pointer">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              {loading ? 'Writing...' : 'Generate Content'}
            </button>
          </form>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl flex flex-col h-[calc(100vh-220px)]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <span className="text-sm font-medium text-gray-300">Generated Content {resultWords > 0 && `(${resultWords} words)`}</span>
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
                  <PenTool className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                  <p className="text-sm">Your AI-generated content will appear here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
