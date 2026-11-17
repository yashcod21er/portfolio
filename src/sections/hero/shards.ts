import * as THREE from 'three';

/**
 * Glass shards for the hero "shatter": a Voronoi tessellation of the portrait seeded in
 * jittered rings around the impact point (small splinters near it, big panes far away,
 * which reads as radial + concentric fracture lines), each cell fan-triangulated into one
 * non-indexed BufferGeometry. The vertex shader moves every shard as a rigid plate.
 *
 * Space: "aspect space" — x in [0, aspect], y in [0, 1] (y up), so distances are isotropic
 * and measured in canvas heights.
 *
 * Per-vertex attributes
 *  position  (x, y, 0) canvas uv — where this vertex's content lives
 *  aCenter   shard centroid, canvas uv
 *  aParams   (dir.x, dir.y, random, normalised distance from impact)
 *  aEdge     distance to the shard's outer edge in canvas heights (exact: it is linear across
 *            each fan triangle and 0 on the edge), large on the canvas border so it gets no rim
 */

type V2 = [number, number];

const MIN_SHARDS = 44;
const MAX_SHARDS = 70;
const NO_RIM = 10;

/** Keep the part of `poly` on the near side of the bisector between seeds a and b. */
function clipBisector(poly: V2[], a: V2, b: V2): V2[] {
  const nx = b[0] - a[0];
  const ny = b[1] - a[1];
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  const side = (p: V2) => (p[0] - mx) * nx + (p[1] - my) * ny;
  const out: V2[] = [];
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    const sp = side(p);
    const sq = side(q);
    if (sp <= 0) out.push(p);
    if ((sp <= 0) !== (sq <= 0)) {
      const t = sp / (sp - sq);
      out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
    }
  }
  return out;
}

function centroid(poly: V2[]): { c: V2; area: number } {
  let a = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x0, y0] = poly[i];
    const [x1, y1] = poly[(i + 1) % poly.length];
    const cr = x0 * y1 - x1 * y0;
    a += cr;
    cx += (x0 + x1) * cr;
    cy += (y0 + y1) * cr;
  }
  a *= 0.5;
  if (Math.abs(a) < 1e-9) {
    const n = poly.length || 1;
    return { c: [poly.reduce((s, p) => s + p[0], 0) / n, poly.reduce((s, p) => s + p[1], 0) / n], area: 0 };
  }
  return { c: [cx / (6 * a), cy / (6 * a)], area: Math.abs(a) };
}

function seedsAround(o: V2, aspect: number, rand: () => number): V2[] {
  const inside = (p: V2, m: number) => p[0] > -m && p[0] < aspect + m && p[1] > -m && p[1] < 1 + m;
  const diag = Math.hypot(Math.max(o[0], aspect - o[0]), Math.max(o[1], 1 - o[1]));
  const seeds: V2[] = [];
  // ring radius grows faster than the angular count: shards get longer radially outward
  for (let k = 0, r = 0.028; r < diag * 1.25 && k < 14; k++, r *= 1.65) {
    const n = Math.min(5 + k, 10);
    const phase = rand() * Math.PI * 2;
    for (let j = 0; j < n; j++) {
      const th = phase + ((j + (rand() - 0.5) * 0.7) / n) * Math.PI * 2;
      const rr = r * (0.82 + rand() * 0.36);
      const p: V2 = [o[0] + Math.cos(th) * rr, o[1] + Math.sin(th) * rr];
      if (inside(p, 0.04)) seeds.push(p);
    }
  }
  // thin out (outermost first) or top up with random seeds to land in range
  while (seeds.length > MAX_SHARDS) {
    let far = 0;
    let fd = -1;
    for (let i = seeds.length - 1; i >= Math.max(0, seeds.length - 14); i--) {
      const d = Math.hypot(seeds[i][0] - o[0], seeds[i][1] - o[1]) * (0.8 + rand() * 0.4);
      if (d > fd) {
        fd = d;
        far = i;
      }
    }
    seeds.splice(far, 1);
  }
  while (seeds.length < MIN_SHARDS) seeds.push([rand() * aspect, rand()]);
  return seeds;
}

/**
 * @param origin impact point in canvas uv (y up), clamped into the canvas
 * @param aspect canvas width / height
 */
export function buildShardGeometry(origin: { x: number; y: number }, aspect: number, rand = Math.random) {
  const A = Math.max(aspect, 0.05);
  const o: V2 = [Math.min(Math.max(origin.x, 0), 1) * A, Math.min(Math.max(origin.y, 0), 1)];
  const seeds = seedsAround(o, A, rand);
  const rect: V2[] = [
    [0, 0],
    [A, 0],
    [A, 1],
    [0, 1],
  ];
  const far = Math.max(...rect.map((p) => Math.hypot(p[0] - o[0], p[1] - o[1])), 1e-3);
  const eps = 1e-5;
  const onBorder = (p: V2, q: V2) =>
    (Math.abs(p[0]) < eps && Math.abs(q[0]) < eps) ||
    (Math.abs(p[0] - A) < eps && Math.abs(q[0] - A) < eps) ||
    (Math.abs(p[1]) < eps && Math.abs(q[1]) < eps) ||
    (Math.abs(p[1] - 1) < eps && Math.abs(q[1] - 1) < eps);

  const pos: number[] = [];
  const center: number[] = [];
  const params: number[] = [];
  const edge: number[] = [];

  for (let i = 0; i < seeds.length; i++) {
    let poly = rect;
    for (let j = 0; j < seeds.length && poly.length > 2; j++) {
      if (j !== i) poly = clipBisector(poly, seeds[i], seeds[j]);
    }
    if (poly.length < 3) continue;
    const { c, area } = centroid(poly);
    if (area < 1e-6) continue;

    let dx = c[0] - o[0];
    let dy = c[1] - o[1];
    const dist = Math.hypot(dx, dy);
    if (dist < 1e-4) {
      const th = rand() * Math.PI * 2;
      dx = Math.cos(th);
      dy = Math.sin(th);
    } else {
      dx /= dist;
      dy /= dist;
    }
    const rnd = rand();
    const dn = Math.min(dist / far, 1);

    const vert = (p: V2, e: number) => {
      pos.push(p[0] / A, p[1], 0);
      center.push(c[0] / A, c[1]);
      params.push(dx, dy, rnd, dn);
      edge.push(e);
    };
    for (let k = 0; k < poly.length; k++) {
      const a = poly[k];
      const b = poly[(k + 1) % poly.length];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (len < 1e-7) continue;
      const border = onBorder(a, b);
      const h = Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) / len;
      vert(c, border ? NO_RIM : h);
      vert(a, border ? NO_RIM : 0);
      vert(b, border ? NO_RIM : 0);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geometry.setAttribute('aCenter', new THREE.Float32BufferAttribute(center, 2));
  geometry.setAttribute('aParams', new THREE.Float32BufferAttribute(params, 4));
  geometry.setAttribute('aEdge', new THREE.Float32BufferAttribute(edge, 1));
  return geometry;
}
