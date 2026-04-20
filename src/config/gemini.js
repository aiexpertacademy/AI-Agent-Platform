const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

export async function callGemini(prompt, { systemInstruction, temperature = 0.7, maxTokens = 4096 } = {}) {
  const contents = [{ parts: [{ text: prompt }] }]

  const body = {
    contents,
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
  }

  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] }
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  )

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error?.message || 'Gemini API request failed')
  }

  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

export async function callGeminiChat(messages, { systemInstruction, temperature = 0.7 } = {}) {
  const contents = messages.map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.text }],
  }))

  const body = {
    contents,
    generationConfig: { temperature, maxOutputTokens: 8192 },
  }

  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] }
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  )

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error?.message || 'Gemini API request failed')
  }

  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}
