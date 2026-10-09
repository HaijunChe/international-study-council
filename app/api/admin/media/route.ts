import { guard, ok } from '@/lib/kernel/api'
import { listMedia } from '@/lib/kernel/content'

export async function GET() {
  const g = await guard()
  if ('response' in g) return g.response
  return ok({ media: await listMedia(80) })
}
