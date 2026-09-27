import React, { useState, useEffect } from 'react';
import { portfolioConfig } from '../data/portfolioConfig';
import { GlassCard } from '../components/common/GlassCard';
import { useSystem } from '../context/SystemContext';
import {
  Mail,
  Send,
  FileText,
  Copy,
  Check,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  Clock,
  Compass,
  Stamp,
  Sparkles,
  Phone,
} from 'lucide-react';
import { GithubIcon, LinkedinIcon } from '../components/common/Icons';

export const ContactSection: React.FC = () => {
  const { triggerSound, setResumeModalOpen } = useSystem();
  const [copied, setCopied] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [puneTime, setPuneTime] = useState<string>('');

  // Live Pune Time clock (Asia/Kolkata, UTC+5:30)
  useEffect(() => {
    const updateTime = () => {
      try {
        const timeString = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }).format(new Date());
        setPuneTime(timeString);
      } catch {
        setPuneTime(new Date().toLocaleTimeString());
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(portfolioConfig.socials.email);
    setCopied(true);
    triggerSound('click');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyPhone = () => {
    if (portfolioConfig.socials.phone) {
      navigator.clipboard.writeText(portfolioConfig.socials.phone);
      setCopiedPhone(true);
      triggerSound('click');
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  const handleTypingKey = () => {
    triggerSound('thock');
  };

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!formData.name.trim()) errs.name = 'Please provide your name.';
    if (!formData.email.trim()) {
      errs.email = 'Please provide your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'Please provide a valid email address.';
    }
    if (!formData.message.trim()) errs.message = 'Please provide a brief message.';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      triggerSound('hover');
      return;
    }

    setIsSubmitting(true);
    triggerSound('click');

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setFormErrors({});
      triggerSound('victory');
    }, 800);
  };

  return (
    <section id="contact" className="relative min-h-screen py-20 sm:py-32 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto z-10">
      {/* Section Tag & Editorial Header */}
      <div className="mb-12 sm:mb-16">
        <div className="tech-tag text-[#2563EB] font-bold mb-3 sm:mb-4">
          05 // CONTACT &amp; DISPATCH
        </div>
        <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black font-display text-[#111318] tracking-tight leading-[1.04] break-words">
          LET'S BUILD
          <br />
          SOMETHING
          <br />
          USEFUL.
        </h2>
        <p className="text-sm sm:text-base text-[#646873] mt-3 sm:mt-4 max-w-xl">
          Have an engineering opportunity, project idea, or want to collaborate? Dispatch an airmail transmission from Pune or reach out directly.
        </p>
      </div>

      {/* Main Grid: Direct Channels + Airmail Postcard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Direct Communication Channels & University Terminal */}
        <div className="lg:col-span-5 space-y-4">
          {/* Direct Communication Channels */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Direct Email Card */}
            <GlassCard className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#F6F5F0] border border-[#DAD8D1] flex items-center justify-center text-[#2563EB] shadow-sm">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-[9px] font-mono text-[#8E929D] uppercase tracking-widest">
                      INQUIRY
                    </div>
                    <div className="text-xs font-mono font-bold text-[#111318]">
                      EMAIL
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCopyEmail}
                  className="p-1.5 rounded-full border border-[#DAD8D1] text-[#646873] hover:text-[#111318] hover:border-[#111318] transition-colors cursor-pointer"
                  title="Copy email address"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5 text-[#646873]" />}
                </button>
              </div>

              <a
                href={`mailto:${portfolioConfig.socials.email}`}
                className="text-xs font-mono text-[#2563EB] hover:underline block truncate font-semibold pt-1"
              >
                {portfolioConfig.socials.email}
              </a>
            </GlassCard>

            {/* Direct Phone Card */}
            <GlassCard className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#F6F5F0] border border-[#DAD8D1] flex items-center justify-center text-[#10B981] shadow-sm">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-[9px] font-mono text-[#8E929D] uppercase tracking-widest">
                      PHONE
                    </div>
                    <div className="text-xs font-mono font-bold text-[#111318]">
                      VOICE / WHATSAPP
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCopyPhone}
                  className="p-1.5 rounded-full border border-[#DAD8D1] text-[#646873] hover:text-[#111318] hover:border-[#111318] transition-colors cursor-pointer"
                  title="Copy phone number"
                >
                  {copiedPhone ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5 text-[#646873]" />}
                </button>
              </div>

              <a
                href={`tel:${portfolioConfig.socials.phone}`}
                className="text-xs font-mono text-[#111318] hover:text-[#2563EB] hover:underline block truncate font-semibold pt-1"
              >
                {portfolioConfig.socials.phone}
              </a>
            </GlassCard>
          </div>

          {/* Social Profiles Cards */}
          <div className="grid grid-cols-2 gap-4">
            <GlassCard className="p-5 space-y-2">
              <div className="flex items-center gap-2">
                <GithubIcon className="w-4 h-4 text-[#111318]" />
                <span className="text-xs font-mono font-bold text-[#111318]">GITHUB</span>
              </div>
              <p className="text-[11px] text-[#646873]">Code repositories &amp; experiments</p>
              <a
                href={portfolioConfig.socials.github}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-mono text-[#2563EB] hover:underline inline-flex items-center gap-1 font-semibold pt-1"
              >
                <span>View Repos</span>
                <ArrowUpRight className="w-3 h-3" />
              </a>
            </GlassCard>

            <GlassCard className="p-5 space-y-2">
              <div className="flex items-center gap-2">
                <LinkedinIcon className="w-4 h-4 text-[#2563EB]" />
                <span className="text-xs font-mono font-bold text-[#111318]">LINKEDIN</span>
              </div>
              <p className="text-[11px] text-[#646873]">Professional network &amp; background</p>
              <a
                href={portfolioConfig.socials.linkedin}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-mono text-[#2563EB] hover:underline inline-flex items-center gap-1 font-semibold pt-1"
              >
                <span>Connect</span>
                <ArrowUpRight className="w-3 h-3" />
              </a>
            </GlassCard>
          </div>

          {/* Resume Download Card */}
          <GlassCard className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#F6F5F0] border border-[#DAD8D1] flex items-center justify-center text-[#2563EB] shadow-sm">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-mono font-bold text-[#111318]">OFFICIAL RESUME</div>
                  <div className="text-[10px] text-[#8E929D] font-mono">PDF format · Verified SPPU credentials</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    triggerSound('modal');
                    setResumeModalOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-full bg-white border border-[#DAD8D1] text-[#111318] font-mono text-xs font-semibold tracking-wider hover:border-[#111318] hover:text-[#2563EB] transition-colors shadow-sm cursor-pointer"
                >
                  PREVIEW
                </button>

                <a
                  href={portfolioConfig.resumePath}
                  download="Yash_Hogade_Resume.pdf"
                  onClick={() => triggerSound('click')}
                  className="px-4 py-2 rounded-full bg-[#111318] text-white font-mono text-xs font-bold tracking-wider hover:bg-[#2563EB] transition-colors shadow-sm"
                >
                  DOWNLOAD
                </a>
              </div>
            </div>
          </GlassCard>

          {/* Geographic & University Terminal Telemetry */}
          <div className="p-5 rounded-2xl bg-white border border-[#DAD8D1] shadow-studio space-y-2.5 text-xs font-mono">
            <div className="flex items-center justify-between text-[#8E929D] border-b border-[#DAD8D1] pb-2">
              <span className="flex items-center gap-1.5 font-bold text-[#111318]">
                <Compass className="w-3.5 h-3.5 text-[#2563EB]" /> DISPATCH HUB
              </span>
              <span className="text-[10px]">MAHARASHTRA, IN</span>
            </div>

            <div className="space-y-1 text-[11px] text-[#646873]">
              <div className="flex justify-between">
                <span>College:</span>
                <span className="font-bold text-[#111318]">AISSMS COE Pune</span>
              </div>
              <div className="flex justify-between">
                <span>University:</span>
                <span className="font-bold text-[#111318]">Savitribai Phule Pune Univ</span>
              </div>
              <div className="flex justify-between">
                <span>Postal Code:</span>
                <span className="font-mono text-[#111318]">411001 (Pune G.P.O.)</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-[#DAD8D1]/60">
                <span className="flex items-center gap-1 text-[#2563EB] font-bold">
                  <Clock className="w-3 h-3" /> Live Pune Time:
                </span>
                <span className="font-mono font-bold text-[#111318] bg-[#F6F5F0] px-2 py-0.5 rounded border border-[#DAD8D1]">
                  {puneTime || '12:00:00 PM'} IST
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Authentic Tactile Airmail Postcard */}
        <div className="lg:col-span-7">
          <div className="relative rounded-3xl bg-[#FAF9F5] border-2 border-[#D4D0C5] p-6 sm:p-10 shadow-studio-lg overflow-hidden">
            {/* Airmail Top Chevron Border Strip */}
            <div
              className="absolute top-0 left-0 right-0 h-2.5 opacity-80"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(135deg, #EF4444 0px, #EF4444 14px, transparent 14px, transparent 20px, #2563EB 20px, #2563EB 34px, transparent 34px, transparent 40px)',
              }}
            />

            {/* Postcard Header: Cancellation Stamp & Postage Stamp */}
            <div className="flex items-start justify-between gap-4 pb-6 mb-6 border-b-2 border-dashed border-[#DAD8D1]">
              {/* Vintage Circular Postmark */}
              <div className="relative border-2 border-[#2563EB]/40 rounded-full w-24 h-24 p-2 flex flex-col items-center justify-center text-center -rotate-6 shrink-0 shadow-sm bg-white/70">
                <div className="text-[8px] font-mono font-black text-[#2563EB] tracking-tighter leading-none">
                  PUNE G.P.O.
                </div>
                <div className="text-[7px] font-mono text-[#646873] my-0.5">MAHARASHTRA</div>
                <div className="text-[8px] font-mono font-bold text-[#111318]">{puneTime ? puneTime.split(' ')[0] : 'IST'}</div>
                <div className="text-[7px] font-mono text-[#2563EB] font-bold">AIRMAIL 411001</div>
              </div>

              {/* Header Title */}
              <div className="flex-1 min-w-0 pl-2">
                <div className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-widest text-[#2563EB] bg-[#2563EB]/10 px-2.5 py-0.5 rounded-full mb-1">
                  <Stamp className="w-3 h-3" /> AIRMAIL POSTCARD
                </div>
                <h3 className="text-lg sm:text-xl font-black font-display text-[#111318] truncate">
                  POSTAL DISPATCH TO YASH HOGADE
                </h3>
                <p className="text-xs font-mono text-[#8E929D] truncate">
                  PAR AVION // SAVITRIBAI PHULE PUNE UNIVERSITY
                </p>
              </div>

              {/* Tactile Postage Stamp */}
              <div className="shrink-0 border-2 border-dashed border-[#EF4444] rounded-lg p-2 bg-white shadow-sm text-center w-18 rotate-3">
                <div className="text-[7px] font-mono font-black text-[#EF4444] tracking-wider uppercase">
                  INDIA POST
                </div>
                <div className="w-6 h-6 mx-auto my-1 rounded bg-[#EF4444]/10 flex items-center justify-center text-[#EF4444]">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="text-[9px] font-mono font-bold text-[#111318]">₹ 5.00</div>
              </div>
            </div>

            {/* Postcard Body: Form or Stamped Confirmation */}
            {isSubmitted ? (
              <div className="p-8 sm:p-12 rounded-2xl bg-white border border-[#DAD8D1] text-center space-y-4 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-[#10B981]/15 text-[#10B981] flex items-center justify-center mx-auto shadow-sm border border-[#10B981]/30">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="inline-block px-4 py-1 rounded-full border-2 border-[#10B981] text-[#10B981] font-mono font-bold text-xs uppercase tracking-widest -rotate-2">
                  AIRMAIL DISPATCHED &amp; RECORDED
                </div>
                <h4 className="text-xl font-bold font-display text-[#111318]">
                  Postcard Successfully Received!
                </h4>
                <p className="text-xs sm:text-sm text-[#646873] max-w-md mx-auto leading-relaxed">
                  Thank you for reaching out. Your transmission has been queued at Pune studio terminal. Yash will respond directly to your provided email address.
                </p>
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="px-5 py-2.5 rounded-full bg-[#111318] hover:bg-[#2563EB] text-white font-mono text-xs font-bold transition-colors cursor-pointer"
                >
                  DISPATCH ANOTHER POSTCARD ↗
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Sender Name */}
                  <div className="space-y-1.5">
                    <label htmlFor="card-name" className="block text-xs font-mono font-bold text-[#646873] uppercase">
                      FROM: SENDER NAME *
                    </label>
                    <input
                      id="card-name"
                      type="text"
                      value={formData.name}
                      onKeyDown={handleTypingKey}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Alex Morgan"
                      className={`w-full px-4 py-2.5 rounded-xl bg-white border text-base sm:text-xs font-mono text-[#111318] placeholder-[#8E929D] outline-none shadow-sm transition-colors ${
                        formErrors.name ? 'border-[#EF4444]' : 'border-[#DAD8D1] focus:border-[#2563EB]'
                      }`}
                    />
                    {formErrors.name && (
                      <span className="text-[10px] text-[#EF4444] font-mono flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {formErrors.name}
                      </span>
                    )}
                  </div>

                  {/* Sender Email */}
                  <div className="space-y-1.5">
                    <label htmlFor="card-email" className="block text-xs font-mono font-bold text-[#646873] uppercase">
                      RETURN ADDRESS: EMAIL *
                    </label>
                    <input
                      id="card-email"
                      type="email"
                      value={formData.email}
                      onKeyDown={handleTypingKey}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. alex@company.com"
                      className={`w-full px-4 py-2.5 rounded-xl bg-white border text-base sm:text-xs font-mono text-[#111318] placeholder-[#8E929D] outline-none shadow-sm transition-colors ${
                        formErrors.email ? 'border-[#EF4444]' : 'border-[#DAD8D1] focus:border-[#2563EB]'
                      }`}
                    />
                    {formErrors.email && (
                      <span className="text-[10px] text-[#EF4444] font-mono flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {formErrors.email}
                      </span>
                    )}
                  </div>
                </div>

                {/* Subject / Purpose */}
                <div className="space-y-1.5">
                  <label htmlFor="card-subject" className="block text-xs font-mono font-bold text-[#646873] uppercase">
                    POSTAL MEMO / SUBJECT
                  </label>
                  <input
                    id="card-subject"
                    type="text"
                    value={formData.subject}
                    onKeyDown={handleTypingKey}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g. Full-Stack Engineering Opportunity / Open Collaboration"
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#DAD8D1] focus:border-[#2563EB] text-base sm:text-xs font-mono text-[#111318] placeholder-[#8E929D] outline-none shadow-sm transition-colors"
                  />
                </div>

                {/* Handwritten Postcard Message Area */}
                <div className="space-y-1.5">
                  <label htmlFor="card-message" className="block text-xs font-mono font-bold text-[#646873] uppercase">
                    POSTCARD MESSAGE *
                  </label>
                  <textarea
                    id="card-message"
                    rows={5}
                    value={formData.message}
                    onKeyDown={handleTypingKey}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Write your transmission or project inquiry here... (Keypresses make mechanical typewriter thock sounds)"
                    className={`w-full px-4 py-3 rounded-xl bg-white border text-base sm:text-xs font-mono text-[#111318] placeholder-[#8E929D] outline-none shadow-sm transition-colors resize-none leading-relaxed ${
                      formErrors.message ? 'border-[#EF4444]' : 'border-[#DAD8D1] focus:border-[#2563EB]'
                    }`}
                  />
                  {formErrors.message && (
                    <span className="text-[10px] text-[#EF4444] font-mono flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {formErrors.message}
                    </span>
                  )}
                </div>

                {/* Dispatch Button */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                  <div className="text-[11px] font-mono text-[#8E929D]">
                    AIRMAIL DISPATCH · SOUND ON 🔊
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#111318] text-white font-mono text-xs font-bold tracking-widest hover:bg-[#2563EB] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-studio"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'DISPATCHING VIA PUNE G.P.O...' : 'DISPATCH AIRMAIL ↗'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Airmail Bottom Chevron Border Strip */}
            <div
              className="absolute bottom-0 left-0 right-0 h-2.5 opacity-80"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(135deg, #2563EB 0px, #2563EB 14px, transparent 14px, transparent 20px, #EF4444 20px, #EF4444 34px, transparent 34px, transparent 40px)',
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
