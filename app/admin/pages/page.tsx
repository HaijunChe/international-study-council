import Link from 'next/link'
import CreatePage from '@/components/admin/CreatePage'
import { listBlocks, listPages } from '@/lib/kernel/content'

export const dynamic = 'force-dynamic'

export default async function AdminPages() {
  const pages = await listPages()
  const counts = await Promise.all(pages.map(async (page) => (await listBlocks(page.id)).length))

  return (
    <>
      <div className="adm-bar">
        <div className="adm-bar__left">
          <span className="adm-bar__title">Pages</span>
          <span className="adm-bar__sub">Each page is a stack of blocks you can reorder, hide or rewrite</span>
        </div>
        <div className="adm-bar__actions">
          <CreatePage />
        </div>
      </div>

      <div className="adm-body">
        <div className="adm-card adm-card--flush">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Page</th>
                <th>Address</th>
                <th>Blocks</th>
                <th>In menu</th>
                <th>Last changed</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {pages.map((page, index) => (
                <tr key={page.id}>
                  <td className="adm-table__title">{page.title}</td>
                  <td className="adm-table__muted">/{page.slug === 'home' ? '' : page.slug}</td>
                  <td className="adm-table__muted">{counts[index]}</td>
                  <td>
                    {page.show_in_nav ? (
                      <span className="tag tag--ok">{page.nav_label || page.title}</span>
                    ) : (
                      <span className="tag tag--off">hidden</span>
                    )}
                  </td>
                  <td className="adm-table__muted">
                    {page.updated_at
                      ? new Date(page.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—'}
                  </td>
                  <td>
                    <Link className="adm-btn adm-btn--sm" href={`/admin/pages/${page.id}`}>
                      Edit blocks
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="adm-hint">
          Tip: a page with <strong>In menu</strong> hidden is still reachable by its address — useful for landing pages you
          link to from ads or WhatsApp.
        </p>
      </div>
    </>
  )
}
