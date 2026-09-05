/**
 * The dental treatment unit seen from above — a prototype.
 *
 * The college's own floor plan draws a furniture symbol inside every
 * treatment bay: a reclining chair with its headrest and pedestal, the
 * delivery unit reaching over it, a worktop and the dentist's stool.
 * This is a simplified reading of that symbol, drawn once and reused.
 *
 * Every treatment bay in both clinics carries one: the 39 postgraduate
 * treatment rooms, and every chair cell in the undergraduate banks. The
 * excluded rooms — the Head of Clinic Office, the waiting area, CBCT,
 * the nurse stations, Stair 02 and its core — fall out of the geometry
 * on their own, because none of them is a bay in PG_ROWS or a cell of
 * a UC bank.
 *
 * The layer is decoration: it takes no pointer events and is hidden
 * from assistive technology, so selecting a bay behaves exactly as it
 * did before. Its geometry is derived from the same constants that
 * draw the bays, never re-typed, so a symbol cannot drift off its bay.
 */

import {
  HOC_A,
  PG_ROWS,
  UC_BANKS,
  UC_BOTTOM,
  UC_ROWS,
  UC_TOP,
  pgBayLocal,
  type PgRow,
} from '../data/ground'
import { g, w } from '../data/geometry'
import type { Pt } from '../data/types'

/** The symbol's own box. Everything below scales from it. */
const SYMBOL_W = 66
const SYMBOL_H = 64

/** How much of a bay's width one unit takes up. */
export const BAY_FILL = 0.7

/** Postgraduate navy and undergraduate marine, from the zone tones. */
export const PG_UNIT_COLOUR = '#234E70'
export const UC_UNIT_COLOUR = '#168FB3'
export const UNIT_OPACITY = 0.82

/**
 * The north-west wing is drawn on its own rotated grid, so a symbol in
 * a postgraduate bay has to lie on that grid too. The angle is measured
 * from the transform rather than repeated as a number of its own.
 */
const wingAngle = (): number => {
  const [x0, y0] = w(0, 0)
  const [x1, y1] = w(1, 0)
  return (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI
}

export const WING_ANGLE = wingAngle()

export interface DentalUnitPlacement {
  id: string
  /** The clinic whose room group draws it. */
  locationId: 'g-pg-clinic' | 'g-uc-clinic'
  /** Centre of the bay, in SVG coordinates. */
  centre: Pt
  /** The bay itself, for the size checks. */
  bay: { w: number; h: number }
  /** Rendered size of the symbol. */
  size: { w: number; h: number }
  /** Degrees, clockwise. Zero for the undergraduate banks. */
  rotate: number
  /** Laid the other way round, for the far half of a pair. */
  mirrored: boolean
}

/**
 * One postgraduate bay. Its rectangle comes from the drawing, so the
 * cut-back bay beside the exit lobby gets a symbol scaled to its own
 * narrower width rather than to the pitch of the row.
 */
const pgPlacement = (row: PgRow, rowIndex: number, a: number): DentalUnitPlacement => {
  const r = pgBayLocal(a, row)
  const bay = { w: r.a1 - r.a0, h: r.b1 - r.b0 }
  const width = bay.w * BAY_FILL
  return {
    id: `pg-r${rowIndex + 1}-a${a}`,
    locationId: 'g-pg-clinic',
    centre: w((r.a0 + r.a1) / 2, (r.b0 + r.b1) / 2),
    bay,
    size: { w: width, h: (width * SYMBOL_H) / SYMBOL_W },
    rotate: WING_ANGLE,
    // The four bands run back to back down the wing, so every other
    // one is laid the opposite way round.
    mirrored: rowIndex % 2 === 1,
  }
}

/** One undergraduate chair bay: a single cell of a bank's grid. */
const ucPlacement = (bankIndex: number, column: number, rowIndex: number): DentalUnitPlacement => {
  const bank = UC_BANKS[bankIndex]
  const cellW = (bank.x1 - bank.x0) / bank.cols
  const cellH = (UC_BOTTOM - UC_TOP) / UC_ROWS
  const width = cellW * BAY_FILL
  return {
    id: `uc-b${bankIndex}-c${column}-r${rowIndex}`,
    locationId: 'g-uc-clinic',
    centre: g(bank.x0 + cellW * (column + 0.5), UC_TOP + cellH * (rowIndex + 0.5)),
    bay: { w: cellW, h: cellH },
    size: { w: width, h: (width * SYMBOL_H) / SYMBOL_W },
    rotate: 0,
    // The two halves of a bank face their own aisle, so a pair of
    // neighbouring chairs is laid head to head.
    mirrored: column === 1,
  }
}

/**
 * Every treatment bay in the postgraduate wing.
 *
 * The same walk as the one that draws the bays themselves, so the two
 * cannot disagree: each band's marked spaces, less the one the Head of
 * Clinic Office occupies. The waiting area and CBCT never appear here
 * because the bands simply have no bay where they stand.
 */
export const PG_UNITS: DentalUnitPlacement[] = PG_ROWS.flatMap((row, i) =>
  row.a.filter((a) => !(i === 0 && a === HOC_A)).map((a) => pgPlacement(row, i, a)),
)

/**
 * Every chair cell in the undergraduate banks.
 *
 * The banks are the chairs; the reception, both nurse stations, Stair
 * 02 and the services beside it all sit in the core between banks four
 * and five, which is not a bank and so has no cells to fill.
 */
export const UC_UNITS: DentalUnitPlacement[] = UC_BANKS.flatMap((bank, b) =>
  Array.from({ length: bank.cols }, (_, c) =>
    Array.from({ length: UC_ROWS }, (_, r) => ucPlacement(b, c, r)),
  ).flat(),
)

export const DENTAL_UNITS: DentalUnitPlacement[] = [...PG_UNITS, ...UC_UNITS]

/** The one path definition every instance draws from. */
export function DentalUnitDefs() {
  return (
    <symbol id="dental-unit" viewBox={`0 0 ${SYMBOL_W} ${SYMBOL_H}`}>
      {/* Delivery unit. Lighter weight, so the chair stays the shape
          the eye lands on: a tray over the chest, one short elbowed
          arm and the articulated strut. */}
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.8}
      >
        <rect x="26" y="4" width="16" height="7" rx="2.5" />
        <path d="M42 7.5 H54 A3 3 0 0 1 57 10.5 V14" />
        <path d="M52 10 L45 16.5" />
      </g>

      {/* Chair: headrest, rectangular reclining backrest, parallel
          legrest with a well-rounded foot, and the pedestal base. */}
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="23" width="9" height="14" rx="4.5" />
        <path
          d="M19 15 H38 C42 15 44 19 44 24 H56 A6 6 0 0 1 56 36 H44
             C44 41 42 45 38 45 H19 A7 7 0 0 1 12 38 V22 A7 7 0 0 1 19 15 Z"
          fill="currentColor"
          fillOpacity={0.08}
        />
        <circle cx="28" cy="30" r="5.5" />
      </g>

      {/* Worktop and stool, close under the chair so the station reads
          as one piece of furniture rather than three marks. */}
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 51 H50" />
        <rect x="36" y="52" width="12" height="8" rx="3.5" />
      </g>
    </symbol>
  )
}

/**
 * Every sample unit belonging to one clinic.
 *
 * Drawn inside that clinic's own room group, above its fill and its
 * bay dividers but under the label, the doors, the pins and the route,
 * so nothing a visitor needs is ever covered by furniture.
 */
export function DentalUnits({ locationId }: { locationId: string }) {
  const units = DENTAL_UNITS.filter((u) => u.locationId === locationId)
  if (units.length === 0) return null

  const colour = locationId === 'g-pg-clinic' ? PG_UNIT_COLOUR : UC_UNIT_COLOUR

  return (
    <g
      className="map__furniture"
      pointerEvents="none"
      aria-hidden="true"
      color={colour}
      opacity={UNIT_OPACITY}
    >
      {units.map((u) => (
        <g
          key={u.id}
          transform={`translate(${u.centre[0].toFixed(2)} ${u.centre[1].toFixed(2)})${
            u.rotate ? ` rotate(${u.rotate.toFixed(3)})` : ''
          }${u.mirrored ? ' scale(-1 1)' : ''}`}
        >
          <use
            href="#dental-unit"
            x={-u.size.w / 2}
            y={-u.size.h / 2}
            width={u.size.w}
            height={u.size.h}
          />
        </g>
      ))}
    </g>
  )
}
