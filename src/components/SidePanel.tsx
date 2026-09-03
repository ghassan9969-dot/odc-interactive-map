import { useRef } from 'react'
import { ChevronLeft, ChevronRight, ListTree, Search } from 'lucide-react'
import { DestinationSearch } from './DestinationSearch'
import { FloorSelector } from './FloorSelector'
import { DestinationList } from './DestinationList'
import { LocationCard } from './LocationCard'
import { RouteInstructions } from './RouteInstructions'
import type { Route } from '../data/routes'
import type { FloorId, Location } from '../data/types'

interface Props {
  floor: FloorId
  selected: Location | null
  route: Route | null
  routeShown: boolean
  floorHint: string | null
  collapsed: boolean
  onToggleCollapsed: (collapsed: boolean) => void
  onFloorChange: (floor: FloorId) => void
  onSelect: (location: Location) => void
  onClearSelection: () => void
  onRoute: () => void
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
 */
export function SidePanel({
  floor,
  selected,
  route,
  routeShown,
  floorHint,
  collapsed,
  onToggleCollapsed,
  onFloorChange,
  onSelect,
  onClearSelection,
  onRoute,
  onHideRoute,
}: Props) {
  const searchRef = useRef<HTMLInputElement | null>(null)

  if (collapsed) {
    return (
      <div className="panel is-collapsed">
        <div className="panel__rail">
          <button
            type="button"
            className="panel__rail-btn panel__rail-btn--primary"
            onClick={() => onToggleCollapsed(false)}
            aria-expanded={false}
            aria-controls="destination-panel"
            aria-label="Show destinations panel"
            title="Show destinations"
          >
            <ListTree size={20} aria-hidden="true" />
            <ChevronRight size={16} aria-hidden="true" />
          </button>

          <button
            type="button"
            className="panel__rail-btn"
            onClick={() => {
              onToggleCollapsed(false)
              window.setTimeout(() => searchRef.current?.focus(), 60)
            }}
            aria-label="Search for a destination"
            title="Search"
          >
            <Search size={20} aria-hidden="true" />
          </button>

          <div className="panel__rail-rule" role="presentation" />

          <FloorSelector value={floor} onChange={onFloorChange} variant="rail" />
        </div>
      </div>
    )
  }

  return (
    <div className="panel" id="destination-panel">
      <div className="panel__head">
        <DestinationSearch onPick={onSelect} inputRef={searchRef} />
        <button
          type="button"
          className="panel__collapse"
          onClick={() => onToggleCollapsed(true)}
          aria-expanded
          aria-controls="destination-panel"
          aria-label="Hide destinations panel to widen the map"
          title="Hide panel"
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
      </div>

      <FloorSelector value={floor} onChange={onFloorChange} />

      {selected ? (
        <section className="panel__details" aria-label={`${selected.name} details`}>
          <button type="button" className="panel__back" onClick={onClearSelection}>
            <ChevronLeft size={17} aria-hidden="true" />
            All destinations
          </button>
          <LocationCard
            location={selected}
            routeShown={routeShown}
            floorHint={floorHint}
            onRoute={onRoute}
          />
          {routeShown && route && (
            <RouteInstructions route={route} target={selected} floor={floor} onHide={onHideRoute} />
          )}
        </section>
      ) : (
        <DestinationList floor={floor} selectedId={null} onSelect={onSelect} />
      )}
    </div>
  )
}
