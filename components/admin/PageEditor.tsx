'use client'

import { useMemo, useState } from 'react'
import FieldInput, { FieldSet, useToast } from './FieldInput'
import type { Block, BlockCatalogItem, FieldDef } from '@/lib/kernel/types'

export type EditorPage = {
  id: number
  slug: string
  title: string
  seo_title: string
  seo_description: string
  status: string
  show_in_nav: boolean
  nav_label: string
  nav_order: number
}

const GROUP_LABEL: Record<string, string> = {
  layout: 'Structure',
  content: 'Content',
  data: 'Content from your collections',
  convert: 'Getting enquiries',
}

export default function PageEditor({
  page,
  initialBlocks,
  catalog,
}: {
  page: EditorPage
  initialBlocks: Block[]
  catalog: BlockCatalogItem[]
}) {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks)
  const [selectedId, setSelectedId] = useState<string | null>(initialBlocks[0]?.id ?? null)
  const [draft, setDraft] = useState<Record<string, any>>(initialBlocks[0]?.data ?? {})
  const [dirty, setDirty] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [previewKey, setPreviewKey] = useState(0)
  const [saving, setSaving] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [pageDraft, setPageDraft] = useState<EditorPage>(page)
  const { toast, toastNode } = useToast()

  const byType = useMemo(() => Object.fromEntries(catalog.map((item) => [item.type, item])), [catalog])
  const selected = blocks.find((block) => block.id === selectedId) || null
  const selectedDef = selected ? byType[selected.type] : null

  const previewUrl = page.slug === 'home' ? '/' : `/${page.slug}`

  function selectBlock(block: Block) {
    setSelectedId(block.id)
    setDraft({ ...block.data })
    setDirty(false)
  }

  function patchDraft(key: string, value: any) {
    setDraft((current) => ({ ...current, [key]: value }))
    setDirty(true)
  }

  async function saveBlock() {
    if (!selected) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/blocks/${selected.id}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ data: draft }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Could not save')
      setBlocks((current) => current.map((block) => (block.id === selected.id ? json.block : block)))
      setDirty(false)
      setPreviewKey((key) => key + 1)
      toast({ message: 'Saved — the live page is updated' })
    } catch (error: any) {
      toast({ message: error?.message || 'Could not save', error: true })
    } finally {
      setSaving(false)
    }
  }

  async function toggleBlock(block: Block) {
    const next = !block.enabled
    setBlocks((current) => current.map((item) => (item.id === block.id ? { ...item, enabled: next } : item)))
    await fetch(`/api/admin/blocks/${block.id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ enabled: next }),
    })
    setPreviewKey((key) => key + 1)
    toast({ message: next ? 'Block switched on' : 'Block hidden from the page' })
  }

  async function removeBlock(block: Block) {
    if (!confirm(`Remove “${byType[block.type]?.label || block.type}” from this page?`)) return
    setBlocks((current) => current.filter((item) => item.id !== block.id))
    if (selectedId === block.id) setSelectedId(null)
    await fetch(`/api/admin/blocks/${block.id}`, { method: 'DELETE' })
    setPreviewKey((key) => key + 1)
    toast({ message: 'Block removed' })
  }

  async function addBlock(type: string) {
    const res = await fetch('/api/admin/blocks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ page_id: page.id, type }),
    })
    const json = await res.json()
    if (!res.ok) {
      toast({ message: json.error || 'Could not add block', error: true })
      return
    }
    setBlocks((current) => [...current, json.block])
    setSelectedId(json.block.id)
    setDraft({ ...json.block.data })
    setPickerOpen(false)
    setPreviewKey((key) => key + 1)
    toast({ message: `Added ${byType[type]?.label || type}` })
  }

  async function commitOrder(next: Block[]) {
    setBlocks(next)
    await fetch('/api/admin/blocks', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ page_id: page.id, order: next.map((block) => block.id) }),
    })
    setPreviewKey((key) => key + 1)
  }

  function moveBlock(index: number, delta: number) {
    const target = index + delta
    if (target < 0 || target >= blocks.length) return
    const next = [...blocks]
    ;[next[index], next[target]] = [next[target], next[index]]
    void commitOrder(next)
  }

  function onDrop(index: number) {
    if (dragIndex === null || dragIndex === index) return
    const next = [...blocks]
    const [moved] = next.splice(dragIndex, 1)
    next.splice(index, 0, moved)
    setDragIndex(null)
    void commitOrder(next)
  }

  async function savePage() {
    const res = await fetch(`/api/admin/pages/${page.id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(pageDraft),
    })
    if (res.ok) toast({ message: 'Page settings saved' })
    else toast({ message: 'Could not save page settings', error: true })
  }

  const grouped = useMemo(() => {
    const map = new Map<string, BlockCatalogItem[]>()
    for (const item of catalog) {
      if (!map.has(item.group)) map.set(item.group, [])
      map.get(item.group)!.push(item)
    }
    return [...map.entries()]
  }, [catalog])

  return (
    <>
      <div className="adm-bar">
        <div className="adm-bar__left">
          <span className="adm-bar__title">{page.title}</span>
          <span className="adm-bar__sub">
            /{page.slug} · {blocks.length} blocks · {blocks.filter((b) => b.enabled).length} visible
          </span>
        </div>
        <div className="adm-bar__actions">
          <a className="adm-btn" href={previewUrl} target="_blank" rel="noreferrer">
            Open page ↗
          </a>
          <button className="adm-btn" type="button" onClick={() => setPreviewKey((key) => key + 1)}>
            Refresh preview
          </button>
          <button className="adm-btn adm-btn--fg" type="button" onClick={saveBlock} disabled={!selected || !dirty || saving}>
            {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
          </button>
        </div>
      </div>

      <div className="adm-body">
        <details className="adm-card">
          <summary style={{ cursor: 'pointer', fontSize: 14, fontWeight: 500 }}>Page settings — title, address, navigation</summary>
          <div className="f-row" style={{ marginTop: 18 }}>
            <div className="f-field">
              <label className="f-label">Page title</label>
              <input
                className="adm-input"
                value={pageDraft.title}
                onChange={(event) => setPageDraft({ ...pageDraft, title: event.target.value })}
              />
            </div>
            <div className="f-field">
              <label className="f-label">Address (slug)</label>
              <input
                className="adm-input"
                value={pageDraft.slug}
                onChange={(event) => setPageDraft({ ...pageDraft, slug: event.target.value })}
              />
              <p className="f-help">Changing this changes the URL. Old links will break.</p>
            </div>
            <div className="f-field f-field--wide">
              <label className="f-label">SEO title</label>
              <input
                className="adm-input"
                value={pageDraft.seo_title}
                onChange={(event) => setPageDraft({ ...pageDraft, seo_title: event.target.value })}
              />
            </div>
            <div className="f-field f-field--wide">
              <label className="f-label">SEO description</label>
              <textarea
                className="adm-textarea"
                rows={2}
                value={pageDraft.seo_description}
                onChange={(event) => setPageDraft({ ...pageDraft, seo_description: event.target.value })}
              />
            </div>
            <div className="f-field">
              <label className="f-label">Menu label</label>
              <input
                className="adm-input"
                value={pageDraft.nav_label}
                onChange={(event) => setPageDraft({ ...pageDraft, nav_label: event.target.value })}
              />
            </div>
            <div className="f-field">
              <label className="f-label">Menu order</label>
              <input
                className="adm-input"
                type="number"
                value={pageDraft.nav_order}
                onChange={(event) => setPageDraft({ ...pageDraft, nav_order: Number(event.target.value) })}
              />
            </div>
            <div className="f-field f-field--wide">
              <label className="adm-check">
                <input
                  type="checkbox"
                  checked={pageDraft.show_in_nav}
                  onChange={(event) => setPageDraft({ ...pageDraft, show_in_nav: event.target.checked })}
                />
                <span>Show this page in the main navigation</span>
              </label>
            </div>
          </div>
          <div style={{ marginTop: 18 }}>
            <button className="adm-btn adm-btn--fg" type="button" onClick={savePage}>
              Save page settings
            </button>
          </div>
        </details>

        <div className="pe">
          <div className="bl">
            <div className="bl__head">
              <span className="adm-bar__sub" style={{ letterSpacing: '0.12em' }}>
                PAGE STRUCTURE
              </span>
              <button className="adm-btn adm-btn--sm adm-btn--fg" type="button" onClick={() => setPickerOpen(true)}>
                + Add block
              </button>
            </div>
            <div className="bl__list">
              {blocks.length === 0 ? <p className="rp__empty">This page is empty. Add your first block.</p> : null}
              {blocks.map((block, index) => {
                const def = byType[block.type]
                return (
                  <div
                    className={`bl__item${block.id === selectedId ? ' is-active' : ''}${block.enabled ? '' : ' is-off'}`}
                    key={block.id}
                    draggable
                    onDragStart={() => setDragIndex(index)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => onDrop(index)}
                    onClick={() => selectBlock(block)}
                  >
                    <span className="bl__grip" title="Drag to reorder">
                      ⠿
                    </span>
                    <span className="bl__item-body">
                      <span className="bl__item-label">
                        {def?.label || block.type}
                        {block.enabled ? '' : ' (hidden)'}
                      </span>
                      <span className="bl__item-type">{block.type}</span>
                    </span>
                    <span className="bl__tools" onClick={(event) => event.stopPropagation()}>
                      <button className="bl__icon-btn" type="button" title="Move up" onClick={() => moveBlock(index, -1)}>
                        ↑
                      </button>
                      <button className="bl__icon-btn" type="button" title="Move down" onClick={() => moveBlock(index, 1)}>
                        ↓
                      </button>
                      <button
                        className="bl__icon-btn"
                        type="button"
                        title={block.enabled ? 'Hide' : 'Show'}
                        onClick={() => void toggleBlock(block)}
                      >
                        {block.enabled ? '◉' : '○'}
                      </button>
                      <button className="bl__icon-btn" type="button" title="Remove" onClick={() => void removeBlock(block)}>
                        ✕
                      </button>
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            {selected && selectedDef ? (
              <div className="adm-card">
                <div className="adm-card__head">
                  <div>
                    <p className="adm-card__title">{selectedDef.label}</p>
                    <p className="adm-hint">{selectedDef.hint}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="adm-btn adm-btn--sm" type="button" onClick={() => setDraft({ ...selected.data })} disabled={!dirty}>
                      Discard
                    </button>
                    <button className="adm-btn adm-btn--sm adm-btn--fg" type="button" onClick={saveBlock} disabled={!dirty || saving}>
                      {saving ? 'Saving…' : 'Save block'}
                    </button>
                  </div>
                </div>
                <FieldSet fields={selectedDef.fields as FieldDef[]} data={draft} onChange={patchDraft} />
              </div>
            ) : (
              <div className="adm-card">
                <p className="adm-hint">Select a block on the left to edit it, or add a new one.</p>
              </div>
            )}
          </div>
        </div>

        <div className="pe-preview">
          <div className="pe-preview__bar">
            <span>{previewUrl} — live preview</span>
            <button className="adm-btn adm-btn--sm" type="button" onClick={() => setPreviewKey((key) => key + 1)}>
              Reload
            </button>
          </div>
          <iframe key={previewKey} src={previewUrl} title="Page preview" />
        </div>
      </div>

      {pickerOpen ? (
        <div className="adm-modal" onClick={() => setPickerOpen(false)}>
          <div className="adm-modal__panel" onClick={(event) => event.stopPropagation()}>
            <div className="adm-modal__head">
              <span className="adm-modal__title">Add a block</span>
              <button className="adm-btn adm-btn--sm" type="button" onClick={() => setPickerOpen(false)}>
                Close
              </button>
            </div>
            <div className="adm-modal__body">
              <div className="picker">
                {grouped.map(([group, items]) => (
                  <div key={group}>
                    <p className="picker__group-title">{GROUP_LABEL[group] || group}</p>
                    <div className="picker__grid">
                      {items.map((item) => (
                        <button className="picker__item" type="button" key={item.type} onClick={() => void addBlock(item.type)}>
                          <strong>{item.label}</strong>
                          <span>{item.hint}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {toastNode}
    </>
  )
}
