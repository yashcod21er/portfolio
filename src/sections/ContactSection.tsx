import React, { useState } from 'react';
import { portfolioConfig } from '../data/portfolioConfig';
import { GlassCard } from '../components/common/GlassCard';
import { useSystem } from '../context/SystemContext';
import {
  Mail,
  Send,
  FileText,
  Copy,
  Check,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { GithubIcon, LinkedinIcon } from '../components/common/Icons';

export const ContactSection: React.FC = () => {
  const { triggerSound } = useSystem();
  const [emailCopied, setEmailCopied] = useState(false);

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
    setEmailCopied(true);
    triggerSound('click');
    setTimeout(() => setEmailCopied(false), 2000);
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
    triggerSound('command');

    // Simulate reliable submission confirmation (ready to connect to Formspree, EmailJS, or API)
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setFormErrors({});
      triggerSound('boot');
    }, 800);
  };

  return (
    <section id="contact" className="relative min-h-screen py-24 px-4 sm:px-8 max-w-6xl mx-auto z-10">
      {/* Section Header */}
      <div className="mb-14 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[var(--accent-cyan)]/10 border border-[var(--accent-cyan)]/30 text-xs font-mono text-[var(--accent-cyan)] uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>QUANTUM LINK // 05</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black font-display text-[var(--text-primary)] tracking-tight text-glow-cyan mb-4">
          LET'S BUILD SOMETHING GREAT.
        </h2>
        <p className="text-sm sm:text-base text-[var(--text-secondary)] font-space leading-relaxed">
          Have an opportunity, engineering project idea, or want to collaborate? Reach out directly or send a transmission through the portal.
        </p>
      </div>

      {/* Main Grid: Direct Channels & Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Direct Communication Channels */}
        <div className="lg:col-span-5 space-y-4">
          {/* Direct Email Card */}
          <GlassCard glowColor="cyan" className="p-6" hasCornerBrackets>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[var(--bg-elevated)] border border-[var(--accent-cyan)]/30 flex items-center justify-center text-[var(--accent-cyan)]">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase">DIRECT TRANSMISSION</div>
                  <div className="text-xs font-mono font-bold text-[var(--text-primary)]">ELECTRONIC MAIL</div>
                </div>
              </div>

              <button
                onClick={handleCopyEmail}
                className="p-2 rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] hover:border-[var(--accent-cyan)]/40 transition-colors cursor-pointer"
                title="Copy email address"
              >
                {emailCopied ? <Check className="w-4 h-4 text-[#10B981]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <a
              href={`mailto:${portfolioConfig.socials.email}`}
              className="text-sm font-mono text-[var(--accent-cyan)] hover:underline block break-all font-semibold"
            >
              {portfolioConfig.socials.email}
            </a>
          </GlassCard>

          {/* Social Profiles Grid */}
          <div className="grid grid-cols-2 gap-4">
            <GlassCard className="p-5">
              <div className="flex items-center gap-2.5 mb-2">
                <GithubIcon className="w-4 h-4 text-[var(--text-secondary)]" />
                <span className="text-xs font-mono font-bold text-[var(--text-primary)]">GITHUB</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mb-3">Code repositories &amp; open work</p>
              <a
                href={portfolioConfig.socials.github}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-mono text-[var(--accent-cyan)] hover:underline inline-flex items-center gap-1 font-semibold"
              >
                Explore Code ›
              </a>
            </GlassCard>

            <GlassCard className="p-5">
              <div className="flex items-center gap-2.5 mb-2">
                <LinkedinIcon className="w-4 h-4 text-[var(--accent-violet)]" />
                <span className="text-xs font-mono font-bold text-[var(--text-primary)]">LINKEDIN</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mb-3">Professional connections</p>
              <a
                href={portfolioConfig.socials.linkedin}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-mono text-[var(--accent-violet)] hover:underline inline-flex items-center gap-1 font-semibold"
              >
                Connect ›
              </a>
            </GlassCard>
          </div>

          {/* Resume Download CTA */}
          <GlassCard glowColor="violet" className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[var(--bg-elevated)] border border-[var(--accent-violet)]/30 flex items-center justify-center text-[var(--accent-violet)]">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-mono font-bold text-[var(--text-primary)]">CURRENT RESUME</div>
                  <div className="text-[10px] text-[var(--text-muted)]">PDF format · Engineering credentials</div>
                </div>
              </div>

              <a
                href={portfolioConfig.resumePath}
                download
                className="px-3 py-1.5 rounded-lg bg-[var(--accent-violet)] text-white font-mono text-xs font-bold hover:opacity-90 transition-opacity"
              >
                DOWNLOAD
              </a>
            </div>
          </GlassCard>
        </div>

        {/* Right Column: Contact Form */}
        <div className="lg:col-span-7">
          <GlassCard glowColor="cyan" className="p-6 sm:p-8" hasCornerBrackets>
            <h3 className="text-lg font-bold font-mono text-[var(--text-primary)] mb-2">
              SEND DIRECT MESSAGE
            </h3>
            <p className="text-xs text-[var(--text-muted)] mb-6">
              Enter your contact details below to send an inquiry directly to Yash Hogade.
            </p>

            {isSubmitted ? (
              <div className="p-6 rounded-xl bg-[#10B981]/10 border border-[#10B981]/40 text-center space-y-3 animate-in fade-in duration-200">
                <CheckCircle2 className="w-10 h-10 text-[#10B981] mx-auto" />
                <h4 className="text-base font-bold font-mono text-[var(--text-primary)]">
                  TRANSMISSION DISPATCHED
                </h4>
                <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
                  Thank you for reaching out. Your message has been recorded and Yash will reply promptly.
                </p>
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="px-4 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[#10B981]/40 text-[#10B981] font-mono text-xs font-bold hover:bg-[#10B981]/20 transition-colors cursor-pointer"
                >
                  SEND ANOTHER MESSAGE
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name field */}
                  <div>
                    <label htmlFor="contact-name" className="block text-xs font-mono text-[var(--text-secondary)] mb-1.5">
                      YOUR NAME *
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Alex Morgan"
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-elevated)] border text-xs font-sans text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors ${
                        formErrors.name ? 'border-[#EF4444]' : 'border-[var(--border-color)] focus:border-[var(--accent-cyan)]'
                      }`}
                    />
                    {formErrors.name && (
                      <span className="text-[10px] text-[#EF4444] font-mono mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {formErrors.name}
                      </span>
                    )}
                  </div>

                  {/* Email field */}
                  <div>
                    <label htmlFor="contact-email" className="block text-xs font-mono text-[var(--text-secondary)] mb-1.5">
                      EMAIL ADDRESS *
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. alex@example.com"
                      className={`w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-elevated)] border text-xs font-sans text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors ${
                        formErrors.email ? 'border-[#EF4444]' : 'border-[var(--border-color)] focus:border-[var(--accent-cyan)]'
                      }`}
                    />
                    {formErrors.email && (
                      <span className="text-[10px] text-[#EF4444] font-mono mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {formErrors.email}
                      </span>
                    )}
                  </div>
                </div>

                {/* Subject field */}
                <div>
                  <label htmlFor="contact-subject" className="block text-xs font-mono text-[var(--text-secondary)] mb-1.5">
                    SUBJECT
                  </label>
                  <input
                    id="contact-subject"
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g. Full-Stack Engineering Opportunity / Collaboration"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] focus:border-[var(--accent-cyan)] text-xs font-sans text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors"
                  />
                </div>

                {/* Message field */}
                <div>
                  <label htmlFor="contact-message" className="block text-xs font-mono text-[var(--text-secondary)] mb-1.5">
                    MESSAGE *
                  </label>
                  <textarea
                    id="contact-message"
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Describe your project, role, or inquiry..."
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-elevated)] border text-xs font-sans text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors resize-none ${
                      formErrors.message ? 'border-[#EF4444]' : 'border-[var(--border-color)] focus:border-[var(--accent-cyan)]'
                    }`}
                  />
                  {formErrors.message && (
                    <span className="text-[10px] text-[#EF4444] font-mono mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {formErrors.message}
                    </span>
                  )}
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[var(--accent-cyan)] text-white dark:text-[#080B16] font-mono text-xs font-bold tracking-wider hover:opacity-90 shadow-[0_0_20px_rgba(57,223,255,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'TRANSMITTING...' : 'SEND TRANSMISSION'}</span>
                </button>
              </form>
            )}
          </GlassCard>
        </div>
      </div>
    </section>
  );
};
