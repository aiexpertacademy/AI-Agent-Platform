const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

// Primary model + fallback for when primary is overloaded
const MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite']

function getRetryAfterMs(headers) {
  const val = headers.get('Retry-After') || headers.get('retry-after')
  if (!val) return null
  const secs = parseInt(val, 10)
  return isNaN(secs) ? null : secs * 1000
}

function friendlyError(status, msg = '') {
  const m = msg.toLowerCase()
  if (status === 429) return 'Too many requests — please wait a moment and try again.'
  if (status === 503) return 'Gemini service is temporarily unavailable. Please try again.'
  if (m.includes('quota exceeded') || m.includes('daily')) return 'Daily API quota exceeded. Please try again tomorrow.'
  return msg || `Gemini API error (${status})`
}

// Extract text from response — gemini-2.5-flash may return thinking in part[0]
// so we join ALL text parts and let parseGeminiJSON find the JSON block inside.
function extractText(data) {
  const parts = data.candidates?.[0]?.content?.parts || []
  // Collect all text parts, skip thought/thinking parts
  const textParts = parts
    .filter(p => p.text && !p.thought)
    .map(p => p.text)
  return textParts.join('\n').trim() ||
    parts.find(p => p.text)?.text || ''
}

async function callWithRetry(body, { maxTokens = 4096 } = {}) {
  const fullBody = {
    ...body,
    generationConfig: { ...body.generationConfig, maxOutputTokens: maxTokens },
  }

  let lastErr

  for (const model of MODELS) {
    const backoffs = [2000, 5000, 10000]
    for (let attempt = 0; attempt <= backoffs.length; attempt++) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fullBody) }
        )

        if (res.ok) {
          const data = await res.json()
          return extractText(data)
        }

        const err = await res.json().catch(() => ({}))
        const msg = err.error?.message || ''

        if ((res.status === 429 || res.status === 503) && attempt < backoffs.length) {
          const waitMs = getRetryAfterMs(res.headers) ?? backoffs[attempt]
          lastErr = new Error(friendlyError(res.status, msg))
          await new Promise(r => setTimeout(r, waitMs))
          continue
        }

        // 404 / not available — break inner loop, try next model
        if (res.status === 404) { lastErr = new Error(msg); break }

        throw new Error(friendlyError(res.status, msg))
      } catch (e) {
        lastErr = e
        const isRetryable = e.message.includes('wait') || e.message.includes('unavailable')
        if (!isRetryable || attempt >= backoffs.length) break
        await new Promise(r => setTimeout(r, backoffs[attempt]))
      }
    }
  }

  throw lastErr || new Error('Request failed after retries. Please try again.')
}

export async function callGemini(prompt, { systemInstruction, temperature = 0.7, maxTokens = 4096 } = {}) {
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature },
  }
  if (systemInstruction) body.systemInstruction = { parts: [{ text: systemInstruction }] }
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
  if (systemInstruction) body.systemInstruction = { parts: [{ text: systemInstruction }] }
  return callWithRetry(body, { maxTokens: 8192 })
}

// ── Robust JSON parser ─────────────────────────────────────────────────────────
// Handles: markdown fences, truncated responses, extra text before/after JSON
export function parseGeminiJSON(text) {
  if (!text) throw new Error('Empty response from AI. Please try again.')

  // 1. Strip markdown code fences
  let s = text.replace(/^```(?:json)?\s*/im, '').replace(/\n?```\s*$/im, '').trim()

  // 2. Direct parse
  try { return JSON.parse(s) } catch { /* continue */ }

  // 3. Extract first {...} block
  const objStart = s.indexOf('{')
  const objEnd = s.lastIndexOf('}')
  if (objStart !== -1 && objEnd > objStart) {
    const candidate = s.slice(objStart, objEnd + 1)
    try { return JSON.parse(candidate) } catch { /* continue */ }

    // 4. Truncated JSON — close any unclosed braces/brackets/strings
    try {
      const fixed = closeTruncatedJSON(candidate)
      return JSON.parse(fixed)
    } catch { /* continue */ }
  }

  // 5. Extract first [...] block
  const arrStart = s.indexOf('[')
  const arrEnd = s.lastIndexOf(']')
  if (arrStart !== -1 && arrEnd > arrStart) {
    try { return JSON.parse(s.slice(arrStart, arrEnd + 1)) } catch { /* continue */ }
  }

  console.error('parseGeminiJSON failed. Raw text:', text?.slice(0, 400))
  throw new Error('Could not parse AI response. Please try again.')
}

function closeTruncatedJSON(s) {
  const stack = []
  let inString = false
  let escape = false
  for (const ch of s) {
    if (escape) { escape = false; continue }
    if (ch === '\\' && inString) { escape = true; continue }
    if (ch === '"') { inString = !inString; continue }
    if (inString) continue
    if (ch === '{' || ch === '[') stack.push(ch === '{' ? '}' : ']')
    else if (ch === '}' || ch === ']') stack.pop()
  }
  // Close open string first if needed
  let fixed = s
  if (inString) fixed += '"'
  // Close open containers in reverse
  return fixed + stack.reverse().join('')
}
