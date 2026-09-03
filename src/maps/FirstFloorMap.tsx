/**
 * First floor decoration: the lift lobby where visitors arrive from
 * the Ground Floor, plus the north arrow.
 */

import { FLOOR_BY_ID } from '../data/floors'
import { NorthArrow, StartHere } from './MapDecor'

export function FirstFloorDecor({ layer }: { layer: 'under' | 'over' }) {
  const def = FLOOR_BY_ID.first
  if (layer === 'under') return null
  return (
    <g pointerEvents="none">
      <StartHere at={def.routeOrigin.point} />
      <NorthArrow x={1840} y={556} angle={def.northAngle} />
    </g>
  )
}
