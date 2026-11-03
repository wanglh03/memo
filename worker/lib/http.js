/** 轻量 HTTP 工具：JSON 响应、错误、Cookie 读写 */

export class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

export function json(data, init = {}) {
  const headers = new Headers(init.headers)
  headers.set('content-type', 'application/json; charset=utf-8')
  headers.set('cache-control', 'no-store')
  headers.set('x-content-type-options', 'nosniff')
  return new Response(JSON.stringify(data), { ...init, headers })
}

export function fail(status, error, extra = {}) {
  return json({ error, ...extra }, { status })
}

export function getCookie(request, name) {
  const header = request.headers.get('cookie')
  if (!header) return null
  for (const part of header.split(';')) {
    const index = part.indexOf('=')
    if (index < 0) continue
    if (part.slice(0, index).trim() !== name) continue
    return part.slice(index + 1).trim()
  }
  return null
}

export function serializeCookie(name, value, options = {}) {
  const { maxAge, secure = true, path = '/', sameSite = 'Lax', httpOnly = true } = options
  const parts = [`${name}=${value}`, `Path=${path}`, `SameSite=${sameSite}`]
  if (httpOnly) parts.push('HttpOnly')
  if (secure) parts.push('Secure')
  if (typeof maxAge === 'number') parts.push(`Max-Age=${Math.floor(maxAge)}`)
  return parts.join('; ')
}

export async function readJson(request, limit = 64 * 1024) {
  const text = await request.text()
  if (text.length > limit) throw new HttpError(413, '请求内容过大')
  if (!text.trim()) throw new HttpError(400, '请求内容为空')
  try {
    const parsed = JSON.parse(text)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new HttpError(400, '请求格式有误')
    }
    return parsed
  } catch (error) {
    if (error instanceof HttpError) throw error
    throw new HttpError(400, '请求格式有误')
  }
}

export function clientKey(request) {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'local'
  )
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
