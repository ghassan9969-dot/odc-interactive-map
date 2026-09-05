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
    doorMarks: [f2(1111, 1170)],
    label: 'Administration Corridor',
    labelAt: f2(400, 1170),
  },
  {
    id: 's-circ-doctors',
    floor: F,
    polys: [rect(f2, 596, 1358, 1132, 1388)],
    doorMarks: [f2(1132, 1373)],
    label: "Doctors' Rooms Corridor",
    labelAt: f2(860, 1373),
  },
  { id: 's-circ-docn', floor: F, polys: [rect(f2, 613, 1252, 1052, 1280)] },
  {
    id: 's-circ-v1',
    floor: F,
    polys: [rect(f2, 405, 1190, 451, 1356)],
    doorMarks: [f2(428, 1190)],
  },
  // Entered through a double door at each end: from the administration
  // corridor at the top, and from the doctors' rooms corridor at the foot.
  {
    id: 's-circ-v2',
    floor: F,
    polys: [rect(f2, 580, 1190, 612, 1390)],
    doorMarks: [f2(596, 1190), f2(612, 1380)],
  },
  { id: 's-circ-sw', floor: F, polys: [rect(f2, 405, 1356, 452, 1478)] },
  { id: 's-circ-w', floor: F, polys: [rect(f2, 190, 1188, 208, 1352)] },
]

/* ------------------------------------------------------------------ */
/* Destinations                                                        */
/* ------------------------------------------------------------------ */

/**
 * Visitors are not admitted past the desk on this floor. Every
 * destination but the reception itself sends them there instead.
 */
const ADMIN_RESTRICTED = {
  title: 'Staff Area',
  message:
    'Visitors are received at the Administration Reception and escorted from there. Please report to the desk.',
  routeVia: 's-reception',
} as const

export const secondLocations: Location[] = [
  {
    id: 's-dean',
    name: 'Dean',
    shortName: 'Dean',
    floor: F,
    category: 'administration',
    description: "The Dean's office, at the west end of the administration corridor.",
    icon: 'admin',
    shape: { polys: [rect(f2, 190, 1075, 352, 1150)] },
    label: f2(271, 1112),
    labelSize: 18,
    doorMarks: [f2(330, 1150)],
    door: f2(330, 1152),
    entryNode: 'nc_330',
    keywords: ['dean', 'management', 'leadership'],
    primary: true,
    restricted: ADMIN_RESTRICTED,
  },

  {
    id: 's-fd',
    name: 'FD',
    shortName: 'FD',
    floor: F,
    category: 'administration',
    description: 'Administration office on the corridor, between the Dean and H/F/O.',
    icon: 'admin',
    shape: { polys: [rect(f2, 352, 1075, 438, 1150)] },
    label: f2(395, 1112),
    labelSize: 18,
    doorMarks: [f2(432, 1150)],
    door: f2(432, 1152),
    entryNode: 'nc_428',
    keywords: ['fd', 'office', 'administration'],
    primary: true,
    restricted: ADMIN_RESTRICTED,
  },

  {
    id: 's-hfo',
    name: 'Head of Finance & Operations',
    shortName: 'H/F/O',
    floor: F,
    category: 'administration',
    description: 'Office of the Head of Finance and Operations.',
    icon: 'finance',
    shape: { polys: [rect(f2, 440, 1075, 512, 1150)] },
    label: f2(476, 1112),
    labelSize: 15,
    doorMarks: [f2(476, 1150)],
    door: f2(476, 1152),
    entryNode: 'nc_476',
    keywords: [
      'h/f/o',
      'hfo',
      'head of finance and operations',
      'finance',
      'operations',
    ],
    primary: true,
    restricted: ADMIN_RESTRICTED,
  },

  {
    id: 's-executive-lounge',
    name: 'Executive Lounge',
    shortName: 'Executive Lounge',
    floor: F,
    category: 'administration',
    description: 'Lounge for senior staff and their guests.',
    icon: 'lounge',
    shape: { polys: [rect(f2, 652, 1075, 750, 1150)] },
    label: f2(701, 1112),
    labelSize: 15,
    doorMarks: [f2(711, 1150)],
    door: f2(711, 1152),
    entryNode: 'nc_701',
    keywords: ['executive lounge', 'lounge', 'senior staff', 'welfare'],
    primary: true,
    restricted: ADMIN_RESTRICTED,
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
    doorMarks: [f2(824, 1150)],
    door: f2(824, 1152),
    entryNode: 'nc_816',
    keywords: ['chief financial officer', 'finance', 'cfo'],
    primary: true,
    restricted: ADMIN_RESTRICTED,
  },

  {
    id: 's-auditor',
    name: 'Auditor',
    shortName: 'Auditor',
    floor: F,
    category: 'administration',
    description: "The college auditor's office.",
    icon: 'finance',
    shape: { polys: [rect(f2, 852, 1075, 914, 1150)] },
    label: f2(883, 1112),
    labelSize: 16,
    doorMarks: [f2(887, 1150)],
    door: f2(887, 1152),
    entryNode: 'nc_883',
    keywords: ['auditor', 'audit', 'accounts', 'finance'],
    primary: true,
    restricted: ADMIN_RESTRICTED,
  },

  {
    id: 's-reception',
    name: 'Administration Reception',
    shortName: 'Admin Reception',
    floor: F,
    category: 'reception',
    description: 'Reception desk for the administration floor, with waiting seating alongside.',
    icon: 'reception',
    shape: { polys: [rect(f2, 343, 1190, 405, 1300)] },
    label: f2(374, 1240),
    labelSize: 16,
    doorMarks: [f2(343, 1200), f2(405, 1220)],
    door: f2(405, 1220),
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
    shape: { polys: [rect(f2, 211, 1190, 337, 1300)] },
    label: f2(263, 1245),
    labelSize: 18,
    door: f2(263, 1188),
    entryNode: 'nc_263',
    keywords: ['waiting', 'seating'],
    primary: false,
    restricted: ADMIN_RESTRICTED,
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
    doorMarks: [f2(1036, 1190), f2(1040, 1250)],
    door: f2(1040, 1252),
    entryNode: 'dcn_1030',
    keywords: ['doctors', 'academic staff', 'faculty offices', 'consultants'],
    primary: true,
    restricted: ADMIN_RESTRICTED,
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
    restricted: ADMIN_RESTRICTED,
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
    restricted: ADMIN_RESTRICTED,
  },

  {
    id: 's-meeting-1',
    name: 'Meeting Room 1',
    shortName: 'Meeting Room 1',
    floor: F,
    category: 'administration',
    description: 'Meeting room off the doctors’ rooms corridor.',
    icon: 'meeting',
    shape: { polys: [rect(f2, 645, 1282, 714, 1356)] },
    label: f2(680, 1319),
    labelSize: 12,
    doorMarks: [f2(680, 1356)],
    door: f2(680, 1358),
    entryNode: 'dc_680',
    keywords: ['meeting', 'discussion room', 'conference', 'room 1'],
    primary: true,
    restricted: ADMIN_RESTRICTED,
  },

  {
    id: 's-meeting-2',
    name: 'Meeting Room 2',
    shortName: 'Meeting Room 2',
    floor: F,
    category: 'administration',
    description: 'Meeting room at the east end of the doctors’ rooms.',
    icon: 'meeting',
    shape: { polys: [rect(f2, 952, 1282, 1021, 1356)] },
    label: f2(986, 1319),
    labelSize: 12,
    doorMarks: [f2(986, 1356)],
    door: f2(986, 1358),
    entryNode: 'dc_986',
    keywords: ['meeting', 'discussion room', 'conference', 'room 2'],
    primary: true,
    restricted: ADMIN_RESTRICTED,
  },

  {
    id: 's-meeting-3',
    name: 'Meeting Room 3',
    shortName: 'Meeting Room 3',
    floor: F,
    category: 'administration',
    description: 'Small meeting room beside Student Affairs.',
    icon: 'meeting',
    shape: { polys: [rect(f2, 560, 1390, 612, 1424)] },
    label: f2(586, 1407),
    labelSize: 9,
    doorMarks: [f2(560, 1407)],
    door: f2(560, 1407),
    entryNode: 'sw_450',
    keywords: ['meeting', 'discussion room', 'conference', 'room 3'],
    primary: false,
    restricted: ADMIN_RESTRICTED,
  },

  {
    // Reached through Student Affairs, which is the room it belongs to.
    id: 's-head-sao',
    name: 'Head of Student Affairs',
    shortName: 'H/S/A',
    floor: F,
    category: 'administration',
    description: "The Head of Student Affairs' office, inside the Student Affairs suite.",
    icon: 'students',
    shape: { polys: [rect(f2, 560, 1428, 612, 1478)] },
    label: f2(586, 1453),
    labelSize: 11,
    doorMarks: [f2(560, 1453)],
    door: f2(560, 1453),
    entryNode: 'sw_450',
    keywords: ['h/s/a', 'hsa', 'head of student affairs', 'student affairs'],
    primary: false,
    restricted: ADMIN_RESTRICTED,
  },

  {
    id: 's-boardroom-vip',
    name: 'Boardrooms VIP',
    shortName: 'Boardrooms VIP',
    floor: F,
    category: 'administration',
    description: 'The VIP boardroom, at the west end of the floor.',
    icon: 'boardroom',
    shape: { polys: [rect(f2, 190, 1352, 246, 1478)] },
    label: f2(218, 1415),
    labelSize: 11,
    doorMarks: [f2(202, 1352)],
    door: f2(202, 1350),
    entryNode: 'wl_a',
    keywords: ['boardroom', 'vip', 'board', 'committee'],
    primary: true,
    restricted: ADMIN_RESTRICTED,
  },
  {
    id: 's-boardrooms',
    name: 'Boardrooms',
    shortName: 'Boardrooms',
    floor: F,
    category: 'administration',
    description: 'Formal boardrooms used for college committees and senior meetings.',
    icon: 'boardroom',
    shape: { polys: [rect(f2, 252, 1352, 405, 1478)] },
    label: f2(328, 1415),
    labelSize: 18,
    doorMarks: [f2(326, 1352), f2(405, 1420)],
    door: f2(405, 1420),
    entryNode: 'sw_450',
    keywords: ['boardroom', 'board', 'committee', 'conference'],
    primary: true,
    restricted: ADMIN_RESTRICTED,
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
    doorMarks: [f2(494, 1390)],
    door: f2(452, 1420),
    entryNode: 'sw_450',
    keywords: ['student affairs', 'records', 'registrar', 'welfare', 'enrolment'],
    primary: true,
    restricted: ADMIN_RESTRICTED,
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
    doorMarks: [f2(1056, 1338), f2(1113, 1338)],
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
    id: 's-s-office-n',
    name: '',
    floor: F,
    kind: 'core',
    shape: { polys: [rect(f2, 542, 1075, 612, 1150)] },
  },
  {
    id: 's-s-office-e',
    name: '',
    floor: F,
    kind: 'core',
    shape: { polys: [rect(f2, 916, 1075, 977, 1150)] },
  },
  {
    id: 's-s-server',
    name: '',
    floor: F,
    kind: 'core',
    shape: { polys: [rect(f2, 979, 1075, 1042, 1150)] },
  },
  {
    id: 's-s-electrical',
    name: '',
    floor: F,
    kind: 'core',
    shape: { polys: [rect(f2, 1046, 1075, 1111, 1150)] },
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
    id: 's-s-toilets-wm',
    name: 'Toilets M',
    floor: F,
    kind: 'toilet',
    shape: { polys: [rect(f2, 211, 1304, 259, 1350)] },
    doorMarks: [f2(242, 1304)],
    label: f2(235, 1327),
    labelSize: 11,
  },
  {
    id: 's-s-toilets-wf',
    name: 'Toilets F',
    floor: F,
    kind: 'toilet',
    shape: { polys: [rect(f2, 263, 1304, 310, 1350)] },
    doorMarks: [f2(299, 1304)],
    label: f2(287, 1327),
    labelSize: 11,
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
    id: 's-s-toilets-cm',
    name: 'Toilets M',
    floor: F,
    kind: 'toilet',
    shape: { polys: [rect(f2, 523, 1198, 578, 1250)] },
    doorMarks: [f2(578, 1238)],
    label: f2(551, 1224),
    labelSize: 11,
  },
  {
    // The accessible toilet is the strip at its head.
    id: 's-s-toilets-cf',
    name: 'Toilets F',
    floor: F,
    kind: 'toilet',
    shape: {
      polys: [rect(f2, 523, 1252, 578, 1350)],
      dividers: [[f2(523, 1280), f2(578, 1280)]],
    },
    doorMarks: [f2(578, 1312)],
    label: f2(551, 1318),
    labelSize: 11,
  },
  {
    id: 's-s-hvac',
    name: '',
    floor: F,
    kind: 'core',
    shape: { polys: [rect(f2, 1056, 1190, 1113, 1258)] },
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

const ncXs = [199, 263, 330, 396, 428, 476, 596, 701, 816, 883, 946, 1010, 1080]
const dcXs = [680, 832, 872, 986, 1084]

export const secondNodes: Record<string, Pt> = {
  ...Object.fromEntries(ncXs.map((x) => [`nc_${x}`, f2(x, 1170)])),
  ...Object.fromEntries(dcXs.map((x) => [`dc_${x}`, f2(x, 1373)])),
  dc_833b: f2(833, 1373),
  dc_596: f2(596, 1373),
  wl_a: f2(199, 1300),
  v1_n: f2(428, 1215),
  lift_lobby: f2(430, 1226),
  v1_s: f2(428, 1310),
  v1_b: f2(428, 1350),
  dcn_832: f2(832, 1266),
  dcn_1030: f2(1030, 1266),
  dcn_680: f2(680, 1266),
  v2_dn: f2(596, 1266),
  v2_n: f2(596, 1230),
  v2_m: f2(596, 1300),
  sw_450: f2(430, 1420),
}

const chain = (ids: string[]): [string, string][] =>
  ids.slice(0, -1).map((id, i) => [id, ids[i + 1]] as [string, string])

export const secondEdges: [string, string][] = [
  ...chain(ncXs.map((x) => `nc_${x}`)),
  ...chain([...dcXs].sort((a, b) => a - b).map((x) => `dc_${x}`)),
  ['dc_832', 'dc_833b'],
  ['dc_596', 'dc_680'],
  ['nc_199', 'wl_a'],
  ['nc_428', 'v1_n'],
  ['v1_n', 'lift_lobby'],
  ['v1_n', 'v1_s'],
  ['v1_s', 'v1_b'],
  ['v1_b', 'sw_450'],
  ['nc_596', 'v2_n'],
  ['v2_n', 'v2_dn'],
  ['v2_dn', 'v2_m'],
  ['v2_dn', 'dcn_680'],
  ['dcn_680', 'dcn_832'],
  ['dcn_832', 'dcn_1030'],
  ['v2_m', 'dc_596'],
]
