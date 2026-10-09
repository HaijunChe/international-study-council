'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export type PlanService = {
  id: string
  title: string
  summary: string
  category: string
  price: string
  priceValue: number
  weeks: number
  includes: string[]
}

export type PlanLabels = {
  available: string
  availableHint: string
  plan: string
  planEmpty: string
  planEmptyHint: string
  addAll: string
  reset: string
  total: string
  timeline: string
  weeks: string
  services: string
  send: string
  sendHint: string
  name: string
  email: string
  whatsapp: string
  submit: string
  sending: string
  done: string
  doneBody: string
  required: string
  invalidEmail: string
  remove: string
  moveUp: string
  moveDown: string
  free: string
  dragHint: string
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const STORE_KEY = 'isc-plan-v1'

export default function PlanBuilder({
  services,
  labels,
  whatsappUrl,
}: {
  services: PlanService[]
  labels: PlanLabels
  whatsappUrl?: string
}) {
  const [picked, setPicked] = useState<string[]>([])
  const [dragId, setDragId] = useState<string | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', email: '', whatsapp: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [serverError, setServerError] = useState('')
  const restored = useRef(false)

  const byId = useMemo(() => new Map(services.map((service) => [service.id, service])), [services])

  /* Restore a plan the visitor was building before they navigated away. */
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setPicked(parsed.filter((id: string) => byId.has(id)))
      }
    } catch {
      /* ignore */
    }
    restored.current = true
  }, [byId])

  useEffect(() => {
    if (!restored.current) return
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(picked))
    } catch {
      /* ignore */
    }
  }, [picked])

  const chosen = picked.map((id) => byId.get(id)).filter(Boolean) as PlanService[]
  const total = chosen.reduce((sum, service) => sum + (service.priceValue || 0), 0)
  const weeks = chosen.reduce((max, service) => Math.max(max, service.weeks || 0), 0)
  const maxPrice = chosen.reduce((max, service) => Math.max(max, service.priceValue || 0), 0) || 1

  const groups = useMemo(() => {
    const map = new Map<string, PlanService[]>()
    for (const service of services) {
      const key = service.category || 'Other'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(service)
    }
    return [...map.entries()]
  }, [services])

  const add = useCallback((id: string, at?: number) => {
    setPicked((current) => {
      if (current.includes(id)) return current
      if (at === undefined) return [...current, id]
      const next = [...current]
      next.splice(at, 0, id)
      return next
    })
  }, [])

  const remove = useCallback((id: string) => {
    setPicked((current) => current.filter((item) => item !== id))
  }, [])

  const move = useCallback((index: number, delta: number) => {
    setPicked((current) => {
      const target = index + delta
      if (target < 0 || target >= current.length) return current
      const next = [...current]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }, [])

  function onPlanDrop(index: number) {
    if (dragId) add(dragId, index)
    setDragId(null)
    setDropIndex(null)
  }

  function reorderTo(index: number) {
    if (!dragId) return
    setPicked((current) => {
      const from = current.indexOf(dragId)
      if (from < 0 || from === index) return current
      const next = [...current]
      next.splice(from, 1)
      next.splice(index, 0, dragId)
      return next
    })
    setDragId(null)
    setDropIndex(null)
  }

  async function submit() {
    const next: Record<string, string> = {}
    if (!form.name.trim()) next.name = labels.required
    if (!EMAIL.test(form.email)) next.email = labels.invalidEmail
    if (!chosen.length) next.plan = labels.planEmpty
    setErrors(next)
    if (Object.keys(next).length) return

    setState('sending')
    setServerError('')
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          whatsapp: form.whatsapp,
          services: chosen.map((service) => service.title).join(', '),
          plan_total: `USD ${total}`,
          plan_weeks: String(weeks),
          message: `Self-built plan: ${chosen.map((s) => s.title).join(' + ')}`,
          source: '/plan',
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Something went wrong')
      setState('done')
      setPicked([])
      try {
        window.localStorage.removeItem(STORE_KEY)
      } catch {
        /* ignore */
      }
    } catch (error: any) {
      setServerError(error?.message || 'Something went wrong')
      setState('error')
    }
  }

  return (
    <div className="pb">
      {/* ---------------------------- available ---------------------------- */}
      <div className="pb__shelf">
        <header className="pb__shelf-head">
          <p className="label">{labels.available}</p>
          <p className="pb__hint">{labels.availableHint}</p>
        </header>

        <div className="pb__groups">
          {groups.map(([category, items]) => (
            <div className="pb__group" key={category}>
              <p className="pb__group-title">{category}</p>
              <div className="pb__tiles">
                {items.map((service) => {
                  const on = picked.includes(service.id)
                  return (
                    <button
                      key={service.id}
                      type="button"
                      className={`pb__tile${on ? ' is-on' : ''}`}
                      draggable
                      onDragStart={() => setDragId(service.id)}
                      onDragEnd={() => {
                        setDragId(null)
                        setDropIndex(null)
                      }}
                      onClick={() => (on ? remove(service.id) : add(service.id))}
                      aria-pressed={on}
                    >
                      <span className="pb__tile-grip" aria-hidden="true">
                        ⠿
                      </span>
                      <span className="pb__tile-body">
                        <span className="pb__tile-name">{service.title}</span>
                        <span className="pb__tile-meta">
                          {service.priceValue > 0 ? `USD ${service.priceValue}` : labels.free}
                          {service.weeks ? ` · ${service.weeks} ${labels.weeks}` : ''}
                        </span>
                      </span>
                      <span className="pb__tile-mark" aria-hidden="true">
                        {on ? '✓' : '+'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ------------------------------- plan ------------------------------ */}
      <div className="pb__canvas">
        <header className="pb__canvas-head">
          <p className="label">{labels.plan}</p>
          <div className="pb__canvas-actions">
            <button
              className="pb__link"
              type="button"
              onClick={() => setPicked(services.map((service) => service.id))}
            >
              {labels.addAll}
            </button>
            <button className="pb__link" type="button" onClick={() => setPicked([])} disabled={!picked.length}>
              {labels.reset}
            </button>
          </div>
        </header>

        <div
          className={`pb__stack${dragId && !picked.includes(dragId) ? ' is-receiving' : ''}`}
          onDragOver={(event) => event.preventDefault()}
          onDrop={() => onPlanDrop(picked.length)}
        >
          {!chosen.length ? (
            <div
              className={`pb__empty${dropIndex === 0 ? ' is-over' : ''}`}
              onDragOver={(event) => {
                event.preventDefault()
                setDropIndex(0)
              }}
              onDrop={() => onPlanDrop(0)}
            >
              <span className="pb__empty-title">{labels.planEmpty}</span>
              <span className="pb__empty-hint">{labels.planEmptyHint}</span>
            </div>
          ) : null}

          {chosen.map((service, index) => (
            <div key={service.id} className="pb__slot">
              <div
                className={`pb__block${dropIndex === index ? ' is-over' : ''}`}
                draggable
                onDragStart={() => setDragId(service.id)}
                onDragEnd={() => {
                  setDragId(null)
                  setDropIndex(null)
                }}
                onDragOver={(event) => {
                  event.preventDefault()
                  setDropIndex(index)
                }}
                onDrop={(event) => {
                  event.stopPropagation()
                  if (dragId && picked.includes(dragId)) reorderTo(index)
                  else onPlanDrop(index)
                }}
              >
                <span className="pb__block-index">{String(index + 1).padStart(2, '0')}</span>
                <span className="pb__block-body">
                  <span className="pb__block-name">{service.title}</span>
                  <span
                    className="pb__block-bar"
                    style={{ width: `${Math.max((service.priceValue / maxPrice) * 100, 6)}%` }}
                    aria-hidden="true"
                  />
                </span>
                <span className="pb__block-price">
                  {service.priceValue > 0 ? `USD ${service.priceValue}` : labels.free}
                </span>
                <span className="pb__block-tools">
                  <button
                    className="pb__icon"
                    type="button"
                    title={labels.moveUp}
                    aria-label={labels.moveUp}
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                  >
                    ↑
                  </button>
                  <button
                    className="pb__icon"
                    type="button"
                    title={labels.moveDown}
                    aria-label={labels.moveDown}
                    onClick={() => move(index, 1)}
                    disabled={index === chosen.length - 1}
                  >
                    ↓
                  </button>
                  <button
                    className="pb__icon pb__icon--remove"
                    type="button"
                    title={labels.remove}
                    aria-label={labels.remove}
                    onClick={() => remove(service.id)}
                  >
                    ✕
                  </button>
                </span>
              </div>
            </div>
          ))}

          {chosen.length ? (
            <div
              className={`pb__tail${dropIndex === chosen.length ? ' is-over' : ''}`}
              onDragOver={(event) => {
                event.preventDefault()
                setDropIndex(chosen.length)
              }}
              onDrop={() => onPlanDrop(chosen.length)}
            >
              <span className="pb__tail-hint">{labels.dragHint}</span>
            </div>
          ) : null}
        </div>

        <div className="pb__summary">
          <div className="pb__metric">
            <span className="pb__metric-value">{chosen.length}</span>
            <span className="pb__metric-label">{labels.services}</span>
          </div>
          <div className="pb__metric">
            <span className="pb__metric-value">
              {total > 0 ? `USD ${total.toLocaleString('en-US')}` : labels.free}
            </span>
            <span className="pb__metric-label">{labels.total}</span>
          </div>
          <div className="pb__metric">
            <span className="pb__metric-value">{weeks || '—'}</span>
            <span className="pb__metric-label">{labels.timeline}</span>
          </div>
        </div>

        {state === 'done' ? (
          <div className="pb__done">
            <strong>{labels.done}</strong>
            <p>{labels.doneBody}</p>
            {whatsappUrl ? (
              <a className="btn btn--ghost btn--sm" href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                {labels.whatsapp}
              </a>
            ) : null}
          </div>
        ) : (
          <div className="pb__send">
            <p className="pb__send-hint">{labels.sendHint}</p>
            <div className="pb__send-grid">
              <div className={`field${errors.name ? ' field--error' : ''}`}>
                <label className="field__label" htmlFor="pb-name">
                  {labels.name}
                </label>
                <input
                  id="pb-name"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                />
                {errors.name ? <p className="field__error">{errors.name}</p> : null}
              </div>
              <div className={`field${errors.email ? ' field--error' : ''}`}>
                <label className="field__label" htmlFor="pb-email">
                  {labels.email}
                </label>
                <input
                  id="pb-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                />
                {errors.email ? <p className="field__error">{errors.email}</p> : null}
              </div>
              <div className="field">
                <label className="field__label" htmlFor="pb-wa">
                  {labels.whatsapp}
                </label>
                <input
                  id="pb-wa"
                  type="tel"
                  value={form.whatsapp}
                  onChange={(event) => setForm({ ...form, whatsapp: event.target.value })}
                />
              </div>
            </div>
            {errors.plan ? <p className="field__error">{errors.plan}</p> : null}
            {state === 'error' ? <p className="form__error">{serverError}</p> : null}
            <button
              className="btn btn--fg btn--lg"
              type="button"
              onClick={submit}
              disabled={state === 'sending' || !chosen.length}
            >
              <span>{state === 'sending' ? labels.sending : labels.submit}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
