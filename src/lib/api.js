import { deriveProof } from './auth.js'

export class ApiError extends Error {
  constructor(message, status = 0, code = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

async function request(path, { method = 'GET', body, formData } = {}) {
  const headers = {}
  if (body !== undefined) headers['content-type'] = 'application/json'

  let response
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers,
      credentials: 'same-origin',
      body: formData || (body !== undefined ? JSON.stringify(body) : undefined),
    })
  } catch {
    throw new ApiError('网络连接失败，请检查网络后重试', 0, 'network')
  }

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new ApiError(payload.error || `请求失败（${response.status}）`, response.status, payload.code)
  }
  return payload
}

let configPromise = null

export const api = {
  config() {
    if (!configPromise) {
      configPromise = request('/config').catch((error) => {
        configPromise = null
        throw error
      })
    }
    return configPromise
  },

  status: () => request('/auth/status'),
  logout: () => request('/auth/logout', { method: 'POST', body: {} }),
  list: () => request('/memos'),

  /** PIN 永远不出浏览器：先取盐，本地 PBKDF2，再把 proof 交给服务端 */
  async login(pin) {
    const { salt, iterations } = await api.config()
    const proof = await deriveProof(pin, salt, iterations)
    return request('/auth', { method: 'POST', body: { proof } })
  },

  create: (payload) => request('/memos', { method: 'POST', body: payload }),
  update: (id, payload) => request(`/memos/${id}`, { method: 'PUT', body: payload }),
  toggle: (id, completed) => request(`/memos/${id}/toggle`, { method: 'POST', body: { completed } }),
  remove: (id) => request(`/memos/${id}`, { method: 'DELETE' }),

  async upload(file, { width, height } = {}) {
    const formData = new FormData()
    formData.append('file', file)
    if (width) formData.append('w', String(width))
    if (height) formData.append('h', String(height))
    return request('/upload', { method: 'POST', formData })
  },
}

export function imageUrl(key) {
  return typeof key === 'string' && key.startsWith('memo/images/') ? `/api/img/${key}` : ''
}
