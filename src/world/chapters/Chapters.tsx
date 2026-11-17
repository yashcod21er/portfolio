import { Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { stepTrack } from './shared';
import { WorkScreens } from './WorkScreens';
import { StackConstellation } from './StackConstellation';
import { JourneyTrail } from './JourneyTrail';
import { ContactPortal } from './ContactPortal';

/** Advances the shared damped progress once per frame, before any chapter reads it. */
function ProgressTracker() {
  useFrame((state, delta) => stepTrack(delta, state.clock.elapsedTime), -1);
  return null;
}

/**
 * All per-chapter 3D content. Rendered inside the world scene (camera rig, fog, lights, post).
 * Each chapter suspends independently (textures / fonts), and hides itself when the camera is
 * far from its stretch of the path.
 */
export function Chapters() {
  return (
    <group name="chapters">
      <ProgressTracker />
      <Suspense fallback={null}>
        <WorkScreens />
      </Suspense>
      <Suspense fallback={null}>
        <StackConstellation />
      </Suspense>
      <Suspense fallback={null}>
        <JourneyTrail />
      </Suspense>
      <Suspense fallback={null}>
        <ContactPortal />
      </Suspense>
    </group>
  );
}
