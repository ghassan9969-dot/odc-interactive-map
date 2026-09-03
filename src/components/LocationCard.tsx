import { Info, Navigation, X } from 'lucide-react'
import { CATEGORIES, FLOOR_BY_ID } from '../data/floors'
import type { Location } from '../data/types'
import { UiMapIcon } from './MapIcon'

interface Props {
  location: Location
  routeShown: boolean
  floorHint: string | null
  onClose: () => void
  onRoute: () => void
  onHideRoute: () => void
}

export function LocationCard({
  location,
  routeShown,
  floorHint,
  onClose,
  onRoute,
  onHideRoute,
}: Props) {
  const cat = CATEGORIES[location.category]
  const floor = FLOOR_BY_ID[location.floor]
  return (
    <aside className="card" aria-label={`${location.name} information`}>
      <div className="card__head">
        <span className="card__icon" style={{ background: cat.fill, color: cat.text }} aria-hidden="true">
          <UiMapIcon type={location.icon} size={22} />
        </span>
        <div className="card__title">
          <h3>{location.name}</h3>
          <p className="card__meta">
            <span className="card__floor">{floor.name}</span> · {cat.label}
          </p>
        </div>
        <button type="button" className="card__close" onClick={onClose} aria-label="Close information card">
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <p className="card__body">{location.description}</p>

      {floorHint && (
        <p className="card__note">
          <Info size={16} aria-hidden="true" style={{ flex: '0 0 auto', marginTop: 1 }} />
          <span>{floorHint}</span>
        </p>
      )}

      <div className="card__actions">
        {routeShown ? (
          <button type="button" className="btn btn--ghost" onClick={onHideRoute}>
            Hide route
          </button>
        ) : (
          <button type="button" className="btn btn--primary" onClick={onRoute}>
            <Navigation size={17} aria-hidden="true" />
            How to get there
          </button>
        )}
      </div>
    </aside>
  )
}
