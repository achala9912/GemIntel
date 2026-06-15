import styles from '@/app/features.module.css';

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  description: string;
  delayClass?: string;
  valueColor?: string;
}

export default function StatCard({ 
  label, 
  value, 
  description, 
  delayClass = '',
  valueColor
}: StatCardProps) {
  return (
    <div className={`${styles.statCard} glass-panel ${delayClass}`}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue} style={valueColor ? { color: valueColor } : undefined}>
        {value}
      </span>
      <span className={styles.statDesc}>{description}</span>
    </div>
  );
}
