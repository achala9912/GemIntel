'use client';

import { useState } from 'react';
import ImageUploader from '@/components/ImageUploader';

interface FeatureLayoutProps<T = unknown> {
  title: string;
  description: string;
  buttonText: string;
  mockDelay?: number;
  apiEndpoint?: string;
  renderResult?: (result: T) => React.ReactNode;
  children: React.ReactNode;
}

export default function FeatureLayout<T = unknown>({ 
  title, 
  description, 
  buttonText, 
  mockDelay = 2500,
  apiEndpoint,
  renderResult,
  children 
}: FeatureLayoutProps<T>) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<T | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);

  const handleReset = () => {
    setResetKey(prev => prev + 1);
    setShowResult(false);
    setAnalysisResult(null);
    setErrorMessage(null);
    setIsAnalyzing(false);
    setAnalysisStatus(null);
  };

  const handleAnalyze = async (file?: File | null) => {
    setErrorMessage(null);
    setShowResult(false);

    if (apiEndpoint) {
      if (!file) {
        setErrorMessage('Please upload a gemstone image before authenticating.');
        return;
      }

      setIsAnalyzing(true);
      
      // Step 1: Validation filter phase (Total 1.8s, rotating messages every 600ms)
      setAnalysisStatus('Scanning pixel grids for synthetic artifacts...');
      
      // Trigger API fetch in the background immediately
      const fetchPromise = (async () => {
        const endpoint = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}${apiEndpoint}`;
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(endpoint, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => null);
          throw new Error(errorBody?.detail || response.statusText || 'Authentication request failed.');
        }

        return response.json();
      })();

      // Rotate messages with 600ms delays to enforce the 1.8s minimum validation time
      await new Promise(resolve => setTimeout(resolve, 600));
      setAnalysisStatus('Analyzing frequency spectrum distribution (FFT/DCT)...');
      
      await new Promise(resolve => setTimeout(resolve, 600));
      setAnalysisStatus('Running EfficientNet-B0 CNN validation filter...');
      
      await new Promise(resolve => setTimeout(resolve, 600));

      try {
        const result = await fetchPromise;
        const isAi = result.status === 'ai_generated' || result.filter_result?.is_ai_generated;

        if (isAi) {
          // If AI origin detected, validation fails - show results immediately
          setAnalysisResult(result);
          setShowResult(true);
        } else {
          // Step 2: Gemstone Authentication phase (Total 1.8s, rotating messages every 600ms)
          setAnalysisStatus('Initializing deep feature extractors...');
          await new Promise(resolve => setTimeout(resolve, 600));
          
          setAnalysisStatus('Evaluating inclusions (EfficientNet-B4 + XGBoost)...');
          await new Promise(resolve => setTimeout(resolve, 600));
          
          setAnalysisStatus('Finalizing origin classification payload...');
          await new Promise(resolve => setTimeout(resolve, 600));
          
          setAnalysisResult(result);
          setShowResult(true);
        }
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : String(error));
      } finally {
        setIsAnalyzing(false);
        setAnalysisStatus(null);
      }

      return;
    }

    setIsAnalyzing(true);
    setAnalysisStatus('Processing...');
    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysisStatus(null);
      setShowResult(true);
    }, mockDelay);
  };

  return (
    <div className="py-16 px-4 max-w-[1000px] mx-auto">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-extrabold mb-4 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">{title}</h1>
        <p className="text-gray-400 text-lg max-w-[600px] mx-auto leading-relaxed">{description}</p>
      </header>

      <main className="flex flex-col gap-12 items-center">
        <ImageUploader 
          key={resetKey}
          onAnalyze={handleAnalyze} 
          isAnalyzing={isAnalyzing} 
          analysisStatus={analysisStatus}
          buttonText={buttonText} 
        />

        {errorMessage && (
          <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 flex flex-col items-center gap-4 text-center max-w-md">
            <span className="font-semibold text-sm">{errorMessage}</span>
            <button 
              onClick={handleReset}
              className="bg-white/5 border border-white/10 hover:bg-white/10 text-white py-1.5 px-5 rounded-lg cursor-pointer text-xs font-semibold transition"
            >
              Reset
            </button>
          </div>
        )}

        {showResult && (
          <div className="w-full glass-panel animate-fade-in">
            {renderResult ? renderResult(analysisResult as T) : children}
            <div className="flex justify-center my-8">
              <button 
                onClick={handleReset}
                className="btn-primary bg-white/5 border border-white/10 text-white hover:bg-white/10 py-3 px-8 rounded-xl cursor-pointer font-semibold text-sm transition"
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
