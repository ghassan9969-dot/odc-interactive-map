/**
 * Shared types for the Oman Dental College visitor map.
 *
 * All geometry is authored in the coordinate space of the original
 * as-built architectural drawings (PDF points) and converted to SVG
 * space by the per-floor transforms in `geometry.ts`. This keeps every
 * room in its real position relative to the building.
 */

export type Pt = [number, number]

export type FloorId = 'ground' | 'first' | 'second'

export type CategoryId =
  | 'clinical'
  | 'learning'
  | 'laboratory'
  | 'food'
  | 'administration'
  | 'reception'
  | 'circulation'
  | 'secondary'

export type IconType =
  | 'reception'
  | 'coffee'
  | 'restaurant'
  | 'clinic'
  | 'surgery'
  | 'xray'
  | 'scan'
  | 'sterile'
  | 'waiting'
  | 'library'
  | 'classroom'
  | 'lecture'
  | 'lab'
  | 'simulation'
  | 'multimedia'
  | 'research'
  | 'lounge'
  | 'study'
  | 'office'
  | 'admin'
  | 'finance'
  | 'meeting'
  | 'boardroom'
  | 'students'
  | 'doctor'
  | 'lift'
  | 'stairs'
  | 'entrance'
  | 'toilet'
  | 'prayer'
  | 'store'
  | 'utility'
  | 'activity'
  | 'play'

/** A room / zone drawn on a floor map. */
export interface MapShape {
  /** One or more closed polygons (in SVG space) that make up the room. */
  polys: Pt[][]
  /** Faint internal division lines, drawn to suggest sub-rooms. */
  dividers?: [Pt, Pt][]
}

/** A destination the visitor can search for, select and navigate to. */
export interface Location {
  id: string
  name: string
  shortName: string
  floor: FloorId
  category: CategoryId
  description: string
  icon: IconType
  /** Geometry of the room, in SVG coordinates for its floor. */
  shape: MapShape
  /** Where the room label sits, in SVG coordinates. */
  label: Pt
  /** Font size override for the room label. */
  labelSize?: number
  /** Door / arrival point where a route terminates, in SVG coordinates. */
  door: Pt
  /**
   * Doorways drawn on the map. Set for entrances, exits and the
   * internal doors that matter for finding your way; left off where a
   * door mark would only add noise.
   */
  doorMarks?: Pt[]
  /** Corridor graph node the door connects to. */
  entryNode: string
  /** Extra search terms. */
  keywords?: string[]
  /** Listed in the "Important destinations" panel. */
  primary: boolean
  /**
   * A controlled clinical area. Visitors are routed to the check-in
   * desk named by `routeVia` instead of into the room itself, and the
   * card carries the warning below.
   */
  restricted?: {
    title: string
    message: string
    /** Id of the Location a visitor must be sent to instead. */
    routeVia: string
  }
}

/** Secondary rooms: drawn, labelled faintly, never listed or navigable. */
export interface SecondarySpace {
  id: string
  name: string
  floor: FloorId
  shape: MapShape
  label?: Pt
  labelSize?: number
  /** Important internal door openings, kept subtle on support rooms. */
  doorMarks?: Pt[]
  /** Kind of support space; drives the (very subtle) tint. */
  kind: 'service' | 'toilet' | 'core'
}

/** Open corridors and lobbies, drawn as light circulation floor. */
export interface CirculationArea {
  id: string
  floor: FloorId
  polys: Pt[][]
  label?: string
  labelAt?: Pt
  /** Doorways in the corridor's own walls, drawn like a room's. */
  doorMarks?: Pt[]
}

export interface FloorDefinition {
  id: FloorId
  name: string
  shortName: string
  level: string
  /** SVG viewBox width / height. */
  width: number
  height: number
  /** Outer building envelope, in SVG coordinates. */
  outline: Pt[]
  /** Additional outline rings (e.g. service projections). */
  extraOutlines?: Pt[][]
  /** Where a route starts on this floor. */
  routeOrigin: { node: string; point: Pt; label: string; sublabel: string }
  /** "You Are Here" marker (ground floor only). */
  youAreHere?: { point: Pt; label: string }
  /** Building entrances marked on the plan. */
  entrances?: { id: string; point: Pt; label: string; angle: number }[]
  /** Compass north direction, in degrees clockwise from "up". */
  northAngle: number
}

export interface CategoryMeta {
  id: CategoryId
  label: string
  fill: string
  stroke: string
  text: string
  legend: boolean
}
