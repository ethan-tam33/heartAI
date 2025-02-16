// components/FeedbackForm.tsx

'use client'

import { useState } from 'react'

export function FeedbackForm() {
  const [feedbackType, setFeedbackType] = useState<'confirm' | 'correct' | null>(null)
  const [comment, setComment] = useState('')

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <h2 className="text-xl font-semibold text-slate-900 mb-4">
        Provide Feedback
      </h2>
      <div className="space-y-4">
        <div className="flex gap-4">
          <button
            onClick={() => setFeedbackType('confirm')}
            className={`flex-1 p-3 rounded-lg transition-colors border 
              ${
                feedbackType === 'confirm'
                  ? 'bg-green-100 border-green-500'
                  : 'bg-slate-100 hover:bg-slate-200 border-transparent'
              }
            `}
          >
            Confirm Diagnosis
          </button>
          <button
            onClick={() => setFeedbackType('correct')}
            className={`flex-1 p-3 rounded-lg transition-colors border 
              ${
                feedbackType === 'correct'
                  ? 'bg-red-100 border-red-500'
                  : 'bg-slate-100 hover:bg-slate-200 border-transparent'
              }
            `}
          >
            Suggest Correction
          </button>
        </div>

        {feedbackType === 'correct' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Suggested Correction
            </label>
            <select className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200">
            <option>Congenital Heart Defect</option>
            <option>Ventricular Septal Defect</option>
            <option>Atrial Septal Defect</option>
            <option>Double Outlet Right Ventricle</option>
            <option>D-Loop Transposition of the Great Arteries</option>
            <option>L-Loop Transposition of the Great Arteries</option>
            <option>Single Ventricle Defect</option>
            <option>Double Inlet Left Ventricle</option>
            <option>Double Inlet Double Outlet Right Ventricle</option>
            <option>Common Atrium</option>
            <option>Superoinferior Ventricles</option>
            <option>Pulmonary Atresia</option>
            <option>Aortic-Pulmonary Anastomosis</option>
            <option>Mild Dilation</option>
            <option>Moderate Dilation</option>
            <option>Severe Dilation</option>
            <option>Tortuous Vessels</option>
            <option>Bilateral SVC</option>
            <option>Left Central IVC</option>
            <option>Left Central SVC</option>
            <option>Dextrocardia</option>
            <option>Mesocardia</option>
            <option>Inverted Ventricles</option>
            <option>Inverted Atria</option>
            <option>Heterotaxy Syndrome</option>
            <option>Marfan Syndrome</option>
            <option>CMR Artifact AO</option>
            <option>CMR Artifact PA</option>
            </select>
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            Additional Comments
          </label>
          <textarea
            className="w-full h-24 p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="Enter any additional observations..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>

        <button
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
          disabled={!feedbackType}
        >
          Submit Feedback
        </button>
      </div>
    </div>
  )
}
