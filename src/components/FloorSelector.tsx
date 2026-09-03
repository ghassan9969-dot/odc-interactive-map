import { useRef } from 'react'
import { FLOORS } from '../data/floors'
import type { FloorId } from '../data/types'

interface Props {
  value: FloorId
  onChange: (floor: FloorId) => void
  /** `rail` stacks the tabs vertically for the collapsed side panel. */
  variant?: 'full' | 'rail'
}

export function FloorSelector({ value, onChange, variant = 'full' }: Props) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const move = (index: number, delta: number) => {
    const next = (index + delta + FLOORS.length) % FLOORS.length
    onChange(FLOORS[next].id)
    refs.current[next]?.focus()
  }

  const rail = variant === 'rail'

  return (
    <div
      className={rail ? 'floors floors--rail' : 'floors'}
      role="tablist"
      aria-orientation={rail ? 'vertical' : 'horizontal'}
      aria-label="Choose a floor"
    >
      {FLOORS.map((floor, i) => (
        <button
          key={floor.id}
          ref={(el) => {
            refs.current[i] = el
          }}
          type="button"
          role="tab"
          id={`floor-tab-${floor.id}`}
          aria-selected={value === floor.id}
          aria-controls="floor-map-panel"
          aria-label={rail ? floor.name : undefined}
          title={rail ? floor.name : undefined}
          tabIndex={value === floor.id ? 0 : -1}
          className="floor-tab"
          onClick={() => onChange(floor.id)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
              e.preventDefault()
              move(i, 1)
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
              e.preventDefault()
              move(i, -1)
            } else if (e.key === 'Home') {
              e.preventDefault()
              move(0, 0)
            } else if (e.key === 'End') {
              e.preventDefault()
              move(FLOORS.length - 1, 0)
            }
          }}
        >
          <span className="floor-tab__level" aria-hidden="true">
            {floor.level}
          </span>
          {!rail && <span className="floor-tab__name">{floor.shortName}</span>}
        </button>
      ))}
    </div>
  )
}
