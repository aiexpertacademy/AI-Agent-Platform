import { useState, useEffect, useRef, useCallback } from 'react'
import { Languages, Loader2, Copy, Check, ArrowLeftRight, Volume2, VolumeX, Mic, MicOff, Trash2, Clock, Star, ChevronDown, X, Sparkles } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'
import { callGemini } from '../../config/gemini'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../services/api'

// 60 languages with BCP-47 codes for TTS
const languages = [
  { name: 'English', code: 'en' },
  { name: 'Spanish', code: 'es' },
  { name: 'French', code: 'fr' },
  { name: 'German', code: 'de' },
  { name: 'Italian', code: 'it' },
  { name: 'Portuguese', code: 'pt' },
  { name: 'Russian', code: 'ru' },
  { name: 'Chinese (Simplified)', code: 'zh-CN' },
  { name: 'Chinese (Traditional)', code: 'zh-TW' },
  { name: 'Japanese', code: 'ja' },
  { name: 'Korean', code: 'ko' },
  { name: 'Arabic', code: 'ar' },
  { name: 'Hindi', code: 'hi' },
  { name: 'Bengali', code: 'bn' },
  { name: 'Urdu', code: 'ur' },
  { name: 'Punjabi', code: 'pa' },
  { name: 'Tamil', code: 'ta' },
  { name: 'Telugu', code: 'te' },
  { name: 'Marathi', code: 'mr' },
  { name: 'Gujarati', code: 'gu' },
  { name: 'Kannada', code: 'kn' },
  { name: 'Malayalam', code: 'ml' },
  { name: 'Thai', code: 'th' },
  { name: 'Vietnamese', code: 'vi' },
  { name: 'Indonesian', code: 'id' },
  { name: 'Malay', code: 'ms' },
  { name: 'Filipino', code: 'fil' },
  { name: 'Turkish', code: 'tr' },
  { name: 'Polish', code: 'pl' },
  { name: 'Dutch', code: 'nl' },
  { name: 'Swedish', code: 'sv' },
  { name: 'Norwegian', code: 'no' },
  { name: 'Danish', code: 'da' },
  { name: 'Finnish', code: 'fi' },
  { name: 'Greek', code: 'el' },
  { name: 'Czech', code: 'cs' },
  { name: 'Romanian', code: 'ro' },
  { name: 'Hungarian', code: 'hu' },
  { name: 'Ukrainian', code: 'uk' },
  { name: 'Persian', code: 'fa' },
  { name: 'Hebrew', code: 'he' },
  { name: 'Swahili', code: 'sw' },
  { name: 'Catalan', code: 'ca' },
  { name: 'Croatian', code: 'hr' },
  { name: 'Serbian', code: 'sr' },
  { name: 'Slovak', code: 'sk' },
  { name: 'Bulgarian', code: 'bg' },
  { name: 'Latvian', code: 'lv' },
  { name: 'Lithuanian', code: 'lt' },
  { name: 'Estonian', code: 'et' },
  { name: 'Slovenian', code: 'sl' },
  { name: 'Icelandic', code: 'is' },
  { name: 'Irish', code: 'ga' },
  { name: 'Welsh', code: 'cy' },
  { name: 'Nepali', code: 'ne' },
  { name: 'Sinhala', code: 'si' },
  { name: 'Amharic', code: 'am' },
  { name: 'Georgian', code: 'ka' },
  { name: 'Armenian', code: 'hy' },
  { name: 'Azerbaijani', code: 'az' },
]

function getLangCode(name) {
  return languages.find(l => l.name === name)?.code || 'en'
}

// Searchable language dropdown
function LangSelect({ value, onChange, label }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filtered = languages.filter(l => l.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="relative flex-1" ref={ref}>
      <button type="button" onClick={() => { setOpen(v => !v); setSearch('') }}
        className="w-full flex items-center justify-between bg-gray-800 text-white text-sm rounded-lg px-4 py-2.5 border border-gray-700 hover:border-gray-600 cursor-pointer transition-colors">
        <span>{value}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-gray-800">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search language..."
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filtered.map(l => (
              <button key={l.name} type="button"
                onClick={() => { onChange(l.name); setOpen(false) }}
                className={`w-full text-left px-4 py-2 text-sm cursor-pointer transition-colors ${
                  value === l.name ? 'bg-violet-600/20 text-violet-300' : 'text-gray-300 hover:bg-gray-800'
                }`}>
                {l.name}
                <span className="text-xs text-gray-500 ml-2">{l.code}</span>
              </button>
            ))}
            {filtered.length === 0 && <p className="px-4 py-3 text-sm text-gray-500">No match</p>}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Translator() {
  const { currentUser } = useAuth()
  const [text, setText] = useState('')
  const [from, setFrom] = useState('English')
  const [to, setTo] = useState('Spanish')
  const [result, setResult] = useState('')
  const [alternatives, setAlternatives] = useState([])
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copiedSrc, setCopiedSrc] = useState(false)

  // Real-time translation
  const [realtimeEnabled, setRealtimeEnabled] = useState(false)
  const debounceRef = useRef(null)
  const textRef = useRef(text) // always-fresh ref for STT closure
  useEffect(() => { textRef.current = text }, [text])

  // TTS state
  const [speakingSrc, setSpeakingSrc] = useState(false)
  const [speakingTgt, setSpeakingTgt] = useState(false)

  // STT state
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef(null)
  const [autoSpeak, setAutoSpeak] = useState(true) // auto TTS after voice translate
  const pendingVoiceTranslate = useRef(false) // flag: was the input from voice?
  const listeningRef = useRef(false) // fresh ref for onend closure

  // History
  const [history, setHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)

  // Load translation history from MongoDB
  useEffect(() => {
    if (!currentUser) return
    api.getTranslations(currentUser.uid)
      .then(list => setHistory(list))
      .catch(() => {})
  }, [currentUser])

  // Save translation to MongoDB
  async function saveToHistory(srcText, translated, srcLang, tgtLang) {
    if (!currentUser || !srcText.trim() || !translated.trim()) return
    try {
      const entry = await api.saveTranslation(currentUser.uid, {
        source: srcText.slice(0, 500),
        translated: translated.slice(0, 500),
        from: srcLang,
        to: tgtLang,
      })
      setHistory(prev => [{ ...entry, id: entry.id }, ...prev].slice(0, 30))
    } catch { /* silent */ }
  }

  async function deleteHistoryItem(id) {
    if (!currentUser) return
    try {
      await api.deleteTranslation(currentUser.uid, id)
      setHistory(prev => prev.filter(h => h.id !== id))
    } catch { /* */ }
  }

  // Core translate function
  const doTranslate = useCallback(async (inputText, srcLang, tgtLang, save = true) => {
    if (!inputText.trim()) { setResult(''); return }
    setLoading(true)
    setAlternatives([])
    let translated = ''
    try {
      const reply = await callGemini(
        `Translate the following text from ${srcLang} to ${tgtLang}.

Text: "${inputText}"

Return ONLY valid JSON (no markdown, no code fences):
{
  "translation": "the main translation",
  "transliteration": "romanized pronunciation if target uses non-Latin script, otherwise null",
  "alternatives": ["alternative translation 1", "alternative translation 2"],
  "notes": "brief note about formality level, nuances, or context if relevant, otherwise null"
}`,
        { temperature: 0.3 }
      )
      const cleaned = reply.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
      const parsed = JSON.parse(cleaned)
      translated = parsed.translation || ''
      setResult(translated)
      const alts = []
      if (parsed.transliteration) alts.push(`Pronunciation: ${parsed.transliteration}`)
      if (parsed.alternatives) alts.push(...parsed.alternatives)
      if (parsed.notes) alts.push(`Note: ${parsed.notes}`)
      setAlternatives(alts)
      if (save && translated) saveToHistory(inputText, translated, srcLang, tgtLang)
    } catch {
      try {
        const reply = await callGemini(`Translate from ${srcLang} to ${tgtLang}: "${inputText}"\n\nReturn only the translation, nothing else.`, { temperature: 0.2 })
        translated = reply.trim()
        setResult(translated)
        if (save && translated) saveToHistory(inputText, translated, srcLang, tgtLang)
      } catch (err) {
        setResult(`Error: ${err.message}`)
      }
    }
    setLoading(false)

    // Auto-speak the result if input came from voice
    if (pendingVoiceTranslate.current && translated && autoSpeak) {
      pendingVoiceTranslate.current = false
      // Small delay so UI updates first
      setTimeout(() => speak(translated, tgtLang, setSpeakingTgt), 300)
    }
  }, [currentUser, autoSpeak])

  // Manual translate
  function handleTranslate(e) {
    e.preventDefault()
    doTranslate(text, from, to)
  }

  // Real-time translate on text change (typing only — voice triggers directly)
  useEffect(() => {
    if (!realtimeEnabled || !text.trim() || listening) return
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      doTranslate(text, from, to, false)
    }, 600)
    return () => clearTimeout(debounceRef.current)
  }, [text, from, to, realtimeEnabled, doTranslate, listening])

  // Swap languages
  function swapLanguages() {
    setFrom(to)
    setTo(from)
    if (result) {
      setText(result)
      setResult(text)
    }
  }

  // Copy
  function handleCopy(target) {
    navigator.clipboard.writeText(target === 'src' ? text : result)
    if (target === 'src') { setCopiedSrc(true); setTimeout(() => setCopiedSrc(false), 2000) }
    else { setCopied(true); setTimeout(() => setCopied(false), 2000) }
  }

  // TTS
  function speak(textToSpeak, lang, setSpeaking) {
    window.speechSynthesis.cancel()
    if (!textToSpeak) return
    const utterance = new SpeechSynthesisUtterance(textToSpeak)
    utterance.lang = getLangCode(lang)
    utterance.rate = 0.9
    const voices = window.speechSynthesis.getVoices()
    const langCode = getLangCode(lang)
    const match = voices.find(v => v.lang.startsWith(langCode))
    if (match) utterance.voice = match
    setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  function stopSpeaking() {
    window.speechSynthesis.cancel()
    setSpeakingSrc(false)
    setSpeakingTgt(false)
  }

  // STT — Speech to Text (real-time voice input with live translation)
  function toggleListening() {
    if (listening) {
      listeningRef.current = false
      recognitionRef.current?.stop()
      setListening(false)
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) { alert('Speech recognition not supported in this browser'); return }

    const recognition = new SpeechRecognition()
    recognition.lang = getLangCode(from)
    recognition.interimResults = true
    recognition.continuous = true
    recognition.maxAlternatives = 1

    // We keep a running transcript that accumulates final results
    let accumulated = textRef.current || ''

    recognition.onresult = (event) => {
      let interim = ''
      let newFinal = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          newFinal += transcript
        } else {
          interim += transcript
        }
      }

      if (newFinal) {
        accumulated += (accumulated ? ' ' : '') + newFinal.trim()
        textRef.current = accumulated
        setText(accumulated)
        // Immediately trigger translation for the final result
        pendingVoiceTranslate.current = true
        doTranslate(accumulated, from, to, true)
      } else {
        // Show interim (live preview of what user is saying)
        setText(accumulated + (interim ? ' ' + interim : ''))
      }
    }

    recognition.onerror = () => setListening(false)
    recognition.onend = () => {
      // Auto-restart if user hasn't manually stopped (Chrome kills it after ~60s)
      if (listeningRef.current && recognitionRef.current) {
        try { recognitionRef.current.start() } catch { setListening(false); listeningRef.current = false }
      } else {
        setListening(false)
        listeningRef.current = false
      }
    }

    recognition.start()
    recognitionRef.current = recognition
    setListening(true)
    listeningRef.current = true
  }

  // Load a history item
  function loadHistory(item) {
    setText(item.source)
    setResult(item.translated)
    setFrom(item.from)
    setTo(item.to)
    setShowHistory(false)
  }

  // Load voices
  useEffect(() => {
    window.speechSynthesis?.getVoices()
    window.speechSynthesis?.addEventListener?.('voiceschanged', () => window.speechSynthesis.getVoices())
  }, [])

  return (
    <ToolLayout icon={Languages} title="Translator" description="Real-time translation with speech input & output, 60+ languages" color="#7c3aed">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Top bar: Language selector + controls */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <LangSelect value={from} onChange={setFrom} label="From" />

            <button type="button" onClick={swapLanguages}
              className="p-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-400 hover:text-white transition-all cursor-pointer hover:rotate-180 duration-300 flex-shrink-0">
              <ArrowLeftRight className="w-5 h-5" />
            </button>

            <LangSelect value={to} onChange={setTo} label="To" />
          </div>

          {/* Realtime toggle + history button */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800">
            <div className="flex items-center gap-4">
              <button type="button" onClick={() => setRealtimeEnabled(v => !v)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  realtimeEnabled ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30' : 'bg-gray-800 text-gray-500 hover:text-gray-300'
                }`}>
                <Sparkles className="w-3.5 h-3.5" />
                {realtimeEnabled ? 'Real-time ON' : 'Real-time OFF'}
              </button>

              <button type="button" onClick={toggleListening}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  listening
                    ? 'bg-red-600/20 text-red-400 border border-red-500/30 animate-pulse'
                    : 'bg-gray-800 text-gray-500 hover:text-gray-300'
                }`}>
                {listening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                {listening ? 'Stop Listening' : 'Voice Input'}
              </button>

              <button type="button" onClick={() => setAutoSpeak(v => !v)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  autoSpeak ? 'bg-green-600/20 text-green-400 border border-green-500/30' : 'bg-gray-800 text-gray-500 hover:text-gray-300'
                }`}>
                {autoSpeak ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                {autoSpeak ? 'Auto-Speak ON' : 'Auto-Speak OFF'}
              </button>
            </div>

            <button type="button" onClick={() => setShowHistory(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 text-xs rounded-lg cursor-pointer transition-colors">
              <Clock className="w-3.5 h-3.5" />
              History ({history.length})
            </button>
          </div>
        </div>

        {/* Main translation area */}
        <form onSubmit={handleTranslate}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Source panel */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800 bg-gray-900/50">
                <span className="text-xs font-semibold text-violet-400">{from}</span>
                <div className="flex items-center gap-1.5">
                  {listening && (
                    <span className="flex items-center gap-1 text-[10px] text-red-400 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> Recording
                    </span>
                  )}
                  {text && (
                    <>
                      <button type="button" onClick={() => speak(text, from, setSpeakingSrc)}
                        className={`p-1.5 rounded-lg cursor-pointer transition-colors ${speakingSrc ? 'bg-violet-600/20 text-violet-400' : 'text-gray-500 hover:text-violet-400'}`}
                        title="Listen">
                        {speakingSrc ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                      <button type="button" onClick={() => handleCopy('src')}
                        className="p-1.5 text-gray-500 hover:text-white cursor-pointer rounded-lg transition-colors" title="Copy">
                        {copiedSrc ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button type="button" onClick={() => { setText(''); setResult('') }}
                        className="p-1.5 text-gray-500 hover:text-red-400 cursor-pointer rounded-lg transition-colors" title="Clear">
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <span className="text-[10px] text-gray-600 ml-1">{text.length}</span>
                </div>
              </div>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                rows={8}
                className="flex-1 w-full bg-transparent text-white text-sm placeholder-gray-500 focus:outline-none resize-none p-4 leading-relaxed"
                placeholder="Type, paste, or use voice input to translate..."
              />
              {/* Voice input hint */}
              {!text && (
                <div className="px-4 pb-3">
                  <button type="button" onClick={toggleListening}
                    className="flex items-center gap-2 text-xs text-gray-600 hover:text-violet-400 cursor-pointer transition-colors">
                    <Mic className="w-4 h-4" /> Click to speak in {from}
                  </button>
                </div>
              )}
            </div>

            {/* Target panel */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800 bg-gray-900/50">
                <span className="text-xs font-semibold text-violet-400">{to}</span>
                <div className="flex items-center gap-1.5">
                  {loading && <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />}
                  {result && !loading && (
                    <>
                      <button type="button" onClick={() => speak(result, to, setSpeakingTgt)}
                        className={`p-1.5 rounded-lg cursor-pointer transition-colors ${speakingTgt ? 'bg-violet-600/20 text-violet-400' : 'text-gray-500 hover:text-violet-400'}`}
                        title="Listen">
                        {speakingTgt ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                      <button type="button" onClick={() => handleCopy('tgt')}
                        className="p-1.5 text-gray-500 hover:text-white cursor-pointer rounded-lg transition-colors" title="Copy">
                        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="flex-1 p-4 min-h-[200px]">
                {loading && !result ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Loader2 className="w-6 h-6 text-violet-400 animate-spin mx-auto mb-2" />
                      <p className="text-xs text-gray-500">Translating...</p>
                    </div>
                  </div>
                ) : result ? (
                  <p className="text-white text-sm leading-relaxed">{result}</p>
                ) : (
                  <p className="text-gray-500 text-sm">Translation will appear here...</p>
                )}
              </div>
              {/* Auto-speak after translation */}
              {result && !loading && (
                <div className="px-4 pb-3">
                  <button type="button" onClick={() => speak(result, to, setSpeakingTgt)}
                    className="flex items-center gap-2 text-xs text-gray-600 hover:text-violet-400 cursor-pointer transition-colors">
                    <Volume2 className="w-4 h-4" /> Listen in {to}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Translate button (hidden in realtime mode) */}
          {!realtimeEnabled && (
            <button type="submit" disabled={loading || !text.trim()}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 cursor-pointer">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Languages className="w-5 h-5" />}
              {loading ? 'Translating...' : 'Translate'}
            </button>
          )}
        </form>

        {/* Alternatives & Notes */}
        {alternatives.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Alternatives & Notes</h3>
            {alternatives.map((alt, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 flex-shrink-0" />
                <p className="text-sm text-gray-300 leading-relaxed">{alt}</p>
              </div>
            ))}
          </div>
        )}

        {/* Translation History */}
        {showHistory && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-violet-400" /> Translation History
              </h3>
              <button onClick={() => setShowHistory(false)}
                className="p-1 text-gray-500 hover:text-white cursor-pointer transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            {history.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">No translations saved yet</div>
            ) : (
              <div className="max-h-80 overflow-y-auto divide-y divide-gray-800">
                {history.map(item => (
                  <div key={item.id} className="px-4 py-3 hover:bg-gray-800/50 transition-colors group">
                    <div className="flex items-start justify-between gap-3">
                      <button type="button" onClick={() => loadHistory(item)}
                        className="flex-1 text-left cursor-pointer min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] bg-violet-500/15 text-violet-400 px-2 py-0.5 rounded-full">{item.from}</span>
                          <ArrowLeftRight className="w-3 h-3 text-gray-600" />
                          <span className="text-[10px] bg-violet-500/15 text-violet-400 px-2 py-0.5 rounded-full">{item.to}</span>
                          <span className="text-[10px] text-gray-600 ml-auto">
                            {item.createdAt?.toDate?.()?.toLocaleDateString() || ''}
                          </span>
                        </div>
                        <p className="text-xs text-gray-300 truncate">{item.source}</p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{item.translated}</p>
                      </button>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={() => speak(item.translated, item.to, setSpeakingTgt)}
                          className="p-1 text-gray-500 hover:text-violet-400 cursor-pointer" title="Speak">
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" onClick={() => deleteHistoryItem(item.id)}
                          className="p-1 text-gray-500 hover:text-red-400 cursor-pointer" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
