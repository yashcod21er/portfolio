# Yash Hogade · v2 — Design spec

This is the contract every section follows. One person's site, one voice, one motion system.

## Concept: "Monsoon ink"
A cinematic, editorial, dark portfolio for a full-stack developer from Pune. It should feel like
an award-site (Awwwards / hoverstat.es / landing.love calibre): huge confident type, real motion
choreography, tactile hovers, nothing templated. Restraint everywhere except a few signature moments.

Influences from the references: oversized typography that reacts to the cursor; scroll-driven
choreography (pinned sections, scrubbed reveals); a node/list view for work; small "living"
details baked into the UI (live Pune clock, coordinates, timestamps).

## Tokens (defined in `src/index.css` — use them, never hard-code other colors)
| Tailwind class part | Value | Use |
|---|---|---|
| `ink` | #0b0d0e | page background |
| `ink-2` / `ink-3` | #121518 / #1a1e21 | raised / hover surfaces |
| `line` | #252a2d | hairline borders |
| `bone` | #ece7df | primary text |
| `mute` | #8b908b | secondary text, labels |
| `ochre` / `ochre-deep` | #e3a23b / #b97a22 | THE accent (from the wall in his portrait). Use sparingly. |

Fonts (loaded in index.html):
- `font-display` Bricolage Grotesque (variable: opsz 12–96, wdth 75–100, wght 200–800). Big headlines.
  Default via `.display` helper: weight 700, wdth 75 (condensed), tight tracking, line-height .88.
  Animate `font-variation-settings` ("wdth", "wght") for hover/cursor effects.
- `serif-i` Instrument Serif italic — the counter-voice. Use for one or two emphasised words inside
  display headlines ("Selected *work*"), never for paragraphs.
- `font-sans` Geist — body copy, 16–18px, max ~62ch.
- `font-mono` Geist Mono — `.label` helper: 11px uppercase, tracked, muted. HUD details, metadata.

Layout: full-bleed sections, content inside `.gutter` (responsive side padding incl. safe areas).
Max content width ~1600px. Hairline dividers (`border-line`) separate rows, not boxes and shadows.
No rounded-everything cards, no glassmorphism, no gradients-on-white, no emoji, no neon glows.
Radii: 0 by default; full pill only for small tags/buttons.

## Motion system
- Libraries: GSAP 3.15 (+ ScrollTrigger, SplitText — import ONLY from `src/lib/gsap.ts`),
  `useGSAP` hook for every timeline (scope it to a ref so it cleans up), Lenis smooth scroll
  (already started in App; use `scrollToTarget`, `lockScroll` from `src/lib/smooth.ts`),
  `motion` (import from `motion/react`) for small UI state transitions (overlay enter/exit, menu),
  React Three Fiber + drei + three for WebGL (hero only).
- Eases: `expo.out` for reveals, `power3.inOut` / `expo.inOut` for wipes, durations 0.9–1.4s.
  Stagger lines 0.08–0.12s, chars 0.015–0.03s.
- Reveal pattern: text lines slide up from behind a mask (SplitText `type: 'lines'`, `mask: 'lines'`).
  Use `gsap.from(...)` so the resting CSS state is the visible final state — content must never be
  stuck invisible if JS/animation fails.
- Respect `prefersReducedMotion()` — skip scrubs, pins and WebGL distortion; show final states.
- Touch / coarse pointers: no cursor effects, no hover-only information.

## Shared state (`src/lib/store.ts`, zustand `useSite`)
- `loaded` / `setLoaded()` — Preloader calls `setLoaded()` when done; Hero intro waits for it.
- `activeProject` / `setActiveProject(slug|null)` — Work rows open the case-study overlay.
- `paletteOpen` / `setPaletteOpen(bool)` — command palette (Ctrl/⌘+K) + terminal.

## Cursor contract
`Cursor.tsx` renders a global custom cursor (fine pointers only, adds `has-cursor` class to <html>).
Any element can opt in with data attributes:
- `data-cursor="link"` → cursor grows / inverts
- `data-cursor="view"` + `data-cursor-label="Open"` → cursor becomes an ochre disc with that label
- `data-cursor="hide"` → cursor hides (e.g. over WebGL that has its own effect)

## Section anchors
`#home` (hero), `#work`, `#about`, `#contact`. Nav and palette scroll to these.

## Content
All facts come from `src/data/*` (portfolioConfig, projectsData, skillsData, journeyData).
Never invent metrics, clients, awards, or numbers. Portrait: `/assets/yash-portrait.webp`
(warm ochre wall, white shirt, sunglasses — 1448×1086). Project images: `/projects/*.png`.
Resume: `portfolioConfig.resumePath`. Do not display the phone number.
Pune detail: 18.5204° N, 73.8567° E, IST (UTC+05:30).

## Code rules
- React 19 + TypeScript strict-ish (noUnusedLocals). Tailwind v4 utility classes + the helpers above.
- Each section owns its folder; do not edit files outside your assignment.
  If you need a change in a shared file (`src/lib/*`, `src/index.css`, `App.tsx`), say so in your report.
- Semantic HTML, keyboard reachable controls, visible focus, alt text, `aria-label`s on icon buttons.
- Must work at 375px wide with no horizontal page scroll.

---

# v3 addendum — "The photo is the interface"

v3 keeps everything above and adds signature moments where Yash's photograph is the material.

## Third-party components
- Raw downloads (reference, never imported directly): `vendor-src/skiper/*.tsx` (Skiper UI free
  components) and `vendor-src/vengeance/*.tsx` (Vengeance UI, MIT). See CREDITS.md.
- To use one: port it into `src/vendor/skiper/<name>.tsx` or `src/vendor/vengeance/<name>.tsx`.
  Keep the source/license header comment at the top. Adapt it:
  - `framer-motion` -> `motion/react`; `next/image` -> `<img>`; drop `"use client"`.
  - `@/lib/utils` works (alias to src/lib/utils.ts -> cn).
  - Remove demo content/images; take props instead. Restyle to our tokens (ink/bone/ochre/mute/line,
    our fonts). Remove any Lenis instance the component creates (Lenis is already global).
  - Never import `@react-three/drei` or `maath` (removed). `three` and `@react-three/fiber` are fine.
- Only Skiper FREE components. Never try to fetch Pro components.

## Sound (`src/lib/sound.ts`)
- `useSound` store (`enabled`, `setEnabled`) and `sfx.hover/click/whoosh/shatter/reform/key()`.
  Call them freely; they are no-ops while sound is off. Sound is always off by default.

## Z-index ladder
mobile menu 65 · nav 70 · ProjectCase overlay 80 · CommandPalette 90 · edge blur / scroll HUD 60 ·
preloader 8000 · grain 9000 · cursor 10000+.

## Page order
Hero (#home) -> Work (#work) -> Interlude (#interlude, new) -> About (#about) -> Contact (#contact).
