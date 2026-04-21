const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

// Model fallback chain: primary → fallback → last resort
const MODELS = ['gemini-2.0-flash']

function friendlyError(status, msg = '') {
  if (status === 429) return 'API rate limit reached — too many requests. Please wait 30 seconds and try again.'
  if (status === 503) return 'Gemini service is temporarily unavailable. Please try again in a moment.'
  if (msg.toLowerCase().includes('quota')) return 'Daily API quota exceeded. Please try again tomorrow or check your API key limits.'
  if (msg.toLowerCase().includes('resource exhausted')) return 'API quota exhausted. Please wait a moment and try again.'
  return msg || 'Gemini API request failed'
}

async function callWithRetry(body, { maxTokens = 4096 } = {}) {
  const fullBody = { ...body, generationConfig: { ...body.generationConfig, maxOutputTokens: maxTokens } }
  let lastErr

  for (const model of MODELS) {
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) {
        await new Promise(r => setTimeout(r, attempt * 3000)) // 3s, 6s backoff
      }
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fullBody) }
        )
        if (res.ok) {
          const data = await res.json()
          return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
        }
        const err = await res.json().catch(() => ({}))
        const msg = err.error?.message || ''
        if (res.status === 429 || res.status === 503) {
          lastErr = new Error(friendlyError(res.status, msg))
          // On 429: retry current model with backoff, then try next model
          continue
        }
        throw new Error(friendlyError(res.status, msg))
      } catch (e) {
        lastErr = e
        // Only retry on rate-limit-style errors
        if (!e.message.includes('rate limit') && !e.message.includes('quota') &&
            !e.message.includes('exhausted') && !e.message.includes('unavailable')) {
          throw e
        }
      }
    }
  }

  throw lastErr || new Error('API request failed after all retries. Please try again later.')
}

export async function callGemini(prompt, { systemInstruction, temperature = 0.7, maxTokens = 4096 } = {}) {
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature },
  }
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] }
  }
  return callWithRetry(body, { maxTokens })
}

export async function callGeminiChat(messages, { systemInstruction, temperature = 0.7 } = {}) {
  const body = {
    contents: messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    })),
    generationConfig: { temperature },
  }
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] }
  }
  return callWithRetry(body, { maxTokens: 8192 })
}
