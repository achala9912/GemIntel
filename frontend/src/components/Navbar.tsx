'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';

const navItems = [
  { name: 'Identification', path: '/identification' },
  { name: 'Authentication', path: '/authentication' },
  { name: 'Valuation', path: '/valuation' },
  { name: 'Cut Prediction', path: '/cut-prediction' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className={styles.navbar}>
      <div className={`container ${styles.navContainer}`}>
        <Link href="/" className={styles.logo}>
          <span className="gradient-text">GemIntel</span>
        </Link>
        
        <div className={styles.navLinks}>
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              href={item.path}
              className={`${styles.navLink} ${pathname === item.path ? styles.active : ''}`}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
