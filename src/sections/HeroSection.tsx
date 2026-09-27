import React from 'react';
import { portfolioConfig } from '../data/portfolioConfig';
import { useSystem } from '../context/SystemContext';
import { ArrowDown, ArrowUpRight, FileText, Lamp, Radio, Gamepad2, Sparkles } from 'lucide-react';
import { GithubIcon, LinkedinIcon } from '../components/common/Icons';

export const HeroSection: React.FC = () => {
  const {
    scrollToSection,
    triggerSound,
    lampOn,
    toggleLamp,
    lofiPlaying,
    toggleLofi,
    setResumeModalOpen,
  } = useSystem();

  return (
    <section
      id="home"
      className="relative min-h-screen flex flex-col justify-between pt-12 sm:pt-16 pb-10 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto z-10 pointer-events-none"
    >
      {/* Top Editorial Micro-UI Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 pointer-events-auto border-b border-[#DAD8D1]/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          <span className="text-[10px] sm:text-[11px] font-mono tracking-widest text-[#111318] font-bold uppercase">
            PUNE, INDIA // AVAILABLE FOR ROLES
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-4 md:gap-6 text-[11px] font-mono tracking-widest text-[#646873] uppercase">
          <span>SPPU // AISSMS COE</span>
          <span>STACK // REACT 19 · NODE · THREE.JS</span>
          <span className="text-[#2563EB] font-bold">MODE // INTERACTIVE STUDIO</span>
        </div>
      </div>

      {/* Main Hero Composition — Editorial Left Column */}
      <div className="my-auto py-6 sm:py-12 max-w-2xl pointer-events-auto">
        <div className="p-5 sm:p-0 rounded-3xl bg-white/85 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none border border-[#DAD8D1]/70 sm:border-transparent shadow-studio sm:shadow-none mb-6">
          {/* Subtle category label */}
          <div className="tech-tag text-[#2563EB] font-bold mb-3 sm:mb-4">
            DIGITAL STUDIO // 2026
          </div>

          {/* Massive Editorial Name Heading */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black font-display text-[#111318] tracking-tight leading-[0.98] mb-4 sm:mb-6 break-words">
            YASH
            <br />
            HOGADE.
          </h1>

          {/* Role & Engineering Identity */}
          <div className="space-y-1 mb-4 sm:mb-6">
            <p className="text-sm sm:text-base font-mono font-bold tracking-wider text-[#111318] uppercase">
              {portfolioConfig.role}
            </p>
            <p className="text-xs sm:text-sm font-mono tracking-wider text-[#646873] uppercase">
              {portfolioConfig.subRole} · AISSMS COE PUNE
            </p>
          </div>

          {/* Supporting Copy */}
          <p className="text-sm sm:text-base md:text-lg text-[#646873] font-sans leading-relaxed mb-6 sm:mb-8 max-w-xl">
            {portfolioConfig.tagline}
          </p>

          {/* Primary & Secondary Call to Action Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-3.5">
            <button
              onClick={() => {
                triggerSound('click');
                scrollToSection('projects');
              }}
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#111318] text-white font-mono text-xs font-bold tracking-widest hover:bg-[#2563EB] transition-all cursor-pointer shadow-studio transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>VIEW SELECTED WORK</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                triggerSound('modal');
                setResumeModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white border border-[#DAD8D1] text-[#111318] font-mono text-xs font-semibold tracking-widest hover:border-[#111318] hover:text-[#2563EB] transition-all cursor-pointer shadow-studio transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <FileText className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>VIEW RESUME (PDF)</span>
            </button>
          </div>
        </div>

        {/* Interactive 3D Studio Gadget Shortcuts Chips */}
        <div className="p-3 rounded-2xl bg-white/80 backdrop-blur-md border border-[#DAD8D1] shadow-sm mb-8 space-y-2">
          <div className="text-[10px] font-mono font-bold text-[#8E929D] uppercase tracking-wider flex items-center gap-1.5 flex-wrap">
            <Sparkles className="w-3 h-3 text-[#2563EB]" />
            <span className="hidden sm:inline">3D STUDIO GADGET CONTROLS (CLICK OR PRESS HOTKEYS):</span>
            <span className="sm:hidden">3D STUDIO GADGETS:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={toggleLamp}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                lampOn
                  ? 'bg-[#FDE68A] text-[#92400E] font-bold border border-[#F59E0B]'
                  : 'bg-[#F6F5F0] text-[#646873] hover:text-[#111318]'
              }`}
            >
              <Lamp className="w-3 h-3" />
              <span>[L] Lamp: {lampOn ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={toggleLofi}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                lofiPlaying
                  ? 'bg-[#38BDF8]/20 text-[#0284C7] font-bold border border-[#38BDF8]'
                  : 'bg-[#F6F5F0] text-[#646873] hover:text-[#111318]'
              }`}
            >
              <Radio className="w-3 h-3" />
              <span>[M] Lo-Fi Tape: {lofiPlaying ? 'PLAYING' : 'MUTED'}</span>
            </button>

            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F6F5F0] text-xs font-mono text-[#646873]">
              <Gamepad2 className="w-3 h-3 text-[#2563EB]" />
              <span>Monitor: Playable Pong</span>
            </div>
          </div>
        </div>

        {/* Editorial Social Links */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-xs font-mono text-[#646873]">
          <span className="text-[#8E929D] uppercase tracking-wider">CONNECT —</span>
          {portfolioConfig.socials.github && (
            <a
              href={portfolioConfig.socials.github}
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#111318] transition-colors flex items-center gap-1"
            >
              <GithubIcon className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </a>
          )}
          <span className="hidden sm:inline">·</span>
          {portfolioConfig.socials.linkedin && (
            <a
              href={portfolioConfig.socials.linkedin}
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#2563EB] transition-colors flex items-center gap-1"
            >
              <LinkedinIcon className="w-3.5 h-3.5" />
              <span>LinkedIn</span>
            </a>
          )}
          <span className="hidden sm:inline">·</span>
          <a
            href={`mailto:${portfolioConfig.socials.email}`}
            className="hover:text-[#111318] transition-colors"
          >
            Email
          </a>
        </div>
      </div>

      {/* Bottom Editorial Context Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#DAD8D1]/60 pt-4 pointer-events-auto">
        <div className="text-[11px] font-mono text-[#8E929D] uppercase tracking-widest hidden sm:block">
          SAVITRIBAI PHULE PUNE UNIVERSITY · B.E. COMPUTER ENGINEERING
        </div>

        <button
          onClick={() => {
            triggerSound('click');
            scrollToSection('about');
          }}
          className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#646873] hover:text-[#111318] transition-colors cursor-pointer group ml-auto sm:ml-0"
          aria-label="Scroll to About section"
        >
          <span>SCROLL TO EXPLORE</span>
          <ArrowDown className="w-3.5 h-3.5 group-hover:translate-y-1 transition-transform" />
        </button>
      </div>
    </section>
  );
};
