import React, { useState } from 'react';
import { SystemProvider } from './context/SystemProvider';
import { useSystem } from './context/SystemContext';
import { useKeyboardShortcut } from './hooks/useKeyboardShortcut';
import { useKonamiCode } from './hooks/useKonamiCode';
import { CustomCursor } from './components/common/CustomCursor';
import { SkipLink } from './components/common/SkipLink';
import { QualitySettingsModal } from './components/common/QualitySettingsModal';
import { CommandPalette } from './components/navigation/CommandPalette';
import { TerminalModal } from './components/terminal/TerminalModal';
import { ProjectDetailModal } from './components/modals/ProjectDetailModal';
import { ResumeModal } from './components/modals/ResumeModal';
import { EasterEggModal } from './components/common/EasterEggModal';
import { SceneContainer } from './components3d/SceneContainer';
import { LoadingScreen } from './sections/LoadingScreen';
import { HeroSection } from './sections/HeroSection';
import { AboutSection } from './sections/AboutSection';
import { SkillsSection } from './sections/SkillsSection';
import { ProjectsSection } from './sections/ProjectsSection';
import { JourneySection } from './sections/JourneySection';
import { ContactSection } from './sections/ContactSection';
import { Footer } from './sections/Footer';

const AppContent: React.FC = () => {
  const [bootComplete, setBootComplete] = useState(false);
  const [easterEggOpen, setEasterEggOpen] = useState(false);
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    terminalOpen,
    setTerminalOpen,
    settingsModalOpen,
    setSettingsModalOpen,
    resumeModalOpen,
    setResumeModalOpen,
    activeProjectSlug,
    closeProjectModal,
    toggleLamp,
    toggleLofi,
  } = useSystem();

  // Konami Code sequence listener (↑ ↑ ↓ ↓ ← → ← → B A)
  useKonamiCode(() => {
    setEasterEggOpen(true);
  });

  // Hotkey [L] for Desk Lamp Toggle
  useKeyboardShortcut('l', () => {
    toggleLamp();
  });

  // Hotkey [M] for Lo-Fi Tape Toggle
  useKeyboardShortcut('m', () => {
    toggleLofi();
  });

  // Ctrl+K / Cmd+K hotkey for Command Palette
  useKeyboardShortcut('ctrl+k', () => {
    setCommandPaletteOpen(!commandPaletteOpen);
  });

  // Escape key handler to close active modal
  useKeyboardShortcut('escape', () => {
    if (easterEggOpen) {
      setEasterEggOpen(false);
    } else if (resumeModalOpen) {
      setResumeModalOpen(false);
    } else if (activeProjectSlug) {
      closeProjectModal();
    } else if (commandPaletteOpen) {
      setCommandPaletteOpen(false);
    } else if (terminalOpen) {
      setTerminalOpen(false);
    } else if (settingsModalOpen) {
      setSettingsModalOpen(false);
    }
  });

  return (
    <div className="relative min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] font-sans selection:bg-[#2563EB]/20 selection:text-[#2563EB] overflow-x-hidden transition-colors duration-300">
      {/* Studio Preloader sequence on initial entry */}
      {!bootComplete && <LoadingScreen onComplete={() => setBootComplete(true)} />}

      {/* Accessible skip link */}
      <SkipLink />

      {/* Custom Minimal Desktop Cursor */}
      <CustomCursor />

      {/* 3D Procedural Studio Scene */}
      <SceneContainer />

      {/* Accessible Content Layer */}
      <main id="main-content" className="relative z-10">
        <HeroSection />
        <AboutSection />
        <SkillsSection />
        <ProjectsSection />
        <JourneySection />
        <ContactSection />
      </main>

      {/* System Footer */}
      <Footer />

      {/* Interactive Global Modals */}
      <CommandPalette />
      <TerminalModal />
      <QualitySettingsModal />
      <ProjectDetailModal />
      <ResumeModal isOpen={resumeModalOpen} onClose={() => setResumeModalOpen(false)} />
      <EasterEggModal isOpen={easterEggOpen} onClose={() => setEasterEggOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <SystemProvider>
      <AppContent />
    </SystemProvider>
  );
}
