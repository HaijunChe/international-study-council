/**
 * Kernel · auth
 * ---------------------------------------------------------------------------
 * No auth library. scrypt for password hashing, HMAC-SHA256 for session
 * tokens, HttpOnly cookie for transport. Zero dependencies.
 */

import crypto from 'node:crypto'
import { cookies } from 'next/headers'
import { one, query } from './db'

const COOKIE = 'isc_session'
const MAX_AGE = 60 * 60 * 24 * 30 // 30 days

function secret(): string {
  return process.env.AUTH_SECRET || 'isc-development-secret-do-not-use-in-production'
}

/* ---------------------------------- hash --------------------------------- */

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `scrypt$${salt}$${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = String(stored || '').split('$')
  if (scheme !== 'scrypt' || !salt || !hash) return false
  const candidate = crypto.scryptSync(password, salt, 64)
  const expected = Buffer.from(hash, 'hex')
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected)
}

/* --------------------------------- tokens -------------------------------- */

const b64 = (input: Buffer | string) => Buffer.from(input).toString('base64url')

function sign(payload: object): string {
  const body = b64(JSON.stringify(payload))
  const mac = crypto.createHmac('sha256', secret()).update(body).digest('base64url')
  return `${body}.${mac}`
}

function unsign<T = any>(token: string): T | null {
  const [body, mac] = String(token || '').split('.')
  if (!body || !mac) return null
  const expected = crypto.createHmac('sha256', secret()).update(body).digest('base64url')
  const a = Buffer.from(mac)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString())
    if (parsed.exp && Date.now() > parsed.exp) return null
    return parsed as T
  } catch {
    return null
  }
}

export type SessionUser = { id: number; email: string; name: string; role: string }

/* -------------------------------- accounts ------------------------------- */

export async function authenticate(email: string, password: string): Promise<SessionUser | null> {
  const user = await one(
    `select id, email, name, role, password_hash from users where lower(email) = lower($1)`,
    [String(email || '').trim()],
  )
  if (!user) return null
  if (!verifyPassword(password, user.password_hash)) return null
  return { id: user.id, email: user.email, name: user.name, role: user.role }
}

export async function listUsers(): Promise<SessionUser[]> {
  return query<SessionUser>(`select id, email, name, role from users order by id`)
}

export async function createUser(email: string, password: string, name: string, role = 'editor') {
  const { id } = await import('./ids')
  void id
  const res = await query(
    `insert into users (email, password_hash, name, role) values ($1,$2,$3,$4)
     on conflict (email) do update set password_hash = excluded.password_hash, name = excluded.name
     returning id, email, name, role`,
    [email.toLowerCase(), hashPassword(password), name, role],
  )
  return res[0]
}

/* -------------------------------- sessions ------------------------------- */

export async function startSession(user: SessionUser): Promise<void> {
  const token = sign({ uid: user.id, email: user.email, exp: Date.now() + MAX_AGE * 1000 })
  const jar = await cookies()
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  })
}

export async function endSession(): Promise<void> {
  const jar = await cookies()
  jar.delete(COOKIE)
}

export async function currentUser(): Promise<SessionUser | null> {
  const jar = await cookies()
  const payload = unsign<{ uid: number }>(jar.get(COOKIE)?.value || '')
  if (!payload?.uid) return null
  const user = await one<SessionUser>(
    `select id, email, name, role from users where id = $1`,
    [payload.uid],
  )
  return user
}

/** Guard for route handlers. Returns the user or null (caller returns 401). */
export async function requireUser(): Promise<SessionUser | null> {
  return currentUser()
}
