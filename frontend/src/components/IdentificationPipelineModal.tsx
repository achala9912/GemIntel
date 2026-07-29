'use client';

import React from 'react';

export type StageState = 'pending' | 'processing' | 'done' | 'error';

interface IdentificationPipelineModalProps {
  isOpen: boolean;
  stageStatuses: {
    stage1: StageState; // Cut Model (DINOv2)
    stage2: StageState; // Color Model (DINOv2)
    stage3: StageState; // Clarity Model (EfficientNet-B4)
    stage4: StageState; // Carat Physics Pipeline
  };
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
    <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.3)] overflow-hidden shrink-0">
      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
      </svg>
    </div>
  );
};

export default function IdentificationPipelineModal({
  isOpen,
  stageStatuses,
  error,
  onCancel,
}: IdentificationPipelineModalProps) {
  if (!isOpen) return null;

  const steps = [
    {
      id: 1,
      state: stageStatuses.stage1,
      label: 'Evaluating DINOv2 Cut Model...',
      activeLabel: 'Executing DINOv2 Cut & Proportion Model...',
      completedLabel: 'DINOv2 Cut & Proportion Model',
    },
    {
      id: 2,
      state: stageStatuses.stage2,
      label: 'Evaluating DINOv2 Color Model...',
      activeLabel: 'Executing DINOv2 Color & Hue Classifier...',
      completedLabel: 'DINOv2 Color & Saturation  Model',
    },
    {
      id: 3,
      state: stageStatuses.stage3,
      label: 'Evaluating EfficientNet-B4 Clarity Model...',
      activeLabel: 'Scanning Microscopic Inclusions (EfficientNet-B4)...',
      completedLabel: 'EfficientNet-B4 Microscopic Clarity Model',
    },
    {
      id: 4,
      state: stageStatuses.stage4,
      label: 'Estimating Carat Weight...',
      activeLabel: 'Calibrating Dual-View Coin Scale & Volume...',
      completedLabel: 'Carat Weight Estimation',
    },
  ];

  const hasError =
    stageStatuses.stage1 === 'error' ||
    stageStatuses.stage2 === 'error' ||
    stageStatuses.stage3 === 'error' ||
    stageStatuses.stage4 === 'error' ||
    !!error;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 w-full max-w-xl relative overflow-hidden shadow-2xl animate-scale-up">
        {/* Top status accent line */}
        <div
          className={`absolute top-0 left-0 right-0 h-[3px] ${hasError
              ? 'bg-red-500'
              : 'bg-gradient-to-r from-amber-500 via-blue-500 to-emerald-500 animate-pulse'
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
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
            )}
            <span className={hasError ? 'text-rose-400 font-bold tracking-wider' : 'text-amber-400 font-bold tracking-wider'}>
              4C IDENTIFICATION PIPELINE
            </span>
          </div>
          <span className="text-[10px] text-gray-400 font-mono">
            {Object.values(stageStatuses).filter((s) => s === 'done').length} / 4 EXECUTED
          </span>
        </h3>

        {/* Step list */}
        <div className="flex flex-col divide-y divide-white/5 mb-5">
          {steps.map((step) => {
            const isStepActive = step.state === 'processing';
            const isStepCompleted = step.state === 'done';
            const isStepError = step.state === 'error';

            let textClass = 'text-white/20';
            let statusLabelText = 'PENDING';

            if (isStepActive) {
              textClass = 'text-amber-400 font-semibold drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]';
              statusLabelText = 'EXECUTING';
            } else if (isStepCompleted) {
              textClass = 'text-white/80';
              statusLabelText = 'COMPLETED';
            } else if (isStepError) {
              textClass = 'text-rose-400 font-semibold';
              statusLabelText = 'FAILED';
            }

            return (
              <div
                key={step.id}
                className={`flex items-center justify-between gap-3 py-3 sm:py-3.5 transition-all duration-300 ${isStepActive ? 'bg-amber-500/10 -mx-3 px-3 rounded-xl border border-amber-500/20' : ''
                  }`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <StepIcon state={step.state} />
                  <span className={`text-xs transition-colors duration-300 ${textClass}`}>
                    {isStepCompleted ? step.completedLabel : isStepActive ? step.activeLabel : step.label}
                  </span>
                </span>
                <span
                  className={`text-[10px] font-mono uppercase tracking-wider transition-colors duration-300 shrink-0 ${isStepActive
                      ? 'text-amber-400 animate-pulse font-bold'
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
            <span>Cancel Execution</span>
          </button>
        </div>
      </div>
    </div>
  );
}
