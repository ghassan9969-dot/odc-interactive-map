import { describe, expect, it } from 'vitest'
import { LOCATIONS } from '../src/data/locations'
import { buildJourney, buildSteps, UNITS_PER_METRE } from '../src/data/routes'
import type { Pt } from '../src/data/types'

const m = (metres: number) => metres * UNITS_PER_METRE
const kinds = (points: Pt[]) => buildSteps(points, 'Start Point', 'Destination').map((s) => s.kind)
const texts = (points: Pt[]) => buildSteps(points, 'Start Point', 'Destination').map((s) => s.text)

/* ------------------------------------------------------------------ */
/* Every real route                                                    */
/* ------------------------------------------------------------------ */

describe('instructions for every destination', () => {
  const routes = LOCATIONS.flatMap((location) =>
    buildJourney(location)!.legs.map((leg) => ({ id: location.id, leg })),
  )

  it('opens with a start instruction and closes with an arrival', () => {
    for (const { id, leg } of routes) {
      const steps = leg.route.steps
      expect(steps.length, `${id} has no instructions`).toBeGreaterThanOrEqual(2)
      expect(steps[0].kind, `${id} first instruction`).toBe('start')
      expect(steps[steps.length - 1].kind, `${id} last instruction`).toBe('arrive')
      expect(steps.filter((s) => s.kind === 'start')).toHaveLength(1)
      expect(steps.filter((s) => s.kind === 'arrive')).toHaveLength(1)
    }
  })

  it('names the origin and the destination without inventing landmarks', () => {
    for (const { id, leg } of routes) {
      const steps = leg.route.steps
      expect(steps[0].text, `${id}`).toContain(leg.route.originLabel)
      expect(steps[steps.length - 1].text, `${id}`).toContain(leg.route.destLabel)
    }
  })

  it('never emits NaN, Infinity or a nonsense distance', () => {
    for (const { id, leg } of routes) {
      for (const step of leg.route.steps) {
        expect(step.text, `${id}`).not.toMatch(/NaN|Infinity|undefined|null/)
        for (const found of step.text.matchAll(/about (\d+(?:\.\d+)?) m/g)) {
          const value = Number(found[1])
          expect(Number.isFinite(value), `${id}: "${step.text}"`).toBe(true)
          expect(value, `${id}: "${step.text}"`).toBeGreaterThan(0)
          expect(value, `${id}: "${step.text}"`).toBeLessThan(400)
        }
      }
    }
  })

  it('reports a side that is left, right or straight ahead', () => {
    for (const { id, leg } of routes) {
      const arrive = leg.route.steps[leg.route.steps.length - 1].text
      expect(arrive, `${id}`).toMatch(/on your left|on your right|straight ahead|right here/)
    }
  })

  it('keeps the walked distance close to the route length', () => {
    for (const { id, leg } of routes) {
      const stated = [...leg.route.steps.flatMap((s) => [...s.text.matchAll(/about (\d+) m/g)])]
        .map((match) => Number(match[1]))
        .reduce((sum, n) => sum + n, 0)
      if (stated === 0) continue // very short walks report "a few steps away"
      const actual = leg.route.length / UNITS_PER_METRE
      expect(Math.abs(stated - actual), `${id}: said ${stated} m, walked ${actual.toFixed(1)} m`)
        .toBeLessThan(Math.max(6, actual * 0.15))
    }
  })
})

/* ------------------------------------------------------------------ */
/* Synthetic geometry                                                  */
/* ------------------------------------------------------------------ */

describe('turn detection on known geometry', () => {
  it('describes a straight walk as a single leg', () => {
    // Due north for 30 m.
    expect(kinds([[0, 0], [0, -m(30)]])).toEqual(['start', 'straight', 'arrive'])
  })

  it('calls a left turn a left turn', () => {
    // East, then north: the walker turns to their left.
    const steps = kinds([[0, 0], [m(25), 0], [m(25), -m(30)]])
    expect(steps).toContain('left')
    expect(steps).not.toContain('right')
  })

  it('calls a right turn a right turn', () => {
    // East, then south: the walker turns to their right.
    const steps = kinds([[0, 0], [m(25), 0], [m(25), m(30)]])
    expect(steps).toContain('right')
    expect(steps).not.toContain('left')
  })

  it('drops a stub at the very start, where no heading exists yet', () => {
    // 1.5 m out of a lift, then 30 m east.
    const points: Pt[] = [[0, 0], [0, -m(1.5)], [m(30), -m(1.5)]]
    expect(kinds(points)).toEqual(['start', 'straight', 'arrive'])
    expect(texts(points)[1]).toMatch(/about 3[12] m/)
  })

  it('folds a harmless micro-jog that leaves the direction unchanged', () => {
    // North 30 m, a 4.5 m sidestep east, then north again for 38 m.
    const steps = kinds([[0, 0], [0, -m(30)], [m(4.5), -m(30)], [m(4.5), -m(68)]])
    expect(steps).toEqual(['start', 'straight', 'arrive'])
  })

  it('keeps a real turn even when the hop between two turns is short', () => {
    // A genuine dog-leg: north, 5 m east, then east again is NOT the same
    // direction as north, so neither turn may be folded away.
    const steps = kinds([[0, 0], [0, -m(30)], [m(5), -m(30)], [m(40), -m(30)]])
    expect(steps.filter((k) => k === 'left' || k === 'right').length).toBeGreaterThanOrEqual(1)
  })

  it('never removes a significant turn to shorten the list', () => {
    // Nine 15 m legs with a real ninety degree turn between each pair.
    const points: Pt[] = [[0, 0]]
    let x = 0
    let y = 0
    for (let i = 0; i < 8; i++) {
      if (i % 2 === 0) x += m(15)
      else y -= m(15)
      points.push([x, y])
    }
    const steps = kinds(points)
    const turns = steps.filter((k) => k === 'left' || k === 'right').length
    expect(turns, 'every genuine ninety degree turn must survive').toBe(7)
  })

  it('describes a very short walk without inventing turns', () => {
    const steps = buildSteps([[0, 0], [0, -m(3)]], 'Lift Lobby', 'Library')
    expect(steps.map((s) => s.kind)).toEqual(['start', 'arrive'])
    expect(steps[1].text).toContain('a few steps away')
  })

  it('handles a degenerate single-point route', () => {
    const steps = buildSteps([[10, 10]], 'Lift Lobby', 'Library')
    expect(steps.map((s) => s.kind)).toEqual(['start', 'arrive'])
    expect(steps[1].text).toContain('right here')
  })
})
