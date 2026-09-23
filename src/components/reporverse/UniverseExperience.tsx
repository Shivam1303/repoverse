'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { BrandMark } from '@/components/BrandMark';
import { useCallback, useMemo, useState } from 'react';
import type { GithubUniverse, UniverseRepository } from '@/lib/github/types';
import { PLANET_STYLES } from './visuals/planetStyles';
import type { CameraMode, PlanetSelection } from './camera/types';
import { RepoDetails } from './ui/RepoDetails';

const UniverseCanvas = dynamic(() => import('./scene/UniverseCanvas').then((module) => module.UniverseCanvas), { ssr: false, loading: () => <div className="canvas-loading" aria-hidden="true" /> });

export function UniverseExperience({ universe, isFixture }: { universe: GithubUniverse; isFixture: boolean }) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [selection, setSelection] = useState<PlanetSelection | null>(null);
  const [mode, setMode] = useState<CameraMode>('entering');
  const hovered = useMemo(() => universe.repositories.find((repo) => repo.id === hoveredId) ?? null, [hoveredId, universe.repositories]);
  const selectedRepo = useMemo(() => universe.repositories.find((repo) => repo.id === selection?.id) ?? null, [selection, universe.repositories]);
  const featured = universe.repositories[0] ?? null;
  const selectPlanet = useCallback((planet: PlanetSelection) => {
    setHoveredId(null);
    setSelection(planet);
    setMode('focusing');
  }, []);
  const closeDetails = useCallback(() => {
    setSelection(null);
    setMode('returning');
  }, []);
  return <main className="universe-shell">
    <UniverseCanvas universe={universe} onHover={setHoveredId} selection={selection} mode={mode} onSelect={selectPlanet} onModeChange={setMode} />
    <div className="universe-grain" aria-hidden="true" />
    <header className={`universe-header ${mode === 'entering' ? 'intro-hidden' : ''}`}>
      <Link href="/" className="wordmark"><BrandMark /> REPOVERSE</Link>
      <div className="universe-id"><span className="live-dot" /> UNIVERSE / <strong>@{universe.user.login}</strong></div>
      <Link className="search-link" href="/">SEARCH ANOTHER <span aria-hidden="true">↗</span></Link>
    </header>
    <div className={`profile-card ${mode !== 'universe' ? 'ui-recessed' : ''}`}>
      <span className="micro-label">SOURCE STAR / 001</span>
      <h1>{universe.user.name || universe.user.login}</h1>
      <p>@{universe.user.login}</p>
      <div className="profile-stats"><span><b>{universe.user.publicRepos.toLocaleString()}</b> repositories</span><span><b>{universe.user.followers.toLocaleString()}</b> followers</span></div>
    </div>
    {featured && <div className={`feature-caption ${mode !== 'universe' ? 'ui-recessed' : ''}`}><span className="micro-label">DOMINANT WORLD / {featured.language || 'UNKNOWN'}</span><strong>{featured.name}</strong><span>{featured.stars.toLocaleString()} stars · {featured.forks.toLocaleString()} forks</span></div>}
    <aside className={`planet-readout ${hovered && mode === 'universe' ? 'planet-readout--visible' : ''}`} aria-live="polite">
      {hovered && <PlanetReadout repo={hovered} />}
    </aside>
    <footer className={`universe-footer ${mode !== 'universe' ? 'ui-recessed' : ''}`}>
      <span className="explore-hint"><i aria-hidden="true" /><span className="desktop-hint">DRAG TO ORBIT · SCROLL TO ZOOM · HOVER TO DISCOVER</span><span className="mobile-hint">DRAG TO ORBIT · PINCH TO ZOOM</span></span>
      <span className="universe-count">{universe.repositories.length === 0 ? "THIS UNIVERSE HASN'T FORMED ANY PLANETS YET" : `SHOWING ${universe.repositories.length} OF ${universe.totalRepositories} REPOSITORIES`}</span>
    </footer>
    {selectedRepo && mode === 'planet-focus' && <RepoDetails repo={selectedRepo} owner={universe.user.login} onClose={closeDetails} />}
    {isFixture && <div className="fixture-badge">LOCAL FIXTURE · DEVELOPMENT ONLY</div>}
  </main>;
}

function PlanetReadout({ repo }: { repo: UniverseRepository }) {
  const style = PLANET_STYLES[repo.visualization.planetFamily];
  return <><span className="micro-label" style={{ color: style.accent }}>REPOSITORY / {style.description.toUpperCase()}</span><h2>{repo.name}</h2><p>{repo.description || 'A world of public code.'}</p><div className="readout-stats"><span>{repo.language || 'Unknown language'}</span><span>★ {repo.stars.toLocaleString()}</span><span>⑂ {repo.forks.toLocaleString()}</span></div>{repo.archived && <span className="archived-label">ARCHIVED / DORMANT</span>}</>;
}
