import type { PlanetFamily, UniverseRepository } from '@/lib/github/types';

type Palette = { shadow: string; mid: string; highlight: string; emission: string; ring: string };

// Language sets the material family; the repository seed chooses a distinct palette within it.
const palettes: Record<PlanetFamily, Palette[]> = {
  typescript: [
    { shadow: '#09204e', mid: '#3379c5', highlight: '#b8e5ef', emission: '#54b4ff', ring: '#9ac9eb' },
    { shadow: '#182255', mid: '#655ac5', highlight: '#c7c4ff', emission: '#9295ff', ring: '#a4b5ed' },
  ],
  javascript: [
    { shadow: '#482119', mid: '#d77c30', highlight: '#ffe1a0', emission: '#ffd470', ring: '#e5aa67' },
    { shadow: '#413014', mid: '#b89b35', highlight: '#fff0b1', emission: '#f6cc55', ring: '#d9bd7b' },
  ],
  python: [
    { shadow: '#0b3440', mid: '#168c74', highlight: '#b9db9a', emission: '#6bd8a2', ring: '#9dcba9' },
    { shadow: '#17314c', mid: '#4f9b77', highlight: '#d4d6a8', emission: '#a6db9c', ring: '#9ac1af' },
  ],
  rust: [
    { shadow: '#160f1d', mid: '#65312f', highlight: '#c27954', emission: '#ff612a', ring: '#b77e66' },
    { shadow: '#1d1823', mid: '#714329', highlight: '#d6a067', emission: '#ff9b3e', ring: '#ba8e70' },
  ],
  go: [
    { shadow: '#062b49', mid: '#087998', highlight: '#7ee0d6', emission: '#7ce2ed', ring: '#87cddd' },
    { shadow: '#0c325a', mid: '#3188c0', highlight: '#b8e9db', emission: '#74dbe6', ring: '#a0cfeb' },
  ],
  java: [
    { shadow: '#38131c', mid: '#a8423b', highlight: '#f6aa63', emission: '#ff7a39', ring: '#d99b7c' },
    { shadow: '#351b28', mid: '#af5d48', highlight: '#f0c68d', emission: '#ff9a4f', ring: '#d4aa94' },
  ],
  generic: [
    { shadow: '#302522', mid: '#ae6347', highlight: '#f4c389', emission: '#f2aa6a', ring: '#d6ae88' }, // oxidized sandstone
    { shadow: '#201c41', mid: '#755dae', highlight: '#d2b4e7', emission: '#a995f1', ring: '#b6a8db' }, // amethyst mineral
    { shadow: '#102c43', mid: '#438dab', highlight: '#d8e9dd', emission: '#a1d9ef', ring: '#a4ccd8' }, // ice and salt
    { shadow: '#122945', mid: '#3987af', highlight: '#e2bd83', emission: '#8bc6e5', ring: '#a8bdd0' }, // cobalt alloy
    { shadow: '#3b2330', mid: '#b46b72', highlight: '#f1bda9', emission: '#f3a795', ring: '#d6aaae' }, // rose iron
  ],
};

export function planetAppearance(repo: UniverseRepository): Palette {
  const family = repo.visualization.planetFamily;
  const options = palettes[family];
  const variant = family === 'generic' && repo.language?.toLowerCase() === 'c++'
    ? 1
    : repo.visualization.surfaceVariant;
  return options[variant % options.length];
}
