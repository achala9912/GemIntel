'use client';

import FeatureLayout from '@/components/FeatureLayout';
import StatCard from '@/components/StatCard';
import styles from '../features.module.css';

export default function FeatureIdentification() {
  return (
    <FeatureLayout
      title="Feature Identification"
      description="Upload a clear image of your gemstone. Our AI will analyze the visual characteristics to determine the 4Cs: Carat (estimated), Cut, Color, and Clarity."
      buttonText="Identify Features"
      mockDelay={2500}
    >
      <div style={{ padding: '2rem', borderBottom: '1px solid var(--glass-border)' }}>
        <h2>AI Vision Analysis Report</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Confidence Score: <span style={{ color: 'var(--success)' }}>94%</span>
        </p>
      </div>
      
      <div className={styles.statsGrid} style={{ padding: '2rem' }}>
        <StatCard 
          label="Estimated Carat" 
          value="1.25 ct" 
          description="Visual weight estimation" 
          delayClass="delay-100" 
        />
        <StatCard 
          label="Cut Grade" 
          value="Excellent" 
          description="Symmetry and proportions" 
          delayClass="delay-200" 
        />
        <StatCard 
          label="Color Grade" 
          value="Vivid Blue" 
          description="Hue, tone, and saturation" 
          delayClass="delay-300" 
        />
        <StatCard 
          label="Clarity" 
          value="VVS1" 
          description="Very Very Slightly Included" 
          delayClass="delay-300" 
        />
      </div>
    </FeatureLayout>
  );
}
