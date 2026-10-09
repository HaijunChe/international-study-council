import { bad, guard, ok, readJson } from '@/lib/kernel/api'
import { createBlock, listBlocks, reorderBlocks } from '@/lib/kernel/content'
import { getBlock as getBlockDef, allBlocks } from '@/lib/kernel/types'
import '@/lib/kernel/blocks'

export async function GET(request: Request) {
  const g = await guard()
  if ('response' in g) return g.response

  const pageId = Number(new URL(request.url).searchParams.get('page_id') || 0)
  if (!pageId) return bad('page_id is required')
  return ok({ blocks: await listBlocks(pageId) })
}

export async function POST(request: Request) {
  const g = await guard()
  if ('response' in g) return g.response

  const body = await readJson<{ page_id?: number; type?: string; after?: string }>(request)
  if (!body.page_id || !body.type) return bad('page_id and type are required')
  if (!getBlockDef(body.type)) {
    return bad(`Unknown block type "${body.type}". Known types: ${allBlocks().map((b) => b.type).join(', ')}`)
  }

  const block = await createBlock(Number(body.page_id), body.type)
  return ok({ block })
}

export async function PATCH(request: Request) {
  const g = await guard()
  if ('response' in g) return g.response

  const body = await readJson<{ page_id?: number; order?: string[] }>(request)
  if (!body.page_id || !Array.isArray(body.order)) return bad('page_id and order are required')
  await reorderBlocks(Number(body.page_id), body.order)
  return ok()
}
