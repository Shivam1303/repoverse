'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { parseGithubUsername } from '@/lib/github/username';

export function UsernameForm({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const username = parseGithubUsername(value);
    if (!username) {
      setError('Enter a GitHub username or profile URL.');
      return;
    }
    setError('');
    router.push(`/u/${username}`);
  }
  return <form className={`username-form ${compact ? 'username-form--compact' : ''}`} onSubmit={submit}>
    <label className="field-label" htmlFor={compact ? 'retry-username' : 'username'}>{compact ? 'GitHub profile' : 'GitHub username or profile URL'}</label>
    <div className="input-shell">
      {compact && <span className="input-prefix" aria-hidden="true">github.com /</span>}
      <input id={compact ? 'retry-username' : 'username'} name="username" value={value} onChange={(event) => { setValue(event.target.value); if (error) setError(''); }} placeholder={compact ? 'username' : 'GitHub username or profile URL'} autoCapitalize="none" autoComplete="off" spellCheck={false} aria-invalid={Boolean(error)} aria-describedby={error ? 'username-error' : undefined} />
      <button type="submit" aria-label="Enter universe"><span>{compact ? 'ENTER' : 'Explore'}</span><span aria-hidden="true">↗</span></button>
    </div>
    {error && <p id="username-error" className="field-error" role="alert">{error}</p>}
  </form>;
}
