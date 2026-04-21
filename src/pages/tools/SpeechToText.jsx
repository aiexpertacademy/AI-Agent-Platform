import { useState, useRef } from 'react'
import { Mic, MicOff, Copy, Check, Trash2, Download } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'

export default function SpeechToText() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimText, setInterimText] = useState('')
  const [lang, setLang] = useState('en-US')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const recognitionRef = useRef(null)

  const languages = [
    { code: 'en-US', label: 'English (US)' },
    { code: 'en-GB', label: 'English (UK)' },
    { code: 'es-ES', label: 'Spanish' },
    { code: 'fr-FR', label: 'French' },
    { code: 'de-DE', label: 'German' },
    { code: 'hi-IN', label: 'Hindi' },
    { code: 'ja-JP', label: 'Japanese' },
    { code: 'ko-KR', label: 'Korean' },
    { code: 'zh-CN', label: 'Chinese (Simplified)' },
    { code: 'pt-BR', label: 'Portuguese (BR)' },
    { code: 'ar-SA', label: 'Arabic' },
    { code: 'ru-RU', label: 'Russian' },
  ]

  async function startListening() {
    setError('')
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setError('Speech Recognition is not supported in this browser. Please use Chrome or Edge.')
      return
    }

    // Request mic permission explicitly so the browser shows the allow prompt
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Microphone access denied. Click the lock/camera icon in your browser address bar, set Microphone to "Allow", then refresh and try again.')
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No microphone detected. Please plug in a microphone or headset and try again.')
      } else {
        setError(`Microphone error: ${err.message}. Make sure no other app (Zoom, Teams, etc.) is using your mic.`)
      }
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = lang

    recognition.onresult = (event) => {
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          final += t + ' '
        } else {
          interim += t
        }
      }
      if (final) setTranscript((prev) => prev + final)
      setInterimText(interim)
    }

    recognition.onerror = (event) => {
      const msgs = {
        'not-allowed': 'Microphone access denied. Click the lock icon in your address bar, set Microphone to "Allow", then refresh.',
        'audio-capture': 'Browser cannot access your microphone. Make sure no other app (Zoom, Teams, etc.) is using it, then try again.',
        'no-speech': 'No speech detected. Please speak clearly and try again.',
        'network': 'Network error during speech recognition. Check your internet connection.',
        'aborted': '',
        'service-not-allowed': 'Speech recognition not allowed. Make sure you are on HTTPS or localhost.',
      }
      const msg = msgs[event.error] ?? `Speech recognition error: ${event.error}. Try using Chrome or Edge.`
      if (msg) setError(msg)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
      setInterimText('')
    }

    recognition.start()
    recognitionRef.current = recognition
    setIsListening(true)
  }

  function stopListening() {
    recognitionRef.current?.stop()
    setIsListening(false)
    setInterimText('')
  }

  function handleCopy() {
    navigator.clipboard.writeText(transcript)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownload() {
    const blob = new Blob([transcript], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `transcript-${Date.now()}.txt`
    a.click()
  }

  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0

  return (
    <ToolLayout icon={Mic} title="Speech to Text" description="Transcribe live speech with high accuracy" color="#ef4444">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Controls */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex flex-col items-center gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 text-center">Language</label>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                disabled={isListening}
                className="bg-gray-800 text-white text-sm rounded-lg px-4 py-2 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {languages.map((l) => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
            </div>

            <button
              onClick={isListening ? stopListening : startListening}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isListening
                  ? 'bg-red-600 hover:bg-red-700 animate-pulse shadow-lg shadow-red-600/30'
                  : 'bg-gray-800 hover:bg-gray-700 border-2 border-gray-600'
              }`}
            >
              {isListening ? <MicOff className="w-8 h-8 text-white" /> : <Mic className="w-8 h-8 text-gray-300" />}
            </button>
            <p className="text-sm text-gray-400">{isListening ? 'Listening... Click to stop' : 'Click to start recording'}</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}

        {/* Transcript */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-300">Transcript</span>
              <span className="text-xs text-gray-500">{wordCount} words</span>
            </div>
            <div className="flex items-center gap-2">
              {transcript && (
                <>
                  <button onClick={handleCopy} className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-400 hover:text-white bg-gray-800 rounded-lg cursor-pointer">
                    {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                  <button onClick={handleDownload} className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-400 hover:text-white bg-gray-800 rounded-lg cursor-pointer">
                    <Download className="w-3 h-3" /> Save
                  </button>
                  <button onClick={() => setTranscript('')} className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-400 hover:text-red-400 bg-gray-800 rounded-lg cursor-pointer">
                    <Trash2 className="w-3 h-3" /> Clear
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="min-h-[200px] bg-gray-800 rounded-lg p-4">
            {transcript || interimText ? (
              <p className="text-gray-200 text-sm leading-relaxed">
                {transcript}
                {interimText && <span className="text-gray-500 italic">{interimText}</span>}
              </p>
            ) : (
              <p className="text-gray-500 text-sm">Your transcribed text will appear here...</p>
            )}
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
