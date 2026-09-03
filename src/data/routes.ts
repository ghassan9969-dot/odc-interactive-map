/**
 * Indoor route finding and turn-by-turn guidance.
 *
 * Every floor carries a small graph whose nodes sit on the centre line
 * of a real corridor and whose edges join corridor segments that are
 * genuinely connected. A route is therefore a corridor walk by
 * construction: it never crosses a wall or cuts through a room. The
 * only off-corridor step is the last one, from the corridor into the
 * chosen room's door.
 *
 * The kiosk stands at the Patient Entrance on the Ground Floor, so a
 * visit to an upper floor is modelled as a two-leg journey: walk to the
 * L1 & L2 lifts, ride up, then walk from the lift lobby to the room.
 */

import { FLOOR_BY_ID } from './floors'
import { GRAPHS, LOCATIONS } from './locations'
import type { FloorId, Location, Pt } from './types'

/** The plans are drawn at roughly 13 SVG units per metre. */
export const UNITS_PER_METRE = 12.95

/** Ground floor lifts that serve the First and Second Floors. */
const LIFT_ID = 'g-lift-12'

const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1])
const metres = (units: number) => Math.max(1, Math.round(units / UNITS_PER_METRE))

export type StepKind = 'start' | 'straight' | 'left' | 'right' | 'arrive'

export interface RouteStep {
  kind: StepKind
  text: string
}

export interface Route {
  floor: FloorId
  /** Full polyline, from the leg's starting point to the door. */
  points: Pt[]
  start: Pt
  end: Pt
  /** Total walking distance in SVG units. */
  length: number
  originLabel: string
  destLabel: string
  steps: RouteStep[]
}

export interface JourneyLeg {
  floor: FloorId
  route: Route
  /** Short title for the step header, e.g. "Go to the lifts". */
  title: string
}

export interface Journey {
  target: Location
  legs: JourneyLeg[]
}

/* ------------------------------------------------------------------ */
/* Graph search                                                        */
/* ------------------------------------------------------------------ */

/** Dijkstra over the corridor graph for one floor. */
function shortestPath(floor: FloorId, from: string, to: string): string[] | null {
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

/* ------------------------------------------------------------------ */
/* Turn-by-turn text                                                   */
/* ------------------------------------------------------------------ */

interface Segment {
  dx: number
  dy: number
  len: number
}

/**
 * Signed angle from one heading to the next, in degrees.
 *
 * The plans are drawn in screen space (y increases downwards), so a
 * positive cross product means the walker turns to their right.
 */
function turnAngle(a: Segment, b: Segment): number {
  const cross = a.dx * b.dy - a.dy * b.dx
  const dot = a.dx * b.dx + a.dy * b.dy
  return (Math.atan2(cross, dot) * 180) / Math.PI
}

/** A turn smaller than this reads as "carry on", not as a turn. */
const STRAIGHT_DEG = 28
/** The step through a doorway, reported as the arrival side instead. */
const DOOR_STUB_UNITS = 4.5 * UNITS_PER_METRE
/** A sidestep no longer than this may be folded away — but only when it
 *  leaves the direction of travel unchanged, so no real turn is lost. */
const MICRO_JOG_UNITS = 6 * UNITS_PER_METRE
/** A stub at the very start, before any heading has been established. */
const START_STUB_UNITS = 2.5 * UNITS_PER_METRE

/** Fold one hop into another, keeping the summed heading and distance. */
function absorb(into: Segment, hop: Segment) {
  into.dx += hop.dx
  into.dy += hop.dy
  into.len += hop.len
}

/** Join hops that continue in the same direction. Never hides a turn. */
function mergeStraight(hops: Segment[]): Segment[] {
  const out: Segment[] = []
  for (const hop of hops) {
    const prev = out[out.length - 1]
    if (prev && Math.abs(turnAngle(prev, hop)) < STRAIGHT_DEG) {
      absorb(prev, hop)
      continue
    }
    out.push({ ...hop })
  }
  return out
}

/**
 * Turn the corridor walk into a handful of plain instructions.
 *
 * Only the route's own geometry is used — nothing is invented, and no
 * landmark is named that is not the origin or the destination itself.
 */
export function buildSteps(points: Pt[], originLabel: string, destLabel: string): RouteStep[] {
  const steps: RouteStep[] = [{ kind: 'start', text: `Start at the ${originLabel}.` }]

  const segs: Segment[] = []
  for (let i = 1; i < points.length; i++) {
    const dx = points[i][0] - points[i - 1][0]
    const dy = points[i][1] - points[i - 1][1]
    const len = Math.hypot(dx, dy)
    if (len > 0.5) segs.push({ dx, dy, len })
  }

  if (segs.length === 0) {
    steps.push({ kind: 'arrive', text: `${destLabel} is right here.` })
    return steps
  }

  // Which way does the visitor face as they arrive? Compare the final
  // approach against the heading they held before it.
  const approach = segs[segs.length - 1]
  const beforeApproach = segs.length > 1 ? segs[segs.length - 2] : null
  let side = 'straight ahead'
  if (beforeApproach && approach.len > 0.15 * UNITS_PER_METRE) {
    const a = turnAngle(beforeApproach, approach)
    if (a > STRAIGHT_DEG) side = 'on your right'
    else if (a < -STRAIGHT_DEG) side = 'on your left'
  }

  // The last hop is the step through the doorway. Its direction is
  // already reported as the arrival side, so it is folded back rather
  // than becoming a turn instruction of its own.
  if (segs.length > 1 && approach.len < DOOR_STUB_UNITS) {
    absorb(segs[segs.length - 2], approach)
    segs.pop()
  }

  // Pass one: join hops that carry straight on.
  let walk = mergeStraight(segs)

  // Pass two: drop harmless micro-jogs — a short sidestep whose
  // neighbours still head the same way, so the direction of travel is
  // unchanged. A short hop between two genuinely different headings is
  // a real turn and is always kept, however long the list becomes.
  for (let guard = 0; guard < walk.length; guard++) {
    const jog = walk.findIndex(
      (hop, i) =>
        i > 0 &&
        i < walk.length - 1 &&
        hop.len <= MICRO_JOG_UNITS &&
        Math.abs(turnAngle(walk[i - 1], walk[i + 1])) < STRAIGHT_DEG,
    )
    if (jog === -1) break
    absorb(walk[jog - 1], walk[jog])
    walk.splice(jog, 1)
    walk = mergeStraight(walk)
  }

  // A stub at the very start says nothing useful — the visitor has just
  // stepped out of a lift or a doorway with no heading to turn from.
  if (walk.length > 1 && walk[0].len < START_STUB_UNITS) {
    absorb(walk[1], walk[0])
    walk.shift()
  }

  const total = walk.reduce((sum, w) => sum + w.len, 0)
  if (total < 9 * UNITS_PER_METRE) {
    steps.push({ kind: 'arrive', text: `${destLabel} is a few steps away, ${side}.` })
    return steps
  }

  walk.forEach((leg, i) => {
    const d = metres(leg.len)
    if (i === 0) {
      steps.push({ kind: 'straight', text: `Walk ahead for about ${d} m.` })
      return
    }
    // Recomputed here: merging changes the heading a leg represents.
    const angle = turnAngle(walk[i - 1], leg)
    if (Math.abs(angle) < STRAIGHT_DEG) {
      steps.push({ kind: 'straight', text: `Carry on for about ${d} m.` })
      return
    }
    const dir = angle > 0 ? 'right' : 'left'
    steps.push({ kind: dir, text: `Turn ${dir} and carry on for about ${d} m.` })
  })

  steps.push({ kind: 'arrive', text: `${destLabel} is ${side}.` })
  return steps
}

/* ------------------------------------------------------------------ */
/* Route and journey construction                                      */
/* ------------------------------------------------------------------ */

function makeRoute(target: Location, destLabel: string): Route | null {
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
    floor: target.floor,
    points,
    start: points[0],
    end: points[points.length - 1],
    length,
    originLabel: floor.routeOrigin.label,
    destLabel,
    steps: buildSteps(points, floor.routeOrigin.label, destLabel),
  }
}

/** Single-floor walk to a destination, from that floor's own origin. */
export function buildRoute(target: Location): Route | null {
  return makeRoute(target, target.name)
}

/**
 * The complete visitor journey from the kiosk at the Patient Entrance.
 *
 * Ground floor destinations are one leg. Anything upstairs is two: walk
 * to the L1 & L2 lifts, then walk from the lift lobby to the room.
 */
export function buildJourney(target: Location): Journey | null {
  if (target.floor === 'ground') {
    const route = buildRoute(target)
    return route ? { target, legs: [{ floor: 'ground', route, title: target.name }] } : null
  }

  const lifts = LOCATIONS.find((l) => l.id === LIFT_ID)
  if (!lifts) return null
  const toLifts = makeRoute(lifts, 'The L1 & L2 lift lobby')
  const fromLifts = buildRoute(target)
  if (!toLifts || !fromLifts) return null

  return {
    target,
    legs: [
      { floor: 'ground', route: toLifts, title: 'Go to the lifts' },
      { floor: target.floor, route: fromLifts, title: target.name },
    ],
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

export function walkingMinutes(units: number): number {
  return Math.max(1, Math.round(units / UNITS_PER_METRE / 1.3 / 60))
}

export function pathAsSvg(points: Pt[]): string {
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(' ')
}
