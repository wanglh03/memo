/**
 * 生成 / 保留服务端密钥，写入 .dev.vars（本地开发），并提示如何写入 Cloudflare。
 *
 * - AUTH_PEPPER      随机 32 字节，用于把浏览器算出的 proof 摘要成不可逆的存储值
 * - PIN_PROOF_HASH   v1$<base64 HMAC(pepper, PBKDF2(PIN, salt, 210000))>
 * - SESSION_SECRET   随机 32 字节，用于给登录 Cookie 签名
 *
 * 已存在的密钥会原样保留（改了会让所有人已登录的 Cookie 失效）。
 * 重新生成：node scripts/generate-secrets.mjs --force
 */
import { webcrypto } from 'node:crypto'
import { readFileSafe, writeFile, readFile } from './lib-node.mjs'

const ITERATIONS = 210000
const PIN = process.env.MEMO_PIN || '261023'
const FORCE = process.argv.includes('--force')

const { subtle } = webcrypto
const encoder = new TextEncoder()

function randomBase64Url(bytes = 32) {
  const buffer = new Uint8Array(bytes)
  webcrypto.getRandomValues(buffer)
  return Buffer.from(buffer).toString('base64url')
}

async function deriveProof(pin, salt) {
  const key = await subtle.importKey('raw', encoder.encode(pin), 'PBKDF2', false, ['deriveBits'])
  const bits = await subtle.deriveBits(
    { name: 'PBKDF2', salt: encoder.encode(salt), iterations: ITERATIONS, hash: 'SHA-256' },
    key,
    256,
  )
  return Buffer.from(bits).toString('base64')
}

async function digestProof(pepper, proof) {
  const key = await subtle.importKey('raw', encoder.encode(pepper), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ])
  const signature = await subtle.sign('HMAC', key, encoder.encode(proof))
  return `v1$${Buffer.from(signature).toString('base64')}`
}

function parseVars(text) {
  const vars = {}
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"([^"]*)"/)
    if (match) vars[match[1]] = match[2]
  }
  return vars
}

const wrangler = await readFile('wrangler.toml')
const salt = parseVars(wrangler).AUTH_SALT
if (!salt) {
  console.error('✗ wrangler.toml 里没有 AUTH_SALT')
  process.exit(1)
}

const existing = parseVars(await readFileSafe('.dev.vars', ''))

function pick(name) {
  if (!FORCE && existing[name] && existing[name].length > 20) return existing[name]
  return randomBase64Url()
}

const pepper = pick('AUTH_PEPPER')
const sessionSecret = pick('SESSION_SECRET')
const proofHash =
  !FORCE && existing.PIN_PROOF_HASH?.startsWith('v1$')
    ? existing.PIN_PROOF_HASH
    : await digestProof(pepper, await deriveProof(PIN, salt))

const lines = [
  '# 本地开发密钥，不要提交到仓库（已加入 .gitignore）',
  `AUTH_SALT=${salt}`,
  `AUTH_PEPPER=${pepper}`,
  `PIN_PROOF_HASH=${proofHash}`,
  `SESSION_SECRET=${sessionSecret}`,
  '',
]

await writeFile('.dev.vars', lines.join('\n'))

console.log('✓ 已写入 .dev.vars')
console.log('  重新生成时加 --force（会让所有已登录 Cookie 失效）')
console.log('')
console.log('生产环境写入 Cloudflare（只需要执行一次）：')
console.log(`  npx wrangler secret put AUTH_PEPPER     # ${pepper}`)
console.log(`  npx wrangler secret put SESSION_SECRET  # ${sessionSecret}`)
console.log(`  npx wrangler secret put PIN_PROOF_HASH  # ${proofHash}`)
