import { bad, guard, ok, readJson } from '@/lib/kernel/api'
import { deleteBlock, getBlock, saveBlock } from '@/lib/kernel/content'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard()
  if ('response' in g) return g.response
  const { id } = await params
  const block = await getBlock(id)
  if (!block) return bad('Block not found', 404)
  return ok({ block })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard()
  if ('response' in g) return g.response
  const { id } = await params
  const body = await readJson<{ data?: Record<string, any>; enabled?: boolean; position?: number }>(request)
  const block = await saveBlock(id, body, g.user.email)
  if (!block) return bad('Block not found', 404)
  return ok({ block })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard()
  if ('response' in g) return g.response
  const { id } = await params
  await deleteBlock(id, g.user.email)
  return ok()
}
