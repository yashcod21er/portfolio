import React, { useState } from 'react';
import { SystemProvider } from './context/SystemProvider';
import { useSystem } from './context/SystemContext';
import { useKeyboardShortcut } from './hooks/useKeyboardShortcut';
import { CustomCursor } from './components/common/CustomCursor';
import { SkipLink } from './components/common/SkipLink';
import { QualitySettingsModal } from './components/common/QualitySettingsModal';
import { CommandPalette } from './components/navigation/CommandPalette';
import { Navbar } from './components/navigation/Navbar';
import { TerminalModal } from './components/terminal/TerminalModal';
import { ProjectDetailModal } from './components/modals/ProjectDetailModal';
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
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    terminalOpen,
    setTerminalOpen,
    settingsModalOpen,
    setSettingsModalOpen,
    activeProjectSlug,
    closeProjectModal,
  } = useSystem();

  // Ctrl+K / Cmd+K hotkey for Command Palette
  useKeyboardShortcut('ctrl+k', () => {
    setCommandPaletteOpen(!commandPaletteOpen);
  });

  // Escape key handler to close active modal
  useKeyboardShortcut('escape', () => {
    if (activeProjectSlug) {
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
    <div className="relative min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] font-sans selection:bg-[var(--accent-cyan)]/30 selection:text-[var(--accent-cyan)] overflow-x-hidden transition-colors duration-300">
      {/* Cinematic Boot sequence on initial entry */}
      {!bootComplete && <LoadingScreen onComplete={() => setBootComplete(true)} />}

      {/* Accessible skip link */}
      <SkipLink />

      {/* Custom Desktop Cyber Cursor */}
      <CustomCursor />

      {/* 3D Cosmos & Workstation Canvas */}
      <SceneContainer />

      {/* Floating Pill Navigation */}
      <Navbar />

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
