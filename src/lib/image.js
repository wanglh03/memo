const MAX_DIMENSION = 1800
const COMPRESS_THRESHOLD = 900 * 1024

async function dimensionsOf(file) {
  try {
    const bitmap = await createImageBitmap(file)
    const size = { width: bitmap.width, height: bitmap.height }
    bitmap.close?.()
    return size
  } catch {
    return { width: 0, height: 0 }
  }
}

async function toJpeg(file, width, height) {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  const targetWidth = Math.max(1, Math.round(bitmap.width * scale))
  const targetHeight = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight
  const context = canvas.getContext('2d')
  if (!context) {
    bitmap.close?.()
    return null
  }
  context.drawImage(bitmap, 0, 0, targetWidth, targetHeight)
  bitmap.close?.()

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.86))
  if (!blob) return null

  const base = (file.name || 'photo').replace(/\.[^.]+$/, '')
  return {
    file: new File([blob], `${base}.jpg`, { type: 'image/jpeg', lastModified: Date.now() }),
    width: targetWidth,
    height: targetHeight,
  }
}

/**
 * 上传前在浏览器里压缩：长边不超过 1800px，JPEG 质量 0.86。
 * GIF / SVG 保持原样（避免破坏动画与矢量）。
 */
export async function compressImage(file) {
  if (!file || !String(file.type || '').startsWith('image/')) {
    return { file, width: 0, height: 0 }
  }

  if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return { file, ...(await dimensionsOf(file)) }
  }

  try {
    const { width, height } = await dimensionsOf(file)
    const needsResize = Math.max(width, height) > MAX_DIMENSION
    const needsReencode = file.size > COMPRESS_THRESHOLD || file.type !== 'image/jpeg'
    if (!needsResize && !needsReencode) return { file, width, height }

    const result = await toJpeg(file, width, height)
    if (!result) return { file, width, height }
    return result
  } catch {
    return { file, ...(await dimensionsOf(file)) }
  }
}
