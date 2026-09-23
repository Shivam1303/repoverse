'use client';

import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import type { UniverseRepository } from '@/lib/github/types';
import type { CameraMode, IntroProgress, PlanetSelection } from '../camera/types';
import { PLANET_STYLES } from '../visuals/planetStyles';
import { planetAppearance } from '../visuals/planetAppearance';
import { atmosphereFragmentShader, atmosphereVertexShader, planetFragmentShader, planetVertexShader } from '../visuals/shaders';
import { PlanetRings } from './PlanetRings';
import { PlanetActivity, PlanetMoons } from './PlanetSatellites';

type Props = {
  repo: UniverseRepository;
  index: number;
  total: number;
  label: boolean;
  onHover: (id: number | null) => void;
  onSelect: (selection: PlanetSelection) => void;
  selection: PlanetSelection | null;
  mode: CameraMode;
  mobile: boolean;
  reducedMotion: boolean;
  intro: IntroProgress;
};

function orbitPosition(angle: number, repo: UniverseRepository): [number, number, number] {
  const visual = repo.visualization;
  return [Math.cos(angle) * visual.orbitRadius, Math.sin(angle) * visual.orbitRadius * Math.sin(visual.orbitInclination), Math.sin(angle) * visual.orbitRadius * (1 - visual.orbitEccentricity)];
}

export function RepositoryPlanet({ repo, index, total, label, onHover, onSelect, selection, mode, mobile, reducedMotion, intro }: Props) {
  const group = useRef<THREE.Group>(null);
  const visual = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const atmosphere = useRef<THREE.ShaderMaterial>(null);
  const orbitLineRef = useRef<THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>>(null);
  const [hovered, setHovered] = useState(false);
  const appearance = repo.visualization;
  const phase = useRef(appearance.orbitPhase);
  const time = useRef(0);
  const selected = selection?.id === repo.id;
  const dimmed = selection !== null && !selected;
  const style = PLANET_STYLES[appearance.planetFamily];
  const palette = useMemo(() => planetAppearance(repo), [repo]);
  const initialPosition = useMemo(() => orbitPosition(appearance.orbitPhase, repo), [repo, appearance.orbitPhase]);
  const orbitLine = useMemo(() => {
    const points = Array.from({ length: 193 }, (_, point) => new THREE.Vector3(...orbitPosition(point / 192 * Math.PI * 2, repo)));
    return new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: '#52677e', transparent: true, opacity: 0, depthWrite: false }));
  }, [repo]);
  useEffect(() => () => { orbitLine.geometry.dispose(); orbitLine.material.dispose(); }, [orbitLine]);
  useEffect(() => {
    if (!hovered || mode !== 'universe') return;
    document.body.style.cursor = 'pointer';
    return () => { document.body.style.cursor = ''; };
  }, [hovered, mode]);

  const uniforms = useMemo(() => ({
    uSeed: { value: appearance.seed % 10000 }, uFamily: { value: style.index },
    uActivity: { value: appearance.activityIntensity }, uArchived: { value: repo.archived ? 1 : 0 },
    uRadius: { value: appearance.radius }, uTime: { value: 0 }, uVisibility: { value: 1 },
    uVariant: { value: appearance.surfaceVariant }, uSurfaceScale: { value: appearance.surfaceScale },
    uShadow: { value: new THREE.Color(palette.shadow) }, uMid: { value: new THREE.Color(palette.mid) },
    uHighlight: { value: new THREE.Color(palette.highlight) }, uEmission: { value: new THREE.Color(palette.emission) },
  }), [appearance.seed, appearance.activityIntensity, appearance.radius, appearance.surfaceVariant, appearance.surfaceScale, style.index, repo.archived, palette]);
  const atmosphereUniforms = useMemo(() => ({
    uColor: { value: new THREE.Color(palette.emission) }, uIntensity: { value: appearance.atmosphereIntensity },
    uTime: { value: 0 }, uActivity: { value: appearance.activityIntensity }, uVisibility: { value: 1 },
  }), [palette.emission, appearance.atmosphereIntensity, appearance.activityIntensity]);

  useFrame((_, delta) => {
    const step = Math.min(delta, 0.05);
    const progress = intro.current.value;
    const start = index === 0 ? 0.35 : 0.49 + 0.35 * (index - 1) / Math.max(1, total - 2);
    const reveal = THREE.MathUtils.smoothstep(progress, start, start + 0.12);
    if (visual.current) visual.current.scale.setScalar(Math.max(0.001, reveal * (1 + Math.sin(reveal * Math.PI) * 0.12)));
    if (!reducedMotion) {
      time.current += step;
      if (mode === 'universe') phase.current += step * appearance.orbitSpeed * (hovered ? 0.2 : 1);
      if (body.current) body.current.rotation.y += step * appearance.rotationSpeed * 0.36;
    }
    if (group.current) group.current.position.set(...orbitPosition(phase.current, repo));
    if (material.current) {
      material.current.uniforms.uTime.value = time.current;
      material.current.uniforms.uVisibility.value = THREE.MathUtils.damp(material.current.uniforms.uVisibility.value, dimmed ? 0.15 : 1, 4, step);
    }
    if (atmosphere.current) {
      atmosphere.current.uniforms.uTime.value = time.current;
      atmosphere.current.uniforms.uIntensity.value = appearance.atmosphereIntensity * (hovered || selected ? 1.2 : 0.85);
      atmosphere.current.uniforms.uVisibility.value = dimmed ? 0.1 : 1;
    }
    if (orbitLineRef.current) {
      const orbitReveal = THREE.MathUtils.smoothstep(progress, 0.63, 0.95);
      orbitLineRef.current.geometry.setDrawRange(0, Math.floor(193 * orbitReveal));
      orbitLineRef.current.material.opacity = THREE.MathUtils.damp(orbitLineRef.current.material.opacity, (mode === 'universe' || mode === 'entering' ? 0.2 : 0.025) * orbitReveal, 4, step);
    }
  });

  function select() {
    if (mode !== 'universe' || !group.current) return;
    onHover(null);
    onSelect({ id: repo.id, radius: appearance.radius * (appearance.ring ? 1.3 : appearance.moonCount > 2 ? 1.2 : 1), position: group.current.position.toArray() as [number, number, number] });
  }

  return <>
    <primitive object={orbitLine} ref={orbitLineRef} />
    <group ref={group} position={initialPosition}>
      <group ref={visual} scale={mode === 'entering' ? 0.001 : 1}>
        {appearance.ring && <PlanetRings repo={repo} dimmed={dimmed} />}
        {appearance.moonCount > 0 && <PlanetMoons repo={repo} intro={intro} reducedMotion={reducedMotion} dimmed={dimmed} selected={selected} />}
        {!repo.archived && appearance.activityIntensity > 0.18 && <PlanetActivity repo={repo} intro={intro} reducedMotion={reducedMotion} dimmed={dimmed} selected={selected} />}
        <group ref={body} rotation={[0.12, (appearance.seed % 100) * 0.06, -0.18]}>
          <mesh scale={appearance.radius} userData={{ repositoryId: repo.id }}
            onClick={(event) => { event.stopPropagation(); if (event.delta <= 5) select(); }}
            onPointerOver={(event) => { event.stopPropagation(); if (mode === 'universe') { setHovered(true); onHover(repo.id); } }}
            onPointerOut={() => { setHovered(false); onHover(null); }}>
            <sphereGeometry args={[1, selected ? (mobile ? 80 : 128) : (mobile ? 40 : 64), selected ? (mobile ? 56 : 96) : (mobile ? 28 : 48)]} />
            <shaderMaterial ref={material} vertexShader={planetVertexShader} fragmentShader={planetFragmentShader} uniforms={uniforms} />
          </mesh>
          <mesh scale={appearance.radius * 1.026} raycast={() => null}>
            <sphereGeometry args={[1, mobile ? 40 : 64, mobile ? 28 : 48]} />
            <shaderMaterial ref={atmosphere} vertexShader={atmosphereVertexShader} fragmentShader={atmosphereFragmentShader} uniforms={atmosphereUniforms} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
        </group>
      </group>
      {mode === 'universe' && (label || hovered) && <Html position={[0, appearance.radius + 1.15, 0]} center distanceFactor={30} zIndexRange={[3, 0]}>
        <button type="button" onClick={select} className={`planet-label ${hovered ? 'planet-label--hovered' : ''}`} aria-label={`Explore ${repo.name}`}><span className="planet-label-dot" style={{ background: style.accent }} /><span>{repo.name}</span><small>{repo.language || 'CODE'}</small></button>
      </Html>}
    </group>
  </>;
}
