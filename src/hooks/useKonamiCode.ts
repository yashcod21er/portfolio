import { useEffect, useRef } from 'react';

const KONAMI_SEQUENCE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
];

export function useKonamiCode(onSuccess: () => void) {
  const indexRef = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase() === 'b' ? 'b' : e.key.toLowerCase() === 'a' ? 'a' : e.key;

      if (key === KONAMI_SEQUENCE[indexRef.current]) {
        indexRef.current += 1;
        if (indexRef.current === KONAMI_SEQUENCE.length) {
          indexRef.current = 0;
          onSuccess();
        }
      } else {
        indexRef.current = 0;
        // Check if the current key could be the start of the sequence
        if (key === KONAMI_SEQUENCE[0]) {
          indexRef.current = 1;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSuccess]);
}
