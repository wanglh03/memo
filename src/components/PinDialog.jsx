import { useEffect, useRef, useState } from 'react'
import { api } from '../lib/api.js'
import { LockIcon, LoaderIcon, XIcon } from './icons.jsx'
import { Modal } from './ui.jsx'

/**
 * PIN 解锁：PIN 只在浏览器里做 PBKDF2 派生，服务端校验签名后下发长期 HttpOnly Cookie。
 */
export function PinDialog({ open, onClose, onSuccess }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [shake, setShake] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!open) return
    setPin('')
    setError('')
    setBusy(false)
    setShake(false)
    const timer = setTimeout(() => inputRef.current?.focus(), 120)
    return () => clearTimeout(timer)
  }, [open])

  async function submit(value) {
    if (busy || value.length !== 6) return
    setBusy(true)
    setError('')
    try {
      await api.login(value)
      onSuccess?.()
      onClose?.()
    } catch (caught) {
      setError(caught.message || '验证失败，请重试')
      setPin('')
      setShake(true)
      setTimeout(() => setShake(false), 460)
      inputRef.current?.focus()
    } finally {
      setBusy(false)
    }
  }

  function handleChange(event) {
    const value = event.target.value.replace(/\D/g, '').slice(0, 6)
    setPin(value)
    setError('')
    if (value.length === 6) submit(value)
  }

  return (
    <Modal open={open} onClose={onClose} className="sm:max-w-sm" labelledBy="pin-title">
      <div className="rounded-t-[1.6rem] border border-line bg-surface p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[var(--c-shadow-lg)] sm:rounded-[1.6rem]">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            className="-mr-2 -mt-2 grid h-9 w-9 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-ink"
          >
            <XIcon size={18} />
          </button>
        </div>

        <div className="flex flex-col items-center text-center">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-accent-soft text-accent">
            <LockIcon size={22} />
          </div>
          <h2 id="pin-title" className="mt-3 text-[17px] font-semibold text-ink">
            输入 PIN 解锁
          </h2>
          <p className="mt-1.5 max-w-[240px] text-[13px] leading-relaxed text-muted">
            为了不让人乱写，添加、修改、删除需要验证一下。解锁后这台设备会自动记住。
          </p>
        </div>

        <form
          className={`mt-5 ${shake ? 'animate-shake' : ''}`}
          onSubmit={(event) => {
            event.preventDefault()
            submit(pin)
          }}
        >
          <input
            ref={inputRef}
            value={pin}
            onChange={handleChange}
            type="password"
            inputMode="numeric"
            autoComplete="one-time-code"
            enterKeyHint="done"
            aria-label="6 位 PIN 码"
            placeholder="······"
            maxLength={6}
            disabled={busy}
            className="w-full rounded-xl border border-line bg-surface-2 py-3 text-center text-[24px] tracking-[0.55em] text-ink tabular-nums outline-none transition placeholder:tracking-[0.35em] placeholder:text-muted/40 focus:border-accent/60 focus:bg-surface focus:ring-2 focus:ring-accent/15 disabled:opacity-60"
          />

          <div className="mt-2.5 min-h-[20px] px-1 text-[12px]">
            {error ? (
              <span className="text-danger">{error}</span>
            ) : (
              <span className="text-muted">Cookie 长期有效，清除浏览器数据后需要重新输入</span>
            )}
          </div>

          <button
            type="submit"
            disabled={busy || pin.length !== 6}
            className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent text-[15px] font-medium text-accent-ink transition hover:brightness-110 disabled:opacity-45"
          >
            {busy ? <LoaderIcon size={17} /> : <LockIcon size={17} />}
            {busy ? '验证中…' : '解锁'}
          </button>
        </form>
      </div>
    </Modal>
  )
}
