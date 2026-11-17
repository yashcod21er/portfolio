/**
 * Portrait cylinder math (Act 1). The strips are laid along an arc of curvature k:
 *   k = 0          → a flat plane: the assembled photograph (the resting CSS state)
 *   k = 2π / width → a closed cylinder whose circumference equals the photo's width
 * An arc-length shift rolls the face around the cylinder, and each strip gets a seeded
 * twist / vertical / depth scatter that fades out as the cylinder unrolls. Progress 0.5 is
 * the flat photo (held for a beat); either side the cylinder curls up and spins apart.
 */

const TAU = Math.PI * 2;
const RAD = 180 / Math.PI;
/** Half-width of the "assembled" hold around progress 0.5. */
const HOLD = 0.1;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Small deterministic PRNG so the scatter is identical on every visit. */
function seeded(seed: number) {
  let s = seed % 2147483647;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export interface Cylinder {
  /** Re-read the frame size (call on ScrollTrigger refresh). */
  measure: () => void;
  /**
   * Pose the strips. `p` is act progress 0..1, `spin` an extra roll in frame widths.
   * Returns the "scatter" amount e (0 = assembled, 1 = fully curled).
   */
  render: (p: number, spin?: number) => number;
}

export function createCylinder(frame: HTMLElement): Cylinder {
  const strips = Array.from(frame.querySelectorAll<HTMLElement>('[data-strip]'));
  const fogs = strips.map((s) => s.querySelector<HTMLElement>('[data-fog]'));
  const edges = strips.map((s) => s.querySelector<HTMLElement>('[data-edge]'));
  const n = strips.length;
  const rnd = seeded(1448);
  const seeds = strips.map((_, i) => ({
    twist: (i % 2 ? 1 : -1) * (46 + rnd() * 42),
    y: (rnd() - 0.5) * 0.55,
    z: (rnd() - 0.5) * 0.5,
  }));

  let W = frame.offsetWidth || 1;
  let H = frame.offsetHeight || 1;

  return {
    measure() {
      W = frame.offsetWidth || 1;
      H = frame.offsetHeight || 1;
    },
    render(p, spin = 0) {
      const u = clamp01(p) - 0.5;
      const sgn = u < 0 ? -1 : 1;
      const d = clamp01((Math.abs(u) - HOLD) / (0.5 - HOLD));
      const e = d * d * (3 - 2 * d); // smoothstep
      const sc = Math.pow(e, 1.35);
      const k = (TAU / W) * e;
      const w = W / n;
      // Arc shift: the face starts on the far side of the column and rolls round to the front.
      const sigma = (sgn * e * 0.5 + spin) * W;

      for (let i = 0; i < n; i++) {
        const s = (i + 0.5 - n / 2) * w; // resting centre of this strip
        const arc = s + sigma;
        let x = arc;
        let z = 0;
        let ang = 0;
        if (k > 1e-6) {
          const R = 1 / k;
          ang = arc * k;
          x = R * Math.sin(ang);
          z = R * (Math.cos(ang) - 1);
        }
        const sd = seeds[i];
        const twist = sd.twist * sgn * sc;
        const dy = sd.y * sgn * H * sc;
        const dz = sd.z * W * 0.3 * sc;
        strips[i].style.transform =
          `translate3d(${(x - s).toFixed(2)}px, ${dy.toFixed(2)}px, ${(z + dz).toFixed(2)}px) ` +
          `rotateY(${(ang * RAD + twist).toFixed(2)}deg)`;

        // Depth fog: strips turned away (or edge-on) go dark.
        const facing = Math.cos(ang + twist / RAD);
        const fog = Math.min(0.92, (1 - facing) * 0.46 + sc * 0.08);
        const fogEl = fogs[i];
        if (fogEl) fogEl.style.opacity = fog.toFixed(3);
        const edgeEl = edges[i];
        if (edgeEl) edgeEl.style.opacity = (0.16 + 0.64 * sc).toFixed(3);
      }
      return e;
    },
  };
}
