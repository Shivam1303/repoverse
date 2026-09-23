'use client';

import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import type { GithubUniverse } from '@/lib/github/types';
import { seededUnit, stableSeed } from '@/lib/github/normalize';
import { CameraController } from '../camera/CameraController';
import type { CameraMode, IntroProgress, PlanetSelection } from '../camera/types';
import { RepositoryPlanet } from './RepositoryPlanet';

export function UniverseScene({ universe, onHover, cameraDistance, mobile, selection, mode, onSelect, onModeChange }: {
  universe: GithubUniverse; onHover: (id: number | null) => void; cameraDistance: number; mobile: boolean;
  selection: PlanetSelection | null; mode: CameraMode; onSelect: (selection: PlanetSelection) => void; onModeChange: (mode: CameraMode) => void;
}) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const intro = useRef({ value: 0 });
  const setIntroProgress = useCallback((value: number) => { intro.current.value = value; }, []);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return <>
    <ambientLight intensity={0.72} />
    <directionalLight position={[-12, 17, 24]} intensity={1.15} color="#d6e5f7" />
    <Starfield seed={stableSeed(universe.user.login)} mobile={mobile} intro={intro} entering={mode === 'entering'} />
    <UserStar universe={universe} reducedMotion={reducedMotion} focused={selection !== null} intro={intro} entering={mode === 'entering'} />
    {universe.repositories.map((repo, index) => <RepositoryPlanet key={repo.id} repo={repo} index={index} total={universe.repositories.length} label={index < (mobile ? 3 : 5)} onHover={onHover} mobile={mobile} reducedMotion={reducedMotion} selection={selection} mode={mode} onSelect={onSelect} intro={intro} />)}
    <CameraController selection={selection} onModeChange={onModeChange} cameraDistance={cameraDistance} reducedMotion={reducedMotion} entering={mode === 'entering'} onIntroProgress={setIntroProgress} />
  </>;
}

function Starfield({ seed, mobile, intro, entering }: { seed: number; mobile: boolean; intro: IntroProgress; entering: boolean }) {
  const group = useRef<THREE.Group>(null);
  const layers = useMemo(() => (mobile ? [350, 110] : [650, 250]).map((count, layer) => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const radius = 130 + seededUnit(seed, i * 7 + layer * 10000) * 410;
      const theta = seededUnit(seed, i * 7 + 1 + layer * 10000) * Math.PI * 2;
      const y = (seededUnit(seed, i * 7 + 2 + layer * 10000) - 0.5) * 1.8;
      const planar = Math.sqrt(1 - Math.min(y*y, 0.99));
      positions[i * 3] = Math.cos(theta) * planar * radius;
      positions[i * 3 + 1] = y * radius;
      positions[i * 3 + 2] = Math.sin(theta) * planar * radius;
    }
    return positions;
  }), [seed, mobile]);
  useFrame(() => {
    const progress = THREE.MathUtils.smoothstep(intro.current.value, 0.02, 0.28);
    if (!group.current) return;
    group.current.scale.setScalar(1.17 - progress * 0.17);
    group.current.children.forEach((child, index) => {
      if (child instanceof THREE.Points && child.material instanceof THREE.PointsMaterial) child.material.opacity = progress * (index ? 0.8 : 0.64);
    });
  });
  return <group ref={group}>{layers.map((positions, index) => <points key={index}><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry><pointsMaterial color={index ? '#8baed1' : '#e8e5de'} size={index ? 1.1 : 0.55} sizeAttenuation transparent opacity={entering ? 0 : index ? 0.8 : 0.64} depthWrite={false} /></points>)}</group>;
}

function UserStar({ universe, reducedMotion, focused, intro, entering }: { universe: GithubUniverse; reducedMotion: boolean; focused: boolean; intro: IntroProgress; entering: boolean }) {
  const star = useRef<THREE.Group>(null);
  const light = useRef<THREE.PointLight>(null);
  const corona = useRef<THREE.Mesh>(null);
  const surface = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }, delta) => {
    if (corona.current && !reducedMotion) corona.current.rotation.y = clock.elapsedTime * 0.018;
    const ignition = THREE.MathUtils.smoothstep(intro.current.value, 0.16, 0.38);
    if (star.current) star.current.scale.setScalar(Math.max(0.001, ignition));
    if (light.current) light.current.intensity = 42 * ignition;
    if (surface.current) surface.current.opacity = THREE.MathUtils.damp(surface.current.opacity, ignition * (focused ? 0.12 : 1), 4, delta);
  });
  return <group ref={star} scale={entering ? 0.001 : 1}>
    <pointLight ref={light} color="#ffc994" intensity={entering ? 0 : 42} distance={95} decay={2} />
    <mesh><sphereGeometry args={[2.45, 48, 32]} /><meshBasicMaterial ref={surface} color="#fff2d2" toneMapped={false} transparent opacity={entering ? 0 : 1} /></mesh>
    <mesh scale={1.23}><sphereGeometry args={[2.45, 32, 24]} /><meshBasicMaterial color="#e7a76a" transparent opacity={0.11} depthWrite={false} side={THREE.BackSide} /></mesh>
    <mesh ref={corona} rotation={[0.3, 0, 0.24]}><torusGeometry args={[3.9, 0.018, 4, 128]} /><meshBasicMaterial color="#d7a778" transparent opacity={0.44} /></mesh>
    <mesh rotation={[1.2, 0, 0.7]}><torusGeometry args={[4.7, 0.009, 3, 128]} /><meshBasicMaterial color="#7591b5" transparent opacity={0.28} /></mesh>
    {!entering && !focused && universe.user.avatarUrl && <Html position={[0, 0, 2.55]} center distanceFactor={12} style={{ pointerEvents: 'none' }}><div className="star-avatar" style={{ backgroundImage: `url(${universe.user.avatarUrl})` }} aria-hidden="true" /></Html>}
    {!entering && !focused && <Html position={[0, -4.2, 0]} center distanceFactor={30} style={{ pointerEvents: 'none' }}><div className="star-label"><strong>@{universe.user.login}</strong><span>ORIGIN STAR</span></div></Html>}
  </group>;
}
