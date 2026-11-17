import { useRef } from 'react';
import { gsap, SplitText, useGSAP } from '../../lib/gsap';
import { prefersReducedMotion } from '../../lib/smooth';
import { portfolioConfig } from '../../data/portfolioConfig';

const { role, subRole } = portfolioConfig;

/**
 * portfolioConfig.bio, first person, tightened — same facts.
 * Words scrub from 18% to full as the paragraph passes through the viewport.
 */
export default function Manifesto() {
  const root = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion() || !copy.current) return;

      const split = SplitText.create(copy.current, { type: 'words', tag: 'span' });
      gsap.from(split.words, {
        opacity: 0.18,
        ease: 'none',
        stagger: 0.12,
        duration: 0.6,
        scrollTrigger: {
          trigger: copy.current,
          start: 'top 78%',
          end: 'bottom 42%',
          scrub: true,
        },
      });

      gsap.from('[data-meta]', {
        y: 18,
        opacity: 0,
        duration: 1.1,
        stagger: 0.08,
        scrollTrigger: { trigger: '[data-meta]', start: 'top 92%', once: true },
      });
    },
    { scope: root },
  );

  const meta = [role, ...subRole.split('·').map((s) => s.trim())];

  return (
    <div ref={root} className="gutter mx-auto w-full max-w-[1600px]">
      <div className="grid gap-y-8 md:grid-cols-12 md:gap-x-8">
        <div className="md:col-span-3">
          <h2 id="about-title" className="label flex items-center gap-3 text-bone">
            <span aria-hidden className="block h-px w-8 bg-ochre" />
            About
          </h2>
        </div>

        <p ref={copy} className="ab-manifesto md:col-span-9">
          I’m Yash Hogade, a final-year Computer Engineering student at AISSMS COE (SPPU),{' '}
          <span className="serif-i">Pune.</span> I build{' '}
          <span className="serif-i">full-stack web applications</span> with React.js, Node.js,
          Express.js and MongoDB, turning ideas into{' '}
          <span className="serif-i">dependable digital products.</span>
        </p>

        <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-3 md:col-span-9 md:col-start-4 md:mt-8">
          {meta.map((m) => (
            <li key={m} data-meta className="label flex items-center gap-3">
              <span aria-hidden className="block size-1 rounded-full bg-mute" />
              {m}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
