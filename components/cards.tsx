import Link from 'next/link'
import { Arrow, Chip, Media } from './ui'
import Icon, { iconForService } from './Icon'
import { asList, daysUntil, formatDate, money } from '@/lib/kernel/ids'
import type { Entry, I18n } from '@/lib/kernel/types'

export function TuitionLabel({ entry, i18n }: { entry: Entry; i18n: I18n }) {
  const value = Number(entry.data?.tuition_from ?? 0)
  const currency = String(entry.data?.currency || 'USD')
  if (!value) return <span className="tuition tuition--free">{i18n.t('common.noTuition')}</span>
  return (
    <span className="tuition">
      {i18n.t('common.from')} <strong>{money(value, currency)}</strong>
      <em> {i18n.t('common.perYear')}</em>
    </span>
  )
}

export function UniversityCard({ entry, i18n }: { entry: Entry; i18n: I18n }) {
  const d = entry.data || {}
  return (
    <Link className="card u-card" href={i18n.href(`/universities/${entry.slug}`)}>
      <div className="u-card__top">
        {d.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="u-card__logo" src={d.logo} alt="" loading="lazy" />
        ) : (
          <span className="badge">{d.abbr || entry.title.slice(0, 3).toUpperCase()}</span>
        )}
        <span className="u-card__country">{d.country}</span>
      </div>
      <h3 className="u-card__name">{entry.title}</h3>
      {d.city ? <p className="u-card__city">{d.city}</p> : null}
      {d.summary ? <p className="u-card__summary clamp-2">{d.summary}</p> : null}
      <div className="u-card__foot">
        <TuitionLabel entry={entry} i18n={i18n} />
        <span className="card__go">
          <Arrow />
        </span>
      </div>
    </Link>
  )
}

export function ScholarshipCard({ entry, i18n }: { entry: Entry; i18n: I18n }) {
  const d = entry.data || {}
  const days = daysUntil(d.deadline)
  const urgent = days !== null && days >= 0 && days <= 45
  const deadline = !d.deadline
    ? i18n.t('common.anytime')
    : days !== null && days < 0
      ? i18n.t('common.closed')
      : formatDate(d.deadline)
  return (
    <Link className="card s-card" href={i18n.href(`/scholarships/${entry.slug}`)}>
      <div className="s-card__top">
        <span className={`s-card__deadline${urgent ? ' is-urgent' : ''}`}>{deadline}</span>
      </div>
      <h3 className="s-card__name">{entry.title}</h3>
      {d.provider ? <p className="s-card__provider">{d.provider}</p> : null}
      {d.amount ? <p className="s-card__amount">{d.amount}</p> : null}
      <span className="card__go">
        <Arrow />
      </span>
    </Link>
  )
}

export function ServiceCard({ entry }: { entry: Entry }) {
  const d = entry.data || {}
  const icon = iconForService(String(d.category || ''), entry.title)
  return (
    <article className="card sv-card">
      <div className="sv-card__top">
        <span className="sv-card__icon">
          <Icon name={icon} size={18} />
        </span>
        {d.price ? <span className="sv-card__price">{d.price}</span> : null}
      </div>
      <h3 className="sv-card__name">{entry.title}</h3>
      {d.outcome ? <p className="sv-card__outcome">{d.outcome}</p> : null}
      {d.duration ? <p className="sv-card__duration">{d.duration}</p> : null}
    </article>
  )
}

export function CountryCard({ entry, i18n }: { entry: Entry; i18n: I18n }) {
  const d = entry.data || {}
  const value = Number(d.tuition_from ?? 0)
  const currency = String(d.currency || 'USD')
  return (
    <Link className="card c-card" href={i18n.href(`/destinations/${entry.slug}`)}>
      <div className="c-card__top">
        <span className="c-card__flag">{d.flag}</span>
        <span className="card__go">
          <Arrow />
        </span>
      </div>
      <h3 className="c-card__name">{entry.title}</h3>
      <dl className="c-card__facts">
        <div>
          <dt>{i18n.t('common.tuitionFrom')}</dt>
          <dd>{value ? money(value, currency) : i18n.t('common.noTuition')}</dd>
        </div>
        {d.intakes ? (
          <div>
            <dt>{i18n.t('common.intakes')}</dt>
            <dd>{d.intakes}</dd>
          </div>
        ) : null}
      </dl>
    </Link>
  )
}

export function AdvisorCard({ entry }: { entry: Entry }) {
  const d = entry.data || {}
  return (
    <article className="card a-card">
      {d.photo ? (
        <Media src={d.photo} alt={entry.title} ratio="1 / 1" className="a-card__photo" />
      ) : (
        <div className="a-card__photo a-card__photo--blank" aria-hidden="true">
          <span>{entry.title.slice(0, 1)}</span>
        </div>
      )}
      <h3 className="a-card__name">{entry.title}</h3>
      <p className="a-card__role">{d.role}</p>
      {d.focus ? <p className="a-card__focus">{d.focus}</p> : null}
      <div className="a-card__links">
        {d.email ? <a href={`mailto:${d.email}`}>Email</a> : null}
        {d.linkedin ? (
          <a href={d.linkedin} target="_blank" rel="noopener noreferrer">
            LinkedIn
          </a>
        ) : null}
      </div>
    </article>
  )
}

export function PostCard({ entry, i18n, layout = 'list' }: { entry: Entry; i18n: I18n; layout?: 'list' | 'grid' }) {
  const d = entry.data || {}
  const tags = asList(d.tags)
  return (
    <Link className={`card p-card p-card--${layout}`} href={i18n.href(`/blog/${entry.slug}`)}>
      {layout === 'grid' && d.cover ? <Media src={d.cover} alt={entry.title} ratio="16 / 9" /> : null}
      <div className="p-card__body">
        <div className="p-card__meta">
          <time>{formatDate(d.published_at)}</time>
          {d.read_minutes ? (
            <span>
              {d.read_minutes} {i18n.t('detail.minRead')}
            </span>
          ) : null}
        </div>
        <h3 className="p-card__title">{entry.title}</h3>
        {d.excerpt ? <p className="p-card__excerpt clamp-2">{d.excerpt}</p> : null}
        {tags.length ? (
          <div className="chips">
            {tags.slice(0, 2).map((tag) => (
              <Chip key={tag}>{tag}</Chip>
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  )
}
