import type { GithubRepoResponse, GithubUniverse, GithubUserResponse, PlanetFamily, UniverseRepository } from './types';

const MAX_REPOSITORIES = 36;
const number = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0;
const string = (value: unknown) => typeof value === 'string' && value.trim() ? value : null;
const date = (value: unknown) => {
  const candidate = string(value);
  return candidate && !Number.isNaN(Date.parse(candidate)) ? candidate : null;
};

export function stableSeed(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function seededUnit(seed: number, salt: number): number {
  let value = (seed ^ Math.imul(salt, 0x9e3779b1)) >>> 0;
  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb352d);
  value ^= value >>> 15;
  value = Math.imul(value, 0x846ca68b);
  value ^= value >>> 16;
  return (value >>> 0) / 4294967295;
}

export function planetFamily(language: string | null): PlanetFamily {
  switch (language?.toLowerCase()) {
    case 'typescript': return 'typescript';
    case 'javascript': return 'javascript';
    case 'python': return 'python';
    case 'rust': return 'rust';
    case 'go': return 'go';
    case 'java': return 'java';
    default: return 'generic';
  }
}

function activity(pushedAt: string | null, now: number): number {
  if (!pushedAt) return 0.05;
  const days = Math.max(0, (now - Date.parse(pushedAt)) / 86400000);
  return Math.max(0.06, Math.exp(-days / 130));
}

function moonCount(forks: number): number {
  if (forks === 0) return 0;
  if (forks <= 5) return 1;
  if (forks <= 25) return 2;
  if (forks <= 100) return 3;
  return Math.min(6, 3 + Math.floor(Math.log10(forks / 100 + 1) * 2));
}

export function normalizeUniverse(user: GithubUserResponse, rawRepos: GithubRepoResponse[], now = Date.now()): GithubUniverse {
  const login = string(user.login);
  if (!login) throw new Error('GitHub returned a profile without a login');
  const usable = rawRepos.flatMap((raw) => {
    const id = number(raw.id);
    const name = string(raw.name);
    if (!id || !name) return [];
    const stars = number(raw.stargazers_count);
    const forks = number(raw.forks_count);
    const size = number(raw.size);
    const pushedAt = date(raw.pushed_at);
    const archived = raw.archived === true;
    const energy = archived ? 0 : activity(pushedAt, now);
    const importance = Math.log1p(stars) * 1.35 + Math.log1p(size) * 0.5 + energy * 1.9 + Math.log1p(forks) * 0.2;
    return [{ raw, id, name, stars, forks, size, pushedAt, archived, energy, importance }];
  });

  const originals = usable.filter((repo) => repo.raw.fork !== true);
  const preferred = originals.length >= 8 ? originals : usable;
  preferred.sort((a, b) => b.importance - a.importance || a.name.localeCompare(b.name));
  const selected = preferred.slice(0, MAX_REPOSITORIES);
  const maxImportance = Math.max(1, ...selected.map((repo) => repo.importance));
  const ringCandidates = selected.filter((repo) => !repo.archived).map((repo) => ({
    id: repo.id,
    score: seededUnit(stableSeed(`${login.toLowerCase()}:${repo.id}:${repo.name.toLowerCase()}`), 31),
  }));
  const ringSlots = Math.min(4, Math.floor(ringCandidates.length / 6));
  const ringedIds = new Set(ringCandidates
    .sort((a, b) => a.score - b.score || a.id - b.id)
    .slice(0, ringSlots)
    .map((candidate) => candidate.id));
  let previousOuter = 5.5;
  const repositories: UniverseRepository[] = selected.map((repo, index) => {
    const seed = stableSeed(`${login.toLowerCase()}:${repo.id}:${repo.name.toLowerCase()}`);
    const prominence = repo.importance / maxImportance;
    const radius = index === 0 && selected.length > 1
      ? 4.2
      : Math.min(3.15, 0.62 + Math.pow(prominence, 1.45) * 2.85);
    const orbitRadius = previousOuter + radius + (index === 0 ? 2.2 : 1.55);
    previousOuter = orbitRadius + radius;
    const language = string(repo.raw.language);
    const ringed = ringedIds.has(repo.id);
    return {
      id: repo.id,
      name: repo.name,
      description: string(repo.raw.description),
      htmlUrl: string(repo.raw.html_url) ?? `https://github.com/${encodeURIComponent(login)}/${encodeURIComponent(repo.name)}`,
      language,
      stars: repo.stars,
      forks: repo.forks,
      size: repo.size,
      createdAt: date(repo.raw.created_at) ?? new Date(now).toISOString(),
      updatedAt: date(repo.raw.updated_at) ?? new Date(now).toISOString(),
      pushedAt: repo.pushedAt,
      archived: repo.archived,
      fork: repo.raw.fork === true,
      visualization: {
        radius,
        orbitRadius,
        orbitSpeed: (0.002 + 0.003 / Math.sqrt(index + 1)) * (seededUnit(seed, 2) > 0.5 ? 1 : -1),
        rotationSpeed: (0.06 + repo.energy * 0.11) * (seededUnit(seed, 3) > 0.5 ? 1 : -1),
        orbitInclination: (seededUnit(seed, 4) - 0.5) * 0.15,
        orbitEccentricity: seededUnit(seed, 5) * 0.035,
        orbitPhase: index === 0 ? 2.18 : seededUnit(seed, 6) * Math.PI * 2,
        planetFamily: planetFamily(language),
        atmosphereIntensity: repo.archived ? 0.06 : 0.18 + Math.min(0.52, Math.log1p(repo.stars) / 18) + repo.energy * 0.14,
        activityIntensity: repo.energy,
        moonCount: moonCount(repo.forks),
        seed,
        importance: repo.importance,
        surfaceVariant: (Math.floor(seededUnit(seed, 21) * 5) + index * 2) % 5,
        surfaceScale: 0.82 + seededUnit(seed, 22) * 0.55,
        ring: ringed ? {
          innerRadius: 1.15 + seededUnit(seed, 32) * 0.12,
          outerRadius: 1.48 + seededUnit(seed, 33) * 0.4,
          tilt: [0.62 + seededUnit(seed, 34) * 0.32, (seededUnit(seed, 35) - 0.5) * 0.7, (seededUnit(seed, 36) - 0.5) * 0.25],
          opacity: 0.54 + seededUnit(seed, 37) * 0.22,
        } : null,
      },
    };
  });

  return {
    user: {
      login,
      name: string(user.name),
      avatarUrl: string(user.avatar_url) ?? '',
      bio: string(user.bio),
      followers: number(user.followers),
      following: number(user.following),
      publicRepos: number(user.public_repos),
      htmlUrl: string(user.html_url) ?? `https://github.com/${encodeURIComponent(login)}`,
    },
    repositories,
    totalRepositories: Math.max(number(user.public_repos), usable.length),
    generatedAt: new Date(now).toISOString(),
  };
}
