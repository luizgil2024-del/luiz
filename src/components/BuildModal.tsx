import React from 'react';
import { Item, StructureType } from '../types/game';
import { X, Shield, ShieldCheck, AlertTriangle, Archive, CloudRain, Flame, Moon, Sun, Hammer } from 'lucide-react';

interface BuildModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: Item[];
  quickSlots: (Item | null)[];
  onSelectStructure: (type: StructureType) => void;
  onOpenCrafting: () => void;
}

export const BuildModal: React.FC<BuildModalProps> = ({
  isOpen,
  onClose,
  inventory,
  quickSlots,
  onSelectStructure,
  onOpenCrafting,
}) => {
  if (!isOpen) return null;

  const getAllPlayerItems = (): Record<string, number> => {
    const counts: Record<string, number> = {};
    for (const item of inventory) {
      counts[item.id] = (counts[item.id] || 0) + item.quantity;
    }
    for (const item of quickSlots) {
      if (item) {
        counts[item.id] = (counts[item.id] || 0) + item.quantity;
      }
    }
    return counts;
  };

  const itemCounts = getAllPlayerItems();

  const STRUCTURES: {
    type: StructureType;
    name: string;
    description: string;
    icon: any;
    hp: number;
  }[] = [
    {
      type: 'barricade_wood',
      name: 'Barricada de Madeira',
      description: 'Bloqueia portas e janelas de casas contra o avanço de zumbis comuns.',
      icon: Shield,
      hp: 350,
    },
    {
      type: 'barricade_metal',
      name: 'Barricada Reforçada de Aço',
      description: 'Defesa blindada quase impenetrável contra hordas noturnas e invasores.',
      icon: ShieldCheck,
      hp: 800,
    },
    {
      type: 'spike_trap',
      name: 'Armadilha de Espinhos',
      description: 'Perfura e desacelera infectados que pisarem sobre os espetos pontiagudos.',
      icon: AlertTriangle,
      hp: 150,
    },
    {
      type: 'storage_chest',
      name: 'Baú de Suprimentos Seguro',
      description: 'Armazena armas, comida e recursos valiosos dentro do seu abrigo.',
      icon: Archive,
      hp: 300,
    },
    {
      type: 'rain_collector',
      name: 'Coletor de Água da Chuva',
      description: 'Coleta água potável continuamente para saciar sua sede.',
      icon: CloudRain,
      hp: 200,
    },
    {
      type: 'campfire',
      name: 'Fogueira de Sobrevivência',
      description: 'Ilumina a base, afasta a escuridão e permite cozinhar e ferver água.',
      icon: Flame,
      hp: 100,
    },
    {
      type: 'sleeping_bag',
      name: 'Saco de Dormir',
      description: 'Permite descansar em segurança dentro de sua base e passar a noite perigosa.',
      icon: Moon,
      hp: 100,
    },
    {
      type: 'spotlight',
      name: 'Holofote Defensivo 12V',
      description: 'Iluminação perimetral de alta intensidade para vigiar o pátio à noite.',
      icon: Sun,
      hp: 250,
    },
  ];

  return (
    <div id="build-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm select-none">
      <div
        id="build-modal-content"
        className="flex flex-col w-full max-w-2xl max-h-[85vh] bg-slate-900 border border-slate-750 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100">
                Modo Construção & Fortificação de Bases
              </h2>
              <p className="text-xs text-slate-400">
                Selecione uma estrutura para posicioná-la no mapa com o botão esquerdo do mouse
              </p>
            </div>
          </div>

          <button
            id="build-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Structure Selection Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 sm:p-6 overflow-y-auto max-h-[420px]">
          {STRUCTURES.map(st => {
            const Icon = st.icon;
            const quantityOwned = itemCounts[st.type] || 0;
            const hasItem = quantityOwned > 0;

            return (
              <div
                key={st.type}
                id={`build-card-${st.type}`}
                className={`flex flex-col justify-between p-4 rounded-xl border transition-all ${
                  hasItem
                    ? 'border-slate-800 bg-slate-950/70 hover:border-emerald-500 hover:bg-slate-850'
                    : 'border-slate-800/60 bg-slate-950/30 opacity-70'
                }`}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-slate-800 text-emerald-400">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-100">
                          {st.name}
                        </h4>
                        <span className="text-[10px] font-mono text-slate-400">
                          Resistência: {st.hp} HP
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                        hasItem
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {quantityOwned} no inventário
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {st.description}
                  </p>
                </div>

                <div className="pt-3 mt-2 border-t border-slate-800/80">
                  {hasItem ? (
                    <button
                      id={`select-build-${st.type}`}
                      onClick={() => {
                        onSelectStructure(st.type);
                        onClose();
                      }}
                      className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      Posicionar no Mapa (Clique para colocar)
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenCrafting();
                      }}
                      className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Hammer className="w-3.5 h-3.5 text-sky-400" />
                      Fabricar na Bancada
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
