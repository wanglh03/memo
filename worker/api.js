import {
  PBKDF2_ITERATIONS,
  SESSION_TTL_MS,
  clearFailures,
  issueToken,
  rateLimitRemaining,
  recordFailure,
  verifyProof,
  verifyToken,
} from './lib/auth.js'
import {
  HttpError,
  clientKey,
  fail,
  getCookie,
  json,
  readJson,
  serializeCookie,
  sleep,
} from './lib/http.js'
import {
  IMAGE_PREFIX,
  MAX_IMAGES_PER_ITEM,
  isValidDateKey,
  isValidImageKey,
  readData,
  sortItems,
  withWriteLock,
  writeData,
} from './lib/store.js'

/** 只保存一个由服务端签名的令牌，PIN 本身永远不会写进 Cookie */
const COOKIE_NAME = 'memo_pin'
const MAX_IMAGE_BYTES = 8 * 1024 * 1024

const IMAGE_EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
}

function cookieSecure(url) {
  return url.protocol === 'https:'
}

async function readSession(request, env) {
  if (!env.SESSION_SECRET) return null
  const token = getCookie(request, COOKIE_NAME)
  const session = await verifyToken(token, env.SESSION_SECRET)
  if (!session || session.scope !== 'pin') return null
  return session
}

async function requireSession(request, env) {
  const session = await readSession(request, env)
  if (!session) throw new HttpError(401, '请先输入 PIN 解锁')
  return session
}

/* ----------------------------------- 登录 ---------------------------------- */

async function handleStatus(request, env) {
  const session = await readSession(request, env)
  return json({ authed: Boolean(session), expiresAt: session?.expiresAt ?? null })
}

async function handleLogin(request, env, url) {
  if (!env.AUTH_PEPPER || !env.PIN_PROOF_HASH || !env.SESSION_SECRET) {
    return fail(500, '服务端还没有配置密钥，请先在项目里执行 npm run secrets')
  }

  const key = clientKey(request)
  const retryAfter = rateLimitRemaining(key)
  if (retryAfter > 0) {
    return fail(429, `尝试次数过多，请 ${Math.ceil(retryAfter / 60)} 分钟后再试`, { retryAfter })
  }

  const body = await readJson(request, 4096)
  const ok = await verifyProof(body.proof, env.PIN_PROOF_HASH, env.AUTH_PEPPER)
  if (!ok) {
    recordFailure(key)
    await sleep(400)
    return fail(401, 'PIN 码不正确')
  }

  clearFailures(key)
  const { token, expiresAt } = await issueToken(env.SESSION_SECRET, 'pin')
  const cookie = serializeCookie(COOKIE_NAME, token, {
    maxAge: SESSION_TTL_MS / 1000,
    secure: cookieSecure(url),
  })
  return json({ ok: true, authed: true, expiresAt }, { headers: { 'set-cookie': cookie } })
}

async function handleLogout(request, env, url) {
  const cookie = serializeCookie(COOKIE_NAME, '', {
    maxAge: 0,
    secure: cookieSecure(url),
  })
  return json({ ok: true, authed: false }, { headers: { 'set-cookie': cookie } })
}

/* ----------------------------------- 事项 ---------------------------------- */

function sanitizeDraft(body) {
  // date 为空 = 未指定日期，归入「未来事项」
  const unscheduled = body.date == null || body.date === ''
  let dateKey = null
  let endKey = null

  if (!unscheduled) {
    const date = typeof body.date === 'string' ? body.date : ''
    const hour = Number(body.hour)

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isInteger(hour) || hour < 0 || hour > 23) {
      throw new HttpError(400, '请选择日期和小时')
    }

    dateKey = `${date}T${String(hour).padStart(2, '0')}`
    if (!isValidDateKey(dateKey)) throw new HttpError(400, '日期不合法')
  }

  // 结束时间可选，可以跨日，但必须晚于开始时间
  if (body.endDate) {
    if (unscheduled) throw new HttpError(400, '有结束时间就要先选开始日期')

    const endDate = typeof body.endDate === 'string' ? body.endDate : ''
    const endHour = Number(body.endHour)

    if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate) || !Number.isInteger(endHour) || endHour < 0 || endHour > 23) {
      throw new HttpError(400, '结束时间不合法')
    }

    endKey = `${endDate}T${String(endHour).padStart(2, '0')}`
    if (!isValidDateKey(endKey)) throw new HttpError(400, '结束时间不合法')
    if (endKey <= dateKey) throw new HttpError(400, '结束时间要晚于开始时间')
  }

  const title = String(body.title ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120)
  const content = String(body.content ?? '').slice(0, 20000)

  const images = Array.isArray(body.images)
    ? body.images
        .filter((image) => image && isValidImageKey(image.key))
        .map((image) => ({
          key: image.key,
          w: Math.max(0, Math.min(10000, Math.round(Number(image.w) || 0))),
          h: Math.max(0, Math.min(10000, Math.round(Number(image.h) || 0))),
        }))
        .slice(0, MAX_IMAGES_PER_ITEM)
    : []

  if (!title && !content.trim() && images.length === 0) {
    throw new HttpError(400, '标题、内容、图片至少填一样')
  }

  return { date: dateKey, end: endKey, title, content, images }
}

async function listItems(env) {
  const data = await readData(env)
  return json({ items: sortItems(data.items), updatedAt: data.updatedAt })
}

async function createItem(request, env) {
  await requireSession(request, env)
  const draft = sanitizeDraft(await readJson(request))

  return withWriteLock(async () => {
    const data = await readData(env)
    const now = new Date().toISOString()
    const item = {
      id: crypto.randomUUID(),
      ...draft,
      completed: false,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    }
    data.items.push(item)
    await writeData(env, data)
    return json({ item }, { status: 201 })
  })
}

async function updateItem(request, env, id) {
  await requireSession(request, env)
  const draft = sanitizeDraft(await readJson(request))

  return withWriteLock(async () => {
    const data = await readData(env)
    const index = data.items.findIndex((item) => item.id === id)
    if (index < 0) throw new HttpError(404, '这条事项已经不存在了')

    const previous = data.items[index]
    const next = {
      ...previous,
      ...draft,
      updatedAt: new Date().toISOString(),
    }
    data.items[index] = next
    await writeData(env, data)

    const keep = new Set(draft.images.map((image) => image.key))
    const removed = previous.images.map((image) => image.key).filter((key) => !keep.has(key))
    if (removed.length) await env.BUCKET.delete(removed)

    return json({ item: next })
  })
}

async function toggleItem(request, env, id) {
  await requireSession(request, env)
  const body = await readJson(request, 4096)

  return withWriteLock(async () => {
    const data = await readData(env)
    const item = data.items.find((entry) => entry.id === id)
    if (!item) throw new HttpError(404, '这条事项已经不存在了')

    const completed = typeof body.completed === 'boolean' ? body.completed : !item.completed
    const now = new Date().toISOString()
    item.completed = completed
    item.completedAt = completed ? now : null
    item.updatedAt = now
    await writeData(env, data)
    return json({ item })
  })
}

async function deleteItem(request, env, id) {
  await requireSession(request, env)

  return withWriteLock(async () => {
    const data = await readData(env)
    const index = data.items.findIndex((item) => item.id === id)
    if (index < 0) throw new HttpError(404, '这条事项已经不存在了')

    const [removed] = data.items.splice(index, 1)
    await writeData(env, data)

    const keys = removed.images.map((image) => image.key).filter(Boolean)
    if (keys.length) await env.BUCKET.delete(keys)

    return json({ ok: true, id })
  })
}

/* ----------------------------------- 图片 ---------------------------------- */

function sniffImageType(bytes) {
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg'
  }
  if (
    bytes.length > 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return 'image/png'
  }
  if (bytes.length > 6 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return 'image/gif'
  }
  if (
    bytes.length > 12 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'image/webp'
  }
  if (bytes.length > 12) {
    const brand = String.fromCharCode(...bytes.subarray(4, 8))
    const sub = String.fromCharCode(...bytes.subarray(8, 12))
    if (brand === 'ftyp' && (sub === 'avif' || sub === 'avis')) return 'image/avif'
  }
  return null
}

function toDimension(value) {
  const number = Number(value)
  if (!Number.isFinite(number) || number <= 0) return 0
  return Math.min(10000, Math.round(number))
}

async function uploadImage(request, env) {
  await requireSession(request, env)

  const contentType = request.headers.get('content-type') || ''
  if (!contentType.includes('multipart/form-data')) {
    throw new HttpError(415, '请使用表单上传图片')
  }

  const declaredLength = Number(request.headers.get('content-length') || 0)
  if (declaredLength > MAX_IMAGE_BYTES + 128 * 1024) {
    throw new HttpError(413, '图片太大了（上限 8MB）')
  }

  const form = await request.formData()
  const file = form.get('file')
  if (!file || typeof file === 'string') throw new HttpError(400, '没有收到图片')
  if (file.size > MAX_IMAGE_BYTES) throw new HttpError(413, '图片太大了（上限 8MB）')
  if (file.size < 16) throw new HttpError(400, '图片文件无效')

  const buffer = await file.arrayBuffer()
  const type = sniffImageType(new Uint8Array(buffer.slice(0, 16)))
  if (!type) throw new HttpError(415, '只支持 JPG / PNG / WebP / GIF / AVIF 图片')

  const extension = IMAGE_EXTENSIONS[type]
  const key = `${IMAGE_PREFIX}${crypto.randomUUID()}.${extension}`

  await env.BUCKET.put(key, buffer, {
    httpMetadata: {
      contentType: type,
      cacheControl: 'public, max-age=31536000, immutable',
    },
  })

  return json({
    key,
    url: '/api/img/' + key,
    width: toDimension(form.get('w')),
    height: toDimension(form.get('h')),
    size: buffer.byteLength,
  })
}

async function serveImage(request, env, key) {
  if (!isValidImageKey(key)) throw new HttpError(404, '图片不存在')

  const object = await env.BUCKET.get(key)
  if (!object) throw new HttpError(404, '图片不存在')

  const etag = object.httpEtag
  if (request.headers.get('if-none-match') === etag) {
    return new Response(null, { status: 304, headers: { etag } })
  }

  const headers = new Headers()
  headers.set('etag', etag)
  headers.set('content-type', object.httpMetadata?.contentType || 'application/octet-stream')
  headers.set('cache-control', 'public, max-age=31536000, immutable')
  headers.set('x-content-type-options', 'nosniff')
  if (typeof object.size === 'number') headers.set('content-length', String(object.size))

  return new Response(request.method === 'HEAD' ? null : object.body, { headers })
}

/* ----------------------------------- 路由 ---------------------------------- */

/**
 * 注意：必须 `return await`，否则被调用函数返回的 Promise reject（HttpError）
 * 不会被这里的 try/catch 捕获，会直接冒泡成 500。
 */
async function dispatch(request, env, url) {
  const { pathname } = url

  try {
    if (pathname === '/api/health') {
      return json({ ok: true, time: new Date().toISOString() })
    }

    if (pathname === '/api/config') {
      return json({ salt: env.AUTH_SALT || '', iterations: PBKDF2_ITERATIONS, pinLength: 6 })
    }

    if (pathname === '/api/auth/status') return await handleStatus(request, env)
    if (pathname === '/api/auth' && request.method === 'POST') return await handleLogin(request, env, url)
    if (pathname === '/api/auth/logout' && request.method === 'POST') {
      return await handleLogout(request, env, url)
    }

    if (pathname === '/api/memos') {
      if (request.method === 'GET') return await listItems(env)
      if (request.method === 'POST') return await createItem(request, env)
      return fail(405, '方法不支持')
    }

    if (pathname.startsWith('/api/memos/')) {
      const rest = pathname.slice('/api/memos/'.length)
      const [id, action] = rest.split('/')
      if (!/^[A-Za-z0-9_-]{4,64}$/.test(id || '')) return fail(400, '参数不合法')

      if (action === 'toggle' && request.method === 'POST') return await toggleItem(request, env, id)
      if (!action && request.method === 'PUT') return await updateItem(request, env, id)
      if (!action && request.method === 'DELETE') return await deleteItem(request, env, id)
      return fail(405, '方法不支持')
    }

    if (pathname === '/api/upload' && request.method === 'POST') return await uploadImage(request, env)

    if (pathname.startsWith('/api/img/')) {
      if (request.method !== 'GET' && request.method !== 'HEAD') return fail(405, '方法不支持')
      return await serveImage(request, env, decodeURIComponent(pathname.slice('/api/img/'.length)))
    }

    return fail(404, '接口不存在')
  } catch (error) {
    if (error instanceof HttpError) return fail(error.status, error.message)
    console.error('[api]', pathname, error)
    return fail(500, '服务器开小差了，请稍后重试')
  }
}

export async function handleApi(request, env, url) {
  try {
    return await dispatch(request, env, url)
  } catch (error) {
    if (error instanceof HttpError) return fail(error.status, error.message)
    console.error('[api]', url.pathname, error)
    return fail(500, '服务器开小差了，请稍后重试')
  }
}
