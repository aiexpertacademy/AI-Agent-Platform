import { useState } from 'react'
import { Mail, Loader2, Copy, Check, Sparkles, RefreshCw } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'
import { callGemini } from '../../config/gemini'

const emailTypes = ['Business Inquiry', 'Follow-up', 'Job Application', 'Cold Outreach', 'Thank You', 'Complaint', 'Invitation', 'Apology', 'Proposal', 'Introduction']
const tones = ['Professional', 'Friendly', 'Formal', 'Persuasive', 'Empathetic', 'Direct']

export default function EmailComposer() {
  const [purpose, setPurpose] = useState('')
  const [emailType, setEmailType] = useState('Business Inquiry')
  const [tone, setTone] = useState('Professional')
  const [recipient, setRecipient] = useState('')
  const [context, setContext] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleGenerate(e) {
    e.preventDefault()
    if (!purpose.trim()) return
    setLoading(true)
    setResult('')
    try {
      const reply = await callGemini(
        `Write a ${emailType.toLowerCase()} email.

Purpose: ${purpose}
Tone: ${tone}
${recipient ? `Recipient: ${recipient}` : ''}
${context ? `Additional context: ${context}` : ''}

Requirements:
- Include a compelling subject line
- Keep it concise and action-oriented
- Include a clear call-to-action
- Professional formatting
- Appropriate greeting and sign-off

Format the output as:
Subject: [subject line]

[email body]`,
        {
          systemInstruction: 'You are an expert email writer. Write professional, clear, and effective emails. Never use AI-sounding language. Be human and natural.',
          temperature: 0.7,
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
    <ToolLayout icon={Mail} title="Email Composer" description="Draft professional emails with AI suggestions" color="#e11d48">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email Type</label>
                <div className="flex flex-wrap gap-2">
                  {emailTypes.map((t) => (
                    <button key={t} type="button" onClick={() => setEmailType(t)} className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${emailType === t ? 'bg-rose-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Tone</label>
                <div className="flex flex-wrap gap-2">
                  {tones.map((t) => (
                    <button key={t} type="button" onClick={() => setTone(t)} className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${tone === t ? 'bg-rose-600 text-white' : 'bg-gray-800 text-gray-400'}`}>{t}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Recipient (optional)</label>
                <input value={recipient} onChange={(e) => setRecipient(e.target.value)} className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-rose-500" placeholder="Name, title, or role..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Purpose / What to Say *</label>
                <textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} rows={4} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none" placeholder="I want to follow up on our meeting about the Q3 marketing budget and propose..." required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Additional Context (optional)</label>
                <textarea value={context} onChange={(e) => setContext(e.target.value)} rows={2} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none" placeholder="Any background info, previous conversations, deadlines..." />
              </div>
            </div>

            <button type="submit" disabled={loading || !purpose.trim()} className="w-full flex items-center justify-center gap-2 py-3 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 cursor-pointer">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              {loading ? 'Composing...' : 'Compose Email'}
            </button>
          </form>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl flex flex-col h-[calc(100vh-220px)]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <span className="text-sm font-medium text-gray-300">Composed Email</span>
            <div className="flex items-center gap-2">
              {result && (
                <>
                  <button onClick={handleGenerate} disabled={loading} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white cursor-pointer">
                    <RefreshCw className="w-3.5 h-3.5" /> Rewrite
                  </button>
                  <button onClick={handleCopy} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white cursor-pointer">
                    {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            {result ? (
              <div className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{result}</div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 text-center">
                <div>
                  <Mail className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                  <p className="text-sm">Your composed email will appear here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
