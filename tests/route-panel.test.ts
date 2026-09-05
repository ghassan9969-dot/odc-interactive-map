/**
 * What the route panel is allowed to say about a walk.
 *
 * The redesign moved the heading, the summary chips and the progress
 * stepper into `routes.ts` so they could be checked here rather than in
 * a browser. The rule they exist to enforce is that the panel names the
 * place the walk really ends — a restricted room is never the endpoint
 * — and never quotes a number the drawing does not support.
 *
 * The last group is a guard rather than a feature: it pins the routes
 * themselves, so a change to the presentation cannot quietly move a
 * path, a distance or a door.
 */

import { describe, expect, it } from 'vitest'
import { LOCATIONS } from '../src/data/locations'
import {
  buildJourney,
  journeyStages,
  routeFacts,
  routeHeading,
  routeTarget,
  UNITS_PER_METRE,
  walkingMinutes,
  walkingTimeLabel,
} from '../src/data/routes'
import type { Location } from '../src/data/types'

const byId = (id: string): Location => {
  const found = LOCATIONS.find((l) => l.id === id)
  if (!found) throw new Error(`No destination with id "${id}"`)
  return found
}

const factOf = (id: string, kind: string, legIndex = 0) => {
  const journey = buildJourney(byId(id))!
  return routeFacts(journey, legIndex).find((f) => f.kind === kind)?.label
}

/** Every second floor room a visitor is turned away from. */
const RESTRICTED_SECOND = LOCATIONS.filter((l) => l.floor === 'second' && l.restricted)

describe('the route heading names where the walk really ends', () => {
  it('sends the Undergraduate Clinic to UC Reception', () => {
    const heading = routeHeading(byId('g-uc-clinic'))
    expect(heading.title).toBe('Route to UC Reception')
    expect(heading.checkInAt).toBe('UC Reception')
  })

  it('sends the Postgraduate Clinic to PC Reception', () => {
    const heading = routeHeading(byId('g-pg-clinic'))
    expect(heading.title).toBe('Route to PC Reception')
    expect(heading.checkInAt).toBe('PC Reception')
  })

  it('sends every restricted second floor room to Administration Reception', () => {
    expect(RESTRICTED_SECOND.length).toBeGreaterThan(5)
    for (const room of RESTRICTED_SECOND) {
      expect(routeHeading(room).title, room.id).toBe('Route to Administration Reception')
    }
  })

  it('keeps the room the visitor actually chose in the subtitle', () => {
    expect(routeHeading(byId('g-uc-clinic')).subtitle).toBe('For access to Undergraduate Clinic')
    expect(routeHeading(byId('g-pg-clinic')).subtitle).toBe('For access to Postgraduate Clinic')
    expect(routeHeading(byId('s-dean')).subtitle).toBe('For access to Dean')
    for (const room of RESTRICTED_SECOND) {
      expect(routeHeading(room).subtitle, room.id).toBe(`For access to ${room.name}`)
    }
  })

  it('gives an unrestricted destination its own name and no subtitle', () => {
    expect(routeHeading(byId('g-canteen')).title).toBe('Route to Canteen / Restaurant')
    for (const l of LOCATIONS.filter((x) => !x.restricted)) {
      const heading = routeHeading(l)
      expect(heading.title, l.id).toBe(`Route to ${l.name}`)
      expect(heading.subtitle, l.id).toBeNull()
      expect(heading.checkInAt, l.id).toBeNull()
    }
  })

  it('never puts a restricted room in a title', () => {
    for (const l of LOCATIONS.filter((x) => x.restricted)) {
      expect(routeHeading(l).title, l.id).not.toContain(l.name)
      expect(routeHeading(l).title).toBe(`Route to ${routeTarget(l).name}`)
    }
  })
})

describe('the summary chips', () => {
  it('always leads with the floor and the starting point', () => {
    for (const l of LOCATIONS) {
      const journey = buildJourney(l)!
      journey.legs.forEach((leg, i) => {
        const facts = routeFacts(journey, i)
        expect(facts[0].kind, l.id).toBe('floor')
        expect(facts[1].kind, l.id).toBe('origin')
        expect(facts[1].label, l.id).toBe(`From ${leg.route.originLabel}`)
      })
    }
  })

  it('gives the car park an outdoor chip and invents no distance or time', () => {
    const journey = buildJourney(byId('g-parking'))!
    const facts = routeFacts(journey, 0)
    expect(facts.map((f) => f.kind)).toEqual(['floor', 'origin', 'outdoor'])
    expect(facts.find((f) => f.kind === 'outdoor')!.label).toBe('Outdoor route')
    expect(facts.some((f) => f.kind === 'distance')).toBe(false)
    expect(facts.some((f) => f.kind === 'time')).toBe(false)
  })

  it('quotes the measured distance everywhere else', () => {
    for (const l of LOCATIONS.filter((x) => !x.routeNote)) {
      const journey = buildJourney(l)!
      journey.legs.forEach((leg, i) => {
        const metres = Math.round(leg.route.length / UNITS_PER_METRE)
        const distance = routeFacts(journey, i).find((f) => f.kind === 'distance')?.label
        // A leg of no measurable length says "Arrive here" instead.
        expect(distance, `${l.id} leg ${i}`).toBe(metres === 0 ? undefined : `${metres} m`)
      })
    }
  })
})

describe('a leg with no distance to walk', () => {
  // The First Floor lift lobby is its own destination: stepping out of
  // the lift already puts the visitor there.
  const lobby = () => buildJourney(byId('f-lift-12'))!

  it('is the only one in the building', () => {
    const zero: string[] = []
    for (const l of LOCATIONS) {
      buildJourney(l)!.legs.forEach((leg, i) => {
        if (Math.round(leg.route.length / UNITS_PER_METRE) === 0) zero.push(`${l.id} leg ${i}`)
      })
    }
    expect(zero).toEqual(['f-lift-12 leg 1'])
  })

  it('says "Arrive here" instead of a distance or a time', () => {
    const facts = routeFacts(lobby(), 1)
    expect(facts.map((f) => f.kind)).toEqual(['floor', 'origin', 'arrive'])
    expect(facts.find((f) => f.kind === 'arrive')!.label).toBe('Arrive here')
    expect(facts.some((f) => f.kind === 'distance')).toBe(false)
    expect(facts.some((f) => f.kind === 'time')).toBe(false)
  })

  it('never prints "0 m" anywhere on any journey', () => {
    for (const l of LOCATIONS) {
      const journey = buildJourney(l)!
      journey.legs.forEach((_, i) => {
        for (const fact of routeFacts(journey, i)) {
          expect(fact.label, `${l.id} leg ${i}`).not.toBe('0 m')
        }
      })
    }
  })

  it('leaves the stored length of that leg untouched', () => {
    // Presentation only: the route still carries the length it always had.
    expect(lobby().legs[1].route.length).toBe(6)
    expect(lobby().legs[1].route.steps).toHaveLength(2)
  })
})

describe('walking time is shown only when there is a minute to show', () => {
  it('gives no time at all for a walk under a minute', () => {
    expect(walkingTimeLabel(3 * UNITS_PER_METRE)).toBeNull()
    expect(walkingTimeLabel(7 * UNITS_PER_METRE)).toBeNull()
    expect(walkingTimeLabel(25 * UNITS_PER_METRE)).toBeNull()
  })

  it('counts minutes once a walk is long enough', () => {
    expect(walkingTimeLabel(90 * UNITS_PER_METRE)).toBe('1 min')
    expect(walkingTimeLabel(200 * UNITS_PER_METRE)).toBe('3 min')
  })

  it('drops the chip on the short legs of a lift journey, keeping the distance', () => {
    expect(factOf('f-library', 'time', 1)).toBeUndefined()
    expect(factOf('f-library', 'distance', 1)).toBe('7 m')
    expect(factOf('s-reception', 'time', 1)).toBeUndefined()
    expect(factOf('s-reception', 'distance', 1)).toBe('3 m')
  })

  it('still shows a time on the long walks that earn one', () => {
    expect(factOf('g-canteen', 'time')).toBe('2 min')
    expect(factOf('g-canteen', 'distance')).toBe('149 m')
  })

  it('shows the chip on exactly the legs of a minute or more', () => {
    for (const l of LOCATIONS.filter((x) => !x.routeNote)) {
      const journey = buildJourney(l)!
      journey.legs.forEach((leg, i) => {
        const label = routeFacts(journey, i).find((f) => f.kind === 'time')?.label
        const minutes = walkingMinutes(leg.route.length)
        expect(label, `${l.id} leg ${i}`).toBe(
          minutes < 1 ? undefined : `${Math.round(minutes)} min`,
        )
      })
    }
  })
})

describe('the multi-floor progress stepper', () => {
  it('shows nothing for a single-floor walk', () => {
    expect(journeyStages(buildJourney(byId('g-canteen'))!, 0)).toEqual([])
  })

  it('lists both walking stages with the lift between them', () => {
    const stages = journeyStages(buildJourney(byId('f-library'))!, 0)
    expect(stages.map((s) => s.key)).toEqual(['origin', 'lift', 'destination'])
    // Short floor names: the summary chips above already carry the full
    // one, and the stepper has to fit the 340px desktop panel whole.
    expect(stages.map((s) => s.label)).toEqual(['Ground', 'Lift', 'First'])
  })

  it('marks the ground leg active before the lift is taken', () => {
    const stages = journeyStages(buildJourney(byId('f-library'))!, 0)
    expect(stages.map((s) => s.state)).toEqual(['active', 'upcoming', 'upcoming'])
  })

  it('moves the active stage upstairs on the second leg', () => {
    const stages = journeyStages(buildJourney(byId('f-library'))!, 1)
    expect(stages.map((s) => s.state)).toEqual(['done', 'done', 'active'])
  })

  it('names the second floor for an administration journey', () => {
    const journey = buildJourney(byId('s-dean'))!
    expect(journeyStages(journey, 1).map((s) => s.label)).toEqual(['Ground', 'Lift', 'Second'])
    expect(journeyStages(journey, 1).find((s) => s.state === 'active')!.key).toBe('destination')
  })

  it('marks exactly one stage active on every upstairs journey', () => {
    for (const l of LOCATIONS.filter((x) => x.floor !== 'ground')) {
      const journey = buildJourney(l)!
      for (let i = 0; i < journey.legs.length; i++) {
        const active = journeyStages(journey, i).filter((s) => s.state === 'active')
        expect(active, `${l.id} leg ${i}`).toHaveLength(1)
      }
    }
  })
})

describe('the routes themselves are untouched by the redesign', () => {
  it('still ends every walk at the door of its real endpoint', () => {
    for (const l of LOCATIONS) {
      const journey = buildJourney(l)!
      const end = routeTarget(l)
      const last = journey.legs[journey.legs.length - 1]
      expect(last.route.end, l.id).toEqual(end.door)
      expect(last.floor, l.id).toBe(end.floor)
    }
  })

  it('never routes into a restricted room', () => {
    for (const l of LOCATIONS.filter((x) => x.restricted)) {
      const end = routeTarget(l)
      expect(end.id, l.id).toBe(l.restricted!.routeVia)
      expect(end.restricted, `${l.id} desk is open`).toBeUndefined()
    }
  })

  it('keeps the distances and instruction counts the college signed off', () => {
    const coffee = buildJourney(byId('g-coffee-shop'))!.legs[0].route
    expect(Math.round(coffee.length / UNITS_PER_METRE)).toBe(20)
    expect(coffee.steps).toHaveLength(4)
    expect(coffee.steps[3].text).toBe('Coffee Shop is straight ahead.')

    const clinic = buildJourney(byId('g-uc-clinic'))!.legs[0].route
    expect(Math.round(clinic.length / UNITS_PER_METRE)).toBe(37)
    expect(clinic.steps).toHaveLength(5)
    expect(clinic.steps[4].text).toBe('UC Reception is on your right.')

    const library = buildJourney(byId('f-library'))!
    expect(Math.round(library.legs[0].route.length / UNITS_PER_METRE)).toBe(25)
    expect(Math.round(library.legs[1].route.length / UNITS_PER_METRE)).toBe(7)
    expect(library.legs[0].route.steps).toHaveLength(5)
    expect(library.legs[1].route.steps).toHaveLength(2)

    const admin = buildJourney(byId('s-reception'))!
    expect(Math.round(admin.legs[1].route.length / UNITS_PER_METRE)).toBe(3)
  })

  it('leaves the car park with its own note instead of a turn list', () => {
    const parking = byId('g-parking')
    expect(parking.routeNote).toBe('Follow the outdoor access path to the Parking Entrance.')
    expect(buildJourney(parking)!.legs).toHaveLength(1)
  })
})
