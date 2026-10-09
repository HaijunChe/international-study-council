import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PostCard } from '@/components/cards'
import { Btn, Chip, Media } from '@/components/ui'
import { getEntry, getSettings, listEntries } from '@/lib/kernel/content'
import { asList, formatDate } from '@/lib/kernel/ids'
import { i18nFor } from '@/lib/kernel/i18n'
import { markdown } from '@/lib/kernel/md'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params
  const entry = await getEntry('posts', slug)
  if (!entry) return { title: 'Guide not found' }
  return { title: entry.title, description: entry.data?.excerpt }
}

export default async function PostPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params
  const [entry, settings, i18n] = await Promise.all([getEntry('posts', slug), getSettings(), i18nFor(locale)])
  if (!entry) notFound()

  const d = entry.data || {}
  const tags = asList(d.tags)
  const related = (await listEntries('posts', { limit: 4, order: 'recent' })).filter((item) => item.id !== entry.id)

  return (
    <main id="main">
      <div className="wrap">
        <article className="detail-hero" style={{ maxWidth: 820 }}>
          <nav className="crumbs" style={{ marginBottom: 22 }}>
            <Link href={i18n.href('/blog')}>{i18n.t('nav.guides')}</Link>
            <span>/</span>
            <span>{tags[0] || 'Article'}</span>
          </nav>
          <h1 className="detail-hero__title" style={{ maxWidth: '26ch' }}>
            {entry.title}
          </h1>
          {d.excerpt ? <p className="lede">{d.excerpt}</p> : null}
          <div className="p-card__meta" style={{ marginTop: 24 }}>
            <time>{formatDate(d.published_at)}</time>
            {d.read_minutes ? <span>{d.read_minutes} {i18n.t('detail.minRead')}</span> : null}
            {tags.length ? <span>{tags.join(' · ')}</span> : null}
          </div>
        </article>

        {d.cover ? (
          <Media src={d.cover} alt={entry.title} ratio="21 / 9" priority style={{ marginTop: 34 }} />
        ) : null}

        <div className="detail-body">
          <div className="prose" dangerouslySetInnerHTML={{ __html: markdown(d.body) }} />
          <aside className="detail-body__aside">
            <div className="aside-card">
              <h3>{i18n.t('detail.needHelp')}</h3>
              <p style={{ fontSize: 14, color: 'var(--fg-soft)', marginBottom: 18 }}>
                {i18n.t('detail.needHelpBlurb')}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                <Btn href="/contact" variant="ink" settings={settings} full>
                  {i18n.t('cta.freeAssessment')}
                </Btn>
                <Btn href="whatsapp" variant="ghost" settings={settings} full>
                  {i18n.t('cta.chatWhatsapp')}
                </Btn>
              </div>
            </div>
            {tags.length ? (
              <div className="aside-card">
                <h3>{i18n.t('detail.tags')}</h3>
                <div className="chips" style={{ marginTop: 0 }}>
                  {tags.map((tag) => (
                    <Chip key={tag}>{tag}</Chip>
                  ))}
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      </div>

      {related.length ? (
        <section className="sec sec--soft">
          <div className="wrap">
            <header className="sec-head">
              <div className="sec-head__text">
                <p className="label">{i18n.t('detail.keepReading')}</p>
                <h2 className="h2">{i18n.t('detail.moreGuides')}</h2>
              </div>
              <Btn href="/blog" variant="ghost" settings={settings}>
                {i18n.t('detail.allGuides')}
              </Btn>
            </header>
            <div className="grid g-3 cards-grid">
              {related.slice(0, 3).map((item) => (
                <PostCard entry={item} i18n={i18n} key={item.id} layout="grid" />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  )
}
