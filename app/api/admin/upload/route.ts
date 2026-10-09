import { bad, guard, ok } from '@/lib/kernel/api'
import { addMedia } from '@/lib/kernel/content'
import { storageMode, storeFile } from '@/lib/kernel/storage'

const MAX_BYTES = 8 * 1024 * 1024

export async function POST(request: Request) {
  const g = await guard()
  if ('response' in g) return g.response

  const form = await request.formData()
  const file = form.get('file')
  if (!(file instanceof File)) return bad('No file was uploaded')
  if (file.size > MAX_BYTES) return bad('Files must be 8 MB or smaller')

  try {
    const stored = await storeFile(file)
    const record = await addMedia({
      url: stored.url,
      filename: stored.filename,
      alt: String(form.get('alt') || ''),
      mime: stored.mime,
      size: stored.size,
    })
    return ok({ media: record, mode: storageMode() })
  } catch (error: any) {
    return bad(error?.message || 'Upload failed', 500)
  }
}
