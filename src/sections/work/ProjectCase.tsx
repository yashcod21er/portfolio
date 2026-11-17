import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { AnimatePresence, motion, useReducedMotion, useScroll, type Variants } from 'motion/react';
import { X } from 'lucide-react';
import { useSite } from '../../lib/store';
import { lockScroll } from '../../lib/smooth';
import { sfx } from '../../lib/sound';
import CaseBody from './CaseBody';
import { EASE_QUART, pad, projects, writeProjectParam } from './projectUtils';
import './work.css';

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

export default function ProjectCase() {
  const activeProject = useSite((s) => s.activeProject);
  const setActiveProject = useSite((s) => s.setActiveProject);
  const reduced = useReducedMotion() ?? false;

  const index = projects.findIndex((p) => p.slug === activeProject);
  const project = index >= 0 ? projects[index] : null;
  const next = projects[(index + 1) % projects.length];
  const isOpen = project !== null;

  const dialogRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const openedSlugRef = useRef<string | null>(null);
  const wasOpenRef = useRef(false);
  const [switched, setSwitched] = useState(false);

  const close = useCallback(() => {
    sfx.whoosh();
    setActiveProject(null);
    setSwitched(false);
  }, [setActiveProject]);

  // Deep link: ?project=slug opens that case on first load.
  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get('project');
    if (slug && projects.some((p) => p.slug === slug)) setActiveProject(slug);
  }, [setActiveProject]);

  // Keep the URL in sync while open; strip the param once closed.
  useEffect(() => {
    if (project) {
      writeProjectParam(project.slug);
      wasOpenRef.current = true;
    } else if (wasOpenRef.current) {
      writeProjectParam(null);
      wasOpenRef.current = false;
    }
  }, [project]);

  // Remember which slug the dialog was opened with (fallback focus-return target).
  useEffect(() => {
    if (project && openedSlugRef.current === null) openedSlugRef.current = project.slug;
  }, [project]);

  // Open/close side effects: scroll lock, focus in, focus back.
  useEffect(() => {
    if (!isOpen) return;
    const active = document.activeElement;
    returnFocusRef.current = active instanceof HTMLElement && active !== document.body ? active : null;
    lockScroll(true);
    sfx.whoosh();
    const raf = requestAnimationFrame(() => dialogRef.current?.focus({ preventScroll: true }));

    return () => {
      cancelAnimationFrame(raf);
      lockScroll(false);
      const slug = openedSlugRef.current;
      openedSlugRef.current = null;
      let target = returnFocusRef.current;
      if (!target || !target.isConnected) {
        target = slug ? document.querySelector<HTMLElement>(`[data-project-link="${slug}"]`) : null;
      }
      target?.focus({ preventScroll: true });
      returnFocusRef.current = null;
    };
  }, [isOpen]);

  // Esc closes; Tab is trapped inside the dialog.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== 'Tab') return;
      const root = dialogRef.current;
      if (!root) return;
      const items = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.getClientRects().length > 0,
      );
      if (!items.length) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement;
      if (!root.contains(current)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && (current === first || current === root)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && current === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, close]);

  const goNext = () => {
    sfx.whoosh();
    setSwitched(true);
    setActiveProject(next.slug);
  };

  const onBodySwapped = () => {
    scrollRef.current?.scrollTo({ top: 0 });
    dialogRef.current?.focus({ preventScroll: true });
  };

  const wipe = (layer: 0 | 1): Variants => ({
    closed: { clipPath: 'inset(100% 0% 0% 0%)' },
    open: {
      clipPath: 'inset(0% 0% 0% 0%)',
      transition: { duration: reduced ? 0 : 0.95, ease: EASE_QUART, delay: reduced ? 0 : layer * 0.12 },
    },
    exit: {
      clipPath: 'inset(0% 0% 100% 0%)',
      transition: { duration: reduced ? 0 : 0.85, ease: EASE_QUART, delay: reduced ? 0 : 0.18 + (1 - layer) * 0.12 },
    },
  });

  const shell: Variants = {
    closed: { opacity: 0 },
    open: { opacity: 1, transition: { duration: reduced ? 0 : 0.35, delay: reduced ? 0 : 0.6 } },
    exit: { opacity: 0, transition: { duration: reduced ? 0 : 0.25 } },
  };

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          key="project-case"
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="case-title"
          tabIndex={-1}
          data-lenis-prevent
          initial="closed"
          animate="open"
          exit="exit"
          className="fixed inset-0 z-[80] outline-none"
        >
          <motion.div aria-hidden="true" variants={wipe(0)} className="absolute inset-0 bg-signal" />
          <motion.div aria-hidden="true" variants={wipe(1)} className="absolute inset-0 bg-ink">
            <span className="scanlines absolute inset-0 block opacity-70" />
            <span className="absolute inset-x-0 top-0 block h-[60vh] bg-[radial-gradient(ellipse_at_50%_0%,rgb(143_13_10/0.35),transparent_70%)]" />
          </motion.div>

          <motion.div
            ref={scrollRef}
            variants={shell}
            data-lenis-prevent
            className="absolute inset-0 overflow-y-auto overflow-x-clip overscroll-contain"
          >
            <div className="sticky top-0 z-10 border-b border-line bg-ink/90 backdrop-blur-md">
              <div className="gutter mx-auto flex max-w-[1600px] items-center justify-between gap-4 py-3.5">
                <span className="label flex items-center gap-2.5 tabular-nums">
                  <span className="signal-dot" aria-hidden="true" />
                  <span className="hidden sm:inline">Yash Hogade — </span>Case{' '}
                  <span className="text-signal">{pad(index + 1)}</span> / {pad(projects.length)}
                </span>
                <div className="flex items-center gap-4">
                  <span className="label hidden md:inline">Esc to close</span>
                  <button
                    type="button"
                    onClick={close}
                    data-cursor="link"
                    aria-label="Close case study"
                    className="group inline-flex items-center gap-3 rounded-full border border-line py-1.5 pl-4 pr-1.5 transition-[border-color,box-shadow] duration-300 hover:border-signal hover:shadow-[0_0_22px_-6px_var(--color-signal)]"
                  >
                    <span className="font-mono text-[11px] uppercase tracking-[0.12em]">Close</span>
                    <span className="grid size-8 place-items-center rounded-full bg-signal text-ink transition-transform duration-500 ease-expo group-hover:rotate-90">
                      <X aria-hidden="true" size={15} strokeWidth={1.75} />
                    </span>
                  </button>
                </div>
              </div>
              <ReadProgress container={scrollRef} />
            </div>

            <AnimatePresence mode="wait" onExitComplete={onBodySwapped}>
              <CaseBody
                key={project.slug}
                project={project}
                index={index}
                next={next}
                onNext={goNext}
                delay={switched || reduced ? 0.05 : 0.75}
                reduced={reduced}
                scrollRef={scrollRef}
              />
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ReadProgress({ container }: { container: RefObject<HTMLDivElement | null> }) {
  const { scrollYProgress } = useScroll({ container });
  return (
    <motion.span
      aria-hidden="true"
      style={{ scaleX: scrollYProgress }}
      className="absolute inset-x-0 -bottom-px block h-px origin-left bg-signal shadow-[0_0_10px_var(--color-signal)]"
    />
  );
}
