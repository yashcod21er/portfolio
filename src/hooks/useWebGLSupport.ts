import { useState } from 'react';

function checkWebGL(): { isSupported: boolean; errorMessage: string | null } {
  if (typeof document === 'undefined') {
    return { isSupported: true, errorMessage: null };
  }
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');
    if (!gl) {
      return {
        isSupported: false,
        errorMessage: 'WebGL is not supported or is disabled in your browser.',
      };
    }
    return { isSupported: true, errorMessage: null };
  } catch (e) {
    return {
      isSupported: false,
      errorMessage: e instanceof Error ? e.message : 'Unknown WebGL initialization failure',
    };
  }
}

export function useWebGLSupport() {
  const [status] = useState<{ isSupported: boolean; errorMessage: string | null }>(checkWebGL);
  return status;
}
