# Oman Dental College — Visitor Map

An interactive indoor wayfinding directory for Oman Dental College, in the style of a
modern shopping-mall directory board. Built for a landscape iPad on the reception desk,
and equally usable on desktop and laptop screens.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production bundle in dist/
npm run preview
```

React 18 · TypeScript · Vite · inline SVG maps · Lucide React icons · plain CSS.
No backend, no database, no external map provider.

---

## Where the maps come from

The three floor maps are **redrawn** from the as-built architectural drawings supplied
with the project. The PDFs stay on the local machine and are excluded from version
control (see `.gitignore`) — they carry the consultant's and contractor's details,
signatures and stamps:

| Sheet | Floor |
| --- | --- |
| `OG-ODC-CVL-AB-ARCH-16-A` | Ground floor |
| `OG-ODC-CVL-AB-ARCH-16-B` | First floor |
| `OG-ODC-CVL-AB-ARCH-16-C` | Second floor |

Every room name and every room position in `src/data/` was taken from those sheets:
the text labels were extracted from the PDFs with their exact page coordinates, and the
wall lines were traced from high-resolution renders of each sheet. Nothing on the maps is
invented — where the drawing shows an unfitted shell (the eastern half of the second
floor) the map shows an empty, labelled open area rather than made-up rooms.

The drawings themselves are never displayed. All the construction information —
grids, dimensions, revision tables, title blocks, frame references, contractor stamps,
structural markers — is stripped, and each floor is redrawn as clean vector geometry.

### Coordinate system

`src/data/geometry.ts` holds one transform per floor that maps drawing points (PDF
points on the A0 sheet) into that floor's SVG viewBox. The ground floor's north-west
wing sits at about 21° to the building grid, so it has its own local frame
(`wingPt` / `w` / `wRect`) in which the consulting bays stay parallel to the real walls.

### What the drawings do not contain

The brief asked for an *Examination Hall / Examination Room* on the first floor. No room
with that name exists on sheet `-16-B`. Rather than invent one, the map shows what the
drawing actually has: the four tiered **Lecture Rooms** (which are the college's large
assessment venues) and **Classrooms 01–06**. Both are searchable under "exam".

---

## Structure

```
src/
  components/     Header, CampusIntroduction, FloorSelector, DestinationSearch,
                  DestinationList, FloorMap, MapControls, LocationCard,
                  RouteInstructions, MapLegend, MapIcon
  maps/           GroundFloorMap, FirstFloorMap, SecondFloorMap  (per-floor decoration:
                  courtyard, open shell, entrances, You-Are-Here, north arrow)
                  MapDecor  (shared map furniture)
  data/           types, geometry, floors, ground, first, second, locations, routes
  hooks/          useMapTransform  (pan, wheel zoom, pinch zoom, clamping)
  assets/         logo/, campus/
```

Each destination in `src/data/{ground,first,second}.ts` carries an id, name, short name,
floor, category, description, icon, SVG polygon(s), label position, door point and the
corridor node it is entered from.

## How routing works

Each floor has a small graph whose nodes sit on the centre line of a real corridor and
whose edges only join corridor segments that are genuinely connected
(`groundNodes` / `groundEdges` and the equivalents for the upper floors). A route is a
Dijkstra shortest path over that graph, so it follows corridors by construction and
never crosses a wall or cuts through a room — the only off-corridor step is the last one,
from the corridor into the chosen room's door.

Ground-floor routes start at the **Patient Entrance** (which also carries the
"You Are Here" marker). First- and second-floor routes start at the **L1 / L2 lift
lobby**, and the information card tells the visitor to take the lift first.

## Categories and colour

The palette is built from the teal in the college logo (`#087E92`).

| Category | Use |
| --- | --- |
| Clinical Services | clinics, imaging, CSSD, waiting areas |
| Learning Spaces | library, classrooms, lecture rooms, lounges |
| Laboratories | oral biology, research, prosthodontic labs |
| Food & Refreshments | coffee shop, canteen |
| Administration | dean, finance, doctors' offices, meeting rooms |
| Reception & Information | entrances and reception desks |
| Secondary Facilities | toilets, stores, plant and staff-only support rooms |

Secondary facilities are drawn in light neutral grey, carry no icons, are never listed as
destinations and have no information cards — they exist so the plan still reads correctly.

## Accessibility

Keyboard-operable floor tabs (arrow keys, Home/End), focusable and Enter/Space-activated
rooms on the map, a labelled search combobox with arrow-key results, visible focus rings,
44px minimum touch targets, semantic headings, descriptive image alt text, a live region
announcing the current selection, and full `prefers-reduced-motion` support.

## Deployment

The site is entirely static — no backend, no database, no API calls — so the contents of
`dist/` can be served by any static host.

`.github/workflows/deploy.yml` publishes it to **GitHub Pages** on every push to `main`:
it installs, type-checks, builds, then uploads `dist/` as the Pages artifact.

One-time setup in the repository: **Settings → Pages → Build and deployment → Source**,
choose **GitHub Actions**.

Asset paths are relative (`base: './'` in `vite.config.ts`), so the same build works
unchanged at a project URL such as `https://<user>.github.io/<repo>/`, at a user site,
or behind a custom domain.
