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
      const target = e.target as HTMLElement | null;
      const isInputFocused =
        target &&
        (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable);

      const combo = keyCombo.toLowerCase();

      if (combo === 'ctrl+k' || combo === 'cmd+k') {
        if (isCtrlOrCmd && (e.key === 'k' || e.key === 'K')) {
          e.preventDefault();
          callback(e);
        }
      } else if (combo === 'escape') {
        if (e.key === 'Escape') {
          callback(e);
        }
      } else if (!isCtrlOrCmd && !e.altKey && !isInputFocused) {
        if (e.key.toLowerCase() === combo) {
          callback(e);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keyCombo, callback, enabled]);
}
