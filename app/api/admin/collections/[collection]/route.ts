import { bad, guard, ok, readJson } from '@/lib/kernel/api'
import { createEntry, listEntries } from '@/lib/kernel/content'
import { getCollection } from '@/lib/kernel/types'
import '@/lib/kernel/collections'

export async function GET(request: Request, { params }: { params: Promise<{ collection: string }> }) {
  const g = await guard()
  if ('response' in g) return g.response
  const { collection } = await params
  const limit = Number(new URL(request.url).searchParams.get('limit') || 100)
  return ok({ entries: await listEntries(collection, { limit }) })
}

export async function POST(request: Request, { params }: { params: Promise<{ collection: string }> }) {
  const g = await guard()
  if ('response' in g) return g.response
  const { collection } = await params
  if (!getCollection(collection)) return bad(`Unknown collection "${collection}"`)
  const body = await readJson<Record<string, any>>(request)
  const entry = await createEntry(collection, body)
  return ok({ entry })
}
