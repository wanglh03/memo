import { useMemo } from 'react'
import { WEEKDAYS, buildMonthGrid, formatMonthTitle, itemDayKeys, todayKey } from '../lib/date.js'
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from './icons.jsx'

/**
 * 月历：有记录的日期为正色并带圆点，没有记录的日期显示为灰色。
 * 点击任意日期即可查看当天内容。
 */
export function Calendar({ items, selectedDay, month, onMonthChange, onSelectDay }) {
  const grid = useMemo(() => buildMonthGrid(month.year, month.monthIndex), [month])
  const today = todayKey()

  const counts = useMemo(() => {
    const map = new Map()
    for (const item of items) {
      for (const day of itemDayKeys(item)) map.set(day, (map.get(day) || 0) + 1)
    }
    return map
  }, [items])

  const monthTotal = useMemo(() => {
    const prefix = `${month.year}-${String(month.monthIndex + 1).padStart(2, '0')}`
    // 跨日事项只算一条，不按占用的天数重复计数
    return items.filter((item) => itemDayKeys(item).some((day) => day.startsWith(prefix))).length
  }, [items, month])

  const shiftMonth = (delta) => {
    const date = new Date(month.year, month.monthIndex + delta, 1)
    onMonthChange({ year: date.getFullYear(), monthIndex: date.getMonth() })
  }

  return (
    <section
      aria-label="日历"
      className="rounded-[var(--radius-card)] border border-line bg-surface p-3.5 shadow-[var(--c-shadow)] sm:p-4"
    >
      <div className="mb-3 flex items-center justify-between gap-1">
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="上个月"
            onClick={() => shiftMonth(-1)}
            className="grid h-9 w-9 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-ink"
          >
            <ChevronLeftIcon size={18} />
          </button>
          <button
            type="button"
            aria-label="下个月"
            onClick={() => shiftMonth(1)}
            className="grid h-9 w-9 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-ink"
          >
            <ChevronRightIcon size={18} />
          </button>
        </div>

        <h2 className="text-[15px] font-semibold tracking-tight text-ink tabular-nums">
          {formatMonthTitle(month.year, month.monthIndex)}
        </h2>

        <button
          type="button"
          onClick={() => onSelectDay(today)}
          disabled={selectedDay === today && month.monthIndex === new Date().getMonth()}
          className="inline-flex h-8 items-center gap-1 rounded-full border border-line px-2.5 text-xs text-ink-soft transition hover:bg-surface-2 disabled:opacity-40"
        >
          <CalendarIcon size={13} />
          今天
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((label) => (
          <div key={label} className="py-1 text-center text-[11px] font-medium text-muted">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {grid.map((cell) => {
          const count = counts.get(cell.dayKey) || 0
          const isSelected = cell.dayKey === selectedDay
          const hasContent = count > 0

          let tone = 'text-ink font-medium hover:bg-surface-2'
          if (!cell.inMonth) tone = 'text-muted/25'
          else if (!hasContent) tone = 'text-muted/45 hover:bg-surface-2'
          if (isSelected) tone = 'bg-accent text-accent-ink font-semibold shadow-sm'
          else if (cell.isToday) tone += ' ring-1 ring-accent/50'

          return (
            <button
              key={cell.dayKey}
              type="button"
              onClick={() => onSelectDay(cell.dayKey)}
              aria-label={`${cell.dayKey}${hasContent ? `，${count} 条记录` : '，无记录'}`}
              aria-pressed={isSelected}
              className={`relative flex aspect-square min-h-9 flex-col items-center justify-center rounded-xl text-[13px] leading-none transition tabular-nums ${tone}`}
            >
              <span>{cell.day}</span>
              <span
                className={`mt-1 h-1 w-1 rounded-full ${
                  hasContent ? (isSelected ? 'bg-accent-ink/80' : 'bg-accent') : 'bg-transparent'
                }`}
              />
            </button>
          )
        })}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-line/70 pt-2.5 text-[11px] text-muted">
        <span>本月 {monthTotal} 条</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />有记录
          <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-muted/40" />无记录
        </span>
      </div>
    </section>
  )
}
