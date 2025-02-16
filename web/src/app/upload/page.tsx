'use client'

import { useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Diagnosis } from '../../../types/cmr'

type AnalysisState = {
  status: 'idle' | 'uploading' | 'processing' | 'complete'
  currentStep: 'embeddings' | 'retrieval' | 'explanation' | ''
  files: File[]
  diagnosis: Diagnosis | null
  suggestionText?: string
  suggestionLinks?: string[]
}

// A small utility to replace bracket references [1], [2], etc. with clickable links.
// e.g., text = "This suggests coronary artery disease [1], also consider [2]."
//       links = ["https://some-resource.com", "https://another-resource.com"]
// This function returns an array of React nodes that contain the text plus the clickable links.
function parseSuggestionText(text: string, links: string[]): (string | JSX.Element)[] {
  // Regex to find bracket references like [1], [2], [17], etc.
  const regex = /\[(\d+)\]/g
  const parts = []
  let lastIndex = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    // match[0] is "[1]" for example
    // match[1] is "1"
    const index = match.index
    // Push the text before this bracket
    if (index > lastIndex) {
      parts.push(text.slice(lastIndex, index))
    }
    const linkNumber = parseInt(match[1], 10) // convert "1" -> 1
    const linkUrl = links[linkNumber - 1] // linkNumber is 1-based
    if (linkUrl) {
      parts.push(
        <a
          key={index}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline mx-1"
        >
          {match[0]}
        </a>
      )
    } else {
      // If we can't find a matching link, just render the bracket text as-is
      parts.push(match[0])
    }
    lastIndex = regex.lastIndex
  }

  // Push any remaining text after the last bracket
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts
}

export default function UploadPage() {
  const router = useRouter()
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    status: 'idle',
    currentStep: '',
    files: [],
    diagnosis: null,
  })

  // This function calls our FastAPI backend
  // NOTE: We changed the URL to "http://localhost:8000/upload" and added CORS in FastAPI
  const sendBase64ToServer = async (base64String: string): Promise<any> => {
    try {
      const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nii_path: base64String }),
      })
      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`)
      }
      const responseData = await response.json()
      console.log('Server response:', responseData)
      return responseData
    } catch (error) {
      console.error('Error uploading file:', error)
      throw error
    }
  }

  // Reads the file as base64, sends it to the server, and returns the diagnosis data.
  const handleFileUpload = async (file: File): Promise<any> => {
    if (!file) {
      throw new Error('No file selected')
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async () => {
        const base64String = reader.result?.toString().split(',')[1] // Extract base64 from Data URL
        if (!base64String) {
          reject('Failed to extract Base64 from Data URL')
          return
        }
        try {
          // Send the base64 to the server, which should return relevant fields (diagnosis, links, etc.)
          const response = await sendBase64ToServer(base64String)
          resolve(response)
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = () => {
        reject('Error reading file')
      }

      reader.readAsDataURL(file)
    })
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/nii': ['.nii'] },
    onDrop: (acceptedFiles) => {
      if (!acceptedFiles.every((file) => file.name.endsWith('.nii'))) {
        alert('Only .nii files are allowed.')
        return
      }

      setAnalysisState((prev) => ({
        ...prev,
        status: 'uploading',
        files: acceptedFiles,
      }))

      // Simulate a step-by-step process for demonstration
      setTimeout(() => {
        setAnalysisState((prev) => ({
          ...prev,
          status: 'processing',
          currentStep: 'embeddings',
        }))

        setTimeout(() => {
          setAnalysisState((prev) => ({ ...prev, currentStep: 'retrieval' }))
          setTimeout(async () => {
            setAnalysisState((prev) => ({ ...prev, currentStep: 'explanation' }))
            try {
              // In a real scenario, you'd do this immediately once user drops the file
              const file = acceptedFiles[0]
              const response: any = await handleFileUpload(file)

              // Convert to a blob URL for preview (if needed)
              const fileUrl = URL.createObjectURL(file)

              // If the backend returns a structured response, parse it and store in state
              // Example of response: 
              // {
              //   "diagnosis_text": "Diagnosis with [1], [2] references ...",
              //   "links": ["https://link1", "https://link2"],
              //   ...
              // }
              let replacedTextElements: (string | JSX.Element)[] = []
              if (response.diagnosis_text && response.links) {
                replacedTextElements = parseSuggestionText(response.diagnosis_text, response.links)
              }

              setAnalysisState((prev) => ({
                ...prev,
                status: 'complete',
                diagnosis: {
                  labels: [response.first_diagnosis], // you can populate from server if needed
                  imageUrl: fileUrl,
                  confidence: response.confidence * 150,
                  explanation: response.diagnosis_text || '',
                  severity: response.confidence * 150 > 50 ? 'Moderate' : 'Mild',
                },
                suggestionText: response.diagnosis_text || '',
                suggestionLinks: response.links || [],
                currentStep: '',
              }))
            } catch (error) {
              console.error('Error uploading file:', error)
              setAnalysisState((prev) => ({
                ...prev,
                status: 'idle',
                currentStep: '',
                files: [],
              }))
              alert('There was an error processing your file. See console.')
            }
          }, 1500)
        }, 1500)
      }, 1000)
    },
  })

  const handleViewResults = () => {
    if (!analysisState.diagnosis) return
    // Just store in sessionStorage so /results page can read it
    sessionStorage.setItem('ecgData', JSON.stringify(analysisState))
    router.push('/results')
  }

  return (
    <div className="flex items-center justify-center h-screen w-screen">
      <div className="max-w-4xl mx-auto py-10 px-4 space-y-8">
        <h1 className="text-3xl font-bold text-slate-900">Upload Your CMR</h1>

        {analysisState.status === 'idle' && (
          <div
            {...getRootProps()}
            className={`flex flex-col items-center justify-center p-10 border-4 border-dashed rounded-xl cursor-pointer transition-colors 
              ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-slate-300 bg-white'}
            `}
          >
            <input {...getInputProps()} />
            <p className="text-lg text-slate-700 text-center">
              Drag & drop your CMR (.nii) file here, or click to select
            </p>
          </div>
        )}

        {analysisState.status === 'uploading' && (
          <p className="text-center text-slate-500">Uploading your file...</p>
        )}

        {analysisState.status === 'processing' && (
          <div className="text-center text-slate-500">
            Processing... (Step: {analysisState.currentStep})
          </div>
        )}

        {/* Show final result + link to results page */}
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
