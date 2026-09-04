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
/* Behind the east side of the college, as shown in the site photo and */
/* the user's marked-up reference. It stays compact so the floor plan   */
/* remains the subject of the drawing.                                 */
/* ------------------------------------------------------------------ */

const PARK = { x0: 1950, y0: 1130, x1: 2170, y1: 1380 }
/** Shaded canopy over a few representative bays. */
const CANOPY = { x0: 1972, y0: 1190, x1: 2148, y1: 1340 }
const BAY_COUNT = 5

function CarPark() {
  const bayStep = (CANOPY.x1 - CANOPY.x0) / BAY_COUNT
  const [inX, inY] = g(1990, PARK.y1)
  const [outX, outY] = g(2130, PARK.y1)
  const roadStart = g(1500, 1492)
  const roadBend = g(1840, 1510)
  const roadEnd = g(1990, PARK.y1 + 14)

  return (
    <g pointerEvents="none" className="park">
      {/* Short approach road from the south facade, curving east. */}
      <path
        d={`M${roadStart[0]} ${roadStart[1]} C${roadStart[0] + 120} ${roadStart[1] + 30}, ${roadBend[0] - 90} ${roadBend[1] + 18}, ${roadBend[0]} ${roadBend[1]} S${roadEnd[0] - 50} ${roadEnd[1]}, ${roadEnd[0]} ${roadEnd[1]}`}
        className="park__road"
      />

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
        const [x1, y1] = g(x, CANOPY.y0 + 8)
        const [x2, y2] = g(x, CANOPY.y1 - 8)
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className="park__bay" />
      })}

      {/* P badge and name */}
      <g transform={`translate(${g(PARK.x0 + 24, 1154).join(' ')})`}>
        <rect x={-13} y={-13} width={26} height={26} rx={7} className="park__badge" />
        <text x={0} y={7} className="park__badge-text">
          P
        </text>
      </g>
      {/* Entry and exit both sit on the lower side of the plot. */}
      <g className="park__flow">
        <path d={`M${inX} ${inY + 34} L${inX} ${inY + 6}`} markerEnd="url(#park-arrow)" />
        <text x={inX} y={inY + 52} className="park__flow-label">
          Parking Entrance
        </text>
      </g>

      <g className="park__flow">
        <path d={`M${outX} ${outY + 6} L${outX} ${outY + 34}`} markerEnd="url(#park-arrow)" />
        <text x={outX} y={outY + 52} className="park__flow-label">
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
      {/* The wing's two external exits: one at the head of the top
          row beside the laboratory, one by the toilets at the far end. */}
      <EntranceMarker at={w(161, 2)} facing="north" />
      <EntranceMarker at={w(885, 2)} facing="north" />
      {def.youAreHere && <YouAreHere at={def.youAreHere.point} />}
      <NorthArrow x={g(1560, 660)[0]} y={g(1560, 660)[1]} angle={def.northAngle} />
    </g>
  )
}
