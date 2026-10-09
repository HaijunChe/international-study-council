import type { Metadata } from 'next'
import Link from 'next/link'
import AdminLogin from '@/components/admin/AdminLogin'
import AdminNav from '@/components/admin/AdminNav'
import SignOutButton from '@/components/admin/SignOutButton'
import { currentUser } from '@/lib/kernel/auth'
import { countEntries, getSettings, listLeads, listPages } from '@/lib/kernel/content'
import { allCollections } from '@/lib/kernel/types'
import '@/lib/kernel/collections'
import './admin.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Content manager',
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, settings] = await Promise.all([currentUser(), getSettings()])

  if (!user) return <AdminLogin siteName={settings.identity.site_name} />

  const [counts, pages, leads] = await Promise.all([countEntries(), listPages(), listLeads()])
  const newLeads = leads.filter((lead) => lead.status === 'new').length

  const groups = [
    {
      title: 'Overview',
      items: [{ href: '/admin', label: 'Dashboard' }],
    },
    {
      title: 'Pages',
      items: [{ href: '/admin/pages', label: 'All pages', count: pages.length }],
    },
    {
      title: 'Collections',
      items: allCollections().map((collection) => ({
        href: `/admin/c/${collection.name}`,
        label: collection.label,
        count: counts[collection.name] ?? 0,
      })),
    },
    {
      title: 'Enquiries',
      items: [{ href: '/admin/leads', label: 'Enquiries', count: newLeads }],
    },
    {
      title: 'Configuration',
      items: [
        { href: '/admin/settings', label: 'Site settings' },
        { href: '/admin/languages', label: 'Languages' },
      ],
    },
  ]

  return (
    <div className="adm">
      <aside className="adm-side">
        <Link className="adm-brand" href="/admin">
          <span className="adm-brand__mark">{settings.identity.logo_text || settings.identity.site_short || 'ISC'}</span>
          <span className="adm-brand__text">
            <strong>{settings.identity.site_name}</strong>
            <span>Content manager</span>
          </span>
        </Link>

        <AdminNav groups={groups} />

        <div className="adm-side__foot">
          <a className="adm-btn adm-btn--sm" href="/" target="_blank" rel="noreferrer">
            View live site ↗
          </a>
          <p className="adm-user">
            {user.name || 'Signed in'}
            <br />
            {user.email}
          </p>
          <SignOutButton />
        </div>
      </aside>

      <main className="adm-main">{children}</main>
    </div>
  )
}
