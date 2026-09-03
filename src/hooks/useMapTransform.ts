import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { Pt } from '../data/types'
import {
  IDENTITY,
  MAX_SCALE,
  MIN_SCALE,
  centerOn as centerOnBox,
  clientToViewBox,
  clientDeltaToViewBox,
  constrain,
  fitBox,
  panBy,
  pinchStep,
  toSvgTransform,
  transformsEqual,
  viewportMap,
  zoomAbout,
  type Transform,
  type ViewportMap,
} from './mapTransform'

export { MIN_SCALE, MAX_SCALE }
export type { Transform }

/** Movement, in CSS pixels, before a press becomes a drag. */
const DRAG_THRESHOLD = 3

/**
 * Pan / zoom for a floor map, built so a gesture never renders React.
 *
 * A live gesture writes straight to one `<g>` through `layerRef`, at
 * most once per animation frame, with the working transform held in a
 * ref. React state is only touched when the gesture ends, so the large
 * SVG tree is not rebuilt sixty times a second while a finger moves.
 *
 * Everything is expressed in the SVG's own viewBox units, so the map
 * behaves identically whatever size the container happens to be.
 */
export function useMapTransform(width: number, height: number) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const layerRef = useRef<SVGGElement | null>(null)
  const zoomLabelRef = useRef<HTMLDivElement | null>(null)

  const [transform, setTransform] = useState<Transform>(IDENTITY)

  /** The transform actually on screen; the source of truth mid-gesture. */
  const live = useRef<Transform>(IDENTITY)
  const frame = useRef<number | null>(null)
  const pointers = useRef(new Map<number, Pt>())
  const pinch = useRef<{ dist: number; mid: Pt } | null>(null)
  const dragging = useRef(false)
  const gesturing = useRef(false)
  /** Client-space to viewBox mapping, refreshed rather than recomputed. */
  const viewport = useRef<ViewportMap | null>(null)

  /* ---- DOM writes ---------------------------------------------- */

  const paint = useCallback((t: Transform) => {
    layerRef.current?.setAttribute('transform', toSvgTransform(t))
    if (zoomLabelRef.current) zoomLabelRef.current.textContent = `${Math.round(t.k * 100)}%`
  }, [])

  /** Coalesce a burst of pointer moves into one write per frame. */
  const schedulePaint = useCallback(() => {
    if (frame.current !== null) return
    frame.current = requestAnimationFrame(() => {
      frame.current = null
      paint(live.current)
    })
  }, [paint])

  const cancelFrame = useCallback(() => {
    if (frame.current === null) return
    cancelAnimationFrame(frame.current)
    frame.current = null
  }, [])

  /** React owns the transform whenever no finger is down. */
  useLayoutEffect(() => {
    if (gesturing.current) return
    live.current = transform
    paint(transform)
  }, [transform, paint])

  const commit = useCallback((t: Transform) => {
    live.current = t
    setTransform(t)
  }, [])

  /* ---- viewport mapping ---------------------------------------- */

  const refreshViewport = useCallback(() => {
    const svg = svgRef.current
    if (!svg) return null
    viewport.current = viewportMap(svg.getBoundingClientRect(), width, height)
    return viewport.current
  }, [width, height])

  // Re-derived when the stage resizes, not on every move.
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    refreshViewport()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => refreshViewport())
    observer.observe(svg)
    return () => observer.disconnect()
  }, [refreshViewport])

  const toViewBox = useCallback(
    (clientX: number, clientY: number): Pt => {
      const map = viewport.current ?? refreshViewport()
      if (!map) return [width / 2, height / 2]
      return clientToViewBox(map, clientX, clientY)
    },
    [refreshViewport, width, height],
  )

  /* ---- programmatic movement ----------------------------------- */

  const zoomAt = useCallback(
    (factor: number, anchor?: Pt) => {
      const next = zoomAbout(
        live.current,
        factor,
        anchor ?? [width / 2, height / 2],
        width,
        height,
      )
      commit(next)
    },
    [commit, width, height],
  )

  const zoomIn = useCallback(() => zoomAt(1.35), [zoomAt])
  const zoomOut = useCallback(() => zoomAt(1 / 1.35), [zoomAt])
  const reset = useCallback(() => commit(IDENTITY), [commit])

  /** Put a point in the middle of the view at the given scale. */
  const centerOn = useCallback(
    (p: Pt, k = 2.1) => commit(centerOnBox(p, k, width, height)),
    [commit, width, height],
  )

  /** Fit a bounding box, with padding, into the view. */
  const fitTo = useCallback(
    (box: { x: number; y: number; w: number; h: number }, pad = 1.5, maxScale = MAX_SCALE) =>
      commit(fitBox(box, width, height, pad, maxScale)),
    [commit, width, height],
  )

  /* ---- gesture state ------------------------------------------- */

  const setGesturing = useCallback((active: boolean) => {
    gesturing.current = active
    // A class rather than React state: filters must switch off for the
    // gesture without rebuilding the SVG tree to do it.
    svgRef.current?.classList.toggle('is-gesturing', active)
  }, [])

  /** Land the gesture: flush the frame, sync React, drop all state. */
  const endGesture = useCallback(() => {
    cancelFrame()
    const settled = live.current
    setGesturing(false)
    pointers.current.clear()
    pinch.current = null
    dragging.current = false
    paint(settled)
    setTransform((current) => (transformsEqual(current, settled) ? current : settled))
  }, [cancelFrame, paint, setGesturing])

  const onPointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      // A pointer arriving mid-gesture must not shift anything; it only
      // resets the reference the next move is measured against.
      refreshViewport()
      pointers.current.set(e.pointerId, [e.clientX, e.clientY])
      if (pointers.current.size === 1) setGesturing(true)
      if (pointers.current.size >= 2) {
        const [a, b] = [...pointers.current.values()]
        pinch.current = {
          dist: Math.hypot(a[0] - b[0], a[1] - b[1]),
          mid: toViewBox((a[0] + b[0]) / 2, (a[1] + b[1]) / 2),
        }
      }
    },
    [refreshViewport, setGesturing, toViewBox],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const previous = pointers.current.get(e.pointerId)
      if (!previous) return
      pointers.current.set(e.pointerId, [e.clientX, e.clientY])
      const map = viewport.current
      if (!map) return

      if (pointers.current.size >= 2) {
        const [a, b] = [...pointers.current.values()]
        const next = {
          dist: Math.hypot(a[0] - b[0], a[1] - b[1]),
          mid: clientToViewBox(map, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2),
        }
        if (pinch.current) {
          live.current = pinchStep(live.current, pinch.current, next, width, height)
          schedulePaint()
        }
        pinch.current = next
        return
      }

      const moved = Math.hypot(e.clientX - previous[0], e.clientY - previous[1])
      if (!dragging.current) {
        // Capture only once this is really a drag, so a tap still
        // reaches the room underneath as a click.
        if (moved < DRAG_THRESHOLD) return
        dragging.current = true
        try {
          ;(e.currentTarget as Element).setPointerCapture?.(e.pointerId)
        } catch {
          // The pointer may already be gone; panning still works without it.
        }
      }

      const [dx, dy] = clientDeltaToViewBox(
        map,
        e.clientX - previous[0],
        e.clientY - previous[1],
      )
      live.current = panBy(live.current, dx, dy, width, height)
      schedulePaint()
    },
    [schedulePaint, width, height],
  )

  const onPointerUp = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      pointers.current.delete(e.pointerId)
      const target = e.currentTarget as Element
      // Releasing a pointer that was never captured throws, and a tap
      // never gets captured.
      if (target.hasPointerCapture?.(e.pointerId)) target.releasePointerCapture(e.pointerId)
      if (pointers.current.size >= 2) {
        const [a, b] = [...pointers.current.values()]
        pinch.current = {
          dist: Math.hypot(a[0] - b[0], a[1] - b[1]),
          mid: toViewBox((a[0] + b[0]) / 2, (a[1] + b[1]) / 2),
        }
        return
      }
      // Down to one finger: forget the pinch reference so the remaining
      // finger carries on panning from where it is, with no jump.
      pinch.current = null
      if (pointers.current.size === 1) return
      endGesture()
    },
    [endGesture, toViewBox],
  )

  /* Wheel is registered manually so it can be non-passive. */
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const handler = (e: WheelEvent) => {
      e.preventDefault()
      refreshViewport()
      zoomAt(Math.exp(-e.deltaY * 0.0016), toViewBox(e.clientX, e.clientY))
    }
    svg.addEventListener('wheel', handler, { passive: false })
    return () => svg.removeEventListener('wheel', handler)
  }, [zoomAt, toViewBox, refreshViewport])

  // Never leave a frame queued against an unmounted element.
  useEffect(() => cancelFrame, [cancelFrame])

  const handlers = useMemo(
    () => ({
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
      onPointerLeave: (e: React.PointerEvent<SVGSVGElement>) => {
        // While captured the pointer cannot leave, so this only fires
        // for a press that never became a drag.
        if (dragging.current) return
        onPointerUp(e)
      },
    }),
    [onPointerDown, onPointerMove, onPointerUp],
  )

  return {
    svgRef,
    layerRef,
    zoomLabelRef,
    transform,
    zoomIn,
    zoomOut,
    reset,
    centerOn,
    fitTo,
    handlers,
  }
}

export { constrain }
