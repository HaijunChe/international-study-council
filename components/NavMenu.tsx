'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import LanguageSwitcher, { type LocaleOption } from './LanguageSwitcher'
import IscMark from './IscMark'
import { SearchOverlay, type SearchLabels } from './Search'

export type NavItem = { href: string; label: string }

export default function NavMenu({
  items,
  siteName,
  logoText,
  ctaHref,
  ctaLabel,
  locale,
  locales,
  langLabel,
  searchLabels,
}: {
  items: NavItem[]
  siteName: string
  logoText: string
  ctaHref: string
  ctaLabel: string
  locale: string
  locales: LocaleOption[]
  langLabel: string
  searchLabels: SearchLabels
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // Compare against the locale-stripped path so the active item still lights up.
  const bare = (() => {
    const segments = pathname.split('/').filter(Boolean)
    if (locales.some((item) => item.code === segments[0])) segments.shift()
    return `/${segments.join('/')}`
  })()

  return (
    <header className={`site-head${open ? ' is-open' : ''}`}>
      <div className="wrap site-head__inner">
        <Link className="brand" href={locale === 'en' ? '/' : `/${locale}`} aria-label={siteName}>
          <IscMark className="brand__logo" label={siteName} />
          <span className="brand__name">{siteName}</span>
        </Link>

        <nav className="site-nav" aria-label="Primary">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={bare === item.href || (item.href !== '/' && bare.startsWith(item.href)) ? 'is-active' : ''}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="site-head__actions">
          <SearchOverlay locale={locale} labels={searchLabels} />
          <LanguageSwitcher current={locale} locales={locales} label={langLabel} />
          <Link className="btn btn--fg btn--sm" href={ctaHref}>
            {ctaLabel}
          </Link>
          <button
            className="nav-toggle"
            type="button"
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
          </button>
        </div>
      </div>

      <div className="site-nav--mobile" hidden={!open}>
        {items.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.label}
          </Link>
        ))}
        <Link className="btn btn--fg" href={ctaHref}>
          {ctaLabel}
        </Link>
        <div className="site-nav--mobile__lang">
          <LanguageSwitcher current={locale} locales={locales} label={langLabel} variant="foot" />
        </div>
      </div>
    </header>
  )
}
