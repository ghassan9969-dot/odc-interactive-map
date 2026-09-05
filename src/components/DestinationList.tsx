import { useMemo } from 'react'
import { ChevronRight } from 'lucide-react'
import { CATEGORIES, FLOOR_BY_ID, roomPaint } from '../data/floors'
import { locationsOnFloor } from '../data/locations'
import type { FloorId, Location } from '../data/types'
import { UiMapIcon } from './MapIcon'

interface Props {
  floor: FloorId
  selectedId: string | null
  onSelect: (location: Location) => void
}

export function DestinationList({ floor, selectedId, onSelect }: Props) {
  const { primary, more } = useMemo(() => {
    const all = locationsOnFloor(floor)
    return {
      primary: all.filter((l) => l.primary),
      more: all.filter((l) => !l.primary),
    }
  }, [floor])

  const renderItem = (loc: Location) => {
    const cat = CATEGORIES[loc.category]
    const paint = roomPaint(loc)
    return (
      <li key={loc.id}>
        <button
          type="button"
          className="dest-item"
          aria-current={loc.id === selectedId}
          onClick={() => onSelect(loc)}
        >
          <span
            className="dest-item__icon"
            style={{ background: paint.fill, color: paint.icon }}
            aria-hidden="true"
          >
            <UiMapIcon type={loc.icon} size={19} />
          </span>
          <span className="dest-item__text">
            <span className="dest-item__name">{loc.name}</span>
            <span className="dest-item__meta">{cat.label}</span>
          </span>
          <ChevronRight size={18} className="dest-item__chev" aria-hidden="true" />
        </button>
      </li>
    )
  }

  return (
    <nav className="dest-list" aria-label={`Destinations on the ${FLOOR_BY_ID[floor].name}`}>
      <div className="dest-list__head">
        <h2>Important Destinations</h2>
        <p>
          {primary.length} highlighted on the {FLOOR_BY_ID[floor].name.toLowerCase()}
        </p>
      </div>
      <ul className="dest-list__scroll">
        {primary.map(renderItem)}
        {more.length > 0 && (
          <>
            <li className="dest-list__group" aria-hidden="true">
              Also on this floor
            </li>
            {more.map(renderItem)}
          </>
        )}
      </ul>
    </nav>
  )
}
