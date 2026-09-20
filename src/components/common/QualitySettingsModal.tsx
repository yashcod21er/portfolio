import React from 'react';
import { useSystem } from '../../context/SystemContext';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import type { QualityTier } from '../../types/portfolio';
import { X, Sliders, Cpu, Activity, Volume2, VolumeX, CheckCircle } from 'lucide-react';

export const QualitySettingsModal: React.FC = () => {
  const {
    settingsModalOpen,
    setSettingsModalOpen,
    qualityTier,
    setQualityTier,
    effectiveTier,
    fps,
    dpr,
    particleCount,
    audioEnabled,
    toggleAudio,
  } = useSystem();

  const trapRef = useFocusTrap<HTMLDivElement>({
    isOpen: settingsModalOpen,
    onClose: () => setSettingsModalOpen(false),
  });

  if (!settingsModalOpen) return null;

  const tiers: { id: QualityTier; title: string; desc: string }[] = [
    {
      id: 'AUTO',
      title: 'Adaptive Auto (Recommended)',
      desc: 'Monitors real-time FPS and automatically lowers DPR & particles if performance dips.',
    },
    {
      id: 'HIGH',
      title: 'High Fidelity 3D',
      desc: 'Full 3D island, volumetric lighting, bloom, dense particle cloud, 1.5x DPR.',
    },
    {
      id: 'MEDIUM',
      title: 'Balanced Performance',
      desc: 'Optimized particle count, clean lighting, smooth 1.2x DPR for standard laptops.',
    },
    {
      id: 'LOW',
      title: 'Lightweight 3D',
      desc: 'Streamlined meshes, 50 particles, 1.0x DPR for battery saving or older devices.',
    },
    {
      id: 'OFF',
      title: 'WebGL Off (2D Vector)',
      desc: 'Disables 3D canvas entirely and activates the responsive 2D vector graphics engine.',
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
    >
      <div
        ref={trapRef}
        className="w-full max-w-lg rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] p-6 shadow-[0_0_50px_rgba(57,223,255,0.15)] overflow-hidden relative animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] border border-[var(--accent-cyan)]/30 flex items-center justify-center text-[var(--accent-cyan)]">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 id="settings-modal-title" className="text-base font-bold font-mono text-[var(--text-primary)] tracking-wider">
                SYSTEM CONFIGURATION
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">Manage graphics engine &amp; session telemetry</p>
            </div>
          </div>
          <button
            onClick={() => setSettingsModalOpen(false)}
            className="w-8 h-8 rounded-lg border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent-cyan)]/50 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Measured Metrics Bar */}
        <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-color)] mb-5">
          <div>
            <div className="text-[10px] font-mono text-[var(--text-muted)] flex items-center gap-1">
              <Activity className="w-3 h-3 text-[var(--accent-cyan)]" /> REAL FPS
            </div>
            <div className="text-sm font-mono font-bold text-[var(--accent-cyan)]">{fps} FPS</div>
          </div>
          <div>
            <div className="text-[10px] font-mono text-[var(--text-muted)] flex items-center gap-1">
              <Cpu className="w-3 h-3 text-[var(--accent-violet)]" /> ACTIVE TIER
            </div>
            <div className="text-sm font-mono font-bold text-[var(--accent-violet)]">{effectiveTier}</div>
          </div>
          <div>
            <div className="text-[10px] font-mono text-[var(--text-muted)]">CANVAS DPR</div>
            <div className="text-sm font-mono font-bold text-[var(--text-primary)]">{dpr}x ({particleCount} pts)</div>
          </div>
        </div>

        {/* Quality Tiers List */}
        <div className="space-y-2 mb-6 max-h-[260px] overflow-y-auto pr-1">
          {tiers.map((t) => {
            const isSelected = qualityTier === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setQualityTier(t.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all flex items-start justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--bg-elevated)] border-[var(--accent-cyan)] shadow-[0_0_15px_rgba(57,223,255,0.15)]'
                    : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-[var(--accent-cyan)]/40 hover:bg-[var(--bg-elevated)]'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[var(--text-primary)]">{t.title}</span>
                    {isSelected && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)] font-mono font-bold">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-1">{t.desc}</p>
                </div>
                {isSelected && <CheckCircle className="w-4 h-4 text-[var(--accent-cyan)] shrink-0 mt-0.5" />}
              </button>
            );
          })}
        </div>

        {/* Audio Toggle */}
        <div className="flex items-center justify-between pt-4 border-t border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            {audioEnabled ? (
              <Volume2 className="w-4 h-4 text-[var(--accent-cyan)]" />
            ) : (
              <VolumeX className="w-4 h-4 text-[var(--text-muted)]" />
            )}
            <div>
              <div className="text-xs font-mono font-semibold text-[var(--text-primary)]">Synthesized UI Audio</div>
              <div className="text-[10px] text-[var(--text-muted)]">Subtle procedural Web Audio feedback</div>
            </div>
          </div>
          <button
            onClick={toggleAudio}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold transition-colors cursor-pointer ${
              audioEnabled
                ? 'bg-[var(--accent-cyan)]/20 border-[var(--accent-cyan)] text-[var(--accent-cyan)]'
                : 'bg-[var(--bg-elevated)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {audioEnabled ? 'ENABLED' : 'MUTED'}
          </button>
        </div>
      </div>
    </div>
  );
};
