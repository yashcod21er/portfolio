import React, { useState } from 'react';
import { projectsData } from '../data/projectsData';
import { useSystem } from '../context/SystemContext';
import { ProjectDeviceCard } from '../components/projects/ProjectDeviceCard';

export const ProjectsSection: React.FC = () => {
  const { triggerSound } = useSystem();
  const [filter, setFilter] = useState<'ALL' | 'Full-Stack' | 'Frontend'>('ALL');

  const filteredProjects =
    filter === 'ALL'
      ? projectsData
      : projectsData.filter((p) => p.category === filter);

  return (
    <section id="projects" className="relative min-h-screen py-20 sm:py-32 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto z-10">
      {/* Section Tag & Editorial Header */}
      <div className="mb-12 sm:mb-16">
        <div className="tech-tag text-[#2563EB] font-bold mb-3 sm:mb-4">
          03 // SELECTED WORK
        </div>
        <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black font-display text-[#111318] tracking-tight leading-[1.04] break-words">
          PROJECTS I'VE BUILT.
        </h2>
        <p className="text-sm sm:text-base text-[#646873] mt-3 sm:mt-4 max-w-xl">
          Practical web systems, full-stack applications, and interactive frontend platforms. Click any case study to review technical implementation details.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-16">
        {(['ALL', 'Full-Stack', 'Frontend'] as const).map((tab) => {
          const isActive = filter === tab;
          return (
            <button
              key={tab}
              onClick={() => {
                setFilter(tab);
                triggerSound('click');
              }}
              className={`px-4 py-2 rounded-full text-xs font-mono tracking-wider transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#111318] text-white font-bold shadow-studio'
                  : 'bg-white border border-[#DAD8D1] text-[#646873] hover:text-[#111318] hover:border-[#111318]'
              }`}
            >
              {tab.toUpperCase()}
            </button>
          );
        })}
      </div>

      {/* Editorial Case Studies — Asymmetrical & Large Format */}
      <div className="space-y-20 sm:space-y-28">
        {filteredProjects.map((project, idx) => (
          <ProjectDeviceCard
            key={project.id}
            project={project}
            isEven={idx % 2 === 0}
          />
        ))}
      </div>
    </section>
  );
};
