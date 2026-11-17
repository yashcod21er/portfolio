import * as THREE from 'three';

/** World palette (sRGB hex, as in DESIGN.md). THREE.Color converts these to linear. */
export const HEX = {
  ink: '#070506',
  signal: '#ff2a1f',
  signalDeep: '#8f0d0a',
  bone: '#f3ece8',
  /** fog / horizon haze: the void with a hint of signal-deep */
  fog: '#170708',
  /** the faint cool fill */
  cool: '#7f9fd6',
} as const;

export const FOG_DENSITY = 0.03;

/** Linear colour for shader uniforms. */
export const lin = (hex: string) => new THREE.Color(hex);

export const isCoarsePointer = () =>
  typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

/** Shared GLSL helpers (hash + value noise + exp² fog). */
export const glslCommon = /* glsl */ `
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fogAmount(float dist, float density) {
  float k = density * dist;
  return 1.0 - exp(-k * k);
}
`;
