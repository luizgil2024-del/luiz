import { 
  Building, 
  Container, 
  Item, 
  PlayerStats, 
  SkillNode, 
  TimeState, 
  Vehicle, 
  Zombie, 
  Raider, 
  Bullet, 
  Particle, 
  Decal, 
  Barricade, 
  PlacedStructure, 
  StructureType 
} from '../types/game';
import { ALL_ITEMS, cloneItem } from './itemsData';
import { BUILDINGS, generateInitialContainers, MAP_HEIGHT, MAP_WIDTH, STREET_PROPS, VEHICLES } from './mapData';
import { INITIAL_SKILLS } from './skillsData';
import { soundManager } from '../audio/soundManager';

export interface Player {
  x: number;
  y: number;
  angle: number;
  speed: number;
  isSprinting: boolean;
  activeSlotIndex: number;
  quickSlots: (Item | null)[];
  inventory: Item[];
  stats: PlayerStats;
  currentBuildingId: string | null;
  flashlightOn: boolean;
  isReloading: boolean;
  reloadProgress: number; // 0 to 1
  isAttacking: boolean;
  attackTimer: number;
  lootingContainerId: string | null;
  lootProgress: number; // 0 to 1
  level: number;
  xp: number;
  xpToNextLevel: number;
  skillPoints: number;
  skills: Record<string, SkillNode>;
  kills: number;
  daysSurvived: number;
}

export class GameEngine {
  public player: Player;
  public buildings: Building[] = [];
  public containers: Container[] = [];
  public vehicles: Vehicle[] = [];
  public zombies: Zombie[] = [];
  public raiders: Raider[] = [];
  public bullets: Bullet[] = [];
  public particles: Particle[] = [];
  public decals: Decal[] = [];
  public barricades: Barricade[] = [];
  public placedStructures: PlacedStructure[] = [];
  public timeState: TimeState;
  
  public isGameOver: boolean = false;
  public isPaused: boolean = false;
  public isNightHordeTriggered: boolean = false;

  // Timers
  private lastUpdateTime: number = performance.now();
  private zombieSpawnTimer: number = 0;
  private rainCollectorTimer: number = 0;
  private soundCoolDown: number = 0;
  private stepDistance: number = 0;

  constructor() {
    this.timeState = {
      day: 1,
      timeHours: 9.0, // Starts 9:00 AM bright morning
      isNight: false,
      ambientLight: 1.0,
      weather: 'clear',
    };

    // Starting player
    this.player = {
      x: 820,
      y: 450, // Inside starting house safe zone
      angle: 0,
      speed: 4.6, // Much faster and more responsive
      isSprinting: false,
      activeSlotIndex: 0,
      quickSlots: [
        cloneItem('knife', 1),
        cloneItem('fresh_water', 1),
        cloneItem('canned_beans', 1),
        cloneItem('bandage', 2),
        null,
      ],
      inventory: [
        cloneItem('wood_plank', 2),
        cloneItem('nails', 8),
      ],
      stats: {
        hp: 100,
        maxHp: 100,
        stamina: 100,
        maxStamina: 100,
        hunger: 100,
        thirst: 100,
        infection: 0,
        noise: 0,
        weight: 3.2,
        maxWeight: 26,
      },
      currentBuildingId: 'b_house_1',
      flashlightOn: true,
      isReloading: false,
      reloadProgress: 0,
      isAttacking: false,
      attackTimer: 0,
      lootingContainerId: null,
      lootProgress: 0,
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      skillPoints: 1,
      skills: JSON.parse(JSON.stringify(INITIAL_SKILLS)),
      kills: 0,
      daysSurvived: 0,
    };

    this.initMap();
    this.spawnInitialZombies();
    this.calculateWeight();
  }

  public initMap() {
    this.buildings = JSON.parse(JSON.stringify(BUILDINGS));
    this.containers = generateInitialContainers();
    this.vehicles = JSON.parse(JSON.stringify(VEHICLES));
    this.barricades = [];
    this.placedStructures = [];
  }

  private spawnInitialZombies() {
    this.zombies = [];
    // Spawn around streets and near commercial buildings, away from starting house
    const spawnPoints = [
      // Street near supermarket
      { x: 1550, y: 350 },
      { x: 1650, y: 450 },
      { x: 1900, y: 700 },
      // Street near pharmacy
      { x: 1350, y: 1000 },
      { x: 600, y: 1200 },
      // Near police station
      { x: 1550, y: 1100 },
      { x: 1950, y: 1300 },
      // Central crossroads
      { x: 1450, y: 1500 },
      { x: 1550, y: 1650 },
      // Near hardware store
      { x: 550, y: 2200 },
      { x: 800, y: 2450 },
      // Gas station
      { x: 2300, y: 1900 },
      { x: 2450, y: 2300 },
    ];

    spawnPoints.forEach((pt, i) => {
      this.zombies.push({
        id: `zombie_init_${i}`,
        type: i % 4 === 0 ? 'sprinter' : i % 5 === 0 ? 'bloater' : 'walker',
        x: pt.x + (Math.random() * 80 - 40),
        y: pt.y + (Math.random() * 80 - 40),
        angle: Math.random() * Math.PI * 2,
        hp: i % 5 === 0 ? 110 : 60,
        maxHp: i % 5 === 0 ? 110 : 60,
        speed: i % 4 === 0 ? 2.0 : 1.1, // Much slower than player walking (4.8)
        damage: i % 5 === 0 ? 8 : 4, // Greatly reduced damage to player
        state: 'wandering',
        attackCooldown: 0,
        detectionRange: 200,
        isNightFrenzied: false,
      });
    });
  }

  // --- CORE UPDATE LOOP ---
  public update(dt: number, keys: Record<string, boolean>, mouseWorldX: number, mouseWorldY: number) {
    if (this.isGameOver || this.isPaused) return;

    // 1. Time Cycle
    this.updateTime(dt);

    // 2. Player Controls & Movement
    this.updatePlayerMovement(dt, keys, mouseWorldX, mouseWorldY);

    // 3. Vitals (Hunger, Thirst, Infection, Stamina)
    this.updatePlayerVitals(dt);

    // 4. Combat / Attack / Reload
    this.updateCombat(dt);

    // 5. Container Looting Progress
    this.updateLooting(dt);

    // 6. Bullets & Projectiles
    this.updateBullets(dt);

    // 7. Zombies AI & Night Frenzy
    this.updateZombies(dt);

    // 8. Raiders AI
    this.updateRaiders(dt);

    // 9. Base Structures (Rain collector, Spikes)
    this.updateStructures(dt);

    // 10. Particles
    this.updateParticles(dt);

    // Check game over
    if (this.player.stats.hp <= 0) {
      this.isGameOver = true;
      soundManager.playZombieDeath();
      soundManager.updateHeartbeat(false);
    }
  }

  // --- TIME OF DAY SYSTEM ---
  private updateTime(dt: number) {
    // 1 real second = 0.08 game hour (~12.5 real seconds per game hour, ~5 minutes per 24h cycle)
    const hourDelta = (dt / 1000) * 0.09;
    this.timeState.timeHours += hourDelta;

    if (this.timeState.timeHours >= 24) {
      this.timeState.timeHours -= 24;
      this.timeState.day += 1;
      this.player.daysSurvived += 1;
      this.addXP(150); // Day survived bonus
    }

    const h = this.timeState.timeHours;
    const isNightNow = h < 5.5 || h >= 20.0;
    this.timeState.isNight = isNightNow;

    // Ambient light calculation
    if (h >= 6 && h < 18) {
      // Daytime (06:00 - 18:00)
      this.timeState.ambientLight = 1.0;
    } else if (h >= 18 && h < 20) {
      // Sunset (18:00 - 20:00)
      const ratio = (h - 18) / 2.0;
      this.timeState.ambientLight = 1.0 - ratio * 0.88; // Drops from 1.0 to 0.12
    } else if (h >= 5.0 && h < 6.0) {
      // Sunrise (05:00 - 06:00)
      const ratio = (h - 5.0) / 1.0;
      this.timeState.ambientLight = 0.12 + ratio * 0.88;
    } else {
      // Deep Night
      this.timeState.ambientLight = 0.08;
    }

    soundManager.updateNightAmbiance(this.timeState.isNight);

    // Night horde trigger at 22:00
    if (h >= 22.0 && h < 22.5 && !this.isNightHordeTriggered) {
      this.triggerNightHorde();
      this.isNightHordeTriggered = true;
    } else if (h >= 6.0 && h < 7.0) {
      this.isNightHordeTriggered = false;
      this.ensureZombieCap(20);
    }
  }

  public ensureZombieCap(maxZombies: number = 30) {
    if (this.zombies.length <= maxZombies) return;
    const px = this.player.x;
    const py = this.player.y;
    // Keep closest zombies to player, trim excess from farthest
    this.zombies.sort((a, b) => {
      const distA = (a.x - px) ** 2 + (a.y - py) ** 2;
      const distB = (b.x - px) ** 2 + (b.y - py) ** 2;
      return distA - distB; // Ascending: closest first
    });
    this.zombies.length = maxZombies;
  }

  private triggerNightHorde() {
    soundManager.playZombieGroan(true);
    // Spawn 6-8 aggressive night sprinters on the outskirts
    const count = 6 + Math.min(this.player.level, 4);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 600 + Math.random() * 200;
      const x = Math.max(100, Math.min(MAP_WIDTH - 100, this.player.x + Math.cos(angle) * dist));
      const y = Math.max(100, Math.min(MAP_HEIGHT - 100, this.player.y + Math.sin(angle) * dist));

      this.zombies.push({
        id: `horde_zombie_${Date.now()}_${i}`,
        type: 'sprinter',
        x,
        y,
        angle: Math.atan2(this.player.y - y, this.player.x - x),
        hp: 70,
        maxHp: 70,
        speed: 2.2, // Slower than player walking (4.8)
        damage: 6, // Low damage to player
        state: 'chasing',
        targetX: this.player.x,
        targetY: this.player.y,
        attackCooldown: 0,
        detectionRange: 450,
        isNightFrenzied: true,
        eyeGlowColor: '#ff2222',
      });
    }

    this.ensureZombieCap(30);

    // Chance of hostile raiders during night
    if (this.timeState.day >= 2 && Math.random() < 0.35 && this.raiders.length < 3) {
      this.spawnRaider();
    }
  }

  private spawnRaider() {
    const angle = Math.random() * Math.PI * 2;
    const dist = 700;
    const x = Math.max(150, Math.min(MAP_WIDTH - 150, this.player.x + Math.cos(angle) * dist));
    const y = Math.max(150, Math.min(MAP_HEIGHT - 150, this.player.y + Math.sin(angle) * dist));

    const weapons: ('pistol' | 'bat' | 'shotgun')[] = ['pistol', 'bat', 'shotgun'];
    const chosenWep = weapons[Math.floor(Math.random() * weapons.length)];

    this.raiders.push({
      id: `raider_${Date.now()}`,
      name: 'Saqueador Hostil',
      x,
      y,
      angle: 0,
      hp: 120,
      maxHp: 120,
      speed: 3.0,
      weapon: chosenWep,
      state: 'wandering',
      attackCooldown: 0,
      ammo: chosenWep === 'bat' ? 0 : 8,
    });
  }

  // --- PLAYER MOVEMENT & CONTROLS ---
  private updatePlayerMovement(dt: number, keys: Record<string, boolean>, mouseWorldX: number, mouseWorldY: number) {
    // Angle facing mouse
    const dxMouse = mouseWorldX - this.player.x;
    const dyMouse = mouseWorldY - this.player.y;
    this.player.angle = Math.atan2(dyMouse, dxMouse);

    // Movement relative to character facing direction (vision):
    // W = Frente (na direção da visão do personagem)
    // S = Trás / Ré (para trás da direção da visão)
    // A = Strafe / Esquiva para a esquerda da visão
    // D = Strafe / Esquiva para a direita da visão
    let forwardInput = 0;
    let strafeInput = 0;

    if (keys['w'] || keys['W'] || keys['KeyW'] || keys['ArrowUp']) forwardInput += 1;
    if (keys['s'] || keys['S'] || keys['KeyS'] || keys['ArrowDown']) forwardInput -= 1;
    if (keys['d'] || keys['D'] || keys['KeyD'] || keys['ArrowRight']) strafeInput += 1;
    if (keys['a'] || keys['A'] || keys['KeyA'] || keys['ArrowLeft']) strafeInput -= 1;

    // Vector in facing direction (character vision)
    const fwdX = Math.cos(this.player.angle);
    const fwdY = Math.sin(this.player.angle);

    // Vector to the right (perpendicular, 90 degrees clockwise)
    const rightX = -Math.sin(this.player.angle);
    const rightY = Math.cos(this.player.angle);

    let moveX = fwdX * forwardInput + rightX * strafeInput;
    let moveY = fwdY * forwardInput + rightY * strafeInput;

    const isMoving = moveX !== 0 || moveY !== 0;

    // Check sprint
    const sprintKey = keys['Shift'] || keys['ShiftLeft'] || keys['ShiftRight'];
    const hasStamina = this.player.stats.stamina > 2;
    const isOverweight = this.player.stats.weight > this.player.stats.maxWeight;

    this.player.isSprinting = sprintKey && isMoving && hasStamina && !isOverweight;

    // Athletics skill bonus
    const athleticsLvl = this.player.skills.survival?.level || 0;
    const speedBonus = 1 + athleticsLvl * 0.06;

    // Fast, agile and responsive movement speeds (Walking: 4.8, Sprinting: 8.2)
    let currentSpeed = this.player.isSprinting ? 8.2 * speedBonus : 4.8 * speedBonus;
    if (isOverweight) {
      currentSpeed *= 0.7; // Reasonable weight penalty
    }

    if (isMoving) {
      const len = Math.hypot(moveX, moveY);
      moveX = (moveX / len) * currentSpeed;
      moveY = (moveY / len) * currentSpeed;

      // Auto-open nearby closed doors if player moves towards them
      for (const b of this.buildings) {
        for (const d of b.doors) {
          if (!d.isOpen) {
            const doorMidX = d.x + d.width / 2;
            const doorMidY = d.y + d.height / 2;
            if (Math.hypot(this.player.x - doorMidX, this.player.y - doorMidY) < 40) {
              d.isOpen = true;
              soundManager.playDoorCreak(true);
            }
          }
        }
      }

      // New candidate position
      const newX = this.player.x + moveX;
      const newY = this.player.y + moveY;

      // Collision checks with walls & barricades
      if (!this.checkPlayerCollision(newX, this.player.y)) {
        this.player.x = newX;
      }
      if (!this.checkPlayerCollision(this.player.x, newY)) {
        this.player.y = newY;
      }

      // Constrain inside world bounds
      this.player.x = Math.max(30, Math.min(MAP_WIDTH - 30, this.player.x));
      this.player.y = Math.max(30, Math.min(MAP_HEIGHT - 30, this.player.y));

      // Noise from movement (stealth skill reduces noise)
      const stealthLvl = this.player.skills.stealth?.level || 0;
      const noiseMultiplier = Math.max(0.3, 1 - stealthLvl * 0.12);
      this.player.stats.noise = (this.player.isSprinting ? 75 : 25) * noiseMultiplier;

      // Footstep audio
      this.stepDistance += currentSpeed;
      if (this.stepDistance > (this.player.isSprinting ? 45 : 30)) {
        this.stepDistance = 0;
        soundManager.playFootstep(!!this.player.currentBuildingId);
      }

      // Interrupt looting if moving
      if (this.player.lootingContainerId) {
        this.cancelLooting();
      }
    } else {
      this.player.stats.noise = Math.max(0, this.player.stats.noise - dt * 0.1);
    }

    // Check which building the player is currently inside
    this.updateCurrentBuilding();
  }

  public toggleNearbyDoor(): { toggled: boolean; isOpen?: boolean; buildingName?: string } {
    for (const b of this.buildings) {
      for (const d of b.doors) {
        const doorCenterX = d.x + d.width / 2;
        const doorCenterY = d.y + d.height / 2;
        const dist = Math.hypot(this.player.x - doorCenterX, this.player.y - doorCenterY);
        if (dist < 65) {
          d.isOpen = !d.isOpen;
          soundManager.playDoorCreak(d.isOpen);
          return { toggled: true, isOpen: d.isOpen, buildingName: b.name };
        }
      }
    }
    return { toggled: false };
  }

  private updateCurrentBuilding() {
    const px = this.player.x;
    const py = this.player.y;
    let foundId: string | null = null;

    for (const b of this.buildings) {
      if (px >= b.x && px <= b.x + b.width && py >= b.y && py <= b.y + b.height) {
        foundId = b.id;
        b.explored = true;
        break;
      }
    }

    this.player.currentBuildingId = foundId;
  }

  // --- COLLISION LOGIC ---
  private checkPlayerCollision(x: number, y: number): boolean {
    const radius = 13; // Optimized collision radius for smooth doorway passage

    // Check building walls & doors
    for (const b of this.buildings) {
      // If outside bounding box + padding, skip
      if (x + radius < b.x - 10 || x - radius > b.x + b.width + 10 || y + radius < b.y - 10 || y - radius > b.y + b.height + 10) {
        continue;
      }

      // Check Top Wall (with door gaps)
      if (this.checkWallCollisionWithDoors(b.x, b.y, b.x + b.width, b.y, x, y, radius, b.doors, true)) return true;
      // Check Bottom Wall (with door gaps)
      if (this.checkWallCollisionWithDoors(b.x, b.y + b.height, b.x + b.width, b.y + b.height, x, y, radius, b.doors, true)) return true;
      // Check Left Wall (with door gaps)
      if (this.checkWallCollisionWithDoors(b.x, b.y, b.x, b.y + b.height, x, y, radius, b.doors, false)) return true;
      // Check Right Wall (with door gaps)
      if (this.checkWallCollisionWithDoors(b.x + b.width, b.y, b.x + b.width, b.y + b.height, x, y, radius, b.doors, false)) return true;
    }

    // Check Barricades
    for (const bar of this.barricades) {
      if (bar.hp > 0) {
        if (
          x + radius > bar.x &&
          x - radius < bar.x + bar.width &&
          y + radius > bar.y &&
          y - radius < bar.y + bar.height
        ) {
          return true;
        }
      }
    }

    // Check Placed Chests & Structures
    for (const st of this.placedStructures) {
      if (
        st.type === 'storage_chest' ||
        st.type === 'rain_collector' ||
        st.type === 'campfire' ||
        st.type === 'spotlight' ||
        st.type === 'barricade_wood' ||
        st.type === 'barricade_metal'
      ) {
        const dist = Math.hypot(x - st.x, y - st.y);
        if (dist < radius + 15) return true;
      }
    }

    // Check Parked Vehicles
    for (const v of this.vehicles) {
      const dist = Math.hypot(x - v.x, y - v.y);
      if (dist < radius + 26) return true;
    }

    return false;
  }

  private checkWallCollisionWithDoors(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    cx: number,
    cy: number,
    r: number,
    doors: Building['doors'],
    isHorizontal: boolean
  ): boolean {
    if (isHorizontal) {
      // Find open doors on this horizontal line
      const wallY = y1;
      const wallDoors = doors.filter(d => Math.abs(d.y - wallY) < 30 && d.x + d.width >= x1 && d.x <= x2);

      // Sort doors along X
      wallDoors.sort((a, b) => a.x - b.x);

      let currentX = x1;
      for (const d of wallDoors) {
        if (d.isOpen) {
          // Solid wall segment up to the door opening
          if (d.x > currentX) {
            if (this.pointToSegmentDistance(cx, cy, currentX, wallY, d.x, wallY) < r) {
              return true;
            }
          }
          // The doorway itself is open, skip over it
          currentX = Math.max(currentX, d.x + d.width);
        } else {
          // Closed door is solid
          if (this.pointToSegmentDistance(cx, cy, d.x, wallY, d.x + d.width, wallY) < r) {
            return true;
          }
        }
      }

      // Remaining solid wall segment after last door
      if (x2 > currentX) {
        if (this.pointToSegmentDistance(cx, cy, currentX, wallY, x2, wallY) < r) {
          return true;
        }
      }
    } else {
      // Vertical wall
      const wallX = x1;
      const wallDoors = doors.filter(d => Math.abs(d.x - wallX) < 30 && d.y + d.height >= y1 && d.y <= y2);

      // Sort doors along Y
      wallDoors.sort((a, b) => a.y - b.y);

      let currentY = y1;
      for (const d of wallDoors) {
        if (d.isOpen) {
          // Solid wall segment up to the door opening
          if (d.y > currentY) {
            if (this.pointToSegmentDistance(cx, cy, wallX, currentY, wallX, d.y) < r) {
              return true;
            }
          }
          // The doorway itself is open, skip over it
          currentY = Math.max(currentY, d.y + d.height);
        } else {
          // Closed door is solid
          if (this.pointToSegmentDistance(cx, cy, wallX, d.y, wallX, d.y + d.height) < r) {
            return true;
          }
        }
      }

      // Remaining solid wall segment after last door
      if (y2 > currentY) {
        if (this.pointToSegmentDistance(cx, cy, wallX, currentY, wallX, y2) < r) {
          return true;
        }
      }
    }

    return false;
  }

  private pointToSegmentDistance(
    cx: number,
    cy: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): number {
    const lineLen = Math.hypot(x2 - x1, y2 - y1);
    if (lineLen === 0) return Math.hypot(cx - x1, cy - y1);

    const u = ((cx - x1) * (x2 - x1) + (cy - y1) * (y2 - y1)) / (lineLen * lineLen);
    const clampedU = Math.max(0, Math.min(1, u));
    const closestX = x1 + clampedU * (x2 - x1);
    const closestY = y1 + clampedU * (y2 - y1);

    return Math.hypot(cx - closestX, cy - closestY);
  }

  // --- PLAYER VITALS (Hunger, Thirst, Infection, Stamina) ---
  private updatePlayerVitals(dt: number) {
    const stats = this.player.stats;
    const sec = dt / 1000;

    // Skill reductions and significantly higher durability for hunger and thirst
    const survivalLvl = this.player.skills.survival?.level || 0;
    const hungerDrainRate = (1 - survivalLvl * 0.08) * 0.012; // Drops ~5x slower for high durability
    const thirstDrainRate = (1 - survivalLvl * 0.08) * 0.020; // Drops ~5x slower for high durability

    // Stamina drain or recovery
    if (this.player.isSprinting) {
      stats.stamina = Math.max(0, stats.stamina - sec * 14);
      stats.thirst = Math.max(0, stats.thirst - sec * thirstDrainRate * 1.25);
      stats.hunger = Math.max(0, stats.hunger - sec * hungerDrainRate * 1.25);
    } else {
      // Recover stamina if hydrated
      const recoveryRate = stats.thirst > 20 ? 18 : 6;
      stats.stamina = Math.min(stats.maxStamina, stats.stamina + sec * recoveryRate);
      stats.thirst = Math.max(0, stats.thirst - sec * thirstDrainRate);
      stats.hunger = Math.max(0, stats.hunger - sec * hungerDrainRate);
    }

    // Continuous blood loss / infection HP drain removed per user request
    this.player.stats.infection = 0;

    // Starvation / Dehydration penalties
    if (stats.hunger <= 0) {
      stats.hp = Math.max(0, stats.hp - sec * 2.5);
    }
    if (stats.thirst <= 0) {
      stats.hp = Math.max(0, stats.hp - sec * 4.0);
    }

    // Low health heartbeat audio cue
    soundManager.updateHeartbeat(stats.hp < 30);
  }

  // --- COMBAT & ATTACKING ---
  public triggerAttack() {
    if (this.player.isAttacking || this.player.isReloading) return;
    const activeItem = this.player.quickSlots[this.player.activeSlotIndex];

    // If unarmed or holding a non-weapon item: punch at close range!
    if (!activeItem || activeItem.category !== 'weapon') {
      this.performCloseRangeMelee(true);
      return;
    }

    if (activeItem.weaponType === 'melee') {
      this.performMeleeAttack(activeItem);
    } else if (activeItem.weaponType === 'throwable') {
      this.throwMolotov(activeItem);
    } else {
      this.performFirearmAttack(activeItem);
    }
  }

  /**
   * Dedicated Quick Close-Range Melee Strike / Bash (Can be used anytime via [F] or Right Click)
   */
  public triggerQuickMelee() {
    if (this.player.isAttacking) return;
    this.performCloseRangeMelee(false);
  }

  public performCloseRangeMelee(isFist = true) {
    const staminaCost = isFist ? 8 : 10;
    if (this.player.stats.stamina < 4) return; // Need minimal stamina
    this.player.stats.stamina = Math.max(0, this.player.stats.stamina - staminaCost);

    this.player.isAttacking = true;
    this.player.attackTimer = 0.28; // Quick snappy punch/bash animation

    soundManager.playPunch();

    // Noise from punch/bash
    this.player.stats.noise = Math.max(this.player.stats.noise, 30);

    const reach = isFist ? 65 : 75; // Close-range reach
    const meleeSkill = this.player.skills.melee?.level || 0;
    const dmgMultiplier = 1 + meleeSkill * 0.18;
    const baseDmg = isFist ? 32 : 38; // Good solid punch/coronhada damage
    const critChance = 0.15 + meleeSkill * 0.05;

    const swingAngle = this.player.angle;
    let hitAny = false;

    // Check hit zombies in close frontal arc
    for (const z of this.zombies) {
      const dist = Math.hypot(z.x - this.player.x, z.y - this.player.y);
      if (dist <= reach) {
        const angleToZ = Math.atan2(z.y - this.player.y, z.x - this.player.x);
        let angleDiff = Math.abs(swingAngle - angleToZ);
        if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

        if (angleDiff < 1.1) { // Wide ~65 degree frontal sweep
          hitAny = true;
          const isCrit = Math.random() < critChance;
          const finalDmg = baseDmg * dmgMultiplier * (isCrit ? 1.8 : 1.0);
          z.hp -= finalDmg;

          // Strong Knockback! Pushes zombie back
          const pushDistance = isFist ? 35 : 48;
          z.x += Math.cos(swingAngle) * pushDistance;
          z.y += Math.sin(swingAngle) * pushDistance;

          // Interrupt & Stun zombie attack
          z.attackCooldown = Math.max(z.attackCooldown, 1.2);

          // Blood decal & particles
          this.spawnBlood(z.x, z.y, isCrit ? 10 : 6);
          soundManager.playHit();

          if (z.hp <= 0) {
            this.handleZombieKilled(z);
          }
        }
      }
    }

    // Check hit hostile raiders in close frontal arc
    for (const r of this.raiders) {
      const dist = Math.hypot(r.x - this.player.x, r.y - this.player.y);
      if (dist <= reach) {
        const angleToR = Math.atan2(r.y - this.player.y, r.x - this.player.x);
        let angleDiff = Math.abs(swingAngle - angleToR);
        if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

        if (angleDiff < 1.1) {
          hitAny = true;
          r.hp -= baseDmg * dmgMultiplier;
          // Knockback raider
          r.x += Math.cos(swingAngle) * 35;
          r.y += Math.sin(swingAngle) * 35;
          soundManager.playHit();
          this.spawnBlood(r.x, r.y, 6);
          if (r.hp <= 0) {
            this.handleRaiderKilled(r);
          }
        }
      }
    }
  }

  private performMeleeAttack(weapon: Item) {
    if (this.player.stats.stamina < 12) return; // Need stamina for swing
    this.player.stats.stamina -= 12;
    this.player.isAttacking = true;
    this.player.attackTimer = (weapon.fireRate || 500) / 1000;

    soundManager.playMeleeSwing();

    // Noise from swing
    this.player.stats.noise = Math.max(this.player.stats.noise, weapon.noiseRadius || 40);

    // Melee arc calculation
    const reach = weapon.range || 60;
    const meleeSkill = this.player.skills.melee?.level || 0;
    const dmgMultiplier = 1 + meleeSkill * 0.15;
    const critChance = 0.1 + meleeSkill * 0.05;

    const swingAngle = this.player.angle;
    let hitAny = false;

    // Check hit zombies
    for (const z of this.zombies) {
      const dist = Math.hypot(z.x - this.player.x, z.y - this.player.y);
      if (dist <= reach) {
        const angleToZ = Math.atan2(z.y - this.player.y, z.x - this.player.x);
        let angleDiff = Math.abs(swingAngle - angleToZ);
        if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

        if (angleDiff < 0.9) { // ~50 degree cone
          hitAny = true;
          const isCrit = Math.random() < critChance;
          const finalDmg = (weapon.damage || 30) * dmgMultiplier * (isCrit ? 2.0 : 1.0);
          z.hp -= finalDmg;

          // Knockback
          z.x += Math.cos(swingAngle) * 20;
          z.y += Math.sin(swingAngle) * 20;

          // Blood decal & particles
          this.spawnBlood(z.x, z.y, isCrit ? 12 : 6);
          soundManager.playHit();

          if (z.hp <= 0) {
            this.handleZombieKilled(z);
          }
        }
      }
    }

    // Check hit raiders
    for (const r of this.raiders) {
      const dist = Math.hypot(r.x - this.player.x, r.y - this.player.y);
      if (dist <= reach) {
        r.hp -= (weapon.damage || 30) * dmgMultiplier;
        soundManager.playHit();
        this.spawnBlood(r.x, r.y, 6);
        if (r.hp <= 0) {
          this.handleRaiderKilled(r);
        }
      }
    }
  }

  private performFirearmAttack(weapon: Item) {
    if (!weapon.currentAmmo || weapon.currentAmmo <= 0) {
      this.triggerReload();
      return;
    }

    weapon.currentAmmo -= 1;
    this.player.isAttacking = true;
    this.player.attackTimer = (weapon.fireRate || 400) / 1000;

    // Gunshot audio
    if (weapon.weaponType === 'shotgun') {
      soundManager.playGunshot('shotgun');
    } else if (weapon.weaponType === 'rifle') {
      soundManager.playGunshot('rifle');
    } else {
      soundManager.playGunshot('pistol');
    }

    // Gunshot creates large sound wave alerting surrounding zombies
    this.player.stats.noise = weapon.noiseRadius || 400;
    this.alertNearbyZombies(this.player.x, this.player.y, weapon.noiseRadius || 400);

    // Muzzle flash particle
    const barrelX = this.player.x + Math.cos(this.player.angle) * 25;
    const barrelY = this.player.y + Math.sin(this.player.angle) * 25;
    this.particles.push({
      x: barrelX,
      y: barrelY,
      vx: 0,
      vy: 0,
      color: '#fbbf24',
      size: 14,
      alpha: 1.0,
      life: 0.06,
      maxLife: 0.06,
      type: 'flash',
    });

    // Shell casing
    this.addDecal({
      x: this.player.x + Math.cos(this.player.angle - 1.5) * 12,
      y: this.player.y + Math.sin(this.player.angle - 1.5) * 12,
      radius: 2,
      color: '#d97706',
      alpha: 0.7,
      type: 'casing',
    });

    // Bullets / Pellets
    const combatLvl = this.player.skills.combat?.level || 0;
    const dmgBonus = 1 + combatLvl * 0.1;
    const pelletCount = weapon.pellets || 1;
    const spread = weapon.spread || 0.05;

    for (let p = 0; p < pelletCount; p++) {
      const spreadAngle = this.player.angle + (Math.random() - 0.5) * spread * 2;
      const speed = 18;
      this.bullets.push({
        id: `bullet_${Date.now()}_${p}`,
        x: barrelX,
        y: barrelY,
        vx: Math.cos(spreadAngle) * speed,
        vy: Math.sin(spreadAngle) * speed,
        damage: (weapon.damage || 40) * dmgBonus,
        rangeLeft: weapon.range || 400,
        isPlayer: true,
        weaponType: weapon.weaponType || 'pistol',
      });
    }
  }

  private throwMolotov(weapon: Item) {
    this.player.isAttacking = true;
    this.player.attackTimer = 0.8;

    const targetX = this.player.x + Math.cos(this.player.angle) * (weapon.range || 240);
    const targetY = this.player.y + Math.sin(this.player.angle) * (weapon.range || 240);

    // Consume 1 molotov
    weapon.quantity -= 1;
    if (weapon.quantity <= 0) {
      this.player.quickSlots[this.player.activeSlotIndex] = null;
    }
    this.calculateWeight();

    soundManager.playMeleeSwing();

    // Spawn explosion after brief flight
    setTimeout(() => {
      soundManager.playGunshot('shotgun');
      // Fire radius damage
      const radius = 90;
      for (const z of this.zombies) {
        const dist = Math.hypot(z.x - targetX, z.y - targetY);
        if (dist <= radius) {
          z.hp -= 95;
          this.spawnBlood(z.x, z.y, 8);
          if (z.hp <= 0) this.handleZombieKilled(z);
        }
      }
      // Fire particles
      for (let i = 0; i < 24; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = Math.random() * 3 + 1;
        this.particles.push({
          x: targetX,
          y: targetY,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          color: Math.random() > 0.5 ? '#f97316' : '#ef4444',
          size: Math.random() * 12 + 6,
          alpha: 0.9,
          life: 0.8 + Math.random() * 0.6,
          maxLife: 1.4,
          type: 'fire',
        });
      }
      // Scorch mark decal
      this.addDecal({
        x: targetX,
        y: targetY,
        radius: 40,
        color: '#1c1917',
        alpha: 0.6,
        type: 'scorch',
      });
    }, 350);
  }

  public triggerReload() {
    if (this.player.isReloading) return;
    const weapon = this.player.quickSlots[this.player.activeSlotIndex];
    if (!weapon || !weapon.ammoType || !weapon.clipSize) return;

    if (weapon.currentAmmo && weapon.currentAmmo >= weapon.clipSize) return; // Already full

    // Check inventory for matching ammo
    const ammoItem = this.player.inventory.find(i => i.id === weapon.ammoType);
    if (!ammoItem || ammoItem.quantity <= 0) return;

    this.player.isReloading = true;
    this.player.reloadProgress = 0;
    soundManager.playReload();
  }

  private updateCombat(dt: number) {
    const sec = dt / 1000;

    // Attack cooldown timer
    if (this.player.isAttacking) {
      this.player.attackTimer -= sec;
      if (this.player.attackTimer <= 0) {
        this.player.isAttacking = false;
      }
    }

    // Reload timer
    if (this.player.isReloading) {
      const combatLvl = this.player.skills.combat?.level || 0;
      const reloadSpeed = 1 + combatLvl * 0.15;
      this.player.reloadProgress += sec * reloadSpeed * 0.65; // ~1.5s reload base

      if (this.player.reloadProgress >= 1.0) {
        this.player.isReloading = false;
        this.player.reloadProgress = 0;

        const weapon = this.player.quickSlots[this.player.activeSlotIndex];
        if (weapon && weapon.ammoType && weapon.clipSize) {
          const needed = weapon.clipSize - (weapon.currentAmmo || 0);
          const ammoItem = this.player.inventory.find(i => i.id === weapon.ammoType);
          if (ammoItem) {
            const transfer = Math.min(needed, ammoItem.quantity);
            weapon.currentAmmo = (weapon.currentAmmo || 0) + transfer;
            ammoItem.quantity -= transfer;
            if (ammoItem.quantity <= 0) {
              this.player.inventory = this.player.inventory.filter(i => i.quantity > 0);
            }
            this.calculateWeight();
          }
        }
      }
    }
  }

  // --- BULLETS & PROJECTILE PHYSICS ---
  private updateBullets(dt: number) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx;
      b.y += b.vy;
      const moved = Math.hypot(b.vx, b.vy);
      b.rangeLeft -= moved;

      // Check hit with zombies
      let hit = false;
      for (const z of this.zombies) {
        const dist = Math.hypot(z.x - b.x, z.y - b.y);
        if (dist < 20) {
          hit = true;
          z.hp -= b.damage;
          this.spawnBlood(z.x, z.y, 8);
          soundManager.playHit();
          if (z.hp <= 0) {
            this.handleZombieKilled(z);
          }
          break;
        }
      }

      // Check hit with raiders
      if (!hit) {
        for (const r of this.raiders) {
          const dist = Math.hypot(r.x - b.x, r.y - b.y);
          if (dist < 20) {
            hit = true;
            r.hp -= b.damage;
            this.spawnBlood(r.x, r.y, 8);
            soundManager.playHit();
            if (r.hp <= 0) {
              this.handleRaiderKilled(r);
            }
            break;
          }
        }
      }

      // Check hit with player (if fired by hostile raiders)
      if (!hit && !b.isPlayer) {
        const dist = Math.hypot(this.player.x - b.x, this.player.y - b.y);
        if (dist < 18) {
          hit = true;
          this.player.stats.hp -= b.damage;
          this.spawnBlood(this.player.x, this.player.y, 8);
          soundManager.playHit();
        }
      }

      // Check hit with barricades
      if (!hit) {
        for (const bar of this.barricades) {
          if (
            b.x >= bar.x &&
            b.x <= bar.x + bar.width &&
            b.y >= bar.y &&
            b.y <= bar.y + bar.height
          ) {
            hit = true;
            this.spawnDebris(b.x, b.y);
            break;
          }
        }
      }

      // Check hit with building solid walls
      if (!hit) {
        for (const bld of this.buildings) {
          if (
            b.x >= bld.x - 8 &&
            b.x <= bld.x + bld.width + 8 &&
            b.y >= bld.y - 8 &&
            b.y <= bld.y + bld.height + 8
          ) {
            if (
              this.checkWallCollisionWithDoors(bld.x, bld.y, bld.x + bld.width, bld.y, b.x, b.y, 5, bld.doors, true) ||
              this.checkWallCollisionWithDoors(bld.x, bld.y + bld.height, bld.x + bld.width, bld.y + bld.height, b.x, b.y, 5, bld.doors, true) ||
              this.checkWallCollisionWithDoors(bld.x, bld.y, bld.x, bld.y + bld.height, b.x, b.y, 5, bld.doors, false) ||
              this.checkWallCollisionWithDoors(bld.x + bld.width, bld.y, bld.x + bld.width, bld.y + bld.height, b.x, b.y, 5, bld.doors, false)
            ) {
              hit = true;
              this.spawnDebris(b.x, b.y);
              break;
            }
          }
        }
      }

      if (hit || b.rangeLeft <= 0) {
        this.bullets.splice(i, 1);
      }
    }
  }

  // --- ZOMBIE & ENTITY PHYSICS & COLLISION ---
  public checkZombieObstacle(
    x: number,
    y: number,
    radius: number = 13
  ): {
    blocked: boolean;
    hitBarricade?: Barricade;
    hitDoor?: { door: Building['doors'][0]; building: Building };
    hitStructure?: PlacedStructure;
    type?: 'wall' | 'door' | 'barricade' | 'structure' | 'vehicle' | 'bounds';
  } {
    // 1. World Bounds
    if (x - radius < 25 || x + radius > MAP_WIDTH - 25 || y - radius < 25 || y + radius > MAP_HEIGHT - 25) {
      return { blocked: true, type: 'bounds' };
    }

    // 2. Building Walls & Closed Doors
    for (const b of this.buildings) {
      // Bounding box quick reject
      if (
        x + radius < b.x - 15 ||
        x - radius > b.x + b.width + 15 ||
        y + radius < b.y - 15 ||
        y - radius > b.y + b.height + 15
      ) {
        continue;
      }

      // Check closed doors specifically so zombies can attack / bang on them
      for (const d of b.doors) {
        if (!d.isOpen) {
          if (
            x + radius > d.x &&
            x - radius < d.x + d.width &&
            y + radius > d.y &&
            y - radius < d.y + d.height
          ) {
            return { blocked: true, type: 'door', hitDoor: { door: d, building: b } };
          }
        }
      }

      // Check the 4 building walls (respecting doorway openings when doors are open)
      if (this.checkWallCollisionWithDoors(b.x, b.y, b.x + b.width, b.y, x, y, radius, b.doors, true)) {
        return { blocked: true, type: 'wall' };
      }
      if (this.checkWallCollisionWithDoors(b.x, b.y + b.height, b.x + b.width, b.y + b.height, x, y, radius, b.doors, true)) {
        return { blocked: true, type: 'wall' };
      }
      if (this.checkWallCollisionWithDoors(b.x, b.y, b.x, b.y + b.height, x, y, radius, b.doors, false)) {
        return { blocked: true, type: 'wall' };
      }
      if (this.checkWallCollisionWithDoors(b.x + b.width, b.y, b.x + b.width, b.y + b.height, x, y, radius, b.doors, false)) {
        return { blocked: true, type: 'wall' };
      }
    }

    // 3. Barricades (wood & metal)
    for (const bar of this.barricades) {
      if (bar.hp > 0) {
        if (
          x + radius > bar.x &&
          x - radius < bar.x + bar.width &&
          y + radius > bar.y &&
          y - radius < bar.y + bar.height
        ) {
          return { blocked: true, type: 'barricade', hitBarricade: bar };
        }
      }
    }

    // 4. Placed Structures (chests, rain collectors, campfires, spotlights, walls)
    for (const st of this.placedStructures) {
      if (
        st.type === 'storage_chest' ||
        st.type === 'rain_collector' ||
        st.type === 'campfire' ||
        st.type === 'spotlight' ||
        st.type === 'barricade_wood' ||
        st.type === 'barricade_metal'
      ) {
        const dist = Math.hypot(x - st.x, y - st.y);
        if (dist < radius + 16) {
          return { blocked: true, type: 'structure', hitStructure: st };
        }
      }
    }

    // 5. Parked Vehicles (sedans, vans, cabs, cruisers)
    for (const v of this.vehicles) {
      const dist = Math.hypot(x - v.x, y - v.y);
      if (dist < radius + 26) {
        return { blocked: true, type: 'vehicle' };
      }
    }

    return { blocked: false };
  }

  private handleZombieAttackBarricade(z: Zombie, barricade: Barricade, sec: number) {
    z.attackCooldown -= sec;
    if (z.attackCooldown <= 0) {
      z.attackCooldown = 1.0;
      barricade.hp -= z.damage * 1.4;
      soundManager.playBarricadeHit();
      this.spawnDebris(barricade.x + barricade.width / 2, barricade.y + barricade.height / 2);
      if (barricade.hp <= 0) {
        this.barricades = this.barricades.filter(b => b.id !== barricade.id);
      }
    }
  }

  private handleZombieAttackDoor(z: Zombie, door: Building['doors'][0], sec: number) {
    z.attackCooldown -= sec;
    if (z.attackCooldown <= 0) {
      z.attackCooldown = 1.2;
      soundManager.playBarricadeHit();
      this.spawnDebris(door.x + door.width / 2, door.y + door.height / 2);
      if (door.barricadeHp === undefined) {
        door.barricadeHp = 60; // 60 HP door durability
      }
      door.barricadeHp -= z.damage * 1.5;
      if (door.barricadeHp <= 0) {
        door.isOpen = true; // Door breaks open!
        door.barricadeHp = undefined;
        soundManager.playDoorCreak(true);
      }
    }
  }

  // --- ZOMBIE AI & BEHAVIOR ---
  private updateZombies(dt: number) {
    const sec = dt / 1000;
    const isNight = this.timeState.isNight;
    const zRadius = 13;

    for (const z of this.zombies) {
      z.isNightFrenzied = isNight;
      const speedMultiplier = isNight ? 1.15 : 1.0;
      // Cap zombie speed to strictly guarantee they are always slower than the player (player walks at 4.8, sprints at 8.2)
      const baseSpeed = z.type === 'sprinter' ? 2.3 : (z.speed || 1.1);
      const currentSpeed = Math.min(2.6, baseSpeed * speedMultiplier);
      z.detectionRange = isNight ? 350 : 180;

      // Distance to player
      const distToPlayer = Math.hypot(this.player.x - z.x, this.player.y - z.y);

      // Detection logic: vision cone or noise hearing
      const hearsNoise = distToPlayer < this.player.stats.noise * 3.5;
      const seesPlayer = distToPlayer < z.detectionRange;

      if (seesPlayer || hearsNoise || z.state === 'chasing') {
        z.state = 'chasing';
        z.targetX = this.player.x;
        z.targetY = this.player.y;
      }

      if (z.state === 'chasing' && z.targetX !== undefined && z.targetY !== undefined) {
        const angleToTarget = Math.atan2(z.targetY - z.y, z.targetX - z.x);
        z.angle = angleToTarget;

        const vx = Math.cos(angleToTarget) * currentSpeed;
        const vy = Math.sin(angleToTarget) * currentSpeed;

        // Axis-separated movement with obstacle resolution (no ghosting through walls or doors!)
        let movedX = false;
        let movedY = false;

        const obsX = this.checkZombieObstacle(z.x + vx, z.y, zRadius);
        if (!obsX.blocked) {
          z.x += vx;
          movedX = true;
        } else {
          if (obsX.hitBarricade) {
            this.handleZombieAttackBarricade(z, obsX.hitBarricade, sec);
          } else if (obsX.hitDoor) {
            this.handleZombieAttackDoor(z, obsX.hitDoor.door, sec);
          }
        }

        const obsY = this.checkZombieObstacle(z.x, z.y + vy, zRadius);
        if (!obsY.blocked) {
          z.y += vy;
          movedY = true;
        } else {
          if (obsY.hitBarricade) {
            this.handleZombieAttackBarricade(z, obsY.hitBarricade, sec);
          } else if (obsY.hitDoor) {
            this.handleZombieAttackDoor(z, obsY.hitDoor.door, sec);
          }
        }

        // If direct approach is blocked on both axes (e.g. perpendicular wall), slide along the wall
        if (!movedX && !movedY) {
          const perp1X = -Math.sin(angleToTarget) * currentSpeed * 0.85;
          const perp1Y = Math.cos(angleToTarget) * currentSpeed * 0.85;
          const perp2X = Math.sin(angleToTarget) * currentSpeed * 0.85;
          const perp2Y = -Math.cos(angleToTarget) * currentSpeed * 0.85;

          if (!this.checkZombieObstacle(z.x + perp1X, z.y + perp1Y, zRadius).blocked) {
            z.x += perp1X;
            z.y += perp1Y;
          } else if (!this.checkZombieObstacle(z.x + perp2X, z.y + perp2Y, zRadius).blocked) {
            z.x += perp2X;
            z.y += perp2Y;
          }
        }

        // Attack player if in close range (lower damage to player)
        if (distToPlayer < 32) {
          z.attackCooldown -= sec;
          if (z.attackCooldown <= 0) {
            z.attackCooldown = 1.2; // Extra recovery time for player
            const rawDmg = (z.damage || 5) * (isNight ? 1.2 : 1.0);
            const dmg = Math.max(2, Math.round(rawDmg)); // Much lower damage per bite/scratch
            this.player.stats.hp -= dmg;
            soundManager.playHit();
            soundManager.playZombieGroan(true);
            this.spawnBlood(this.player.x, this.player.y, 8);
          }
        }
      } else {
        // Wandering calmly - also strictly respects walls and structures!
        if (Math.random() < 0.015) {
          z.angle += (Math.random() - 0.5) * 1.5;
        }
        const wanderSpeed = currentSpeed * 0.35;
        const wvx = Math.cos(z.angle) * wanderSpeed;
        const wvy = Math.sin(z.angle) * wanderSpeed;

        let wMoved = false;
        if (!this.checkZombieObstacle(z.x + wvx, z.y, zRadius).blocked) {
          z.x += wvx;
          wMoved = true;
        }
        if (!this.checkZombieObstacle(z.x, z.y + wvy, zRadius).blocked) {
          z.y += wvy;
          wMoved = true;
        }

        // If wandering into an obstacle, deflect angle away
        if (!wMoved) {
          z.angle += Math.PI * 0.75 + (Math.random() - 0.5) * 0.5;
        }
      }
    }

    // Crowd Physics: soft separation between zombies near the player to prevent overlapping
    const px = this.player.x;
    const py = this.player.y;
    const nearbyZombies: Zombie[] = [];
    for (let i = 0; i < this.zombies.length; i++) {
      const z = this.zombies[i];
      if (Math.abs(z.x - px) < 450 && Math.abs(z.y - py) < 450) {
        nearbyZombies.push(z);
      }
    }

    const nLen = nearbyZombies.length;
    for (let i = 0; i < nLen; i++) {
      const z1 = nearbyZombies[i];
      for (let j = i + 1; j < nLen; j++) {
        const z2 = nearbyZombies[j];
        const dx = z2.x - z1.x;
        const dy = z2.y - z1.y;
        if (Math.abs(dx) > 22 || Math.abs(dy) > 22) continue;
        const distSq = dx * dx + dy * dy;
        const minDist = 22; // Collision diameter
        if (distSq > 0 && distSq < minDist * minDist) {
          const dist = Math.sqrt(distSq);
          const overlap = (minDist - dist) * 0.25;
          const nx = dx / dist;
          const ny = dy / dist;

          z1.x = Math.max(30, Math.min(MAP_WIDTH - 30, z1.x - nx * overlap));
          z1.y = Math.max(30, Math.min(MAP_HEIGHT - 30, z1.y - ny * overlap));
          z2.x = Math.max(30, Math.min(MAP_WIDTH - 30, z2.x + nx * overlap));
          z2.y = Math.max(30, Math.min(MAP_HEIGHT - 30, z2.y + ny * overlap));
        }
      }
    }
  }

  // --- RAIDERS AI ---
  private updateRaiders(dt: number) {
    const sec = dt / 1000;
    const rRadius = 13;
    for (const r of this.raiders) {
      const distToPlayer = Math.hypot(this.player.x - r.x, this.player.y - r.y);

      if (distToPlayer < 360) {
        r.state = 'chasing';
        r.angle = Math.atan2(this.player.y - r.y, this.player.x - r.x);

        if (r.weapon === 'pistol' || r.weapon === 'shotgun') {
          // Shoot at player from medium range
          if (distToPlayer > 150) {
            const rx = r.x + Math.cos(r.angle) * r.speed;
            const ry = r.y + Math.sin(r.angle) * r.speed;
            if (!this.checkZombieObstacle(rx, r.y, rRadius).blocked) r.x = rx;
            if (!this.checkZombieObstacle(r.x, ry, rRadius).blocked) r.y = ry;
          }
          r.attackCooldown -= sec;
          if (r.attackCooldown <= 0 && r.ammo > 0) {
            r.attackCooldown = 1.6;
            r.ammo -= 1;
            soundManager.playGunshot(r.weapon);
            this.bullets.push({
              id: `raider_bullet_${Date.now()}`,
              x: r.x + Math.cos(r.angle) * 20,
              y: r.y + Math.sin(r.angle) * 20,
              vx: Math.cos(r.angle) * 14,
              vy: Math.sin(r.angle) * 14,
              damage: 25,
              rangeLeft: 350,
              isPlayer: false,
              weaponType: r.weapon,
            });
          }
        } else {
          // Melee charge with obstacle physics
          const rx = r.x + Math.cos(r.angle) * r.speed;
          const ry = r.y + Math.sin(r.angle) * r.speed;
          if (!this.checkZombieObstacle(rx, r.y, rRadius).blocked) r.x = rx;
          if (!this.checkZombieObstacle(r.x, ry, rRadius).blocked) r.y = ry;
          if (distToPlayer < 35) {
            r.attackCooldown -= sec;
            if (r.attackCooldown <= 0) {
              r.attackCooldown = 1.0;
              this.player.stats.hp -= 30;
              soundManager.playHit();
              this.spawnBlood(this.player.x, this.player.y, 8);
            }
          }
        }
      }
    }
  }

  // --- STRUCTURES & BASE FORTIFICATIONS ---
  private updateStructures(dt: number) {
    const sec = dt / 1000;
    this.rainCollectorTimer += sec;

    // Rain collector fills clean water periodically
    if (this.rainCollectorTimer >= 45) {
      this.rainCollectorTimer = 0;
      for (const st of this.placedStructures) {
        if (st.type === 'rain_collector') {
          st.customData = st.customData || { waterStored: 0, maxWater: 5 };
          if ((st.customData.waterStored || 0) < (st.customData.maxWater || 5)) {
            st.customData.waterStored = (st.customData.waterStored || 0) + 1;
          }
        }
      }
    }

    // Spike traps damage zombies walking over them
    for (const st of this.placedStructures) {
      if (st.type === 'spike_trap' && st.hp > 0) {
        for (const z of this.zombies) {
          const dist = Math.hypot(z.x - st.x, z.y - st.y);
          if (dist < 28) {
            z.hp -= 40 * sec; // Continuous impale damage
            st.hp -= 15 * sec;
            this.spawnBlood(z.x, z.y, 2);
            if (z.hp <= 0) this.handleZombieKilled(z);
          }
        }
      }
    }
  }

  private getBarricadeAt(x: number, y: number): Barricade | undefined {
    return this.barricades.find(
      b => x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height && b.hp > 0
    );
  }

  public placeStructure(type: StructureType, worldX: number, worldY: number): boolean {
    const itemInInv = this.player.inventory.find(i => i.structureType === type) ||
                      this.player.quickSlots.find(i => i?.structureType === type);
    if (!itemInInv) return false;

    // Engineering skill bonus for structure max HP
    const engLvl = this.player.skills.engineering?.level || 0;
    const hpMultiplier = 1 + engLvl * 0.2;

    if (type === 'barricade_wood' || type === 'barricade_metal') {
      const isMetal = type === 'barricade_metal';
      const maxHp = (isMetal ? 800 : 350) * hpMultiplier;
      this.barricades.push({
        id: `barricade_${Date.now()}`,
        type,
        x: worldX - 25,
        y: worldY - 10,
        width: 50,
        height: 20,
        hp: maxHp,
        maxHp,
        createdTime: Date.now(),
      });
    } else {
      const maxHp = 250 * hpMultiplier;
      this.placedStructures.push({
        id: `struct_${Date.now()}`,
        type,
        x: worldX,
        y: worldY,
        hp: maxHp,
        maxHp,
        customData: type === 'rain_collector' ? { waterStored: 0, maxWater: 5 } : {},
      });
    }

    // Consume 1 structure item
    itemInInv.quantity -= 1;
    this.cleanEmptyInventory();
    this.calculateWeight();

    soundManager.playCraftHammer();
    this.addXP(25);
    return true;
  }

  // --- LOOTING CONTAINERS ---
  public startLooting(containerId: string) {
    const c = this.containers.find(ct => ct.id === containerId);
    if (!c) return;

    this.player.lootingContainerId = containerId;
    this.player.lootProgress = 0;
    soundManager.playLoot();
  }

  public cancelLooting() {
    this.player.lootingContainerId = null;
    this.player.lootProgress = 0;
  }

  private updateLooting(dt: number) {
    if (!this.player.lootingContainerId) return;

    const c = this.containers.find(ct => ct.id === this.player.lootingContainerId);
    if (!c) {
      this.cancelLooting();
      return;
    }

    // Check distance
    const dist = Math.hypot(this.player.x - (c.x + c.width / 2), this.player.y - (c.y + c.height / 2));
    if (dist > 75) {
      this.cancelLooting();
      return;
    }

    // Progress
    this.player.lootProgress += (dt / 1000) * 0.9; // ~1.1s to complete
    if (this.player.lootProgress >= 1.0) {
      c.searched = true;
      this.addXP(15);
      // Container remains open in UI until closed by player
    }
  }

  public transferItemFromContainer(containerId: string, itemIdx: number) {
    const c = this.containers.find(ct => ct.id === containerId);
    if (!c || !c.items[itemIdx]) return;

    const item = c.items[itemIdx];
    // Check carry weight
    if (this.player.stats.weight + item.weight > this.player.stats.maxWeight + 8) {
      // Over maximum hard limit
      return;
    }

    this.addItemToInventory(item);
    c.items.splice(itemIdx, 1);
    this.calculateWeight();
    soundManager.playLoot();
  }

  public addItemToInventory(item: Item) {
    // If stackable, find existing stack
    if (item.stackable) {
      const existing = this.player.inventory.find(i => i.id === item.id);
      if (existing) {
        existing.quantity += item.quantity;
        return;
      }
    }
    this.player.inventory.push({ ...item });
  }

  // --- SOUND ALERT PROPAGATION ---
  private alertNearbyZombies(x: number, y: number, radius: number) {
    for (const z of this.zombies) {
      const dist = Math.hypot(z.x - x, z.y - y);
      if (dist <= radius) {
        z.state = 'chasing';
        z.targetX = x;
        z.targetY = y;
      }
    }
  }

  // --- KILL HANDLERS & XP PROGRESSION ---
  private handleZombieKilled(z: Zombie) {
    this.player.kills += 1;
    const isNight = this.timeState.isNight;
    const earnedXP = (z.type === 'sprinter' || isNight ? 45 : 25);
    this.addXP(earnedXP);
    soundManager.playZombieDeath();

    // Chance of dropping scrap or ammo
    if (Math.random() < 0.4) {
      const drops = ['scrap_metal', 'cloth', 'ammo_9mm', 'wood_plank'];
      const dropId = drops[Math.floor(Math.random() * drops.length)];
      this.containers.push({
        id: `drop_${Date.now()}_${Math.random()}`,
        name: 'Cadáver de Infectado',
        type: 'crate',
        x: z.x - 15,
        y: z.y - 15,
        width: 30,
        height: 30,
        items: [cloneItem(dropId, 1)],
        searched: false,
      });
    }

    // Remove zombie
    this.zombies = this.zombies.filter(item => item.id !== z.id);
  }

  private handleRaiderKilled(r: Raider) {
    this.player.kills += 1;
    this.addXP(80);
    soundManager.playZombieDeath();

    // Raider drops weapon & ammo
    const droppedWeapon = r.weapon === 'shotgun' ? 'shotgun_12g' : r.weapon === 'bat' ? 'spiked_bat' : 'pistol_9mm';
    this.containers.push({
      id: `drop_raider_${Date.now()}`,
      name: 'Mochila do Saqueador',
      type: 'crate',
      x: r.x - 15,
      y: r.y - 15,
      width: 35,
      height: 35,
      items: [cloneItem(droppedWeapon, 1), cloneItem('bandage', 2), cloneItem('canned_beans', 1)],
      searched: false,
    });

    this.raiders = this.raiders.filter(item => item.id !== r.id);
  }

  public addXP(amount: number) {
    this.player.xp += amount;
    if (this.player.xp >= this.player.xpToNextLevel) {
      this.player.level += 1;
      this.player.xp -= this.player.xpToNextLevel;
      this.player.xpToNextLevel = Math.floor(this.player.xpToNextLevel * 1.5);
      this.player.skillPoints += 1;
      soundManager.playLevelUp();
    }
  }

  public upgradeSkill(skillId: string): boolean {
    const skill = this.player.skills[skillId];
    if (!skill || this.player.skillPoints < skill.cost || skill.level >= skill.maxLevel) {
      return false;
    }

    this.player.skillPoints -= skill.cost;
    skill.level += 1;

    // Apply immediate stat upgrades if Athletics
    if (skillId === 'athletics') {
      this.player.stats.maxStamina = 100 + skill.level * 15;
      this.player.stats.maxWeight = 26 + skill.level * 3;
    }

    soundManager.playLevelUp();
    return true;
  }

  // --- SLEEP IN FORTIFIED BASE ---
  public sleepUntilMorning(): { success: boolean; message: string } {
    if (!this.player.currentBuildingId) {
      return { success: false, message: 'Você precisa estar dentro de uma casa fortificada para dormir com segurança!' };
    }

    // Check if zombies are chasing or inside the house
    const nearZombies = this.zombies.filter(z => Math.hypot(z.x - this.player.x, z.y - this.player.y) < 220);
    if (nearZombies.length > 0) {
      return { success: false, message: 'Não é possível descansar enquanto houver infectados rondando o perímetro!' };
    }

    // Advance time to 06:00 AM
    this.timeState.timeHours = 6.0;
    this.timeState.isNight = false;
    this.timeState.day += 1;
    this.player.daysSurvived += 1;

    // Restore stats
    this.player.stats.hp = Math.min(this.player.stats.maxHp, this.player.stats.hp + 40);
    this.player.stats.stamina = this.player.stats.maxStamina;
    this.player.stats.hunger = Math.max(10, this.player.stats.hunger - 30);
    this.player.stats.thirst = Math.max(10, this.player.stats.thirst - 35);

    this.addXP(100);
    soundManager.playLevelUp();
    return { success: true, message: 'Você descansou com segurança até o amanhecer. O perigo noturno passou!' };
  }

  // --- ITEM USAGE (Food, Water, Medicine) ---
  public useItem(item: Item, slotType: 'quick' | 'inventory', index: number) {
    let consumed = false;
    const stats = this.player.stats;

    if (item.category === 'food') {
      stats.hunger = Math.min(100, stats.hunger + (item.foodRestore || 0));
      stats.thirst = Math.min(100, stats.thirst + (item.waterRestore || 0));
      stats.hp = Math.min(stats.maxHp, stats.hp + (item.healthRestore || 0));
      soundManager.playEatDrink(false);
      consumed = true;
    } else if (item.category === 'water') {
      stats.thirst = Math.min(100, stats.thirst + (item.waterRestore || 0));
      if (item.foodRestore) stats.hunger = Math.min(100, stats.hunger + item.foodRestore);
      if (item.infectionHeal) stats.infection = Math.min(100, Math.max(0, stats.infection - item.infectionHeal));
      soundManager.playEatDrink(true);
      consumed = true;
    } else if (item.category === 'medical') {
      // Medicine skill bonus
      const medLvl = this.player.skills.medicine?.level || 0;
      const healBonus = 1 + medLvl * 0.15;

      if (item.healthRestore) stats.hp = Math.min(stats.maxHp, stats.hp + item.healthRestore * healBonus);
      if (item.infectionHeal) stats.infection = Math.max(0, stats.infection - item.infectionHeal * healBonus);
      soundManager.playEatDrink(false);
      consumed = true;
    }

    if (consumed) {
      item.quantity -= 1;
      if (item.quantity <= 0) {
        if (slotType === 'quick') {
          this.player.quickSlots[index] = null;
        } else {
          this.player.inventory.splice(index, 1);
        }
      }
      this.calculateWeight();
    }
  }

  // --- INVENTORY WEIGHT CALCULATION ---
  public calculateWeight() {
    let total = 0;
    for (const q of this.player.quickSlots) {
      if (q) total += q.weight * q.quantity;
    }
    for (const i of this.player.inventory) {
      total += i.weight * i.quantity;
    }
    this.player.stats.weight = parseFloat(total.toFixed(1));
  }

  private cleanEmptyInventory() {
    this.player.inventory = this.player.inventory.filter(i => i.quantity > 0);
    this.player.quickSlots = this.player.quickSlots.map(i => (i && i.quantity <= 0 ? null : i));
  }

  // --- PARTICLES & DECALS ---
  public spawnBlood(x: number, y: number, count = 6) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: Math.random() > 0.3 ? '#881337' : '#991b1b',
        size: Math.random() * 4 + 2,
        alpha: 0.9,
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.7,
        type: 'blood',
      });
    }

    if (Math.random() < 0.6) {
      this.addDecal({
        x: x + (Math.random() * 16 - 8),
        y: y + (Math.random() * 16 - 8),
        radius: Math.random() * 8 + 4,
        color: '#7f1d1d',
        alpha: 0.6,
        type: 'blood',
      });
    }
  }

  public addDecal(decal: Decal) {
    this.decals.push(decal);
    if (this.decals.length > 50) {
      this.decals.shift();
    }
  }

  private spawnDebris(x: number, y: number) {
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * 2 + 1;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        color: '#b45309',
        size: Math.random() * 3 + 2,
        alpha: 0.9,
        life: 0.4,
        maxLife: 0.4,
        type: 'debris',
      });
    }
  }

  private updateParticles(dt: number) {
    // Keep particles array tightly bounded
    if (this.particles.length > 40) {
      this.particles.splice(0, this.particles.length - 40);
    }
    const sec = dt / 1000;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= sec;
      p.alpha = Math.max(0, p.life / p.maxLife);
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }
}
