import React from 'react';
import { portfolioConfig } from '../data/portfolioConfig';
import { useSystem } from '../context/SystemContext';
import { formatSeconds } from '../utils/helpers';
import { ArrowUp, Mail, Cpu } from 'lucide-react';
import { GithubIcon, LinkedinIcon } from '../components/common/Icons';

export const Footer: React.FC = () => {
  const { scrollToSection, sessionUptime, effectiveTier, fps } = useSystem();

  return (
    <footer className="relative border-t border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-secondary)] py-12 px-4 sm:px-8 z-10 transition-colors">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand & Copyright */}
        <div className="text-center md:text-left space-y-1">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className="font-mono font-bold text-sm text-[var(--text-primary)] tracking-widest">
              {portfolioConfig.callsign}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-card)] text-[var(--accent-cyan)] border border-[var(--accent-cyan)]/30">
              {portfolioConfig.systemVersion}
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Designed &amp; Built with React, Three.js, React Three Fiber &amp; Tailwind CSS.
          </p>
          <p className="text-[11px] text-[var(--text-muted)]">
            © {portfolioConfig.copyrightYear} {portfolioConfig.name}. Savitribai Phule Pune University.
          </p>
        </div>

        {/* Real Session Telemetry */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] font-mono p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          <div className="flex items-center gap-1.5 text-[var(--accent-cyan)]">
            <Cpu className="w-3.5 h-3.5" />
            <span>MODE: {effectiveTier}</span>
          </div>
          <span className="text-[var(--border-color)]">|</span>
          <div className="text-[var(--text-secondary)]">
            FPS: <span className="text-[var(--text-primary)] font-bold">{fps}</span>
          </div>
          <span className="text-[var(--border-color)]">|</span>
          <div className="text-[var(--accent-violet)]">
            UPTIME: <span className="text-[var(--text-primary)] font-bold">{formatSeconds(sessionUptime)}</span>
          </div>
        </div>

        {/* Quick Links & Back to Top */}
        <div className="flex items-center gap-4">
          {portfolioConfig.socials.github && (
            <a
              href={portfolioConfig.socials.github}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-cyan)]/40 transition-colors"
              aria-label="GitHub Profile"
            >
              <GithubIcon className="w-4 h-4" />
            </a>
          )}
          {portfolioConfig.socials.linkedin && (
            <a
              href={portfolioConfig.socials.linkedin}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--accent-violet)] hover:border-[var(--accent-violet)]/40 transition-colors"
              aria-label="LinkedIn Profile"
            >
              <LinkedinIcon className="w-4 h-4" />
            </a>
          )}
          <a
            href={`mailto:${portfolioConfig.socials.email}`}
            className="p-2 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-color)]/60 transition-colors"
            aria-label="Email Yash Hogade"
          >
            <Mail className="w-4 h-4" />
          </a>

          <button
            onClick={() => scrollToSection('home')}
            className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--accent-cyan)]/30 text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/10 transition-colors cursor-pointer"
            title="Back to Top"
            aria-label="Back to Top"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </footer>
  );
};
