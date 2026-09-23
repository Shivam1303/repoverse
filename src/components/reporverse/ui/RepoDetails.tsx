'use client';

import { useEffect, useRef } from 'react';
import type { UniverseRepository } from '@/lib/github/types';
import { PLANET_STYLES } from '../visuals/planetStyles';

const formatDate = (date: string | null) => date
  ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
  : 'Not available';

export function RepoDetails({ repo, owner, onClose }: { repo: UniverseRepository; owner: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const style = PLANET_STYLES[repo.visualization.planetFamily];
  const size = repo.size >= 1024 * 1024 ? `${(repo.size / (1024 * 1024)).toFixed(1)} GB` : repo.size >= 1024 ? `${(repo.size / 1024).toFixed(1)} MB` : `${repo.size} KB`;

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);

  return <dialog ref={dialog} className="repo-dialog" aria-labelledby="repo-detail-title"
    onCancel={(event) => { event.preventDefault(); onClose(); }}
    onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="repo-detail-panel" style={{ '--planet-accent': style.accent } as React.CSSProperties}>
      <div className="detail-topline"><span className="micro-label">WORLD IN FOCUS</span><button className="detail-close" onClick={onClose} aria-label="Close repository details" autoFocus>×</button></div>
      <p className="detail-owner">{owner} /</p>
      <h2 id="repo-detail-title">{repo.name}</h2>
      <div className="detail-identity"><span className="detail-language"><i />{repo.language || 'Unknown language'}</span><span>{repo.archived ? 'Archived world' : style.description}</span></div>
      <p className="detail-description">{repo.description || 'A world of public code, waiting to be explored.'}</p>
      <dl className="detail-stats">
        <div><dt>Stars</dt><dd>{repo.stars.toLocaleString()}</dd></div>
        <div><dt>Forks</dt><dd>{repo.forks.toLocaleString()}</dd></div>
        <div><dt>Repository size</dt><dd>{size}</dd></div>
      </dl>
      <dl className="detail-dates"><div><dt>First formed</dt><dd>{formatDate(repo.createdAt)}</dd></div><div><dt>Last activity</dt><dd>{formatDate(repo.pushedAt)}</dd></div></dl>
      <a className="detail-github" href={repo.htmlUrl} target="_blank" rel="noopener noreferrer">Open on GitHub <span aria-hidden="true">↗</span></a>
      <button className="detail-back" onClick={onClose}>← Back to universe <kbd>ESC</kbd></button>
    </section>
  </dialog>;
}
