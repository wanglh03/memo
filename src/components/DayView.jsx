import { imageUrl } from '../lib/api.js'
import { formatDayWithWeek, relativeDayLabel } from '../lib/date.js'
import { Markdown } from './Markdown.jsx'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  InboxIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from './icons.jsx'

function EntryImages({ images, onPreview }) {
  if (!images?.length) return null
  return (
    <div
      className={`mt-3 grid gap-1.5 ${
        images.length === 1
          ? 'grid-cols-1'
          : images.length === 2
            ? 'grid-cols-2'
            : 'grid-cols-2 sm:grid-cols-3'
      }`}
    >
      {images.map((image, index) => (
        <button
          key={image.key}
          type="button"
          onClick={() => onPreview(images, index)}
          className="group relative overflow-hidden rounded-xl border border-line bg-surface-2"
          aria-label="查看大图"
        >
          <img
            src={imageUrl(image.key)}
            alt=""
            loading="lazy"
            decoding="async"
            className={`w-full object-cover transition duration-300 group-hover:scale-[1.02] ${
              images.length === 1 ? 'max-h-80 object-contain' : 'aspect-[4/3]'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

function EntryCard({ item, onEdit, onDelete, onPreview }) {
  const time = item.date.slice(11, 13)

  return (
    <article className="group relative overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface p-4 shadow-[var(--c-shadow)] sm:p-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-11 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl border border-line bg-surface-2 px-2">
          <span className="text-[13px] font-semibold leading-none tabular-nums text-ink">
            {time}:00
          </span>
          <ClockIcon size={11} className="text-muted" />
        </div>

        <div className="min-w-0 flex-1">
          {item.title ? (
            <h3 className="text-[16px] font-semibold leading-snug text-ink">{item.title}</h3>
          ) : (
            <h3 className="text-[15px] font-medium leading-snug text-muted">无标题</h3>
          )}

          {item.content?.trim() ? <Markdown className="mt-1.5">{item.content}</Markdown> : null}

          <EntryImages images={item.images} onPreview={onPreview} />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-line/60 pt-2.5">
        <span className="truncate text-[11px] text-muted">
          {item.completed ? '已完成 · ' : ''}
          {item.updatedAt && item.updatedAt !== item.createdAt ? '编辑于 ' : '创建于 '}
          {new Date(item.updatedAt || item.createdAt).toLocaleString('zh-CN', {
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-[12px] text-muted transition hover:bg-surface-2 hover:text-ink"
          >
            <PencilIcon size={14} />
            编辑
          </button>
          <button
            type="button"
            onClick={() => onDelete(item)}
            className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-[12px] text-muted transition hover:bg-danger-soft hover:text-danger"
          >
            <TrashIcon size={14} />
            删除
          </button>
        </div>
      </div>
    </article>
  )
}

export function DayView({ dayKey, items, onAdd, onEdit, onDelete, onPreview, onNavigateDay }) {
  const sorted = [...items].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1
    return (a.createdAt || '') < (b.createdAt || '') ? -1 : 1
  })

  return (
    <section className="min-w-0">
      <header className="mb-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h2 className="truncate text-[22px] font-semibold leading-tight tracking-tight text-ink">
              {relativeDayLabel(dayKey)}
            </h2>
            <span className="shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent">
              {items.length} 条
            </span>
          </div>
          <p className="mt-0.5 text-[13px] text-muted">{formatDayWithWeek(dayKey)}</p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            aria-label="前一天"
            onClick={() => onNavigateDay(-1)}
            className="grid h-9 w-9 place-items-center rounded-full border border-line bg-surface text-muted transition hover:bg-surface-2 hover:text-ink"
          >
            <ChevronLeftIcon size={17} />
          </button>
          <button
            type="button"
            aria-label="后一天"
            onClick={() => onNavigateDay(1)}
            className="grid h-9 w-9 place-items-center rounded-full border border-line bg-surface text-muted transition hover:bg-surface-2 hover:text-ink"
          >
            <ChevronRightIcon size={17} />
          </button>
          <button
            type="button"
            onClick={onAdd}
            className="ml-1 inline-flex h-9 items-center gap-1.5 rounded-full bg-accent px-3.5 text-[13px] font-medium text-accent-ink transition hover:brightness-110"
          >
            <PlusIcon size={16} />
            添加
          </button>
        </div>
      </header>

      {sorted.length ? (
        <div className="space-y-3">
          {sorted.map((item) => (
            <EntryCard
              key={item.id}
              item={item}
              onEdit={onEdit}
              onDelete={onDelete}
              onPreview={onPreview}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-line bg-surface/60 px-6 py-14 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-surface-2 text-muted">
            <InboxIcon size={22} />
          </div>
          <p className="mt-3 text-sm font-medium text-ink">这一天还没有记录</p>
          <p className="mt-1 text-[13px] text-muted">写点什么，或先加几张图片</p>
          <button
            type="button"
            onClick={onAdd}
            className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-4 text-[13px] font-medium text-ink transition hover:bg-surface-2"
          >
            <PlusIcon size={15} />
            添加记录
          </button>
        </div>
      )}
    </section>
  )
}
