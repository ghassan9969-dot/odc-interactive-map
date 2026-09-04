/**
 * First floor — traced from OG-ODC-CVL-AB-ARCH-16-B.
 *
 * A single long horizontal bar. Reading west to east: library and
 * study spaces, classrooms and the west lift core, teaching
 * laboratories, research laboratories, the lecture room block flanked
 * by two student lounges, the east lift core, and finally the
 * simulation and prosthodontic laboratories.
 */

import type { CirculationArea, Location, SecondarySpace, Pt } from './types'
import { f1, poly, rect } from './geometry'

const F = 'first' as const

/** Inner face of the north wall. */
const NORTH = 975
/** Where the rooms begin, below the north corridor. */
const TOP = 1020
const BOT = 1350
const COR_Y = 1374

const dividersX = (x0: number, y0: number, x1: number, y1: number, n: number): [Pt, Pt][] => {
  const out: [Pt, Pt][] = []
  for (let i = 1; i < n; i++) {
    const x = x0 + ((x1 - x0) * i) / n
    out.push([f1(x, y0), f1(x, y1)])
  }
  return out
}
const dividersY = (x0: number, y0: number, x1: number, y1: number, n: number): [Pt, Pt][] => {
  const out: [Pt, Pt][] = []
  for (let j = 1; j < n; j++) {
    const y = y0 + ((y1 - y0) * j) / n
    out.push([f1(x0, y), f1(x1, y)])
  }
  return out
}

/* ------------------------------------------------------------------ */
/* Circulation                                                         */
/* ------------------------------------------------------------------ */

export const firstCirculation: CirculationArea[] = [
  {
    id: 'f-circ-main',
    floor: F,
    polys: [rect(f1, 336, 1348, 1701, 1396)],
    label: 'Main Corridor',
    labelAt: f1(900, 1374),
  },
  {
    id: 'f-circ-north',
    floor: F,
    polys: [rect(f1, 336, NORTH, 1701, 1022)],
    label: 'North Corridor',
    labelAt: f1(900, 998),
  },
  { id: 'f-circ-v1', floor: F, polys: [rect(f1, 338, NORTH, 412, BOT)] },
  { id: 'f-circ-v2', floor: F, polys: [rect(f1, 556, NORTH, 614, BOT)] },
  { id: 'f-circ-v4', floor: F, polys: [rect(f1, 1102, NORTH, 1130, BOT)] },
  // The strips either side of the lecture rooms are the students'
  // lobby now, not a room.
  {
    id: 'f-circ-lobby',
    floor: F,
    polys: [rect(f1, 1132, TOP, 1176, BOT), rect(f1, 1462, TOP, 1512, BOT)],
    label: 'Student Lobby',
    labelAt: f1(1154, 1160),
  },
  { id: 'f-circ-v5', floor: F, polys: [rect(f1, 1514, NORTH, 1527, BOT)] },
  { id: 'f-circ-v6', floor: F, polys: [rect(f1, 1673, NORTH, 1699, BOT)] },
  // Reaches 1586 so it meets f-circ-e2 rather than leaving a two-unit
  // gap the east-core routes had to jump. Found by the corridor tests.
  { id: 'f-circ-e1', floor: F, polys: [rect(f1, 1527, 1124, 1586, 1162)] },
  { id: 'f-circ-e2', floor: F, polys: [rect(f1, 1586, 1094, 1604, 1272)] },
]

/* ------------------------------------------------------------------ */
/* Destinations                                                        */
/* ------------------------------------------------------------------ */

export const firstLocations: Location[] = [
  {
    id: 'f-library',
    name: 'Library',
    shortName: 'Library',
    floor: F,
    category: 'learning',
    description: 'Study and academic resource space for students and faculty.',
    icon: 'library',
    shape: { polys: [rect(f1, 133, NORTH, 336, 1216)] },
    label: f1(234, 1095),
    labelSize: 24,
    // Two doorways onto the corridor, as marked on the plan.
    door: f1(338, 1120),
    doorMarks: [f1(336, 1015), f1(336, 1120)],
    entryNode: 'v1_c',
    keywords: ['books', 'study', 'reading', 'resources', 'librarian'],
    primary: true,
  },
  {
    id: 'f-multimedia',
    name: 'Multimedia Room',
    shortName: 'Multimedia Room',
    floor: F,
    category: 'learning',
    description: 'Computer and media room for coursework and digital learning.',
    icon: 'multimedia',
    shape: { polys: [rect(f1, 133, 1220, 336, 1386)] },
    label: f1(234, 1300),
    labelSize: 20,
    door: f1(338, 1285),
    doorMarks: [f1(336, 1285)],
    entryNode: 'v1_d',
    keywords: ['computers', 'media', 'it room', 'digital'],
    primary: true,
  },
  {
    id: 'f-classroom-05',
    name: 'Tutorial Room B',
    shortName: 'Tutorial Room B',
    floor: F,
    category: 'learning',
    description: 'Teaching classroom for small group and tutorial sessions.',
    icon: 'classroom',
    shape: { polys: [rect(f1, 414, TOP, 554, 1095)] },
    label: f1(484, 1035),
    labelSize: 19,
    door: f1(412, 1035),
    doorMarks: [f1(429, TOP)],
    entryNode: 'v1_b',
    keywords: ['tutorial', 'classroom', 'teaching', 'room b'],
    primary: true,
  },
  {
    id: 'f-classroom-06',
    name: 'Tutorial Room A',
    shortName: 'Tutorial Room A',
    floor: F,
    category: 'learning',
    description: 'Teaching classroom for small group and tutorial sessions.',
    icon: 'classroom',
    shape: { polys: [rect(f1, 414, 1272, 554, BOT)] },
    label: f1(484, 1311),
    labelSize: 19,
    door: f1(484, 1352),
    doorMarks: [f1(428, BOT)],
    entryNode: 'sc_484',
    keywords: ['tutorial', 'classroom', 'teaching', 'room a'],
    primary: true,
  },
  {
    id: 'f-classroom-04',
    name: 'Tutorial Room E',
    shortName: 'Tutorial Room E',
    floor: F,
    category: 'learning',
    description: 'Teaching classroom for small group and tutorial sessions.',
    icon: 'classroom',
    shape: { polys: [rect(f1, 616, TOP, 762, 1125)] },
    label: f1(689, 1050),
    labelSize: 19,
    door: f1(614, 1050),
    doorMarks: [f1(645, TOP)],
    entryNode: 'v2_b',
    keywords: ['tutorial', 'classroom', 'teaching', 'room e'],
    primary: true,
  },
  {
    id: 'f-classroom-03',
    name: 'Tutorial Room D',
    shortName: 'Tutorial Room D',
    floor: F,
    category: 'learning',
    description: 'Teaching classroom for small group and tutorial sessions.',
    icon: 'classroom',
    shape: { polys: [rect(f1, 616, 1128, 762, 1240)] },
    label: f1(689, 1184),
    labelSize: 19,
    door: f1(614, 1184),
    doorMarks: [f1(616, 1177)],
    entryNode: 'v2_a',
    keywords: ['tutorial', 'classroom', 'teaching', 'room d'],
    primary: true,
  },
  {
    id: 'f-classroom-02',
    name: 'Tutorial Room C',
    shortName: 'Tutorial Room C',
    floor: F,
    category: 'learning',
    description: 'Teaching classroom for small group and tutorial sessions.',
    icon: 'classroom',
    shape: { polys: [rect(f1, 616, 1246, 762, BOT)] },
    label: f1(689, 1298),
    labelSize: 19,
    door: f1(689, 1352),
    doorMarks: [f1(645, BOT)],
    entryNode: 'sc_689',
    keywords: ['tutorial', 'classroom', 'teaching', 'room c'],
    primary: true,
  },
  {
    id: 'f-oral-biology',
    name: 'Oral Biology Lab',
    shortName: 'Oral Biology Lab',
    floor: F,
    category: 'laboratory',
    description: 'Teaching laboratory for oral biology and microscopy practicals.',
    icon: 'lab',
    shape: {
      polys: [rect(f1, 765, TOP, 913, BOT)],
      dividers: [
        [f1(765, 1100), f1(913, 1100)],
        [f1(765, 1225), f1(913, 1225)],
        [f1(839, TOP), f1(839, BOT)],
      ],
    },
    label: f1(839, 1160),
    labelSize: 22,
    door: f1(839, 1352),
    doorMarks: [f1(830, BOT), f1(860, TOP)],
    entryNode: 'sc_839',
    keywords: ['biology', 'microscope', 'practical', 'science'],
    primary: true,
  },
  {
    id: 'f-research-hub',
    name: 'Research Hub',
    shortName: 'Research Hub',
    floor: F,
    category: 'laboratory',
    description: 'Shared workspace supporting research students and projects.',
    icon: 'research',
    shape: { polys: [rect(f1, 915, TOP, 1042, BOT)] },
    label: f1(978, 1185),
    labelSize: 18,
    // Entered off the north corridor along its head, as the sheet
    // draws it: the vertical corridor that used to run here is inside
    // the room now.
    door: f1(978, 1018),
    doorMarks: [f1(978, TOP)],
    entryNode: 'nc_978',
    keywords: ['research', 'hub', 'workspace'],
    primary: true,
  },
  {
    id: 'f-lecture-2',
    name: 'Lecture Room 2',
    shortName: 'Lecture Room 2',
    floor: F,
    category: 'learning',
    description: 'Tiered lecture room for whole-cohort teaching.',
    icon: 'lecture',
    shape: { polys: [rect(f1, 1178, TOP, 1316, 1178)] },
    label: f1(1247, 1090),
    labelSize: 17,
    door: f1(1247, 1018),
    doorMarks: [f1(1247, TOP)],
    entryNode: 'nc_1247',
    keywords: ['lecture', 'theatre', 'teaching', 'room 2'],
    primary: true,
  },
  {
    id: 'f-lecture-4',
    name: 'Lecture Room 4',
    shortName: 'Lecture Room 4',
    floor: F,
    category: 'learning',
    description: 'Tiered lecture room for whole-cohort teaching.',
    icon: 'lecture',
    shape: { polys: [rect(f1, 1320, TOP, 1459, 1178)] },
    label: f1(1390, 1090),
    labelSize: 17,
    door: f1(1390, 1018),
    doorMarks: [f1(1390, TOP)],
    entryNode: 'nc_1390',
    keywords: ['lecture', 'theatre', 'teaching', 'room 4'],
    primary: true,
  },
  {
    id: 'f-lecture-1',
    name: 'Lecture Room 1',
    shortName: 'Lecture Room 1',
    floor: F,
    category: 'learning',
    description: 'Tiered lecture room for whole-cohort teaching.',
    icon: 'lecture',
    shape: { polys: [rect(f1, 1178, 1182, 1316, BOT)] },
    label: f1(1247, 1268),
    labelSize: 17,
    door: f1(1247, 1352),
    doorMarks: [f1(1247, BOT)],
    entryNode: 'sc_1247',
    keywords: ['lecture', 'theatre', 'teaching', 'room 1'],
    primary: true,
  },
  {
    id: 'f-lecture-3',
    name: 'Lecture Room 3',
    shortName: 'Lecture Room 3',
    floor: F,
    category: 'learning',
    description: 'Tiered lecture room for whole-cohort teaching.',
    icon: 'lecture',
    shape: { polys: [rect(f1, 1320, 1182, 1459, BOT)] },
    label: f1(1390, 1268),
    labelSize: 17,
    door: f1(1390, 1352),
    doorMarks: [f1(1390, BOT)],
    entryNode: 'sc_1400',
    keywords: ['lecture', 'theatre', 'teaching', 'room 3'],
    primary: true,
  },
  {
    id: 'f-xray-training',
    name: 'X-Ray & CSSD Training',
    shortName: 'X-Ray Training',
    floor: F,
    category: 'learning',
    description: 'Training suite where students practise radiography and sterilisation.',
    icon: 'xray',
    shape: { polys: [rect(f1, 1529, TOP, 1671, 1090)] },
    doorMarks: [f1(1643, TOP)],
    label: f1(1600, 1032),
    labelSize: 16,
    door: f1(1564, 1032),
    entryNode: 'v5_c',
    keywords: ['x-ray', 'radiography', 'cssd', 'training'],
    primary: false,
  },
  {
    id: 'f-classroom-01',
    name: 'Tutorial Room F',
    shortName: 'Tutorial Room F',
    floor: F,
    category: 'learning',
    description: 'Teaching classroom for small group and tutorial sessions.',
    icon: 'classroom',
    shape: { polys: [rect(f1, 1529, 1276, 1671, BOT)] },
    doorMarks: [f1(1548, BOT)],
    label: f1(1600, 1313),
    labelSize: 19,
    door: f1(1600, 1352),
    entryNode: 'sc_1600',
    keywords: ['tutorial', 'classroom', 'teaching', 'room f'],
    primary: true,
  },
  {
    id: 'f-simulation',
    name: 'CSL',
    shortName: 'CSL',
    floor: F,
    category: 'learning',
    description:
      'Clinical Simulation Laboratory - ninety-six simulation units where students practise before treating patients.',
    icon: 'simulation',
    // Runs all the way down to the prosthodontic lab. Only the strip
    // above the plaster room stops short, at that room's north wall.
    shape: {
      polys: [
        poly(f1, [
          [1701, NORTH],
          [1953, NORTH],
          [1953, 1244],
          [1889, 1244],
          [1889, 1286],
          [1701, 1286],
        ]),
      ],
      dividers: [
        ...dividersX(1701, TOP, 1953, 1240, 5),
        ...dividersY(1701, TOP, 1953, 1240, 4),
      ],
    },
    label: f1(1827, 1105),
    labelSize: 34,
    doorMarks: [f1(1701, 1005), f1(1701, 1208)],
    door: f1(1701, 1208),
    entryNode: 'v6_c',
    keywords: ['csl', 'simulation room', 'phantom head', 'practice', 'skills lab'],
    primary: true,
  },
  {
    id: 'f-prosthodontic',
    name: 'Prosthodontic Lab',
    shortName: 'Prosthodontic Lab',
    floor: F,
    category: 'laboratory',
    description: 'Laboratory of thirty-six benches for making crowns, bridges and dentures.',
    icon: 'lab',
    shape: {
      polys: [rect(f1, 1701, 1286, 1885, 1386)],
      dividers: dividersX(1701, 1286, 1885, 1386, 4),
    },
    doorMarks: [f1(1862, 1286), f1(1701, 1361)],
    label: f1(1793, 1330),
    labelSize: 17,
    door: f1(1701, 1361),
    entryNode: 'sc_1686',
    keywords: ['prosthodontics', 'dentures', 'crowns', 'technician', 'lab'],
    primary: true,
  },
  {
    id: 'f-lift-12',
    name: 'Lifts L1 & L2',
    shortName: 'Lifts L1 / L2',
    floor: F,
    category: 'circulation',
    description: 'Passenger lifts down to the Ground Floor and up to the Second Floor.',
    icon: 'lift',
    shape: { polys: [rect(f1, 416, 1098, 486, 1170)], dividers: [[f1(416, 1134), f1(486, 1134)]] },
    label: f1(451, 1134),
    labelSize: 10,
    door: f1(414, 1130),
    entryNode: 'lift_lobby',
    keywords: ['elevator', 'lift', 'l1', 'l2'],
    primary: false,
  },
  {
    id: 'f-stair-01',
    name: 'Stair 01',
    shortName: 'Stair 01',
    floor: F,
    category: 'circulation',
    description: 'Staircase down to the Ground Floor and up to the Second Floor.',
    icon: 'stairs',
    shape: { polys: [rect(f1, 416, 1170, 486, 1265)] },
    label: f1(451, 1218),
    labelSize: 16,
    door: f1(414, 1218),
    doorMarks: [f1(416, 1232)],
    entryNode: 'v1_a',
    keywords: ['stairs', 'staircase'],
    primary: false,
  },
  {
    id: 'f-stair-02',
    name: 'Stair 02',
    shortName: 'Stair 02',
    floor: F,
    category: 'circulation',
    description: 'Central staircase serving the research and teaching laboratories.',
    icon: 'stairs',
    shape: { polys: [rect(f1, 1046, 1206, 1100, 1288)] },
    label: f1(1073, 1247),
    labelSize: 16,
    door: f1(1102, 1250),
    doorMarks: [f1(1100, 1250)],
    entryNode: 'v4_a',
    keywords: ['stairs', 'staircase'],
    primary: false,
  },
  {
    id: 'f-lift-34',
    name: 'Lifts L3 & L4',
    shortName: 'Lifts L3 / L4',
    floor: F,
    category: 'circulation',
    description: 'Passenger lifts at the east end of the building.',
    icon: 'lift',
    shape: {
      polys: [rect(f1, 1606, 1094, 1671, 1160)],
      dividers: [[f1(1606, 1127), f1(1671, 1127)]],
    },
    label: f1(1638, 1127),
    labelSize: 10,
    door: f1(1604, 1127),
    entryNode: 'east_lobby_n',
    keywords: ['elevator', 'lift', 'l3', 'l4'],
    primary: false,
  },
  {
    id: 'f-stair-03',
    name: 'Stair 03',
    shortName: 'Stair 03',
    floor: F,
    category: 'circulation',
    description: 'Staircase at the east end of the building.',
    icon: 'stairs',
    shape: { polys: [rect(f1, 1606, 1176, 1660, 1272)] },
    doorMarks: [f1(1660, 1258)],
    label: f1(1633, 1224),
    labelSize: 16,
    door: f1(1604, 1224),
    entryNode: 'east_lobby_s',
    keywords: ['stairs', 'staircase'],
    primary: false,
  },
]

/* ------------------------------------------------------------------ */
/* Secondary spaces                                                    */
/* ------------------------------------------------------------------ */

export const firstSecondary: SecondarySpace[] = [
  {
    id: 'f-s-toilets-w1',
    name: 'Toilets F',
    floor: F,
    kind: 'toilet',
    shape: { polys: [rect(f1, 486, 1098, 554, 1210)] },
    label: f1(520, 1154),
    doorMarks: [f1(554, 1128)],
  },
  {
    id: 'f-s-tech-w2',
    name: '',
    floor: F,
    kind: 'core',
    shape: { polys: [rect(f1, 500, 1214, 554, 1262)] },
  },
  {
    id: 'f-s-tech-n',
    name: '',
    floor: F,
    kind: 'core',
    shape: { polys: [rect(f1, 1046, TOP, 1100, 1090)] },
  },
  {
    id: 'f-s-hvac',
    name: 'Services',
    floor: F,
    kind: 'core',
    shape: { polys: [rect(f1, 1046, 1094, 1100, 1200)] },
  },
  {
    id: 'f-s-toilets-c',
    name: 'Toilets M',
    floor: F,
    kind: 'toilet',
    shape: { polys: [rect(f1, 1046, 1292, 1100, BOT)] },
    label: f1(1073, 1321),
    labelSize: 11,
  },
  {
    id: 'f-s-toilets-e1',
    name: 'Toilets F',
    floor: F,
    kind: 'toilet',
    shape: { polys: [rect(f1, 1529, 1094, 1584, 1160)] },
    doorMarks: [f1(1529, 1127)],
    labelSize: 12,
    label: f1(1556, 1127),
  },
  {
    id: 'f-s-tech-e',
    name: '',
    floor: F,
    kind: 'core',
    shape: { polys: [rect(f1, 1529, 1224, 1599, 1272)] },
  },
  {
    id: 'f-s-plaster',
    name: 'Plaster Room',
    floor: F,
    kind: 'service',
    shape: { polys: [rect(f1, 1889, 1244, 1953, 1386)] },
    doorMarks: [f1(1921, 1244)],
    label: f1(1921, 1315),
    labelSize: 12,
  },
]

/* ------------------------------------------------------------------ */
/* Corridor graph                                                      */
/* ------------------------------------------------------------------ */

/** Where the north corridor meets each vertical, plus the hub's door. */
const ncXs = [375, 585, 978, 1116, 1247, 1390, 1520, 1686]

const scXs = [
  375, 484, 585, 689, 790, 886, 978, 1026, 1116, 1154, 1247, 1400, 1487, 1520, 1600,
  1686, 839,
]

export const firstNodes: Record<string, Pt> = {
  ...Object.fromEntries(scXs.map((x) => [`sc_${x}`, f1(x, COR_Y)])),
  v1_a: f1(375, 1218),
  v1_d: f1(375, 1285),
  v1_b: f1(375, 1035),
  v1_c: f1(360, 1100),
  lift_lobby: f1(400, 1130),
  v2_a: f1(585, 1184),
  v2_b: f1(585, 1050),
  ...Object.fromEntries(ncXs.map((x) => [`nc_${x}`, f1(x, 998)])),
  v4_a: f1(1116, 1180),
  v4_b: f1(1116, 1030),
  v5_a: f1(1520, 1250),
  v5_b: f1(1520, 1143),
  v5_c: f1(1520, 1032),
  v6_a: f1(1686, 1250),
  v6_b: f1(1686, 1100),
  east_lobby_n: f1(1595, 1127),
  east_lobby_s: f1(1595, 1224),
  east_cross: f1(1556, 1143),
  v6_c: f1(1686, 1208),
}

const chain = (ids: string[]): [string, string][] =>
  ids.slice(0, -1).map((id, i) => [id, ids[i + 1]] as [string, string])

export const firstEdges: [string, string][] = [
  ...chain([...scXs].sort((a, b) => a - b).map((x) => `sc_${x}`)),
  ['sc_375', 'v1_a'],
  ['v1_a', 'v1_d'],
  ['v1_a', 'lift_lobby'],
  ['lift_lobby', 'v1_c'],
  ['v1_c', 'v1_b'],
  ['sc_585', 'v2_a'],
  ['v2_a', 'v2_b'],
  ...chain(ncXs.map((x) => `nc_${x}`)),
  ['nc_375', 'v1_b'],
  ['nc_585', 'v2_b'],
  ['nc_1116', 'v4_b'],
  ['nc_1520', 'v5_c'],
  ['nc_1686', 'v6_b'],
  ['sc_1116', 'v4_a'],
  ['v4_a', 'v4_b'],
  ['sc_1520', 'v5_a'],
  ['v5_a', 'v5_b'],
  ['v5_b', 'v5_c'],
  ['v5_b', 'east_cross'],
  ['east_cross', 'east_lobby_n'],
  ['east_lobby_n', 'east_lobby_s'],
  ['sc_1686', 'v6_a'],
  ['v6_a', 'v6_c'],
  ['v6_c', 'v6_b'],
]
