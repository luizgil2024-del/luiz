import React, { useState } from 'react';
import { CraftingRecipe, Item } from '../types/game';
import { CRAFTING_RECIPES } from '../game/craftingData';
import { X, Hammer, Shield, Crosshair, Heart, Check, AlertCircle } from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface CraftingModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: Item[];
  quickSlots: (Item | null)[];
  skills: Record<string, { level: number }>;
  onCraftItem: (recipe: CraftingRecipe) => void;
}

export const CraftingModal: React.FC<CraftingModalProps> = ({
  isOpen,
  onClose,
  inventory,
  quickSlots,
  skills,
  onCraftItem,
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'survival' | 'weapons' | 'building' | 'ammo'>('all');
  const [selectedRecipe, setSelectedRecipe] = useState<CraftingRecipe | null>(CRAFTING_RECIPES[0]);

  if (!isOpen) return null;

  // Aggregate player items (both quickSlots and backpack)
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

  const playerItemCounts = getAllPlayerItems();

  const canCraft = (recipe: CraftingRecipe): { ok: boolean; reason?: string } => {
    // Check required skill
    if (recipe.requiredSkill) {
      const currentLevel = skills[recipe.requiredSkill.skillId]?.level || 0;
      if (currentLevel < recipe.requiredSkill.minLevel) {
        return {
          ok: false,
          reason: `Requer Habilidade de ${recipe.requiredSkill.skillId} Nível ${recipe.requiredSkill.minLevel}`,
        };
      }
    }

    // Check materials
    for (const mat of recipe.materials) {
      const owned = playerItemCounts[mat.itemId] || 0;
      if (owned < mat.quantity) {
        return { ok: false, reason: `Falta ${mat.quantity - owned}x ${mat.name}` };
      }
    }

    return { ok: true };
  };

  const filteredRecipes = CRAFTING_RECIPES.filter(
    r => activeCategory === 'all' || r.category === activeCategory
  );

  return (
    <div id="crafting-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm select-none">
      <div
        id="crafting-modal-content"
        className="flex flex-col w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-750 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400">
              <Hammer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100">
                Bancada de Fabricação & Fortificações
              </h2>
              <p className="text-xs text-slate-400">
                Crie defesas para sua base, armas improvisadas, remédios e munições
              </p>
            </div>
          </div>

          <button
            id="crafting-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Categories Tab Bar */}
        <div className="flex items-center gap-2 px-6 py-2.5 border-b border-slate-800 bg-slate-950/30 overflow-x-auto">
          {[
            { id: 'all', label: 'Todos', icon: Hammer },
            { id: 'survival', label: 'Sobrevivência', icon: Heart },
            { id: 'weapons', label: 'Armas', icon: Crosshair },
            { id: 'building', label: 'Construção & Base', icon: Shield },
            { id: 'ammo', label: 'Munições', icon: Crosshair },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                id={`craft-tab-${tab.id}`}
                onClick={() => setActiveCategory(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body: Left = Recipe List, Right = Recipe Inspector */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 sm:p-6 overflow-y-auto">
          {/* Recipes List */}
          <div className="flex flex-col gap-2 max-h-[420px] overflow-y-auto pr-1">
            {filteredRecipes.map(recipe => {
              const check = canCraft(recipe);
              const isSelected = selectedRecipe?.id === recipe.id;

              return (
                <div
                  key={recipe.id}
                  id={`recipe-card-${recipe.id}`}
                  onClick={() => setSelectedRecipe(recipe)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-sky-400 bg-sky-500/15 shadow-md'
                      : 'border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs sm:text-sm font-bold text-slate-100">
                      {recipe.name}
                    </span>
                    <span className="text-[11px] text-slate-400 line-clamp-1">
                      {recipe.description}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {check.ok ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30">
                        <Check className="w-3 h-3" /> Disponível
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-rose-400 px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20">
                        Faltam Itens
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recipe Inspector */}
          <div className="flex flex-col justify-between bg-slate-950/80 p-5 rounded-xl border border-slate-800">
            {selectedRecipe ? (
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    {selectedRecipe.name}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed mt-1">
                    {selectedRecipe.description}
                  </p>
                </div>

                {/* Materials Requirement List */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Materiais Necessários:
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {selectedRecipe.materials.map(mat => {
                      const owned = playerItemCounts[mat.itemId] || 0;
                      const hasEnough = owned >= mat.quantity;

                      return (
                        <div
                          key={mat.itemId}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs"
                        >
                          <span className="text-slate-200">{mat.name}</span>
                          <span
                            className={`font-mono font-bold ${
                              hasEnough ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {owned} / {mat.quantity}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Skill Requirement Notice if applicable */}
                {selectedRecipe.requiredSkill && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-950/40 border border-purple-800/40 text-xs text-purple-300">
                    <AlertCircle className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>
                      Exige Habilidade: {selectedRecipe.requiredSkill.skillId} Nível {selectedRecipe.requiredSkill.minLevel}
                    </span>
                  </div>
                )}

                {/* Craft Button */}
                <div className="pt-3 border-t border-slate-800">
                  {(() => {
                    const check = canCraft(selectedRecipe);
                    return (
                      <button
                        id="craft-action-btn"
                        disabled={!check.ok}
                        onClick={() => {
                          onCraftItem(selectedRecipe);
                          soundManager.playCraftHammer();
                        }}
                        className={`w-full py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-98 ${
                          check.ok
                            ? 'bg-sky-600 hover:bg-sky-500 text-white cursor-pointer'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-750'
                        }`}
                      >
                        <Hammer className="w-4 h-4" />
                        {check.ok ? `Fabricar ${selectedRecipe.name}` : check.reason}
                      </button>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-500 text-xs py-16">
                <span>Selecione uma receita à esquerda para ver os detalhes</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
