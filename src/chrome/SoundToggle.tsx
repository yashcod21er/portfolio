import { sfx, useSound } from '../lib/sound';
import { cn } from '../lib/cn';
import { MusicToggleButton } from '../vendor/skiper/skiper25';

/**
 * Nav sound switch (skiper25 bars). role="switch" + name "Sound" → "Sound, switch, on/off".
 * The bars move only while audio is really running (a remembered "on" waits for a gesture).
 */
export function SoundToggle({ className, showLabel = false }: { className?: string; showLabel?: boolean }) {
  const enabled = useSound((s) => s.enabled);
  const playing = useSound((s) => s.playing);

  const toggle = () => {
    const next = !useSound.getState().enabled;
    if (!next) sfx.click(); // last sound before going quiet
    useSound.getState().setEnabled(next);
    if (next) window.setTimeout(() => sfx.click(), 30);
  };

  return (
    <MusicToggleButton
      checked={enabled}
      playing={playing}
      onToggle={toggle}
      onPointerEnter={() => sfx.hover()}
      label="Sound"
      className={cn('font-mono text-[11px] uppercase tracking-[0.12em]', className)}
    >
      {showLabel && <span aria-hidden="true">Sound</span>}
    </MusicToggleButton>
  );
}
