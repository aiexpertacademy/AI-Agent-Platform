// Central API client — all calls go to the Express/MongoDB backend
// In development Vite proxies /api → http://localhost:3001
// In production set VITE_API_URL to your deployed server URL

const BASE = import.meta.env.VITE_API_URL || '/api'

async function request(path, method = 'GET', body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } }
  if (body !== null) opts.body = JSON.stringify(body)
  const res = await fetch(`${BASE}${path}`, opts)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Request failed (${res.status})`)
  }
  return res.json()
}

export const api = {
  // ── Users ───────────────────────────────────────────────────────────────────
  syncUser: (data) =>
    request('/users/sync', 'POST', data),

  // ── Resumes ─────────────────────────────────────────────────────────────────
  getResumes: (userId) =>
    request(`/resumes/${userId}`),
  saveResume: (userId, data) =>
    request(`/resumes/${userId}`, 'POST', data),
  deleteResume: (userId, id) =>
    request(`/resumes/${userId}/${id}`, 'DELETE'),

  // ── Custom Resume Templates ──────────────────────────────────────────────────
  getCustomTemplates: (userId) =>
    request(`/custom-templates/${userId}`),
  saveCustomTemplate: (userId, data) =>
    request(`/custom-templates/${userId}`, 'POST', data),
  deleteCustomTemplate: (userId, id) =>
    request(`/custom-templates/${userId}/${id}`, 'DELETE'),

  // ── Ad Templates (admin) ────────────────────────────────────────────────────
  getAdTemplates: () =>
    request('/ad-templates'),
  createAdTemplate: (data) =>
    request('/ad-templates', 'POST', data),
  updateAdTemplate: (id, data) =>
    request(`/ad-templates/${id}`, 'PUT', data),
  deleteAdTemplate: (id) =>
    request(`/ad-templates/${id}`, 'DELETE'),

  // ── Ad Video Templates (admin) ───────────────────────────────────────────────
  getAdVideoTemplates: () =>
    request('/ad-video-templates'),
  createAdVideoTemplate: (data) =>
    request('/ad-video-templates', 'POST', data),
  updateAdVideoTemplate: (id, data) =>
    request(`/ad-video-templates/${id}`, 'PUT', data),
  deleteAdVideoTemplate: (id) =>
    request(`/ad-video-templates/${id}`, 'DELETE'),

  // ── Translations History ─────────────────────────────────────────────────────
  getTranslations: (userId) =>
    request(`/translations/${userId}`),
  saveTranslation: (userId, data) =>
    request(`/translations/${userId}`, 'POST', data),
  deleteTranslation: (userId, id) =>
    request(`/translations/${userId}/${id}`, 'DELETE'),

  // ── Ad Generation History ────────────────────────────────────────────────────
  getAdHistory: (userId) =>
    request(`/ad-history/${userId}`),
  addAdHistory: (userId, data) =>
    request(`/ad-history/${userId}`, 'POST', data),
  deleteAdHistory: (userId, id) =>
    request(`/ad-history/${userId}/${id}`, 'DELETE'),

  // ── Video Generation History ─────────────────────────────────────────────────
  getVideoHistory: (userId) =>
    request(`/video-history/${userId}`),
  addVideoHistory: (userId, data) =>
    request(`/video-history/${userId}`, 'POST', data),
  deleteVideoHistory: (userId, id) =>
    request(`/video-history/${userId}/${id}`, 'DELETE'),
}
