import { create } from 'zustand';
import { chapterAt, type ChapterId } from './layout';

/**
 * World state shared by the 3D scene (reads it every frame via useWorld.getState(), no
 * re-renders) and the DOM overlay (subscribes with selectors).
 */
interface WorldState {
  /** overall scroll progress 0..1 (raw) */
  progress: number;
  /** current chapter (updated only when it changes) */
  chapter: ChapterId;
  chapterIndex: number;
  /** progress through the current chapter 0..1 */
  local: number;
  /** pointer in normalised device coords (-1..1, y up); 0,0 when no pointer */
  pointer: { x: number; y: number };
  /** true once the 3D scene has rendered its first frame */
  sceneReady: boolean;
  /** false when WebGL is unavailable or reduced motion is on: overlay shows a static fallback */
  webgl: boolean;
  setProgress: (p: number) => void;
  setPointer: (x: number, y: number) => void;
  setSceneReady: () => void;
  setWebgl: (on: boolean) => void;
}

export const useWorld = create<WorldState>((set, get) => ({
  progress: 0,
  chapter: 'intro',
  chapterIndex: 0,
  local: 0,
  pointer: { x: 0, y: 0 },
  sceneReady: false,
  webgl: true,
  setProgress: (p) => {
    const c = chapterAt(p);
    const s = get();
    if (c.id !== s.chapter) set({ progress: p, chapter: c.id, chapterIndex: c.index, local: c.local });
    else set({ progress: p, local: c.local });
  },
  setPointer: (x, y) => set({ pointer: { x, y } }),
  setSceneReady: () => set({ sceneReady: true }),
  setWebgl: (webgl) => set({ webgl }),
}));
