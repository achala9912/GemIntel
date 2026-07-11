'use client';

import FeatureLayout from '@/components/FeatureLayout';
import { ShieldCheck, ShieldAlert } from 'lucide-react';

interface AuthenticationResult {
  status?: string;
  message?: string;
  filter_result?: {
    is_ai_generated?: boolean;
    aggregated_score?: number;
    threshold?: number;
    breakdown?: {
      frequency_analysis?: { score?: number };
      detector_model?: { score?: number };
      metadata_check?: { score?: number };
    };
  };
  ensemble_result?: {
    prediction?: string;
    confidence?: number;
  };
  breakdown?: Record<string, {
    prediction?: string;
    confidence?: number;
    weight_used?: number;
  }>;
}

const renderAuthenticationResult = (result: AuthenticationResult) => {
  const filter = result?.filter_result;
  const isAi = result?.status === 'ai_generated' || filter?.is_ai_generated;
  const isSynthetic = result.ensemble_result?.prediction === 'Synthetic';
  const isRejected = isAi || isSynthetic;
  
  // Scoring variables
  const rawConfidence = isAi 
    ? (filter?.aggregated_score ?? 0.8) 
    : (result.ensemble_result?.confidence ?? 0);
  const confidenceValue = +(rawConfidence * 100).toFixed(1);
  
  // Circular gauge setup
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (rawConfidence * circumference);

  const themeColorClass = isRejected ? 'text-rose-400' : 'text-emerald-400';
  const borderLeftColor = isRejected ? 'border-l-rose-500' : 'border-l-emerald-500';
  const strokeColorClass = isRejected ? 'stroke-rose-500' : 'stroke-emerald-400';

  return (
    <div className="flex flex-col gap-5">
      {/* Main Verdict Card */}
      <div className={`flex flex-col sm:flex-row items-center justify-between gap-6 p-6 sm:p-8 rounded-2xl border ${
        isRejected 
          ? 'bg-rose-500/5 border-rose-500/20' 
          : 'bg-emerald-500/5 border-emerald-500/20'
      }`}>
        <div className="flex items-center gap-4 flex-col sm:flex-row text-center sm:text-left min-w-0">
          <div className={`relative w-14 h-14 rounded-full flex items-center justify-center shrink-0 border ${
            isRejected 
              ? 'bg-rose-500/10 border-rose-500/20' 
              : 'bg-emerald-500/10 border-emerald-500/20'
          }`}>
            <span className={`absolute inset-0 rounded-full animate-ping opacity-40 ${
              isRejected ? 'bg-rose-500' : 'bg-emerald-500'
            }`} />
            {isRejected ? (
              <ShieldAlert className="w-7 h-7 text-rose-500" />
            ) : (
              <ShieldCheck className="w-7 h-7 text-emerald-400" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className={`text-xl sm:text-2xl font-bold mb-1.5 ${themeColorClass}`}>
              {isAi 
                ? 'AI Image Rejected' 
                : isSynthetic 
                ? 'Synthetic Origin Detected' 
                : 'Natural Origin Confirmed'
              }
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed max-w-sm">
              {isAi 
                ? (result.message || 'Synthetic pixel distributions or generative model artifacts have been detected.')
                : isSynthetic
                ? 'Ensemble model analysis has identified markers indicating laboratory creation/synthetic origin.'
                : 'Ensemble model analysis has verified the unique crystal growth patterns and natural inclusions.'
              }
            </p>
          </div>
        </div>
        
        {/* Circular SVG Progress Gauge */}
        <div className="shrink-0 flex items-center justify-center">
          <div className="relative flex items-center justify-center w-24 h-24">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r={radius}
                className="stroke-white/10"
                strokeWidth="5"
                fill="transparent"
              />
              <circle
                cx="48"
                cy="48"
                r={radius}
                className={`${strokeColorClass} transition-all duration-700 ease-out`}
                strokeWidth="5"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-base font-extrabold text-white leading-none tabular-nums">
                {confidenceValue}%
              </span>
              <span className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold mt-0.5">
                {isAi ? 'Score' : 'Conf.'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Origin breakdown (when rejected) */}
      {filter && isAi && (
        <div className={`p-5 sm:p-6 rounded-2xl bg-white/5 border border-white/10 border-l-4 ${borderLeftColor} space-y-4`}>
          <h3 className={`text-sm sm:text-base font-bold ${themeColorClass}`}>
            AI Origin Filter - Artifact Breakdown
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Frequency Analysis</div>
              <div className="text-xl font-extrabold text-white font-mono">{filter.breakdown?.frequency_analysis?.score?.toFixed(4) || '0.0000'}</div>
              <div className="text-[10px] text-gray-500 leading-normal">Anomalies in high-frequency pixel grids.</div>
            </div>
            
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">ML Detector Model</div>
              <div className="text-xl font-extrabold text-white font-mono">{filter.breakdown?.detector_model?.score?.toFixed(4) || '0.0000'}</div>
              <div className="text-[10px] text-gray-500 leading-normal">Deep CNN identifying structural artifacts.</div>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Metadata Check</div>
              <div className="text-xl font-extrabold text-white font-mono">{filter.breakdown?.metadata_check?.score?.toFixed(4) || '0.0000'}</div>
              <div className="text-[10px] text-gray-500 leading-normal">Camera tags and software signatures.</div>
            </div>
          </div>
        </div>
      )}

      {/* Gemstone Authentication Results (if natural/authentic) */}
      {!isAi && (
        <div className="space-y-3.5">
          <h3 className="text-base sm:text-lg font-bold text-white pl-0.5">
            Ensemble Model Breakdown
          </h3>
          <div className={`grid gap-4 ${
            Object.keys(result.breakdown || {}).length === 2
              ? 'grid-cols-1 sm:grid-cols-2'
              : Object.keys(result.breakdown || {}).length === 1
              ? 'grid-cols-1'
              : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
          }`}>
            {Object.entries(result.breakdown || {}).map(([modelName, modelData]) => {
              const modelConfidence = (modelData.confidence ?? 0) * 100;
              return (
                <div key={modelName} className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-4 shadow-lg hover:border-white/15 transition-all">
                  <div className="flex justify-between items-center gap-2">
                    <h4 className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider truncate">{modelName}</h4>
                    <span className="text-[10px] bg-white/5 px-2 py-0.5 border border-white/5 text-gray-300 rounded font-semibold shrink-0">
                      Weight: {((modelData.weight_used ?? 0) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 mb-0.5 uppercase font-medium">Classification</div>
                    <div className="text-lg font-bold text-white capitalize">{modelData.prediction || 'N/A'}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-gray-400">
                      <span>Confidence</span>
                      <span className="text-white">{modelConfidence.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full"
                        style={{ width: `${modelConfidence}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default function Authentication() {
  return (
    <FeatureLayout
      title={
        <>
          Gemstone{' '}
          <span className="gradient-text">
            Authentication
          </span>
        </>
      }
      description="AI-powered authenticity verification. Our model detects microscopic markers, inclusions, and growth patterns to determine natural origin versus synthetic laboratory creation."
      buttonText="Authenticate Gem"
      apiEndpoint="/authenticate"
      renderResult={renderAuthenticationResult}
    >
      <></>
    </FeatureLayout>
  );
}
