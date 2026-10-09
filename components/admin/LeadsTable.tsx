'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { useToast } from './FieldInput'
import type { Lead } from '@/lib/kernel/content'

const STATUSES = ['new', 'contacted', 'converted', 'closed'] as const

const STATUS_CLASS: Record<string, string> = {
  new: 'tag--new',
  contacted: 'tag--warn',
  converted: 'tag--ok',
  closed: 'tag--off',
}

/** Keys already shown as their own column or panel — hidden from the raw answer list. */
const KNOWN = new Set([
  'name',
  'email',
  'phone',
  'whatsapp',
  'country',
  'level',
  'message',
  'source',
  'website',
  'services',
])

function humanise(key: string): string {
  const label = key.replace(/[_-]+/g, ' ').trim()
  return label.charAt(0).toUpperCase() + label.slice(1)
}

/** "SOP, Visa application" → ["SOP", "Visa application"] */
function requestedServices(lead: Lead): string[] {
  const raw = lead.data?.services
  if (Array.isArray(raw)) return raw.filter(Boolean)
  if (typeof raw === 'string' && raw.trim()) return raw.split(',').map((item) => item.trim()).filter(Boolean)
  return []
}

export default function LeadsTable({ initial }: { initial: Lead[] }) {
  const router = useRouter()
  const [leads, setLeads] = useState(initial)
  const [filter, setFilter] = useState<'all' | (typeof STATUSES)[number]>('all')
  const [openId, setOpenId] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const { toast, toastNode } = useToast()

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: leads.length }
    for (const status of STATUSES) map[status] = leads.filter((lead) => lead.status === status).length
    return map
  }, [leads])

  const visible = filter === 'all' ? leads : leads.filter((lead) => lead.status === filter)
  const open = leads.find((lead) => lead.id === openId) || null

  async function setStatus(lead: Lead, status: string) {
    setLeads((current) => current.map((item) => (item.id === lead.id ? { ...item, status } : item)))
    await fetch(`/api/admin/leads/${lead.id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    router.refresh()
  }

  async function saveNotes() {
    if (!open) return
    setLeads((current) => current.map((item) => (item.id === open.id ? { ...item, notes } : item)))
    await fetch(`/api/admin/leads/${open.id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ notes }),
    })
    toast({ message: 'Note saved' })
    setOpenId(null)
  }

  async function remove(lead: Lead) {
    if (!confirm(`Delete the enquiry from ${lead.name || lead.email}?`)) return
    setLeads((current) => current.filter((item) => item.id !== lead.id))
    await fetch(`/api/admin/leads/${lead.id}`, { method: 'DELETE' })
    setOpenId(null)
    toast({ message: 'Enquiry deleted' })
  }

  function exportCsv() {
    const header = ['Date', 'Name', 'Email', 'Phone', 'WhatsApp', 'Destination', 'Level', 'Message', 'Status', 'Notes']
    const rows = leads.map((lead) => [
      new Date(lead.created_at).toISOString(),
      lead.name,
      lead.email,
      lead.phone,
      lead.whatsapp,
      lead.country,
      lead.level,
      lead.message.replace(/\s+/g, ' '),
      lead.status,
      lead.notes,
    ])
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `enquiries-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <div className="adm-bar">
        <div className="adm-bar__left">
          <span className="adm-bar__title">Enquiries</span>
          <span className="adm-bar__sub">
            {counts.all} total · {counts.new} new
          </span>
        </div>
        <div className="adm-bar__actions">
          <div className="filterbar__controls">
            {(['all', ...STATUSES] as const).map((status) => (
              <button
                key={status}
                className={`adm-btn adm-btn--sm${filter === status ? ' adm-btn--fg' : ''}`}
                type="button"
                onClick={() => setFilter(status)}
              >
                {status} ({counts[status] ?? 0})
              </button>
            ))}
          </div>
          <button className="adm-btn" type="button" onClick={exportCsv} disabled={!leads.length}>
            Export CSV
          </button>
        </div>
      </div>

      <div className="adm-body">
        <div className="adm-card adm-card--flush">
          {visible.length ? (
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Received</th>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Study plans</th>
                  <th>Wants help with</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visible.map((lead) => {
                  const services = requestedServices(lead)
                  return (
                    <tr key={lead.id}>
                      <td className="adm-table__muted">{new Date(lead.created_at).toLocaleDateString('en-GB')}</td>
                      <td className="adm-table__title">
                        {lead.name || '—'}
                        {lead.notes ? <span className="lead-note-dot" title="Has an internal note" /> : null}
                      </td>
                      <td className="adm-table__muted">
                        {lead.email}
                        {lead.whatsapp ? <div>{lead.whatsapp}</div> : null}
                      </td>
                      <td className="adm-table__muted">
                        {[lead.country, lead.level].filter(Boolean).join(' · ') || '—'}
                        {lead.data?.intake ? <div>{lead.data.intake}</div> : null}
                      </td>
                      <td>
                        {services.length ? (
                          <span className="lead-tags">
                            {services.slice(0, 2).map((service) => (
                              <span className="tag" key={service}>
                                {service}
                              </span>
                            ))}
                            {services.length > 2 ? <span className="tag">+{services.length - 2}</span> : null}
                          </span>
                        ) : (
                          <span className="adm-table__muted">—</span>
                        )}
                      </td>
                      <td>
                        <select
                          className="adm-select"
                          style={{ width: 'auto', padding: '4px 28px 4px 9px', fontSize: 12 }}
                          value={lead.status}
                          onChange={(event) => void setStatus(lead, event.target.value)}
                        >
                          {STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <button
                          className="adm-btn adm-btn--sm"
                          type="button"
                          onClick={() => {
                            setOpenId(lead.id)
                            setNotes(lead.notes || '')
                          }}
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <p className="adm-empty">No enquiries in this view yet.</p>
          )}
        </div>
      </div>

      {open ? (
        <div className="adm-modal" onClick={() => setOpenId(null)}>
          <div className="adm-modal__panel" onClick={(event) => event.stopPropagation()}>
            <div className="adm-modal__head">
              <span className="adm-modal__title">{open.name || open.email}</span>
              <span className={`tag ${STATUS_CLASS[open.status] || ''}`}>{open.status}</span>
            </div>
            <div className="adm-modal__body">
              <dl className="aside-facts" style={{ marginBottom: 22 }}>
                <div>
                  <dt>Received</dt>
                  <dd>{new Date(open.created_at).toLocaleString('en-GB')}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{open.email || '—'}</dd>
                </div>
                <div>
                  <dt>Phone</dt>
                  <dd>{open.phone || '—'}</dd>
                </div>
                <div>
                  <dt>WhatsApp</dt>
                  <dd>{open.whatsapp || '—'}</dd>
                </div>
                <div>
                  <dt>Destination</dt>
                  <dd>{open.country || '—'}</dd>
                </div>
                <div>
                  <dt>Level</dt>
                  <dd>{open.level || '—'}</dd>
                </div>
                <div>
                  <dt>Came from</dt>
                  <dd>{open.source || '—'}</dd>
                </div>
              </dl>
              {requestedServices(open).length ? (
                <div style={{ marginBottom: 22 }}>
                  <p className="f-label" style={{ marginBottom: 10 }}>
                    Wants help with
                  </p>
                  <span className="lead-tags">
                    {requestedServices(open).map((service) => (
                      <span className="tag tag--new" key={service}>
                        {service}
                      </span>
                    ))}
                  </span>
                </div>
              ) : null}

              {(() => {
                const extra = Object.entries(open.data || {}).filter(
                  ([key, value]) => !KNOWN.has(key) && String(value ?? '').trim() !== '',
                )
                if (!extra.length) return null
                return (
                  <div style={{ marginBottom: 22 }}>
                    <p className="f-label" style={{ marginBottom: 10 }}>
                      Application answers
                    </p>
                    <dl className="aside-facts">
                      {extra.map(([key, value]) => (
                        <div key={key}>
                          <dt>{humanise(key)}</dt>
                          <dd>{String(value)}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )
              })()}

              {open.message ? (
                <div className="adm-card" style={{ marginBottom: 20, background: 'var(--bg-soft)' }}>
                  <p style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{open.message}</p>
                </div>
              ) : null}
              <div className="f-field">
                <label className="f-label">Internal notes</label>
                <textarea
                  className="adm-textarea"
                  rows={4}
                  value={notes}
                  placeholder="Who called, what was discussed, next step…"
                  onChange={(event) => setNotes(event.target.value)}
                />
              </div>
            </div>
            <div className="adm-modal__foot">
              <button className="adm-btn adm-btn--danger" type="button" onClick={() => void remove(open)}>
                Delete
              </button>
              <a className="adm-btn" href={`mailto:${open.email}`}>
                Email them
              </a>
              <button className="adm-btn adm-btn--fg" type="button" onClick={saveNotes}>
                Save note
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toastNode}
    </>
  )
}
