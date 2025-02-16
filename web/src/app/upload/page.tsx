// app/upload/page.tsx

'use client'

import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Diagnosis } from '../../../types/cmr'

type AnalysisState = {
  status: 'idle' | 'uploading' | 'processing' | 'complete'
  currentStep: 'embeddings' | 'retrieval' | 'explanation' | ''
  files: File[]
  diagnosis: Diagnosis | null
}

export default function UploadPage() {
  const router = useRouter()
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    status: 'idle',
    currentStep: '',
    files: [],
    diagnosis: null,
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

      // 2. Simulate upload + processing
      setTimeout(() => {
        setAnalysisState((prev) => ({
          ...prev,
          status: 'processing',
          currentStep: 'embeddings',
        }))

        setTimeout(() => {
          setAnalysisState((prev) => ({ ...prev, currentStep: 'retrieval' }))
          setTimeout(() => {
            setAnalysisState((prev) => ({ ...prev, currentStep: 'explanation' }))
            setTimeout(() => {
              // Generate final data
              const fileUrl = URL.createObjectURL(acceptedFiles[0])
              setAnalysisState((prev) => ({
                ...prev,
                status: 'complete',
                diagnosis: {
                  labels: ['Congenital Heart Defect', 'Ventricular Septal Defect'],
                  imageUrl: fileUrl,
                  confidence: 0.92,
                  explanation:
                    'The CMR shows irregularly irregular R-R intervals, absent P waves, and baseline fibrillations consistent with AFib.',
                  severity: 'Moderate',
                },
                currentStep: '',
              }))
            }, 1500)
          }, 1500)
        }, 1500)
      }, 1000)
    },
  })

  const handleViewResults = () => {
    if (!analysisState.diagnosis) return
    // Move to results page with your data
    // Option 1: Use localStorage or server to store data & retrieve in /results
    // Option 2: Next 13 can do route actions with server, etc.
    // For a quick solution, let's just store in sessionStorage:
    sessionStorage.setItem('ecgData', JSON.stringify(analysisState))
    router.push('/results')
  }

  return (
    <div className="flex items-center justify-center h-screen w-screen">
      <div className="max-w-4xl mx-auto py-10 px-4 space-y-8">
        <h1 className="text-3xl font-bold text-slate-900">Upload Your CMR</h1>

        {/* File Drop Box */}
        {analysisState.status === 'idle' && (
          <div
            {...getRootProps()}
            className={`flex flex-col items-center justify-center p-10 border-4 border-dashed rounded-xl cursor-pointer transition-colors 
              ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-slate-300 bg-white'}
            `}
          >
            <input {...getInputProps()} />
            <p className="text-lg text-slate-700 text-center">
              Drag & drop your CMR image here, or click to select files
            </p>
          </div>
        )}

        {/* Uploading */}
        {analysisState.status === 'uploading' && (
          <p className="text-center text-slate-500">Uploading your file(s)...</p>
        )}

        {/* Processing Steps */}
        {analysisState.status === 'processing' && (
          <div className="text-center text-slate-500">Processing...</div>
        )}

        {/* Complete -> Link to results */}
        {analysisState.status === 'complete' && analysisState.diagnosis && (
          <div className="bg-white rounded-lg shadow p-6 text-center space-y-4">
            <h2 className="text-xl font-semibold text-green-700">
              Analysis Complete!
            </h2>
            <button
              onClick={handleViewResults}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Results
            </button>
          </div>
        )}

        <div className="pt-6 border-t border-slate-200 flex justify-between">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
