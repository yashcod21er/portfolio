import React, { useState } from 'react';
import { projectsData } from '../data/projectsData';
import { GlassCard } from '../components/common/GlassCard';
import { useSystem } from '../context/SystemContext';
import {
  FolderGit2,
  ExternalLink,
  Maximize2,
  CheckCircle,
  Clock,
  Calendar,
} from 'lucide-react';
import { GithubIcon } from '../components/common/Icons';

export const ProjectsSection: React.FC = () => {
  const { openProjectModal, triggerSound } = useSystem();
  const [filter, setFilter] = useState<'ALL' | 'Full-Stack' | 'Frontend' | 'Systems & AI'>('ALL');

  const filteredProjects =
    filter === 'ALL'
      ? projectsData
      : projectsData.filter((p) => p.category === filter);

  return (
    <section id="projects" className="relative min-h-screen py-24 px-4 sm:px-8 max-w-6xl mx-auto z-10">
      {/* Section Header */}
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[var(--accent-cyan)]/10 border border-[var(--accent-cyan)]/30 text-xs font-mono text-[var(--accent-cyan)] uppercase tracking-wider mb-3">
          <FolderGit2 className="w-3.5 h-3.5" />
          <span>PORTFOLIO ARCHIVES // 03</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black font-display text-[var(--text-primary)] tracking-tight text-glow-cyan">
          FEATURED PROJECTS
        </h2>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-space mt-2 max-w-2xl">
          Practical web engineering builds and full-stack systems. Click any card to launch the technical deep-dive specification.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-10">
        {(['ALL', 'Full-Stack', 'Frontend', 'Systems & AI'] as const).map((tab) => {
          const isActive = filter === tab;
          return (
            <button
              key={tab}
              onClick={() => {
                setFilter(tab);
                triggerSound('click');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold tracking-wider transition-all cursor-pointer ${
                isActive
                  ? 'bg-[var(--accent-cyan)] text-white dark:text-[#080B16] shadow-[0_0_15px_rgba(57,223,255,0.4)]'
                  : 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-cyan)]/40'
              }`}
            >
              {tab.toUpperCase()}
            </button>
          );
        })}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filteredProjects.map((project) => (
          <GlassCard
            key={project.id}
            glowColor={project.status === 'COMPLETED' ? 'cyan' : 'violet'}
            hasCornerBrackets
            className="group flex flex-col justify-between overflow-hidden cursor-pointer"
            onClick={() => openProjectModal(project.slug)}
          >
            <div>
              {/* Visual Preview Banner */}
              <div className="relative w-full h-48 overflow-hidden bg-[var(--bg-elevated)] border-b border-[var(--border-color)]">
                {project.image ? (
                  <img
                    src={project.image}
                    alt={project.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-mono text-[var(--text-muted)]">
                    PREVIEW CONTAINER
                  </div>
                )}

                {/* Status Badge overlay */}
                <div className="absolute top-3 left-3">
                  <span
                    className={`inline-flex items-center gap-1.5 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full backdrop-blur-md border ${
                      project.status === 'COMPLETED'
                        ? 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/50'
                        : project.status === 'IN PROGRESS'
                        ? 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/50'
                        : 'bg-[#6366F1]/20 text-[#818CF8] border-[#818CF8]/50'
                    }`}
                  >
                    {project.status === 'COMPLETED' && <CheckCircle className="w-3 h-3" />}
                    {project.status === 'IN PROGRESS' && <Clock className="w-3 h-3" />}
                    {project.status === 'PLANNED' && <Calendar className="w-3 h-3" />}
                    <span>{project.status}</span>
                  </span>
                </div>

                {/* Category Pill overlay */}
                <div className="absolute top-3 right-3">
                  <span className="text-[10px] font-mono text-[var(--text-secondary)] px-2 py-1 rounded-md bg-[var(--bg-card)]/90 border border-[var(--border-color)] backdrop-blur-md">
                    {project.category}
                  </span>
                </div>
              </div>

              {/* Project Card Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold font-display text-[var(--text-primary)] group-hover:text-[var(--accent-cyan)] transition-colors mb-1 flex items-center justify-between">
                  <span>{project.title}</span>
                  <Maximize2 className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent-cyan)] transition-colors" />
                </h3>
                <p className="text-xs text-[var(--accent-cyan)] font-space mb-3 font-semibold">
                  {project.tagline}
                </p>
                <p className="text-xs text-[var(--text-secondary)] font-sans leading-relaxed line-clamp-3 mb-5">
                  {project.description}
                </p>

                {/* Technologies Stack Pills */}
                <div className="flex flex-wrap gap-1.5">
                  {project.technologies.slice(0, 5).map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[11px] font-mono text-[var(--text-secondary)]"
                    >
                      {tech}
                    </span>
                  ))}
                  {project.technologies.length > 5 && (
                    <span className="px-2 py-0.5 rounded bg-[var(--bg-card)] text-[10px] font-mono text-[var(--text-muted)]">
                      +{project.technologies.length - 5}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Card Action Bar */}
            <div
              className="px-6 py-4 bg-[var(--bg-elevated)] border-t border-[var(--border-color)] flex items-center justify-between"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => openProjectModal(project.slug)}
                className="text-xs font-mono font-bold text-[var(--accent-cyan)] hover:underline flex items-center gap-1.5 cursor-pointer"
              >
                <span>SPEC DETAILS</span>
                <span className="text-base leading-none">›</span>
              </button>

              <div className="flex items-center gap-3">
                {project.github && project.github !== '#' && (
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    title="View GitHub repository"
                  >
                    <GithubIcon className="w-4 h-4" />
                  </a>
                )}
                {project.demo && project.demo !== '#' && (
                  <a
                    href={project.demo}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--accent-cyan)] hover:text-[var(--text-primary)] transition-colors"
                    title="Open Live Preview"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </section>
  );
};
