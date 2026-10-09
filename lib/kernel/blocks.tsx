/**
 * Kernel · block library
 * ---------------------------------------------------------------------------
 * Every module the owner can drop onto a page. A block is three things:
 * a label, a list of fields, and a renderer. The admin editor is generated
 * from the fields; the renderer is the only place markup lives.
 */

import Link from 'next/link'
import IscMark from '@/components/IscMark'
import Icon, { iconForService, type IconName as WhyIcon } from '@/components/Icon'
import Scrolly from '@/components/Scrolly'
import { AdvisorCard, CountryCard, PostCard, ScholarshipCard, ServiceCard, UniversityCard } from '@/components/cards'
import ApplicationForm from '@/components/ApplicationForm'
import PlanBuilder from '@/components/PlanBuilder'
import { SearchInline } from '@/components/Search'
import FilterBar from '@/components/FilterBar'
import WorldMap from '@/components/WorldMap'
import LeadForm from '@/components/LeadForm'
import { Arrow, Btn, Chip, Empty, Media, Section, SectionHead } from '@/components/ui'
import { asArray, asList, daysUntil, formatDate, money } from '@/lib/kernel/ids'
import { markdown, plain } from '@/lib/kernel/md'
import { registerBlock, type RenderCtx } from './types'
import { getWorld } from './world'

/* ------------------------------- utilities ------------------------------- */

function Lines({ text, className = '' }: { text?: string; className?: string }) {
  const lines = String(text || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  if (!lines.length) return null
  return (
    <>
      {lines.map((line, index) => (
        <span className={`line${index === lines.length - 1 ? ' line--last' : ''} ${className}`} key={index}>
          {line}
        </span>
      ))}
    </>
  )
}

function videoEmbed(url: string): string {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{6,})/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`
  const vimeo = url.match(/vimeo\.com\/(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`
  return url
}

/* Icons cycled through the "Why choose us" cards. */
const WHY_ICONS: WhyIcon[] = ['shield', 'coin', 'compass', 'document']

const LINK_FIELDS = [
  { key: 'primary_label', label: 'Primary button label', type: 'text' as const, span: 1 as const },
  {
    key: 'primary_href',
    label: 'Primary button link',
    type: 'text' as const,
    span: 1 as const,
    help: 'A path like /contact, or the words whatsapp, email or phone.',
  },
  { key: 'secondary_label', label: 'Secondary button label', type: 'text' as const, span: 1 as const },
  { key: 'secondary_href', label: 'Secondary button link', type: 'text' as const, span: 1 as const },
]

/* --------------------------------- layout -------------------------------- */

registerBlock({
  type: 'hero',
  label: 'Hero',
  group: 'layout',
  hint: 'The opening statement. One per page.',
  initial: () => ({
    eyebrow: '',
    headline: 'A headline that\nearns the second line.',
    body: '',
    primary_label: 'Get started',
    primary_href: '/contact',
    secondary_label: '',
    secondary_href: '',
    footnote: '',
    media: '',
    variant: 'display',
    show_search: false,
    show_mark: false,
  }),
  fields: [
    { key: 'eyebrow', label: 'Eyebrow', type: 'text', span: 1, placeholder: 'International Study Council' },
    {
      key: 'variant',
      label: 'Layout',
      type: 'select',
      span: 1,
      options: ['display', 'split', 'compact', 'mark'],
      help: 'display = large headline with portrait image, split = headline beside image, compact = text only.',
    },
    {
      key: 'headline',
      label: 'Headline',
      type: 'textarea',
      span: 2,
      required: true,
      help: 'Press Enter to break the line. The last line is emphasised.',
    },
    { key: 'body', label: 'Intro paragraph', type: 'textarea', span: 2 },
    ...LINK_FIELDS,
    { key: 'footnote', label: 'Footnote', type: 'text', span: 2, placeholder: 'No fees until you are admitted.' },
    {
      key: 'show_mark',
      label: 'Show the ISC block mark',
      type: 'boolean',
      span: 2,
      placeholder: 'Animated logo above the headline',
    },
    {
      key: 'show_search',
      label: 'Show a search box',
      type: 'boolean',
      span: 2,
      placeholder: 'Let visitors search the whole site from here',
    },
    { key: 'media', label: 'Image', type: 'image', span: 2 },
  ],
  render: ({ data, ctx }) => {
    const variant = data.variant || 'display'
    return (
      <Section size="lg" className={`blk-hero blk-hero--${variant}`}>
        <div className="hero__grid">
          <div className="hero__text">
            {data.show_mark ? <IscMark label={ctx.settings.identity.site_name} animate /> : null}
            {data.eyebrow ? <p className="label">{data.eyebrow}</p> : null}
            <h1 className="display">
              <Lines text={data.headline} />
            </h1>
            {data.body ? <p className="hero__body">{data.body}</p> : null}
            {data.primary_label || data.secondary_label ? (
              <div className="hero__actions">
                <Btn href={data.primary_href || '/contact'} variant="ink" size="lg" settings={ctx.settings} i18n={ctx.i18n}>
                  {data.primary_label || 'Get started'}
                </Btn>
                {data.secondary_label ? (
                  <Btn href={data.secondary_href} variant="ghost" size="lg" settings={ctx.settings} i18n={ctx.i18n}>
                    {data.secondary_label}
                  </Btn>
                ) : null}
              </div>
            ) : null}
            {data.show_search ? (
              <div className="hero__search">
                <SearchInline locale={ctx.i18n.locale} />
              </div>
            ) : null}
            {data.footnote ? <p className="hero__foot">{data.footnote}</p> : null}
          </div>
          {variant !== 'compact' && data.media ? (
            <Media src={data.media} alt="" ratio={variant === 'display' ? '4 / 5' : '4 / 3'} className="hero__media" priority />
          ) : null}
        </div>
      </Section>
    )
  },
})

registerBlock({
  type: 'pageHeader',
  label: 'Page header',
  group: 'layout',
  hint: 'The title block at the top of an inner page.',
  initial: () => ({ eyebrow: '', title: 'Page title', body: '' }),
  fields: [
    { key: 'eyebrow', label: 'Eyebrow', type: 'text', span: 1 },
    { key: 'title', label: 'Title', type: 'text', span: 1, required: true },
    { key: 'body', label: 'Intro', type: 'textarea', span: 2 },
  ],
  render: ({ data }) => (
    <Section size="sm" className="blk-pagehead">
      {data.eyebrow ? <p className="label">{data.eyebrow}</p> : null}
      <h1 className="h1">{data.title}</h1>
      {data.body ? <p className="lede">{data.body}</p> : null}
    </Section>
  ),
})

registerBlock({
  type: 'marquee',
  label: 'Partner strip',
  group: 'data',
  hint: 'A scrolling row of partner marks. Reads the Universities collection — no names to type.',
  initial: () => ({ label: '', mode: 'universities', limit: 24, show_names: false, items: [] }),
  fields: [
    { key: 'label', label: 'Label', type: 'text', span: 2 },
    {
      key: 'mode',
      label: 'Source',
      type: 'select',
      span: 1,
      options: ['universities', 'manual'],
      help: 'universities = pull the logo or monogram from your partner list.',
    },
    { key: 'limit', label: 'Maximum marks', type: 'number', span: 1 },
    {
      key: 'show_names',
      label: 'Show names under each mark',
      type: 'boolean',
      span: 2,
      placeholder: 'Marks only',
    },
    {
      key: 'items',
      label: 'Manual items (only when Source is manual)',
      type: 'repeater',
      span: 2,
      itemLabel: 'abbr',
      fields: [
        { key: 'abbr', label: 'Short code', type: 'text', span: 1, placeholder: 'TUM' },
        { key: 'text', label: 'Full name', type: 'text', span: 1 },
        { key: 'logo', label: 'Logo', type: 'image', span: 2 },
      ],
    },
  ],
  render: async ({ data, ctx }) => {
    type Mark = { key: string; abbr: string; name: string; logo: string; href: string }

    let marks: Mark[] = []

    if (data.mode === 'manual') {
      marks = asArray<any>(data.items)
        .filter((item) => item?.abbr || item?.logo || item?.text)
        .map((item, index) => ({
          key: `m${index}`,
          abbr: String(item.abbr || item.text || '?').slice(0, 4).toUpperCase(),
          name: String(item.text || item.abbr || ''),
          logo: String(item.logo || ''),
          href: '',
        }))
    } else {
      const entries = await ctx.get('universities', { limit: Number(data.limit || 24) })
      marks = entries.map((entry) => ({
        key: entry.id,
        abbr: String(entry.data?.abbr || entry.title.slice(0, 3)).slice(0, 4).toUpperCase(),
        name: entry.title,
        logo: String(entry.data?.logo || ''),
        href: ctx.i18n.href(`/universities/${entry.slug}`),
      }))
    }

    if (!marks.length) return null
    const doubled = [...marks, ...marks]

    return (
      <Section size="sm" className="blk-marquee">
        {data.label ? <p className="label marquee__label">{data.label}</p> : null}
        <div className="marquee">
          <div className="marquee__track">
            {doubled.map((mark, index) => {
              const inner = (
                <>
                  {mark.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="mark__logo" src={mark.logo} alt="" loading="lazy" />
                  ) : (
                    <span className="mark__abbr">{mark.abbr}</span>
                  )}
                  {data.show_names ? <span className="mark__name">{mark.name}</span> : null}
                </>
              )
              return mark.href ? (
                <Link className="mark" href={mark.href} key={`${mark.key}-${index}`} title={mark.name}>
                  {inner}
                </Link>
              ) : (
                <span className="mark" key={`${mark.key}-${index}`} title={mark.name}>
                  {inner}
                </span>
              )
            })}
          </div>
        </div>
      </Section>
    )
  },
})

registerBlock({
  type: 'divider',
  label: 'Divider',
  group: 'layout',
  hint: 'Breathing room between two sections.',
  initial: () => ({ label: '' }),
  fields: [{ key: 'label', label: 'Label (optional)', type: 'text', span: 2 }],
  render: ({ data }) =>
    data.label ? (
      <Section size="sm">
        <p className="rule-label">{data.label}</p>
      </Section>
    ) : (
      <div className="spacer" />
    ),
})

/* -------------------------------- content -------------------------------- */

registerBlock({
  type: 'stats',
  label: 'Key numbers',
  group: 'content',
  hint: 'Four numbers in a bordered row.',
  initial: () => ({ label: '', items: [{ value: '', label: '' }] }),
  fields: [
    { key: 'label', label: 'Label', type: 'text', span: 2 },
    {
      key: 'items',
      label: 'Numbers',
      type: 'repeater',
      span: 2,
      itemLabel: 'value',
      fields: [
        { key: 'value', label: 'Value', type: 'text', span: 1, placeholder: '1,800+' },
        { key: 'label', label: 'Caption', type: 'text', span: 1 },
      ],
    },
  ],
  render: ({ data }) => {
    const items = asArray<any>(data.items).filter((i) => i?.value)
    if (!items.length) return null
    return (
      <Section size="sm" className="blk-stats">
        {data.label ? <p className="label">{data.label}</p> : null}
        <div className="stats">
          {items.map((item, index) => (
            <div className="stat" key={index}>
              <span className="stat__value">{item.value}</span>
              <span className="stat__label">{item.label}</span>
            </div>
          ))}
        </div>
      </Section>
    )
  },
})

registerBlock({
  type: 'cardGrid',
  label: 'Card grid',
  group: 'content',
  hint: 'Generic cards — services, features, anything.',
  initial: () => ({ label: '', title: '', body: '', columns: '3', items: [{ title: '', body: '', tag: '', href: '' }] }),
  fields: [
    { key: 'label', label: 'Label', type: 'text', span: 1 },
    { key: 'columns', label: 'Columns', type: 'select', span: 1, options: ['2', '3', '4'] },
    { key: 'title', label: 'Heading', type: 'text', span: 2 },
    { key: 'body', label: 'Intro', type: 'textarea', span: 2 },
    {
      key: 'items',
      label: 'Cards',
      type: 'repeater',
      span: 2,
      itemLabel: 'title',
      fields: [
        { key: 'tag', label: 'Tag', type: 'text', span: 1, placeholder: '01' },
        { key: 'title', label: 'Title', type: 'text', span: 1 },
        { key: 'body', label: 'Body', type: 'textarea', span: 2 },
        { key: 'href', label: 'Link (optional)', type: 'text', span: 2 },
      ],
    },
  ],
  render: ({ data, ctx }) => {
    const items = asArray<any>(data.items).filter((i) => i?.title)
    if (!items.length) return null
    return (
      <Section className="blk-cards">
        <SectionHead label={data.label} title={data.title} body={data.body} />
        <div className={`grid g-${data.columns || 3}`}>
          {items.map((item, index) => {
            const inner = (
              <>
                {item.tag ? <span className="cell__tag">{item.tag}</span> : null}
                <h3 className="cell__title">{item.title}</h3>
                {item.body ? <p className="cell__body">{item.body}</p> : null}
                {item.href ? (
                  <span className="card__go">
                    Read more <Arrow />
                  </span>
                ) : null}
              </>
            )
            return item.href ? (
              <Link className="cell cell--link" href={ctx.i18n.href(item.href)} key={index}>
                {inner}
              </Link>
            ) : (
              <div className="cell" key={index}>
                {inner}
              </div>
            )
          })}
        </div>
      </Section>
    )
  },
})

registerBlock({
  type: 'imageText',
  label: 'Image + text',
  group: 'content',
  hint: 'A picture beside a block of copy.',
  initial: () => ({ label: '', title: '', body: '', bullets: [], media: '', image_side: 'right', cta_label: '', cta_href: '' }),
  fields: [
    { key: 'label', label: 'Label', type: 'text', span: 1 },
    { key: 'image_side', label: 'Image side', type: 'select', span: 1, options: ['right', 'left'] },
    { key: 'title', label: 'Heading', type: 'text', span: 2 },
    { key: 'body', label: 'Body', type: 'richtext', span: 2 },
    { key: 'bullets', label: 'Bullet points', type: 'list', span: 2, help: 'One per line.' },
    { key: 'media', label: 'Image', type: 'image', span: 2 },
    { key: 'cta_label', label: 'Link label', type: 'text', span: 1 },
    { key: 'cta_href', label: 'Link', type: 'text', span: 1 },
  ],
  render: ({ data, ctx }) => (
    <Section className={`blk-imgtext blk-imgtext--${data.image_side || 'right'}`}>
      <div className="split">
        <div className="split__text">
          {data.label ? <p className="label">{data.label}</p> : null}
          {data.title ? <h2 className="h2">{data.title}</h2> : null}
          {data.body ? <div className="prose" dangerouslySetInnerHTML={{ __html: markdown(data.body) }} /> : null}
          {asList(data.bullets).length ? (
            <ul className="tick-list">
              {asList(data.bullets).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
          {data.cta_label ? (
            <Btn href={data.cta_href || '/contact'} variant="ghost" settings={ctx.settings} i18n={ctx.i18n}>
              {data.cta_label}
            </Btn>
          ) : null}
        </div>
        {data.media ? <Media src={data.media} alt="" ratio="4 / 5" className="split__media" /> : null}
      </div>
    </Section>
  ),
})

registerBlock({
  type: 'steps',
  label: 'Process steps',
  group: 'content',
  hint: 'A numbered walkthrough.',
  initial: () => ({ label: '', title: '', items: [{ title: '', body: '' }] }),
  fields: [
    { key: 'label', label: 'Label', type: 'text', span: 2 },
    { key: 'title', label: 'Heading', type: 'text', span: 2 },
    {
      key: 'items',
      label: 'Steps',
      type: 'repeater',
      span: 2,
      itemLabel: 'title',
      fields: [
        { key: 'title', label: 'Step', type: 'text', span: 2 },
        { key: 'body', label: 'Detail', type: 'textarea', span: 2 },
      ],
    },
  ],
  render: ({ data }) => {
    const items = asArray<any>(data.items).filter((i) => i?.title)
    if (!items.length) return null
    return (
      <Section className="blk-steps">
        <SectionHead label={data.label} title={data.title} />
        <ol className="steps">
          {items.map((item, index) => (
            <li className="step" key={index}>
              <span className="step__num">{String(index + 1).padStart(2, '0')}</span>
              <div className="step__body">
                <h3 className="step__title">{item.title}</h3>
                {item.body ? <p>{item.body}</p> : null}
              </div>
            </li>
          ))}
        </ol>
      </Section>
    )
  },
})

registerBlock({
  type: 'faq',
  label: 'FAQ',
  group: 'content',
  hint: 'Collapsible questions.',
  initial: () => ({ label: '', title: '', items: [{ question: '', answer: '' }] }),
  fields: [
    { key: 'label', label: 'Label', type: 'text', span: 2 },
    { key: 'title', label: 'Heading', type: 'text', span: 2 },
    {
      key: 'items',
      label: 'Questions',
      type: 'repeater',
      span: 2,
      itemLabel: 'question',
      fields: [
        { key: 'question', label: 'Question', type: 'text', span: 2 },
        { key: 'answer', label: 'Answer', type: 'richtext', span: 2 },
      ],
    },
  ],
  render: ({ data }) => {
    const items = asArray<any>(data.items).filter((i) => i?.question)
    if (!items.length) return null
    return (
      <Section className="blk-faq">
        <SectionHead label={data.label} title={data.title} />
        <div className="faq">
          {items.map((item, index) => (
            <details className="faq__item" key={index}>
              <summary>
                <span>{item.question}</span>
                <span className="faq__sign" aria-hidden="true" />
              </summary>
              <div className="faq__answer prose" dangerouslySetInnerHTML={{ __html: markdown(item.answer) }} />
            </details>
          ))}
        </div>
      </Section>
    )
  },
})

registerBlock({
  type: 'gallery',
  label: 'Gallery',
  group: 'content',
  hint: 'A grid of images.',
  initial: () => ({ label: '', title: '', columns: '3', images: [{ url: '', alt: '', caption: '' }] }),
  fields: [
    { key: 'label', label: 'Label', type: 'text', span: 1 },
    { key: 'columns', label: 'Columns', type: 'select', span: 1, options: ['2', '3', '4'] },
    { key: 'title', label: 'Heading', type: 'text', span: 2 },
    {
      key: 'images',
      label: 'Images',
      type: 'repeater',
      span: 2,
      itemLabel: 'caption',
      fields: [
        { key: 'url', label: 'Image', type: 'image', span: 2 },
        { key: 'caption', label: 'Caption', type: 'text', span: 2 },
      ],
    },
  ],
  render: ({ data }) => {
    const images = asArray<any>(data.images).filter((i) => i?.url)
    if (!images.length) return null
    return (
      <Section className="blk-gallery">
        <SectionHead label={data.label} title={data.title} />
        <div className={`grid g-${data.columns || 3} gallery`}>
          {images.map((image, index) => (
            <figure className="gallery__item" key={index}>
              <Media src={image.url} alt={image.caption || ''} ratio="4 / 3" />
              {image.caption ? <figcaption>{image.caption}</figcaption> : null}
            </figure>
          ))}
        </div>
      </Section>
    )
  },
})

registerBlock({
  type: 'video',
  label: 'Video',
  group: 'content',
  hint: 'Embed a YouTube or Vimeo link.',
  initial: () => ({ label: '', title: '', url: '', caption: '' }),
  fields: [
    { key: 'label', label: 'Label', type: 'text', span: 2 },
    { key: 'title', label: 'Heading', type: 'text', span: 2 },
    { key: 'url', label: 'Video URL', type: 'url', span: 2, placeholder: 'https://www.youtube.com/watch?v=…' },
    { key: 'caption', label: 'Caption', type: 'text', span: 2 },
  ],
  render: ({ data }) =>
    data.url ? (
      <Section className="blk-video">
        <SectionHead label={data.label} title={data.title} />
        <div className="video">
          <iframe
            src={videoEmbed(data.url)}
            title={data.title || 'Video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
        {data.caption ? <p className="video__caption">{data.caption}</p> : null}
      </Section>
    ) : null,
})

registerBlock({
  type: 'richtext',
  label: 'Text section',
  group: 'content',
  hint: 'A heading and a block of formatted copy.',
  initial: () => ({ label: '', title: '', body: '', width: 'narrow' }),
  fields: [
    { key: 'label', label: 'Label', type: 'text', span: 1 },
    { key: 'width', label: 'Width', type: 'select', span: 1, options: ['narrow', 'wide'] },
    { key: 'title', label: 'Heading', type: 'text', span: 2 },
    { key: 'body', label: 'Body', type: 'richtext', span: 2 },
  ],
  render: ({ data }) =>
    data.body || data.title ? (
      <Section className={`blk-text blk-text--${data.width || 'narrow'}`}>
        <SectionHead label={data.label} title={data.title} />
        <div className="prose" dangerouslySetInnerHTML={{ __html: markdown(data.body) }} />
      </Section>
    ) : null,
})

registerBlock({
  type: 'html',
  label: 'Custom HTML',
  group: 'content',
  hint: 'For embeds and one-offs. Rendered as-is.',
  initial: () => ({ code: '' }),
  fields: [{ key: 'code', label: 'HTML', type: 'textarea', span: 2 }],
  render: ({ data }) =>
    data.code ? (
      <Section size="sm">
        <div dangerouslySetInnerHTML={{ __html: String(data.code) }} />
      </Section>
    ) : null,
})

/* -------------------------------- data ----------------------------------- */

const FILTER_LEVELS = ['Foundation', 'Diploma', "Bachelor's", "Master's", 'PhD']

registerBlock({
  type: 'universityList',
  label: 'University list',
  group: 'data',
  hint: 'Pulls from the Universities collection — edit once, updates everywhere.',
  initial: () => ({
    label: '',
    title: 'Universities',
    body: '',
    mode: 'featured',
    country: '',
    discipline: '',
    limit: 6,
    layout: 'grid',
    filters: false,
    cta_label: '',
    cta_href: '',
  }),
  fields: [
    { key: 'label', label: 'Label', type: 'text', span: 1 },
    { key: 'layout', label: 'Layout', type: 'select', span: 1, options: ['grid', 'list'] },
    { key: 'title', label: 'Heading', type: 'text', span: 2 },
    { key: 'body', label: 'Intro', type: 'textarea', span: 2 },
    {
      key: 'mode',
      label: 'Which universities',
      type: 'select',
      span: 1,
      options: ['featured', 'all', 'country'],
    },
    { key: 'country', label: 'Fixed country', type: 'text', span: 1, help: 'Used when “Which universities” is set to country.' },
    { key: 'discipline', label: 'Fixed discipline', type: 'text', span: 1 },
    { key: 'limit', label: 'Maximum shown', type: 'number', span: 1 },
    { key: 'filters', label: 'Show filter bar', type: 'boolean', span: 2 },
    { key: 'cta_label', label: 'Footer link label', type: 'text', span: 1 },
    { key: 'cta_href', label: 'Footer link', type: 'text', span: 1 },
  ],
  render: async ({ data, ctx }) => {
    const where: Record<string, any> = {}
    const country = ctx.search.country || data.country || ''
    const level = ctx.search.level || ''
    const discipline = ctx.search.discipline || data.discipline || ''
    if (data.mode === 'country' && country) where.country = country
    if (data.mode !== 'country' && country) where.country = country
    if (discipline) where.disciplines = [discipline]

    let entries = await ctx.get('universities', {
      limit: Number(data.limit || 6),
      featured: data.mode === 'featured' ? true : undefined,
      where,
    })

    // level is stored as an array; filter in memory so the query stays simple
    if (level) entries = entries.filter((e) => asList(e.data?.levels).includes(level))

    const countries = await ctx.get('countries', { limit: 40 })
    const filterSpecs = data.filters
      ? [
          { key: 'country', label: ctx.i18n.t('common.allCountries'), options: countries.map((c) => c.title) },
          { key: 'level', label: ctx.i18n.t('common.allLevels'), options: FILTER_LEVELS },
          {
            key: 'discipline',
            label: ctx.i18n.t('common.allDisciplines'),
            options: [...new Set(entries.flatMap((e) => asList(e.data?.disciplines)))].sort(),
          },
        ].filter((f) => f.options.length)
      : []

    return (
      <Section className="blk-list" id="universities">
        <SectionHead
          label={data.label}
          title={data.title}
          body={data.body}
          action={
            data.cta_label && data.cta_href ? (
              <Btn href={data.cta_href} variant="ghost" settings={ctx.settings} i18n={ctx.i18n}>
                {data.cta_label}
              </Btn>
            ) : undefined
          }
        />
        {filterSpecs.length ? <FilterBar filters={filterSpecs} labels={{ filter: ctx.i18n.t('common.filter'), clear: ctx.i18n.t('common.clear') }} /> : null}
        {entries.length ? (
          <div className={`grid ${data.layout === 'list' ? 'g-2' : 'g-3'} cards-grid`}>
            {entries.map((entry) => (
              <UniversityCard entry={entry} i18n={ctx.i18n} key={entry.id} />
            ))}
          </div>
        ) : (
          <Empty>{ctx.i18n.t('common.emptyUniversities')}</Empty>
        )}
      </Section>
    )
  },
})

registerBlock({
  type: 'scholarshipList',
  label: 'Scholarship list',
  group: 'data',
  hint: 'Pulls from the Scholarships collection.',
  initial: () => ({
    label: '',
    title: 'Scholarships',
    body: '',
    mode: 'all',
    limit: 6,
    filters: false,
    cta_label: '',
    cta_href: '',
  }),
  fields: [
    { key: 'label', label: 'Label', type: 'text', span: 1 },
    {
      key: 'mode',
      label: 'Which scholarships',
      type: 'select',
      span: 1,
      options: ['all', 'featured', 'upcoming'],
    },
    { key: 'title', label: 'Heading', type: 'text', span: 2 },
    { key: 'body', label: 'Intro', type: 'textarea', span: 2 },
    { key: 'limit', label: 'Maximum shown', type: 'number', span: 1 },
    { key: 'filters', label: 'Show filter bar', type: 'boolean', span: 1 },
    { key: 'cta_label', label: 'Footer link label', type: 'text', span: 1 },
    { key: 'cta_href', label: 'Footer link', type: 'text', span: 1 },
  ],
  render: async ({ data, ctx }) => {
    const where: Record<string, any> = {}
    if (ctx.search.country) where.countries = [ctx.search.country]
    if (ctx.search.provider) where.provider_type = ctx.search.provider
    if (ctx.search.level) where.levels = [ctx.search.level]

    let entries = await ctx.get('scholarships', {
      limit: Number(data.limit || 6),
      featured: data.mode === 'featured' ? true : undefined,
      order: data.mode === 'upcoming' ? 'deadline' : 'position',
      where,
    })

    if (data.mode === 'upcoming') {
      entries = entries.filter((e) => {
        const days = daysUntil(e.data?.deadline)
        return days === null || days >= 0
      })
    }

    const all = await ctx.get('scholarships', { limit: 100 })
    const filterSpecs = data.filters
      ? [
          {
            key: 'country',
            label: ctx.i18n.t('common.allCountries'),
            options: [...new Set(all.flatMap((e) => asList(e.data?.countries)))].sort(),
          },
          {
            key: 'provider',
            label: ctx.i18n.t('common.allProviders'),
            options: [...new Set(all.map((e) => String(e.data?.provider_type || '')).filter(Boolean))].sort(),
          },
          { key: 'level', label: ctx.i18n.t('common.allLevels'), options: FILTER_LEVELS },
        ].filter((f) => f.options.length)
      : []

    return (
      <Section className="blk-list" id="scholarships">
        <SectionHead
          label={data.label}
          title={data.title}
          body={data.body}
          action={
            data.cta_label && data.cta_href ? (
              <Btn href={data.cta_href} variant="ghost" settings={ctx.settings} i18n={ctx.i18n}>
                {data.cta_label}
              </Btn>
            ) : undefined
          }
        />
        {filterSpecs.length ? <FilterBar filters={filterSpecs} labels={{ filter: ctx.i18n.t('common.filter'), clear: ctx.i18n.t('common.clear') }} /> : null}
        {entries.length ? (
          <div className="grid g-3 cards-grid">
            {entries.map((entry) => (
              <ScholarshipCard entry={entry} i18n={ctx.i18n} key={entry.id} />
            ))}
          </div>
        ) : (
          <Empty>{ctx.i18n.t('common.emptyScholarships')}</Empty>
        )}
      </Section>
    )
  },
})

registerBlock({
  type: 'countryCards',
  label: 'Destination cards',
  group: 'data',
  hint: 'Pulls from the Destinations collection.',
  initial: () => ({ label: '', title: '', body: '', limit: 6, cta_label: '', cta_href: '' }),
  fields: [
    { key: 'label', label: 'Label', type: 'text', span: 2 },
    { key: 'title', label: 'Heading', type: 'text', span: 2 },
    { key: 'body', label: 'Intro', type: 'textarea', span: 2 },
    { key: 'limit', label: 'Maximum shown', type: 'number', span: 1 },
    { key: 'cta_label', label: 'Footer link label', type: 'text', span: 1 },
    { key: 'cta_href', label: 'Footer link', type: 'text', span: 1 },
  ],
  render: async ({ data, ctx }) => {
    const entries = await ctx.get('countries', { limit: Number(data.limit || 6) })
    if (!entries.length) return null
    return (
      <Section className="blk-countries">
        <SectionHead
          label={data.label}
          title={data.title}
          body={data.body}
          action={
            data.cta_label && data.cta_href ? (
              <Btn href={data.cta_href} variant="ghost" settings={ctx.settings} i18n={ctx.i18n}>
                {data.cta_label}
              </Btn>
            ) : undefined
          }
        />
        <div className="grid g-3 cards-grid">
          {entries.map((entry) => (
            <CountryCard entry={entry} i18n={ctx.i18n} key={entry.id} />
          ))}
        </div>
      </Section>
    )
  },
})

registerBlock({
  type: 'serviceList',
  label: 'Service list',
  group: 'data',
  hint: 'Pulls from the Services collection. Turn on grouping to organise by category.',
  initial: () => ({ label: '', title: '', body: '', limit: 24, columns: '3', grouped: true }),
  fields: [
    { key: 'label', label: 'Label', type: 'text', span: 1 },
    { key: 'columns', label: 'Columns', type: 'select', span: 1, options: ['2', '3'] },
    { key: 'title', label: 'Heading', type: 'text', span: 2 },
    { key: 'body', label: 'Intro', type: 'textarea', span: 2 },
    { key: 'limit', label: 'Maximum shown', type: 'number', span: 1 },
    {
      key: 'grouped',
      label: 'Group by category',
      type: 'boolean',
      span: 1,
      placeholder: 'Show category headings',
      help: 'Uses the Category field on each service.',
    },
  ],
  render: async ({ data, ctx }) => {
    const entries = await ctx.get('services', { limit: Number(data.limit || 24) })
    if (!entries.length) return null

    if (!data.grouped) {
      return (
        <Section className="blk-services">
          <SectionHead label={data.label} title={data.title} body={data.body} />
          <div className={`grid g-${data.columns || 3} cards-grid`}>
            {entries.map((entry) => (
              <ServiceCard entry={entry} key={entry.id} />
            ))}
          </div>
        </Section>
      )
    }

    // Preserve the order categories appear in the collection.
    const groups: Array<{ name: string; items: typeof entries }> = []
    for (const entry of entries) {
      const name = String(entry.data?.category || 'Other services')
      const existing = groups.find((group) => group.name === name)
      if (existing) existing.items.push(entry)
      else groups.push({ name, items: [entry] })
    }

    return (
      <Section className="blk-services">
        <SectionHead label={data.label} title={data.title} body={data.body} />
        <div className="sv-groups">
          {groups.map((group, index) => (
            <div className="sv-group" key={group.name}>
              <header className="sv-group__head">
                <span className="sv-group__num">{String(index + 1).padStart(2, '0')}</span>
                <h3 className="sv-group__title">{group.name}</h3>
                <span className="sv-group__count">
                  {group.items.length} {group.items.length === 1 ? 'service' : 'services'}
                </span>
              </header>
              <div className={`grid g-${data.columns || 3} cards-grid`}>
                {group.items.map((entry) => (
                  <ServiceCard entry={entry} key={entry.id} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>
    )
  },
})

registerBlock({
  type: 'priceTable',
  label: 'Fee table',
  group: 'data',
  hint: 'A comparison table of every service, its inclusions, timeline and fee.',
  initial: () => ({ label: 'Fees', title: 'What each service costs', body: '', show_includes: true }),
  fields: [
    { key: 'label', label: 'Label', type: 'text', span: 2 },
    { key: 'title', label: 'Heading', type: 'text', span: 2 },
    { key: 'body', label: 'Intro', type: 'textarea', span: 2 },
    { key: 'show_includes', label: 'Show the inclusions column', type: 'boolean', span: 2 },
  ],
  render: async ({ data, ctx }) => {
    const entries = await ctx.get('services', { limit: 40 })
    if (!entries.length) return null
    return (
      <Section className="blk-fees">
        <SectionHead label={data.label} title={data.title} body={data.body} />
        <div className="fees">
          <table className="fees__table">
            <thead>
              <tr>
                <th>Service</th>
                {data.show_includes ? <th>What is included</th> : null}
                <th>Timeline</th>
                <th>Fee</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const includes = asList(entry.data?.includes)
                return (
                  <tr key={entry.id}>
                    <td>
                      <span className="fees__name">{entry.title}</span>
                      {entry.data?.category ? <span className="fees__cat">{entry.data.category}</span> : null}
                    </td>
                    {data.show_includes ? (
                      <td className="fees__inc">{includes.length ? includes.join(' · ') : '—'}</td>
                    ) : null}
                    <td className="fees__meta">{entry.data?.duration || '—'}</td>
                    <td className="fees__price">{entry.data?.price || 'On request'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="fees__note">
          Fees are agreed in writing before any work starts. The profile assessment is always free.
        </p>
      </Section>
    )
  },
})

registerBlock({
  type: 'advisors',
  label: 'Team',
  group: 'data',
  hint: 'Pulls from the Advisors collection.',
  initial: () => ({ label: '', title: '', body: '', limit: 3 }),
  fields: [
    { key: 'label', label: 'Label', type: 'text', span: 2 },
    { key: 'title', label: 'Heading', type: 'text', span: 2 },
    { key: 'body', label: 'Intro', type: 'textarea', span: 2 },
    { key: 'limit', label: 'Maximum shown', type: 'number', span: 1 },
  ],
  render: async ({ data, ctx }) => {
    const entries = await ctx.get('advisors', { limit: Number(data.limit || 3) })
    if (!entries.length) return null
    return (
      <Section className="blk-team">
        <SectionHead label={data.label} title={data.title} body={data.body} />
        <div className="grid g-3 cards-grid">
          {entries.map((entry) => (
            <AdvisorCard entry={entry} key={entry.id} />
          ))}
        </div>
      </Section>
    )
  },
})

registerBlock({
  type: 'testimonials',
  label: 'Testimonials',
  group: 'data',
  hint: 'Student quotes.',
  initial: () => ({ label: '', title: '', items: [{ quote: '', name: '', detail: '' }] }),
  fields: [
    { key: 'label', label: 'Label', type: 'text', span: 2 },
    { key: 'title', label: 'Heading', type: 'text', span: 2 },
    {
      key: 'items',
      label: 'Quotes',
      type: 'repeater',
      span: 2,
      itemLabel: 'name',
      fields: [
        { key: 'quote', label: 'Quote', type: 'textarea', span: 2 },
        { key: 'name', label: 'Name', type: 'text', span: 1 },
        { key: 'detail', label: 'Course & university', type: 'text', span: 1 },
      ],
    },
  ],
  render: ({ data }) => {
    const items = asArray<any>(data.items).filter((i) => i?.quote)
    if (!items.length) return null
    return (
      <Section className="blk-quotes">
        <SectionHead label={data.label} title={data.title} />
        <div className="grid g-3 quotes">
          {items.map((item, index) => (
            <blockquote className="quote" key={index}>
              <p className="quote__text">{item.quote}</p>
              <footer className="quote__foot">
                <span className="quote__name">{item.name}</span>
                {item.detail ? <span className="quote__detail">{item.detail}</span> : null}
              </footer>
            </blockquote>
          ))}
        </div>
      </Section>
    )
  },
})

registerBlock({
  type: 'posts',
  label: 'Guides',
  group: 'data',
  hint: 'Latest articles from the Guides collection.',
  initial: () => ({ label: '', title: '', body: '', limit: 3, layout: 'grid', cta_label: '', cta_href: '' }),
  fields: [
    { key: 'label', label: 'Label', type: 'text', span: 1 },
    { key: 'layout', label: 'Layout', type: 'select', span: 1, options: ['grid', 'list'] },
    { key: 'title', label: 'Heading', type: 'text', span: 2 },
    { key: 'body', label: 'Intro', type: 'textarea', span: 2 },
    { key: 'limit', label: 'Maximum shown', type: 'number', span: 1 },
    { key: 'cta_label', label: 'Footer link label', type: 'text', span: 1 },
    { key: 'cta_href', label: 'Footer link', type: 'text', span: 1 },
  ],
  render: async ({ data, ctx }) => {
    const entries = await ctx.get('posts', { limit: Number(data.limit || 3), order: 'recent' })
    if (!entries.length) return null
    const layout = data.layout === 'list' ? 'list' : 'grid'
    return (
      <Section className="blk-posts">
        <SectionHead
          label={data.label}
          title={data.title}
          body={data.body}
          action={
            data.cta_label && data.cta_href ? (
              <Btn href={data.cta_href} variant="ghost" settings={ctx.settings} i18n={ctx.i18n}>
                {data.cta_label}
              </Btn>
            ) : undefined
          }
        />
        <div className={`grid ${layout === 'list' ? 'g-1' : 'g-3'} cards-grid`}>
          {entries.map((entry) => (
            <PostCard entry={entry} i18n={ctx.i18n} layout={layout} key={entry.id} />
          ))}
        </div>
      </Section>
    )
  },
})

/* ------------------------------- conversion ------------------------------ */

registerBlock({
  type: 'cta',
  label: 'Call to action',
  group: 'convert',
  hint: 'A closing statement with buttons.',
  initial: () => ({
    headline: '',
    body: '',
    primary_label: 'Get in touch',
    primary_href: '/contact',
    secondary_label: '',
    secondary_href: '',
    variant: 'ink',
  }),
  fields: [
    { key: 'variant', label: 'Style', type: 'select', span: 2, options: ['ink', 'line'] },
    { key: 'headline', label: 'Headline', type: 'text', span: 2, required: true },
    { key: 'body', label: 'Body', type: 'textarea', span: 2 },
    ...LINK_FIELDS,
  ],
  render: ({ data, ctx }) => (
    <Section className={`blk-cta blk-cta--${data.variant || 'ink'}`}>
      <div className="cta">
        <h2 className="cta__headline">{data.headline}</h2>
        {data.body ? <p className="cta__body">{data.body}</p> : null}
        <div className="cta__actions">
          <Btn href={data.primary_href || '/contact'} variant={data.variant === 'ink' ? 'paper' : 'ink'} size="lg" settings={ctx.settings} i18n={ctx.i18n}>
            {data.primary_label || 'Get in touch'}
          </Btn>
          {data.secondary_label ? (
            <Btn href={data.secondary_href} variant={data.variant === 'ink' ? 'paper-ghost' : 'ghost'} size="lg" settings={ctx.settings} i18n={ctx.i18n}>
              {data.secondary_label}
            </Btn>
          ) : null}
        </div>
      </div>
    </Section>
  ),
})

registerBlock({
  type: 'contactForm',
  label: 'Enquiry form',
  group: 'convert',
  hint: 'Submissions land in the admin under Enquiries.',
  initial: () => ({
    title: '',
    body: '',
    submit_label: 'Send enquiry',
    success_message: 'Thank you — we will be in touch shortly.',
    fields: [
      { key: 'name', label: 'Full name', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'message', label: 'Message', type: 'textarea' },
    ],
  }),
  fields: [
    { key: 'title', label: 'Heading', type: 'text', span: 2 },
    { key: 'body', label: 'Intro', type: 'textarea', span: 2 },
    { key: 'submit_label', label: 'Button label', type: 'text', span: 1 },
    { key: 'success_message', label: 'Success message', type: 'text', span: 1 },
    {
      key: 'fields',
      label: 'Form fields',
      type: 'repeater',
      span: 2,
      itemLabel: 'label',
      fields: [
        { key: 'label', label: 'Label', type: 'text', span: 1 },
        {
          key: 'key',
          label: 'Field key',
          type: 'text',
          span: 1,
          help: 'Lowercase, no spaces. Use name, email, phone, whatsapp, country, level, message.',
        },
        { key: 'type', label: 'Input type', type: 'select', span: 1, options: ['text', 'email', 'tel', 'textarea', 'select'] },
        { key: 'required', label: 'Required', type: 'boolean', span: 1 },
        { key: 'options', label: 'Options (select only)', type: 'list', span: 2, help: 'One per line.' },
      ],
    },
  ],
  render: ({ data, ctx }) => {
    const fields = asArray<any>(data.fields).map((f) => ({
      key: f.key || 'field',
      label: f.label || f.key,
      type: f.type || 'text',
      required: Boolean(f.required),
      options: asList(f.options),
    }))
    return (
      <Section className="blk-form" id="enquiry">
        <div className="form-shell">
          <div className="form-shell__intro">
            {data.title ? <h2 className="h2">{data.title}</h2> : null}
            {data.body ? <p className="lede">{data.body}</p> : null}
          </div>
          <div className="form-shell__form">
            <LeadForm
              fields={fields}
              submitLabel={data.submit_label || 'Send enquiry'}
              successMessage={data.success_message}
              source={ctx.path}
              labels={{ pleaseChoose: ctx.i18n.t('form.pleaseChoose'), sending: ctx.i18n.t('form.sending') }}
            />
          </div>
        </div>
      </Section>
    )
  },
})

registerBlock({
  type: 'worldMap',
  label: 'World map',
  group: 'data',
  hint: 'Lights up every destination marked Live. Reads from the Destinations collection.',
  initial: () => ({
    label: 'Global reach',
    title: 'Where we can take you',
    body: 'Each country lights up once we have the full service set running there — admissions, funding, visa and arrival.',
    tone: 'ink',
    show_progress: true,
    cta_label: 'See all destinations',
    cta_href: '/universities',
  }),
  fields: [
    { key: 'label', label: 'Label', type: 'text', span: 1 },
    { key: 'tone', label: 'Style', type: 'select', span: 1, options: ['ink', 'paper'] },
    { key: 'title', label: 'Heading', type: 'text', span: 2 },
    { key: 'body', label: 'Intro', type: 'textarea', span: 2 },
    {
      key: 'show_progress',
      label: 'Show countries in progress',
      type: 'boolean',
      span: 1,
      placeholder: 'Show half-lit countries',
    },
    { key: 'cta_label', label: 'Link label', type: 'text', span: 1 },
    { key: 'cta_href', label: 'Link', type: 'text', span: 1 },
  ],
  render: async ({ data, ctx }) => {
    const entries = await ctx.get('countries', { limit: 200 })
    const rows = entries
      .map((entry) => {
        const d = entry.data || {}
        const status = String(d.map_status || '')
        const iso = String(d.iso || '').trim().toUpperCase()
        if (!iso) return null
        const state: 'live' | 'progress' | 'none' =
          status === 'Live' ? 'live' : status === 'In progress' ? 'progress' : 'none'
        const tuition = Number(d.tuition_from ?? 0)
        return {
          iso,
          name: entry.title,
          slug: entry.slug || '',
          flag: d.flag || '',
          status: state,
          tuition: tuition ? money(tuition, d.currency) : '',
          living: d.living_cost || '',
          intakes: d.intakes || '',
          programmes: asList(d.popular_for),
        }
      })
      .filter(Boolean) as Array<{
      iso: string
      name: string
      slug: string
      flag: string
      status: 'live' | 'progress' | 'none'
      tuition: string
      living: string
      intakes: string
      programmes: string[]
    }>

    const visible = data.show_progress === false ? rows.filter((row) => row.status === 'live') : rows
    if (!visible.length) return null

    return (
      <Section className={`blk-map blk-map--${data.tone || 'ink'}`}>
        <SectionHead
          label={data.label}
          title={data.title}
          body={data.body}
          action={
            data.cta_label && data.cta_href ? (
              <Btn
                href={data.cta_href}
                variant={data.tone === 'ink' ? 'paper-ghost' : 'ghost'}
                settings={ctx.settings} i18n={ctx.i18n}
              >
                {data.cta_label}
              </Btn>
            ) : undefined
          }
        />
        <WorldMap
          world={getWorld()}
          countries={visible}
          labels={{
            live: ctx.i18n.t('map.live'),
            inProgress: ctx.i18n.t('map.inProgress'),
            notCovered: ctx.i18n.t('map.notCovered'),
            statusLive: ctx.i18n.t('map.statusLive'),
            statusProgress: ctx.i18n.t('map.statusProgress'),
            hint: ctx.i18n.t('map.hint'),
            readGuide: ctx.i18n.t('map.readGuide'),
            fallback: ctx.i18n.t('map.fallback'),
          }}
        />
      </Section>
    )
  },
})

registerBlock({
  type: 'planBuilder',
  label: 'Plan builder',
  group: 'convert',
  hint: 'Visitors drag services into their own plan and see the cost and timeline update live.',
  initial: () => ({
    label: 'Build your plan',
    title: 'Put together exactly what you need',
    body: 'Drag the services you want into your plan. Nothing is fixed — take one, take all, take none. The cost and timeline update as you build.',
  }),
  fields: [
    { key: 'label', label: 'Label', type: 'text', span: 1 },
    { key: 'cta_href', label: 'Fallback link', type: 'text', span: 1, placeholder: '/apply' },
    { key: 'title', label: 'Heading', type: 'text', span: 2 },
    { key: 'body', label: 'Intro', type: 'textarea', span: 2 },
  ],
  render: async ({ data, ctx }) => {
    const entries = await ctx.get('services', { limit: 40 })
    if (!entries.length) return null

    const services = entries.map((entry) => {
      const d = entry.data || {}
      return {
        id: entry.id,
        title: entry.title,
        summary: String(d.summary || ''),
        category: String(d.category || 'Other services'),
        price: String(d.price || ''),
        priceValue: Number(d.price_value ?? 0),
        weeks: Number(d.duration_weeks ?? 0),
        includes: asList(d.includes),
      }
    })

    const wa = String(ctx.settings.contact.whatsapp || '').replace(/[^\d]/g, '')
    const text = encodeURIComponent(ctx.settings.contact.whatsapp_message || '')

    return (
      <Section className="blk-plan" id="build">
        <SectionHead label={data.label} title={data.title} body={data.body} />
        <PlanBuilder
          services={services}
          whatsappUrl={wa ? `https://wa.me/${wa}${text ? `?text=${text}` : ''}` : undefined}
          labels={{
            available: ctx.i18n.t('plan.available'),
            availableHint: ctx.i18n.t('plan.availableHint'),
            plan: ctx.i18n.t('plan.title'),
            planEmpty: ctx.i18n.t('plan.empty'),
            planEmptyHint: ctx.i18n.t('plan.emptyHint'),
            addAll: ctx.i18n.t('plan.addAll'),
            reset: ctx.i18n.t('plan.reset'),
            total: ctx.i18n.t('plan.total'),
            timeline: ctx.i18n.t('plan.timeline'),
            weeks: ctx.i18n.t('plan.weeks'),
            services: ctx.i18n.t('plan.services'),
            send: ctx.i18n.t('plan.send'),
            sendHint: ctx.i18n.t('plan.sendHint'),
            name: ctx.i18n.t('plan.name'),
            email: ctx.i18n.t('plan.email'),
            whatsapp: ctx.i18n.t('contact.whatsapp'),
            submit: ctx.i18n.t('plan.submit'),
            sending: ctx.i18n.t('form.sending'),
            done: ctx.i18n.t('plan.done'),
            doneBody: ctx.i18n.t('plan.doneBody'),
            required: ctx.i18n.t('form.required'),
            invalidEmail: ctx.i18n.t('form.invalidEmail'),
            remove: ctx.i18n.t('plan.remove'),
            moveUp: ctx.i18n.t('plan.moveUp'),
            moveDown: ctx.i18n.t('plan.moveDown'),
            free: ctx.i18n.t('plan.free'),
            dragHint: ctx.i18n.t('plan.dragHint'),
          }}
        />
      </Section>
    )
  },
})

registerBlock({
  type: 'scrolly',
  label: 'Scroll story',
  group: 'layout',
  hint: 'A sticky screen on the left that plays a demo for whichever section you are reading.',
  initial: () => ({
    label: '',
    title: '',
    body: '',
    sections: [
      { id: 'services', label: 'Services', title: 'What we do', body: '', points: [] },
      { id: 'process', label: 'Process', title: 'How it works', body: '', points: [] },
      { id: 'search', label: 'Search', title: 'Search your destination', body: '', points: [] },
      { id: 'map', label: 'Reach', title: 'Where we can take you', body: '', points: [] },
      { id: 'apply', label: 'Apply', title: 'Talk to an advisor', body: '', points: [] },
    ],
  }),
  fields: [
    { key: 'label', label: 'Label', type: 'text', span: 1 },
    { key: 'service_limit', label: 'Services shown in the demo', type: 'number', span: 1 },
    {
      key: 'sections',
      label: 'Sections',
      type: 'repeater',
      span: 2,
      itemLabel: 'title',
      help: 'The demo shown on the left is chosen by the Key: services, process, search, map or apply.',
      fields: [
        { key: 'id', label: 'Key', type: 'select', span: 1, options: ['services', 'process', 'search', 'map', 'apply'] },
        { key: 'label', label: 'Eyebrow', type: 'text', span: 1 },
        { key: 'title', label: 'Heading', type: 'text', span: 2 },
        { key: 'body', label: 'Body', type: 'textarea', span: 2 },
        { key: 'points', label: 'Bullet points', type: 'list', span: 2, help: 'One per line.' },
        { key: 'cta_label', label: 'Link label', type: 'text', span: 1 },
        { key: 'cta_href', label: 'Link', type: 'text', span: 1 },
      ],
    },
  ],
  render: async ({ data, ctx }) => {
    const [services, countries] = await Promise.all([
      ctx.get('services', { limit: Number(data.service_limit || 6) }),
      ctx.get('countries', { limit: 200 }),
    ])

    const sections = asArray<any>(data.sections)
      .filter((section) => section?.title)
      .map((section, index) => ({
        id: String(section.id || ['services', 'process', 'search', 'map', 'apply'][index] || 'services'),
        label: String(section.label || ''),
        title: String(section.title || ''),
        body: String(section.body || ''),
        points: asList(section.points),
        cta: section.cta_label ? { label: String(section.cta_label), href: String(section.cta_href || '/apply') } : undefined,
      }))

    if (!sections.length) return null

    const demoServices = services.map((entry) => ({
      name: entry.title,
      price: String(entry.data?.price_value ? `USD ${entry.data.price_value}` : entry.data?.price || ''),
      icon: iconForService(String(entry.data?.category || ''), entry.title),
    }))

    const mapCountries = countries
      .map((entry) => {
        const d = entry.data || {}
        const iso = String(d.iso || '').trim().toUpperCase()
        if (!iso) return null
        const status = String(d.map_status || '')
        return {
          iso,
          name: entry.title,
          flag: String(d.flag || ''),
          status: (status === 'Live' ? 'live' : status === 'In progress' ? 'progress' : 'none') as
            | 'live'
            | 'progress'
            | 'none',
        }
      })
      .filter(Boolean) as Array<{ iso: string; name: string; flag: string; status: 'live' | 'progress' | 'none' }>

    return (
      <Section className="blk-scrolly">
        {data.label || data.title ? <SectionHead label={data.label} title={data.title} body={data.body} /> : null}
        <Scrolly
          sections={sections}
          services={demoServices}
          mapCountries={mapCountries}
          world={getWorld()}
          locale={ctx.i18n.locale}
          mapLabels={{
            live: ctx.i18n.t('map.live'),
            inProgress: ctx.i18n.t('map.inProgress'),
            readGuide: ctx.i18n.t('map.readGuide'),
          }}
        />
      </Section>
    )
  },
})

registerBlock({
  type: 'why',
  label: 'Why choose us',
  group: 'content',
  hint: 'Left: the argument. Right: a grid of animated reasons.',
  initial: () => ({
    label: 'Why us',
    title: 'Why students pick us',
    body: 'Most agencies sell you a university. We sell you a decision you can defend — and we tell you when the answer is not to go.',
    items: [
      { title: 'We say no when we should', body: 'If a destination does not fit your budget or your grades, we tell you before you spend anything.' },
      { title: 'The price is the price', body: 'Written quotes, no add-ons discovered halfway through, no commission hidden in the tuition.' },
      { title: 'One advisor, start to finish', body: 'The person who assesses you files your applications and builds your visa file. No handovers.' },
      { title: 'We publish our refusals', body: 'Everything we will not do is written down. It is the fastest way to judge an agency.' },
    ],
  }),
  fields: [
    { key: 'label', label: 'Label', type: 'text', span: 2 },
    { key: 'title', label: 'Heading', type: 'text', span: 2 },
    { key: 'body', label: 'Intro', type: 'textarea', span: 2 },
    {
      key: 'items',
      label: 'Reasons',
      type: 'repeater',
      span: 2,
      itemLabel: 'title',
      fields: [
        { key: 'title', label: 'Heading', type: 'text', span: 2 },
        { key: 'body', label: 'Explanation', type: 'textarea', span: 2 },
      ],
    },
  ],
  render: ({ data }) => {
    const items = asArray<any>(data.items).filter((item) => item?.title)
    if (!items.length) return null
    return (
      <Section className="blk-why">
        <div className="why">
          <div className="why__intro">
            {data.label ? <p className="label">{data.label}</p> : null}
            {data.title ? <h2 className="h2">{data.title}</h2> : null}
            {data.body ? <p className="why__body">{data.body}</p> : null}
          </div>
          <div className="why__grid">
            {items.map((item, index) => (
              <div className="why__card" key={index} style={{ animationDelay: `${index * 90}ms` }}>
                <span className="why__icon" aria-hidden="true">
                  <Icon name={WHY_ICONS[index % WHY_ICONS.length]} size={18} />
                </span>
                <h3 className="why__card-title">{item.title}</h3>
                {item.body ? <p className="why__card-body">{item.body}</p> : null}
              </div>
            ))}
          </div>
        </div>
      </Section>
    )
  },
})

registerBlock({
  type: 'values',
  label: "What we don't do",
  group: 'content',
  hint: 'A row of plain refusals. Builds trust faster than another list of promises.',
  initial: () => ({
    label: 'Boundaries',
    title: "What we don't do",
    body: '',
    items: [
      { title: 'No guaranteed admission', body: 'Nobody can promise an offer. Anyone who does is lying to you.' },
      { title: 'No buying your way in', body: 'We do not forge documents, fake finances or pay anyone off.' },
      { title: 'No silence after payment', body: 'You get a named advisor and a reply within one working day.' },
      { title: 'No undisclosed commission', body: 'If a university pays us, it is written on your shortlist.' },
    ],
  }),
  fields: [
    { key: 'label', label: 'Label', type: 'text', span: 2 },
    { key: 'title', label: 'Heading', type: 'text', span: 2 },
    { key: 'body', label: 'Intro', type: 'textarea', span: 2 },
    {
      key: 'items',
      label: 'Refusals',
      type: 'repeater',
      span: 2,
      itemLabel: 'title',
      fields: [
        { key: 'title', label: 'Heading', type: 'text', span: 2 },
        { key: 'body', label: 'Explanation', type: 'textarea', span: 2 },
      ],
    },
  ],
  render: ({ data }) => {
    const items = asArray<any>(data.items).filter((item) => item?.title)
    if (!items.length) return null
    const doubled = [...items, ...items]
    return (
      <Section className="blk-values">
        <SectionHead label={data.label} title={data.title} body={data.body} />
        <div className="marquee marquee--values">
          <div className="marquee__track">
            {doubled.map((item, index) => (
              <div className="value" key={index}>
                <span className="value__mark" aria-hidden="true">
                  ✕
                </span>
                <h3 className="value__title">{item.title}</h3>
                {item.body ? <p className="value__body">{item.body}</p> : null}
              </div>
            ))}
          </div>
        </div>
      </Section>
    )
  },
})

registerBlock({
  type: 'applicationForm',
  label: 'Application form',
  group: 'convert',
  hint: 'A multi-step intake form. Submissions land in the admin under Enquiries.',
  initial: () => ({
    label: 'Apply',
    title: 'Start your application',
    body: 'Three short steps. An advisor reviews it and replies within one working day.',
    submit_label: 'Submit my application',
    success_title: 'Application received',
    success_body: 'An advisor will review your details and reply within one working day.',
    steps: [
      { title: 'About you', description: 'So we know who we are advising and how to reach you.' },
      { title: 'Your study plans', description: 'Rough answers are fine — we will refine them together.' },
      { title: 'How we can help', description: 'Tick everything you want help with. You can change this later.' },
    ],
    fields: [],
  }),
  fields: [
    { key: 'label', label: 'Label', type: 'text', span: 1 },
    { key: 'submit_label', label: 'Submit button', type: 'text', span: 1 },
    { key: 'title', label: 'Heading', type: 'text', span: 2 },
    { key: 'body', label: 'Intro', type: 'textarea', span: 2 },
    { key: 'success_title', label: 'Success heading', type: 'text', span: 1 },
    { key: 'success_body', label: 'Success message', type: 'text', span: 1 },
    {
      key: 'steps',
      label: 'Steps',
      type: 'repeater',
      span: 2,
      itemLabel: 'title',
      fields: [
        { key: 'title', label: 'Step name', type: 'text', span: 1 },
        { key: 'description', label: 'Step description', type: 'text', span: 1 },
      ],
    },
    {
      key: 'fields',
      label: 'Questions',
      type: 'repeater',
      span: 2,
      itemLabel: 'label',
      fields: [
        { key: 'label', label: 'Question', type: 'text', span: 1 },
        {
          key: 'key',
          label: 'Field key',
          type: 'text',
          span: 1,
          help: 'Lowercase, no spaces. Use name, email, phone, whatsapp, country, level, message so the enquiry list groups them correctly.',
        },
        {
          key: 'type',
          label: 'Answer type',
          type: 'select',
          span: 1,
          options: ['text', 'email', 'tel', 'number', 'date', 'textarea', 'select', 'checkboxes', 'heading'],
        },
        { key: 'step', label: 'Step number', type: 'number', span: 1, help: '1, 2 or 3.' },
        { key: 'required', label: 'Required', type: 'boolean', span: 1 },
        { key: 'placeholder', label: 'Placeholder', type: 'text', span: 1 },
        { key: 'options', label: 'Options (select / checkboxes)', type: 'list', span: 2, help: 'One per line.' },
      ],
    },
  ],
  render: ({ data, ctx }) => {
    const steps = asArray<any>(data.steps)
      .filter((step) => step?.title)
      .map((step) => ({ title: step.title, description: step.description }))

    const fields = asArray<any>(data.fields)
      .filter((field) => field?.key && field?.label)
      .map((field) => ({
        key: field.key,
        label: field.label,
        type: field.type || 'text',
        required: Boolean(field.required),
        options: asList(field.options),
        placeholder: field.placeholder || '',
        step: Number(field.step || 1),
      }))

    if (!fields.length) return null

    const wa = String(ctx.settings.contact.whatsapp || '').replace(/[^\d]/g, '')
    const text = encodeURIComponent(ctx.settings.contact.whatsapp_message || '')
    const whatsappUrl = wa ? `https://wa.me/${wa}${text ? `?text=${text}` : ''}` : undefined

    return (
      <Section className="blk-appform" id="apply">
        <div className="appform-shell">
          <div className="appform-shell__intro">
            {data.label ? <p className="label">{data.label}</p> : null}
            {data.title ? <h2 className="h2">{data.title}</h2> : null}
            {data.body ? <p className="lede">{data.body}</p> : null}
          </div>
          <ApplicationForm
            steps={steps.length ? steps : [{ title: 'Your details' }]}
            fields={fields}
            submitLabel={data.submit_label || 'Submit application'}
            successTitle={data.success_title || 'Application received'}
            successBody={data.success_body || 'An advisor will reply within one working day.'}
            whatsappUrl={whatsappUrl}
            labels={{
              pleaseChoose: ctx.i18n.t('form.pleaseChoose'),
              continue: ctx.i18n.t('form.continue'),
              back: ctx.i18n.t('form.back'),
              submitting: ctx.i18n.t('form.submitting'),
              required: ctx.i18n.t('form.required'),
              invalidEmail: ctx.i18n.t('form.invalidEmail'),
              chooseAtLeastOne: ctx.i18n.t('form.chooseAtLeastOne'),
              summaryName: ctx.i18n.t('form.summaryName'),
              summaryEmail: ctx.i18n.t('form.summaryEmail'),
              summaryHelp: ctx.i18n.t('form.summaryHelp'),
            }}
          />
        </div>
      </Section>
    )
  },
})

registerBlock({
  type: 'contactDetails',
  label: 'Contact details',
  group: 'convert',
  hint: 'Email, phone, WhatsApp, address and social links.',
  initial: () => ({ label: 'Direct', title: 'Or reach us directly', body: '' }),
  fields: [
    { key: 'label', label: 'Label', type: 'text', span: 1 },
    { key: 'title', label: 'Heading', type: 'text', span: 1 },
    { key: 'body', label: 'Intro', type: 'textarea', span: 2 },
  ],
  render: ({ data, ctx }) => {
    const { contact, social } = ctx.settings
    const wa = String(contact.whatsapp || '').replace(/[^\d]/g, '')
    return (
      <Section className="blk-contact">
        <SectionHead label={data.label} title={data.title} body={data.body} />
        <div className="contact-grid">
          {contact.email ? (
            <a className="contact-item" href={`mailto:${contact.email}`}>
              <span className="contact-item__label">{ctx.i18n.t('contact.email')}</span>
              <span className="contact-item__value">{contact.email}</span>
            </a>
          ) : null}
          {contact.phone ? (
            <a className="contact-item" href={`tel:${contact.phone.replace(/\s/g, '')}`}>
              <span className="contact-item__label">{ctx.i18n.t('contact.phone')}</span>
              <span className="contact-item__value">{contact.phone}</span>
            </a>
          ) : null}
          {wa ? (
            <a className="contact-item" href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer">
              <span className="contact-item__label">{ctx.i18n.t('contact.whatsapp')}</span>
              <span className="contact-item__value">{ctx.i18n.t('cta.chatWhatsapp')}</span>
            </a>
          ) : null}
          {contact.address ? (
            <div className="contact-item">
              <span className="contact-item__label">{ctx.i18n.t('contact.office')}</span>
              <span className="contact-item__value">{contact.address}</span>
            </div>
          ) : null}
          {contact.hours ? (
            <div className="contact-item">
              <span className="contact-item__label">{ctx.i18n.t('contact.hours')}</span>
              <span className="contact-item__value">{contact.hours}</span>
            </div>
          ) : null}
          {social.linkedin || social.facebook || social.instagram ? (
            <div className="contact-item contact-item--social">
              <span className="contact-item__label">{ctx.i18n.t('contact.follow')}</span>
              <span className="contact-item__value contact-item__value--links">
                {social.linkedin ? <a href={social.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a> : null}
                {social.facebook ? <a href={social.facebook} target="_blank" rel="noopener noreferrer">Facebook</a> : null}
                {social.instagram ? <a href={social.instagram} target="_blank" rel="noopener noreferrer">Instagram</a> : null}
              </span>
            </div>
          ) : null}
        </div>
      </Section>
    )
  },
})

registerBlock({
  type: 'whatsappFloat',
  label: 'Floating WhatsApp',
  group: 'convert',
  hint: 'A button pinned to the bottom of the screen.',
  initial: () => ({ label: 'Chat on WhatsApp' }),
  fields: [{ key: 'label', label: 'Button label', type: 'text', span: 2 }],
  render: ({ data, ctx }) => {
    const wa = String(ctx.settings.contact.whatsapp || '').replace(/[^\d]/g, '')
    if (!wa) return null
    const text = encodeURIComponent(ctx.settings.contact.whatsapp_message || '')
    return (
      <a className="wa-float" href={`https://wa.me/${wa}${text ? `?text=${text}` : ''}`} target="_blank" rel="noopener noreferrer">
        <span className="wa-float__dot" aria-hidden="true" />
        {data.label || 'Chat on WhatsApp'}
      </a>
    )
  },
})

/* ------------------------------ import side ------------------------------ */
// Importing this module registers every block above. Consumers should import
// from '@/lib/kernel/blocks' so the registry is populated before rendering.

export { Chip, money, plain, formatDate }
export type { RenderCtx }
