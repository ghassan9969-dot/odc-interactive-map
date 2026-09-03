/**
 * Ground floor decoration: the landscaped courtyard held inside the
 * dog-leg plan, the two building entrances, the "You Are Here" marker
 * at the patient entrance, and the north arrow.
 */

import { FLOOR_BY_ID } from '../data/floors'
import { g, poly, toPath } from '../data/geometry'
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
      <EntranceMarker at={g(184, 1142)} facing="west" />
      <EntranceMarker at={g(1501, 1492)} facing="south" />
      {def.youAreHere && <YouAreHere at={def.youAreHere.point} />}
      <NorthArrow x={g(1560, 660)[0]} y={g(1560, 660)[1]} angle={def.northAngle} />
    </g>
  )
}
