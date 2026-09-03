import { describe, expect, it } from 'vitest'
import { FLOORS, FLOOR_BY_ID } from '../src/data/floors'
import { GRAPHS, LOCATIONS, SECONDARY, CIRCULATION, secondOpenShell } from '../src/data/locations'
import { buildRoute } from '../src/data/routes'
import type { FloorId } from '../src/data/types'

const FLOOR_IDS: FloorId[] = ['ground', 'first', 'second']

const isFinitePoint = (p: [number, number]) => Number.isFinite(p[0]) && Number.isFinite(p[1])

describe('destination data', () => {
  it('gives every location a unique id', () => {
    const seen = new Map<string, number>()
    for (const l of LOCATIONS) seen.set(l.id, (seen.get(l.id) ?? 0) + 1)
    const duplicates = [...seen].filter(([, n]) => n > 1).map(([id]) => id)
    expect(duplicates).toEqual([])
  })

  it('gives every secondary space a unique id', () => {
    const ids = SECONDARY.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('places every destination on a real floor', () => {
    for (const l of LOCATIONS) {
      expect(FLOOR_IDS, `${l.id} has floor "${l.floor}"`).toContain(l.floor)
    }
  })

  it('gives every destination a finite door, label and shape', () => {
    for (const l of LOCATIONS) {
      expect(isFinitePoint(l.door), `${l.id} door`).toBe(true)
      expect(isFinitePoint(l.label), `${l.id} label`).toBe(true)
      expect(l.shape.polys.length, `${l.id} has no polygon`).toBeGreaterThan(0)
      for (const ring of l.shape.polys) {
        expect(ring.length, `${l.id} polygon needs 3+ points`).toBeGreaterThanOrEqual(3)
        for (const p of ring) expect(isFinitePoint(p), `${l.id} polygon point`).toBe(true)
      }
    }
  })

  it('names every destination and gives it a description', () => {
    for (const l of LOCATIONS) {
      expect(l.name.trim().length, `${l.id} name`).toBeGreaterThan(0)
      expect(l.shortName.trim().length, `${l.id} shortName`).toBeGreaterThan(0)
      expect(l.description.trim().length, `${l.id} description`).toBeGreaterThan(0)
    }
  })
})

describe('corridor graphs', () => {
  it('gives every graph node a finite position', () => {
    for (const floor of FLOOR_IDS) {
      for (const [id, p] of Object.entries(GRAPHS[floor].nodes)) {
        expect(isFinitePoint(p), `${floor}/${id}`).toBe(true)
      }
    }
  })

  it('only joins nodes that exist', () => {
    const dangling: string[] = []
    for (const floor of FLOOR_IDS) {
      const { nodes, edges } = GRAPHS[floor]
      for (const [a, b] of edges) {
        if (!nodes[a]) dangling.push(`${floor}: edge from unknown node "${a}"`)
        if (!nodes[b]) dangling.push(`${floor}: edge to unknown node "${b}"`)
      }
    }
    expect(dangling).toEqual([])
  })

  it('has no self-loops or duplicate edges', () => {
    for (const floor of FLOOR_IDS) {
      const seen = new Set<string>()
      for (const [a, b] of GRAPHS[floor].edges) {
        expect(a, `${floor}: self-loop on ${a}`).not.toBe(b)
        const key = [a, b].sort().join('~')
        expect(seen.has(key), `${floor}: duplicate edge ${key}`).toBe(false)
        seen.add(key)
      }
    }
  })

  it('starts every floor from a node that exists', () => {
    for (const floor of FLOORS) {
      expect(
        GRAPHS[floor.id].nodes[floor.routeOrigin.node],
        `${floor.id} route origin "${floor.routeOrigin.node}"`,
      ).toBeDefined()
      expect(isFinitePoint(floor.routeOrigin.point)).toBe(true)
    }
  })

  it('points every destination at an entry node on its own floor', () => {
    const missing: string[] = []
    for (const l of LOCATIONS) {
      if (!GRAPHS[l.floor].nodes[l.entryNode]) {
        missing.push(`${l.id} (${l.name}) -> "${l.entryNode}" is not on the ${l.floor} floor`)
      }
    }
    expect(missing).toEqual([])
  })

  it('leaves no node unreachable from its floor origin', () => {
    for (const floor of FLOOR_IDS) {
      const { nodes, edges } = GRAPHS[floor]
      const adj = new Map<string, string[]>()
      for (const [a, b] of edges) {
        if (!adj.has(a)) adj.set(a, [])
        if (!adj.has(b)) adj.set(b, [])
        adj.get(a)!.push(b)
        adj.get(b)!.push(a)
      }
      const seen = new Set<string>([FLOOR_BY_ID[floor].routeOrigin.node])
      const queue = [...seen]
      while (queue.length) {
        for (const next of adj.get(queue.shift()!) ?? []) {
          if (!seen.has(next)) {
            seen.add(next)
            queue.push(next)
          }
        }
      }
      // Only nodes an actual destination relies on have to be reachable.
      const needed = LOCATIONS.filter((l) => l.floor === floor).map((l) => l.entryNode)
      const stranded = [...new Set(needed)].filter((id) => !seen.has(id))
      expect(stranded, `${floor} floor`).toEqual([])
    }
  })
})

describe('circulation geometry', () => {
  it('gives every circulation area a finite polygon', () => {
    for (const c of CIRCULATION) {
      expect(c.polys.length, `${c.id} has no polygon`).toBeGreaterThan(0)
      for (const ring of c.polys) {
        for (const p of ring) expect(isFinitePoint(p), `${c.id} point`).toBe(true)
      }
    }
  })
})

describe('single-floor routes', () => {
  it('builds a route for every destination', () => {
    const failed = LOCATIONS.filter((l) => buildRoute(l) === null).map((l) => `${l.id} (${l.name})`)
    expect(failed).toEqual([])
  })

  it('produces clean polylines with no NaN, Infinity or repeated points', () => {
    for (const l of LOCATIONS) {
      const route = buildRoute(l)!
      expect(route.points.length, `${l.id} polyline`).toBeGreaterThanOrEqual(2)
      for (const p of route.points) expect(isFinitePoint(p), `${l.id} route point`).toBe(true)
      for (let i = 1; i < route.points.length; i++) {
        const a = route.points[i - 1]
        const b = route.points[i]
        expect(
          Math.hypot(a[0] - b[0], a[1] - b[1]),
          `${l.id} repeats point ${i}`,
        ).toBeGreaterThan(0.5)
      }
      expect(Number.isFinite(route.length), `${l.id} length`).toBe(true)
      expect(route.length, `${l.id} length`).toBeGreaterThan(0)
    }
  })

  it('starts at the floor origin and ends at the destination door', () => {
    for (const l of LOCATIONS) {
      const route = buildRoute(l)!
      const origin = FLOOR_BY_ID[l.floor].routeOrigin.point
      expect(Math.hypot(route.start[0] - origin[0], route.start[1] - origin[1])).toBeLessThan(1)
      expect(Math.hypot(route.end[0] - l.door[0], route.end[1] - l.door[1])).toBeLessThan(1)
    }
  })
})

describe('the unfitted Second Floor plate', () => {
  it('is not offered as a destination', () => {
    // Lifts L3 & L4 and Stair 03 sit in the open shell. They stay drawn on
    // the map as support spaces, but a visitor must never be sent there.
    const inShell = LOCATIONS.filter((l) => l.floor === 'second').filter((l) => {
      const box = l.shape.polys.flat()
      return box.every(([x]) => x > secondOpenShell.poly[0][0])
    })
    expect(inShell.map((l) => `${l.id} (${l.name})`)).toEqual([])
  })

  it('still draws the east lift core as a support space', () => {
    const drawn = SECONDARY.filter((s) => s.floor === 'second').map((s) => s.name)
    expect(drawn).toContain('Lifts L3 & L4')
    expect(drawn).toContain('Stair 03')
  })

  it('keeps no corridor node stranded inside the shell', () => {
    const shellX = secondOpenShell.poly[0][0]
    const inside = Object.entries(GRAPHS.second.nodes)
      .filter(([, p]) => p[0] > shellX)
      .map(([id]) => id)
    expect(inside).toEqual([])
  })
})
