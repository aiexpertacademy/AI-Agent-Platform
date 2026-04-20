import { useState, useRef, useEffect } from 'react'
import { MessageSquare, Send, Loader2, Trash2, User, Bot } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'
import { callGeminiChat } from '../../config/gemini'

export default function AIChatbot() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e) {
    e.preventDefault()
    if (!input.trim() || loading) return
    const userMsg = { role: 'user', text: input.trim() }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput('')
    setLoading(true)
    try {
      const reply = await callGeminiChat(updated, {
        systemInstruction: 'You are a helpful, friendly AI assistant. Give clear, concise answers. Use markdown formatting when helpful. For code, use code blocks with language tags.',
      })
      setMessages([...updated, { role: 'model', text: reply }])
    } catch (err) {
      setMessages([...updated, { role: 'model', text: `Error: ${err.message}` }])
    }
    setLoading(false)
  }

  return (
    <ToolLayout icon={MessageSquare} title="AI Chatbot" description="Conversational AI assistant for Q&A and brainstorming" color="#6366f1">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl flex flex-col h-[calc(100vh-220px)]">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
              <Bot className="w-12 h-12 mb-3 text-gray-600" />
              <p className="text-lg font-medium text-gray-400">Start a conversation</p>
              <p className="text-sm mt-1">Ask me anything — coding, writing, brainstorming, analysis...</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'model' && (
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-indigo-400" />
                </div>
              )}
              <div
                className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-md'
                    : 'bg-gray-800 text-gray-200 rounded-bl-md'
                }`}
              >
                {msg.text}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0">
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
              <div className="bg-gray-800 px-4 py-3 rounded-2xl rounded-bl-md">
                <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-800 p-4">
          <form onSubmit={handleSend} className="flex gap-3">
            {messages.length > 0 && (
              <button
                type="button"
                onClick={() => setMessages([])}
                className="p-3 text-gray-500 hover:text-red-400 hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
                title="Clear chat"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
    </ToolLayout>
  )
}
