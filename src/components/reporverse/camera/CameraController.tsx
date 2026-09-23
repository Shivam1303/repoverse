'use client';

import { OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import gsap from 'gsap';
import { useEffect, useRef } from 'react';
import { PerspectiveCamera, Vector3 } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { CameraMode, PlanetSelection } from './types';

type Props = {
  selection: PlanetSelection | null;
  onModeChange: (mode: CameraMode) => void;
  cameraDistance: number;
  reducedMotion: boolean;
  entering: boolean;
  onIntroProgress: (value: number) => void;
};

export function CameraController({ selection, onModeChange, cameraDistance, reducedMotion, entering, onIntroProgress }: Props) {
  const { camera, size } = useThree();
  const controls = useRef<OrbitControlsImpl>(null);
  const savedView = useRef<{ position: Vector3; target: Vector3 } | null>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transition = useRef<gsap.core.Timeline | null>(null);
  const entryTransition = useRef<gsap.core.Timeline | null>(null);
  const focused = useRef(false);
  const narrow = size.width < 760;

  useEffect(() => {
    const orbit = controls.current;
    if (!entering || !orbit || !(camera instanceof PerspectiveCamera)) return;
    entryTransition.current?.kill();
    orbit.enabled = false;
    orbit.autoRotate = false;
    const destination = new Vector3(0, cameraDistance * 0.43, cameraDistance);
    if (reducedMotion) {
      onIntroProgress(1);
      camera.position.copy(destination);
      orbit.target.set(0, 0, 0);
      camera.lookAt(orbit.target);
      orbit.enabled = true;
      orbit.update();
      onModeChange('universe');
      return;
    }

    onIntroProgress(0);
    camera.position.set(cameraDistance * 0.18, cameraDistance * 0.76, cameraDistance * 1.6);
    orbit.target.set(-cameraDistance * 0.09, 0, 0);
    camera.lookAt(orbit.target);
    camera.updateMatrixWorld();
    const progress = { value: 0 };
    const timeline = gsap.timeline({
      onUpdate: () => { onIntroProgress(progress.value); camera.lookAt(orbit.target); camera.updateMatrixWorld(); },
      onComplete: () => {
        onIntroProgress(1);
        orbit.enabled = true;
        orbit.update();
        onModeChange('universe');
      },
    });
    timeline.to(camera.position, { x: destination.x, y: destination.y, z: destination.z, duration: 2.85, ease: 'power2.inOut' }, 0);
    timeline.to(orbit.target, { x: 0, y: 0, z: 0, duration: 2.85, ease: 'power2.inOut' }, 0);
    timeline.to(progress, { value: 1, duration: 2.85, ease: 'none' }, 0);
    entryTransition.current = timeline;
    return () => { timeline.kill(); };
  }, [camera, cameraDistance, entering, onIntroProgress, onModeChange, reducedMotion]);

  useEffect(() => {
    const orbit = controls.current;
    if (!orbit || !(camera instanceof PerspectiveCamera)) return;
    if (entering) return;
    transition.current?.kill();
    if (idleTimer.current) clearTimeout(idleTimer.current);
    orbit.autoRotate = false;

    if (!selection && !savedView.current) {
      orbit.enabled = true;
      orbit.autoRotate = !reducedMotion;
      return;
    }

    // Settle a drag before saving the view; keep return flights continuous.
    if (selection) {
      orbit.enableDamping = false;
      orbit.update();
      orbit.enableDamping = true;
    }
    orbit.enabled = false;
    let destination: Vector3;
    let target: Vector3;
    if (selection) {
      if (!savedView.current) savedView.current = { position: camera.position.clone(), target: orbit.target.clone() };
      focused.current = true;
      onModeChange('focusing');
      camera.updateMatrixWorld();
      const forward = camera.getWorldDirection(new Vector3()).negate();
      const right = new Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
      const up = new Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
      const distance = selection.radius * (narrow ? 8.0 : 4.7);
      const halfHeight = distance * Math.tan(camera.fov * Math.PI / 360);
      target = new Vector3(...selection.position);
      // Position the world at 28% of the viewport, leaving the right half for details.
      if (narrow) target.addScaledVector(up, -halfHeight * 0.43);
      else target.addScaledVector(right, halfHeight * camera.aspect * 0.44);
      destination = target.clone().addScaledVector(forward, distance);
    } else {
      focused.current = false;
      onModeChange('returning');
      destination = savedView.current!.position.clone();
      target = savedView.current!.target.clone();
    }

    const timeline = gsap.timeline({
      defaults: { duration: reducedMotion ? 0 : selection ? 1.65 : 1.35, ease: 'power3.inOut' },
      onUpdate: () => { camera.lookAt(orbit.target); camera.updateMatrixWorld(); },
      onComplete: () => {
        if (selection) onModeChange('planet-focus');
        else {
          savedView.current = null;
          orbit.enabled = true;
          orbit.update();
          onModeChange('universe');
          idleTimer.current = setTimeout(() => {
            if (controls.current && !reducedMotion) controls.current.autoRotate = true;
          }, 9000);
        }
      },
    });
    timeline.to(camera.position, { x: destination.x, y: destination.y, z: destination.z }, 0);
    timeline.to(orbit.target, { x: target.x, y: target.y, z: target.z }, 0);
    transition.current = timeline;
    return () => { timeline.kill(); };
  }, [camera, selection, narrow, size.width, size.height, reducedMotion, onModeChange, entering]);

  useEffect(() => () => {
    transition.current?.kill();
    entryTransition.current?.kill();
    if (idleTimer.current) clearTimeout(idleTimer.current);
  }, []);

  function stopIdle() {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (controls.current) controls.current.autoRotate = false;
  }

  function resumeIdleLater() {
    stopIdle();
    idleTimer.current = setTimeout(() => {
      if (controls.current && !focused.current && !reducedMotion) controls.current.autoRotate = true;
    }, 9000);
  }

  return <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={0.07}
    enablePan={false} zoomToCursor screenSpacePanning zoomSpeed={0.8}
    minDistance={0.8} maxDistance={Math.max(90, cameraDistance * 3.2)}
    minPolarAngle={0.15} maxPolarAngle={Math.PI * 0.68}
    autoRotateSpeed={0.1} onStart={stopIdle} onEnd={resumeIdleLater} />;
}
