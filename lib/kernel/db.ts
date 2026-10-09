/**
 * Kernel · database adapter
 * ---------------------------------------------------------------------------
 * One thin interface over Postgres. Two interchangeable backends:
 *
 *   • DATABASE_URL set  → real Postgres (Neon / Supabase / any host)
 *   • DATABASE_URL unset → embedded Postgres (PGlite, WASM) persisted to
 *                          ./.data/pg so local development needs zero setup.
 *
 * Both speak the same dialect, so every query in the kernel is plain Postgres.
 */

import path from 'node:path'
import { mkdirSync } from 'node:fs'

export type Row = Record<string, any>
export type QueryResult = { rows: Row[]; rowCount: number }

interface Driver {
  query(sql: string, params?: any[]): Promise<QueryResult>
  exec(sql: string): Promise<void>
}

const globalRef = globalThis as unknown as {
  __isc_driver?: Promise<Driver>
  __isc_boot?: Promise<void>
}

async function connect(): Promise<Driver> {
  const url = process.env.DATABASE_URL?.trim()

  if (url) {
    const mod: any = await import('pg')
    const Pool = (mod.default ?? mod).Pool
    const needsSsl = /sslmode=require|neon\.tech|supabase\.co|render\.com|aws\./i.test(url)
    const pool = new Pool({
      connectionString: url,
      max: Number(process.env.PG_POOL_MAX || 5),
      ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
    })
    return {
      async query(sql, params = []) {
        const res = await pool.query(sql, params)
        return { rows: res.rows as Row[], rowCount: res.rowCount ?? 0 }
      },
      async exec(sql) {
        await pool.query(sql)
      },
    }
  }

  /* Serverless hosts ship a read-only bundle directory, and PGlite needs to
     write to disk. Falling through there dies with an opaque
     `ENOENT: mkdir '/var/task/.data/pg'` — which reads like a filesystem bug
     rather than the missing environment variable it actually is. Say what is
     wrong instead.

     Only guarded on serverless: a local `next build` also runs with
     NODE_ENV=production and no DATABASE_URL, and that must keep working. */
  const serverless =
    process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY
  if (serverless) {
    throw new Error(
      'DATABASE_URL is not set. Refusing to fall back to the embedded ' +
        'database: serverless filesystems are read-only, so it cannot work. ' +
        'Add DATABASE_URL in Vercel → Settings → Environment Variables, then ' +
        'redeploy — changing a variable does not rebuild on its own.',
    )
  }

  const { PGlite } = await import('@electric-sql/pglite')
  const dir = process.env.PGLITE_DIR || path.join(process.cwd(), '.data', 'pg')
  mkdirSync(dir, { recursive: true })
  const pg = new PGlite(dir)
  await pg.waitReady
  return {
    async query(sql, params = []) {
      const res: any = await pg.query(sql, params)
      return { rows: (res.rows ?? []) as Row[], rowCount: res.affectedRows ?? res.rows?.length ?? 0 }
    },
    async exec(sql) {
      await pg.exec(sql)
    },
  }
}

export function driver(): Promise<Driver> {
  if (!globalRef.__isc_driver) globalRef.__isc_driver = connect()
  return globalRef.__isc_driver
}

/** Raw query. Schema + seed are guaranteed to have run. */
export async function query<T extends Row = Row>(sql: string, params: any[] = []): Promise<T[]> {
  await ready()
  const res = await (await driver()).query(sql, params)
  return res.rows as T[]
}

/** Single row or null. */
export async function one<T extends Row = Row>(sql: string, params: any[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params)
  return rows[0] ?? null
}

/** Run statements outside of the bootstrap guard (used by bootstrap itself). */
export async function raw(sql: string, params: any[] = []): Promise<QueryResult> {
  return (await driver()).query(sql, params)
}

/** Ensure the schema exists and the first seed has been applied. Idempotent. */
export function ready(): Promise<void> {
  if (!globalRef.__isc_boot) {
    globalRef.__isc_boot = (async () => {
      const { migrate, seed } = await import('./bootstrap')
      await migrate()
      await seed()
    })().catch((err) => {
      globalRef.__isc_boot = undefined
      throw err
    })
  }
  return globalRef.__isc_boot
}
