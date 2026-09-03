import { Footprints, Navigation } from 'lucide-react'
import { FLOOR_BY_ID } from '../data/floors'
import type { Route } from '../data/routes'
import type { FloorId, Location } from '../data/types'

interface Props {
  route: Route
  target: Location
  floor: FloorId
  onHide: () => void
}

/**
 * The plans are drawn at roughly 13 SVG units per metre, and a
 * comfortable indoor walking pace is about 1.3 m/s.
 */
const UNITS_PER_METRE = 12.95

export function RouteInstructions({ route, target, floor, onHide }: Props) {
  const metres = Math.round(route.length / UNITS_PER_METRE)
  const minutes = Math.max(1, Math.round(metres / 1.3 / 60))
  const origin = FLOOR_BY_ID[floor].routeOrigin

  return (
    <section className="route-bar" aria-label={`Walking route to ${target.name}`}>
      <p className="route-bar__head">
        <Navigation size={15} aria-hidden="true" />
        Route to {target.shortName}
      </p>
      <p className="route-bar__from">
        From <strong>{origin.label}</strong> · about {metres} m
        <span aria-hidden="true"> · </span>
        <Footprints size={13} aria-hidden="true" style={{ verticalAlign: '-2px' }} /> {minutes} min walk
      </p>
      <ol className="route-bar__steps">
        {route.steps.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ol>
      <div className="route-bar__actions">
        <button type="button" className="btn btn--ghost" onClick={onHide}>
          Hide route
        </button>
      </div>
    </section>
  )
}
