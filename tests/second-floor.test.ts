/**
 * The Second Floor, revised with the college against
 * OG-ODC-CVL-AB-ARCH-16-C.
 *
 * The floor carries no visitor routes of its own — everything on it is
 * behind the reception — so these checks guard the drawing instead: that
 * rooms do not sit on top of one another, that the corridor graph is
 * whole and stays inside the corridors, and that every door is cut in
 * the wall of the room it belongs to.
 */

import { describe, expect, it } from 'vitest'
import { boundsOf } from '../src/data/geometry'
import { secondCirculation, secondEdges, secondNodes } from '../src/data/second'
import { circulationOnFloor, locationsOnFloor, secondaryOnFloor } from '../src/data/locations'
import { routeTarget } from '../src/data/routes'
import type { Pt } from '../src/data/types'

const second = locationsOnFloor('second')
const support = secondaryOnFloor('second')
const corridors = circulationOnFloor('second')

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

/** Overlap of two axis-aligned boxes, ignoring a shared wall line. */
const overlaps = (a: Pt[], b: Pt[]): boolean => {
  const x = boundsOf([a])
  const y = boundsOf([b])
  return (
    x.x + x.w - y.x > 1 && y.x + y.w - x.x > 1 && x.y + x.h - y.y > 1 && y.y + y.h - x.y > 1
  )
}

const inAnyCorridor = (p: Pt): boolean =>
  corridors.some((c) => c.polys.some((poly) => pointInPolygon(p, poly)))

describe('the second floor plan', () => {
  it('draws every room clear of its neighbours', () => {
    const rooms = [
      ...second.map((l) => ({ id: l.id, polys: l.shape.polys })),
      ...support.map((s) => ({ id: s.id, polys: s.shape.polys })),
    ]
    const clashes: string[] = []
    for (let i = 0; i < rooms.length; i++) {
      for (let j = i + 1; j < rooms.length; j++) {
        for (const a of rooms[i].polys) {
          for (const b of rooms[j].polys) {
            if (overlaps(a, b)) clashes.push(`${rooms[i].id} over ${rooms[j].id}`)
          }
        }
      }
    }
    expect([...new Set(clashes)]).toEqual([])
  })

  it('never lays a room over a corridor', () => {
    const clashes: string[] = []
    for (const room of [...second, ...support]) {
      // The lifts and stairs are drawn inside the circulation they serve.
      if ('category' in room && room.category === 'circulation') continue
      for (const a of room.shape.polys) {
        for (const c of corridors) {
          for (const b of c.polys) if (overlaps(a, b)) clashes.push(`${room.id} over ${c.id}`)
        }
      }
    }
    expect([...new Set(clashes)]).toEqual([])
  })
})

describe('the second floor corridor graph', () => {
  it('keeps every node inside a corridor', () => {
    const stray = Object.entries(secondNodes)
      .filter(([, p]) => !inAnyCorridor(p))
      .map(([id]) => id)
    expect(stray).toEqual([])
  })

  it('joins only nodes that exist', () => {
    const dangling = secondEdges
      .flat()
      .filter((id) => !(id in secondNodes))
      .map((id) => `edge to missing node ${id}`)
    expect([...new Set(dangling)]).toEqual([])
  })

  it('leaves no node stranded off the graph', () => {
    const used = new Set(secondEdges.flat())
    expect(Object.keys(secondNodes).filter((id) => !used.has(id))).toEqual([])
  })

  it('starts every destination at a node that exists', () => {
    const missing = second
      .filter((l) => !(l.entryNode in secondNodes))
      .map((l) => `${l.id} -> ${l.entryNode}`)
    expect(missing).toEqual([])
  })
})

describe('the second floor doors', () => {
  it('cuts every door mark in the wall of its own room', () => {
    const wrong: string[] = []
    for (const room of [...second, ...support]) {
      for (const d of room.doorMarks ?? []) {
        const box = boundsOf(room.shape.polys)
        const onWall =
          d[0] >= box.x - 3 &&
          d[0] <= box.x + box.w + 3 &&
          d[1] >= box.y - 3 &&
          d[1] <= box.y + box.h + 3
        if (!onWall) wrong.push(`${room.id} door outside its own bounds`)
      }
    }
    expect(wrong).toEqual([])
  })

  it('never opens a door inside another room', () => {
    const wrong: string[] = []
    for (const room of [...second, ...support]) {
      for (const d of room.doorMarks ?? []) {
        for (const other of [...second, ...support]) {
          if (other.id === room.id) continue
          const box = boundsOf(other.shape.polys)
          // Well inside another room, not merely touching its wall.
          if (
            d[0] > box.x + 3 &&
            d[0] < box.x + box.w - 3 &&
            d[1] > box.y + 3 &&
            d[1] < box.y + box.h - 3
          ) {
            wrong.push(`${room.id} door inside ${other.id}`)
          }
        }
      }
    }
    expect([...new Set(wrong)]).toEqual([])
  })
})

describe('the second floor is closed to visitors', () => {
  it('sends every destination but the desk to the desk', () => {
    const open = second.filter((l) => l.category !== 'circulation' && !l.restricted)
    expect(open.map((l) => l.id)).toEqual(['s-reception'])
    for (const l of second.filter((l) => l.restricted)) {
      expect(routeTarget(l).id, `${l.id}`).toBe('s-reception')
    }
  })

  it('names the reception in every restriction notice', () => {
    for (const l of second.filter((l) => l.restricted)) {
      expect(l.restricted!.message).toContain('Administration Reception')
    }
  })

  it('still draws the eastern half as open shell', () => {
    expect(secondCirculation.length).toBeGreaterThan(0)
    expect(second.every((l) => boundsOf(l.shape.polys).x < 1130 - 90)).toBe(true)
  })
})
