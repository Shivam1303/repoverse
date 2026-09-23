'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { seededUnit } from '@/lib/github/normalize';
import type { UniverseRepository } from '@/lib/github/types';
import type { IntroProgress } from '../camera/types';
import { planetAppearance } from '../visuals/planetAppearance';
import { activityLightFragmentShader, activityLightVertexShader, moonFragmentShader, moonVertexShader } from '../visuals/shaders';

// One small, faceted geometry is shared by every moon and energy mote.
const satelliteGeometry = new THREE.IcosahedronGeometry(1, 1);
const activityLightGeometry = new THREE.PlaneGeometry(1, 1);

type Satellite = { phase: number; speed: number; distance: number; tilt: number; size: number };

function placeSatellite(dummy: THREE.Object3D, satellite: Satellite, time: number, reveal: number) {
  const angle = satellite.phase + time * satellite.speed;
  dummy.position.set(
    Math.cos(angle) * satellite.distance,
    Math.sin(angle) * satellite.distance * Math.sin(satellite.tilt),
    Math.sin(angle) * satellite.distance * Math.cos(satellite.tilt),
  );
  dummy.scale.setScalar(Math.max(0.001, satellite.size * reveal));
  dummy.rotation.set(0, angle * 0.3, satellite.tilt * 0.3);
  dummy.updateMatrix();
}

export function PlanetMoons({ repo, intro, reducedMotion, dimmed, selected }: {
  repo: UniverseRepository; intro: IntroProgress; reducedMotion: boolean; dimmed: boolean; selected: boolean;
}) {
  const time = useRef(0);
  const dummy = useRef(new THREE.Object3D());
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const appearance = repo.visualization;
  const palette = useMemo(() => planetAppearance(repo), [repo]);
  const moons = useMemo(() => Array.from({ length: appearance.moonCount }, (_, index): Satellite => {
    const unit = (salt: number) => seededUnit(appearance.seed, index * 17 + salt);
    const ringClearance = appearance.ring ? appearance.ring.outerRadius + 0.23 : 1.27;
    return {
      phase: unit(41) * Math.PI * 2,
      speed: (0.18 + unit(42) * 0.19) * (index % 2 ? -1 : 1),
      distance: appearance.radius * (ringClearance + index * 0.21 + unit(43) * 0.12),
      tilt: (unit(44) - 0.5) * 0.82,
      size: appearance.radius * (0.075 + unit(45) * 0.075),
    };
  }), [appearance]);
  const uniforms = useMemo(() => ({
    uSeed: { value: appearance.seed % 10000 },
    uOpacity: { value: 1 },
  }), [appearance.seed]);
  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.boundingSphere = new THREE.Sphere(new THREE.Vector3(), Math.max(...moons.map((moon) => moon.distance + moon.size)));
    const bright = new THREE.Color(palette.highlight);
    const dark = new THREE.Color(palette.shadow);
    moons.forEach((_, index) => {
      mesh.setColorAt(index, dark.clone().lerp(bright, 0.43 + seededUnit(appearance.seed, index * 17 + 46) * 0.47));
    });
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [appearance.seed, moons, palette.highlight, palette.shadow]);
  useFrame((_, delta) => {
    const mesh = meshRef.current;
    const material = materialRef.current;
    if (!mesh || !material) return;
    const step = Math.min(delta, 0.05);
    if (!reducedMotion) time.current += step;
    const reveal = THREE.MathUtils.smoothstep(intro.current.value, 0.78, 0.98);
    moons.forEach((moon, index) => {
      placeSatellite(dummy.current, moon, time.current, reveal);
      mesh.setMatrixAt(index, dummy.current.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    material.uniforms.uOpacity.value = THREE.MathUtils.damp(material.uniforms.uOpacity.value, dimmed ? 0.13 : 1, 4, step);
  });
  return <>
    <instancedMesh ref={meshRef} args={[undefined, undefined, moons.length]} raycast={() => null}>
    <primitive object={satelliteGeometry} attach="geometry" />
      <shaderMaterial ref={materialRef} vertexShader={moonVertexShader} fragmentShader={moonFragmentShader} uniforms={uniforms} transparent depthWrite={false} />
    </instancedMesh>
    {selected && <MoonOrbitTrails moons={moons} time={time} color={palette.highlight} />}
  </>;
}

function MoonOrbitTrails({ moons, time, color }: { moons: Satellite[]; time: { current: number }; color: string }) {
  const geometry = useMemo(() => {
    const segments = 12;
    const positions = new Float32Array(moons.length * segments * 2 * 3);
    const colors = new Float32Array(positions.length);
    const base = new THREE.Color(color);
    for (let moon = 0; moon < moons.length; moon++) {
      for (let segment = 0; segment < segments; segment++) {
        const offset = (moon * segments + segment) * 6;
        const tail = base.clone().multiplyScalar(0.08 + segment / segments * 0.48);
        const head = base.clone().multiplyScalar(0.08 + (segment + 1) / segments * 0.48);
        colors.set([tail.r, tail.g, tail.b, head.r, head.g, head.b], offset);
      }
    }
    const result = new THREE.BufferGeometry();
    result.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
    result.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    result.boundingSphere = new THREE.Sphere(new THREE.Vector3(), Math.max(...moons.map((moon) => moon.distance + moon.size)));
    return result;
  }, [moons, color]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(() => {
    const position = geometry.getAttribute('position') as THREE.BufferAttribute;
    const array = position.array as Float32Array;
    moons.forEach((moon, moonIndex) => {
      for (let segment = 0; segment < 12; segment++) {
        for (let point = 0; point < 2; point++) {
          const fraction = (segment + point) / 12;
          const angle = moon.phase + time.current * moon.speed - (1 - fraction) * Math.sign(moon.speed) * 0.63;
          const offset = (moonIndex * 12 + segment) * 6 + point * 3;
          array[offset] = Math.cos(angle) * moon.distance;
          array[offset + 1] = Math.sin(angle) * moon.distance * Math.sin(moon.tilt);
          array[offset + 2] = Math.sin(angle) * moon.distance * Math.cos(moon.tilt);
        }
      }
    });
    position.needsUpdate = true;
  });
  return <lineSegments geometry={geometry} raycast={() => null}>
    <lineBasicMaterial vertexColors transparent opacity={0.38} depthWrite={false} blending={THREE.AdditiveBlending} />
  </lineSegments>;
}

export function PlanetActivity({ repo, intro, reducedMotion, dimmed, selected }: {
  repo: UniverseRepository; intro: IntroProgress; reducedMotion: boolean; dimmed: boolean; selected: boolean;
}) {
  const time = useRef(0);
  const dummy = useRef(new THREE.Object3D());
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const appearance = repo.visualization;
  const palette = useMemo(() => planetAppearance(repo), [repo]);
  const motes = useMemo(() => Array.from({ length: Math.min(8, Math.round(2 + appearance.activityIntensity * 6)) }, (_, index): Satellite => {
    const unit = (salt: number) => seededUnit(appearance.seed, index * 19 + salt);
    return {
      phase: unit(71) * Math.PI * 2,
      speed: (0.34 + appearance.activityIntensity * 0.28 + unit(72) * 0.42) * (index % 2 ? -1 : 1),
      distance: appearance.radius * (1.13 + unit(73) * 0.3),
      tilt: (unit(74) - 0.5) * 1.05,
      size: appearance.radius * (0.024 + unit(75) * 0.016),
    };
  }), [appearance]);
  const uniforms = useMemo(() => ({
    uColor: { value: new THREE.Color(palette.emission) },
    uOpacity: { value: 0 },
  }), [palette.emission]);
  useEffect(() => {
    if (meshRef.current) meshRef.current.boundingSphere = new THREE.Sphere(new THREE.Vector3(), Math.max(...motes.map((mote) => mote.distance + mote.size * 3)));
  }, [motes]);
  useFrame(({ camera }, delta) => {
    const mesh = meshRef.current;
    const material = materialRef.current;
    if (!mesh || !material) return;
    const step = Math.min(delta, 0.05);
    if (!reducedMotion) time.current += step;
    const reveal = THREE.MathUtils.smoothstep(intro.current.value, 0.88, 1);
    motes.forEach((mote, index) => {
      const shimmer = reducedMotion ? 1 : 0.8 + 0.2 * Math.sin(time.current * 2.2 + index * 1.9);
      placeSatellite(dummy.current, mote, time.current, reveal * shimmer);
      dummy.current.quaternion.copy(camera.quaternion);
      dummy.current.scale.setScalar(Math.max(0.001, mote.size * reveal * shimmer * 2.5));
      dummy.current.updateMatrix();
      mesh.setMatrixAt(index, dummy.current.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    const opacity = dimmed ? 0.04 : selected ? 0.56 : 0.22 + appearance.activityIntensity * 0.2;
    material.uniforms.uOpacity.value = THREE.MathUtils.damp(material.uniforms.uOpacity.value, opacity * reveal, 4, step);
  });
  return <instancedMesh ref={meshRef} args={[undefined, undefined, motes.length]} raycast={() => null}>
    <primitive object={activityLightGeometry} attach="geometry" />
    <shaderMaterial ref={materialRef} vertexShader={activityLightVertexShader} fragmentShader={activityLightFragmentShader} uniforms={uniforms} transparent depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
  </instancedMesh>;
}
