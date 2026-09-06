/**
 * Which destinations show their photograph in the list.
 *
 * A photograph earns its place beside a name only when it belongs to
 * that destination alone. The tutorial rooms share one picture between
 * the six of them and the lecture rooms another between four, so a
 * thumbnail there would repeat the same image down the list without
 * saying which room it is; those keep their category mark.
 *
 * The rule is counted from `LOCATIONS` rather than written down, so
 * these checks compare it against the source data instead of against a
 * list of ids or filenames kept alongside it.
 */

import { describe, expect, it } from 'vitest'
import { LOCATIONS, hasUniquePhoto, photoUsage } from '../src/data/locations'
import type { Location } from '../src/data/types'

const byId = (id: string): Location => {
  const found = LOCATIONS.find((l) => l.id === id)
  if (!found) throw new Error(`no location ${id}`)
  return found
}

const photographed = () => LOCATIONS.filter((l) => l.image !== undefined)

describe('counting how far each photograph reaches', () => {
  it('counts one use for every photographed destination and none for the rest', () => {
    const uses = photoUsage()
    const total = [...uses.values()].reduce((n, c) => n + c, 0)
    expect(total).toBe(photographed().length)
  })

  it('knows the two pictures that stand for a whole set of rooms', () => {
    const uses = photoUsage()
    const shared = [...uses.entries()].filter(([, n]) => n > 1).map(([, n]) => n).sort()
    // One picture for six tutorial rooms, one for four lecture rooms.
    expect(shared).toEqual([4, 6])
  })

  it('never counts a picture zero times', () => {
    for (const [src, n] of photoUsage()) {
      expect(n, src).toBeGreaterThan(0)
    }
  })
})

describe('which destinations show a photograph', () => {
  it('shows one only where the picture is used exactly once', () => {
    const uses = photoUsage()
    for (const room of LOCATIONS) {
      const expected = room.image !== undefined && uses.get(room.image) === 1
      expect(hasUniquePhoto(room), room.id).toBe(expected)
    }
  })

  it('never shows one for a destination without a photograph', () => {
    for (const room of LOCATIONS.filter((l) => l.image === undefined)) {
      expect(hasUniquePhoto(room), room.id).toBe(false)
    }
  })

  it('keeps the mark on every tutorial room, because they share a picture', () => {
    const tutorials = LOCATIONS.filter((l) => /^Tutorial Room [A-F]$/.test(l.name))
    expect(tutorials).toHaveLength(6)
    for (const room of tutorials) {
      expect(room.image, `${room.id} is photographed`).toBeDefined()
      expect(hasUniquePhoto(room), `${room.id} must keep its icon`).toBe(false)
    }
    // And it really is one picture, not six that happen to be shared.
    expect(new Set(tutorials.map((l) => l.image)).size).toBe(1)
  })

  it('keeps the mark on every lecture room, because they share a picture', () => {
    const lectures = LOCATIONS.filter((l) => /^Lecture Room [1-4]$/.test(l.name))
    expect(lectures).toHaveLength(4)
    for (const room of lectures) {
      expect(room.image, `${room.id} is photographed`).toBeDefined()
      expect(hasUniquePhoto(room), `${room.id} must keep its icon`).toBe(false)
    }
    expect(new Set(lectures.map((l) => l.image)).size).toBe(1)
  })

  it('shows the photograph of rooms photographed for themselves', () => {
    // A sample across floors and categories, named by what a visitor
    // reads rather than by the file behind it.
    for (const name of [
      'Library',
      'Multimedia Room',
      'Oral Biology Lab',
      'Research Hub',
      'CSL',
      'Prosthodontic Lab',
      'Postgraduate Clinic',
      'Undergraduate Clinic',
    ]) {
      const room = LOCATIONS.find((l) => l.name === name)
      expect(room, name).toBeTruthy()
      expect(hasUniquePhoto(room!), name).toBe(true)
    }
  })

  it('counts sixteen rooms showing a photograph out of twenty-four photographed', () => {
    expect(photographed()).toHaveLength(24)
    expect(LOCATIONS.filter((l) => hasUniquePhoto(l))).toHaveLength(14)
  })
})

describe('it is derived, not written down', () => {
  it('drops a photograph as soon as a second room takes it', () => {
    const library = byId('f-library')
    const other = LOCATIONS.find((l) => l.image === undefined)!
    expect(hasUniquePhoto(library)).toBe(true)
    other.image = library.image
    try {
      expect(hasUniquePhoto(library), 'shared now, so no thumbnail').toBe(false)
      expect(hasUniquePhoto(other), 'the borrower gets none either').toBe(false)
    } finally {
      delete other.image
    }
    expect(hasUniquePhoto(library), 'unique again').toBe(true)
  })

  it('grants one as soon as a room stops sharing', () => {
    const tutorials = LOCATIONS.filter((l) => /^Tutorial Room [A-F]$/.test(l.name))
    const one = tutorials[0]
    const kept = one.image
    expect(hasUniquePhoto(one)).toBe(false)
    one.image = 'a-picture-of-this-room-alone.webp'
    try {
      expect(hasUniquePhoto(one), 'its own picture now').toBe(true)
      // The five it left behind still share theirs.
      for (const rest of tutorials.slice(1)) {
        expect(hasUniquePhoto(rest), rest.id).toBe(false)
      }
    } finally {
      one.image = kept
    }
    expect(hasUniquePhoto(one)).toBe(false)
  })

  it('reads the data at call time rather than caching a first answer', () => {
    const before = photoUsage().size
    const room = LOCATIONS.find((l) => l.image === undefined)!
    room.image = 'a-picture-nothing-else-uses.webp'
    try {
      expect(photoUsage().size).toBe(before + 1)
    } finally {
      delete room.image
    }
    expect(photoUsage().size).toBe(before)
  })
})
