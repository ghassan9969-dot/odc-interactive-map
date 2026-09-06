/**
 * The photographs on the location cards.
 *
 * They are optional metadata: a destination without one has to keep
 * working exactly as it did, and the twenty-four that have one have to
 * carry real alternative text. Two assets are shared — the four lecture
 * rooms draw on one, the six tutorial rooms on another — so the built
 * site downloads each of those once: sixteen files, twenty-four cards.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { LOCATIONS, locationsOnFloor, secondaryOnFloor } from '../src/data/locations'
import { f1, rect } from '../src/data/geometry'
import { buildJourney, routeTarget } from '../src/data/routes'

/** Every destination the college gave us a photograph of. */
const EXPECTED = new Map<string, string>([
  // Ground floor
  ['g-pg-clinic', 'Dental treatment room in the Postgraduate Clinic'],
  ['g-uc-clinic', 'Treatment bays in the Undergraduate Clinic'],
  ['g-coffee-shop', 'Café seating and service counter at Oman Dental College'],
  ['g-canteen', 'Cafeteria seating area at Oman Dental College'],
  ['g-students-common', 'Foosball table in the Students Mixed Common Room'],
  ['g-parking', 'Aerial view of Oman Dental College visitor parking'],
  // First floor
  ['f-library', 'Library and study area at Oman Dental College'],
  ['f-multimedia', 'Computer workstations in the Multimedia Room'],
  ['f-simulation', 'Phantom-head training benches in the Clinical Skills Laboratory'],
  ['f-oral-biology', 'Microscope benches in the Oral Biology Laboratory'],
  ['f-prosthodontic', 'Technician benches with lamps and monitors in the Prosthodontic Laboratory'],
  ['f-research-hub', 'Laboratory benches and equipment in the Research Hub'],
  ['f-xray-training', 'Dental X-ray units in the X-Ray and CSSD training room'],
  ['f-s-plaster', 'Workbenches and equipment in the Plaster Room at Oman Dental College'],
  // The four lecture rooms, sharing one asset
  ['f-lecture-1', 'Lecture room at Oman Dental College'],
  ['f-lecture-2', 'Lecture room at Oman Dental College'],
  ['f-lecture-3', 'Lecture room at Oman Dental College'],
  ['f-lecture-4', 'Lecture room at Oman Dental College'],
  // Tutorial Rooms A to F, sharing another
  ['f-classroom-06', 'Tutorial room with tables, chairs and a display screen'],
  ['f-classroom-05', 'Tutorial room with tables, chairs and a display screen'],
  ['f-classroom-02', 'Tutorial room with tables, chairs and a display screen'],
  ['f-classroom-03', 'Tutorial room with tables, chairs and a display screen'],
  ['f-classroom-04', 'Tutorial room with tables, chairs and a display screen'],
  ['f-classroom-01', 'Tutorial room with tables, chairs and a display screen'],
])

const LECTURE_ROOMS = ['f-lecture-1', 'f-lecture-2', 'f-lecture-3', 'f-lecture-4']
const TUTORIAL_ROOMS = [
  'f-classroom-06',
  'f-classroom-05',
  'f-classroom-02',
  'f-classroom-03',
  'f-classroom-04',
  'f-classroom-01',
]

const ASSET_DIR = join(process.cwd(), 'src', 'assets', 'locations')

/** Every processed file, at the size the college signed off. */
const SIZES: Record<string, [number, number]> = {
  // Unchanged since the first photography pass.
  'postgraduate-clinic.webp': [1200, 900],
  'students-mixed-common-room.webp': [1200, 800],
  'lecture-rooms.webp': [1200, 800],
  'library.webp': [1200, 800],
  'canteen-restaurant.webp': [1200, 750],
  'oman-dental-college-parking.webp': [1200, 675],
  // Replaced with native 16:9 frames.
  'csl.webp': [1200, 675],
  'multimedia-room.webp': [1200, 675],
  'undergraduate-clinic.webp': [1200, 675],
  // New.
  'coffee-shop.webp': [1200, 675],
  'oral-biology-lab.webp': [1200, 675],
  'prosthodontic-lab.webp': [1200, 675],
  'research-hub.webp': [1200, 675],
  'tutorial-rooms.webp': [1200, 675],
  'xray-cssd-training.webp': [1200, 675],
  'plaster-room.webp': [1200, 675],
}
const FILES = Object.keys(SIZES)

/** The six the college did not re-shoot, at their approved sizes. */
const UNCHANGED: Record<string, [number, number]> = {
  'postgraduate-clinic.webp': [1200, 900],
  'students-mixed-common-room.webp': [1200, 800],
  'lecture-rooms.webp': [1200, 800],
  'library.webp': [1200, 800],
  'canteen-restaurant.webp': [1200, 750],
  'oman-dental-college-parking.webp': [1200, 675],
}

/** Everything shot again or shot fresh: all native 16:9. */
const LANDSCAPE = FILES.filter((f) => !(f in UNCHANGED))

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

  it('counts twenty-four destination cards across sixteen files', () => {
    expect(withPhoto).toHaveLength(24)
    expect(new Set(withPhoto.map((l) => l.image)).size).toBe(16)
    expect(FILES).toHaveLength(16)
  })

  it('gives every one of them real alternative text', () => {
    for (const l of withPhoto) {
      expect(l.imageAlt, `${l.id} alt`).toBe(EXPECTED.get(l.id))
      expect(l.imageAlt!.trim().length, `${l.id} alt is not empty`).toBeGreaterThan(10)
      expect(l.imagePosition, `${l.id} crop`).toMatch(/%|center|top|bottom|left|right/)
    }
  })

  it('shares one asset across the four lecture rooms', () => {
    const lectures = withPhoto.filter((l) => LECTURE_ROOMS.includes(l.id))
    expect(lectures).toHaveLength(4)
    expect(new Set(lectures.map((l) => l.image)).size).toBe(1)
    const shared = lectures[0].image
    expect(withPhoto.filter((l) => l.image === shared).map((l) => l.id).sort()).toEqual(
      [...LECTURE_ROOMS].sort(),
    )
  })

  it('shares another across Tutorial Rooms A to F', () => {
    const tutorials = withPhoto.filter((l) => TUTORIAL_ROOMS.includes(l.id))
    expect(tutorials).toHaveLength(6)
    expect(new Set(tutorials.map((l) => l.image)).size).toBe(1)
    const shared = tutorials[0].image
    expect(withPhoto.filter((l) => l.image === shared).map((l) => l.id).sort()).toEqual(
      [...TUTORIAL_ROOMS].sort(),
    )
    // The six really are Tutorial Rooms A to F, in the college's order.
    expect(TUTORIAL_ROOMS.map((id) => LOCATIONS.find((l) => l.id === id)!.name)).toEqual([
      'Tutorial Room A',
      'Tutorial Room B',
      'Tutorial Room C',
      'Tutorial Room D',
      'Tutorial Room E',
      'Tutorial Room F',
    ])
  })

  it('keeps the two shared assets to their own rooms', () => {
    const lectureAsset = LOCATIONS.find((l) => l.id === 'f-lecture-1')!.image
    const tutorialAsset = LOCATIONS.find((l) => l.id === 'f-classroom-01')!.image
    expect(lectureAsset).not.toBe(tutorialAsset)
    for (const l of withPhoto) {
      if (l.image === lectureAsset) expect(LECTURE_ROOMS, l.id).toContain(l.id)
      if (l.image === tutorialAsset) expect(TUTORIAL_ROOMS, l.id).toContain(l.id)
    }
    // Every other destination has an asset all to itself.
    const solo = withPhoto.filter(
      (l) => !LECTURE_ROOMS.includes(l.id) && !TUTORIAL_ROOMS.includes(l.id),
    )
    expect(new Set(solo.map((l) => l.image)).size).toBe(solo.length)
    expect(solo).toHaveLength(14)
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
  it('ships all sixteen, and no stray originals', () => {
    expect(existsSync(ASSET_DIR)).toBe(true)
    expect(readdirSync(ASSET_DIR).sort()).toEqual([...FILES].sort())
  })

  it('holds every one at the dimensions the college approved', () => {
    for (const [name, [w, h]] of Object.entries(SIZES)) {
      expect(webpSize(join(ASSET_DIR, name)), name).toEqual([w, h])
    }
  })

  it('gives every new and replaced frame the native 16:9 shape', () => {
    expect(LANDSCAPE).toHaveLength(10)
    for (const name of LANDSCAPE) {
      expect(webpSize(join(ASSET_DIR, name)), name).toEqual([1200, 675])
    }
  })

  it('leaves the six unchanged photographs at their approved sizes', () => {
    for (const [name, size] of Object.entries(UNCHANGED)) {
      expect(webpSize(join(ASSET_DIR, name)), name).toEqual(size)
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

  it('puts every one of them into the production build, and nothing else', () => {
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
    // One built file per asset: a shared photograph is not duplicated.
    expect(built).toHaveLength(FILES.length)
  })

  it('never lets a source photograph or the map reference into the build', () => {
    const dist = join(process.cwd(), 'dist', 'assets')
    if (!existsSync(dist)) return
    const built = readdirSync(dist)
    // The dental chair symbol is drawn as SVG; its reference PNG is a
    // working file and must never be published.
    expect(built.some((f) => f.startsWith('dental-chair-reference'))).toBe(false)
    // No location photograph reaches the build as a JPEG: they are all
    // WebP. The only rasters are the two pieces of chrome, the campus
    // header picture and the college logo, neither of which comes from
    // the photographs folder.
    const rasters = built.filter((f) => /\.(jpe?g|png)$/i.test(f)).sort()
    expect(rasters.map((f) => f.replace(/-[A-Za-z0-9_-]{8}\./, '.'))).toEqual([
      'odc-building.jpg',
      'odc-logo.jpg',
    ])
    // And nothing in the build is named after a source photograph.
    const sourceStems = ['csl', 'coffee-shop', 'plaster-room', 'tutorial-room', 'cafeteria']
    for (const stem of sourceStems) {
      expect(
        rasters.some((f) => f.toLowerCase().startsWith(stem)),
        `${stem} leaked into the build as a raster`,
      ).toBe(false)
    }
  })
})

describe('adding photographs changed nothing else', () => {
  it('leaves both clinics restricted, behind their own desks', () => {
    expect(routeTarget(LOCATIONS.find((l) => l.id === 'g-uc-clinic')!).id).toBe('g-uc-reception')
    expect(routeTarget(LOCATIONS.find((l) => l.id === 'g-pg-clinic')!).id).toBe('g-pc-reception')
  })

  it('leaves every newly photographed room routable as before', () => {
    for (const id of [
      'g-coffee-shop',
      'f-oral-biology',
      'f-prosthodontic',
      'f-research-hub',
      'f-xray-training',
      ...TUTORIAL_ROOMS,
    ]) {
      const l = LOCATIONS.find((x) => x.id === id)!
      expect(routeTarget(l).id, `${id} is not redirected`).toBe(id)
      expect(buildJourney(l), `${id} journey`).not.toBeNull()
    }
  })

  it('keeps the X-ray training room out of the important destinations', () => {
    expect(LOCATIONS.find((l) => l.id === 'f-xray-training')!.primary).toBe(false)
  })

  it('leaves the canteen and the common room routable as before', () => {
    for (const id of ['g-canteen', 'g-students-common', 'f-library', 'f-simulation']) {
      const l = LOCATIONS.find((x) => x.id === id)!
      expect(routeTarget(l).id, `${id} is not redirected`).toBe(id)
      expect(buildJourney(l), `${id} journey`).not.toBeNull()
    }
  })
})

/*
 * The Plaster Room.
 *
 * Promoted from a support space to a destination with its own card and
 * photograph. Its geometry did not move: the same rectangle at wing
 * coordinates a 1889..1953, b 1244..1386, the same label in the same
 * place at the same size, and the same single door at (1921, 1244).
 *
 * That door opens into the CSL rather than onto a corridor, so the walk
 * ends at the CSL and the card says so. `tests/plaster-room.test.ts`
 * holds the routing side of that bargain.
 */
describe('the Plaster Room is a destination now', () => {
  const plasterId = 'f-s-plaster'
  const plaster = () => LOCATIONS.find((l) => l.id === plasterId)!

  it('exists exactly once, as a destination and not as a support space', () => {
    expect(LOCATIONS.filter((l) => l.id === plasterId)).toHaveLength(1)
    expect(locationsOnFloor('first').filter((l) => l.id === plasterId)).toHaveLength(1)
    expect(secondaryOnFloor('first').filter((s) => s.id === plasterId)).toHaveLength(0)
  })

  it('carries its photograph and its own card metadata', () => {
    const room = plaster()
    expect(room.name).toBe('Plaster Room')
    expect(room.shortName).toBe('Plaster Room')
    expect(room.category).toBe('laboratory')
    expect(room.icon).toBe('lab')
    expect(room.imagePosition).toBe('center')
    expect(room.imageAlt).toBe(
      'Workbenches and equipment in the Plaster Room at Oman Dental College',
    )
    expect(room.description).toContain('Clinical Skills Laboratory')
    expect(existsSync(join(ASSET_DIR, 'plaster-room.webp'))).toBe(true)
  })

  it('stays out of the important destinations', () => {
    expect(plaster().primary).toBe(false)
  })

  it('is searchable by the words a visitor would use', () => {
    const keywords = plaster().keywords ?? []
    for (const word of ['plaster', 'casts', 'dental models']) {
      expect(keywords, word).toContain(word)
    }
  })

  it('keeps the geometry, label and door the plan already had', () => {
    const room = plaster()
    expect(room.shape.polys).toHaveLength(1)
    expect(room.shape.polys[0]).toEqual(rect(f1, 1889, 1244, 1953, 1386))
    expect(room.label).toEqual(f1(1921, 1315))
    expect(room.labelSize).toBe(12)
    expect(room.doorMarks).toEqual([f1(1921, 1244)])
    expect(room.door).toEqual(f1(1921, 1244))
  })
})
