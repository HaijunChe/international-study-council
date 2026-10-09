'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import Icon, { type IconName } from './Icon'
import { blocksToPath, type WorldGeometry } from '@/lib/kernel/world'

export type ScrollySection = {
  id: string
  label: string
  title: string
  body: string
  points: string[]
  cta?: { label: string; href: string }
}

type DemoService = { name: string; price: string; icon: IconName }
type DemoMapCountry = { iso: string; name: string; flag: string; status: 'live' | 'progress' | 'none' }

export default function Scrolly({
  sections,
  services,
  mapCountries,
  world,
  locale,
  mapLabels,
}: {
  sections: ScrollySection[]
  services: DemoService[]
  mapCountries: DemoMapCountry[]
  world: WorldGeometry
  locale: string
  mapLabels: { live: string; inProgress: string; readGuide: string }
}) {
  const [active, setActive] = useState(0)
  const refs = useRef<Array<HTMLElement | null>>([])

  useEffect(() => {
    const nodes = refs.current.filter(Boolean) as HTMLElement[]
    if (!nodes.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top))
        if (!visible.length) return
        const index = Number((visible[0].target as HTMLElement).dataset.index)
        if (!Number.isNaN(index)) setActive(index)
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
    )

    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [sections.length])

  const href = (path: string) => (locale === 'en' ? path : path === '/' ? `/${locale}` : `/${locale}${path}`)
  const current = sections[active]

  return (
    <div className="scrolly">
      <div className="scrolly__stage">
        <div className="screen">
          <div className="screen__bar">
            <span className="screen__title">{current?.label}</span>
            <span className="screen__url" aria-hidden="true">
              internationalstudycouncil.com
            </span>
          </div>
          <div className="screen__body">
            {/* Keyed on the active section so each demo replays on arrival. */}
            <Demo
              key={active}
              kind={current?.id}
              points={current?.points ?? []}
              services={services}
              mapCountries={mapCountries}
              world={world}
              mapLabels={mapLabels}
            />
          </div>
        </div>
      </div>

      <div className="scrolly__flow">
        {sections.map((section, index) => (
          <section
            key={section.id}
            data-index={index}
            ref={(node) => {
              refs.current[index] = node
            }}
            className={`scrolly__step${index === active ? ' is-active' : ''}`}
          >
            <p className="label">{section.label}</p>
            <h3 className="h2">{section.title}</h3>
            <p className="scrolly__body">{section.body}</p>
            {section.points.length ? (
              <ul className="scrolly__points">
                {section.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            ) : null}
            {section.cta ? (
              <Link className="btn btn--ghost btn--sm" href={href(section.cta.href)}>
                {section.cta.label}
              </Link>
            ) : null}
          </section>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------- demos ---------------------------------- */

function Demo({
  kind,
  points,
  services,
  mapCountries,
  world,
  mapLabels,
}: {
  kind?: string
  points: string[]
  services: DemoService[]
  mapCountries: DemoMapCountry[]
  world: WorldGeometry
  mapLabels: { live: string; inProgress: string; readGuide: string }
}) {
  switch (kind) {
    case 'services':
      return <DemoServices services={services} />
    case 'process':
      return <DemoProcess />
    case 'search':
      return <DemoSearch />
    case 'map':
      return <DemoMap countries={mapCountries} world={world} labels={mapLabels} />
    case 'apply':
      return <DemoApply />
    case 'why':
      return <DemoWhy />
    default:
      return null
  }
}

/** Shared chrome so every demo reads as the same product. */
function Head({ title, meta }: { title: string; meta: string }) {
  return (
    <header className="dm__head">
      <span className="dm__h">{title}</span>
      <span className="dm__sub">{meta}</span>
    </header>
  )
}

function Foot({ children }: { children: React.ReactNode }) {
  return <footer className="dm__foot">{children}</footer>
}

/* -------------------------------- services ------------------------------- */

function DemoServices({ services }: { services: DemoService[] }) {
  const shown = services.slice(0, 5)
  const picked = 3
  const total = 10
  return (
    <div className="dm dm--services">
      <Head title="Choose your services" meta={`${picked} of ${total}`} />
      <ul className="dm__list">
        {shown.map((service, index) => {
          const on = index < picked
          return (
            <li
              className={`dm__row dm__row--pick${on ? ' is-picked' : ''}`}
              key={service.name}
              style={{ animationDelay: `${index * 110}ms`, '--pick': `${420 + index * 300}ms` } as React.CSSProperties}
            >
              <span className={`dm__box${on ? ' is-on' : ''}`} style={{ animationDelay: `${420 + index * 300}ms` }}>
                <Icon name="check" size={11} />
              </span>
              <span className="dm__icon">
                <Icon name={service.icon} size={15} />
              </span>
              <span className="dm__name">{service.name}</span>
              <span className="dm__meta">{service.price}</span>
            </li>
          )
        })}
      </ul>
      <div className="dm__total" style={{ animationDelay: `${420 + picked * 300 + 200}ms` }}>
        <span>Running total</span>
        <strong>USD 620</strong>
      </div>
      <div className="dm__meter" aria-hidden="true">
        <span style={{ animationDelay: '420ms' }} />
      </div>
      <Foot>
        <span>Free assessment included</span>
        <span>{picked} of {total} services</span>
      </Foot>
    </div>
  )
}

/* --------------------------------- process ------------------------------- */

function DemoProcess() {
  const steps = [
    { name: 'Free assessment', meta: '30 minutes', state: 'done' },
    { name: 'Shortlist written up', meta: '5–8 programmes', state: 'done' },
    { name: 'Applications submitted', meta: 'SOP · CV · portals', state: 'active' },
    { name: 'Visa file & briefing', meta: 'before you fly', state: 'todo' },
  ]
  return (
    <div className="dm dm--process">
      <Head title="Your application" meta="Week 1 → Week 6" />
      <ol className="dm__timeline">
        {steps.map((step, index) => (
          <li className={`dm__tl is-${step.state}`} key={step.name} style={{ animationDelay: `${index * 420}ms` }}>
            <span className="dm__tl-node">
              {step.state === 'done' ? <Icon name="check" size={11} /> : null}
              {step.state === 'active' ? <span className="dm__tl-pulse" /> : null}
            </span>
            <span className="dm__tl-body">
              <span className="dm__tl-name">{step.name}</span>
              <span className="dm__tl-meta">{step.meta}</span>
            </span>
            {index < steps.length - 1 ? (
              <span className="dm__tl-link" style={{ animationDelay: `${index * 420 + 240}ms` }} aria-hidden="true" />
            ) : null}
          </li>
        ))}
      </ol>
      <Foot>
        <span>2 of 4 complete</span>
        <span>On track for September</span>
      </Foot>
    </div>
  )
}

/* --------------------------------- search -------------------------------- */

function DemoSearch() {
  const results = [
    { name: 'TU Munich', meta: 'No tuition', flag: '🇩🇪' },
    { name: 'RWTH Aachen', meta: 'No tuition', flag: '🇩🇪' },
    { name: 'Uni Freiburg', meta: 'EUR 1,500 / yr', flag: '🇩🇪' },
  ]
  return (
    <div className="dm dm--search">
      <Head title="Find your destination" meta="⌘K anywhere" />
      <div className="dm__field">
        <Icon name="search" size={15} />
        <span className="dm__typed">germany</span>
        <span className="dm__caret" aria-hidden="true" />
      </div>
      <div className="dm__chips">
        {['No tuition', 'English-taught', "Bachelor's"].map((chip, index) => (
          <span className="dm__chip" key={chip} style={{ animationDelay: `${1150 + index * 260}ms` }}>
            {chip}
          </span>
        ))}
      </div>
      <ul className="dm__list dm__list--results">
        {results.map((row, index) => (
          <li className="dm__row dm__row--result" key={row.name} style={{ animationDelay: `${2150 + index * 170}ms` }}>
            <span className="dm__flag">{row.flag}</span>
            <span className="dm__name">{row.name}</span>
            <span className="dm__meta">{row.meta}</span>
          </li>
        ))}
      </ul>
      <Foot>
        <span>3 results</span>
        <span>Filters applied: 3</span>
      </Foot>
    </div>
  )
}

/* ---------------------------------- map ---------------------------------- */

function DemoMap({
  countries,
  world,
  labels,
}: {
  countries: DemoMapCountry[]
  world: WorldGeometry
  labels: { live: string; inProgress: string; readGuide: string }
}) {
  const byIso = useMemo(() => new Map(countries.map((c) => [c.iso.toUpperCase(), c])), [countries])

  const shapes = useMemo(() => {
    const inset = world.cell * 0.14
    return Object.entries(world.countries).map(([iso, geo]) => {
      const country = byIso.get(iso)
      const status = country ? country.status : 'none'
      let minCol = Infinity
      let sumCol = 0
      let sumRow = 0
      for (const [col, row] of geo.cells) {
        if (col < minCol) minCol = col
        sumCol += col
        sumRow += row
      }
      return {
        iso,
        status,
        top: blocksToPath(geo.cells, world.cell, inset),
        side: status === 'none' ? '' : blocksToPath(geo.cells, world.cell, inset, 2),
        cx: (sumCol / geo.cells.length + 0.5) * world.cell,
        cy: (sumRow / geo.cells.length + 0.5) * world.cell,
        hit: geo.tiny || geo.cells.length <= 2,
        delay: Math.round((minCol / world.cols) * 1400),
      }
    })
  }, [world, byIso])

  const live = countries.filter((c) => c.status === 'live')
  const progress = countries.filter((c) => c.status === 'progress')

  return (
    <div className="dm dm--map">
      <Head title="Where we can take you" meta="Live coverage" />
      <div className="dm__mapwrap">
        <svg viewBox={`0 0 ${world.width} ${world.height}`} aria-hidden="true">
          {shapes.map((shape) => (
            <g key={shape.iso} className={`vx vx--${shape.status}`} style={{ animationDelay: `${shape.delay}ms` }}>
              {shape.side ? <path className="vx__side" d={shape.side} /> : null}
              <path className="vx__top" d={shape.top} />
              {shape.hit ? <circle className="vx__hit" cx={shape.cx} cy={shape.cy} r={9} /> : null}
            </g>
          ))}
        </svg>
      </div>
      <Foot>
        <span className="dm__key">
          <i className="dm__swatch dm__swatch--live" />
          {live.length} {labels.live}
        </span>
        <span className="dm__key">
          <i className="dm__swatch dm__swatch--progress" />
          {progress.length} {labels.inProgress}
        </span>
      </Foot>
    </div>
  )
}

/* --------------------------------- apply --------------------------------- */

function DemoApply() {
  const fields = [
    { label: 'Full name', value: 'Ayesha Rahman' },
    { label: 'Email', value: 'ayesha@example.com' },
    { label: 'Destination', value: 'Malaysia' },
    { label: 'Level', value: "Master's" },
  ]
  return (
    <div className="dm dm--apply">
      <Head title="Start your application" meta="Step 3 of 3" />
      <div className="dm__progress">
        {[0, 1, 2].map((step) => (
          <span key={step} style={{ animationDelay: `${step * 420}ms` }} />
        ))}
      </div>
      <div className="dm__form">
        {fields.map((field, index) => (
          <div className="dm__fieldrow" key={field.label} style={{ animationDelay: `${260 + index * 420}ms` }}>
            <span className="dm__flabel">{field.label}</span>
            <span className="dm__fvalue">
              <span className="dm__ftyped" style={{ animationDelay: `${480 + index * 420}ms` }}>
                {field.value}
              </span>
            </span>
          </div>
        ))}
      </div>
      <div className="dm__done" style={{ animationDelay: `${260 + fields.length * 420 + 260}ms` }}>
        <Icon name="check" size={13} />
        <span>Application received</span>
      </div>
      <Foot>
        <span>Free · no commitment</span>
        <span>Reply within 1 working day</span>
      </Foot>
    </div>
  )
}

/* ---------------------------------- why ---------------------------------- */

function DemoWhy() {
  const rows = [
    { them: 'Guaranteed', us: 'Honest odds' },
    { them: 'Hidden fees', us: 'Disclosed' },
    { them: 'Whoever is free', us: 'One advisor' },
    { them: '"From…"', us: 'In writing' },
  ]
  return (
    <div className="dm dm--why">
      <Head title="Why students pick us" meta="The difference, at a glance" />
      <div className="dm__vs">
        <div className="dm__vs-card dm__vs-card--them">
          <div className="dm__vs-head">
            <span className="dm__vs-name">The usual agency</span>
            <span className="dm__vs-score">0 / 4</span>
          </div>
          <div className="dm__vs-bar">
            <span style={{ animationDelay: '260ms' }} />
          </div>
          <ul className="dm__vs-list">
            {rows.map((row, index) => (
              <li key={row.them} style={{ animationDelay: `${340 + index * 130}ms` }}>
                <span className="dm__vs-mark">
                  <Icon name="cross" size={10} />
                </span>
                <span className="dm__vs-text">{row.them}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="dm__vs-card dm__vs-card--us">
          <div className="dm__vs-head">
            <span className="dm__vs-name">ISC</span>
            <span className="dm__vs-score">4 / 4</span>
          </div>
          <div className="dm__vs-bar">
            <span style={{ animationDelay: '420ms' }} />
          </div>
          <ul className="dm__vs-list">
            {rows.map((row, index) => (
              <li key={row.us} style={{ animationDelay: `${500 + index * 130}ms` }}>
                <span className="dm__vs-mark">
                  <Icon name="check" size={10} />
                </span>
                <span className="dm__vs-text">{row.us}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <Foot>
        <span>Every refusal is published</span>
        <span>5 differences</span>
      </Foot>
    </div>
  )
}
