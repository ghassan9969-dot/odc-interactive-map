import { describe, expect, it } from 'vitest'
import { circulationOnFloor, LOCATIONS, secondOpenShell } from '../src/data/locations'
import { buildJourney } from '../src/data/routes'
import type { FloorId, Pt } from '../src/data/types'

/**
 * A drawn route must stay on the floor the visitor can actually walk on.
 *
 * Every leg is sampled at half-metre intervals and each sample must fall
 * inside one of that floor's circulation polygons. The single exception
 * is the last segment of a leg, which is the step out of the corridor
 * and through the destination's own doorway.
 */

/** ~0.46 m at the plans' scale of 12.95 units per metre. */
const SAMPLE_UNITS = 6

const pointInPolygon = (p: Pt, poly: Pt[]): boolean => {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

/**
 * Walkable floor is the circulation, plus one declared exception.
 *
 * The eastern half of the Second Floor is unfitted shell on sheet
 * -16-C: an open plate with nothing but a column grid and the east lift
 * core. `secondOpenShell` models it as exactly that, and the two
 * east-core destinations (Lifts L3 & L4, Stair 03) are reached by
 * crossing it. That is what the drawing shows, so the area counts as
 * walkable here rather than the test being loosened for those two
 * destinations. It is named, not a blanket allowance.
 */
const walkableAreas = (floor: FloorId): Pt[][] => {
  const areas = circulationOnFloor(floor).flatMap((area) => area.polys)
  return floor === 'second' ? [...areas, secondOpenShell.poly] : areas
}

interface Escape {
  destination: string
  floor: FloorId
  segment: number
  at: Pt
}

/** Sample every segment of a leg except the final step into the doorway. */
function findEscapes(points: Pt[], areas: Pt[][], destination: string, floor: FloorId): Escape[] {
  const escapes: Escape[] = []
  for (let i = 1; i < points.length - 1; i++) {
    const a = points[i - 1]
    const b = points[i]
    const length = Math.hypot(b[0] - a[0], b[1] - a[1])
    const samples = Math.max(2, Math.ceil(length / SAMPLE_UNITS))
    for (let t = 0; t <= samples; t++) {
      const q: Pt = [
        a[0] + ((b[0] - a[0]) * t) / samples,
        a[1] + ((b[1] - a[1]) * t) / samples,
      ]
      if (!areas.some((poly) => pointInPolygon(q, poly))) {
        escapes.push({ destination, floor, segment: i, at: [Math.round(q[0]), Math.round(q[1])] })
      }
    }
  }
  return escapes
}

describe('routes stay inside the corridors', () => {
  const legs = LOCATIONS.flatMap((location) => {
    const journey = buildJourney(location)
    if (!journey) throw new Error(`No journey for ${location.id}`)
    return journey.legs.map((leg) => ({ location, leg }))
  })

  it('covers every destination on every floor, not just a sample', () => {
    expect(LOCATIONS.length).toBeGreaterThanOrEqual(60)
    expect(legs.length).toBeGreaterThan(LOCATIONS.length)
    for (const floor of ['ground', 'first', 'second'] as FloorId[]) {
      expect(legs.some((l) => l.leg.floor === floor), `${floor} floor covered`).toBe(true)
    }
  })

  it('keeps every corridor segment of every leg inside the circulation', () => {
    const escapes: Escape[] = []
    for (const { location, leg } of legs) {
      escapes.push(
        ...findEscapes(
          leg.route.points,
          walkableAreas(leg.floor),
          `${location.id} (${location.name})`,
          leg.floor,
        ),
      )
    }
    // Reported in full rather than counted, so a genuine failure names the
    // destination and the exact point that leaves the corridor.
    const report = [...new Set(escapes.map((e) => `${e.destination} on ${e.floor}: segment ${e.segment} at ${e.at.join(',')}`))]
    expect(report).toEqual([])
  })

  it('lets only the final segment reach the destination door', () => {
    for (const { location, leg } of legs) {
      const points = leg.route.points
      const door = points[points.length - 1]
      const areas = walkableAreas(leg.floor)
      const lastCorridorPoint = points[points.length - 2]
      expect(
        areas.some((poly) => pointInPolygon(lastCorridorPoint, poly)),
        `${location.id}: the point before the door should still be in a corridor`,
      ).toBe(true)
      expect(Number.isFinite(door[0]) && Number.isFinite(door[1])).toBe(true)
    }
  })
})
