import React from 'react';
import { journeyData } from '../data/journeyData';
import { GlassCard } from '../components/common/GlassCard';
import { Compass, CheckCircle2, Clock, Sparkles } from 'lucide-react';

export const JourneySection: React.FC = () => {
  return (
    <section id="journey" className="relative min-h-screen py-24 px-4 sm:px-8 max-w-6xl mx-auto z-10">
      {/* Section Header */}
      <div className="mb-14">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[var(--accent-cyan)]/10 border border-[var(--accent-cyan)]/30 text-xs font-mono text-[var(--accent-cyan)] uppercase tracking-wider mb-3">
          <Compass className="w-3.5 h-3.5" />
          <span>ENGINEERING ROADMAP // 04</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black font-display text-[var(--text-primary)] tracking-tight text-glow-cyan">
          DEVELOPER JOURNEY
        </h2>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-space mt-2 max-w-2xl">
          Progression from academic foundations to full-stack application development and immersive web systems.
        </p>
      </div>

      {/* Futuristic Timeline Spine */}
      <div className="relative border-l-2 border-[var(--border-color)] ml-4 sm:ml-8 pl-6 sm:pl-10 space-y-12">
        {journeyData.map((milestone, idx) => {
          const isCurrent = milestone.status === 'CURRENT';
          const isFuture = milestone.status === 'FUTURE';

          return (
            <div key={milestone.id} className="relative group">
              {/* Timeline Node Marker */}
              <div
                className={`absolute -left-[35px] sm:-left-[51px] top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  isCurrent
                    ? 'bg-[var(--bg-card)] border-[var(--accent-cyan)] shadow-[0_0_15px_var(--accent-cyan)]'
                    : isFuture
                    ? 'bg-[var(--bg-card)] border-[var(--accent-violet)] shadow-[0_0_12px_var(--accent-violet)]'
                    : 'bg-[var(--bg-card)] border-[#10B981]'
                }`}
              >
                {isCurrent && <span className="w-2 h-2 rounded-full bg-[var(--accent-cyan)] animate-ping" />}
                {!isCurrent && !isFuture && <span className="w-2 h-2 rounded-full bg-[#10B981]" />}
                {isFuture && <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-violet)]" />}
              </div>

              {/* Milestone Card */}
              <GlassCard
                glowColor={isCurrent ? 'cyan' : isFuture ? 'violet' : 'none'}
                hasCornerBrackets
                className="p-6 transition-all duration-300 group-hover:border-[var(--accent-cyan)]/40"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-card)] text-[var(--accent-cyan)] border border-[var(--accent-cyan)]/30">
                      PHASE 0{idx + 1} · {milestone.phase}
                    </span>
                    <span className="text-xs font-mono text-[var(--text-muted)]">
                      {milestone.institutionOrScope}
                    </span>
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center gap-1.5">
                    {milestone.status === 'COMPLETED' && (
                      <span className="text-[10px] font-mono font-bold text-[#10B981] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> COMPLETED
                      </span>
                    )}
                    {milestone.status === 'CURRENT' && (
                      <span className="text-[10px] font-mono font-bold text-[var(--accent-cyan)] flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 animate-spin" /> ACTIVE FOCUS
                      </span>
                    )}
                    {milestone.status === 'FUTURE' && (
                      <span className="text-[10px] font-mono font-bold text-[var(--accent-violet)] flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> HORIZON
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-bold font-mono text-[var(--text-primary)] mb-2 group-hover:text-[var(--accent-cyan)] transition-colors">
                  {milestone.title}
                </h3>

                <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-sans leading-relaxed mb-4">
                  {milestone.description}
                </p>

                {/* Tech Pills */}
                <div className="flex flex-wrap gap-1.5">
                  {milestone.technologies.map((t, tIdx) => (
                    <span
                      key={tIdx}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-secondary)]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </GlassCard>
            </div>
          );
        })}
      </div>
    </section>
  );
};
