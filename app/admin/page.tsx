import Link from 'next/link'
import { dashboardStats, listLeads, listPages } from '@/lib/kernel/content'
import { allCollections } from '@/lib/kernel/types'
import { countEntries } from '@/lib/kernel/content'
import '@/lib/kernel/collections'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const [stats, pages, leads, counts] = await Promise.all([
    dashboardStats(),
    listPages(),
    listLeads(),
    countEntries(),
  ])

  const recentLeads = leads.slice(0, 5)
  const collections = allCollections()

  return (
    <>
      <div className="adm-bar">
        <div className="adm-bar__left">
          <span className="adm-bar__title">Dashboard</span>
          <span className="adm-bar__sub">Everything you publish goes live straight away</span>
        </div>
        <div className="adm-bar__actions">
          <Link className="adm-btn" href="/admin/pages">
            Edit pages
          </Link>
          <Link className="adm-btn adm-btn--fg" href="/admin/c/universities/new">
            + Add university
          </Link>
        </div>
      </div>

      <div className="adm-body">
        <div className="adm-grid">
          <div className="adm-stat">
            <span className="adm-stat__value">{stats.newLeads}</span>
            <span className="adm-stat__label">New enquiries</span>
          </div>
          <div className="adm-stat">
            <span className="adm-stat__value">{stats.leads}</span>
            <span className="adm-stat__label">Enquiries all time</span>
          </div>
          <div className="adm-stat">
            <span className="adm-stat__value">{stats.pages}</span>
            <span className="adm-stat__label">Pages</span>
          </div>
          <div className="adm-stat">
            <span className="adm-stat__value">{stats.entries}</span>
            <span className="adm-stat__label">Collection records</span>
          </div>
        </div>

        <div className="adm-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          <section className="adm-card">
            <div className="adm-card__head">
              <p className="adm-card__title">Your content collections</p>
              <Link className="adm-btn adm-btn--sm" href="/admin/c/universities">
                Open
              </Link>
            </div>
            <div className="act-list">
              {collections.map((collection) => (
                <div className="act-item" key={collection.name}>
                  <span className="act-item__what">
                    <Link href={`/admin/c/${collection.name}`} style={{ fontWeight: 500 }}>
                      {collection.label}
                    </Link>
                  </span>
                  <span className="act-item__when">{counts[collection.name] ?? 0} records</span>
                </div>
              ))}
            </div>
          </section>

          <section className="adm-card">
            <div className="adm-card__head">
              <p className="adm-card__title">Latest enquiries</p>
              <Link className="adm-btn adm-btn--sm" href="/admin/leads">
                All enquiries
              </Link>
            </div>
            {recentLeads.length ? (
              <div className="act-list">
                {recentLeads.map((lead) => (
                  <div className="act-item" key={lead.id}>
                    <span className="act-item__what">
                      <span style={{ fontWeight: 500 }}>{lead.name || lead.email}</span>
                      <span className={`tag ${lead.status === 'new' ? 'tag--new' : 'tag--off'}`}>{lead.status}</span>
                    </span>
                    <span className="act-item__when">
                      {[lead.country, lead.level].filter(Boolean).join(' · ') || '—'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="adm-hint">
                No enquiries yet. They will appear here the moment someone submits the form on your site.
              </p>
            )}
          </section>

          <section className="adm-card">
            <div className="adm-card__head">
              <p className="adm-card__title">Pages</p>
              <Link className="adm-btn adm-btn--sm" href="/admin/pages">
                Manage
              </Link>
            </div>
            <div className="act-list">
              {pages.map((page) => (
                <div className="act-item" key={page.id}>
                  <span className="act-item__what">
                    <Link href={`/admin/pages/${page.id}`} style={{ fontWeight: 500 }}>
                      {page.title}
                    </Link>
                  </span>
                  <span className="act-item__when">/{page.slug}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="adm-card">
            <div className="adm-card__head">
              <p className="adm-card__title">Recent activity</p>
            </div>
            {stats.recent.length ? (
              <div className="act-list">
                {stats.recent.map((row, index) => (
                  <div className="act-item" key={index}>
                    <span className="act-item__what">
                      <span className="act-item__action">{row.action}</span>
                      <span style={{ fontSize: 12.5 }}>{row.actor || 'system'}</span>
                    </span>
                    <span className="act-item__when">
                      {new Date(row.created_at).toLocaleString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="adm-hint">Changes you make will be logged here.</p>
            )}
          </section>
        </div>

        <div className="adm-card">
          <p className="adm-card__title" style={{ marginBottom: 10 }}>
            How the site is put together
          </p>
          <p className="adm-hint" style={{ maxWidth: '80ch' }}>
            Every page is a stack of blocks. Open a page to reorder, hide or edit them. Content that repeats — universities,
            scholarships, destinations, services, advisors, guides — lives in the collections above, and the blocks on your
            pages read from them. Change a tuition figure once and it updates on the home page, the directory and the
            university page at the same time.
          </p>
        </div>
      </div>
    </>
  )
}
