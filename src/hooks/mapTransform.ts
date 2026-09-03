/**
 * Pure transform maths for the floor map.
 *
 * None of this touches the DOM or React, so it can run on every pointer
 * move without cost and can be tested directly.
 */

import type { Pt } from '../data/types'

export const MIN_SCALE = 0.75
export const MAX_SCALE = 6

/** How much of the plan must stay inside the view, as a fraction. */
const EDGE_MARGIN = 0.28

export interface Transform {
  k: number
  x: number
  y: number
}

export const IDENTITY: Transform = { k: 1, x: 0, y: 0 }

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

export const transformsEqual = (a: Transform, b: Transform) =>
  Math.abs(a.k - b.k) < 1e-4 && Math.abs(a.x - b.x) < 1e-3 && Math.abs(a.y - b.y) < 1e-3

export const toSvgTransform = (t: Transform) =>
  `translate(${t.x.toFixed(2)} ${t.y.toFixed(2)}) scale(${t.k.toFixed(5)})`

/**
 * Keep the scale within limits and the plan within reach.
 *
 * At least `EDGE_MARGIN` of the viewBox must still overlap the plan, so
 * the map can never be flung out of sight.
 */
export function constrain(t: Transform, width: number, height: number): Transform {
  const k = clamp(t.k, MIN_SCALE, MAX_SCALE)
  const mx = width * EDGE_MARGIN
  const my = height * EDGE_MARGIN
  return {
    k,
    x: clamp(t.x, -k * (width - mx), width - k * mx),
    y: clamp(t.y, -k * (height - my), height - k * my),
  }
}

/** Zoom by `factor` while holding `anchor` (in viewBox units) still. */
export function zoomAbout(
  t: Transform,
  factor: number,
  anchor: Pt,
  width: number,
  height: number,
): Transform {
  const k = clamp(t.k * factor, MIN_SCALE, MAX_SCALE)
  const ratio = k / t.k
  return constrain(
    {
      k,
      x: anchor[0] - (anchor[0] - t.x) * ratio,
      y: anchor[1] - (anchor[1] - t.y) * ratio,
    },
    width,
    height,
  )
}

/** Move the plan by a delta already expressed in viewBox units. */
export function panBy(t: Transform, dx: number, dy: number, width: number, height: number) {
  return constrain({ k: t.k, x: t.x + dx, y: t.y + dy }, width, height)
}

/**
 * One step of a two-finger gesture.
 *
 * Scales by how much the fingers spread since the previous frame and
 * translates by how far their midpoint moved, in a single update. A
 * pure two-finger drag therefore pans, a pure spread zooms about the
 * midpoint, and a finger arriving or leaving only resets the reference
 * — it never moves the map.
 */
export function pinchStep(
  t: Transform,
  previous: { dist: number; mid: Pt },
  next: { dist: number; mid: Pt },
  width: number,
  height: number,
): Transform {
  if (previous.dist <= 0 || next.dist <= 0) return t
  const k = clamp(t.k * (next.dist / previous.dist), MIN_SCALE, MAX_SCALE)
  const ratio = k / t.k
  return constrain(
    {
      k,
      x: next.mid[0] - (previous.mid[0] - t.x) * ratio,
      y: next.mid[1] - (previous.mid[1] - t.y) * ratio,
    },
    width,
    height,
  )
}

/** Put a point in the middle of the view at the given scale. */
export function centerOn(p: Pt, k: number, width: number, height: number): Transform {
  return constrain({ k, x: width / 2 - p[0] * k, y: height / 2 - p[1] * k }, width, height)
}

/** Fit a bounding box, with padding, into the view. */
export function fitBox(
  box: { x: number; y: number; w: number; h: number },
  width: number,
  height: number,
  pad = 1.5,
  maxScale = MAX_SCALE,
): Transform {
  const ceiling = Math.min(MAX_SCALE, maxScale)
  const k = clamp(Math.min(width / (box.w * pad), height / (box.h * pad)), MIN_SCALE, ceiling)
  return centerOn([box.x + box.w / 2, box.y + box.h / 2], k, width, height)
}

/* ------------------------------------------------------------------ */
/* Client space -> viewBox space                                       */
/* ------------------------------------------------------------------ */

/**
 * Everything needed to convert a pointer position into viewBox units.
 *
 * The SVG uses `preserveAspectRatio="xMidYMid meet"`, so the mapping is
 * a uniform scale plus a centring offset. Deriving it once per gesture
 * from the element's rectangle replaces a `getScreenCTM()`,
 * `createSVGPoint()` and matrix inversion on every single move.
 */
export interface ViewportMap {
  scale: number
  offsetX: number
  offsetY: number
}

export function viewportMap(
  rect: { left: number; top: number; width: number; height: number },
  width: number,
  height: number,
): ViewportMap {
  const scale = Math.min(rect.width / width, rect.height / height) || 1
  return {
    scale,
    offsetX: rect.left + (rect.width - width * scale) / 2,
    offsetY: rect.top + (rect.height - height * scale) / 2,
  }
}

export function clientToViewBox(map: ViewportMap, clientX: number, clientY: number): Pt {
  return [(clientX - map.offsetX) / map.scale, (clientY - map.offsetY) / map.scale]
}

/** A screen-space delta expressed in viewBox units. */
export function clientDeltaToViewBox(map: ViewportMap, dx: number, dy: number): Pt {
  return [dx / map.scale, dy / map.scale]
}
