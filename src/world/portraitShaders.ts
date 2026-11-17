import { glslCommon } from './config';

/**
 * Shared by the relief mesh and its point-cloud twin, so every particle starts exactly on
 * the surface it burns away from.
 *
 * Depth maps are white = near. `uBurn` is the dissolve front: a fragment / particle with
 * burnKey(uv) < uBurn has burnt (keys run ~0 at the frame edges → ~1 at the face, so the
 * portrait burns inward and his face goes last).
 */
const portraitCommon = /* glsl */ `
${glslCommon}
uniform sampler2D uColor;
uniform sampler2D uDepth;
uniform vec2 uSize;
uniform float uDepthScale;
uniform float uFocusDepth;
uniform vec2 uFace;
uniform float uBurn;
uniform float uTime;
uniform float uReveal;
uniform vec3 uRipple;
uniform vec3 uSignal;
uniform vec3 uSignalDeep;
uniform vec3 uBone;
uniform vec3 uFogColor;
uniform float uFogDensity;

const float ASPECT = 1.3333333;
const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);

float burnKey(vec2 uv) {
  vec2 d = (uv - uFace) * vec2(ASPECT, 1.0);
  float s = 1.0 - clamp(length(d) / 0.95, 0.0, 1.0);
  float n = vnoise(uv * 7.0) * 0.6 + vnoise(uv * 21.0 + 3.7) * 0.4;
  return s * 0.8 + n * 0.2;
}

/** Smoothed depth for the geometry (a blurred mip: soft, sculpted ramps at silhouettes). */
float reliefDepth(vec2 uv) {
  return textureLod(uDepth, uv, 1.6).r;
}

float ripple(vec2 uv) {
  if (uRipple.z < 0.0) return 0.0;
  float r = length((uv - uRipple.xy) * vec2(ASPECT, 1.0));
  float x = r - uRipple.z * 0.85;
  return sin(x * 46.0) * exp(-x * x * 70.0) * exp(-uRipple.z * 1.5);
}

float displaceZ(vec2 uv, float d) {
  return ((d - uFocusDepth) * uDepthScale + ripple(uv) * 0.08) * uReveal;
}

float figureMask(float d) {
  return smoothstep(0.4, 0.56, d);
}

/** Dissolve the rectangle: sides and top fade into fog, the bottom sinks into the dark. */
float edgeMask(vec2 uv) {
  return smoothstep(0.0, 0.14, uv.x) * smoothstep(1.0, 0.86, uv.x)
    * smoothstep(0.0, 0.3, uv.y) * smoothstep(1.0, 0.9, uv.y);
}

/** The photo, graded into the red world: crushed blacks, red shadows, skin kept readable. */
vec3 grade(vec3 c) {
  float l = dot(c, LUMA);
  float lp = pow(max(l, 0.0), 0.4545);
  lp = smoothstep(0.08, 0.95, lp);
  float lc = pow(lp, 2.2);
  vec3 shadow = vec3(0.012, 0.0006, 0.0006);
  vec3 mid = vec3(0.30, 0.018, 0.012);
  vec3 hi = vec3(0.86, 0.62, 0.55);
  vec3 duo = mix(mix(shadow, mid, smoothstep(0.0, 0.55, lp)), hi, smoothstep(0.5, 1.0, lp));
  vec3 natural = c * (lc / max(l, 1e-4)) * vec3(1.0, 0.8, 0.76);
  return mix(duo, natural, 0.4);
}
`;

export const reliefVert = /* glsl */ `
${portraitCommon}
varying vec2 vUv;
varying float vD;
varying vec3 vNormalW;
varying vec3 vWorld;
varying float vDist;

void main() {
  vUv = uv;
  float d = reliefDepth(uv);
  vD = d;
  float z = displaceZ(uv, d);
  vec2 e = vec2(1.0 / 140.0, 1.0 / 105.0);
  float zx1 = displaceZ(uv + vec2(e.x, 0.0), reliefDepth(uv + vec2(e.x, 0.0)));
  float zx0 = displaceZ(uv - vec2(e.x, 0.0), reliefDepth(uv - vec2(e.x, 0.0)));
  float zy1 = displaceZ(uv + vec2(0.0, e.y), reliefDepth(uv + vec2(0.0, e.y)));
  float zy0 = displaceZ(uv - vec2(0.0, e.y), reliefDepth(uv - vec2(0.0, e.y)));
  vec3 n = normalize(vec3(
    -(zx1 - zx0) / (2.0 * e.x * uSize.x),
    -(zy1 - zy0) / (2.0 * e.y * uSize.y),
    1.0
  ));
  vec4 wp = modelMatrix * vec4(position + vec3(0.0, 0.0, z), 1.0);
  vWorld = wp.xyz;
  vNormalW = normalize(mat3(modelMatrix) * n);
  vec4 mv = viewMatrix * wp;
  vDist = -mv.z;
  gl_Position = projectionMatrix * mv;
}
`;

export const reliefFrag = /* glsl */ `
${portraitCommon}
uniform vec3 uKeyDir;
uniform vec3 uFillDir;
uniform float uOpacity;
uniform vec4 uLight;
uniform vec4 uSweep;
uniform float uSweepX;
varying vec2 vUv;
varying float vD;
varying vec3 vNormalW;
varying vec3 vWorld;
varying float vDist;

void main() {
  // arrival: the signal is acquired top-down, behind a red scan front
  float rk = (1.0 - vUv.y) * 0.85 + vnoise(vUv * 11.0) * 0.15;
  float rv = uReveal * 1.2 - rk;
  if (rv < 0.0) discard;

  // scroll-out: burn inward from the edges
  float b = uBurn - burnKey(vUv);
  if (b > 0.0) discard;

  // a small negative LOD bias keeps the living portrait crisp under trilinear filtering
  vec3 tex = texture2D(uColor, vUv, -0.6).rgb;
  float fig = figureMask(vD);
  vec3 g = grade(tex);

  vec3 n = normalize(vNormalW);
  if (!gl_FrontFacing) n = -n;
  vec3 v = normalize(cameraPosition - vWorld);
  float wrap = clamp(dot(n, uKeyDir) * 0.5 + 0.5, 0.0, 1.0);
  float fres = pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 2.4);

  vec3 col = g * (0.42 + 0.85 * wrap * vec3(1.0, 0.42, 0.36));
  col += g * clamp(dot(n, uFillDir), 0.0, 1.0) * vec3(0.12, 0.17, 0.26);
  // red rim where the relief turns away: silhouettes, jaw, hair, shoulders
  col += uSignal * fres * (0.35 + 0.65 * wrap) * 2.8 * fig;

  // the sweep: every few seconds a red key rakes across his face from one side to the other
  if (uSweep.w > 0.001) {
    float sd = clamp(dot(n, uSweep.xyz), 0.0, 1.0);
    float band = exp(-pow((vUv.x - uSweepX) * 7.0, 2.0));
    col += uSignal * uSweep.w * fig * (sd * sd * (0.35 + 2.4 * fres) * 1.5 + band * sd * (0.6 + 0.4 * g.r) * 1.4);
  }

  // the cursor's flashlight: diffuse + a tight specular, falling off with distance
  if (uLight.w > 0.001) {
    vec3 lv = uLight.xyz - vWorld;
    float ld2 = dot(lv, lv);
    vec3 ldir = lv * inversesqrt(max(ld2, 1e-4));
    float att = 1.0 / (1.0 + ld2 * 0.4);
    float diff = clamp(dot(n, ldir), 0.0, 1.0);
    float spec = pow(clamp(dot(n, normalize(ldir + v)), 0.0, 1.0), 28.0);
    vec3 lit = (g * 3.4 + 0.05) * diff * vec3(1.0, 0.34, 0.28) + uSignal * spec * 0.9;
    col += lit * att * uLight.w * mix(0.3, 1.0, fig);
  }

  // the room behind him: a red-black ghost
  float lum = dot(tex, LUMA);
  vec3 bg = uSignalDeep * lum * 0.16 * (0.6 + 0.4 * wrap) + vec3(0.002, 0.0006, 0.0006);
  col = mix(bg, col, fig);

  // a slow signal scan
  float sy = 1.15 - fract(uTime * 0.075) * 1.3;
  float scan = exp(-pow((vUv.y - sy) * 140.0, 2.0)) + 0.25 * exp(-pow((vUv.y - sy) * 22.0, 2.0));
  col += uSignal * scan * 1.4 * fig;

  // reveal front
  float rf = (1.0 - smoothstep(0.0, 0.06, rv)) * (1.0 - step(0.999, uReveal));
  col += uSignal * 4.0 * rf;

  // burn front: a white-hot seam inside a red glow, charred just behind it
  float ahead = -b;
  float glow = 1.0 - smoothstep(0.0, 0.05, ahead);
  float core = 1.0 - smoothstep(0.0, 0.02, ahead);
  col *= 1.0 - 0.6 * (1.0 - smoothstep(0.0, 0.16, ahead)) * (1.0 - glow);
  float fk = mix(0.25, 1.0, fig);
  col = mix(col, uSignal * 3.5, glow * 0.8 * fk);
  col += vec3(1.0, 0.5, 0.25) * 6.0 * core * fk;

  float alpha = edgeMask(vUv) * mix(0.55, 1.0, fig) * uOpacity;
  col = mix(col, uFogColor, fogAmount(vDist, uFogDensity));
  gl_FragColor = vec4(col, alpha);
}
`;

/** Point-cloud twin: invisible until the burn front releases it, then an ember. */
export const burstVert = /* glsl */ `
${portraitCommon}
attribute vec2 aUv;
attribute vec4 aRand;
uniform float uCell;
uniform float uViewScale;
varying vec3 vCol;
varying float vAlpha;

void main() {
  float age = uBurn - burnKey(aUv);
  if (age <= 0.0) {
    vCol = vec3(0.0);
    vAlpha = 0.0;
    gl_PointSize = 0.0;
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    return;
  }
  float d = reliefDepth(aUv);
  float fig = figureMask(d);
  vec3 base = vec3((aUv - 0.5) * uSize, displaceZ(aUv, d));

  // flight: outward from the face, most toward (and past) the camera, some ahead into the dark
  vec2 radial = normalize((aUv - uFace) * vec2(ASPECT, 1.0) + (aRand.xy - 0.5) * 0.5 + 1e-4);
  float a = age;
  float fwd = aRand.z < 0.7 ? 0.6 + 5.0 * aRand.w * aRand.w : -(3.0 + 9.0 * aRand.w);
  float kick = a * (1.0 + 1.5 * exp(-a * 3.0));
  vec3 p = base + vec3(radial * (0.35 + 1.7 * aRand.x), fwd) * kick;
  p.y += 0.4 * a * a * (0.25 + aRand.y);
  float sw = a * 0.5;
  p.x += sin(a * 2.3 + aRand.w * 6.283) * sw;
  p.y += cos(a * 1.9 + aRand.x * 6.283) * sw * 0.6;
  p.z += sin(a * 1.4 + aRand.y * 6.283) * sw * 0.5;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float dist = -mv.z;

  float spark = step(0.92, aRand.x);
  float heat = smoothstep(0.0, 0.2, a);
  float life = 1.0 - smoothstep(1.0 + aRand.y * 1.1, 2.3 + aRand.y * 0.9, a);
  float sizeW = uCell * mix(1.6, mix(0.5, 0.3, spark), smoothstep(0.0, 0.45, a));
  float ps = sizeW * uViewScale / max(dist, 0.05);
  gl_PointSize = clamp(ps, 1.0, 34.0);

  vec3 photo = grade(texture2D(uColor, aUv).rgb);
  vec3 ember = mix(uSignal * (1.4 + 2.6 * aRand.w), vec3(1.0, 0.48, 0.22) * 6.0, spark);
  vCol = mix(photo, ember, heat) * (1.0 - fogAmount(dist, uFogDensity));
  vAlpha = edgeMask(aUv) * mix(0.12, 1.0, fig) * life * smoothstep(0.12, 0.9, dist) * min(ps, 1.0);
}
`;

export const burstFrag = /* glsl */ `
varying vec3 vCol;
varying float vAlpha;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float r = dot(c, c) * 4.0;
  if (r > 1.0) discard;
  float a = exp(-r * 3.2) * vAlpha;
  gl_FragColor = vec4(vCol, a);
}
`;

/** Soft red backlight disc behind his head: bloom turns it into a halo. */
export const haloVert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const haloFrag = /* glsl */ `
uniform vec3 uSignal;
uniform float uIntensity;
uniform float uTime;
varying vec2 vUv;
void main() {
  vec2 p = vUv - 0.5;
  float r2 = dot(p, p);
  float pulse = 0.85 + 0.15 * sin(uTime * 0.9);
  float a = exp(-r2 * 70.0) * 0.75 + exp(-r2 * 16.0) * 0.12;
  gl_FragColor = vec4(uSignal * a * uIntensity * pulse, 1.0);
}
`;
