import * as THREE from 'three';

/**
 * Glyph atlas for the "source lens": monospace characters drawn once on a 2D canvas,
 * measured for ink coverage and arranged as a grid of
 *   rows    = density bands (0 = blank … BANDS-1 = densest)
 *   columns = VARIANTS glyphs of similar density, so the shader can pick a different
 *             character per cell and the portrait reads as code, not as a halftone.
 * Glyphs are white on black; the shader reads the red channel as coverage.
 */

/** Atlas px per glyph cell. 2:3, the same aspect as the on-screen cell. */
const CELL_W = 48;
const CELL_H = 72;
export const GLYPH_BANDS = 14;
export const GLYPH_VARIANTS = 4;

/** Density ramp + the characters that make it read like source code. */
const CANDIDATES = `.,:;'\`-_~"^=+<>!?/\\|()[]{}*0123456789ifnrx#%&$@`;
const FONT_FAMILY = '"Geist Mono", ui-monospace, "Cascadia Code", Consolas, monospace';
const FONT = `500 58px ${FONT_FAMILY}`;

export interface GlyphAtlas {
  texture: THREE.CanvasTexture;
  /** (variants, bands) — grid size of the atlas */
  grid: THREE.Vector2;
}

/** Waits for Geist Mono (already requested by the page), then rasterises. Null if 2D canvas is unavailable. */
export async function createGlyphAtlas(): Promise<GlyphAtlas | null> {
  try {
    await document.fonts.load(FONT, CANDIDATES);
  } catch {
    // fall through to the monospace fallback in the stack
  }

  const glyphs = [...new Set(CANDIDATES)];

  // ---- measure ink coverage of every candidate
  const probe = document.createElement('canvas');
  probe.width = CELL_W;
  probe.height = CELL_H;
  const pctx = probe.getContext('2d', { willReadFrequently: true });
  if (!pctx) return null;
  pctx.font = FONT;
  pctx.textAlign = 'center';
  pctx.textBaseline = 'middle';
  const measured = glyphs.map((ch) => {
    pctx.clearRect(0, 0, CELL_W, CELL_H);
    pctx.fillStyle = '#fff';
    pctx.fillText(ch, CELL_W / 2, CELL_H / 2);
    const data = pctx.getImageData(0, 0, CELL_W, CELL_H).data;
    let sum = 0;
    for (let i = 3; i < data.length; i += 4) sum += data[i];
    return { ch, cover: sum };
  });
  const max = Math.max(...measured.map((m) => m.cover), 1);
  const norm = measured.map((m) => ({ ch: m.ch, n: m.cover / max }));

  // ---- pick VARIANTS glyphs closest to each band's target density
  const bands: string[][] = [];
  for (let b = 0; b < GLYPH_BANDS; b++) {
    if (b === 0) {
      bands.push(Array.from({ length: GLYPH_VARIANTS }, () => ' '));
      continue;
    }
    // slight gamma: more steps in the mid-tones where the face lives
    const target = Math.pow(b / (GLYPH_BANDS - 1), 1.15);
    const ranked = [...norm].sort((a, c) => Math.abs(a.n - target) - Math.abs(c.n - target));
    bands.push(ranked.slice(0, GLYPH_VARIANTS).map((g) => g.ch));
  }

  // ---- rasterise the grid
  const canvas = document.createElement('canvas');
  canvas.width = CELL_W * GLYPH_VARIANTS;
  canvas.height = CELL_H * GLYPH_BANDS;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  bands.forEach((row, b) => {
    row.forEach((ch, v) => {
      if (ch !== ' ') ctx.fillText(ch, v * CELL_W + CELL_W / 2, b * CELL_H + CELL_H / 2);
    });
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.NoColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return { texture, grid: new THREE.Vector2(GLYPH_VARIANTS, GLYPH_BANDS) };
}
