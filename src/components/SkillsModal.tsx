import React from 'react';
import { SkillNode } from '../types/game';
import { X, Award, Plus, Check, Zap, Heart, Shield, Crosshair, Footprints, Wrench, ShieldAlert } from 'lucide-react';

interface SkillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  level: number;
  xp: number;
  xpToNextLevel: number;
  skillPoints: number;
  skills: Record<string, SkillNode>;
  onUpgradeSkill: (skillId: string) => void;
}

export const SkillsModal: React.FC<SkillsModalProps> = ({
  isOpen,
  onClose,
  level,
  xp,
  xpToNextLevel,
  skillPoints,
  skills,
  onUpgradeSkill,
}) => {
  if (!isOpen) return null;

  const getSkillIcon = (id: string) => {
    switch (id) {
      case 'survival': return Heart;
      case 'stealth': return Footprints;
      case 'athletics': return Zap;
      case 'combat': return Crosshair;
      case 'melee': return Crosshair;
      case 'engineering': return Wrench;
      case 'medicine': return ShieldAlert;
      default: return Award;
    }
  };

  return (
    <div id="skills-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm select-none">
      <div
        id="skills-modal-content"
        className="flex flex-col w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-750 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-100">
                  Progressão de Habilidades de Sobrevivência
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-purple-900/60 border border-purple-600/60 text-purple-300 font-bold text-xs">
                  Nível {level}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Experiência acumulada ao sobreviver, eliminar infectados, revistar casas e construir
              </p>
            </div>
          </div>

          <button
            id="skills-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* XP & Points Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-3 bg-slate-950/40 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-3 flex-1 min-w-[200px]">
            <span className="text-slate-400">Experiência:</span>
            <div className="flex-1 bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-purple-500 h-full transition-all duration-300"
                style={{ width: `${Math.min(100, (xp / xpToNextLevel) * 100)}%` }}
              />
            </div>
            <span className="font-mono text-slate-300 font-semibold">
              {xp} / {xpToNextLevel} XP
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold">
            <Award className="w-4 h-4 text-emerald-400" />
            <span>Pontos Disponíveis: {skillPoints}</span>
          </div>
        </div>

        {/* Skills Cards Grid */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 sm:p-6 overflow-y-auto max-h-[460px]">
          {Object.values(skills).map(skill => {
            const Icon = getSkillIcon(skill.id);
            const isMaxed = skill.level >= skill.maxLevel;
            const canUpgrade = skillPoints >= skill.cost && !isMaxed;

            return (
              <div
                key={skill.id}
                id={`skill-card-${skill.id}`}
                className="flex flex-col justify-between p-4 rounded-xl border border-slate-800 bg-slate-950/70 hover:border-slate-700 transition-all shadow-md"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-slate-800 text-slate-200">
                        <Icon className="w-4 h-4 text-purple-400" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-100">
                          {skill.name}
                        </h4>
                        {/* Level Pips */}
                        <div className="flex items-center gap-1 mt-1">
                          {Array.from({ length: skill.maxLevel }).map((_, i) => (
                            <div
                              key={i}
                              className={`w-3 h-1.5 rounded-sm transition-all ${
                                i < skill.level ? 'bg-purple-500' : 'bg-slate-800'
                              }`}
                            />
                          ))}
                          <span className="text-[10px] font-mono text-slate-400 ml-1">
                            {skill.level}/{skill.maxLevel}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {skill.description}
                  </p>

                  <p className="text-[11px] font-medium text-purple-300/90 bg-purple-950/30 p-2 rounded-lg border border-purple-900/40">
                    {skill.bonusText}
                  </p>
                </div>

                {/* Upgrade Button */}
                <div className="pt-3 mt-2 border-t border-slate-800/80">
                  {isMaxed ? (
                    <div className="flex items-center justify-center gap-1 text-xs font-bold text-emerald-400 py-1.5 rounded-lg bg-emerald-950/20 border border-emerald-900/30">
                      <Check className="w-3.5 h-3.5" /> Nível Máximo
                    </div>
                  ) : (
                    <button
                      id={`upgrade-btn-${skill.id}`}
                      disabled={!canUpgrade}
                      onClick={() => onUpgradeSkill(skill.id)}
                      className={`w-full py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                        canUpgrade
                          ? 'bg-purple-600 hover:bg-purple-500 text-white cursor-pointer shadow-md'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-750'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Aprimorar (Custa 1 Ponto)
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
