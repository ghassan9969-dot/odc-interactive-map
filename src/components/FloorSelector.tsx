import { useRef } from 'react'
import { Layers } from 'lucide-react'
import { FLOORS } from '../data/floors'
import type { ListScope } from '../data/types'

/**
 * The id of the region these tabs govern.
 *
 * They choose what the destination list shows, not which map is drawn:
 * the fourth tab gathers the important rooms of all three floors while
 * the map carries on showing whichever floor the visitor is looking at.
 * The map is labelled by its own floor instead.
 */
export const DEST_LIST_ID = 'destination-list-panel'

interface Tab {
  scope: ListScope
  /** The large glyph: a floor level, or the stacked-floors mark. */
  level: string | null
  name: string
  /** What a screen reader and the collapsed rail call it. */
  label: string
}

const TABS: Tab[] = [
  ...FLOORS.map((floor) => ({
    scope: floor.id as ListScope,
    level: floor.level,
    name: floor.shortName,
    label: floor.name,
  })),
  { scope: 'all', level: null, name: 'All', label: 'Important destinations on all floors' },
]

interface Props {
  value: ListScope
  onChange: (scope: ListScope) => void
  /** `rail` stacks the tabs vertically for the collapsed side panel. */
  variant?: 'full' | 'rail'
}

export function FloorSelector({ value, onChange, variant = 'full' }: Props) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const go = (index: number) => {
    const next = (index + TABS.length) % TABS.length
    onChange(TABS[next].scope)
    refs.current[next]?.focus()
  }

  const rail = variant === 'rail'

  return (
    <div
      className={rail ? 'floors floors--rail' : 'floors'}
      role="tablist"
      aria-orientation={rail ? 'vertical' : 'horizontal'}
      aria-label="Choose which destinations to list"
    >
      {TABS.map((tab, i) => (
        <button
          key={tab.scope}
          ref={(el) => {
            refs.current[i] = el
          }}
          type="button"
          role="tab"
          id={`floor-tab-${tab.scope}`}
          aria-selected={value === tab.scope}
          aria-controls={DEST_LIST_ID}
          aria-label={rail ? tab.label : undefined}
          title={rail ? tab.label : undefined}
          tabIndex={value === tab.scope ? 0 : -1}
          className="floor-tab"
          onClick={() => onChange(tab.scope)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
              e.preventDefault()
              go(i + 1)
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
              e.preventDefault()
              go(i - 1)
            } else if (e.key === 'Home') {
              e.preventDefault()
              go(0)
            } else if (e.key === 'End') {
              e.preventDefault()
              go(TABS.length - 1)
            }
          }}
        >
          <span className="floor-tab__level" aria-hidden="true">
            {tab.level ?? <Layers size={18} strokeWidth={2.2} />}
          </span>
          {!rail && <span className="floor-tab__name">{tab.name}</span>}
        </button>
      ))}
    </div>
  )
}
