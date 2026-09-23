export type PlanetFamily = 'typescript' | 'javascript' | 'python' | 'rust' | 'go' | 'java' | 'generic';

export type UniverseRepository = {
  id: number;
  name: string;
  description: string | null;
  htmlUrl: string;
  language: string | null;
  stars: number;
  forks: number;
  size: number;
  createdAt: string;
  updatedAt: string;
  pushedAt: string | null;
  archived: boolean;
  fork: boolean;
  visualization: {
    radius: number;
    orbitRadius: number;
    orbitSpeed: number;
    rotationSpeed: number;
    orbitInclination: number;
    orbitEccentricity: number;
    orbitPhase: number;
    planetFamily: PlanetFamily;
    atmosphereIntensity: number;
    activityIntensity: number;
    moonCount: number;
    seed: number;
    importance: number;
    surfaceVariant: number;
    surfaceScale: number;
    ring: {
      innerRadius: number;
      outerRadius: number;
      tilt: [number, number, number];
      opacity: number;
    } | null;
  };
};

export type GithubUniverse = {
  user: {
    login: string;
    name: string | null;
    avatarUrl: string;
    bio: string | null;
    followers: number;
    following: number;
    publicRepos: number;
    htmlUrl: string;
  };
  repositories: UniverseRepository[];
  totalRepositories: number;
  generatedAt: string;
};

export type GithubUserResponse = {
  login?: unknown;
  name?: unknown;
  avatar_url?: unknown;
  bio?: unknown;
  followers?: unknown;
  following?: unknown;
  public_repos?: unknown;
  html_url?: unknown;
  type?: unknown;
};

export type GithubRepoResponse = {
  id?: unknown;
  name?: unknown;
  description?: unknown;
  html_url?: unknown;
  language?: unknown;
  stargazers_count?: unknown;
  forks_count?: unknown;
  size?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
  pushed_at?: unknown;
  archived?: unknown;
  fork?: unknown;
};
