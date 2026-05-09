'use client';

import FeatureLayout from '@/components/FeatureLayout';
import StatCard from '@/components/StatCard';
import styles from '../features.module.css';

export default function Valuation() {
  return (
    <FeatureLayout
      title="Dynamic Valuation Engine"
      description="Get near-instantaneous market value estimations by combining visual characterization models with real-time global trade market data."
      buttonText="Estimate Value"
      mockDelay={2200}
    >
      <div className={styles.priceContainer}>
        <h2 style={{ fontSize: '1.5rem', color: 'var(--text-secondary)' }}>
          Estimated Market Value
        </h2>
        <div className={`${styles.priceValue} animate-fade-in`}>
          $4,250 - $4,800
        </div>
        <p style={{ marginTop: '0.5rem', color: 'rgba(255,255,255,0.6)' }}>
          Per Carat Average: ~$3,620
        </p>
        <div className={styles.confidenceBadge}>
          AI Confidence Level: High
        </div>
      </div>

      <div className={styles.statsGrid} style={{ padding: '0 2rem 2rem', marginTop: 0 }}>
        <StatCard 
          label="Market Trend (30d)" 
          value="+2.4%" 
          valueColor="var(--success)"
          description="High demand for this color profile" 
        />
        <StatCard 
          label="Liquidity Rating" 
          value="A-" 
          valueColor="white"
          description="Highly tradable asset" 
        />
        <StatCard 
          label="Retail Value Est." 
          value="$8,500" 
          valueColor="white"
          description="Typical B2C pricing tier" 
        />
      </div>
      
      <div style={{ padding: '0 2rem 2rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          * Disclaimer: Values are generated using algorithmic modeling based on visual markers and
          historical trade data. Not to be used as a certified appraisal for insurance purposes.
        </p>
      </div>
    </FeatureLayout>
  );
}
