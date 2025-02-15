import { useState, useEffect } from 'react';
import { ResultsDashboard } from '@/components/ResultsDashboard';
import { ProcessingState } from '@/components/ProcessingState';
import { useDropzone } from 'react-dropzone';
import type { Diagnosis } from '../../types/ecg';
import { SimilarECG } from '../../types/ecg';

type AnalysisState = {
  status: 'idle' | 'uploading' | 'processing' | 'complete';
  currentStep?: 'embeddings' | 'retrieval' | 'explanation';
  files: File[];
  diagnosis?: Diagnosis; 
  similarECGs?: SimilarECG[];
};

export default function Home() {
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    status: 'idle', 
    files: [],
    currentStep: '',
    diagnosis: null,
    similarECGs: [],
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: 'image/*',
    onDrop: (acceptedFiles) => {
      setAnalysisState((prev) => ({ ...prev, status: 'uploading', files: acceptedFiles }));
      // Simulate upload delay
      setTimeout(() => {
        setAnalysisState((prev) => ({ ...prev, status: 'processing', currentStep: 'embeddings' }));
        // Simulate processing steps sequentially
        setTimeout(() => {
          setAnalysisState((prev) => ({ ...prev, currentStep: 'retrieval' }));
          setTimeout(() => {
            setAnalysisState((prev) => ({ ...prev, currentStep: 'explanation' }));
            setTimeout(() => {
              // Set final diagnosis data and similar ECGs
              setAnalysisState((prev) => ({
                ...prev,
                status: 'complete',
                diagnosis: {
                  label: 'Atrial Fibrillation',
                  imageUrl: URL.createObjectURL(acceptedFiles[0]),
                  confidence: 0.92,
                  explanation: 'The ECG shows irregularly irregular R-R intervals, absent P waves, and erratic baseline fibrillatory waves - consistent with atrial fibrillation. Consider checking for underlying structural heart disease and stroke risk factors.',
                  markers: [
                    { x: 15, y: 30, width: 25, height: 15, label: 'Irregular R-R', type: 'arrhythmia' },
                    { x: 40, y: 45, width: 20, height: 10, label: 'Fibrillatory Waves', type: 'arrhythmia' }
                  ],
                },
                similarECGs: [
                  {
                    imageUrl: '/ecg1.jpg',
                    similarity: 0.89,
                    diagnosis: {
                      imageUrl: '/ecg1.jpg',
                      label: 'Atrial Fibrillation',
                      confidence: 0.89,
                      explanation: '...',
                      markers: []
                    },
                    date: '2024-03-15'
                  },
                  {
                    imageUrl: '/ecg2.jpg',
                    similarity: 0.85,
                    diagnosis: {
                      imageUrl: '/ecg2.jpg',
                      label: 'Atrial Flutter', 
                      confidence: 0.85,
                      explanation: '...',
                      markers: []
                    },
                    date: '2024-03-14'
                  }
                ],
                currentStep: '',
              }));
            }, 2000);
          }, 2000);
        }, 2000);
      }, 1000);
    },
  });

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {analysisState.status === 'idle' && (
          <div
            {...getRootProps()}
            className={`flex flex-col items-center justify-center p-10 border-4 border-dashed rounded-xl cursor-pointer transition-colors
                        ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-slate-300 bg-white'}`}
          >
            <input {...getInputProps()} />
            <p className="text-xl text-slate-700">Drag & drop your ECG image here, or click to select files</p>
          </div>
        )}
        
        {analysisState.status === 'uploading' && (
          <div className="mt-10 text-center text-slate-600">
            <p>Uploading {analysisState.files.length} file(s)...</p>
          </div>
        )}
        
        {analysisState.status === 'processing' && (
          <div className="mt-10">
            <ProcessingState currentStep={analysisState.currentStep} />
          </div>
        )}
        
        {analysisState.status === 'complete' && analysisState.diagnosis && (
          <div className="mt-10">
            <ResultsDashboard
              diagnosis={analysisState.diagnosis}
              similarECGs={analysisState.similarECGs}
            />
          </div>
        )}
      </div>
    </main>
  );
}