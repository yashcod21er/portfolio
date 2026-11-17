# Yash Hogade · v4 "Signal Red" — design spec

(v3 "Monsoon ink" is preserved in git commit adc5de2.)

## Concept
An **immersive 3D world**: a black void lit by one red signal. The page is one long scroll;
scrolling flies the camera through five chapters. Cinematic, dramatic, confident: the feel of a
film title sequence or a game menu, with short punchy statements in big heavy type layered over
the 3D. Reference feel: a red-lit cinematic portfolio reel — deep red light, a serious central
portrait, glowing UI accents. Make it unmistakably award-level; never templated.

## Identity (tokens in `src/index.css`)
| token | value | use |
|---|---|---|
| `ink` / `ink-2` / `ink-3` | #070506 / #100a0b / #1a1012 | void, raised, hover |
| `line` | #2a1a1c | red-tinted hairlines |
| `bone` | #f3ece8 | primary text |
| `mute` | #9a8c8a | secondary text |
| `signal` | #ff2a1f | THE accent. In WebGL push it above 1.0 (e.g. color × 3–6, `toneMapped={false}`) so Bloom catches it |
| `signal-deep` | #8f0d0a | red washes, fog tint, shadows |
`ochre`/`ochre-deep` are legacy aliases of signal/signal-deep.

Fonts: `font-display` **Archivo** (variable wdth 62–125, wght 300–900): statements set heavy
(800–900), expanded (wdth 110–125), tight tracking, uppercase or sentence case — the cinematic
voice. `font-sans` **Inter Tight** body. `font-mono` **JetBrains Mono** HUD labels (`.label`).
`serif-i` Instrument Serif italic: at most one accent word per statement. `.glow` = red text glow.

## World contract (`src/world/`)
- `layout.ts` — CHAPTERS (`intro` 220vh, `work` 420vh, `stack` 220vh, `journey` 280vh,
  `contact` 160vh), CHAPTER_RANGES, `chapterAt(p)`, `chapterLocal(id, p)`, CAMERA_PATH
  (CatmullRom into −Z, ~205 units), `pathPoint(p)`, `pathTangent(p)`, `chapterAnchor(id, ahead)`,
  PORTRAIT_POSITION. Do not change the chapter list or vh values without telling the lead.
- `store.ts` — `useWorld` zustand: `progress` (0..1), `chapter`, `chapterIndex`, `local`,
  `pointer` {x,y in −1..1}, `sceneReady`, `webgl`, setters. **In useFrame read
  `useWorld.getState()`; never subscribe inside the canvas** (no re-renders per scroll).
- `ScrollDriver.tsx` — already writes progress/pointer from page scroll (Lenis + ScrollTrigger).
- `World.tsx` — fixed full-screen `<Canvas>` behind everything (z-0, pointer-events only where
  needed). `world/chapters/*` — 3D content per chapter, mounted inside World.
- `sequence.ts` — loader for the living-portrait clip (`/sequence/manifest.json`, 97 frames +
  per-frame depth maps, `loop: true`). Still photo `/assets/yash-portrait.webp` +
  `/assets/yash-depth.webp` as fallback.

## Overlay contract (`src/overlay/`)
`<Overlay/>` renders inside `<main id="world-scroll">`: one `<section id={chapter.id}>` per
chapter with `height: {vh}vh` in CHAPTERS order (this IS the scroll length the camera uses).
Content inside is sticky/pinned text that animates by chapter progress. Section ids double as
nav anchors: `#intro`, `#work`, `#stack`, `#journey`, `#contact`.

## Z-index ladder
World canvas 0 · overlay content 10 · nav 70 · ProjectCase 80 · CommandPalette 90 ·
preloader 8000 · grain 9000 · cursor 10000+.

## Motion
GSAP (+ScrollTrigger, SplitText) from `src/lib/gsap.ts`; Lenis already global; `motion/react`
for DOM state transitions; R3F + drei + @react-three/postprocessing for 3D. Camera and objects
ease toward targets (damp) — never snap to scroll. Respect `prefersReducedMotion()`: no camera
flight, static composed scene or the DOM fallback (`useWorld.webgl === false`).

## Performance budget
dpr ≤ 1.5 (≤ 1 on mobile), one canvas, instanced particles (≤ 6k desktop, ≤ 2k mobile), no
real-time shadows, post-processing: Bloom (mipmap blur), ChromaticAberration (subtle), Noise,
Vignette. Pause/skip work for chapters far from the camera. Target 60fps on a laptop GPU.

## Content
Only facts from `src/data/*` (portfolioConfig, projectsData, skillsData, journeyData). No
invented metrics. No phone number. Pune: 18.5204° N, 73.8567° E, IST.

## Code rules
React 19 + TS (noUnusedLocals), Tailwind v4 + helpers above. Stay inside your assigned
folders; report needed shared-file changes instead of making them. Accessible text for
everything shown only in WebGL (DOM sr-only or overlay copy). No horizontal overflow at 375px.
