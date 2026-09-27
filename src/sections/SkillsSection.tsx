import React, { useState } from 'react';
import { skillsData } from '../data/skillsData';
import { GlassCard } from '../components/common/GlassCard';
import { TechSandbox } from '../components/skills/TechSandbox';
import { useSystem } from '../context/SystemContext';
import { Layers, Cpu, Database, Wrench, Code, LayoutGrid, Sparkles } from 'lucide-react';

export const SkillsSection: React.FC = () => {
  const { triggerSound } = useSystem();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeView, setActiveView] = useState<'sandbox' | 'matrix'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'matrix';
    }
    return 'sandbox';
  });

  const categoryIcons: Record<string, React.ReactNode> = {
    frontend: <Layers className="w-4 h-4" />,
    backend: <Cpu className="w-4 h-4" />,
    database: <Database className="w-4 h-4" />,
    programming: <Code className="w-4 h-4" />,
    tools: <Wrench className="w-4 h-4" />,
  };

  const filteredCategories =
    activeCategory === 'all'
      ? skillsData
      : skillsData.filter((cat) => cat.id === activeCategory);

  return (
    <section id="skills" className="relative min-h-screen py-20 sm:py-32 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto z-10 space-y-8 sm:space-y-10">
      {/* Section Tag & Editorial Heading */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="tech-tag text-[#2563EB] font-bold mb-3 sm:mb-4">
            02 // STACK
          </div>
          <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black font-display text-[#111318] tracking-tight leading-[1.04] break-words">
            TOOLS I BUILD WITH.
          </h2>
          <p className="text-sm sm:text-base text-[#646873] mt-3 sm:mt-4 max-w-xl">
            Core technical competencies across frontend client architecture, server runtimes, distributed databases, and computer engineering toolchains.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#FFFFFF] border border-[#DAD8D1] shadow-sm self-start md:self-auto">
          <button
            onClick={() => {
              setActiveView('sandbox');
              triggerSound('click');
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
              activeView === 'sandbox'
                ? 'bg-[#2563EB] text-white shadow-sm'
                : 'text-[#646873] hover:text-[#111318]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>PHYSICS SANDBOX</span>
          </button>

          <button
            onClick={() => {
              setActiveView('matrix');
              triggerSound('click');
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
              activeView === 'matrix'
                ? 'bg-[#2563EB] text-white shadow-sm'
                : 'text-[#646873] hover:text-[#111318]'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>MATRIX GRID</span>
          </button>
        </div>
      </div>

      {/* View 1: Interactive Physics Sandbox */}
      {activeView === 'sandbox' && (
        <div className="space-y-10 animate-in fade-in duration-200">
          <TechSandbox />
        </div>
      )}

      {/* Category Filter Pills (Shown for Matrix view or quick filter) */}
      <div className="flex flex-wrap items-center gap-2 pt-4">
        <button
          onClick={() => {
            setActiveCategory('all');
            triggerSound('click');
          }}
          className={`px-4 py-2 rounded-full text-xs font-mono tracking-wider transition-all cursor-pointer ${
            activeCategory === 'all'
              ? 'bg-[#111318] text-white font-bold shadow-studio'
              : 'bg-white border border-[#DAD8D1] text-[#646873] hover:text-[#111318] hover:border-[#111318]'
          }`}
        >
          ALL DOMAINS
        </button>

        {skillsData.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                triggerSound('click');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono tracking-wider transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#2563EB] text-white font-bold shadow-studio'
                  : 'bg-white border border-[#DAD8D1] text-[#646873] hover:text-[#111318] hover:border-[#111318]'
              }`}
            >
              {categoryIcons[cat.id]}
              <span>{cat.name.toUpperCase()}</span>
            </button>
          );
        })}
      </div>

      {/* Structured Editorial Technology Matrix Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.map((cat) => (
          <GlassCard
            key={cat.id}
            glowColor="blue"
            className="p-5 sm:p-7 flex flex-col justify-between"
          >
            <div>
              {/* Category Header */}
              <div className="flex items-center justify-between border-b border-[#DAD8D1] pb-4 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#F6F5F0] border border-[#DAD8D1] flex items-center justify-center text-[#2563EB]">
                    {categoryIcons[cat.id]}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold font-mono text-[#111318] tracking-wider">
                      {cat.name}
                    </h3>
                    <div className="text-[10px] font-mono text-[#8E929D]">{cat.tag}</div>
                  </div>
                </div>
              </div>

              {/* Technologies List in Category */}
              <div className="space-y-3">
                {cat.skills.map((skill, sIdx) => (
                  <div
                    key={sIdx}
                    className="p-3 rounded-xl bg-[#F6F5F0] border border-[#DAD8D1]/60 hover:border-[#2563EB] transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono font-bold text-[#111318]">
                        {skill.name}
                      </span>
                      <span className="text-[9px] font-mono text-[#8E929D] uppercase tracking-wider">
                        VERIFIED
                      </span>
                    </div>

                    {skill.tags && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {skill.tags.map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white border border-[#DAD8D1]/60 text-[#646873]"
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

            {/* Total items footer */}
            <div className="pt-4 mt-5 border-t border-[#DAD8D1] text-[10px] font-mono text-[#8E929D] flex items-center justify-between">
              <span>DOMAIN STACK</span>
              <span>{cat.skills.length} TECHNOLOGIES</span>
            </div>
          </GlassCard>
        ))}
      </div>
    </section>
  );
};
