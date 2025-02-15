// components/ProcessingState.tsx

'use client'

interface ProcessingStateProps {
  currentStep: '' | 'embeddings' | 'retrieval' | 'explanation'
}

export function ProcessingState({ currentStep }: ProcessingStateProps) {
  return (
    <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200 text-center space-y-6">
      <div className="mx-auto animate-pulse">
        <EKGIcon className="w-16 h-16 text-blue-600 mx-auto" />
      </div>
      <h3 className="text-xl font-medium text-slate-900">Analyzing ECG...</h3>
      <div className="space-y-3 max-w-md mx-auto">
        <ProgressStep label="Extracting Embeddings" active={currentStep === 'embeddings'} />
        <ProgressStep label="Database Retrieval" active={currentStep === 'retrieval'} />
        <ProgressStep label="Generating Explanation" active={currentStep === 'explanation'} />
      </div>
    </div>
  )
}

function ProgressStep({ label, active }: { label: string; active: boolean }) {
  return (
    <div
      className={`flex items-center p-3 rounded-md transition-colors ${
        active ? 'bg-blue-50 border border-blue-200' : 'bg-slate-50'
      }`}
    >
      <div
        className={`w-3 h-3 rounded-full mr-3 ${
          active ? 'bg-blue-600' : 'bg-slate-300'
        }`}
      />
      <span className={active ? 'font-semibold text-blue-800' : 'text-slate-600'}>
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
      strokeWidth={1.5}
      stroke="currentColor"
      viewBox="0 0 24 24"
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
