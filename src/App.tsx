import { useCallback, useEffect, useState } from 'react'
import { Header } from './components/Header'
import { CampusIntroduction } from './components/CampusIntroduction'
import { FloorMap } from './components/FloorMap'
import { MapLegend } from './components/MapLegend'
import { SidePanel } from './components/SidePanel'
import { buildRoute, floorChangeHint, type Route } from './data/routes'
import type { FloorId, Location } from './data/types'

export default function App() {
  const [floor, setFloor] = useState<FloorId>('ground')
  const [selected, setSelected] = useState<Location | null>(null)
  const [route, setRoute] = useState<Route | null>(null)
  const [focusTarget, setFocusTarget] = useState<{ id: string; nonce: number } | null>(null)
  const [panelCollapsed, setPanelCollapsed] = useState(false)

  /** Changing floor clears the previous card and route. */
  const changeFloor = useCallback((next: FloorId) => {
    setFloor(next)
    setSelected(null)
    setRoute(null)
    setFocusTarget(null)
  }, [])

  const selectLocation = useCallback(
    (location: Location, options: { center?: boolean } = {}) => {
      if (location.floor !== floor) {
        setFloor(location.floor)
        setRoute(null)
      } else if (route && route !== null) {
        setRoute(null)
      }
      setSelected(location)
      // The details live in the side panel, so it has to be open to see them.
      setPanelCollapsed(false)
      if (options.center !== false) {
        setFocusTarget((prev) => ({ id: location.id, nonce: (prev?.nonce ?? 0) + 1 }))
      }
    },
    [floor, route],
  )

  const clearSelection = useCallback(() => {
    setSelected(null)
    setRoute(null)
    setFocusTarget(null)
  }, [])

  const showRoute = useCallback(() => {
    if (!selected) return
    setRoute(buildRoute(selected))
  }, [selected])

  /** Escape closes the card and hides any route. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') clearSelection()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [clearSelection])

  const routeIsForSelection = route !== null && selected !== null && selected.floor === floor

  return (
    <div className="app">
      <Header />
      <CampusIntroduction />

      <main className="workspace">
        <SidePanel
          floor={floor}
          selected={selected}
          route={route}
          routeShown={routeIsForSelection}
          floorHint={selected ? floorChangeHint(selected) : null}
          collapsed={panelCollapsed}
          onToggleCollapsed={setPanelCollapsed}
          onFloorChange={changeFloor}
          onSelect={(loc) => selectLocation(loc)}
          onClearSelection={clearSelection}
          onRoute={showRoute}
          onHideRoute={() => setRoute(null)}
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
            route={routeIsForSelection ? route : null}
            onSelect={(loc) => selectLocation(loc, { center: false })}
            onClearSelection={clearSelection}
            focusTarget={focusTarget}
          />

          <MapLegend />
        </section>
      </main>

      <p className="visually-hidden" aria-live="polite">
        {selected
          ? `${selected.name} selected on the ${floor} floor.`
          : 'No destination selected.'}
      </p>
    </div>
  )
}
