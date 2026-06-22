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
  const finalScore = filter?.aggregated_score ?? 0;
  const threshold = filter?.threshold ?? 0.6;
  const scoreColorClass = isAi ? 'text-red-400' : 'text-emerald-400';
  const borderLeftColor = isAi ? 'border-l-red-500' : 'border-l-emerald-500';

  return (
    <div className="flex flex-col gap-6">
      {/* AI-Generated Block Notice */}
      {isAi && (
        <div className="p-4 sm:p-8 pb-0">
          <div className="p-6 sm:p-8 text-center border border-red-500/30 bg-red-500/5 rounded-2xl flex flex-col items-center gap-3">
            <ShieldAlert className="w-10 h-10 text-red-500 animate-bounce" />
            <h2 className="text-xl sm:text-2xl font-bold text-red-500">AI Image Rejected</h2>
            <p className="text-xs sm:text-sm text-gray-400 max-w-md">
              {result.message || 'The image is AI-generated. Please submit a real gemstone photograph.'}
            </p>
          </div>
        </div>
      )}

      {/* AI Origin Results */}
      {filter && isAi && (
        <div className="px-4 sm:px-8 py-4">
          <div className={`p-4 sm:p-6 rounded-2xl bg-white/5 border border-white/10 border-l-4 ${borderLeftColor}`}>
            <h3 className={`text-sm sm:text-base font-bold mb-4 ${scoreColorClass}`}>
              AI Origin Filter - AI Generated Detection
            </h3>
            <div className="font-mono text-xs sm:text-sm leading-relaxed text-gray-300 flex flex-col gap-2">
              <div>Frequency Analysis &rarr; {filter.breakdown?.frequency_analysis?.score?.toFixed(4)}</div>
              <div>ML Model &rarr; {filter.breakdown?.detector_model?.score?.toFixed(4)}</div>
              <div>Metadata Check &rarr; {filter.breakdown?.metadata_check?.score?.toFixed(4)}</div>
              <div className="mt-3 pt-3 border-t border-white/10 font-bold flex justify-between">
                <span>Final Aggregated Score:</span>
                <span className={scoreColorClass}>{finalScore.toFixed(4)} <span className="text-xs text-gray-500">(Threshold: {threshold})</span></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gemstone Authentication Results (if authentic) */}
      {!isAi && (
        <div>
          <div className="mx-4 sm:mx-8 mt-6">
            <div className="p-6 sm:p-8 text-center border border-emerald-500/30 bg-emerald-500/5 rounded-2xl flex flex-col items-center gap-3">
              <ShieldCheck className="w-10 h-10 text-emerald-400" />
              <h2 className="text-xl sm:text-2xl font-bold text-emerald-400">Natural Origin Confirmed</h2>
              <p className="text-xs sm:text-sm text-gray-400 max-w-md">
                Ensemble model result based on our trained gemstone authentication pipeline.
              </p>
              <div className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-semibold mt-4 border border-emerald-500/20">
                {result.ensemble_result?.confidence != null ? `${(result.ensemble_result.confidence * 100).toFixed(1)}%` : 'N/A'} Confidence
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-8">
            <h3 className="text-base sm:text-lg font-bold mb-4 text-white">Ensemble Model Breakdown</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(result.breakdown || {}).map(([modelName, modelData]) => (
                <div key={modelName} className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-2">
                  <h4 className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider">{modelName}</h4>
                  <p className="text-base sm:text-lg font-extrabold text-white my-1 capitalize">{modelData.prediction || 'N/A'}</p>
                  <div className="text-xs text-gray-400 flex flex-col gap-1 border-t border-white/10 pt-2 mt-1">
                    <div className="flex justify-between">
                      <span>Confidence:</span>
                      <span className="font-semibold text-gray-300">{modelData.confidence != null ? `${(modelData.confidence * 100).toFixed(1)}%` : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Model Weight:</span>
                      <span className="font-semibold text-gray-300">{modelData.weight_used != null ? `${(modelData.weight_used * 100).toFixed(0)}%` : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
