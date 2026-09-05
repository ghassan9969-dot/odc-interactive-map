import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { CATEGORIES, FLOOR_BY_ID, roomPaint } from '../data/floors'
import { LOCATIONS } from '../data/locations'
import type { Location } from '../data/types'
import { UiMapIcon } from './MapIcon'

interface Props {
  onPick: (location: Location) => void
  /** Lets the collapsed panel rail focus the field when it reopens. */
  inputRef?: React.MutableRefObject<HTMLInputElement | null>
}

/** Rank a location against the query; lower is better, -1 means no match. */
function score(location: Location, query: string): number {
  const q = query.toLowerCase()
  const name = location.name.toLowerCase()
  const short = location.shortName.toLowerCase()
  if (name.startsWith(q)) return 0
  if (short.startsWith(q)) return 1
  if (name.includes(q)) return 2
  if (short.includes(q)) return 3
  if (location.keywords?.some((k) => k.toLowerCase().startsWith(q))) return 4
  if (location.keywords?.some((k) => k.toLowerCase().includes(q))) return 5
  if (CATEGORIES[location.category].label.toLowerCase().includes(q)) return 6
  return -1
}

/**
 * ARIA 1.2 combobox with a listbox popup.
 *
 * The options are plain list items, not buttons: an element with
 * role="option" must not contain interactive descendants. Focus stays on
 * the input throughout and the active option is conveyed through
 * aria-activedescendant, which is what lets one set of keys drive both
 * the field and the list.
 */
export function DestinationSearch({ onPick, inputRef: externalRef }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const boxRef = useRef<HTMLDivElement>(null)
  const localRef = useRef<HTMLInputElement | null>(null)
  const activeRef = useRef<HTMLLIElement | null>(null)
  const inputRef = externalRef ?? localRef
  const baseId = useId()
  const listboxId = `${baseId}-listbox`
  const optionId = (index: number) => `${baseId}-option-${index}`

  const results = useMemo(() => {
    const q = query.trim()
    if (q.length < 1) return []
    return LOCATIONS.map((l) => ({ l, s: score(l, q) }))
      .filter((r) => r.s >= 0)
      .sort((a, b) => a.s - b.s || Number(b.l.primary) - Number(a.l.primary) || a.l.name.localeCompare(b.l.name))
      .slice(0, 12)
      .map((r) => r.l)
  }, [query])

  // The popup is on screen whenever there is a query, including when it
  // has nothing to show, so aria-expanded matches what a visitor sees.
  const popupOpen = open && query.trim().length > 0
  const activeOption = popupOpen ? results[active] : undefined

  useEffect(() => setActive(0), [query])

  useEffect(() => {
    const onDocDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocDown)
    return () => document.removeEventListener('mousedown', onDocDown)
  }, [])

  // Keep the highlighted option in view while arrowing through a long list.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest' })
  }, [active, popupOpen])

  const choose = (location: Location) => {
    onPick(location)
    setQuery('')
    setOpen(false)
    inputRef.current?.blur()
  }

  return (
    <div className="search" ref={boxRef}>
      <label className="visually-hidden" htmlFor="destination-search">
        Search for a destination in Oman Dental College
      </label>
      <div className="search__field">
        <Search size={19} aria-hidden="true" />
        <input
          id="destination-search"
          ref={inputRef}
          type="text"
          autoComplete="off"
          role="combobox"
          aria-expanded={popupOpen}
          aria-controls={popupOpen ? listboxId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={activeOption ? optionId(active) : undefined}
          placeholder="Search for a destination..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setOpen(false)
              return
            }
            if (!results.length) return
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setOpen(true)
              setActive((a) => (a + 1) % results.length)
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setOpen(true)
              setActive((a) => (a - 1 + results.length) % results.length)
            } else if (e.key === 'Enter') {
              e.preventDefault()
              choose(results[active])
            }
          }}
        />
        {query && (
          <button type="button" className="search__clear" onClick={() => setQuery('')} aria-label="Clear search">
            <X size={17} aria-hidden="true" />
          </button>
        )}
      </div>

      {popupOpen && (
        <div className="search__results">
          <ul className="search__options" role="listbox" id={listboxId} aria-label="Search results">
            {results.map((loc, i) => {
              const cat = CATEGORIES[loc.category]
              const paint = roomPaint(loc)
              return (
                <li
                  key={loc.id}
                  id={optionId(i)}
                  role="option"
                  aria-selected={i === active}
                  ref={i === active ? activeRef : undefined}
                  className="search__result"
                  onMouseEnter={() => setActive(i)}
                  // Keeps focus on the input so the click lands on the option.
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(loc)}
                >
                  <span
                    className="dest-item__icon"
                    style={{ background: paint.fill, color: paint.icon }}
                    aria-hidden="true"
                  >
                    <UiMapIcon type={loc.icon} size={19} />
                  </span>
                  <span className="dest-item__text">
                    <span className="search__result-name">{loc.name}</span>
                    <br />
                    <span className="search__result-meta">
                      {FLOOR_BY_ID[loc.floor].name} · {cat.label}
                    </span>
                  </span>
                </li>
              )
            })}
          </ul>
          {results.length === 0 && (
            <p className="search__empty" role="status">
              No destination matches “{query.trim()}”. Try “clinic”, “library” or “reception”.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
