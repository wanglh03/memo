import { useEffect, useMemo, useRef, useState } from 'react'
import { api, imageUrl } from '../lib/api.js'
import { HOURS, parseDateValue, todayKey } from '../lib/date.js'
import { compressImage } from '../lib/image.js'
import { Markdown } from './Markdown.jsx'
import { Button, IconButton, Modal } from './ui.jsx'
import {
  BoldIcon,
  CodeIcon,
  EyeIcon,
  HeadingIcon,
  ImagePlusIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  LoaderIcon,
  PencilIcon,
  PlusIcon,
  QuoteIcon,
  XIcon,
} from './icons.jsx'

const MAX_IMAGES = 6

const fieldBase =
  'rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/60 focus:border-accent/60 focus:bg-surface focus:ring-2 focus:ring-accent/15'
const fieldClass = `w-full ${fieldBase}`

export function MemoEditor({ open, initial, dayKey, onClose, onSaved, onNeedAuth }) {
  const [date, setDate] = useState(todayKey())
  const [hour, setHour] = useState('09')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tab, setTab] = useState('write')
  const [images, setImages] = useState([])
  const [files, setFiles] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)

  const textareaRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!open) return
    if (initial) {
      setDate(initial.date.slice(0, 10))
      setHour(initial.date.slice(11, 13))
      setTitle(initial.title || '')
      setContent(initial.content || '')
      setImages(initial.images || [])
    } else {
      const target = dayKey || todayKey()
      const now = new Date()
      setDate(target)
      setHour(target === todayKey() ? String(now.getHours()).padStart(2, '0') : '09')
      setTitle('')
      setContent('')
      setImages([])
    }
    setFiles([])
    setTab('write')
    setError('')
    setSaving(false)
    setDragging(false)
  }, [open, initial, dayKey])

  // 关闭时释放临时预览 URL
  useEffect(() => {
    if (open) return undefined
    return () => {
      files.forEach((item) => URL.revokeObjectURL(item.preview))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const totalImages = images.length + files.length
  const canSave = Boolean(title.trim() || content.trim() || totalImages)

  function addFiles(fileList) {
    const picked = Array.from(fileList || []).filter((file) => file.type?.startsWith('image/'))
    if (!picked.length) return

    const room = Math.max(0, MAX_IMAGES - totalImages)
    if (!room) {
      setError(`最多只能放 ${MAX_IMAGES} 张图片`)
      return
    }

    const next = picked.slice(0, room).map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
      width: 0,
      height: 0,
      ready: false,
    }))
    setFiles((prev) => [...prev, ...next])
    setError('')

    for (const item of next) {
      compressImage(item.file)
        .then((result) => {
          setFiles((prev) =>
            prev.map((entry) =>
              entry.id === item.id
                ? { ...entry, file: result.file, width: result.width, height: result.height, ready: true }
                : entry,
            ),
          )
        })
        .catch(() => {
          setFiles((prev) =>
            prev.map((entry) => (entry.id === item.id ? { ...entry, ready: true } : entry)),
          )
        })
    }
  }

  function removeFile(id) {
    setFiles((prev) => {
      const target = prev.find((item) => item.id === id)
      if (target) URL.revokeObjectURL(target.preview)
      return prev.filter((item) => item.id !== id)
    })
  }

  function insertText(before, after = before, placeholder = '文字') {
    const el = textareaRef.current
    if (!el) {
      setContent((value) => value + before + placeholder + after)
      return
    }
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = content.slice(start, end) || placeholder
    const next = content.slice(0, start) + before + selected + after + content.slice(end)
    setContent(next)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + before.length, start + before.length + selected.length)
    })
  }

  function prefixLine(prefix, placeholder = '') {
    const el = textareaRef.current
    const start = el?.selectionStart ?? content.length
    const lineStart = content.lastIndexOf('\n', Math.max(0, start - 1)) + 1
    const newlineAt = content.indexOf('\n', start)
    const lineEnd = newlineAt === -1 ? content.length : newlineAt
    const line = content.slice(lineStart, lineEnd)
    const filled = line.trim() ? line : line + placeholder
    const next = content.slice(0, lineStart) + prefix + filled + content.slice(lineEnd)
    setContent(next)
    requestAnimationFrame(() => {
      el?.focus()
      const position = lineStart + prefix.length + filled.length
      el?.setSelectionRange(position, position)
    })
  }

  async function handleSave() {
    if (!canSave || saving) return
    setSaving(true)
    setError('')

    try {
      const uploaded = []
      for (const item of files) {
        const result = await api.upload(item.file, { width: item.width, height: item.height })
        uploaded.push({ key: result.key, w: result.width || item.width, h: result.height || item.height })
      }

      const nextImages = [...images, ...uploaded]
      if (uploaded.length) {
        setImages(nextImages)
        setFiles([])
      }

      const payload = {
        date,
        hour: Number(hour),
        title: title.trim(),
        content,
        images: nextImages,
      }

      const result = initial ? await api.update(initial.id, payload) : await api.create(payload)
      onSaved(result.item, Boolean(initial))
    } catch (caught) {
      if (caught.status === 401) {
        onNeedAuth()
        setError('已解锁，请再点一次「保存」')
      } else {
        setError(caught.message || '保存失败，请重试')
      }
    } finally {
      setSaving(false)
    }
  }

  function handleClose() {
    if (saving) return
    onClose()
  }

  const titleId = 'memo-editor-title'
  const editorTitle = initial ? '编辑记录' : '添加记录'

  const toolbar = useMemo(
    () => [
      { key: 'bold', label: '粗体', icon: BoldIcon, run: () => insertText('**', '**', '粗体') },
      { key: 'italic', label: '斜体', icon: ItalicIcon, run: () => insertText('*', '*', '斜体') },
      { key: 'heading', label: '标题', icon: HeadingIcon, run: () => prefixLine('## ', '标题') },
      { key: 'list', label: '列表', icon: ListIcon, run: () => prefixLine('- ', '列表项') },
      { key: 'quote', label: '引用', icon: QuoteIcon, run: () => prefixLine('> ', '引用') },
      { key: 'link', label: '链接', icon: LinkIcon, run: () => insertText('[', '](https://)', '链接文字') },
      { key: 'code', label: '代码', icon: CodeIcon, run: () => insertText('`', '`', '代码') },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [content],
  )

  return (
    <Modal open={open} onClose={handleClose} className="sm:max-w-2xl" labelledBy={titleId}>
      <div className="flex max-h-[92dvh] flex-col overflow-hidden rounded-t-[1.6rem] border border-line bg-surface shadow-[var(--c-shadow-lg)] sm:max-h-[88dvh] sm:rounded-[1.6rem]">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
          <h2 id={titleId} className="text-[15px] font-semibold text-ink">
            {editorTitle}
          </h2>
          <IconButton label="关闭" onClick={handleClose}>
            <XIcon size={19} />
          </IconButton>
        </header>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
          <div className="grid grid-cols-[1fr_auto] gap-2.5">
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-medium text-muted">日期</span>
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className={fieldClass}
                required
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-medium text-muted">时段</span>
              <select
                value={hour}
                onChange={(event) => setHour(event.target.value)}
                className={`${fieldBase} w-[92px] shrink-0 tabular-nums`}
              >
                {HOURS.map((value) => (
                  <option key={value} value={value}>
                    {value}:00
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-[12px] font-medium text-muted">标题（可选）</span>
            <input
              type="text"
              value={title}
              maxLength={120}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="给这条记录起个名字"
              className={fieldClass}
            />
          </label>

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="text-[12px] font-medium text-muted">内容（支持 Markdown）</span>
              <div className="flex rounded-lg border border-line bg-surface-2 p-0.5">
                <button
                  type="button"
                  onClick={() => setTab('write')}
                  className={`inline-flex h-7 items-center gap-1 rounded-md px-2 text-[12px] transition ${
                    tab === 'write' ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'
                  }`}
                >
                  <PencilIcon size={13} />
                  编辑
                </button>
                <button
                  type="button"
                  onClick={() => setTab('preview')}
                  className={`inline-flex h-7 items-center gap-1 rounded-md px-2 text-[12px] transition ${
                    tab === 'preview' ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'
                  }`}
                >
                  <EyeIcon size={13} />
                  预览
                </button>
              </div>
            </div>

            {tab === 'write' ? (
              <div className="overflow-hidden rounded-xl border border-line bg-surface-2 focus-within:border-accent/60 focus-within:ring-2 focus-within:ring-accent/15">
                <div className="no-scrollbar flex items-center gap-0.5 overflow-x-auto border-b border-line px-1.5 py-1">
                  {toolbar.map((item) => {
                    const Icon = item.icon
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={item.run}
                        title={item.label}
                        aria-label={item.label}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-surface hover:text-ink"
                      >
                        <Icon size={16} />
                      </button>
                    )
                  })}
                </div>
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder={'支持 **粗体**、列表、引用、链接、代码块…\n例如：\n- 买牛奶\n- 给妈妈打个电话'}
                  rows={8}
                  className="block max-h-[46dvh] min-h-[168px] w-full resize-y bg-transparent px-3 py-2.5 text-sm leading-relaxed text-ink outline-none placeholder:text-muted/60"
                />
              </div>
            ) : (
              <div className="min-h-[168px] rounded-xl border border-line bg-surface-2 px-3.5 py-3">
                {content.trim() ? (
                  <Markdown>{content}</Markdown>
                ) : (
                  <p className="text-sm text-muted">还没有内容可以预览</p>
                )}
              </div>
            )}
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[12px] font-medium text-muted">图片</span>
              <span className="text-[11px] text-muted tabular-nums">
                {totalImages}/{MAX_IMAGES}
              </span>
            </div>

            <div
              onDragOver={(event) => {
                event.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault()
                setDragging(false)
                addFiles(event.dataTransfer?.files)
              }}
              className={`rounded-xl border border-dashed p-2 transition ${
                dragging ? 'border-accent bg-accent-soft/60' : 'border-line bg-surface-2/60'
              }`}
            >
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {images.map((image) => (
                  <div
                    key={image.key}
                    className="group relative aspect-square overflow-hidden rounded-lg border border-line bg-surface"
                  >
                    <img
                      src={imageUrl(image.key)}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    <button
                      type="button"
                      aria-label="移除图片"
                      onClick={() => setImages((prev) => prev.filter((entry) => entry.key !== image.key))}
                      className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-black/70"
                    >
                      <XIcon size={13} />
                    </button>
                  </div>
                ))}

                {files.map((item) => (
                  <div
                    key={item.id}
                    className="group relative aspect-square overflow-hidden rounded-lg border border-line bg-surface"
                  >
                    <img src={item.preview} alt="" className="h-full w-full object-cover" />
                    {!item.ready ? (
                      <div className="absolute inset-0 grid place-items-center bg-black/35 text-white">
                        <LoaderIcon size={18} />
                      </div>
                    ) : null}
                    <button
                      type="button"
                      aria-label="移除图片"
                      onClick={() => removeFile(item.id)}
                      className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-black/70"
                    >
                      <XIcon size={13} />
                    </button>
                  </div>
                ))}

                {totalImages < MAX_IMAGES ? (
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-line bg-surface text-muted transition hover:border-accent/50 hover:text-accent"
                  >
                    <ImagePlusIcon size={20} />
                    <span className="text-[11px]">添加</span>
                  </button>
                ) : null}
              </div>

              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(event) => {
                  addFiles(event.target.files)
                  event.target.value = ''
                }}
              />
            </div>
          </div>

          {error ? (
            <p className="rounded-xl bg-danger-soft px-3 py-2 text-[13px] text-danger">{error}</p>
          ) : null}
        </div>

        <footer className="flex shrink-0 items-center justify-between gap-2 border-t border-line px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">
          <span className="hidden text-[11px] text-muted sm:block">图片会自动压缩后上传</span>
          <div className="flex flex-1 justify-end gap-2 sm:flex-none">
            <Button variant="ghost" onClick={handleClose} disabled={saving}>
              取消
            </Button>
            <Button onClick={handleSave} loading={saving} disabled={!canSave} icon={<PlusIcon size={16} />}>
              {saving ? '保存中…' : '保存'}
            </Button>
          </div>
        </footer>
      </div>
    </Modal>
  )
}
