import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { CATEGORIES, FLOOR_BY_ID } from '../data/floors'
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

export function DestinationSearch({ onPick, inputRef: externalRef }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const boxRef = useRef<HTMLDivElement>(null)
  const localRef = useRef<HTMLInputElement | null>(null)
  const inputRef = externalRef ?? localRef
  const listId = useId()
  const listOpen = open && query.trim().length > 0

  const results = useMemo(() => {
    const q = query.trim()
    if (q.length < 1) return []
    return LOCATIONS.map((l) => ({ l, s: score(l, q) }))
      .filter((r) => r.s >= 0)
      .sort((a, b) => a.s - b.s || Number(b.l.primary) - Number(a.l.primary) || a.l.name.localeCompare(b.l.name))
      .slice(0, 12)
      .map((r) => r.l)
  }, [query])

  useEffect(() => setActive(0), [query])

  useEffect(() => {
    const onDocDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocDown)
    return () => document.removeEventListener('mousedown', onDocDown)
  }, [])

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
          aria-expanded={open && results.length > 0}
          aria-controls={listOpen ? listId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={open && results[active] ? `${listId}-${active}` : undefined}
          placeholder="Search for a destination..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (!results.length) return
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setActive((a) => (a + 1) % results.length)
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setActive((a) => (a - 1 + results.length) % results.length)
            } else if (e.key === 'Enter') {
              e.preventDefault()
              choose(results[active])
            } else if (e.key === 'Escape') {
              setOpen(false)
            }
          }}
        />
        {query && (
          <button type="button" className="search__clear" onClick={() => setQuery('')} aria-label="Clear search">
            <X size={17} aria-hidden="true" />
          </button>
        )}
      </div>

      {listOpen && (
        <ul className="search__results" id={listId} role="listbox" aria-label="Search results">
          {results.length === 0 && (
            <li className="search__empty">
              No destination matches “{query.trim()}”. Try “clinic”, “library” or “reception”.
            </li>
          )}
          {results.map((loc, i) => {
            const cat = CATEGORIES[loc.category]
            return (
              <li key={loc.id} role="option" aria-selected={i === active} id={`${listId}-${i}`}>
                <button
                  type="button"
                  className="search__result"
                  aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(loc)}
                >
                  <span
                    className="dest-item__icon"
                    style={{ background: cat.fill, color: cat.text }}
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
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
