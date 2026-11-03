const STORAGE_KEY = 'memo.theme'

export function readStoredTheme() {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (value === 'light' || value === 'dark') return value
  } catch {
    /* 隐私模式下 localStorage 可能不可用 */
  }
  return null
}

export function systemTheme() {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}

export function resolveTheme() {
  return readStoredTheme() || systemTheme()
}

export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme === 'dark' ? 'dark' : 'light'
  const meta = document.querySelector('meta[name="theme-color"]:not([media])')
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#111110' : '#f4f2ec')
}

export function applyStoredTheme() {
  applyTheme(resolveTheme())
}

export function storeTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    /* ignore */
  }
}
