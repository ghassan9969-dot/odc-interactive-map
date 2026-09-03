/**
 * Shared map furniture: the "You Are Here" marker, entrance flags and
 * the north arrow. Everything is drawn in SVG user units so it scales
 * with the plan.
 */

import type { Pt } from '../data/types'

export function YouAreHere({ at }: { at: Pt }) {
  return (
    <g transform={`translate(${at[0]} ${at[1]})`}>
      <circle r={30} fill="#087E92" opacity={0.18} className="pulse-ring" />
      <circle r={30} fill="#087E92" opacity={0.14} className="pulse-ring" style={{ animationDelay: '0.7s' }} />
      <path
        d="M0 8 C -16 -10, -23 -22, -23 -31 A 23 23 0 1 1 23 -31 C 23 -22, 16 -10, 0 8 Z"
        fill="#087E92"
        stroke="#ffffff"
        strokeWidth={4.5}
      />
      <circle cx={0} cy={-31} r={8.5} fill="#ffffff" />
      <g transform="translate(56 36)">
        <rect x={-92} y={-16} width={184} height={32} rx={16} fill="#087E92" />
        <text className="yah__label" y={1}>
          YOU ARE HERE
        </text>
      </g>
    </g>
  )
}

const FACING: Record<string, { dx: number; dy: number; rot: number }> = {
  west: { dx: -34, dy: 0, rot: 0 },
  south: { dx: 0, dy: 34, rot: 90 },
  east: { dx: 34, dy: 0, rot: 180 },
  north: { dx: 0, dy: -34, rot: 270 },
}

export function EntranceMarker({
  at,
  facing,
}: {
  at: Pt
  facing: 'west' | 'south' | 'east' | 'north'
}) {
  const f = FACING[facing]
  return (
    <g transform={`translate(${at[0]} ${at[1]})`}>
      <g transform={`translate(${f.dx} ${f.dy}) rotate(${f.rot})`}>
        <circle r={19} fill="#ffffff" stroke="#087E92" strokeWidth={3.5} />
        <path
          d="M-8 0 L6 0 M0 -7 L7 0 L0 7"
          fill="none"
          stroke="#087E92"
          strokeWidth={3.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </g>
  )
}

export function NorthArrow({ x, y, angle = 0 }: { x: number; y: number; angle?: number }) {
  return (
    <g transform={`translate(${x} ${y})`} opacity={0.8}>
      <circle r={38} fill="#ffffff" stroke="#CBDDE1" strokeWidth={2.5} />
      <g transform={`rotate(${angle})`}>
        <path d="M0 -26 L9 6 L0 -1 L-9 6 Z" fill="#087E92" />
      </g>
      <text
        x={0}
        y={22}
        textAnchor="middle"
        style={{ fontSize: 17, fontWeight: 700, fill: '#5D7681' }}
      >
        N
      </text>
    </g>
  )
}

/** Marks where a route starts on the upper floors: the lift lobby. */
export function StartHere({ at }: { at: Pt }) {
  return (
    <g transform={`translate(${at[0]} ${at[1]})`}>
      <circle r={20} fill="#087E92" opacity={0.18} className="pulse-ring" />
      <circle r={13} fill="#ffffff" stroke="#087E92" strokeWidth={3.5} />
      <circle r={5.5} fill="#087E92" />
    </g>
  )
}
