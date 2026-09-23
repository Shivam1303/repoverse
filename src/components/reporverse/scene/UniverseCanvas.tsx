'use client';

import { Canvas } from '@react-three/fiber';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import type { GithubUniverse } from '@/lib/github/types';
import { UniverseScene } from './UniverseScene';
import type { CameraMode, PlanetSelection } from '../camera/types';

export function UniverseCanvas({ universe, onHover, selection, mode, onSelect, onModeChange }: {
  universe: GithubUniverse; onHover: (id: number | null) => void;
  selection: PlanetSelection | null; mode: CameraMode; onSelect: (selection: PlanetSelection) => void; onModeChange: (mode: CameraMode) => void;
}) {
  const mobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const furthest = universe.repositories.at(-1)?.visualization.orbitRadius ?? 20;
  const cameraDistance = Math.max(42, Math.min(105, furthest * 0.9)) * (mobile ? 1.8 : 1);
  return <div className="universe-canvas"><Canvas camera={{ position: [0, cameraDistance * 0.43, cameraDistance], fov: 48, near: 0.1, far: 1600 }} dpr={[1, mobile ? 1.2 : 1.65]} gl={{ antialias: true, powerPreference: 'high-performance' }}>
    <color attach="background" args={['#02050c']} />
    <fog attach="fog" args={['#02050c', 180, 600]} />
    <UniverseScene universe={universe} onHover={onHover} cameraDistance={cameraDistance} mobile={mobile} selection={selection} mode={mode} onSelect={onSelect} onModeChange={onModeChange} />
    <EffectComposer multisampling={0}><Bloom mipmapBlur intensity={0.42} luminanceThreshold={0.95} luminanceSmoothing={0.3} /><Vignette offset={0.15} darkness={0.3} /></EffectComposer>
  </Canvas></div>;
}
