import { describe, expect, it } from 'vitest'
import { FLOOR_BY_ID } from '../src/data/floors'
import {
  IDENTITY,
  MAX_SCALE,
  MIN_SCALE,
  centerOn,
  clientDeltaToViewBox,
  clientToViewBox,
  constrain,
  fitBox,
  panBy,
  pinchStep,
  toSvgTransform,
  transformsEqual,
  viewportMap,
  zoomAbout,
  type Transform,
} from '../src/hooks/mapTransform'
import type { Pt } from '../src/data/types'

const { width: W, height: H } = FLOOR_BY_ID.ground

/** Where a viewBox point ends up on screen under a transform. */
const project = (t: Transform, p: Pt): Pt => [p[0] * t.k + t.x, p[1] * t.k + t.y]
/** Which content point currently sits under a screen position. */
const unproject = (t: Transform, p: Pt): Pt => [(p[0] - t.x) / t.k, (p[1] - t.y) / t.k]

describe('scale limits', () => {
  it('never goes below the minimum or above the maximum', () => {
    expect(constrain({ k: 0.01, x: 0, y: 0 }, W, H).k).toBe(MIN_SCALE)
    expect(constrain({ k: 999, x: 0, y: 0 }, W, H).k).toBe(MAX_SCALE)
    expect(zoomAbout(IDENTITY, 100, [0, 0], W, H).k).toBe(MAX_SCALE)
    expect(zoomAbout(IDENTITY, 0.001, [0, 0], W, H).k).toBe(MIN_SCALE)
  })

  it('leaves a scale already inside the range untouched', () => {
    expect(constrain({ k: 2, x: 0, y: 0 }, W, H).k).toBe(2)
  })
})

describe('pan constraints', () => {
  it('keeps part of the plan reachable however hard it is flung', () => {
    for (const attempt of [
      { k: 1, x: 1e6, y: 1e6 },
      { k: 1, x: -1e6, y: -1e6 },
      { k: 4, x: 1e6, y: -1e6 },
    ]) {
      const t = constrain(attempt, W, H)
      // The visible window in content units must still overlap the plan.
      const left = -t.x / t.k
      const right = (W - t.x) / t.k
      const top = -t.y / t.k
      const bottom = (H - t.y) / t.k
      expect(right, JSON.stringify(attempt)).toBeGreaterThan(0)
      expect(left, JSON.stringify(attempt)).toBeLessThan(W)
      expect(bottom, JSON.stringify(attempt)).toBeGreaterThan(0)
      expect(top, JSON.stringify(attempt)).toBeLessThan(H)
    }
  })

  it('moves by the requested delta while inside the bounds', () => {
    const t = panBy(IDENTITY, 40, -25, W, H)
    expect(t).toEqual({ k: 1, x: 40, y: -25 })
  })

  it('produces a finite transform for every constrained result', () => {
    const t = constrain({ k: Number.MAX_SAFE_INTEGER, x: -1e12, y: 1e12 }, W, H)
    expect(Number.isFinite(t.k) && Number.isFinite(t.x) && Number.isFinite(t.y)).toBe(true)
  })
})

describe('zooming about a point', () => {
  it('holds the anchor still', () => {
    const anchor: Pt = [900, 700]
    const before = unproject(IDENTITY, anchor)
    const after = unproject(zoomAbout(IDENTITY, 1.2, anchor, W, H), anchor)
    expect(after[0]).toBeCloseTo(before[0], 6)
    expect(after[1]).toBeCloseTo(before[1], 6)
  })

  it('is reversible when nothing clamps', () => {
    const anchor: Pt = [900, 700]
    const zoomed = zoomAbout(IDENTITY, 1.5, anchor, W, H)
    const back = zoomAbout(zoomed, 1 / 1.5, anchor, W, H)
    expect(transformsEqual(back, IDENTITY)).toBe(true)
  })
})

describe('two-finger gesture maths', () => {
  const mid: Pt = [900, 700]

  it('zooms about the midpoint when the fingers only spread', () => {
    const t = pinchStep(IDENTITY, { dist: 100, mid }, { dist: 200, mid }, W, H)
    expect(t.k).toBeCloseTo(2, 6)
    const under = unproject(t, mid)
    expect(under[0]).toBeCloseTo(mid[0], 6)
    expect(under[1]).toBeCloseTo(mid[1], 6)
  })

  it('pans when both fingers move together without spreading', () => {
    const moved: Pt = [mid[0] + 50, mid[1] + 20]
    const t = pinchStep(IDENTITY, { dist: 100, mid }, { dist: 100, mid: moved }, W, H)
    expect(t.k).toBeCloseTo(1, 6)
    expect(t.x).toBeCloseTo(50, 6)
    expect(t.y).toBeCloseTo(20, 6)
  })

  it('does nothing when the reference is simply re-taken', () => {
    // This is what happens the instant a second finger lands or lifts.
    const start: Transform = { k: 1.7, x: -120, y: 40 }
    const reference = { dist: 180, mid }
    expect(pinchStep(start, reference, reference, W, H)).toEqual(start)
  })

  it('keeps the midpoint fixed while spreading and dragging at once', () => {
    const moved: Pt = [mid[0] + 60, mid[1] - 30]
    const t = pinchStep(IDENTITY, { dist: 120, mid }, { dist: 150, mid: moved }, W, H)
    // The content that was under the old midpoint is now under the new one.
    const under = unproject(t, moved)
    expect(under[0]).toBeCloseTo(mid[0], 6)
    expect(under[1]).toBeCloseTo(mid[1], 6)
  })

  it('ignores a degenerate reference rather than producing NaN', () => {
    const start: Transform = { k: 1.2, x: 10, y: 10 }
    expect(pinchStep(start, { dist: 0, mid }, { dist: 90, mid }, W, H)).toEqual(start)
    expect(pinchStep(start, { dist: 90, mid }, { dist: 0, mid }, W, H)).toEqual(start)
  })
})

describe('programmatic framing', () => {
  it('centres a point in the view', () => {
    const p: Pt = [700, 600]
    const t = centerOn(p, 2, W, H)
    const onScreen = project(t, p)
    expect(onScreen[0]).toBeCloseTo(W / 2, 6)
    expect(onScreen[1]).toBeCloseTo(H / 2, 6)
  })

  it('respects the ceiling a route fit asks for', () => {
    const tiny = { x: 900, y: 700, w: 10, h: 10 }
    expect(fitBox(tiny, W, H, 1.08, 1.8).k).toBeCloseTo(1.8, 6)
  })

  it('shrinks to fit a box larger than the view', () => {
    const t = fitBox({ x: 0, y: 0, w: W * 2, h: H * 2 }, W, H, 1)
    expect(t.k).toBeCloseTo(0.75, 6)
  })
})

describe('client space to viewBox space', () => {
  // 1024x768 landscape: the plan is letterboxed left and right.
  const landscape = viewportMap({ left: 20, top: 100, width: 1024, height: 768 }, W, H)
  // 768x1024 portrait: letterboxed top and bottom instead.
  const portrait = viewportMap({ left: 0, top: 0, width: 768, height: 1024 }, W, H)

  it('uses one uniform scale, as xMidYMid meet does', () => {
    expect(landscape.scale).toBeCloseTo(Math.min(1024 / W, 768 / H), 9)
    expect(portrait.scale).toBeCloseTo(Math.min(768 / W, 1024 / H), 9)
  })

  it('centres the plan in the spare axis', () => {
    // Landscape is height-limited here, so the slack is horizontal.
    expect(landscape.offsetY).toBeCloseTo(100, 6)
    expect(landscape.offsetX).toBeGreaterThan(20)
    // Portrait is width-limited, so the slack is vertical.
    expect(portrait.offsetX).toBeCloseTo(0, 6)
    expect(portrait.offsetY).toBeGreaterThan(0)
  })

  it.each([
    ['landscape', landscape],
    ['portrait', portrait],
  ])('maps the plan corners to the viewBox corners in %s', (_name, map) => {
    const topLeft = clientToViewBox(map, map.offsetX, map.offsetY)
    expect(topLeft[0]).toBeCloseTo(0, 6)
    expect(topLeft[1]).toBeCloseTo(0, 6)

    const bottomRight = clientToViewBox(
      map,
      map.offsetX + W * map.scale,
      map.offsetY + H * map.scale,
    )
    expect(bottomRight[0]).toBeCloseTo(W, 6)
    expect(bottomRight[1]).toBeCloseTo(H, 6)
  })

  it.each([
    ['landscape', landscape],
    ['portrait', portrait],
  ])('turns a finger movement into the matching viewBox delta in %s', (_name, map) => {
    const [dx, dy] = clientDeltaToViewBox(map, 60, -35)
    expect(dx).toBeCloseTo(60 / map.scale, 6)
    expect(dy).toBeCloseTo(-35 / map.scale, 6)
  })

  it('survives a zero-sized element without dividing by zero', () => {
    const map = viewportMap({ left: 0, top: 0, width: 0, height: 0 }, W, H)
    const p = clientToViewBox(map, 10, 10)
    expect(Number.isFinite(p[0]) && Number.isFinite(p[1])).toBe(true)
  })
})

describe('serialising the transform', () => {
  it('writes a valid SVG transform with no exponent notation', () => {
    const written = toSvgTransform({ k: 1.234567, x: -12.3456, y: 0.00001 })
    expect(written).toMatch(/^translate\(-?[\d.]+ -?[\d.]+\) scale\([\d.]+\)$/)
    expect(written).not.toMatch(/e[+-]/i)
  })

  it('treats imperceptible differences as equal, so no needless render', () => {
    expect(transformsEqual({ k: 1, x: 0, y: 0 }, { k: 1.00001, x: 0.0001, y: 0 })).toBe(true)
    expect(transformsEqual({ k: 1, x: 0, y: 0 }, { k: 1.05, x: 0, y: 0 })).toBe(false)
  })
})
