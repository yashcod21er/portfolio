import React, { useState, useRef } from 'react';
import type { Project } from '../../types/portfolio';
import { useSystem } from '../../context/SystemContext';
import { ExternalLink, ArrowUpRight, Monitor, Smartphone, Calendar, ShieldAlert } from 'lucide-react';
import { GithubIcon } from '../common/Icons';

export const ProjectDeviceCard: React.FC<{ project: Project; isEven: boolean }> = ({
  project,
  isEven,
}) => {
  const { openProjectModal, triggerSound } = useSystem();
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [rotX, setRotX] = useState(0);
  const [rotY, setRotY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const isTouchDevice =
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0 || window.matchMedia('(hover: none)').matches);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isTouchDevice) return;
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    const degX = ((y - cy) / cy) * -8;
    const degY = ((x - cx) / cx) * 8;
    setRotX(degX);
    setRotY(degY);
  };

  return (
    <article
      className="group rounded-3xl bg-white border border-[#DAD8D1] shadow-studio hover:shadow-studio-lg hover:border-[#2563EB]/60 transition-all duration-300 overflow-hidden"
    >
      <div
        className={`grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center ${
          isEven ? '' : 'lg:flex-row-reverse'
        }`}
      >
        {/* Visual Device Preview Container */}
        <div
          className={`lg:col-span-7 bg-[#F6F5F0] border-b lg:border-b-0 ${
            isEven ? 'lg:border-r border-[#DAD8D1]' : 'lg:order-2 lg:border-l border-[#DAD8D1]'
          } p-6 sm:p-10 flex flex-col items-center justify-center min-h-[360px] sm:min-h-[460px] relative overflow-hidden`}
        >
          {/* Viewport Frame Switcher Control */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/90 backdrop-blur-md border border-[#DAD8D1] shadow-sm mb-6 z-20 self-end">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeviceMode('desktop');
                triggerSound('click');
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                deviceMode === 'desktop'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-[#646873] hover:text-[#111318]'
              }`}
            >
              <Monitor className="w-3 h-3" />
              <span>DESKTOP</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeviceMode('mobile');
                triggerSound('click');
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                deviceMode === 'mobile'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-[#646873] hover:text-[#111318]'
              }`}
            >
              <Smartphone className="w-3 h-3" />
              <span>MOBILE</span>
            </button>
          </div>

          {/* 3D Perspective Tilt Wrapper */}
          <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => {
              if (!isTouchDevice) setIsHovered(true);
            }}
            onMouseLeave={() => {
              setIsHovered(false);
              setRotX(0);
              setRotY(0);
            }}
            onClick={() => openProjectModal(project.slug)}
            style={{
              transform: isHovered
                ? `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.02, 1.02, 1.02)`
                : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
              transition: isHovered ? 'transform 0.08s ease-out' : 'transform 0.4s ease-out',
            }}
            className="relative cursor-pointer transition-all duration-300 w-full flex justify-center"
          >
            {deviceMode === 'desktop' ? (
              /* Desktop Safari / Chrome Window Frame */
              <div className="w-full rounded-2xl overflow-hidden border border-[#DAD8D1] bg-white shadow-2xl">
                {/* Browser Window Header */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-[#F6F5F0] border-b border-[#DAD8D1]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                  </div>
                  <div className="text-[10px] font-mono text-[#646873] bg-white px-4 py-0.5 rounded-md border border-[#DAD8D1]/80 max-w-[240px] truncate">
                    {project.demo && project.demo !== '#'
                      ? project.demo.replace(/^https?:\/\//, '')
                      : `https://${project.slug}.yash.dev`}
                  </div>
                  <div className="w-10" />
                </div>
                {/* Screen Preview */}
                <div className="relative overflow-hidden bg-white max-h-[320px]">
                  <img
                    src={project.image}
                    alt={project.title}
                    loading="lazy"
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            ) : (
              /* Mobile iPhone Frame */
              <div className="w-[240px] rounded-[36px] overflow-hidden border-4 border-[#1E293B] bg-[#0F172A] shadow-2xl p-2 relative">
                {/* Dynamic Island / Notch */}
                <div className="w-20 h-3.5 bg-black rounded-full mx-auto mb-1.5 z-20 relative" />
                {/* Screen Preview */}
                <div className="rounded-[28px] overflow-hidden bg-white max-h-[340px]">
                  <img
                    src={project.image}
                    alt={project.title}
                    loading="lazy"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Textual Narrative Details */}
        <div className={`lg:col-span-5 p-6 sm:p-10 space-y-6 ${isEven ? '' : 'lg:order-1'}`}>
          {/* Category & Status */}
          <div className="flex items-center gap-3">
            <span
              className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${
                project.status === 'COMPLETED'
                  ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/40'
                  : project.status === 'IN PROGRESS'
                  ? 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/40'
                  : 'bg-[#6366F1]/15 text-[#6366F1] border-[#6366F1]/40'
              }`}
            >
              {project.status}
            </span>
            <span className="text-xs font-mono text-[#8E929D] uppercase tracking-wider">
              {project.category}
            </span>
            <span className="text-xs font-mono text-[#8E929D] flex items-center gap-1 ml-auto">
              <Calendar className="w-3.5 h-3.5" />
              {project.timeline || 'FEATURED'}
            </span>
          </div>

          {/* Title & Tagline */}
          <div onClick={() => openProjectModal(project.slug)} className="cursor-pointer">
            <h3 className="text-2xl sm:text-3xl font-black font-display text-[#111318] group-hover:text-[#2563EB] transition-colors flex items-center gap-2">
              <span>{project.title}</span>
              <ArrowUpRight className="w-6 h-6 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-[#2563EB]" />
            </h3>
            <p className="text-sm font-semibold text-[#2563EB] mt-1 font-sans">
              {project.tagline}
            </p>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-[#646873] leading-relaxed font-sans">
            {project.description}
          </p>

          {/* Engineering Problem & Solution Snippet */}
          <div className="p-4 rounded-xl bg-[#F6F5F0] border border-[#DAD8D1] space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-mono font-bold text-[#EF4444]">
              <ShieldAlert className="w-3.5 h-3.5" /> Engineering Challenge:
            </div>
            <p className="text-[#646873] leading-relaxed">
              {project.problem}
            </p>
          </div>

          {/* Verified Implemented Features */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-mono font-bold text-[#8E929D] uppercase tracking-wider">
              VERIFIED ARCHITECTURE HIGHLIGHTS
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {project.features.slice(0, 4).map((feat, fIdx) => (
                <div key={fIdx} className="flex items-start gap-2 text-xs text-[#111318] font-sans">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] shrink-0 mt-1.5" />
                  <span className="line-clamp-1">{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tech Stack Pills */}
          <div className="flex flex-wrap gap-1.5 pt-2">
            {project.technologies.map((tech) => (
              <span
                key={tech}
                className="text-[10px] font-mono px-2.5 py-1 rounded-md bg-[#F6F5F0] border border-[#DAD8D1] text-[#111318]"
              >
                {tech}
              </span>
            ))}
          </div>

          {/* Action Links */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[#DAD8D1]">
            <button
              onClick={() => openProjectModal(project.slug)}
              className="px-4 py-2 rounded-xl bg-[#111318] hover:bg-[#2563EB] text-white font-mono text-xs font-bold transition-colors cursor-pointer"
            >
              EXPLORE CASE STUDY ↗
            </button>

            {project.github && project.github !== '#' && (
              <a
                href={project.github}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-2.5 rounded-xl border border-[#DAD8D1] text-[#646873] hover:text-[#111318] hover:border-[#111318] transition-colors cursor-pointer"
                title="View GitHub Repository"
              >
                <GithubIcon className="w-4 h-4" />
              </a>
            )}

            {project.demo && project.demo !== '#' && (
              <a
                href={project.demo}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-mono text-xs font-bold transition-all shadow-sm cursor-pointer"
                title="View Live Production Demo"
              >
                <span>LIVE DEMO</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};
