import React, { useRef, useEffect } from 'react';
import { GameEngine } from '../game/gameEngine';
import { MAP_HEIGHT, MAP_WIDTH, STREETS } from '../game/mapData';
import { X, MapPin, Home, ShoppingCart, Cross, Shield, Wrench, Fuel } from 'lucide-react';

interface MinimapProps {
  isOpen: boolean;
  onClose: () => void;
  engine: GameEngine;
}

export const Minimap: React.FC<MinimapProps> = ({ isOpen, onClose, engine }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scaleX = canvas.width / MAP_WIDTH;
    const scaleY = canvas.height / MAP_HEIGHT;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Streets
    ctx.fillStyle = '#0f172a';
    for (const s of STREETS) {
      ctx.fillRect(s.x * scaleX, s.y * scaleY, s.width * scaleX, s.height * scaleY);
    }

    // Buildings
    for (const b of engine.buildings) {
      ctx.fillStyle = b.explored ? '#334155' : '#1e293b';
      ctx.fillRect(b.x * scaleX, b.y * scaleY, b.width * scaleX, b.height * scaleY);
      ctx.strokeStyle = b.explored ? '#38bdf8' : '#64748b';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(b.x * scaleX, b.y * scaleY, b.width * scaleX, b.height * scaleY);

      // Building Label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8px sans-serif';
      ctx.fillText(b.name.slice(0, 14), (b.x + 8) * scaleX, (b.y + 24) * scaleY);
    }

    // Placed Base Barricades / Structures
    ctx.fillStyle = '#22c55e';
    for (const bar of engine.barricades) {
      if (bar.hp > 0) {
        ctx.fillRect(bar.x * scaleX, bar.y * scaleY, 4, 4);
      }
    }

    // Zombies (Red dots)
    ctx.fillStyle = '#ef4444';
    for (const z of engine.zombies) {
      ctx.beginPath();
      ctx.arc(z.x * scaleX, z.y * scaleY, z.isNightFrenzied ? 3 : 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Player position (Cyan pulsing circle)
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(engine.player.x * scaleX, engine.player.y * scaleY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }, [isOpen, engine]);

  if (!isOpen) return null;

  return (
    <div id="minimap-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm select-none">
      <div
        id="minimap-modal-content"
        className="flex flex-col w-full max-w-2xl bg-slate-900 border border-slate-750 rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100">
                Mapa Urbano de Sobrevivência
              </h2>
              <p className="text-xs text-slate-400">
                Topografia da cidade, avenidas e localização dos pontos de interesse
              </p>
            </div>
          </div>

          <button
            id="minimap-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Canvas Display */}
        <div className="p-4 flex flex-col items-center">
          <div className="relative border-2 border-slate-700 rounded-xl overflow-hidden shadow-inner bg-slate-950">
            <canvas ref={canvasRef} width={580} height={480} className="block w-full max-w-[580px] h-auto" />
          </div>

          {/* Map Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-300 mt-4 pt-3 border-t border-slate-800 w-full">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-sky-400 border border-white" />
              <span>Você</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <span>Infectados</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-emerald-500" />
              <span>Suas Barricadas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm border border-sky-400 bg-slate-700" />
              <span>Casas / Edifícios</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
