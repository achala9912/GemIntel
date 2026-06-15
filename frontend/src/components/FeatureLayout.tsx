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
  const [showResult, setShowResult] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAnalyze = async (file?: File | null) => {
    setErrorMessage(null);
    setShowResult(false);

    if (apiEndpoint) {
      if (!file) {
        setErrorMessage('Please upload a gemstone image before authenticating.');
        return;
      }

      setIsAnalyzing(true);
      try {
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

        const result = await response.json();
        setAnalysisResult(result);
        setShowResult(true);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : String(error));
      } finally {
        setIsAnalyzing(false);
      }

      return;
    }

    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
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
          onAnalyze={handleAnalyze} 
          isAnalyzing={isAnalyzing} 
          buttonText={buttonText} 
        />

        {errorMessage && (
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            borderRadius: '1rem',
            background: 'rgba(255, 80, 80, 0.12)',
            color: 'var(--danger, #b00020)'
          }}>
            {errorMessage}
          </div>
        )}

        {showResult && (
          <div className={`${styles.resultsContainer} glass-panel`}>
            {renderResult ? renderResult(analysisResult) : children}
          </div>
        )}
      </main>
    </div>
  );
}
