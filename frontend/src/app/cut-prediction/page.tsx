'use client';

import FeatureLayout from '@/components/FeatureLayout';
import StatCard from '@/components/StatCard';
import styles from '../features.module.css';

export default function CutPrediction() {
  return (
    <FeatureLayout
      title="Optimal Cut Prediction"
      description="AI algorithms calculate the maximum yield and finest optical performance for your rough gemstone, outputting a complete 3D topological model of the ideal cut."
      buttonText="Generate 3D Cut Model"
      mockDelay={3500}
    >
      <div style={{ padding: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Predicted Optimal Cut: Brilliant Oval</h2>
        
        <div className={`${styles.threeDContainer} animate-fade-in`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src="/images/3d_mock.png" 
            alt="3D Wireframe Render" 
            className={styles.threeDImage}
          />
          <div className={styles.threeDOverlay}>
            <span>Interactive 3D Viewer Mock</span>
            <span className="spinner" style={{ width: '15px', height: '15px', borderWidth: '2px' }}></span>
          </div>
        </div>

        <div className={styles.statsGrid} style={{ marginTop: '2rem' }}>
          <StatCard 
            label="Yield Efficiency" 
            value="68%" 
            description="Retained weight from rough" 
          />
          <StatCard 
            label="Light Return" 
            value="Excellent" 
            description="Optical performance rating" 
          />
          <StatCard 
            label="Facets" 
            value="58" 
            description="Standard brilliant profile" 
          />
        </div>
      </div>
    </FeatureLayout>
  );
}
