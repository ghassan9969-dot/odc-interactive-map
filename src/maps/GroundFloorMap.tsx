/**
 * Ground floor decoration: the landscaped courtyard held inside the
 * dog-leg plan, the building entrances and clinic exits, the compact
 * car park behind the college, the "You Are Here" marker at the patient
 * entrance, and the north arrow.
 */

import { FLOOR_BY_ID } from '../data/floors'
import { g, poly, toPath, w } from '../data/geometry'
import { EntranceMarker, NorthArrow, YouAreHere } from './MapDecor'

const COURTYARD = poly(g, [
  [745, 786],
  [905, 712],
  [1212, 510],
  [1900, 510],
  [1900, 992],
  [1790, 992],
  [1790, 1068],
  [745, 1068],
])

/* ------------------------------------------------------------------ */
/* Car park                                                            */
/*                                                                     */
/* Behind the south facade, in the strip of the viewBox left below the  */
/* building. Enough bays to read as parking, and no more: the college   */
/* plan itself stays the subject of the drawing.                       */
/* ------------------------------------------------------------------ */

const PARK = { x0: 1020, y0: 1512, x1: 1620, y1: 1624 }
/** Shaded canopy over the middle of the bays, as on the real forecourt. */
const CANOPY = { x0: 1054, y0: 1548, x1: 1586, y1: 1600 }
const BAY_COUNT = 9

function CarPark() {
  const bayStep = (CANOPY.x1 - CANOPY.x0) / BAY_COUNT
  const [labelX, labelY] = g((PARK.x0 + PARK.x1) / 2, 1534)
  const [inX, inY] = g(PARK.x0 - 6, 1600)
  const [outX, outY] = g(PARK.x1 + 6, 1600)

  return (
    <g pointerEvents="none" className="park">
      {/* canopy */}
      <path d={toPath(poly(g, [
        [CANOPY.x0, CANOPY.y0],
        [CANOPY.x1, CANOPY.y0],
        [CANOPY.x1, CANOPY.y1],
        [CANOPY.x0, CANOPY.y1],
      ]))} className="park__canopy" />

      {/* bays under the canopy */}
      {Array.from({ length: BAY_COUNT - 1 }, (_, i) => {
        const x = CANOPY.x0 + bayStep * (i + 1)
        const [x1, y1] = g(x, CANOPY.y0 + 6)
        const [x2, y2] = g(x, CANOPY.y1 - 6)
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className="park__bay" />
      })}

      {/* P badge and name */}
      <g transform={`translate(${g(PARK.x0 + 52, 1534).join(' ')})`}>
        <rect x={-17} y={-17} width={34} height={34} rx={9} className="park__badge" />
        <text x={0} y={9} className="park__badge-text">
          P
        </text>
      </g>
      <text x={labelX} y={labelY + 8} className="park__label">
        Parking
      </text>

      {/* way in, on the west side */}
      <g className="park__flow">
        <path d={`M${inX - 34} ${inY} L${inX - 6} ${inY}`} markerEnd="url(#park-arrow)" />
        <text x={inX - 20} y={inY - 12} className="park__flow-label">
          Parking Entrance
        </text>
      </g>

      {/* way out, on the east side */}
      <g className="park__flow">
        <path d={`M${outX + 6} ${outY} L${outX + 34} ${outY}`} markerEnd="url(#park-arrow)" />
        <text x={outX + 20} y={outY - 12} className="park__flow-label">
          Parking Exit
        </text>
      </g>
    </g>
  )
}

export function GroundFloorDecor({ layer }: { layer: 'under' | 'over' }) {
  const def = FLOOR_BY_ID.ground

  if (layer === 'under') {
    return (
      <g pointerEvents="none">
        <path
          d={toPath(COURTYARD)}
          fill="#EBF2ED"
          stroke="#D3E2D7"
          strokeWidth={2.5}
          strokeDasharray="12 9"
        />
        <text x={g(1350, 800)[0]} y={g(1350, 800)[1]} className="shell__label" style={{ fontSize: 30 }}>
          Courtyard
        </text>
      </g>
    )
  }

  return (
    <g pointerEvents="none">
      <defs>
        <marker id="park-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0 1 L9 5 L0 9 Z" fill="#8B9AA1" />
        </marker>
      </defs>
      <CarPark />
      <EntranceMarker at={g(184, 1142)} facing="west" />
      <EntranceMarker at={g(1501, 1492)} facing="south" />
      <EntranceMarker at={w(110, 2)} facing="north" />
      <EntranceMarker at={w(885, 2)} facing="north" />
      {def.youAreHere && <YouAreHere at={def.youAreHere.point} />}
      <NorthArrow x={g(1560, 660)[0]} y={g(1560, 660)[1]} angle={def.northAngle} />
    </g>
  )
}
