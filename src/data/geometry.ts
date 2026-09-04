/**
 * Coordinate helpers.
 *
 * Every room position in `locations.ts` is taken from the as-built
 * drawings (OG-ODC-CVL-AB-ARCH-16-A / -B / -C). Those sheets are A0
 * pages measured in PDF points; the helpers below move each floor's
 * plan into its own SVG viewBox without distorting the layout.
 */

import type { Pt } from './types'

/* ------------------------------------------------------------------ */
/* Per-floor transforms: drawing points -> SVG units                   */
/* ------------------------------------------------------------------ */

/** Ground floor sheet: plan occupies x 180..1910, y 170..1500. */
export const g = (x: number, y: number): Pt => [x - 120, y - 130]

/** First floor sheet: plan occupies x 128..1955, y 963..1398. */
export const f1 = (x: number, y: number): Pt => [x - 90, (y - 963) * 0.9977 + 78]

/** Second floor sheet: plan occupies x 130..1955, y 1066..1487. */
export const f2 = (x: number, y: number): Pt => [x - 90, (y - 1066) * 1.0333 + 78]

export type Xf = (x: number, y: number) => Pt

/** Axis-aligned rectangle from two opposite corners. */
export const rect = (t: Xf, x0: number, y0: number, x1: number, y1: number): Pt[] => [
  t(x0, y0),
  t(x1, y0),
  t(x1, y1),
  t(x0, y1),
]

/** Polygon from a flat list of drawing-space coordinate pairs. */
export const poly = (t: Xf, pts: [number, number][]): Pt[] => pts.map(([x, y]) => t(x, y))

/* ------------------------------------------------------------------ */
/* Ground floor: the angled postgraduate wing                          */
/* ------------------------------------------------------------------ */

/**
 * The north-west wing of the ground floor is rotated about 21.4 degrees
 * anticlockwise. Working in wing-local coordinates keeps every
 * consulting bay parallel to the real wall lines.
 *
 *   `a` runs along the wing, starting at its north-west tip
 *   `b` runs across the wing, 0 at the north facade
 */
const WING_ORIGIN = { x: 188, y: 528 }
const WING_U = { x: 0.9313, y: -0.3641 }
const WING_V = { x: 0.3641, y: 0.9313 }

/** Wing-local (a, b) -> drawing-space point. */
export const wingPt = (a: number, b: number): [number, number] => [
  WING_ORIGIN.x + a * WING_U.x + b * WING_V.x,
  WING_ORIGIN.y + a * WING_U.y + b * WING_V.y,
]

/** Wing-local (a, b) -> SVG point. */
export const w = (a: number, b: number): Pt => {
  const [x, y] = wingPt(a, b)
  return g(x, y)
}

/** Wing-local rectangle -> SVG polygon. */
export const wRect = (a0: number, b0: number, a1: number, b1: number): Pt[] => [
  w(a0, b0),
  w(a1, b0),
  w(a1, b1),
  w(a0, b1),
]

/** SVG point -> wing-local (a, b). The inverse of `w`. */
export const wingLocal = (p: Pt): Pt => {
  const dx = p[0] + 120 - WING_ORIGIN.x
  const dy = p[1] + 130 - WING_ORIGIN.y
  return [dx * WING_U.x + dy * WING_U.y, dx * WING_V.x + dy * WING_V.y]
}

/** Depth of the wing: rooms sit between b = 12 and b = 351. */
export const WING_SOUTH = 351

/* ------------------------------------------------------------------ */
/* Small geometry utilities used by the renderer                       */
/* ------------------------------------------------------------------ */

export const toPath = (pts: Pt[]): string =>
  pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ') + ' Z'

export const centroid = (pts: Pt[]): Pt => {
  let x = 0
  let y = 0
  for (const p of pts) {
    x += p[0]
    y += p[1]
  }
  return [x / pts.length, y / pts.length]
}

export const boundsOf = (polys: Pt[][]): { x: number; y: number; w: number; h: number } => {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const ring of polys) {
    for (const [x, y] of ring) {
      if (x < minX) minX = x
      if (y < minY) minY = y
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
    }
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
}
