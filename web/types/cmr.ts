// types/cmr.d.ts
export interface CMRMarker {
    x: number
    y: number
    width: number
    height: number
    label: string
    type: 'st-elevation' | 'q-wave' | 'arrhythmia'
  }
  
  export interface Diagnosis {
    labels: string[]
    imageUrl: string
    confidence: number
    explanation: string
    severity: string
  }
  
  // export interface SimilarECG {
  //   imageUrl: string
  //   similarity: number
  //   diagnosis: Diagnosis
  //   date: string
  // }
  