import { create } from 'zustand';

interface SiteState {
  /** true once the preloader has finished; the hero intro waits on this */
  loaded: boolean;
  setLoaded: () => void;
  /** command palette / terminal open state */
  paletteOpen: boolean;
  setPaletteOpen: (open: boolean) => void;
  /** slug of the project whose case-study overlay is open, or null */
  activeProject: string | null;
  setActiveProject: (slug: string | null) => void;
}

export const useSite = create<SiteState>((set) => ({
  loaded: false,
  setLoaded: () => set({ loaded: true }),
  paletteOpen: false,
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
  activeProject: null,
  setActiveProject: (activeProject) => set({ activeProject }),
}));
