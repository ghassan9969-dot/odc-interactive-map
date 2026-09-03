/**
 * Simple pictograms drawn directly in map space.
 *
 * They are authored as 24x24 paths so they can be scaled to any room
 * size, and use `currentColor` so each room's category tint carries
 * through.
 */

import type { IconType } from '../data/types'

const P: Record<IconType, string[]> = {
  reception: [
    'M3 18h18',
    'M5 18v-3a7 7 0 0 1 14 0v3',
    'M12 5.5V4',
    'M12 8a3.5 3.5 0 0 1 3.5 3.5',
  ],
  coffee: ['M5 9h11v5a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5z', 'M16 10h2.5a2 2 0 0 1 0 4H16', 'M8 3v3', 'M12 3v3'],
  restaurant: ['M6 3v8a2 2 0 0 0 4 0V3', 'M8 11v10', 'M16 3c-1.6 1.2-2 3-2 5s.6 3 2 3', 'M16 11v10'],
  clinic: [
    'M12 3.5c-3 0-4.5 1.6-4.5 4 0 3 1.2 5 1.8 8.4.3 1.8.8 3.6 2.7 3.6s2.4-1.8 2.7-3.6c.6-3.4 1.8-5.4 1.8-8.4 0-2.4-1.5-4-4.5-4z',
    'M12 3.6v5',
  ],
  surgery: ['M4 6l9 9', 'M20 6l-9 9', 'M8 20a2.5 2.5 0 1 1 3.2-3.6', 'M16 20a2.5 2.5 0 1 0-3.2-3.6'],
  xray: ['M12 3v18', 'M6 7h12', 'M5 12h14', 'M6 17h12', 'M4 3v18', 'M20 3v18'],
  scan: ['M4 8V5a1 1 0 0 1 1-1h3', 'M16 4h3a1 1 0 0 1 1 1v3', 'M20 16v3a1 1 0 0 1-1 1h-3', 'M8 20H5a1 1 0 0 1-1-1v-3', 'M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z'],
  sterile: ['M12 3l7 3v5c0 4.4-2.9 8.2-7 9.4C7.9 19.2 5 15.4 5 11V6z', 'M9 12l2.2 2.2L15.5 10'],
  waiting: ['M5 17v-5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v5', 'M4 17h16', 'M7 10V7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3', 'M7 17v2', 'M17 17v2'],
  library: ['M4 5.5A2 2 0 0 1 6 4h5v15H6a2 2 0 0 0-2 1.5z', 'M20 5.5A2 2 0 0 0 18 4h-5v15h5a2 2 0 0 1 2 1.5z', 'M12 5v14'],
  classroom: ['M3 6h18v10H3z', 'M7 20h10', 'M12 16v4', 'M7 10h6'],
  lecture: ['M3 18h18', 'M5 18v-3h14v3', 'M6 15V6h12v9', 'M9 9h6', 'M9 12h6'],
  lab: ['M9 3v6.2L4.6 17A2 2 0 0 0 6.3 20h11.4a2 2 0 0 0 1.7-3L15 9.2V3', 'M8 3h8', 'M7.5 14h9'],
  simulation: ['M4 5h16v11H4z', 'M9 20h6', 'M12 16v4', 'M8 9.5h2.5M13.5 9.5H16', 'M9.2 12h5.6'],
  multimedia: ['M3 5h18v11H3z', 'M8 20h8', 'M12 16v4', 'M10.4 8.6l4 2-4 2z'],
  research: ['M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13z', 'M15.2 15.2L21 21', 'M10.5 7.5v6', 'M7.5 10.5h6'],
  lounge: ['M4 12a2 2 0 0 1 4 0v3h8v-3a2 2 0 0 1 4 0v6H4z', 'M7 12V8a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v4', 'M6 18v2', 'M18 18v2'],
  study: ['M5 4h14v16H5z', 'M9 8h6', 'M9 12h6', 'M9 16h3'],
  office: ['M4 20V8l8-4 8 4v12', 'M4 20h16', 'M9 20v-5h6v5', 'M9 11h2M13 11h2'],
  admin: ['M12 4a3.4 3.4 0 1 0 0 6.8A3.4 3.4 0 0 0 12 4z', 'M4.5 20a7.5 7.5 0 0 1 15 0', 'M8 6.5L5 5M16 6.5L19 5'],
  finance: ['M3 7h18v11H3z', 'M3 11h18', 'M7 15h4', 'M7 4h10v3H7z'],
  meeting: ['M12 6.5a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4z', 'M5 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4z', 'M19 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4z', 'M8 20a4 4 0 0 1 8 0', 'M2 17a3.5 3.5 0 0 1 5-3', 'M22 17a3.5 3.5 0 0 0-5-3'],
  boardroom: ['M3 10h18v5H3z', 'M6 15v3M18 15v3M6 7v3M18 7v3', 'M9.5 5.5h5', 'M9.5 19.5h5'],
  students: ['M12 4L2.5 8.5 12 13l9.5-4.5z', 'M6.5 10.5V15c0 1.6 2.5 3 5.5 3s5.5-1.4 5.5-3v-4.5', 'M21.5 8.5V14'],
  doctor: ['M12 3.4a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4z', 'M5 20.5a7 7 0 0 1 14 0', 'M12 12.5v4', 'M10 14.5h4'],
  lift: ['M6 3h12v18H6z', 'M12 3v18', 'M9 9l-1.6 2.4h3.2z', 'M15 15l1.6-2.4h-3.2z'],
  stairs: ['M4 20h4v-4h4v-4h4V8h4', 'M4 20v-4h4', 'M12 12h4V8'],
  entrance: ['M14 3H6v18h8', 'M11 12h9', 'M17 8.5l3.5 3.5L17 15.5'],
  toilet: ['M8 4.6a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6z', 'M5.5 20l1-6H5l1.4-4.2h3.2L11 14H9.5l1 6z', 'M16 4.6a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6z', 'M13.5 15l1.6-5.2h1.8L18.5 15h-2l-.5 5h-2l-.5-5z'],
  prayer: ['M12 4c-3.5 2.5-5.5 5.5-5.5 9 0 4 2.5 7 5.5 7s5.5-3 5.5-7c0-3.5-2-6.5-5.5-9z', 'M12 20V9'],
  store: ['M4 8h16v12H4z', 'M4 8l2-4h12l2 4', 'M10 13h4'],
  utility: ['M14.5 4.5a4 4 0 0 0-5 5L4 15v5h5l5.5-5.5a4 4 0 0 0 5-5l-2.8 2.8-2.2-2.2z'],
  activity: ['M3 12h4l2.5-6 4 13 2.5-7h5'],
  play: ['M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z', 'M9 10.5h.01M15 10.5h.01', 'M9 14.5a4 4 0 0 0 6 0'],
}

interface Props {
  type: IconType
  x: number
  y: number
  size: number
  color?: string
  opacity?: number
  strokeWidth?: number
}

/** Draws a pictogram centred on (x, y) in the current SVG user space. */
export function MapIcon({ type, x, y, size, color = 'currentColor', opacity = 1, strokeWidth = 1.9 }: Props) {
  const s = size / 24
  return (
    <g
      transform={`translate(${x - size / 2} ${y - size / 2}) scale(${s})`}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={opacity}
      pointerEvents="none"
      aria-hidden="true"
    >
      {P[type].map((d, i) => (
        <path key={i} d={d} />
      ))}
    </g>
  )
}

/** Same pictogram, sized for HTML lists and cards. */
export function UiMapIcon({
  type,
  size = 18,
  color = 'currentColor',
}: {
  type: IconType
  size?: number
  color?: string
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <g fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
        {P[type].map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    </svg>
  )
}
