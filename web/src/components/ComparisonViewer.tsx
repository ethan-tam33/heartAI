// components/ComparisonViewer.tsx

'use client'

import { useState, useRef } from 'react'
import { ECGViewer } from './ECGViewer'
// import type { ECGMarker } from '@/types/ecg'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { ECGMarker } from '../../types/ecg'

interface ComparisonViewerProps {
  baseImage: string
  compareImage: string
  baseMarkers: ECGMarker[]
  compareMarkers: ECGMarker[]
}

export function ComparisonViewer({
  baseImage,
  compareImage,
  baseMarkers,
  compareMarkers,
}: ComparisonViewerProps) {
  const [syncZoom, setSyncZoom] = useState(true)
  const [scale, setScale] = useState(1)
  const [annotations, setAnnotations] = useState<
    Array<{ x: number; y: number; text: string }>
  >([])
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
    if (
      e.currentTarget === leftContainerRef.current &&
      rightContainerRef.current
    ) {
      rightContainerRef.current.scrollTop = e.currentTarget.scrollTop
    } else if (
      e.currentTarget === rightContainerRef.current &&
      leftContainerRef.current
    ) {
      leftContainerRef.current.scrollTop = e.currentTarget.scrollTop
    }
  }

  const addAnnotation = (e: React.MouseEvent<HTMLDivElement>) => {
    if (measurementMode) return // skip if measurement tool is active
    const rect = e.currentTarget.getBoundingClientRect()
    const newAnnotation = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      text: 'Annotation',
    }
    setAnnotations([...annotations, newAnnotation])
  }

  const handleExportPDF = async () => {
    const doc = new jsPDF()

    // Title
    doc.setFontSize(18)
    doc.text('ECG Comparison Report', 10, 10)

    // Left ECG
    const leftECG = document.getElementById('left-ecg-container')
    if (leftECG) {
      const canvas = await html2canvas(leftECG)
      const imgData = canvas.toDataURL('image/png')
      doc.addImage(imgData, 'PNG', 15, 20, 80, 60)
    }

    // Right ECG
    const rightECG = document.getElementById('right-ecg-container')
    if (rightECG) {
      const canvas = await html2canvas(rightECG)
      const imgData = canvas.toDataURL('image/png')
      doc.addImage(imgData, 'PNG', 105, 20, 80, 60)
    }

    // Measurements
    doc.setFontSize(12)
    doc.text('Measurement Summary:', 10, 90)
    measurements.forEach((m, i) => {
      const yPos = 95 + i * 7
      doc.text(
        `Measurement ${i + 1}: ${m.distanceMs.toFixed(1)} ms (${m.distancePx.toFixed(
          1
        )} px)`,
        15,
        yPos
      )
    })

    // Collaborative notes on a new page
    doc.addPage()
    doc.setFontSize(14)
    doc.text('Collaborative Notes:', 10, 10)
    doc.setFontSize(11)
    const splitNotes = doc.splitTextToSize(collabNotes, 180)
    doc.text(splitNotes, 10, 20)

    doc.save('ecg-comparison-report.pdf')
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!measurementMode) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setCurrentMeasurement({
      start: { x, y },
      end: null,
    })
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
      const dx = currentMeasurement.end.x - currentMeasurement.start.x
      const dy = currentMeasurement.end.y - currentMeasurement.start.y
      const distancePx = Math.sqrt(dx * dx + dy * dy)
      // Example: 1 px ~ 0.1 mm, and 1 mm ~ 40 ms => 1 px ~ 4 ms (adjust as needed)
      const distanceMs = distancePx * 4

      setMeasurements([
        ...measurements,
        {
          start: currentMeasurement.start,
          end: currentMeasurement.end,
          distancePx,
          distanceMs,
        },
      ])
    }
    setCurrentMeasurement({ start: null, end: null })
  }

  return (
    <div className="comparison-viewer space-y-4">
      {/* Toolbar */}
      <div className="toolbar flex flex-wrap items-center space-x-3 p-2 bg-white border border-slate-200 rounded-md">
        <button
          onClick={() => setMeasurementMode(!measurementMode)}
          className={`px-3 py-1 rounded transition-colors ${
            measurementMode
              ? 'bg-blue-600 text-white'
              : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
          }`}
        >
          Measurement Tool {measurementMode ? '(Active)' : ''}
        </button>

        <button
          onClick={handleExportPDF}
          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
        >
          Export PDF
        </button>

        <label className="ml-auto flex items-center space-x-2">
          <span className="text-sm text-slate-700">Sync Scrolling</span>
          <input
            type="checkbox"
            checked={syncZoom}
            onChange={() => setSyncZoom((prev) => !prev)}
          />
        </label>
      </div>

      {/* Comparison Containers */}
      <div className="flex flex-col lg:flex-row lg:space-x-4 space-y-4 lg:space-y-0">
        {/* Left ECG Container */}
        <div
          id="left-ecg-container"
          ref={leftContainerRef}
          onScroll={handleScrollSync}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={addAnnotation}
          className="relative overflow-auto border border-slate-200 rounded w-full lg:w-1/2 h-96 cursor-crosshair"
        >
          {/* Render measurement lines */}
          {measurements.map((m, i) => (
            <div key={i}>
              {/* The line itself */}
              <div
                className="absolute bg-red-500"
                style={{
                  left: m.start.x,
                  top: m.start.y,
                  width: Math.sqrt(
                    Math.pow(m.end.x - m.start.x, 2) +
                      Math.pow(m.end.y - m.start.y, 2)
                  ),
                  height: 2,
                  transform: `rotate(${Math.atan2(
                    m.end.y - m.start.y,
                    m.end.x - m.start.x
                  )}rad)`,
                  transformOrigin: '0 50%',
                }}
              />
              {/* Distance Label */}
              <div
                className="absolute text-xs bg-white px-1 rounded shadow"
                style={{
                  left: (m.start.x + m.end.x) / 2,
                  top: (m.start.y + m.end.y) / 2,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {m.distanceMs.toFixed(1)} ms
              </div>
            </div>
          ))}

          {/* Current measurement preview */}
          {currentMeasurement.start && currentMeasurement.end && (
            <div>
              <div
                className="absolute bg-red-500 opacity-50"
                style={{
                  left: currentMeasurement.start.x,
                  top: currentMeasurement.start.y,
                  width: Math.sqrt(
                    Math.pow(
                      currentMeasurement.end.x - currentMeasurement.start.x,
                      2
                    ) +
                      Math.pow(
                        currentMeasurement.end.y - currentMeasurement.start.y,
                        2
                      )
                  ),
                  height: 2,
                  transform: `rotate(${Math.atan2(
                    currentMeasurement.end.y - currentMeasurement.start.y,
                    currentMeasurement.end.x - currentMeasurement.start.x
                  )}rad)`,
                  transformOrigin: '0 50%',
                }}
              />
            </div>
          )}

          {/* Left ECG Viewer */}
          <ECGViewer
            imageUrl={baseImage}
            markers={baseMarkers}
            scale={syncZoom ? scale : undefined}
          />

          {/* Render annotations */}
          {annotations.map((a, i) => (
            <div
              key={i}
              style={{ left: a.x, top: a.y }}
              className="absolute text-xs text-red-600 bg-white bg-opacity-75 px-1 py-0.5 rounded shadow"
            >
              {a.text}
            </div>
          ))}
        </div>

        {/* Right ECG Container */}
        <div
          id="right-ecg-container"
          ref={rightContainerRef}
          onScroll={handleScrollSync}
          className="overflow-auto border border-slate-200 rounded w-full lg:w-1/2 h-96"
        >
          <ECGViewer
            imageUrl={compareImage}
            markers={compareMarkers}
            scale={syncZoom ? scale : undefined}
          />
        </div>
      </div>

      {/* Collaborative Comparison Notes */}
      <div className="collab-notes mt-4 bg-white border border-slate-200 rounded p-4">
        <label htmlFor="collabNotes" className="font-semibold text-slate-700">
          Collaborative Comparison Notes:
        </label>
        <textarea
          id="collabNotes"
          value={collabNotes}
          onChange={(e) => setCollabNotes(e.target.value)}
          className="w-full border border-slate-300 rounded p-2 mt-2"
          placeholder="Enter notes here..."
          rows={4}
        />
      </div>
    </div>
  )
}
