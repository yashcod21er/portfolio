import type { Ref } from 'react';
import { PORTRAIT } from './content';

interface PortraitCylinderProps {
  /** Number of vertical strips the photo is cut into. */
  strips: number;
  /** Frame width / height. ≤ the photo's 4:3; narrower frames crop around the face. */
  aspect: number;
  /** CSS width of the frame (e.g. a min() expression). */
  width: string;
  frameRef: Ref<HTMLDivElement>;
}

/**
 * The portrait cut into vertical strips. Resting CSS state = the strips sit side by side and
 * form the flat, assembled photograph; `createCylinder()` (cylinder.ts) moves them onto the
 * cylinder per frame. Each strip carries a depth-fog overlay and an ochre hairline edge.
 */
export default function PortraitCylinder({ strips, aspect, width, frameRef }: PortraitCylinderProps) {
  // Background width relative to the frame (cover crop) and the crop's left offset (in frame widths).
  const ratio = Math.max(1, PORTRAIT.width / PORTRAIT.height / aspect);
  const offset = Math.min(Math.max(PORTRAIT.focusX * ratio - 0.5, 0), ratio - 1);
  const span = ratio * strips - 1;

  return (
    <div
      ref={frameRef}
      role="img"
      aria-label={PORTRAIT.alt}
      className="relative [transform-style:preserve-3d]"
      style={{ width, aspectRatio: String(aspect) }}
    >
      {Array.from({ length: strips }, (_, i) => (
        <div
          key={i}
          data-strip
          aria-hidden="true"
          className="absolute inset-y-0 will-change-transform"
          style={{
            left: `${(i / strips) * 100}%`,
            width: `${100 / strips}%`,
            backgroundImage: `url(${PORTRAIT.src})`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: `${ratio * strips * 100}% 100%`,
            backgroundPosition: `${((offset * strips + i) / span) * 100}% 50%`,
          }}
        >
          <span data-fog className="absolute inset-0 bg-ink opacity-0" />
          <span data-edge className="absolute inset-y-0 left-0 w-px bg-ochre opacity-[0.16]" />
        </div>
      ))}
    </div>
  );
}
