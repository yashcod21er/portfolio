import React from 'react';
import { portfolioConfig } from '../data/portfolioConfig';
import { useSystem } from '../context/SystemContext';
import { ArrowUp } from 'lucide-react';
import { GithubIcon, LinkedinIcon } from '../components/common/Icons';

export const Footer: React.FC = () => {
  const { scrollToSection, triggerSound } = useSystem();

  return (
    <footer className="relative border-t border-[#DAD8D1] bg-[#F6F5F0] py-12 sm:py-16 px-4 sm:px-6 md:px-12 z-10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-end justify-between gap-10">
        {/* Large Name & Identity */}
        <div className="space-y-3">
          <div className="text-3xl sm:text-4xl font-black font-display text-[#111318] tracking-tight">
            YASH HOGADE
          </div>
          <p className="text-xs sm:text-sm font-mono text-[#646873] uppercase tracking-wider">
            {portfolioConfig.role} · {portfolioConfig.subRole}
          </p>
          <p className="text-xs text-[#8E929D] font-mono">
            AISSMS College of Engineering · Savitribai Phule Pune University
          </p>
        </div>

        {/* Links & Back to Top */}
        <div className="flex flex-col md:items-end gap-6 w-full md:w-auto">
          {/* Social Links */}
          <div className="flex items-center gap-5 text-xs font-mono">
            {portfolioConfig.socials.github && (
              <a
                href={portfolioConfig.socials.github}
                target="_blank"
                rel="noreferrer"
                className="text-[#646873] hover:text-[#111318] transition-colors flex items-center gap-1.5"
              >
                <GithubIcon className="w-3.5 h-3.5" />
                <span>GitHub</span>
              </a>
            )}
            {portfolioConfig.socials.linkedin && (
              <a
                href={portfolioConfig.socials.linkedin}
                target="_blank"
                rel="noreferrer"
                className="text-[#646873] hover:text-[#2563EB] transition-colors flex items-center gap-1.5"
              >
                <LinkedinIcon className="w-3.5 h-3.5" />
                <span>LinkedIn</span>
              </a>
            )}
            <a
              href={`mailto:${portfolioConfig.socials.email}`}
              className="text-[#646873] hover:text-[#111318] transition-colors"
            >
              Email
            </a>
            <a
              href={portfolioConfig.resumePath}
              download
              className="text-[#2563EB] font-bold hover:underline"
            >
              Resume
            </a>
          </div>

          {/* Copyright & Back to Top */}
          <div className="flex items-center justify-between md:justify-end gap-6 pt-4 border-t border-[#DAD8D1] w-full md:w-auto">
            <span className="text-[11px] font-mono text-[#8E929D]">
              © {portfolioConfig.copyrightYear} {portfolioConfig.name}. Built with React + Three.js.
            </span>

            <button
              onClick={() => {
                triggerSound('click');
                scrollToSection('home');
              }}
              className="p-2 rounded-full bg-white border border-[#DAD8D1] text-[#111318] hover:border-[#111318] transition-colors cursor-pointer shadow-sm"
              title="Back to Top"
              aria-label="Back to Top"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
