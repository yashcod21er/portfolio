import React, { useState, useEffect, useRef } from 'react';
import { useSystem } from '../../context/SystemContext';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { portfolioConfig } from '../../data/portfolioConfig';
import { projectsData } from '../../data/projectsData';
import {
  Search,
  Terminal,
  FolderGit2,
  FileText,
  Sliders,
  ExternalLink,
  Layers,
  Sparkles,
  Compass,
  Sun,
  Moon,
} from 'lucide-react';

interface CommandItem {
  id: string;
  category: 'NAVIGATION' | 'PROJECTS' | 'SYSTEM';
  label: string;
  detail?: string;
  icon: React.ReactNode;
  action: () => void;
}

export const CommandPalette: React.FC = () => {
  const {
    theme,
    toggleTheme,
    commandPaletteOpen,
    setCommandPaletteOpen,
    scrollToSection,
    openProjectModal,
    setTerminalOpen,
    setSettingsModalOpen,
    triggerSound,
  } = useSystem();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const trapRef = useFocusTrap<HTMLDivElement>({
    isOpen: commandPaletteOpen,
    onClose: () => setCommandPaletteOpen(false),
  });

  // Command items catalog
  const commands: CommandItem[] = [
    // Theme toggle
    {
      id: 'sys-theme',
      category: 'SYSTEM',
      label: theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme',
      detail: 'Toggle between Neural White and Cyber Midnight',
      icon: theme === 'dark' ? <Sun className="w-4 h-4 text-[#F59E0B]" /> : <Moon className="w-4 h-4 text-[#7C3AED]" />,
      action: toggleTheme,
    },
    // Navigation
    {
      id: 'nav-home',
      category: 'NAVIGATION',
      label: 'Go to Home / Hero',
      detail: 'Developer overview & callsign',
      icon: <Compass className="w-4 h-4 text-[var(--accent-cyan)]" />,
      action: () => scrollToSection('home'),
    },
    {
      id: 'nav-about',
      category: 'NAVIGATION',
      label: 'Go to About Me',
      detail: 'Bio, AISSMS College of Engineering education',
      icon: <Layers className="w-4 h-4 text-[var(--accent-cyan)]" />,
      action: () => scrollToSection('about'),
    },
    {
      id: 'nav-skills',
      category: 'NAVIGATION',
      label: 'Go to Skills Orbit Matrix',
      detail: 'Frontend, Backend, Database, Programming, Tools',
      icon: <Sparkles className="w-4 h-4 text-[var(--accent-cyan)]" />,
      action: () => scrollToSection('skills'),
    },
    {
      id: 'nav-projects',
      category: 'NAVIGATION',
      label: 'Go to Projects Gallery',
      detail: 'Interactive showcases & live code',
      icon: <FolderGit2 className="w-4 h-4 text-[var(--accent-cyan)]" />,
      action: () => scrollToSection('projects'),
    },
    {
      id: 'nav-journey',
      category: 'NAVIGATION',
      label: 'Go to Developer Journey',
      detail: 'Computer Engineering milestones',
      icon: <Compass className="w-4 h-4 text-[var(--accent-cyan)]" />,
      action: () => scrollToSection('journey'),
    },
    {
      id: 'nav-contact',
      category: 'NAVIGATION',
      label: 'Go to Contact Portal',
      detail: 'Send message or collaborate',
      icon: <ExternalLink className="w-4 h-4 text-[var(--accent-cyan)]" />,
      action: () => scrollToSection('contact'),
    },
    // Projects
    ...projectsData.map((p) => ({
      id: `proj-${p.slug}`,
      category: 'PROJECTS' as const,
      label: p.title,
      detail: `${p.category} · ${p.status}`,
      icon: <FolderGit2 className="w-4 h-4 text-[var(--accent-violet)]" />,
      action: () => openProjectModal(p.slug),
    })),
    // System Actions
    {
      id: 'sys-terminal',
      category: 'SYSTEM',
      label: 'Launch YASH.OS Terminal',
      detail: 'Interactive CLI prompt',
      icon: <Terminal className="w-4 h-4 text-[#10B981]" />,
      action: () => setTerminalOpen(true),
    },
    {
      id: 'sys-resume',
      category: 'SYSTEM',
      label: 'Download Resume (PDF)',
      detail: portfolioConfig.resumePath,
      icon: <FileText className="w-4 h-4 text-[#F59E0B]" />,
      action: () => window.open(portfolioConfig.resumePath, '_blank'),
    },
    {
      id: 'sys-settings',
      category: 'SYSTEM',
      label: 'Open Graphics & Audio Settings',
      detail: 'Auto, High, Medium, Low, WebGL Off',
      icon: <Sliders className="w-4 h-4 text-[var(--accent-cyan)]" />,
      action: () => setSettingsModalOpen(true),
    },
    {
      id: 'sys-github',
      category: 'SYSTEM',
      label: 'Open GitHub Profile',
      detail: portfolioConfig.socials.github,
      icon: <ExternalLink className="w-4 h-4 text-[var(--text-muted)]" />,
      action: () => window.open(portfolioConfig.socials.github, '_blank'),
    },
    {
      id: 'sys-linkedin',
      category: 'SYSTEM',
      label: 'Open LinkedIn Profile',
      detail: portfolioConfig.socials.linkedin,
      icon: <ExternalLink className="w-4 h-4 text-[var(--text-muted)]" />,
      action: () => window.open(portfolioConfig.socials.linkedin, '_blank'),
    },
  ];

  const filtered = commands.filter((cmd) => {
    const s = `${cmd.label} ${cmd.detail || ''} ${cmd.category}`.toLowerCase();
    return s.includes(query.toLowerCase());
  });

  const handleQueryChange = (val: string) => {
    setQuery(val);
    setSelectedIndex(0);
  };

  useEffect(() => {
    if (commandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [commandPaletteOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
      triggerSound('hover');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
      triggerSound('hover');
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
        setCommandPaletteOpen(false);
      }
    }
  };

  if (!commandPaletteOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cmd-palette-title"
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={() => setCommandPaletteOpen(false)}
    >
      <div
        ref={trapRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-[0_15px_50px_rgba(0,0,0,0.2)] dark:shadow-[0_0_60px_rgba(57,223,255,0.25)] overflow-hidden"
      >
        {/* Search Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border-color)] bg-[var(--bg-elevated)]/60">
          <Search className="w-5 h-5 text-[var(--accent-cyan)]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search commands, theme, projects, skills, links..."
            className="w-full bg-transparent border-none outline-none text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm font-sans"
            aria-autocomplete="list"
          />
          <kbd className="hidden sm:inline-flex px-2 py-0.5 rounded bg-[var(--bg-main)] border border-[var(--border-color)] text-[10px] font-mono text-[var(--text-muted)]">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[340px] overflow-y-auto p-2 divide-y divide-[var(--border-color)]/50">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-[var(--text-muted)]">
              No system commands found matching "{query}"
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    item.action();
                    setCommandPaletteOpen(false);
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--bg-elevated)] border border-[var(--accent-cyan)]/40'
                      : 'hover:bg-[var(--bg-elevated)]/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        isSelected ? 'bg-[var(--bg-main)]' : 'bg-[var(--bg-elevated)]'
                      }`}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <div className="text-xs font-mono font-semibold text-[var(--text-primary)]">
                        {item.label}
                      </div>
                      {item.detail && (
                        <div className="text-[11px] text-[var(--text-muted)]">{item.detail}</div>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-muted)]">
                    {item.category}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-main)] border-t border-[var(--border-color)] text-[11px] font-mono text-[var(--text-muted)]">
          <span>Use ↑ / ↓ to navigate</span>
          <span>ENTER to select</span>
        </div>
      </div>
    </div>
  );
};
