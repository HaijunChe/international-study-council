/**
 * The ISC mark, built the way the reference builds its own: chunky rectangular
 * blocks on a small grid, three colours, no curves.
 *
 *   grid      11 columns × 5 rows
 *   inset     a hair of gap between blocks so each piece stays readable
 *
 * Each letter is its own group so it can fall in independently — the letters
 * land one after another and stack up into the wordmark.
 */

type Rect = { x: number; y: number; w: number; h: number }

const LETTERS: Array<{ key: string; tint: string; rects: Rect[] }> = [
  {
    key: 'i',
    tint: '#F09082',
    rects: [
      { x: 0, y: 0, w: 3, h: 1 },
      { x: 1, y: 1, w: 1, h: 3 },
      { x: 0, y: 4, w: 3, h: 1 },
    ],
  },
  {
    key: 's',
    tint: '#4D9ABF',
    rects: [
      { x: 4, y: 0, w: 3, h: 1 },
      { x: 4, y: 1, w: 1, h: 1 },
      { x: 4, y: 2, w: 3, h: 1 },
      { x: 6, y: 3, w: 1, h: 1 },
      { x: 4, y: 4, w: 3, h: 1 },
    ],
  },
  {
    key: 'c',
    tint: '#F1BE58',
    rects: [
      { x: 8, y: 0, w: 3, h: 1 },
      { x: 8, y: 1, w: 1, h: 3 },
      { x: 8, y: 4, w: 3, h: 1 },
    ],
  },
]

const COLS = 11
const ROWS = 5
/** Gap between blocks, in grid units. */
const INSET = 0.07

function toPath(rects: Rect[]): string {
  let d = ''
  for (const r of rects) {
    const x = r.x + INSET
    const y = r.y + INSET
    const w = r.w - INSET * 2
    const h = r.h - INSET * 2
    d += `M${x} ${y}h${w}v${h}h${-w}z`
  }
  return d
}

const LETTER_PATHS = LETTERS.map((letter) => ({ ...letter, d: toPath(letter.rects) }))

/**
 * `animate` falls the letters in one after another; the flat version is used in
 * the navigation bar.
 */
export default function IscMark({
  label = 'International Study Council',
  animate = false,
  className = '',
}: {
  label?: string
  animate?: boolean
  className?: string
}) {
  return (
    <svg
      className={`isc${animate ? ' isc--animate' : ''}${className ? ` ${className}` : ''}`}
      viewBox={`0 0 ${COLS} ${ROWS}`}
      role="img"
      aria-label={label}
      preserveAspectRatio="xMidYMid meet"
    >
      <title>{label}</title>
      {LETTER_PATHS.map((letter, index) => (
        <path
          key={letter.key}
          className="isc__letter"
          style={{ '--i': index } as React.CSSProperties}
          d={letter.d}
          fill={letter.tint}
        />
      ))}
    </svg>
  )
}
