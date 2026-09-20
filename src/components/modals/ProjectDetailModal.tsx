import React, { useState } from 'react';
import { useSystem } from '../../context/SystemContext';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { projectsData } from '../../data/projectsData';
import {
  X,
  ExternalLink,
  Copy,
  Check,
  Cpu,
  Layers,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { GithubIcon } from '../common/Icons';

export const ProjectDetailModal: React.FC = () => {
  const { activeProjectSlug, closeProjectModal, triggerSound } = useSystem();
  const [copied, setCopied] = useState(false);

  const trapRef = useFocusTrap<HTMLDivElement>({
    isOpen: !!activeProjectSlug,
    onClose: closeProjectModal,
  });

  const project = projectsData.find((p) => p.slug === activeProjectSlug);

  if (!project) return null;

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('project', project.slug);
      navigator.clipboard.writeText(url.toString());
      setCopied(true);
      triggerSound('click');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={closeProjectModal}
    >
      <div
        ref={trapRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[92vh] rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-[0_0_80px_rgba(57,223,255,0.2)] flex flex-col overflow-hidden my-auto"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[var(--bg-elevated)] border-b border-[var(--border-color)]">
          <div className="flex items-center gap-3">
            <span
              className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${
                project.status === 'COMPLETED'
                  ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/40'
                  : 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/40'
              }`}
            >
              {project.status}
            </span>
            <span className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider">
              {project.category}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] hover:border-[var(--accent-cyan)]/40 transition-colors cursor-pointer"
              title="Copy shareable project link"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'COPIED LINK' : 'SHARE LINK'}</span>
            </button>

            <button
              onClick={closeProjectModal}
              className="p-1.5 rounded-lg border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent-cyan)]/50 transition-colors cursor-pointer"
              aria-label="Close project modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8">
          {/* Title & Tagline */}
          <div>
            <h2 id="project-modal-title" className="text-2xl sm:text-3xl font-black font-display text-[var(--text-primary)] tracking-wide">
              {project.title}
            </h2>
            <p className="text-sm sm:text-base text-[var(--accent-cyan)] font-space mt-1 font-semibold">
              {project.tagline}
            </p>
          </div>

          {/* Large Visual Preview */}
          {project.image && (
            <div className="rounded-xl overflow-hidden border border-[var(--border-color)] bg-[var(--bg-elevated)] shadow-2xl">
              <img
                src={project.image}
                alt={`${project.title} interface preview`}
                className="w-full h-auto object-cover max-h-[420px]"
                loading="lazy"
              />
            </div>
          )}

          {/* Overview Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold text-[var(--accent-violet)] uppercase tracking-widest flex items-center gap-2">
              <Layers className="w-4 h-4" /> About Project
            </h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed font-sans">
              {project.description}
            </p>
          </div>

          {/* Problem & Solution Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)]">
              <div className="text-xs font-mono font-bold text-[#EF4444] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> Engineering Challenge
              </div>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                {project.problem}
              </p>
            </div>

            <div className="p-5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)]">
              <div className="text-xs font-mono font-bold text-[#10B981] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Technical Solution
              </div>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                {project.solution}
              </p>
            </div>
          </div>

          {/* Features List (Honest only) */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold text-[var(--accent-cyan)] uppercase tracking-widest flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Verified Implemented Features
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {project.features.map((feat, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-xs sm:text-sm text-[var(--text-secondary)]"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-cyan)] shrink-0 mt-2" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Architecture Highlights */}
          {project.architectureHighlights && project.architectureHighlights.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-mono font-bold text-[var(--accent-violet)] uppercase tracking-widest flex items-center gap-2">
                <Cpu className="w-4 h-4" /> Technical Architecture
              </h3>
              <ul className="space-y-2">
                {project.architectureHighlights.map((arch, idx) => (
                  <li
                    key={idx}
                    className="text-xs sm:text-sm text-[var(--text-secondary)] font-mono flex items-center gap-2"
                  >
                    <span className="text-[var(--accent-violet)]">›</span> {arch}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tech Stack Pills */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase tracking-widest">
              Technology Stack
            </h3>
            <div className="flex flex-wrap gap-2">
              {project.technologies.map((tech) => (
                <span
                  key={tech}
                  className="px-3 py-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-xs font-mono text-[var(--accent-cyan)]"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer Links */}
        <div className="flex items-center justify-between p-6 bg-[var(--bg-elevated)] border-t border-[var(--border-color)]">
          <div className="text-xs font-mono text-[var(--text-muted)] hidden sm:block">
            SLUG: {project.slug}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {project.github && project.github !== '#' && (
              <a
                href={project.github}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-mono font-semibold text-[var(--text-primary)] hover:border-[var(--accent-cyan)]/50 hover:text-[var(--accent-cyan)] transition-colors"
              >
                <GithubIcon className="w-4 h-4" />
                <span>GITHUB REPO</span>
              </a>
            )}

            {project.demo && project.demo !== '#' ? (
              <a
                href={project.demo}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[var(--accent-cyan)] text-white dark:text-[#080B16] font-mono text-xs font-bold hover:opacity-90 shadow-[0_0_15px_rgba(57,223,255,0.4)] transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                <span>LIVE DEMO</span>
              </a>
            ) : (
              <span className="px-4 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-mono text-[var(--text-muted)]">
                LOCAL REPOSITORY
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
