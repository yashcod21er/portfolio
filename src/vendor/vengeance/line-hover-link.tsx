// Source: Vengeance UI — line-hover-link, https://github.com/Ashutoshx7/VengeanceUI (MIT License, see vendor-src/vengeance/LICENSE)
//
// Adapted for Yash Hogade's portfolio: "use client" dropped; the stylesheet is emitted once via
// React 19's <style href precedence> dedupe instead of once per link; focus ring uses the ochre
// token; rules live in Tailwind's components layer; underline sits a touch lower for mono labels; the less-fitting variants (pulse, sweep,
// bounce) were removed; forwardRef replaced by React 19's ref-as-prop.

import type { AnchorHTMLAttributes, ReactNode, Ref } from 'react';

import { cn } from '@/lib/utils';

// In Tailwind's components layer so utilities (text-*, hidden…) still win over it.
// This <style> can land before index.css, so restate Tailwind's layer order first —
// otherwise "components" is created before "base" and the preflight reset beats it.
const lineHoverStyles = `
@layer theme, base, components, utilities;
@layer components {
.link-hover {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: fit-content;
  white-space: nowrap;
  text-decoration: none;
  outline: none;
}
.link-hover::before,
.link-hover::after {
  position: absolute;
  left: 0;
  top: calc(100% + 2px);
  width: 100%;
  height: 1px;
  background: currentColor;
  pointer-events: none;
}
.link-hover::before { content: ""; }
.link-hover:focus-visible {
  outline: 2px solid var(--color-ochre);
  outline-offset: 0.35rem;
}

.link-hover--slide::before {
  transform: scale3d(0, 1, 1);
  transform-origin: 100% 50%;
  transition: transform 0.3s ease;
}
.link-hover--slide:hover::before,
.link-hover--slide:focus-visible::before {
  transform: scale3d(1, 1, 1);
  transform-origin: 0% 50%;
}

.link-hover--double::before {
  transform: scale3d(0, 1, 1);
  transform-origin: 100% 50%;
  transition: transform 0.3s cubic-bezier(0.7, 0, 0.2, 1);
}
.link-hover--double:hover::before,
.link-hover--double:focus-visible::before {
  transform: scale3d(1, 1, 1);
  transform-origin: 0% 50%;
  transition-timing-function: cubic-bezier(0.4, 1, 0.8, 1);
}
.link-hover--double::after {
  content: "";
  top: calc(100% + 6px);
  transform: scale3d(0, 1, 1);
  transform-origin: 0% 50%;
  transition: transform 0.3s cubic-bezier(0.7, 0, 0.2, 1);
}
.link-hover--double:hover::after,
.link-hover--double:focus-visible::after {
  transform: scale3d(1, 1, 1);
  transform-origin: 100% 50%;
  transition-timing-function: cubic-bezier(0.4, 1, 0.8, 1);
}

.link-hover--grow::before {
  transform: scale3d(0, 1, 1);
  transform-origin: 100% 50%;
  transition: transform 0.3s cubic-bezier(0.2, 1, 0.8, 1);
}
.link-hover--grow:hover::before,
.link-hover--grow:focus-visible::before {
  transform: scale3d(1, 2, 1);
  transform-origin: 0% 50%;
  transition-timing-function: cubic-bezier(0.7, 0, 0.2, 1);
}
.link-hover--grow::after {
  content: "";
  top: calc(100% + 6px);
  transform: scale3d(0, 1, 1);
  transform-origin: 100% 50%;
  transition: transform 0.4s 0.1s cubic-bezier(0.2, 1, 0.8, 1);
}
.link-hover--grow:hover::after,
.link-hover--grow:focus-visible::after {
  transform: scale3d(1, 1, 1);
  transform-origin: 0% 50%;
}

.link-hover--strike::before {
  top: 50%;
  transform: scale3d(0, 1, 1);
  transform-origin: 100% 50%;
  transition: transform 0.3s cubic-bezier(0.4, 1, 0.8, 1);
}
.link-hover--strike:hover::before,
.link-hover--strike:focus-visible::before {
  transform: scale3d(1, 1, 1);
  transform-origin: 0% 50%;
}

.link-hover--fade::before,
.link-hover--fade::after {
  opacity: 0;
  transform: translate3d(0, 3px, 0);
  transition: transform 0.3s cubic-bezier(0.2, 1, 0.8, 1), opacity 0.3s cubic-bezier(0.2, 1, 0.8, 1);
}
.link-hover--fade::after {
  content: "";
  left: 15%;
  top: calc(100% + 6px);
  width: 70%;
}
.link-hover--fade:hover::before,
.link-hover--fade:hover::after,
.link-hover--fade:focus-visible::before,
.link-hover--fade:focus-visible::after {
  opacity: 1;
  transform: translate3d(0, 0, 0);
}
.link-hover--fade::before,
.link-hover--fade:hover::after,
.link-hover--fade:focus-visible::after { transition-delay: 0.1s; }

.link-hover--swap::before {
  transform: scale3d(0, 1, 1);
  transform-origin: 0% 50%;
  transition: transform 0.3s ease;
}
.link-hover--swap:hover::before,
.link-hover--swap:focus-visible::before { transform: scale3d(1, 1, 1); }
.link-hover--swap::after {
  content: "";
  top: calc(100% + 6px);
  transform-origin: 100% 50%;
  transition: transform 0.3s ease;
}
.link-hover--swap:hover::after,
.link-hover--swap:focus-visible::after { transform: scale3d(0, 1, 1); }

.link-hover__graphic {
  position: absolute;
  left: 0;
  top: 0;
  fill: none;
  stroke: currentColor;
  stroke-width: 1px;
  pointer-events: none;
  overflow: visible;
}
.link-hover__graphic--stroke path {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
}
.link-hover:hover .link-hover__graphic--stroke path,
.link-hover:focus-visible .link-hover__graphic--stroke path { stroke-dashoffset: 0; }
.link-hover--arc::before,
.link-hover--scribble::before { display: none; }
.link-hover__graphic--arc { left: -23%; top: 73%; width: 146%; }
.link-hover__graphic--arc path { transition: stroke-dashoffset 0.4s cubic-bezier(0.7, 0, 0.3, 1); }
.link-hover:hover .link-hover__graphic--arc path,
.link-hover:focus-visible .link-hover__graphic--arc path {
  transition-duration: 0.3s;
  transition-timing-function: cubic-bezier(0.8, 1, 0.7, 1);
}
.link-hover__graphic--scribble { top: calc(100% + 1px); }
.link-hover__graphic--scribble path { transition: stroke-dashoffset 0.6s cubic-bezier(0.7, 0, 0.3, 1); }
.link-hover:hover .link-hover__graphic--scribble path,
.link-hover:focus-visible .link-hover__graphic--scribble path {
  transition-duration: 0.3s;
  transition-timing-function: cubic-bezier(0.8, 1, 0.7, 1);
}

@media (prefers-reduced-motion: reduce) {
  .link-hover,
  .link-hover *,
  .link-hover::before,
  .link-hover::after {
    animation: none !important;
    transition-duration: 0.01ms !important;
  }
}
}
`;

/**
 * slide    - line slides in from right to left
 * double   - two lines animate with different timings
 * grow     - line grows thicker on hover
 * strike   - strikethrough
 * fade     - lines fade up with stagger delay
 * swap     - two lines go opposite directions
 * arc      - SVG arc stroke draws in
 * scribble - SVG scribble stroke draws in
 */
export type LineHoverVariant = 'slide' | 'double' | 'grow' | 'strike' | 'fade' | 'swap' | 'arc' | 'scribble';

export interface LineHoverLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: LineHoverVariant;
  children: ReactNode;
  className?: string;
  ref?: Ref<HTMLAnchorElement>;
}

const ArcGraphic = () => (
  <svg
    aria-hidden="true"
    className="link-hover__graphic link-hover__graphic--stroke link-hover__graphic--arc"
    height="18"
    viewBox="0 0 59 18"
    preserveAspectRatio="none"
  >
    <path d="M.945.149C12.3 16.142 43.573 22.572 58.785 10.842" pathLength="1" />
  </svg>
);

const ScribbleGraphic = () => (
  <svg
    aria-hidden="true"
    className="link-hover__graphic link-hover__graphic--stroke link-hover__graphic--scribble"
    width="100%"
    height="9"
    viewBox="0 0 101 9"
    preserveAspectRatio="none"
  >
    <path
      d="M.426 1.973C4.144 1.567 17.77-.514 21.443 1.48 24.296 3.026 24.844 4.627 27.5 7c3.075 2.748 6.642-4.141 10.066-4.688 7.517-1.2 13.237 5.425 17.59 2.745C58.5 3 60.464-1.786 66 2c1.996 1.365 3.174 3.737 5.286 4.41 5.423 1.727 25.34-7.981 29.14-1.294"
      pathLength="1"
    />
  </svg>
);

/** A link with an animated underline on hover / keyboard focus. */
export function LineHoverLink({ variant = 'slide', children, className, ref, ...props }: LineHoverLinkProps) {
  return (
    <>
      <style href="vengeance-line-hover-link" precedence="default">
        {lineHoverStyles}
      </style>
      <a ref={ref} className={cn('link-hover', `link-hover--${variant}`, className)} {...props}>
        {children}
        {variant === 'arc' && <ArcGraphic />}
        {variant === 'scribble' && <ScribbleGraphic />}
      </a>
    </>
  );
}

export default LineHoverLink;
