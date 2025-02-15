// components/SimilarECGThumbnail.tsx

'use client'

import { Diagnosis } from "../../types/ecg"

// import type { Diagnosis } from '@/types/ecg'

interface SimilarECGThumbnailProps {
  imageUrl: string
  similarity: number
  diagnosis: Diagnosis
  date: string
}

export function SimilarECGThumbnail({
  imageUrl,
  similarity,
  diagnosis,
  date,
}: SimilarECGThumbnailProps) {
  return (
    <div className="group relative cursor-pointer bg-slate-50 rounded-lg overflow-hidden border border-slate-200 hover:shadow-lg hover:border-blue-200 transition-all">
      <img
        src={imageUrl}
        alt="Similar ECG"
        className="object-cover w-full h-32"
      />
      <div className="p-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-medium text-slate-700">
            {diagnosis.label}
          </span>
          <span className="text-xs font-semibold text-blue-600">
            {similarity}%
          </span>
        </div>
        <div className="text-xs text-slate-500">{date}</div>
      </div>
      {/* Overlay with "Compare" text */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <span className="text-white text-sm font-medium">Compare</span>
      </div>
    </div>
  )
}
