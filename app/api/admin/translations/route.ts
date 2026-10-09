import { bad, guard, ok, readJson } from '@/lib/kernel/api'
import { saveTranslations } from '@/lib/kernel/content'
import { LOCALES } from '@/lib/kernel/dictionary'

export async function PUT(request: Request) {
  const g = await guard()
  if ('response' in g) return g.response

  const body = await readJson<{ locale?: string; entries?: Record<string, string> }>(request)
  const locale = String(body.locale || '')
  if (!LOCALES.some((item) => item.code === locale)) return bad(`Unknown language "${locale}"`)
  if (!body.entries || typeof body.entries !== 'object') return bad('entries is required')

  await saveTranslations(locale, body.entries, g.user.email)
  return ok()
}
