import { NextResponse, type NextRequest } from 'next/server'

/**
 * English is the default locale and stays at the root: `/universities` is
 * internally rewritten to `/en/universities`, so the canonical URLs the owner
 * shares stay short. Every other language keeps its prefix — `/bn/universities`
 * is passed through untouched so `app/[locale]` resolves it.
 */
const LOCALES = ['en', 'bn', 'es', 'fr', 'ar', 'ru']
const RTL = new Set(['ar'])

const BYPASS = ['/api', '/admin', '/_next', '/uploads', '/world-map.json', '/icon.svg', '/favicon.ico']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (BYPASS.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return NextResponse.next()
  }

  const first = pathname.split('/').filter(Boolean)[0]
  const hasLocale = Boolean(first && LOCALES.includes(first))
  const locale = hasLocale ? first : 'en'

  const headers = new Headers(request.headers)
  headers.set('x-isc-locale', locale)
  headers.set('x-isc-dir', RTL.has(locale) ? 'rtl' : 'ltr')

  // Already prefixed: let Next route it normally, only the headers are ours.
  if (hasLocale) {
    return NextResponse.next({ request: { headers } })
  }

  // Unprefixed: serve the default locale without changing the visible URL.
  const url = request.nextUrl.clone()
  url.pathname = pathname === '/' ? `/${locale}` : `/${locale}${pathname}`

  return NextResponse.rewrite(url, { request: { headers } })
}

export const config = {
  matcher: ['/((?!api|admin|_next|uploads|.*\\..*).*)'],
}
