import { useEffect } from 'react';

export function useKeyboardShortcut(
  keyCombo: string,
  callback: (e: KeyboardEvent) => void,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      if (keyCombo.toLowerCase() === 'ctrl+k' || keyCombo.toLowerCase() === 'cmd+k') {
        if (isCtrlOrCmd && (e.key === 'k' || e.key === 'K')) {
          e.preventDefault();
          callback(e);
        }
      } else if (keyCombo.toLowerCase() === 'escape') {
        if (e.key === 'Escape') {
          callback(e);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keyCombo, callback, enabled]);
}
