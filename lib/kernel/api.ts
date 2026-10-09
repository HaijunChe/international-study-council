import { NextResponse } from 'next/server'
import { currentUser, type SessionUser } from './auth'

export function ok(data: unknown = { ok: true }) {
  return NextResponse.json(data)
}

export function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

/** Wrap a route handler so it only runs for a signed-in user. */
export async function guard(): Promise<{ user: SessionUser } | { response: NextResponse }> {
  const user = await currentUser()
  if (!user) return { response: NextResponse.json({ error: 'Not signed in' }, { status: 401 }) }
  return { user }
}

export async function readJson<T = any>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T
  } catch {
    return {} as T
  }
}
