'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function AdminLogin({ siteName }: { siteName: string }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Could not sign in')
      router.refresh()
    } catch (err: any) {
      setError(err?.message || 'Could not sign in')
      setBusy(false)
    }
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <span className="brand__mark">ISC</span>
        <h1>Sign in</h1>
        <p>
          Content manager for {siteName}. Everything you change here appears on the live site immediately.
        </p>
        <form className="login-form" onSubmit={onSubmit}>
          <div className="f-field">
            <label className="f-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className="adm-input"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="f-field">
            <label className="f-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className="adm-input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          {error ? <p className="login-error">{error}</p> : null}
          <button className="adm-btn adm-btn--fg" type="submit" disabled={busy} style={{ justifyContent: 'center' }}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
