'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function CreatePage() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState(false)

  async function create() {
    if (!title.trim()) return
    setBusy(true)
    const res = await fetch('/api/admin/pages', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title }),
    })
    const json = await res.json().catch(() => ({}))
    setBusy(false)
    if (res.ok) {
      setOpen(false)
      setTitle('')
      router.push(`/admin/pages/${json.page.id}`)
    }
  }

  if (!open) {
    return (
      <button className="adm-btn adm-btn--fg" type="button" onClick={() => setOpen(true)}>
        + New page
      </button>
    )
  }

  return (
    <div className="adm-modal" onClick={() => setOpen(false)}>
      <div className="adm-modal__panel" style={{ maxWidth: 480 }} onClick={(event) => event.stopPropagation()}>
        <div className="adm-modal__head">
          <span className="adm-modal__title">New page</span>
          <button className="adm-btn adm-btn--sm" type="button" onClick={() => setOpen(false)}>
            Close
          </button>
        </div>
        <div className="adm-modal__body">
          <div className="f-field">
            <label className="f-label">Page title</label>
            <input
              className="adm-input"
              value={title}
              autoFocus
              placeholder="e.g. Study in Malaysia"
              onChange={(event) => setTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void create()
              }}
            />
            <p className="f-help">
              The web address is generated from the title. You can change it afterwards in page settings.
            </p>
          </div>
        </div>
        <div className="adm-modal__foot">
          <button className="adm-btn" type="button" onClick={() => setOpen(false)}>
            Cancel
          </button>
          <button className="adm-btn adm-btn--fg" type="button" onClick={create} disabled={busy || !title.trim()}>
            {busy ? 'Creating…' : 'Create page'}
          </button>
        </div>
      </div>
    </div>
  )
}
