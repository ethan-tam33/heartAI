'use client';
// ElevenLabsConvai.tsx
import React, { useRef, useEffect } from 'react';

interface ElevenLabsConvaiProps {
  agentId: string;
}

const ElevenLabsConvai: React.FC<ElevenLabsConvaiProps> = ({ agentId }) => {
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (elementRef.current) {
      // If you need to set any attributes or methods on the element, you can do it here
      elementRef.current.setAttribute('agent-id', agentId);
    }
  }, [agentId]);

  return React.createElement('elevenlabs-convai', {
    ref: elementRef,
  });
};

export default ElevenLabsConvai;
