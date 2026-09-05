/**
 * Ground floor decoration: the landscaped courtyard held inside the
 * dog-leg plan, the car park east of the building with its access road
 * and gates, the building entrances and clinic exits, the "You Are Here"
 * marker at the patient entrance, and the north arrow.
 */

import { FLOOR_BY_ID } from '../data/floors'
import { g, poly, rect, toPath, w } from '../data/geometry'
import { PARKING } from '../data/ground'
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
/* East of the building across a narrow access road. It stays small on  */
/* purpose: the college plan is the subject, and the park only has to   */
/* read as parking, so ten bays stand for the whole capacity.           */
/*                                                                     */
/* The compound is a destination, so its surface, its "P" and its name  */
/* are drawn by the map with every other room. What follows is the      */
/* detail: the fence, the bays and the two gates on the road side.      */
/* ------------------------------------------------------------------ */

const PARK = PARKING
/** The fence, drawn inside the room's own outline so selecting it still shows. */
const FENCE = 10
/**
 * Ten bays, laid across the plot rather than up it, so a car standing
 * in one faces the college. Two columns either side of the aisle, in
 * two blocks with the plot's middle left clear for the name.
 */
const BAY_COLUMNS = [
  [1976, 2106],
  [2136, 2266],
]
const BAY_BLOCKS = [
  { y0: 660, y1: 868, rows: 4 },
  { y0: 1100, y1: 1308, rows: 4 },
]
/**
 * The gate names sit inside the compound, set in from its east wall so
 * the floating zoom controls never cover them on a landscape screen.
 */
const LABEL_X = PARK.x1 - 74

function BayBlock({ x0, x1, y0, y1, rows }: { x0: number; x1: number; y0: number; y1: number; rows: number }) {
  const step = (y1 - y0) / rows
  return (
    <g>
      <path d={toPath(rect(g, x0, y0, x1, y1))} className="park__rank" />
      {Array.from({ length: rows - 1 }, (_, i) => {
        const y = y0 + step * (i + 1)
        const [ax, ay] = g(x0, y)
        const [bx, by] = g(x1, y)
        return <line key={i} x1={ax} y1={ay} x2={bx} y2={by} className="park__bay" />
      })}
    </g>
  )
}

function CarPark() {
  return (
    <g pointerEvents="none" className="park">
      <path
        d={toPath(rect(g, PARK.x0 + FENCE, PARK.y0 + FENCE, PARK.x1 - FENCE, PARK.y1 - FENCE))}
        className="park__fence"
      />

      {BAY_BLOCKS.flatMap((b, i) =>
        BAY_COLUMNS.map(([x0, x1], c) => (
          <BayBlock key={`${i}-${c}`} x0={x0} x1={x1} y0={b.y0} y1={b.y1} rows={b.rows} />
        )),
      )}

      {/* In near the top of the road side, out near the foot. */}
      <g className="park__flow">
        <path
          d={`M${g(PARK.roadX, PARK.gateInY).join(' ')} L${g(PARK.x1 - 26, PARK.gateInY).join(' ')}`}
          markerEnd="url(#park-arrow)"
        />
        <text
          x={g(LABEL_X, PARK.gateInY - 34)[0]}
          y={g(LABEL_X, PARK.gateInY - 34)[1]}
          className="park__flow-label"
        >
          Parking Entrance
        </text>
      </g>
      <g className="park__flow">
        <path
          d={`M${g(PARK.x1 - 26, PARK.gateOutY).join(' ')} L${g(PARK.roadX, PARK.gateOutY).join(' ')}`}
          markerEnd="url(#park-arrow)"
        />
        <text
          x={g(LABEL_X, PARK.gateOutY + 38)[0]}
          y={g(LABEL_X, PARK.gateOutY + 38)[1]}
          className="park__flow-label"
        >
          Parking Exit
        </text>
      </g>
    </g>
  )
}

/**
 * The outdoor walk to the car park gate, plus the strip in the gap
 * beside the building. The first three are the circulation the route
 * uses; the fourth is drawn only so the gap reads as an access road
 * rather than a bare field.
 */
const ROAD_POLYS = [
  rect(g, 1544, 1450, 1596, 1560),
  rect(g, 1544, 1500, 2360, 1560),
  rect(g, 2316, 600, 2360, 1560),
  rect(g, 1904, 550, PARKING.x0, 1560),
]

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
        {ROAD_POLYS.map((p, i) => (
          <path key={i} d={toPath(p)} className="park__road" />
        ))}
      </g>
    )
  }

  return (
    <g pointerEvents="none">
      <defs>
        <marker id="park-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0 1 L9 5 L0 9 Z" fill="#4A626C" />
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
