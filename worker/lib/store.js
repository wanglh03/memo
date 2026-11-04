/**
 * R2 数据层。
 *
 * 数据统一放在存储桶 review-it 的 memo/ 前缀下，与同桶的其他项目互不干扰：
 * - memo/data.json         所有事项（单文件，数据量小、写入频率低）
 * - memo/images/<uuid>.*   图片
 */

export const DATA_KEY = 'memo/data.json'
export const IMAGE_PREFIX = 'memo/images/'

export const MAX_ITEMS = 2000
export const MAX_IMAGES_PER_ITEM = 6

export const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3])$/

export function emptyData() {
  return { version: 1, updatedAt: null, items: [] }
}

export function isValidDateKey(value) {
  if (typeof value !== 'string' || !DATE_KEY_PATTERN.test(value)) return false
  const day = value.slice(0, 10)
  const [year, month, date] = day.split('-').map(Number)
  if (month < 1 || month > 12 || date < 1 || date > 31) return false
  const probe = new Date(Date.UTC(year, month - 1, date))
  return (
    probe.getUTCFullYear() === year &&
    probe.getUTCMonth() === month - 1 &&
    probe.getUTCDate() === date
  )
}

export function isValidImageKey(value) {
  return (
    typeof value === 'string' &&
    value.length < 160 &&
    value.startsWith(IMAGE_PREFIX) &&
    /^[A-Za-z0-9/_.-]+$/.test(value) &&
    !value.includes('..')
  )
}

function normalizeImages(raw) {
  if (!Array.isArray(raw)) return []
  const seen = new Set()
  return raw
    .filter((image) => image && isValidImageKey(image.key))
    .filter((image) => {
      if (seen.has(image.key)) return false
      seen.add(image.key)
      return true
    })
    .map((image) => ({
      key: image.key,
      w: Math.max(0, Math.min(10000, Math.round(Number(image.w) || 0))),
      h: Math.max(0, Math.min(10000, Math.round(Number(image.h) || 0))),
    }))
    .slice(0, MAX_IMAGES_PER_ITEM)
}

function normalizeItem(raw, index) {
  if (!raw || typeof raw !== 'object') return null

  const hasDate = isValidDateKey(raw.date)
  // date 为空 = 未指定日期（未来事项）；给了日期但不合法则丢弃
  if (!hasDate && raw.date != null && raw.date !== '') return null

  const fallbackId = `legacy-${index}-${String(raw.date || 'later').replace(/[^0-9a-zA-Z]/g, '')}`

  const id =
    typeof raw.id === 'string' && /^[A-Za-z0-9_-]{4,64}$/.test(raw.id)
      ? raw.id
      : fallbackId

  const now = new Date().toISOString()

  return {
    id,
    date: hasDate ? raw.date : null,
    title: String(raw.title ?? '').slice(0, 120),
    content: String(raw.content ?? '').slice(0, 20000),
    images: normalizeImages(raw.images),
    completed: Boolean(raw.completed),
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : now,
    completedAt: typeof raw.completedAt === 'string' ? raw.completedAt : null,
  }
}

export function normalizeData(raw) {
  const data = emptyData()
  if (!raw || typeof raw !== 'object') return data

  if (Array.isArray(raw.items)) {
    const usedIds = new Set()
    data.items = raw.items
      .map((item, index) => normalizeItem(item, index))
      .filter(Boolean)
      .filter((item) => {
        if (usedIds.has(item.id)) return false
        usedIds.add(item.id)
        return true
      })
      .slice(0, MAX_ITEMS)
  }

  data.updatedAt = typeof raw.updatedAt === 'string' ? raw.updatedAt : null
  return data
}

export async function readData(env) {
  if (!env.BUCKET) throw new Error('R2 绑定 BUCKET 不存在')
  const object = await env.BUCKET.get(DATA_KEY)
  if (!object) return emptyData()
  try {
    return normalizeData(await object.json())
  } catch {
    return emptyData()
  }
}

export async function writeData(env, data) {
  data.version = 1
  data.updatedAt = new Date().toISOString()
  await env.BUCKET.put(DATA_KEY, JSON.stringify(data, null, 2), {
    httpMetadata: {
      contentType: 'application/json; charset=utf-8',
      cacheControl: 'no-store',
    },
  })
  return data
}

/** 同一 isolate 内串行化读改写，避免并发请求互相覆盖 */
let chain = Promise.resolve()

export function withWriteLock(task) {
  const result = chain.then(task, task)
  chain = result.then(
    () => undefined,
    () => undefined,
  )
  return result
}

export function sortItems(items) {
  return [...items].sort((a, b) => {
    // 有日期的排在前面（新的在上），未指定日期的排在最后
    if (a.date && b.date) {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1
      return (a.updatedAt || '') < (b.updatedAt || '') ? 1 : -1
    }
    if (a.date) return -1
    if (b.date) return 1
    return (a.updatedAt || '') < (b.updatedAt || '') ? 1 : -1
  })
}
