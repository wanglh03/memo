/**
 * 在浏览器里把 PIN 派生成 proof（PBKDF2-SHA256，服务端下发盐与迭代次数）。
 * PIN 本身不离开设备，服务端只看到派生结果。
 */
export async function deriveProof(secret, salt, iterations = 210000) {
  if (!globalThis.crypto?.subtle) {
    throw new Error('当前浏览器不支持安全验证，请升级 Chrome / Safari / Edge 后重试')
  }

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), 'PBKDF2', false, [
    'deriveBits',
  ])
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations,
      hash: 'SHA-256',
    },
    key,
    256,
  )

  const bytes = new Uint8Array(bits)
  let binary = ''
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}
