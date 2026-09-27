import React, { useState } from 'react';
import { journeyStations } from '../data/journeyData';
import { GlassCard } from '../components/common/GlassCard';
import { useSystem } from '../context/SystemContext';
import {
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  GraduationCap,
  Terminal,
  Code2,
  Database,
  Layers,
  FolderGit2,
  Rocket,
} from 'lucide-react';

const STATION_ICONS: Record<string, React.ReactNode> = {
  origin: <Terminal className="w-4 h-4" />,
  aissms: <GraduationCap className="w-4 h-4" />,
  frontend: <Code2 className="w-4 h-4" />,
  javascript: <Code2 className="w-4 h-4" />,
  backend: <Layers className="w-4 h-4" />,
  database: <Database className="w-4 h-4" />,
  fullstack: <Layers className="w-4 h-4" />,
  projects: <FolderGit2 className="w-4 h-4" />,
  horizon: <Rocket className="w-4 h-4" />,
};

/**
 * YASH.DEV — THE ROAD HERE
 * Simple, elegant, accessible editorial journey timeline.
 * Clean milestones highlighting Yash Hogade's genuine trajectory at AISSMS COE, Pune.
 */
export const JourneySection: React.FC = () => {
  const { triggerSound, openProjectModal } = useSystem();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'academic' | 'dev'>('all');

  const filteredStations = journeyStations.filter((st) => {
    if (selectedCategory === 'academic') {
      return st.id === 'origin' || st.id === 'aissms';
    }
    if (selectedCategory === 'dev') {
      return st.id !== 'origin' && st.id !== 'aissms';
    }
    return true;
  });

  return (
    <section id="journey" className="relative min-h-screen py-20 sm:py-32 px-4 sm:px-6 md:px-12 max-w-6xl mx-auto z-10 font-sans">
      {/* Section Tag & Editorial Heading */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16">
        <div>
          <div className="tech-tag text-[#2563EB] font-bold mb-3 sm:mb-4">
            04 // JOURNEY &amp; TRAJECTORY
          </div>
          <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black font-display text-[#111318] tracking-tight leading-[1.04] break-words">
            THE ROAD HERE.
          </h2>
          <p className="text-sm sm:text-base text-[#646873] mt-3 sm:mt-4 max-w-2xl leading-relaxed">
            "Every project started as another stop." The engineering progression from computer science foundations at AISSMS College of Engineering, Pune to production systems, MVC architecture, and full-stack web applications.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/90 backdrop-blur-md border border-[#DAD8D1] shadow-sm shrink-0">
          <button
            onClick={() => {
              setSelectedCategory('all');
              triggerSound('click');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#111318] text-white shadow-sm'
                : 'text-[#646873] hover:text-[#111318]'
            }`}
          >
            ALL (09)
          </button>
          <button
            onClick={() => {
              setSelectedCategory('academic');
              triggerSound('click');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
              selectedCategory === 'academic'
                ? 'bg-[#111318] text-white shadow-sm'
                : 'text-[#646873] hover:text-[#111318]'
            }`}
          >
            ACADEMIC
          </button>
          <button
            onClick={() => {
              setSelectedCategory('dev');
              triggerSound('click');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
              selectedCategory === 'dev'
                ? 'bg-[#111318] text-white shadow-sm'
                : 'text-[#646873] hover:text-[#111318]'
            }`}
          >
            FULL-STACK DEV
          </button>
        </div>
      </div>

      {/* Clean Vertical Timeline Roadmap */}
      <div className="relative border-l-2 border-[#DAD8D1] ml-4 sm:ml-8 pl-8 sm:pl-12 space-y-12">
        {filteredStations.map((station) => {
          const isCompleted = station.status === 'COMPLETED';
          const isFuture = station.status === 'FUTURE';

          return (
            <div key={station.id} className="relative group">
              {/* Timeline Route Node Pin */}
              <div
                className={`absolute -left-[42px] sm:-left-[58px] top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all bg-white ${
                  isCompleted
                    ? 'border-[#2563EB] text-[#2563EB] shadow-sm'
                    : isFuture
                    ? 'border-[#38BDF8] text-[#38BDF8]'
                    : 'border-[#10B981] text-[#10B981]'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: station.accent }}
                />
              </div>

              {/* Milestone Card */}
              <GlassCard className="p-6 sm:p-8 space-y-5 hover:border-[#2563EB]/40 transition-all duration-300">
                {/* Header Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DAD8D1]/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-md"
                      style={{
                        backgroundColor: `${station.accent}15`,
                        color: station.accent,
                      }}
                    >
                      STOP {station.numberStr}
                    </span>
                    <span className="text-xs font-mono text-[#646873] uppercase tracking-wider flex items-center gap-1.5">
                      {STATION_ICONS[station.id] || <Layers className="w-3.5 h-3.5" />}
                      <span>{station.district}</span>
                    </span>
                  </div>

                  <div>
                    {isCompleted ? (
                      <span className="text-[11px] font-mono font-bold text-[#10B981] flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        COMPLETED
                      </span>
                    ) : isFuture ? (
                      <span className="text-[11px] font-mono font-bold text-[#38BDF8] flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" />
                        HORIZON
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono font-bold text-[#2563EB] flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        ACTIVE FOCUS
                      </span>
                    )}
                  </div>
                </div>

                {/* Title & Subtitle */}
                <div>
                  <h3 className="text-2xl sm:text-3xl font-black font-display text-[#111318] group-hover:text-[#2563EB] transition-colors">
                    {station.title}
                  </h3>
                  <div className="text-xs sm:text-sm font-semibold text-[#2563EB] mt-1">
                    {station.subtitle}
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-[#475569] leading-relaxed">
                  {station.description}
                </p>

                {/* Skills Tags */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[10px] font-mono text-[#94A3B8] uppercase tracking-wider">
                    Core Skills & Focus
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {station.skills.map((skill) => (
                      <span
                        key={skill}
                        className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-[#F4F1EA] text-[#334155] border border-[#E2DFD6]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Direct Project Links for Milestone 08 (Projects) */}
                {station.id === 'projects' && (
                  <div className="pt-4 border-t border-[#E2DFD6] space-y-2.5">
                    <div className="text-[11px] font-mono font-bold text-[#8B5CF6] uppercase tracking-wider">
                      Featured Production Applications (Click to inspect case study)
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                      {[
                        { name: 'UrbanStay (Airbnb)', slug: 'airbnb-clone', tech: 'Node · Express · EJS' },
                        { name: 'Spotify Clone', slug: 'spotify-clone', tech: 'HTML · CSS · JS' },
                        { name: 'Zerodha Clone', slug: 'zerodha-clone', tech: 'React · Node · Charts' },
                        { name: 'NexaAI Agent', slug: 'nexa-ai', tech: 'React · Node · AI APIs' },
                      ].map((p) => (
                        <button
                          key={p.slug}
                          onClick={() => {
                            triggerSound('modal');
                            openProjectModal(p.slug);
                          }}
                          className="flex items-center justify-between p-3 rounded-xl bg-[#1E222A] text-white hover:bg-[#2563EB] transition-colors text-left cursor-pointer group/btn"
                        >
                          <div>
                            <div className="text-xs font-bold font-mono">{p.name}</div>
                            <div className="text-[10px] text-gray-400 font-mono">{p.tech}</div>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover/btn:text-white transition-colors shrink-0 ml-2" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </GlassCard>
            </div>
          );
        })}
      </div>
    </section>
  );
};
