import React from 'react';
import { portfolioConfig } from '../data/portfolioConfig';
import { useSystem } from '../context/SystemContext';
import {
  ArrowDown,
  FileText,
  FolderGit2,
  MapPin,
  Terminal,
} from 'lucide-react';
import { GithubIcon, LinkedinIcon } from '../components/common/Icons';

export const HeroSection: React.FC = () => {
  const { scrollToSection, setTerminalOpen, triggerSound } = useSystem();

  return (
    <section
      id="home"
      className="relative min-h-screen flex flex-col justify-between pt-28 pb-12 px-4 sm:px-8 max-w-6xl mx-auto z-10 pointer-events-none"
    >
      {/* Top Status Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 pointer-events-auto">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] backdrop-blur-md shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[var(--accent-cyan)] animate-ping" />
          <span className="text-[11px] font-mono text-[var(--accent-cyan)] font-semibold tracking-wider">
            {portfolioConfig.callsign} // READY
          </span>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] backdrop-blur-md text-[11px] font-mono text-[var(--text-muted)] shadow-sm">
          <MapPin className="w-3.5 h-3.5 text-[var(--accent-violet)]" />
          <span>LOCATION: PUNE, INDIA</span>
        </div>
      </div>

      {/* Main Hero Typography & Callouts */}
      <div className="my-auto py-12 max-w-3xl pointer-events-auto">
        {/* Role badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[var(--accent-cyan)]/10 border border-[var(--accent-cyan)]/30 text-xs font-mono font-bold text-[var(--accent-cyan)] tracking-widest uppercase mb-6">
          <span>{portfolioConfig.role}</span>
          <span className="text-[var(--text-muted)]">·</span>
          <span className="text-[var(--accent-violet)]">{portfolioConfig.subRole}</span>
        </div>

        {/* Big Impactful Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black font-display text-[var(--text-primary)] tracking-tight leading-[1.08] mb-6 text-glow-cyan">
          {portfolioConfig.name.toUpperCase()}
        </h1>

        {/* Tagline / Description */}
        <p className="text-base sm:text-xl text-[var(--text-secondary)] font-space font-normal leading-relaxed mb-10 max-w-2xl">
          {portfolioConfig.tagline} Final-year undergraduate engineering student at AISSMS COE Pune, building end-to-end web architectures and immersive 3D digital environments.
        </p>

        {/* Primary CTA Action Row */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <button
            onClick={() => scrollToSection('projects')}
            className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-[var(--accent-cyan)] text-white dark:text-[#080B16] font-mono text-xs font-bold tracking-wider hover:opacity-90 shadow-md hover:shadow-lg transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <FolderGit2 className="w-4 h-4" />
            <span>EXPLORE PROJECTS</span>
          </button>

          <a
            href={portfolioConfig.resumePath}
            download
            onClick={() => triggerSound('click')}
            className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] font-mono text-xs font-semibold tracking-wider hover:border-[var(--accent-cyan)] transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 shadow-sm"
          >
            <FileText className="w-4 h-4 text-[var(--accent-cyan)]" />
            <span>DOWNLOAD RESUME</span>
          </a>

          <button
            onClick={() => {
              setTerminalOpen(true);
              triggerSound('click');
            }}
            className="flex items-center gap-2 px-4 py-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[#10B981] hover:border-[#10B981]/50 font-mono text-xs transition-colors cursor-pointer shadow-sm"
            title="Launch terminal shell"
          >
            <Terminal className="w-4 h-4 text-[#10B981]" />
            <span className="hidden sm:inline">CLI PROMPT</span>
          </button>
        </div>

        {/* Social Link Quick Row */}
        <div className="flex items-center gap-4 text-xs font-mono text-[var(--text-muted)]">
          <span className="text-[var(--text-muted)]">CONNECT:</span>
          {portfolioConfig.socials.github && (
            <a
              href={portfolioConfig.socials.github}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 hover:text-[var(--accent-cyan)] transition-colors"
            >
              <GithubIcon className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </a>
          )}
          {portfolioConfig.socials.linkedin && (
            <a
              href={portfolioConfig.socials.linkedin}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 hover:text-[var(--accent-violet)] transition-colors"
            >
              <LinkedinIcon className="w-3.5 h-3.5" />
              <span>LinkedIn</span>
            </a>
          )}
        </div>
      </div>

      {/* Scroll Down Indicator */}
      <div className="flex items-center justify-between border-t border-[var(--border-color)] pt-4 pointer-events-auto">
        <div className="text-[11px] font-mono text-[var(--text-muted)]">
          AISSMS COLLEGE OF ENGINEERING · SPPU
        </div>

        <button
          onClick={() => scrollToSection('about')}
          className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)] hover:text-[var(--accent-cyan)] transition-colors cursor-pointer group"
          aria-label="Scroll to About section"
        >
          <span>SCROLL DOWN</span>
          <ArrowDown className="w-3.5 h-3.5 text-[var(--accent-cyan)] group-hover:translate-y-1 transition-transform" />
        </button>
      </div>
    </section>
  );
};
