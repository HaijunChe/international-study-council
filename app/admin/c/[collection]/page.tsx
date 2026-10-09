import Link from 'next/link'
import { notFound } from 'next/navigation'
import { listEntries } from '@/lib/kernel/content'
import { getCollection } from '@/lib/kernel/types'
import '@/lib/kernel/collections'

export const dynamic = 'force-dynamic'

function cell(value: any, key: string) {
  if (value === null || value === undefined || value === '') return <span className="adm-table__muted">—</span>
  if (typeof value === 'boolean') {
    return value ? <span className="tag tag--ok">yes</span> : <span className="tag tag--off">no</span>
  }
  if (Array.isArray(value)) return <span className="adm-table__muted">{value.slice(0, 3).join(', ')}</span>
  if (key === 'deadline') {
    const date = new Date(String(value))
    if (!Number.isNaN(date.getTime())) {
      return <span className="adm-table__muted">{date.toLocaleDateString('en-GB')}</span>
    }
  }
  return <span>{String(value)}</span>
}

export default async function CollectionList({
  params,
}: {
  params: Promise<{ collection: string }>
}) {
  const { collection: name } = await params
  const def = getCollection(name)
  if (!def) notFound()

  const entries = await listEntries(name, { limit: 200 })

  return (
    <>
      <div className="adm-bar">
        <div className="adm-bar__left">
          <span className="adm-bar__title">{def.label}</span>
          <span className="adm-bar__sub">
            {entries.length} records · {def.hint}
          </span>
        </div>
        <div className="adm-bar__actions">
          <Link className="adm-btn adm-btn--fg" href={`/admin/c/${name}/new`}>
            + New {def.singular.toLowerCase()}
          </Link>
        </div>
      </div>

      <div className="adm-body">
        <div className="adm-card adm-card--flush">
          {entries.length ? (
            <table className="adm-table">
              <thead>
                <tr>
                  <th>{def.singular}</th>
                  {def.columns.map((column) => (
                    <th key={column}>{column.replace(/_/g, ' ')}</th>
                  ))}
                  <th />
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="adm-table__title">{entry.title}</td>
                    {def.columns.map((column) => (
                      <td key={column}>{cell(entry.data?.[column], column)}</td>
                    ))}
                    <td>
                      <Link className="adm-btn adm-btn--sm" href={`/admin/c/${name}/${entry.id}`}>
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="adm-empty">
              No {def.label.toLowerCase()} yet.{' '}
              <Link href={`/admin/c/${name}/new`} style={{ textDecoration: 'underline' }}>
                Add the first one
              </Link>
              .
            </p>
          )}
        </div>
        <p className="adm-hint">
          These records feed the blocks on your pages. Blocks read them live, so nothing needs to be re-entered twice.
        </p>
      </div>
    </>
  )
}
