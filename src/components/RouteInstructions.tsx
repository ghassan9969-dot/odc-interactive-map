/**
 * The route panel.
 *
 * It says three things, in order: where the walk actually ends, what
 * the walk is (floor, starting point, and distance and time where the
 * drawing supports them), and the turns themselves as a numbered
 * timeline. A journey that changes floor carries a progress stepper
 * above the turns, and only the stage the visitor is on lists its
 * instructions.
 *
 * Nothing here computes a route. The heading, the summary chips and
 * the stepper all come from `routes.ts`, so what the panel is allowed
 * to claim about a walk is decided in one place and tested there.
 */

import {
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  CornerDownLeft,
  CornerDownRight,
  DoorOpen,
  Layers,
  Lock,
  MapPin,
  Navigation,
  Route as RouteIcon,
  Ruler,
  TreePine,
} from 'lucide-react'
import { FLOOR_BY_ID } from '../data/floors'
import {
  journeyStages,
  routeFacts,
  routeHeading,
  type Journey,
  type RouteFactKind,
  type StepKind,
} from '../data/routes'

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

const FACT_ICON: Record<RouteFactKind, typeof ArrowUp> = {
  floor: Layers,
  origin: DoorOpen,
  distance: Ruler,
  time: Clock,
  outdoor: TreePine,
  arrive: MapPin,
}

export function RouteInstructions({ journey, legIndex, onGoToLeg, onHide }: Props) {
  const leg = journey.legs[legIndex]
  const next = journey.legs[legIndex + 1]
  const previous = journey.legs[legIndex - 1]

  const heading = routeHeading(journey.target)
  const facts = routeFacts(journey, legIndex)
  const stages = journeyStages(journey, legIndex)
  // Somewhere the surveyed plan does not cover, so there is no honest
  // distance to quote and no turn list worth printing.
  const note = journey.target.routeNote

  return (
    <section className="route" aria-label={heading.title}>
      <header className="route__head">
        <span className="route__badge" aria-hidden="true">
          <RouteIcon size={18} />
        </span>
        <div className="route__headings">
          <h4 className="route__title">{heading.title}</h4>
          {heading.subtitle && <p className="route__subtitle">{heading.subtitle}</p>}
        </div>
      </header>

      <ul className="route__facts">
        {facts.map((fact) => {
          const Icon = FACT_ICON[fact.kind]
          return (
            <li key={fact.kind} className={`route-fact route-fact--${fact.kind}`}>
              <Icon size={13} aria-hidden="true" />
              {fact.label}
            </li>
          )
        })}
      </ul>

      {stages.length > 0 && (
        <ol className="route__stages" aria-label="Journey progress">
          {stages.map((stage) => (
            <li
              key={stage.key}
              className={`route-stage is-${stage.state}`}
              aria-current={stage.state === 'active' ? 'step' : undefined}
            >
              <span className="route-stage__dot" aria-hidden="true">
                {stage.state === 'done' ? (
                  <Check size={12} />
                ) : stage.key === 'lift' ? (
                  <ArrowUpDown size={12} />
                ) : (
                  <MapPin size={12} />
                )}
              </span>
              <span className="route-stage__label">{stage.label}</span>
            </li>
          ))}
        </ol>
      )}

      {note ? (
        <p className="route__note">
          <MapPin size={15} aria-hidden="true" />
          <span>{note}</span>
        </p>
      ) : (
        <ol className="route__steps">
          {leg.route.steps.map((step, i) => {
            const Icon = STEP_ICON[step.kind]
            return (
              <li key={i} className={`route-step route-step--${step.kind}`}>
                <span className="route-step__marker" aria-hidden="true">
                  {i + 1}
                </span>
                <Icon size={14} aria-hidden="true" className="route-step__icon" />
                <span className="route-step__text">{step.text}</span>
              </li>
            )
          })}
        </ol>
      )}

      {heading.checkInAt && (
        <p className="route__check">
          <Lock size={14} aria-hidden="true" />
          <span>
            Check in at {heading.checkInAt} before entering {journey.target.name}.
          </span>
        </p>
      )}

      <div className="route__actions">
        {next && (
          <button type="button" className="btn btn--primary" onClick={() => onGoToLeg(legIndex + 1)}>
            Continue to {FLOOR_BY_ID[next.floor].name}
            <ChevronRight size={17} aria-hidden="true" />
          </button>
        )}
        {previous && (
          <button type="button" className="btn btn--ghost" onClick={() => onGoToLeg(legIndex - 1)}>
            <ChevronLeft size={17} aria-hidden="true" />
            Back to {FLOOR_BY_ID[previous.floor].name}
          </button>
        )}
        <button type="button" className="btn btn--ghost" onClick={onHide}>
          Hide route
        </button>
      </div>
    </section>
  )
}
