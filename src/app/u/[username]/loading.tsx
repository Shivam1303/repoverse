import { BrandMark } from '@/components/BrandMark';

export default function Loading() {
  return <main className="loading-screen"><span className="wordmark"><BrandMark /> REPOVERSE</span><div className="loading-core" aria-hidden="true" /><p>LOCATING UNIVERSE</p><span>Mapping repositories · Igniting stars</span></main>;
}
