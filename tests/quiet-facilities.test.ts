/**
 * Prayer rooms and toilets.
 *
 * The college wanted these told apart from the ordinary grey support
 * rooms without ever competing with a destination: one warm tone for
 * prayer, one cool tone for the toilets, on all three floors. The
 * men's and women's rooms share a colour and are separated by the name
 * alone, so these checks watch the names as closely as the tints.
 */

import { describe, expect, it } from 'vitest'
import { CATEGORIES, FACILITY_ZONES, ZONE_TONES, roomPaint } from '../src/data/floors'
import { LOCATIONS, secondaryOnFloor } from '../src/data/locations'
import { boundsOf } from '../src/data/geometry'
import type { FloorId } from '../src/data/types'

const FLOORS: FloorId[] = ['ground', 'first', 'second']
const prayerRooms = LOCATIONS.filter((l) => l.icon === 'prayer')
const toilets = FLOORS.flatMap((f) => secondaryOnFloor(f).filter((s) => s.kind === 'toilet'))

/** Relative luminance, for the "lighter than a destination" checks. */
const luminance = (hex: string): number => {
  const n = parseInt(hex.slice(1), 16)
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}

describe('the two quiet tones', () => {
  it('uses the colours the college chose', () => {
    expect(ZONE_TONES.prayer).toEqual({
      fill: '#F6F0E3',
      stroke: '#B08A4A',
      icon: '#B08A4A',
      text: '#654B21',
    })
    expect(ZONE_TONES.toilet).toEqual({
      fill: '#E8F1F5',
      stroke: '#6F98AA',
      icon: '#6F98AA',
      text: '#365E70',
    })
  })

  it('sits lighter than the clinics, the food areas and the route', () => {
    const quiet = [ZONE_TONES.prayer.fill, ZONE_TONES.toilet.fill].map(luminance)
    const loud = [
      ZONE_TONES.pg.fill,
      CATEGORIES.clinical.fill,
      CATEGORIES.food.fill,
      CATEGORIES.learning.fill,
      CATEGORIES.administration.fill,
      CATEGORIES.reception.fill,
      // The selected room and the drawn route.
      '#E4761B',
      '#E2711D',
    ].map(luminance)
    for (const q of quiet) for (const l of loud) expect(q).toBeGreaterThan(l)
  })

  it('is no heavier than the palest tint already on the plan', () => {
    // The undergraduate aqua and the plain support grey are the two
    // lightest fills the map had. The toilet tone lands a whisker below
    // both — under one per cent of luminance, which is nothing to the
    // eye — so it still belongs to the same pale band rather than
    // reading as a colour of its own.
    const palest = Math.max(luminance(ZONE_TONES.uc.fill), luminance(CATEGORIES.secondary.fill))
    for (const tone of [ZONE_TONES.prayer, ZONE_TONES.toilet]) {
      expect(palest - luminance(tone.fill)).toBeLessThan(0.01)
    }
  })

  it('keeps its name comfortably legible on its own fill', () => {
    // Well past the 4.5:1 the guidelines ask of body text: the prayer
    // name carries 7.2:1 and the toilet name 6.1:1.
    for (const tone of [ZONE_TONES.prayer, ZONE_TONES.toilet]) {
      const a = luminance(tone.fill) + 0.05
      const b = luminance(tone.text) + 0.05
      expect(Math.max(a, b) / Math.min(a, b)).toBeGreaterThan(4.5)
    }
  })

  it('offers both as compact legend keys', () => {
    expect(FACILITY_ZONES).toEqual([
      { tone: 'prayer', label: 'Prayer Rooms' },
      { tone: 'toilet', label: 'Toilets' },
    ])
  })
})

describe('every prayer room', () => {
  it('carries the warm tone and the prayer-mat pictogram', () => {
    expect(prayerRooms).toHaveLength(3)
    for (const room of prayerRooms) {
      expect(room.tone, room.id).toBe('prayer')
      expect(room.icon, room.id).toBe('prayer')
      const paint = roomPaint(room)
      expect(paint.fill, room.id).toBe('#F6F0E3')
      expect(paint.stroke, room.id).toBe('#B08A4A')
      expect(paint.icon, room.id).toBe('#B08A4A')
      expect(paint.text, room.id).toBe('#654B21')
    }
  })

  it('tells the men from the women by the name, never by the colour', () => {
    const names = prayerRooms.map((r) => r.name).sort()
    expect(names).toEqual([
      "Men's Prayer Room",
      "Men's Prayer Room (East)",
      "Women's Prayer Room",
    ])
    expect(new Set(prayerRooms.map((r) => roomPaint(r).fill)).size).toBe(1)
  })

  it('is no more of a highlighted destination than it was', () => {
    for (const room of prayerRooms) expect(room.primary, room.id).toBe(false)
  })
})

describe('every toilet', () => {
  it('carries the cool tone on all three floors', () => {
    expect(toilets).toHaveLength(11)
    for (const floor of FLOORS) {
      const onFloor = secondaryOnFloor(floor).filter((s) => s.kind === 'toilet')
      expect(onFloor.length, `${floor} has toilets`).toBeGreaterThan(0)
      for (const t of onFloor) expect(t.tone, t.id).toBe('toilet')
    }
  })

  it('names each one so M and F are told apart by the label', () => {
    for (const t of toilets) expect(t.name, t.id).toMatch(/^Toilets( [MF])?$/)
    expect(toilets.filter((t) => t.name.endsWith(' M')).length).toBeGreaterThan(0)
    expect(toilets.filter((t) => t.name.endsWith(' F')).length).toBeGreaterThan(0)
  })

  it('stays a support space rather than becoming a destination', () => {
    const ids = new Set(toilets.map((t) => t.id))
    expect(LOCATIONS.some((l) => ids.has(l.id))).toBe(false)
  })

  it('leaves room above its name for the pictogram', () => {
    // The rule the map draws by: a symbol only where the room can hold
    // one over the label. Everything else keeps the label alone.
    const roomy = toilets.filter((t) => {
      const box = boundsOf(t.shape.polys)
      const size = t.labelSize ?? 13
      return Boolean(t.label) && box.h > size * 3.6 && box.w > size * 2.6
    })
    expect(roomy.length).toBe(10)
    // The one that misses out is the narrow strip, which carries no
    // label either, so nothing is covered.
    const cramped = toilets.filter((t) => !roomy.includes(t))
    expect(cramped.map((t) => t.id)).toEqual(['s-s-toilets-n'])
    expect(cramped[0].label).toBeUndefined()
  })
})

describe('the ordinary support rooms are untouched', () => {
  it('leaves every other kind grey', () => {
    for (const floor of FLOORS) {
      for (const s of secondaryOnFloor(floor)) {
        if (s.kind === 'toilet') continue
        // Only the lift and stair cores carry a tone of their own.
        if (s.tone) expect(['lift', 'stair'], s.id).toContain(s.tone)
      }
    }
  })

  it('leaves the technical rooms with no tone at all', () => {
    const technical = FLOORS.flatMap((f) =>
      secondaryOnFloor(f).filter((s) => s.kind === 'service'),
    )
    expect(technical.length).toBeGreaterThan(0)
    for (const s of technical) expect(s.tone, s.id).toBeUndefined()
  })
})
