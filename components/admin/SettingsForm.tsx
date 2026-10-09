'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useToast } from './FieldInput'
import type { SiteSettings } from '@/lib/kernel/types'

type SectionDef = {
  key: keyof SiteSettings
  title: string
  hint: string
  fields: Array<{ key: string; label: string; type?: 'text' | 'textarea' | 'color' | 'tel'; placeholder?: string; help?: string }>
}

const SECTIONS: SectionDef[] = [
  {
    key: 'identity',
    title: 'Identity',
    hint: 'The name and one-line description used across the site, in search results and in link previews.',
    fields: [
      { key: 'site_name', label: 'Site name' },
      { key: 'site_short', label: 'Short name' },
      { key: 'logo_text', label: 'Logo initials', placeholder: 'ISC', help: 'Shown in the square mark next to the name.' },
      { key: 'tagline', label: 'Tagline' },
      { key: 'description', label: 'Description', type: 'textarea' },
    ],
  },
  {
    key: 'contact',
    title: 'Contact & WhatsApp',
    hint: 'The WhatsApp number drives every chat button on the site. Use the full international format.',
    fields: [
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'whatsapp', label: 'WhatsApp number', placeholder: '+12025550143', help: 'Digits and + only.' },
      { key: 'whatsapp_message', label: 'Pre-filled WhatsApp message', type: 'textarea' },
      { key: 'address', label: 'Office address' },
      { key: 'hours', label: 'Opening hours' },
    ],
  },
  {
    key: 'social',
    title: 'Social profiles',
    hint: 'Leave a field empty to hide that icon. These appear in the footer, the contact page and the enquiry aside.',
    fields: [
      { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://www.linkedin.com/company/…' },
      { key: 'facebook', label: 'Facebook', placeholder: 'https://www.facebook.com/…' },
      { key: 'instagram', label: 'Instagram', placeholder: 'https://www.instagram.com/…' },
    ],
  },
  {
    key: 'theme',
    title: 'Colour',
    hint: 'Used for links, highlights and accent text. The rest of the palette stays monochrome.',
    fields: [
      { key: 'accent', label: 'Accent', type: 'color' },
      { key: 'accent_ink', label: 'Accent (text on light)', type: 'color' },
    ],
  },
  {
    key: 'seo',
    title: 'Search defaults',
    hint: 'Used on the home page and anywhere a page has no description of its own.',
    fields: [
      { key: 'default_title', label: 'Default title' },
      { key: 'default_description', label: 'Default description', type: 'textarea' },
    ],
  },
]

export default function SettingsForm({ initial }: { initial: SiteSettings }) {
  const router = useRouter()
  const [data, setData] = useState<SiteSettings>(initial)
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const { toast, toastNode } = useToast()

  function patch(section: keyof SiteSettings, key: string, value: string) {
    setData((current) => ({ ...current, [section]: { ...(current[section] as any), [key]: value } }))
    setDirty(true)
  }

  async function save() {
    setBusy(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Could not save')
      setDirty(false)
      toast({ message: 'Settings saved — live across the site' })
      router.refresh()
    } catch (error: any) {
      toast({ message: error?.message || 'Could not save', error: true })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="adm-bar">
        <div className="adm-bar__left">
          <span className="adm-bar__title">Site settings</span>
          <span className="adm-bar__sub">One place for the details that appear on every page</span>
        </div>
        <div className="adm-bar__actions">
          <button className="adm-btn adm-btn--fg" type="button" onClick={save} disabled={busy || !dirty}>
            {busy ? 'Saving…' : dirty ? 'Save settings' : 'Saved'}
          </button>
        </div>
      </div>

      <div className="adm-body">
        {SECTIONS.map((section) => (
          <section className="adm-card" key={section.key}>
            <div className="adm-card__head">
              <div>
                <p className="adm-card__title">{section.title}</p>
                <p className="adm-hint">{section.hint}</p>
              </div>
            </div>
            <div className="f-row">
              {section.fields.map((field) => {
                const value = String((data[section.key] as any)?.[field.key] ?? '')
                const wide = field.type === 'textarea' || field.type === 'color'
                return (
                  <div className={`f-field${wide ? ' f-field--wide' : ''}`} key={field.key}>
                    <label className="f-label">{field.label}</label>
                    {field.type === 'textarea' ? (
                      <textarea
                        className="adm-textarea"
                        rows={2}
                        value={value}
                        placeholder={field.placeholder}
                        onChange={(event) => patch(section.key, field.key, event.target.value)}
                      />
                    ) : field.type === 'color' ? (
                      <div className="f-color">
                        <input
                          type="color"
                          value={value || '#000000'}
                          onChange={(event) => patch(section.key, field.key, event.target.value)}
                        />
                        <input
                          className="adm-input"
                          value={value}
                          onChange={(event) => patch(section.key, field.key, event.target.value)}
                        />
                      </div>
                    ) : (
                      <input
                        className="adm-input"
                        value={value}
                        placeholder={field.placeholder}
                        onChange={(event) => patch(section.key, field.key, event.target.value)}
                      />
                    )}
                    {field.help ? <p className="f-help">{field.help}</p> : null}
                  </div>
                )
              })}
            </div>
          </section>
        ))}
      </div>

      {toastNode}
    </>
  )
}
