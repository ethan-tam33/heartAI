// components/ECGViewer.tsx

'use client'

import { useState } from 'react'
import { ECGMarker } from '../../types/ecg'
// import type { ECGMarker } from '@/types/ecg'

interface ECGViewerProps {
  imageUrl: string
  markers?: ECGMarker[]
  scale?: number // if externally controlled
}

export function ECGViewer({
  imageUrl,
  markers = [],
  scale: controlledScale = 1,
}: ECGViewerProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [internalScale, setInternalScale] = useState(1)

  const scale = controlledScale !== undefined ? controlledScale : internalScale

  const handleZoom = (direction: 'in' | 'out') => {
    if (controlledScale !== undefined) return // Skip if scale is externally controlled

    setInternalScale((prev) => {
      const factor = direction === 'in' ? 1.2 : 1 / 1.2
      const nextScale = prev * factor
      return Math.min(Math.max(nextScale, 0.5), 4) // clamp between 0.5 and 4
    })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const resetView = () => {
    setPosition({ x: 0, y: 0 })
    setInternalScale(1)
  }

  const markerColors: Record<string, string> = {
    'st-elevation': 'rgba(255, 82, 82, 0.8)',
    'q-wave': 'rgba(255, 177, 66, 0.8)',
    arrhythmia: 'rgba(76, 175, 80, 0.8)',
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-slate-900">ECG Analysis</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleZoom('out')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors border border-transparent"
            aria-label="Zoom out"
          >
            <ZoomOutIcon className="w-5 h-5 text-slate-600" />
          </button>
          <span className="text-slate-500 text-sm self-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => handleZoom('in')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors border border-transparent"
            aria-label="Zoom in"
          >
            <ZoomInIcon className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>

      <div
        className="relative h-80 bg-slate-50 rounded-lg overflow-hidden border border-slate-200"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <div
          className="w-full h-full"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: '0 0',
          }}
        >
          <img
            src={imageUrl}
            alt="ECG scan"
            className="object-contain w-full h-full p-4 pointer-events-none"
          />

          {/* Markers */}
          {markers.map((marker, index) => (
            <div
              key={index}
              className="absolute rounded-lg pointer-events-none border"
              style={{
                left: `${marker.x}%`,
                top: `${marker.y}%`,
                width: `${marker.width}%`,
                height: `${marker.height}%`,
                borderColor: markerColors[marker.type],
                backgroundColor: 'transparent',
              }}
            >
              <span
                className="text-xs font-medium px-1.5 py-0.5 rounded absolute top-0 left-0 m-1 bg-white/90 shadow"
                style={{ color: '#000' }}
              >
                {marker.label}
              </span>
            </div>
          ))}
        </div>

        {/* Reset View Button */}
        <button
          onClick={resetView}
          className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-sm hover:bg-white transition-colors"
          aria-label="Reset view"
        >
          <ResetIcon className="w-5 h-5 text-slate-600" />
        </button>
      </div>
    </div>
  )
}

// Icons
function ZoomInIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      strokeWidth={1.5}
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196
        a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6"
      />
    </svg>
  )
}

function ZoomOutIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      strokeWidth={1.5}
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 
        105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6"
      />
    </svg>
  )
}

function ResetIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      strokeWidth={1.5}
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.023 9.348h4.992M2.985 19.644v-4.992m0 0h4.992
        m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7
        M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
      />
    </svg>
  )
}
