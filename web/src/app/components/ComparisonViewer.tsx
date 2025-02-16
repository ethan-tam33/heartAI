// components/ComparisonViewer.tsx

'use client'

import { useState, useRef } from 'react'
import type { CMRMarker } from '../../../types/cmr'
import { ECGViewer } from './ECGViewer'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface ComparisonViewerProps {
  baseImage: string
  compareImage: string
  baseMarkers: CMRMarker[]
  compareMarkers: CMRMarker[]
}

export function ComparisonViewer({
  baseImage,
  compareImage,
  baseMarkers,
  compareMarkers,
}: ComparisonViewerProps) {
  const [syncZoom, setSyncZoom] = useState(true)
  const [scale, setScale] = useState(1)
  const [annotations, setAnnotations] = useState<Array<{ x: number; y: number; text: string }>>([])
  const [collabNotes, setCollabNotes] = useState('')
  const [measurementMode, setMeasurementMode] = useState(false)
  const [measurements, setMeasurements] = useState<
    Array<{
      start: { x: number; y: number }
      end: { x: number; y: number }
      distancePx: number
      distanceMs: number
    }>
  >([])
  const [currentMeasurement, setCurrentMeasurement] = useState<{
    start: { x: number; y: number } | null
    end: { x: number; y: number } | null
  }>({ start: null, end: null })

  const leftContainerRef = useRef<HTMLDivElement>(null)
  const rightContainerRef = useRef<HTMLDivElement>(null)

  const handleScrollSync = (e: React.UIEvent<HTMLDivElement>) => {
    if (!syncZoom) return
    const leftEl = leftContainerRef.current
    const rightEl = rightContainerRef.current
    if (!leftEl || !rightEl) return

    if (e.currentTarget === leftEl) {
      rightEl.scrollTop = leftEl.scrollTop
    } else if (e.currentTarget === rightEl) {
      leftEl.scrollTop = rightEl.scrollTop
    }
  }

  const addAnnotation = (e: React.MouseEvent<HTMLDivElement>) => {
    if (measurementMode) return
    const rect = e.currentTarget.getBoundingClientRect()
    setAnnotations((prev) => [
      ...prev,
      {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        text: 'Annotation',
      },
    ])
  }

  const handleExportPDF = async () => {
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text('ECG Comparison Report', 10, 10)

    // Capture left container
    const leftEl = document.getElementById('left-ecg-container')
    if (leftEl) {
      const leftCanvas = await html2canvas(leftEl)
      doc.addImage(leftCanvas.toDataURL('image/png'), 'PNG', 15, 20, 80, 60)
    }

    // Capture right container
    const rightEl = document.getElementById('right-ecg-container')
    if (rightEl) {
      const rightCanvas = await html2canvas(rightEl)
      doc.addImage(rightCanvas.toDataURL('image/png'), 'PNG', 105, 20, 80, 60)
    }

    // Measurements
    doc.setFontSize(12)
    doc.text('Measurement Summary:', 10, 90)
    measurements.forEach((m, i) => {
      const yPos = 95 + i * 7
      doc.text(
        `#${i + 1}: ${m.distanceMs.toFixed(1)} ms (${m.distancePx.toFixed(1)} px)`,
        15,
        yPos
      )
    })

    // Add new page for collaborative notes
    doc.addPage()
    doc.setFontSize(14)
    doc.text('Collaborative Notes:', 10, 10)
    doc.setFontSize(11)
    const splitted = doc.splitTextToSize(collabNotes, 180)
    doc.text(splitted, 10, 20)

    doc.save('comparison-report.pdf')
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!measurementMode) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setCurrentMeasurement({ start: { x, y }, end: null })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!measurementMode || !currentMeasurement.start) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setCurrentMeasurement((prev) => ({ ...prev, end: { x, y } }))
  }

  const handleMouseUp = () => {
    if (currentMeasurement.start && currentMeasurement.end) {
      const { start, end } = currentMeasurement
      const dx = end.x - start.x
      const dy = end.y - start.y
      const distancePx = Math.sqrt(dx * dx + dy * dy)
      // Example ratio
      const distanceMs = distancePx * 4
      setMeasurements((prev) => [
        ...prev,
        { start, end, distancePx, distanceMs },
      ])
    }
    setCurrentMeasurement({ start: null, end: null })
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <div className="flex space-x-2">
          <button
            onClick={() => setMeasurementMode(!measurementMode)}
            className={`px-4 py-2 rounded ${
              measurementMode
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-blue-600 text-blue-600 hover:bg-blue-100'
            }`}
          >
            {measurementMode ? 'Measurement: ON' : 'Measurement: OFF'}
          </button>
          <button
            onClick={handleExportPDF}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Export PDF
          </button>
        </div>
        <label className="flex items-center space-x-2 text-sm text-slate-700">
          <span>Sync Scrolling:</span>
          <input
            type="checkbox"
            checked={syncZoom}
            onChange={() => setSyncZoom((prev) => !prev)}
          />
        </label>
      </div>

      {/* Comparison Containers */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Left */}
        <div
          id="left-ecg-container"
          ref={leftContainerRef}
          onScroll={handleScrollSync}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={addAnnotation}
          className="relative overflow-auto border border-slate-200 rounded w-full lg:w-1/2 h-96 bg-white"
          style={{ cursor: measurementMode ? 'crosshair' : 'auto' }}
        >
          {/* Existing measurements */}
          {measurements.map((m, i) => (
            <MeasurementOverlay key={i} measurement={m} />
          ))}
          {/* Current measurement preview */}
          {currentMeasurement.start && currentMeasurement.end && (
            <MeasurementPreview start={currentMeasurement.start} end={currentMeasurement.end} />
          )}
          {/* ECGViewer for left */}
          <ECGViewer imageUrl={baseImage} markers={baseMarkers} scale={syncZoom ? scale : undefined} />
          {/* Annotations */}
          {annotations.map((a, i) => (
            <div
              key={i}
              style={{ left: a.x, top: a.y }}
              className="absolute text-xs text-red-600 bg-white bg-opacity-70 px-1 py-0.5 rounded"
            >
              {a.text}
            </div>
          ))}
        </div>

        {/* Right */}
        <div
          id="right-ecg-container"
          ref={rightContainerRef}
          onScroll={handleScrollSync}
          className="overflow-auto border border-slate-200 rounded w-full lg:w-1/2 h-96 bg-white"
        >
          <ECGViewer imageUrl={compareImage} markers={compareMarkers} scale={syncZoom ? scale : undefined} />
        </div>
      </div>

      {/* Collaborative Notes */}
      <div className="bg-white border border-slate-200 rounded p-4">
        <label htmlFor="notes" className="block font-semibold text-slate-700 mb-2">
          Collaborative Notes:
        </label>
        <textarea
          id="notes"
          value={collabNotes}
          onChange={(e) => setCollabNotes(e.target.value)}
          rows={3}
          className="w-full border border-slate-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="Share your thoughts here..."
        />
      </div>
    </div>
  )
}

/** Helper components for measurement overlays **/
function MeasurementOverlay({ measurement }: { measurement: {
  start: { x: number; y: number }
  end: { x: number; y: number }
  distancePx: number
  distanceMs: number
}}) {
  const { start, end, distancePx, distanceMs } = measurement
  const angle = Math.atan2(end.y - start.y, end.x - start.x)
  const length = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2))
  return (
    <>
      <div
        className="absolute bg-red-500"
        style={{
          left: start.x,
          top: start.y,
          width: length,
          height: 2,
          transform: `rotate(${angle}rad)`,
          transformOrigin: '0 50%',
        }}
      />
      <div
        className="absolute text-xs bg-white px-1 py-0.5 rounded shadow"
        style={{
          left: (start.x + end.x) / 2,
          top: (start.y + end.y) / 2,
          transform: 'translate(-50%, -50%)',
        }}
      >
        {distanceMs.toFixed(1)} ms
      </div>
    </>
  )
}

function MeasurementPreview({ start, end }: { start: { x: number; y: number }, end: { x: number; y: number } }) {
  const angle = Math.atan2(end.y - start.y, end.x - start.x)
  const length = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2))
  return (
    <div
      className="absolute bg-red-500 opacity-50"
      style={{
        left: start.x,
        top: start.y,
        width: length,
        height: 2,
        transform: `rotate(${angle}rad)`,
        transformOrigin: '0 50%',
      }}
    />
  )
}
