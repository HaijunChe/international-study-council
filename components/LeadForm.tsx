'use client'

import { useState } from 'react'

type FieldSpec = {
  key: string
  label: string
  type?: string
  required?: boolean
  options?: string[]
}

export default function LeadForm({
  fields,
  submitLabel = 'Send',
  successMessage = 'Thank you — we will be in touch shortly.',
  source = '',
  labels = { pleaseChoose: 'Please choose', sending: 'Sending…' },
}: {
  fields: FieldSpec[]
  submitLabel?: string
  successMessage?: string
  source?: string
  labels?: { pleaseChoose: string; sending: string }
}) {
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setState('sending')
    setError('')
    const form = new FormData(event.currentTarget)
    const payload: Record<string, any> = { source }
    for (const [key, value] of form.entries()) payload[key] = value

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Something went wrong')
      setState('done')
      event.currentTarget.reset()
    } catch (err: any) {
      setError(err?.message || 'Something went wrong')
      setState('error')
    }
  }

  if (state === 'done') {
    return (
      <div className="form-done" role="status">
        <p>{successMessage}</p>
      </div>
    )
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <div className="form__grid">
        {(fields || []).map((field) => {
          const type = field.type || 'text'
          const id = `f-${field.key}`
          const wide = ['textarea', 'select', 'checkboxes', 'heading'].includes(type)

          if (type === 'heading') {
            return (
              <div className="field field--wide field--heading" key={field.key}>
                <p className="field__heading">{field.label}</p>
              </div>
            )
          }

          return (
            <div className={`field${wide ? ' field--wide' : ''}`} key={field.key}>
              <label className="field__label" htmlFor={id}>
                {field.label}
                {field.required ? <span aria-hidden="true"> *</span> : null}
              </label>
              {type === 'textarea' ? (
                <textarea id={id} name={field.key} rows={4} required={field.required} />
              ) : type === 'select' ? (
                <select id={id} name={field.key} required={field.required} defaultValue="">
                  <option value="" disabled>
                    {labels.pleaseChoose}
                  </option>
                  {(field.options || []).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : type === 'checkboxes' ? (
                <div className="checkgrid">
                  {(field.options || []).map((option) => (
                    <label className="checkpill" key={option}>
                      <input type="checkbox" name={field.key} value={option} />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <input id={id} name={field.key} type={type} required={field.required} autoComplete="on" />
              )}
            </div>
          )
        })}
      </div>
      {state === 'error' ? (
        <p className="form__error" role="alert">
          {error}
        </p>
      ) : null}
      <button className="btn btn--fg btn--lg" type="submit" disabled={state === 'sending'}>
        <span>{state === 'sending' ? labels.sending : submitLabel}</span>
      </button>
    </form>
  )
}
