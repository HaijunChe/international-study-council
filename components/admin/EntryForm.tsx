'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { FieldSet, useToast } from './FieldInput'
import type { FieldDef } from '@/lib/kernel/types'

export default function EntryForm({
  collection,
  singular,
  hint,
  entryId,
  initial,
  fields,
  publicUrl,
}: {
  collection: string
  singular: string
  hint: string
  entryId?: string
  initial: Record<string, any>
  fields: FieldDef[]
  publicUrl?: string
}) {
  const router = useRouter()
  const [data, setData] = useState<Record<string, any>>(initial)
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const { toast, toastNode } = useToast()

  async function save(andReturn: boolean) {
    setBusy(true)
    try {
      const url = entryId
        ? `/api/admin/collections/${collection}/${entryId}`
        : `/api/admin/collections/${collection}`
      const res = await fetch(url, {
        method: entryId ? 'PUT' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Could not save')
      setDirty(false)
      toast({ message: `${singular} saved` })
      if (andReturn || !entryId) {
        router.push(`/admin/c/${collection}`)
      } else {
        router.refresh()
      }
    } catch (error: any) {
      toast({ message: error?.message || 'Could not save', error: true })
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!entryId) return
    if (!confirm(`Delete this ${singular.toLowerCase()}? This cannot be undone.`)) return
    setBusy(true)
    await fetch(`/api/admin/collections/${collection}/${entryId}`, { method: 'DELETE' })
    router.push(`/admin/c/${collection}`)
  }

  return (
    <>
      <div className="adm-bar">
        <div className="adm-bar__left">
          <span className="adm-bar__title">{entryId ? `Edit ${singular.toLowerCase()}` : `New ${singular.toLowerCase()}`}</span>
          <span className="adm-bar__sub">{hint}</span>
        </div>
        <div className="adm-bar__actions">
          {publicUrl ? (
            <a className="adm-btn" href={publicUrl} target="_blank" rel="noreferrer">
              View on site ↗
            </a>
          ) : null}
          {entryId ? (
            <button className="adm-btn adm-btn--danger" type="button" onClick={remove} disabled={busy}>
              Delete
            </button>
          ) : null}
          <button className="adm-btn" type="button" onClick={() => void save(true)} disabled={busy}>
            Save &amp; close
          </button>
          <button className="adm-btn adm-btn--fg" type="button" onClick={() => void save(false)} disabled={busy}>
            {busy ? 'Saving…' : dirty ? 'Save' : 'Saved'}
          </button>
        </div>
      </div>

      <div className="adm-body">
        <div className="adm-card">
          <FieldSet
            fields={fields}
            data={data}
            onChange={(key, value) => {
              setData((current) => ({ ...current, [key]: value }))
              setDirty(true)
            }}
          />
        </div>
        <p className="adm-hint">
          Fields marked as collections feed the blocks on your pages automatically — change a value here and it updates
          everywhere it appears.
        </p>
      </div>

      {toastNode}
    </>
  )
}
