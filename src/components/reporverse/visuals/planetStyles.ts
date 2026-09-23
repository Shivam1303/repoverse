import type { PlanetFamily } from '@/lib/github/types';

export type PlanetStyle = { index: number; accent: string; glow: string; description: string };

export const PLANET_STYLES: Record<PlanetFamily, PlanetStyle> = {
  typescript: { index: 0, accent: '#9fc8ff', glow: '#4e92e9', description: 'Crystalline grids' },
  javascript: { index: 1, accent: '#f6cf80', glow: '#e7a63e', description: 'Luminous circuitry' },
  python: { index: 2, accent: '#a6d8b2', glow: '#75bda3', description: 'Organic terrain' },
  rust: { index: 3, accent: '#edaa7b', glow: '#d66b48', description: 'Volcanic fissures' },
  go: { index: 4, accent: '#91dfdf', glow: '#4ab4c1', description: 'Ocean currents' },
  java: { index: 5, accent: '#e8a9a6', glow: '#ca6760', description: 'Molten bands' },
  generic: { index: 6, accent: '#d6c5a1', glow: '#9d9eaa', description: 'Seeded mineral world' },
};
