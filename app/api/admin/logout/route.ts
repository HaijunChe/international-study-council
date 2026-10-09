import { endSession } from '@/lib/kernel/auth'
import { ok } from '@/lib/kernel/api'

export async function POST() {
  await endSession()
  return ok()
}
