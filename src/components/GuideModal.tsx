import React from 'react';
import { X, BookOpen, Sun, Moon, Shield, Zap, Crosshair, AlertTriangle } from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div id="guide-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm select-none">
      <div
        id="guide-modal-content"
        className="flex flex-col w-full max-w-2xl max-h-[85vh] bg-slate-900 border border-slate-750 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100">
                Manual de Sobrevivência Urbana
              </h2>
              <p className="text-xs text-slate-400">
                Mecânicas fundamentais, atalhos de controle e dicas vitais
              </p>
            </div>
          </div>

          <button
            id="guide-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-4 text-xs text-slate-300">
          {/* Controls Guide */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <h3 className="text-sm font-bold text-slate-100 mb-3 flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-amber-400" /> Controles & Teclas
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
              <div><span className="text-amber-400 font-bold">[W, A, S, D]</span>: Mover Sobrevivente em 3D</div>
              <div><span className="text-amber-400 font-bold">[Shift]</span>: Correr (consome estamina)</div>
              <div><span className="text-amber-400 font-bold">[Botão Direito]</span>: 🔄 Girar Câmera 3D (Arrastar)</div>
              <div><span className="text-amber-400 font-bold">[Mouse Esquerdo]</span>: Disparar / Golpear / Construir</div>
              <div><span className="text-amber-400 font-bold">[F]</span>: 👊 Bater Curta Distância (Soco/Empurrão)</div>
              <div><span className="text-amber-400 font-bold">[E]</span>: Abrir/Fechar Portas e Saquear</div>
              <div><span className="text-amber-400 font-bold">[R]</span>: Recarregar munição</div>
              <div><span className="text-amber-400 font-bold">[T / L]</span>: Ligar / Desligar Lanterna 3D</div>
              <div><span className="text-amber-400 font-bold">[V]</span>: Alternar Câmera 3D</div>
              <div><span className="text-amber-400 font-bold">[Scroll Mouse]</span>: Zoom da Câmera 3D</div>
              <div><span className="text-amber-400 font-bold">[1 a 5]</span>: Cinto de Acesso Rápido</div>
              <div><span className="text-amber-400 font-bold">[Tab / I]</span>: Abrir Inventário & Mochila</div>
              <div><span className="text-amber-400 font-bold">[C]</span>: Abrir Bancada de Crafting</div>
              <div><span className="text-amber-400 font-bold">[B]</span>: Abrir Modo Construção</div>
              <div><span className="text-amber-400 font-bold">[K]</span>: Habilidades com XP acumulada</div>
              <div><span className="text-amber-400 font-bold">[M]</span>: Minimapa da Cidade</div>
              <div><span className="text-amber-400 font-bold">[O]</span>: Configurações (Sensibilidade & Volume)</div>
            </div>
          </div>

          {/* Survival Rules */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5 mb-1.5">
                <Sun className="w-4 h-4" /> Ciclo Dia & Noite Dinâmico
              </h4>
              <p className="leading-relaxed">
                Durante o dia, os infectados caminham devagar. Aproveite para revistar o supermercado, farmácia e delegacia. À noite (20h às 05h), a escuridão reina e os zumbis entram em frenesi assassino como corredores vorazes com olhos vermelhos brilhantes!
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <h4 className="text-xs font-bold text-sky-400 flex items-center gap-1.5 mb-1.5">
                <Shield className="w-4 h-4" /> Fortificação de Bases
              </h4>
              <p className="leading-relaxed">
                Transforme qualquer casa em uma fortaleza: coloque barricadas de madeira ou aço nas portas e janelas, instale armadilhas de espinhos no solo e posicione baús e coletores de água da chuva para estocar suprimentos.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <h4 className="text-xs font-bold text-rose-400 flex items-center gap-1.5 mb-1.5">
              <AlertTriangle className="w-4 h-4" /> Fome, Sede e Infecção
            </h4>
            <p className="leading-relaxed">
              Mantenha-se alimentado e hidratado. Se a sede ou fome chegarem a 0, sua saúde começará a declinar rapidamente. Mordidas de zumbis podem introduzir o vírus em seu sangue; utilize antibióticos ou kits médicos para não sucumbir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
