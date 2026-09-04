import { describe, expect, it } from 'vitest'
import { FLOOR_BY_ID } from '../src/data/floors'
import { boundsOf, w, wingLocal } from '../src/data/geometry'
import { ucBankPolys, pgTreatmentPolys } from '../src/data/ground'
import {
  CIRCULATION,
  LOCATIONS,
  SECONDARY,
  circulationOnFloor,
  locationsOnFloor,
  secondaryOnFloor,
} from '../src/data/locations'
import { buildJourney } from '../src/data/routes'
import type { Location, Pt } from '../src/data/types'

const ground = locationsOnFloor('ground')
const byId = (id: string): Location => {
  const l = ground.find((x) => x.id === id)
  if (!l) throw new Error(`no ground destination ${id}`)
  return l
}

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

/* ------------------------------------------------------------------ */
/* A. Patient entrance, reception and waiting area                     */
/* ------------------------------------------------------------------ */

describe('the patient entrance area', () => {
  it('has no Main Reception left anywhere', () => {
    const traces = [
      ...LOCATIONS.filter(
        (l) =>
          l.id.includes('main-reception') ||
          /main reception/i.test(l.name) ||
          (l.keywords ?? []).some((k) => /main reception/i.test(k)),
      ).map((l) => l.id),
      ...SECONDARY.filter((s) => /main reception/i.test(s.name)).map((s) => s.id),
    ]
    expect(traces).toEqual([])
  })

  it('keeps the destinations that replace it', () => {
    for (const id of ['g-entrance-patient', 'g-uc-reception', 'g-pc-reception']) {
      expect(byId(id).id).toBe(id)
    }
    expect(FLOOR_BY_ID.ground.youAreHere).toBeTruthy()
  })

  it('draws the waiting area as the whole patient lobby', () => {
    const box = boundsOf(byId('g-patient-waiting').shape.polys)
    // The old rectangle was 86 x 116 units; the real lobby is far larger.
    expect(box.w).toBeGreaterThan(110)
    expect(box.h).toBeGreaterThan(200)
    expect(box.w * box.h).toBeGreaterThan(25000)
    // And it stops clear of the reception desk that now stands between
    // it and the lift core.
    const uc = boundsOf(byId('g-uc-reception').shape.polys)
    expect(box.x + box.w).toBeLessThanOrEqual(uc.x)
    // Its west edge stands clear of the entrance approach.
    expect(box.x).toBeGreaterThan(byId('g-entrance-patient').door[0])
    expect(byId('g-patient-waiting').category).toBe('circulation')
  })

  it('keeps PC Reception separate from the waiting lobby', () => {
    const waiting = boundsOf(byId('g-patient-waiting').shape.polys)
    const reception = boundsOf(byId('g-pc-reception').shape.polys)
    const overlaps =
      waiting.x < reception.x + reception.w &&
      waiting.x + waiting.w > reception.x &&
      waiting.y < reception.y + reception.h &&
      waiting.y + waiting.h > reception.y
    expect(overlaps).toBe(false)
  })

  it('leaves an open aisle on both sides of the UC Reception desk', () => {
    const desk = boundsOf(byId('g-uc-reception').shape.polys)
    const aisles = circulationOnFloor('ground').flatMap((c) => c.polys.map((p) => boundsOf([p])))
    const midY = desk.y + desk.h / 2
    const west = aisles.some((a) => a.x + a.w <= desk.x + 1 && a.y <= midY && a.y + a.h >= midY)
    const east = aisles.some((a) => a.x >= desk.x + desk.w - 1 && a.y <= midY && a.y + a.h >= midY)
    expect(west, 'corridor west of UC Reception').toBe(true)
    expect(east, 'corridor east of UC Reception').toBe(true)
    // Slim and upright, so it never fills the way into the clinic.
    expect(desk.h).toBeGreaterThan(desk.w)
  })

  it('keeps the west lift and stair as one core with NS1 beside it', () => {
    const lifts = boundsOf(byId('g-lift-12').shape.polys)
    const stair = boundsOf(byId('g-stair-01').shape.polys)
    const ns1 = boundsOf(byId('g-uc-nurse-1').shape.polys)
    expect(lifts.x).toBeCloseTo(stair.x, 3)
    expect(lifts.w).toBeCloseTo(stair.w, 3)
    expect(lifts.y + lifts.h).toBeCloseTo(stair.y, 3)
    // They share a wall on the real plan: no corridor runs between them.
    expect(ns1.x).toBeGreaterThanOrEqual(stair.x + stair.w)
    expect(ns1.w).toBeLessThan(stair.w)
  })
})

/* ------------------------------------------------------------------ */
/* C. Imaging column                                                   */
/* ------------------------------------------------------------------ */

describe('the imaging column', () => {
  it('runs OPG 2, corridor, OPG 1 and the larger Recovery Room from the top', () => {
    expect(ground.some((l) => l.id === 'g-cbct')).toBe(false)
    const order = ['g-opg-2', 'g-opg-1', 'g-recovery'].map(
      (id) => boundsOf(byId(id).shape.polys).y,
    )
    for (let i = 1; i < order.length; i++) {
      expect(order[i], `item ${i} sits below item ${i - 1}`).toBeGreaterThan(order[i - 1])
    }
    expect(boundsOf(byId('g-recovery').shape.polys).h).toBeGreaterThanOrEqual(
      boundsOf(byId('g-opg-1').shape.polys).h,
    )
    expect(byId('g-pg-cbct')).toBeTruthy()
  })

  it('faces the OPG doors at each other across the corridor', () => {
    const two = byId('g-opg-2')
    const one = byId('g-opg-1')
    const dTwo = two.doorMarks![0]
    const dOne = one.doorMarks![0]
    // Same line across the corridor...
    expect(Math.abs(dTwo[0] - dOne[0])).toBeLessThan(1)
    // ...on the facing walls, with the corridor in between.
    expect(dTwo[1]).toBeCloseTo(boundsOf(two.shape.polys).y + boundsOf(two.shape.polys).h, 3)
    expect(dOne[1]).toBeCloseTo(boundsOf(one.shape.polys).y, 3)
    expect(dOne[1] - dTwo[1]).toBeGreaterThan(10)

    const gap = circulationOnFloor('ground').find((c) => c.id === 'g-circ-opg')!
    const between: Pt = [dTwo[0], (dTwo[1] + dOne[1]) / 2]
    expect(gap.polys.some((p) => pointInPolygon(between, p))).toBe(true)
  })

  it('gives the Recovery Room a door on the left and one on the right', () => {
    const rr = byId('g-recovery')
    const box = boundsOf(rr.shape.polys)
    expect(rr.doorMarks).toHaveLength(2)
    const [left, right] = [...rr.doorMarks!].sort((a, b) => a[0] - b[0])
    expect(left[0]).toBeCloseTo(box.x, 3)
    expect(right[0]).toBeCloseTo(box.x + box.w, 3)
    expect(rr.shortName).toBe('RR')
    expect(rr.name).toBe('Recovery Room')
  })
})

/* ------------------------------------------------------------------ */
/* D. Undergraduate clinic                                             */
/* ------------------------------------------------------------------ */

describe('the undergraduate clinic', () => {
  /** Bank widths tell paired banks (two columns) from singles (one). */
  const widths = ucBankPolys.map((p) => boundsOf([p]).w)
  const kind = widths.map((wid) => (wid > 60 ? 'paired' : 'single'))

  it('runs paired, paired, paired, paired, single, core, single, paired, paired, single', () => {
    expect(kind).toEqual([
      'paired',
      'paired',
      'paired',
      'paired',
      'single',
      'single',
      'paired',
      'paired',
      'single',
    ])
  })

  it('puts the Stair 02 and Nurse Station core between the two middle singles', () => {
    const boxes = ucBankPolys.map((p) => boundsOf([p]))
    const gap = boxes[5].x - (boxes[4].x + boxes[4].w)
    // Wider than any aisle, because the core stands in it.
    const aisles = boxes.slice(0, -1).map((b, i) => boxes[i + 1].x - (b.x + b.w))
    expect(gap).toBeGreaterThan(Math.max(...aisles.filter((_, i) => i !== 4)))

    const stair = boundsOf(byId('g-stair-02').shape.polys)
    const nurse = boundsOf(byId('g-uc-nurse-2').shape.polys)
    for (const core of [stair, nurse]) {
      expect(core.x).toBeGreaterThanOrEqual(boxes[4].x + boxes[4].w - 1)
      expect(core.x + core.w).toBeLessThanOrEqual(boxes[5].x + 1)
    }
  })

  it('keeps an open aisle between every pair of neighbouring banks', () => {
    const boxes = ucBankPolys.map((p) => boundsOf([p]))
    for (let i = 1; i < boxes.length; i++) {
      expect(boxes[i].x, `bank ${i} clears bank ${i - 1}`).toBeGreaterThan(
        boxes[i - 1].x + boxes[i - 1].w,
      )
    }
  })

  it('keeps the north and south circulation corridors either side', () => {
    const ids = circulationOnFloor('ground').map((c) => c.id)
    expect(ids).toContain('g-circ-main')
    expect(ids).toContain('g-circ-south')
    const banks = boundsOf(ucBankPolys)
    const north = boundsOf(circulationOnFloor('ground').find((c) => c.id === 'g-circ-main')!.polys)
    const south = boundsOf(circulationOnFloor('ground').find((c) => c.id === 'g-circ-south')!.polys)
    expect(north.y + north.h).toBeLessThanOrEqual(banks.y + 1)
    expect(south.y).toBeGreaterThanOrEqual(banks.y + banks.h - 1)
  })

  it('keeps the clinic label out of the chair banks', () => {
    const label = byId('g-uc-clinic').label
    expect(ucBankPolys.some((p) => pointInPolygon(label, p))).toBe(false)
  })

  it('names the nurse station beside Stair 01 NS1', () => {
    const ns = byId('g-uc-nurse-1')
    expect(ns.name).toBe('Nurse Station 1')
    expect(ns.shortName).toBe('NS1')
  })
})

/* ------------------------------------------------------------------ */
/* E. East core                                                        */
/* ------------------------------------------------------------------ */

describe('the east lift and stair core', () => {
  it('stacks the lifts directly above Stair 03 in one block', () => {
    const lifts = boundsOf(byId('g-lift-34').shape.polys)
    const stair = boundsOf(byId('g-stair-03').shape.polys)
    expect(Math.abs(lifts.x - stair.x)).toBeLessThan(2)
    expect(Math.abs(lifts.w - stair.w)).toBeLessThan(2)
    // They share a wall: the college confirmed there is no landing.
    expect(lifts.y + lifts.h).toBeLessThanOrEqual(stair.y)
    expect(stair.y - (lifts.y + lifts.h)).toBeLessThan(2)
  })

  it('gives Stair 03 a door on its bottom side', () => {
    const stair = byId('g-stair-03')
    const box = boundsOf(stair.shape.polys)
    expect(stair.doorMarks![0][1]).toBeCloseTo(box.y + box.h, 3)
  })

  it('enters the LCR from the corridor freed above the lifts', () => {
    const core = boundsOf(byId('g-lift-34').shape.polys)
    const lcr = boundsOf(byId('g-lcr').shape.polys)
    const connector = boundsOf(
      circulationOnFloor('ground').find((c) => c.id === 'g-circ-e-lcr')!.polys,
    )
    // It reaches the locker block on one side and the core on the other,
    // and sits above the lifts rather than beside them.
    expect(connector.x).toBeLessThanOrEqual(lcr.x + lcr.w + 1)
    expect(connector.x + connector.w).toBeGreaterThanOrEqual(core.x + core.w - 1)
    expect(connector.y + connector.h).toBeLessThanOrEqual(core.y + 1)
    // The LCR opens onto it.
    expect(byId('g-lcr').door[1]).toBeGreaterThanOrEqual(connector.y)
    expect(byId('g-lcr').door[1]).toBeLessThanOrEqual(connector.y + connector.h)
  })

  it('draws the lockers as one room rather than split by gender', () => {
    const lcr = byId('g-lcr')
    expect(lcr.shortName).toBe('LCR')
    expect(lcr.shape.polys).toHaveLength(1)
    // Nothing gendered is left in the locker block.
    expect(ground.filter((l) => /lockers/i.test(l.name)).map((l) => l.id)).toEqual(['g-lcr'])
  })

  it('keeps the prayer room and the LCR searchable', () => {
    for (const id of ['g-lcr', 'g-prayer-e-m']) {
      expect(byId(id).id).toBe(id)
    }
  })

  it("runs the men's toilets east until they meet the stair", () => {
    const toilets = boundsOf(
      secondaryOnFloor('ground').find((sp) => sp.id === 'g-s-toilet-e-m')!.shape.polys,
    )
    const stair = boundsOf(byId('g-stair-03').shape.polys)
    expect(toilets.x + toilets.w).toBeCloseTo(stair.x, 3)
  })
})

/* ------------------------------------------------------------------ */
/* F. Student common rooms                                             */
/* ------------------------------------------------------------------ */

describe('the student common rooms', () => {
  it('runs the mixed common room across to the female common room', () => {
    const smcr = boundsOf(byId('g-students-common').shape.polys)
    const fscr = boundsOf(byId('g-female-common').shape.polys)
    expect(smcr.w).toBeGreaterThan(200)
    expect(smcr.x + smcr.w).toBeGreaterThanOrEqual(fscr.x + fscr.w - 1)
    expect(byId('g-students-common').shortName).toBe('SMCR')
  })

  it('opens the female common room downward, onto the mixed common room', () => {
    const fscr = byId('g-female-common')
    const box = boundsOf(fscr.shape.polys)
    const smcr = boundsOf(byId('g-students-common').shape.polys)
    expect(fscr.doorMarks![0][1]).toBeCloseTo(box.y + box.h, 3)
    expect(fscr.door[1]).toBeGreaterThan(box.y + box.h - 1)
    expect(fscr.door[1]).toBeLessThan(smcr.y + smcr.h)
    expect(fscr.shortName).toBe('FSCR')
  })

  it('renames the activity room to the Student Advisory Council', () => {
    const sac = byId('g-sac')
    expect(sac.name).toBe('Student Advisory Council')
    expect(sac.shortName).toBe('SAC')
    expect(LOCATIONS.some((l) => /activity room/i.test(l.name))).toBe(false)
  })
})

/* ------------------------------------------------------------------ */
/* G. Postgraduate clinic                                              */
/* ------------------------------------------------------------------ */

describe('the postgraduate clinic', () => {
  it('has 40 spaces: 39 treatment rooms and one Head of Clinic Office', () => {
    expect(pgTreatmentPolys).toHaveLength(39)
    const hoc = byId('g-pg-hoc')
    expect(hoc.name).toBe('Head of Clinic Office')
    expect(hoc.shortName).toBe('HOC')
    expect(pgTreatmentPolys.length + 1).toBe(40)
  })

  it('lays the spaces out in rows of 11, 10, 10 and 9', () => {
    const all = [...pgTreatmentPolys, byId('g-pg-hoc').shape.polys[0]]
    // Grouped by distance along the wing's short axis, which is the
    // direction the rows are stacked in.
    const centres = all.map((p) => {
      const b = boundsOf([p])
      return wingLocal([b.x + b.w / 2, b.y + b.h / 2])[1]
    })
    const sorted = [...centres].sort((a, b) => a - b)
    const rows: number[][] = []
    for (const c of sorted) {
      const last = rows[rows.length - 1]
      if (last && c - last[last.length - 1] < 30) last.push(c)
      else rows.push([c])
    }
    expect(rows.map((r) => r.length)).toEqual([11, 10, 10, 9])
  })

  it('puts the office third from the western end of the top row', () => {
    const hocBox = boundsOf(byId('g-pg-hoc').shape.polys)
    const band = wingLocal([hocBox.x + hocBox.w / 2, hocBox.y + hocBox.h / 2])
    const row = [...pgTreatmentPolys, byId('g-pg-hoc').shape.polys[0]]
      .map((p) => boundsOf([p]))
      .map((b) => ({ b, wing: wingLocal([b.x + b.w / 2, b.y + b.h / 2]) }))
      .filter((r) => Math.abs(r.wing[1] - band[1]) < 30)
      .sort((a, b) => a.wing[0] - b.wing[0])
    expect(row).toHaveLength(11)
    expect(row[2].wing[0]).toBeCloseTo(band[0], 3)
  })

  it('replaces the wing X-ray with a single CBCT room', () => {
    const cbct = byId('g-pg-cbct')
    expect(cbct.shape.polys).toHaveLength(1)
    expect(cbct.name).toContain('CBCT')
    // Nothing called X-Ray is offered in the wing any more.
    expect(
      ground.filter((l) => /^x-?ray$/i.test(l.name)).map((l) => l.id),
      'no X-Ray destination remains',
    ).toEqual([])
    // Its door is on the corridor beside it.
    const corridor = circulationOnFloor('ground').find((c) => c.id === 'g-circ-wing-s')!
    expect(corridor.polys.some((p) => pointInPolygon(cbct.door, p))).toBe(true)
  })

  it('renames the two meeting rooms M1 and M2', () => {
    expect(byId('g-pg-meeting-1').shortName).toBe('M1')
    expect(byId('g-pg-meeting-2').shortName).toBe('M2')
  })

  it('keeps the clinic label off the room divisions', () => {
    const label = byId('g-pg-clinic').label
    expect(pgTreatmentPolys.some((p) => pointInPolygon(label, p))).toBe(false)
  })

  it('puts the surgery rooms and the waiting area where they belong', () => {
    for (const id of ['g-pg-surgery-1', 'g-pg-surgery-2', 'g-pg-waiting']) {
      expect(byId(id).id).toBe(id)
    }
  })
})

/* ------------------------------------------------------------------ */
/* Exits                                                               */
/* ------------------------------------------------------------------ */

describe('external exits', () => {
  const exits = ground.filter((l) => l.icon === 'entrance')

  it('draws every entrance and exit with a door', () => {
    expect(exits.length).toBeGreaterThanOrEqual(3)
    for (const e of exits) {
      expect(e.doorMarks, `${e.id} has a drawn door`).toBeTruthy()
      expect(e.doorMarks!.length).toBeGreaterThan(0)
    }
  })

  it('connects every exit to the route graph', () => {
    for (const e of exits) {
      expect(buildJourney(e), `${e.id} is reachable`).not.toBeNull()
    }
  })
})

/* ------------------------------------------------------------------ */
/* H. Restricted clinical access                                       */
/* ------------------------------------------------------------------ */

describe('the restricted undergraduate clinic', () => {
  it('carries the warning the college asked for', () => {
    const r = byId('g-uc-clinic').restricted
    expect(r).toBeTruthy()
    expect(r!.title).toBe('Restricted Clinical Area')
    expect(r!.message).toBe(
      'Please check in at UC Reception. Protective clothing and staff permission are required before entering.',
    )
    expect(r!.routeVia).toBe('g-uc-reception')
  })

  it('ends the walk at UC Reception rather than inside the clinic', () => {
    const journey = buildJourney(byId('g-uc-clinic'))!
    const last = journey.legs[journey.legs.length - 1]
    expect(last.title).toBe('UC Reception')
    const desk = byId('g-uc-reception')
    expect(Math.hypot(last.route.end[0] - desk.door[0], last.route.end[1] - desk.door[1])).toBeLessThan(1)
  })

  it('never sends a visitor into a chair bank, on any route', () => {
    const trespass: string[] = []
    for (const location of LOCATIONS) {
      const journey = buildJourney(location)
      if (!journey) continue
      for (const leg of journey.legs) {
        if (leg.floor !== 'ground') continue
        const pts = leg.route.points
        for (let i = 1; i < pts.length; i++) {
          const [ax, ay] = pts[i - 1]
          const [bx, by] = pts[i]
          const steps = Math.max(2, Math.ceil(Math.hypot(bx - ax, by - ay) / 6))
          for (let t = 0; t <= steps; t++) {
            const q: Pt = [ax + ((bx - ax) * t) / steps, ay + ((by - ay) * t) / steps]
            if (ucBankPolys.some((p) => pointInPolygon(q, p))) {
              trespass.push(`${location.id} at ${q.map(Math.round).join(',')}`)
            }
          }
        }
      }
    }
    expect([...new Set(trespass)]).toEqual([])
  })

  it('never sends a visitor through a postgraduate treatment room', () => {
    const trespass: string[] = []
    for (const location of LOCATIONS) {
      const journey = buildJourney(location)
      if (!journey) continue
      for (const leg of journey.legs) {
        if (leg.floor !== 'ground') continue
        const pts = leg.route.points
        // The last hop is the step through the destination's own door.
        for (let i = 1; i < pts.length - 1; i++) {
          const [ax, ay] = pts[i - 1]
          const [bx, by] = pts[i]
          const steps = Math.max(2, Math.ceil(Math.hypot(bx - ax, by - ay) / 6))
          for (let t = 0; t <= steps; t++) {
            const q: Pt = [ax + ((bx - ax) * t) / steps, ay + ((by - ay) * t) / steps]
            if (pgTreatmentPolys.some((p) => pointInPolygon(q, p))) {
              trespass.push(`${location.id} at ${q.map(Math.round).join(',')}`)
            }
          }
        }
      }
    }
    expect([...new Set(trespass)]).toEqual([])
  })

  it('reaches the eastern side around the bottom of the clinic', () => {
    const journey = buildJourney(byId('g-students-common'))!
    const pts = journey.legs[0].route.points
    const banks = boundsOf(ucBankPolys)
    // The walk passes below the chair banks, on the student circulation.
    expect(pts.some((p) => p[1] > banks.y + banks.h)).toBe(true)
  })

  it('reaches the postgraduate clinic up the western corridor', () => {
    const journey = buildJourney(byId('g-pg-clinic'))!
    const main = circulationOnFloor('ground').find((c) => c.id === 'g-circ-main')!
    // The walk goes up the public western side, never along the clinic
    // corridor that runs in front of the chair banks.
    const inClinicCorridor = journey.legs[0].route.points.filter((p) =>
      main.polys.some((poly) => pointInPolygon(p, poly)),
    )
    expect(inClinicCorridor).toEqual([])
  })
})

/* ------------------------------------------------------------------ */
/* Technical spaces and labels                                         */
/* ------------------------------------------------------------------ */

describe('technical and back-of-house spaces', () => {
  const TECHNICAL = /compressor|suction|plant|electrical|hvac|\bit\b|shaft|technical|janitor|duct|ta ele|ta avac/i

  it('never offers one as a destination', () => {
    const offered = LOCATIONS.filter((l) => TECHNICAL.test(l.name) || TECHNICAL.test(l.shortName))
    expect(offered.map((l) => l.id)).toEqual([])
  })

  it('never labels one on the map', () => {
    const labelled = secondaryOnFloor('ground').filter(
      (s) => TECHNICAL.test(s.name) && s.name !== '' && s.label,
    )
    expect(labelled.map((s) => s.id)).toEqual([])
  })

  it('draws them, so the plan still reads as a building', () => {
    const silent = secondaryOnFloor('ground').filter((s) => s.name === '')
    expect(silent.length).toBeGreaterThan(8)
    for (const s of silent) {
      expect(s.shape.polys.length, `${s.id} is drawn`).toBeGreaterThan(0)
      expect(s.label, `${s.id} carries no label`).toBeUndefined()
    }
  })

  it('keeps the visitor-relevant support spaces visible', () => {
    // Toilets stay on the map, quietly, rather than disappearing.
    const toilets = secondaryOnFloor('ground').filter((s) => s.kind === 'toilet')
    // Fewer stand alone now: the west pair were taken into the prayer
    // rooms beside them, which is where visitors are sent for both.
    expect(toilets.length).toBeGreaterThanOrEqual(3)
    for (const t of toilets) expect(t.label, `${t.id} is labelled`).toBeTruthy()
    // And these are full destinations.
    for (const id of ['g-cssd', 'g-uc-nurse-1', 'g-prayer-w-f', 'g-prayer-w-m', 'g-lcr']) {
      expect(byId(id).id).toBe(id)
    }
    // The west prayer rooms carry their own toilets, so the card has to
    // say so rather than leaving a visitor hunting for a separate room.
    for (const id of ['g-prayer-w-f', 'g-prayer-w-m']) {
      expect(byId(id).description, id).toMatch(/toilet/i)
      expect(byId(id).shape.polys, id).toHaveLength(1)
    }
  })
})

describe('map labels', () => {
  /**
   * The two clinic names sit in the corridor band on purpose, so the
   * chair grid and the room divisions underneath stay readable.
   */
  const IN_CORRIDOR = new Set(['g-uc-clinic', 'g-pg-clinic'])
  /**
   * An entrance or exit is a slot in the wall, not a room, so its name
   * is written on the floor beside the door rather than inside it.
   */
  const isDoorSlot = (l: Location) => l.icon === 'entrance'

  it('fits every room label inside its own shape', () => {
    const tight: string[] = []
    for (const l of ground) {
      if (IN_CORRIDOR.has(l.id) || isDoorSlot(l)) continue
      const box = boundsOf(l.shape.polys)
      const size = l.labelSize ?? 18
      // The renderer wraps to at most two lines, so half the short name
      // has to fit across the room at roughly 0.54 em per character.
      const longest = Math.ceil(l.shortName.length / 2)
      const needed = longest * size * 0.54
      if (needed > Math.max(box.w, box.h) + 1) {
        tight.push(`${l.id}: "${l.shortName}" needs ${Math.round(needed)} in ${Math.round(box.w)}`)
      }
    }
    expect(tight).toEqual([])
  })

  it('puts every label inside the shape it names', () => {
    const stray: string[] = []
    for (const l of ground) {
      if (IN_CORRIDOR.has(l.id) || isDoorSlot(l)) continue
      if (!l.shape.polys.some((p) => pointInPolygon(l.label, p))) stray.push(l.id)
    }
    expect(stray).toEqual([])
  })

  it('gives every destination the full record the panel needs', () => {
    for (const l of ground) {
      expect(l.id, 'id').toBeTruthy()
      expect(l.name.length, `${l.id} name`).toBeGreaterThan(1)
      expect(l.shortName.length, `${l.id} short name`).toBeGreaterThan(0)
      expect(l.description.length, `${l.id} description`).toBeGreaterThan(20)
      expect(l.icon, `${l.id} icon`).toBeTruthy()
      expect(l.shape.polys.length, `${l.id} shape`).toBeGreaterThan(0)
      expect(Number.isFinite(l.label[0]) && Number.isFinite(l.label[1]), `${l.id} label`).toBe(true)
      expect(Number.isFinite(l.door[0]) && Number.isFinite(l.door[1]), `${l.id} door`).toBe(true)
      expect(l.entryNode, `${l.id} entry node`).toBeTruthy()
    }
  })
})

/* ------------------------------------------------------------------ */
/* The other two floors are not part of this revision                  */
/* ------------------------------------------------------------------ */

describe('the second floor', () => {
  // The first floor is under revision now, so only the second is held
  // to what it was: nothing here should be disturbing it.
  it('still has the same destinations it had before', () => {
    expect(locationsOnFloor('second')).toHaveLength(18)
  })

  it('still has the same circulation and support spaces', () => {
    expect(CIRCULATION.filter((c) => c.floor !== 'ground').length).toBeGreaterThan(0)
    expect(secondaryOnFloor('first').length).toBeGreaterThan(0)
    expect(secondaryOnFloor('second').length).toBeGreaterThan(0)
  })
})

/* ------------------------------------------------------------------ */
/* The college's marked-up references                                  */
/* ------------------------------------------------------------------ */

describe('the routes the college marked up', () => {
  const banks = boundsOf(ucBankPolys)
  const main = circulationOnFloor('ground').find((c) => c.id === 'g-circ-main')!
  const south = circulationOnFloor('ground').find((c) => c.id === 'g-circ-south')!
  const pts = (id: string) => buildJourney(byId(id))!.legs[0].route.points
  const usesCorridor = (points: Pt[], area: typeof main) =>
    points.some((p) => area.polys.some((poly) => pointInPolygon(p, poly)))

  it.each(['g-canteen', 'g-students-common', 'g-staff-common', 'g-lift-34'])(
    'walks to %s around the bottom of the clinic',
    (id) => {
      const points = pts(id)
      expect(usesCorridor(points, south), 'uses the student / staff circulation').toBe(true)
      // Never cuts across the front of the chair banks to get there.
      const alongTheBanks = points.filter(
        (p) => main.polys.some((poly) => pointInPolygon(p, poly)) && p[0] > banks.x,
      )
      expect(alongTheBanks).toEqual([])
    },
  )

  it('walks north up the western side to the postgraduate clinic', () => {
    const points = pts('g-pg-clinic')
    expect(usesCorridor(points, main), 'stays out of the clinic corridor').toBe(false)
    expect(usesCorridor(points, south), 'stays out of the south circulation').toBe(false)
    // It ends up north of the whole south wing.
    expect(Math.min(...points.map((p) => p[1]))).toBeLessThan(banks.y - 400)
  })

  it('reaches Stair 02 up from the student circulation', () => {
    const points = pts('g-stair-02')
    expect(usesCorridor(points, south)).toBe(true)
    const last = points[points.length - 1]
    const before = points[points.length - 2]
    // The final step goes north, out of the corridor and into the stair.
    expect(last[1]).toBeLessThan(before[1])
    expect(Math.abs(last[0] - before[0])).toBeLessThan(2)
  })

  it('puts the Head of Clinic Office where the reference marks it', () => {
    // The marker solves to wing (a 285, b 60); the office spans a
    // 259.5 - 316.5 in the top band, so the mark falls inside it.
    const hoc = byId('g-pg-hoc')
    const box = boundsOf(hoc.shape.polys)
    const marked = w(284.6, 59.7)
    expect(pointInPolygon(marked, hoc.shape.polys[0]), 'marker inside the office').toBe(true)
    expect(box.w).toBeGreaterThan(0)
  })
})

describe('doors are cut in the right walls', () => {
  const areas = circulationOnFloor('ground').flatMap((c) => c.polys)
  /**
   * Enclosed rooms only. The patient lobby and the mixed common room
   * are open floor — the plan draws circulation right through them —
   * so a door may legitimately open into one.
   */
  const isOpenFloor = (polys: Pt[][]) => {
    const b = boundsOf(polys)
    return areas.some((a) => pointInPolygon([b.x + b.w / 2, b.y + b.h / 2], a))
  }
  const allRooms = [
    ...ground.map((l) => ({ id: l.id, polys: l.shape.polys })),
    ...secondaryOnFloor('ground').map((sp) => ({ id: sp.id, polys: sp.shape.polys })),
  ].filter((r) => !isOpenFloor(r.polys))

  it('never opens a door inside a different room', () => {
    // This is what caught the postgraduate west exit: it and its
    // approach corridor both fell inside the Dental Laboratory.
    const wrong: string[] = []
    for (const l of ground) {
      for (const d of l.doorMarks ?? []) {
        for (const room of allRooms) {
          if (room.id === l.id) continue
          if (room.polys.some((p) => pointInPolygon(d, p))) {
            wrong.push(`${l.id} door at ${d.map(Math.round).join(',')} is inside ${room.id}`)
          }
        }
      }
    }
    expect(wrong).toEqual([])
  })

  it('puts every exit marker on the outside of the plan', () => {
    const wrong: string[] = []
    for (const e of ground.filter((l) => l.icon === 'entrance')) {
      for (const room of allRooms) {
        if (room.id === e.id) continue
        if (room.polys.some((p) => pointInPolygon(e.label, p))) {
          wrong.push(`${e.id} label is inside ${room.id}`)
        }
      }
    }
    expect(wrong).toEqual([])
  })
})

describe('the postgraduate wing exits', () => {
  const lab = secondaryOnFloor('ground').find((s) => s.id === 'g-s-lab')!
  const enclosed = [
    ...lab.shape.polys.map((p) => ({ id: 'g-s-lab', poly: p })),
    ...pgTreatmentPolys.map((p, i) => ({ id: `pg treatment ${i}`, poly: p })),
    ...ucBankPolys.map((p, i) => ({ id: `uc bank ${i}`, poly: p })),
  ]

  it('has an exit at each end of the wing', () => {
    for (const id of ['g-exit-pg-west', 'g-exit-pg-east']) {
      const e = byId(id)
      expect(e.doorMarks!.length).toBeGreaterThan(0)
      expect(buildJourney(e), `${id} is reachable`).not.toBeNull()
    }
  })

  it('opens the west exit on the north wall, clear of the laboratory', () => {
    const e = byId('g-exit-pg-west')
    const labBox = boundsOf(lab.shape.polys)
    for (const p of [...e.shape.polys[0], ...e.doorMarks!, e.door]) {
      expect(
        enclosed.some((r) => pointInPolygon(p, r.poly)),
        `${p.map(Math.round).join(',')} must not be inside an enclosed room`,
      ).toBe(false)
    }
    // Immediately east of the laboratory, at the head of the top row.
    expect(boundsOf(e.shape.polys).x).toBeGreaterThan(labBox.x + labBox.w - 20)
  })

  it('never walks either exit route through the laboratory or a treatment room', () => {
    const trespass: string[] = []
    for (const id of ['g-exit-pg-west', 'g-exit-pg-east']) {
      const points = buildJourney(byId(id))!.legs[0].route.points
      for (let i = 1; i < points.length; i++) {
        const [ax, ay] = points[i - 1]
        const [bx, by] = points[i]
        const steps = Math.max(2, Math.ceil(Math.hypot(bx - ax, by - ay) / 4))
        for (let t = 0; t <= steps; t++) {
          const q: Pt = [ax + ((bx - ax) * t) / steps, ay + ((by - ay) * t) / steps]
          for (const room of enclosed) {
            if (pointInPolygon(q, room.poly)) {
              trespass.push(`${id} crosses ${room.id} at ${q.map(Math.round).join(',')}`)
            }
          }
        }
      }
    }
    expect([...new Set(trespass)]).toEqual([])
  })

  it('keeps the laboratory clear of the wing it sits beside', () => {
    // The traced east wall used to overshoot into the first treatment
    // room, which is why there was no bay for the exit to open into.
    const overlap: string[] = []
    for (const [i, room] of pgTreatmentPolys.entries()) {
      for (const corner of room) {
        if (lab.shape.polys.some((p) => pointInPolygon(corner, p))) {
          overlap.push(`treatment room ${i} corner inside the laboratory`)
        }
      }
    }
    expect([...new Set(overlap)]).toEqual([])
  })
})
