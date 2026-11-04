import { useCallback, useEffect, useRef, useState } from 'react'
import { Calendar } from './components/Calendar.jsx'
import { DayView } from './components/DayView.jsx'
import { FutureList } from './components/FutureList.jsx'
import { Header } from './components/Header.jsx'
import { Lightbox } from './components/Lightbox.jsx'
import { MemoEditor } from './components/MemoEditor.jsx'
import { PinDialog } from './components/PinDialog.jsx'
import { Button, ConfirmDialog, Toast } from './components/ui.jsx'
import { AlertIcon, PlusIcon } from './components/icons.jsx'
import { api } from './lib/api.js'
import { addDays, parseDayKey, todayKey } from './lib/date.js'
import { applyTheme, resolveTheme, storeTheme } from './lib/theme.js'

function currentMonth() {
  const now = new Date()
  return { year: now.getFullYear(), monthIndex: now.getMonth() }
}

export default function App() {
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('loading')
  const [loadError, setLoadError] = useState('')

  const [authed, setAuthed] = useState(false)
  const [selectedDay, setSelectedDay] = useState(todayKey())
  const [month, setMonth] = useState(currentMonth)
  const [theme, setTheme] = useState(resolveTheme)

  const [editor, setEditor] = useState({ open: false, item: null })
  const [pinOpen, setPinOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [lightbox, setLightbox] = useState(null)
  const [toast, setToast] = useState(null)

  const pendingRef = useRef(null)
  const toastTimer = useRef(null)

  const notify = useCallback((message, tone = 'success') => {
    window.clearTimeout(toastTimer.current)
    setToast({ message, tone, id: Date.now() })
    toastTimer.current = window.setTimeout(() => setToast(null), 2800)
  }, [])

  useEffect(() => () => window.clearTimeout(toastTimer.current), [])

  const load = useCallback(async () => {
    setStatus('loading')
    setLoadError('')
    try {
      const [data, session] = await Promise.all([api.list(), api.status()])
      setItems(data.items || [])
      setAuthed(Boolean(session.authed))
      setStatus('ready')
    } catch (error) {
      setLoadError(error.message || '加载失败')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const selectDay = useCallback((dayKey) => {
    setSelectedDay(dayKey)
    const date = parseDayKey(dayKey)
    setMonth({ year: date.getFullYear(), monthIndex: date.getMonth() })
  }, [])

  const navigateDay = useCallback(
    (delta) => selectDay(addDays(selectedDay, delta)),
    [selectDay, selectedDay],
  )

  /** 写操作统一在需要时弹出 PIN */
  const guard = useCallback(
    (action) => {
      if (authed) {
        action()
        return
      }
      pendingRef.current = action
      setPinOpen(true)
    },
    [authed],
  )

  const handleUnlocked = useCallback(() => {
    setAuthed(true)
    const action = pendingRef.current
    pendingRef.current = null
    if (action) window.setTimeout(action, 0)
  }, [])

  const handleAdd = useCallback(() => {
    guard(() => setEditor({ open: true, item: null, unscheduled: false }))
  }, [guard])

  const handleAddFuture = useCallback(() => {
    guard(() => setEditor({ open: true, item: null, unscheduled: true }))
  }, [guard])

  const handleEdit = useCallback(
    (item) => {
      guard(() => setEditor({ open: true, item }))
    },
    [guard],
  )

  const handleDeleteRequest = useCallback(
    (item) => {
      guard(() => setDeleteTarget(item))
    },
    [guard],
  )

  const handleSaved = useCallback(
    (item, isEdit) => {
      setItems((prev) =>
        isEdit ? prev.map((entry) => (entry.id === item.id ? item : entry)) : [...prev, item],
      )
      setEditor({ open: false, item: null, unscheduled: false })
      if (item.date) selectDay(item.date.slice(0, 10))
      notify(isEdit ? '已更新' : item.date ? '已添加' : '已放入未来事项')
    },
    [notify, selectDay],
  )

  async function confirmDelete() {
    if (!deleteTarget || deleting) return
    setDeleting(true)
    try {
      await api.remove(deleteTarget.id)
      setItems((prev) => prev.filter((entry) => entry.id !== deleteTarget.id))
      setDeleteTarget(null)
      notify('已删除')
    } catch (error) {
      if (error.status === 401) {
        const target = deleteTarget
        setDeleteTarget(null)
        setAuthed(false)
        pendingRef.current = () => setDeleteTarget(target)
        setPinOpen(true)
      } else {
        notify(error.message || '删除失败', 'error')
      }
    } finally {
      setDeleting(false)
    }
  }

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    applyTheme(next)
    storeTheme(next)
  }

  async function handleLock() {
    try {
      await api.logout()
    } catch {
      /* 忽略网络错误，本地状态照样清掉 */
    }
    setAuthed(false)
    notify('已上锁，下次写入需要重新输入 PIN')
  }

  const datedItems = items.filter((item) => Boolean(item.date))
  const futureItems = items.filter((item) => !item.date)
  const dayItems = datedItems.filter((item) => item.date.startsWith(selectedDay))

  return (
    <div className="min-h-dvh">
      <Header
        authed={authed}
        theme={theme}
        onToggleTheme={toggleTheme}
        onNew={handleAdd}
        onLock={handleLock}
      />

      <main className="mx-auto w-full max-w-6xl px-3.5 pb-28 pt-4 sm:px-6 sm:pt-6 lg:pb-12">
        <div className="grid gap-4 lg:grid-cols-[356px_minmax(0,1fr)] lg:items-start lg:gap-7">
          <div className="space-y-4 lg:sticky lg:top-[84px]">
            <Calendar
              items={datedItems}
              selectedDay={selectedDay}
              month={month}
              onMonthChange={setMonth}
              onSelectDay={selectDay}
            />

            <FutureList
              items={futureItems}
              onAdd={handleAddFuture}
              onEdit={handleEdit}
              onDelete={handleDeleteRequest}
              onPreview={(images, index) => setLightbox({ images, index })}
              defaultOpen
              className="hidden lg:block"
            />
          </div>

          <div className="min-w-0 space-y-4">
            <FutureList
              items={futureItems}
              onAdd={handleAddFuture}
              onEdit={handleEdit}
              onDelete={handleDeleteRequest}
              onPreview={(images, index) => setLightbox({ images, index })}
              className="lg:hidden"
            />

            {status === 'loading' ? (
              <div className="space-y-3">
                <div className="h-[70px] animate-pulse rounded-2xl bg-surface/70" />
                <div className="h-[150px] animate-pulse rounded-2xl bg-surface/70" />
                <div className="h-[150px] animate-pulse rounded-2xl bg-surface/70" />
              </div>
            ) : status === 'error' ? (
              <div className="flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-line bg-surface px-6 py-14 text-center">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-danger-soft text-danger">
                  <AlertIcon size={22} />
                </div>
                <p className="mt-3 text-sm font-medium text-ink">内容没能加载出来</p>
                <p className="mt-1 max-w-[260px] text-[13px] text-muted">{loadError}</p>
                <Button variant="outline" className="mt-4" onClick={load}>
                  重新加载
                </Button>
              </div>
            ) : (
              <DayView
                dayKey={selectedDay}
                items={dayItems}
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDeleteRequest}
                onPreview={(images, index) => setLightbox({ images, index })}
                onNavigateDay={navigateDay}
              />
            )}
          </div>
        </div>

        <footer className="mt-10 text-center text-[11px] leading-relaxed text-muted/80">
          内容保存在 Cloudflare R2 · 写入需要 PIN · 手机端已禁用缩放
        </footer>
      </main>

      <button
        type="button"
        onClick={handleAdd}
        aria-label="添加记录"
        className="fixed bottom-[max(1.15rem,env(safe-area-inset-bottom))] right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-accent text-accent-ink shadow-[0_12px_30px_-12px_rgba(0,0,0,0.6)] transition active:scale-95 sm:hidden"
      >
        <PlusIcon size={24} />
      </button>

      <MemoEditor
        open={editor.open}
        initial={editor.item}
        dayKey={selectedDay}
        unscheduled={Boolean(editor.unscheduled)}
        onClose={() => setEditor({ open: false, item: null, unscheduled: false })}
        onSaved={handleSaved}
        onNeedAuth={() => {
          pendingRef.current = null
          setPinOpen(true)
        }}
      />

      <PinDialog
        open={pinOpen}
        onClose={() => setPinOpen(false)}
        onSuccess={handleUnlocked}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="删除这条记录？"
        description={
          deleteTarget?.title
            ? `「${deleteTarget.title}」以及它的图片都会被删掉，无法恢复。`
            : '这条记录以及它的图片都会被删掉，无法恢复。'
        }
        confirmText="删除"
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />

      <Lightbox
        lightbox={lightbox}
        onChange={(index) => setLightbox((prev) => (prev ? { ...prev, index } : prev))}
        onClose={() => setLightbox(null)}
      />

      <Toast toast={toast} />
    </div>
  )
}
