/**
 * Kernel · the four APIs
 * ---------------------------------------------------------------------------
 * Every write in the product goes through one of these. Nothing else touches
 * the tables, which is what keeps the editor and the renderer in sync.
 *
 *   listBlocks · getBlock · saveBlock · deleteBlock
 *
 * On top of them sit three thin conveniences the admin needs: pages, entries
 * (structured content) and settings.
 */

import { one, query } from './db'
import { id, slugify } from './ids'
import { plain } from './md'
import { getBlock as getBlockDef, getCollection, type Block, type Entry, type EntryQuery, type SiteSettings } from './types'

export type Page = {
  id: number
  slug: string
  title: string
  seo_title: string
  seo_description: string
  status: string
  show_in_nav: boolean
  nav_label: string
  nav_order: number
  updated_at?: string
}

export type Lead = {
  id: string
  name: string
  email: string
  phone: string
  whatsapp: string
  country: string
  level: string
  message: string
  source: string
  status: string
  notes: string
  /** every answer the form collected, including custom fields */
  data: Record<string, any>
  created_at: string
}

/* ------------------------------ block APIs ------------------------------- */

export async function listBlocks(pageId: number, opts: { includeDisabled?: boolean } = {}): Promise<Block[]> {
  const rows = await query<Block>(
    `select id, page_id, type, position, enabled, data
       from blocks
      where page_id = $1 ${opts.includeDisabled === false ? 'and enabled = true' : ''}
      order by position asc, created_at asc`,
    [pageId],
  )
  return rows.map((r) => ({ ...r, data: (r.data || {}) as Record<string, any> }))
}

export async function getBlock(blockId: string): Promise<Block | null> {
  return one<Block>(
    `select id, page_id, type, position, enabled, data from blocks where id = $1`,
    [blockId],
  )
}

export async function createBlock(pageId: number, type: string, data?: Record<string, any>): Promise<Block> {
  const def = getBlockDef(type)
  if (!def) throw new Error(`Unknown block type: ${type}`)
  const next = await one<{ next: number }>(
    `select coalesce(max(position), -1) + 1 as next from blocks where page_id = $1`,
    [pageId],
  )
  const blockId = id('blk')
  const payload = data ?? def.initial()
  const rows = await query<Block>(
    `insert into blocks (id, page_id, type, position, enabled, data)
     values ($1,$2,$3,$4,true,$5::jsonb)
     returning id, page_id, type, position, enabled, data`,
    [blockId, pageId, type, Number(next?.next ?? 0), JSON.stringify(payload)],
  )
  return rows[0]
}

/** Merge a patch into the block. Keeps a revision so edits can be rolled back. */
export async function saveBlock(
  blockId: string,
  patch: { data?: Record<string, any>; enabled?: boolean; position?: number },
  actor = '',
): Promise<Block | null> {
  const current = await getBlock(blockId)
  if (!current) return null

  const merged = patch.data ? { ...(current.data || {}), ...patch.data } : current.data || {}

  if (patch.data) {
    await query(`insert into revisions (block_id, data, actor) values ($1,$2::jsonb,$3)`, [
      blockId,
      JSON.stringify(current.data || {}),
      actor,
    ])
  }

  const rows = await query<Block>(
    `update blocks
        set data = $2::jsonb,
            enabled = coalesce($3, enabled),
            position = coalesce($4, position),
            updated_at = now()
      where id = $1
      returning id, page_id, type, position, enabled, data`,
    [blockId, JSON.stringify(merged), patch.enabled ?? null, patch.position ?? null],
  )

  await query(`insert into audit_logs (actor, action, target) values ($1,'block.save',$2)`, [actor, blockId])
  return rows[0] ?? null
}

export async function deleteBlock(blockId: string, actor = ''): Promise<void> {
  await query(`delete from blocks where id = $1`, [blockId])
  await query(`insert into audit_logs (actor, action, target) values ($1,'block.delete',$2)`, [actor, blockId])
}

export async function reorderBlocks(pageId: number, orderedIds: string[]): Promise<void> {
  let position = 0
  for (const blockId of orderedIds) {
    await query(`update blocks set position = $2, updated_at = now() where id = $1 and page_id = $3`, [
      blockId,
      position++,
      pageId,
    ])
  }
}

export async function listRevisions(blockId: string, limit = 20) {
  return query(`select id, actor, created_at, data from revisions where block_id = $1 order by id desc limit $2`, [
    blockId,
    limit,
  ])
}

export async function restoreRevision(revisionId: number, actor = ''): Promise<Block | null> {
  const rev = await one<{ block_id: string; data: Record<string, any> }>(
    `select block_id, data from revisions where id = $1`,
    [revisionId],
  )
  if (!rev) return null
  return saveBlock(rev.block_id, { data: rev.data }, actor)
}

/* ------------------------------- page APIs ------------------------------- */

export async function getPage(slug: string): Promise<Page | null> {
  return one<Page>(`select * from pages where slug = $1`, [slug])
}

export async function listPages(): Promise<Page[]> {
  return query<Page>(`select * from pages order by nav_order asc, id asc`)
}

export async function navPages(): Promise<Page[]> {
  return query<Page>(
    `select * from pages where show_in_nav = true and status = 'published' order by nav_order asc, id asc`,
  )
}

export async function createPage(input: Partial<Page>): Promise<Page> {
  const title = String(input.title || 'Untitled')
  const slug = slugify(input.slug || title) || id('page')
  const rows = await query<Page>(
    `insert into pages (slug, title, seo_title, seo_description, status, show_in_nav, nav_label, nav_order)
     values ($1,$2,$3,$4,$5,$6,$7,$8)
     on conflict (slug) do update set title = excluded.title
     returning *`,
    [
      slug,
      title,
      input.seo_title || title,
      input.seo_description || '',
      input.status || 'published',
      input.show_in_nav ?? false,
      input.nav_label || title,
      input.nav_order ?? 99,
    ],
  )
  return rows[0]
}

export async function savePage(pageId: number, patch: Partial<Page>): Promise<Page | null> {
  const rows = await query<Page>(
    `update pages set
        title = coalesce($2, title),
        slug = coalesce($3, slug),
        seo_title = coalesce($4, seo_title),
        seo_description = coalesce($5, seo_description),
        status = coalesce($6, status),
        show_in_nav = coalesce($7, show_in_nav),
        nav_label = coalesce($8, nav_label),
        nav_order = coalesce($9, nav_order),
        updated_at = now()
      where id = $1
      returning *`,
    [
      pageId,
      patch.title ?? null,
      patch.slug ?? null,
      patch.seo_title ?? null,
      patch.seo_description ?? null,
      patch.status ?? null,
      patch.show_in_nav ?? null,
      patch.nav_label ?? null,
      patch.nav_order ?? null,
    ],
  )
  return rows[0] ?? null
}

export async function deletePage(pageId: number): Promise<void> {
  await query(`delete from pages where id = $1`, [pageId])
}

/* ----------------------------- entry APIs -------------------------------- */

function orderClause(order: EntryQuery['order']): string {
  switch (order) {
    case 'title':
      return 'title asc'
    case 'recent':
      return `coalesce(nullif(data->>'published_at',''), created_at::text) desc`
    case 'deadline':
      // Only cast values that really look like a date — owners sometimes type
      // "Anytime" or "Rolling" into a date field.
      return `(case when data->>'deadline' ~ '^\\d{4}-\\d{2}-\\d{2}' then (data->>'deadline')::date end) asc nulls last`
    default:
      return 'position asc, title asc'
  }
}

export async function listEntries(collection: string, opts: EntryQuery = {}): Promise<Entry[]> {
  const params: any[] = [collection]
  const where: string[] = ['collection = $1']

  if (opts.status) {
    params.push(opts.status)
    where.push(`status = $${params.length}`)
  }
  if (opts.featured) {
    where.push(`(data->>'featured')::boolean is true`)
  }
  for (const [key, value] of Object.entries(opts.where || {})) {
    if (value === undefined || value === null || value === '') continue
    if (Array.isArray(value)) {
      params.push(JSON.stringify(value))
      where.push(`(data->'${key}') ?| array(select jsonb_array_elements_text($${params.length}::jsonb))`)
    } else {
      params.push(String(value))
      where.push(`data->>'${key}' = $${params.length}`)
    }
  }

  const limit = Math.min(Math.max(Number(opts.limit ?? 50), 1), 200)
  const rows = await query<Entry>(
    `select id, collection, slug, title, status, position, data, created_at, updated_at
       from entries
      where ${where.join(' and ')}
      order by ${orderClause(opts.order)}
      limit ${limit}`,
    params,
  )
  return rows.map((r) => ({ ...r, data: (r.data || {}) as Record<string, any> }))
}

export async function getEntry(collection: string, idOrSlug: string): Promise<Entry | null> {
  return one<Entry>(
    `select id, collection, slug, title, status, position, data, created_at, updated_at
       from entries where collection = $1 and (id = $2 or slug = $2) limit 1`,
    [collection, idOrSlug],
  )
}

export async function createEntry(collection: string, data: Record<string, any>): Promise<Entry> {
  const def = getCollection(collection)
  if (!def) throw new Error(`Unknown collection: ${collection}`)
  const title = String(data[def.titleKey] ?? data.title ?? 'Untitled')
  const slug = def.slugKey ? slugify(String(data[def.slugKey] ?? title)) : null
  const next = await one<{ next: number }>(
    `select coalesce(max(position), -1) + 1 as next from entries where collection = $1`,
    [collection],
  )
  const rows = await query<Entry>(
    `insert into entries (id, collection, slug, title, status, position, data)
     values ($1,$2,$3,$4,$5,$6,$7::jsonb)
     returning id, collection, slug, title, status, position, data`,
    [
      id('ent'),
      collection,
      slug,
      title,
      data.status || 'published',
      Number(next?.next ?? 0),
      JSON.stringify(data),
    ],
  )
  return rows[0]
}

export async function saveEntry(
  collection: string,
  entryId: string,
  data: Record<string, any>,
): Promise<Entry | null> {
  const def = getCollection(collection)
  const title = String(data[def?.titleKey || 'title'] ?? data.title ?? 'Untitled')

  // Slugs are assigned once and then frozen. Editing a name must never break a
  // URL that has already been shared or indexed.
  const existing = await getEntry(collection, entryId)
  if (!existing) return null
  const slug = existing.slug || (def?.slugKey ? slugify(String(data[def.slugKey] ?? title)) : null)

  const rows = await query<Entry>(
    `update entries
        set data = $3::jsonb, title = $4, slug = $5, status = coalesce($6, status), updated_at = now()
      where id = $1 and collection = $2
      returning id, collection, slug, title, status, position, data`,
    [entryId, collection, JSON.stringify(data), title, slug, data.status ?? null],
  )
  return rows[0] ?? null
}

export async function deleteEntry(collection: string, entryId: string): Promise<void> {
  await query(`delete from entries where id = $1 and collection = $2`, [entryId, collection])
}

export async function countEntries(): Promise<Record<string, number>> {
  const rows = await query<{ collection: string; n: number }>(
    `select collection, count(*)::int as n from entries group by collection`,
  )
  return Object.fromEntries(rows.map((r) => [r.collection, Number(r.n)]))
}

/* ------------------------------ settings --------------------------------- */

const DEFAULT_SETTINGS: SiteSettings = {
  identity: {
    site_name: 'International Study Council',
    site_short: 'ISC',
    tagline: 'Study abroad, made clear.',
    logo_text: 'ISC',
    description: '',
  },
  contact: { email: '', phone: '', whatsapp: '', whatsapp_message: '', address: '', hours: '' },
  social: { linkedin: '', facebook: '', instagram: '' },
  theme: { accent: '#1B48D6', accent_ink: '#0F2E8C' },
  seo: { default_title: '', default_description: '' },
  languages: { enabled: ['en', 'bn', 'es', 'fr', 'ar', 'ru'], default: 'en' },
}

export async function getSettings(): Promise<SiteSettings> {
  const rows = await query<{ key: string; value: any }>(`select key, value from settings`)
  const merged: any = structuredClone(DEFAULT_SETTINGS)
  for (const row of rows) {
    merged[row.key] = { ...(merged[row.key] || {}), ...(row.value || {}) }
  }
  return merged as SiteSettings
}

export async function saveSettings(patch: Record<string, any>, actor = ''): Promise<void> {
  for (const [key, value] of Object.entries(patch)) {
    await query(
      `insert into settings (key, value) values ($1,$2::jsonb)
       on conflict (key) do update set value = settings.value || excluded.value`,
      [key, JSON.stringify(value)],
    )
  }
  await query(`insert into audit_logs (actor, action, target) values ($1,'settings.save','settings')`, [actor])
}

/* -------------------------------- leads ---------------------------------- */

/** Known columns are promoted so lists can be filtered; everything else is kept in `data`. */
const LEAD_COLUMNS = ['name', 'email', 'phone', 'whatsapp', 'country', 'level', 'message', 'source'] as const

function clip(value: unknown, max: number): string {
  return String(value ?? '').slice(0, max)
}

export async function createLead(payload: Record<string, any>): Promise<string> {
  const leadId = id('lead')

  // Normalise: accept both "services" (application form) and "interest" (contact form).
  const full: Record<string, any> = {}
  for (const [key, value] of Object.entries(payload)) {
    if (key === 'website') continue // honeypot
    full[key] = Array.isArray(value) ? value.map((item) => clip(item, 200)) : clip(value, 4000)
  }

  const column = (key: (typeof LEAD_COLUMNS)[number], max: number) => clip(payload[key], max)

  await query(
    `insert into leads (id, name, email, phone, whatsapp, country, level, message, source, data)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)`,
    [
      leadId,
      column('name', 200),
      column('email', 200),
      column('phone', 60),
      column('whatsapp', 60),
      column('country', 100),
      column('level', 100),
      column('message', 4000),
      column('source', 200),
      JSON.stringify(full),
    ],
  )
  return leadId
}

export async function listLeads(status?: string): Promise<Lead[]> {
  if (status && status !== 'all') {
    return query<Lead>(`select * from leads where status = $1 order by created_at desc limit 500`, [status])
  }
  return query<Lead>(`select * from leads order by created_at desc limit 500`)
}

export async function updateLead(leadId: string, patch: { status?: string; notes?: string }): Promise<void> {
  await query(`update leads set status = coalesce($2, status), notes = coalesce($3, notes) where id = $1`, [
    leadId,
    patch.status ?? null,
    patch.notes ?? null,
  ])
}

export async function deleteLead(leadId: string): Promise<void> {
  await query(`delete from leads where id = $1`, [leadId])
}

export async function dashboardStats() {
  const [leads, newLeads, pages, blocks, entries] = await Promise.all([
    one<{ n: number }>(`select count(*)::int as n from leads`),
    one<{ n: number }>(`select count(*)::int as n from leads where status = 'new'`),
    one<{ n: number }>(`select count(*)::int as n from pages`),
    one<{ n: number }>(`select count(*)::int as n from blocks`),
    one<{ n: number }>(`select count(*)::int as n from entries`),
  ])
  const recent = await query<{ actor: string; action: string; target: string; created_at: string }>(
    `select actor, action, target, created_at from audit_logs order by id desc limit 8`,
  )
  return {
    leads: Number(leads?.n ?? 0),
    newLeads: Number(newLeads?.n ?? 0),
    pages: Number(pages?.n ?? 0),
    blocks: Number(blocks?.n ?? 0),
    entries: Number(entries?.n ?? 0),
    recent,
  }
}

/* ------------------------------ translations ----------------------------- */

export async function getTranslations(locale: string): Promise<Record<string, string>> {
  const rows = await query<{ key: string; value: string }>(
    `select key, value from translations where locale = $1 and value <> ''`,
    [locale],
  )
  return Object.fromEntries(rows.map((row) => [row.key, row.value]))
}

export async function saveTranslations(
  locale: string,
  entries: Record<string, string>,
  actor = '',
): Promise<void> {
  for (const [key, raw] of Object.entries(entries)) {
    const value = String(raw ?? '')
    if (!value.trim()) {
      await query(`delete from translations where locale = $1 and key = $2`, [locale, key])
      continue
    }
    await query(
      `insert into translations (locale, key, value) values ($1,$2,$3)
       on conflict (locale, key) do update set value = excluded.value, updated_at = now()`,
      [locale, key, value],
    )
  }
  await query(`insert into audit_logs (actor, action, target) values ($1,'translations.save',$2)`, [actor, locale])
}

export async function translationCoverage(): Promise<Record<string, number>> {
  const rows = await query<{ locale: string; n: number }>(
    `select locale, count(*)::int as n from translations where value <> '' group by locale`,
  )
  return Object.fromEntries(rows.map((row) => [row.locale, Number(row.n)]))
}

/** Fields worth offering for translation. Matches the dictionary's content layer. */
const TRANSLATABLE_FIELDS = new Set([
  'title',
  'headline',
  'eyebrow',
  'label',
  'body',
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
  'submit_label',
  'success_title',
  'success_body',
  'footnote',
  'amount',
  'price',
  'duration',
  'living_cost',
  'intakes',
  'outcome',
])

export type TranslatableString = {
  key: string
  source: string
  group: string
  field: string
}

/** Everything on the site that has a translatable string, with its English source. */
export async function translatableContent(): Promise<TranslatableString[]> {
  const out: TranslatableString[] = []

  const pages = await listPages()
  for (const page of pages) {
    const blocks = await listBlocks(page.id)
    for (const block of blocks) {
      for (const [field, value] of Object.entries(block.data || {})) {
        if (typeof value !== 'string' || !value.trim() || !TRANSLATABLE_FIELDS.has(field)) continue
        out.push({
          key: `block.${block.id}.${field}`,
          source: value,
          group: `${page.title} · ${block.type}`,
          field,
        })
      }
    }
  }

  const entries = await query<Entry>(
    `select id, collection, slug, title, status, position, data from entries order by collection, position`,
  )
  for (const entry of entries) {
    out.push({ key: `entry.${entry.id}.title`, source: entry.title, group: entry.collection, field: 'title' })
    for (const [field, value] of Object.entries(entry.data || {})) {
      if (typeof value !== 'string' || !value.trim() || !TRANSLATABLE_FIELDS.has(field)) continue
      out.push({ key: `entry.${entry.id}.${field}`, source: value, group: entry.collection, field })
    }
  }

  return out
}

/* --------------------------------- search -------------------------------- */

export type SearchHit = {
  type: string
  /** collection name or 'page' — drives the icon and the group label */
  kind: string
  title: string
  subtitle: string
  href: string
}

/** Always-available shortcuts, so "apply" or "contact" works before anything is typed. */
const QUICK_LINKS: Array<{ title: string; subtitle: string; href: string; words: string }> = [
  { title: 'Start your application', subtitle: 'Three steps, free assessment', href: '/apply', words: 'apply application start enquiry form contact' },
  { title: 'Build your own plan', subtitle: 'Pick the services you need', href: '/plan', words: 'plan build price cost services choose' },
  { title: 'All services', subtitle: 'Ten services, five stages', href: '/services', words: 'services sop cv ielts visa career funding fees' },
  { title: 'Universities', subtitle: 'Partner institutions', href: '/universities', words: 'universities colleges partners list search' },
  { title: 'Scholarships', subtitle: 'Funding you qualify for', href: '/scholarships', words: 'scholarship funding grant money award' },
  { title: 'Destinations', subtitle: 'Where you can study', href: '/destinations', words: 'countries destinations where abroad map' },
  { title: 'Guides', subtitle: 'How-to articles', href: '/blog', words: 'guides blog articles help how to' },
  { title: 'Contact us', subtitle: 'Talk to an advisor', href: '/contact', words: 'contact email phone whatsapp talk' },
]

/**
 * One query across pages, block copy and every collection. Deliberately simple:
 * a case-insensitive substring match over the text columns plus the JSONB blob,
 * which is plenty for a site this size and needs no index maintenance.
 */
export async function searchSite(term: string, limit = 30): Promise<SearchHit[]> {
  const needle = String(term || '').trim()
  if (needle.length < 2) return []
  const pattern = `%${needle.replace(/[%_]/g, (m) => `\\${m}`)}%`

  const hits: SearchHit[] = []
  const seen = new Set<string>()

  const push = (hit: SearchHit) => {
    const key = `${hit.kind}:${hit.href}`
    if (seen.has(key)) return
    seen.add(key)
    hits.push(hit)
  }

  /* Quick links first — they are the most likely intent for short queries. */
  const lowered = needle.toLowerCase()
  for (const link of QUICK_LINKS) {
    if (link.title.toLowerCase().includes(lowered) || link.words.includes(lowered)) {
      push({ type: 'Go to', kind: 'page', title: link.title, subtitle: link.subtitle, href: link.href })
    }
  }

  /* Pages whose title, SEO copy or block content matches. */
  const pages = await query<{ slug: string; title: string; seo_description: string; block_text: string }>(
    `select p.slug, p.title, p.seo_description,
            coalesce(string_agg(b.data::text, ' '), '') as block_text
       from pages p
       left join blocks b on b.page_id = p.id
      where p.status = 'published'
      group by p.id, p.slug, p.title, p.seo_description
     having p.title ilike $1
         or p.seo_description ilike $1
         or coalesce(string_agg(b.data::text, ' '), '') ilike $1
      limit 8`,
    [pattern],
  )
  for (const page of pages) {
    push({
      type: 'Page',
      kind: 'page',
      title: page.title,
      subtitle: plain(page.seo_description, 90) || `/${page.slug}`,
      href: page.slug === 'home' ? '/' : `/${page.slug}`,
    })
  }

  /* Every collection record. */
  const entries = await query<{ id: string; collection: string; slug: string; title: string; data: Record<string, any> }>(
    `select id, collection, slug, title, data
       from entries
      where status = 'published'
        and (title ilike $1 or data::text ilike $1)
      order by collection, position
      limit ${Math.min(Math.max(limit, 1), 60)}`,
    [pattern],
  )
  for (const entry of entries) {
    const def = getCollection(entry.collection)
    const data = entry.data || {}
    const subtitle =
      plain(data.summary, 90) ||
      plain(data.intro, 90) ||
      plain(data.excerpt, 90) ||
      [data.country, data.provider, data.category].filter(Boolean).join(' · ') ||
      (def?.label ?? entry.collection)
    push({
      type: def?.label || entry.collection,
      kind: entry.collection,
      title: entry.title,
      subtitle,
      href: def?.publicPath && entry.slug ? def.publicPath(entry.slug) : '/universities',
    })
  }

  return hits.slice(0, limit)
}

/* --------------------------------- media --------------------------------- */

export async function listMedia(limit = 60) {
  return query<{ id: string; url: string; filename: string; alt: string; size: number; created_at: string }>(
    `select id, url, filename, alt, size, created_at from media order by created_at desc limit $1`,
    [limit],
  )
}

export async function addMedia(input: { url: string; filename?: string; alt?: string; mime?: string; size?: number }) {
  const mediaId = id('med')
  await query(
    `insert into media (id, url, filename, alt, mime, size) values ($1,$2,$3,$4,$5,$6)`,
    [mediaId, input.url, input.filename || '', input.alt || '', input.mime || '', Number(input.size || 0)],
  )
  return { id: mediaId, url: input.url }
}

export async function deleteMedia(mediaId: string): Promise<void> {
  await query(`delete from media where id = $1`, [mediaId])
}
