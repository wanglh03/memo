import { LockIcon, MoonIcon, NotesIcon, PlusIcon, SunIcon, UnlockIcon } from './icons.jsx'
import { IconButton } from './ui.jsx'

export function Header({ authed, theme, onToggleTheme, onNew, onLock }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-canvas/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-3.5 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] bg-accent text-accent-ink shadow-sm">
            <NotesIcon size={21} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-[19px] font-semibold leading-tight tracking-tight text-ink">
                待办事项
              </h1>
              <span className="shrink-0 rounded-full border border-line bg-surface px-2 py-[3px] text-[10px] font-medium tracking-wide text-muted">
                备忘录
              </span>
            </div>
            <p className="mt-0.5 hidden text-[11px] text-muted sm:block">按日期记下文字与图片</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <IconButton label={theme === 'dark' ? '切换到浅色' : '切换到深色'} onClick={onToggleTheme}>
            {theme === 'dark' ? <SunIcon size={18} /> : <MoonIcon size={18} />}
          </IconButton>

          {authed ? (
            <IconButton label="已解锁，点击锁定本机" onClick={onLock} className="text-accent">
              <UnlockIcon size={18} />
            </IconButton>
          ) : (
            <span
              className="grid h-9 w-9 place-items-center text-muted/60"
              title="只读浏览，写入需要 PIN"
              aria-label="只读浏览"
            >
              <LockIcon size={17} />
            </span>
          )}

          <button
            type="button"
            onClick={onNew}
            className="ml-1 hidden h-10 items-center gap-1.5 rounded-xl bg-accent px-4 text-[14px] font-medium text-accent-ink transition hover:brightness-110 sm:inline-flex"
          >
            <PlusIcon size={17} />
            新建
          </button>
        </div>
      </div>
    </header>
  )
}
