/**
 * The dental treatment units.
 *
 * Every treatment bay in both clinics carries one, and nothing else
 * about the map may move because of it. These checks hold the count to
 * the bays the drawing actually has, keep every symbol inside the bay
 * it belongs to, prove none of them strays into a room the college
 * ruled out, and prove the clinics still carry the same shapes, the
 * same restrictions and the same routes they did.
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  BAY_FILL,
  DENTAL_UNITS,
  PG_UNITS,
  PG_UNIT_COLOUR,
  UC_UNITS,
  UC_UNIT_COLOUR,
  UNIT_OPACITY,
  WING_ANGLE,
} from '../src/maps/DentalUnit'
import { LOCATIONS, locationsOnFloor, secondaryOnFloor } from '../src/data/locations'
import {
  HOC_A,
  PG_ROWS,
  UC_BANKS,
  UC_BOTTOM,
  UC_ROWS,
  UC_TOP,
  pgTreatmentPolys,
  ucBankPolys,
} from '../src/data/ground'
import { boundsOf, g, w } from '../src/data/geometry'
import { buildJourney, routeTarget } from '../src/data/routes'
import type { Pt } from '../src/data/types'

const source = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')

/** The bays the drawing itself has, counted from the same data. */
const PG_EXPECTED = PG_ROWS.reduce((n, row, i) => n + row.a.filter((a) => !(i === 0 && a === HOC_A)).length, 0)
const UC_EXPECTED = UC_BANKS.reduce((n, b) => n + b.cols, 0) * UC_ROWS

const pointInPolygon = (p: Pt, poly: Pt[]): boolean => {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

describe('one unit in every treatment bay', () => {
  it('fills all 39 postgraduate treatment rooms', () => {
    expect(PG_EXPECTED).toBe(39)
    expect(PG_UNITS).toHaveLength(39)
    expect(pgTreatmentPolys).toHaveLength(39)
  })

  it('fills all 105 undergraduate chair cells', () => {
    expect(UC_EXPECTED).toBe(105)
    expect(UC_UNITS).toHaveLength(105)
  })

  it('comes to 144 units, and to nothing outside the two clinics', () => {
    expect(DENTAL_UNITS).toHaveLength(144)
    expect(new Set(DENTAL_UNITS.map((u) => u.locationId))).toEqual(
      new Set(['g-pg-clinic', 'g-uc-clinic']),
    )
    const drawing = LOCATIONS.filter((l) => DENTAL_UNITS.some((u) => u.locationId === l.id))
    expect(drawing.map((l) => l.id).sort()).toEqual(['g-pg-clinic', 'g-uc-clinic'])
  })

  it('gives every unit its own id', () => {
    expect(new Set(DENTAL_UNITS.map((u) => u.id)).size).toBe(144)
  })

  it('leaves the Head of Clinic Office bay empty', () => {
    expect(PG_UNITS.some((u) => u.id === `pg-r1-a${HOC_A}`)).toBe(false)
    // Its bay is a real space on the sheet; it simply carries no chair.
    expect(PG_ROWS[0].a).toContain(HOC_A)
  })
})

describe('every unit sits inside a real treatment bay', () => {
  it('centres each postgraduate unit on a drawn treatment room', () => {
    const centres = pgTreatmentPolys.map((poly) => {
      const b = boundsOf([poly])
      return [b.x + b.w / 2, b.y + b.h / 2] as Pt
    })
    for (const u of PG_UNITS) {
      const near = centres.some(([x, y]) => Math.hypot(x - u.centre[0], y - u.centre[1]) < 1.5)
      expect(near, `${u.id} is not on a drawn treatment bay`).toBe(true)
    }
    // One unit per bay, and no bay left out.
    expect(PG_UNITS).toHaveLength(centres.length)
  })

  it('puts each undergraduate unit inside a drawn chair bank', () => {
    for (const u of UC_UNITS) {
      const inside = ucBankPolys.some((poly) => pointInPolygon(u.centre, poly))
      expect(inside, `${u.id} is outside every bank`).toBe(true)
    }
  })

  it('never lets a unit stray into another room', () => {
    const others = [
      ...locationsOnFloor('ground')
        .filter((l) => l.id !== 'g-pg-clinic' && l.id !== 'g-uc-clinic')
        .map((l) => ({ id: l.id, polys: l.shape.polys })),
      ...secondaryOnFloor('ground').map((s) => ({ id: s.id, polys: s.shape.polys })),
    ]
    const strays: string[] = []
    for (const u of DENTAL_UNITS) {
      for (const other of others) {
        for (const poly of other.polys) {
          if (pointInPolygon(u.centre, poly)) strays.push(`${u.id} in ${other.id}`)
        }
      }
    }
    expect(strays).toEqual([])
  })

  it('takes 70 per cent of its own bay width, whatever that bay is', () => {
    expect(BAY_FILL).toBe(0.7)
    for (const u of DENTAL_UNITS) {
      expect(u.size.w / u.bay.w, u.id).toBeCloseTo(0.7, 6)
      expect(u.size.w, `${u.id} width`).toBeLessThan(u.bay.w)
      expect(u.size.h, `${u.id} height`).toBeLessThan(u.bay.h)
    }
  })

  it('scales the cut-back bay by the exit lobby to its own narrower width', () => {
    const narrow = PG_UNITS.find((u) => u.id === `pg-r1-a${PG_ROWS[0].a[0]}`)!
    expect(narrow.bay.w).toBeLessThan(57)
    expect(narrow.size.w).toBeCloseTo(narrow.bay.w * 0.7, 6)
    // Every other postgraduate bay is a full pitch wide.
    for (const u of PG_UNITS.filter((x) => x !== narrow)) expect(u.bay.w).toBe(57)
  })

  it('reads the bay sizes from the drawing, not from re-typed numbers', () => {
    const cellH = (UC_BOTTOM - UC_TOP) / UC_ROWS
    for (const u of UC_UNITS) expect(u.bay.h).toBeCloseTo(cellH, 6)
    const widths = new Set(UC_UNITS.map((u) => Math.round(u.bay.w * 100) / 100))
    const expected = new Set(
      UC_BANKS.map((b) => Math.round(((b.x1 - b.x0) / b.cols) * 100) / 100),
    )
    expect(widths).toEqual(expected)
  })
})

describe('orientation', () => {
  it('lays every postgraduate unit on the wing grid', () => {
    expect(WING_ANGLE).toBeCloseTo(-21.36, 1)
    for (const u of PG_UNITS) expect(u.rotate, u.id).toBe(WING_ANGLE)
  })

  it('never turns an undergraduate unit through a right angle', () => {
    for (const u of UC_UNITS) expect(u.rotate, u.id).toBe(0)
  })

  it('mirrors back-to-back postgraduate bands against each other', () => {
    for (let i = 0; i < PG_ROWS.length; i++) {
      const band = PG_UNITS.filter((u) => u.id.startsWith(`pg-r${i + 1}-`))
      expect(band.length, `band ${i + 1}`).toBeGreaterThan(0)
      expect(
        band.every((u) => u.mirrored === (i % 2 === 1)),
        `band ${i + 1} is not laid consistently`,
      ).toBe(true)
    }
    // Neighbouring bands always disagree, which is the point.
    for (let i = 1; i < PG_ROWS.length; i++) {
      const a = PG_UNITS.find((u) => u.id.startsWith(`pg-r${i}-`))!
      const b = PG_UNITS.find((u) => u.id.startsWith(`pg-r${i + 1}-`))!
      expect(a.mirrored).not.toBe(b.mirrored)
    }
  })

  it('mirrors the two columns of each undergraduate bank as a pair', () => {
    for (let b = 0; b < UC_BANKS.length; b++) {
      for (let r = 0; r < UC_ROWS; r++) {
        const first = UC_UNITS.find((u) => u.id === `uc-b${b}-c0-r${r}`)!
        expect(first.mirrored, `bank ${b} row ${r} column 0`).toBe(false)
        if (UC_BANKS[b].cols === 2) {
          const second = UC_UNITS.find((u) => u.id === `uc-b${b}-c1-r${r}`)!
          expect(second.mirrored, `bank ${b} row ${r} column 1`).toBe(true)
        }
      }
    }
  })
})

describe('the layer is decoration and nothing more', () => {
  const component = source('src/maps/DentalUnit.tsx')
  const map = source('src/components/FloorMap.tsx')

  it('takes no pointer events and is hidden from assistive technology', () => {
    expect(component).toContain('pointerEvents="none"')
    expect(component).toContain('aria-hidden="true"')
  })

  it('defines the artwork once and reuses it for all 144', () => {
    expect(component.match(/<symbol/g) ?? []).toHaveLength(1)
    expect(component.match(/<use\b/g) ?? []).toHaveLength(1)
    expect(component).toContain('href="#dental-unit"')
    expect(map.match(/<DentalUnitDefs \/>/g) ?? []).toHaveLength(1)
  })

  it('carries no text, no raster and no room geometry', () => {
    expect(component).not.toMatch(/<text|<image|<foreignObject/)
  })

  it('draws under the label, the doors, the pins and the route', () => {
    const furniture = map.indexOf('<DentalUnits locationId={loc.id} />')
    expect(furniture).toBeGreaterThan(map.indexOf('className="room__shape"'))
    expect(furniture).toBeGreaterThan(map.indexOf('className="map__divider"'))
    expect(furniture).toBeLessThan(map.indexOf('className="room__label"'))
    expect(furniture).toBeLessThan(map.indexOf('--- doorways'))
    expect(furniture).toBeLessThan(map.indexOf('className="map__route"'))
  })

  it('paints each clinic in its own zone colour at the agreed opacity', () => {
    expect(PG_UNIT_COLOUR).toBe('#234E70')
    expect(UC_UNIT_COLOUR).toBe('#168FB3')
    expect(UNIT_OPACITY).toBe(0.82)
  })

  it('stays off the first and second floors', () => {
    for (const floor of ['first', 'second'] as const) {
      const ids = new Set(locationsOnFloor(floor).map((l) => l.id))
      expect(DENTAL_UNITS.some((u) => ids.has(u.locationId))).toBe(false)
    }
  })
})

describe('nothing else about the clinics changed', () => {
  const uc = () => LOCATIONS.find((l) => l.id === 'g-uc-clinic')!
  const pg = () => LOCATIONS.find((l) => l.id === 'g-pg-clinic')!

  it('keeps every treatment bay and chair bank the plan already drew', () => {
    expect(pgTreatmentPolys).toHaveLength(39)
    expect(ucBankPolys).toHaveLength(UC_BANKS.length)
    expect(locationsOnFloor('ground').length).toBeGreaterThan(40)
  })

  it('leaves both clinics restricted, behind their own desks', () => {
    expect(routeTarget(uc()).id).toBe('g-uc-reception')
    expect(routeTarget(pg()).id).toBe('g-pc-reception')
  })

  it('leaves both clinic journeys ending where they did', () => {
    for (const target of [uc(), pg()]) {
      const journey = buildJourney(target)!
      const end = routeTarget(target)
      expect(journey.legs, target.id).toHaveLength(1)
      expect(journey.legs[0].route.end, target.id).toEqual(end.door)
    }
  })

  it('leaves the clinic shapes and labels untouched', () => {
    expect(pg().shape.polys).toBe(pgTreatmentPolys)
    expect(uc().shape.polys).toBe(ucBankPolys)
    expect(pg().label).toEqual(w(300, 269))
    expect(uc().label).toEqual(g(776, 1101))
    expect(pg().door).toEqual(w(497, 110))
  })

  it('keeps the removed undergraduate door mark out, and its route endpoint in', () => {
    expect(uc().door).toEqual(g(508, 1224))
    expect(uc().doorMarks).toBeUndefined()
  })
})
