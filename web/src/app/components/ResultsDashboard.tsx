// // components/ResultsDashboard.tsx

'use client'

import { FeedbackForm } from './FeedbackForm'
import { ECGViewer } from './ECGViewer'
import type { Diagnosis } from '../../../types/cmr'
import Heart from './Heart'

interface ResultsDashboardProps {
  diagnosis: Diagnosis
}

function labelsToString(labels: string[]) {
  return labels.join(', ');
}

export function ResultsDashboard({ diagnosis }: ResultsDashboardProps) {
  console.log(diagnosis)
  return (
    <div className="grid grid-cols-5 gap-8 h-screen p-6">
      {/* Left Column: Diagnosis Confidence, AI Explanation, and Feedback */}
      <div className="col-span-2 space-y-6 flex flex-col">
        {/* Diagnosis Confidence */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Diagnosis Confidence
          </h2>
          <div className="space-y-3">
            <span className="text-slate-800">Severity: {diagnosis.severity}</span>
            <div className="flex items-center justify-between">
              <span className="text-slate-800">{labelsToString(diagnosis.labels)}</span>
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
<<<<<<< HEAD

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
=======
>>>>>>> aaaebfcb473417e688ddbdeda7aa0b36f1e4788d
        </div>

        {/* AI Explanation */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            AI Explanation
          </h2>
          <p className="text-slate-700 leading-relaxed">
            {diagnosis.explanation}
          </p>
        </div>

        {/* Feedback Form */}
        <FeedbackForm />
      </div>
      
      {/* <div className="col-span-3 flex items-center justify-center bg-white rounded-xl shadow-sm border border-slate-200"> */}
      <div className="col-span-3 flex items-center justify-center bg-white rounded-xl shadow-sm border border-slate-200">
        <Heart path={"smooth_heart_2.html"}></Heart>
      </div>
    </div>
  )
}
