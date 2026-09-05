import type { CategoryMeta, CategoryId, FloorDefinition, Location, Pt, ZoneToneId } from './types'
import { g, f1, f2, poly } from './geometry'

/* ------------------------------------------------------------------ */
/* Palette                                                             */
/* ------------------------------------------------------------------ */

export const PALETTE = {
  primary: '#087E92',
  primaryDark: '#075F70',
  primaryLight: '#DFF1F3',
  background: '#F4F8F9',
  corridor: '#FFFFFF',
  secondary: '#E5ECEE',
  route: '#E4761B',
  text: '#26414B',
  textMuted: '#5D7681',
}

/* ------------------------------------------------------------------ */
/* Clinical zone identity                                              */
/*                                                                     */
/* The two clinical teams wear different uniforms — navy in the        */
/* postgraduate clinic, marine blue in the undergraduate one — and the */
/* college asked the plan to carry the same identity. A tone sits over */
/* the category colours for the rooms that belong to a zone; the       */
/* category itself, and everything the room does, is unchanged.        */
/*                                                                     */
/* Border and pictogram take the uniform colour as given. Marine blue  */
/* is only a 3.3:1 contrast on its own tint, which large type just     */
/* clears but small labels do not, so the text darkens one step to     */
/* 5.1:1 and stays in the same hue.                                    */
/* ------------------------------------------------------------------ */

export interface ZoneTone {
  fill: string
  stroke: string
  /** The room pictogram, in the uniform colour. */
  icon: string
  /** The room name, darkened where the uniform colour would not carry it. */
  text: string
}

export const ZONE_TONES: Record<ZoneToneId, ZoneTone> = {
  pg: { fill: '#DCE7F4', stroke: '#234E70', icon: '#234E70', text: '#234E70' },
  'pg-soft': { fill: '#EBF1F8', stroke: '#7A99B7', icon: '#234E70', text: '#234E70' },
  uc: { fill: '#DDF4FA', stroke: '#168FB3', icon: '#168FB3', text: '#0F6E8A' },
  'uc-soft': { fill: '#EDF9FC', stroke: '#7FC4D7', icon: '#168FB3', text: '#0F6E8A' },
  // Vertical circulation, told apart from the rooms and from each
  // other. Names darken out of the border colour, which carries only
  // 4.2:1 and 3.3:1 on its own tint, to 7.7:1 and 6.4:1.
  lift: { fill: '#EEEAF8', stroke: '#7466A8', icon: '#7466A8', text: '#4A3F73' },
  stair: { fill: '#E3F2EC', stroke: '#4F8F78', icon: '#4F8F78', text: '#2F5D4C' },
}

/** The lifts and stairs, keyed together as one way of moving between floors. */
export const VERTICAL_ZONES: { tone: ZoneToneId; label: string }[] = [
  { tone: 'lift', label: 'Lifts' },
  { tone: 'stair', label: 'Stairs' },
]

/** The small key that tells the two clinics apart, beside the legend. */
export const CLINIC_ZONES: { tone: ZoneToneId; label: string }[] = [
  { tone: 'pg', label: 'Postgraduate Clinic' },
  { tone: 'uc', label: 'Undergraduate Clinic' },
]

/**
 * What a room is painted in: its zone tone where it has one, its
 * category otherwise. One lookup so the plan, the list, the search
 * results and the card never disagree.
 */
export function roomPaint(location: Pick<Location, 'category' | 'tone'>) {
  const cat = CATEGORIES[location.category]
  const zone = location.tone ? ZONE_TONES[location.tone] : null
  return {
    fill: zone ? zone.fill : cat.fill,
    stroke: zone ? zone.stroke : cat.stroke,
    icon: zone ? zone.icon : cat.text,
    text: zone ? zone.text : cat.text,
    label: cat.label,
  }
}

export const CATEGORIES: Record<CategoryId, CategoryMeta> = {
  clinical: {
    id: 'clinical',
    label: 'Clinical Services',
    fill: '#D6E6F4',
    stroke: '#8FB4D4',
    text: '#274860',
    legend: true,
  },
  learning: {
    id: 'learning',
    label: 'Learning Spaces',
    fill: '#CFE8EA',
    stroke: '#83B7BD',
    text: '#1F4E56',
    legend: true,
  },
  laboratory: {
    id: 'laboratory',
    label: 'Laboratories',
    fill: '#DCDDF2',
    stroke: '#A5A7D3',
    text: '#3A3B6B',
    legend: true,
  },
  food: {
    id: 'food',
    label: 'Food & Refreshments',
    fill: '#F7E2CB',
    stroke: '#DDB183',
    text: '#7A4E1E',
    legend: true,
  },
  administration: {
    id: 'administration',
    label: 'Administration',
    fill: '#DCE4EA',
    stroke: '#A2B3BF',
    text: '#33474F',
    legend: true,
  },
  reception: {
    id: 'reception',
    label: 'Reception & Information',
    fill: '#BFE3E8',
    stroke: '#6DAEB8',
    text: '#0C5561',
    legend: true,
  },
  circulation: {
    id: 'circulation',
    label: 'Corridors & Lobbies',
    fill: '#FFFFFF',
    stroke: '#D5E0E4',
    text: '#7A8F98',
    legend: false,
  },
  secondary: {
    id: 'secondary',
    label: 'Secondary Facilities',
    fill: PALETTE.secondary,
    stroke: '#CBD7DB',
    text: '#7A8F98',
    legend: true,
  },
}

/* ------------------------------------------------------------------ */
/* Outer building envelopes, traced from the as-built drawings         */
/* ------------------------------------------------------------------ */

/**
 * Ground floor. A dog-leg plan: an angled clinical wing to the
 * north-west, a narrower vertical connection down the middle, and a
 * long horizontal wing along the south.
 */
const GROUND_OUTLINE: Pt[] = poly(g, [
  [188, 528], //  north-west tip of the angled wing
  [1084, 178], //  north-east tip of the angled wing
  [1212, 505], //  east end wall of the wing
  [875, 636], //  south facade of the wing
  [901, 705], //  plant room projection
  [740, 768],
  [740, 1072], //  east wall of the central connection
  [1790, 1072], //  north wall of the long south wing
  [1790, 995], //  compressor room projection
  [1904, 995],
  [1904, 1492], //  east wall
  [184, 1492], //  south wall
  [184, 528], //  west wall
])

/** First floor: a single long horizontal bar over the south wing. */
const FIRST_OUTLINE: Pt[] = poly(f1, [
  [128, 963],
  [1955, 963],
  [1955, 1398],
  [128, 1398],
])

/** Second floor: same bar, with the eastern half left as open shell. */
const SECOND_OUTLINE: Pt[] = poly(f2, [
  [130, 1066],
  [1955, 1066],
  [1955, 1487],
  [130, 1487],
])

export const FLOORS: FloorDefinition[] = [
  {
    id: 'ground',
    name: 'Ground Floor',
    shortName: 'Ground',
    level: 'G',
    // Just wide enough for the car park and its access road. Held
    // under 2297 so a 1440-wide desktop is still height-limited and
    // the plan draws at exactly the size it did before the park.
    width: 2260,
    height: 1520,
    outline: GROUND_OUTLINE,
    northAngle: 21,
    routeOrigin: {
      node: 'ent_patient',
      point: g(196, 1140),
      label: 'Patient Entrance',
      sublabel: 'West side of the building',
    },
    youAreHere: { point: g(196, 1140), label: 'YOU ARE HERE' },
    entrances: [
      { id: 'patient', point: g(184, 1140), label: 'Patient Entrance', angle: -90 },
      { id: 'staff', point: g(1500, 1492), label: 'Student / Staff Entrance', angle: 0 },
    ],
  },
  {
    id: 'first',
    name: 'First Floor',
    shortName: 'First',
    level: '1',
    width: 1905,
    height: 632,
    outline: FIRST_OUTLINE,
    northAngle: 0,
    routeOrigin: {
      node: 'lift_lobby',
      point: f1(408, 1130),
      label: 'Lift Lobby (L1 & L2)',
      sublabel: 'Arrive here from the Ground Floor',
    },
  },
  {
    id: 'second',
    name: 'Second Floor',
    shortName: 'Second',
    level: '2',
    width: 1905,
    height: 632,
    outline: SECOND_OUTLINE,
    northAngle: 0,
    routeOrigin: {
      node: 'lift_lobby',
      point: f2(430, 1226),
      label: 'Lift Lobby (L1 & L2)',
      sublabel: 'Arrive here from the Ground Floor',
    },
  },
]

export const FLOOR_BY_ID = Object.fromEntries(FLOORS.map((f) => [f.id, f])) as Record<
  FloorDefinition['id'],
  FloorDefinition
>
