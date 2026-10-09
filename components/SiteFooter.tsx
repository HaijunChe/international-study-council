import Link from 'next/link'
import { getSettings } from '@/lib/kernel/content'
import { getDict, localePath } from '@/lib/kernel/i18n'

/* Brand marks, filled rather than stroked so they read at 16px. */
const ICONS = {
  linkedin: 'M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14Zm1.78 13.02H3.55V9h3.57v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z',
  whatsapp:
    'M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35ZM12.04 21.8h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.9-9.88a9.83 9.83 0 0 1 7 2.9 9.82 9.82 0 0 1 2.9 6.99c0 5.45-4.45 9.88-9.9 9.88Zm8.42-18.3A11.8 11.8 0 0 0 12.04 0C5.5 0 .17 5.32.17 11.87c0 2.09.55 4.13 1.59 5.93L.07 24l6.34-1.66a11.86 11.86 0 0 0 5.63 1.43h.01c6.54 0 11.87-5.32 11.87-11.87 0-3.17-1.24-6.15-3.48-8.39Z',
  facebook:
    'M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.96h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07Z',
  instagram:
    'M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16ZM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63a5.9 5.9 0 0 0-2.13 1.38A5.9 5.9 0 0 0 .63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91a5.9 5.9 0 0 0 1.38 2.13 5.9 5.9 0 0 0 2.13 1.38c.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.9 5.9 0 0 0 2.13-1.38 5.9 5.9 0 0 0 1.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.9 5.9 0 0 0-1.38-2.13A5.9 5.9 0 0 0 19.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0Zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32Zm0 10.16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm7.85-10.4a1.44 1.44 0 1 1-2.88 0 1.44 1.44 0 0 1 2.88 0Z',
  mail: 'M2 4h20v16H2V4Zm2.4 1.6L12 11.2l7.6-5.6H4.4ZM3.6 6.9V18.4h16.8V6.9L12 12.9 3.6 6.9Z',
}

type SocialKey = keyof typeof ICONS

/**
 * Footer layout follows the reference: a stack of small mono lines on the
 * left, and a row of icon links on the right. Deliberately quiet.
 */
export default async function SiteFooter({ locale }: { locale: string }) {
  const [settings, dict] = await Promise.all([getSettings(), getDict(locale)])
  const t = dict.t
  const href = (path: string) => localePath(dict.locale, path)

  const { social, contact, identity } = settings
  const wa = String(contact.whatsapp || '').replace(/[^\d]/g, '')
  const year = new Date().getFullYear()

  const links: Array<{ key: SocialKey; label: string; href: string }> = []
  if (contact.email) links.push({ key: 'mail', label: contact.email, href: `mailto:${contact.email}` })
  if (wa) links.push({ key: 'whatsapp', label: 'WhatsApp', href: `https://wa.me/${wa}` })
  if (social.linkedin) links.push({ key: 'linkedin', label: 'LinkedIn', href: social.linkedin })
  if (social.facebook) links.push({ key: 'facebook', label: 'Facebook', href: social.facebook })
  if (social.instagram) links.push({ key: 'instagram', label: 'Instagram', href: social.instagram })

  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="site-footer__inner">
          <div className="site-footer__left">
            <div className="site-footer__primary">
              {identity.site_name}
              {contact.address ? ` · ${contact.address}` : ''}
            </div>
            <div>
              <Link href={href('/privacy')}>{t('footer.privacy', 'Privacy')}</Link> ·{' '}
              <Link href={href('/terms')}>{t('footer.terms', 'Terms')}</Link> ·{' '}
              <Link href={href('/contact')}>{t('nav.contact')}</Link>
            </div>
            <div>
              © {year} {identity.site_name}
            </div>
          </div>

          {links.length ? (
            <div className="site-footer__right">
              <div className="site-footer__links">
                {links.map((link) => (
                  <a
                    key={link.key}
                    href={link.href}
                    title={link.label}
                    aria-label={link.label}
                    target={link.href.startsWith('http') ? '_blank' : undefined}
                    rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d={ICONS[link.key]} />
                    </svg>
                    <span>{link.label}</span>
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </footer>
  )
}
