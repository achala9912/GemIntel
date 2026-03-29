'use client';

import FeatureLayout from '@/components/FeatureLayout';
import styles from '../features.module.css';

export default function Authentication() {
  return (
    <FeatureLayout
      title="Gemstone Authentication"
      description="AI-powered authenticity verification. Our model detects microscopic markers, inclusions, and growth patterns to determine natural origin versus synthetic laboratory creation."
      buttonText="Authenticate Gem"
      mockDelay={2800}
    >
      <div className={`${styles.alertCard} ${styles.alertSuccess} glass-panel`}>
        <h2 style={{ fontSize: '2rem', color: 'var(--success)' }}>Natural Origin Confirmed</h2>
        <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
          Analysis completed automatically via Deep Vision Authentication.
        </p>
        <div className={styles.confidenceBadge}>98.5% Match Confidence</div>
      </div>
      
      <div style={{ padding: '0 2rem 2rem' }}>
        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.3rem' }}>Key Authentication Markers:</h3>
        <ul className={styles.list}>
          <li className={`${styles.listItem} delay-100`}>
            <span className={styles.listIcon}>✓</span>
            <div>
              <strong>Rutile Silk Inclusions</strong>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Presence of distinct intersecting rutile needles indicative of natural corundum growth.
              </p>
            </div>
          </li>
          <li className={`${styles.listItem} delay-200`}>
            <span className={styles.listIcon}>✓</span>
            <div>
              <strong>Angular Zoning</strong>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Straight, distinct color zoning aligned with crystallographic faces rather than curved striae.
              </p>
            </div>
          </li>
          <li className={`${styles.listItem} delay-300`}>
            <span className={styles.listIcon}>✓</span>
            <div>
              <strong>Negative Crystals</strong>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Observation of naturally forming multifaceted cavities holding liquid/gas inclusions typical of earth mining.
              </p>
            </div>
          </li>
        </ul>
      </div>
    </FeatureLayout>
  );
}
