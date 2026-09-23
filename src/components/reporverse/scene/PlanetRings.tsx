'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { UniverseRepository } from '@/lib/github/types';
import { planetAppearance } from '../visuals/planetAppearance';
import { ringFragmentShader, ringVertexShader } from '../visuals/shaders';

export function PlanetRings({ repo, dimmed }: { repo: UniverseRepository; dimmed: boolean }) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const ring = repo.visualization.ring!;
  const palette = useMemo(() => planetAppearance(repo), [repo]);
  const uniforms = useMemo(() => ({
    uInner: { value: ring.innerRadius },
    uOuter: { value: ring.outerRadius },
    uSeed: { value: (repo.visualization.seed % 1000) / 1000 },
    uOpacity: { value: ring.opacity },
    uVisibility: { value: 1 },
    uColor: { value: new THREE.Color(palette.ring) },
    uAccent: { value: new THREE.Color(palette.highlight) },
  }), [ring, repo.visualization.seed, palette]);

  useFrame((_, delta) => {
    if (material.current) material.current.uniforms.uVisibility.value = THREE.MathUtils.damp(
      material.current.uniforms.uVisibility.value, dimmed ? 0.1 : 1, 4, Math.min(delta, 0.05),
    );
  });

  return <mesh rotation={ring.tilt} scale={repo.visualization.radius} raycast={() => null}>
    <ringGeometry args={[ring.innerRadius, ring.outerRadius, 192, 8]} />
    <shaderMaterial ref={material} vertexShader={ringVertexShader} fragmentShader={ringFragmentShader}
      uniforms={uniforms} side={THREE.DoubleSide} transparent depthWrite={false} />
  </mesh>;
}
