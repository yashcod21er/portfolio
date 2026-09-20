import React, { useState } from 'react';
import { skillsData } from '../data/skillsData';
import { GlassCard } from '../components/common/GlassCard';
import { useSystem } from '../context/SystemContext';
import { Sparkles, Layers, Cpu, Database, Wrench, Code } from 'lucide-react';

export const SkillsSection: React.FC = () => {
  const { triggerSound } = useSystem();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categoryIcons: Record<string, React.ReactNode> = {
    frontend: <Layers className="w-4 h-4" />,
    backend: <Cpu className="w-4 h-4" />,
    database: <Database className="w-4 h-4" />,
    programming: <Code className="w-4 h-4" />,
    tools: <Wrench className="w-4 h-4" />,
  };

  const filteredCategories =
    selectedCategory === 'all'
      ? skillsData
      : skillsData.filter((cat) => cat.id === selectedCategory);

  return (
    <section id="skills" className="relative min-h-screen py-24 px-4 sm:px-8 max-w-6xl mx-auto z-10">
      {/* Section Header */}
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[var(--accent-violet)]/10 border border-[var(--accent-violet)]/30 text-xs font-mono text-[var(--accent-violet)] uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>TECHNICAL MATRIX // 02</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black font-display text-[var(--text-primary)] tracking-tight text-glow-violet">
          SKILLS &amp; TECHNOLOGIES
        </h2>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-space mt-2 max-w-2xl">
          Categorized technical stack based on verified academic training, system projects, and active development practice.
        </p>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 mb-10">
        <button
          onClick={() => {
            setSelectedCategory('all');
            triggerSound('click');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold tracking-wider transition-all cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-[var(--accent-cyan)] text-white dark:text-[#080B16] shadow-[0_0_15px_rgba(57,223,255,0.4)]'
              : 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-cyan)]/40'
          }`}
        >
          ALL DOMAINS
        </button>

        {skillsData.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                triggerSound('click');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold tracking-wider transition-all cursor-pointer ${
                isActive
                  ? 'bg-[var(--accent-violet)] text-white dark:text-[#080B16] shadow-[0_0_15px_rgba(155,123,255,0.4)]'
                  : 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-violet)]/40'
              }`}
            >
              {categoryIcons[cat.id]}
              <span>{cat.name.toUpperCase()}</span>
            </button>
          );
        })}
      </div>

      {/* Categorized Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.map((cat) => (
          <GlassCard
            key={cat.id}
            glowColor={cat.id === 'frontend' ? 'cyan' : 'violet'}
            className="p-6 flex flex-col justify-between"
            hasCornerBrackets
          >
            <div>
              {/* Category Header */}
              <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center border"
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      borderColor: `${cat.color}50`,
                      color: cat.color,
                    }}
                  >
                    {categoryIcons[cat.id]}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold font-mono text-[var(--text-primary)] tracking-wide">
                      {cat.name}
                    </h3>
                    <div className="text-[10px] font-mono text-[var(--text-muted)]">{cat.tag}</div>
                  </div>
                </div>
              </div>

              {/* Skills List in Category */}
              <div className="space-y-3">
                {cat.skills.map((skill, sIdx) => (
                  <div
                    key={sIdx}
                    className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] hover:border-[var(--accent-cyan)]/40 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-mono font-bold text-[var(--text-primary)]">
                        {skill.name}
                      </span>
                      <span className="text-[10px] font-mono text-[var(--text-muted)]">VERIFIED</span>
                    </div>

                    {skill.tags && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {skill.tags.map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Total items badge */}
            <div className="pt-4 mt-4 border-t border-[var(--border-color)] text-[10px] font-mono text-[var(--text-muted)] flex items-center justify-between">
              <span>DOMAIN STACK</span>
              <span>{cat.skills.length} TECHNOLOGIES</span>
            </div>
          </GlassCard>
        ))}
      </div>
    </section>
  );
};
