/**
 * Kernel · renderLoop
 * ---------------------------------------------------------------------------
 * The single rendering path of the whole site.
 *
 *   blocks (ordered, enabled) → localise → registry lookup → renderer → HTML
 *
 * Every page on the site is produced by this function. If you want to know how
 * something is drawn, read the block's renderer. There is nowhere else.
 */

import type { ReactNode } from 'react'
import { getPage, listBlocks, listEntries, getSettings } from './content'
import { getDict, makeI18n, localizeBlockData, localizeEntry, type Dict } from './i18n'
import {
  allBlocks,
  getBlock,
  type Block,
  type BlockCatalogItem,
  type RenderCtx,
  type SiteSettings,
} from './types'

// Side-effect import: populates the block registry.
import './blocks'

export function blockCatalog(): BlockCatalogItem[] {
  return allBlocks().map((def) => ({
    type: def.type,
    label: def.label,
    group: def.group,
    hint: def.hint,
    fields: def.fields,
    defaults: def.initial(),
  }))
}

export function makeCtx(
  settings: SiteSettings,
  dict: Dict,
  search: Record<string, string> = {},
  path = '/',
): RenderCtx {
  return {
    settings,
    i18n: makeI18n(dict.locale, dict),
    search,
    path,
    get: async (collection, query) => {
      const rows = await listEntries(collection, query)
      return rows.map((entry) => localizeEntry(entry, dict))
    },
  }
}

export async function renderLoop(blocks: Block[], ctx: RenderCtx): Promise<ReactNode[]> {
  const output: ReactNode[] = []

  for (const block of blocks) {
    if (!block.enabled) continue

    const def = getBlock(block.type)
    if (!def) continue

    const node = await def.render({ data: block.data || {}, ctx })
    if (node === null || node === undefined || node === false) continue

    output.push(
      <div className="blk" data-block={block.type} data-block-id={block.id} key={block.id}>
        {node}
      </div>,
    )
  }

  return output
}

/** Convenience used by the public pages: load a page by slug and render it. */
export async function renderPage(slug: string, search: Record<string, string> = {}, locale = 'en') {
  const [page, settings, dict] = await Promise.all([getPage(slug), getSettings(), getDict(locale)])
  if (!page) return null

  const raw = await listBlocks(page.id)
  const blocks = raw.map((block) => ({ ...block, data: localizeBlockData(block.data || {}, block.id, dict) }))
  const ctx = makeCtx(settings, dict, search, `/${slug}`)

  return { page, settings, dict, i18n: ctx.i18n, content: await renderLoop(blocks, ctx) }
}

/** Preview a single block with arbitrary data — used by the admin editor. */
export async function renderBlockPreview(type: string, data: Record<string, any>, settings: SiteSettings) {
  const def = getBlock(type)
  if (!def) return null
  const dict = await getDict('en')
  return def.render({ data, ctx: makeCtx(settings, dict, {}, '/preview') })
}
