'use client';

import React from 'react';

export type StageState = 'pending' | 'processing' | 'done' | 'error';

interface AuthPipelineModalProps {
  isOpen: boolean;
  currentStage: number;
  stageStatuses: {
    stage1: StageState;
    stage2: StageState;
    stage3: StageState;
  };
  statusMessage: string | null;
  error: string | null;
  onCancel: () => void;
}

const StepIcon = ({ state }: { state: StageState }) => {
  if (state === 'done') {
    return (
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse shrink-0">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    );
  }

  if (state === 'pending') {
    return (
      <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white/10 text-white/20 shrink-0">
        <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
      </div>
    );
  }

  // Active / Processing state
  return (
    <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.3)] overflow-hidden shrink-0">
      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
      </svg>
    </div>
  );
};

export default function AuthPipelineModal({
  isOpen,
  stageStatuses,
  error,
  onCancel,
}: AuthPipelineModalProps) {
  if (!isOpen) return null;

  const steps = [
    {
      id: 1,
      state: stageStatuses.stage1,
      label: 'Validating gemstone image domain...',
      activeLabel: 'Validating gemstone image domain...',
      completedLabel: 'Gemstone image domain verified',
    },
    {
      id: 2,
      state: stageStatuses.stage2,
      label: 'Scanning AI artifacts & frequency spectrum...',
      activeLabel: 'Scanning AI artifacts & frequency spectrum...',
      completedLabel: 'AI generative filter passed (Authentic photo)',
    },
    {
      id: 3,
      state: stageStatuses.stage3,
      label: 'Extracting microscopic inclusion features...',
      activeLabel: 'Extracting microscopic inclusion features...',
      completedLabel: 'Microscopic inclusion features classified',
    },
  ];

  const hasError = stageStatuses.stage1 === 'error' || stageStatuses.stage2 === 'error' || stageStatuses.stage3 === 'error' || !!error;

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 w-full max-w-xl relative overflow-hidden shadow-2xl animate-fade-in mt-4">
      
      {/* Top status accent line */}
      <div
        className={`absolute top-0 left-0 right-0 h-[3px] ${
          hasError
            ? 'bg-red-500'
            : 'bg-blue-500 animate-pulse'
        }`}
      />

      {/* Header */}
      <h3 className="text-xs font-semibold uppercase tracking-widest pb-4 mb-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {hasError ? (
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
            </span>
          ) : (
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
            </span>
          )}
          <span className={hasError ? 'text-rose-400 font-bold tracking-wider' : 'text-blue-400 font-bold tracking-wider'}>
            AUTHENTICATION PIPELINE
          </span>
        </div>
      </h3>

      {/* Divide list */}
      <div className="flex flex-col divide-y divide-white/5 mb-5">
        {steps.map((step) => {
          const isStepActive = step.state === 'processing';
          const isStepCompleted = step.state === 'done';
          const isStepError = step.state === 'error';

          let textClass = 'text-white/20';
          let statusLabelText = 'PENDING';

          if (isStepActive) {
            textClass = 'text-blue-400 font-semibold drop-shadow-[0_0_8px_rgba(96,165,250,0.3)]';
            statusLabelText = 'ACTIVE';
          } else if (isStepCompleted) {
            textClass = 'text-white/70';
            statusLabelText = 'COMPLETED';
          } else if (isStepError) {
            textClass = 'text-rose-400 font-semibold';
            statusLabelText = 'FAILED';
          }

          return (
            <div
              key={step.id}
              className={`flex items-center justify-between gap-3 py-3 sm:py-3.5 transition-all duration-300 ${
                isStepActive ? 'bg-blue-500/10 -mx-3 px-3 rounded-xl border border-blue-500/20' : ''
              }`}
            >
              <span className="flex items-center gap-3 min-w-0">
                <StepIcon state={step.state} />
                <span className={`text-xs transition-colors duration-300 ${textClass}`}>
                  {isStepCompleted ? step.completedLabel : isStepActive ? step.activeLabel : step.label}
                </span>
              </span>
              <span
                className={`text-[10px] font-mono uppercase tracking-wider transition-colors duration-300 shrink-0 ${
                  isStepActive
                    ? 'text-blue-400 animate-pulse font-bold'
                    : isStepCompleted
                    ? 'text-emerald-400 font-bold'
                    : isStepError
                    ? 'text-rose-400 font-bold'
                    : 'text-white/20'
                }`}
              >
                {statusLabelText}
              </span>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-300 break-words">
          {error}
        </div>
      )}

      {/* Stop Process Button */}
      <div className="pt-4 border-t border-white/5">
        <button
          onClick={onCancel}
          className="w-full px-5 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 active:scale-[0.98] transition font-medium flex items-center justify-center gap-2 cursor-pointer text-sm"
        >
          <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
            <rect x="4" y="4" width="16" height="16" rx="2" />
          </svg>
          <span>Stop Process</span>
        </button>
      </div>
    </div>
  );
}
