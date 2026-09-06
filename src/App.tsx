import { useCallback, useEffect, useState } from 'react'
import { Header } from './components/Header'
import { CampusIntroduction } from './components/CampusIntroduction'
import { FloorMap } from './components/FloorMap'
import { MapLegend } from './components/MapLegend'
import { SidePanel } from './components/SidePanel'
import { FLOOR_BY_ID } from './data/floors'
import { buildJourney, floorChangeHint, type Journey } from './data/routes'
import type { FloorId, ListScope, Location } from './data/types'

export default function App() {
  // The map always draws one real floor. The list is scoped
  // separately, so the combined view can survive the map moving to
  // whichever floor a chosen destination happens to be on.
  const [floor, setFloor] = useState<FloorId>('ground')
  const [scope, setScope] = useState<ListScope>('ground')
  const [selected, setSelected] = useState<Location | null>(null)
  const [journey, setJourney] = useState<Journey | null>(null)
  const [legIndex, setLegIndex] = useState(0)
  const [focusTarget, setFocusTarget] = useState<{ id: string; nonce: number } | null>(null)
  const [panelCollapsed, setPanelCollapsed] = useState(false)

  const endNavigation = useCallback(() => {
    setJourney(null)
    setLegIndex(0)
  }, [])

  /**
   * Choosing a tab by hand clears the card and any active navigation.
   *
   * A floor tab moves the map with it. The combined tab does not: it
   * only changes what is listed, leaving the visitor looking at the
   * same plan they were already reading.
   */
  const changeScope = useCallback(
    (next: ListScope) => {
      setScope(next)
      if (next !== 'all') setFloor(next)
      setSelected(null)
      setFocusTarget(null)
      endNavigation()
    },
    [endNavigation],
  )

  const selectLocation = useCallback(
    (location: Location, options: { center?: boolean } = {}) => {
      // Browsing shows the destination on its own floor; the walk from
      // the kiosk only starts when "How to get there" is pressed. The
      // list scope is deliberately left alone: picking a First Floor
      // room out of the combined list must not close the combined list.
      setFloor(location.floor)
      setSelected(location)
      endNavigation()
      // The details live in the side panel, so it has to be open to see them.
      setPanelCollapsed(false)
      if (options.center !== false) {
        setFocusTarget((prev) => ({ id: location.id, nonce: (prev?.nonce ?? 0) + 1 }))
      }
    },
    [endNavigation],
  )

  const clearSelection = useCallback(() => {
    setSelected(null)
    setFocusTarget(null)
    endNavigation()
  }, [endNavigation])

  /** Start navigating from the kiosk at the Patient Entrance. */
  const showRoute = useCallback(() => {
    if (!selected) return
    const next = buildJourney(selected)
    if (!next) return
    setJourney(next)
    setLegIndex(0)
    setFloor(next.legs[0].floor)
  }, [selected])

  const goToLeg = useCallback(
    (index: number) => {
      if (!journey || !journey.legs[index]) return
      setLegIndex(index)
      setFloor(journey.legs[index].floor)
    },
    [journey],
  )

  /** Hiding the route ends navigation but keeps the destination in view. */
  const hideRoute = useCallback(() => {
    endNavigation()
    if (selected) setFloor(selected.floor)
  }, [endNavigation, selected])

  /** Escape closes the card and hides any route. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') clearSelection()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [clearSelection])

  const activeLeg = journey?.legs[legIndex] ?? null
  const routeOnThisFloor = activeLeg && activeLeg.floor === floor ? activeLeg.route : null

  return (
    <div className="app">
      <Header />
      <CampusIntroduction />

      <main className="workspace">
        <SidePanel
          scope={scope}
          selected={selected}
          journey={journey}
          legIndex={legIndex}
          floorHint={selected && !journey ? floorChangeHint(selected) : null}
          collapsed={panelCollapsed}
          onToggleCollapsed={setPanelCollapsed}
          onScopeChange={changeScope}
          onSelect={(loc) => selectLocation(loc)}
          onClearSelection={clearSelection}
          onRoute={showRoute}
          onGoToLeg={goToLeg}
          onHideRoute={hideRoute}
        />

        {/* Labelled by the floor it is actually drawing. It cannot take
            its name from the selected tab any more: the combined tab
            names no floor at all. */}
        <section className="stage" id="floor-map-panel" aria-label={`${FLOOR_BY_ID[floor].name} map`}>
          <FloorMap
            floor={floor}
            selectedId={selected?.id ?? null}
            route={routeOnThisFloor}
            onSelect={(loc) => selectLocation(loc, { center: false })}
            onClearSelection={clearSelection}
            focusTarget={focusTarget}
          />

          <MapLegend />
        </section>
      </main>

      <p className="visually-hidden" aria-live="polite">
        {journey
          ? `Step ${legIndex + 1} of ${journey.legs.length}: ${journey.legs[legIndex].title}, on the ${floor} floor.`
          : selected
            ? `${selected.name} selected on the ${floor} floor.`
            : 'No destination selected.'}
      </p>
    </div>
  )
}
