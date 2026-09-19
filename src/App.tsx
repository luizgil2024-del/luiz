import React, { useState, useEffect, useRef } from 'react';
import { GameEngine } from './game/gameEngine';
import { GameCanvas3D } from './components/GameCanvas3D';
import { HUD } from './components/HUD';
import { InventoryModal } from './components/InventoryModal';
import { CraftingModal } from './components/CraftingModal';
import { SkillsModal } from './components/SkillsModal';
import { BuildModal } from './components/BuildModal';
import { Minimap } from './components/Minimap';
import { GameOverModal } from './components/GameOverModal';
import { GuideModal } from './components/GuideModal';
import { SettingsModal } from './components/SettingsModal';
import { CraftingRecipe, Item, StructureType } from './types/game';
import { soundManager } from './audio/soundManager';
import { HelpCircle } from 'lucide-react';

export default function App() {
  const engineRef = useRef<GameEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = new GameEngine();
  }
  const engine = engineRef.current;

  // React state mirroring engine for UI re-renders
  const [stats, setStats] = useState(engine.player.stats);
  const [timeState, setTimeState] = useState(engine.timeState);
  const [level, setLevel] = useState(engine.player.level);
  const [xp, setXp] = useState(engine.player.xp);
  const [xpToNextLevel, setXpToNextLevel] = useState(engine.player.xpToNextLevel);
  const [skillPoints, setSkillPoints] = useState(engine.player.skillPoints);
  const [quickSlots, setQuickSlots] = useState([...engine.player.quickSlots]);
  const [inventory, setInventory] = useState([...engine.player.inventory]);
  const [activeSlotIndex, setActiveSlotIndex] = useState(engine.player.activeSlotIndex);
  const [flashlightOn, setFlashlightOn] = useState(engine.player.flashlightOn);
  const [isGameOver, setIsGameOver] = useState(engine.isGameOver);
  const [soundEnabled, setSoundEnabled] = useState(soundManager.enabled);

  // Settings: Camera Sensitivity & Volume (Persisted in localStorage)
  const [cameraSensitivity, setCameraSensitivity] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('zm_cam_sens');
      return saved ? parseFloat(saved) : 0.8;
    } catch {
      return 0.8;
    }
  });

  const [volume, setVolume] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('zm_game_vol');
      return saved ? parseFloat(saved) : 0.8;
    } catch {
      return 0.8;
    }
  });

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isCraftingOpen, setIsCraftingOpen] = useState(false);
  const [isSkillsOpen, setIsSkillsOpen] = useState(false);
  const [isBuildOpen, setIsBuildOpen] = useState(false);
  const [isMinimapOpen, setIsMinimapOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [openContainerId, setOpenContainerId] = useState<string | null>(null);

  // Sync initial soundManager volume on mount
  useEffect(() => {
    soundManager.setVolume(volume);
  }, []);

  // Active build ghost structure
  const [selectedBuildType, setSelectedBuildType] = useState<StructureType | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Sync state with engine at 10Hz for HUD/UI responsiveness without unnecessary re-renders
  useEffect(() => {
    let lastActiveSlot = -1;
    let lastQuickSlotsSig = '';
    let lastInvLength = -1;
    let lastWeight = -1;

    const interval = setInterval(() => {
      if (!engine) return;
      setStats({ ...engine.player.stats });
      setTimeState({ ...engine.timeState });
      setLevel(engine.player.level);
      setXp(engine.player.xp);
      setXpToNextLevel(engine.player.xpToNextLevel);
      setSkillPoints(engine.player.skillPoints);

      const qSig = engine.player.quickSlots.map(s => (s ? `${s.id}:${s.quantity}` : 'x')).join('|');
      if (qSig !== lastQuickSlotsSig) {
        lastQuickSlotsSig = qSig;
        setQuickSlots([...engine.player.quickSlots]);
      }

      if (engine.player.inventory.length !== lastInvLength || engine.player.stats.weight !== lastWeight) {
        lastInvLength = engine.player.inventory.length;
        lastWeight = engine.player.stats.weight;
        setInventory([...engine.player.inventory]);
      }

      if (engine.player.activeSlotIndex !== lastActiveSlot) {
        lastActiveSlot = engine.player.activeSlotIndex;
        setActiveSlotIndex(engine.player.activeSlotIndex);
      }

      setFlashlightOn(engine.player.flashlightOn);
      setIsGameOver(engine.isGameOver);
    }, 100);

    return () => clearInterval(interval);
  }, [engine]);

  // Global hotkeys for modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle inventory on Tab or I
      if (e.key === 'Tab' || e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        setIsInventoryOpen(prev => !prev);
      }
      // Toggle crafting on C
      if (e.key === 'c' || e.key === 'C') {
        setIsCraftingOpen(prev => !prev);
      }
      // Toggle build mode on B
      if (e.key === 'b' || e.key === 'B') {
        setIsBuildOpen(prev => !prev);
      }
      // Toggle skills on K
      if (e.key === 'k' || e.key === 'K') {
        setIsSkillsOpen(prev => !prev);
      }
      // Toggle minimap on M
      if (e.key === 'm' || e.key === 'M') {
        setIsMinimapOpen(prev => !prev);
      }
      // Sleep on Z
      if (e.key === 'z' || e.key === 'Z') {
        handleSleep();
      }
      // Settings on O
      if (e.key === 'o' || e.key === 'O') {
        setIsSettingsOpen(prev => !prev);
      }
      // Guide on H
      if (e.key === 'h' || e.key === 'H') {
        setIsGuideOpen(prev => !prev);
      }
      // Escape closes all open modals
      if (e.key === 'Escape') {
        setIsSettingsOpen(false);
        setIsInventoryOpen(false);
        setIsCraftingOpen(false);
        setIsSkillsOpen(false);
        setIsBuildOpen(false);
        setIsMinimapOpen(false);
        setIsGuideOpen(false);
        setOpenContainerId(null);
        setSelectedBuildType(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [engine]);

  const handleUseItem = (item: Item, slotType: 'quick' | 'inventory', index: number) => {
    engine.useItem(item, slotType, index);
    showToast(`Você consumiu ${item.name}`);
  };

  const handleDropItem = (item: Item, slotType: 'quick' | 'inventory', index: number) => {
    if (slotType === 'quick') {
      engine.player.quickSlots[index] = null;
    } else {
      engine.player.inventory.splice(index, 1);
    }
    // Spawn drop crate at player feet
    engine.containers.push({
      id: `drop_player_${Date.now()}`,
      name: 'Item Descartado',
      type: 'crate',
      x: engine.player.x - 15,
      y: engine.player.y - 15,
      width: 30,
      height: 30,
      items: [{ ...item }],
      searched: true,
    });
    engine.calculateWeight();
    showToast(`Você descartou ${item.name}`);
  };

  const handleEquipToQuickSlot = (invIdx: number, slotIdx: number) => {
    const item = engine.player.inventory[invIdx];
    if (!item) return;

    // Swap if slot has item
    const existingQuick = engine.player.quickSlots[slotIdx];
    engine.player.quickSlots[slotIdx] = { ...item };

    if (existingQuick) {
      engine.player.inventory[invIdx] = { ...existingQuick };
    } else {
      engine.player.inventory.splice(invIdx, 1);
    }

    engine.calculateWeight();
    showToast(`${item.name} equipado no atalho ${slotIdx + 1}`);
  };

  const handleTransferFromContainer = (containerId: string, itemIdx: number) => {
    engine.transferItemFromContainer(containerId, itemIdx);
  };

  const handleTransferToContainer = (item: Item, invIdx: number) => {
    if (!openContainerId) return;
    const c = engine.containers.find(ct => ct.id === openContainerId);
    if (!c) return;

    c.items.push({ ...item });
    engine.player.inventory.splice(invIdx, 1);
    engine.calculateWeight();
    showToast(`${item.name} guardado em ${c.name}`);
  };

  const handleTakeAllFromContainer = (containerId: string) => {
    const c = engine.containers.find(ct => ct.id === containerId);
    if (!c) return;

    while (c.items.length > 0) {
      engine.transferItemFromContainer(containerId, 0);
    }
    showToast(`Todos os itens de ${c.name} foram recolhidos`);
  };

  const handleCraftItem = (recipe: CraftingRecipe) => {
    // Consume materials
    for (const mat of recipe.materials) {
      let needed = mat.quantity;

      // Deduct from backpack
      for (let i = engine.player.inventory.length - 1; i >= 0; i--) {
        const item = engine.player.inventory[i];
        if (item.id === mat.itemId) {
          const deduct = Math.min(needed, item.quantity);
          item.quantity -= deduct;
          needed -= deduct;
          if (item.quantity <= 0) {
            engine.player.inventory.splice(i, 1);
          }
          if (needed <= 0) break;
        }
      }

      // If still needed, deduct from quick slots
      if (needed > 0) {
        for (let i = 0; i < engine.player.quickSlots.length; i++) {
          const item = engine.player.quickSlots[i];
          if (item && item.id === mat.itemId) {
            const deduct = Math.min(needed, item.quantity);
            item.quantity -= deduct;
            needed -= deduct;
            if (item.quantity <= 0) {
              engine.player.quickSlots[i] = null;
            }
            if (needed <= 0) break;
          }
        }
      }
    }

    // Add crafted result item
    engine.addItemToInventory({ ...recipe.resultItem });
    engine.calculateWeight();
    engine.addXP(25);
    showToast(`Fabricado com sucesso: ${recipe.name}! (+25 XP)`);
  };

  const handleUpgradeSkill = (skillId: string) => {
    const success = engine.upgradeSkill(skillId);
    if (success) {
      const skillName = engine.player.skills[skillId]?.name || skillId;
      showToast(`Habilidade ${skillName} aprimorada com sucesso!`);
    }
  };

  const handleSleep = () => {
    const res = engine.sleepUntilMorning();
    showToast(res.message);
  };

  const handleRestart = () => {
    engineRef.current = new GameEngine();
    setIsGameOver(false);
    setIsInventoryOpen(false);
    setIsCraftingOpen(false);
    setIsSkillsOpen(false);
    setIsBuildOpen(false);
    setIsMinimapOpen(false);
    setSelectedBuildType(null);
    showToast('Nova jornada de sobrevivência iniciada. Boa sorte!');
  };

  const handleCameraSensitivityChange = (val: number) => {
    const clamped = Math.max(0.1, Math.min(2.5, val));
    setCameraSensitivity(clamped);
    try {
      localStorage.setItem('zm_cam_sens', clamped.toString());
    } catch {}
  };

  const handleVolumeChange = (val: number) => {
    const clamped = Math.max(0, Math.min(1.0, val));
    setVolume(clamped);
    soundManager.setVolume(clamped);
    try {
      localStorage.setItem('zm_game_vol', clamped.toString());
    } catch {}
  };

  const handleToggleSound = () => {
    const next = !soundManager.enabled;
    soundManager.setEnabled(next);
    setSoundEnabled(next);
    showToast(next ? 'Efeitos sonoros ativados' : 'Sons desativados');
  };

  // Find active building name
  const currentBuilding = engine.buildings.find(b => b.id === engine.player.currentBuildingId);
  const openContainer = engine.containers.find(c => c.id === openContainerId) || null;

  return (
    <div id="game-root" className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      {/* 3D WebGL Three.js Renderer */}
      <GameCanvas3D
        engine={engine}
        selectedBuildType={selectedBuildType}
        cameraSensitivity={cameraSensitivity}
        onOpenContainer={cId => {
          setOpenContainerId(cId);
          setIsInventoryOpen(true);
        }}
        onStructurePlaced={() => {
          showToast('Estrutura fortificada construída com sucesso!');
          setSelectedBuildType(null);
        }}
      />

      {/* Heads-Up Display (HUD) */}
      <HUD
        stats={stats}
        timeState={timeState}
        level={level}
        xp={xp}
        xpToNextLevel={xpToNextLevel}
        skillPoints={skillPoints}
        quickSlots={quickSlots}
        activeSlotIndex={activeSlotIndex}
        currentBuildingName={currentBuilding ? currentBuilding.name : null}
        flashlightOn={flashlightOn}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenInventory={() => setIsInventoryOpen(true)}
        onOpenCrafting={() => setIsCraftingOpen(true)}
        onOpenSkills={() => setIsSkillsOpen(true)}
        onOpenBuild={() => setIsBuildOpen(true)}
        onSleep={handleSleep}
        onToggleMinimap={() => setIsMinimapOpen(true)}
      />

      {/* Guide button floating in corner */}
      <button
        id="hud-guide-btn"
        onClick={() => setIsGuideOpen(true)}
        title="Manual de Sobrevivência & Controles [H]"
        className="fixed bottom-4 left-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-amber-300 shadow-xl backdrop-blur-md transition-all active:scale-95 cursor-pointer"
      >
        <HelpCircle className="w-4 h-4 text-amber-400" />
        <span>Manual do Jogo</span>
      </button>

      {/* Ghost Build Mode Active Banner */}
      {selectedBuildType && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-4 py-2 rounded-xl bg-emerald-950/90 border border-emerald-500 text-emerald-200 text-xs font-bold shadow-2xl backdrop-blur-md animate-pulse">
          <span>Modo Construção: Clique com o mouse para posicionar a estrutura.</span>
          <button
            onClick={() => setSelectedBuildType(null)}
            className="px-2 py-0.5 rounded bg-emerald-800 hover:bg-emerald-700 text-white text-[11px]"
          >
            Cancelar [ESC]
          </button>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div
          id="game-toast"
          className="fixed top-20 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-xl bg-slate-900/95 border border-slate-750 text-slate-100 text-xs font-semibold shadow-2xl backdrop-blur-md transition-all animate-fade-in"
        >
          {toastMessage}
        </div>
      )}

      {/* Modals */}
      <InventoryModal
        isOpen={isInventoryOpen}
        onClose={() => {
          setIsInventoryOpen(false);
          setOpenContainerId(null);
        }}
        inventory={inventory}
        quickSlots={quickSlots}
        activeSlotIndex={activeSlotIndex}
        stats={stats}
        openContainer={openContainer}
        onUseItem={handleUseItem}
        onDropItem={handleDropItem}
        onEquipToQuickSlot={handleEquipToQuickSlot}
        onTransferFromContainer={handleTransferFromContainer}
        onTransferToContainer={handleTransferToContainer}
        onTakeAllFromContainer={handleTakeAllFromContainer}
      />

      <CraftingModal
        isOpen={isCraftingOpen}
        onClose={() => setIsCraftingOpen(false)}
        inventory={inventory}
        quickSlots={quickSlots}
        skills={engine.player.skills}
        onCraftItem={handleCraftItem}
      />

      <SkillsModal
        isOpen={isSkillsOpen}
        onClose={() => setIsSkillsOpen(false)}
        level={level}
        xp={xp}
        xpToNextLevel={xpToNextLevel}
        skillPoints={skillPoints}
        skills={engine.player.skills}
        onUpgradeSkill={handleUpgradeSkill}
      />

      <BuildModal
        isOpen={isBuildOpen}
        onClose={() => setIsBuildOpen(false)}
        inventory={inventory}
        quickSlots={quickSlots}
        onSelectStructure={type => setSelectedBuildType(type)}
        onOpenCrafting={() => {
          setIsBuildOpen(false);
          setIsCraftingOpen(true);
        }}
      />

      <Minimap
        isOpen={isMinimapOpen}
        onClose={() => setIsMinimapOpen(false)}
        engine={engine}
      />

      <GuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        cameraSensitivity={cameraSensitivity}
        onChangeCameraSensitivity={handleCameraSensitivityChange}
        volume={volume}
        onChangeVolume={handleVolumeChange}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />

      <GameOverModal
        isOpen={isGameOver}
        daysSurvived={engine.player.daysSurvived}
        kills={engine.player.kills}
        level={engine.player.level}
        onRestart={handleRestart}
      />
    </div>
  );
}
