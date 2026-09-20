import { createContext, useContext } from 'react';
import type { SectionId, QualityTier, ThemeMode } from '../types/portfolio';

export interface SystemContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;

  activeSection: SectionId;
  scrollToSection: (section: SectionId) => void;
  
  // Performance & 3D Tier
  qualityTier: QualityTier;
  effectiveTier: 'HIGH' | 'MEDIUM' | 'LOW' | 'OFF';
  setQualityTier: (tier: QualityTier) => void;
  fps: number;
  dpr: number;
  particleCount: number;
  enableRings: boolean;
  enableBloom: boolean;

  // Audio UI feedback
  audioEnabled: boolean;
  toggleAudio: () => void;
  triggerSound: (type: 'hover' | 'click' | 'modal' | 'command' | 'boot') => void;

  // Modals & Panels
  terminalOpen: boolean;
  setTerminalOpen: (open: boolean) => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  settingsModalOpen: boolean;
  setSettingsModalOpen: (open: boolean) => void;

  // Deep linked project modal
  activeProjectSlug: string | null;
  openProjectModal: (slug: string) => void;
  closeProjectModal: () => void;

  // Session stats
  sessionUptime: number;
}

export const SystemContext = createContext<SystemContextType | undefined>(undefined);

export const useSystem = () => {
  const context = useContext(SystemContext);
  if (!context) {
    throw new Error('useSystem must be used within a SystemProvider');
  }
  return context;
};
