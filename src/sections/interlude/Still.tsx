import { useSite } from '../../lib/store';
import { COORDS, PORTRAIT, STATEMENT, pad, projects, splitTitle } from './content';

/**
 * Reduced-motion Interlude: no pin, no scrub. The assembled portrait, the statement as static
 * display type, and a plain row of project thumbnails that open the case studies.
 */
export default function Still() {
  const setActiveProject = useSite((s) => s.setActiveProject);

  return (
    <div className="gutter mx-auto max-w-[1600px] py-[clamp(96px,14vw,200px)]">
      <div className="label flex flex-wrap justify-between gap-x-6 gap-y-1 border-t border-line pt-5 tabular-nums">
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-ochre" />
          Interlude
        </span>
        <span>Pune · {COORDS}</span>
      </div>

      <figure className="mx-auto mt-[clamp(32px,5vw,64px)] max-w-[1080px]">
        <img
          src={PORTRAIT.src}
          alt={PORTRAIT.alt}
          width={PORTRAIT.width}
          height={PORTRAIT.height}
          loading="lazy"
          decoding="async"
          className="aspect-[1448/1086] h-auto w-full object-cover"
        />
        <figcaption className="label mt-3">
          <span className="text-ochre">Fig. 01</span> — Yash Hogade
        </figcaption>
      </figure>

      <h2
        id="interlude-title"
        className="display mt-[clamp(80px,12vw,180px)] text-[clamp(3rem,11.5vw,12rem)] text-bone"
      >
        {STATEMENT.map((line) => (
          <span key={line.text} className={line.serif ? 'serif-i block pr-[0.08em] text-ochre' : 'block'}>
            {line.text}
          </span>
        ))}
      </h2>

      <ul className="mt-[clamp(64px,9vw,128px)] grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
        {projects.map((p, i) => (
          <li key={p.slug}>
            <button
              type="button"
              onClick={() => setActiveProject(p.slug)}
              aria-label={`Open case study: ${p.title}`}
              data-cursor="view"
              data-cursor-label="Open"
              className="group block w-full text-left"
            >
              <span className="block aspect-[16/10] overflow-hidden border border-line bg-ink-2">
                <img
                  src={p.image}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover object-top"
                />
              </span>
              <span className="label mt-3 flex items-baseline gap-2">
                <span className="text-ochre">{pad(i + 1)}</span>
                <span className="text-bone group-hover:text-ochre">{splitTitle(p.title).main}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
