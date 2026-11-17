import { projectsData } from '../../data/projectsData';
import type { CircularGalleryItem } from '@/vendor/vengeance/circular-gallery';
import type { Project } from '../../types/portfolio';

/** The photograph (DESIGN.md): warm ochre wall, white shirt, sunglasses. Face sits ~52% across. */
export const PORTRAIT = {
  src: '/assets/yash-portrait.webp',
  width: 1448,
  height: 1086,
  focusX: 0.52,
  alt: 'Yash Hogade in a white shirt and sunglasses, seated in front of an ochre lime-washed wall in Pune',
} as const;

export const COORDS = '18.5204° N, 73.8567° E';

/** The statement, one entry per display line. `serif` marks the counter-voice word. */
export const STATEMENT: { text: string; serif?: boolean }[] = [
  { text: 'I turn ideas' },
  { text: 'into products' },
  { text: 'people actually' },
  { text: 'use.', serif: true },
];
export const STATEMENT_TEXT = STATEMENT.map((l) => l.text).join(' ');

/** The three acts, in scroll order (HUD shows "01 / 03" + label). */
export const ACTS = ['Portrait', 'Statement', 'Work in orbit'] as const;

export const pad = (n: number) => String(n).padStart(2, '0');

/** "UrbanStay (Airbnb Clone)" → { main: "UrbanStay", aside: "Airbnb Clone" } */
export function splitTitle(title: string): { main: string; aside: string | null } {
  const m = title.match(/^(.*?)\s*\((.+)\)\s*$/);
  return m ? { main: m[1], aside: m[2] } : { main: title, aside: null };
}

/** Projects that have a screenshot (all four today), in projectsData order. */
export const projects = projectsData.filter((p): p is Project & { image: string } => Boolean(p.image));

export const orbitItems: CircularGalleryItem[] = projects.map((p, i) => ({
  id: p.slug,
  src: p.image,
  title: splitTitle(p.title).main,
  meta: pad(i + 1),
}));
