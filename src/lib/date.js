/**
 * 时间工具。
 *
 * 事项的日期以「墙上时间」保存，格式 'YYYY-MM-DDTHH'（精确到小时），
 * 展示与分组都不做时区换算，避免跨时区漂移。
 */

export const HOURS = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'))
export const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']
const WEEKDAY_FULL = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

const pad = (value) => String(value).padStart(2, '0')

/** Date -> 'YYYY-MM-DD' */
export function toDayKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Date -> 'YYYY-MM-DDTHH' */
export function toDateValue(date) {
  return `${toDayKey(date)}T${pad(date.getHours())}`
}

/** 'YYYY-MM-DDTHH' -> Date（本地时间） */
export function parseDateValue(value) {
  if (typeof value !== 'string') return new Date()
  const [day, hour] = value.split('T')
  const [year, month, date] = day.split('-').map(Number)
  return new Date(year, (month || 1) - 1, date || 1, Number(hour) || 0, 0, 0, 0)
}

/** 'YYYY-MM-DD' -> Date（本地 0 点） */
export function parseDayKey(value) {
  const [year, month, date] = String(value).split('-').map(Number)
  return new Date(year, (month || 1) - 1, date || 1)
}

export function todayKey() {
  return toDayKey(new Date())
}

export function addDays(dayKey, amount) {
  const date = parseDayKey(dayKey)
  date.setDate(date.getDate() + amount)
  return toDayKey(date)
}

export function formatDayLabel(dayKey) {
  const date = parseDayKey(dayKey)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

export function formatDayWithWeek(dayKey) {
  const date = parseDayKey(dayKey)
  return `${date.getMonth() + 1}月${date.getDate()}日 ${WEEKDAY_FULL[date.getDay()]}`
}

export function formatDateValue(value) {
  const date = parseDateValue(value)
  return `${date.getMonth() + 1}月${date.getDate()}日 ${WEEKDAY_FULL[date.getDay()]} ${pad(
    date.getHours(),
  )}:00`
}

export function formatMonthTitle(year, monthIndex) {
  return `${year}年${monthIndex + 1}月`
}

/** 今天 / 明天 / 昨天，其余返回 M月D日 */
export function relativeDayLabel(dayKey) {
  const today = todayKey()
  if (dayKey === today) return '今天'
  if (dayKey === addDays(today, 1)) return '明天'
  if (dayKey === addDays(today, -1)) return '昨天'
  return formatDayLabel(dayKey)
}

/** ISO 时间戳 -> 刚刚 / 5 分钟前 / 3 小时前 / 昨天 21:30 / 11月3日 */
export function relativeTime(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''

  const diff = Date.now() - date.getTime()
  if (diff < 45 * 1000) return '刚刚'
  if (diff < 60 * 60 * 1000) return `${Math.max(1, Math.round(diff / 60000))} 分钟前`
  if (diff < 24 * 60 * 60 * 1000) return `${Math.round(diff / 3600000)} 小时前`
  if (diff < 48 * 60 * 60 * 1000) return `昨天 ${pad(date.getHours())}:${pad(date.getMinutes())}`
  if (date.getFullYear() === new Date().getFullYear()) {
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

/**
 * 生成月历网格（周一开头，固定 6 行 42 格）。
 */
export function buildMonthGrid(year, monthIndex) {
  const first = new Date(year, monthIndex, 1)
  const offset = (first.getDay() + 6) % 7
  const start = new Date(year, monthIndex, 1 - offset)
  const today = todayKey()

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index)
    const dayKey = toDayKey(date)
    return {
      dayKey,
      day: date.getDate(),
      inMonth: date.getMonth() === monthIndex,
      isToday: dayKey === today,
    }
  })
}

export function sortByDate(items) {
  return [...items].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1
    return (a.createdAt || '') < (b.createdAt || '') ? 1 : -1
  })
}

export function sortByUpdated(items) {
  return [...items].sort((a, b) => ((a.updatedAt || '') < (b.updatedAt || '') ? 1 : -1))
}
