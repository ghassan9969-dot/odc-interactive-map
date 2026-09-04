import { describe, expect, it } from 'vitest'
import { FLOOR_BY_ID } from '../src/data/floors'
import { LOCATIONS } from '../src/data/locations'
import { buildJourney, routeTarget } from '../src/data/routes'
import type { Location } from '../src/data/types'

const byId = (id: string): Location => {
  const found = LOCATIONS.find((l) => l.id === id)
  if (!found) throw new Error(`No destination with id "${id}"`)
  return found
}

const GROUND_ORIGIN = FLOOR_BY_ID.ground.routeOrigin
const LIFTS = byId('g-lift-12')


describe('journeys from the kiosk', () => {
  it('starts the ground floor leg at the kiosk by the Patient Entrance', () => {
    expect(GROUND_ORIGIN.label).toBe('Patient Entrance')
  })

  it('builds a journey for every destination', () => {
    const failed = LOCATIONS.filter((l) => buildJourney(l) === null).map((l) => l.id)
    expect(failed).toEqual([])
  })

  it('gives ground floor destinations exactly one leg', () => {
    for (const l of LOCATIONS.filter((x) => x.floor === 'ground')) {
      const journey = buildJourney(l)!
      expect(journey.legs, `${l.id}`).toHaveLength(1)
      expect(journey.legs[0].floor).toBe('ground')
      expect(journey.legs[0].route.originLabel).toBe('Patient Entrance')
    }
  })

  it.each(['first', 'second'] as const)('gives %s floor destinations two legs', (floor) => {
    const upstairs = LOCATIONS.filter((l) => l.floor === floor)
    expect(upstairs.length).toBeGreaterThan(0)

    for (const l of upstairs) {
      const journey = buildJourney(l)!
      expect(journey.legs, `${l.id}`).toHaveLength(2)

      const [toLifts, fromLifts] = journey.legs
      // Leg one: Patient Entrance -> the L1 & L2 lifts, on the ground floor.
      expect(toLifts.floor).toBe('ground')
      expect(toLifts.route.originLabel).toBe('Patient Entrance')
      expect(toLifts.title).toBe('Go to the lifts')
      expect(Math.hypot(toLifts.route.end[0] - LIFTS.door[0], toLifts.route.end[1] - LIFTS.door[1]))
        .toBeLessThan(1)

      // Leg two: the lift lobby -> the destination, on its own floor.
      expect(fromLifts.floor).toBe(floor)
      expect(fromLifts.route.originLabel).toBe(FLOOR_BY_ID[floor].routeOrigin.label)
      expect(fromLifts.route.originLabel).toContain('Lift Lobby')
    }
  })

  it('always ends the final leg at the chosen destination', () => {
    for (const l of LOCATIONS) {
      const journey = buildJourney(l)!
      const last = journey.legs[journey.legs.length - 1]
      // A restricted area is walked to only as far as its check-in desk,
      // so the endpoint is that desk's door rather than the room's.
      const end = routeTarget(l)
      expect(journey.target.id).toBe(l.id)
      expect(last.floor, `${l.id} final leg floor`).toBe(end.floor)
      expect(last.title).toBe(end.name)
      expect(
        Math.hypot(last.route.end[0] - end.door[0], last.route.end[1] - end.door[1]),
        `${l.id} final leg endpoint`,
      ).toBeLessThan(1)
    }
  })

  it('never repeats a floor across the legs of one journey', () => {
    for (const l of LOCATIONS) {
      const floors = buildJourney(l)!.legs.map((leg) => leg.floor)
      expect(new Set(floors).size, `${l.id}`).toBe(floors.length)
    }
  })
})

describe('acceptance routes', () => {
  it('Coffee Shop is a single ground floor walk', () => {
    const journey = buildJourney(byId('g-coffee-shop'))!
    expect(journey.legs).toHaveLength(1)
    expect(journey.legs[0].floor).toBe('ground')
    expect(journey.legs[0].route.originLabel).toBe('Patient Entrance')
    expect(journey.legs[0].route.destLabel).toBe('Coffee Shop')
  })

  it('Library goes to the lifts, then across the First Floor', () => {
    const journey = buildJourney(byId('f-library'))!
    expect(journey.legs.map((l) => l.floor)).toEqual(['ground', 'first'])
    expect(journey.legs[0].route.destLabel).toContain('L1 & L2')
    expect(journey.legs[1].route.destLabel).toBe('Library')
    expect(journey.legs[1].route.originLabel).toBe('Lift Lobby (L1 & L2)')
  })

  it('Student Affairs goes to the lifts, then across the Second Floor', () => {
    const journey = buildJourney(byId('s-student-affairs'))!
    expect(journey.legs.map((l) => l.floor)).toEqual(['ground', 'second'])
    expect(journey.legs[0].route.destLabel).toContain('L1 & L2')
    expect(journey.legs[1].route.destLabel).toBe('Student Affairs')
    expect(journey.legs[1].route.originLabel).toBe('Lift Lobby (L1 & L2)')
  })

  it('sends Library and Student Affairs to the lifts by the same ground floor walk', () => {
    const a = buildJourney(byId('f-library'))!.legs[0].route
    const b = buildJourney(byId('s-student-affairs'))!.legs[0].route
    expect(a.points).toEqual(b.points)
  })
})
