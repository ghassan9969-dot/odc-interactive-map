import { Info, Lock, Navigation } from 'lucide-react'
import { CATEGORIES, FLOOR_BY_ID, roomPaint } from '../data/floors'
import type { Location } from '../data/types'
import { UiMapIcon } from './MapIcon'

interface Props {
  location: Location
  /** When a route is on screen the route panel owns the "Hide route" button. */
  routeShown: boolean
  floorHint: string | null
  onRoute: () => void
}

export function LocationCard({ location, routeShown, floorHint, onRoute }: Props) {
  const cat = CATEGORIES[location.category]
  const paint = roomPaint(location)
  const floor = FLOOR_BY_ID[location.floor]

  return (
    <div className="card">
      <div className="card__head">
        <span className="card__icon" style={{ background: paint.fill, color: paint.icon }} aria-hidden="true">
          <UiMapIcon type={location.icon} size={22} />
        </span>
        <div className="card__title">
          <h3>{location.name}</h3>
          <p className="card__meta">
            <span className="card__floor">{floor.name}</span> · {cat.label}
          </p>
        </div>
      </div>

      <p className="card__body">{location.description}</p>

      {location.restricted && (
        <div className="card__restricted">
          <Lock size={16} aria-hidden="true" style={{ flex: '0 0 auto', marginTop: 2 }} />
          <div>
            <strong>{location.restricted.title}</strong>
            <span>{location.restricted.message}</span>
          </div>
        </div>
      )}

      {floorHint && (
        <p className="card__note">
          <Info size={16} aria-hidden="true" style={{ flex: '0 0 auto', marginTop: 1 }} />
          <span>{floorHint}</span>
        </p>
      )}

      {!routeShown && (
        <div className="card__actions">
          <button type="button" className="btn btn--primary" onClick={onRoute}>
            <Navigation size={17} aria-hidden="true" />
            How to get there
          </button>
        </div>
      )}
    </div>
  )
}
