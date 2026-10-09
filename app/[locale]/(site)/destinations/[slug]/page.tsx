import Link from 'next/link'
import { notFound } from 'next/navigation'
import { UniversityCard } from '@/components/cards'
import { Btn, Media } from '@/components/ui'
import { getEntry, getSettings, listEntries } from '@/lib/kernel/content'
import { asList, money } from '@/lib/kernel/ids'
import { i18nFor } from '@/lib/kernel/i18n'
import { markdown } from '@/lib/kernel/md'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params
  const entry = await getEntry('countries', slug)
  if (!entry) return { title: 'Destination not found' }
  return { title: `Study in ${entry.title}`, description: entry.data?.intro }
}

export default async function DestinationPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params
  const [entry, settings, i18n] = await Promise.all([getEntry('countries', slug), getSettings(), i18nFor(locale)])
  if (!entry) notFound()

  const d = entry.data || {}
  const universities = await listEntries('universities', { where: { country: entry.title }, limit: 12 })
  const popular = asList(d.popular_for)
  const tuitionValue = Number(d.tuition_from ?? 0)

  return (
    <main id="main">
      <div className="wrap">
        <div className="detail-hero">
          <nav className="crumbs" style={{ marginBottom: 22 }}>
            <Link href={i18n.href('/destinations')}>{i18n.t('nav.destinations')}</Link>
            <span>/</span>
            <span>{entry.title}</span>
          </nav>

          <h1 className="detail-hero__title">
            {d.flag ? <span style={{ marginRight: 14 }}>{d.flag}</span> : null}
            {i18n.t('detail.studyIn')} {entry.title}
          </h1>
          {d.intro ? <p className="lede">{d.intro}</p> : null}

          <dl className="detail-hero__meta">
            <div>
              <dt>{i18n.t('common.tuitionFrom')}</dt>
              <dd>{tuitionValue ? money(tuitionValue, d.currency) : 'No tuition'}</dd>
            </div>
            {d.living_cost ? (
              <div>
                <dt>{i18n.t('common.living')}</dt>
                <dd>{d.living_cost}</dd>
              </div>
            ) : null}
            {d.intakes ? (
              <div>
                <dt>{i18n.t('common.intakes')}</dt>
                <dd>{d.intakes}</dd>
              </div>
            ) : null}
            <div>
              <dt>{i18n.t('common.partners')}</dt>
              <dd>{universities.length} universities</dd>
            </div>
          </dl>

          {d.cover ? <Media src={d.cover} alt={entry.title} ratio="21 / 9" className="detail-hero__cover" priority /> : null}
        </div>

        <div className="detail-body">
          <div>
            {d.visa ? (
              <>
                <h2 className="h3">{i18n.t('detail.studentVisa')}</h2>
                <div
                  className="prose"
                  style={{ marginTop: 16 }}
                  dangerouslySetInnerHTML={{ __html: markdown(d.visa) }}
                />
              </>
            ) : null}

            {popular.length ? (
              <>
                <h2 className="h3" style={{ marginTop: 46 }}>
                  {i18n.t('detail.popularFor')}
                </h2>
                <ul className="req-list" style={{ marginTop: 18 }}>
                  {popular.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>

          <aside className="detail-body__aside">
            <div className="aside-card">
              <h3>{i18n.t('detail.costs')}</h3>
              <dl className="aside-facts">
                <div>
                  <dt>{i18n.t('common.tuitionFrom')}</dt>
                  <dd>{tuitionValue ? money(tuitionValue, d.currency) : 'No tuition'}</dd>
                </div>
                <div>
                  <dt>{i18n.t('common.living')}</dt>
                  <dd>{d.living_cost || '—'}</dd>
                </div>
                <div>
                  <dt>{i18n.t('common.intakes')}</dt>
                  <dd>{d.intakes || '—'}</dd>
                </div>
              </dl>
            </div>
            <div className="aside-card">
              <h3>{i18n.t('detail.talkToUs')}</h3>
              <p style={{ fontSize: 14, color: 'var(--fg-soft)', marginBottom: 18 }}>
                {i18n.t('detail.talkBlurb')}
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
          </aside>
        </div>
      </div>

      {universities.length ? (
        <section className="sec sec--soft">
          <div className="wrap">
            <header className="sec-head">
              <div className="sec-head__text">
                <p className="label">Partners</p>
                <h2 className="h2">{i18n.t('detail.universitiesIn')} {entry.title}</h2>
              </div>
              <Btn href={`/universities?country=${encodeURIComponent(entry.title)}`} variant="ghost" settings={settings}>
                {i18n.t('detail.filterDirectory')}
              </Btn>
            </header>
            <div className="grid g-3 cards-grid">
              {universities.slice(0, 6).map((item) => (
                <UniversityCard entry={item} i18n={i18n} key={item.id} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  )
}
