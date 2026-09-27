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
      desc: 'Monitors real-time FPS and dynamically scales DPR and geometry if performance dips.',
    },
    {
      id: 'HIGH',
      title: 'Studio High Fidelity',
      desc: 'Full procedural 3D workstation, daylight soft shadows, dynamic monitor canvas, 1.5x DPR.',
    },
    {
      id: 'MEDIUM',
      title: 'Balanced Studio',
      desc: 'Optimized lighting, clean materials, and smooth 1.2x DPR for standard laptops.',
    },
    {
      id: 'LOW',
      title: 'Lightweight 3D',
      desc: 'Essential workstation meshes and 1.0x DPR for battery saving or older devices.',
    },
    {
      id: 'OFF',
      title: 'Architectural 2D Vector',
      desc: 'Disables 3D canvas and activates lightweight 2D studio vector illustration.',
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111318]/40 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div
        ref={trapRef}
        className="w-full max-w-lg rounded-2xl bg-[#FFFFFF] border border-[#DAD8D1] p-4 sm:p-6 shadow-2xl overflow-y-auto max-h-[90vh] relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#DAD8D1] pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#F6F5F0] border border-[#DAD8D1] flex items-center justify-center text-[#2563EB]">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 id="settings-modal-title" className="text-base font-bold font-mono text-[#111318] tracking-tight">
                STUDIO CONFIGURATION
              </h2>
              <p className="text-xs text-[#646873]">Manage 3D graphics engine &amp; audio telemetry</p>
            </div>
          </div>
          <button
            onClick={() => setSettingsModalOpen(false)}
            className="w-8 h-8 rounded-lg border border-[#DAD8D1] text-[#646873] hover:text-[#111318] hover:border-[#2563EB]/50 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Measured Metrics Bar */}
        <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-[#F6F5F0] border border-[#DAD8D1] mb-5">
          <div>
            <div className="text-[10px] font-mono text-[#8E929D] flex items-center gap-1">
              <Activity className="w-3 h-3 text-[#2563EB]" /> REAL FPS
            </div>
            <div className="text-sm font-mono font-bold text-[#2563EB]">{fps} FPS</div>
          </div>
          <div>
            <div className="text-[10px] font-mono text-[#8E929D] flex items-center gap-1">
              <Cpu className="w-3 h-3 text-[#4F46E5]" /> ACTIVE TIER
            </div>
            <div className="text-sm font-mono font-bold text-[#4F46E5]">{effectiveTier}</div>
          </div>
          <div>
            <div className="text-[10px] font-mono text-[#8E929D]">CANVAS DPR</div>
            <div className="text-sm font-mono font-bold text-[#111318]">{dpr}x ({particleCount} pts)</div>
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
                    ? 'bg-[#F6F5F0] border-[#2563EB]'
                    : 'bg-[#FFFFFF] border-[#DAD8D1] hover:border-[#B0ADA5] hover:bg-[#F6F5F0]/50'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#111318]">{t.title}</span>
                    {isSelected && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2563EB]/10 text-[#2563EB] font-mono font-bold">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#646873] mt-1">{t.desc}</p>
                </div>
                {isSelected && <CheckCircle className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />}
              </button>
            );
          })}
        </div>

        {/* Audio Toggle */}
        <div className="flex items-center justify-between pt-4 border-t border-[#DAD8D1]">
          <div className="flex items-center gap-2">
            {audioEnabled ? (
              <Volume2 className="w-4 h-4 text-[#2563EB]" />
            ) : (
              <VolumeX className="w-4 h-4 text-[#8E929D]" />
            )}
            <div>
              <div className="text-xs font-mono font-semibold text-[#111318]">Synthesized UI Audio</div>
              <div className="text-[10px] text-[#8E929D]">Subtle procedural Web Audio feedback</div>
            </div>
          </div>
          <button
            onClick={toggleAudio}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold transition-colors cursor-pointer ${
              audioEnabled
                ? 'bg-[#2563EB]/10 border-[#2563EB] text-[#2563EB]'
                : 'bg-[#F6F5F0] border-[#DAD8D1] text-[#646873] hover:text-[#111318]'
            }`}
          >
            {audioEnabled ? 'ENABLED' : 'MUTED'}
          </button>
        </div>
      </div>
    </div>
  );
};
