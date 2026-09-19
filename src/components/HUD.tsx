import React from 'react';
import { PlayerStats, TimeState, Item } from '../types/game';
import { 
  Heart, 
  Zap, 
  Utensils, 
  Droplet, 
  Skull, 
  Volume2, 
  VolumeX, 
  Sun, 
  Moon, 
  Backpack, 
  Hammer, 
  Award, 
  Shield, 
  MapPin, 
  Flashlight, 
  Bed, 
  Clock, 
  AlertTriangle,
  Settings
} from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface HUDProps {
  stats: PlayerStats;
  timeState: TimeState;
  level: number;
  xp: number;
  xpToNextLevel: number;
  skillPoints: number;
  quickSlots: (Item | null)[];
  activeSlotIndex: number;
  currentBuildingName: string | null;
  flashlightOn: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenSettings: () => void;
  onOpenInventory: () => void;
  onOpenCrafting: () => void;
  onOpenSkills: () => void;
  onOpenBuild: () => void;
  onSleep: () => void;
  onToggleMinimap: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  timeState,
  level,
  xp,
  xpToNextLevel,
  skillPoints,
  quickSlots,
  activeSlotIndex,
  currentBuildingName,
  flashlightOn,
  soundEnabled,
  onToggleSound,
  onOpenSettings,
  onOpenInventory,
  onOpenCrafting,
  onOpenSkills,
  onOpenBuild,
  onSleep,
  onToggleMinimap,
}) => {
  const formatTime = (timeHours: number) => {
    const hours = Math.floor(timeHours);
    const minutes = Math.floor((timeHours - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const isOverweight = stats.weight > stats.maxWeight;
  const isNight = timeState.isNight;
  const activeItem = quickSlots[activeSlotIndex];

  return (
    <div id="game-hud" className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 sm:p-4 z-10 text-slate-100 select-none">
      {/* TOP BAR */}
      <div className="flex items-start justify-between gap-2">
        {/* Left: Player Stats Card */}
        <div className="pointer-events-auto flex flex-col gap-2 bg-slate-950/85 backdrop-blur-md p-3 rounded-xl border border-slate-800 shadow-xl max-w-xs sm:max-w-sm">
          {/* Level & XP */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-400 font-bold text-xs">
                Nvl {level}
              </span>
              <span className="text-xs font-semibold text-slate-300">Sobrevivente</span>
            </div>
            {skillPoints > 0 && (
              <button
                id="hud-skill-points-btn"
                onClick={onOpenSkills}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500 text-emerald-400 text-xs font-bold animate-pulse hover:bg-emerald-500/30 transition-colors"
              >
                <Award className="w-3.5 h-3.5" />
                +{skillPoints} Pts
              </button>
            )}
          </div>

          {/* XP Progress */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-amber-400 h-full transition-all duration-300"
              style={{ width: `${Math.min(100, (xp / xpToNextLevel) * 100)}%` }}
            />
          </div>

          {/* Vital Meters */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 pt-1 text-xs">
            {/* HP */}
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center justify-between text-[11px] font-medium text-rose-300">
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> Vida
                </span>
                <span>{Math.round(stats.hp)} / {stats.maxHp}</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-rose-500 h-full transition-all duration-200"
                  style={{ width: `${Math.max(0, (stats.hp / stats.maxHp) * 100)}%` }}
                />
              </div>
            </div>

            {/* Stamina */}
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center justify-between text-[11px] font-medium text-emerald-300">
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-emerald-400 fill-emerald-400" /> Estamina
                </span>
                <span>{Math.round(stats.stamina)}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-400 h-full transition-all duration-100"
                  style={{ width: `${(stats.stamina / stats.maxStamina) * 100}%` }}
                />
              </div>
            </div>

            {/* Hunger */}
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center justify-between text-[11px] font-medium text-amber-300">
                <span className="flex items-center gap-1">
                  <Utensils className="w-3 h-3 text-amber-500" /> Fome
                </span>
                <span>{Math.round(stats.hunger)}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-200 ${stats.hunger < 25 ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`}
                  style={{ width: `${stats.hunger}%` }}
                />
              </div>
            </div>

            {/* Thirst */}
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center justify-between text-[11px] font-medium text-sky-300">
                <span className="flex items-center gap-1">
                  <Droplet className="w-3 h-3 text-sky-400 fill-sky-400" /> Sede
                </span>
                <span>{Math.round(stats.thirst)}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-200 ${stats.thirst < 25 ? 'bg-rose-500 animate-pulse' : 'bg-sky-400'}`}
                  style={{ width: `${stats.thirst}%` }}
                />
              </div>
            </div>
          </div>

          {/* Infection Warning if > 0 */}
          {stats.infection > 0 && (
            <div className="flex items-center justify-between px-2 py-1 rounded bg-purple-950/70 border border-purple-600/60 text-purple-300 text-[11px] font-medium">
              <span className="flex items-center gap-1">
                <Skull className="w-3.5 h-3.5 text-purple-400" /> Vírus no Sangue:
              </span>
              <span className="font-bold text-purple-200">{Math.round(stats.infection)}% (Use Antibióticos)</span>
            </div>
          )}
        </div>

        {/* Center: Day/Night Clock & Night Alert */}
        <div className="pointer-events-auto flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-slate-950/90 backdrop-blur-md border border-slate-800 shadow-xl text-sm font-semibold">
            <span className="text-amber-400 font-bold">Dia {timeState.day}</span>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1.5 text-slate-200">
              {isNight ? (
                <Moon className="w-4 h-4 text-indigo-400 animate-pulse" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
              <span className="font-mono text-xs">{formatTime(timeState.timeHours)}</span>
            </div>
          </div>

          {/* Location Badge */}
          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-900/80 border border-slate-800/80 text-[11px] text-slate-300 font-medium">
            <MapPin className="w-3 h-3 text-rose-400" />
            <span>{currentBuildingName || 'Ruas da Cidade'}</span>
          </div>

          {/* Night Frenzy Alert Banner */}
          {isNight && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-950/90 border border-red-600/70 text-red-300 text-xs font-bold animate-pulse shadow-lg">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
              <span>PERIGO NOTURNO: Infectados Ferozes e Letais!</span>
            </div>
          )}
        </div>

        {/* Right: Quick Action Modals & Audio Toggle */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Settings Button (Camera Sensitivity & Volume) */}
          <button
            id="hud-settings-btn"
            onClick={onOpenSettings}
            title="Configurações: Sensibilidade da Câmera & Volume de Som [O]"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-blue-500/40 text-blue-400 hover:text-blue-300 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            <span className="text-xs font-semibold text-slate-200">Ajustes</span>
          </button>

          <button
            id="hud-sound-toggle-btn"
            onClick={onToggleSound}
            title="Ativar/Desativar Som"
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all shadow-md cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          <button
            id="hud-sleep-btn"
            onClick={onSleep}
            title="Descansar até o amanhecer (Dentro de Casa Segura)"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900/90 border border-indigo-700/60 text-indigo-200 text-xs font-semibold transition-all shadow-md cursor-pointer"
          >
            <Bed className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dormir</span>
          </button>

          <button
            id="hud-map-btn"
            onClick={onToggleMinimap}
            title="Ver Minimapa da Cidade [M]"
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all shadow-md cursor-pointer"
          >
            <MapPin className="w-4 h-4 text-sky-400" />
          </button>
        </div>
      </div>

      {/* BOTTOM SECTION */}
      <div className="flex flex-col items-center gap-2">
        {/* Navigation Toolbar (Crafting, Build, Skills, Inventory) */}
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-2xl bg-slate-950/90 backdrop-blur-md border border-slate-800 shadow-2xl">
          <button
            id="hud-nav-inventory"
            onClick={onOpenInventory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-200 transition-all active:scale-95"
          >
            <Backpack className="w-3.5 h-3.5 text-amber-400" />
            <span>Inventário [Tab]</span>
          </button>

          <button
            id="hud-nav-crafting"
            onClick={onOpenCrafting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-200 transition-all active:scale-95"
          >
            <Hammer className="w-3.5 h-3.5 text-sky-400" />
            <span>Crafting [C]</span>
          </button>

          <button
            id="hud-nav-build"
            onClick={onOpenBuild}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-200 transition-all active:scale-95"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Construção [B]</span>
          </button>

          <button
            id="hud-nav-skills"
            onClick={onOpenSkills}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-200 transition-all active:scale-95"
          >
            <Award className="w-3.5 h-3.5 text-purple-400" />
            <span>Habilidades [K]</span>
          </button>
        </div>

        {/* Quickbar (Slots 1-5) & Weapon Ammo */}
        <div className="pointer-events-auto flex items-end gap-3">
          {/* Quick Slots */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-950/90 backdrop-blur-md border border-slate-800 shadow-2xl">
            {quickSlots.map((item, idx) => {
              const isSelected = idx === activeSlotIndex;
              return (
                <div
                  key={idx}
                  className={`relative flex flex-col items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-500 shadow-lg shadow-amber-500/20 scale-105'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80'
                  }`}
                >
                  <span className="absolute top-1 left-1.5 text-[9px] font-bold text-slate-400">
                    {idx + 1}
                  </span>
                  {item ? (
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-sm sm:text-base font-bold text-slate-200 truncate max-w-[42px]">
                        {item.name.slice(0, 4)}
                      </span>
                      {item.quantity > 1 && (
                        <span className="absolute bottom-1 right-1.5 text-[10px] font-bold text-amber-300">
                          x{item.quantity}
                        </span>
                      )}
                      {item.category === 'weapon' && item.clipSize !== undefined && (
                        <span className="absolute bottom-1 right-1.5 text-[10px] font-bold text-sky-300">
                          {item.currentAmmo}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-600 font-mono">-</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Active Weapon Ammo & Weight Card */}
          <div className="flex flex-col gap-1 p-2 rounded-xl bg-slate-950/90 border border-slate-800 text-xs shadow-xl min-w-[120px]">
            {activeItem && activeItem.category === 'weapon' && activeItem.clipSize ? (
              <div className="flex items-center justify-between gap-2 text-slate-200">
                <span className="text-slate-400 text-[11px]">Munição:</span>
                <span className="font-mono font-bold text-amber-400 text-sm">
                  {activeItem.currentAmmo} / {activeItem.clipSize}
                </span>
              </div>
            ) : null}

            {/* Inventory Weight */}
            <div className="flex items-center justify-between gap-2 text-slate-200">
              <span className="text-slate-400 text-[11px]">Carga:</span>
              <span
                className={`font-mono font-bold text-xs ${
                  isOverweight ? 'text-rose-400 animate-pulse' : 'text-slate-200'
                }`}
              >
                {stats.weight} / {stats.maxWeight} kg
              </span>
            </div>

            {/* Close-Range Melee Quick Strike */}
            <div className="flex items-center justify-between text-[11px] text-amber-300 pt-0.5 border-t border-slate-800">
              <span className="flex items-center gap-1 font-semibold">
                <span>👊</span> [F] / [Botão Dir.]
              </span>
              <span className="font-bold text-amber-400">Bater Curta Distância</span>
            </div>

            {/* Flashlight toggle */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5 border-t border-slate-800">
              <span className="flex items-center gap-1">
                <Flashlight className="w-3 h-3 text-amber-400" /> [T] Lanterna:
              </span>
              <span className={flashlightOn ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                {flashlightOn ? 'LIGADA' : 'DESLIGADA'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
