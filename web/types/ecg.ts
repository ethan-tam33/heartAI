// types/ecg.d.ts

export interface ECGMarker {
    x: number
    y: number
    width: number
    height: number
    label: string
    type: 'st-elevation' | 'q-wave' | 'arrhythmia'
  }
  
  export interface Diagnosis {
    label: string
    imageUrl: string
    confidence: number
    explanation: string
    markers: ECGMarker[]
  }
  
  export interface SimilarECG {
    imageUrl: string
    similarity: number
    diagnosis: Diagnosis
    date: string
  }
  