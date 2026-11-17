// Live progress bar for the local LTX-Video run.
//   node progress.mjs [log file]   (default: test.log next to this script)
// Phase 1: model download (bytes in the Docker cache volume vs the full model size).
// Phase 2: video generation (denoising steps parsed from the run's log).
import { execFile } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);
const here = dirname(fileURLToPath(import.meta.url));
const LOG = join(here, process.argv[2] ?? 'test.log');
const TOTAL = 19_049_290_416 + 3_846_853_108 + 2_493_856_863; // text encoder + video model + decoder
const W = 34;

const c = (n, s) => `\x1b[${n}m${s}\x1b[0m`;
const ochre = (s) => c('38;2;227;162;59', s);
const dim = (s) => c('2', s);
const gb = (b) => (b / 1e9).toFixed(2);
const fmt = (sec) => {
  if (!isFinite(sec) || sec < 0) return '--';
  const m = Math.floor(sec / 60), s = Math.round(sec % 60);
  return m ? `${m}m ${String(s).padStart(2, '0')}s` : `${s}s`;
};
const bar = (f) => {
  const n = Math.max(0, Math.min(W, Math.round(f * W)));
  return ochre('█'.repeat(n)) + dim('░'.repeat(W - n));
};

async function container() {
  const { stdout } = await run('docker', ['ps', '-q', '--filter', 'ancestor=yh-ltx']).catch(() => ({ stdout: '' }));
  return stdout.trim().split('\n')[0] || null;
}
// Downloaded = model files already in the cache when this container started
//            + bytes the container has received over the network since.
// (The Hub client stages chunks in a separate cache, so the files' own size lags behind.)
const base = new Map();
async function sh(id, cmd) {
  const { stdout } = await run('docker', ['exec', id, 'sh', '-c', cmd]).catch(() => ({ stdout: '0' }));
  return Number(stdout.trim()) || 0;
}
async function cacheBytes(id) {
  if (!base.has(id)) {
    base.set(id, await sh(id, "find /root/.cache/huggingface/hub -type f ! -name '*.incomplete' -printf '%s\\n' 2>/dev/null | awk '{s+=$1} END {print s+0}'"));
  }
  const rx = await sh(id, "awk '/eth0/ {print $2}' /proc/net/dev");
  return base.get(id) + rx;
}
function logState() {
  if (!existsSync(LOG)) return { stage: 'waiting' };
  const text = readFileSync(LOG, 'utf8');
  const lines = text.split(/\r|\n/).filter((l) => l.trim());
  const saved = lines.find((l) => l.startsWith('Saved '));
  if (saved) return { stage: 'done', line: saved };
  if (/Traceback|Error:/.test(text) && !/Generating/.test(text.split('Traceback')[0] ?? '')) {
    const err = lines.filter((l) => /Error/.test(l)).pop();
    if (err) return { stage: 'error', line: err };
  }
  const gen = text.lastIndexOf('Generating');
  if (gen >= 0) {
    const after = text.slice(gen).split(/\r|\n/);
    let step = 0, steps = 0;
    for (const l of after) {
      const m = /(\d+)\/(\d+) \[/.exec(l);
      if (m) { step = +m[1]; steps = +m[2]; }
    }
    if (/generated in/.test(text)) return { stage: 'saving' };
    return { stage: 'generate', step, steps, header: after[0].trim() };
  }
  return { stage: 'download' };
}

let prev = null;
let speed = 0;
let last = '';
const started = Date.now();

async function tick() {
  const id = await container();
  const st = logState();
  let out;
  if (st.stage === 'done') {
    out = `${ochre('✔ Done')}  ${st.line}`;
  } else if (st.stage === 'error') {
    out = `${c('31', '✖ Stopped')}  ${st.line}`;
  } else if (!id) {
    out = dim('Waiting for the generator container to start…');
  } else if (st.stage === 'download') {
    const now = Date.now();
    const bytes = await cacheBytes(id);
    if (prev) {
      const inst = Math.max(0, ((bytes - prev.bytes) / (now - prev.t)) * 1000);
      speed = speed ? speed * 0.8 + inst * 0.2 : inst;
    }
    prev = { bytes, t: now };
    const f = Math.min(bytes / TOTAL, 1);
    const left = Math.max(TOTAL - bytes, 0);
    const eta = f >= 0.999 ? 'loading…' : speed > 1e5 ? `~${fmt(left / speed)} left` : 'measuring…';
    out =
      `${c('1', 'Download')} ${bar(f)} ${String(Math.round(f * 100)).padStart(3)}% ` +
      `${gb(bytes)}/${gb(TOTAL)} GB ${dim('·')} ${(speed / 1e6).toFixed(1)} MB/s ${dim('·')} ${eta}`;
  } else if (st.stage === 'generate') {
    const f = st.steps ? st.step / st.steps : 0;
    out =
      `${c('1', 'Generate')} ${bar(f)} ${String(Math.round(f * 100)).padStart(3)}% ` +
      `step ${st.step}/${st.steps || '?'}`;
  } else if (st.stage === 'saving') {
    out = `${c('1', 'Saving')}   ${bar(1)} decoding frames…`;
  } else {
    out = dim('Starting…');
  }
  let line = `${out} ${dim(fmt((Date.now() - started) / 1000))}`;
  // never wider than the panel, or \r can't rewrite the wrapped line in place
  const cols = (process.stdout.columns || 100) - 1;
  // eslint-disable-next-line no-control-regex
  const visible = line.replace(/\x1b\[[0-9;]*m/g, '');
  if (visible.length > cols) line = visible.slice(0, cols - 1) + '…';
  if (line !== last) {
    process.stdout.write('\r\x1b[2K' + line);
    last = line;
  }
  if (st.stage === 'done' || st.stage === 'error') {
    process.stdout.write('\n');
    process.exit(0);
  }
}

console.log(ochre('LTX-Video — your hero clip') + dim('   (updates every 2s · Ctrl+C to close)'));
await tick();
setInterval(tick, 2000);
