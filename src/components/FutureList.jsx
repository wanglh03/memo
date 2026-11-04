import { useState } from 'react'
import { imageUrl } from '../lib/api.js'
import { Markdown } from './Markdown.jsx'
import { ChevronDownIcon, ClockIcon, PencilIcon, PlusIcon, TrashIcon } from './icons.jsx'

function FutureCard({ item, onEdit, onDelete, onPreview }) {
  return (
    <article className="rounded-2xl border border-line bg-surface p-3">
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-surface-2 text-muted">
          <ClockIcon size={14} />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[14px] font-semibold text-ink">{item.title || '无标题'}</h3>

          {item.content?.trim() ? (
            <div className="mt-0.5 line-clamp-3 text-[12.5px] leading-relaxed text-ink-soft">
              <Markdown>{item.content}</Markdown>
            </div>
          ) : null}

          {item.images?.length ? (
            <div className="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto">
              {item.images.map((image, index) => (
                <button
                  key={image.key}
                  type="button"
                  onClick={() => onPreview(item.images, index)}
                  aria-label="查看大图"
                  className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-line bg-surface-2"
                >
                  <img
                    src={imageUrl(image.key)}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-end gap-1">
        <button
          type="button"
          onClick={() => onEdit(item)}
          className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-[12px] text-muted transition hover:bg-surface-2 hover:text-ink"
        >
          <PencilIcon size={13} />
          编辑
        </button>
        <button
          type="button"
          onClick={() => onDelete(item)}
          className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-[12px] text-muted transition hover:bg-danger-soft hover:text-danger"
        >
          <TrashIcon size={13} />
          删除
        </button>
      </div>
    </article>
  )
}

/**
 * 未来事项：没有指定日期的事项集中在这里，随时可以补上日期。
 */
export function FutureList({
  items,
  onAdd,
  onEdit,
  onDelete,
  onPreview,
  defaultOpen = false,
  className = '',
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section
      aria-label="未来事项"
      className={`overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-[var(--c-shadow)] ${className}`}
    >
      <header className="flex items-center justify-between gap-2 px-3 py-2.5">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="flex min-w-0 items-center gap-2 text-left"
        >
          <span className="text-[14px] font-semibold tracking-tight text-ink">未来事项</span>
          <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[11px] tabular-nums text-muted">
            {items.length}
          </span>
          <ChevronDownIcon
            size={16}
            className={`shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>

        <button
          type="button"
          onClick={onAdd}
          className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-line px-2.5 text-[12px] text-ink-soft transition hover:bg-surface-2 hover:text-ink"
        >
          <PlusIcon size={13} />
          添加
        </button>
      </header>

      {open ? (
        items.length ? (
          <div className="space-y-2 px-2.5 pb-2.5">
            {items.map((item) => (
              <FutureCard
                key={item.id}
                item={item}
                onEdit={onEdit}
                onDelete={onDelete}
                onPreview={onPreview}
              />
            ))}
          </div>
        ) : (
          <p className="px-3.5 pb-3 text-[12px] leading-relaxed text-muted">
            暂时没有未指定日期的事项。想到什么又不想定时间，就放这儿。
          </p>
        )
      ) : null}
    </section>
  )
}
