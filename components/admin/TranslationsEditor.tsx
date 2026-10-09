'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from './FieldInput'

export type TranslationRow = {
  key: string
  source: string
  group: string
}

export default function TranslationsEditor({
  locales,
  current,
  coverage,
  uiRows,
  contentRows,
  values,
}: {
  locales: Array<{ code: string; label: string; english: string; flag: string }>
  current: string
  coverage: Record<string, number>
  uiRows: TranslationRow[]
  contentRows: TranslationRow[]
  values: Record<string, string>
}) {
  const router = useRouter()
  const [draft, setDraft] = useState<Record<string, string>>({ ...values })
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<'ui' | 'content'>('ui')
  const [busy, setBusy] = useState(false)
  const { toast, toastNode } = useToast()

  const rows = tab === 'ui' ? uiRows : contentRows

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter(
      (row) =>
        row.source.toLowerCase().includes(needle) ||
        row.group.toLowerCase().includes(needle) ||
        row.key.toLowerCase().includes(needle),
    )
  }, [rows, query])

  const grouped = useMemo(() => {
    const map = new Map<string, TranslationRow[]>()
    for (const row of filtered) {
      const group = tab === 'ui' ? row.group : row.group
      if (!map.has(group)) map.set(group, [])
      map.get(group)!.push(row)
    }
    return [...map.entries()]
  }, [filtered, tab])

  const filled = rows.filter((row) => (draft[row.key] || '').trim()).length
  const total = rows.length
  const dirty = Object.keys(draft).some((key) => (draft[key] || '') !== (values[key] || ''))

  function set(key: string, value: string) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  async function save() {
    setBusy(true)
    try {
      const changed: Record<string, string> = {}
      for (const [key, value] of Object.entries(draft)) {
        if ((value || '') !== (values[key] || '')) changed[key] = value || ''
      }
      const res = await fetch('/api/admin/translations', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ locale: current, entries: changed }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Could not save')
      toast({ message: `Saved ${Object.keys(changed).length} strings` })
      router.refresh()
    } catch (error: any) {
      toast({ message: error?.message || 'Could not save', error: true })
    } finally {
      setBusy(false)
    }
  }

  function switchLocale(code: string) {
    if (dirty && !confirm('You have unsaved changes. Switch language anyway?')) return
    router.push(`/admin/languages?locale=${code}`)
  }

  return (
    <>
      <div className="adm-bar">
        <div className="adm-bar__left">
          <span className="adm-bar__title">Languages</span>
          <span className="adm-bar__sub">
            {filled} of {total} strings translated · {Math.round((filled / Math.max(total, 1)) * 100)}%
          </span>
        </div>
        <div className="adm-bar__actions">
          <button className="adm-btn adm-btn--fg" type="button" onClick={save} disabled={busy || !dirty}>
            {busy ? 'Saving…' : dirty ? 'Save translations' : 'Saved'}
          </button>
        </div>
      </div>

      <div className="adm-body">
        <div className="lang-tabs">
          {locales.map((locale) => (
            <button
              key={locale.code}
              className={`lang-tab${locale.code === current ? ' is-active' : ''}`}
              type="button"
              onClick={() => switchLocale(locale.code)}
            >
              <span className="lang-tab__flag">{locale.flag}</span>
              <span className="lang-tab__name">{locale.label}</span>
              <span className="lang-tab__count">{coverage[locale.code] ?? 0}</span>
            </button>
          ))}
        </div>

        <div className="adm-card">
          <div className="tr-toolbar">
            <div className="tr-tabs">
              <button
                className={`tr-tab${tab === 'ui' ? ' is-active' : ''}`}
                type="button"
                onClick={() => setTab('ui')}
              >
                Interface ({uiRows.length})
              </button>
              <button
                className={`tr-tab${tab === 'content' ? ' is-active' : ''}`}
                type="button"
                onClick={() => setTab('content')}
              >
                Content ({contentRows.length})
              </button>
            </div>
            <input
              className="adm-input"
              style={{ maxWidth: 280 }}
              placeholder="Search English text…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <p className="adm-hint" style={{ marginTop: 12 }}>
            {tab === 'ui'
              ? 'The fixed labels, buttons and form text of the site. Anything left blank falls back to English.'
              : 'Headings and body copy from your pages and collections. Blank means the English version is shown.'}
          </p>

          <div className="tr-list">
            {grouped.map(([group, groupRows]) => (
              <details className="tr-group" key={group} open={grouped.length <= 6}>
                <summary>
                  <span className="tr-group__name">{group}</span>
                  <span className="tr-group__count">
                    {groupRows.filter((row) => (draft[row.key] || '').trim()).length}/{groupRows.length}
                  </span>
                </summary>
                <div className="tr-group__body">
                  {groupRows.map((row) => (
                    <div className="tr-row" key={row.key}>
                      <div className="tr-row__source">
                        <span className="tr-row__text">{row.source}</span>
                        <code className="tr-row__key">{row.key}</code>
                      </div>
                      <textarea
                        className="adm-textarea tr-row__input"
                        rows={row.source.length > 90 ? 3 : 1}
                        dir={current === 'ar' ? 'rtl' : 'ltr'}
                        value={draft[row.key] ?? ''}
                        placeholder={row.source}
                        onChange={(event) => set(row.key, event.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </details>
            ))}
            {!grouped.length ? <p className="adm-empty">Nothing matches that search.</p> : null}
          </div>
        </div>
      </div>

      {toastNode}
    </>
  )
}
