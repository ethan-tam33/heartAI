'use client'

import { FeedbackForm } from './FeedbackForm'
import type { Diagnosis } from '../../../types/cmr'
import Heart from './Heart'
import React, { useState } from 'react'
import ElevenLabsConvai from './ElevenLabsConvai'
import Script from 'next/script'

interface ResultsDashboardProps {
  diagnosis: Diagnosis
}

function labelsToString(labels: string[]) {
  return labels.join(', ');
}

// Link formatter: converts bracket references like [1] into clickable links.
function parseSuggestionText(text: string, links: string[]): (string | JSX.Element)[] {
  const regex = /\[(\d+)\]/g;
  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const index = match.index;
    if (index > lastIndex) {
      parts.push(text.slice(lastIndex, index));
    }
    const linkNumber = parseInt(match[1], 10);
    const linkUrl = links[linkNumber - 1]; // Adjust for 1-based index in text
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
      );
    } else {
      parts.push(match[0]);
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

export function ResultsDashboard({ diagnosis }: ResultsDashboardProps) {
  const [showAgent, setShowAgent] = useState(false);

  const handleAgentToggle = () => {
    setShowAgent((prev) => !prev);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 min-h-screen">
        {/* Left Column: AI Explanation */}
        <div className="space-y-6">
          {/* AI Explanation */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-900">AI Explanation</h2>
              {/* Animated AI button with tooltip */}
              <div className="relative group">
                <button
                  onClick={handleAgentToggle}
                  className="relative w-12 h-12 flex items-center justify-center focus:outline-none"
                  title="Talk to AI"
                >
                  {/* Animated outer layers */}
                  <div className="absolute inset-0 rounded-full bg-blue-600 opacity-75 animate-[siriPulse1_2s_infinite]"></div>
                  <div className="absolute inset-0 rounded-full bg-blue-600 opacity-50 animate-[siriPulse2_2s_infinite]"></div>
                  {/* Solid center */}
                  <div className="relative w-8 h-8 rounded-full bg-blue-600"></div>
                </button>
                <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2">
                  Talk to AI
                </div>
              </div>
            </div>
            <p className="text-slate-700 leading-relaxed">
              {diagnosis.suggestionLinks
                ? parseSuggestionText(diagnosis.explanation, diagnosis.suggestionLinks)
                : diagnosis.explanation}
            </p>
          </div>
          {/* Feedback Form */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <FeedbackForm />
          </div>
        </div>

        {/* Right Column: Diagnosis Confidence, Visualization, and Feedback */}
        <div className="space-y-6 flex flex-col">
          {/* Diagnosis Confidence */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Diagnosis Confidence
            </h2>
            <div className="space-y-3">
              <span className="text-slate-800">Severity: {diagnosis.severity}</span>
              <div className="flex items-center justify-between">
                <span className="text-slate-800">{labelsToString(diagnosis.labels)}</span>
                <span className="font-medium text-blue-600">
                  {(diagnosis.confidence * 100).toFixed(1)}%
                </span>
              </div>
              <div className="relative pt-1">
                <div className="overflow-hidden h-2 bg-slate-200 rounded-full">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${diagnosis.confidence * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Visualization */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-150 overflow-hidden flex items-center justify-center">
            <Heart path={diagnosis.path} />
          </div>
        </div>
      </div>

      {/* ElevenLabs Agent Chat Widget (only rendered when showAgent is true) */}
      {showAgent && (
        <>
          <div className="fixed bottom-4 right-4 z-50">
            <ElevenLabsConvai agentId="qvrdSMDiMkSTgn2twg5v" />
          </div>
          <Script
            src="https://elevenlabs.io/convai-widget/index.js"
            strategy="lazyOnload"
            async
            type="text/javascript"
          />
        </>
      )}

      {/* Custom CSS animations for the AI circle */}
      <style jsx>{`
        @keyframes siriPulse1 {
          0% {
            transform: scale(0.8);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.2;
          }
          100% {
            transform: scale(0.8);
            opacity: 0.8;
          }
        }
        @keyframes siriPulse2 {
          0% {
            transform: scale(0.9);
            opacity: 0.7;
          }
          50% {
            transform: scale(1.3);
            opacity: 0.3;
          }
          100% {
            transform: scale(0.9);
            opacity: 0.7;
          }
        }
        /* Utility classes for the custom animations */
        .animate-\[siriPulse1_2s_infinite\] {
          animation: siriPulse1 2s infinite;
        }
        .animate-\[siriPulse2_2s_infinite\] {
          animation: siriPulse2 2s infinite;
        }
      `}</style>
    </>
  );
      
}
