import { authenticate, startSession } from '@/lib/kernel/auth'
import { bad, ok, readJson } from '@/lib/kernel/api'

export async function POST(request: Request) {
  const { email, password } = await readJson<{ email?: string; password?: string }>(request)
  if (!email || !password) return bad('Email and password are required')

  const user = await authenticate(email, password)
  if (!user) return bad('Those details do not match an account', 401)

  await startSession(user)
  return ok({ user })
}
