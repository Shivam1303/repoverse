import { normalizeUniverse } from './normalize';
import type { GithubRepoResponse, GithubUniverse, GithubUserResponse } from './types';

const API = 'https://api.github.com';
const REVALIDATE_SECONDS = 300;

export class GithubUniverseError extends Error {
  constructor(public code: 'not_found' | 'rate_limited' | 'unavailable', message: string) {
    super(message);
  }
}

async function githubGet(path: string): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`${API}${path}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2026-03-10',
        'User-Agent': 'Repoverse',
        ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
      },
      next: { revalidate: REVALIDATE_SECONDS },
    });
  } catch (error) {
    console.error('GitHub request failed', path, error);
    throw new GithubUniverseError('unavailable', 'GitHub is temporarily unreachable');
  }
  if (response.status === 404) throw new GithubUniverseError('not_found', 'Profile not found');
  if (response.status === 403 || response.status === 429) {
    console.error('GitHub rate limit or access error', response.status, path, response.headers.get('x-ratelimit-remaining'));
    throw new GithubUniverseError('rate_limited', 'GitHub is temporarily rate limited');
  }
  if (!response.ok) {
    console.error('GitHub response error', response.status, path);
    throw new GithubUniverseError('unavailable', 'GitHub is temporarily unreachable');
  }
  try { return await response.json(); }
  catch {
    throw new GithubUniverseError('unavailable', 'GitHub sent an unreadable response');
  }
}

export async function getGithubUniverse(username: string): Promise<GithubUniverse> {
  const profile = await githubGet(`/users/${encodeURIComponent(username)}`);
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
    throw new GithubUniverseError('unavailable', 'GitHub sent an invalid profile');
  }
  const user = profile as GithubUserResponse;
  if (user.type !== 'User' && user.type !== 'Organization') throw new GithubUniverseError('not_found', 'This public account is not available');
  const count = typeof user.public_repos === 'number' ? user.public_repos : 0;
  const pages = Math.min(5, Math.ceil(count / 100));
  const batches = await Promise.all(Array.from({ length: pages }, (_, index) =>
    githubGet(`/users/${encodeURIComponent(username)}/repos?type=public&sort=updated&direction=desc&per_page=100&page=${index + 1}`)
  ));
  if (batches.some((batch) => !Array.isArray(batch))) {
    throw new GithubUniverseError('unavailable', 'GitHub sent an invalid repository list');
  }
  const repos = batches.flat() as GithubRepoResponse[];
  try { return normalizeUniverse(user, repos); }
  catch (error) {
    console.error('GitHub normalization error', username, error);
    throw new GithubUniverseError('unavailable', 'GitHub sent incomplete profile data');
  }
}
