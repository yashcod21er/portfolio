# YASH.OS — Premium 3D Developer Portfolio

A production-quality, highly interactive 3D digital operating system developer portfolio engineered for **Yash Hogade** (Final-Year Computer Engineering Student at AISSMS College of Engineering, Pune / Full-Stack Developer).

Built with **React, Vite, TypeScript, Three.js, React Three Fiber, GSAP, and modern Tailwind CSS**.

---

## 🚀 Key Architectural Features

1. **Centralized Data Architecture (`src/data/`)**:
   - `src/data/portfolioConfig.ts`: Profile name, tagline, bio, education credentials (AISSMS COE Pune, SPPU), contact channels, and resume location.
   - `src/data/projectsData.ts`: Project specifications, deep-linking slugs, problem/solution breakdowns, and verified feature lists.
   - `src/data/skillsData.ts`: Authentic engineering domains (Frontend, Backend, Database, Programming, Tools) with zero fabricated percentages.
   - `src/data/journeyData.ts`: Progression roadmap tracking academic and engineering milestones.

2. **Procedural 3D Cybernetic World**:
   - Floating cyberpunk hexagonal platform with neon circuits.
   - Developer workstation desk with curved panoramic ultrawide monitor displaying real-time canvas code streams.
   - Dual holographic floating display panes.
   - Pulsing crystalline Energy Core with concentric orbital rings.
   - Toroidal Quantum Portal for the contact gateway.
   - Cosmic starfields with deterministic seeded particles and nebula fog.

3. **Loosely Coupled Scroll & Camera Rig**:
   - DOM scroll remains the single source of truth (`useScrollSpy`).
   - Section intersections smoothly guide the Three.js camera position and lookAt target without overriding native browser scrolling.
   - Gentle, comfortable mouse parallax on desktop.

4. **Adaptive Performance Engine**:
   - Monitors real-time rendering frame rates via `requestAnimationFrame`.
   - Supports 5 graphics tiers: `AUTO`, `HIGH`, `MEDIUM`, `LOW`, and `WEBGL OFF`.
   - In `AUTO` mode, dynamically steps down DPR and particle count if frame rates dip below 32 FPS.
   - Includes `ErrorBoundary.tsx` and an animated 2D vector fallback (`WebGLFallback.tsx`) ensuring total recruiter usability if WebGL is unavailable.

5. **Advanced Productivity & Accessibility**:
   - **Command Center (`Ctrl + K` / `Cmd + K`)**: Instant search dialog to jump to sections, projects, and actions.
   - **YASH.OS Shell**: Fully functional interactive terminal responding truthfully to commands (`help`, `about`, `skills`, `projects`, `education`, `contact`, `resume`, `date`, `whoami`).
   - **Project Deep-Linking**: Open individual project specifications directly via URL (e.g. `/?project=airbnb-clone`) with one-click link copying.
   - **Modal Accessibility**: Focus trapping (`useFocusTrap`), focus restoration, body scroll locking, and Escape-to-close on all modals.
   - **Respects User Preferences**: Auto-disables custom cursor and heavy motions on touch devices and when `prefers-reduced-motion` is active.

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm (v9+ recommended)

### 1. Installation
```bash
git clone <your-repository-url>
cd portfolio
npm install
```

### 2. Local Development
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Code Quality Checks
```bash
# Typecheck with TypeScript compiler
npm run typecheck

# Lint with Oxlint
npm run lint
```

### 4. Production Build
```bash
npm run build

# Preview production build locally
npm run preview
```

---

## 📝 Customization Guide

### Updating Personal Information & Links
Open `src/data/portfolioConfig.ts`:
- **Name, Role & Bio**: Update `name`, `role`, `tagline`, `bio`.
- **Socials**:
  ```ts
  socials: {
    github: 'https://github.com/your-username',
    linkedin: 'https://linkedin.com/in/your-username',
    email: 'your.email@gmail.com'
  }
  ```
- **Education**: Coursework and university details are configured under `education`.

### Adding or Editing Projects
Open `src/data/projectsData.ts`:
Each project accepts:
```ts
{
  id: 'proj-5',
  slug: 'new-project',
  title: 'Project Title',
  tagline: 'Brief Summary',
  description: 'Detailed description...',
  category: 'Full-Stack', // 'Full-Stack' | 'Frontend' | 'Systems & AI'
  status: 'COMPLETED',    // 'COMPLETED' | 'IN PROGRESS' | 'PLANNED'
  technologies: ['React', 'Node.js', 'PostgreSQL'],
  github: 'https://github.com/your-username/repo',
  demo: 'https://your-demo.vercel.app',
  image: '/projects/your-preview.svg', // place file in public/projects/
  problem: 'What technical hurdle did this solve?',
  solution: 'How did your architecture solve it?',
  features: [
    'Feature 1',
    'Feature 2'
  ]
}
```

### Adding Your Resume
1. Export your resume as a PDF named `Yash_Hogade_Resume.pdf`.
2. Place it into the `public/assets/` directory:
   ```
   public/assets/Yash_Hogade_Resume.pdf
   ```
3. The "DOWNLOAD RESUME" button across the Hero, Navigation, and Terminal will automatically serve this file.

---

## 🌐 Deployment Instructions

### Option 1: Vercel (Recommended)
1. Push your repository to GitHub.
2. Go to [Vercel](https://vercel.com) and click **Add New Project**.
3. Import your GitHub repository.
4. Framework Preset: **Vite**.
5. Build Command: `npm run build`.
6. Output Directory: `dist`.
7. Click **Deploy**.

### Option 2: Netlify
1. Push your repository to GitHub.
2. In Netlify, select **Add new site** > **Import an existing project**.
3. Set:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Create a `public/_redirects` file with `/*  /index.html  200` to support client-side deep links on refresh.
5. Click **Deploy Site**.

### Option 3: GitHub Pages
1. In `vite.config.ts`, set `base: '/<repository-name>/'` if deploying under a project subpath.
2. Build the project:
   ```bash
   npm run build
   ```
3. Use `gh-pages` or a GitHub Action to deploy the `dist/` directory to the `gh-pages` branch.

---

## 🎨 Color Palette Reference

| Token | Hex | Usage |
| :--- | :--- | :--- |
| **Midnight** | `#080B16` | Main background & canvas atmosphere |
| **Deep Blue** | `#111D3A` | Card headers, elevated surfaces |
| **Surface** | `#10182B` | Secondary panel backgrounds |
| **Electric Cyan** | `#39DFFF` | Primary accent, hero glow, workstation |
| **Violet** | `#9B7BFF` | Secondary accent, energy core, badges |

---

## ⚖️ License
Personal portfolio developed for Yash Hogade. All rights reserved.
