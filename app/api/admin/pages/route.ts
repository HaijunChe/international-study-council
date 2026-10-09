import { bad, guard, ok, readJson } from '@/lib/kernel/api'
import { createPage, listPages } from '@/lib/kernel/content'

export async function GET() {
  const g = await guard()
  if ('response' in g) return g.response
  return ok({ pages: await listPages() })
}

export async function POST(request: Request) {
  const g = await guard()
  if ('response' in g) return g.response
  const body = await readJson<{ title?: string; slug?: string }>(request)
  if (!body.title) return bad('A page title is required')
  const page = await createPage({ title: body.title, slug: body.slug, show_in_nav: true })
  return ok({ page })
}
