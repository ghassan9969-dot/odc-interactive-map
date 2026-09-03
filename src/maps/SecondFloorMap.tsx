/**
 * Second floor decoration.
 *
 * The eastern half of this floor plate is unfitted in the as-built
 * drawing — only the structural column grid and the east lift core
 * exist. It is drawn exactly that way: an empty, clearly labelled
 * open area rather than invented rooms.
 */

import { FLOOR_BY_ID } from '../data/floors'
import { toPath } from '../data/geometry'
import { secondOpenShell } from '../data/locations'
import { NorthArrow, StartHere } from './MapDecor'

export function SecondFloorDecor({ layer }: { layer: 'under' | 'over' }) {
  const def = FLOOR_BY_ID.second

  if (layer === 'under') {
    return (
      <g pointerEvents="none">
        <path
          d={toPath(secondOpenShell.poly)}
          fill="#F1F5F6"
          stroke="#D3DFE3"
          strokeWidth={2.5}
          strokeDasharray="14 10"
        />
        {secondOpenShell.columns.map(([x, y], i) => (
          <rect key={i} x={x - 5} y={y - 5} width={10} height={10} rx={1.5} fill="#D7E1E5" />
        ))}
        <text
          x={secondOpenShell.label[0]}
          y={secondOpenShell.label[1] - 14}
          className="shell__label"
          style={{ fontSize: 30 }}
        >
          {secondOpenShell.title}
        </text>
        <text
          x={secondOpenShell.label[0]}
          y={secondOpenShell.label[1] + 16}
          className="shell__label"
          style={{ fontSize: 17, fontWeight: 600 }}
        >
          {secondOpenShell.subtitle}
        </text>
      </g>
    )
  }

  return (
    <g pointerEvents="none">
      <StartHere at={def.routeOrigin.point} />
      <NorthArrow x={1840} y={556} angle={def.northAngle} />
    </g>
  )
}
