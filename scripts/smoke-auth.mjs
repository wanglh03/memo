/**
 * 线上冒烟测试：验证 PIN、Cookie 属性与只读接口。
 * 用法：MEMO_BASE=https://memo.gtbro.vip MEMO_PIN=261023 node scripts/smoke-auth.mjs
 */
import { webcrypto } from 'node:crypto'
import { readFile } from 'node:fs/promises'

const BASE = process.env.MEMO_BASE || 'https://memo.gtbro.vip'
const PIN = process.env.MEMO_PIN || '261023'
const ITERATIONS = 210000

const wrangler = await readFile(new URL('../wrangler.toml', import.meta.url), 'utf8')
const salt = wrangler.match(/AUTH_SALT\s*=\s*"([^"]+)"/)?.[1]
if (!salt) throw new Error('wrangler.toml 里没有 AUTH_SALT')

const encoder = new TextEncoder()
const key = await webcrypto.subtle.importKey('raw', encoder.encode(PIN), 'PBKDF2', false, [
  'deriveBits',
])
const bits = await webcrypto.subtle.deriveBits(
  { name: 'PBKDF2', salt: encoder.encode(salt), iterations: ITERATIONS, hash: 'SHA-256' },
  key,
  256,
)
const proof = Buffer.from(bits).toString('base64')

const health = await fetch(`${BASE}/api/health`).then((r) => r.json())
console.log('health        :', health.ok ? 'ok' : health)

const memos = await fetch(`${BASE}/api/memos`).then((r) => r.json())
console.log('memos         :', memos.items.length, 'items')

const login = await fetch(`${BASE}/api/auth`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ proof }),
})
const setCookie = login.headers.getSetCookie?.()[0] || login.headers.get('set-cookie') || ''
const flags = ['HttpOnly', 'Secure', 'SameSite=Lax'].filter((flag) =>
  setCookie.toLowerCase().includes(flag.toLowerCase()),
)
const maxAge = setCookie.match(/Max-Age=(\d+)/i)?.[1]

console.log('login status  :', login.status)
console.log('cookie flags  :', flags.join(' / ') || '(missing)', '| Max-Age:', maxAge || '(missing)')

const bad = await fetch(`${BASE}/api/auth`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ proof: 'x' }),
})
console.log('wrong PIN     :', bad.status)
