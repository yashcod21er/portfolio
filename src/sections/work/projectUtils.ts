import { useCallback, useSyncExternalStore, type MouseEvent } from 'react';
import { projectsData } from '../../data/projectsData';
import { portfolioConfig } from '../../data/portfolioConfig';
import { ScrollTrigger } from '../../lib/gsap';
import { useSite } from '../../lib/store';

export const projects = projectsData;

/** Breakpoint at which the gallery becomes a pinned horizontal track. */
export const HORIZONTAL_QUERY =
  '(min-width: 1024px) and (pointer: fine) and (prefers-reduced-motion: no-preference)';
export const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';
export const FINE_HOVER_QUERY = '(hover: hover) and (pointer: fine)';

/** Motion-library easing curves matching the CSS tokens. */
export const EASE_EXPO = [0.16, 1, 0.3, 1] as const;
export const EASE_QUART = [0.76, 0, 0.24, 1] as const;

export const pad = (n: number) => String(n).padStart(2, '0');

/** "UrbanStay (Airbnb Clone)" → { main: "UrbanStay", aside: "Airbnb Clone" } */
export function splitTitle(title: string): { main: string; aside: string | null } {
  const m = title.match(/^(.*?)\s*\((.+)\)\s*$/);
  return m ? { main: m[1], aside: m[2] } : { main: title, aside: null };
}

export const hasDemo = (demo?: string) => !!demo && demo.trim() !== '' && demo.trim() !== '#';

export const prettyUrl = (url: string) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

/**
 * Year range for the work index. Projects carry no dates yet, so this falls back to the
 * site year; add `timeline` (e.g. "2025 — 2026") to a project and the range is derived from it.
 */
export function yearRange(): string {
  const years = projects
    .flatMap((p) => p.timeline?.match(/\d{4}/g) ?? [])
    .map(Number)
    .filter(Number.isFinite);
  if (!years.length) return String(portfolioConfig.copyrightYear);
  const min = Math.min(...years);
  const max = Math.max(...years);
  return min === max ? String(min) : `${min} — ${max}`;
}

/** Re-sort (pins first, by position) and recompute every ScrollTrigger on the page. */
export function refreshScroll() {
  ScrollTrigger.sort();
  ScrollTrigger.refresh();
}

/** Write or remove ?project=slug without adding a history entry. */
export function writeProjectParam(slug: string | null) {
  const url = new URL(window.location.href);
  if (slug) url.searchParams.set('project', slug);
  else url.searchParams.delete('project');
  const next = `${url.pathname}${url.search}${url.hash}`;
  if (next !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
    window.history.replaceState(window.history.state, '', next);
  }
}

/** Plain left-click opens the overlay; modified clicks fall through to the ?project= deep link. */
export function useOpenProject() {
  const setActiveProject = useSite((s) => s.setActiveProject);
  return useCallback(
    (e: MouseEvent<HTMLAnchorElement>, slug: string) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      setActiveProject(slug);
    },
    [setActiveProject],
  );
}

export function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
