import React from 'react';
import { Skull, RefreshCw, Calendar, Target, Award } from 'lucide-react';

interface GameOverModalProps {
  isOpen: boolean;
  daysSurvived: number;
  kills: number;
  level: number;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  daysSurvived,
  kills,
  level,
  onRestart,
}) => {
  if (!isOpen) return null;

  return (
    <div id="game-over-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md select-none">
      <div
        id="game-over-card"
        className="flex flex-col items-center max-w-md w-full p-6 sm:p-8 rounded-3xl bg-slate-950 border border-rose-900/60 shadow-2xl text-center"
      >
        {/* Skull Icon */}
        <div className="w-16 h-16 rounded-full bg-rose-950/80 border border-rose-600/60 flex items-center justify-center text-rose-500 mb-4 shadow-lg shadow-rose-950/50 animate-bounce">
          <Skull className="w-9 h-9" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-black tracking-wider uppercase text-rose-500 mb-2">
          Você Sucumbiu à Infecção
        </h2>

        <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
          Seus sinais vitais cessaram nas ruas da cidade abandonada. A noite cobriu seu corpo enquanto os infectados continuam vagando.
        </p>

        {/* Stats Recap */}
        <div className="grid grid-cols-3 gap-3 w-full mb-6">
          <div className="flex flex-col items-center p-3 rounded-2xl bg-slate-900 border border-slate-800">
            <Calendar className="w-4 h-4 text-amber-400 mb-1" />
            <span className="text-lg font-mono font-bold text-slate-100">{daysSurvived}</span>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Dias Vivos</span>
          </div>

          <div className="flex flex-col items-center p-3 rounded-2xl bg-slate-900 border border-slate-800">
            <Target className="w-4 h-4 text-rose-400 mb-1" />
            <span className="text-lg font-mono font-bold text-slate-100">{kills}</span>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Abates</span>
          </div>

          <div className="flex flex-col items-center p-3 rounded-2xl bg-slate-900 border border-slate-800">
            <Award className="w-4 h-4 text-purple-400 mb-1" />
            <span className="text-lg font-mono font-bold text-slate-100">{level}</span>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Nível Final</span>
          </div>
        </div>

        {/* Restart Button */}
        <button
          id="game-over-restart-btn"
          onClick={onRestart}
          className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xl shadow-rose-600/30 active:scale-95 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          Reiniciar Nova Jornada de Sobrevivência
        </button>
      </div>
    </div>
  );
};
