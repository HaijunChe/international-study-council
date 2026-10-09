'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export type AdminNavItem = { href: string; label: string; count?: number }

export default function AdminNav({ groups }: { groups: Array<{ title: string; items: AdminNavItem[] }> }) {
  const pathname = usePathname()

  return (
    <>
      {groups.map((group) => (
        <div className="adm-group" key={group.title}>
          <p className="adm-group__title">{group.title}</p>
          {group.items.map((item) => {
            const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
            return (
              <Link className={`adm-nav-item${active ? ' is-active' : ''}`} href={item.href} key={item.href}>
                <span>{item.label}</span>
                {typeof item.count === 'number' ? <span className="adm-nav-item__count">{item.count}</span> : null}
              </Link>
            )
          })}
        </div>
      ))}
    </>
  )
}
