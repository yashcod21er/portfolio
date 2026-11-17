/**
 * Copy text to the clipboard. Must be called synchronously from a user gesture.
 * Resolves true when the text reached the clipboard, false when every route failed.
 */
export function copyText(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text).then(
      () => true,
      () => legacyCopy(text),
    );
  }
  return Promise.resolve(legacyCopy(text));
}

function legacyCopy(text: string): boolean {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    ta.style.pointerEvents = 'none';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

/** Select every character inside an element so the visitor can copy it by hand. */
export function selectContents(el: HTMLElement | null) {
  if (!el) return;
  const sel = window.getSelection();
  if (!sel) return;
  sel.removeAllRanges();
  const range = document.createRange();
  range.selectNodeContents(el);
  sel.addRange(range);
}

export function openExternal(href: string) {
  window.open(href, '_blank', 'noopener,noreferrer');
}

/** Strip protocol and trailing slash for display ("github.com/yashcod21er"). */
export const prettyUrl = (href: string) => href.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
