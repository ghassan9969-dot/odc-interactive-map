import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, ListTree, Search } from 'lucide-react'
import { DestinationSearch } from './DestinationSearch'
import { FloorSelector } from './FloorSelector'
import { DestinationList } from './DestinationList'
import { LocationCard } from './LocationCard'
import { RouteInstructions } from './RouteInstructions'
import type { Journey } from '../data/routes'
import type { FloorId, Location } from '../data/types'

interface Props {
  floor: FloorId
  selected: Location | null
  journey: Journey | null
  legIndex: number
  floorHint: string | null
  collapsed: boolean
  onToggleCollapsed: (collapsed: boolean) => void
  onFloorChange: (floor: FloorId) => void
  onSelect: (location: Location) => void
  onClearSelection: () => void
  onRoute: () => void
  onGoToLeg: (index: number) => void
  onHideRoute: () => void
}

/**
 * The single side panel.
 *
 * Everything that used to float over the map — the destination list,
 * the information card and the route instructions — lives here, so the
 * plan itself is never covered. On a landscape iPad the panel can be
 * collapsed to a narrow rail that still exposes search and the floor
 * buttons, handing the map roughly 230px of extra width.
 *
 * The toggle sits in a bar that is a sibling of the region it controls,
 * never an ancestor of it, so its aria-controls points at a real
 * disclosure target. That target stays in the document while collapsed
 * — empty, so its floor tabs cannot duplicate the rail's ids.
 */
export function SidePanel({
  floor,
  selected,
  journey,
  legIndex,
  floorHint,
  collapsed,
  onToggleCollapsed,
  onFloorChange,
  onSelect,
  onClearSelection,
  onRoute,
  onGoToLeg,
  onHideRoute,
}: Props) {
  const searchRef = useRef<HTMLInputElement | null>(null)
  const routeRef = useRef<HTMLDivElement | null>(null)
  const detailsRef = useRef<HTMLElement | null>(null)
  const [focusSearchOnOpen, setFocusSearchOnOpen] = useState(false)

  // The rail's search button reopens the panel; focus once the expanded
  // markup has actually been committed, rather than guessing with a timer.
  useEffect(() => {
    if (collapsed || !focusSearchOnOpen) return
    searchRef.current?.focus()
    setFocusSearchOnOpen(false)
  }, [collapsed, focusSearchOnOpen])

  // A newly chosen destination starts at the top of its card, rather than
  // wherever the last one was left. Where the panel sits under the map it
  // is the document that scrolls, so the card is brought up to the top of
  // the screen; on desktop the panel returns to its own top. Visitors who
  // have asked for reduced motion get the jump without the animation.
  const selectedId = selected?.id ?? null
  useEffect(() => {
    const el = detailsRef.current
    if (!el || !selectedId) return
    el.scrollTop = 0
    const media = typeof window.matchMedia === 'function' ? window.matchMedia : null
    if (!media || !window.matchMedia('(max-width: 900px)').matches) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' })
  }, [selectedId])

  // Bring the current leg — and its Continue button — into view whenever
  // navigation starts or moves to the next floor. Visitors who have asked
  // for reduced motion get the jump without the animation.
  const legKey = journey ? `${journey.target.id}:${legIndex}` : null
  useEffect(() => {
    if (!legKey) return
    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    routeRef.current?.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' })
  }, [legKey])

  return (
    <div className={collapsed ? 'panel is-collapsed' : 'panel'}>
      <div className={collapsed ? 'panel__top panel__rail' : 'panel__top panel__head'}>
        {!collapsed && <DestinationSearch onPick={onSelect} inputRef={searchRef} />}

        <button
          type="button"
          className={collapsed ? 'panel__rail-btn panel__rail-btn--primary' : 'panel__collapse'}
          onClick={() => onToggleCollapsed(!collapsed)}
          aria-expanded={!collapsed}
          aria-controls="panel-body"
          aria-label={
            collapsed ? 'Show destinations panel' : 'Hide destinations panel to widen the map'
          }
          title={collapsed ? 'Show destinations' : 'Hide panel'}
        >
          {collapsed ? (
            <>
              <ListTree size={20} aria-hidden="true" />
              <ChevronRight size={16} aria-hidden="true" />
            </>
          ) : (
            <ChevronLeft size={20} aria-hidden="true" />
          )}
        </button>

        {collapsed && (
          <>
            <button
              type="button"
              className="panel__rail-btn"
              onClick={() => {
                setFocusSearchOnOpen(true)
                onToggleCollapsed(false)
              }}
              aria-label="Search for a destination"
              title="Search"
            >
              <Search size={20} aria-hidden="true" />
            </button>

            <div className="panel__rail-rule" role="presentation" />

            <FloorSelector value={floor} onChange={onFloorChange} variant="rail" />
          </>
        )}
      </div>

      <div id="panel-body" className="panel__body" hidden={collapsed}>
        {!collapsed && (
          <>
            <FloorSelector value={floor} onChange={onFloorChange} />

            {selected ? (
              <section
                className="panel__details"
                ref={detailsRef}
                aria-label={`${selected.name} details`}
              >
                <button type="button" className="panel__back" onClick={onClearSelection}>
                  <ChevronLeft size={17} aria-hidden="true" />
                  All destinations
                </button>
                <LocationCard
                  location={selected}
                  routeShown={journey !== null}
                  floorHint={floorHint}
                  onRoute={onRoute}
                />
                {journey && (
                  <div ref={routeRef}>
                    <RouteInstructions
                      journey={journey}
                      legIndex={legIndex}
                      onGoToLeg={onGoToLeg}
                      onHide={onHideRoute}
                    />
                  </div>
                )}
              </section>
            ) : (
              <DestinationList floor={floor} selectedId={null} onSelect={onSelect} />
            )}
          </>
        )}
      </div>
    </div>
  )
}
