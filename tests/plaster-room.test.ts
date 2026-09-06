/**
 * Getting to the Plaster Room.
 *
 * The room has no door onto a corridor. Its single doorway, at wing
 * coordinates (1921, 1244), opens into the Clinical Skills Laboratory,
 * which fills a 1889..1953 down to exactly b 1244. The nearest
 * circulation ends 188 units west, behind the Prosthodontic Lab and the
 * CSL.
 *
 * So the visitor is walked to the CSL and told, on the card and in the
 * route panel, that the last few steps are through it. Nothing is
 * dug through a wall to make a prettier line: these checks prove the
 * drawn route is the CSL's own route, unchanged, and that the corridor
 * graph gained nothing.
 */

import { describe, expect, it } from 'vitest'
import { LOCATIONS, GRAPHS } from '../src/data/locations'
import { firstEdges, firstNodes } from '../src/data/first'
import { boundsOf, f1 } from '../src/data/geometry'
import { buildJourney, buildRoute, routeHeading, routeTarget } from '../src/data/routes'
import type { Location, Pt } from '../src/data/types'

const byId = (id: string): Location => {
  const found = LOCATIONS.find((l) => l.id === id)
  if (!found) throw new Error(`No destination with id "${id}"`)
  return found
}

const plaster = () => byId('f-s-plaster')
const csl = () => byId('f-simulation')

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

/** Every point along a polyline, sampled fine enough to catch a clip. */
const samples = (points: Pt[], step = 4): Pt[] => {
  const out: Pt[] = []
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1]
    const [bx, by] = points[i]
    const len = Math.hypot(bx - ax, by - ay)
    const n = Math.max(1, Math.ceil(len / step))
    for (let k = 0; k <= n; k++) out.push([ax + ((bx - ax) * k) / n, ay + ((by - ay) * k) / n])
  }
  return out
}

describe('the walk to the Plaster Room ends at the CSL', () => {
  it('resolves to the CSL, not to the room itself', () => {
    expect(routeTarget(plaster()).id).toBe('f-simulation')
  })

  it('finishes at the CSL public door, never at the plaster doorway', () => {
    const journey = buildJourney(plaster())!
    const last = journey.legs[journey.legs.length - 1]
    expect(last.route.end).toEqual(csl().door)
    // The room's own doorway is not where anybody is sent.
    expect(last.route.end).not.toEqual(plaster().door)
    expect(plaster().door).toEqual(f1(1921, 1244))
  })

  it('draws exactly the CSL journey, leg for leg', () => {
    const mine = buildJourney(plaster())!
    const theirs = buildJourney(csl())!
    expect(mine.legs).toHaveLength(theirs.legs.length)
    mine.legs.forEach((leg, i) => {
      expect(leg.floor).toBe(theirs.legs[i].floor)
      expect(leg.route.points).toEqual(theirs.legs[i].route.points)
      expect(leg.route.length).toBe(theirs.legs[i].route.length)
      expect(leg.route.steps.map((s) => s.text)).toEqual(
        theirs.legs[i].route.steps.map((s) => s.text),
      )
    })
    // Which means the last instruction names the CSL, not the Plaster Room.
    const final = mine.legs[mine.legs.length - 1].route.steps.at(-1)!
    expect(final.kind).toBe('arrive')
    expect(final.text).toContain('CSL')
    expect(final.text).not.toContain('Plaster')
  })

  it('never crosses the Plaster Room, the CSL interior or the Prosthodontic Lab', () => {
    const journey = buildJourney(plaster())!
    const rooms = ['f-s-plaster', 'f-simulation', 'f-prosthodontic'].map((id) => ({
      id,
      polys: byId(id).shape.polys,
    }))
    const offenders: string[] = []
    for (const leg of journey.legs) {
      const pts = samples(leg.route.points)
      // The final approach steps through the doorway of the room being
      // entered, so the last sample or two legitimately touch it.
      const walk = pts.slice(0, Math.max(1, pts.length - 3))
      for (const p of walk) {
        for (const room of rooms) {
          for (const poly of room.polys) {
            if (pointInPolygon(p, poly)) offenders.push(`${room.id} at ${p.map(Math.round)}`)
          }
        }
      }
    }
    expect([...new Set(offenders)]).toEqual([])
  })

  it('stays out of every other room on its floor too', () => {
    const journey = buildJourney(plaster())!
    const others = LOCATIONS.filter(
      (l) => l.floor === 'first' && l.id !== 'f-simulation' && l.category !== 'circulation',
    )
    const offenders: string[] = []
    for (const leg of journey.legs.filter((l) => l.floor === 'first')) {
      for (const p of samples(leg.route.points).slice(0, -3)) {
        for (const room of others) {
          for (const poly of room.shape.polys) {
            if (pointInPolygon(p, poly)) offenders.push(room.id)
          }
        }
      }
    }
    expect([...new Set(offenders)]).toEqual([])
  })
})

describe('the corridor graph gained nothing', () => {
  // The first floor graph as it stood before the Plaster Room became a
  // destination. A new node, edge or doorway would move these numbers.
  it('keeps the same node count and the same node ids', () => {
    expect(Object.keys(firstNodes)).toHaveLength(43)
    expect(Object.keys(firstNodes).filter((id) => /plaster/i.test(id))).toEqual([])
  })

  it('keeps the same edge count, with no edge naming the room', () => {
    expect(firstEdges).toHaveLength(46)
    expect(firstEdges.flat().filter((id) => /plaster/i.test(id))).toEqual([])
  })

  it('anchors the room to a node that already existed', () => {
    const node = plaster().entryNode
    expect(node).toBe(csl().entryNode)
    expect(Object.keys(GRAPHS.first.nodes)).toContain(node)
  })

  it('gives the room no doorway it did not already have', () => {
    expect(plaster().doorMarks).toEqual([f1(1921, 1244)])
    // And that mark still sits on the room's own north wall.
    const box = boundsOf(plaster().shape.polys)
    const [x, y] = plaster().doorMarks![0]
    expect(x).toBeGreaterThanOrEqual(box.x - 1)
    expect(x).toBeLessThanOrEqual(box.x + box.w + 1)
    expect(Math.abs(y - box.y)).toBeLessThan(1)
  })
})

describe('the panel tells the visitor the truth', () => {
  it('heads the route with the CSL and keeps the Plaster Room underneath', () => {
    const heading = routeHeading(plaster())
    expect(heading.title).toBe('Route to CSL')
    expect(heading.subtitle).toBe('For access to Plaster Room')
  })

  it('carries the access notice, and calls it access rather than restriction', () => {
    const heading = routeHeading(plaster())
    expect(heading.access).toEqual({
      title: 'Access via CSL',
      message:
        'The Plaster Room is accessed through the Clinical Skills Laboratory. Please ask a staff member for assistance.',
    })
    // Not a controlled clinical area: nothing to check in at.
    expect(heading.checkInAt).toBeNull()
    expect(plaster().restricted).toBeUndefined()
    expect(plaster().accessVia!.routeVia).toBe('f-simulation')
  })

  it('leaves the clinics saying what they always said', () => {
    for (const [id, desk] of [
      ['g-uc-clinic', 'UC Reception'],
      ['g-pg-clinic', 'PC Reception'],
    ] as const) {
      const heading = routeHeading(byId(id))
      expect(heading.title).toBe(`Route to ${desk}`)
      expect(heading.checkInAt).toBe(desk)
      expect(heading.access).toBeNull()
    }
  })

  it('says nothing extra on a room reached straight off a corridor', () => {
    const heading = routeHeading(byId('f-library'))
    expect(heading.subtitle).toBeNull()
    expect(heading.checkInAt).toBeNull()
    expect(heading.access).toBeNull()
  })
})

describe('every other journey is where it was', () => {
  it('leaves the CSL route untouched by the promotion', () => {
    const route = buildRoute(csl())!
    expect(route.end).toEqual(csl().door)
    expect(route.steps.at(-1)!.text).toContain('CSL')
  })

  it('still builds a journey for every destination', () => {
    const failed = LOCATIONS.filter((l) => buildJourney(l) === null).map((l) => l.id)
    expect(failed).toEqual([])
  })

  it('redirects exactly two kinds of room and no others', () => {
    const redirected = LOCATIONS.filter((l) => routeTarget(l).id !== l.id)
    expect(redirected.map((l) => l.id).sort()).toEqual(
      [
        'f-s-plaster',
        'g-pg-clinic',
        'g-uc-clinic',
        ...LOCATIONS.filter((l) => l.floor === 'second' && l.restricted).map((l) => l.id),
      ].sort(),
    )
  })
})
