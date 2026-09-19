import React, { useState } from 'react';
import { Container, Item, PlayerStats } from '../types/game';
import { X, Backpack, ArrowRightLeft, Trash2, Heart, Zap, Shield, AlertTriangle, Crosshair, Utensils, Droplet } from 'lucide-react';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: Item[];
  quickSlots: (Item | null)[];
  activeSlotIndex: number;
  stats: PlayerStats;
  openContainer: Container | null;
  onUseItem: (item: Item, slotType: 'quick' | 'inventory', index: number) => void;
  onDropItem: (item: Item, slotType: 'quick' | 'inventory', index: number) => void;
  onEquipToQuickSlot: (invIdx: number, slotIdx: number) => void;
  onTransferFromContainer: (containerId: string, itemIdx: number) => void;
  onTransferToContainer: (item: Item, invIdx: number) => void;
  onTakeAllFromContainer: (containerId: string) => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  isOpen,
  onClose,
  inventory,
  quickSlots,
  activeSlotIndex,
  stats,
  openContainer,
  onUseItem,
  onDropItem,
  onEquipToQuickSlot,
  onTransferFromContainer,
  onTransferToContainer,
  onTakeAllFromContainer,
}) => {
  const [selectedItem, setSelectedItem] = useState<{
    item: Item;
    source: 'quick' | 'inventory' | 'container';
    index: number;
  } | null>(null);

  if (!isOpen) return null;

  const isOverweight = stats.weight > stats.maxWeight;

  return (
    <div id="inventory-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm select-none">
      <div
        id="inventory-modal-content"
        className="flex flex-col w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-750 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Backpack className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100">
                Inventário Tático de Sobrevivência
              </h2>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Capacidade de Carga:</span>
                <span
                  className={`font-mono font-bold ${
                    isOverweight ? 'text-rose-400 animate-pulse' : 'text-slate-200'
                  }`}
                >
                  {stats.weight} / {stats.maxWeight} kg
                </span>
                {isOverweight && (
                  <span className="flex items-center gap-1 text-[11px] text-rose-400 font-semibold">
                    <AlertTriangle className="w-3 h-3" /> Sobrecarga! Movimento e corrida lentos
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            id="inv-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Two Columns (Left = Player Inventory, Right = Container if open or Details) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 sm:p-6 overflow-y-auto">
          {/* LEFT: Quickbar + Backpack */}
          <div className="flex flex-col gap-4">
            {/* Quick Slots (Cinto de Acesso Rápido) */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Cinto de Acesso Rápido (Teclas 1 a 5)
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {quickSlots.map((item, idx) => {
                  const isSelected = selectedItem?.source === 'quick' && selectedItem.index === idx;
                  const isActiveInHand = idx === activeSlotIndex;

                  return (
                    <div
                      key={idx}
                      id={`inv-quick-slot-${idx}`}
                      onClick={() => item && setSelectedItem({ item, source: 'quick', index: idx })}
                      className={`relative flex flex-col items-center justify-center h-16 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-amber-400 bg-amber-500/20 shadow-lg shadow-amber-500/20'
                          : isActiveInHand
                          ? 'border-sky-500 bg-sky-950/40'
                          : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                      }`}
                    >
                      <span className="absolute top-1 left-1.5 text-[10px] font-bold text-slate-500">
                        {idx + 1}
                      </span>
                      {item ? (
                        <>
                          <span className="text-xs font-bold text-slate-200 text-center line-clamp-1 px-1">
                            {item.name}
                          </span>
                          {item.quantity > 1 && (
                            <span className="absolute bottom-1 right-1.5 text-[10px] font-bold text-amber-300">
                              x{item.quantity}
                            </span>
                          )}
                          {item.category === 'weapon' && item.clipSize && (
                            <span className="absolute bottom-1 right-1.5 text-[10px] font-bold text-sky-300">
                              {item.currentAmmo}/{item.clipSize}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-slate-600 font-mono">Vazio</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Backpack Items Grid */}
            <div className="flex-1 flex flex-col">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Mochila & Bolsos ({inventory.length} itens)
              </h3>
              <div className="flex-1 grid grid-cols-3 sm:grid-cols-4 gap-2 bg-slate-950/50 p-3 rounded-xl border border-slate-800 min-h-[220px] max-h-[340px] overflow-y-auto">
                {inventory.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center text-slate-500 text-xs py-8">
                    <span>Mochila vazia. Explore casas para encontrar suprimentos!</span>
                  </div>
                ) : (
                  inventory.map((item, idx) => {
                    const isSelected = selectedItem?.source === 'inventory' && selectedItem.index === idx;

                    return (
                      <div
                        key={idx}
                        id={`inv-backpack-slot-${idx}`}
                        onClick={() => setSelectedItem({ item, source: 'inventory', index: idx })}
                        className={`relative flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer h-20 text-center ${
                          isSelected
                            ? 'border-amber-400 bg-amber-500/20 shadow-lg'
                            : 'border-slate-800 bg-slate-900/90 hover:border-slate-700 hover:bg-slate-850'
                        }`}
                      >
                        <span className="text-xs font-bold text-slate-200 line-clamp-2 px-1">
                          {item.name}
                        </span>
                        <div className="absolute bottom-1 w-full flex items-center justify-between px-2 text-[10px] text-slate-400">
                          <span>{item.weight}kg</span>
                          {item.quantity > 1 && (
                            <span className="font-bold text-amber-300">x{item.quantity}</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Either Container Looting View OR Item Details Inspector */}
          <div className="flex flex-col gap-4 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-4">
            {openContainer ? (
              /* Open Container Loot View */
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-bold text-amber-400">
                      {openContainer.name}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {openContainer.items.length} itens encontrados neste compartimento
                    </p>
                  </div>
                  {openContainer.items.length > 0 && (
                    <button
                      id="container-take-all-btn"
                      onClick={() => onTakeAllFromContainer(openContainer.id)}
                      className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 text-xs font-bold transition-all"
                    >
                      Pegar Tudo
                    </button>
                  )}
                </div>

                <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800 max-h-[300px] overflow-y-auto">
                  {openContainer.items.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center text-slate-500 text-xs py-10">
                      <span>Compartimento vazio</span>
                    </div>
                  ) : (
                    openContainer.items.map((item, idx) => (
                      <div
                        key={idx}
                        id={`container-slot-${idx}`}
                        onClick={() => onTransferFromContainer(openContainer.id, idx)}
                        className="relative flex flex-col items-center justify-center p-2 rounded-xl border border-slate-800 bg-slate-900/90 hover:border-amber-400 hover:bg-amber-500/10 transition-all cursor-pointer h-20 text-center"
                      >
                        <span className="text-xs font-bold text-slate-200 line-clamp-2">
                          {item.name}
                        </span>
                        <div className="absolute bottom-1 w-full flex items-center justify-between px-2 text-[10px] text-slate-400">
                          <span>{item.weight}kg</span>
                          {item.quantity > 1 && (
                            <span className="font-bold text-amber-300">x{item.quantity}</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : null}

            {/* Selected Item Details Inspector */}
            <div className="flex-1 flex flex-col justify-between bg-slate-950/70 p-4 rounded-xl border border-slate-800">
              {selectedItem ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-100">
                        {selectedItem.item.name}
                      </h4>
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-slate-800 text-slate-300 mt-1">
                        {selectedItem.item.category}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-slate-400">
                      {selectedItem.item.weight} kg {selectedItem.item.quantity > 1 && `(Total: ${(selectedItem.item.weight * selectedItem.item.quantity).toFixed(1)}kg)`}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {selectedItem.item.description}
                  </p>

                  {/* Attributes Badges */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {selectedItem.item.damage !== undefined && (
                      <div className="flex items-center gap-1 text-rose-300">
                        <Crosshair className="w-3.5 h-3.5 text-rose-500" />
                        <span>Dano: {selectedItem.item.damage}</span>
                      </div>
                    )}
                    {selectedItem.item.foodRestore !== undefined && (
                      <div className="flex items-center gap-1 text-amber-300">
                        <Utensils className="w-3.5 h-3.5 text-amber-500" />
                        <span>Nutrição: +{selectedItem.item.foodRestore}%</span>
                      </div>
                    )}
                    {selectedItem.item.waterRestore !== undefined && (
                      <div className="flex items-center gap-1 text-sky-300">
                        <Droplet className="w-3.5 h-3.5 text-sky-400" />
                        <span>Hidratação: +{selectedItem.item.waterRestore}%</span>
                      </div>
                    )}
                    {selectedItem.item.healthRestore !== undefined && (
                      <div className="flex items-center gap-1 text-emerald-300">
                        <Heart className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Cura: +{selectedItem.item.healthRestore} HP</span>
                      </div>
                    )}
                    {selectedItem.item.infectionHeal !== undefined && (
                      <div className="flex items-center gap-1 text-purple-300">
                        <Shield className="w-3.5 h-3.5 text-purple-400" />
                        <span>Infecção: -{selectedItem.item.infectionHeal}%</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-800">
                    {['food', 'water', 'medical'].includes(selectedItem.item.category) && (
                      <button
                        id="inv-item-use-btn"
                        onClick={() => {
                          onUseItem(selectedItem.item, selectedItem.source as 'quick' | 'inventory', selectedItem.index);
                          setSelectedItem(null);
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md active:scale-95"
                      >
                        Consumir / Usar
                      </button>
                    )}

                    {selectedItem.source === 'inventory' && (
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-slate-400 mr-1">Equipar no Cinto:</span>
                        {[0, 1, 2, 3, 4].map(slotIdx => (
                          <button
                            key={slotIdx}
                            onClick={() => {
                              onEquipToQuickSlot(selectedItem.index, slotIdx);
                              setSelectedItem(null);
                            }}
                            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-amber-500/20 hover:border-amber-500 border border-slate-700 text-xs font-bold text-slate-200 transition-colors"
                          >
                            {slotIdx + 1}
                          </button>
                        ))}
                      </div>
                    )}

                    {openContainer && selectedItem.source === 'inventory' && (
                      <button
                        id="inv-item-store-btn"
                        onClick={() => {
                          onTransferToContainer(selectedItem.item, selectedItem.index);
                          setSelectedItem(null);
                        }}
                        className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        Guardar no Baú
                      </button>
                    )}

                    <button
                      id="inv-item-drop-btn"
                      onClick={() => {
                        onDropItem(selectedItem.item, selectedItem.source as 'quick' | 'inventory', selectedItem.index);
                        setSelectedItem(null);
                      }}
                      className="flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 text-rose-300 text-xs font-semibold transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Descartar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-500 text-xs py-12">
                  <Backpack className="w-8 h-8 mb-2 opacity-30" />
                  <span>Selecione um item para ver detalhes e ações</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
