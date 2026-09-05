/**
 * The photographs on the location cards.
 *
 * They are optional metadata: a destination without one has to keep
 * working exactly as it did, and the twelve that have one have to
 * carry real alternative text. The four lecture rooms share a single
 * asset, so the built site downloads it once: nine files, twelve cards.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { LOCATIONS } from '../src/data/locations'
import { buildJourney, routeTarget } from '../src/data/routes'

/** Every destination the college gave us a photograph of. */
const EXPECTED = new Map<string, string>([
  ['g-pg-clinic', 'Dental treatment room in the Postgraduate Clinic'],
  ['g-uc-clinic', 'Undergraduate Clinic at Oman Dental College'],
  ['g-canteen', 'Cafeteria seating area at Oman Dental College'],
  ['g-students-common', 'Foosball table in the Students Mixed Common Room'],
  ['f-library', 'Library and study area at Oman Dental College'],
  ['f-multimedia', 'Computer workstations in the Multimedia Room'],
  ['f-simulation', 'Clinical Skills Laboratory at Oman Dental College'],
  ['f-lecture-1', 'Lecture room at Oman Dental College'],
  ['f-lecture-2', 'Lecture room at Oman Dental College'],
  ['f-lecture-3', 'Lecture room at Oman Dental College'],
  ['f-lecture-4', 'Lecture room at Oman Dental College'],
  ['g-parking', 'Aerial view of Oman Dental College visitor parking'],
])

const ASSET_DIR = join(process.cwd(), 'src', 'assets', 'locations')

/** Every processed file, at the size the college signed off. */
const SIZES: Record<string, [number, number]> = {
  'csl.webp': [1200, 960],
  'postgraduate-clinic.webp': [1200, 900],
  'students-mixed-common-room.webp': [1200, 800],
  'lecture-rooms.webp': [1200, 800],
  'library.webp': [1200, 800],
  'canteen-restaurant.webp': [1200, 750],
  'multimedia-room.webp': [1200, 675],
  'undergraduate-clinic.webp': [1200, 896],
  'oman-dental-college-parking.webp': [1200, 675],
}
const FILES = Object.keys(SIZES)

/**
 * Width and height straight out of the WebP header, so the test needs
 * no decoder. A lossy file keeps them in the VP8 bitstream at a fixed
 * offset; a lossless one packs them into four bytes of VP8L.
 */
function webpSize(file: string): [number, number] {
  const b = readFileSync(file)
  const fourcc = b.toString('ascii', 12, 16)
  if (fourcc === 'VP8 ') {
    return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff]
  }
  if (fourcc === 'VP8L') {
    const bits = b.readUInt32LE(21)
    return [(bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1]
  }
  if (fourcc === 'VP8X') {
    return [b.readUIntLE(24, 3) + 1, b.readUIntLE(27, 3) + 1]
  }
  throw new Error(`${file}: unexpected WebP form ${fourcc}`)
}

const withPhoto = LOCATIONS.filter((l) => l.image)

describe('the location photographs', () => {
  it('puts one on exactly the destinations the college chose', () => {
    expect(withPhoto.map((l) => l.id).sort()).toEqual([...EXPECTED.keys()].sort())
  })

  it('counts twelve destinations across nine files, the lecture rooms sharing one', () => {
    expect(withPhoto).toHaveLength(12)
    expect(new Set(withPhoto.map((l) => l.image)).size).toBe(9)
    expect(FILES).toHaveLength(9)
  })

  it('gives every one of them real alternative text', () => {
    for (const l of withPhoto) {
      expect(l.imageAlt, `${l.id} alt`).toBe(EXPECTED.get(l.id))
      expect(l.imageAlt!.trim().length, `${l.id} alt is not empty`).toBeGreaterThan(10)
      expect(l.imagePosition, `${l.id} crop`).toMatch(/%|center|top|bottom|left|right/)
    }
  })

  it('shares one asset across the four lecture rooms', () => {
    const lectures = withPhoto.filter((l) => l.id.startsWith('f-lecture-'))
    expect(lectures).toHaveLength(4)
    expect(new Set(lectures.map((l) => l.image)).size).toBe(1)
    // And that asset belongs to them alone.
    const shared = lectures[0].image
    expect(withPhoto.filter((l) => l.image === shared).map((l) => l.id).sort()).toEqual([
      'f-lecture-1',
      'f-lecture-2',
      'f-lecture-3',
      'f-lecture-4',
    ])
  })

  it('gives every other destination no image at all', () => {
    for (const l of LOCATIONS) {
      if (EXPECTED.has(l.id)) continue
      expect(l.image, `${l.id} should have no image`).toBeUndefined()
      expect(l.imageAlt, `${l.id} should have no alt`).toBeUndefined()
      expect(l.imagePosition, `${l.id} should have no crop`).toBeUndefined()
    }
  })

  it('leaves every destination without one still whole and reachable', () => {
    const plain = LOCATIONS.filter((l) => !l.image)
    expect(plain.length).toBeGreaterThan(50)
    for (const l of plain) {
      expect(l.name.length, `${l.id} name`).toBeGreaterThan(0)
      expect(buildJourney(l), `${l.id} journey`).not.toBeNull()
    }
  })
})

describe('the processed image files', () => {
  it('ships all nine, and no stray originals', () => {
    expect(existsSync(ASSET_DIR)).toBe(true)
    expect(readdirSync(ASSET_DIR).sort()).toEqual([...FILES].sort())
  })

  it('holds every one at the dimensions the college approved', () => {
    for (const [name, [w, h]] of Object.entries(SIZES)) {
      expect(webpSize(join(ASSET_DIR, name)), name).toEqual([w, h])
    }
  })

  it('keeps them small enough to load on a phone', () => {
    let total = 0
    for (const name of FILES) {
      const size = statSync(join(ASSET_DIR, name)).size
      expect(size, `${name} is not empty`).toBeGreaterThan(1024)
      expect(size, `${name} under 400 kB`).toBeLessThan(400 * 1024)
      total += size
    }
    // The college asked for the whole set to stay under 1.5 MB.
    expect(total).toBeLessThan(1.5 * 1024 * 1024)
  })

  it('puts every one of them into the production build', () => {
    const dist = join(process.cwd(), 'dist', 'assets')
    if (!existsSync(dist)) return // build not run in this pass
    const built = readdirSync(dist).filter((f) => f.endsWith('.webp'))
    for (const name of FILES) {
      const stem = name.replace('.webp', '')
      expect(
        built.some((f) => f.startsWith(`${stem}-`)),
        `${name} is missing from the build`,
      ).toBe(true)
    }
  })
})

describe('adding photographs changed nothing else', () => {
  it('leaves both clinics restricted, behind their own desks', () => {
    expect(routeTarget(LOCATIONS.find((l) => l.id === 'g-uc-clinic')!).id).toBe('g-uc-reception')
    expect(routeTarget(LOCATIONS.find((l) => l.id === 'g-pg-clinic')!).id).toBe('g-pc-reception')
  })

  it('leaves the canteen and the common room routable as before', () => {
    for (const id of ['g-canteen', 'g-students-common', 'f-library', 'f-simulation']) {
      const l = LOCATIONS.find((x) => x.id === id)!
      expect(routeTarget(l).id, `${id} is not redirected`).toBe(id)
      expect(buildJourney(l), `${id} journey`).not.toBeNull()
    }
  })
})
