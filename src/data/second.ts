/**
 * Second floor — traced from OG-ODC-CVL-AB-ARCH-16-C.
 *
 * Only the western half of the floor plate is fitted out: senior
 * administration along the north, reception and lift core in the
 * middle, two long rows of doctors' rooms, boardrooms and Student
 * Affairs to the south. The eastern half is left as open shell and is
 * shown that way on the map.
 */

import type { CirculationArea, Location, SecondarySpace, Pt } from './types'
import { f2, rect } from './geometry'

const F = 'second' as const

const dividersX = (x0: number, y0: number, x1: number, y1: number, n: number): [Pt, Pt][] => {
  const out: [Pt, Pt][] = []
  for (let i = 1; i < n; i++) {
    const x = x0 + ((x1 - x0) * i) / n
    out.push([f2(x, y0), f2(x, y1)])
  }
  return out
}

/* ------------------------------------------------------------------ */
/* Circulation                                                         */
/* ------------------------------------------------------------------ */

export const secondCirculation: CirculationArea[] = [
  {
    id: 's-circ-n',
    floor: F,
    polys: [rect(f2, 190, 1153, 1111, 1188)],
    label: 'Administration Corridor',
    labelAt: f2(400, 1170),
  },
  {
    id: 's-circ-doctors',
    floor: F,
    polys: [rect(f2, 596, 1358, 1132, 1388)],
    label: "Doctors' Rooms Corridor",
    labelAt: f2(860, 1373),
  },
  { id: 's-circ-docn', floor: F, polys: [rect(f2, 613, 1252, 1052, 1280)] },
  { id: 's-circ-v1', floor: F, polys: [rect(f2, 405, 1190, 451, 1356)] },
  { id: 's-circ-v2', floor: F, polys: [rect(f2, 580, 1190, 612, 1478)] },
  { id: 's-circ-sw', floor: F, polys: [rect(f2, 352, 1356, 452, 1478)] },
  { id: 's-circ-lobbyw', floor: F, polys: [rect(f2, 190, 1352, 356, 1396)] },
]

/* ------------------------------------------------------------------ */
/* Destinations                                                        */
/* ------------------------------------------------------------------ */

export const secondLocations: Location[] = [
  {
    id: 's-director',
    name: 'Director',
    shortName: 'Director',
    floor: F,
    category: 'administration',
    description: "The Director's office, at the west end of the administration corridor.",
    icon: 'admin',
    shape: { polys: [rect(f2, 190, 1075, 280, 1150)] },
    label: f2(235, 1112),
    labelSize: 17,
    door: f2(235, 1152),
    entryNode: 'nc_235',
    keywords: ['director', 'management', 'leadership'],
    primary: true,
  },
  {
    id: 's-dean',
    name: 'Dean',
    shortName: 'Dean',
    floor: F,
    category: 'administration',
    description: "The Dean's office, with the secretary's office alongside.",
    icon: 'admin',
    shape: { polys: [rect(f2, 282, 1075, 438, 1150)], dividers: [[f2(352, 1075), f2(352, 1150)]] },
    label: f2(396, 1112),
    labelSize: 17,
    door: f2(396, 1152),
    entryNode: 'nc_396',
    keywords: ['dean', 'secretary', 'management'],
    primary: true,
  },
  {
    id: 's-vice-deans',
    name: 'Vice Deans',
    shortName: 'Vice Deans',
    floor: F,
    category: 'administration',
    description: 'Offices of the Vice Deans.',
    icon: 'admin',
    shape: { polys: [rect(f2, 440, 1075, 512, 1150), rect(f2, 542, 1075, 612, 1150)] },
    label: f2(476, 1112),
    labelSize: 15,
    door: f2(476, 1152),
    entryNode: 'nc_476',
    keywords: ['vice dean', 'deputy'],
    primary: true,
  },
  {
    id: 's-welfare',
    name: 'Welfare Office',
    shortName: 'Welfare',
    floor: F,
    category: 'administration',
    description: 'Staff and student welfare office.',
    icon: 'office',
    shape: { polys: [rect(f2, 652, 1075, 750, 1150)] },
    label: f2(701, 1112),
    labelSize: 16,
    door: f2(701, 1152),
    entryNode: 'nc_701',
    keywords: ['welfare', 'support'],
    primary: false,
  },
  {
    id: 's-cfo',
    name: 'CFO',
    shortName: 'CFO',
    floor: F,
    category: 'administration',
    description: 'Office of the Chief Financial Officer.',
    icon: 'finance',
    shape: { polys: [rect(f2, 783, 1075, 850, 1150)] },
    label: f2(816, 1112),
    labelSize: 17,
    door: f2(816, 1152),
    entryNode: 'nc_816',
    keywords: ['chief financial officer', 'finance', 'cfo'],
    primary: true,
  },
  {
    id: 's-accounts',
    name: 'Accounts',
    shortName: 'Accounts',
    floor: F,
    category: 'administration',
    description: 'Accounts office for fees, invoices and payments.',
    icon: 'finance',
    shape: { polys: [rect(f2, 852, 1075, 914, 1150)] },
    label: f2(883, 1112),
    labelSize: 16,
    door: f2(883, 1152),
    entryNode: 'nc_883',
    keywords: ['accounts', 'finance', 'fees', 'payments', 'billing'],
    primary: true,
  },
  {
    id: 's-office',
    name: 'Administration Office',
    shortName: 'Admin Office',
    floor: F,
    category: 'administration',
    description: 'General administration office for college paperwork and enquiries.',
    icon: 'office',
    shape: { polys: [rect(f2, 916, 1075, 977, 1150)] },
    label: f2(946, 1112),
    labelSize: 15,
    door: f2(946, 1152),
    entryNode: 'nc_946',
    keywords: ['administration', 'office', 'admin'],
    primary: true,
  },
  {
    id: 's-reception',
    name: 'Administration Reception',
    shortName: 'Admin Reception',
    floor: F,
    category: 'reception',
    description: 'Reception desk for the administration floor, with waiting seating alongside.',
    icon: 'reception',
    shape: { polys: [rect(f2, 343, 1190, 387, 1250)] },
    label: f2(365, 1220),
    labelSize: 15,
    door: f2(389, 1220),
    entryNode: 'v1_n',
    keywords: ['reception', 'waiting', 'enquiries', 'visitors'],
    primary: true,
  },
  {
    id: 's-waiting',
    name: 'Waiting Area',
    shortName: 'Waiting Area',
    floor: F,
    category: 'reception',
    description: 'Seating for visitors waiting to meet administration staff.',
    icon: 'waiting',
    shape: { polys: [rect(f2, 190, 1190, 337, 1300)] },
    label: f2(263, 1245),
    labelSize: 18,
    door: f2(263, 1188),
    entryNode: 'nc_263',
    keywords: ['waiting', 'seating'],
    primary: false,
  },
  {
    id: 's-doctors-north',
    name: "Doctors' Offices (North Row)",
    shortName: "Doctors' Offices",
    floor: F,
    category: 'administration',
    description: 'A row of individual offices for the college doctors and academic staff.',
    icon: 'doctor',
    shape: {
      polys: [rect(f2, 613, 1190, 1052, 1250)],
      dividers: dividersX(613, 1190, 1052, 1250, 13),
    },
    label: f2(832, 1220),
    labelSize: 18,
    door: f2(832, 1252),
    entryNode: 'dcn_832',
    keywords: ['doctors', 'academic staff', 'faculty offices', 'consultants'],
    primary: true,
  },
  {
    id: 's-doctors-south',
    name: "Doctors' Offices (South Row)",
    shortName: "Doctors' Offices",
    floor: F,
    category: 'administration',
    description: 'A second row of individual offices for the college doctors.',
    icon: 'doctor',
    shape: {
      polys: [rect(f2, 616, 1390, 1128, 1478)],
      dividers: dividersX(616, 1390, 1128, 1478, 14),
    },
    label: f2(872, 1434),
    labelSize: 18,
    door: f2(872, 1388),
    entryNode: 'dc_872',
    keywords: ['doctors', 'academic staff', 'faculty offices', 'consultants'],
    primary: true,
  },
  {
    id: 's-open-space',
    name: 'Open Space',
    shortName: 'Open Space',
    floor: F,
    category: 'administration',
    description: 'Shared open-plan working area between the two rows of doctors’ offices.',
    icon: 'office',
    shape: { polys: [rect(f2, 716, 1282, 950, 1356)] },
    label: f2(833, 1319),
    labelSize: 18,
    door: f2(833, 1358),
    entryNode: 'dc_833b',
    keywords: ['open plan', 'workspace', 'shared office'],
    primary: false,
  },
  {
    id: 's-meeting-rooms',
    name: 'Meeting Rooms',
    shortName: 'Meeting Rooms',
    floor: F,
    category: 'administration',
    description: 'Meeting rooms available for staff and departmental discussions.',
    icon: 'meeting',
    shape: {
      polys: [
        rect(f2, 645, 1282, 714, 1356),
        rect(f2, 952, 1282, 1021, 1356),
        rect(f2, 560, 1390, 612, 1424),
      ],
    },
    label: f2(680, 1319),
    labelSize: 16,
    door: f2(680, 1358),
    entryNode: 'dc_680',
    keywords: ['meeting', 'discussion room', 'conference'],
    primary: true,
  },
  {
    id: 's-boardrooms',
    name: 'Boardrooms',
    shortName: 'Boardrooms',
    floor: F,
    category: 'administration',
    description: 'Formal boardrooms used for college committees and senior meetings.',
    icon: 'boardroom',
    shape: { polys: [rect(f2, 190, 1390, 246, 1478), rect(f2, 252, 1390, 354, 1478)] },
    label: f2(303, 1434),
    labelSize: 18,
    door: f2(303, 1388),
    entryNode: 'sw_303',
    keywords: ['boardroom', 'board', 'committee', 'conference'],
    primary: true,
  },
  {
    id: 's-student-affairs',
    name: 'Student Affairs',
    shortName: 'Student Affairs',
    floor: F,
    category: 'administration',
    description: 'Support services for student records, welfare and college matters.',
    icon: 'students',
    shape: { polys: [rect(f2, 452, 1390, 558, 1478)] },
    label: f2(505, 1434),
    labelSize: 17,
    door: f2(452, 1420),
    entryNode: 'sw_450',
    keywords: ['student affairs', 'records', 'registrar', 'welfare', 'enrolment'],
    primary: true,
  },
  {
    id: 's-lift-12',
    name: 'Lifts L1 & L2',
    shortName: 'Lifts L1 / L2',
    floor: F,
    category: 'circulation',
    description: 'Passenger lifts down to the First Floor and the Ground Floor.',
    icon: 'lift',
    shape: {
      polys: [rect(f2, 453, 1198, 482, 1258)],
      dividers: [[f2(453, 1228), f2(482, 1228)]],
    },
    label: f2(468, 1228),
    labelSize: 10,
    door: f2(451, 1228),
    entryNode: 'lift_lobby',
    keywords: ['elevator', 'lift', 'l1', 'l2'],
    primary: false,
  },
  {
    id: 's-stair-01',
    name: 'Stair 01',
    shortName: 'Stair 01',
    floor: F,
    category: 'circulation',
    description: 'Staircase down to the First Floor and the Ground Floor.',
    icon: 'stairs',
    shape: { polys: [rect(f2, 453, 1264, 510, 1352)] },
    label: f2(481, 1308),
    labelSize: 15,
    door: f2(451, 1308),
    entryNode: 'v1_s',
    keywords: ['stairs', 'staircase'],
    primary: false,
  },
  {
    id: 's-stair-02',
    name: 'Stair 02',
    shortName: 'Stair 02',
    floor: F,
    category: 'circulation',
    description: 'Staircase at the east end of the fitted-out area.',
    icon: 'stairs',
    shape: { polys: [rect(f2, 1056, 1262, 1113, 1352)] },
    label: f2(1084, 1307),
    labelSize: 15,
    door: f2(1084, 1358),
    entryNode: 'dc_1084',
    keywords: ['stairs', 'staircase'],
    primary: false,
  },
]

/* ------------------------------------------------------------------ */
/* Secondary spaces                                                    */
/* ------------------------------------------------------------------ */

export const secondSecondary: SecondarySpace[] = [
  {
    id: 's-s-toilets-n',
    name: 'Toilets',
    floor: F,
    kind: 'toilet',
    shape: { polys: [rect(f2, 514, 1075, 540, 1150)] },
  },
  {
    id: 's-s-printing',
    name: 'Printing',
    floor: F,
    kind: 'service',
    shape: { polys: [rect(f2, 614, 1075, 650, 1150)] },
  },
  {
    id: 's-s-archive',
    name: '',
    floor: F,
    kind: 'service',
    shape: { polys: [rect(f2, 752, 1075, 781, 1150)] },
  },
  {
    id: 's-s-server',
    name: 'Server Room',
    floor: F,
    kind: 'core',
    shape: { polys: [rect(f2, 979, 1075, 1042, 1150)] },
    label: f2(1010, 1112),
    labelSize: 11,
  },
  {
    id: 's-s-electrical',
    name: 'Electrical',
    floor: F,
    kind: 'core',
    shape: { polys: [rect(f2, 1046, 1075, 1111, 1150)] },
    label: f2(1078, 1112),
    labelSize: 11,
  },
  {
    id: 's-s-toilets-w',
    name: 'Toilets',
    floor: F,
    kind: 'toilet',
    shape: { polys: [rect(f2, 190, 1304, 310, 1350)], dividers: [[f2(250, 1304), f2(250, 1350)]] },
    label: f2(250, 1327),
  },
  {
    id: 's-s-pantry',
    name: 'Pantry',
    floor: F,
    kind: 'service',
    shape: { polys: [rect(f2, 343, 1304, 387, 1350)] },
  },
  {
    id: 's-s-tech-avac',
    name: '',
    floor: F,
    kind: 'core',
    shape: { polys: [rect(f2, 486, 1190, 514, 1250)] },
  },
  {
    id: 's-s-toilets-c',
    name: 'Toilets',
    floor: F,
    kind: 'toilet',
    shape: {
      polys: [rect(f2, 523, 1198, 578, 1350)],
      dividers: [
        [f2(523, 1250), f2(578, 1250)],
        [f2(523, 1280), f2(578, 1280)],
      ],
    },
    label: f2(551, 1315),
    labelSize: 11,
  },
  {
    id: 's-s-hvac',
    name: 'Services',
    floor: F,
    kind: 'core',
    shape: { polys: [rect(f2, 1056, 1190, 1113, 1258)] },
    label: f2(1084, 1224),
    labelSize: 11,
  },
  {
    id: 's-s-head-sao',
    name: 'Head of Student Affairs',
    floor: F,
    kind: 'service',
    shape: { polys: [rect(f2, 560, 1428, 612, 1478)] },
  },
  // The east lift core sits in the unfitted eastern plate. It is drawn
  // because the drawing shows it, but it is not a visitor destination:
  // reaching it would mean walking across open shell, so it is neither
  // searchable, listed, nor routable.
  {
    id: 's-s-lift-34',
    name: 'Lifts L3 & L4',
    floor: F,
    kind: 'core',
    shape: {
      polys: [rect(f2, 1622, 1194, 1658, 1258)],
      dividers: [[f2(1622, 1226), f2(1658, 1226)]],
    },
    label: f2(1640, 1226),
    labelSize: 11,
  },
  {
    id: 's-s-stair-03',
    name: 'Stair 03',
    floor: F,
    kind: 'core',
    shape: { polys: [rect(f2, 1585, 1300, 1645, 1390)] },
    label: f2(1615, 1345),
    labelSize: 11,
  },
  {
    id: 's-s-east-tech',
    name: '',
    floor: F,
    kind: 'core',
    shape: { polys: [rect(f2, 1590, 1160, 1622, 1192)] },
  },
]

/* ------------------------------------------------------------------ */
/* The open eastern half — deliberately left empty                     */
/* ------------------------------------------------------------------ */

export const secondOpenShell = {
  poly: rect(f2, 1130, 1075, 1953, 1478),
  label: f2(1380, 1250),
  title: 'Open Area',
  subtitle: 'Space for future expansion',
  /** Structural column grid, the only thing drawn inside the shell. */
  columns: (() => {
    const pts: Pt[] = []
    for (let x = 1200; x <= 1930; x += 105) {
      for (const y of [1090, 1200, 1300, 1400, 1470]) pts.push(f2(x, y))
    }
    return pts
  })(),
}

/* ------------------------------------------------------------------ */
/* Corridor graph                                                      */
/* ------------------------------------------------------------------ */

const ncXs = [235, 263, 396, 428, 476, 596, 701, 816, 883, 946, 1010, 1080]
const dcXs = [680, 832, 872, 1084]

export const secondNodes: Record<string, Pt> = {
  ...Object.fromEntries(ncXs.map((x) => [`nc_${x}`, f2(x, 1170)])),
  ...Object.fromEntries(dcXs.map((x) => [`dc_${x}`, f2(x, 1373)])),
  dc_833b: f2(833, 1373),
  dc_596: f2(596, 1373),
  v1_n: f2(428, 1215),
  lift_lobby: f2(430, 1226),
  v1_s: f2(428, 1310),
  v1_b: f2(428, 1350),
  dcn_832: f2(832, 1266),
  dcn_680: f2(680, 1266),
  v2_dn: f2(596, 1266),
  v2_n: f2(596, 1230),
  v2_m: f2(596, 1300),
  v2_s: f2(596, 1440),
  sw_450: f2(430, 1420),
  sw_303: f2(303, 1370),
}

const chain = (ids: string[]): [string, string][] =>
  ids.slice(0, -1).map((id, i) => [id, ids[i + 1]] as [string, string])

export const secondEdges: [string, string][] = [
  ...chain(ncXs.map((x) => `nc_${x}`)),
  ...chain([...dcXs].sort((a, b) => a - b).map((x) => `dc_${x}`)),
  ['dc_832', 'dc_833b'],
  ['dc_596', 'dc_680'],
  ['nc_428', 'v1_n'],
  ['v1_n', 'lift_lobby'],
  ['v1_n', 'v1_s'],
  ['v1_s', 'v1_b'],
  ['v1_b', 'sw_450'],
  ['sw_450', 'sw_303'],
  ['nc_596', 'v2_n'],
  ['v2_n', 'v2_dn'],
  ['v2_dn', 'v2_m'],
  ['v2_dn', 'dcn_680'],
  ['dcn_680', 'dcn_832'],
  ['v2_m', 'dc_596'],
  ['dc_596', 'v2_s'],
]
