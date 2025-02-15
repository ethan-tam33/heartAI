// app/page.tsx

'use client'

import { useState } from 'react'
import { ResultsDashboard } from '@/components/ResultsDashboard'
import { ProcessingState } from '@/components/ProcessingState'
import { useDropzone } from 'react-dropzone'
import { Diagnosis, SimilarECG } from '../../types/ecg'
// import type { Diagnosis, SimilarECG } from '@/types/ecg'

type AnalysisState = {
  status: 'idle' | 'uploading' | 'processing' | 'complete'
  currentStep: 'embeddings' | 'retrieval' | 'explanation' | ''
  files: File[]
  diagnosis: Diagnosis | null
  similarECGs: SimilarECG[]
}

export default function Home() {
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    status: 'idle',
    currentStep: '',
    files: [],
    diagnosis: null,
    similarECGs: [],
  })

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    onDrop: (acceptedFiles) => {
      // 1. Begin "upload"
      setAnalysisState((prev) => ({
        ...prev,
        status: 'uploading',
        files: acceptedFiles,
      }))

      // 2. Simulate upload delay
      setTimeout(() => {
        setAnalysisState((prev) => ({
          ...prev,
          status: 'processing',
          currentStep: 'embeddings',
        }))

        // 3. Simulate sequential processing steps
        setTimeout(() => {
          setAnalysisState((prev) => ({ ...prev, currentStep: 'retrieval' }))
          setTimeout(() => {
            setAnalysisState((prev) => ({ ...prev, currentStep: 'explanation' }))
            setTimeout(() => {
              // 4. Fill final diagnosis data
              const fileUrl = URL.createObjectURL(acceptedFiles[0])
              setAnalysisState((prev) => ({
                ...prev,
                status: 'complete',
                diagnosis: {
                  label: 'Atrial Fibrillation',
                  imageUrl: fileUrl,
                  confidence: 0.92,
                  explanation:
                    'The ECG shows irregularly irregular R-R intervals, absent P waves, and erratic fibrillatory waves - consistent with AFib. Consider checking for underlying heart disease and stroke risk.',
                  markers: [
                    {
                      x: 15,
                      y: 30,
                      width: 25,
                      height: 15,
                      label: 'Irregular R-R',
                      type: 'arrhythmia',
                    },
                    {
                      x: 40,
                      y: 45,
                      width: 20,
                      height: 10,
                      label: 'Fibrillatory Waves',
                      type: 'arrhythmia',
                    },
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
                      explanation: 'Similar baseline irregularities found...',
                      markers: [],
                    },
                    date: '2025-01-12',
                  },
                  {
                    imageUrl: '/ecg2.jpg',
                    similarity: 0.85,
                    diagnosis: {
                      imageUrl: '/ecg2.jpg',
                      label: 'Atrial Flutter',
                      confidence: 0.85,
                      explanation: 'Characteristic flutter waves are visible...',
                      markers: [],
                    },
                    date: '2025-02-01',
                  },
                ],
                currentStep: '',
              }))
            }, 1500)
          }, 1500)
        }, 2000)
      }, 1000)
    },
  })

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* IDLE: File Drop */}
        {analysisState.status === 'idle' && (
          <div
            {...getRootProps()}
            className={`flex flex-col items-center justify-center p-10 border-4 border-dashed rounded-xl cursor-pointer transition-colors 
              ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-slate-300 bg-white'}
            `}
          >
            <input {...getInputProps()} />
            <p className="text-xl text-slate-700 text-center">
              Drag & drop your ECG image here, or click to select files
            </p>
          </div>
        )}

        {/* UPLOADING */}
        {analysisState.status === 'uploading' && (
          <div className="mt-10 text-center text-slate-600">
            <p>Uploading {analysisState.files.length} file(s)...</p>
          </div>
        )}

        {/* PROCESSING */}
        {analysisState.status === 'processing' && (
          <div className="mt-10">
            <ProcessingState currentStep={analysisState.currentStep} />
          </div>
        )}

        {/* COMPLETE: Show Results */}
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
  )
}
