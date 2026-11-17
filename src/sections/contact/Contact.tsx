import { useRef } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { gsap, SplitText, useGSAP } from '../../lib/gsap';
import { prefersReducedMotion } from '../../lib/smooth';
import { portfolioConfig as cfg } from '../../data/portfolioConfig';
import { FlipText } from '../../vendor/vengeance/flip-text';
import SwellHeadline from './SwellHeadline';
import EmailBlock from './EmailBlock';
import MagneticPill from './MagneticPill';
import Footer from './Footer';

const LINKS = [
  { label: 'LinkedIn', href: cfg.socials.linkedin },
  { label: 'GitHub', href: cfg.socials.github },
  { label: 'Résumé', href: cfg.resumePath },
];

export default function Contact() {
  const ref = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

      gsap.from('[data-rule]', {
        scaleX: 0,
        transformOrigin: '0% 50%',
        duration: 1.4,
        ease: 'expo.inOut',
        scrollTrigger: { trigger: ref.current, start: 'top 85%', once: true },
      });
      gsap.from('[data-head-label]', {
        yPercent: 100,
        opacity: 0,
        stagger: 0.08,
        duration: 1,
        scrollTrigger: { trigger: ref.current, start: 'top 85%', once: true },
      });

      gsap.from(gsap.utils.toArray('[data-reveal]', ctaRef.current), {
        y: 28,
        opacity: 0,
        stagger: 0.08,
        duration: 1.2,
        scrollTrigger: { trigger: ctaRef.current, start: 'top 85%', once: true },
      });

      SplitText.create('[data-split]', {
        type: 'lines',
        mask: 'lines',
        autoSplit: true,
        onSplit: (self) =>
          gsap.from(self.lines, {
            yPercent: 110,
            stagger: 0.09,
            duration: 1.2,
            scrollTrigger: { trigger: self.lines[0]?.parentElement ?? ctaRef.current, start: 'top 88%', once: true },
          }),
      });
    },
    { scope: ref },
  );

  return (
    <section
      id="contact"
      ref={ref}
      aria-label="Contact"
      className="relative overflow-x-clip bg-ink pt-[clamp(7rem,16vw,14rem)] pb-[max(1rem,env(safe-area-inset-bottom))] text-bone"
    >
      <div className="gutter mx-auto max-w-[1600px]">
        {/* Section header */}
        <div data-rule className="h-px w-full bg-line" aria-hidden />
        <div className="flex items-center justify-between gap-6 overflow-hidden pt-5">
          <span data-head-label className="label flex items-center gap-2.5 text-bone">
            <span className="size-1.5 rounded-full bg-ochre" aria-hidden />
            Contact
          </span>
          <span data-head-label className="label hidden sm:block">
            {cfg.location}
          </span>
        </div>

        <div className="mt-[clamp(2.5rem,6vw,5.5rem)]">
          <SwellHeadline />
        </div>

        <div ref={ctaRef} className="mt-[clamp(3.5rem,9vw,8rem)] grid gap-14 md:grid-cols-12 md:gap-x-6">
          <div className="min-w-0 md:col-span-8">
            <EmailBlock />
          </div>

          <div className="flex flex-col justify-end gap-9 md:col-span-4">
            <div>
              <p className="label mb-4 flex items-center gap-2.5" data-reveal>
                <span className="relative flex size-1.5" aria-hidden>
                  <span className="absolute inset-0 animate-ping rounded-full bg-ochre opacity-60" />
                  <span className="relative size-1.5 rounded-full bg-ochre" />
                </span>
                <FlipText duration={5.5} delay={1.2}>
                  Availability
                </FlipText>
              </p>
              <p data-split className="max-w-[34ch] text-[clamp(1.05rem,1.3vw,1.25rem)] leading-[1.45] text-bone/85">
                Open to internships &amp; full-time roles · 2026–27 · based in Pune, open to remote
              </p>
            </div>

            <ul className="flex flex-wrap gap-2.5" data-reveal aria-label="Elsewhere">
              {LINKS.map((l) => (
                <li key={l.label}>
                  <MagneticPill href={l.href} ariaLabel={`${l.label} (opens in a new tab)`}>
                    <span className="inline-flex items-center gap-1.5">
                      {l.label}
                      <ArrowUpRight size={16} strokeWidth={1.6} aria-hidden />
                    </span>
                  </MagneticPill>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <Footer />
    </section>
  );
}
