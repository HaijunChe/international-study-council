import { guard, ok, readJson } from '@/lib/kernel/api'
import { getSettings, saveSettings } from '@/lib/kernel/content'

export async function GET() {
  const g = await guard()
  if ('response' in g) return g.response
  return ok({ settings: await getSettings() })
}

export async function PUT(request: Request) {
  const g = await guard()
  if ('response' in g) return g.response
  const body = await readJson<Record<string, any>>(request)
  await saveSettings(body, g.user.email)
  return ok({ settings: await getSettings() })
}
