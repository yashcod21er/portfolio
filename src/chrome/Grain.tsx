import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../lib/smooth';

const TILE = 180;
const FPS = 12;

/**
 * Film grain: one canvas-generated noise tile, repeated, and jittered at a low frame rate.
 * Sits above content but below the cursor; never takes pointer events.
 */
export default function Grain() {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;

    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = TILE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = ctx.createImageData(TILE, TILE);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    layer.style.backgroundImage = `url(${canvas.toDataURL('image/png')})`;

    if (prefersReducedMotion()) return;

    const id = window.setInterval(() => {
      if (document.hidden) return;
      const x = Math.round((Math.random() * 2 - 1) * TILE);
      const y = Math.round((Math.random() * 2 - 1) * TILE);
      layer.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }, 1000 / FPS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[9000] overflow-hidden opacity-[0.06]">
      <div
        ref={layerRef}
        className="absolute -inset-[180px] will-change-transform"
        style={{ backgroundSize: `${TILE}px ${TILE}px`, backgroundRepeat: 'repeat' }}
      />
    </div>
  );
}
