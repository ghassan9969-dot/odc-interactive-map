/**
 * Combined dataset for all three floors.
 */

import type { CirculationArea, FloorId, Location, Pt, SecondarySpace } from './types'
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
