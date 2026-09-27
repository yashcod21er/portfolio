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
    setResumeModalOpen,
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
      label: theme === 'dark' ? 'Switch to Studio Light Theme' : 'Switch to Studio Dark Theme',
      detail: 'Toggle workspace lighting theme',
      icon: theme === 'dark' ? <Sun className="w-4 h-4 text-[#F59E0B]" /> : <Moon className="w-4 h-4 text-[#2563EB]" />,
      action: toggleTheme,
    },
    // Navigation
    {
      id: 'nav-journey',
      category: 'NAVIGATION',
      label: 'Go to 04 // Journey & Trajectory',
      detail: 'The Road Here: Engineering progression & milestones',
      icon: <Compass className="w-4 h-4 text-[#2563EB]" />,
      action: () => {
        scrollToSection('journey');
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'nav-home',
      category: 'NAVIGATION',
      label: 'Go to Hero & Workstation',
      detail: 'Developer overview, callsign & 3D studio',
      icon: <Compass className="w-4 h-4 text-[#2563EB]" />,
      action: () => scrollToSection('home'),
    },
    {
      id: 'nav-about',
      category: 'NAVIGATION',
      label: 'Go to 01 // About',
      detail: 'Engineering background, AISSMS College of Engineering Pune',
      icon: <Layers className="w-4 h-4 text-[#2563EB]" />,
      action: () => scrollToSection('about'),
    },
    {
      id: 'nav-skills',
      category: 'NAVIGATION',
      label: 'Go to 02 // Stack',
      detail: 'Frontend, Backend, Database, Programming, Tools matrix',
      icon: <Sparkles className="w-4 h-4 text-[#2563EB]" />,
      action: () => scrollToSection('skills'),
    },
    {
      id: 'nav-projects',
      category: 'NAVIGATION',
      label: 'Go to 03 // Selected Work',
      detail: 'Full-stack case studies & verified production code',
      icon: <FolderGit2 className="w-4 h-4 text-[#2563EB]" />,
      action: () => scrollToSection('projects'),
    },
    {
      id: 'nav-journey',
      category: 'NAVIGATION',
      label: 'Go to 04 // Journey',
      detail: 'Computer Engineering academic & engineering milestones',
      icon: <Compass className="w-4 h-4 text-[#2563EB]" />,
      action: () => scrollToSection('journey'),
    },
    {
      id: 'nav-contact',
      category: 'NAVIGATION',
      label: 'Go to 05 // Contact',
      detail: 'Direct transmission channel & collaboration inquiries',
      icon: <ExternalLink className="w-4 h-4 text-[#2563EB]" />,
      action: () => scrollToSection('contact'),
    },
    // Projects
    ...projectsData.map((p) => ({
      id: `proj-${p.slug}`,
      category: 'PROJECTS' as const,
      label: p.title,
      detail: `${p.category} · ${p.status}`,
      icon: <FolderGit2 className="w-4 h-4 text-[#4F46E5]" />,
      action: () => openProjectModal(p.slug),
    })),
    // System Actions
    {
      id: 'sys-terminal',
      category: 'SYSTEM',
      label: 'Open Studio Terminal Shell',
      detail: 'Monospace CLI environment with system commands',
      icon: <Terminal className="w-4 h-4 text-[#10B981]" />,
      action: () => setTerminalOpen(true),
    },
    {
      id: 'sys-resume-modal',
      category: 'SYSTEM',
      label: 'View Resume & Credentials (Interactive)',
      detail: 'Preview Yash Hogade official resume document & verification',
      icon: <FileText className="w-4 h-4 text-[#2563EB]" />,
      action: () => setResumeModalOpen(true),
    },
    {
      id: 'sys-resume-dl',
      category: 'SYSTEM',
      label: 'Download Resume (PDF)',
      detail: portfolioConfig.resumePath,
      icon: <FileText className="w-4 h-4 text-[#F59E0B]" />,
      action: () => window.open(portfolioConfig.resumePath, '_blank'),
    },
    {
      id: 'sys-settings',
      category: 'SYSTEM',
      label: 'Open Graphics & Performance Settings',
      detail: 'Auto, High, Medium, Low, WebGL Off toggles',
      icon: <Sliders className="w-4 h-4 text-[#2563EB]" />,
      action: () => setSettingsModalOpen(true),
    },
    {
      id: 'sys-github',
      category: 'SYSTEM',
      label: 'Open GitHub Profile',
      detail: portfolioConfig.socials.github,
      icon: <ExternalLink className="w-4 h-4 text-[#646873]" />,
      action: () => window.open(portfolioConfig.socials.github, '_blank'),
    },
    {
      id: 'sys-linkedin',
      category: 'SYSTEM',
      label: 'Open LinkedIn Profile',
      detail: portfolioConfig.socials.linkedin,
      icon: <ExternalLink className="w-4 h-4 text-[#646873]" />,
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
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-[#111318]/40 backdrop-blur-md animate-in fade-in duration-150"
      onClick={() => setCommandPaletteOpen(false)}
    >
      <div
        ref={trapRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-2xl bg-[#FFFFFF] border border-[#DAD8D1] shadow-2xl overflow-hidden"
      >
        {/* Search Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#DAD8D1] bg-[#F6F5F0]">
          <Search className="w-5 h-5 text-[#2563EB]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search studio commands, projects, stack, links..."
            className="w-full bg-transparent border-none outline-none text-[#111318] placeholder-[#8E929D] text-sm font-sans"
            aria-autocomplete="list"
          />
          <kbd className="hidden sm:inline-flex px-2 py-0.5 rounded bg-[#FFFFFF] border border-[#DAD8D1] text-[10px] font-mono text-[#646873]">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[340px] overflow-y-auto p-2 divide-y divide-[#DAD8D1]/40 bg-[#FFFFFF]">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-[#8E929D]">
              No commands found matching "{query}"
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
                      ? 'bg-[#F6F5F0] border border-[#2563EB]'
                      : 'hover:bg-[#F6F5F0]/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        isSelected ? 'bg-[#FFFFFF] shadow-sm' : 'bg-[#F6F5F0]'
                      }`}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <div className="text-xs font-mono font-semibold text-[#111318]">
                        {item.label}
                      </div>
                      {item.detail && (
                        <div className="text-[11px] text-[#646873]">{item.detail}</div>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#F6F5F0] border border-[#DAD8D1] text-[#646873]">
                    {item.category}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#F6F5F0] border-t border-[#DAD8D1] text-[11px] font-mono text-[#646873]">
          <span>Use ↑ / ↓ to navigate</span>
          <span>ENTER to execute</span>
        </div>
      </div>
    </div>
  );
};
