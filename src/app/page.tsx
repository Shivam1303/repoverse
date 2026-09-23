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

    <div className="portal-horizon" aria-hidden="true" />

    <section className="portal-content">
      <h1>Your code.<br /><span>A whole universe.</span></h1>
      <p className="portal-lede">Explore a GitHub profile.<br className="portal-mobile-break" /> Every repository becomes a world.</p>
      <UsernameForm />
      <div className="portal-examples"><span>Try a universe</span><Link href="/u/torvalds">torvalds</Link><Link href="/u/vercel">vercel</Link><Link href="/u/sindresorhus">sindresorhus</Link></div>
    </section>

    <footer className="portal-footer">Public profiles. No sign in required.</footer>
  </main>;
}
