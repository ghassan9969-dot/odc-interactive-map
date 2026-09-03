import {
  ArrowUp,
  CornerDownLeft,
  CornerDownRight,
  Footprints,
  MapPin,
  Navigation,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { FLOOR_BY_ID } from '../data/floors'
import { UNITS_PER_METRE, walkingMinutes, type Journey, type StepKind } from '../data/routes'

interface Props {
  journey: Journey
  legIndex: number
  onGoToLeg: (index: number) => void
  onHide: () => void
}

const STEP_ICON: Record<StepKind, typeof ArrowUp> = {
  start: Navigation,
  straight: ArrowUp,
  left: CornerDownLeft,
  right: CornerDownRight,
  arrive: MapPin,
}

export function RouteInstructions({ journey, legIndex, onGoToLeg, onHide }: Props) {
  const leg = journey.legs[legIndex]
  const total = journey.legs.length
  const next = journey.legs[legIndex + 1]
  const previous = journey.legs[legIndex - 1]

  const distance = Math.round(leg.route.length / UNITS_PER_METRE)
  const minutes = walkingMinutes(leg.route.length)

  return (
    <section className="route-bar" aria-label={`Walking directions to ${journey.target.name}`}>
      <p className="route-bar__head">
        <Navigation size={15} aria-hidden="true" />
        {total > 1 ? `Step ${legIndex + 1} of ${total} — ${leg.title}` : `Route to ${journey.target.shortName}`}
      </p>

      <p className="route-bar__from">
        <strong>{FLOOR_BY_ID[leg.floor].name}</strong> · from {leg.route.originLabel} · about{' '}
        {distance} m
        <span aria-hidden="true"> · </span>
        <Footprints size={13} aria-hidden="true" style={{ verticalAlign: '-2px' }} /> {minutes} min
      </p>

      <ol className="route-bar__steps">
        {leg.route.steps.map((step, i) => {
          const Icon = STEP_ICON[step.kind]
          return (
            <li key={i} className={`route-step route-step--${step.kind}`}>
              <Icon size={15} aria-hidden="true" className="route-step__icon" />
              <span>{step.text}</span>
            </li>
          )
        })}
      </ol>

      <div className="route-bar__actions">
        {next && (
          <button type="button" className="btn btn--primary" onClick={() => onGoToLeg(legIndex + 1)}>
            Continue to {FLOOR_BY_ID[next.floor].name}
            <ChevronRight size={17} aria-hidden="true" />
          </button>
        )}
        {previous && (
          <button type="button" className="btn btn--ghost" onClick={() => onGoToLeg(legIndex - 1)}>
            <ChevronLeft size={17} aria-hidden="true" />
            Back to the {FLOOR_BY_ID[previous.floor].name} route
          </button>
        )}
        <button type="button" className="btn btn--ghost" onClick={onHide}>
          Hide route
        </button>
      </div>
    </section>
  )
}
