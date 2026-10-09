'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { blocksToPath, type WorldGeometry } from '@/lib/kernel/world'

export type MapCountry = {
  iso: string
  name: string
  slug: string
  flag?: string
  status: 'live' | 'progress' | 'none'
  tuition?: string
  living?: string
  intakes?: string
  programmes?: string[]
}

const FALLBACK = {
  live: 'live',
  inProgress: 'in progress',
  notCovered: 'Not covered yet',
  statusLive: 'Live',
  statusProgress: 'In progress',
  hint: 'Hover a lit country to see what we offer there.',
  readGuide: 'Read the guide',
  fallback: 'The map could not be loaded, but every destination is listed below.',
  empty: 'More destinations are being added.',
}

export type MapLabels = Partial<typeof FALLBACK>

/**
 * The geometry is passed in from the server rather than fetched, so the blocks
 * are part of the initial HTML — the map paints immediately and works with
 * JavaScript disabled.
 */
export default function WorldMap({
  countries,
  world,
  labels = {},
}: {
  countries: MapCountry[]
  world: WorldGeometry
  labels?: MapLabels
}) {
  const L = (key: keyof typeof FALLBACK) => labels[key] || FALLBACK[key]
  const [hover, setHover] = useState<MapCountry | null>(null)

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
      const count = geo.cells.length
      return {
        iso,
        status,
        country,
        top: blocksToPath(geo.cells, world.cell, inset),
        side: status === 'none' ? '' : blocksToPath(geo.cells, world.cell, inset, 2.6),
        cx: (sumCol / count + 0.5) * world.cell,
        cy: (sumRow / count + 0.5) * world.cell,
        hit: geo.tiny || count <= 2,
        // Sweep the lights in from west to east.
        delay: Math.round((minCol / world.cols) * 900),
      }
    })
  }, [world, byIso])

  const live = countries.filter((c) => c.status === 'live')
  const progress = countries.filter((c) => c.status === 'progress')

  return (
    <div className="wm">
      <div className="wm__canvas">
        <svg
          viewBox={`0 0 ${world.width} ${world.height}`}
          role="img"
          aria-label="World map of destinations"
          preserveAspectRatio="xMidYMid meet"
        >
          <title>Destinations we support</title>
          {shapes.map((shape) => (
            <g
              key={shape.iso}
              className={`vx vx--${shape.status}${shape.country ? ' is-target' : ''}`}
              style={{ animationDelay: `${shape.delay}ms` }}
              onMouseEnter={() => shape.country && setHover(shape.country)}
              onMouseLeave={() => setHover(null)}
            >
              {shape.side ? <path className="vx__side" d={shape.side} /> : null}
              <path className="vx__top" d={shape.top} />
              {shape.hit ? <circle className="vx__hit" cx={shape.cx} cy={shape.cy} r={9} /> : null}
            </g>
          ))}
        </svg>
      </div>

      <div className="wm__foot">
        <div className="wm__legend">
          <span className="wm__key">
            <i className="wm__swatch wm__swatch--live" />
            {live.length} {L('live')}
          </span>
          <span className="wm__key">
            <i className="wm__swatch wm__swatch--progress" />
            {progress.length} {L('inProgress')}
          </span>
        </div>

        <div className="wm__readout" aria-live="polite">
          {hover ? (
            <>
              <span className="wm__readout-name">
                <span className="wm__readout-flag">{hover.flag}</span>
                {hover.name}
              </span>
              <span className={`wm__status wm__status--${hover.status}`}>
                {hover.status === 'live'
                  ? L('statusLive')
                  : hover.status === 'progress'
                    ? L('statusProgress')
                    : L('notCovered')}
              </span>
              {hover.tuition ? <span className="wm__readout-meta">{hover.tuition}</span> : null}
              <Link className="wm__readout-link" href={`/destinations/${hover.slug}`}>
                {L('readGuide')} →
              </Link>
            </>
          ) : (
            <span className="wm__readout-hint">{countries.length ? L('hint') : L('empty')}</span>
          )}
        </div>
      </div>

      <ul className="sr-only">
        {countries.map((country) => (
          <li key={country.iso}>
            {country.name} — {country.status === 'live' ? L('live') : L('inProgress')}
          </li>
        ))}
      </ul>
    </div>
  )
}
