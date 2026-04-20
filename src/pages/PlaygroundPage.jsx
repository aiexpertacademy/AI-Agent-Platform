import { useState } from 'react'
import { Sparkles, Send, Loader2, Copy, Check, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { callGemini } from '../config/gemini'

const PRESETS = [
  { label: 'Assistant', instruction: 'You are a helpful, concise AI assistant.' },
  { label: 'Coder', instruction: 'You are an expert software engineer. Provide clean, well-commented code with explanations.' },
  { label: 'Writer', instruction: 'You are a creative writer. Write engagingly, vividly, and with strong narrative voice.' },
  { label: 'Teacher', instruction: 'You are a patient teacher. Explain concepts step by step with simple language and real-world examples.' },
  { label: 'Analyst', instruction: 'You are a data analyst. Be precise, use bullet points, and back statements with logic or data.' },
  { label: 'Custom', instruction: '' },
]

export default function PlaygroundPage() {
  const [prompt, setPrompt] = useState('')
  const [systemInstruction, setSystemInstruction] = useState(PRESETS[0].instruction)
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(2048)
  const [selectedPreset, setSelectedPreset] = useState('Assistant')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showSettings, setShowSettings] = useState(true)
  const [history, setHistory] = useState([])

  async function handleRun(e) {
    e.preventDefault()
    if (!prompt.trim() || loading) return
    setLoading(true)
    setResult('')
    try {
      const reply = await callGemini(prompt, {
        systemInstruction: systemInstruction || undefined,
        temperature,
        maxTokens,
      })
      setResult(reply)
      setHistory((prev) => [
        { prompt: prompt.slice(0, 80) + (prompt.length > 80 ? '…' : ''), result: reply, time: new Date() },
        ...prev.slice(0, 9),
      ])
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

  function applyPreset(preset) {
    setSelectedPreset(preset.label)
    if (preset.label !== 'Custom') setSystemInstruction(preset.instruction)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">AI Playground</h1>
          <p className="text-gray-400 text-sm">Experiment freely with prompts, system instructions, and model parameters</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Input panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Settings panel */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowSettings((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-300 hover:text-white transition-colors cursor-pointer"
            >
              <span>Model Settings</span>
              {showSettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showSettings && (
              <div className="px-4 pb-4 space-y-4 border-t border-gray-800 pt-4">
                {/* Persona presets */}
                <div>
                  <label className="block text-xs text-gray-500 mb-2">Persona Preset</label>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESETS.map((p) => (
                      <button
                        key={p.label}
                        onClick={() => applyPreset(p)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                          selectedPreset === p.label
                            ? 'bg-violet-600 text-white'
                            : 'bg-gray-800 text-gray-400 hover:text-white'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* System instruction */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">System Instruction</label>
                  <textarea
                    value={systemInstruction}
                    onChange={(e) => { setSystemInstruction(e.target.value); setSelectedPreset('Custom') }}
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-xs placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                    placeholder="Define the AI's role and behavior..."
                  />
                </div>

                {/* Temperature */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-gray-500">Temperature</label>
                    <span className="text-xs text-violet-400 font-mono">{temperature.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full accent-violet-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                    <span>Precise (0)</span>
                    <span>Balanced (1)</span>
                    <span>Creative (2)</span>
                  </div>
                </div>

                {/* Max tokens */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-gray-500">Max Output Tokens</label>
                    <span className="text-xs text-violet-400 font-mono">{maxTokens.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="256"
                    max="8192"
                    step="256"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                    className="w-full accent-violet-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                    <span>256</span>
                    <span>8192</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Prompt input */}
          <form onSubmit={handleRun} className="space-y-3">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Your Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={8}
                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                placeholder="Enter your prompt here..."
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading || !prompt.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {loading ? 'Running...' : 'Run Prompt'}
              </button>
              {prompt && (
                <button
                  type="button"
                  onClick={() => { setPrompt(''); setResult('') }}
                  className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-xl transition-colors cursor-pointer"
                  title="Clear"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </form>

          {/* History */}
          {history.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <h3 className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">Recent Prompts</h3>
              <div className="space-y-2">
                {history.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => setResult(h.result)}
                    className="w-full text-left px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs text-gray-400 hover:text-gray-200 transition-colors cursor-pointer truncate"
                    title={h.prompt}
                  >
                    {h.prompt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Output */}
        <div className="lg:col-span-3 bg-gray-900 border border-gray-800 rounded-xl flex flex-col" style={{ minHeight: '500px' }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <span className="text-sm font-medium text-gray-300">Output</span>
            <div className="flex items-center gap-3">
              {result && (
                <>
                  <span className="text-xs text-gray-500">
                    {result.trim().split(/\s+/).length} words
                  </span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Loader2 className="w-10 h-10 text-violet-400 animate-spin mb-3" />
                <p className="text-sm">Generating response...</p>
              </div>
            ) : result ? (
              <div className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{result}</div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-600 text-center">
                <Sparkles className="w-14 h-14 mb-3 text-gray-700" />
                <p className="text-sm">Your AI response will appear here</p>
                <p className="text-xs mt-1 text-gray-700">Adjust settings, write a prompt, and hit Run</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
