import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { applyStoredTheme } from './lib/theme.js'

// 禁止手机上双指 / 双击缩放（配合 index.html 的 viewport 设置）
document.addEventListener(
  'gesturestart',
  (event) => {
    event.preventDefault()
  },
  { passive: false },
)

document.addEventListener(
  'dblclick',
  (event) => {
    if (event.target instanceof Element && !event.target.closest('input, textarea')) {
      event.preventDefault()
    }
  },
  { passive: false },
)

applyStoredTheme()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
