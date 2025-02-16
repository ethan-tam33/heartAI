// app/results/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Diagnosis } from '../../../types/cmr'
import { ResultsDashboard } from '../components/ResultsDashboard'

export default function ResultsPage() {
  const router = useRouter()
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('ecgData')
    if (!raw) {
      // no data -> redirect to /upload
      router.push('/upload')
      return
    }
    const parsed = JSON.parse(raw)
    setDiagnosis(parsed.diagnosis)
  }, [router])

  if (!diagnosis) {
    // Show a skeleton or a fallback while we redirect
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Loading results...</p>
      </div>
    )
  }

  return (
    <div className="bg-white min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4">
        <ResultsDashboard diagnosis={diagnosis} />
      </div>
    </div>
  )
}
