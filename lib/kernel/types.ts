/**
 * Kernel · registries
 * ---------------------------------------------------------------------------
 * Two declarative registries hold the entire surface area of the CMS:
 *
 *   • BLOCKS      — page sections the owner drags onto a page
 *   • COLLECTIONS — structured content types (universities, scholarships, …)
 *
 * Adding either one is a registration, never a migration. The admin UI is
 * generated from these definitions, so a new block or collection immediately
 * gets a working editor.
 */

import type { ReactNode } from 'react'

/* --------------------------------- fields -------------------------------- */

export type FieldType =
  | 'text'
  | 'textarea'
  | 'richtext'
  | 'number'
  | 'date'
  | 'select'
  | 'list'
  | 'checkboxes'
  | 'boolean'
  | 'image'
  | 'url'
  | 'color'
  | 'heading'
  | 'repeater'

export type FieldDef = {
  key: string
  label: string
  type: FieldType
  placeholder?: string
  help?: string
  required?: boolean
  /** select / checkboxes options */
  options?: string[]
  /** repeater sub-fields */
  fields?: FieldDef[]
  /** label used when collapsing a repeater row */
  itemLabel?: string
  /** 1 = half width, 2 = full width (form layout) */
  span?: 1 | 2
  /** step number for multi-step public forms */
  step?: number
  default?: any
}

/* ---------------------------------- data --------------------------------- */

export type Entry = {
  id: string
  collection: string
  slug: string | null
  title: string
  status: string
  position: number
  data: Record<string, any>
  created_at?: string
  updated_at?: string
}

export type Block = {
  id: string
  page_id: number
  type: string
  position: number
  enabled: boolean
  data: Record<string, any>
}

export type SiteSettings = {
  identity: {
    site_name: string
    site_short: string
    tagline: string
    logo_text: string
    description: string
  }
  contact: {
    email: string
    phone: string
    whatsapp: string
    whatsapp_message: string
    address: string
    hours: string
  }
  social: { linkedin: string; facebook: string; instagram: string }
  theme: { accent: string; accent_ink: string }
  seo: { default_title: string; default_description: string }
  languages: { enabled: string[]; default: string }
}

export type EntryQuery = {
  limit?: number
  featured?: boolean
  status?: string
  where?: Record<string, any>
  order?: 'position' | 'title' | 'recent' | 'deadline'
}

/** Everything a component needs to render in the visitor's language. */
export type I18n = {
  locale: string
  dir: 'ltr' | 'rtl'
  /** Translate an interface key. */
  t: (key: string, fallback?: string) => string
  /** Prefix an internal path with the active locale. */
  href: (path: string) => string
}

export type RenderCtx = {
  settings: SiteSettings
  /** Read records from a collection. Data blocks use this instead of copying content. */
  get: (collection: string, query?: EntryQuery) => Promise<Entry[]>
  /** Current URL query string, so filter blocks can render server-side. */
  search: Record<string, string>
  /** Path of the page being rendered, for form redirects and analytics. */
  path: string
  i18n: I18n
}

/* --------------------------------- blocks -------------------------------- */

export type BlockDef = {
  type: string
  label: string
  group: 'layout' | 'content' | 'data' | 'convert'
  hint: string
  fields: FieldDef[]
  /** Fallback data used when the block is first dropped onto a page. */
  initial: () => Record<string, any>
  render: (props: { data: Record<string, any>; ctx: RenderCtx }) => ReactNode | Promise<ReactNode>
}

const blockRegistry = new Map<string, BlockDef>()

export function registerBlock(def: BlockDef): BlockDef {
  blockRegistry.set(def.type, def)
  return def
}

export function getBlock(type: string): BlockDef | undefined {
  return blockRegistry.get(type)
}

export function allBlocks(): BlockDef[] {
  return [...blockRegistry.values()]
}

/** Serializable description of every block — what the admin editor consumes. */
export type BlockCatalogItem = {
  type: string
  label: string
  group: 'layout' | 'content' | 'data' | 'convert'
  hint: string
  fields: FieldDef[]
  defaults: Record<string, any>
}

/* ------------------------------- collections ----------------------------- */

export type CollectionDef = {
  name: string
  label: string
  singular: string
  hint: string
  /** field key used as the record title */
  titleKey: string
  /** field key the URL slug is derived from (omit for slugless collections) */
  slugKey?: string
  /** public URL for a record, if it has a detail page */
  publicPath?: (slug: string) => string
  /** field keys shown as columns in the admin list */
  columns: string[]
  fields: FieldDef[]
  initial: () => Record<string, any>
}

const collectionRegistry = new Map<string, CollectionDef>()

export function registerCollection(def: CollectionDef): CollectionDef {
  collectionRegistry.set(def.name, def)
  return def
}

export function getCollection(name: string): CollectionDef | undefined {
  return collectionRegistry.get(name)
}

export function allCollections(): CollectionDef[] {
  return [...collectionRegistry.values()]
}

/* --------------------------------- helpers ------------------------------- */

/** Resolve a link field. `whatsapp` and `email` are magic values. */
export function resolveHref(href: unknown, settings: SiteSettings): string {
  const value = String(href ?? '').trim()
  if (!value) return ''
  if (value === 'whatsapp') {
    const number = String(settings.contact.whatsapp || '').replace(/[^\d]/g, '')
    if (!number) return '/contact'
    const text = encodeURIComponent(settings.contact.whatsapp_message || '')
    return `https://wa.me/${number}${text ? `?text=${text}` : ''}`
  }
  if (value === 'email') return `mailto:${settings.contact.email}`
  if (value === 'phone') return `tel:${String(settings.contact.phone || '').replace(/\s/g, '')}`
  return value
}

export function isExternal(href: string): boolean {
  return /^https?:\/\//i.test(href)
}
