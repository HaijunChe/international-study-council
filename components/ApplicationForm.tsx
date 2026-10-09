'use client'

import { useMemo, useState } from 'react'

export type AppField = {
  key: string
  label: string
  type?: string
  required?: boolean
  options?: string[]
  placeholder?: string
  help?: string
  step?: number
}

export type AppStep = { title: string; description?: string }

export type LabelKey =
  | 'pleaseChoose'
  | 'continue'
  | 'back'
  | 'submitting'
  | 'required'
  | 'invalidEmail'
  | 'chooseAtLeastOne'
  | 'summaryName'
  | 'summaryEmail'
  | 'summaryHelp'

const FALLBACK: Record<LabelKey, string> = {
  pleaseChoose: 'Please choose',
  continue: 'Continue',
  back: 'Back',
  submitting: 'Submitting…',
  required: 'This is required',
  invalidEmail: 'Please enter a valid email address',
  chooseAtLeastOne: 'Please choose at least one',
  summaryName: 'Name',
  summaryEmail: 'Email',
  summaryHelp: 'Help with',
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function emptyValue(field: AppField) {
  return field.type === 'checkboxes' ? [] : ''
}

export default function ApplicationForm({
  steps,
  fields,
  submitLabel = 'Submit application',
  successTitle = 'Application received',
  successBody = 'An advisor will review your details and reply within one working day.',
  whatsappUrl,
  labels = {},
}: {
  steps: AppStep[]
  fields: AppField[]
  submitLabel?: string
  successTitle?: string
  successBody?: string
  whatsappUrl?: string
  labels?: Partial<Record<LabelKey, string>>
}) {
  const usableSteps = steps.length ? steps : [{ title: 'Your details' }]
  const L = (key: LabelKey) => labels[key] || FALLBACK[key]

  const grouped = useMemo(() => {
    return usableSteps.map((step, index) => ({
      ...step,
      fields: fields.filter((field) => (field.step || 1) === index + 1),
    }))
  }, [steps, fields, usableSteps])

  const [current, setCurrent] = useState(0)
  const [values, setValues] = useState<Record<string, any>>(() =>
    Object.fromEntries(fields.map((field) => [field.key, emptyValue(field)])),
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [serverError, setServerError] = useState('')

  const step = grouped[current]
  const isLast = current === grouped.length - 1
  const progress = ((current + (state === 'done' ? 1 : 0)) / grouped.length) * 100

  function set(key: string, value: any) {
    setValues((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => (prev[key] ? { ...prev, [key]: '' } : prev))
  }

  function validate(index: number): boolean {
    const next: Record<string, string> = {}
    for (const field of grouped[index].fields) {
      const value = values[field.key]
      if (!field.required) continue
      if (field.type === 'checkboxes') {
        if (!Array.isArray(value) || value.length === 0) next[field.key] = L('chooseAtLeastOne')
      } else if (field.type === 'email') {
        if (!EMAIL.test(String(value || ''))) next[field.key] = L('invalidEmail')
      } else if (!String(value ?? '').trim()) {
        next[field.key] = L('required')
      }
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function submit() {
    // Validate every step, jumping back to the first one that fails.
    for (let index = 0; index < grouped.length; index += 1) {
      if (!validate(index)) {
        setCurrent(index)
        return
      }
    }

    setState('sending')
    setServerError('')
    try {
      const payload: Record<string, any> = { source: '/apply' }
      for (const [key, value] of Object.entries(values)) {
        payload[key] = Array.isArray(value) ? value.join(', ') : value
      }
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Something went wrong')
      setState('done')
    } catch (error: any) {
      setServerError(error?.message || 'Something went wrong')
      setState('error')
    }
  }

  if (state === 'done') {
    return (
      <div className="appform appform--done">
        <div className="appform__done-mark" aria-hidden="true">
          ✓
        </div>
        <h3 className="appform__done-title">{successTitle}</h3>
        <p className="appform__done-body">{successBody}</p>
        <dl className="appform__summary">
          <div>
            <dt>{L('summaryName')}</dt>
            <dd>{values.name || '—'}</dd>
          </div>
          <div>
            <dt>{L('summaryEmail')}</dt>
            <dd>{values.email || '—'}</dd>
          </div>
          {Array.isArray(values.services) && values.services.length ? (
            <div>
              <dt>{L('summaryHelp')}</dt>
              <dd>{values.services.join(' · ')}</dd>
            </div>
          ) : null}
        </dl>
        {whatsappUrl ? (
          <a className="btn btn--fg btn--lg" href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <span>Message us on WhatsApp</span>
          </a>
        ) : null}
      </div>
    )
  }

  return (
    <div className="appform">
      <div className="appform__head">
        <div className="appform__steps" role="list">
          {grouped.map((item, index) => (
            <div
              className={`appform__step${index === current ? ' is-current' : ''}${index < current ? ' is-done' : ''}`}
              key={index}
              role="listitem"
            >
              <span className="appform__step-num">{String(index + 1).padStart(2, '0')}</span>
              <span className="appform__step-label">{item.title}</span>
            </div>
          ))}
        </div>
        <div className="appform__bar" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="appform__panel">
        <div className="appform__panel-head">
          <h3 className="appform__title">{step.title}</h3>
          {step.description ? <p className="appform__desc">{step.description}</p> : null}
        </div>

        <div className="form__grid">
          {step.fields.map((field) => {
            const id = `af-${field.key}`
            const type = field.type || 'text'
            const wide = ['textarea', 'select', 'checkboxes', 'heading'].includes(type)
            const error = errors[field.key]

            if (type === 'heading') {
              return (
                <div className="field field--wide field--heading" key={field.key}>
                  <p className="field__heading">{field.label}</p>
                </div>
              )
            }

            return (
              <div className={`field${wide ? ' field--wide' : ''}${error ? ' field--error' : ''}`} key={field.key}>
                <label className="field__label" htmlFor={id}>
                  {field.label}
                  {field.required ? <span aria-hidden="true"> *</span> : null}
                </label>

                {type === 'textarea' ? (
                  <textarea
                    id={id}
                    rows={4}
                    placeholder={field.placeholder}
                    value={values[field.key] ?? ''}
                    onChange={(event) => set(field.key, event.target.value)}
                  />
                ) : type === 'select' ? (
                  <select
                    id={id}
                    value={values[field.key] ?? ''}
                    onChange={(event) => set(field.key, event.target.value)}
                  >
                    <option value="">{L('pleaseChoose')}</option>
                    {(field.options || []).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : type === 'checkboxes' ? (
                  <div className="checkgrid">
                    {(field.options || []).map((option) => {
                      const selected: string[] = Array.isArray(values[field.key]) ? values[field.key] : []
                      const checked = selected.includes(option)
                      return (
                        <label className={`checkpill${checked ? ' is-on' : ''}`} key={option}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) =>
                              set(
                                field.key,
                                event.target.checked
                                  ? [...selected, option]
                                  : selected.filter((item) => item !== option),
                              )
                            }
                          />
                          <span>{option}</span>
                        </label>
                      )
                    })}
                  </div>
                ) : (
                  <input
                    id={id}
                    type={type === 'email' ? 'email' : type === 'tel' ? 'tel' : type === 'number' ? 'number' : type === 'date' ? 'date' : 'text'}
                    placeholder={field.placeholder}
                    value={values[field.key] ?? ''}
                    onChange={(event) => set(field.key, event.target.value)}
                  />
                )}

                {error ? (
                  <p className="field__error" role="alert">
                    {error}
                  </p>
                ) : field.help ? (
                  <p className="field__help">{field.help}</p>
                ) : null}
              </div>
            )
          })}
        </div>

        {state === 'error' ? <p className="form__error">{serverError}</p> : null}

        <div className="appform__actions">
          {current > 0 ? (
            <button className="btn btn--ghost" type="button" onClick={() => setCurrent((index) => index - 1)}>
              {L('back')}
            </button>
          ) : null}
          {isLast ? (
            <button className="btn btn--fg btn--lg" type="button" onClick={submit} disabled={state === 'sending'}>
              <span>{state === 'sending' ? L('submitting') : submitLabel}</span>
            </button>
          ) : (
            <button
              className="btn btn--fg btn--lg"
              type="button"
              onClick={() => {
                if (validate(current)) setCurrent((index) => index + 1)
              }}
            >
              <span>{L('continue')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
