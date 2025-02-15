// components/ProcessingState.tsx

'use client'

interface ProcessingStateProps {
  currentStep: '' | 'embeddings' | 'retrieval' | 'explanation'
}

export function ProcessingState({ currentStep }: ProcessingStateProps) {
  return (
    <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-pulse">
          <EKGIcon className="w-16 h-16 text-blue-600" />
        </div>
        <h3 className="text-lg font-medium text-slate-900">Analyzing ECG</h3>

        <div className="w-full space-y-2">
          <ProgressStep
            label="Extracting Embeddings"
            active={currentStep === 'embeddings'}
          />
          <ProgressStep
            label="Database Retrieval"
            active={currentStep === 'retrieval'}
          />
          <ProgressStep
            label="Generating Explanation"
            active={currentStep === 'explanation'}
          />
        </div>
      </div>
    </div>
  )
}

function ProgressStep({ label, active }: { label: string; active: boolean }) {
  return (
    <div
      className={`flex items-center space-x-3 p-3 rounded-lg ${
        active ? 'bg-blue-50' : 'bg-slate-50'
      }`}
    >
      <div
        className={`h-2 w-2 rounded-full ${
          active ? 'bg-blue-600' : 'bg-slate-300'
        }`}
      />
      <span
        className={`text-sm font-medium ${
          active ? 'text-blue-800' : 'text-slate-500'
        }`}
      >
        {label}
      </span>
    </div>
  )
}

function EKGIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 7.125C2.25 6.504 2.754 6 
        3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 
        .621-.504 1.125-1.125 1.125h-6a1.125 1.125 
        0 01-1.125-1.125v-3.75zM14.25 8.625c0
        -.621.504-1.125 1.125-1.125h5.25c.621 0 
        1.125.504 1.125 1.125v8.25c0 .621-.504 1.125
        -1.125 1.125h-5.25a1.125 1.125 
        0 01-1.125-1.125v-8.25zM3.75 16.125c0 
        -.621.504-1.125 1.125-1.125h5.25c.621 0 
        1.125.504 1.125 1.125v2.25c0 .621
        -.504 1.125-1.125 1.125h-5.25a1.125 
        1.125 0 01-1.125-1.125v-2.25z"
      />
    </svg>
  )
}
