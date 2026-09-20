import React, { useState } from 'react';
import { useSystem } from '../../context/SystemContext';
import { portfolioConfig } from '../../data/portfolioConfig';
import type { SectionId } from '../../types/portfolio';
import {
  Terminal,
  Sliders,
  Volume2,
  VolumeX,
  Menu,
  X,
  Search,
  Sun,
  Moon,
} from 'lucide-react';

const NAV_ITEMS: { id: SectionId; label: string }[] = [
  { id: 'home', label: 'HOME' },
  { id: 'about', label: 'ABOUT' },
  { id: 'skills', label: 'SKILLS' },
  { id: 'projects', label: 'PROJECTS' },
  { id: 'journey', label: 'JOURNEY' },
  { id: 'contact', label: 'CONTACT' },
];

export const Navbar: React.FC = () => {
  const {
    theme,
    toggleTheme,
    activeSection,
    scrollToSection,
    setTerminalOpen,
    setCommandPaletteOpen,
    setSettingsModalOpen,
    audioEnabled,
    toggleAudio,
    triggerSound,
    effectiveTier,
  } = useSystem();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (id: SectionId) => {
    scrollToSection(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 flex justify-center p-3 sm:p-5 pointer-events-none">
      <nav className="w-full max-w-6xl rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] backdrop-blur-xl px-4 py-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-center justify-between pointer-events-auto transition-all duration-300">
        {/* Brand / Logo */}
        <button
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-2.5 group cursor-pointer text-left"
          aria-label="YASH.OS Home"
        >
          <div className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] border border-[var(--accent-cyan)]/40 flex items-center justify-center text-[var(--accent-cyan)] font-mono font-black text-sm group-hover:shadow-[0_0_12px_var(--accent-cyan)] transition-shadow">
            Y
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-sm text-[var(--text-primary)] tracking-widest group-hover:text-[var(--accent-cyan)] transition-colors">
                {portfolioConfig.callsign}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
            </div>
            <div className="text-[10px] font-mono text-[var(--text-muted)] tracking-wider hidden sm:block">
              {portfolioConfig.systemVersion} · {theme.toUpperCase()}
            </div>
          </div>
        </button>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-elevated)]/60 border border-[var(--border-color)]">
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                onMouseEnter={() => triggerSound('hover')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold tracking-wider transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[var(--bg-card)] text-[var(--accent-cyan)] border border-[var(--accent-cyan)]/40 shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Right Tools & Controls */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] transition-colors cursor-pointer"
            title={theme === 'dark' ? 'Switch to Light Theme (Neural White)' : 'Switch to Dark Theme (Cyber Midnight)'}
            aria-label="Toggle Light / Dark theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-[#F59E0B]" />
            ) : (
              <Moon className="w-4 h-4 text-[#7C3AED]" />
            )}
          </button>

          {/* Command Palette Trigger */}
          <button
            onClick={() => {
              setCommandPaletteOpen(true);
              triggerSound('click');
            }}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent-cyan)]/40 text-xs font-mono transition-colors cursor-pointer"
            title="Command Center (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
            <span className="hidden lg:inline text-[11px]">CMD</span>
            <kbd className="text-[10px] px-1 rounded bg-[var(--bg-main)] text-[var(--text-muted)]">Ctrl+K</kbd>
          </button>

          {/* Terminal Launcher */}
          <button
            onClick={() => {
              setTerminalOpen(true);
              triggerSound('click');
            }}
            className="p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[#10B981] hover:border-[#10B981]/50 transition-colors cursor-pointer"
            title="Open Interactive Shell"
            aria-label="Open Interactive Shell"
          >
            <Terminal className="w-4 h-4" />
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleAudio}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${
              audioEnabled
                ? 'bg-[var(--accent-cyan)]/10 border-[var(--accent-cyan)]/50 text-[var(--accent-cyan)]'
                : 'bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
            title={audioEnabled ? 'Mute Procedural Audio' : 'Enable Procedural Audio'}
            aria-label={audioEnabled ? 'Mute Audio' : 'Enable Audio'}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Graphics Settings */}
          <button
            onClick={() => {
              setSettingsModalOpen(true);
              triggerSound('click');
            }}
            className="p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--accent-violet)] hover:border-[var(--accent-violet)]/50 transition-colors cursor-pointer"
            title={`Graphics Settings (Mode: ${effectiveTier})`}
            aria-label="Graphics and performance settings"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--accent-cyan)]/40 text-[var(--accent-cyan)] cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-4 top-20 p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] backdrop-blur-2xl shadow-2xl pointer-events-auto animate-in slide-in-from-top-4 duration-200">
          <div className="grid grid-cols-2 gap-2 mb-4">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`p-3 rounded-xl text-left font-mono text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[var(--bg-elevated)] text-[var(--accent-cyan)] border border-[var(--accent-cyan)]/40'
                      : 'bg-[var(--bg-main)]/60 text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[var(--border-color)] text-xs font-mono">
            <button
              onClick={() => {
                toggleTheme();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-1.5 text-[var(--accent-cyan)]"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-[#F59E0B]" /> : <Moon className="w-3.5 h-3.5 text-[#7C3AED]" />}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            <button
              onClick={() => {
                setTerminalOpen(true);
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-1.5 text-[#10B981]"
            >
              <Terminal className="w-3.5 h-3.5" /> Terminal
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
