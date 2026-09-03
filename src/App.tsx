import { useCallback, useEffect, useState } from 'react'
import { Header } from './components/Header'
import { CampusIntroduction } from './components/CampusIntroduction'
import { FloorMap } from './components/FloorMap'
import { MapLegend } from './components/MapLegend'
import { SidePanel } from './components/SidePanel'
import { buildJourney, floorChangeHint, type Journey } from './data/routes'
import type { FloorId, Location } from './data/types'

export default function App() {
  const [floor, setFloor] = useState<FloorId>('ground')
  const [selected, setSelected] = useState<Location | null>(null)
  const [journey, setJourney] = useState<Journey | null>(null)
  const [legIndex, setLegIndex] = useState(0)
  const [focusTarget, setFocusTarget] = useState<{ id: string; nonce: number } | null>(null)
  const [panelCollapsed, setPanelCollapsed] = useState(false)

  const endNavigation = useCallback(() => {
    setJourney(null)
    setLegIndex(0)
  }, [])

  /** Switching floor by hand clears the card and any active navigation. */
  const changeFloor = useCallback(
    (next: FloorId) => {
      setFloor(next)
      setSelected(null)
      setFocusTarget(null)
      endNavigation()
    },
    [endNavigation],
  )

  const selectLocation = useCallback(
    (location: Location, options: { center?: boolean } = {}) => {
      // Browsing shows the destination on its own floor; the walk from
      // the kiosk only starts when "How to get there" is pressed.
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
          floor={floor}
          selected={selected}
          journey={journey}
          legIndex={legIndex}
          floorHint={selected && !journey ? floorChangeHint(selected) : null}
          collapsed={panelCollapsed}
          onToggleCollapsed={setPanelCollapsed}
          onFloorChange={changeFloor}
          onSelect={(loc) => selectLocation(loc)}
          onClearSelection={clearSelection}
          onRoute={showRoute}
          onGoToLeg={goToLeg}
          onHideRoute={hideRoute}
        />

        <section
          className="stage"
          id="floor-map-panel"
          role="tabpanel"
          aria-labelledby={`floor-tab-${floor}`}
        >
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
