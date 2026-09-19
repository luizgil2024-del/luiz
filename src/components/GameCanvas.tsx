import React, { useEffect, useRef } from 'react';
import { GameEngine } from '../game/gameEngine';
import { CROSSWALKS, MAP_HEIGHT, MAP_WIDTH, STREETS, STREET_PROPS } from '../game/mapData';
import { StructureType } from '../types/game';

interface GameCanvasProps {
  engine: GameEngine;
  selectedBuildType: StructureType | null;
  onOpenContainer: (containerId: string) => void;
  onStructurePlaced: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  engine,
  selectedBuildType,
  onOpenContainer,
  onStructurePlaced,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mousePosRef = useRef<{ x: number; y: number; worldX: number; worldY: number }>({
    x: 0,
    y: 0,
    worldX: 0,
    worldY: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let lastTime = performance.now();

    const keys: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent scrolling on space / arrows
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
      keys[e.key] = true;
      keys[e.code] = true;

      // Quick slots (1-5)
      if (['1', '2', '3', '4', '5'].includes(e.key)) {
        const slotIdx = parseInt(e.key) - 1;
        engine.player.activeSlotIndex = slotIdx;
      }

      // Reload
      if (e.key === 'r' || e.key === 'R') {
        engine.triggerReload();
      }

      // Flashlight toggle
      if (e.key === 'f' || e.key === 'F') {
        engine.player.flashlightOn = !engine.player.flashlightOn;
      }

      // Interact / Loot (E)
      if (e.key === 'e' || e.key === 'E') {
        findAndInteractNearby();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key] = false;
      keys[e.code] = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const screenX = (e.clientX - rect.left) * scaleX;
      const screenY = (e.clientY - rect.top) * scaleY;

      // Camera offset
      const camX = engine.player.x - canvas.width / 2;
      const camY = engine.player.y - canvas.height / 2;

      mousePosRef.current = {
        x: screenX,
        y: screenY,
        worldX: camX + screenX,
        worldY: camY + screenY,
      };
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) { // Left click
        if (selectedBuildType) {
          // Place structure
          const success = engine.placeStructure(
            selectedBuildType,
            mousePosRef.current.worldX,
            mousePosRef.current.worldY
          );
          if (success) {
            onStructurePlaced();
          }
        } else {
          // Attack or Interact
          const nearContainer = getNearbyContainer();
          if (nearContainer && !nearContainer.searched) {
            engine.startLooting(nearContainer.id);
            onOpenContainer(nearContainer.id);
          } else {
            engine.triggerAttack();
          }
        }
      }
    };

    const findAndInteractNearby = () => {
      // Check doors first
      const doorResult = engine.toggleNearbyDoor();
      if (doorResult.toggled) {
        return;
      }
      // Check containers
      const nearC = getNearbyContainer();
      if (nearC) {
        engine.startLooting(nearC.id);
        onOpenContainer(nearC.id);
      }
    };

    const getNearbyContainer = () => {
      for (const c of engine.containers) {
        const dist = Math.hypot(engine.player.x - (c.x + c.width / 2), engine.player.y - (c.y + c.height / 2));
        if (dist < 70) return c;
      }
      return null;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);

    // Responsive Canvas Resizing
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // --- MAIN RENDER LOOP ---
    const render = (time: number) => {
      const dt = Math.min(time - lastTime, 50); // cap delta
      lastTime = time;

      // Update Engine
      engine.update(dt, keys, mousePosRef.current.worldX, mousePosRef.current.worldY);

      // Camera calculations (smooth center on player)
      const camX = engine.player.x - canvas.width / 2;
      const camY = engine.player.y - canvas.height / 2;

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background Ground (Urban concrete & grass soil)
      ctx.fillStyle = '#262626';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(-camX, -camY);

      // 1. Render Terrain, Streets & Sidewalks (Inspired by Photo)
      drawStreetsAndSidewalks(ctx, engine);

      // 2. Render Decals (Blood, Scorch marks, Casings)
      drawDecals(ctx, engine);

      // 3. Render Vehicles (Cabs, police cars, vans)
      drawVehicles(ctx, engine);

      // 4. Render Placed Base Structures & Traps
      drawPlacedStructures(ctx, engine);

      // 5. Render Buildings (Floors, Interior Furniture, or Roofs if outside)
      drawBuildings(ctx, engine);

      // 6. Render Street Props (Lamp posts, hydrants)
      drawStreetProps(ctx);

      // 7. Render Zombies & Raiders
      drawZombies(ctx, engine);
      drawRaiders(ctx, engine);

      // 8. Render Bullets & Particles
      drawBulletsAndParticles(ctx, engine);

      // 9. Render Player
      drawPlayer(ctx, engine);

      // 10. Render Build Preview Ghost
      if (selectedBuildType) {
        drawBuildGhost(ctx, selectedBuildType, mousePosRef.current.worldX, mousePosRef.current.worldY);
      }

      ctx.restore();

      // 11. Dynamic Lighting & Day/Night Darkness Mask
      drawLightingOverlay(ctx, canvas, engine, camX, camY);

      // 12. Floating Interaction Prompts & Search Bar
      drawHUDOverlays(ctx, canvas, engine, camX, camY);

      ctx.restore();

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [engine, selectedBuildType, onOpenContainer, onStructurePlaced]);

  return (
    <div id="game-canvas-container" className="relative w-full h-full overflow-hidden bg-neutral-950 select-none cursor-crosshair">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};

// --- DRAWING HELPER FUNCTIONS ---

function drawStreetsAndSidewalks(ctx: CanvasRenderingContext2D, engine: GameEngine) {
  // Ground grass/dirt
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

  // Sidewalks around streets
  ctx.fillStyle = '#475569';
  for (const s of STREETS) {
    const pad = 35;
    ctx.fillRect(s.x - pad, s.y - pad, s.width + pad * 2, s.height + pad * 2);
  }

  // Asphalt Streets
  ctx.fillStyle = '#18181b';
  for (const s of STREETS) {
    ctx.fillRect(s.x, s.y, s.width, s.height);

    // Curbstones line
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.strokeRect(s.x, s.y, s.width, s.height);

    // Street markings (Double yellow center line)
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    if (s.isVertical) {
      const midX = s.x + s.width / 2;
      ctx.beginPath();
      ctx.moveTo(midX - 3, s.y);
      ctx.lineTo(midX - 3, s.y + s.height);
      ctx.moveTo(midX + 3, s.y);
      ctx.lineTo(midX + 3, s.y + s.height);
      ctx.stroke();

      // White lane dashes
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.setLineDash([20, 25]);
      ctx.beginPath();
      ctx.moveTo(s.x + s.width * 0.25, s.y);
      ctx.lineTo(s.x + s.width * 0.25, s.y + s.height);
      ctx.moveTo(s.x + s.width * 0.75, s.y);
      ctx.lineTo(s.x + s.width * 0.75, s.y + s.height);
      ctx.stroke();
    } else {
      const midY = s.y + s.height / 2;
      ctx.beginPath();
      ctx.moveTo(s.x, midY - 3);
      ctx.lineTo(s.x + s.width, midY - 3);
      ctx.moveTo(s.x, midY + 3);
      ctx.lineTo(s.x + s.width, midY + 3);
      ctx.stroke();

      // White lane dashes
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.setLineDash([20, 25]);
      ctx.beginPath();
      ctx.moveTo(s.x, s.y + s.height * 0.25);
      ctx.lineTo(s.x + s.width, s.y + s.height * 0.25);
      ctx.moveTo(s.x, s.y + s.height * 0.75);
      ctx.lineTo(s.x + s.width, s.y + s.height * 0.75);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  // Crosswalks (Faixas de pedestre como na foto)
  ctx.fillStyle = '#f8fafc';
  for (const cw of CROSSWALKS) {
    const barCount = 6;
    if (cw.width > cw.height) {
      const barW = cw.width / (barCount * 2);
      for (let i = 0; i < barCount; i++) {
        ctx.fillRect(cw.x + i * barW * 2, cw.y, barW, cw.height);
      }
    } else {
      const barH = cw.height / (barCount * 2);
      for (let i = 0; i < barCount; i++) {
        ctx.fillRect(cw.x, cw.y + i * barH * 2, cw.width, barH);
      }
    }
  }
}

function drawDecals(ctx: CanvasRenderingContext2D, engine: GameEngine) {
  for (const d of engine.decals) {
    ctx.save();
    ctx.globalAlpha = d.alpha;
    ctx.fillStyle = d.color;
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawVehicles(ctx: CanvasRenderingContext2D, engine: GameEngine) {
  for (const v of engine.vehicles) {
    ctx.save();
    ctx.translate(v.x, v.y);
    ctx.rotate(v.angle);

    const w = 48;
    const h = 88;

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(-w / 2 + 4, -h / 2 + 6, w, h);

    // Car Body
    ctx.fillStyle = v.color;
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, 8);
    ctx.fill();

    // Windshields (Dark glass)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-w / 2 + 6, -h / 2 + 18, w - 12, 16); // Front windshield
    ctx.fillRect(-w / 2 + 6, h / 2 - 26, w - 12, 14); // Rear windshield

    // Roof
    ctx.fillStyle = v.model === 'cab' ? '#eab308' : v.model === 'police' ? '#ffffff' : v.color;
    ctx.fillRect(-w / 2 + 6, -h / 2 + 34, w - 12, 28);

    // Taxi Roof Light or Police Sirens
    if (v.model === 'cab') {
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-10, -h / 2 + 44, 20, 8);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 7px sans-serif';
      ctx.fillText('TAXI', -8, -h / 2 + 50);
    } else if (v.model === 'police') {
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-14, -h / 2 + 44, 12, 8);
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(2, -h / 2 + 44, 12, 8);
    }

    // Headlights & Taillights
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-w / 2 + 4, -h / 2, 8, 4);
    ctx.fillRect(w / 2 - 12, -h / 2, 8, 4);

    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-w / 2 + 4, h / 2 - 4, 8, 4);
    ctx.fillRect(w / 2 - 12, h / 2 - 4, 8, 4);

    ctx.restore();
  }
}

function drawPlacedStructures(ctx: CanvasRenderingContext2D, engine: GameEngine) {
  // Barricades (Wood or Metal)
  for (const b of engine.barricades) {
    if (b.hp <= 0) continue;
    ctx.save();
    const isMetal = b.type === 'barricade_metal';
    ctx.fillStyle = isMetal ? '#475569' : '#854d0e';
    ctx.fillRect(b.x, b.y, b.width, b.height);

    ctx.strokeStyle = isMetal ? '#94a3b8' : '#ca8a04';
    ctx.lineWidth = 2;
    ctx.strokeRect(b.x, b.y, b.width, b.height);

    // HP Bar over barricade
    const hpRatio = b.hp / b.maxHp;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(b.x, b.y - 8, b.width, 5);
    ctx.fillStyle = hpRatio > 0.5 ? '#22c55e' : hpRatio > 0.25 ? '#eab308' : '#ef4444';
    ctx.fillRect(b.x, b.y - 8, b.width * hpRatio, 5);

    ctx.restore();
  }

  // Placed Structures (Spikes, Chests, Rain collectors, Campfires, Sleeping Bags, Spotlights)
  for (const st of engine.placedStructures) {
    ctx.save();
    ctx.translate(st.x, st.y);

    if (st.type === 'spike_trap') {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-18, -18, 36, 36);
      // Spikes
      ctx.fillStyle = '#d97706';
      for (let i = -12; i <= 12; i += 8) {
        for (let j = -12; j <= 12; j += 8) {
          ctx.beginPath();
          ctx.arc(i, j, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (st.type === 'storage_chest') {
      ctx.fillStyle = '#713f12';
      ctx.fillRect(-16, -12, 32, 24);
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 2;
      ctx.strokeRect(-16, -12, 32, 24);
      ctx.fillStyle = '#eab308';
      ctx.fillRect(-3, -2, 6, 6); // Lock
    } else if (st.type === 'rain_collector') {
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();
      // Blue water level
      const waterLvl = (st.customData?.waterStored || 0) / (st.customData?.maxWater || 5);
      if (waterLvl > 0) {
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(0, 0, 14 * waterLvl, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (st.type === 'campfire') {
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();
      // Flame glow
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.arc(0, 0, 8 + Math.sin(Date.now() * 0.01) * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (st.type === 'sleeping_bag') {
      ctx.fillStyle = '#065f46';
      ctx.fillRect(-12, -20, 24, 40);
      ctx.fillStyle = '#ecfdf5';
      ctx.fillRect(-10, -18, 20, 10); // Pillow
    } else if (st.type === 'spotlight') {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-12, -12, 24, 24);
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

function drawBuildings(ctx: CanvasRenderingContext2D, engine: GameEngine) {
  const isPlayerInside = (bId: string) => engine.player.currentBuildingId === bId;

  for (const b of engine.buildings) {
    const playerInside = isPlayerInside(b.id);

    // 1. Interior Floor
    ctx.fillStyle = b.floorColor;
    ctx.fillRect(b.x, b.y, b.width, b.height);

    // Grid tile lines for interior floor
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.lineWidth = 1;
    for (let x = b.x; x < b.x + b.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, b.y);
      ctx.lineTo(x, b.y + b.height);
      ctx.stroke();
    }
    for (let y = b.y; y < b.y + b.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(b.x, y);
      ctx.lineTo(b.x + b.width, y);
      ctx.stroke();
    }

    // 2. Interior Room Dividers & Room Labels (Only visible when explored or inside)
    for (const r of b.rooms) {
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 3;
      ctx.strokeRect(r.x, r.y, r.width, r.height);

      if (playerInside) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.font = '600 12px sans-serif';
        ctx.fillText(r.name, r.x + 8, r.y + 20);
      }
    }

    // 3. Loot Containers inside this building
    for (const c of engine.containers) {
      if (c.buildingId === b.id) {
        drawContainer(ctx, c, playerInside);
      }
    }

    // 4. Building Walls (Exterior)
    ctx.strokeStyle = b.wallColor;
    ctx.lineWidth = 8;
    ctx.strokeRect(b.x, b.y, b.width, b.height);

    // Draw Doorways & Doors
    for (const d of b.doors) {
      if (d.isOpen) {
        // Doorway threshold opening (erases wall border with doorway floor)
        ctx.fillStyle = b.floorColor;
        ctx.fillRect(d.x - 2, d.y - 2, d.width + 4, d.height + 4);

        // Wooden Door jambs
        ctx.fillStyle = '#451a03';
        ctx.fillRect(d.x - 3, d.y, 4, d.height);
        ctx.fillRect(d.x + d.width - 1, d.y, 4, d.height);

        // Swung-open door leaf against inner wall
        ctx.fillStyle = '#78350f';
        if (d.width > d.height) {
          ctx.fillRect(d.x, d.y - d.width * 0.4, 6, d.width * 0.7);
        } else {
          ctx.fillRect(d.x + d.height * 0.4, d.y, d.height * 0.7, 6);
        }

        // Exit marker for starting residence so user immediately sees how to exit to the street
        if (b.id === 'b_house_1' && d.y > 500) {
          // Doormat inside
          ctx.fillStyle = '#14532d';
          ctx.fillRect(d.x - 6, d.y - 32, d.width + 12, 28);
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(d.x - 6, d.y - 32, d.width + 12, 28);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🚪 SAÍDA P/ RUA', d.x + d.width / 2, d.y - 18);

          // Pulsing green chevron arrow pointing outside to street
          const pulse = (Math.sin(Date.now() * 0.008) + 1) * 3;
          ctx.fillStyle = '#4ade80';
          ctx.beginPath();
          ctx.moveTo(d.x + d.width / 2 - 8, d.y - 10 + pulse);
          ctx.lineTo(d.x + d.width / 2 + 8, d.y - 10 + pulse);
          ctx.lineTo(d.x + d.width / 2, d.y - 2 + pulse);
          ctx.fill();
        }
      } else {
        // Closed Door
        ctx.fillStyle = '#78350f';
        ctx.fillRect(d.x, d.y, d.width, d.height);
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 2;
        ctx.strokeRect(d.x, d.y, d.width, d.height);

        // Brass doorknob
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(d.x + (d.width > d.height ? d.width * 0.75 : d.width / 2), d.y + (d.width > d.height ? d.height / 2 : d.height * 0.75), 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw Windows
    for (const w of b.windows) {
      ctx.fillStyle = w.isBroken ? '#38bdf8' : '#7dd3fc';
      ctx.fillRect(w.x, w.y, w.width, w.height);
    }

    // 5. Roof Rendering (Only rendered if player is OUTSIDE this building!)
    if (!playerInside) {
      ctx.save();
      ctx.fillStyle = b.roofColor;
      ctx.fillRect(b.x, b.y, b.width, b.height);

      // Roof details (water tank, air vents, rooftop parapet as in the uploaded image)
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 4;
      ctx.strokeRect(b.x + 6, b.y + 6, b.width - 12, b.height - 12);

      // Water tanks / Air units on rooftop
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(b.x + b.width - 45, b.y + 45, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Building Name Sign on the Roof
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(b.x + 16, b.y + 16, b.width - 80, 26);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(b.name, b.x + 24, b.y + 34);

      ctx.restore();
    }
  }

  // Containers outside buildings (vehicle trunks, corpses)
  for (const c of engine.containers) {
    if (!c.buildingId) {
      drawContainer(ctx, c, true);
    }
  }
}

function drawContainer(ctx: CanvasRenderingContext2D, c: any, isVisible: boolean) {
  if (!isVisible) return;
  ctx.save();

  // Container Box
  ctx.fillStyle = c.searched ? '#64748b' : '#d97706';
  ctx.fillRect(c.x, c.y, c.width, c.height);

  ctx.strokeStyle = c.searched ? '#334155' : '#fef08a';
  ctx.lineWidth = 2;
  ctx.strokeRect(c.x, c.y, c.width, c.height);

  // Subtle pulsing glow if unsearched and has loot
  if (!c.searched && c.items.length > 0) {
    const pulse = (Math.sin(Date.now() * 0.006) + 1) / 2;
    ctx.fillStyle = `rgba(254, 240, 138, ${0.2 + pulse * 0.3})`;
    ctx.fillRect(c.x - 2, c.y - 2, c.width + 4, c.height + 4);
  }

  // Icon / Letter
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px sans-serif';
  const label = c.type === 'fridge' ? '❄' : c.type === 'firstaid' ? '+' : c.type === 'locker' ? '🔒' : '📦';
  ctx.fillText(label, c.x + c.width / 2 - 4, c.y + c.height / 2 + 4);

  ctx.restore();
}

function drawStreetProps(ctx: CanvasRenderingContext2D) {
  for (const p of STREET_PROPS) {
    ctx.save();
    if (p.type === 'lamppost') {
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'hydrant') {
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#991b1b';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawZombies(ctx: CanvasRenderingContext2D, engine: GameEngine) {
  for (const z of engine.zombies) {
    ctx.save();
    ctx.translate(z.x, z.y);
    ctx.rotate(z.angle);

    const isSprinter = z.type === 'sprinter';
    const isBloater = z.type === 'bloater';
    const radius = isBloater ? 18 : 12;

    // Zombie Body
    ctx.fillStyle = isBloater ? '#3f6212' : isSprinter ? '#4d7c0f' : '#65a30d';
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    // Ripped clothes
    ctx.fillStyle = '#334155';
    ctx.fillRect(-radius * 0.7, -radius * 0.5, radius * 1.4, radius);

    // Hands reaching forward
    ctx.fillStyle = '#65a30d';
    ctx.beginPath();
    ctx.arc(radius + 4, -radius * 0.4, 4, 0, Math.PI * 2);
    ctx.arc(radius + 4, radius * 0.4, 4, 0, Math.PI * 2);
    ctx.fill();

    // Eyes: blood red at night or green during day
    ctx.fillStyle = z.isNightFrenzied ? '#ef4444' : '#fef08a';
    ctx.beginPath();
    ctx.arc(radius * 0.5, -4, 2.5, 0, Math.PI * 2);
    ctx.arc(radius * 0.5, 4, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Glowing eyes trail at night
    if (z.isNightFrenzied) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
      ctx.beginPath();
      ctx.arc(radius * 0.5, -4, 6, 0, Math.PI * 2);
      ctx.arc(radius * 0.5, 4, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Health Bar
    if (z.hp < z.maxHp) {
      ctx.rotate(-z.angle);
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(-16, -26, 32, 4);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-16, -26, 32 * (z.hp / z.maxHp), 4);
    }

    ctx.restore();
  }
}

function drawRaiders(ctx: CanvasRenderingContext2D, engine: GameEngine) {
  for (const r of engine.raiders) {
    ctx.save();
    ctx.translate(r.x, r.y);
    ctx.rotate(r.angle);

    // Raider Body (Bandana, Jacket)
    ctx.fillStyle = '#b91c1c'; // Red Bandana / Leather Jacket
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.fill();

    // Weapon in hand
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(6, 4, 16, 4);

    // Health Bar
    ctx.rotate(-r.angle);
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(-16, -26, 32, 4);
    ctx.fillStyle = '#f97316';
    ctx.fillRect(-16, -26, 32 * (r.hp / r.maxHp), 4);

    // Name tag
    ctx.fillStyle = '#fca5a5';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('Saqueador', -22, -30);

    ctx.restore();
  }
}

function drawPlayer(ctx: CanvasRenderingContext2D, engine: GameEngine) {
  const p = engine.player;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle);

  // Movement animation
  const stridePhase = (engine as any).stepDistance * 0.22;
  const leftLegOffset = Math.sin(stridePhase) * 7;
  const rightLegOffset = -Math.sin(stridePhase) * 7;

  // 1. Soft Dynamic Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
  ctx.beginPath();
  ctx.ellipse(0, 2, 16, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. Animated Legs with Combat Boots
  // Left leg & combat boot
  ctx.save();
  ctx.translate(leftLegOffset, -9);
  ctx.fillStyle = '#1e293b'; // Dark tactical navy pants
  ctx.fillRect(-5, -4, 11, 8);
  ctx.fillStyle = '#0f172a'; // Black leather combat boot
  ctx.beginPath();
  ctx.roundRect(-4, -4, 13, 7, 2);
  ctx.fill();
  ctx.fillStyle = '#334155'; // Reinforced toe cap
  ctx.fillRect(5, -4, 4, 7);
  ctx.restore();

  // Right leg & combat boot
  ctx.save();
  ctx.translate(rightLegOffset, 9);
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(-5, -4, 11, 8);
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.roundRect(-4, -3, 13, 7, 2);
  ctx.fill();
  ctx.fillStyle = '#334155';
  ctx.fillRect(5, -3, 4, 7);
  ctx.restore();

  // 3. Tactical Military Backpack (Behind back)
  ctx.fillStyle = '#064e3b'; // Military olive green
  ctx.beginPath();
  ctx.roundRect(-16, -11, 10, 22, 3);
  ctx.fill();
  ctx.strokeStyle = '#022c22';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Bedroll rolled on top of backpack
  ctx.fillStyle = '#78350f';
  ctx.fillRect(-18, -9, 4, 18);

  // 4. Human Torso & Shoulders
  // Base survivor jacket (Deep blue utility jacket)
  ctx.fillStyle = '#2563eb';
  ctx.beginPath();
  ctx.roundRect(-10, -13, 17, 26, 6);
  ctx.fill();

  // Tactical Armored Vest / Chest Rig
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.roundRect(-8, -10, 14, 20, 3);
  ctx.fill();

  // Ammo pouches & tactical harness straps
  ctx.fillStyle = '#334155';
  ctx.fillRect(-6, -8, 9, 4); // Ammo mag pouch
  ctx.fillRect(-6, 4, 9, 4);  // Utility pouch

  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-10, -9);
  ctx.lineTo(2, -9);
  ctx.moveTo(-10, 9);
  ctx.lineTo(2, 9);
  ctx.stroke();

  // 5. Weapon and Articulated Arms & Hands
  const activeItem = p.quickSlots[p.activeSlotIndex];
  const isGun = activeItem && activeItem.category === 'weapon' && activeItem.weaponType !== 'melee';
  const isMelee = activeItem && activeItem.category === 'weapon' && activeItem.weaponType === 'melee';

  const skinTone = '#fcd34d'; // Warm human skin tone
  const skinShadow = '#d97706';

  if (isGun) {
    // Two-handed firearm isosceles shooting grip
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';

    // Left arm
    ctx.beginPath();
    ctx.moveTo(-2, -11);
    ctx.lineTo(10, -6);
    ctx.stroke();

    // Right arm
    ctx.beginPath();
    ctx.moveTo(-2, 11);
    ctx.lineTo(10, 6);
    ctx.stroke();

    // Hands gripping weapon
    ctx.fillStyle = skinTone;
    ctx.beginPath();
    ctx.arc(11, -4, 3.5, 0, Math.PI * 2);
    ctx.arc(11, 4, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Gun barrel & receiver
    ctx.fillStyle = '#0f172a';
    const barrelLen = activeItem.id === 'shotgun' ? 24 : activeItem.id === 'rifle' ? 26 : 16;
    ctx.fillRect(10, -2.5, barrelLen, 5);
    ctx.fillStyle = '#334155';
    ctx.fillRect(8, -3, 8, 6);

    // Muzzle flash when firing
    if (p.isAttacking && p.attackTimer > 0) {
      ctx.save();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(10 + barrelLen + 4, 0, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(10 + barrelLen + 6, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  } else if (isMelee) {
    // Melee attack stance (swinging knife, bat, crowbar, axe)
    const swingAngle = p.isAttacking ? Math.sin((p.attackTimer / 250) * Math.PI) * 0.8 : 0;
    ctx.save();
    ctx.rotate(swingAngle);

    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-2, 11);
    ctx.lineTo(12, 6);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-2, -11);
    ctx.lineTo(8, -2);
    ctx.stroke();

    // Hands
    ctx.fillStyle = skinTone;
    ctx.beginPath();
    ctx.arc(12, 5, 3.5, 0, Math.PI * 2);
    ctx.arc(10, 2, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Melee weapon asset
    if (activeItem.id === 'knife') {
      ctx.fillStyle = '#94a3b8'; // Steel blade
      ctx.fillRect(12, 4, 13, 3);
      ctx.fillStyle = '#451a03'; // Handle
      ctx.fillRect(8, 4, 5, 3);
    } else {
      ctx.fillStyle = '#92400e'; // Wooden bat
      ctx.fillRect(10, 3, 24, 5);
      if (activeItem.id === 'bat_spiked') {
        ctx.fillStyle = '#e2e8f0';
        for (let s = 18; s <= 30; s += 4) {
          ctx.fillRect(s, 1, 2, 8);
        }
      }
    }
    ctx.restore();
  } else {
    // Unarmed / Carrying item - arms swing naturally with stride
    const armSwing = Math.sin(stridePhase) * 4;
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';

    // Left arm & hand
    ctx.beginPath();
    ctx.moveTo(-2, -11);
    ctx.lineTo(4 - armSwing, -13);
    ctx.stroke();
    ctx.fillStyle = skinTone;
    ctx.beginPath();
    ctx.arc(5 - armSwing, -13, 3, 0, Math.PI * 2);
    ctx.fill();

    // Right arm & hand
    ctx.beginPath();
    ctx.moveTo(-2, 11);
    ctx.lineTo(4 + armSwing, 13);
    ctx.stroke();
    ctx.fillStyle = skinTone;
    ctx.beginPath();
    ctx.arc(5 + armSwing, 13, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // 6. Tactical Flashlight on shoulder/chest
  if (p.flashlightOn) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(8, -14, 8, 4);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(15, -14, 2, 4);
  }

  // 7. Human Head & Facial Features
  // Neck
  ctx.fillStyle = skinShadow;
  ctx.beginPath();
  ctx.arc(-1, 0, 5.5, 0, Math.PI * 2);
  ctx.fill();

  // Head Oval
  ctx.fillStyle = skinTone;
  ctx.beginPath();
  ctx.ellipse(0, 0, 8.5, 7.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ears
  ctx.fillStyle = skinTone;
  ctx.beginPath();
  ctx.arc(0, -8, 2.2, 0, Math.PI * 2);
  ctx.arc(0, 8, 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Hair / Cap Back
  ctx.fillStyle = '#78350f';
  ctx.beginPath();
  ctx.arc(-2, 0, 7.5, Math.PI * 0.4, Math.PI * 1.6);
  ctx.fill();

  // Survivor Tactical Cap & Visor
  ctx.fillStyle = '#1e3a8a'; // Navy baseball cap
  ctx.beginPath();
  ctx.arc(-1, 0, 7.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#172554'; // Visor shade forward
  ctx.beginPath();
  ctx.ellipse(5, 0, 5, 6, 0, -Math.PI * 0.45, Math.PI * 0.45);
  ctx.fill();

  // Expressive Human Eyes looking forward
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(3, -4, 3, 2.5);
  ctx.fillRect(3, 1.5, 3, 2.5);

  // Pupils
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(4.5, -3.5, 1.5, 1.5);
  ctx.fillRect(4.5, 2, 1.5, 1.5);

  ctx.restore();
}

function drawBulletsAndParticles(ctx: CanvasRenderingContext2D, engine: GameEngine) {
  // Bullets
  for (const b of engine.bullets) {
    ctx.save();
    ctx.strokeStyle = b.isPlayer ? '#fde047' : '#ef4444';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x - b.vx * 1.5, b.y - b.vy * 1.5);
    ctx.stroke();
    ctx.restore();
  }

  // Particles (Blood, Fire, Flash)
  for (const p of engine.particles) {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawBuildGhost(
  ctx: CanvasRenderingContext2D,
  structureType: StructureType,
  worldX: number,
  worldY: number
) {
  ctx.save();
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = '#22c55e';
  ctx.strokeStyle = '#15803d';
  ctx.lineWidth = 2;

  if (structureType === 'barricade_wood' || structureType === 'barricade_metal') {
    ctx.fillRect(worldX - 25, worldY - 10, 50, 20);
    ctx.strokeRect(worldX - 25, worldY - 10, 50, 20);
  } else {
    ctx.beginPath();
    ctx.arc(worldX, worldY, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawLightingOverlay(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  engine: GameEngine,
  camX: number,
  camY: number
) {
  const p = engine.player;
  const screenPx = p.x - camX;
  const screenPy = p.y - camY;
  const ambient = engine.timeState.ambientLight;

  if (ambient >= 0.98) return; // Full daylight, no darkness mask needed

  ctx.save();

  // Create an offscreen darkness layer
  const darknessAlpha = Math.max(0, 1.0 - ambient);
  ctx.fillStyle = `rgba(3, 7, 18, ${darknessAlpha * 0.94})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Cut light holes using destination-out
  ctx.globalCompositeOperation = 'destination-out';

  // 1. Small ambient circle around player
  const playerAura = ctx.createRadialGradient(screenPx, screenPy, 5, screenPx, screenPy, 90);
  playerAura.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
  playerAura.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = playerAura;
  ctx.beginPath();
  ctx.arc(screenPx, screenPy, 90, 0, Math.PI * 2);
  ctx.fill();

  // 2. Player Flashlight Cone (if turned on)
  if (p.flashlightOn) {
    const reach = 360;
    const coneAngle = 0.65; // ~37 degrees each side
    const startAngle = p.angle - coneAngle;
    const endAngle = p.angle + coneAngle;

    const flashGrad = ctx.createRadialGradient(screenPx, screenPy, 10, screenPx, screenPy, reach);
    flashGrad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
    flashGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.8)');
    flashGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = flashGrad;
    ctx.beginPath();
    ctx.moveTo(screenPx, screenPy);
    ctx.arc(screenPx, screenPy, reach, startAngle, endAngle);
    ctx.closePath();
    ctx.fill();
  }

  // 3. Base Campfires & Spotlights
  for (const st of engine.placedStructures) {
    const stScreenX = st.x - camX;
    const stScreenY = st.y - camY;

    if (st.type === 'campfire') {
      const campGrad = ctx.createRadialGradient(stScreenX, stScreenY, 5, stScreenX, stScreenY, 140);
      campGrad.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
      campGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = campGrad;
      ctx.beginPath();
      ctx.arc(stScreenX, stScreenY, 140, 0, Math.PI * 2);
      ctx.fill();
    } else if (st.type === 'spotlight') {
      const spotGrad = ctx.createRadialGradient(stScreenX, stScreenY, 10, stScreenX, stScreenY, 220);
      spotGrad.addColorStop(0, 'rgba(0, 0, 0, 1.0)');
      spotGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = spotGrad;
      ctx.beginPath();
      ctx.arc(stScreenX, stScreenY, 220, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawHUDOverlays(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  engine: GameEngine,
  camX: number,
  camY: number
) {
  const p = engine.player;
  const screenPx = p.x - camX;
  const screenPy = p.y - camY;

  // 1. Looting Progress Bar
  if (p.lootingContainerId && p.lootProgress > 0) {
    const barW = 120;
    const barH = 10;
    const bx = screenPx - barW / 2;
    const by = screenPy - 50;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(bx - 2, by - 2, barW + 4, barH + 4);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(bx, by, barW * p.lootProgress, barH);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Revistando...', screenPx, by - 5);
    ctx.restore();
  }

  // 2. Reload Progress
  if (p.isReloading) {
    const barW = 90;
    const barH = 8;
    const bx = screenPx - barW / 2;
    const by = screenPy - 36;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(bx, by, barW, barH);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(bx, by, barW * p.reloadProgress, barH);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Recarregando...', screenPx, by - 4);
    ctx.restore();
  }

  // 3. Nearby Container Interaction Prompt
  for (const c of engine.containers) {
    const dist = Math.hypot(p.x - (c.x + c.width / 2), p.y - (c.y + c.height / 2));
    if (dist < 65 && !p.lootingContainerId) {
      const cScreenX = c.x + c.width / 2 - camX;
      const cScreenY = c.y - 12 - camY;

      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      const text = `[E] ${c.name}`;
      ctx.font = 'bold 11px sans-serif';
      const tw = ctx.measureText(text).width;
      ctx.fillRect(cScreenX - tw / 2 - 8, cScreenY - 14, tw + 16, 20);
      ctx.strokeRect(cScreenX - tw / 2 - 8, cScreenY - 14, tw + 16, 20);
      ctx.fillStyle = '#fef08a';
      ctx.textAlign = 'center';
      ctx.fillText(text, cScreenX, cScreenY);
      ctx.restore();
      break;
    }
  }

  // 4. Nearby Door Interaction Prompt
  for (const b of engine.buildings) {
    for (const d of b.doors) {
      const doorMidX = d.x + d.width / 2;
      const doorMidY = d.y + d.height / 2;
      const dist = Math.hypot(p.x - doorMidX, p.y - doorMidY);
      if (dist < 65) {
        const dScreenX = doorMidX - camX;
        const dScreenY = doorMidY - camY - 20;

        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = d.isOpen ? '#22c55e' : '#eab308';
        ctx.lineWidth = 1.5;

        const doorLabel = b.id === 'b_house_1' && d.y > 500
          ? (d.isOpen ? '🚪 [E] SAIR PARA A RUA' : '🚪 [E] ABRIR PORTA DA RUA')
          : (d.isOpen ? '🚪 [E] Fechar Porta' : '🚪 [E] Abrir Porta');

        ctx.font = 'bold 11px sans-serif';
        const tw = ctx.measureText(doorLabel).width;
        ctx.fillRect(dScreenX - tw / 2 - 8, dScreenY - 14, tw + 16, 22);
        ctx.strokeRect(dScreenX - tw / 2 - 8, dScreenY - 14, tw + 16, 22);
        ctx.fillStyle = d.isOpen ? '#86efac' : '#fef08a';
        ctx.textAlign = 'center';
        ctx.fillText(doorLabel, dScreenX, dScreenY + 2);
        ctx.restore();
        break;
      }
    }
  }
}
