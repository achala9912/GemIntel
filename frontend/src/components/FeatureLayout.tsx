'use client';

import { useState } from 'react';
import ImageUploader from '@/components/ImageUploader';
import styles from '@/app/features.module.css';

interface FeatureLayoutProps {
  title: string;
  description: string;
  buttonText: string;
  mockDelay?: number;
  apiEndpoint?: string;
  renderResult?: (result: any) => React.ReactNode;
  children: React.ReactNode;
}

export default function FeatureLayout({ 
  title, 
  description, 
  buttonText, 
  mockDelay = 2500,
  apiEndpoint,
  renderResult,
  children 
}: FeatureLayoutProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
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
        const endpoint = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000'}${apiEndpoint}`;
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
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.description}>{description}</p>
      </header>

      <main className={styles.workspace}>
        <ImageUploader 
          key={resetKey}
          onAnalyze={handleAnalyze} 
          isAnalyzing={isAnalyzing} 
          analysisStatus={analysisStatus}
          buttonText={buttonText} 
        />

        {errorMessage && (
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            borderRadius: '1rem',
            background: 'rgba(255, 80, 80, 0.12)',
            color: 'var(--danger, #b00020)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <span>{errorMessage}</span>
            <button 
              onClick={handleReset}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: 'white',
                padding: '0.4rem 1.2rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              Reset
            </button>
          </div>
        )}

        {showResult && (
          <div className={`${styles.resultsContainer} glass-panel`}>
            {renderResult ? renderResult(analysisResult) : children}
            <div style={{ display: 'flex', justifyContent: 'center', margin: '2rem 0' }}>
              <button 
                onClick={handleReset}
                className="btn-primary" 
                style={{ 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'var(--text-primary)',
                  padding: '0.75rem 2rem',
                  borderRadius: '0.75rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  fontSize: '0.95rem'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
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
