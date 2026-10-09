import { bad, guard, ok, readJson } from '@/lib/kernel/api'
import { deleteLead, updateLead } from '@/lib/kernel/content'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard()
  if ('response' in g) return g.response
  const { id } = await params
  const body = await readJson<{ status?: string; notes?: string }>(request)
  await updateLead(id, body)
  return ok()
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard()
  if ('response' in g) return g.response
  const { id } = await params
  await deleteLead(id)
  return ok()
}

export async function GET() {
  return bad('Method not allowed', 405)
}
