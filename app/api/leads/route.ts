import { bad, ok, readJson } from '@/lib/kernel/api'
import { createLead } from '@/lib/kernel/content'

/** Public endpoint — the enquiry form on the site posts here. */
export async function POST(request: Request) {
  const body = await readJson<Record<string, any>>(request)

  const name = String(body.name || '').trim()
  const email = String(body.email || '').trim()
  if (!name) return bad('Please tell us your name')
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad('Please enter a valid email address')

  // Honeypot: bots fill hidden fields.
  if (String(body.website || '').trim()) return ok()

  const leadId = await createLead(body)
  return ok({ id: leadId })
}
