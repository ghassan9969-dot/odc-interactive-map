/**
 * Ground floor — traced from OG-ODC-CVL-AB-ARCH-16-A.
 *
 * Layout, reading the drawing:
 *  - an angled clinical wing across the north-west (Postgraduate Clinic)
 *  - a narrow services connection down the middle (imaging, side
 *    surgeries, CSSD)
 *  - a long horizontal wing along the south (Undergraduate Clinic,
 *    patient lobby, student amenities, canteen)
 *
 * Room positions come from the drawing's own text and cabinet tags:
 * every treatment space is marked `CABINETES 4X4` in the postgraduate
 * wing and `CABINETES 3X3` in the undergraduate clinic, which fixes the
 * bank spacing exactly. Where the college has confirmed a real-world
 * correction that contradicts the sheet, the correction wins and is
 * noted at the point it applies.
 */

import type { CirculationArea, Location, SecondarySpace, Pt } from './types'
import { g, rect, poly, w, wRect } from './geometry'

const F = 'ground' as const

/**
 * The car park, east of the building across a clear margin.
 *
 * Declared here rather than in the drawing so the plot, its gates and
 * the walk to it are all built from the same numbers.
 */
export const PARKING = {
  x0: 1946,
  y0: 550,
  x1: 2296,
  y1: 1468,
  /** Where a car turns in, near the top of the road side. */
  gateInY: 630,
  /** Where it leaves again, near the foot of the same side. */
  gateOutY: 1372,
  /** Centre of the access road running down the east side. */
  roadX: 2338,
} as const

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Grid of faint dividers inside an orthogonal block. */
const gridDividers = (
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  cols: number,
  rows: number,
): [Pt, Pt][] => {
  const out: [Pt, Pt][] = []
  for (let i = 1; i < cols; i++) {
    const x = x0 + ((x1 - x0) * i) / cols
    out.push([g(x, y0), g(x, y1)])
  }
  for (let j = 1; j < rows; j++) {
    const y = y0 + ((y1 - y0) * j) / rows
    out.push([g(x0, y), g(x1, y)])
  }
  return out
}

/* ---- Undergraduate clinic ------------------------------------------
 * The `CABINETES 3X3` tags sit in columns at drawing x = 532, 575 |
 * 646, 688 | 759, 801 | 872, 915 | 986 | 1090 | 1164, 1206 | 1277,
 * 1320 | 1393. Reading the gaps (43 inside a pair, ~71 between banks,
 * 104 across the core) gives the arrangement the college confirmed:
 * four paired banks, a single, the Stair 02 / Nurse Station core,
 * a single, two paired banks, and a final single beside the lockers.
 */
interface Bank {
  x0: number
  x1: number
  cols: 1 | 2
}

const UC_BANKS: Bank[] = [
  { x0: 510, x1: 596, cols: 2 },
  { x0: 624, x1: 710, cols: 2 },
  { x0: 737, x1: 823, cols: 2 },
  { x0: 850, x1: 936, cols: 2 },
  { x0: 964, x1: 1008, cols: 1 },
  /* central core: Stair 02, Nurse Station and services */
  { x0: 1068, x1: 1112, cols: 1 },
  { x0: 1142, x1: 1228, cols: 2 },
  { x0: 1255, x1: 1341, cols: 2 },
  { x0: 1371, x1: 1415, cols: 1 },
]

/** The core the two middle singles sit either side of. */
const UC_CORE = { x0: 1008, x1: 1068 }
const UC_TOP = 1123
const UC_BOTTOM = 1432
/** Seven rows of chairs, from the `3X3` tag rows in the drawing. */
const UC_ROWS = 7

/** Every bank as a polygon, used for drawing and for the access tests. */
export const ucBankPolys: Pt[][] = UC_BANKS.map((b) => rect(g, b.x0, UC_TOP, b.x1, UC_BOTTOM))

/**
 * The open aisles between neighbouring banks.
 *
 * Banks 4 and 5 are the two singles that flank the Stair 02 core, so
 * the space between them is the core itself and not an aisle.
 */
const UC_AISLES = UC_BANKS.slice(0, -1)
  .map((bank, i) => ({ i, x0: bank.x1, x1: UC_BANKS[i + 1].x0 }))
  .filter(({ x0 }) => x0 !== UC_CORE.x0)

/* ---- Postgraduate wing ---------------------------------------------
 * Projecting the 40 `CABINETES 4X4` tags into the wing's own frame
 * gives four bands of 11 / 10 / 10 / 9 treatment spaces at a pitch of
 * 57 units, with the PG Waiting Area filling the middle of bands two
 * and three and the CBCT room filling the middle of band four.
 */
const PG_HALF = 28.5

interface PgRow {
  b0: number
  b1: number
  a: number[]
}

const PG_ROWS: PgRow[] = [
  // Eleven spaces along the top row. The third from the west carries no
  // cabinet tag on the sheet — it is the Head of Clinic Office, and the
  // college's marked-up reference puts the office exactly there.
  { b0: 12, b1: 74, a: [175, 232, 288, 345, 402, 458, 519, 579, 636, 692, 749] },
  { b0: 118, b1: 178, a: [175, 231, 288, 345, 401, 579, 636, 692, 749, 805] },
  { b0: 187, b1: 247, a: [174, 231, 288, 344, 401, 579, 635, 692, 749, 805] },
  { b0: 291, b1: 351, a: [174, 231, 344, 401, 579, 635, 692, 748, 805] },
]

/** The Head of Clinic Office: third space from the western end, top row. */
const HOC_A = PG_ROWS[0].a[2]

/** The short unfitted run between the last treatment room and the toilets. */
const PG_TAIL = { a0: 777.5, a1: 826 }

/** West edge of the exit lobby at the head of the top row. */
const PG_EXIT = { a0: 150, a1: 172 }

/**
 * One treatment space. The first space of the top row is cut back to
 * its east half, because the exit lobby beside the laboratory takes
 * the rest of that bay.
 */
const pgUnit = (a: number, row: PgRow): Pt[] => {
  const west = row.b0 === PG_ROWS[0].b0 && a === PG_ROWS[0].a[0] ? PG_EXIT.a1 : a - PG_HALF
  return wRect(west, row.b0, a + PG_HALF, row.b1)
}

/** All 40 postgraduate spaces, less the one given over to the office. */
export const pgTreatmentPolys: Pt[][] = PG_ROWS.flatMap((row, i) =>
  row.a.filter((a) => !(i === 0 && a === HOC_A)).map((a) => pgUnit(a, row)),
)

/** Faint lines between the treatment spaces in one band. */
const pgRowDividers = (row: PgRow): [Pt, Pt][] =>
  row.a
    .slice(1)
    .filter((a, i) => a - row.a[i] < 70)
    .map((a): [Pt, Pt] => [w(a - PG_HALF, row.b0), w(a - PG_HALF, row.b1)])

/* ------------------------------------------------------------------ */
/* Circulation — drawn first, as the pale "floor" of the plan          */
/* ------------------------------------------------------------------ */

export const groundCirculation: CirculationArea[] = [
  /* --- Postgraduate wing ---------------------------------------- */
  { id: 'g-circ-wing-n', floor: F, polys: [wRect(135, 74, 975, 118)] },
  { id: 'g-circ-wing-s', floor: F, polys: [wRect(135, 247, 975, 291)] },
  { id: 'g-circ-wing-cross', floor: F, polys: [wRect(874, 12, 896, 351)] },
  // The way out to the north wall, in the first bay clear of the
  // laboratory. It runs a little past the corridor edge so the two
  // overlap rather than meeting on a line.
  { id: 'g-circ-wing-exit', floor: F, polys: [wRect(PG_EXIT.a0, 0, PG_EXIT.a1, 80)] },

  /* --- Postgraduate lobby, between the laboratory and the imaging
         column. The drawing labels this whole area "Circulation
         Postgraduat Clinic", with the PC Reception desk standing in
         it, so it is walkable floor rather than a corridor.
         Its north-east edge runs a little way into the wing so it
         overlaps the two corridor mouths instead of meeting them on a
         line, which would leave a seam a route could fall through. */
  {
    id: 'g-circ-pg',
    floor: F,
    polys: [poly(g, [[334, 512], [448, 803], [442, 806], [442, 1078], [334, 1078]])],
  },

  /* --- Patient lobby --------------------------------------------- */
  {
    id: 'g-circ-lobby',
    floor: F,
    // The lower band stops short of the reception desk, leaving the
    // aisle between the lobby and the desk open.
    polys: [rect(g, 188, 945, 442, 1120), rect(g, 188, 1120, 374, 1215)],
  },
  // The passage between the coffee shop and the PC Reception desk.
  { id: 'g-circ-pc', floor: F, polys: [rect(g, 302, 902, 330, 960)] },
  // Open floor between the west rooms and the lift core. The security
  // room that stood here has gone; the whole zone is circulation.
  { id: 'g-circ-westcore', floor: F, polys: [rect(g, 300, 1215, 402, 1432)] },
  // The corridor in front of the west prayer rooms and toilets, which
  // also gives Stair 01's bottom door floor to open onto.
  { id: 'g-circ-west-s', floor: F, polys: [rect(g, 190, 1424, 492, 1436)] },
  // The photocopy station shown on the sheet has gone; the space it
  // stood in is now open floor in front of the west amenity rooms.
  { id: 'g-circ-west-amenity', floor: F, polys: [rect(g, 300, 1215, 374, 1424)] },

  /* --- Imaging and sterile services column ----------------------- */
  { id: 'g-circ-cbct', floor: F, polys: [rect(g, 522, 840, 538, 1078)] },
  { id: 'g-circ-cssd', floor: F, polys: [rect(g, 636, 785, 653, 1078)] },
  // The narrow corridor the two OPG rooms face each other across.
  { id: 'g-circ-opg', floor: F, polys: [rect(g, 442, 910, 538, 938)] },

  /* --- Undergraduate clinic -------------------------------------- */
  {
    id: 'g-circ-main',
    floor: F,
    polys: [rect(g, 388, 1078, 1435, 1123)],
    label: 'Main Clinic Corridor',
    labelAt: g(1230, 1101),
  },
  {
    id: 'g-circ-south',
    floor: F,
    polys: [rect(g, 380, 1432, 1435, 1490)],
    label: 'Student / Staff Circulation',
    labelAt: g(760, 1462),
  },
  // Open aisles between the banks. Banks 4 and 5 have the core between
  // them rather than an aisle, so that gap is deliberately skipped.
  ...UC_AISLES.map(({ i, x0, x1 }) => ({
    id: `g-circ-uc-${i}`,
    floor: F,
    polys: [rect(g, x0, UC_TOP, x1, UC_BOTTOM)],
  })),
  // Either side of the UC Reception desk, so the way into the clinic is
  // open on both flanks and never blocked by the desk.
  {
    id: 'g-circ-uc-w',
    floor: F,
    polys: [rect(g, 492, UC_TOP, 510, UC_BOTTOM)],
  },
  // Between the reception desk and the lift core: the visitors' way
  // into the Undergraduate Clinic.
  { id: 'g-circ-uc-gate', floor: F, polys: [rect(g, 374, 1206, 510, 1242), rect(g, 374, 1120, 430, 1242)] },
  { id: 'g-circ-uc-e', floor: F, polys: [rect(g, 1415, UC_TOP, 1435, 1490)] },

  /* --- East core, lockers and student amenities ------------------ */
  // The corridor freed above the lowered lifts: the way into the LCR
  // and the staff common room.
  { id: 'g-circ-e-lcr', floor: F, polys: [rect(g, 1568, 1188, 1694, 1240)] },
  {
    id: 'g-circ-ss-lobby',
    floor: F,
    polys: [rect(g, 1435, 1420, 1660, 1490), rect(g, 1568, 1400, 1660, 1420)],
    label: 'Student / Staff Lobby',
    labelAt: g(1500, 1455),
  },
  { id: 'g-circ-e-cross', floor: F, polys: [rect(g, 1568, 1078, 1694, 1100)] },
  { id: 'g-circ-e-link', floor: F, polys: [rect(g, 1640, 1100, 1694, 1400)] },
  // The mixed common room is one large open student area; the walk to
  // the female common room crosses it, exactly as the plan intends.
  { id: 'g-circ-smcr', floor: F, polys: [rect(g, 1660, 1396, 1904, 1490)] },
  // Outside the building: the walk from the student / staff entrance
  // along the south side and up the east side to the car park gate.
  // The first leg overlaps the lobby inside so the two join up.
  {
    id: 'g-circ-park-road',
    floor: F,
    polys: [
      rect(g, 1544, 1450, 1596, 1560),
      rect(g, 1544, 1500, 2360, 1560),
      rect(g, 2316, 600, 2360, 1560),
    ],
  },
]

/* ------------------------------------------------------------------ */
/* Destinations                                                        */
/* ------------------------------------------------------------------ */

const UC_RESTRICTED = {
  title: 'Restricted Clinical Area',
  message:
    'Please check in at UC Reception. Protective clothing and staff permission are required before entering.',
  routeVia: 'g-uc-reception',
} as const

export const groundLocations: Location[] = [
  /* --- Entrances and exits --------------------------------------- */
  {
    id: 'g-entrance-patient',
    name: 'Patient Entrance',
    shortName: 'Patient Entrance',
    floor: F,
    category: 'reception',
    description: 'The main entrance for patients and visitors, on the west side of the building.',
    icon: 'entrance',
    shape: { polys: [rect(g, 180, 1112, 200, 1172)] },
    label: g(300, 1000),
    labelSize: 19,
    door: g(206, 1142),
    doorMarks: [g(200, 1142)],
    entryNode: 'ent_patient',
    keywords: ['main entrance', 'visitors', 'front door', 'west', 'way in'],
    primary: true,
  },
  {
    id: 'g-entrance-staff',
    name: 'Student / Staff Entrance',
    shortName: 'Student Entrance',
    floor: F,
    category: 'reception',
    description: 'Entrance used by students and college staff, on the south side of the building.',
    icon: 'entrance',
    shape: { polys: [rect(g, 1462, 1482, 1540, 1500)] },
    label: g(1501, 1556),
    labelSize: 18,
    door: g(1501, 1478),
    doorMarks: [g(1501, 1490)],
    entryNode: 'ent_staff',
    keywords: ['staff entrance', 'student entrance', 'south'],
    primary: true,
  },
  {
    id: 'g-exit-pg-west',
    name: 'Postgraduate Clinic Exit (West)',
    shortName: 'PG Exit West',
    floor: F,
    category: 'reception',
    description:
      'External exit on the north wall of the Postgraduate Clinic wing, at the western end of the top row beside the laboratory.',
    icon: 'entrance',
    shape: { polys: [wRect(153, 0, 169, 12)] },
    label: w(161, 44),
    labelSize: 12,
    door: w(161, 14),
    doorMarks: [w(161, 6)],
    entryNode: 'wing_w_exit',
    keywords: ['exit', 'fire exit', 'way out', 'west', 'north'],
    primary: false,
  },
  {
    id: 'g-exit-pg-east',
    name: 'Postgraduate Clinic Exit',
    shortName: 'PG Exit',
    floor: F,
    category: 'reception',
    description:
      'External exit on the north side of the Postgraduate Clinic wing, beside the toilets at its eastern end.',
    icon: 'entrance',
    shape: { polys: [wRect(874, 0, 896, 12)] },
    label: w(885, 38),
    labelSize: 12,
    door: w(885, 14),
    doorMarks: [w(885, 6)],
    entryNode: 'wing_ne_exit',
    keywords: ['exit', 'fire exit', 'way out', 'east'],
    primary: false,
  },

  /* --- Reception & information ----------------------------------- */
  {
    id: 'g-uc-reception',
    name: 'UC Reception',
    shortName: 'UC Reception',
    floor: F,
    category: 'reception',
    description:
      'Check-in desk for the Undergraduate Clinic. All clinic patients report here first.',
    icon: 'reception',
    // A slim upright desk, with the aisle open on both sides so the
    // clinic entrance behind it is never blocked.
    shape: { polys: [rect(g, 430, 1120, 492, 1206)] },
    label: g(461, 1163),
    labelSize: 12,
    door: g(461, 1118),
    doorMarks: [g(461, 1120), g(461, 1206)],
    entryNode: 'mc_uc',
    keywords: ['undergraduate clinic reception', 'check in', 'registration', 'clinic desk'],
    primary: true,
  },
  {
    id: 'g-pc-reception',
    name: 'PC Reception',
    shortName: 'PC Reception',
    floor: F,
    category: 'reception',
    description: 'Check-in desk for the Postgraduate Clinic, beside the patient lobby.',
    icon: 'reception',
    shape: { polys: [rect(g, 330, 916, 420, 982)] },
    label: g(375, 949),
    labelSize: 15,
    door: g(422, 949),
    doorMarks: [g(330, 949), g(420, 949)],
    entryNode: 'pg_2',
    keywords: ['postgraduate clinic reception', 'check in'],
    primary: true,
  },

  /* --- Clinical -------------------------------------------------- */
  {
    id: 'g-pg-clinic',
    name: 'Postgraduate Clinic',
    shortName: 'PG Clinic',
    floor: F,
    category: 'clinical',
    description:
      'Specialist treatment wing with 39 clinical treatment rooms, arranged in four rows around a central waiting area.',
    icon: 'clinic',
    shape: {
      polys: pgTreatmentPolys,
      dividers: PG_ROWS.flatMap(pgRowDividers),
    },
    // Kept in the corridor band so it never sits over the room grid.
    label: w(300, 269),
    labelSize: 24,
    door: w(497, 110),
    entryNode: 'wing_n_4',
    keywords: ['consultation rooms', 'postgraduate', 'specialist', 'pg clinic', 'dental'],
    primary: true,
  },
  {
    id: 'g-pg-hoc',
    name: 'Head of Clinic Office',
    shortName: 'HOC',
    floor: F,
    category: 'administration',
    description:
      'Office of the Head of the Postgraduate Clinic, third along the north row of the wing.',
    icon: 'office',
    shape: { polys: [pgUnit(HOC_A, PG_ROWS[0])] },
    label: w(HOC_A, 43),
    labelSize: 15,
    door: w(HOC_A, 76),
    doorMarks: [w(HOC_A, 74)],
    entryNode: 'wing_n_2',
    keywords: ['head of clinic', 'hoc', 'office', 'director'],
    primary: false,
  },
  {
    id: 'g-pg-waiting',
    name: 'Postgraduate Clinic Waiting Area',
    shortName: 'PG Waiting Area',
    floor: F,
    category: 'clinical',
    description: 'Seating for patients waiting to be seen in the Postgraduate Clinic.',
    icon: 'waiting',
    shape: { polys: [wRect(430, 112, 550, 250)] },
    label: w(490, 181),
    labelSize: 18,
    door: w(490, 110),
    entryNode: 'wing_n_4',
    keywords: ['waiting', 'seating'],
    primary: false,
  },
  {
    id: 'g-pg-cbct',
    name: 'CBCT (Postgraduate Clinic)',
    shortName: 'CBCT',
    floor: F,
    category: 'clinical',
    description:
      'Cone beam CT room serving the Postgraduate Clinic, opening onto the south wing corridor.',
    icon: 'scan',
    // One room: the sheet's X-ray and processing pair is a single
    // CBCT suite in the college's corrected layout.
    shape: { polys: [wRect(430, 291, 550, 351)] },
    label: w(490, 321),
    labelSize: 20,
    door: w(490, 289),
    doorMarks: [w(490, 291)],
    entryNode: 'wing_s_4',
    keywords: ['cone beam', 'ct', 'scan', 'imaging', '3d', 'x-ray', 'radiography'],
    primary: true,
  },
  {
    id: 'g-pg-surgery-1',
    name: 'Surgery Room 1',
    shortName: 'Surgery 1',
    floor: F,
    category: 'clinical',
    description: 'Surgery room at the eastern end of the Postgraduate Clinic wing.',
    icon: 'surgery',
    shape: { polys: [wRect(898, 12, 975, 118)] },
    label: w(936, 65),
    labelSize: 15,
    door: w(896, 65),
    entryNode: 'wing_x_n',
    keywords: ['surgery', 'operating', 'minor surgery'],
    primary: false,
  },
  {
    id: 'g-pg-surgery-2',
    name: 'Surgery Room 2',
    shortName: 'Surgery 2',
    floor: F,
    category: 'clinical',
    description: 'Second surgery room at the eastern end of the Postgraduate Clinic wing.',
    icon: 'surgery',
    shape: { polys: [wRect(898, 252, 975, 351)] },
    label: w(936, 302),
    labelSize: 15,
    door: w(896, 302),
    entryNode: 'wing_x_s',
    keywords: ['surgery', 'operating', 'minor surgery'],
    primary: false,
  },
  {
    id: 'g-pg-meeting-1',
    name: 'Meeting Room 1',
    shortName: 'M1',
    floor: F,
    category: 'administration',
    description: 'Meeting room at the eastern end of the Postgraduate Clinic wing.',
    icon: 'meeting',
    shape: { polys: [wRect(898, 126, 975, 192)] },
    label: w(936, 159),
    labelSize: 16,
    door: w(896, 159),
    entryNode: 'wing_x_m',
    keywords: ['meeting', 'seminar', 'm1'],
    primary: false,
  },
  {
    id: 'g-pg-meeting-2',
    name: 'Meeting Room 2',
    shortName: 'M2',
    floor: F,
    category: 'administration',
    description: 'Second meeting room at the eastern end of the Postgraduate Clinic wing.',
    icon: 'meeting',
    shape: { polys: [wRect(898, 196, 975, 248)] },
    label: w(936, 222),
    labelSize: 16,
    door: w(896, 222),
    entryNode: 'wing_x_m',
    keywords: ['meeting', 'seminar', 'm2'],
    primary: false,
  },
  {
    id: 'g-uc-clinic',
    name: 'Undergraduate Clinic',
    shortName: 'UG Clinic',
    floor: F,
    category: 'clinical',
    description:
      'The main clinical teaching and patient treatment area, with student chair banks either side of the central Stair 02 core.',
    icon: 'clinic',
    shape: {
      polys: ucBankPolys,
      dividers: UC_BANKS.flatMap((b) =>
        gridDividers(b.x0, UC_TOP, b.x1, UC_BOTTOM, b.cols, UC_ROWS),
      ),
    },
    // Sits in the corridor band above the banks so the chair grid and
    // the aisles between the banks stay readable.
    label: g(776, 1101),
    labelSize: 26,
    door: g(508, 1224),
    doorMarks: [g(508, 1224)],
    entryNode: 'uc_gate',
    keywords: ['undergraduate', 'student clinic', 'dental chairs', 'treatment', 'cabinets'],
    primary: true,
    restricted: UC_RESTRICTED,
  },
  {
    id: 'g-uc-nurse-1',
    name: 'Nurse Station 1',
    shortName: 'NS1',
    floor: F,
    category: 'clinical',
    description: 'Nursing station beside Stair 01, facing the Undergraduate Clinic.',
    icon: 'doctor',
    shape: { polys: [rect(g, 458, 1242, 492, 1394)] },
    label: g(475, 1318),
    labelSize: 14,
    door: g(494, 1345),
    entryNode: 'uc_e_s',
    keywords: ['nurse', 'nursing', 'station', 'ns1'],
    primary: false,
  },
  {
    id: 'g-uc-nurse-2',
    name: 'Nurse Station 2',
    shortName: 'NS2',
    floor: F,
    category: 'clinical',
    description: 'Nursing station in the centre of the Undergraduate Clinic, beside Stair 02.',
    icon: 'doctor',
    shape: { polys: [rect(g, UC_CORE.x0, UC_TOP, UC_CORE.x1, 1210)] },
    label: g(1038, 1166),
    labelSize: 13,
    door: g(1038, 1121),
    entryNode: 'mc_core',
    keywords: ['nurse', 'nursing', 'station', 'ns2'],
    primary: false,
  },
  {
    id: 'g-side-surgeries',
    name: 'Side Surgeries',
    shortName: 'Side Surgeries',
    floor: F,
    category: 'clinical',
    description: 'Side surgery rooms serving both clinics, off the imaging corridor.',
    icon: 'surgery',
    shape: {
      polys: [rect(g, 538, 840, 636, 1085)],
      dividers: gridDividers(538, 840, 636, 1085, 2, 5),
    },
    label: g(587, 962),
    labelSize: 18,
    door: g(536, 962),
    entryNode: 'cor_cbct_m',
    keywords: ['surgery', 'minor surgery', 'side surgery'],
    primary: false,
  },
  {
    id: 'g-opg-2',
    name: 'OPG 2',
    shortName: 'OPG 2',
    floor: F,
    category: 'clinical',
    description:
      'Panoramic dental X-ray room, on the north side of the short imaging corridor.',
    icon: 'xray',
    shape: { polys: [rect(g, 442, 840, 522, 910)] },
    label: g(482, 875),
    labelSize: 16,
    // Faces OPG 1 across the corridor.
    door: g(482, 912),
    doorMarks: [g(482, 910)],
    entryNode: 'opg_mid',
    keywords: ['opg', 'panoramic', 'x-ray', 'radiography', 'orthopantomogram'],
    primary: true,
  },
  {
    id: 'g-opg-1',
    name: 'OPG 1',
    shortName: 'OPG 1',
    floor: F,
    category: 'clinical',
    description:
      'Panoramic dental X-ray room, on the south side of the short imaging corridor.',
    icon: 'xray',
    shape: { polys: [rect(g, 442, 938, 522, 1006)] },
    label: g(482, 972),
    labelSize: 16,
    // Faces OPG 2 across the corridor.
    door: g(482, 936),
    doorMarks: [g(482, 938)],
    entryNode: 'opg_mid',
    keywords: ['opg', 'panoramic', 'x-ray', 'radiography', 'orthopantomogram'],
    primary: true,
  },
  {
    id: 'g-recovery',
    name: 'Recovery Room',
    shortName: 'RR',
    floor: F,
    category: 'clinical',
    description: 'Room where patients rest and are observed after treatment.',
    icon: 'waiting',
    shape: { polys: [rect(g, 442, 1006, 522, 1078)] },
    label: g(482, 1042),
    labelSize: 15,
    // Two doors: one to the postgraduate lobby on the left, one to the
    // imaging corridor on the right.
    door: g(524, 1042),
    doorMarks: [g(442, 1042), g(522, 1042)],
    entryNode: 'cor_cbct_s',
    keywords: ['recovery', 'rest', 'post treatment', 'rr'],
    primary: true,
  },
  {
    id: 'g-cssd',
    name: 'CSSD',
    shortName: 'CSSD',
    floor: F,
    category: 'clinical',
    description:
      'Central Sterile Services Department for cleaning and sterilising dental instruments.',
    icon: 'sterile',
    shape: {
      polys: [rect(g, 653, 785, 744, 1085)],
      dividers: [
        [g(653, 862), g(744, 862)],
        [g(653, 968), g(744, 968)],
        [g(653, 1042), g(744, 1042)],
      ],
    },
    label: g(699, 930),
    door: g(651, 1060),
    entryNode: 'cor_cssd_s',
    keywords: ['sterile', 'sterilisation', 'central sterile services', 'instruments'],
    primary: true,
  },
  {
    id: 'g-patient-waiting',
    name: 'Patient Waiting Area',
    shortName: 'Patient Waiting',
    floor: F,
    category: 'circulation',
    description:
      'The main patient lobby, with seating for 48 people between the Patient Entrance and the clinics.',
    icon: 'waiting',
    // One large open lobby, as drawn: the small rectangle previously
    // shown here was only a fraction of the real waiting area.
    shape: { polys: [rect(g, 208, 986, 326, 1212)] },
    label: g(267, 1099),
    labelSize: 17,
    door: g(267, 1214),
    entryNode: 'lob_a',
    keywords: ['waiting room', 'seats', 'lobby', '48 seats', 'patient lobby'],
    primary: true,
  },

  /* --- Food ------------------------------------------------------ */
  {
    id: 'g-coffee-shop',
    name: 'Coffee Shop',
    shortName: 'Coffee Shop',
    floor: F,
    category: 'food',
    description: 'A convenient place for visitors and students to enjoy refreshments.',
    icon: 'coffee',
    shape: { polys: [rect(g, 192, 838, 302, 942)] },
    label: g(247, 890),
    door: g(258, 944),
    entryNode: 'lob_n2',
    keywords: ['cafe', 'coffee', 'refreshments', 'drinks', 'snacks'],
    primary: true,
  },
  {
    id: 'g-canteen',
    name: 'Canteen / Restaurant',
    shortName: 'Canteen',
    floor: F,
    category: 'food',
    description: 'Main dining hall serving hot meals for students and staff.',
    icon: 'restaurant',
    shape: {
      polys: [rect(g, 1694, 1100, 1790, 1390)],
      dividers: [
        [g(1694, 1180), g(1790, 1180)],
        [g(1694, 1260), g(1790, 1260)],
        [g(1694, 1330), g(1790, 1330)],
      ],
    },
    label: g(1742, 1245),
    door: g(1692, 1300),
    entryNode: 'east_link_s',
    keywords: ['restaurant', 'food', 'dining', 'lunch', 'cafeteria'],
    primary: true,
  },

  /* --- Vertical circulation -------------------------------------- */
  {
    id: 'g-lift-12',
    name: 'Lifts L1 & L2',
    shortName: 'Lifts L1 / L2',
    floor: F,
    category: 'circulation',
    description: 'Passenger lifts to the First and Second Floors, beside the patient lobby.',
    icon: 'lift',
    shape: { polys: [rect(g, 402, 1242, 458, 1312)], dividers: [[g(402, 1277), g(458, 1277)]] },
    label: g(430, 1277),
    labelSize: 11,
    door: g(400, 1277),
    entryNode: 'core_w1',
    keywords: ['elevator', 'lift', 'l1', 'l2', 'upstairs', 'first floor', 'second floor'],
    primary: false,
  },
  {
    id: 'g-stair-01',
    name: 'Stair 01',
    shortName: 'Stair 01',
    floor: F,
    category: 'circulation',
    description: 'Main staircase to the First and Second Floors, beside the patient lobby.',
    icon: 'stairs',
    shape: { polys: [rect(g, 402, 1312, 458, 1394)] },
    label: g(430, 1353),
    labelSize: 15,
    // The bottom door, onto the strip that runs to the south circulation.
    door: g(430, 1396),
    doorMarks: [g(430, 1394)],
    entryNode: 'stair01_s',
    keywords: ['stairs', 'staircase', 'steps'],
    primary: false,
  },
  {
    id: 'g-lift-34',
    name: 'Lifts L3 & L4',
    shortName: 'Lifts L3 / L4',
    floor: F,
    category: 'circulation',
    description: 'Passenger lifts in the east core, above Stair 03.',
    icon: 'lift',
    shape: { polys: [rect(g, 1568, 1240, 1636, 1318)], dividers: [[g(1568, 1279), g(1636, 1279)]] },
    label: g(1602, 1279),
    labelSize: 11,
    door: g(1602, 1238),
    doorMarks: [g(1602, 1240)],
    entryNode: 'e_core_n',
    keywords: ['elevator', 'lift', 'l3', 'l4'],
    primary: false,
  },
  {
    id: 'g-stair-02',
    name: 'Stair 02',
    shortName: 'Stair 02',
    floor: F,
    category: 'circulation',
    description: 'Staircase in the centre of the Undergraduate Clinic wing.',
    icon: 'stairs',
    shape: { polys: [rect(g, UC_CORE.x0, 1330, UC_CORE.x1, UC_BOTTOM)] },
    label: g(1038, 1381),
    labelSize: 14,
    door: g(1038, 1434),
    entryNode: 'sc_core',
    keywords: ['stairs', 'staircase'],
    primary: false,
  },
  {
    id: 'g-stair-03',
    name: 'Stair 03',
    shortName: 'Stair 03',
    floor: F,
    category: 'circulation',
    description: 'Staircase in the east core, below the L3 and L4 lifts.',
    icon: 'stairs',
    shape: { polys: [rect(g, 1568, 1318, 1636, 1400)] },
    label: g(1602, 1359),
    labelSize: 15,
    // Door on the bottom side, onto the student and staff lobby.
    door: g(1602, 1402),
    doorMarks: [g(1602, 1400)],
    entryNode: 'e_stair_s',
    keywords: ['stairs', 'staircase'],
    primary: false,
  },

  /* --- Student & staff areas ------------------------------------- */
  {
    id: 'g-staff-common',
    name: 'Staff Common Room',
    shortName: 'Staff Common Room',
    floor: F,
    category: 'administration',
    description: 'Quiet common room for college staff, next to the canteen.',
    icon: 'lounge',
    shape: { polys: [rect(g, 1568, 1078, 1692, 1188)] },
    label: g(1630, 1133),
    labelSize: 13,
    door: g(1630, 1190),
    doorMarks: [g(1630, 1188)],
    entryNode: 'staff_door',
    keywords: ['staff room', 'common room'],
    primary: false,
  },
  {
    id: 'g-students-common',
    name: 'Students Mixed Common Room',
    shortName: 'SMCR',
    floor: F,
    category: 'learning',
    description:
      'The large shared student common room across the south-east of the building, opening onto the student and staff lobby.',
    icon: 'students',
    // Extends the whole way across the lower area to the female
    // students common room, as confirmed by the college.
    shape: { polys: [rect(g, 1660, 1396, 1904, 1490)] },
    label: g(1740, 1444),
    labelSize: 20,
    door: g(1658, 1444),
    entryNode: 'ss_lobby_e',
    keywords: ['common room', 'students', 'lounge', 'smcr', 'mixed'],
    primary: true,
  },
  {
    id: 'g-female-common',
    name: 'Female Students Common Room',
    shortName: 'FSCR',
    floor: F,
    category: 'learning',
    description: 'Common room for female students, opening onto the mixed common room.',
    icon: 'students',
    shape: { polys: [rect(g, 1816, 1300, 1904, 1392)] },
    label: g(1860, 1346),
    labelSize: 16,
    // Door on the bottom side, opening toward the mixed common room.
    door: g(1860, 1394),
    doorMarks: [g(1860, 1392)],
    entryNode: 'smcr_e',
    keywords: ['common room', 'female students', 'fscr', 'ladies'],
    primary: false,
  },
  {
    id: 'g-sac',
    name: 'Student Advisory Council',
    shortName: 'SAC',
    floor: F,
    category: 'administration',
    description: 'Office of the Student Advisory Council, off the student and staff lobby.',
    icon: 'meeting',
    shape: { polys: [rect(g, 1600, 1430, 1656, 1490)] },
    label: g(1628, 1460),
    labelSize: 14,
    door: g(1598, 1460),
    entryNode: 'ss_lobby_e',
    keywords: ['student advisory council', 'sac', 'activity room', 'student council'],
    primary: false,
  },
  {
    id: 'g-kids-play',
    name: 'Kids Play Room',
    shortName: 'Kids Play Room',
    floor: F,
    category: 'clinical',
    description: 'A supervised play room for children, off the patient lobby.',
    icon: 'play',
    shape: { polys: [rect(g, 190, 1218, 300, 1314)] },
    label: g(245, 1266),
    labelSize: 14,
    door: g(302, 1266),
    entryNode: 'core_w0',
    keywords: ['children', 'play', 'kids', 'play room'],
    primary: false,
  },
  {
    id: 'g-call-centre',
    name: 'Call Centre',
    shortName: 'Call Centre',
    floor: F,
    category: 'administration',
    description: 'Appointment booking call centre, behind the patient lobby.',
    icon: 'office',
    // Swapped with Office Services, as confirmed by the college.
    shape: { polys: [rect(g, 190, 1372, 300, 1422)] },
    label: g(245, 1397),
    labelSize: 12,
    door: g(302, 1397),
    entryNode: 'core_w2',
    keywords: ['call centre', 'call center', 'appointments', 'booking', 'telephone'],
    primary: false,
  },
  {
    id: 'g-office-services',
    name: 'Office Services',
    shortName: 'Office Services',
    floor: F,
    category: 'administration',
    description: 'Administrative office services, behind the patient lobby.',
    icon: 'admin',
    // Swapped with the Call Centre, as confirmed by the college.
    shape: { polys: [rect(g, 190, 1318, 300, 1368)] },
    label: g(245, 1343),
    labelSize: 12,
    door: g(302, 1343),
    entryNode: 'west_am',
    keywords: ['office services', 'admin', 'printing', 'photocopy'],
    primary: false,
  },

  /* --- Prayer rooms, west ---------------------------------------- */
  {
    id: 'g-prayer-w-f',
    name: "Women's Prayer Room",
    shortName: "Women's Prayer",
    floor: F,
    category: 'secondary',
    description: 'Prayer room for women, with its own toilets and ablution area.',
    icon: 'prayer',
    shape: { polys: [rect(g, 190, 1436, 300, 1488)] },
    label: g(245, 1462),
    labelSize: 12,
    door: g(245, 1434),
    doorMarks: [g(245, 1436)],
    entryNode: 'west_s_1',
    keywords: ['prayer', 'musalla', 'women', 'ladies', 'female', 'ablution'],
    primary: false,
  },
  {
    id: 'g-prayer-w-m',
    name: "Men's Prayer Room",
    shortName: "Men's Prayer",
    floor: F,
    category: 'secondary',
    description: 'Prayer room for men, with its own toilets and ablution area.',
    icon: 'prayer',
    shape: { polys: [rect(g, 304, 1436, 392, 1488)] },
    label: g(348, 1462),
    labelSize: 12,
    door: g(348, 1434),
    doorMarks: [g(348, 1436)],
    entryNode: 'west_s_2',
    keywords: ['prayer', 'musalla', 'men', 'male', 'ablution'],
    primary: false,
  },

  /* --- Lockers and prayer rooms, east ---------------------------- */
  {
    id: 'g-lcr',
    name: 'Lockers / Change Rooms',
    shortName: 'LCR',
    floor: F,
    category: 'secondary',
    description: 
      'Locker and changing rooms for students, entered from the corridor beside the lifts.',
    icon: 'store',
    // One room, not split by gender: the college confirmed the whole
    // block is a single locker and changing suite.
    shape: { polys: [rect(g, 1420, 1078, 1568, 1350)] },
    label: g(1494, 1214),
    labelSize: 12,
    door: g(1570, 1212),
    doorMarks: [g(1568, 1212)],
    entryNode: 'e_core_n',
    keywords: ['lockers', 'changing', 'change room', 'lcr', 'men', 'women'],
    primary: false,
  },
  {
    id: 'g-prayer-e-m',
    name: "Men's Prayer Room (East)",
    shortName: "Men's Prayer",
    floor: F,
    category: 'secondary',
    description: 'Prayer room for men in the east wing, off the student and staff lobby.',
    icon: 'prayer',
    shape: { polys: [rect(g, 1420, 1350, 1494, 1428)] },
    label: g(1457, 1389),
    labelSize: 12,
    door: g(1457, 1430),
    doorMarks: [g(1457, 1428)],
    entryNode: 'men_lobby',
    keywords: ['prayer', 'musalla', 'men', 'male', 'ablution'],
    primary: false,
  },

  /* --- Car park --------------------------------------------------- */
  // East of the building, across a clear margin. The walk ends at the
  // gate on its road side rather than somewhere in the middle of it.
  {
    id: 'g-parking',
    name: 'Oman Dental College Parking',
    shortName: 'Parking',
    floor: F,
    category: 'secondary',
    description:
      'Visitor parking located behind Oman Dental College, with clearly marked entrance and exit points.',
    icon: 'parking',
    mapLabel: 'Parking',
    shape: { polys: [rect(g, PARKING.x0, PARKING.y0, PARKING.x1, PARKING.y1)] },
    label: g(2121, 1000),
    labelSize: 40,
    door: g(PARKING.x1, PARKING.gateInY),
    entryNode: 'park_gate',
    routeNote: 'Follow the outdoor access path to the Parking Entrance.',
    keywords: ['parking', 'car park', 'cars', 'vehicle', 'park', 'carpark'],
    primary: true,
  },
]

/* ------------------------------------------------------------------ */
/* Secondary spaces — drawn, muted, never listed                       */
/*                                                                     */
/* Toilets keep a small label so visitors can find them. Technical and  */
/* back-of-house spaces carry no label at all: no name, no icon, no     */
/* card, no search entry and no route.                                 */
/* ------------------------------------------------------------------ */

/** A pale technical shape with nothing written on it. */
const technical = (id: string, polys: Pt[][]): SecondarySpace => ({
  id,
  name: '',
  floor: F,
  kind: 'core',
  shape: { polys },
})

export const groundSecondary: SecondarySpace[] = [
  /* --- Postgraduate wing ----------------------------------------- */
  {
    id: 'g-s-wing-toiletm',
    name: 'Toilets M',
    floor: F,
    kind: 'toilet',
    // The college confirmed the gender arrangement is the other way
    // round from the sheet: men upstream by the exit, women at the end.
    shape: { polys: [wRect(826, 12, 872, 74)] },
    label: w(849, 43),
    labelSize: 11,
  },
  {
    id: 'g-s-wing-toiletf',
    name: 'Toilets F',
    floor: F,
    kind: 'toilet',
    shape: { polys: [wRect(826, 291, 872, 351)] },
    label: w(849, 321),
    labelSize: 11,
  },
  technical('g-s-wing-store', [wRect(259.5, 291, 316.5, 351)]),
  technical('g-s-wing-tail', [wRect(PG_TAIL.a0, 12, PG_TAIL.a1, 74)]),
  technical('g-s-compressor', [wRect(412, 351, 600, 425)]),
  technical('g-s-photography', [wRect(325, 351, 402, 398)]),

  /* --- Laboratory ------------------------------------------------- */
  {
    id: 'g-s-lab',
    name: 'Dental Laboratory',
    floor: F,
    kind: 'service',
    shape: {
      // Its east wall stops clear of the wing, which the traced
      // outline overshot by enough to clip the first treatment room.
      polys: [poly(g, [[190, 528], [326, 474], [326, 836], [190, 836]])],
      dividers: [
        [g(190, 578), g(326, 578)],
        [g(190, 636), g(326, 636)],
        [g(190, 694), g(326, 694)],
        [g(190, 750), g(326, 750)],
        [g(190, 800), g(326, 800)],
        [g(262, 578), g(262, 802)],
      ],
    },
    label: g(262, 700),
    labelSize: 19,
  },
  technical('g-s-coffee-kitchen', [rect(g, 192, 806, 258, 836)]),

  /* --- West amenities -------------------------------------------- */

  /* --- Undergraduate clinic core --------------------------------- */
  technical('g-s-hvac', [rect(g, UC_CORE.x0, 1214, UC_CORE.x1, 1326)]),

  /* --- East core and lockers -------------------------------------- */
  {
    id: 'g-s-toilet-e-m',
    name: 'Toilets M',
    floor: F,
    kind: 'toilet',
    shape: { polys: [rect(g, 1494, 1350, 1568, 1428)] },
    label: g(1531, 1389),
    labelSize: 11,
    doorMarks: [g(1496, 1391)],
  },
  /* --- Canteen back of house -------------------------------------- */
  technical('g-s-canteen-kitchen', [rect(g, 1794, 1100, 1904, 1200)]),
  technical('g-s-lift5', [rect(g, 1818, 1206, 1862, 1250)]),
  technical('g-s-store-e', [rect(g, 1866, 1206, 1904, 1296)]),
  technical('g-s-janitor-e', [rect(g, 1818, 1254, 1862, 1296)]),
  // The compressor room above the canteen: a pale shape and nothing else.
  technical('g-s-compressor-room', [rect(g, 1792, 997, 1902, 1072)]),
]

/* ------------------------------------------------------------------ */
/* Corridor graph — routes are computed on these nodes only            */
/* ------------------------------------------------------------------ */

/** A node on the main clinic corridor, at the mouth of each aisle. */
const aisleNodes: Record<string, Pt> = {}
const aisleEdges: [string, string][] = []
UC_AISLES.forEach(({ i, x0, x1 }) => {
  const mid = (x0 + x1) / 2
  aisleNodes[`mc_a${i}`] = g(mid, 1100)
  aisleNodes[`sc_a${i}`] = g(mid, 1460)
  aisleEdges.push([`mc_a${i}`, `sc_a${i}`])
})

export const groundNodes: Record<string, Pt> = {
  /* Patient lobby */
  ent_patient: g(200, 1142),
  lob_a: g(262, 1142),
  lob_n1: g(262, 1040),
  lob_n2: g(262, 972),
  lob_e: g(392, 1040),

  /* Postgraduate lobby */
  pg_1: g(430, 1040),
  pg_2: g(430, 953),
  pg_3: g(430, 880),
  pg_4: g(414, 800),
  pg_5: g(388, 700),
  // Approached along the corridor axis, so the walk into the wing
  // never cuts diagonally across the treatment rows.
  pg_wn_out: w(128, 96),
  wing_w_n: w(150, 96),
  pg_ws_out: w(128, 269),
  wing_w_s: w(150, 269),

  /* Imaging and sterile corridors */
  cor_cbct_s: g(530, 1050),
  cor_cbct_m: g(530, 950),
  cor_cbct_n: g(530, 875),
  opg_mid: g(482, 924),
  opg_e: g(530, 924),
  cor_cssd_s: g(645, 1050),
  cor_cssd_m: g(645, 950),
  cor_cssd_n: g(647, 820),

  /* Main clinic corridor along the south wing */
  mc_w: g(400, 1100),
  mc_uc: g(457, 1100),
  mc_cbct: g(530, 1100),
  mc_1: g(606, 1100),
  mc_cssd: g(645, 1100),
  mc_core: g(1038, 1100),
  mc_e: g(1425, 1100),
  ...aisleNodes,

  /* West core and amenities */
  core_w0: g(337, 1160),
  core_w1: g(337, 1277),
  core_w2: g(337, 1340),
  west_am: g(302, 1340),
  west_s_mid: g(337, 1430),
  stair01_s: g(430, 1430),
  west_s_1: g(245, 1430),
  west_s_2: g(348, 1430),
  mc_uw: g(402, 1100),
  uc_w_a: g(402, 1163),
  uc_gate: g(402, 1224),
  mc_ue: g(501, 1100),
  uc_e_n: g(501, 1160),
  uc_e_s: g(501, 1345),

  /* Student / staff circulation */
  sc_w: g(424, 1460),
  sc_core: g(1038, 1460),
  sc_e: g(1425, 1460),

  /* East core */
  ss_lobby: g(1500, 1455),
  ss_lobby_e: g(1620, 1455),
  ent_staff: g(1500, 1480),
  e_stair_s: g(1602, 1412),
  men_lobby: g(1457, 1440),
  e_core_n: g(1600, 1214),
  e_link_n: g(1666, 1214),
  staff_door: g(1630, 1212),
  east_cross_w: g(1602, 1089),
  east_cross_m: g(1666, 1089),
  east_link_s: g(1666, 1300),
  east_link_b: g(1666, 1390),
  smcr_w: g(1700, 1444),
  smcr_e: g(1860, 1444),

  /* The outdoor walk to the car park, east of the building */
  park_road_n: g(1570, 1466),
  park_road_s: g(1570, 1530),
  park_road_e: g(2338, 1530),
  park_gate: g(2338, 630),

  /* Angled wing corridors */
  wing_w_exit: w(161, 44),
  wing_n_0: w(161, 96),
  wing_n_1: w(200, 96),
  wing_n_2: w(288, 96),
  wing_n_3: w(400, 96),
  wing_n_4: w(490, 96),
  wing_n_5: w(620, 96),
  wing_n_6: w(760, 96),
  wing_n_7: w(885, 96),
  wing_s_1: w(200, 269),
  wing_s_2: w(288, 269),
  wing_s_3: w(400, 269),
  wing_s_4: w(490, 269),
  wing_s_5: w(620, 269),
  wing_s_6: w(760, 269),
  wing_s_7: w(885, 269),
  wing_ne_exit: w(885, 20),
  wing_x_n: w(885, 65),
  wing_x_m: w(885, 190),
  wing_x_s: w(885, 302),
}

export const groundEdges: [string, string][] = [
  /* Patient lobby */
  ['ent_patient', 'lob_a'],
  ['lob_a', 'lob_n1'],
  ['lob_n1', 'lob_n2'],
  ['lob_n1', 'lob_e'],
  ['lob_e', 'pg_1'],
  ['lob_a', 'core_w0'],
  ['core_w0', 'core_w1'],
  ['core_w1', 'core_w2'],
  ['core_w2', 'west_am'],
  ['core_w2', 'west_s_mid'],
  ['west_s_mid', 'stair01_s'],
  ['west_s_mid', 'west_s_1'],
  ['stair01_s', 'west_s_2'],
  ['stair01_s', 'sc_w'],

  /* Postgraduate lobby up to the wing */
  ['pg_1', 'pg_2'],
  ['pg_2', 'pg_3'],
  ['pg_3', 'pg_4'],
  ['pg_4', 'pg_5'],
  ['pg_5', 'pg_wn_out'],
  ['pg_wn_out', 'wing_w_n'],
  ['pg_5', 'pg_ws_out'],
  ['pg_ws_out', 'wing_w_s'],
  ['wing_w_n', 'wing_n_0'],
  ['wing_n_0', 'wing_w_exit'],
  ['wing_n_0', 'wing_n_1'],
  ['wing_w_s', 'wing_s_1'],
  ['pg_1', 'mc_w'],

  /* Imaging and sterile corridors */
  ['cor_cbct_s', 'cor_cbct_m'],
  ['cor_cbct_m', 'cor_cbct_n'],
  ['cor_cbct_m', 'opg_e'],
  ['opg_e', 'opg_mid'],
  ['cor_cssd_s', 'cor_cssd_m'],
  ['cor_cssd_m', 'cor_cssd_n'],
  ['cor_cbct_s', 'mc_cbct'],
  ['cor_cssd_s', 'mc_cssd'],
  ['pg_3', 'cor_cssd_m'],

  /* Main clinic corridor */
  ['mc_w', 'mc_uc'],
  ['mc_uc', 'mc_cbct'],
  ['mc_cbct', 'mc_1'],
  ['mc_1', 'mc_cssd'],
  ['mc_cssd', 'mc_a0'],
  ['mc_a0', 'mc_a1'],
  ['mc_a1', 'mc_a2'],
  ['mc_a2', 'mc_a3'],
  ['mc_a3', 'mc_core'],
  ['mc_core', 'mc_a5'],
  ['mc_a5', 'mc_a6'],
  ['mc_a6', 'mc_a7'],
  ['mc_a7', 'mc_e'],
  ['mc_uc', 'mc_ue'],
  ['mc_ue', 'uc_e_n'],
  ['uc_e_n', 'uc_e_s'],
  ['mc_w', 'mc_uw'],
  ['mc_uw', 'uc_w_a'],
  ['uc_w_a', 'uc_gate'],

  /* Student / staff circulation, around the bottom of the clinic */
  ['sc_w', 'sc_a0'],
  ['sc_a0', 'sc_a1'],
  ['sc_a1', 'sc_a2'],
  ['sc_a2', 'sc_a3'],
  ['sc_a3', 'sc_core'],
  ['sc_core', 'sc_a5'],
  ['sc_a5', 'sc_a6'],
  ['sc_a6', 'sc_a7'],
  ['sc_a7', 'sc_e'],
  ['mc_e', 'sc_e'],
  ...aisleEdges,

  /* East core */
  ['sc_e', 'ss_lobby'],
  ['ss_lobby', 'ent_staff'],
  ['ss_lobby', 'park_road_n'],
  ['park_road_n', 'park_road_s'],
  ['park_road_s', 'park_road_e'],
  ['park_road_e', 'park_gate'],
  ['ss_lobby', 'ss_lobby_e'],
  ['ss_lobby', 'e_stair_s'],
  ['ss_lobby', 'men_lobby'],
  ['e_core_n', 'staff_door'],
  ['e_core_n', 'e_link_n'],
  ['e_link_n', 'east_cross_m'],
  ['east_cross_w', 'east_cross_m'],
  ['east_cross_m', 'east_link_s'],
  ['east_link_s', 'east_link_b'],
  ['east_link_b', 'ss_lobby_e'],
  ['ss_lobby_e', 'smcr_w'],
  ['smcr_w', 'smcr_e'],

  /* Angled wing corridors */
  ['wing_n_1', 'wing_n_2'],
  ['wing_n_2', 'wing_n_3'],
  ['wing_n_3', 'wing_n_4'],
  ['wing_n_4', 'wing_n_5'],
  ['wing_n_5', 'wing_n_6'],
  ['wing_n_6', 'wing_n_7'],
  ['wing_s_1', 'wing_s_2'],
  ['wing_s_2', 'wing_s_3'],
  ['wing_s_3', 'wing_s_4'],
  ['wing_s_4', 'wing_s_5'],
  ['wing_s_5', 'wing_s_6'],
  ['wing_s_6', 'wing_s_7'],
  ['wing_n_7', 'wing_x_n'],
  ['wing_x_n', 'wing_x_m'],
  ['wing_x_m', 'wing_x_s'],
  ['wing_x_s', 'wing_s_7'],
  ['wing_n_7', 'wing_ne_exit'],
]
