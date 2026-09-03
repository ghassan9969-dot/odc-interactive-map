import { Maximize, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'
import { MAX_SCALE, MIN_SCALE } from '../hooks/useMapTransform'

interface Props {
  scale: number
  /**
   * Lets a live gesture update the percentage without a React render.
   * `scale` still seeds it and takes over again once the finger lifts.
   */
  readoutRef?: React.MutableRefObject<HTMLDivElement | null>
  onZoomIn: () => void
  onZoomOut: () => void
  onFit: () => void
  onReset: () => void
}

export function MapControls({ scale, readoutRef, onZoomIn, onZoomOut, onFit, onReset }: Props) {
  return (
    <div className="map-controls" role="group" aria-label="Map controls">
      <button type="button" onClick={onZoomIn} disabled={scale >= MAX_SCALE - 0.001} aria-label="Zoom in">
        <ZoomIn size={22} aria-hidden="true" />
      </button>
      <div className="zoom-readout" aria-hidden="true" ref={readoutRef}>
        {Math.round(scale * 100)}%
      </div>
      <button type="button" onClick={onZoomOut} disabled={scale <= MIN_SCALE + 0.001} aria-label="Zoom out">
        <ZoomOut size={22} aria-hidden="true" />
      </button>
      <div className="map-controls__rule" />
      <button type="button" onClick={onFit} aria-label="Fit map to screen">
        <Maximize size={21} aria-hidden="true" />
      </button>
      <button type="button" onClick={onReset} aria-label="Reset map and clear selection">
        <RotateCcw size={21} aria-hidden="true" />
      </button>
    </div>
  )
}
