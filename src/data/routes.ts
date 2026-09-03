/**
 * Indoor route finding.
 *
 * Every floor carries a small graph whose nodes sit on the centre line
 * of a real corridor and whose edges join corridor segments that are
 * genuinely connected. A route is therefore a corridor walk by
 * construction: it never crosses a wall or cuts through a room. The
 * only off-corridor step is the last one, from the corridor into the
 * chosen room's door.
 */

import { FLOOR_BY_ID } from './floors'
import { GRAPHS } from './locations'
import type { Location, Pt } from './types'

const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1])

export interface Route {
  /** Full polyline, from the floor's starting point to the door. */
  points: Pt[]
  start: Pt
  end: Pt
  /** Total walking distance in SVG units (used for the step text). */
  length: number
  steps: string[]
}

/** Dijkstra over the corridor graph for one floor. */
function shortestPath(floor: Location['floor'], from: string, to: string): string[] | null {
  const { nodes, edges } = GRAPHS[floor]
  if (!nodes[from] || !nodes[to]) return null
  if (from === to) return [from]

  const adj = new Map<string, string[]>()
  for (const [a, b] of edges) {
    if (!nodes[a] || !nodes[b]) continue
    if (!adj.has(a)) adj.set(a, [])
    if (!adj.has(b)) adj.set(b, [])
    adj.get(a)!.push(b)
    adj.get(b)!.push(a)
  }

  const best = new Map<string, number>([[from, 0]])
  const prev = new Map<string, string>()
  const visited = new Set<string>()

  for (;;) {
    let current: string | null = null
    let currentCost = Infinity
    for (const [id, cost] of best) {
      if (!visited.has(id) && cost < currentCost) {
        current = id
        currentCost = cost
      }
    }
    if (current === null) return null
    if (current === to) break
    visited.add(current)

    for (const next of adj.get(current) ?? []) {
      if (visited.has(next)) continue
      const cost = currentCost + dist(nodes[current], nodes[next])
      if (cost < (best.get(next) ?? Infinity)) {
        best.set(next, cost)
        prev.set(next, current)
      }
    }
  }

  const path: string[] = [to]
  let cursor = to
  while (prev.has(cursor)) {
    cursor = prev.get(cursor)!
    path.unshift(cursor)
  }
  return path
}

/** Remove points that lie on a straight line between their neighbours. */
function simplify(points: Pt[]): Pt[] {
  if (points.length < 3) return points
  const out: Pt[] = [points[0]]
  for (let i = 1; i < points.length - 1; i++) {
    const [ax, ay] = out[out.length - 1]
    const [bx, by] = points[i]
    const [cx, cy] = points[i + 1]
    const cross = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax)
    const scale = Math.max(1, dist(out[out.length - 1], points[i + 1]))
    if (Math.abs(cross) / scale > 1.2) out.push(points[i])
  }
  out.push(points[points.length - 1])
  return out
}

/** Turn a corridor walk into a handful of plain-English steps. */
function describe(points: Pt[], target: Location, floorName: string, origin: string): string[] {
  const steps: string[] = [`Start at the ${origin}.`]
  let turns = 0
  for (let i = 1; i < points.length - 1; i++) {
    const [ax, ay] = points[i - 1]
    const [bx, by] = points[i]
    const [cx, cy] = points[i + 1]
    const a1 = Math.atan2(by - ay, bx - ax)
    const a2 = Math.atan2(cy - by, cx - bx)
    let delta = ((a2 - a1) * 180) / Math.PI
    while (delta > 180) delta -= 360
    while (delta < -180) delta += 360
    if (Math.abs(delta) > 35) turns++
  }
  steps.push(
    turns === 0
      ? 'Follow the highlighted corridor straight ahead.'
      : `Follow the highlighted corridor, taking ${turns} turn${turns > 1 ? 's' : ''} along the way.`,
  )
  steps.push(`${target.name} is on your ${floorName.toLowerCase()}, marked by the orange pin.`)
  return steps
}

/**
 * Build the route to a destination, starting from the floor's own
 * origin (the patient entrance on the ground floor, the lift lobby
 * upstairs).
 */
export function buildRoute(target: Location): Route | null {
  const floor = FLOOR_BY_ID[target.floor]
  const { nodes } = GRAPHS[target.floor]
  const path = shortestPath(target.floor, floor.routeOrigin.node, target.entryNode)
  if (!path) return null

  const raw: Pt[] = [floor.routeOrigin.point, ...path.map((id) => nodes[id]), target.door]
  const deduped: Pt[] = []
  for (const p of raw) {
    const last = deduped[deduped.length - 1]
    if (!last || dist(last, p) > 0.5) deduped.push(p)
  }
  const points = simplify(deduped)

  let length = 0
  for (let i = 1; i < points.length; i++) length += dist(points[i - 1], points[i])

  return {
    points,
    start: points[0],
    end: points[points.length - 1],
    length,
    steps: describe(points, target, floor.name, floor.routeOrigin.label),
  }
}

/**
 * Visitors arrive on the Ground Floor, so anything upstairs needs a
 * lift or stair leg before the drawn route begins.
 */
export function floorChangeHint(target: Location): string | null {
  if (target.floor === 'ground') return null
  const name = FLOOR_BY_ID[target.floor].name
  return `Take the lift to the ${name}, then follow the highlighted route.`
}

export function pathAsSvg(points: Pt[]): string {
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(' ')
}
