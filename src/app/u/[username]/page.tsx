import type { Metadata } from 'next';
import Link from 'next/link';
import { BrandMark } from '@/components/BrandMark';
import { UniverseExperience } from '@/components/reporverse/UniverseExperience';
import { getGithubUniverse, GithubUniverseError } from '@/lib/github/client';
import { getFixture } from '@/lib/fixtures/profiles';
import { parseGithubUsername } from '@/lib/github/username';
import type { GithubUniverse } from '@/lib/github/types';

type Props = { params: Promise<{ username: string }>; searchParams: Promise<{ fixture?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: `@${username} · Repoverse`, description: `Explore @${username}'s public code universe.` };
}

export default async function UniversePage({ params, searchParams }: Props) {
  const { username: raw } = await params;
  const { fixture } = await searchParams;
  const username = parseGithubUsername(raw);
  if (!username) return <UniverseError kind="invalid" />;
  let universe: GithubUniverse;
  let isFixture = false;
  try {
    const local = process.env.NODE_ENV === 'development' && fixture ? getFixture(fixture) : null;
    isFixture = Boolean(local);
    universe = local ?? await getGithubUniverse(username);
  } catch (error) {
    if (!(error instanceof GithubUniverseError)) console.error('Universe page error', error);
    const kind = error instanceof GithubUniverseError ? error.code : 'unavailable';
    return <UniverseError kind={kind} />;
  }
  return <UniverseExperience key={universe.user.login.toLowerCase()} universe={universe} isFixture={isFixture} />;
}

function UniverseError({ kind }: { kind: string }) {
  const missing = kind === 'not_found' || kind === 'invalid';
  return <main className="error-screen"><Link className="wordmark" href="/"><BrandMark /> REPOVERSE</Link><div className="error-orbit" aria-hidden="true" /><span className="eyebrow">SIGNAL LOST / {kind.toUpperCase()}</span><h1>{missing ? "Couldn't find this universe." : 'The universe is temporarily unreachable.'}</h1><p>{missing ? 'Check the GitHub username and try again.' : kind === 'rate_limited' ? 'GitHub has reached its request limit. Try again shortly.' : 'Please try again in a moment.'}</p><Link className="text-link" href="/">← Search another profile</Link></main>;
}
