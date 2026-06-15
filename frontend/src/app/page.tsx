import Link from 'next/link';
import styles from './page.module.css';

const features = [
  {
    title: 'Feature Identification',
    description: 'Instantly analyze the 4Cs (Carat, Cut, Color, Clarity) of any gemstone using AI vision.',
    path: '/identification',
    icon: '🔍',
    delay: 'delay-100'
  },
  {
    title: 'Authentication',
    description: 'Determine if a gem is natural or synthetic with deep reasoning and specific markers.',
    path: '/authentication',
    icon: '🛡️',
    delay: 'delay-200'
  },
  {
    title: 'Price Estimation',
    description: 'Get an accurate market valuation based on current trends and AI analysis.',
    path: '/valuation',
    icon: '💰',
    delay: 'delay-300'
  },
  {
    title: 'Cut Prediction',
    description: 'View a 3D prediction of the most optimal cut for rough gemstones.',
    path: '/cut-prediction',
    icon: '💎',
    delay: 'delay-300'
  }
];

export default function Home() {
  return (
    <div className={styles.homeContainer}>
      {/* Background Decor */}
      <div className={styles.orb1}></div>
      <div className={styles.orb2}></div>

      <div className={`container ${styles.content}`}>
        <header className={styles.hero}>
          <h1 className={`${styles.title} animate-fade-in`}>
            Unlock the True Value of <span className="gradient-text">Gemstones</span>
          </h1>
          <p className={`${styles.subtitle} animate-fade-in delay-100`}>
            State-of-the-art AI for classification, authentication, and valuation.
            Upload an image and let GemIntel reveal its secrets.
          </p>
          <div className={`${styles.ctaGroup} animate-fade-in delay-200`}>
            <Link href="/identification" className="btn-primary">
              Start Analysis &rarr;
            </Link>
          </div>
        </header>

        <section className={styles.featuresGrid}>
          {features.map((feature, i) => (
            <Link 
              key={i} 
              href={feature.path} 
              className={`glass-panel ${styles.featureCard} animate-fade-in ${feature.delay}`}
            >
              <div className={styles.iconWrapper}>{feature.icon}</div>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDesc}>{feature.description}</p>
            </Link>
          ))}
        </section>
      </div>
    </div>
  );
}
