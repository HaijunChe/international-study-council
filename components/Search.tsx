'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import Icon from './Icon'

export type SearchHit = {
  type: string
  kind: string
  title: string
  subtitle: string
  href: string
}

export type SearchLabels = {
  placeholder: string
  open: string
  close: string
  empty: string
  hint: string
  noResults: string
  searching: string
}

const DEFAULT_LABELS: SearchLabels = {
  placeholder: 'Search services, universities, scholarships…',
  open: 'Search',
  close: 'Close search',
  empty: 'Type at least two characters',
  hint: '↑↓ to move · Enter to open · Esc to close',
  noResults: 'Nothing matched that',
  searching: 'Searching…',
}

/** Where a result should point, with the locale prefix applied. */
function withLocale(locale: string, href: string): string {
  if (!locale || locale === 'en') return href
  return href === '/' ? `/${locale}` : `/${locale}${href}`
}

export function SearchTrigger({
  labels = DEFAULT_LABELS,
  onOpen,
}: {
  labels?: SearchLabels
  onOpen: () => void
}) {
  return (
    <button className="sbtn" type="button" onClick={onOpen} aria-label={labels.open}>
      <Icon name="search" size={15} />
      <kbd className="sbtn__kbd">⌘K</kbd>
    </button>
  )
}

/** The inline field that sits in the hero. */
export function SearchInline({
  locale,
  labels = DEFAULT_LABELS,
}: {
  locale: string
  labels?: SearchLabels
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  return (
    <>
      <form
        className="search-inline"
        onSubmit={(event) => {
          event.preventDefault()
          if (query.trim().length >= 2) setOpen(true)
        }}
        role="search"
      >
        <Icon name="search" size={17} />
        <input
          type="search"
          value={query}
          placeholder={labels.placeholder}
          aria-label={labels.placeholder}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
        />
        {query ? (
          <button
            className="search-inline__clear"
            type="button"
            aria-label={labels.close}
            onClick={() => {
              setQuery('')
              setOpen(false)
            }}
          >
            ✕
          </button>
        ) : null}
      </form>
      {open && query.trim().length >= 2 ? (
        <SearchPanel
          locale={locale}
          labels={labels}
          initialQuery={query}
          inline
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  )
}

export function SearchOverlay({
  locale,
  labels = DEFAULT_LABELS,
}: {
  locale: string
  labels?: SearchLabels
}) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen((value) => !value)
      }
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <SearchTrigger labels={labels} onOpen={() => setOpen(true)} />
      {open ? <SearchPanel locale={locale} labels={labels} onClose={() => setOpen(false)} /> : null}
    </>
  )
}

function SearchPanel({
  locale,
  labels = DEFAULT_LABELS,
  initialQuery = '',
  inline = false,
  onClose,
}: {
  locale: string
  labels?: SearchLabels
  initialQuery?: string
  inline?: boolean
  onClose: () => void
}) {
  const pathname = usePathname()
  const [query, setQuery] = useState(initialQuery)
  const [hits, setHits] = useState<SearchHit[]>([])
  const [busy, setBusy] = useState(false)
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    setActive(0)
    const needle = query.trim()
    if (needle.length < 2) {
      setHits([])
      setBusy(false)
      return
    }
    setBusy(true)
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(needle)}`, { signal: controller.signal })
        const json = await res.json().catch(() => ({ hits: [] }))
        setHits(json.hits || [])
      } catch {
        /* aborted */
      } finally {
        setBusy(false)
      }
    }, 170)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  /* Close when the route changes. */
  useEffect(() => {
    onClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  /* Click outside closes the inline variant. */
  useEffect(() => {
    if (!inline) return
    function onDown(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) onClose()
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [inline, onClose])

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (!hits.length) return
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setActive((index) => (index + 1) % hits.length)
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setActive((index) => (index - 1 + hits.length) % hits.length)
      }
      if (event.key === 'Enter') {
        event.preventDefault()
        const hit = hits[active]
        if (hit) window.location.href = withLocale(locale, hit.href)
      }
    },
    [hits, active, locale, onClose],
  )

  const grouped = useMemo(() => {
    const map = new Map<string, SearchHit[]>()
    for (const hit of hits) {
      if (!map.has(hit.type)) map.set(hit.type, [])
      map.get(hit.type)!.push(hit)
    }
    return [...map.entries()]
  }, [hits])

  let flatIndex = -1

  const body = (
    <>
      <div className="sp__field">
        <Icon name="search" size={18} />
        <input
          ref={inputRef}
          type="search"
          value={query}
          placeholder={labels.placeholder}
          aria-label={labels.placeholder}
          autoComplete="off"
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={onKeyDown}
        />
        {busy ? <span className="sp__spinner" aria-hidden="true" /> : null}
        <button className="sp__close" type="button" onClick={onClose} aria-label={labels.close}>
          Esc
        </button>
      </div>

      <div className="sp__body">
        {query.trim().length < 2 ? (
          <p className="sp__note">{labels.empty}</p>
        ) : !hits.length && !busy ? (
          <p className="sp__note">{labels.noResults}</p>
        ) : (
          grouped.map(([type, items]) => (
            <div className="sp__group" key={type}>
              <p className="sp__group-title">{type}</p>
              {items.map((hit) => {
                flatIndex += 1
                const index = flatIndex
                return (
                  <Link
                    key={`${hit.kind}-${hit.href}-${hit.title}`}
                    className={`sp__hit${index === active ? ' is-active' : ''}`}
                    href={withLocale(locale, hit.href)}
                    onMouseEnter={() => setActive(index)}
                  >
                    <span className="sp__hit-title">{hit.title}</span>
                    {hit.subtitle ? <span className="sp__hit-sub">{hit.subtitle}</span> : null}
                    <span className="sp__hit-arrow" aria-hidden="true">
                      ↵
                    </span>
                  </Link>
                )
              })}
            </div>
          ))
        )}
      </div>

      <div className="sp__foot">
        <span>{labels.hint}</span>
      </div>
    </>
  )

  if (inline) {
    return (
      <div className="sp sp--inline" ref={panelRef} role="dialog" aria-label={labels.open}>
        {body}
      </div>
    )
  }

  return (
    <div className="sp__backdrop" onMouseDown={onClose} role="dialog" aria-modal="true" aria-label={labels.open}>
      <div className="sp" ref={panelRef} onMouseDown={(event) => event.stopPropagation()}>
        {body}
      </div>
    </div>
  )
}
