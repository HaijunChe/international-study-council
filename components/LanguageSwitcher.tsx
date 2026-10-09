'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

export type LocaleOption = { code: string; label: string; english: string; flag: string }

export default function LanguageSwitcher({
  current,
  locales,
  label,
  variant = 'head',
}: {
  current: string
  locales: LocaleOption[]
  label: string
  variant?: 'head' | 'foot'
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (hostRef.current && !hostRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  useEffect(() => setOpen(false), [pathname])

  const active = locales.find((locale) => locale.code === current) || locales[0]

  function go(code: string) {
    const segments = pathname.split('/').filter(Boolean)
    if (locales.some((locale) => locale.code === segments[0])) segments.shift()
    const rest = segments.join('/')
    const target = code === 'en' ? `/${rest}` : `/${code}${rest ? `/${rest}` : ''}`
    router.push(target || '/')
  }

  return (
    <div className={`lang lang--${variant}`} ref={hostRef}>
      <button
        className="lang__button"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="lang__flag" aria-hidden="true">
          {active.flag}
        </span>
        <span className="lang__code">{active.code.toUpperCase()}</span>
        <span className="lang__caret" aria-hidden="true" />
      </button>

      {open ? (
        <ul className="lang__menu" role="listbox" aria-label={label}>
          {locales.map((locale) => (
            <li key={locale.code}>
              <button
                className={`lang__option${locale.code === current ? ' is-active' : ''}`}
                type="button"
                role="option"
                aria-selected={locale.code === current}
                onClick={() => go(locale.code)}
              >
                <span className="lang__flag" aria-hidden="true">
                  {locale.flag}
                </span>
                <span className="lang__name">{locale.label}</span>
                <span className="lang__english">{locale.english}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
