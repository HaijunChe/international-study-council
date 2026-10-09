/**
 * Kernel · media storage
 * ---------------------------------------------------------------------------
 * Two backends behind one function:
 *
 *   • Vercel Blob  — when BLOB_READ_WRITE_TOKEN is set (production)
 *   • local disk   — writes to ./public/uploads (development only, since
 *                    serverless filesystems are read-only)
 *
 * Anything already on the internet can also be referenced by URL, which is
 * what most owners will do for university photography.
 */

import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { id } from './ids'

export type StoredFile = { url: string; filename: string; mime: string; size: number }

const SAFE = /[^a-zA-Z0-9._-]/g

export async function storeFile(file: File): Promise<StoredFile> {
  const buffer = Buffer.from(await file.arrayBuffer())
  const ext = (file.name.match(/\.[a-zA-Z0-9]+$/) || [''])[0].toLowerCase()
  const base = file.name.replace(/\.[^.]+$/, '').replace(SAFE, '-').slice(0, 48) || 'file'
  const filename = `${base}-${id().slice(0, 8)}${ext}`
  const mime = file.type || 'application/octet-stream'

  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (token) {
    const res = await fetch(`https://blob.vercel-storage.com/uploads/${filename}`, {
      method: 'PUT',
      headers: {
        authorization: `Bearer ${token}`,
        'x-api-version': '7',
        'x-content-type': mime,
        'x-add-random-suffix': '0',
      },
      body: buffer,
    })
    if (!res.ok) throw new Error(`Upload failed (${res.status})`)
    const json = (await res.json()) as { url?: string }
    if (!json.url) throw new Error('Upload returned no URL')
    return { url: json.url, filename, mime, size: buffer.byteLength }
  }

  const dir = path.join(process.cwd(), 'public', 'uploads')
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, filename), buffer)
  return { url: `/uploads/${filename}`, filename, mime, size: buffer.byteLength }
}

export function storageMode(): 'blob' | 'local' {
  return process.env.BLOB_READ_WRITE_TOKEN ? 'blob' : 'local'
}
