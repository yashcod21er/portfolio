/**
 * Frame sequence for the hero: a short clip of Yash, pre-cut into numbered frames (plus
 * optional depth maps) by `npm run sequence`. The portrait engine shows the frame for the
 * current index; this class keeps only a window of decoded frames around it.
 *
 * No manifest → no sequence, and the hero keeps its still photo.
 */
export interface SequenceManifest {
  frames: number;
  width: number;
  height: number;
  depth: boolean;
  /** 0-based inclusive range scrubbed by the cursor (a left → right look), or null */
  look: [number, number] | null;
  /** play on its own as a back-and-forth loop instead of following cursor / scroll */
  loop?: boolean;
  /** loop playback rate, frames per second */
  fps?: number;
  focus: { x: number; y: number };
}

export const SEQUENCE_BASE = '/sequence/';

/** Frames kept decoded on each side of the current one. */
const BEHIND = 10;
const AHEAD = 24;

export async function loadManifest(): Promise<SequenceManifest | null> {
  try {
    const res = await fetch(`${SEQUENCE_BASE}manifest.json`, { cache: 'no-cache' });
    if (!res.ok) return null;
    // the dev server answers unknown paths with index.html
    if (!(res.headers.get('content-type') ?? '').includes('json')) return null;
    const m = (await res.json()) as SequenceManifest;
    return m && m.frames > 0 && m.width > 0 && m.height > 0 ? m : null;
  } catch {
    return null;
  }
}

type Slot = { bitmap: ImageBitmap | null; pending: boolean };

const pad = (i: number) => String(i + 1).padStart(3, '0');

export class FrameSequence {
  readonly manifest: SequenceManifest;
  private readonly color: Slot[];
  private readonly depth: Slot[];
  private disposed = false;

  constructor(manifest: SequenceManifest) {
    this.manifest = manifest;
    this.color = Array.from({ length: manifest.frames }, () => ({ bitmap: null, pending: false }));
    this.depth = Array.from({ length: manifest.frames }, () => ({ bitmap: null, pending: false }));
  }

  /** Decode frames near `index`, drop the ones far away. Call every frame; it's cheap. */
  prefetch(index: number) {
    const n = this.manifest.frames;
    // a short loop runs both ways: keep every frame (97 frames ≈ 3 MB on disk)
    if (this.manifest.loop && n <= 160) {
      for (let i = 0; i < n; i++) this.load(i);
      return;
    }
    for (let d = 0; d <= AHEAD; d++) {
      this.load(index + d);
      if (d <= BEHIND) this.load(index - d);
    }
    for (let i = 0; i < n; i++) {
      if (i < index - BEHIND - 6 || i > index + AHEAD + 6) {
        this.drop(this.color[i]);
        this.drop(this.depth[i]);
      }
    }
  }

  /** Nearest decoded colour frame (and its depth map, if it has one) to `index`. */
  nearest(index: number): { i: number; color: ImageBitmap; depth: ImageBitmap | null } | null {
    const n = this.manifest.frames;
    for (let d = 0; d < n; d++) {
      for (const i of d === 0 ? [index] : [index - d, index + d]) {
        const c = this.color[i]?.bitmap;
        if (c) return { i, color: c, depth: this.depth[i]?.bitmap ?? null };
      }
    }
    return null;
  }

  dispose() {
    this.disposed = true;
    [...this.color, ...this.depth].forEach((s) => this.drop(s));
  }

  private load(i: number) {
    if (i < 0 || i >= this.manifest.frames) return;
    this.fetchInto(this.color[i], `${SEQUENCE_BASE}f_${pad(i)}.webp`);
    if (this.manifest.depth) this.fetchInto(this.depth[i], `${SEQUENCE_BASE}d_${pad(i)}.webp`);
  }

  private fetchInto(slot: Slot, url: string) {
    if (slot.bitmap || slot.pending) return;
    slot.pending = true;
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.blob();
      })
      // flipped so it matches three's default texture orientation for <img> sources
      .then((b) => createImageBitmap(b, { imageOrientation: 'flipY' }))
      .then((bm) => {
        if (this.disposed || !slot.pending) {
          bm.close();
          return;
        }
        slot.bitmap = bm;
        slot.pending = false;
      })
      .catch(() => {
        slot.pending = false;
      });
  }

  private drop(slot: Slot) {
    slot.bitmap?.close();
    slot.bitmap = null;
    slot.pending = false;
  }
}
