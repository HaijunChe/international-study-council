/**
 * Deployment health check.
 *
 * Reports which environment variables the running deployment can actually
 * see — as booleans, never as values. Production builds hide server errors,
 * so when a deployment 500s this is the fastest way to tell "the variable is
 * missing" apart from "the variable is present but wrong".
 */

import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const REQUIRED = ['DATABASE_URL', 'AUTH_SECRET'] as const
const OPTIONAL = ['SEED_ADMIN_EMAIL', 'SEED_ADMIN_PASSWORD'] as const

export async function GET() {
  const present = (key: string) => Boolean(process.env[key]?.trim())

  const env: Record<string, boolean> = {}
  for (const key of REQUIRED) env[key] = present(key)
  for (const key of OPTIONAL) env[key] = present(key)

  const missing = REQUIRED.filter((key) => !env[key])

  return NextResponse.json(
    {
      ok: missing.length === 0,
      env,
      missing,
      runtime: {
        vercel: Boolean(process.env.VERCEL),
        nodeEnv: process.env.NODE_ENV || null,
      },
      hint:
        missing.length === 0
          ? null
          : `Add ${missing.join(' and ')} in Vercel → Settings → Environment Variables, ` +
            'select Production as well as Preview, then redeploy — changing a variable ' +
            'does not rebuild on its own.',
    },
    { status: missing.length === 0 ? 200 : 503 },
  )
}
