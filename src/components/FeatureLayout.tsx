'use client';

import { useState } from 'react';
import ImageUploader from '@/components/ImageUploader';
import styles from '@/app/features.module.css';

interface FeatureLayoutProps {
  title: string;
  description: string;
  buttonText: string;
  mockDelay?: number;
  children: React.ReactNode;
}

export default function FeatureLayout({ 
  title, 
  description, 
  buttonText, 
  mockDelay = 2500,
  children 
}: FeatureLayoutProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setShowResult(false);
    
    // Mock API Call delay
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

        {showResult && (
          <div className={`${styles.resultsContainer} glass-panel`}>
            {children}
          </div>
        )}
      </main>
    </div>
  );
}
