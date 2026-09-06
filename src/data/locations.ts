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

/**
 * How many destinations each photograph is used by.
 *
 * Counted from the floor data every time it is asked for, so a picture
 * that is later given to a second room stops counting as that room's
 * own, and one that becomes exclusive starts counting as it, with no
 * list of ids or filenames to keep in step alongside.
 */
export const photoUsage = (): Map<string, number> => {
  const uses = new Map<string, number>()
  for (const l of LOCATIONS) {
    if (!l.image) continue
    uses.set(l.image, (uses.get(l.image) ?? 0) + 1)
  }
  return uses
}

/**
 * Whether a destination's photograph belongs to it alone.
 *
 * The six tutorial rooms share one photograph between them, and the
 * four lecture rooms another, so showing it beside every name would
 * repeat the same picture down the list without telling a visitor which
 * room is which. Only a picture used exactly once identifies the room
 * it sits beside; the rest keep the category mark that does.
 */
export const hasUniquePhoto = (location: Location, uses = photoUsage()): boolean =>
  location.image !== undefined && uses.get(location.image) === 1
