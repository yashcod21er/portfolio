#!/usr/bin/env node
/**
 * Turn a short clip of Yash into the hero's frame sequence.
 *
 *   npm run sequence -- <video> [--frames 96] [--width 1280] [--look 1-40 | --loop] [--focus 0.52,0.4] [--no-depth]
 *
 * Writes public/sequence/:
 *   f_001.webp …   colour frames (width px wide)
 *   d_001.webp …   depth maps (white = near), estimated locally with Depth Anything V2 (small)
 *   manifest.json  { frames, width, height, depth, look, focus }
 *
 * --look a-b   frames a..b (1-based, inclusive) are a "look left → right" turn: the hero
 *              scrubs them with the cursor. The remaining frames play as the hero scrolls.
 *              Without it, the whole clip plays on scroll.
 * --focus x,y  where the face is, in 0..1 from the top-left, so it stays framed when cropped.
 *
 * Everything runs on this computer: ffmpeg comes from ffmpeg-static, the depth model is
 * downloaded once from Hugging Face and cached. The video never leaves the machine.
 */
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import ffmpeg from 'ffmpeg-static';
import sharp from 'sharp';

const run = promisify(execFile);
const OUT = resolve('public/sequence');

// ---------- args ----------
const args = process.argv.slice(2);
const VALUE_FLAGS = new Set(['--frames', '--width', '--look', '--focus']);
const opts = {};
let input = null;
for (let i = 0; i < args.length; i++) {
  if (VALUE_FLAGS.has(args[i])) opts[args[i].slice(2)] = args[++i];
  else if (!args[i].startsWith('--') && !input) input = args[i];
}
const opt = (name, fallback) => opts[name] ?? fallback;
if (!input) {
  console.error('Usage: npm run sequence -- <video> [--frames 96] [--width 1280] [--look 1-40] [--focus 0.52,0.4] [--no-depth]');
  process.exit(1);
}
const FRAMES = Math.max(8, Math.min(240, parseInt(opt('frames', '96'), 10)));
const WIDTH = Math.max(320, Math.min(1920, parseInt(opt('width', '1280'), 10)));
const DEPTH = !args.includes('--no-depth');
// --loop: the clip plays on its own as a slow back-and-forth loop (a "living portrait")
// instead of being scrubbed by the cursor / scroll.
const LOOP = args.includes('--loop');
const lookArg = opt('look', null);
const look = lookArg ? lookArg.split('-').map((n) => parseInt(n, 10)) : null;
const focusArg = opt('focus', '0.52,0.4').split(',').map(Number);
const focus = { x: focusArg[0], y: focusArg[1] };

// ---------- 1. probe + extract evenly spaced frames ----------
async function duration(file) {
  // ffmpeg prints "Duration: 00:00:07.04" on stderr and exits non-zero without an output
  const res = await run(ffmpeg, ['-hide_banner', '-i', file]).catch((e) => e);
  const m = /Duration:\s*(\d+):(\d+):([\d.]+)/.exec(res.stderr ?? '');
  if (!m) throw new Error(`Could not read the video's duration: ${file}`);
  return +m[1] * 3600 + +m[2] * 60 + +m[3];
}

const tmp = await mkdtemp(join(tmpdir(), 'yh-seq-'));
try {
  const dur = await duration(input);
  console.log(`Clip: ${dur.toFixed(2)}s → ${FRAMES} frames at ${WIDTH}px wide`);
  await run(ffmpeg, [
    '-hide_banner', '-loglevel', 'error', '-i', input,
    '-vf', `fps=${FRAMES / dur},scale=${WIDTH}:-2:flags=lanczos`,
    '-frames:v', String(FRAMES), join(tmp, '%03d.png'),
  ]);
  const pngs = (await readdir(tmp)).filter((f) => f.endsWith('.png')).sort();
  if (!pngs.length) throw new Error('ffmpeg produced no frames.');

  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  // ---------- 2. colour frames ----------
  const meta = await sharp(join(tmp, pngs[0])).metadata();
  for (const [i, f] of pngs.entries()) {
    await sharp(join(tmp, f)).webp({ quality: 80 }).toFile(join(OUT, `f_${String(i + 1).padStart(3, '0')}.webp`));
  }
  console.log(`Wrote ${pngs.length} colour frames (${meta.width}×${meta.height}).`);

  // ---------- 3. depth maps, normalised across the whole clip so they don't flicker ----------
  if (DEPTH) {
    const { pipeline, RawImage } = await import('@huggingface/transformers');
    console.log('Loading Depth Anything V2 (small)… (downloaded once, then cached)');
    const estimate = await pipeline('depth-estimation', 'onnx-community/depth-anything-v2-small', { dtype: 'fp32' });
    const raw = [];
    for (const [i, f] of pngs.entries()) {
      const img = await RawImage.read(join(tmp, f));
      const { predicted_depth: d } = await estimate(img);
      const [h, w] = d.dims.slice(-2);
      raw.push({ w, h, data: Float32Array.from(d.data) });
      process.stdout.write(`\rDepth ${i + 1}/${pngs.length}`);
    }
    process.stdout.write('\n');
    // robust global range: 1st–99th percentile over a sample of every frame
    const sample = [];
    for (const r of raw) for (let j = 0; j < r.data.length; j += 97) sample.push(r.data[j]);
    sample.sort((a, b) => a - b);
    const lo = sample[Math.floor(sample.length * 0.01)];
    const hi = sample[Math.floor(sample.length * 0.99)];
    const DW = Math.min(512, WIDTH);
    for (const [i, r] of raw.entries()) {
      const px = new Uint8Array(r.w * r.h);
      for (let j = 0; j < px.length; j++) px[j] = Math.max(0, Math.min(255, Math.round(((r.data[j] - lo) / (hi - lo)) * 255)));
      await sharp(Buffer.from(px), { raw: { width: r.w, height: r.h, channels: 1 } })
        .resize(DW, Math.round((DW * meta.height) / meta.width))
        .blur(1)
        .webp({ quality: 85 })
        .toFile(join(OUT, `d_${String(i + 1).padStart(3, '0')}.webp`));
    }
    console.log(`Wrote ${raw.length} depth maps.`);
  }

  // ---------- 4. manifest ----------
  const manifest = {
    frames: pngs.length,
    width: meta.width,
    height: meta.height,
    depth: DEPTH,
    // stored 0-based, inclusive
    look: look ? [Math.max(0, look[0] - 1), Math.min(pngs.length - 1, look[1] - 1)] : null,
    loop: LOOP,
    // playback rate for loop mode, a little slower than the source for a calmer feel
    fps: Math.round((pngs.length / dur) * 0.8 * 10) / 10,
    focus,
  };
  await writeFile(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log('Wrote public/sequence/manifest.json:', manifest);
} finally {
  await rm(tmp, { recursive: true, force: true });
}
