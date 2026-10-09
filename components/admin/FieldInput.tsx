'use client'

import { useEffect, useRef, useState } from 'react'
import type { FieldDef } from '@/lib/kernel/types'

/* --------------------------------- media --------------------------------- */

function MediaField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [library, setLibrary] = useState<{ id: string; url: string; filename: string }[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function openLibrary() {
    if (library) {
      setLibrary(null)
      return
    }
    const res = await fetch('/api/admin/media')
    const json = await res.json().catch(() => ({ media: [] }))
    setLibrary(json.media || [])
  }

  async function upload(file: File) {
    setBusy(true)
    setError('')
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: form })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Upload failed')
      onChange(json.media.url)
      setLibrary(null)
    } catch (err: any) {
      setError(err?.message || 'Upload failed')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="mf">
      <div className="mf__row">
        <input
          className="adm-input"
          value={value || ''}
          placeholder="https://… or /uploads/…"
          onChange={(event) => onChange(event.target.value)}
        />
        <button className="adm-btn adm-btn--sm" type="button" onClick={() => fileRef.current?.click()} disabled={busy}>
          {busy ? 'Uploading…' : 'Upload'}
        </button>
        <button className="adm-btn adm-btn--sm" type="button" onClick={openLibrary}>
          {library ? 'Hide library' : 'Library'}
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void upload(file)
        }}
      />

      {error ? <p className="f-help" style={{ color: '#b3261e' }}>{error}</p> : null}

      {value ? (
        <div className="mf__preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" />
        </div>
      ) : null}

      {library ? (
        library.length ? (
          <div className="mf__library">
            {library.map((item) => (
              <button
                className="mf__thumb"
                type="button"
                key={item.id}
                onClick={() => {
                  onChange(item.url)
                  setLibrary(null)
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.url} alt={item.filename} />
              </button>
            ))}
          </div>
        ) : (
          <p className="f-help">Nothing uploaded yet. Use Upload, or paste an image URL.</p>
        )
      ) : null}
    </div>
  )
}

/* -------------------------------- repeater ------------------------------- */

function RepeaterField({
  field,
  value,
  onChange,
}: {
  field: FieldDef
  value: any[]
  onChange: (value: any[]) => void
}) {
  const [open, setOpen] = useState<number | null>(value?.length ? 0 : null)
  const rows = Array.isArray(value) ? value : []
  const subFields = field.fields || []

  function update(index: number, patch: Record<string, any>) {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  function move(index: number, delta: number) {
    const next = [...rows]
    const target = index + delta
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
    setOpen(target)
  }

  return (
    <div className="rp">
      {rows.length === 0 ? <p className="rp__empty">No items yet.</p> : null}

      {rows.map((row, index) => {
        const labelKey = field.itemLabel || subFields[0]?.key || 'title'
        const label = String(row?.[labelKey] || row?.title || row?.name || `Item ${index + 1}`)
        const isOpen = open === index
        return (
          <div className={`rp__row${isOpen ? ' is-open' : ''}`} key={index}>
            <div className="rp__head" onClick={() => setOpen(isOpen ? null : index)}>
              <span className="rp__handle">{String(index + 1).padStart(2, '0')}</span>
              <span className="rp__title">{label}</span>
              <span className="bl__tools" onClick={(event) => event.stopPropagation()}>
                <button className="bl__icon-btn" type="button" title="Move up" onClick={() => move(index, -1)}>
                  ↑
                </button>
                <button className="bl__icon-btn" type="button" title="Move down" onClick={() => move(index, 1)}>
                  ↓
                </button>
                <button
                  className="bl__icon-btn"
                  type="button"
                  title="Duplicate"
                  onClick={() => onChange([...rows.slice(0, index + 1), { ...row }, ...rows.slice(index + 1)])}
                >
                  ⧉
                </button>
                <button
                  className="bl__icon-btn"
                  type="button"
                  title="Remove"
                  onClick={() => {
                    onChange(rows.filter((_, i) => i !== index))
                    setOpen(null)
                  }}
                >
                  ✕
                </button>
              </span>
              <span className="rp__chevron">▶</span>
            </div>

            {isOpen ? (
              <div className="rp__body">
                <div className="f-row" style={{ paddingTop: 12 }}>
                  {subFields.map((sub) => (
                    <FieldInput
                      key={sub.key}
                      field={sub}
                      value={row?.[sub.key]}
                      onChange={(next) => update(index, { [sub.key]: next })}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )
      })}

      <div className="rp__foot">
        <button
          className="adm-btn adm-btn--sm"
          type="button"
          onClick={() => {
            onChange([...rows, {}])
            setOpen(rows.length)
          }}
        >
          + Add item
        </button>
      </div>
    </div>
  )
}

/* --------------------------------- field --------------------------------- */

export default function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldDef
  value: any
  onChange: (value: any) => void
}) {
  const wide =
    field.span === 2 || ['textarea', 'richtext', 'repeater', 'image', 'checkboxes', 'heading'].includes(field.type)
  const className = `f-field${wide ? ' f-field--wide' : ''}`

  if (field.type === 'heading') {
    return (
      <div className="f-field f-field--wide">
        <p className="f-heading">{field.label}</p>
        {field.help ? <p className="f-help">{field.help}</p> : null}
      </div>
    )
  }

  const label = (
    <label className="f-label" htmlFor={`fld-${field.key}`}>
      {field.label}
    </label>
  )

  let control: React.ReactNode = null

  switch (field.type) {
    case 'checkboxes': {
      const selected = Array.isArray(value) ? value : []
      control = (
        <div className="f-checks">
          {(field.options || []).map((option) => (
            <label className="adm-check" key={option}>
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={(event) =>
                  onChange(
                    event.target.checked ? [...selected, option] : selected.filter((item: string) => item !== option),
                  )
                }
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      )
      break
    }
    case 'textarea':
    case 'richtext':
      control = (
        <textarea
          id={`fld-${field.key}`}
          className="adm-textarea"
          rows={field.type === 'richtext' ? 8 : 3}
          placeholder={field.placeholder}
          value={value ?? ''}
          onChange={(event) => onChange(event.target.value)}
        />
      )
      break

    case 'list':
      control = (
        <textarea
          id={`fld-${field.key}`}
          className="adm-textarea"
          rows={4}
          placeholder={field.placeholder || 'One item per line'}
          value={Array.isArray(value) ? value.join('\n') : value ?? ''}
          onChange={(event) =>
            onChange(
              event.target.value
                .split('\n')
                .map((line) => line.trim())
                .filter(Boolean),
            )
          }
        />
      )
      break

    case 'select':
      control = (
        <select
          id={`fld-${field.key}`}
          className="adm-select"
          value={value ?? ''}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">—</option>
          {(field.options || []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      )
      break

    case 'boolean':
      control = (
        <label className="adm-check">
          <input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} />
          <span>{field.placeholder || 'Yes'}</span>
        </label>
      )
      break

    case 'number':
      control = (
        <input
          id={`fld-${field.key}`}
          className="adm-input"
          type="number"
          placeholder={field.placeholder}
          value={value ?? ''}
          onChange={(event) => onChange(event.target.value === '' ? '' : Number(event.target.value))}
        />
      )
      break

    case 'date':
      control = (
        <input
          id={`fld-${field.key}`}
          className="adm-input"
          type="date"
          value={value ? String(value).slice(0, 10) : ''}
          onChange={(event) => onChange(event.target.value)}
        />
      )
      break

    case 'color':
      control = (
        <div className="f-color">
          <input type="color" value={value || '#000000'} onChange={(event) => onChange(event.target.value)} />
          <input className="adm-input" value={value || ''} onChange={(event) => onChange(event.target.value)} />
        </div>
      )
      break

    case 'image':
      control = <MediaField value={value || ''} onChange={onChange} />
      break

    case 'repeater':
      control = <RepeaterField field={field} value={value || []} onChange={onChange} />
      break

    default:
      control = (
        <input
          id={`fld-${field.key}`}
          className="adm-input"
          type={field.type === 'url' ? 'url' : 'text'}
          placeholder={field.placeholder}
          value={value ?? ''}
          onChange={(event) => onChange(event.target.value)}
        />
      )
  }

  return (
    <div className={className}>
      {field.type === 'boolean' ? null : label}
      {control}
      {field.help ? <p className="f-help">{field.help}</p> : null}
    </div>
  )
}

/** Convenience: render a whole field list against a flat object. */
export function FieldSet({
  fields,
  data,
  onChange,
}: {
  fields: FieldDef[]
  data: Record<string, any>
  onChange: (key: string, value: any) => void
}) {
  return (
    <div className="f-row">
      {fields.map((field) => (
        <FieldInput key={field.key} field={field} value={data?.[field.key]} onChange={(value) => onChange(field.key, value)} />
      ))}
    </div>
  )
}

export function useToast() {
  const [toast, setToast] = useState<{ message: string; error?: boolean } | null>(null)
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(timer)
  }, [toast])
  const node = toast ? (
    <div className={`adm-toast${toast.error ? ' adm-toast--error' : ''}`} role="status">
      {toast.message}
    </div>
  ) : null
  return { toast: setToast, toastNode: node }
}
