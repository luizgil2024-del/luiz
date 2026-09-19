export type ItemCategory = 'weapon' | 'ammo' | 'food' | 'water' | 'medical' | 'material' | 'tool' | 'structure';

export type WeaponType = 'melee' | 'pistol' | 'shotgun' | 'rifle' | 'throwable';

export interface Item {
  id: string;
  name: string;
  category: ItemCategory;
  description: string;
  weight: number; // in kg
  icon: string; // lucide icon identifier
  stackable: boolean;
  maxStack?: number;
  quantity: number;
  // Weapon props
  weaponType?: WeaponType;
  damage?: number;
  range?: number;
  fireRate?: number; // ms between shots/swings
  clipSize?: number;
  ammoType?: string;
  currentAmmo?: number;
  durability?: number;
  maxDurability?: number;
  noiseRadius?: number; // pixels that hear gunshot/swing
  spread?: number;
  pellets?: number;
  // Consumable props
  foodRestore?: number;
  waterRestore?: number;
  healthRestore?: number;
  infectionHeal?: number;
  spoiled?: boolean;
  // Structure to place
  structureType?: StructureType;
}

export type StructureType = 
  | 'barricade_wood' 
  | 'barricade_metal' 
  | 'spike_trap' 
  | 'storage_chest' 
  | 'rain_collector' 
  | 'campfire' 
  | 'sleeping_bag'
  | 'spotlight';

export interface InventorySlot {
  id: string;
  item: Item | null;
}

export interface Container {
  id: string;
  name: string;
  type: 'fridge' | 'cabinet' | 'trunk' | 'crate' | 'locker' | 'firstaid' | 'shelf' | 'toolbox' | 'stove';
  x: number;
  y: number;
  width: number;
  height: number;
  items: Item[];
  searched: boolean;
  buildingId?: string;
}

export interface Barricade {
  id: string;
  type: StructureType;
  x: number;
  y: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  isDoorOrWindow?: boolean;
  buildingId?: string;
  createdTime: number;
}

export interface PlacedStructure {
  id: string;
  type: StructureType;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  customData?: {
    waterStored?: number;
    maxWater?: number;
    items?: Item[];
    isActive?: boolean;
  };
}

export interface Room {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'living' | 'kitchen' | 'bedroom' | 'bathroom' | 'storage' | 'shop_floor' | 'office' | 'armory';
}

export interface Building {
  id: string;
  name: string;
  type: 'residential' | 'grocery' | 'pharmacy' | 'police' | 'hardware' | 'apartments' | 'gas_station';
  x: number;
  y: number;
  width: number;
  height: number;
  wallColor: string;
  roofColor: string;
  floorColor: string;
  doors: { x: number; y: number; width: number; height: number; isOpen: boolean; isBarricaded?: boolean; barricadeHp?: number }[];
  windows: { x: number; y: number; width: number; height: number; isBroken: boolean; isBarricaded?: boolean; barricadeHp?: number }[];
  rooms: Room[];
  explored: boolean;
}

export interface Vehicle {
  id: string;
  model: 'sedan' | 'cab' | 'police' | 'van' | 'pickup';
  x: number;
  y: number;
  angle: number;
  color: string;
  searched: boolean;
  items: Item[];
}

export interface Zombie {
  id: string;
  type: 'walker' | 'sprinter' | 'bloater' | 'crawler';
  x: number;
  y: number;
  angle: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  state: 'idle' | 'wandering' | 'investigating' | 'chasing' | 'attacking';
  targetX?: number;
  targetY?: number;
  targetSoundTime?: number;
  attackCooldown: number;
  detectionRange: number;
  isNightFrenzied: boolean;
  eyeGlowColor?: string;
}

export interface Raider {
  id: string;
  name: string;
  x: number;
  y: number;
  angle: number;
  hp: number;
  maxHp: number;
  speed: number;
  weapon: 'pistol' | 'bat' | 'shotgun';
  state: 'wandering' | 'chasing' | 'attacking_player' | 'attacking_base' | 'fleeing';
  attackCooldown: number;
  ammo: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  type: 'blood' | 'spark' | 'smoke' | 'fire' | 'debris' | 'flash';
}

export interface Decal {
  x: number;
  y: number;
  radius: number;
  color: string;
  alpha: number;
  type: 'blood' | 'scorch' | 'casing';
}

export interface Bullet {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  rangeLeft: number;
  isPlayer: boolean;
  weaponType: WeaponType;
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  hunger: number; // 0 - 100 (100 = full)
  thirst: number; // 0 - 100 (100 = hydrated)
  infection: number; // 0 - 100 (0 = clean, >0 drains hp)
  noise: number; // 0 - 100
  weight: number;
  maxWeight: number;
}

export interface SkillNode {
  id: string;
  name: string;
  category: 'survival' | 'combat' | 'crafting' | 'agility';
  level: number;
  maxLevel: number;
  cost: number;
  description: string;
  bonusText: string;
}

export interface CraftingRecipe {
  id: string;
  name: string;
  category: 'survival' | 'weapons' | 'building' | 'ammo';
  description: string;
  resultItem: Item;
  materials: { itemId: string; name: string; quantity: number }[];
  requiredSkill?: { skillId: string; minLevel: number };
  craftTimeSeconds: number;
}

export interface TimeState {
  day: number;
  timeHours: number; // 0.0 to 24.0
  isNight: boolean;
  ambientLight: number; // 0.0 (night) to 1.0 (noon)
  weather: 'clear' | 'fog' | 'rain';
}
