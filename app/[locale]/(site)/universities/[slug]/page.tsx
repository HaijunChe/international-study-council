import Link from 'next/link'
import { notFound } from 'next/navigation'
import { UniversityCard } from '@/components/cards'
import { Btn, Chip, Media } from '@/components/ui'
import { getEntry, getSettings, listEntries } from '@/lib/kernel/content'
import { asArray, asList, money } from '@/lib/kernel/ids'
import { i18nFor } from '@/lib/kernel/i18n'
import { markdown } from '@/lib/kernel/md'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params
  const entry = await getEntry('universities', slug)
  if (!entry) return { title: 'University not found' }
  return {
    title: `${entry.title}, ${entry.data?.country || ''}`.replace(/, $/, ''),
    description: entry.data?.summary,
  }
}

export default async function UniversityPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params
  const [entry, settings, i18n] = await Promise.all([getEntry('universities', slug), getSettings(), i18nFor(locale)])
  if (!entry) notFound()

  const d = entry.data || {}
  const programs = asArray<any>(d.programs)
  const levels = asList(d.levels)
  const disciplines = asList(d.disciplines)
  const requirements = String(d.requirements || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const related = (await listEntries('universities', { where: { country: d.country }, limit: 4 })).filter(
    (item) => item.id !== entry.id,
  )

  const tuitionValue = Number(d.tuition_from ?? 0)

  return (
    <main id="main">
      <div className="wrap">
        <div className="detail-hero">
          <div className="detail-hero__top">
            <nav className="crumbs">
              <Link href={i18n.href('/universities')}>{i18n.t('nav.universities')}</Link>
              <span>/</span>
              <span>{d.country}</span>
            </nav>
          </div>

          <div className="detail-hero__top" style={{ marginBottom: 0 }}>
            <span className="badge" style={{ minWidth: 46, height: 46 }}>
              {d.abbr || entry.title.slice(0, 3).toUpperCase()}
            </span>
          </div>

          <h1 className="detail-hero__title" style={{ marginTop: 22 }}>
            {entry.title}
          </h1>

          {d.summary ? <p className="lede">{d.summary}</p> : null}

          <dl className="detail-hero__meta">
            {d.city ? (
              <div>
                <dt>{i18n.t('common.location')}</dt>
                <dd>{d.city}</dd>
              </div>
            ) : null}
            {d.ownership ? (
              <div>
                <dt>{i18n.t('common.type')}</dt>
                <dd>{d.ownership}</dd>
              </div>
            ) : null}
            {d.ranking ? (
              <div>
                <dt>{i18n.t('common.ranking')}</dt>
                <dd>{d.ranking}</dd>
              </div>
            ) : null}
            {d.founded ? (
              <div>
                <dt>{i18n.t('common.founded')}</dt>
                <dd>{d.founded}</dd>
              </div>
            ) : null}
            <div>
              <dt>{i18n.t('common.tuitionFrom')}</dt>
              <dd>{tuitionValue ? money(tuitionValue, d.currency) : i18n.t('common.noTuition')}</dd>
            </div>
          </dl>

          {levels.length || disciplines.length ? (
            <div className="chips" style={{ marginTop: 26 }}>
              {levels.map((level) => (
                <Chip key={level} tone="ink">
                  {level}
                </Chip>
              ))}
              {disciplines.map((discipline) => (
                <Chip key={discipline}>{discipline}</Chip>
              ))}
            </div>
          ) : null}

          {d.cover ? (
            <Media src={d.cover} alt={entry.title} ratio="21 / 9" className="detail-hero__cover" priority />
          ) : null}
        </div>

        <div className="detail-body">
          <div>
            {d.about ? (
              <>
                <h2 className="h3">{i18n.t('detail.about')} {entry.title}</h2>
                <div
                  className="prose"
                  style={{ marginTop: 16 }}
                  dangerouslySetInnerHTML={{ __html: markdown(d.about) }}
                />
              </>
            ) : null}

            {programs.length ? (
              <>
                <h2 className="h3" style={{ marginTop: 46 }}>
                  {i18n.t('detail.programmes')}
                </h2>
                <table className="program-table">
                  <thead>
                    <tr>
                      <th>{i18n.t('common.programme')}</th>
                      <th>{i18n.t('common.level')}</th>
                      <th>{i18n.t('common.duration')}</th>
                      <th>{i18n.t('common.tuitionFrom')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {programs.map((program, index) => (
                      <tr key={index}>
                        <td>{program.name}</td>
                        <td>{program.level}</td>
                        <td>{program.duration}</td>
                        <td>{program.tuition}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : null}

            {requirements.length ? (
              <>
                <h2 className="h3" style={{ marginTop: 46 }}>
                  {i18n.t('detail.entryRequirements')}
                </h2>
                <ul className="req-list" style={{ marginTop: 18 }}>
                  {requirements.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>

          <aside className="detail-body__aside">
            <div className="aside-card">
              <h3>{i18n.t('detail.atAGlance')}</h3>
              <dl className="aside-facts">
                <div>
                  <dt>{i18n.t('common.country')}</dt>
                  <dd>{d.country}</dd>
                </div>
                {d.city ? (
                  <div>
                    <dt>{i18n.t('common.campus')}</dt>
                    <dd>{d.city}</dd>
                  </div>
                ) : null}
                <div>
                  <dt>{i18n.t('common.tuitionFrom')}</dt>
                  <dd>{tuitionValue ? money(tuitionValue, d.currency) : i18n.t('common.noTuition')}</dd>
                </div>
                {d.ownership ? (
                  <div>
                    <dt>{i18n.t('common.type')}</dt>
                    <dd>{d.ownership}</dd>
                  </div>
                ) : null}
              </dl>
            </div>

            <div className="aside-card">
              <h3>{i18n.t('detail.applyWithUs')}</h3>
              <p style={{ fontSize: 14, color: 'var(--fg-soft)', marginBottom: 18 }}>
                {i18n.t('detail.applyBlurb')}
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

            {d.website ? (
              <div className="aside-card">
                <h3>{i18n.t('detail.officialSite')}</h3>
                <a
                  href={d.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 14, wordBreak: 'break-all', color: 'var(--accent)' }}
                >
                  {String(d.website).replace(/^https?:\/\//, '')}
                </a>
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
                <p className="label">{i18n.t('detail.alsoIn')} {d.country}</p>
                <h2 className="h2">{i18n.t('detail.otherUniversities')} {d.country}</h2>
              </div>
              <Btn href="/universities" variant="ghost" settings={settings}>
                {i18n.t('detail.allUniversities')}
              </Btn>
            </header>
            <div className="grid g-3 cards-grid">
              {related.slice(0, 3).map((item) => (
                <UniversityCard entry={item} i18n={i18n} key={item.id} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  )
}
