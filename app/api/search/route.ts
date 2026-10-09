import { ok } from '@/lib/kernel/api'
import { searchSite } from '@/lib/kernel/content'
import '@/lib/kernel/collections'

/** Public search endpoint. No auth — it only reads published content. */
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get('q') || ''
  const hits = await searchSite(query)
  return ok({ query, count: hits.length, hits })
}
