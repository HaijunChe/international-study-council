/** Kernel · tiny helpers: ids, slugs, dates. */

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'

export function id(prefix = ''): string {
  const bytes = new Uint8Array(10)
  globalThis.crypto.getRandomValues(bytes)
  let out = ''
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length]
  return prefix ? `${prefix}_${out}` : out
}

export function slugify(input: string): string {
  return String(input || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    // Apostrophes and quotes are dropped, not turned into hyphens, so
    // "Taylor's University" becomes "taylors-university".
    .replace(/['’‘"“”`]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export function asList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v)).filter(Boolean)
  if (typeof value === 'string') {
    return value
      .split(/\r?\n|,/)
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return []
}

export function asArray<T = any>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

export function formatDate(value: unknown, opts: Intl.DateTimeFormatOptions = {}): string {
  if (!value) return ''
  const d = new Date(String(value))
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', ...opts })
}

/** Days until a date. Negative when the date has passed. */
export function daysUntil(value: unknown): number | null {
  if (!value) return null
  const d = new Date(String(value))
  if (Number.isNaN(d.getTime())) return null
  return Math.ceil((d.getTime() - Date.now()) / 86_400_000)
}

export function money(amount: unknown, currency = 'USD'): string {
  if (amount === null || amount === undefined || amount === '') return ''
  const n = Number(String(amount).replace(/[^0-9.]/g, ''))
  if (!Number.isFinite(n)) return String(amount)
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      currencyDisplay: 'code',
      maximumFractionDigits: 0,
    }).format(n)
  } catch {
    return `${currency} ${n.toLocaleString('en-US')}`
  }
}
