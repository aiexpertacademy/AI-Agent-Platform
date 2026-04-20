const GEMINI_API_KEY = import.meta.env.VITE_NANO_BANANA_API_KEY || import.meta.env.VITE_GEMINI_API_KEY
const MODEL = 'gemini-3.1-flash-image-preview'
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

export async function generateNanoBananaImage(prompt, { aspectRatio = '16:9', quality = '1K' } = {}) {
  // Map quality to image size hint
  const sizeHint = quality === '4K' ? '4K ultra high resolution' : quality === '2K' ? '2K high resolution' : '1K resolution'
  const aspectPrompt = `${prompt}. Aspect ratio: ${aspectRatio}. ${sizeHint}.`

  const response = await fetch(`${BASE_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: aspectPrompt }] }],
      generationConfig: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error?.message || `Nano Banana 2 API error (${response.status})`)
  }

  const data = await response.json()
  const parts = data.candidates?.[0]?.content?.parts || []

  let imageData = null
  let textResponse = ''

  for (const part of parts) {
    if (part.inlineData) imageData = part.inlineData
    if (part.text) textResponse = part.text
  }

  if (!imageData) {
    throw new Error(textResponse || 'No image was generated. Try a different prompt.')
  }

  // Convert base64 to blob URL
  const byteString = atob(imageData.data)
  const bytes = new Uint8Array(byteString.length)
  for (let i = 0; i < byteString.length; i++) {
    bytes[i] = byteString.charCodeAt(i)
  }
  const blob = new Blob([bytes], { type: imageData.mimeType })
  return URL.createObjectURL(blob)
}

export function isNanoBananaConfigured() {
  return !!(import.meta.env.VITE_NANO_BANANA_API_KEY || import.meta.env.VITE_GEMINI_API_KEY)
}
