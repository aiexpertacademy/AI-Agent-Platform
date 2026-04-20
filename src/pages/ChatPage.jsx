import { useState, useRef, useEffect } from 'react'
import { MessageSquare, Send, Loader2, Trash2, User, Bot, Sparkles } from 'lucide-react'
import { callGeminiChat } from '../config/gemini'

const SUGGESTED = [
  'Explain quantum computing in simple terms',
  'Write a Python function to reverse a linked list',
  'What are the best practices for React performance?',
  'Help me brainstorm names for a SaaS startup',
]

export default function ChatPage() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text) {
    const trimmed = text.trim()
    if (!trimmed || loading) return
    const userMsg = { role: 'user', text: trimmed }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput('')
    setLoading(true)
    try {
      const reply = await callGeminiChat(updated, {
        systemInstruction:
          'You are a helpful, friendly AI assistant. Give clear, concise answers. Use markdown formatting when helpful. For code, use code blocks with language tags.',
      })
      setMessages([...updated, { role: 'model', text: reply }])
    } catch (err) {
      setMessages([...updated, { role: 'model', text: `Error: ${err.message}` }])
    }
    setLoading(false)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function handleSubmit(e) {
    e.preventDefault()
    sendMessage(input)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-96px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Chat</h1>
            <p className="text-gray-400 text-sm">Powered by Gemini 2.0 Flash</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 bg-gray-900 border border-gray-800 rounded-2xl flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 flex items-center justify-center mb-4">
                <Bot className="w-8 h-8 text-indigo-400" />
              </div>
              <p className="text-lg font-semibold text-white mb-1">How can I help you today?</p>
              <p className="text-sm text-gray-500 mb-8">Ask anything — coding, writing, analysis, ideas...</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
                {SUGGESTED.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="flex items-start gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-left text-sm text-gray-300 hover:text-white transition-colors cursor-pointer border border-gray-700 hover:border-indigo-500/50"
                  >
                    <Sparkles className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'model' && (
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-indigo-400" />
                </div>
              )}
              <div
                className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-md'
                    : 'bg-gray-800 text-gray-200 rounded-bl-md'
                }`}
              >
                {msg.text}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-gray-300" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="bg-gray-800 px-4 py-3 rounded-2xl rounded-bl-md flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-800 p-4">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message AI..."
              className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage(input)
                }
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
