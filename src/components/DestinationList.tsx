import { useMemo } from 'react'
import { ChevronRight } from 'lucide-react'
import { CATEGORIES, FLOOR_BY_ID, roomPaint } from '../data/floors'
import { importantByFloor, locationsOnFloor } from '../data/locations'
import type { ListScope, Location } from '../data/types'
import { DEST_LIST_ID } from './FloorSelector'
import { UiMapIcon } from './MapIcon'

interface Props {
  scope: ListScope
  selectedId: string | null
  onSelect: (location: Location) => void
}

export function DestinationList({ scope, selectedId, onSelect }: Props) {
  // One floor lists everything on it, the important rooms first. The
  // combined view lists only the important ones, because a single list
  // of every room in the college would be no use to anybody.
  const perFloor = useMemo(() => {
    if (scope === 'all') return null
    const all = locationsOnFloor(scope)
    return { primary: all.filter((l) => l.primary), more: all.filter((l) => !l.primary) }
  }, [scope])

  const combined = useMemo(() => (scope === 'all' ? importantByFloor() : null), [scope])

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

  const heading = combined
    ? { title: 'Important Destinations', sub: `${combined.total} highlighted across all floors` }
    : {
        title: 'Important Destinations',
        sub: `${perFloor!.primary.length} highlighted on the ${FLOOR_BY_ID[
          scope as Exclude<ListScope, 'all'>
        ].name.toLowerCase()}`,
      }

  return (
    <nav
      className="dest-list"
      id={DEST_LIST_ID}
      role="tabpanel"
      aria-labelledby={`floor-tab-${scope}`}
      aria-label={combined ? 'Important destinations on all floors' : undefined}
    >
      <div className="dest-list__head">
        <h2>{heading.title}</h2>
        <p>{heading.sub}</p>
      </div>
      <ul className="dest-list__scroll">
        {combined
          ? combined.groups.map((group) => (
              <li key={group.floor}>
                <p className="dest-list__floor">
                  {group.name}
                  <span aria-hidden="true"> · </span>
                  <span className="dest-list__floor-count">{group.items.length}</span>
                </p>
                <ul className="dest-list__group-items">{group.items.map(renderItem)}</ul>
              </li>
            ))
          : perFloor!.primary.map(renderItem)}

        {perFloor && perFloor.more.length > 0 && (
          <>
            <li className="dest-list__group" aria-hidden="true">
              Also on this floor
            </li>
            {perFloor.more.map(renderItem)}
          </>
        )}
      </ul>
    </nav>
  )
}
