import { getSettings, navPages } from '@/lib/kernel/content'
import { LOCALES, getDict, localePath } from '@/lib/kernel/i18n'
import NavMenu from '@/components/NavMenu'
import Reveal from '@/components/Reveal'
import SiteFooter from '@/components/SiteFooter'

export const dynamic = 'force-dynamic'

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale: rawLocale } = await params
  const [settings, pages, dict] = await Promise.all([getSettings(), navPages(), getDict(rawLocale)])
  const locale = dict.locale
  const href = (path: string) => localePath(locale, path)

  const items = pages.map((page) => ({
    href: href(`/${page.slug}`),
    label: dict.t(`nav.${page.slug}`, page.nav_label || page.title),
  }))

  const enabled: string[] = settings.languages?.enabled?.length ? settings.languages.enabled : ['en']
  const locales = LOCALES.filter((item) => enabled.includes(item.code)).map((item) => ({
    code: item.code,
    label: item.label,
    english: item.english,
    flag: item.flag,
  }))

  const accent = settings.theme?.accent || '#1B48D6'
  const accentInk = settings.theme?.accent_ink || '#0F2E8C'

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `:root{--accent:${accent};--accent-strong:${accentInk}}` }} />
      <NavMenu
        items={items}
        siteName={settings.identity.site_name}
        logoText={settings.identity.logo_text || settings.identity.site_short}
        ctaHref={href('/apply')}
        ctaLabel={dict.t('cta.startApplication')}
        locale={locale}
        locales={locales}
        langLabel={dict.t('lang.switch')}
        searchLabels={{
          placeholder: dict.t('search.placeholder'),
          open: dict.t('search.open'),
          close: dict.t('search.close'),
          empty: dict.t('search.empty'),
          hint: dict.t('search.hint'),
          noResults: dict.t('search.noResults'),
          searching: dict.t('search.searching'),
        }}
      />
      {children}
      <SiteFooter locale={locale} />
      <Reveal />
    </>
  )
}
