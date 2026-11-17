/** Full-screen quad: ignores the camera and writes clip space directly. */
export const quadVert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

/**
 * Glass shards (see shards.ts for the attributes). Every shard is a rigid plate:
 * scaled down a touch, spun in plane, hinged in 3D about the axis perpendicular to its
 * flight direction, pushed outward from the impact and pulled back into depth.
 * The projective w is built around each shard's own centre, so a tilted plate
 * foreshortens in place, and varyings stay perspective-correct across it.
 */
export const shardVert = /* glsl */ `
attribute vec2 aCenter;
attribute vec4 aParams;
attribute float aEdge;
uniform float uShatter;
uniform float uAspect;
varying vec2 vUv;
varying float vEdge;
varying vec2 vDir;
varying float vLight;
varying float vAmt;
varying float vRnd;

vec3 rotAxis(vec3 v, vec3 k, float a) {
  float c = cos(a);
  float s = sin(a);
  return v * c + cross(k, v) * s + k * dot(k, v) * (1.0 - c);
}

void main() {
  vec2 dir = aParams.xy;
  float rnd = aParams.z;
  float dn = aParams.w;
  // the elastic return overshoots below 0: let the plates press together only half as far
  float s = uShatter < 0.0 ? uShatter * 0.5 : uShatter;
  float fall = mix(1.0, 0.32, smoothstep(0.0, 0.9, dn));
  float r2 = fract(rnd * 7.31 + 0.17);
  float r3 = fract(rnd * 13.7 + 0.53);

  vec2 P = vec2(position.x * uAspect, position.y);
  vec2 C = vec2(aCenter.x * uAspect, aCenter.y);
  vec3 L = vec3(P - C, 0.0);

  L.xy *= 1.0 - (0.015 + 0.035 * r3) * fall * s;
  float spin = (rnd - 0.5) * 0.5 * fall * s;
  float cs = cos(spin);
  float sn = sin(spin);
  L.xy = mat2(cs, sn, -sn, cs) * L.xy;

  vec3 axis = vec3(-dir.y, dir.x, 0.0);
  // mostly a dent (inner edges sink), a few plates flip the other way
  float tilt = -(0.2 + 0.55 * r2) * fall * s * (r3 > 0.82 ? -1.0 : 1.0);
  L = rotAxis(L, axis, tilt);

  float push = (0.02 + 0.042 * rnd) * fall;
  vec2 Cn = C + dir * push * s;
  float z = L.z - 0.02 * fall * s;

  vec2 cUv = vec2(Cn.x / uAspect, Cn.y);
  vec2 vUvOut = vec2((Cn.x + L.x) / uAspect, Cn.y + L.y);
  vec2 clipC = cUv * 2.0 - 1.0;
  vec2 clipV = vUvOut * 2.0 - 1.0;
  float w = max(1.0 - z * 0.9, 0.2);
  gl_Position = vec4(clipC * w + (clipV - clipC), 0.0, w);

  vec3 n = rotAxis(vec3(0.0, 0.0, 1.0), axis, tilt);
  vec3 key = normalize(vec3(-0.45, 0.65, 0.6));
  vLight = clamp((dot(n, key) - key.z) * 4.0, -1.0, 1.0);
  vUv = position.xy;
  vEdge = aEdge;
  vDir = dir;
  vAmt = abs(s);
  vRnd = rnd;
}
`;

/**
 * Trail simulation (ping-pong, half-float).
 *  rg = flow velocity (signed, uv units), b = "ink" intensity used for ripples / aberration.
 * Each frame: self-advect a little, decay, then splat the pointer's motion as a gaussian.
 */
export const simFrag = /* glsl */ `
uniform sampler2D uPrev;
uniform vec2 uMouse;
uniform vec2 uDelta;
uniform float uAspect;
uniform float uDecay;
uniform float uRadius;
varying vec2 vUv;

void main() {
  vec4 here = texture2D(uPrev, vUv);
  vec4 prev = texture2D(uPrev, vUv - here.xy * 0.012);

  vec2 d = vUv - uMouse;
  d.x *= uAspect;
  float splat = exp(-dot(d, d) / uRadius);

  vec2 vel = prev.xy * uDecay + uDelta * splat;
  float ink = prev.z * uDecay + min(length(uDelta) * 3.0, 1.0) * splat;

  gl_FragColor = vec4(clamp(vel, -1.0, 1.0), clamp(ink, 0.0, 1.0), 1.0);
}
`;

/**
 * Portrait. Shared by the full-screen quad and (with SHARD defined) the shard mesh;
 * vUv is always the canvas uv the fragment's *content* comes from.
 *  - cover-fit with a focal point (uFocus) so the face stays framed at any aspect
 *  - liquid displacement + ripple from the trail texture
 *  - chromatic aberration that scales with pointer speed / trail strength
 *  - intro zoom, hover zoom, scroll zoom
 *  - scroll dissolve: the image breaks into horizontal slices that drift sideways and thin out
 *  - source lens: a loupe around the pointer that re-renders the photo as monospace glyphs
 *    (barrel-magnified inside, a refraction band + ochre ring at the edge)
 *  - shards: crack rims, edge dispersion, facet light, impact flash
 *  - vignette + animated film grain
 */
export const portraitFrag = /* glsl */ `
uniform sampler2D uTex;
uniform sampler2D uTrail;
uniform sampler2D uAtlas;
uniform vec2 uRes;
uniform vec2 uImg;
uniform vec2 uFocus;
uniform vec3 uInk;
uniform vec3 uOchre;
uniform vec3 uBone;
uniform float uDpr;
uniform float uTime;
uniform float uScroll;
uniform float uIntro;
uniform float uIntroZoom;
uniform float uHover;
uniform float uVel;
uniform vec2 uLens;
uniform float uLensR;
uniform float uLensAmt;
uniform vec2 uCell;
uniform vec2 uGlyphGrid;
uniform float uCrack;
uniform float uFlash;
uniform vec2 uImpact;
// 3D relief: a depth map estimated from the photo (white = near), the head's turn
// (x/y in -1..1) and the strength (0 until the depth map has loaded).
uniform sampler2D uDepth;
uniform vec2 uTilt;
uniform float uRelief;
varying vec2 vUv;
#ifdef SHARD
varying float vEdge;
varying vec2 vDir;
varying float vLight;
varying float vAmt;
varying float vRnd;
#endif

const vec3 LUMA = vec3(0.299, 0.587, 0.114);

float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec2 coverScale() {
  float rs = uRes.x / uRes.y;
  float ri = uImg.x / uImg.y;
  return rs > ri ? vec2(1.0, ri / rs) : vec2(rs / ri, 1.0);
}

vec2 cover(vec2 uv) {
  vec2 s = coverScale();
  // same maths as CSS object-position, so the canvas lines up with the <img> it replaces
  vec2 c = uFocus * (1.0 - s) + 0.5 * s;
  return (uv - 0.5) * s + c;
}

// ---- 3D relief ----------------------------------------------------------------
// Depth of the face, which stays put while nearer and farther parts slide past it.
const float FOCUS_PLANE = 0.72;
// Largest image-uv shift at full turn, per unit of depth away from the focus plane.
const vec2 RELIEF_SHIFT = vec2(0.09, 0.06);

float depthAt(vec2 iuv) {
  return textureLod(uDepth, iuv, 0.0).r;
}

/**
 * Parallax with occlusion: find the image point whose own depth, shifted by the turn,
 * lands on this pixel. A few fixed-point steps settle near parts in front of far ones.
 */
vec2 relief(vec2 iuv) {
  if (uRelief < 0.001) return iuv;
  vec2 shift = uTilt * RELIEF_SHIFT * uRelief;
  vec2 p = iuv;
  for (int i = 0; i < 5; i++) {
    p = iuv - shift * (depthAt(p) - FOCUS_PLANE);
  }
  return p;
}

/** Light the relief: normals from the depth gradient, a key light that follows the turn. */
vec3 sculpt(vec3 col, vec2 p) {
  if (uRelief < 0.001) return col;
  vec2 e = vec2(1.5) / uImg;
  float dx = depthAt(p + vec2(e.x, 0.0)) - depthAt(p - vec2(e.x, 0.0));
  float dy = depthAt(p + vec2(0.0, e.y)) - depthAt(p - vec2(0.0, e.y));
  vec3 n = normalize(vec3(-dx * 9.0, -dy * 9.0, 1.0));
  vec3 L = normalize(vec3(uTilt * vec2(0.9, 0.7) + vec2(-0.25, 0.35), 0.75));
  float diff = dot(n, L);
  // keep the photo's own lighting; only add form on top
  col *= mix(1.0, 0.86 + 0.26 * diff, uRelief);
  // ochre rim where the surface turns away, on the side the light comes from
  float rim = pow(1.0 - n.z, 1.5) * clamp(dot(normalize(n.xy + 1e-5), normalize(L.xy + 1e-5)), 0.0, 1.0);
  col += uOchre * rim * 0.55 * uRelief;
  return col;
}

/** Full photo pipeline at content uv p; the trail is read at t. */
vec3 photo(vec2 p, vec2 t, float k, float zoom, vec2 extraCA) {
  vec4 tr = texture2D(uTrail, t);
  vec2 flow = tr.xy;
  float fl = length(flow);
  vec2 fdir = fl > 1e-4 ? flow / fl : vec2(0.0);
  float ripple = sin(tr.z * 16.0 - uTime * 5.0) * tr.z * 0.006;
  vec2 uv = p - (flow * 0.055 + fdir * ripple);
  uv = (uv - 0.5) / zoom + 0.5;
  vec2 iuv = relief(cover(uv));
  vec2 ca = flow * 0.02 + vec2(0.0035 * uVel + 0.012 * k, 0.0) + extraCA;
  float r = texture2D(uTex, iuv + ca).r;
  float g = texture2D(uTex, iuv).g;
  float b = texture2D(uTex, iuv - ca).b;
  return sculpt(vec3(r, g, b), iuv);
}

/** Box-filtered photo for one glyph cell (explicit LOD: safe inside branches). */
vec3 photoCell(vec2 p, float zoom, float lod) {
  vec2 flow = textureLod(uTrail, p, 0.0).xy;
  vec2 uv = p - flow * 0.055;
  uv = (uv - 0.5) / zoom + 0.5;
  return textureLod(uTex, relief(cover(uv)), lod).rgb;
}

void main() {
  float s = uScroll;
  float aspect = uRes.x / uRes.y;

  // --- slice dissolve -------------------------------------------------------
  float N = 16.0;
  float yy = vUv.y * N;
  float row = floor(yy);
  float local = fract(yy) - 0.5;
  float rnd = hash11(row + 7.0);
  float start = rnd * 0.4;
  float k = smoothstep(start, start + 0.6, s);
  float aa = N / uRes.y;
  float halfH = (0.5 + aa) * (1.0 - k);
  float mask = 1.0 - smoothstep(halfH - aa, halfH + aa, abs(local));

  vec2 uv = vUv;
  float sdir = mod(row, 2.0) * 2.0 - 1.0;
  uv.x += sdir * k * k * (0.06 + rnd * 0.16);
  vec2 slice = uv - vUv;

  // the relief needs a little bleed so turned edges never sample outside the photo
  float zoom = mix(uIntroZoom, 1.0, uIntro) * (1.0 + 0.035 * uHover) * (1.0 + 0.32 * s)
    * (1.0 + 0.06 * uRelief);

  // --- source lens geometry (content px, y up) -------------------------------
  vec2 px = vUv * uRes;
  vec2 dl = px - uLens;
  float dist = length(dl);
  float R = max(uLensR, 1.0);
  float rr = dist / R;
  // barrel inside (magnifies the centre), a thin compression band outside = refraction
  float warp = rr < 1.0 ? 0.8 + 0.2 * rr * rr : 1.0 - 0.06 * (1.0 - smoothstep(1.0, 1.22, rr));
  warp = mix(1.0, warp, uLensAmt);
  vec2 q = uLens + dl * warp;
  vec2 ldir = dist > 1e-3 ? dl / dist : vec2(0.0);
  float edgeBand = 1.0 - smoothstep(0.0, 24.0 * uDpr, abs(dist - R));
  vec2 extraCA = ldir * edgeBand * uLensAmt * 3.0 * uDpr / uRes;

  // glyph grid (continuous inside the lens, so its derivatives are well defined here)
  vec2 g = q / uCell;
  vec2 gdx = dFdx(g);
  vec2 gdy = dFdy(g);

#ifdef SHARD
  float edgePx = vEdge * uRes.y;
  // dispersion near the broken edges, along the shard's flight direction
  float nearEdge = (1.0 - smoothstep(0.0, 14.0 * uDpr, edgePx)) * clamp(vAmt * 2.5, 0.0, 1.0);
  extraCA += vDir * nearEdge * 7.0 * uDpr / uRes;
#endif

  vec3 col = photo(q / uRes + slice, vUv, k, zoom, extraCA);

  // --- source lens: the photo as code ---------------------------------------------
  float inner = uLensAmt * (1.0 - smoothstep(0.8, 1.0, rr));
  if (inner > 0.002) {
    vec2 cid = floor(g);
    vec2 cuv = fract(g);
    vec2 cc = (cid + 0.5) * uCell / uRes + slice;
    // mip level ~ one cell's footprint in texels
    vec2 texPerPx = coverScale() * uImg / (uRes * zoom);
    float lod = log2(max(max(uCell.x * texPerPx.x, uCell.y * texPerPx.y), 1.0)) - 0.5;
    vec3 pc = photoCell(cc, zoom, lod);
    vec3 pb = photoCell(cc, zoom, lod + 2.5);
    float lum = dot(pc, LUMA);
    float lb = dot(pb, LUMA);
    // local contrast, so glasses / jaw / collar carve out of the bright wall
    // with a floor, so the darkest areas (the sunglasses) stay faint dotted code, not a void
    float l = clamp(0.5 + (lum - 0.46) * 1.2 + (lum - lb) * 1.8, 0.09, 1.0);

    float h = hash12(cid + 17.0);
    float h2 = hash12(cid * 1.37 + 3.1);
    // a few cells keep "typing": they cycle through same-density glyphs
    float tick = floor(uTime * (1.5 + h2 * 5.0) + h * 10.0);
    float vsel = mix(h, hash12(cid + tick * 7.31), step(0.86, h2));
    float bands = uGlyphGrid.y;
    float band = clamp(floor(l * (bands - 1.0) + 0.5 + (h - 0.5) * 0.7), 0.0, bands - 1.0);
    float variant = min(floor(vsel * uGlyphGrid.x), uGlyphGrid.x - 1.0);
    vec2 auv = vec2((variant + cuv.x) / uGlyphGrid.x, 1.0 - (band + 1.0 - cuv.y) / bands);
    vec2 inv = 1.0 / uGlyphGrid;
    float glyph = textureGrad(uAtlas, auv, gdx * inv, gdy * inv).r;

    // a read-head sweeping down the lens
    float head = 1.0 - fract(uTime * 0.32);
    float rowN = (q.y - (uLens.y - R)) / (2.0 * R);
    float scan = exp(-pow((rowN - head) * 10.0, 2.0));

    vec3 tint = mix(uOchre, uBone, smoothstep(0.52, 0.93, l));
    tint *= (0.55 + 0.45 * smoothstep(0.0, 0.55, l)) * (1.0 + 0.4 * scan);
    vec3 bg = mix(uInk, pb, 0.07) + uOchre * scan * 0.035;
    vec3 code = mix(bg, tint, glyph);
    col = mix(col, code, inner);
  }

  // --- lens ring + four index ticks ------------------------------------------
  if (uLensAmt > 0.001) {
    float ringW = 1.1 * uDpr;
    float ring = 1.0 - smoothstep(ringW * 0.5, ringW * 0.5 + 1.0, abs(dist - R));
    float ang = atan(dl.y, dl.x);
    float quarter = abs(fract(ang / 1.5707963 + 0.5) - 0.5) * 1.5707963 * dist;
    float tick = (1.0 - smoothstep(0.5 * uDpr, 0.5 * uDpr + 1.0, quarter))
      * step(R - 9.0 * uDpr, dist) * step(dist, R);
    col = mix(col, uOchre, max(ring * 0.9, tick * 0.8) * uLensAmt);
  }

#ifdef SHARD
  // facet light: plates tilted toward the key light catch it, the rest fall into shade
  col *= 1.0 - 0.3 * max(-vLight, 0.0);
  float sp = dot(vUv * vec2(aspect, 1.0), vec2(0.876, 0.482));
  float streak = exp(-pow((sp - (vRnd * 2.2 + vLight * 0.35)) * 13.0, 2.0));
  col += uBone * (max(vLight, 0.0) * 0.18 + streak * 0.14 * clamp(vAmt * 2.0, 0.0, 1.0));
  // a dark bevel just inside a bright rim reads as glass thickness
  float rimW = 1.3 * uDpr;
  float rimA = (1.0 - smoothstep(0.3 * uDpr, rimW, edgePx)) * uCrack;
  float bevel = (smoothstep(rimW, rimW * 2.0, edgePx) - smoothstep(rimW * 2.5, rimW * 5.0, edgePx)) * uCrack;
  col *= 1.0 - 0.35 * bevel * clamp(vAmt * 3.0, 0.0, 1.0);
  col = mix(col, mix(uBone, vec3(1.0), 0.45), rimA * 0.9);
#endif

  // --- impact flash ------------------------------------------------------------
  vec2 di = (vUv - uImpact) * vec2(aspect, 1.0);
  col += uBone * uFlash * exp(-dot(di, di) / 0.006) * 0.5;

  // --- grade -------------------------------------------------------------------
  float vig = smoothstep(1.2, 0.35, length((vUv - 0.5) * vec2(1.0, 1.15)));
  col *= mix(0.8, 1.0, vig);
  float n = hash12(gl_FragCoord.xy + fract(uTime * 7.0) * 517.0) - 0.5;
  col += n * 0.05;

  col = mix(uInk, col, mask);
  float alpha = 1.0;
#ifdef SHARD
  // analytic anti-aliasing of the broken edges (the canvas has no MSAA)
  alpha = smoothstep(0.0, 0.9 * uDpr, edgePx);
#endif
  gl_FragColor = vec4(col, alpha);
}
`;
