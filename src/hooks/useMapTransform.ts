import { useCallback, useEffect, useRef, useState } from 'react'
import type { Pt } from '../data/types'

export const MIN_SCALE = 0.75
export const MAX_SCALE = 6

export interface Transform {
  k: number
  x: number
  y: number
}

const IDENTITY: Transform = { k: 1, x: 0, y: 0 }

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/**
 * Pan / zoom state for a floor map.
 *
 * Everything is expressed in the SVG's own viewBox units, so the map
 * behaves identically whatever size the container happens to be.
 * Translation is constrained so a good part of the plan always stays
 * on screen.
 */
export function useMapTransform(width: number, height: number) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [transform, setTransform] = useState<Transform>(IDENTITY)
  const [isPanning, setPanning] = useState(false)
  const pointers = useRef(new Map<number, Pt>())
  const pinch = useRef<{ dist: number; mid: Pt } | null>(null)
  const dragging = useRef(false)

  const constrain = useCallback(
    (t: Transform): Transform => {
      const k = clamp(t.k, MIN_SCALE, MAX_SCALE)
      const mx = width * 0.28
      const my = height * 0.28
      return {
        k,
        x: clamp(t.x, -k * (width - mx), width - k * mx),
        y: clamp(t.y, -k * (height - my), height - k * my),
      }
    },
    [width, height],
  )

  /** Screen point -> viewBox point. */
  const toViewBox = useCallback((clientX: number, clientY: number): Pt => {
    const svg = svgRef.current
    if (!svg) return [width / 2, height / 2]
    const ctm = svg.getScreenCTM()
    if (!ctm) return [width / 2, height / 2]
    const p = svg.createSVGPoint()
    p.x = clientX
    p.y = clientY
    const q = p.matrixTransform(ctm.inverse())
    return [q.x, q.y]
  }, [width, height])

  const zoomAt = useCallback(
    (factor: number, anchor?: Pt) => {
      setTransform((t) => {
        const a = anchor ?? [width / 2, height / 2]
        const k = clamp(t.k * factor, MIN_SCALE, MAX_SCALE)
        const ratio = k / t.k
        return constrain({
          k,
          x: a[0] - (a[0] - t.x) * ratio,
          y: a[1] - (a[1] - t.y) * ratio,
        })
      })
    },
    [constrain, width, height],
  )

  const zoomIn = useCallback(() => zoomAt(1.35), [zoomAt])
  const zoomOut = useCallback(() => zoomAt(1 / 1.35), [zoomAt])
  const reset = useCallback(() => setTransform(IDENTITY), [])

  /** Put a point in the middle of the view at the given scale. */
  const centerOn = useCallback(
    (p: Pt, k = 2.1) => {
      setTransform(constrain({ k, x: width / 2 - p[0] * k, y: height / 2 - p[1] * k }))
    },
    [constrain, width, height],
  )

  /** Fit a bounding box, with padding, into the view. */
  const fitTo = useCallback(
    (box: { x: number; y: number; w: number; h: number }, pad = 1.5) => {
      const k = clamp(Math.min(width / (box.w * pad), height / (box.h * pad)), MIN_SCALE, MAX_SCALE)
      const cx = box.x + box.w / 2
      const cy = box.y + box.h / 2
      setTransform(constrain({ k, x: width / 2 - cx * k, y: height / 2 - cy * k }))
    },
    [constrain, width, height],
  )

  /* ---- pointer handling -------------------------------------- */

  const onPointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    pointers.current.set(e.pointerId, [e.clientX, e.clientY])
    // Capture is deferred until the pointer actually moves, so that a
    // simple tap still reaches the room underneath as a click.
    if (pointers.current.size === 1) setPanning(true)
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      pinch.current = {
        dist: Math.hypot(a[0] - b[0], a[1] - b[1]),
        mid: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2],
      }
    }
  }, [])

  const onPointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const prev = pointers.current.get(e.pointerId)
      if (!prev) return
      pointers.current.set(e.pointerId, [e.clientX, e.clientY])

      if (pointers.current.size >= 2) {
        const [a, b] = [...pointers.current.values()]
        const d = Math.hypot(a[0] - b[0], a[1] - b[1])
        const mid: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
        if (pinch.current && pinch.current.dist > 0) {
          const factor = d / pinch.current.dist
          if (Math.abs(factor - 1) > 0.005) zoomAt(factor, toViewBox(mid[0], mid[1]))
        }
        pinch.current = { dist: d, mid }
        return
      }

      const svg = svgRef.current
      if (!svg) return
      const rect = svg.getBoundingClientRect()
      // Convert the screen delta into viewBox units.
      const scale = Math.min(rect.width / width, rect.height / height) || 1
      const dx = (e.clientX - prev[0]) / scale
      const dy = (e.clientY - prev[1]) / scale
      if (!dragging.current) {
        if (Math.hypot(e.clientX - prev[0], e.clientY - prev[1]) < 3) return
        dragging.current = true
        ;(e.currentTarget as Element).setPointerCapture?.(e.pointerId)
      }
      setTransform((t) => constrain({ ...t, x: t.x + dx, y: t.y + dy }))
    },
    [constrain, toViewBox, width, height, zoomAt],
  )

  const endPointer = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) pinch.current = null
    if (pointers.current.size === 0) {
      setPanning(false)
      dragging.current = false
    }
  }, [])

  /* Wheel zoom is registered manually so it can be non-passive. */
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const handler = (e: WheelEvent) => {
      e.preventDefault()
      const factor = Math.exp(-e.deltaY * 0.0016)
      zoomAt(factor, toViewBox(e.clientX, e.clientY))
    }
    svg.addEventListener('wheel', handler, { passive: false })
    return () => svg.removeEventListener('wheel', handler)
  }, [zoomAt, toViewBox])

  return {
    svgRef,
    transform,
    isPanning,
    zoomIn,
    zoomOut,
    reset,
    centerOn,
    fitTo,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endPointer,
      onPointerCancel: endPointer,
      onPointerLeave: endPointer,
    },
  }
}
