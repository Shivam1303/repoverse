import { normalizeUniverse } from '@/lib/github/normalize';
import type { GithubRepoResponse, GithubUniverse, GithubUserResponse } from '@/lib/github/types';

type FixtureName = 'torvalds' | 'small' | 'medium' | 'huge' | 'empty';
export const fixtureNames: FixtureName[] = ['torvalds', 'small', 'medium', 'huge', 'empty'];

const now = Date.now();
const daysAgo = (days: number) => new Date(now - days * 86400000).toISOString();

const definitions = [
  ['atlas', 'TypeScript', 98600, 9300, 920000, 3, false, 'An open source framework for building the next web.'],
  ['forge', 'Rust', 28400, 2400, 290000, 80, false, 'A fast foundation for systems and tools.'],
  ['garden', 'Python', 13300, 850, 110000, 1, false, 'Experiments in machine learning and language.'],
  ['monolith', 'Java', 6400, 420, 490000, 1100, true, 'An archived software platform.'],
  ['current', 'Go', 3900, 200, 78000, 9, false, 'Network tools for the curious.'],
  ['signal', 'JavaScript', 2600, 90, 36000, 20, false, 'Reactive tools for the browser.'],
  ['crystal', 'TypeScript', 1500, 51, 28000, 250, false, 'An interface study.'],
  ['ember', 'Rust', 850, 28, 18000, 400, false, 'A tiny rendering engine.'],
  ['harbor', 'Go', 490, 15, 13000, 140, false, 'Small services at scale.'],
  ['petal', 'Python', 175, 4, 9000, 23, false, 'Simple automation scripts.'],
  ['thread', 'JavaScript', 58, 2, 3100, 420, false, 'A utility for tiny projects.'],
  ['seed', null, 8, 0, 390, 790, false, 'A tiny beginning.'],
] as const;

function makeRepo(name: string, language: string | null, stars: number, forks: number, size: number, age: number, archived: boolean, description: string, index: number): GithubRepoResponse {
  return {
    id: 900000 + index,
    name,
    description,
    html_url: `https://github.com/repoverse-fixture/${name}`,
    language,
    stargazers_count: stars,
    forks_count: forks,
    size,
    created_at: daysAgo(2200 + index * 100),
    updated_at: daysAgo(Math.max(1, age - 3)),
    pushed_at: daysAgo(age),
    archived,
    fork: false,
  };
}

function user(login: string, count: number): GithubUserResponse {
  return { login, name: login === 'torvalds' ? 'Linus Torvalds' : 'The Observatory', avatar_url: '', bio: 'A local development universe', followers: 148000, following: 0, public_repos: count, html_url: `https://github.com/${login}`, type: 'User' };
}

export function getFixture(name: string): GithubUniverse | null {
  if (!fixtureNames.includes(name as FixtureName)) return null;
  if (name === 'empty') return normalizeUniverse(user('empty-space', 0), [], now);
  if (name === 'torvalds') {
    const repos = [
      makeRepo('linux', 'C', 210000, 58000, 5400000, 2, false, 'Linux kernel source tree', 1),
      makeRepo('subsurface', 'C++', 4700, 1800, 340000, 43, false, 'Advanced dive logging and planning', 2),
      makeRepo('git', 'C', 55000, 26000, 310000, 19, false, 'Fast, scalable, distributed revision control', 3),
      makeRepo('uemacs', 'C', 1300, 180, 12000, 900, false, 'A small editor with a long history', 4),
      makeRepo('1590A', 'C', 710, 120, 3600, 270, false, 'A personal side project', 5),
      makeRepo('test-tlb', 'C', 510, 88, 6000, 1300, true, 'Memory management experiments', 6),
      makeRepo('libdc-for-dirk', 'C', 430, 72, 9100, 1800, true, 'Device communication library', 7),
      makeRepo('pesconvert', 'C', 250, 33, 4500, 670, false, 'A small format conversion tool', 8),
    ];
    return normalizeUniverse(user('torvalds', repos.length), repos, now);
  }
  const base = definitions.map(([repoName, language, stars, forks, size, age, archived, description], index) => makeRepo(repoName, language, stars, forks, size, age, archived, description, index));
  if (name === 'small') return normalizeUniverse(user('small-signal', 2), base.slice(0, 2), now);
  if (name === 'medium') return normalizeUniverse(user('observatory', base.length), base, now);
  const huge = Array.from({ length: 180 }, (_, index) => {
    const entry = definitions[index % definitions.length];
    return makeRepo(`${entry[0]}-${index + 1}`, entry[1], Math.round(entry[2] / (1 + index * 0.11)), Math.round(entry[3] / (1 + index * 0.08)), entry[4], entry[5] + index * 3, entry[6], entry[7], index);
  });
  return normalizeUniverse(user('many-worlds', huge.length), huge, now);
}
