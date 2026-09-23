import Link from 'next/link';
import { UsernameForm } from '@/components/UsernameForm';
import { BrandMark } from '@/components/BrandMark';
import './landing.css';

export default function LandingPage() {
  return <main className="portal">
    <div className="portal-stars" aria-hidden="true" />
    <header className="portal-header">
      <span className="wordmark"><BrandMark /> REPOVERSE</span>
    </header>

    <div className="portal-planet" aria-hidden="true">
      <svg className="portal-planet-filters" width="0" height="0" focusable="false">
        <defs>
          <filter id="planet-plasma" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency=".012 .045" numOctaves="3" seed="7" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="16" xChannelSelector="R" yChannelSelector="G" />
            <feGaussianBlur stdDeviation="1.2" />
          </filter>
        </defs>
      </svg>
      <div className="portal-planet-aura" />
      <div className="portal-horizon">
        <div className="portal-planet-surface">
          <div className="portal-planet-terrain" />
          <div className="portal-planet-clouds" />
        </div>
        <div className="portal-planet-energy">
          <div className="portal-planet-plasma portal-planet-plasma--outer" />
          <div className="portal-planet-plasma portal-planet-plasma--inner" />
        </div>
        <div className="portal-planet-rim" />
      </div>
      <div className="portal-planet-flare" />
    </div>

    <section className="portal-content">
      <h1>Your code.<br /><span>A whole universe.</span></h1>
      <p className="portal-lede">Explore a GitHub profile.<br className="portal-mobile-break" /> Every repository becomes a world.</p>
      <UsernameForm />
      <div className="portal-examples"><span>Try a universe</span><Link href="/u/torvalds">torvalds</Link><Link href="/u/vercel">vercel</Link><Link href="/u/sindresorhus">sindresorhus</Link></div>
    </section>

    <footer className="portal-footer">Public profiles. No sign in required.</footer>
  </main>;
}
