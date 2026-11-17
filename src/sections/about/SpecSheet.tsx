import { useRef, useState, type ReactNode } from 'react';
import { gsap, useGSAP } from '../../lib/gsap';
import { prefersReducedMotion } from '../../lib/smooth';
import { portfolioConfig } from '../../data/portfolioConfig';
import { ImageScatter } from '../../vendor/vengeance/image-scatter';
import Mask from './Mask';
import { revealRows, riseIn } from './motion';

const { education, certification } = portfolioConfig;

/** Portrait tile grid: 5 × 6 tiles on a 4:5 frame, so each tile is roughly square. */
const COLS = 5;
const ROWS = 6;
const TILES = COLS * ROWS;
const pad = (n: number) => String(n).padStart(2, '0');

const graduating = education.status.match(/Expected\s+\d{4}/i)?.[0] ?? education.status;
const [cgpaScore, cgpaScale] = (education.cgpa ?? '').split('/').map((s) => s.trim());

// "Microsoft Certified: Azure AI Fundamentals (Issued: Aug 2026 | ID: …)" → title + meta
const certMatch = certification?.match(/^(.*?)\s*\((.*)\)\s*$/);
const certTitle = certMatch?.[1] ?? certification;
const certMeta = certMatch?.[2]?.split('|').map((s) => s.trim());

// "74% · Abasaheb Vartak College" → score + school
const splitScore = (v?: string) => {
  const [score, ...rest] = (v ?? '').split('·').map((s) => s.trim());
  return { score, school: rest.join(' · ') };
};

interface Row {
  label: string;
  value: ReactNode;
}

const Score = ({ v }: { v?: string }) => {
  const { score, school } = splitScore(v);
  return (
    <>
      <span className="text-bone">{score}</span>
      {school && <span className="text-mute"> · {school}</span>}
    </>
  );
};

const rows: Row[] = [
  { label: 'Degree', value: education.degree },
  { label: 'College', value: `${education.college}, ${education.city}` },
  { label: 'University', value: education.university },
  {
    label: 'CGPA',
    value: (
      <span className="flex items-baseline gap-2">
        <span className="ab-num text-bone">{cgpaScore}</span>
        {cgpaScale && <span className="text-mute">/ {cgpaScale}</span>}
      </span>
    ),
  },
  { label: 'Graduating', value: graduating },
  {
    label: 'Location',
    value: (
      <>
        {education.city}, {education.state}
        <span className="mt-1.5 block font-mono text-[12px] tracking-[0.06em] text-mute">
          18.5204° N, 73.8567° E · IST (UTC+05:30)
        </span>
      </>
    ),
  },
  ...(certification
    ? [
        {
          label: 'Certification',
          value: (
            <>
              {certTitle}
              {certMeta && (
                <span className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[12px] tracking-[0.06em] text-mute">
                  {certMeta.map((m) => (
                    <span key={m}>{m}</span>
                  ))}
                </span>
              )}
            </>
          ),
        },
      ]
    : []),
  { label: 'HSC', value: <Score v={education.hsc} /> },
  { label: 'SSC', value: <Score v={education.ssc} /> },
  {
    label: 'Core coursework',
    value: (
      <ul className="grid gap-y-2 font-sans text-[15px] leading-snug tracking-normal text-bone/85 [font-variation-settings:normal] md:text-base">
        {education.focus.map((f) => (
          <li key={f} className="flex gap-3">
            <span aria-hidden className="mt-[0.6em] block size-1 shrink-0 bg-ochre" />
            {f}
          </li>
        ))}
      </ul>
    ),
  },
];

export default function SpecSheet() {
  const root = useRef<HTMLDivElement>(null);
  const figure = useRef<HTMLElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const [reduced] = useState(prefersReducedMotion);
  const [narrow] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);

  useGSAP(
    () => {
      if (prefersReducedMotion() || !root.current) return;
      const el = root.current;

      riseIn(el.querySelector('[data-heading]')!, 'top 85%');
      revealRows(gsap.utils.toArray<HTMLElement>('[data-row]', el));
    },
    { scope: root },
  );

  return (
    <div
      ref={root}
      aria-labelledby="about-facts"
      role="group"
      className="gutter mx-auto grid w-full max-w-[1600px] gap-y-14 md:grid-cols-12 md:gap-x-8"
    >
      <div className="md:col-span-4 lg:col-span-3">
        <div className="relative md:sticky md:top-28">
          <p className="label">Fact sheet</p>
          <h3
            id="about-facts"
            data-heading
            className="ab-h display mt-4 text-[clamp(56px,7.5vw,120px)] text-bone"
          >
            <Mask>
              On <span className="serif-i">paper</span>
            </Mask>
          </h3>

          <figure ref={figure} className="mt-10 w-[min(100%,420px)] md:mt-14">
            <ImageScatter
              src="/assets/yash-portrait.webp"
              alt="Yash Hogade in a white shirt and sunglasses against an ochre lime-washed wall"
              width={1448}
              height={1086}
              cols={COLS}
              rows={ROWS}
              objectPosition="50% 35%"
              className="ab-scatter aspect-[4/5] bg-ink-2"
              imgClassName="ab-scatter-img"
              trigger={() => root.current}
              start={() => `top+=${figure.current?.offsetTop ?? 0} 92%`}
              end={() => `top+=${figure.current?.offsetTop ?? 0} 28%`}
              spread={narrow ? 0.55 : 1}
              disabled={reduced}
              onAssemble={(p) => {
                if (counter.current) counter.current.textContent = pad(Math.round(p * TILES));
              }}
            />
            <figcaption className="label mt-3 flex flex-wrap justify-between gap-x-4 gap-y-1">
              <span>Pune, MH · IST +05:30</span>
              <span aria-hidden className="tabular-nums">
                Tiles <span ref={counter}>{pad(TILES)}</span>/{pad(TILES)}
              </span>
            </figcaption>
          </figure>
        </div>
      </div>

      <dl className="relative m-0 border-b border-line md:col-span-8 md:col-start-5">
        {rows.map((row) => (
          <div
            key={row.label}
            data-row
            className="relative grid gap-y-2 py-5 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] sm:gap-x-6 md:py-6"
          >
            <span data-line aria-hidden className="absolute inset-x-0 top-0 h-px bg-line" />
            <dt className="label pt-1.5">
              <Mask>{row.label}</Mask>
            </dt>
            <dd className="ab-val m-0 text-bone">
              <Mask>{row.value}</Mask>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
