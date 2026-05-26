'use client';

import FeatureLayout from '@/components/FeatureLayout';
import styles from '../features.module.css';

const renderAuthenticationResult = (result: any) => {
  const filter = result?.filter_result;
  const isAi = result?.status === 'ai_generated' || filter?.is_ai_generated;
  const finalScore = filter?.aggregated_score ?? 0;
  const threshold = filter?.threshold ?? 0.6;
  const scoreColor = isAi ? '#ff4d4d' : '#00e676'; // Red if AI-generated, Green if Authentic

  return (
    <div>
      {/* AI-Generated Block Notice (displayed first if AI-generated) */}
      {isAi && (
        <div style={{ padding: '2rem 2rem 0' }}>
          <div className={`${styles.alertCard} ${styles.alertError} glass-panel`} style={{ margin: 0 }}>
            <h2 style={{ fontSize: '2rem', color: 'var(--danger)' }}>AI Image Rejected</h2>
            <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
              {result.message || 'The image is AI-generated. Please submit a real one.'}
            </p>
          </div>
        </div>
      )}

      {/* AI Origin Results (only shown when rejected) */}
      {filter && isAi && (
        <div style={{ padding: '2rem 2rem 1rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem', borderLeft: `6px solid ${scoreColor}` }}>
            <h3 style={{ marginBottom: '1.25rem', color: scoreColor, fontSize: '1.2rem', fontWeight: 600 }}>
              AI Origin Filter - {isAi ? 'AI Generated' : 'Authentic'}
            </h3>
            <div style={{ fontFamily: 'monospace', fontSize: '1.05rem', lineHeight: '1.8', color: 'var(--text-primary)' }}>
              <div>Frequesncy Analysis -&gt; {filter.breakdown?.frequency_analysis?.score?.toFixed(4)}</div>
              <div>ML Model -&gt; {filter.breakdown?.detector_model?.score?.toFixed(4)}</div>
              <div>Metadata Check -&gt; {filter.breakdown?.metadata_check?.score?.toFixed(4)}</div>
              <div style={{ marginTop: '0.75rem', fontWeight: 'bold', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '0.75rem' }}>
                Final Score -&gt; <span style={{ color: scoreColor }}>{finalScore.toFixed(4)}</span> (Threshold: {threshold})
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gemstone Authentication Results (if authentic) */}
      {!isAi && (
        <div>
          <div className={`${styles.alertCard} ${styles.alertSuccess} glass-panel`} style={{ marginTop: '0.5rem', marginInline: '2rem' }}>
            <h2 style={{ fontSize: '2rem', color: 'var(--success)' }}>Natural Origin Confirmed</h2>
            <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
              Ensemble model result based on our trained gemstone authentication pipeline.
            </p>
            <div className={styles.confidenceBadge}>
              {result.ensemble_result?.confidence != null ? `${(result.ensemble_result.confidence * 100).toFixed(1)}%` : 'N/A'} Confidence
            </div>
          </div>

          <div style={{ padding: '0 2rem 2rem', marginTop: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.3rem' }}>Ensemble Breakdown</h3>
            <div className={styles.breakdownGrid}>
              {Object.entries(result.breakdown || {}).map(([modelName, modelData]: [string, any]) => (
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
      )}
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
