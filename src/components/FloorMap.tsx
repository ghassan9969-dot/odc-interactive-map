import { useEffect, useMemo } from 'react'
import { CATEGORIES, FLOOR_BY_ID } from '../data/floors'
import { boundsOf, toPath } from '../data/geometry'
import { circulationOnFloor, locationsOnFloor, secondaryOnFloor } from '../data/locations'
import { pathAsSvg, type Route } from '../data/routes'
import type { FloorId, Location, Pt, SecondarySpace } from '../data/types'
import { useMapTransform } from '../hooks/useMapTransform'
import { MapIcon } from './MapIcon'
import { MapControls } from './MapControls'
import { GroundFloorDecor } from '../maps/GroundFloorMap'
import { FirstFloorDecor } from '../maps/FirstFloorMap'
import { SecondFloorDecor } from '../maps/SecondFloorMap'

interface Props {
  floor: FloorId
  selectedId: string | null
  route: Route | null
  onSelect: (location: Location) => void
  onClearSelection: () => void
  focusTarget: { id: string; nonce: number } | null
}

/** Break a room name onto at most two lines so it fits its polygon. */
function wrapLabel(name: string, maxChars: number): string[] {
  if (name.length <= maxChars) return [name]
  const words = name.split(' ')
  if (words.length === 1) return [name]
  let best = 1
  let bestScore = Infinity
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ').length
    const b = words.slice(i).join(' ').length
    const score = Math.abs(a - b) + Math.max(0, Math.max(a, b) - maxChars) * 3
    if (score < bestScore) {
      bestScore = score
      best = i
    }
  }
  return [words.slice(0, best).join(' '), words.slice(best).join(' ')]
}

/** Muted caption for a support space, wrapped to fit its room. */
function SecondaryLabel({ space }: { space: SecondarySpace }) {
  const size = space.labelSize ?? 13
  const box = boundsOf(space.shape.polys)
  const lines = wrapLabel(space.name, Math.max(6, Math.round(box.w / (size * 0.54))))
  const [lx, ly] = space.label!
  return (
    <text
      x={lx}
      y={ly - ((lines.length - 1) * size * 1.05) / 2}
      className="map__secondary-label"
      style={{ fontSize: size }}
    >
      {lines.map((line, i) => (
        <tspan key={i} x={lx} dy={i === 0 ? 0 : size * 1.05}>
          {line}
        </tspan>
      ))}
    </text>
  )
}

export function FloorMap({
  floor,
  selectedId,
  route,
  onSelect,
  onClearSelection,
  focusTarget,
}: Props) {
  const def = FLOOR_BY_ID[floor]
  const locations = useMemo(() => locationsOnFloor(floor), [floor])
  const secondary = useMemo(() => secondaryOnFloor(floor), [floor])
  const circulation = useMemo(() => circulationOnFloor(floor), [floor])

  const map = useMapTransform(def.width, def.height)
  const { reset, centerOn, fitTo } = map

  // Changing floor always returns the map to its default position.
  useEffect(() => {
    reset()
  }, [floor, reset])

  // A search hit or list click brings the room to the middle of the view.
  useEffect(() => {
    if (!focusTarget) return
    const target = locations.find((l) => l.id === focusTarget.id)
    if (!target) return
    const box = boundsOf(target.shape.polys)
    const cx = box.x + box.w / 2
    const cy = box.y + box.h / 2
    const k = Math.min(1.8, Math.max(1.15, 900 / Math.max(box.w, box.h, 120)))
    centerOn([cx, cy] as Pt, k)
  }, [focusTarget, locations, centerOn])

  // Showing a route frames the whole walk, start marker included. A
  // floor is kept in view around short routes so they stay in context.
  useEffect(() => {
    if (!route) return
    const b = boundsOf([route.points])
    // Never tighter than a good slice of the floor, and never past 1.8x,
    // so the walk always sits in recognisable surroundings.
    const w = Math.max(b.w + 200, def.width * 0.55)
    const h = Math.max(b.h + 200, def.height * 0.55)
    fitTo({ x: b.x + b.w / 2 - w / 2, y: b.y + b.h / 2 - h / 2, w, h }, 1.08, 1.8)
  }, [route, fitTo, def.width, def.height])

  const Decor =
    floor === 'ground' ? GroundFloorDecor : floor === 'first' ? FirstFloorDecor : SecondFloorDecor

  return (
    <>
      <div className="stage__canvas">
        <svg
          ref={map.svgRef}
          viewBox={`0 0 ${def.width} ${def.height}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={`Interactive map of the ${def.name} of Oman Dental College`}
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) onClearSelection()
            map.handlers.onPointerDown(e)
          }}
          onPointerMove={map.handlers.onPointerMove}
          onPointerUp={map.handlers.onPointerUp}
          onPointerCancel={map.handlers.onPointerCancel}
          onPointerLeave={map.handlers.onPointerLeave}
        >
          <defs>
            {/* One shadow, for the selected room only. Every room used
                to carry a filter, which meant an offscreen buffer each
                to recompose on every frame of a gesture. */}
            <filter id="room-lift-strong" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#0c3c46" floodOpacity="0.3" />
            </filter>
            <filter id="plan-shadow" x="-10%" y="-10%" width="130%" height="130%">
              <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#0c3c46" floodOpacity="0.16" />
            </filter>
          </defs>

          <g ref={map.layerRef}>
            {/* --- building envelope ------------------------------ */}
            <path d={toPath(def.outline)} className="map__outline" filter="url(#plan-shadow)" />

            {/* --- circulation floor ------------------------------ */}
            <g>
              {circulation.map((c) =>
                c.polys.map((p, i) => (
                  <path key={`${c.id}-${i}`} d={toPath(p)} className="map__circulation" />
                )),
              )}
              {circulation
                .filter((c) => c.label && c.labelAt)
                .map((c) => (
                  <text key={`${c.id}-t`} x={c.labelAt![0]} y={c.labelAt![1]} className="map__circ-label">
                    {c.label}
                  </text>
                ))}
            </g>

            {/* --- floor-specific decoration under the rooms ------ */}
            <Decor layer="under" />

            {/* --- secondary spaces ------------------------------- */}
            <g>
              {secondary.map((s) => (
                <g key={s.id}>
                  {s.shape.polys.map((p, i) => (
                    <path
                      key={i}
                      d={toPath(p)}
                      className={`map__secondary map__secondary--${s.kind}`}
                    />
                  ))}
                  {s.shape.dividers?.map(([a, b], i) => (
                    <line
                      key={`d${i}`}
                      x1={a[0]}
                      y1={a[1]}
                      x2={b[0]}
                      y2={b[1]}
                      className="map__divider"
                      opacity={0.5}
                    />
                  ))}
                  {s.name && s.label && <SecondaryLabel space={s} />}
                </g>
              ))}
            </g>

            {/* --- destinations ----------------------------------- */}
            <g>
              {locations.map((loc) => {
                const cat = CATEGORIES[loc.category]
                const selected = loc.id === selectedId
                const dimmed = selectedId !== null && !selected
                const size = loc.labelSize ?? 18
                const box = boundsOf(loc.shape.polys)
                // Very tall, very narrow rooms read better with the label
                // turned on its side, the way mall directories do it.
                const upright =
                  loc.shape.polys.every((p) => {
                    const b = boundsOf([p])
                    return b.h > b.w * 5
                  }) && box.h > 140
                const maxChars = Math.max(7, Math.round((upright ? box.h : box.w) / (size * 0.54)))
                let lines = wrapLabel(loc.name, maxChars)
                // Long names fall back to the short form rather than spilling
                // outside their room.
                if (lines.some((l) => l.length > maxChars * 1.15)) {
                  lines = wrapLabel(loc.shortName, maxChars)
                }
                const showIcon = !upright && size >= 15 && box.h > size * 3
                const iconSize = Math.min(size * 1.7, box.h * 0.42)
                const textTop = showIcon ? loc.label[1] + size * 0.62 : loc.label[1] - ((lines.length - 1) * size) / 2

                return (
                  <g
                    key={loc.id}
                    className={`room${selected ? ' is-selected' : ''}${dimmed ? ' is-dimmed' : ''}`}
                    role="button"
                    tabIndex={0}
                    aria-label={`${loc.name}, ${cat.label}, ${def.name}`}
                    aria-pressed={selected}
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelect(loc)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onSelect(loc)
                      }
                    }}
                    transform={selected ? 'translate(0 -3)' : undefined}
                    filter={selected ? 'url(#room-lift-strong)' : undefined}
                  >
                    {loc.shape.polys.map((p, i) => (
                      <path
                        key={i}
                        d={toPath(p)}
                        className="room__shape"
                        fill={selected ? cat.fill : cat.fill}
                        stroke={selected ? '#E4761B' : cat.stroke}
                      />
                    ))}
                    {loc.shape.dividers?.map(([a, b], i) => (
                      <line
                        key={`d${i}`}
                        x1={a[0]}
                        y1={a[1]}
                        x2={b[0]}
                        y2={b[1]}
                        className="map__divider"
                      />
                    ))}
                    {loc.shape.polys.map((p, i) => (
                      <path key={`f${i}`} d={toPath(p)} className="room__focus" fill="none" />
                    ))}
                    {showIcon && (
                      <MapIcon
                        type={loc.icon}
                        x={loc.label[0]}
                        y={loc.label[1] - size * 0.95}
                        size={iconSize}
                        color={cat.text}
                        opacity={0.9}
                        strokeWidth={2}
                      />
                    )}
                    <text
                      x={loc.label[0]}
                      y={textTop}
                      className="room__label"
                      fill={cat.text}
                      style={{ fontSize: size }}
                      transform={
                        upright ? `rotate(-90 ${loc.label[0]} ${loc.label[1]})` : undefined
                      }
                    >
                      {lines.map((line, i) => (
                        <tspan key={i} x={loc.label[0]} dy={i === 0 ? 0 : size * 1.05}>
                          {line}
                        </tspan>
                      ))}
                    </text>
                  </g>
                )
              })}
            </g>

            {/* --- navigation route ------------------------------- */}
            {route && (
              <g pointerEvents="none">
                <path d={pathAsSvg(route.points)} className="map__route-halo" />
                <path d={pathAsSvg(route.points)} className="map__route" />
                <path d={pathAsSvg(route.points)} className="map__route-flow" />
                <g transform={`translate(${route.start[0]} ${route.start[1]})`}>
                  <circle r={17} fill="#fff" opacity={0.95} />
                  <circle r={13} fill="#E4761B" />
                  <circle r={5.5} fill="#fff" />
                </g>
                <g transform={`translate(${route.end[0]} ${route.end[1]})`}>
                  <path
                    d="M0 4 C -13 -8, -18 -18, -18 -25 A 18 18 0 1 1 18 -25 C 18 -18, 13 -8, 0 4 Z"
                    fill="#E4761B"
                    stroke="#fff"
                    strokeWidth={3.5}
                  />
                  <circle cx={0} cy={-25} r={6.5} fill="#fff" />
                </g>
              </g>
            )}

            {/* --- floor-specific decoration over the rooms -------- */}
            <Decor layer="over" />
          </g>
        </svg>
      </div>

      <div className="floor-badge">
        <span className="floor-badge__level" aria-hidden="true">
          {def.level}
        </span>
        <span>
          <span className="floor-badge__name">{def.name}</span>
          <br />
          <span className="floor-badge__sub">Oman Dental College</span>
        </span>
      </div>

      <MapControls
        scale={map.transform.k}
        readoutRef={map.zoomLabelRef}
        onZoomIn={map.zoomIn}
        onZoomOut={map.zoomOut}
        onFit={map.reset}
        onReset={() => {
          map.reset()
          onClearSelection()
        }}
      />
    </>
  )
}
