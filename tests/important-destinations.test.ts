/**
 * The combined list of important destinations.
 *
 * A fourth tab gathers the rooms worth signposting from all three
 * floors into one grouped list. The grouping is derived from the floor
 * data every time it is asked for, so a room that gains or loses
 * `primary` moves in or out of this list on its own. These checks exist
 * to keep it that way: they compare the helper against the source data
 * rather than against a list of ids written down beside it.
 */

import { describe, expect, it } from 'vitest'
import {
  LOCATIONS,
  importantByFloor,
  importantOnFloor,
  locationsOnFloor,
} from '../src/data/locations'
import { FLOORS } from '../src/data/floors'
import type { FloorId } from '../src/data/types'

const FLOOR_IDS: FloorId[] = ['ground', 'first', 'second']

describe('what the combined list holds', () => {
  it('holds exactly every important destination in the college', () => {
    const { groups } = importantByFloor()
    const listed = groups.flatMap((g) => g.items.map((l) => l.id)).sort()
    const expected = LOCATIONS.filter((l) => l.primary).map((l) => l.id).sort()
    expect(listed).toEqual(expected)
  })

  it('counts sixteen, sixteen and fourteen, and forty-six in all', () => {
    const { groups, total } = importantByFloor()
    expect(groups.map((g) => g.items.length)).toEqual([16, 16, 14])
    expect(total).toBe(46)
  })

  it('adds up: the total is the sum of the groups', () => {
    const { groups, total } = importantByFloor()
    expect(total).toBe(groups.reduce((n, g) => n + g.items.length, 0))
    // And it is not quietly counting something twice.
    expect(total).toBe(new Set(groups.flatMap((g) => g.items.map((l) => l.id))).size)
  })

  it('lists no destination twice', () => {
    const ids = importantByFloor().groups.flatMap((g) => g.items.map((l) => l.id))
    expect(ids).toHaveLength(new Set(ids).size)
  })

  it('lets nothing in that is not marked important', () => {
    for (const group of importantByFloor().groups) {
      for (const room of group.items) {
        expect(room.primary, `${room.id} is not primary`).toBe(true)
      }
    }
  })

  it('leaves out the rooms a visitor is not sent to browse', () => {
    const listed = new Set(
      importantByFloor().groups.flatMap((g) => g.items.map((l) => l.id)),
    )
    // A sample of rooms that exist as destinations but are not important:
    // the plaster room reached through the CSL, the X-ray training suite,
    // and the vertical circulation.
    for (const id of ['f-s-plaster', 'f-xray-training', 'g-lift-12', 'g-stair-02']) {
      const room = LOCATIONS.find((l) => l.id === id)
      expect(room, `${id} should exist`).toBeTruthy()
      expect(room!.primary, `${id} is not primary`).toBe(false)
      expect(listed.has(id), `${id} must not be listed`).toBe(false)
    }
    // Support spaces — toilets, prayer rooms, technical rooms — are not
    // destinations at all, so they cannot reach the list by any route.
    expect([...listed].every((id) => LOCATIONS.some((l) => l.id === id))).toBe(true)
  })
})

describe('how the combined list is ordered', () => {
  it('stacks the groups Ground, First, then Second', () => {
    const { groups } = importantByFloor()
    expect(groups.map((g) => g.floor)).toEqual(FLOOR_IDS)
    expect(groups.map((g) => g.name)).toEqual(['Ground Floor', 'First Floor', 'Second Floor'])
  })

  it('follows the order the floors themselves are registered in', () => {
    expect(importantByFloor().groups.map((g) => g.floor)).toEqual(FLOORS.map((f) => f.id))
  })

  it('keeps each floor’s own order inside its group', () => {
    for (const group of importantByFloor().groups) {
      const onFloor = locationsOnFloor(group.floor).filter((l) => l.primary)
      expect(group.items.map((l) => l.id)).toEqual(onFloor.map((l) => l.id))
    }
  })
})

describe('it is derived, not written down', () => {
  it('agrees with a fresh filter of the source data on every floor', () => {
    for (const floor of FLOOR_IDS) {
      const derived = importantOnFloor(floor).map((l) => l.id)
      const fromSource = LOCATIONS.filter((l) => l.floor === floor && l.primary).map((l) => l.id)
      expect(derived, floor).toEqual(fromSource)
    }
  })

  it('would follow the data if a room changed its mind', () => {
    // Not a mutation of the real dataset: this only proves the helper
    // reads `primary` at call time rather than caching a list of ids.
    const room = LOCATIONS.find((l) => l.id === 'f-xray-training')!
    expect(importantByFloor().total).toBe(46)
    room.primary = true
    try {
      const after = importantByFloor()
      expect(after.total).toBe(47)
      expect(after.groups[1].items.some((l) => l.id === 'f-xray-training')).toBe(true)
    } finally {
      room.primary = false
    }
    expect(importantByFloor().total).toBe(46)
  })
})

describe('the per-floor lists are untouched', () => {
  it('still returns every room on a floor, important or not', () => {
    for (const floor of FLOOR_IDS) {
      const all = locationsOnFloor(floor)
      const important = all.filter((l) => l.primary)
      const rest = all.filter((l) => !l.primary)
      expect(important.length + rest.length).toBe(all.length)
      expect(important.length).toBeGreaterThan(0)
      expect(rest.length).toBeGreaterThan(0)
    }
  })

  it('gives the same important rooms per floor as the combined list', () => {
    const { groups } = importantByFloor()
    for (const group of groups) {
      const fromFloorList = locationsOnFloor(group.floor).filter((l) => l.primary)
      expect(group.items).toEqual(fromFloorList)
    }
  })

  it('keeps the floor totals the map has always had', () => {
    expect(FLOOR_IDS.map((f) => locationsOnFloor(f).length)).toEqual([42, 23, 21])
    expect(LOCATIONS).toHaveLength(86)
  })
})
