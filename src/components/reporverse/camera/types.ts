import type { RefObject } from 'react';

export type CameraMode = 'entering' | 'universe' | 'focusing' | 'planet-focus' | 'returning';

export type IntroProgress = RefObject<{ value: number }>;

export type PlanetSelection = {
  id: number;
  radius: number;
  position: [number, number, number];
};
