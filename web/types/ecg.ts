// types/ecg.ts
export type ECGMarker = {
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
    type: 'st-elevation' | 'q-wave' | 'arrhythmia';
  };
  
  export type Diagnosis = {
    imageUrl: string;
    label: string;
    confidence: number;
    explanation: string;
    markers: ECGMarker[];
  };
  
  export type SimilarECG = {
    imageUrl: string;
    similarity: number;
    diagnosis: Diagnosis;
    date: string;
  };