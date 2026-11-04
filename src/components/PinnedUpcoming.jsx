import {
  addDays,
  formatDayWithWeek,
  occursOn,
  timeRangeLabel,
  todayKey,
} from '../lib/date.js'
import { ChevronRightIcon } from './icons.jsx'

/** 置顶区只显示标题；正文取个纯文本摘要兜底 */
function plainExcerpt(content = '') {
  return content
    .replace(/[#>*_`~\-[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 48)
}

function itemsOn(items, dayKey) {
  return items
    .filter((item) => occursOn(item, dayKey))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
}

function DayColumn({ label, dayKey, items, onSelectDay }) {
  return (
    <div className="min-w-0 rounded-xl border border-line/70 bg-surface-2/50 p-2.5">
      <div className="mb-1.5 flex items-baseline justify-between gap-2 px-0.5">
        <button
          type="button"
          onClick={() => onSelectDay(dayKey)}
          className="flex min-w-0 items-baseline gap-1.5 text-left"
        >
          <span className="text-[12px] font-semibold text-ink">{label}</span>
          <span className="truncate text-[11px] text-muted">{formatDayWithWeek(dayKey)}</span>
        </button>
        <span className="shrink-0 text-[11px] tabular-nums text-muted">{items.length} 条</span>
      </div>

      {items.length ? (
        <ul className="space-y-0.5">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelectDay(dayKey)}
                className="flex w-full items-center gap-2 rounded-lg px-1.5 py-1.5 text-left transition hover:bg-surface"
              >
                <span className="shrink-0 rounded-md border border-line bg-surface px-1.5 py-0.5 text-[11px] tabular-nums text-ink-soft">
                  {timeRangeLabel(item, dayKey)}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px] text-ink">
                  {item.title || plainExcerpt(item.content) || '无标题'}
                </span>
                <ChevronRightIcon size={13} className="shrink-0 text-muted/50" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-1.5 py-1 text-[12px] text-muted">没有安排</p>
      )}
    </div>
  )
}

/**
 * 今天 / 明天的事项置顶在日历上方，点一下直接跳到当天。
 */
export function PinnedUpcoming({ items, onSelectDay }) {
  const today = todayKey()
  const tomorrow = addDays(today, 1)
  const todayItems = itemsOn(items, today)
  const tomorrowItems = itemsOn(items, tomorrow)

  if (!todayItems.length && !tomorrowItems.length) return null

  const unique = new Set([...todayItems, ...tomorrowItems].map((item) => item.id)).size

  return (
    <section
      aria-label="今天与明天"
      className="rounded-[var(--radius-card)] border border-line bg-surface p-3.5 shadow-[var(--c-shadow)] sm:p-4"
    >
      <header className="mb-2.5 flex items-center justify-between gap-2 px-0.5">
        <h2 className="text-[14px] font-semibold tracking-tight text-ink">今明两天</h2>
        <span className="text-[11px] tabular-nums text-muted">{unique} 条</span>
      </header>

      <div className="grid gap-2.5 sm:grid-cols-2">
        <DayColumn label="今天" dayKey={today} items={todayItems} onSelectDay={onSelectDay} />
        <DayColumn label="明天" dayKey={tomorrow} items={tomorrowItems} onSelectDay={onSelectDay} />
      </div>
    </section>
  )
}
