/**
 * Combined dataset for all three floors.
 */

import type { CirculationArea, FloorId, Location, Pt, SecondarySpace } from './types'
import { FLOORS } from './floors'
import { groundCirculation, groundEdges, groundLocations, groundNodes, groundSecondary } from './ground'
import { firstCirculation, firstEdges, firstLocations, firstNodes, firstSecondary } from './first'
import {
  secondCirculation,
  secondEdges,
  secondLocations,
  secondNodes,
  secondSecondary,
} from './second'

export { secondOpenShell } from './second'

export const LOCATIONS: Location[] = [...groundLocations, ...firstLocations, ...secondLocations]

export const SECONDARY: SecondarySpace[] = [...groundSecondary, ...firstSecondary, ...secondSecondary]

export const CIRCULATION: CirculationArea[] = [
  ...groundCirculation,
  ...firstCirculation,
  ...secondCirculation,
]

export interface CorridorGraph {
  nodes: Record<string, Pt>
  edges: [string, string][]
}

export const GRAPHS: Record<FloorId, CorridorGraph> = {
  ground: { nodes: groundNodes, edges: groundEdges },
  first: { nodes: firstNodes, edges: firstEdges },
  second: { nodes: secondNodes, edges: secondEdges },
}

export const locationsOnFloor = (floor: FloorId): Location[] =>
  LOCATIONS.filter((l) => l.floor === floor)

export const secondaryOnFloor = (floor: FloorId): SecondarySpace[] =>
  SECONDARY.filter((s) => s.floor === floor)

export const circulationOnFloor = (floor: FloorId): CirculationArea[] =>
  CIRCULATION.filter((c) => c.floor === floor)

export const locationById = (id: string | null): Location | null =>
  id ? LOCATIONS.find((l) => l.id === id) ?? null : null

/** The important destinations of one floor, in the order they are authored. */
export const importantOnFloor = (floor: FloorId): Location[] =>
  locationsOnFloor(floor).filter((l) => l.primary)

export interface FloorGroup {
  floor: FloorId
  name: string
  items: Location[]
}

/**
 * Every important destination in the college, grouped by floor.
 *
 * Read straight from the floor data each time, so a room that gains or
 * loses `primary` appears or disappears here with no list to maintain
 * alongside it. The order of the groups follows `FLOORS`, which is the
 * order the building is stacked in, and the order inside a group is the
 * order the floor authored its rooms.
 */
export const importantByFloor = (): { groups: FloorGroup[]; total: number } => {
  const groups = FLOORS.map((floor) => ({
    floor: floor.id,
    name: floor.name,
    items: importantOnFloor(floor.id),
  }))
  return { groups, total: groups.reduce((n, g) => n + g.items.length, 0) }
}
