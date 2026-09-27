import React, { useState } from 'react';
import { portfolioConfig } from '../../data/portfolioConfig';
import { useSystem } from '../../context/SystemContext';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import {
  X,
  Download,
  ExternalLink,
  FileText,
  GraduationCap,
  Award,
  Copy,
  Check,
  Mail,
  Phone,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { GithubIcon, LinkedinIcon } from '../common/Icons';

export const ResumeModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { triggerSound } = useSystem();
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const trapRef = useFocusTrap<HTMLDivElement>({
    isOpen,
    onClose,
  });

  if (!isOpen) return null;

  const handleCopy = (text: string, type: 'email' | 'phone') => {
    navigator.clipboard.writeText(text);
    triggerSound('click');
    if (type === 'email') {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } else {
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="resume-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#111318]/60 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        ref={trapRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl max-h-[92vh] rounded-3xl bg-[#FFFFFF] border border-[#DAD8D1] shadow-2xl flex flex-col overflow-hidden my-auto"
      >
        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-[#F6F5F0] border-b border-[#DAD8D1]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#2563EB] text-white flex items-center justify-center shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="resume-modal-title"
                className="text-sm sm:text-base font-bold font-display text-[#111318] tracking-tight flex items-center gap-2"
              >
                <span>YASH HOGADE — OFFICIAL RESUME</span>
                <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] font-semibold border border-[#10B981]/30">
                  SPPU VERIFIED
                </span>
              </h2>
              <div className="text-[11px] font-mono text-[#646873]">
                Full-Stack Developer (MERN Stack) · Computer Engineering Graduate
              </div>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            <a
              href={portfolioConfig.resumePath}
              download="Yash_Hogade_Resume.pdf"
              onClick={() => triggerSound('click')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#111318] text-white text-xs font-mono font-bold hover:bg-[#2563EB] transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>DOWNLOAD PDF</span>
            </a>

            <a
              href={portfolioConfig.resumePath}
              target="_blank"
              rel="noreferrer"
              onClick={() => triggerSound('click')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#DAD8D1] text-[#111318] text-xs font-mono font-semibold hover:border-[#111318] transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>OPEN TAB</span>
            </a>

            <button
              onClick={() => {
                triggerSound('click');
                onClose();
              }}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#646873] hover:text-[#111318] hover:bg-[#EAE8E0] transition-colors ml-1 cursor-pointer"
              aria-label="Close resume modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-8 bg-[#FAFAF8]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Visual Document Preview Sheet */}
            <div className="lg:col-span-7 flex flex-col items-center">
              <div className="w-full relative group">
                <div className="text-[11px] font-mono text-[#8E929D] uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>DOCUMENT PREVIEW (PAGE 1)</span>
                  <a
                    href={portfolioConfig.resumePath}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#2563EB] hover:underline flex items-center gap-1 text-[11px]"
                  >
                    <span>Full Screen</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="rounded-2xl overflow-hidden border border-[#DAD8D1] bg-white shadow-xl transition-all duration-300 group-hover:border-[#2563EB]/60 group-hover:shadow-2xl">
                  {portfolioConfig.resumePreviewImage ? (
                    <img
                      src={portfolioConfig.resumePreviewImage}
                      alt="Yash Hogade Resume"
                      className="w-full h-auto object-contain select-none block"
                    />
                  ) : (
                    <div className="p-12 text-center text-sm font-mono text-[#646873]">
                      Resume document ready for download.
                    </div>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-[#8E929D] px-1">
                  <span>FORMAT: PDF / 58 KB</span>
                  <span>UPDATED: AUGUST 2026</span>
                </div>
              </div>
            </div>

            {/* Right Column: Structured Credentials & Verified Details */}
            <div className="lg:col-span-5 space-y-6">
              {/* Profile Summary Card */}
              <div className="p-5 rounded-2xl bg-white border border-[#DAD8D1] shadow-studio space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#2563EB] uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>CANDIDATE OVERVIEW</span>
                </div>
                <h3 className="text-xl font-bold font-display text-[#111318]">
                  {portfolioConfig.name}
                </h3>
                <div className="text-xs font-mono font-semibold text-[#111318]">
                  {portfolioConfig.role} | {portfolioConfig.subRole}
                </div>
                <p className="text-xs text-[#646873] leading-relaxed">
                  {portfolioConfig.bio}
                </p>
              </div>

              {/* Education Breakdown Card */}
              <div className="p-5 rounded-2xl bg-white border border-[#DAD8D1] shadow-studio space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#111318] uppercase tracking-wider">
                  <GraduationCap className="w-4 h-4 text-[#2563EB]" />
                  <span>ACADEMIC TIMELINE</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="border-l-2 border-[#2563EB] pl-3 py-0.5">
                    <div className="font-bold text-[#111318]">
                      {portfolioConfig.education.degree}
                    </div>
                    <div className="text-[11px] text-[#646873]">
                      {portfolioConfig.education.college}
                    </div>
                    <div className="text-[11px] font-mono text-[#2563EB] font-bold mt-0.5">
                      {portfolioConfig.education.university} · CGPA: {portfolioConfig.education.cgpa}
                    </div>
                  </div>

                  <div className="border-l-2 border-[#DAD8D1] pl-3 py-0.5 text-[#646873]">
                    <div className="font-semibold text-[#111318]">HSC — 74%</div>
                    <div className="text-[11px]">Abasaheb Vartak College</div>
                  </div>

                  <div className="border-l-2 border-[#DAD8D1] pl-3 py-0.5 text-[#646873]">
                    <div className="font-semibold text-[#111318]">SSC — 88%</div>
                    <div className="text-[11px]">M.G. Parulekar Mitramandal School</div>
                  </div>
                </div>
              </div>

              {/* Certification & Highlights */}
              <div className="p-5 rounded-2xl bg-white border border-[#DAD8D1] shadow-studio space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#10B981] uppercase tracking-wider">
                  <Award className="w-4 h-4 text-[#10B981]" />
                  <span>CERTIFICATIONS</span>
                </div>
                <div className="p-3 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0]">
                  <div className="text-xs font-bold text-[#166534]">
                    Microsoft Certified: Azure AI Fundamentals
                  </div>
                  <div className="text-[11px] font-mono text-[#15803D] mt-0.5">
                    Issued: Aug 2026 · Credential ID: w9Rn2-FahH
                  </div>
                </div>
              </div>

              {/* Direct Verified Contact Channels */}
              <div className="p-5 rounded-2xl bg-white border border-[#DAD8D1] shadow-studio space-y-3">
                <div className="text-xs font-mono font-bold text-[#8E929D] uppercase tracking-wider">
                  DIRECT CONTACT CHANNELS
                </div>

                <div className="space-y-2 text-xs font-mono">
                  {/* Email */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F6F5F0] border border-[#DAD8D1]/80">
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                      <span className="text-[#111318] truncate">{portfolioConfig.socials.email}</span>
                    </div>
                    <button
                      onClick={() => handleCopy(portfolioConfig.socials.email, 'email')}
                      className="px-2 py-1 rounded bg-white text-[10px] font-bold text-[#646873] hover:text-[#111318] border border-[#DAD8D1] transition-colors shrink-0 ml-2 cursor-pointer flex items-center gap-1"
                    >
                      {copiedEmail ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedEmail ? 'COPIED' : 'COPY'}</span>
                    </button>
                  </div>

                  {/* Phone */}
                  {portfolioConfig.socials.phone && (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F6F5F0] border border-[#DAD8D1]/80">
                      <div className="flex items-center gap-2 truncate">
                        <Phone className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                        <span className="text-[#111318]">{portfolioConfig.socials.phone}</span>
                      </div>
                      <button
                        onClick={() => handleCopy(portfolioConfig.socials.phone!, 'phone')}
                        className="px-2 py-1 rounded bg-white text-[10px] font-bold text-[#646873] hover:text-[#111318] border border-[#DAD8D1] transition-colors shrink-0 ml-2 cursor-pointer flex items-center gap-1"
                      >
                        {copiedPhone ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedPhone ? 'COPIED' : 'COPY'}</span>
                      </button>
                    </div>
                  )}

                  {/* Location */}
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#F6F5F0] text-[#646873]">
                    <MapPin className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
                    <span>{portfolioConfig.location}</span>
                  </div>
                </div>

                {/* Social Profiles */}
                <div className="flex items-center gap-2 pt-2">
                  <a
                    href={portfolioConfig.socials.github}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#111318] text-white text-xs font-mono font-bold hover:bg-[#2563EB] transition-colors"
                  >
                    <GithubIcon className="w-3.5 h-3.5" />
                    <span>GitHub</span>
                  </a>

                  <a
                    href={portfolioConfig.socials.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#0077B5] text-white text-xs font-mono font-bold hover:opacity-90 transition-opacity"
                  >
                    <LinkedinIcon className="w-3.5 h-3.5" />
                    <span>LinkedIn</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
