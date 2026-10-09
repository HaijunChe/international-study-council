/**
 * Build the voxel world map asset.
 *
 *   node scripts/build-world-map.mjs
 *
 * Rasterises the Natural Earth 110m country boundaries onto a coarse grid so the
 * map can be drawn as chunky blocks — Minecraft-style grain rather than smooth
 * outlines. Each country becomes a list of grid cells; the renderer draws one
 * block per cell and raises the ones that are live.
 *
 * Output is committed to lib/data/world-map.json and imported by the server. Re-run only to change the
 * resolution or the projection.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const ROOT = path.join(import.meta.dirname, '..')
const SOURCE = process.env.TOPOJSON_PATH || '/tmp/wa.json'
const ISO_PATH = process.env.ISO_PATH || '/tmp/iso.json'
const OUT = path.join(ROOT, 'lib', 'data', 'world-map.json')

/* Equirectangular, cropped to drop Antarctica and the empty polar bands. */
const WIDTH = 1000
const LAT_TOP = 84
const LAT_BOTTOM = -60
const HEIGHT = Math.round((WIDTH * (LAT_TOP - LAT_BOTTOM)) / 360) // 400

/** Block size in viewBox units. Smaller = finer grain, more elements. */
const CELL = 4
const COLS = Math.floor(WIDTH / CELL)
const ROWS = Math.floor(HEIGHT / CELL)

const toLon = (col) => ((col + 0.5) / COLS) * 360 - 180
const toLat = (row) => LAT_TOP - ((row + 0.5) / ROWS) * (LAT_TOP - LAT_BOTTOM)

/**
 * Small states the 1:110m dataset omits entirely. They get a single block at
 * their real coordinates so the country is still clickable.
 */
const POINT_MARKERS = {
  SG: { name: 'Singapore', lon: 103.82, lat: 1.35 },
  MT: { name: 'Malta', lon: 14.51, lat: 35.9 },
  MU: { name: 'Mauritius', lon: 57.55, lat: -20.28 },
  HK: { name: 'Hong Kong, China', lon: 114.17, lat: 22.32 },
  BH: { name: 'Bahrain', lon: 50.55, lat: 26.07 },
  MV: { name: 'Maldives', lon: 73.5, lat: 3.2 },
  SC: { name: 'Seychelles', lon: 55.45, lat: -4.62 },
  BB: { name: 'Barbados', lon: -59.55, lat: 13.19 },
}

function decodeArcs(topology) {
  const { scale, translate } = topology.transform
  return topology.arcs.map((arc) => {
    let x = 0
    let y = 0
    return arc.map(([dx, dy]) => {
      x += dx
      y += dy
      return [x * scale[0] + translate[0], y * scale[1] + translate[1]]
    })
  })
}

function ringFromArcs(indexes, arcs) {
  const points = []
  let first = true
  for (const index of indexes) {
    const arc = index >= 0 ? arcs[index] : arcs[~index].slice().reverse()
    for (let i = first ? 0 : 1; i < arc.length; i += 1) points.push(arc[i])
    first = false
  }
  return points
}

function bbox(ring) {
  let minLon = Infinity
  let minLat = Infinity
  let maxLon = -Infinity
  let maxLat = -Infinity
  for (const [lon, lat] of ring) {
    if (lon < minLon) minLon = lon
    if (lat < minLat) minLat = lat
    if (lon > maxLon) maxLon = lon
    if (lat > maxLat) maxLat = lat
  }
  return { minLon, minLat, maxLon, maxLat }
}

/** Ray casting. Rings are [lon, lat] pairs. */
function pointInRing(lon, lat, ring) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

function geometryToShapes(geometry, arcs) {
  if (!geometry) return []
  if (geometry.type === 'GeometryCollection') {
    return (geometry.geometries || []).flatMap((child) => geometryToShapes(child, arcs))
  }
  const polygons =
    geometry.type === 'Polygon' ? [geometry.arcs] : geometry.type === 'MultiPolygon' ? geometry.arcs : []

  const shapes = []
  for (const polygon of polygons) {
    const rings = polygon.map((ring) => ringFromArcs(ring, arcs))
    if (!rings.length || rings[0].length < 3) continue
    const box = bbox(rings[0])
    const w = box.maxLon - box.minLon
    const h = box.maxLat - box.minLat
    if (w * h < 0.012) continue // sub-pixel islands would just be noise
    shapes.push({ outer: rings[0], holes: rings.slice(1), box })
  }
  return shapes
}

async function main() {
  const topology = JSON.parse(await readFile(SOURCE, 'utf8'))
  const isoRows = JSON.parse(await readFile(ISO_PATH, 'utf8'))

  const numericToAlpha2 = new Map()
  for (const row of isoRows) {
    const [alpha2, , numeric] = row
    if (alpha2 && numeric) numericToAlpha2.set(String(Number(numeric)).padStart(3, '0'), alpha2)
  }

  const arcs = decodeArcs(topology)
  const countries = new Map()

  for (const geometry of topology.objects.countries.geometries) {
    const iso = numericToAlpha2.get(String(Number(geometry.id)).padStart(3, '0'))
    if (!iso) continue
    const shapes = geometryToShapes(geometry, arcs)
    if (!shapes.length) continue
    countries.set(iso, { name: geometry.properties?.name || iso, shapes, cells: new Set() })
  }

  // Rasterise: for every grid cell centre, find the country that contains it.
  for (let row = 0; row < ROWS; row += 1) {
    const lat = toLat(row)
    for (let col = 0; col < COLS; col += 1) {
      const lon = toLon(col)
      for (const [iso, country] of countries) {
        let hit = false
        for (const shape of country.shapes) {
          const box = shape.box
          if (lon < box.minLon || lon > box.maxLon || lat < box.minLat || lat > box.maxLat) continue
          if (!pointInRing(lon, lat, shape.outer)) continue
          if (shape.holes.some((hole) => pointInRing(lon, lat, hole))) continue
          hit = true
          break
        }
        if (hit) {
          country.cells.add(row * COLS + col)
          break
        }
      }
    }
  }

  const output = {}
  let totalCells = 0
  let tooSmall = 0

  for (const [iso, country] of countries) {
    let cells = [...country.cells].map((index) => [index % COLS, Math.floor(index / COLS)])
    let tiny = false

    if (!cells.length) {
      // Too small to survive rasterising — fall back to the largest shape's centre.
      const shape = country.shapes.reduce((best, item) => {
        const area = (item.box.maxLon - item.box.minLon) * (item.box.maxLat - item.box.minLat)
        return area > best.area ? { area, item } : best
      }, { area: -1, item: country.shapes[0] }).item
      const lon = (shape.box.minLon + shape.box.maxLon) / 2
      const lat = (shape.box.minLat + shape.box.maxLat) / 2
      cells = [
        [
          Math.min(COLS - 1, Math.max(0, Math.floor(((lon + 180) / 360) * COLS))),
          Math.min(ROWS - 1, Math.max(0, Math.floor(((LAT_TOP - lat) / (LAT_TOP - LAT_BOTTOM)) * ROWS))),
        ],
      ]
      tiny = true
      tooSmall += 1
    }

    totalCells += cells.length
    output[iso] = { name: country.name, tiny, cells }
  }

  for (const [iso, marker] of Object.entries(POINT_MARKERS)) {
    if (output[iso]) continue
    output[iso] = {
      name: marker.name,
      tiny: true,
      cells: [
        [
          Math.floor(((marker.lon + 180) / 360) * COLS),
          Math.floor(((LAT_TOP - marker.lat) / (LAT_TOP - LAT_BOTTOM)) * ROWS),
        ],
      ],
    }
    totalCells += 1
  }

  const payload = {
    source: 'Natural Earth 110m via world-atlas (public domain), rasterised to a block grid',
    cell: CELL,
    cols: COLS,
    rows: ROWS,
    width: WIDTH,
    height: HEIGHT,
    countries: output,
  }

  await mkdir(path.dirname(OUT), { recursive: true })
  await writeFile(OUT, JSON.stringify(payload))

  const bytes = Buffer.byteLength(JSON.stringify(payload))
  console.log(`grid              : ${COLS} x ${ROWS} at ${CELL}px`)
  console.log(`countries         : ${Object.keys(output).length}`)
  console.log(`land blocks       : ${totalCells}`)
  console.log(`too small to draw : ${tooSmall} (rendered as a single block)`)
  console.log(`file size         : ${(bytes / 1024).toFixed(1)} KB`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
