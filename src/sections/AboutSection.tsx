import React from 'react';
import { portfolioConfig } from '../data/portfolioConfig';
import { useSystem } from '../context/SystemContext';
import { GlassCard } from '../components/common/GlassCard';
import { HolographicIdCard } from '../components/about/HolographicIdCard';
import { BookOpen, Code2, Terminal, Flame, Compass, Award, FileText, ArrowUpRight } from 'lucide-react';

export const AboutSection: React.FC = () => {
  const { setResumeModalOpen, triggerSound } = useSystem();
  return (
    <section id="about" className="relative min-h-screen py-20 sm:py-32 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto z-10 space-y-12 sm:space-y-16">
      {/* Section Tag & Editorial Header */}
      <div>
        <div className="tech-tag text-[#2563EB] font-bold mb-3 sm:mb-4">
          01 // ABOUT
        </div>
        <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black font-display text-[#111318] tracking-tight leading-[1.04] max-w-4xl break-words">
          BUILDING THINGS
          <br />
          THAT FEEL
          <br />
          SIMPLE.
        </h2>
      </div>

      {/* Main Grid: Narrative & 3D Holographic ID Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Column: Personal Narrative & Philosophy */}
        <div className="lg:col-span-7 space-y-8">
          <div className="space-y-6 text-base sm:text-lg text-[#646873] leading-relaxed font-sans">
            <p className="text-[#111318] font-medium text-lg sm:text-xl leading-relaxed">
              {portfolioConfig.bio}
            </p>
            <p>
              I build full-stack web applications that are fast, reliable, and easy to use. From designing clean REST APIs and databases with Node.js and Express to crafting responsive user interfaces with React, I focus on turning ideas into working software.
            </p>
            <p>
              For me, great engineering is straightforward: write clean code, keep systems dependable, and build things people genuinely enjoy using.
            </p>
          </div>

          {/* Pillars of Engineering Bento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-6 rounded-2xl bg-white border border-[#DAD8D1] shadow-studio hover:border-[#2563EB] transition-colors">
              <Code2 className="w-5 h-5 text-[#2563EB] mb-3" />
              <h3 className="text-xs font-mono font-bold text-[#111318] uppercase tracking-wider mb-2">
                Full-Stack Development
              </h3>
              <p className="text-xs text-[#646873] leading-relaxed">
                Building complete web apps using React, Node.js, Express, and MongoDB—connecting solid backends to smooth interfaces.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#DAD8D1] shadow-studio hover:border-[#2563EB] transition-colors">
              <BookOpen className="w-5 h-5 text-[#2563EB] mb-3" />
              <h3 className="text-xs font-mono font-bold text-[#111318] uppercase tracking-wider mb-2">
                Computer Science Roots
              </h3>
              <p className="text-xs text-[#646873] leading-relaxed">
                Strong fundamentals in Data Structures, Algorithms, Object-Oriented Programming, and Database Systems from AISSMS COE.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#DAD8D1] shadow-studio hover:border-[#2563EB] transition-colors">
              <Terminal className="w-5 h-5 text-[#10B981] mb-3" />
              <h3 className="text-xs font-mono font-bold text-[#111318] uppercase tracking-wider mb-2">
                Clean &amp; Dependable
              </h3>
              <p className="text-xs text-[#646873] leading-relaxed">
                Writing clean, organized code with version control, thorough testing, and responsive designs that look sharp on any screen.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-[#DAD8D1] shadow-studio hover:border-[#2563EB] transition-colors">
              <Flame className="w-5 h-5 text-[#F59E0B] mb-3" />
              <h3 className="text-xs font-mono font-bold text-[#111318] uppercase tracking-wider mb-2">
                Always Curious
              </h3>
              <p className="text-xs text-[#646873] leading-relaxed">
                Constantly learning and building with modern tools, interactive 3D web features, and production-grade developer workflows.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive 3D Holographic ID Card & University Record */}
        <div className="lg:col-span-5 space-y-6">
          {/* 3D Holographic Student ID Card */}
          <div className="space-y-2">
            <div className="text-[10px] font-mono text-[#8E929D] uppercase tracking-widest text-center flex items-center justify-center gap-1.5">
              <Compass className="w-3 h-3 text-[#2563EB]" /> Hover &amp; Tilt 3D Hologram Badge
            </div>
            <HolographicIdCard />
          </div>

          {/* University Record Card */}
          <GlassCard className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#DAD8D1] pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#8E929D] uppercase tracking-widest block">
                  ACADEMIC CURRICULA
                </span>
                <span className="text-[11px] font-mono text-[#2563EB] font-bold">
                  SPPU CGPA: {portfolioConfig.education.cgpa}
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#10B981]/10 text-[#10B981] font-semibold border border-[#10B981]/30">
                ACTIVE
              </span>
            </div>

            <ul className="space-y-2">
              {portfolioConfig.education.focus.map((item, idx) => (
                <li key={idx} className="text-xs font-mono text-[#646873] flex items-start gap-2">
                  <span className="text-[#2563EB] font-bold">›</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </GlassCard>

          {/* Official Resume & Certification Card */}
          <GlassCard className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#DAD8D1] pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[#10B981]" />
                <span className="text-[10px] font-mono font-bold text-[#111318] uppercase tracking-widest">
                  CERTIFICATION
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#10B981] font-bold">
                MICROSOFT
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0]">
              <div className="text-xs font-bold text-[#166534]">
                Microsoft Certified: Azure AI Fundamentals
              </div>
              <div className="text-[10px] font-mono text-[#15803D] mt-0.5">
                Aug 2026 · Credential ID: w9Rn2-FahH
              </div>
            </div>

            <button
              onClick={() => {
                triggerSound('modal');
                setResumeModalOpen(true);
              }}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-[#111318] text-white font-mono text-xs font-bold tracking-wider hover:bg-[#2563EB] transition-colors cursor-pointer shadow-sm"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>VIEW FULL RESUME DOCUMENT</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </GlassCard>
        </div>
      </div>
    </section>
  );
};
