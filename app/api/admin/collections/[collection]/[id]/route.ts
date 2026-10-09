import { bad, guard, ok, readJson } from '@/lib/kernel/api'
import { deleteEntry, getEntry, saveEntry } from '@/lib/kernel/content'

export async function GET(_request: Request, { params }: { params: Promise<{ collection: string; id: string }> }) {
  const g = await guard()
  if ('response' in g) return g.response
  const { collection, id } = await params
  const entry = await getEntry(collection, id)
  if (!entry) return bad('Entry not found', 404)
  return ok({ entry })
}

export async function PUT(request: Request, { params }: { params: Promise<{ collection: string; id: string }> }) {
  const g = await guard()
  if ('response' in g) return g.response
  const { collection, id } = await params
  const body = await readJson<Record<string, any>>(request)
  const entry = await saveEntry(collection, id, body)
  if (!entry) return bad('Entry not found', 404)
  return ok({ entry })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ collection: string; id: string }> }) {
  const g = await guard()
  if ('response' in g) return g.response
  const { collection, id } = await params
  await deleteEntry(collection, id)
  return ok()
}
