import { BrandMark } from '@/components/BrandMark';
import styles from './UniverseLoader.module.css';

export function UniverseLoader({ scene = false }: { scene?: boolean }) {
  return (
    <div className={`${styles.screen} ${scene ? styles.overlay : ''}`}>
      <span className={`wordmark ${styles.brand}`}><BrandMark /> REPOVERSE</span>
      <div className={styles.stars} aria-hidden="true" />
      <div className={styles.content}>
        <div className={styles.system} aria-hidden="true">
          <div className={styles.halo} />
          <div className={`${styles.orbit} ${styles.orbitOuter}`}><div className={styles.satelliteTrack}><i /></div></div>
          <div className={`${styles.orbit} ${styles.orbitInner}`}><div className={styles.satelliteTrack}><i /></div></div>
          <div className={styles.planet}>
            <div className={styles.surface} />
            <div className={styles.shade} />
          </div>
          <div className={styles.corona} />
          <div className={styles.scan} />
        </div>
        <div className={styles.status} role="status" aria-live="polite" aria-atomic="true">
          <span className={styles.eyebrow}>A UNIVERSE IS TAKING SHAPE</span>
          <h1>{scene ? 'Igniting your universe.' : 'Finding your universe.'}</h1>
          <p>{scene ? 'Preparing the interactive 3D scene' : 'Gathering the profile and its public repositories'}</p>
        </div>
        <div className={styles.signal} aria-hidden="true"><span /></div>
      </div>
      <span className={styles.caption}>EVERY REPOSITORY BECOMES A WORLD</span>
    </div>
  );
}
