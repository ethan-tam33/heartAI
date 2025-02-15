import { ECGViewer } from './ECGViewer';
import { SimilarECGThumbnail } from './SimilarECGThumbnail';
import { FeedbackForm } from './FeedbackForm';
import { useState } from 'react';
import { ComparisonViewer } from './ComparisonViewer';
import type { SimilarECG } from '@/types/ecg';
import type { Diagnosis } from '@/types/ecg';

// type Diagnosis = {
//   label: string;
//   confidence: number;
//   explanation: string;
//   markers: Array<{
//     x: number;
//     y: number;
//     width: number;
//     height: number;
//     label: string;
//     type: 'st-elevation' | 'q-wave' | 'arrhythmia';
//   }>;
// };

type ResultsDashboardProps = {
    diagnosis: Diagnosis;
    similarECGs: SimilarECG[];
  };

type SimilarECG = {
  imageUrl: string;
  similarity: number;
  diagnosis: Diagnosis;
  date: string;
  similarECGs: SimilarECG[];
};

export function ResultsDashboard({
  diagnosis,
  similarECGs,
}: ResultsDashboardProps) {
    const [comparisonECG, setComparisonECG] = useState<SimilarECG | null>(null);
    return (
    <div className="max-w-7xl mx-auto py-8">
      {comparisonECG ? (
        <ComparisonViewer
          baseImage={diagnosis.imageUrl}
          compareImage={comparisonECG.imageUrl}
          baseMarkers={diagnosis.markers}
          compareMarkers={comparisonECG.diagnosis.markers}
        />
      ) : (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto py-8">
      {/* Left Column - Diagnosis & Similar Cases */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Diagnosis Confidence
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-700">{diagnosis.label}</span>
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

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Similar ECGs
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {similarECGs.map((ecg, index) => (
              <SimilarECGThumbnail key={index} {...ecg} />
            ))}
          </div>
        </div>
      </div>

      {/* Center Column - ECG Viewer */}
      <div className="lg:col-span-1">
        <ECGViewer
          imageUrl="/sample-ecg.jpg"
          markers={diagnosis.markers}
        />
      </div>

      {/* Right Column - Explanation & Feedback */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            AI Explanation
          </h2>
          <p className="text-slate-600 leading-relaxed">
            {diagnosis.explanation}
          </p>
        </div>

        <FeedbackForm />
      </div>
    </div>
  )}

  {!comparisonECG && (
    <div className="mt-8">
      <button
        onClick={() => setComparisonECG(similarECGs[0])}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
      >
        Enable Comparison Mode
      </button>
    </div>
  )}
</div>
    );
}