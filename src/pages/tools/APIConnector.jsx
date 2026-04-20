import { useState } from 'react'
import { Workflow, Play, Loader2, Plus, Trash2, Copy, Check } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'

const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
const methodColors = { GET: '#22c55e', POST: '#3b82f6', PUT: '#f59e0b', PATCH: '#a855f7', DELETE: '#ef4444' }

export default function APIConnector() {
  const [url, setUrl] = useState('')
  const [method, setMethod] = useState('GET')
  const [headers, setHeaders] = useState([{ key: 'Content-Type', value: 'application/json' }])
  const [body, setBody] = useState('')
  const [response, setResponse] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState('body')
  const [history, setHistory] = useState([])

  function addHeader() {
    setHeaders((prev) => [...prev, { key: '', value: '' }])
  }

  function removeHeader(i) {
    setHeaders((prev) => prev.filter((_, idx) => idx !== i))
  }

  function updateHeader(i, field, value) {
    setHeaders((prev) => prev.map((h, idx) => idx === i ? { ...h, [field]: value } : h))
  }

  async function handleSend(e) {
    e.preventDefault()
    if (!url.trim()) return
    setLoading(true)
    setResponse(null)
    const start = performance.now()
    try {
      const opts = { method }
      const headerObj = {}
      headers.filter((h) => h.key.trim()).forEach((h) => { headerObj[h.key] = h.value })
      opts.headers = headerObj
      if (['POST', 'PUT', 'PATCH'].includes(method) && body.trim()) {
        opts.body = body
      }

      const res = await fetch(url, opts)
      const duration = Math.round(performance.now() - start)
      let responseBody
      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('json')) {
        responseBody = JSON.stringify(await res.json(), null, 2)
      } else {
        responseBody = await res.text()
      }

      const responseHeaders = {}
      res.headers.forEach((v, k) => { responseHeaders[k] = v })

      const result = {
        status: res.status,
        statusText: res.statusText,
        duration,
        headers: responseHeaders,
        body: responseBody,
        size: new Blob([responseBody]).size,
      }
      setResponse(result)
      setHistory((prev) => [{ method, url, status: res.status, duration, time: new Date() }, ...prev.slice(0, 19)])
    } catch (err) {
      setResponse({ status: 0, statusText: 'Error', body: err.message, duration: Math.round(performance.now() - start), headers: {}, size: 0 })
    }
    setLoading(false)
  }

  function handleCopy() {
    if (!response?.body) return
    navigator.clipboard.writeText(response.body)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const statusColor = response ? (response.status >= 200 && response.status < 300 ? 'text-green-400' : response.status >= 400 ? 'text-red-400' : 'text-yellow-400') : ''

  return (
    <ToolLayout icon={Workflow} title="API Connector" description="Test APIs and build custom data pipelines" color="#0ea5e9">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <form onSubmit={handleSend}>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex gap-2 mb-3">
                <select value={method} onChange={(e) => setMethod(e.target.value)} className="bg-gray-800 text-sm rounded-lg px-3 py-2.5 border border-gray-700 font-bold" style={{ color: methodColors[method] }}>
                  {methods.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <input value={url} onChange={(e) => setUrl(e.target.value)} className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500" placeholder="https://api.example.com/data" required />
                <button type="submit" disabled={loading || !url.trim()} className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-colors disabled:opacity-50 cursor-pointer font-medium text-sm">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mb-3">
                {['body', 'headers'].map((tab) => (
                  <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer capitalize ${activeTab === tab ? 'bg-sky-600 text-white' : 'bg-gray-800 text-gray-400'}`}>
                    {tab} {tab === 'headers' && `(${headers.length})`}
                  </button>
                ))}
              </div>

              {activeTab === 'body' && (
                <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} className="w-full px-4 py-3 bg-gray-950 border border-gray-700 rounded-lg text-green-400 text-xs font-mono placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-sky-500 resize-none" placeholder='{"key": "value"}' spellCheck={false} />
              )}

              {activeTab === 'headers' && (
                <div className="space-y-2">
                  {headers.map((h, i) => (
                    <div key={i} className="flex gap-2">
                      <input value={h.key} onChange={(e) => updateHeader(i, 'key', e.target.value)} placeholder="Key" className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-sky-500" />
                      <input value={h.value} onChange={(e) => updateHeader(i, 'value', e.target.value)} placeholder="Value" className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-sky-500" />
                      <button type="button" onClick={() => removeHeader(i)} className="p-2 text-gray-500 hover:text-red-400 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                  <button type="button" onClick={addHeader} className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 cursor-pointer"><Plus className="w-3 h-3" /> Add Header</button>
                </div>
              )}
            </div>
          </form>

          {/* History */}
          {history.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <h3 className="text-xs font-medium text-gray-400 mb-2">History</h3>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {history.map((h, i) => (
                  <button key={i} onClick={() => { setMethod(h.method); setUrl(h.url) }} className="w-full flex items-center gap-2 px-2 py-1.5 text-left hover:bg-gray-800 rounded-lg cursor-pointer">
                    <span className="text-[10px] font-bold" style={{ color: methodColors[h.method] }}>{h.method}</span>
                    <span className="text-xs text-gray-400 truncate flex-1">{h.url}</span>
                    <span className={`text-[10px] ${h.status >= 200 && h.status < 300 ? 'text-green-400' : 'text-red-400'}`}>{h.status}</span>
                    <span className="text-[10px] text-gray-600">{h.duration}ms</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Response */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl flex flex-col h-[calc(100vh-220px)]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-300">Response</span>
              {response && (
                <>
                  <span className={`text-sm font-bold ${statusColor}`}>{response.status} {response.statusText}</span>
                  <span className="text-xs text-gray-500">{response.duration}ms</span>
                  <span className="text-xs text-gray-500">{(response.size / 1024).toFixed(1)}KB</span>
                </>
              )}
            </div>
            {response && (
              <button onClick={handleCopy} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white cursor-pointer">
                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
          <div className="flex-1 overflow-auto p-4">
            {response ? (
              <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">{response.body}</pre>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <Workflow className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                  <p className="text-sm">Send a request to see the response</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
