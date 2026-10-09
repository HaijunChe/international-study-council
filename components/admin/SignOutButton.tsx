'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SignOutButton() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  return (
    <button
      className="adm-btn adm-btn--sm"
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true)
        await fetch('/api/admin/logout', { method: 'POST' })
        router.refresh()
      }}
    >
      {busy ? 'Signing out…' : 'Sign out'}
    </button>
  )
}
