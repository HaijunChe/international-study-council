import { bad, guard, ok, readJson } from '@/lib/kernel/api'
import { deletePage, savePage } from '@/lib/kernel/content'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard()
  if ('response' in g) return g.response
  const { id } = await params
  const body = await readJson<Record<string, any>>(request)
  const page = await savePage(Number(id), body)
  if (!page) return bad('Page not found', 404)
  return ok({ page })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard()
  if ('response' in g) return g.response
  const { id } = await params
  await deletePage(Number(id))
  return ok()
}
