import React from 'react';
import { portfolioConfig } from '../data/portfolioConfig';
import { GlassCard } from '../components/common/GlassCard';
import { GraduationCap, Code2, Server, Cpu, Terminal, BookOpen } from 'lucide-react';

export const AboutSection: React.FC = () => {
  return (
    <section id="about" className="relative min-h-screen py-24 px-4 sm:px-8 max-w-6xl mx-auto z-10">
      {/* Section Header */}
      <div className="mb-14">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[var(--accent-cyan)]/10 border border-[var(--accent-cyan)]/30 text-xs font-mono text-[var(--accent-cyan)] uppercase tracking-wider mb-3">
          <Terminal className="w-3.5 h-3.5" />
          <span>DEVELOPER PROFILE // 01</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black font-display text-[var(--text-primary)] tracking-tight text-glow-cyan">
          ABOUT ME
        </h2>
      </div>

      {/* Main Grid: Bio Statement & Education Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Personal Narrative & Engineering Philosophy */}
        <div className="lg:col-span-7 space-y-6">
          <GlassCard glowColor="cyan" className="p-6 sm:p-8" hasCornerBrackets>
            <h3 className="text-lg font-bold font-mono text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Code2 className="w-5 h-5 text-[var(--accent-cyan)]" />
              ENGINEERING PERSPECTIVE
            </h3>
            <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed font-sans mb-4">
              {portfolioConfig.bio}
            </p>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed font-sans">
              My engineering approach centers around building performant, maintainable systems with clean component separation. Whether creating dynamic full-stack RESTful architectures with Node.js and Express or sculpting interactive user interfaces with React and Three.js, I strive for high reliability and thoughtful user experiences.
            </p>
          </GlassCard>

          {/* Pillars of Engineering Practice */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <GlassCard className="p-5">
              <div className="w-9 h-9 rounded-lg bg-[var(--bg-elevated)] border border-[var(--accent-cyan)]/30 flex items-center justify-center text-[var(--accent-cyan)] mb-3">
                <Server className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-mono font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1">
                Full-Stack Architecture
              </h4>
              <p className="text-xs text-[var(--text-muted)]">
                Constructing end-to-end applications with RESTful API endpoints, server-side dynamic rendering, and structured relational &amp; document databases.
              </p>
            </GlassCard>

            <GlassCard className="p-5">
              <div className="w-9 h-9 rounded-lg bg-[var(--bg-elevated)] border border-[var(--accent-violet)]/30 flex items-center justify-center text-[var(--accent-violet)] mb-3">
                <Cpu className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-mono font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1">
                Core Computing Foundations
              </h4>
              <p className="text-xs text-[var(--text-muted)]">
                Rooted in strong fundamental principles: Data Structures &amp; Algorithms, Object-Oriented design with C++, and systems analysis.
              </p>
            </GlassCard>
          </div>
        </div>

        {/* Right Column: Authentic Education Card */}
        <div className="lg:col-span-5">
          <GlassCard glowColor="violet" className="p-6 sm:p-8" hasCornerBrackets>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] border border-[var(--accent-violet)]/40 flex items-center justify-center text-[var(--accent-violet)]">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-[var(--accent-violet)] uppercase tracking-widest block">
                  ACADEMIC RECORD
                </span>
                <h3 className="text-base font-bold font-mono text-[var(--text-primary)]">
                  EDUCATION CREDENTIALS
                </h3>
              </div>
            </div>

            <div className="space-y-4 border-b border-[var(--border-color)] pb-6 mb-6">
              <div>
                <div className="text-xs font-mono text-[var(--text-muted)] uppercase">Degree Program</div>
                <div className="text-sm font-semibold text-[var(--text-primary)] mt-0.5">
                  {portfolioConfig.education.degree}
                </div>
              </div>

              <div>
                <div className="text-xs font-mono text-[var(--text-muted)] uppercase">Institution</div>
                <div className="text-sm font-semibold text-[var(--accent-cyan)] mt-0.5">
                  {portfolioConfig.education.college}
                </div>
                <div className="text-xs text-[var(--text-muted)] mt-0.5">
                  {portfolioConfig.education.city}, {portfolioConfig.education.state}
                </div>
              </div>

              <div>
                <div className="text-xs font-mono text-[var(--text-muted)] uppercase">Affiliated University</div>
                <div className="text-xs font-semibold text-[var(--text-secondary)] mt-0.5">
                  {portfolioConfig.education.university}
                </div>
              </div>

              <div>
                <div className="text-xs font-mono text-[var(--text-muted)] uppercase">Graduation Status</div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 font-mono text-xs font-semibold mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                  {portfolioConfig.education.status}
                </div>
              </div>
            </div>

            {/* Core Coursework Focus */}
            <div>
              <div className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
                Key Academic Focus Areas
              </div>
              <ul className="space-y-2">
                {portfolioConfig.education.focus.map((item, idx) => (
                  <li key={idx} className="text-xs font-mono text-[var(--text-secondary)] flex items-start gap-2">
                    <span className="text-[var(--accent-cyan)] mt-0.5">›</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </GlassCard>
        </div>
      </div>
    </section>
  );
};
