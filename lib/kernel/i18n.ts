/**
 * Kernel · i18n
 * ---------------------------------------------------------------------------
 * Two layers of translation:
 *
 *   1. Interface strings — keyed in `dictionary.ts`, overridable per language
 *      from Admin → Languages, stored in the `translations` table.
 *   2. Content strings — block copy and collection records. A translation for
 *      `block.<id>.<field>` or `entry.<id>.<field>` wins over the original.
 *
 * Anything missing falls back to English, so a half-translated site still reads
 * correctly rather than showing blank labels.
 */

import { cache } from 'react'
import { DICTIONARY, DEFAULT_LOCALE, LOCALES, localeMeta, type Locale } from './dictionary'
import type { Block, Entry, I18n } from './types'

export { LOCALES, DEFAULT_LOCALE, localeMeta, isLocale, type Locale, type LocaleMeta } from './dictionary'

export type Dict = {
  locale: Locale
  dir: 'ltr' | 'rtl'
  /** Translate an interface key. */
  t: (key: string, fallback?: string) => string
  /** Look up a content override. */
  c: (key: string) => string | undefined
  /** How many interface keys are still untranslated. */
  missing: number
}

/** Load the merged dictionary for a locale: DB overrides → locale → English. */
export const getDict = cache(async (locale: string): Promise<Dict> => {
  const code: Locale = LOCALES.some((item) => item.code === locale) ? (locale as Locale) : DEFAULT_LOCALE
  const base = DICTIONARY[DEFAULT_LOCALE]
  const own = DICTIONARY[code]

  const { getTranslations } = await import('./content')
  const overrides = await getTranslations(code)

  const raw: Record<string, string> = {}
  for (const key of Object.keys(base)) {
    const value = overrides[key] || own[key] || base[key]
    if (value) raw[key] = value
  }
  for (const [key, value] of Object.entries(overrides)) {
    if (value) raw[key] = value
  }

  const missing = Object.keys(base).filter((key) => !overrides[key] && !own[key]).length

  return {
    locale: code,
    dir: localeMeta(code).dir,
    t: (key, fallback) => raw[key] || fallback || key,
    c: (key) => overrides[key],
    missing,
  }
})

/** Build the translator + link helper a component needs. */
export function makeI18n(locale: string, dict: Dict): I18n {
  return {
    locale,
    dir: dict.dir,
    t: dict.t,
    href: (path: string) => localePath(locale, path),
  }
}

/** Convenience for pages that only need the translator. */
export async function i18nFor(locale: string): Promise<I18n> {
  const dict = await getDict(locale)
  return makeI18n(dict.locale, dict)
}

/** Prefix a path with the locale, leaving English (the default) unprefixed. */
export function localePath(locale: string, path: string): string {
  if (!locale || locale === DEFAULT_LOCALE) return path
  if (/^https?:\/\//i.test(path) || path.startsWith('#') || path.startsWith('mailto:') || path.startsWith('tel:')) {
    return path
  }
  return path === '/' ? `/${locale}` : `/${locale}${path}`
}

/** Strip the locale prefix from a pathname. */
export function stripLocale(pathname: string): { locale: Locale; path: string } {
  const segments = pathname.split('/').filter(Boolean)
  const first = segments[0]
  if (first && LOCALES.some((item) => item.code === first)) {
    return { locale: first as Locale, path: `/${segments.slice(1).join('/')}` }
  }
  return { locale: DEFAULT_LOCALE, path: pathname || '/' }
}

/** Recursively translate the string fields of a block's data. */
export function localizeBlockData(data: Record<string, any>, blockId: string, dict: Dict): Record<string, any> {
  if (dict.locale === DEFAULT_LOCALE) return data
  const out: Record<string, any> = { ...data }
  for (const [field, value] of Object.entries(data)) {
    if (typeof value !== 'string' || !value) continue
    const override = dict.c(`block.${blockId}.${field}`)
    if (override) out[field] = override
  }
  return out
}

/** Translate an entry's title and its top-level string fields. */
export function localizeEntry<T extends Entry>(entry: T, dict: Dict): T {
  if (dict.locale === DEFAULT_LOCALE) return entry
  const title = dict.c(`entry.${entry.id}.title`)
  const data: Record<string, any> = { ...(entry.data || {}) }
  for (const [field, value] of Object.entries(data)) {
    if (typeof value !== 'string' || !value) continue
    const override = dict.c(`entry.${entry.id}.${field}`)
    if (override) data[field] = override
  }
  return { ...entry, title: title || entry.title, data }
}

export function localizeBlocks(blocks: Block[], dict: Dict): Block[] {
  if (dict.locale === DEFAULT_LOCALE) return blocks
  return blocks.map((block) => ({ ...block, data: localizeBlockData(block.data || {}, block.id, dict) }))
}

/** The keys an owner should translate for a given locale, in display order. */
export const TRANSLATABLE_CONTENT_FIELDS = [
  'title',
  'headline',
  'body',
  'eyebrow',
  'label',
  'summary',
  'about',
  'intro',
  'excerpt',
  'eligibility',
  'visa',
  'requirements',
  'primary_label',
  'secondary_label',
  'cta_label',
  'footnote',
  'amount',
  'price',
  'duration',
  'living_cost',
  'intakes',
  'outcome',
] as const
