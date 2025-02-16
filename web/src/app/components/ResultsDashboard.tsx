// components/ResultsDashboard.tsx

'use client'

import { useState } from 'react'
import { ComparisonViewer } from './ComparisonViewer'
import { FeedbackForm } from './FeedbackForm'
import { ECGViewer } from './ECGViewer'
import { SimilarECGThumbnail } from './SimilarECGThumbnail'
import type { Diagnosis, SimilarECG } from '../../../types/ecg'

interface ResultsDashboardProps {
  diagnosis: Diagnosis
  similarECGs: SimilarECG[]
}

export function ResultsDashboard({ diagnosis, similarECGs }: ResultsDashboardProps) {
  const [comparisonECG, setComparisonECG] = useState<SimilarECG | null>(null)

  return (
    <div className="space-y-8">
      {comparisonECG ? (
        // Comparison Mode
        <ComparisonViewer
          baseImage={diagnosis.imageUrl}
          compareImage={comparisonECG.imageUrl}
          baseMarkers={diagnosis.markers}
          compareMarkers={comparisonECG.diagnosis.markers}
        />
      ) : (
        // Normal Results Dashboard
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Column 1: Diagnosis + Similar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Diagnosis Confidence */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                Diagnosis Confidence
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-800">{diagnosis.label}</span>
                  <span className="font-medium text-blue-600">
                    {(diagnosis.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="relative pt-1">
                  <div className="overflow-hidden h-2 bg-slate-200 rounded-full">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${diagnosis.confidence * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Similar ECGs */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                Similar ECGs
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {similarECGs.map((ecg, index) => (
                  <div
                    key={index}
                    onClick={() => setComparisonECG(ecg)}
                    className="cursor-pointer"
                  >
                    <SimilarECGThumbnail {...ecg} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2: ECG Viewer */}
          <div className="lg:col-span-1">
            <ECGViewer imageUrl={diagnosis.imageUrl} markers={diagnosis.markers} />
          </div>

          {/* Column 3: Explanation + Feedback */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                AI Explanation
              </h2>
              <p className="text-slate-700 leading-relaxed">
                {diagnosis.explanation}
              </p>
              <button
                onClick={() => (window.location.href = '/ai-agent')}
                className="flex items-center mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 1v11m-6.5 3.5a6.5 6.5 0 0113 0v1h-2a4.5 4.5 0 00-9 0h-2v-1z"
                  ></path>
                </svg>
                Enable Microphone
              </button>
            </div>
            <FeedbackForm />
          </div>
        </div>
      )}

      {/* Button to jump into comparison with the first ECG, if available */}
      {!comparisonECG && similarECGs.length > 0 && (
        <div className="text-center">
          <button
            onClick={() => setComparisonECG(similarECGs[0])}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
          >
            Enable Comparison Mode
          </button>
        </div>
      )}
    </div>
  )
}
