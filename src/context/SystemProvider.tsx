import React, { useState, useEffect, useCallback } from 'react';
import type { SectionId, ThemeMode, AppView } from '../types/portfolio';
import { useAdaptivePerformance } from '../hooks/useAdaptivePerformance';
import { useScrollSpy } from '../hooks/useScrollSpy';
import { projectsData } from '../data/projectsData';
import { playSound } from '../utils/sound';
import { startLofi, stopLofi } from '../utils/lofiAudio';
import { SystemContext } from './SystemContext';

export const SystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const performance = useAdaptivePerformance();
  const activeSection = useScrollSpy();
  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);

  // App Page View ('portfolio' | 'journey') with URL sync
  // App Page View ('portfolio')
  const [currentView, setCurrentView] = useState<AppView>('portfolio');

  const navigateToView = useCallback((view: AppView) => {
    setCurrentView(view);
    if (typeof window !== 'undefined') {
      window.history.pushState({ view }, '', '#');
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.toLowerCase();
    if (hash === '#journey') {
      const el = document.getElementById('journey');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, []);

  // Prefers-reduced-motion accessibility detection
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Theme state: 'dark' or 'light'
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('yash_os_theme') as ThemeMode | null;
      if (stored === 'dark' || stored === 'light') {
        return stored;
      }
    }
    return 'dark';
  });

  // Apply theme class to documentElement and persist
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (theme === 'light') {
        root.classList.remove('dark');
        root.classList.add('light');
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#F8FAFC');
      } else {
        root.classList.remove('light');
        root.classList.add('dark');
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#080B16');
      }
      localStorage.setItem('yash_os_theme', theme);
    }
  }, [theme]);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
    playSound('command', audioEnabled);
  }, [audioEnabled]);

  // Modals
  const [terminalOpen, setTerminalOpen] = useState<boolean>(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false);
  const [resumeModalOpen, setResumeModalOpen] = useState<boolean>(false);
  
  // Deep-linking URL inspection on initial render: ?project=slug
  const [activeProjectSlug, setActiveProjectSlug] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const projectParam = params.get('project');
      if (projectParam) {
        const found = projectsData.find((p) => p.slug === projectParam);
        if (found) return found.slug;
      }
    }
    return null;
  });

  // Honest Session Uptime counter (actual seconds elapsed in current session)
  const [sessionUptime, setSessionUptime] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSessionUptime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const openProjectModal = useCallback((slug: string) => {
    setActiveProjectSlug(slug);
    playSound('modal', audioEnabled);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('project', slug);
      window.history.pushState({}, '', url.toString());
    }
  }, [audioEnabled]);

  const closeProjectModal = useCallback(() => {
    setActiveProjectSlug(null);
    playSound('click', audioEnabled);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('project');
      window.history.pushState({}, '', url.toString());
    }
  }, [audioEnabled]);

  const scrollToSection = useCallback((section: SectionId) => {
    const el = document.getElementById(section);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      playSound('click', audioEnabled);
    }
  }, [audioEnabled]);

  // Interactive Studio Gadgets
  const [lampOn, setLampOn] = useState<boolean>(false);
  const [lofiPlaying, setLofiPlaying] = useState<boolean>(false);

  const toggleAudio = useCallback(() => {
    if (lofiPlaying) {
      stopLofi();
      setLofiPlaying(false);
    }
    setAudioEnabled((prev) => {
      const next = !prev;
      if (next) {
        playSound('boot', true);
      }
      return next;
    });
  }, [lofiPlaying]);

  const toggleLamp = useCallback(() => {
    setLampOn((prev) => !prev);
    playSound('lamp', audioEnabled);
  }, [audioEnabled]);

  const toggleLofi = useCallback(() => {
    setAudioEnabled(true);
    playSound('tape', true);
    setLofiPlaying((prev) => {
      const next = !prev;
      if (next) {
        startLofi();
      } else {
        stopLofi();
      }
      return next;
    });
  }, []);

  const triggerSound = useCallback((type: 'hover' | 'click' | 'modal' | 'command' | 'boot' | 'thock' | 'lamp' | 'sip' | 'tape' | 'victory') => {
    playSound(type, audioEnabled);
  }, [audioEnabled]);

  return (
    <SystemContext.Provider
      value={{
        currentView,
        navigateToView,

        theme,
        toggleTheme,
        setTheme,

        activeSection,
        scrollToSection,

        qualityTier: performance.tier,
        effectiveTier: performance.effectiveTier,
        setQualityTier: performance.setTier,
        fps: performance.fps,
        dpr: performance.dpr,
        particleCount: performance.particleCount,
        enableRings: performance.enableRings,
        enableBloom: performance.enableBloom,

        audioEnabled,
        toggleAudio,
        triggerSound,

        lampOn,
        toggleLamp,
        lofiPlaying,
        toggleLofi,

        terminalOpen,
        setTerminalOpen,
        commandPaletteOpen,
        setCommandPaletteOpen,
        settingsModalOpen,
        setSettingsModalOpen,
        resumeModalOpen,
        setResumeModalOpen,

        activeProjectSlug,
        openProjectModal,
        closeProjectModal,

        reducedMotion,
        sessionUptime,
      }}
    >
      {children}
    </SystemContext.Provider>
  );
};
