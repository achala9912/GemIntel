'use client';

import FeatureLayout from '@/components/FeatureLayout';
import styles from '../features.module.css';

const renderAuthenticationResult = (result: any) => {
  const ensemble = result?.ensemble_result;
  const breakdown = result?.breakdown || {};
  const prediction = ensemble?.prediction || 'Unknown';
  const confidenceValue = ensemble?.confidence != null ? ensemble.confidence * 100 : null;
  const confidenceText = confidenceValue != null ? `${confidenceValue.toFixed(1)}%` : 'Pending';
  const statusLabel = prediction === 'Synthetic' ? 'Synthetic Origin Detected' : 'Natural Origin Confirmed';
  const statusColor = prediction === 'Synthetic' ? 'var(--danger)' : 'var(--success)';

  return (
    <div>
      <div className={`${styles.alertCard} ${prediction === 'Synthetic' ? styles.alertError : styles.alertSuccess} glass-panel`}>
        <h2 style={{ fontSize: '2rem', color: statusColor }}>{statusLabel}</h2>
        <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
          Ensemble model result based on our trained authentication pipeline.
        </p>
        <div className={styles.confidenceBadge}>{confidenceText} Confidence</div>
      </div>

      <div style={{ padding: '0 2rem 2rem' }}>
        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.3rem' }}>Ensemble Breakdown</h3>
        <div className={styles.breakdownGrid}>
          {Object.entries(breakdown).map(([modelName, modelData]: [string, any]) => (
            <div key={modelName} className={styles.breakdownCard}>
              <h4>{modelName}</h4>
              <p style={{ margin: '0.5rem 0 0', fontWeight: 700 }}>{modelData.prediction || 'N/A'}</p>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.75rem' }}>
                Confidence: {modelData.confidence != null ? `${(modelData.confidence * 100).toFixed(1)}%` : 'N/A'}
              </p>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                Weight: {modelData.weight_used != null ? `${(modelData.weight_used * 100).toFixed(0)}%` : 'N/A'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function Authentication() {
  return (
    <FeatureLayout
      title="Gemstone Authentication"
      description="AI-powered authenticity verification. Our model detects microscopic markers, inclusions, and growth patterns to determine natural origin versus synthetic laboratory creation."
      buttonText="Authenticate Gem"
      apiEndpoint="/authenticate"
      renderResult={renderAuthenticationResult}
    >
      <></>
    </FeatureLayout>
  );
}
