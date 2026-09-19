import React, { useEffect } from 'react';
import { X, Settings, Sliders, Volume2, VolumeX, Volume1, RotateCcw, Eye, PlayCircle } from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  cameraSensitivity: number;
  onChangeCameraSensitivity: (val: number) => void;
  volume: number;
  onChangeVolume: (val: number) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  cameraSensitivity,
  onChangeCameraSensitivity,
  volume,
  onChangeVolume,
  soundEnabled,
  onToggleSound,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sensitivityPercent = Math.round(cameraSensitivity * 100);
  const volumePercent = Math.round(volume * 100);

  const handleTestAudio = () => {
    soundManager.playTestSound();
  };

  const handleResetDefaults = () => {
    onChangeCameraSensitivity(1.0);
    onChangeVolume(0.8);
    if (!soundEnabled) onToggleSound();
    soundManager.playTestSound();
  };

  return (
    <div
      id="settings-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm select-none"
      onClick={onClose}
    >
      <div
        id="settings-modal-content"
        className="flex flex-col w-full max-w-lg bg-slate-900 border border-slate-750 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <Settings className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100">
                Configurações do Jogo
              </h2>
              <p className="text-xs text-slate-400">
                Ajuste a sensibilidade da câmera e o volume de áudio
              </p>
            </div>
          </div>

          <button
            id="settings-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Fechar [ESC]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {/* Section 1: Camera Sensitivity */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-100">
                <Sliders className="w-4 h-4 text-blue-400" />
                <span>Sensibilidade da Câmera</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-md bg-blue-500/20 border border-blue-500/40 text-blue-300 font-mono text-xs font-bold">
                {sensitivityPercent}% ({cameraSensitivity.toFixed(2)}x)
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Define a velocidade ao segurar e arrastar o <strong className="text-amber-300">Botão Direito do Mouse</strong> para girar a visão e a órbita da câmera 3D.
            </p>

            {/* Slider */}
            <div className="pt-2">
              <input
                id="camera-sensitivity-slider"
                type="range"
                min="0.2"
                max="2.0"
                step="0.05"
                value={cameraSensitivity}
                onChange={(e) => onChangeCameraSensitivity(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                <span>Muito Lenta (20%)</span>
                <span>Padrão (100%)</span>
                <span>Muito Rápida (200%)</span>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 pt-1">
              {[
                { label: 'Muito Baixa', val: 0.4 },
                { label: 'Baixa', val: 0.7 },
                { label: 'Padrão', val: 1.0 },
                { label: 'Alta', val: 1.4 },
                { label: 'Muito Alta', val: 1.8 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => onChangeCameraSensitivity(preset.val)}
                  className={`flex-1 py-1 px-1 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                    Math.abs(cameraSensitivity - preset.val) < 0.04
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-800/80 hover:bg-slate-750 text-slate-300'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Master Audio Volume */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-100">
                {!soundEnabled || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : volume < 0.5 ? (
                  <Volume1 className="w-4 h-4 text-amber-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                )}
                <span>Volume Geral do Jogo</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="settings-mute-toggle-btn"
                  onClick={onToggleSound}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                    soundEnabled
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                  }`}
                >
                  {soundEnabled ? 'Som Ativo' : 'Mudo'}
                </button>
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold">
                  {soundEnabled ? `${volumePercent}%` : '0%'}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Controla o volume de tiros, passos, zumbis, portas, ambiente noturno e impactos.
            </p>

            {/* Volume Slider */}
            <div className="pt-2">
              <input
                id="volume-slider"
                type="range"
                min="0"
                max="1.0"
                step="0.05"
                value={soundEnabled ? volume : 0}
                onChange={(e) => {
                  const newVol = parseFloat(e.target.value);
                  onChangeVolume(newVol);
                  if (!soundEnabled && newVol > 0) {
                    onToggleSound();
                  }
                }}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Quick Volume Presets & Test Sound */}
            <div className="flex items-center gap-2 pt-1">
              <div className="flex items-center gap-1 flex-1">
                {[
                  { label: '20%', val: 0.2 },
                  { label: '50%', val: 0.5 },
                  { label: '80%', val: 0.8 },
                  { label: '100%', val: 1.0 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => {
                      onChangeVolume(preset.val);
                      if (!soundEnabled) onToggleSound();
                    }}
                    className={`flex-1 py-1 px-1 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                      soundEnabled && Math.abs(volume - preset.val) < 0.04
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-slate-800/80 hover:bg-slate-750 text-slate-300'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Test Audio Button */}
              <button
                id="settings-test-audio-btn"
                onClick={handleTestAudio}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] font-medium border border-slate-700 transition-colors cursor-pointer"
                title="Tocar som de teste"
              >
                <PlayCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Testar</span>
              </button>
            </div>
          </div>

          {/* Quick Recap of Mouse Buttons */}
          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/70 text-[11px] text-slate-400 space-y-1">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-sky-400" />
              <span>Resumo dos Controles do Mouse:</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px]">
              <div><strong className="text-amber-300">Botão Direito:</strong> Mover & Girar a Câmera 3D</div>
              <div><strong className="text-indigo-300">Botão Esquerdo:</strong> Disparar / Golpear / Construir</div>
              <div><strong className="text-emerald-300">Tecla F:</strong> Soco / Empurrão Rápido</div>
              <div><strong className="text-cyan-300">Scroll:</strong> Zoom de Câmera</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/70">
          <button
            id="settings-reset-btn"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-xs font-semibold text-slate-300 transition-colors cursor-pointer active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Restaurar Padrões</span>
          </button>

          <button
            id="settings-confirm-btn"
            onClick={onClose}
            className="px-5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg transition-colors cursor-pointer active:scale-95"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
