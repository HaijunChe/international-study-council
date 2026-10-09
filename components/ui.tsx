import Link from 'next/link'
import type { ReactNode } from 'react'
import { isExternal, resolveHref, type I18n, type SiteSettings } from '@/lib/kernel/types'

export function Arrow({ className = '' }: { className?: string }) {
  return (
    <svg className={`arrow ${className}`} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M2 8h11M9 3.5 13.5 8 9 12.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Section({
  children,
  className = '',
  id,
  tone = 'paper',
  size = 'md',
}: {
  children: ReactNode
  className?: string
  id?: string
  tone?: 'paper' | 'ink' | 'soft'
  size?: 'sm' | 'md' | 'lg'
}) {
  return (
    <section id={id} className={`sec sec--${size} sec--${tone} ${className}`}>
      <div className="wrap">{children}</div>
    </section>
  )
}

export function SectionHead({
  label,
  title,
  body,
  action,
  align = 'left',
}: {
  label?: string
  title?: string
  body?: string
  action?: ReactNode
  align?: 'left' | 'center'
}) {
  if (!label && !title && !body && !action) return null
  return (
    <header className={`sec-head sec-head--${align}`}>
      <div className="sec-head__text">
        {label ? <p className="label">{label}</p> : null}
        {title ? <h2 className="h2">{title}</h2> : null}
        {body ? <p className="sec-head__body">{body}</p> : null}
      </div>
      {action ? <div className="sec-head__action">{action}</div> : null}
    </header>
  )
}

export function Btn({
  href,
  children,
  variant = 'ink',
  settings,
  i18n,
  size,
  full,
}: {
  href: string
  children: ReactNode
  variant?: 'ink' | 'ghost' | 'quiet' | 'paper' | 'paper-ghost'
  settings: SiteSettings
  i18n?: I18n
  size?: 'sm' | 'lg'
  full?: boolean
}) {
  const resolved = resolveHref(href, settings)
  if (!resolved) return null
  const external = isExternal(resolved)
  const target = !external && i18n ? i18n.href(resolved) : resolved
  const cls = `btn btn--${variant}${size ? ` btn--${size}` : ''}${full ? ' btn--full' : ''}`
  const inner = (
    <>
      <span>{children}</span>
      <Arrow />
    </>
  )
  if (external) {
    return (
      <a className={cls} href={target} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    )
  }
  return (
    <Link className={cls} href={target}>
      {inner}
    </Link>
  )
}

export function Media({
  src,
  alt = '',
  ratio = '4 / 3',
  className = '',
  priority,
  style,
}: {
  src?: string
  alt?: string
  ratio?: string
  className?: string
  priority?: boolean
  style?: React.CSSProperties
}) {
  if (!src) return null
  return (
    <figure className={`media ${className}`} style={{ aspectRatio: ratio, ...style }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading={priority ? 'eager' : 'lazy'} decoding="async" />
    </figure>
  )
}

export function Chip({ children, tone = 'line' }: { children: ReactNode; tone?: 'line' | 'accent' | 'ink' }) {
  return <span className={`chip chip--${tone}`}>{children}</span>
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="empty-note">{children}</p>
}
