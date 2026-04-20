import { useState } from 'react'
import { Bug, Loader2, Copy, Check, Sparkles, AlertTriangle } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'
import { callGemini } from '../../config/gemini'

export default function BugDetective() {
  const [errorLog, setErrorLog] = useState('')
  const [language, setLanguage] = useState('Auto-detect')
  const [context, setContext] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const languages = ['Auto-detect', 'JavaScript', 'Python', 'Java', 'C#', 'Go', 'Rust', 'Ruby', 'PHP', 'TypeScript', 'C++', 'Swift', 'Kotlin']

  async function handleAnalyze(e) {
    e.preventDefault()
    if (!errorLog.trim()) return
    setLoading(true)
    setResult('')
    try {
      const reply = await callGemini(
        `Analyze this error/bug report and provide a detailed diagnosis.

Language/Framework: ${language}
${context ? `Additional context: ${context}` : ''}

Error log / Stack trace:
\`\`\`
${errorLog}
\`\`\`

Provide:
1. **Root Cause Analysis**: What exactly went wrong and why
2. **Error Explanation**: Plain-English explanation of each part of the error
3. **Fix**: Exact code fix with before/after comparison
4. **Prevention**: How to prevent this error in the future
5. **Related Issues**: Common related bugs to watch out for
6. **Debugging Tips**: Steps to debug similar issues`,
        {
          systemInstruction: 'You are a senior software debugging expert. Provide clear, actionable bug analysis with code fixes. Use markdown formatting with code blocks.',
          maxTokens: 4096,
          temperature: 0.3,
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
    <ToolLayout icon={Bug} title="Bug Detective" description="Analyze error logs and stack traces to find root causes" color="#dc2626">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <form onSubmit={handleAnalyze} className="space-y-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-300">Error Log / Stack Trace</label>
                <select value={language} onChange={(e) => setLanguage(e.target.value)} className="bg-gray-800 text-white text-xs rounded-lg px-2 py-1 border border-gray-700">
                  {languages.map((l) => <option key={l}>{l}</option>)}
                </select>
              </div>
              <textarea
                value={errorLog}
                onChange={(e) => setErrorLog(e.target.value)}
                rows={14}
                className="w-full px-4 py-3 bg-gray-950 border border-gray-700 rounded-lg text-red-400 text-xs font-mono placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                placeholder="Paste your error message, stack trace, or buggy code here...

Example:
TypeError: Cannot read properties of undefined (reading 'map')
    at UserList (UserList.jsx:15:23)
    at renderWithHooks (react-dom.development.js:14985:18)
    ..."
                spellCheck={false}
              />
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <label className="block text-sm font-medium text-gray-300 mb-2">Additional Context (optional)</label>
              <textarea value={context} onChange={(e) => setContext(e.target.value)} rows={3} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-500 resize-none" placeholder="What were you trying to do? What changed recently? What have you tried?" />
            </div>

            <button type="submit" disabled={loading || !errorLog.trim()} className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 cursor-pointer">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <AlertTriangle className="w-5 h-5" />}
              {loading ? 'Analyzing...' : 'Analyze Bug'}
            </button>
          </form>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl flex flex-col h-[calc(100vh-220px)]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <span className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-red-400" /> Diagnosis
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
              <div className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap font-mono">{result}</div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 text-center">
                <div>
                  <Bug className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                  <p className="text-sm">Paste an error log to start debugging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
