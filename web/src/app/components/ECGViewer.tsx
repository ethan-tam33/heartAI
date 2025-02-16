// components/ECGViewer.tsx

'use client'

import { useState } from 'react'
import type { CMRMarker } from '../../../types/cmr'

interface ECGViewerProps {
  imageUrl: string
  markers?: CMRMarker[]
  scale?: number
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
    if (controlledScale !== undefined) return
    setInternalScale((prev) => {
      const factor = direction === 'in' ? 1.2 : 1 / 1.2
      const nextScale = prev * factor
      return Math.min(Math.max(nextScale, 0.5), 4)
    })
  }

  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const onMouseUp = () => setIsDragging(false)

  const resetView = () => {
    setPosition({ x: 0, y: 0 })
    setInternalScale(1)
  }

  const markerColors: Record<CMRMarker['type'], string> = {
    'st-elevation': 'rgba(255, 82, 82, 0.8)',
    'q-wave': 'rgba(255, 177, 66, 0.8)',
    arrhythmia: 'rgba(76, 175, 80, 0.8)',
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">ECG Analysis</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleZoom('out')}
            className="p-2 bg-slate-100 rounded hover:bg-slate-200 transition-colors"
          >
            <ZoomOutIcon className="w-4 h-4 text-slate-600" />
          </button>
          <span className="text-slate-500 text-sm">{Math.round(scale * 100)}%</span>
          <button
            onClick={() => handleZoom('in')}
            className="p-2 bg-slate-100 rounded hover:bg-slate-200 transition-colors"
          >
            <ZoomInIcon className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>

      <div
        className="relative h-80 overflow-hidden border border-slate-200 rounded-lg"
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
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
          {markers.map((marker, index) => (
            <div
              key={index}
              className="absolute border rounded-md pointer-events-none"
              style={{
                left: `${marker.x}%`,
                top: `${marker.y}%`,
                width: `${marker.width}%`,
                height: `${marker.height}%`,
                borderColor: markerColors[marker.type],
              }}
            >
              <span
                className="absolute top-0 left-0 m-1 px-1.5 py-0.5 text-xs bg-white/80 rounded shadow"
                style={{ color: '#000' }}
              >
                {marker.label}
              </span>
            </div>
          ))}
        </div>

        {/* Reset View */}
        <button
          onClick={resetView}
          className="absolute bottom-4 right-4 px-3 py-1 text-sm bg-white/80 rounded shadow hover:bg-white"
        >
          Reset
        </button>
      </div>
    </div>
  )
}

function ZoomInIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" strokeWidth={2} stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-4.35-4.35m0 0a7.5 7.5 
        0 10-10.61-10.61 7.5 7.5 0 0010.61 10.61zM13 10h-3m1.5-1.5v3"
      />
    </svg>
  )
}

function ZoomOutIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" strokeWidth={2} stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-4.35-4.35m0 0a7.5 7.5 
        0 10-10.61-10.61 7.5 7.5 0 0010.61 10.61zM13 10H10"
      />
    </svg>
  )
}
