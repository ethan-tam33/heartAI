import { useState, useEffect, useRef } from 'react';
import { ECGViewer } from './ECGViewer';
import type { ECGMarker } from '@/types/ecg';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export function ComparisonViewer({
  baseImage,
  compareImage,
  baseMarkers,
  compareMarkers,
}: {
  baseImage: string;
  compareImage: string;
  baseMarkers: ECGMarker[];
  compareMarkers: ECGMarker[];
}) {
  const [syncZoom, setSyncZoom] = useState(true);
  const [scale, setScale] = useState(1);
  const [annotations, setAnnotations] = useState<Array<{ x: number; y: number; text: string }>>([]);
  const [collabNotes, setCollabNotes] = useState('');
  const [measurementMode, setMeasurementMode] = useState(false);
  const [measurements, setMeasurements] = useState<Array<{
    start: { x: number; y: number };
    end: { x: number; y: number };
    distancePx: number;
    distanceMs: number;
  }>>([]);
  const [currentMeasurement, setCurrentMeasurement] = useState<{
    start: { x: number; y: number } | null;
    end: { x: number; y: number } | null;
  }>({ start: null, end: null });
  const leftContainerRef = useRef<HTMLDivElement>(null);
  const rightContainerRef = useRef<HTMLDivElement>(null);

  const handleScrollSync = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget === leftContainerRef.current && rightContainerRef.current) {
      rightContainerRef.current.scrollTop = e.currentTarget.scrollTop;
    } else if (e.currentTarget === rightContainerRef.current && leftContainerRef.current) {
      leftContainerRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const addAnnotation = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const newAnnotation = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      text: 'Annotation'
    };
    setAnnotations([...annotations, newAnnotation]);
  };

  const handleExportPDF = async () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('ECG Comparison Report', 10, 10);
    
    // Capture and add left ECG image with annotations
    const leftECG = document.getElementById('left-ecg-container');
    if (leftECG) {
      const canvas = await html2canvas(leftECG);
      const imgData = canvas.toDataURL('image/png');
      doc.addImage(imgData, 'PNG', 15, 20, 80, 60);
    }
    
    // Capture and add right ECG image
    const rightECG = document.getElementById('right-ecg-container');
    if (rightECG) {
      const canvas = await html2canvas(rightECG);
      const imgData = canvas.toDataURL('image/png');
      doc.addImage(imgData, 'PNG', 105, 20, 80, 60);
    }
    
    // Add measurements table
    doc.setFontSize(12);
    doc.text('Measurement Summary:', 10, 90);
    measurements.forEach((m, i) => {
      const yPos = 95 + (i * 7);
      doc.text(
        `Measurement ${i + 1}: ${m.distanceMs.toFixed(1)}ms (${m.distancePx.toFixed(1)}px)`, 
        15, 
        yPos
      );
    });
    
    // Add collaborative notes
    doc.addPage();
    doc.setFontSize(14);
    doc.text('Collaborative Notes:', 10, 10);
    doc.setFontSize(11);
    const splitNotes = doc.splitTextToSize(collabNotes, 180);
    doc.text(splitNotes, 10, 20);
    
    doc.save('ecg-comparison-report.pdf');
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!measurementMode) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCurrentMeasurement({
      start: { x, y },
      end: null
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!measurementMode || !currentMeasurement.start) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCurrentMeasurement(prev => ({ ...prev, end: { x, y } }));
  };

  const handleMouseUp = () => {
    if (currentMeasurement.start && currentMeasurement.end) {
      const dx = currentMeasurement.end.x - currentMeasurement.start.x;
      const dy = currentMeasurement.end.y - currentMeasurement.start.y;
      const distancePx = Math.sqrt(dx * dx + dy * dy);
      const distanceMs = (distancePx / 10) * 40; // 40ms/mm

      setMeasurements([...measurements, {
        start: currentMeasurement.start,
        end: currentMeasurement.end,
        distancePx,
        distanceMs
      }]);
    }
    setCurrentMeasurement({ start: null, end: null });
  };

  return (
    <div className="comparison-viewer">
      <div className="toolbar flex space-x-4 p-2 bg-gray-100 rounded-md mb-4">
        <button 
          onClick={() => setMeasurementMode(!measurementMode)}
          className={`px-3 py-1 rounded ${
            measurementMode 
              ? 'bg-blue-600 text-white' 
              : 'bg-white text-slate-600 border border-slate-300'
          }`}
        >
          Measurement Tool {measurementMode && '(Active)'}
        </button>
        <button onClick={handleExportPDF} className="bg-blue-600 text-white px-3 py-1 rounded">Export PDF</button>
      </div>

      <div className="comparison-containers flex space-x-4">
        {/* Left Container with synchronized scrolling and annotation capability */}
        <div 
          id="left-ecg-container"
          ref={leftContainerRef} 
          onScroll={handleScrollSync} 
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={addAnnotation}
          className="relative scroll-container overflow-auto border rounded w-1/2 h-96 cursor-crosshair"
        >
          {/* Measurement lines rendering */}
          {measurements.map((m, i) => (
            <div key={i}>
              <div
                className="absolute bg-red-500"
                style={{
                  left: m.start.x,
                  top: m.start.y,
                  width: Math.sqrt(Math.pow(m.end.x - m.start.x, 2) + Math.pow(m.end.y - m.start.y, 2)),
                  height: 2,
                  transform: `rotate(${Math.atan2(m.end.y - m.start.y, m.end.x - m.start.x)}rad)`,
                  transformOrigin: '0 50%'
                }}
              />
              <div
                className="absolute text-xs bg-white px-1 rounded"
                style={{
                  left: (m.start.x + m.end.x) / 2,
                  top: (m.start.y + m.end.y) / 2,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                {m.distanceMs.toFixed(1)}ms
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
                    Math.pow(currentMeasurement.end.x - currentMeasurement.start.x, 2) +
                    Math.pow(currentMeasurement.end.y - currentMeasurement.start.y, 2)
                  ),
                  height: 2,
                  transform: `rotate(${Math.atan2(
                    currentMeasurement.end.y - currentMeasurement.start.y,
                    currentMeasurement.end.x - currentMeasurement.start.x
                  )}rad)`,
                  transformOrigin: '0 50%'
                }}
              />
            </div>
          )}
          {/* Render left ECG image */}
          <ECGViewer 
            imageUrl={baseImage}
            markers={baseMarkers}
            scale={syncZoom ? scale : undefined}
          />
          {/* Render annotations on the left image */}
          {annotations.map((a, i) => (
            <div
              key={i}
              style={{ left: a.x, top: a.y }}
              className="absolute text-xs text-red-600 bg-white bg-opacity-75 px-1 rounded"
            >
              {a.text}
            </div>
          ))}
        </div>
        
        {/* Right Container with synchronized scrolling */}
        <div 
          id="right-ecg-container"
          ref={rightContainerRef} 
          onScroll={handleScrollSync} 
          className="scroll-container overflow-auto border rounded w-1/2 h-96"
        >
          {/* Render right ECG image */}
          <ECGViewer
            imageUrl={compareImage}
            markers={compareMarkers}
            scale={syncZoom ? scale : undefined}
          />
        </div>
      </div>

      {/* Collaborative Comparison Notes Section */}
      <div className="collab-notes mt-4">
        <label htmlFor="collabNotes" className="font-semibold">Collaborative Comparison Notes:</label>
        <textarea
          id="collabNotes"
          value={collabNotes}
          onChange={(e) => setCollabNotes(e.target.value)}
          className="w-full border rounded p-2 mt-2"
          placeholder="Enter notes here..."
        />
      </div>
    </div>
  );
}