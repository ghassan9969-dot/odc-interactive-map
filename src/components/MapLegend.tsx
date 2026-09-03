import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { CATEGORIES } from '../data/floors'

const ORDER = ['clinical', 'learning', 'laboratory', 'food', 'administration', 'reception', 'secondary'] as const

/**
 * On a tablet — or any short window — the legend starts collapsed so it
 * does not eat into the plan. Roomy desktops keep it open.
 */
const startCollapsed = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(max-height: 860px), (pointer: coarse)').matches

export function MapLegend() {
  const [open, setOpen] = useState(() => !startCollapsed())

  return (
    <div className="legend">
      <button
        type="button"
        className="legend__toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="map-legend-items"
      >
        {open ? <ChevronDown size={16} aria-hidden="true" /> : <ChevronUp size={16} aria-hidden="true" />}
        Map legend
      </button>
      {open && (
        <ul className="legend__items" id="map-legend-items">
          {ORDER.map((id) => {
            const cat = CATEGORIES[id]
            return (
              <li className="legend__item" key={id}>
                <span
                  className="legend__swatch"
                  style={{ background: cat.fill, border: `1px solid ${cat.stroke}` }}
                  aria-hidden="true"
                />
                {cat.label}
              </li>
            )
          })}
          <li className="legend__item">
            <span className="legend__swatch legend__swatch--route" aria-hidden="true" />
            Navigation route
          </li>
        </ul>
      )}
    </div>
  )
}
