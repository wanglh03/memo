import { useEffect, useRef } from 'react'
import { AlertIcon, CheckIcon, LoaderIcon, XIcon } from './icons.jsx'

/* --------------------------------- 滚动锁定 -------------------------------- */

let lockCount = 0
let previousOverflow = ''

function lockScroll() {
  if (lockCount === 0) {
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  lockCount += 1
}

function unlockScroll() {
  lockCount = Math.max(0, lockCount - 1)
  if (lockCount === 0) document.body.style.overflow = previousOverflow
}

/* ---------------------------------- 弹层 ---------------------------------- */

export function Modal({ open, onClose, children, className = '', labelledBy, closeOnBackdrop = true }) {
  useEffect(() => {
    if (!open) return undefined
    lockScroll()
    const handleKey = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose?.()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('keydown', handleKey)
      unlockScroll()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div
        className="absolute inset-0 animate-fade-in bg-black/45 backdrop-blur-[3px]"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={`relative w-full animate-sheet-up sm:animate-pop-in ${className}`}
      >
        {children}
      </div>
    </div>
  )
}

/* ---------------------------------- 按钮 ---------------------------------- */

const VARIANTS = {
  primary:
    'bg-accent text-accent-ink hover:brightness-110 active:brightness-95 shadow-[0_1px_2px_rgba(0,0,0,0.12)]',
  soft: 'bg-accent-soft text-accent hover:brightness-95',
  outline: 'border border-line bg-surface text-ink hover:bg-surface-2',
  ghost: 'text-ink-soft hover:bg-surface-2',
  danger: 'bg-danger text-white hover:brightness-110',
}

const SIZES = {
  sm: 'h-9 gap-1.5 rounded-xl px-3 text-[13px]',
  md: 'h-10 gap-2 rounded-xl px-4 text-sm',
  lg: 'h-11 gap-2 rounded-xl px-5 text-[15px]',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  loading = false,
  icon,
  ...rest
}) {
  return (
    <button
      type="button"
      {...rest}
      disabled={rest.disabled || loading}
      className={`inline-flex select-none items-center justify-center font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    >
      {loading ? <LoaderIcon size={16} /> : icon}
      {children}
    </button>
  )
}

export function IconButton({ label, className = '', children, ...rest }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...rest}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-surface-2 hover:text-ink disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  )
}

/* ---------------------------------- 提示 ---------------------------------- */

export function Toast({ toast }) {
  if (!toast) return null
  const isError = toast.tone === 'error'
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4">
      <div
        role="status"
        className={`animate-pop-in flex max-w-full items-center gap-2.5 rounded-2xl border px-4 py-2.5 text-sm shadow-[var(--c-shadow-lg)] ${
          isError
            ? 'border-danger/30 bg-danger-soft text-danger'
            : 'border-line bg-surface text-ink'
        }`}
      >
        {isError ? <AlertIcon size={17} /> : <CheckIcon size={17} className="text-accent" />}
        <span className="min-w-0 break-words">{toast.message}</span>
      </div>
    </div>
  )
}

/* -------------------------------- 确认对话框 ------------------------------- */

export function ConfirmDialog({ open, title, description, confirmText = '确定', onConfirm, onClose, loading }) {
  const confirmRef = useRef(null)

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => confirmRef.current?.focus(), 60)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [open])

  return (
    <Modal open={open} onClose={onClose} className="sm:max-w-sm">
      <div className="rounded-t-3xl border border-line bg-surface p-5 shadow-[var(--c-shadow-lg)] sm:rounded-3xl">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-danger-soft text-danger">
            <AlertIcon size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-ink">{title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{description}</p>
          </div>
          <IconButton label="关闭" onClick={onClose} className="-mr-1 -mt-1">
            <XIcon size={18} />
          </IconButton>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button ref={confirmRef} variant="danger" onClick={onConfirm} loading={loading}>
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
