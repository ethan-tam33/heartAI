// // components/ResultsDashboard.tsx

'use client'

import { FeedbackForm } from './FeedbackForm'
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
      
      <div className="col-span-3 flex items-center justify-center bg-white rounded-xl shadow-sm border border-slate-200">
        <Heart path={"smooth_heart_2.html"}></Heart>
      </div>
    </div>
  )
}
