# Yash Hogade — Portfolio v2

Personal portfolio of Yash Hogade, full-stack developer and final-year Computer Engineering
student at AISSMS COE, Pune.

Built with React 19, Vite, TypeScript and Tailwind v4. Motion uses GSAP (ScrollTrigger and
SplitText), Lenis smooth scroll and Motion. The hero portrait is WebGL, via React Three Fiber
and custom shaders. The visual rules are in [DESIGN.md](DESIGN.md).

## What's on the page

- **Preloader:** a counter with Pune coordinates, then a column wipe into the hero.
- **Hero:** a WebGL portrait that ripples where the cursor moves. The name changes colour
  where it overlaps the photo, widens near the cursor, and breaks apart as you scroll away.
- **Work:** a horizontal scroll gallery on desktop and an Index list with a floating
  preview. Each project opens a full-screen case study that you can link to directly
  (`/?project=zerodha-clone`).
- **About:** a bio that lights up as you scroll, a fact sheet, a skills marquee that speeds
  up with scroll, skill groups that expand, and a 9-stop journey timeline.
- **Contact:** a headline that swells near the cursor, an email copy button, magnetic link
  buttons, and a large name across the bottom of the footer.
- **Command palette:** opens with `Ctrl K` / `⌘ K`. Type `>` to switch to a small terminal
  (`help`, `projects`, `sudo hire-me`, and more).
- **Reduced motion:** turns off pinning, scrubbing and WebGL. Touch devices skip the cursor effects.

## Editing content

All text comes from `src/data/`:

| File | Contains |
|---|---|
| `portfolioConfig.ts` | name, role, bio, education, links, résumé path |
| `projectsData.ts` | projects: problem, approach, features, stack, links, image |
| `skillsData.ts` | skill groups |
| `journeyData.ts` | the "Road here" timeline |

Images live in `public/` (`assets/yash-portrait.webp`, `projects/*.png`, `assets/Yash_Hogade_Resume.pdf`).

## Moving hero: add a clip of yourself

The hero shows `public/assets/yash-portrait.webp` as a 3D relief (depth map:
`public/assets/yash-depth.webp`). To make it move, give it a short clip (5–10 s) of you, for
example made with an image-to-video tool from the portrait, or filmed against a plain wall:

```bash
npm run sequence -- path/to/clip.mp4 --frames 96 --look 1-48
```

This writes numbered frames and per-frame depth maps to `public/sequence/`, all on this
computer (ffmpeg via `ffmpeg-static`, depth via Depth Anything V2 small; the model downloads
once). `--look a-b` marks frames that show a left→right head turn: the cursor scrubs them. The
remaining frames play as the hero scrolls away. `--loop` instead plays the whole clip as a slow
back-and-forth "living portrait" (what the current hero uses). Delete `public/sequence/` to go
back to the still photo.

The current clip was generated locally from the portrait with LTX-Video 0.9.5 (Lightricks,
open weights) in Docker on an 8 GB RTX GPU: see `tools/ltx/` (`run.ps1` regenerates it, and
`node tools/ltx/progress.mjs run.log` shows progress). Then:

```bash
npm run sequence -- tools/ltx/clip.mp4 --frames 97 --width 768 --loop
```

## Structure

```
src/
  lib/        gsap setup, Lenis smooth scroll, zustand store, cn()
  chrome/     Preloader, Nav (+ mobile menu, Pune clock), Cursor, Grain
  sections/
    hero/     Hero + WebGL portrait (shaders, engine, fallback)
    work/     Gallery, Index, ProjectCase overlay
    about/    Manifesto, SpecSheet, Skills, Journey
    contact/  Contact, Footer, CommandPalette + terminal
```

## Scripts

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build to dist/
npm run lint
```

Deploys as a static site (Vercel and Render configs included; output in `dist/`).
