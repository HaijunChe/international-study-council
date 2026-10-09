import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ScholarshipCard } from '@/components/cards'
import { Btn, Chip } from '@/components/ui'
import { getEntry, getSettings, listEntries } from '@/lib/kernel/content'
import { asList, daysUntil, formatDate } from '@/lib/kernel/ids'
import { i18nFor } from '@/lib/kernel/i18n'
import { markdown } from '@/lib/kernel/md'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params
  const entry = await getEntry('scholarships', slug)
  if (!entry) return { title: 'Scholarship not found' }
  return { title: entry.title, description: entry.data?.summary }
}

export default async function ScholarshipPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params
  const [entry, settings, i18n] = await Promise.all([getEntry('scholarships', slug), getSettings(), i18nFor(locale)])
  if (!entry) notFound()

  const d = entry.data || {}
  const days = daysUntil(d.deadline)
  const levels = asList(d.levels)
  const countries = asList(d.countries)
  const disciplines = asList(d.disciplines)

  const related = (await listEntries('scholarships', { limit: 4 })).filter((item) => item.id !== entry.id)

  const applyHref = d.apply_url || '/contact'

  return (
    <main id="main">
      <div className="wrap">
        <div className="detail-hero">
          <nav className="crumbs" style={{ marginBottom: 22 }}>
            <Link href={i18n.href('/scholarships')}>{i18n.t('nav.scholarships')}</Link>
            <span>/</span>
            <span>{d.provider_type || 'Award'}</span>
          </nav>

          <h1 className="detail-hero__title">{entry.title}</h1>
          {d.summary ? <p className="lede">{d.summary}</p> : null}

          <dl className="detail-hero__meta">
            {d.provider ? (
              <div>
                <dt>{i18n.t('common.providedBy')}</dt>
                <dd>{d.provider}</dd>
              </div>
            ) : null}
            {d.amount ? (
              <div>
                <dt>{i18n.t('common.amount')}</dt>
                <dd>{d.amount}</dd>
              </div>
            ) : null}
            <div>
              <dt>{i18n.t('common.deadline')}</dt>
              <dd>
                {d.deadline ? formatDate(d.deadline) : i18n.t('common.anytime')}
                {days !== null && days >= 0 ? (
                  <span style={{ color: 'var(--fg-muted)', fontWeight: 400, marginLeft: 8 }}>
                    {days === 0 ? i18n.t('common.closesToday') : days + ' ' + i18n.t('common.daysLeft')}
                  </span>
                ) : null}
              </dd>
            </div>
            {d.award_type ? (
              <div>
                <dt>{i18n.t('common.awardType')}</dt>
                <dd>{d.award_type}</dd>
              </div>
            ) : null}
          </dl>

          {levels.length || countries.length || disciplines.length ? (
            <div className="chips" style={{ marginTop: 26 }}>
              {levels.map((level) => (
                <Chip key={level} tone="ink">
                  {level}
                </Chip>
              ))}
              {countries.map((country) => (
                <Chip key={country}>{country}</Chip>
              ))}
              {disciplines.map((discipline) => (
                <Chip key={discipline}>{discipline}</Chip>
              ))}
            </div>
          ) : null}
        </div>

        <div className="detail-body">
          <div>
            <h2 className="h3">{i18n.t('detail.eligibility')}</h2>
            <div
              className="prose"
              style={{ marginTop: 16 }}
              dangerouslySetInnerHTML={{ __html: markdown(d.eligibility || d.summary || '') }}
            />

            <h2 className="h3" style={{ marginTop: 46 }}>
              {i18n.t('detail.howToApply')}
            </h2>
            <ol className="req-list" style={{ marginTop: 18, listStyle: 'none' }}>
              <li>Check the eligibility above against your profile — we can do this with you for free.</li>
              <li>
                {d.provider_type === 'University'
                  ? 'Apply for admission first. Merit awards are assessed automatically with your application file.'
                  : 'Prepare the separate application, which usually opens months before admission.'}
              </li>
              <li>Submit before the deadline, with all supporting documents translated where required.</li>
              <li>Tell us when you apply — we track the outcome and can follow up with the provider.</li>
            </ol>
          </div>

          <aside className="detail-body__aside">
            <div className="aside-card">
              <h3>{i18n.t('detail.keyFacts')}</h3>
              <dl className="aside-facts">
                {d.provider ? (
                  <div>
                    <dt>{i18n.t('common.providedBy')}</dt>
                    <dd>{d.provider}</dd>
                  </div>
                ) : null}
                {d.provider_type ? (
                  <div>
                    <dt>{i18n.t('common.providerType')}</dt>
                    <dd>{d.provider_type}</dd>
                  </div>
                ) : null}
                <div>
                  <dt>{i18n.t('common.award')}</dt>
                  <dd>{d.amount || '—'}</dd>
                </div>
                <div>
                  <dt>{i18n.t('common.deadline')}</dt>
                  <dd>{d.deadline ? formatDate(d.deadline) : i18n.t('common.anytime')}</dd>
                </div>
                {countries.length ? (
                  <div>
                    <dt>{i18n.t('common.countries')}</dt>
                    <dd>{countries.join(', ')}</dd>
                  </div>
                ) : null}
              </dl>
            </div>

            <div className="aside-card">
              <h3>{i18n.t('detail.nextStep')}</h3>
              <p style={{ fontSize: 14, color: 'var(--fg-soft)', marginBottom: 18 }}>
                {i18n.t('detail.eligibilityBlurb')}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {d.apply_url ? (
                  <a className="btn btn--fg btn--full" href={applyHref} target="_blank" rel="noopener noreferrer">
                    <span>{i18n.t('detail.officialApplication')}</span>
                  </a>
                ) : null}
                <Btn href="/contact" variant={d.apply_url ? 'ghost' : 'ink'} settings={settings} full>
                  {i18n.t('detail.checkEligibility')}
                </Btn>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {related.length ? (
        <section className="sec sec--soft">
          <div className="wrap">
            <header className="sec-head">
              <div className="sec-head__text">
                <p className="label">{i18n.t('detail.alsoOpen')}</p>
                <h2 className="h2">{i18n.t('detail.otherFunding')}</h2>
              </div>
              <Btn href="/scholarships" variant="ghost" settings={settings}>
                {i18n.t('detail.allScholarships')}
              </Btn>
            </header>
            <div className="grid g-3 cards-grid">
              {related.slice(0, 3).map((item) => (
                <ScholarshipCard entry={item} i18n={i18n} key={item.id} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  )
}
