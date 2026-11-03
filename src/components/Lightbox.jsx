import { useEffect, useRef } from 'react'
import { imageUrl } from '../lib/api.js'
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from './icons.jsx'

/** 图片大图查看：支持左右切换、键盘方向键与手机左右滑动 */
export function Lightbox({ lightbox, onChange, onClose }) {
  const touchRef = useRef({ x: 0, y: 0 })
  const open = Boolean(lightbox)
  const images = lightbox?.images ?? []
  const index = lightbox?.index ?? 0
  const current = images[index]
  const count = images.length

  useEffect(() => {
    if (!open) return undefined
    const handleKey = (event) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowRight') onChange(Math.min(count - 1, index + 1))
      if (event.key === 'ArrowLeft') onChange(Math.max(0, index - 1))
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, index, count, onChange, onClose])

  if (!open || !current) return null

  return (
    <div
      className="fixed inset-0 z-[70] flex animate-fade-in flex-col bg-black/[0.94]"
      role="dialog"
      aria-modal="true"
      aria-label="图片查看"
      onTouchStart={(event) => {
        const touch = event.touches[0]
        touchRef.current = { x: touch.clientX, y: touch.clientY }
      }}
      onTouchEnd={(event) => {
        const touch = event.changedTouches[0]
        const dx = touch.clientX - touchRef.current.x
        const dy = touch.clientY - touchRef.current.y
        if (Math.abs(dx) > 56 && Math.abs(dx) > Math.abs(dy) * 1.4) {
          onChange(Math.min(count - 1, Math.max(0, index + (dx < 0 ? 1 : -1))))
        }
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 text-white/80">
        <span className="text-[13px] tabular-nums">{count > 1 ? `${index + 1} / ${count}` : ''}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="关闭"
          className="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition hover:bg-white/20"
        >
          <XIcon size={20} />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center px-2 pb-6" onClick={onClose}>
        <img
          src={imageUrl(current.key)}
          alt=""
          className="max-h-full max-w-full animate-pop-in rounded-lg object-contain"
          onClick={(event) => event.stopPropagation()}
        />
      </div>

      {count > 1 ? (
        <>
          <button
            type="button"
            aria-label="上一张"
            disabled={index === 0}
            onClick={() => onChange(Math.max(0, index - 1))}
            className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-25"
          >
            <ChevronLeftIcon size={22} />
          </button>
          <button
            type="button"
            aria-label="下一张"
            disabled={index === count - 1}
            onClick={() => onChange(Math.min(count - 1, index + 1))}
            className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-25"
          >
            <ChevronRightIcon size={22} />
          </button>
        </>
      ) : null}
    </div>
  )
}
