import * as THREE from 'three';
import { PlacedStructure } from '../../types/game';

export interface Structure3DInstance {
  structureData: PlacedStructure;
  mesh: THREE.Group;
  updateState?: (dt: number, time: number) => void;
  campfireLight?: THREE.PointLight;
  spotlight?: THREE.SpotLight;
}

// Materials Cache for Structures
const timberPostMat = new THREE.MeshStandardMaterial({
  color: '#4e2a10',
  roughness: 0.85,
  metalness: 0.05,
});

const woodPlankLightMat = new THREE.MeshStandardMaterial({
  color: '#92400e',
  roughness: 0.75,
  metalness: 0.05,
});

const woodPlankDarkMat = new THREE.MeshStandardMaterial({
  color: '#6e340d',
  roughness: 0.8,
  metalness: 0.05,
});

const woodPlankAgedMat = new THREE.MeshStandardMaterial({
  color: '#78461f',
  roughness: 0.85,
  metalness: 0.05,
});

const nailSteelMat = new THREE.MeshStandardMaterial({
  color: '#cbd5e1',
  roughness: 0.25,
  metalness: 0.9,
});

const barbedWireMat = new THREE.MeshStandardMaterial({
  color: '#64748b',
  roughness: 0.35,
  metalness: 0.8,
});

const heavySteelMat = new THREE.MeshStandardMaterial({
  color: '#1e293b',
  roughness: 0.4,
  metalness: 0.85,
});

const corrugatedSteelMat = new THREE.MeshStandardMaterial({
  color: '#475569',
  roughness: 0.35,
  metalness: 0.8,
});

const warningYellowMat = new THREE.MeshStandardMaterial({
  color: '#eab308',
  roughness: 0.5,
  metalness: 0.1,
});

const warningDarkMat = new THREE.MeshStandardMaterial({
  color: '#0f172a',
  roughness: 0.8,
});

const spikeIronMat = new THREE.MeshStandardMaterial({
  color: '#94a3b8',
  roughness: 0.25,
  metalness: 0.85,
});

const bloodTipMat = new THREE.MeshStandardMaterial({
  color: '#881337',
  roughness: 0.3,
  metalness: 0.2,
});

const ropeHempMat = new THREE.MeshStandardMaterial({
  color: '#b45309',
  roughness: 0.95,
  metalness: 0.0,
});

const soilDirtMat = new THREE.MeshStandardMaterial({
  color: '#382314',
  roughness: 0.95,
});

const polyBarrelBlueMat = new THREE.MeshStandardMaterial({
  color: '#0284c7',
  roughness: 0.35,
  metalness: 0.2,
});

const waterSurfaceMat = new THREE.MeshStandardMaterial({
  color: '#38bdf8',
  roughness: 0.1,
  metalness: 0.4,
  transparent: true,
  opacity: 0.8,
});

const blueTarpMat = new THREE.MeshStandardMaterial({
  color: '#1d4ed8',
  roughness: 0.5,
  metalness: 0.1,
});

const brassFaucetMat = new THREE.MeshStandardMaterial({
  color: '#d97706',
  roughness: 0.25,
  metalness: 0.9,
});

const riverRockMat = new THREE.MeshStandardMaterial({
  color: '#475569',
  roughness: 0.9,
  metalness: 0.05,
});

const charcoalAshMat = new THREE.MeshStandardMaterial({
  color: '#0f172a',
  roughness: 0.95,
});

const emberCoreMat = new THREE.MeshStandardMaterial({
  color: '#ea580c',
  emissive: '#dc2626',
  emissiveIntensity: 1.2,
  roughness: 0.7,
});

const fireFlameMat = new THREE.MeshBasicMaterial({
  color: '#f97316',
});

const fireCoreMat = new THREE.MeshBasicMaterial({
  color: '#fef08a',
});

const castIronPotMat = new THREE.MeshStandardMaterial({
  color: '#18181b',
  roughness: 0.6,
  metalness: 0.7,
});

const batteryBodyMat = new THREE.MeshStandardMaterial({
  color: '#18181b',
  roughness: 0.4,
  metalness: 0.3,
});

const redCableMat = new THREE.MeshStandardMaterial({
  color: '#ef4444',
  roughness: 0.5,
});

const sleepingBagMat = new THREE.MeshStandardMaterial({
  color: '#1e3a8a',
  roughness: 0.8,
});

export function createDetailedStructure3D(st: PlacedStructure): Structure3DInstance {
  const sGroup = new THREE.Group();
  sGroup.position.set(st.x, 0, st.y);

  let updateState: ((dt: number, time: number) => void) | undefined;
  let campfireLight: THREE.PointLight | undefined;
  let spotlightLight: THREE.SpotLight | undefined;

  if (st.type === 'storage_chest' || (st as any).type === 'storage_box') {
    // ==========================================================
    // BAÚ DE SUPRIMENTOS DO JOGADOR (Madeira Rústica, Ferro, Cadeado e Alças)
    // ==========================================================
    const w = 22;
    const h = 13;
    const d = 16;

    // Wood base chest
    const chestBox = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), woodPlankDarkMat);
    chestBox.position.y = h / 2 + 1;
    chestBox.castShadow = true;
    chestBox.receiveShadow = true;
    sGroup.add(chestBox);

    // Front stencil white cross / supply mark
    const markMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.9 });
    const crossV = new THREE.Mesh(new THREE.BoxGeometry(2, 6, 0.4), markMat);
    crossV.position.set(0, h / 2 + 1, d / 2 + 0.1);
    sGroup.add(crossV);

    const crossH = new THREE.Mesh(new THREE.BoxGeometry(6, 2, 0.4), markMat);
    crossH.position.set(0, h / 2 + 1, d / 2 + 0.1);
    sGroup.add(crossH);

    // Iron corner angle irons with bolt heads
    [-w / 2, w / 2].forEach(cx => {
      [-d / 2, d / 2].forEach(cz => {
        const cornerPlate = new THREE.Mesh(new THREE.BoxGeometry(2.4, h + 0.8, 2.4), heavySteelMat);
        cornerPlate.position.set(cx > 0 ? cx - 1.0 : cx + 1.0, h / 2 + 1, cz > 0 ? cz - 1.0 : cz + 1.0);
        cornerPlate.castShadow = true;
        sGroup.add(cornerPlate);

        // Hex carriage bolts
        [-h * 0.32, 0, h * 0.32].forEach(by => {
          const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.5, 6), nailSteelMat);
          bolt.rotation.x = Math.PI / 2;
          const bz = cz > 0 ? cz + 0.3 : cz - 0.3;
          bolt.position.set(cx > 0 ? cx - 1.0 : cx + 1.0, h / 2 + 1 + by, bz);
          sGroup.add(bolt);
        });
      });
    });

    // Front Brass Padlock Plate & Shackle
    const padlockPlate = new THREE.Mesh(new THREE.BoxGeometry(3, 4, 0.8), brassFaucetMat);
    padlockPlate.position.set(0, h * 0.7 + 1, d / 2 + 0.4);
    sGroup.add(padlockPlate);

    const padlockBody = new THREE.Mesh(new THREE.BoxGeometry(2, 2.5, 1), brassFaucetMat);
    padlockBody.position.set(0, h * 0.55 + 1, d / 2 + 0.9);
    padlockBody.castShadow = true;
    sGroup.add(padlockBody);

    // Heavy Forged Iron Side Bail Handles
    [-w / 2 - 0.5, w / 2 + 0.5].forEach((hx, hi) => {
      const handlePlate = new THREE.Mesh(new THREE.BoxGeometry(0.6, 3.5, 5), heavySteelMat);
      handlePlate.position.set(hx, h * 0.55 + 1, 0);
      sGroup.add(handlePlate);

      const handleRing = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.4, 6, 12, Math.PI), heavySteelMat);
      handleRing.rotation.y = hi === 0 ? -Math.PI / 2 : Math.PI / 2;
      handleRing.rotation.x = Math.PI / 4;
      handleRing.position.set(hx > 0 ? hx + 0.8 : hx - 0.8, h * 0.55 + 1, 0);
      sGroup.add(handleRing);
    });

    // Chamfered Lid with Iron Straps
    const lid = new THREE.Mesh(new THREE.BoxGeometry(w + 0.6, 3.5, d + 0.6), woodPlankLightMat);
    lid.position.set(0, h + 1.75 + 1, 0);
    lid.castShadow = true;
    lid.receiveShadow = true;
    sGroup.add(lid);

    // Lid Crown Cap
    const lidCap = new THREE.Mesh(new THREE.BoxGeometry(w - 2, 1.2, d - 2), woodPlankDarkMat);
    lidCap.position.set(0, h + 3.8 + 1, 0);
    sGroup.add(lidCap);

    // 2 Iron Straps running across the lid
    [-w * 0.28, w * 0.28].forEach(sx => {
      const strap = new THREE.Mesh(new THREE.BoxGeometry(1.6, 4.2, d + 1), heavySteelMat);
      strap.position.set(sx, h + 2 + 1, 0);
      sGroup.add(strap);
    });

  } else if (st.type === 'barricade_wood') {
    // ==========================================================
    // BARRICADA DE MADEIRA REFORÇADA (Postes, Pranchas Desalinhadas, Pregos e Arame)
    // ==========================================================
    const postH = 22;

    // 2 Sturdy Vertical 4x4 Support Posts
    [-11, 11].forEach(px => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(4.5, postH, 4.5), timberPostMat);
      post.position.set(px, postH / 2, 0);
      post.castShadow = true;
      post.receiveShadow = true;
      sGroup.add(post);

      // Chamfered top cap on post
      const cap = new THREE.Mesh(new THREE.ConeGeometry(3.2, 2.5, 4), timberPostMat);
      cap.rotation.y = Math.PI / 4;
      cap.position.set(px, postH + 1.2, 0);
      sGroup.add(cap);
    });

    // 4 Staggered Horizontal Planks with varied grain tones and slight organic rotations
    const plankConfigs = [
      { y: 4, w: 29, mat: woodPlankDarkMat, rotZ: 0.02, offsetZ: 2.3 },
      { y: 9, w: 27.5, mat: woodPlankLightMat, rotZ: -0.03, offsetZ: 2.5 },
      { y: 14, w: 30, mat: woodPlankAgedMat, rotZ: 0.015, offsetZ: 2.2 },
      { y: 18.5, w: 28, mat: woodPlankDarkMat, rotZ: -0.02, offsetZ: 2.4 },
    ];

    plankConfigs.forEach(p => {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(p.w, 4.2, 1.8), p.mat);
      plank.position.set(0, p.y, p.offsetZ);
      plank.rotation.z = p.rotZ;
      plank.castShadow = true;
      plank.receiveShadow = true;
      sGroup.add(plank);

      // Driven steel nails at each post intersection
      [-11, 11].forEach(nx => {
        const nail = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.4, 8), nailSteelMat);
        nail.rotation.x = Math.PI / 2;
        nail.position.set(nx, p.y, p.offsetZ + 1.0);
        sGroup.add(nail);
      });
    });

    // Rear Diagonal "Z" Cross Brace Plank
    const brace = new THREE.Mesh(new THREE.BoxGeometry(26, 3.5, 1.8), timberPostMat);
    brace.rotation.z = Math.atan2(15, 22);
    brace.position.set(0, 11, -2.4);
    brace.castShadow = true;
    sGroup.add(brace);

    // Coiled Barbed Wire along the top edge
    const wireCoil = new THREE.Mesh(
      new THREE.TorusGeometry(3.5, 0.4, 6, 16, Math.PI * 4),
      barbedWireMat
    );
    wireCoil.rotation.y = Math.PI / 2;
    wireCoil.position.set(0, postH + 1, 0);
    sGroup.add(wireCoil);

  } else if (st.type === 'barricade_metal') {
    // ==========================================================
    // BARRICADA REFORÇADA DE AÇO (Tubos de Aço, Chapa Corrugada, Faixa Zebrada e Vergalhões)
    // ==========================================================
    const barW = 28;
    const barH = 22;

    // Heavy Tubular Steel Frame
    const frameGeoH = new THREE.BoxGeometry(barW, 3, 3);
    const frameGeoV = new THREE.BoxGeometry(3, barH, 3);

    const frameBottom = new THREE.Mesh(frameGeoH, heavySteelMat);
    frameBottom.position.set(0, 1.5, 0);
    frameBottom.castShadow = true;
    sGroup.add(frameBottom);

    const frameTop = new THREE.Mesh(frameGeoH, heavySteelMat);
    frameTop.position.set(0, barH - 1.5, 0);
    frameTop.castShadow = true;
    sGroup.add(frameTop);

    [-barW / 2 + 1.5, barW / 2 - 1.5].forEach(fx => {
      const frameSide = new THREE.Mesh(frameGeoV, heavySteelMat);
      frameSide.position.set(fx, barH / 2, 0);
      frameSide.castShadow = true;
      sGroup.add(frameSide);
    });

    // Corrugated Armor Steel Plate in center
    const plate = new THREE.Mesh(new THREE.BoxGeometry(barW - 4, barH - 4, 1.5), corrugatedSteelMat);
    plate.position.set(0, barH / 2, 0);
    plate.castShadow = true;
    plate.receiveShadow = true;
    sGroup.add(plate);

    // Industrial Caution Yellow & Black Diagonal Stripes Banner
    const cautionBanner = new THREE.Mesh(new THREE.BoxGeometry(barW - 6, 3.5, 1.8), warningYellowMat);
    cautionBanner.position.set(0, barH * 0.7, 0.4);
    sGroup.add(cautionBanner);

    // Black diagonal warning hazard hash marks
    for (let i = -3; i <= 3; i++) {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.6, 4.2, 0.3), warningDarkMat);
      stripe.rotation.z = -Math.PI / 4;
      stripe.position.set(i * 3.4, barH * 0.7, 1.4);
      sGroup.add(stripe);
    }

    // 3 Angled Anti-Horde Sharpened Rebar Impaling Spikes projecting forward
    [-8, 0, 8].forEach(sx => {
      const spike = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.4, 16, 8), spikeIronMat);
      spike.rotation.x = Math.PI / 3; // Angled forward
      spike.position.set(sx, 7, 7);
      spike.castShadow = true;
      sGroup.add(spike);

      // Sharp Tip
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.9, 3.5, 8), bloodTipMat);
      tip.rotation.x = Math.PI / 3;
      tip.position.set(sx, 11, 14);
      tip.castShadow = true;
      sGroup.add(tip);
    });

    // Triangular Gusset Corner Welds
    [-barW / 2 + 3.5, barW / 2 - 3.5].forEach(gx => {
      const gusset = new THREE.Mesh(new THREE.ConeGeometry(2.5, 3, 3), heavySteelMat);
      gusset.position.set(gx, 4, 0);
      sGroup.add(gusset);
    });

  } else if (st.type === 'spike_trap') {
    // ==========================================================
    // ARMADILHA DE ESPINHOS DE CHÃO (Estrutura de Troncos, Amarração de Corda e Espinhos Ensanguentados)
    // ==========================================================
    const size = 22;

    // Earth Dirt Bed Base
    const dirtBed = new THREE.Mesh(new THREE.BoxGeometry(size - 2, 1.4, size - 2), soilDirtMat);
    dirtBed.position.y = 0.7;
    dirtBed.receiveShadow = true;
    sGroup.add(dirtBed);

    // Outer Perimeter Rough Log Frame
    const logGeoX = new THREE.CylinderGeometry(1.4, 1.4, size, 8);
    const logGeoZ = new THREE.CylinderGeometry(1.4, 1.4, size, 8);

    const logN = new THREE.Mesh(logGeoX, timberPostMat);
    logN.rotation.z = Math.PI / 2;
    logN.position.set(0, 1.2, -size / 2 + 1);
    sGroup.add(logN);

    const logS = new THREE.Mesh(logGeoX, timberPostMat);
    logS.rotation.z = Math.PI / 2;
    logS.position.set(0, 1.2, size / 2 - 1);
    sGroup.add(logS);

    const logW = new THREE.Mesh(logGeoZ, timberPostMat);
    logW.rotation.x = Math.PI / 2;
    logW.position.set(-size / 2 + 1, 1.2, 0);
    sGroup.add(logW);

    const logE = new THREE.Mesh(logGeoZ, timberPostMat);
    logE.rotation.x = Math.PI / 2;
    logE.position.set(size / 2 - 1, 1.2, 0);
    sGroup.add(logE);

    // Hemp Rope Wraps on the 4 corners
    [-size / 2 + 1, size / 2 - 1].forEach(rx => {
      [-size / 2 + 1, size / 2 - 1].forEach(rz => {
        const rope = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.4, 6, 12), ropeHempMat);
        rope.position.set(rx, 1.4, rz);
        sGroup.add(rope);
      });
    });

    // 12 Vicious Sharpened Stakes (mixture of wood & rebar, varying angles & blood tips)
    const spikeCoords = [
      { x: -6, z: -6, tiltX: -0.15, tiltZ: -0.15, isMetal: false, h: 9 },
      { x: 0, z: -6, tiltX: -0.2, tiltZ: 0.05, isMetal: true, h: 10 },
      { x: 6, z: -6, tiltX: -0.15, tiltZ: 0.2, isMetal: false, h: 8.5 },
      { x: -6, z: 0, tiltX: 0.05, tiltZ: -0.2, isMetal: true, h: 11 },
      { x: -1.5, z: -1.5, tiltX: 0, tiltZ: 0, isMetal: false, h: 11.5 },
      { x: 2, z: 2, tiltX: 0.08, tiltZ: 0.08, isMetal: true, h: 10.5 },
      { x: 6, z: 0, tiltX: 0.05, tiltZ: 0.25, isMetal: false, h: 9 },
      { x: -6, z: 6, tiltX: 0.2, tiltZ: -0.15, isMetal: false, h: 8.5 },
      { x: 0, z: 6, tiltX: 0.25, tiltZ: 0, isMetal: true, h: 10 },
      { x: 6, z: 6, tiltX: 0.18, tiltZ: 0.18, isMetal: false, h: 9.5 },
    ];

    spikeCoords.forEach(sp => {
      const stakeMat = sp.isMetal ? spikeIronMat : woodPlankDarkMat;
      const stake = new THREE.Mesh(new THREE.ConeGeometry(sp.isMetal ? 0.9 : 1.4, sp.h, 6), stakeMat);
      stake.position.set(sp.x, sp.h / 2 + 1, sp.z);
      stake.rotation.x = sp.tiltX;
      stake.rotation.z = sp.tiltZ;
      stake.castShadow = true;
      sGroup.add(stake);

      // Blood Splatter Tip
      const bloodTip = new THREE.Mesh(new THREE.ConeGeometry(sp.isMetal ? 0.95 : 1.45, sp.h * 0.35, 6), bloodTipMat);
      bloodTip.position.set(sp.x, sp.h * 0.85 + 1, sp.z);
      bloodTip.rotation.x = sp.tiltX;
      bloodTip.rotation.z = sp.tiltZ;
      sGroup.add(bloodTip);
    });

  } else if (st.type === 'rain_collector') {
    // ==========================================================
    // COLETOR DE ÁGUA DA CHUVA (Torre de Madeira, Barril Azul 200L, Funil de Lona e Torneira)
    // ==========================================================
    const legH = 24;

    // 4 Heavy Timber Leg Posts
    [-7.5, 7.5].forEach(lx => {
      [-7.5, 7.5].forEach(lz => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(2, legH, 2), timberPostMat);
        leg.position.set(lx, legH / 2, lz);
        leg.castShadow = true;
        sGroup.add(leg);
      });
    });

    // Horizontal Platform Beams
    [-7.5, 7.5].forEach(pos => {
      const beamX = new THREE.Mesh(new THREE.BoxGeometry(17, 1.8, 1.8), woodPlankDarkMat);
      beamX.position.set(0, legH - 1, pos);
      sGroup.add(beamX);

      const beamZ = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.8, 17), woodPlankDarkMat);
      beamZ.position.set(pos, legH - 1, 0);
      sGroup.add(beamZ);
    });

    // 200L Polyethylene Ribbed Blue Water Barrel
    const barrelH = 11;
    const barrelR = 5.2;
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(barrelR, barrelR * 0.95, barrelH, 14), polyBarrelBlueMat);
    barrel.position.y = barrelH / 2 + 1;
    barrel.castShadow = true;
    barrel.receiveShadow = true;
    sGroup.add(barrel);

    // Barrel reinforcement ribs/hoops
    [3, 6.5, 10].forEach(hy => {
      const hoop = new THREE.Mesh(new THREE.TorusGeometry(barrelR + 0.15, 0.35, 6, 16), heavySteelMat);
      hoop.rotation.x = Math.PI / 2;
      hoop.position.y = hy;
      sGroup.add(hoop);
    });

    // Brass Discharge Spigot / Valve at bottom of barrel
    const faucet = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 3, 8), brassFaucetMat);
    faucet.rotation.x = Math.PI / 2;
    faucet.position.set(0, 3.5, barrelR + 1.2);
    sGroup.add(faucet);

    const faucetKnob = new THREE.Mesh(new THREE.BoxGeometry(2, 0.6, 0.6), redCableMat);
    faucetKnob.position.set(0, 4.5, barrelR + 2.2);
    sGroup.add(faucetKnob);

    // Waterproof Weather-Tarp Inverted Catchment Funnel
    const funnelH = 8;
    const funnel = new THREE.Mesh(new THREE.ConeGeometry(12.5, funnelH, 4), blueTarpMat);
    funnel.rotation.y = Math.PI / 4;
    funnel.rotation.x = Math.PI; // Inverted to catch rain
    funnel.position.y = legH - funnelH / 2 + 1;
    funnel.castShadow = true;
    sGroup.add(funnel);

    // Shimmering Water Surface inside Funnel
    const waterDisc = new THREE.Mesh(new THREE.CircleGeometry(4, 12), waterSurfaceMat);
    waterDisc.rotation.x = -Math.PI / 2;
    waterDisc.position.y = legH - funnelH + 2;
    sGroup.add(waterDisc);

    // 4 Corner Tension Guy Cords
    [-7.5, 7.5].forEach(cx => {
      [-7.5, 7.5].forEach(cz => {
        const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 8, 4), ropeHempMat);
        cord.position.set(cx * 0.9, legH - 3, cz * 0.9);
        sGroup.add(cord);
      });
    });

  } else if (st.type === 'campfire') {
    // ==========================================================
    // FOGUEIRA REALISTA (Círculo de Pedras de Rio, Brasas Incandescentes, Chamas e Tripé com Caldeirão)
    // ==========================================================
    // 10 Unique River Rocks forming Hearth Ring
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const rockR = 2.2 + (i % 3) * 0.5;
      const rockGeo = new THREE.DodecahedronGeometry(rockR, 0);
      const stone = new THREE.Mesh(rockGeo, riverRockMat);
      stone.position.set(Math.cos(a) * 9.5, 1.4, Math.sin(a) * 9.5);
      stone.rotation.set((i * 1.3) % Math.PI, (i * 2.1) % Math.PI, (i * 0.7) % Math.PI);
      stone.castShadow = true;
      sGroup.add(stone);
    }

    // Circular Charcoal Ash Bed in Center
    const ashBed = new THREE.Mesh(new THREE.CylinderGeometry(8, 8.5, 1.2, 12), charcoalAshMat);
    ashBed.position.y = 0.6;
    ashBed.receiveShadow = true;
    sGroup.add(ashBed);

    // Glowing Incandescent Ember Core
    const emberCore = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 6, 1.4, 10), emberCoreMat);
    emberCore.position.y = 1.1;
    sGroup.add(emberCore);

    // 4 Crossed Charred Hardwood Logs
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI;
      const log = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 14, 6), timberPostMat);
      log.rotation.z = Math.PI / 3;
      log.rotation.y = a;
      log.position.set(Math.cos(a) * 1.5, 2.5, Math.sin(a) * 1.5);
      log.castShadow = true;
      sGroup.add(log);
    }

    // Outer Roaring Orange Flame
    const fireOuter = new THREE.Mesh(new THREE.ConeGeometry(4.2, 10, 8), fireFlameMat);
    fireOuter.position.y = 6.5;
    sGroup.add(fireOuter);

    // Inner Bright Yellow Core Flame
    const fireInner = new THREE.Mesh(new THREE.ConeGeometry(2.4, 7, 8), fireCoreMat);
    fireInner.position.y = 5.2;
    sGroup.add(fireInner);

    // Forged Iron Camp Cooking Tripod
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 20, 6), castIronPotMat);
      leg.position.set(Math.cos(a) * 6, 9.5, Math.sin(a) * 6);
      leg.rotation.x = Math.sin(a) * 0.35;
      leg.rotation.z = -Math.cos(a) * 0.35;
      leg.castShadow = true;
      sGroup.add(leg);
    }

    // Suspended Cast Iron Cooking Pot / Kettle
    const potChain = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 4, 4), heavySteelMat);
    potChain.position.y = 16.5;
    sGroup.add(potChain);

    const pot = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2, 3.5, 10), castIronPotMat);
    pot.position.y = 13;
    pot.castShadow = true;
    sGroup.add(pot);

    const potLid = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.6, 10), castIronPotMat);
    potLid.position.y = 15;
    sGroup.add(potLid);

    // Dynamic Warm Flickering Campfire Light
    const fLight = new THREE.PointLight('#f97316', 2.0, 160, 1.4);
    fLight.position.y = 8;
    fLight.castShadow = true;
    sGroup.add(fLight);
    campfireLight = fLight;

    // Dynamic flickering flame animation function
    updateState = (dt, time) => {
      const flicker = Math.sin(time * 12) * 0.3 + Math.cos(time * 23) * 0.2 + (Math.random() - 0.5) * 0.15;
      fLight.intensity = 1.8 + flicker;
      fireOuter.scale.y = 1.0 + flicker * 0.25;
      fireOuter.scale.x = 1.0 - flicker * 0.1;
      fireOuter.scale.z = 1.0 - flicker * 0.1;
      (emberCoreMat as any).emissiveIntensity = 1.2 + flicker * 0.4;
    };

  } else if (st.type === 'spotlight') {
    // ==========================================================
    // HOLOFOTE DEFENSIVO 12V (Tripé de Aço, Lâmpada Potente, Bateria de Carro e Cabos)
    // ==========================================================
    const standH = 26;

    // Center Vertical Telescoping Mast
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.5, standH, 8), heavySteelMat);
    mast.position.y = standH / 2;
    mast.castShadow = true;
    sGroup.add(mast);

    // 3 Splayed Tripod Legs
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 16, 6), heavySteelMat);
      leg.position.set(Math.cos(a) * 5.5, 7, Math.sin(a) * 5.5);
      leg.rotation.x = Math.sin(a) * 0.5;
      leg.rotation.z = -Math.cos(a) * 0.5;
      leg.castShadow = true;
      sGroup.add(leg);
    }

    // Heavy Cast Aluminum Floodlight Head
    const headGroup = new THREE.Group();
    headGroup.position.set(0, standH, 0);

    const lightHousing = new THREE.Mesh(new THREE.BoxGeometry(9, 6.5, 7), heavySteelMat);
    lightHousing.position.z = 1;
    lightHousing.castShadow = true;
    headGroup.add(lightHousing);

    // Rear Heat Sink Cooling Fins
    for (let i = -3; i <= 3; i++) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.5, 6, 2.5), corrugatedSteelMat);
      fin.position.set(i * 1.1, 0, -3.2);
      headGroup.add(fin);
    }

    // Glowing Front Halogen Lens
    const lensMat = new THREE.MeshBasicMaterial({ color: '#fef08a' });
    const lens = new THREE.Mesh(new THREE.BoxGeometry(8, 5.5, 0.8), lensMat);
    lens.position.z = 4.8;
    headGroup.add(lens);

    sGroup.add(headGroup);

    // 12V Car Battery on Ground
    const battery = new THREE.Mesh(new THREE.BoxGeometry(7, 5, 4.5), batteryBodyMat);
    battery.position.set(5.5, 2.5, -4);
    battery.castShadow = true;
    sGroup.add(battery);

    // Red positive & Black negative battery terminal posts
    const redTerm = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.2, 8), redCableMat);
    redTerm.position.set(4, 5.2, -4);
    sGroup.add(redTerm);

    const blackTerm = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.2, 8), heavySteelMat);
    blackTerm.position.set(7, 5.2, -4);
    sGroup.add(blackTerm);

    // Jumper cable running to light stand
    const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 22, 6), redCableMat);
    cable.position.set(3.5, 12, -2);
    cable.rotation.z = -0.25;
    sGroup.add(cable);

    // High Intensity Powerful Defensive SpotLight
    const sLight = new THREE.SpotLight('#fef08a', 4.5, 280, Math.PI / 4.5, 0.4, 1.2);
    sLight.position.set(0, standH, 4.5);
    sLight.target.position.set(0, 0, 80);
    sLight.castShadow = true;
    sGroup.add(sLight);
    sGroup.add(sLight.target);
    spotlightLight = sLight;

  } else {
    // ==========================================================
    // SACO DE DORMIR / TENDA DE SOBREVIVÊNCIA
    // ==========================================================
    const groundTarp = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 16),
      new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.85 })
    );
    groundTarp.rotation.x = -Math.PI / 2;
    groundTarp.position.y = 0.08;
    groundTarp.receiveShadow = true;
    sGroup.add(groundTarp);

    // Quilted Sleeping Bag Body
    const bagBody = new THREE.Mesh(new THREE.BoxGeometry(19, 3.5, 11), sleepingBagMat);
    bagBody.position.set(0, 1.75, 0);
    bagBody.castShadow = true;
    bagBody.receiveShadow = true;
    sGroup.add(bagBody);

    // Puffy Head Pillow
    const pillow = new THREE.Mesh(
      new THREE.BoxGeometry(5.5, 4.5, 9.5),
      new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.7 })
    );
    pillow.position.set(-6.5, 2.5, 0);
    pillow.castShadow = true;
    sGroup.add(pillow);

    // Tactical flashlight resting next to the sleeping bag
    const torch = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 5, 8), heavySteelMat);
    torch.rotation.z = Math.PI / 2;
    torch.position.set(0, 0.8, 7);
    sGroup.add(torch);
  }

  return {
    structureData: st,
    mesh: sGroup,
    updateState,
    campfireLight,
    spotlight: spotlightLight,
  };
}
