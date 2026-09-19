import * as THREE from 'three';
import { Item } from '../../types/game';

export interface HeldItem3DInstance {
  itemData: Item | null;
  mesh: THREE.Group;
  muzzlePosition?: THREE.Vector3;
  hasMuzzleFlash: boolean;
  isTwoHanded: boolean;
  muzzleFlashMesh?: THREE.Mesh;
  muzzleLight?: THREE.PointLight;
  updateState?: (dt: number, time: number, isAttacking: boolean, attackPhase: number) => void;
}

// =========================================================================
// SHARED MATERIALS CACHE FOR HELD ITEMS
// =========================================================================
const steelGunMat = new THREE.MeshStandardMaterial({
  color: '#0f172a',
  metalness: 0.9,
  roughness: 0.25,
});

const steelShinyMat = new THREE.MeshStandardMaterial({
  color: '#cbd5e1',
  metalness: 0.95,
  roughness: 0.15,
});

const darkMetalMat = new THREE.MeshStandardMaterial({
  color: '#1e293b',
  metalness: 0.85,
  roughness: 0.35,
});

const woodStockMat = new THREE.MeshStandardMaterial({
  color: '#6e340d',
  roughness: 0.75,
  metalness: 0.05,
});

const woodLightMat = new THREE.MeshStandardMaterial({
  color: '#92400e',
  roughness: 0.8,
  metalness: 0.05,
});

const tacticalPolymerMat = new THREE.MeshStandardMaterial({
  color: '#09090b',
  roughness: 0.5,
  metalness: 0.2,
});

const brassMat = new THREE.MeshStandardMaterial({
  color: '#d97706',
  metalness: 0.9,
  roughness: 0.2,
});

const copperMat = new THREE.MeshStandardMaterial({
  color: '#b45309',
  metalness: 0.85,
  roughness: 0.25,
});

const fireRedMat = new THREE.MeshStandardMaterial({
  color: '#dc2626',
  roughness: 0.4,
  metalness: 0.3,
});

const bloodMat = new THREE.MeshStandardMaterial({
  color: '#881337',
  roughness: 0.35,
  metalness: 0.2,
});

const tapeMat = new THREE.MeshStandardMaterial({
  color: '#94a3b8',
  metalness: 0.65,
  roughness: 0.4,
});

const glassAmberMat = new THREE.MeshStandardMaterial({
  color: '#b45309',
  transparent: true,
  opacity: 0.82,
  metalness: 0.2,
  roughness: 0.1,
});

const waterPlasticMat = new THREE.MeshStandardMaterial({
  color: '#38bdf8',
  transparent: true,
  opacity: 0.65,
  metalness: 0.15,
  roughness: 0.15,
});

const sodaCanMat = new THREE.MeshStandardMaterial({
  color: '#ef4444',
  metalness: 0.8,
  roughness: 0.25,
});

const canLidMat = new THREE.MeshStandardMaterial({
  color: '#e2e8f0',
  metalness: 0.9,
  roughness: 0.2,
});

const medicalWhiteMat = new THREE.MeshStandardMaterial({
  color: '#f8fafc',
  roughness: 0.85,
});

const pcbGreenMat = new THREE.MeshStandardMaterial({
  color: '#064e3b',
  roughness: 0.4,
  metalness: 0.3,
});

const batteryCaseMat = new THREE.MeshStandardMaterial({
  color: '#18181b',
  roughness: 0.45,
  metalness: 0.2,
});

/**
 * Creates an exquisite, detailed 3D model for ANY equipped item in the player's hands.
 */
export function createDetailedHeldItem3D(item: Item | null): HeldItem3DInstance {
  const root = new THREE.Group();

  if (!item) {
    // Bare hands / unarmed
    return {
      itemData: null,
      mesh: root,
      hasMuzzleFlash: false,
      isTwoHanded: false,
    };
  }

  const itemId = item.id;
  let hasMuzzleFlash = false;
  let isTwoHanded = false;
  let muzzlePosition: THREE.Vector3 | undefined;
  let muzzleFlashMesh: THREE.Mesh | undefined;
  let muzzleLight: THREE.PointLight | undefined;
  let updateState: ((dt: number, time: number, isAttacking: boolean, attackPhase: number) => void) | undefined;

  // =========================================================================
  // 1. WEAPONS
  // =========================================================================
  if (itemId === 'knife') {
    // --- FACA TÁTICA M9 ---
    // Handle with ergonomic grip rings
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 5, 8), tacticalPolymerMat);
    handle.position.y = -2.5;
    root.add(handle);

    for (let i = -1.8; i <= 1.8; i += 0.9) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.88, 0.12, 4, 8), darkMetalMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = i - 2.5;
      root.add(ring);
    }

    // Steel pommel & glass breaker
    const pommel = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.2, 6), steelShinyMat);
    pommel.rotation.x = Math.PI;
    pommel.position.y = -5.3;
    root.add(pommel);

    // Oval Crossguard
    const guard = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.6, 1.2), darkMetalMat);
    guard.position.y = 0.2;
    root.add(guard);

    // Tanto / Bowie Steel Blade
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.4, 8.5, 1.8), steelShinyMat);
    blade.position.set(0, 4.5, 0.3);
    root.add(blade);

    // Sharpened Cutting Bevel
    const edge = new THREE.Mesh(new THREE.ConeGeometry(0.9, 8.5, 4), steelShinyMat);
    edge.scale.set(0.2, 1, 1);
    edge.position.set(0, 4.5, 1.1);
    root.add(edge);

    // Serrated Spine
    for (let j = 1; j <= 5; j++) {
      const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.5, 0.4), darkMetalMat);
      tooth.position.set(0, j + 1.2, -0.65);
      root.add(tooth);
    }

    // Hand offset & orientation
    root.rotation.x = Math.PI / 2.2;
    root.position.set(0, 0, 1.5);

  } else if (itemId === 'crowbar') {
    // --- PÉ DE CABRA DE AÇO ---
    const shaftH = 16;
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, shaftH, 6), fireRedMat);
    shaft.position.y = shaftH / 2 - 3;
    root.add(shaft);

    // Lower angled chisel end
    const chisel = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3, 0.3), steelShinyMat);
    chisel.rotation.x = 0.25;
    chisel.position.set(0, -3.8, 0.4);
    root.add(chisel);

    // Upper Curved Gooseneck Hook
    const hook = new THREE.Mesh(new THREE.TorusGeometry(2.5, 0.65, 6, 12, Math.PI / 1.3), fireRedMat);
    hook.rotation.z = Math.PI / 2;
    hook.position.set(0, shaftH - 3, 1.8);
    root.add(hook);

    // Split V-claw nail puller at tip
    const clawLeft = new THREE.Mesh(new THREE.BoxGeometry(0.45, 2.2, 0.3), steelShinyMat);
    clawLeft.position.set(-0.35, shaftH - 2.2, 3.8);
    root.add(clawLeft);

    const clawRight = new THREE.Mesh(new THREE.BoxGeometry(0.45, 2.2, 0.3), steelShinyMat);
    clawRight.position.set(0.35, shaftH - 2.2, 3.8);
    root.add(clawRight);

    root.rotation.x = Math.PI / 2.3;
    root.position.set(0, 0, 2);

  } else if (itemId === 'spiked_bat') {
    // --- TACO COM PREGOS ---
    const batH = 18;

    // Handle with athletic grip tape
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 6, 8), tapeMat);
    handle.position.y = -2;
    root.add(handle);

    const knob = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.8, 8), woodStockMat);
    knob.position.y = -5.2;
    root.add(knob);

    // Tapered Bat Barrel
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.0, batH - 6, 10), woodStockMat);
    barrel.position.y = 7;
    root.add(barrel);

    const cap = new THREE.Mesh(new THREE.SphereGeometry(1.9, 8, 8), woodStockMat);
    cap.position.y = batH / 2 + 4;
    root.add(cap);

    // Driven steel nails protruding around the impact zone
    const nailAngles = [0, 0.8, 1.7, 2.5, 3.4, 4.3, 5.1, 5.9];
    nailAngles.forEach((a, idx) => {
      const ny = 6 + (idx % 4) * 2;
      const nail = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 4.2, 4), steelShinyMat);
      nail.rotation.z = Math.PI / 2;
      nail.rotation.y = a;
      nail.position.set(Math.cos(a) * 1.6, ny, Math.sin(a) * 1.6);
      root.add(nail);

      // Sharp head tip
      const nailHead = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.8, 4), bloodMat);
      nailHead.rotation.z = -Math.PI / 2;
      nailHead.rotation.y = a;
      nailHead.position.set(Math.cos(a) * 3.4, ny, Math.sin(a) * 3.4);
      root.add(nailHead);
    });

    // Blood splatters along the top barrel
    const bloodBand = new THREE.Mesh(new THREE.CylinderGeometry(1.92, 1.8, 4, 8), bloodMat);
    bloodBand.position.y = 10;
    root.add(bloodBand);

    root.rotation.x = Math.PI / 2.2;
    root.position.set(0, 0, 2);

  } else if (itemId === 'fire_axe') {
    // --- MACHADO DE BOMBEIRO ---
    const shaftH = 20;

    // Curved wooden hickory handle
    const handle = new THREE.Mesh(new THREE.BoxGeometry(1.1, shaftH, 1.8), woodStockMat);
    handle.position.y = 4;
    root.add(handle);

    // Rubber grip boot at bottom
    const grip = new THREE.Mesh(new THREE.BoxGeometry(1.25, 6, 2), tacticalPolymerMat);
    grip.position.y = -3;
    root.add(grip);

    // Heavy Forged Red Head
    const axeHead = new THREE.Mesh(new THREE.BoxGeometry(1.3, 4.5, 3.2), fireRedMat);
    axeHead.position.set(0, shaftH - 6.5, 0);
    root.add(axeHead);

    // Forward Razor Cutting Blade
    const blade = new THREE.Mesh(new THREE.ConeGeometry(3.5, 4.5, 3), steelShinyMat);
    blade.scale.set(0.18, 1, 1);
    blade.rotation.x = Math.PI / 2;
    blade.position.set(0, shaftH - 6.5, 3.2);
    root.add(blade);

    // Rear Breaching Pick
    const pick = new THREE.Mesh(new THREE.ConeGeometry(0.8, 3.8, 4), steelShinyMat);
    pick.rotation.x = -Math.PI / 2;
    pick.position.set(0, shaftH - 6.5, -2.6);
    root.add(pick);

    root.rotation.x = Math.PI / 2.2;
    root.position.set(0, 0, 2);

  } else if (itemId === 'pistol_9mm') {
    // --- PISTOLA GLOCK 9MM ---
    hasMuzzleFlash = true;

    // Ergonomic Lower Frame & Grip
    const grip = new THREE.Mesh(new THREE.BoxGeometry(1.5, 4.8, 2.6), tacticalPolymerMat);
    grip.position.set(0, -1.8, -0.6);
    grip.rotation.x = -0.22;
    root.add(grip);

    // Magazine Base Plate
    const magBase = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 2.8), tacticalPolymerMat);
    magBase.position.set(0, -4.1, -1.1);
    magBase.rotation.x = -0.22;
    root.add(magBase);

    // Trigger Guard & Trigger
    const triggerGuard = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.15, 4, 8, Math.PI), darkMetalMat);
    triggerGuard.rotation.y = Math.PI / 2;
    triggerGuard.position.set(0, -0.6, 1.2);
    root.add(triggerGuard);

    const trigger = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.8, 0.4), darkMetalMat);
    trigger.rotation.x = -0.3;
    trigger.position.set(0, -0.4, 1.1);
    root.add(trigger);

    // Steel Slide
    const slide = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.8, 9.5), steelGunMat);
    slide.position.set(0, 1.3, 1.6);
    root.add(slide);

    // Cocking Serrations on Slide Rear
    for (let s = -2.4; s <= -0.6; s += 0.45) {
      const groov = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.3, 0.2), darkMetalMat);
      groov.position.set(0, 1.3, s);
      root.add(groov);
    }

    // Front & Rear Sights
    const rearSight = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.4, 0.5), darkMetalMat);
    rearSight.position.set(0, 2.3, -2.8);
    root.add(rearSight);

    const frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), medicalWhiteMat);
    frontSight.position.set(0, 2.3, 5.8);
    root.add(frontSight);

    // Barrel Muzzle Hole
    const muzzleHole = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.5, 8), darkMetalMat);
    muzzleHole.rotation.x = Math.PI / 2;
    muzzleHole.position.set(0, 1.3, 6.4);
    root.add(muzzleHole);

    // Muzzle Flash
    const mFlashGeo = new THREE.ConeGeometry(1.8, 5.5, 6);
    const mFlashMat = new THREE.MeshBasicMaterial({ color: '#fde047', transparent: true, opacity: 0 });
    const mFlash = new THREE.Mesh(mFlashGeo, mFlashMat);
    mFlash.rotation.x = Math.PI / 2;
    mFlash.position.set(0, 1.3, 8.8);
    root.add(mFlash);
    muzzleFlashMesh = mFlash;

    // Flash Light
    const fLight = new THREE.PointLight('#facc15', 0, 60, 2);
    fLight.position.set(0, 1.3, 8);
    root.add(fLight);
    muzzleLight = fLight;

    muzzlePosition = new THREE.Vector3(0, 1.3, 6.4);

    root.position.set(0, -1, 3);

  } else if (itemId === 'shotgun_12g') {
    // --- ESPINGARDA MOSSBERG CAL. 12 ---
    isTwoHanded = true;
    hasMuzzleFlash = true;

    // Wood / Synthetic Stock
    const stock = new THREE.Mesh(new THREE.BoxGeometry(2.0, 3.8, 10), woodStockMat);
    stock.position.set(0, -0.4, -7);
    stock.rotation.x = 0.08;
    root.add(stock);

    // Rubber Recoil Buttpad
    const buttPad = new THREE.Mesh(new THREE.BoxGeometry(2.1, 4.2, 1.2), tacticalPolymerMat);
    buttPad.position.set(0, -0.7, -12);
    root.add(buttPad);

    // Stamped Steel Receiver with Ejection Port
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.2, 9), steelGunMat);
    receiver.position.set(0, 0.8, 0.5);
    root.add(receiver);

    const ejectPort = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.2, 3.2), darkMetalMat);
    ejectPort.position.set(1.1, 1.2, 0.5);
    root.add(ejectPort);

    // Extended Magazine Tube under barrel
    const magTube = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 16, 8), darkMetalMat);
    magTube.rotation.x = Math.PI / 2;
    magTube.position.set(0, 0.2, 11);
    root.add(magTube);

    // Pump Slide with Ribbed Grip (Forend)
    const pumpSlide = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 6.5, 8), woodStockMat);
    pumpSlide.rotation.x = Math.PI / 2;
    pumpSlide.position.set(0, 0.2, 8.5);
    root.add(pumpSlide);

    // Heavy Steel Barrel
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 18, 8), steelGunMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 1.6, 12);
    root.add(barrel);

    // Front Brass Bead Sight
    const bead = new THREE.Mesh(new THREE.SphereGeometry(0.3, 6, 6), brassMat);
    bead.position.set(0, 2.5, 20.5);
    root.add(bead);

    // Muzzle Flash
    const mFlash = new THREE.Mesh(
      new THREE.ConeGeometry(3.2, 8, 8),
      new THREE.MeshBasicMaterial({ color: '#facc15', transparent: true, opacity: 0 })
    );
    mFlash.rotation.x = Math.PI / 2;
    mFlash.position.set(0, 1.6, 25);
    root.add(mFlash);
    muzzleFlashMesh = mFlash;

    const fLight = new THREE.PointLight('#facc15', 0, 100, 1.8);
    fLight.position.set(0, 1.6, 22);
    root.add(fLight);
    muzzleLight = fLight;

    muzzlePosition = new THREE.Vector3(0, 1.6, 21);
    root.position.set(0, -1, 4);

  } else if (itemId === 'hunting_rifle') {
    // --- RIFLE DE PRECISÃO .308 COM LUNETA ---
    isTwoHanded = true;
    hasMuzzleFlash = true;

    // Full Length Carved Wood Stock with Cheek Rest
    const stock = new THREE.Mesh(new THREE.BoxGeometry(2.0, 3.6, 14), woodStockMat);
    stock.position.set(0, -0.6, -8);
    stock.rotation.x = 0.06;
    root.add(stock);

    const cheekRest = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.6, 5), woodLightMat);
    cheekRest.position.set(0, 1.5, -9);
    root.add(cheekRest);

    // Receiver & Internal Box Magazine
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.0, 10), steelGunMat);
    receiver.position.set(0, 0.6, 1);
    root.add(receiver);

    // Turn-Bolt Handle with Ball Knob
    const boltArm = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 2.0, 6), steelShinyMat);
    boltArm.rotation.z = Math.PI / 3;
    boltArm.position.set(1.4, 1.6, -1);
    root.add(boltArm);

    const boltKnob = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 8), darkMetalMat);
    boltKnob.position.set(2.4, 2.2, -1);
    root.add(boltKnob);

    // Optical Sniper Scope
    const scopeTube = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 10, 8), darkMetalMat);
    scopeTube.rotation.x = Math.PI / 2;
    scopeTube.position.set(0, 3.2, 0.5);
    root.add(scopeTube);

    // Scope front & rear bell hoods
    const scopeBellRear = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 0.7, 2, 8), darkMetalMat);
    scopeBellRear.rotation.x = Math.PI / 2;
    scopeBellRear.position.set(0, 3.2, -4.8);
    root.add(scopeBellRear);

    const scopeBellFront = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.2, 2.5, 8), darkMetalMat);
    scopeBellFront.rotation.x = Math.PI / 2;
    scopeBellFront.position.set(0, 3.2, 5.8);
    root.add(scopeBellFront);

    // Glass optic reflections
    const opticLens = new THREE.Mesh(new THREE.CircleGeometry(0.9, 8), waterPlasticMat);
    opticLens.position.set(0, 3.2, -5.9);
    root.add(opticLens);

    // Dual Heavy Scope Mounting Rings
    [-1.5, 2.5].forEach(rz => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.25, 4, 8), darkMetalMat);
      ring.position.set(0, 3.2, rz);
      root.add(ring);

      const baseMount = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.2, 0.8), darkMetalMat);
      baseMount.position.set(0, 2.2, rz);
      root.add(baseMount);
    });

    // Long Free-Floating Blued Barrel
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.75, 24, 8), steelGunMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 1.2, 17);
    root.add(barrel);

    // Muzzle Crown
    const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.5, 8), darkMetalMat);
    muzzle.rotation.x = Math.PI / 2;
    muzzle.position.set(0, 1.2, 29);
    root.add(muzzle);

    // Muzzle Flash
    const mFlash = new THREE.Mesh(
      new THREE.ConeGeometry(2.6, 9.5, 8),
      new THREE.MeshBasicMaterial({ color: '#fef08a', transparent: true, opacity: 0 })
    );
    mFlash.rotation.x = Math.PI / 2;
    mFlash.position.set(0, 1.2, 34);
    root.add(mFlash);
    muzzleFlashMesh = mFlash;

    const fLight = new THREE.PointLight('#facc15', 0, 120, 2);
    fLight.position.set(0, 1.2, 30);
    root.add(fLight);
    muzzleLight = fLight;

    muzzlePosition = new THREE.Vector3(0, 1.2, 29);
    root.position.set(0, -1, 4);

  } else if (itemId === 'molotov') {
    // --- COQUETEL MOLOTOV ---
    // Amber glass bottle body
    const bottle = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 6.5, 10), glassAmberMat);
    bottle.position.y = 1;
    root.add(bottle);

    // Bottle Neck & Lip
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.0, 3.5, 8), glassAmberMat);
    neck.position.y = 5.8;
    root.add(neck);

    const lip = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.18, 4, 8), glassAmberMat);
    lip.rotation.x = Math.PI / 2;
    lip.position.y = 7.5;
    root.add(lip);

    // Liquid gasoline inside
    const liquid = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.5, 4.2, 8), brassMat);
    liquid.position.y = 0.2;
    root.add(liquid);

    // Cloth Rag Wick stuffed into neck
    const clothWick = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 2.5, 6), tapeMat);
    clothWick.position.set(0, 8.2, 0);
    clothWick.rotation.z = 0.15;
    root.add(clothWick);

    // Roaring Fire Flame on Wick Tip
    const fireOuter = new THREE.Mesh(
      new THREE.ConeGeometry(1.2, 3.6, 6),
      new THREE.MeshBasicMaterial({ color: '#f97316' })
    );
    fireOuter.position.set(0.3, 10.2, 0);
    root.add(fireOuter);

    const fireInner = new THREE.Mesh(
      new THREE.ConeGeometry(0.7, 2.2, 6),
      new THREE.MeshBasicMaterial({ color: '#fef08a' })
    );
    fireInner.position.set(0.3, 9.8, 0);
    root.add(fireInner);

    // Warm Flickering Light
    const mLight = new THREE.PointLight('#f97316', 1.6, 45, 1.5);
    mLight.position.set(0.3, 10.5, 0);
    root.add(mLight);

    updateState = (dt, time) => {
      const flicker = Math.sin(time * 16) * 0.3 + (Math.random() - 0.5) * 0.2;
      fireOuter.scale.y = 1.0 + flicker * 0.3;
      fireOuter.scale.x = 1.0 - flicker * 0.15;
      mLight.intensity = 1.6 + flicker * 0.5;
    };

    root.rotation.x = Math.PI / 2.3;
    root.position.set(0, 0, 2);

  // =========================================================================
  // 2. AMMUNITION BOXES
  // =========================================================================
  } else if (itemId.startsWith('ammo_')) {
    const is12g = itemId === 'ammo_12g';
    const isRifle = itemId === 'ammo_rifle';

    const boxMat = is12g ? fireRedMat : isRifle ? pcbGreenMat : woodLightMat;
    const box = new THREE.Mesh(new THREE.BoxGeometry(4.5, 3.2, 3.8), boxMat);
    box.position.y = 1.6;
    root.add(box);

    // Box Lid Lip
    const lid = new THREE.Mesh(new THREE.BoxGeometry(4.7, 0.6, 4.0), darkMetalMat);
    lid.position.y = 3.3;
    root.add(lid);

    // Visible Brass Cartridges peeking out
    for (let c = -1.4; c <= 1.4; c += 1.4) {
      const shell = new THREE.Mesh(
        new THREE.CylinderGeometry(0.45, 0.45, 1.8, 6),
        is12g ? fireRedMat : brassMat
      );
      shell.position.set(c, 3.8, 0);
      root.add(shell);

      const tip = new THREE.Mesh(
        new THREE.ConeGeometry(0.45, 0.8, 6),
        is12g ? brassMat : copperMat
      );
      tip.position.set(c, 4.8, 0);
      root.add(tip);
    }

    root.rotation.x = Math.PI / 2.5;
    root.position.set(0, 0, 1.5);

  // =========================================================================
  // 3. FOOD & DRINKS
  // =========================================================================
  } else if (itemId === 'fresh_water' || itemId === 'dirty_water') {
    const isDirty = itemId === 'dirty_water';
    const bottleMat = isDirty ? glassAmberMat : waterPlasticMat;

    // Ribbed Ergonomic Water Bottle
    const bottle = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 6.5, 10), bottleMat);
    bottle.position.y = 3.25;
    root.add(bottle);

    // Ribs
    [2, 3.5, 5].forEach(ry => {
      const rib = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.15, 4, 8), bottleMat);
      rib.rotation.x = Math.PI / 2;
      rib.position.y = ry;
      root.add(rib);
    });

    // Cap
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 0.9, 1.2, 8),
      isDirty ? woodStockMat : steelGunMat
    );
    cap.position.y = 7.1;
    root.add(cap);

    // White Water Label
    const label = new THREE.Mesh(new THREE.CylinderGeometry(1.64, 1.64, 2.5, 10), medicalWhiteMat);
    label.position.y = 3.25;
    root.add(label);

    root.rotation.x = Math.PI / 2.3;
    root.position.set(0, 0, 2);

  } else if (itemId === 'soda') {
    // Aluminum Soda Can
    const can = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 6.0, 10), sodaCanMat);
    can.position.y = 3;
    root.add(can);

    // Silver Top Lid & Pull Tab
    const topLid = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.4, 10), canLidMat);
    topLid.position.y = 6.2;
    root.add(topLid);

    const pullTab = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 1.4), steelShinyMat);
    pullTab.position.set(0, 6.5, 0.4);
    root.add(pullTab);

    root.rotation.x = Math.PI / 2.3;
    root.position.set(0, 0, 2);

  } else if (itemId === 'canned_beans') {
    // Tin Can
    const can = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 5.0, 10), canLidMat);
    can.position.y = 2.5;
    root.add(can);

    // Yellow / Red Beans Label
    const label = new THREE.Mesh(new THREE.CylinderGeometry(1.84, 1.84, 3.4, 10), woodLightMat);
    label.position.y = 2.5;
    root.add(label);

    // Rim
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1.85, 0.15, 4, 10), canLidMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 5.0;
    root.add(rim);

    root.rotation.x = Math.PI / 2.3;
    root.position.set(0, 0, 2);

  } else if (itemId === 'energy_bar') {
    // Foil Wrapped Energy Bar
    const bar = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.2, 2.2), darkMetalMat);
    bar.position.y = 0.6;
    root.add(bar);

    const stripe = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.25, 0.9), brassMat);
    stripe.position.y = 0.6;
    root.add(stripe);

    root.rotation.x = Math.PI / 2.5;
    root.position.set(0, 0, 1.5);

  } else if (itemId === 'cooked_meat') {
    // Steak on Bone
    const steak = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.6, 3.2), woodStockMat);
    steak.position.y = 0.8;
    root.add(steak);

    // White Bone
    const bone = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 4.5, 6), medicalWhiteMat);
    bone.rotation.z = Math.PI / 2;
    bone.position.set(-1.8, 0.8, 0);
    root.add(bone);

    root.rotation.x = Math.PI / 2.5;
    root.position.set(0, 0, 1.5);

  // =========================================================================
  // 4. MEDICAL ITEMS
  // =========================================================================
  } else if (itemId === 'bandage') {
    // Sterile Gauze Roll
    const roll = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 3.6, 10), medicalWhiteMat);
    roll.rotation.z = Math.PI / 2;
    roll.position.y = 1.8;
    root.add(roll);

    // End Flap with Red Cross Stamp
    const flap = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.2, 1.6), medicalWhiteMat);
    flap.position.set(0, 3.7, 0.8);
    root.add(flap);

    const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, 1.2), fireRedMat);
    crossV.position.set(0, 3.75, 0.8);
    root.add(crossV);

    const crossH = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.25, 0.4), fireRedMat);
    crossH.position.set(0, 3.75, 0.8);
    root.add(crossH);

    root.rotation.x = Math.PI / 2.5;
    root.position.set(0, 0, 1.5);

  } else if (itemId === 'medkit') {
    // Hard Red Trauma First Aid Case
    const caseBox = new THREE.Mesh(new THREE.BoxGeometry(5.5, 4.2, 2.6), fireRedMat);
    caseBox.position.y = 2.1;
    root.add(caseBox);

    // White Medical Cross on front
    const crossV = new THREE.Mesh(new THREE.BoxGeometry(1.0, 3.0, 0.2), medicalWhiteMat);
    crossV.position.set(0, 2.1, 1.4);
    root.add(crossV);

    const crossH = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.0, 0.2), medicalWhiteMat);
    crossH.position.set(0, 2.1, 1.4);
    root.add(crossH);

    // Carry Handle & Latches
    const handle = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.25, 4, 8, Math.PI), steelShinyMat);
    handle.position.set(0, 4.2, 0);
    root.add(handle);

    [-1.6, 1.6].forEach(lx => {
      const clasp = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.3), steelShinyMat);
      clasp.position.set(lx, 2.1, 1.4);
      root.add(clasp);
    });

    root.rotation.x = Math.PI / 2.5;
    root.position.set(0, 0, 1.5);

  } else if (itemId === 'antibiotics' || itemId === 'painkillers') {
    // Prescription Amber Pill Bottle
    const bottle = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 3.8, 8), glassAmberMat);
    bottle.position.y = 1.9;
    root.add(bottle);

    // White Child-Proof Push Cap
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 1.0, 8), medicalWhiteMat);
    cap.position.y = 4.2;
    root.add(cap);

    // RX Label
    const label = new THREE.Mesh(new THREE.CylinderGeometry(1.34, 1.34, 2.2, 8), medicalWhiteMat);
    label.position.y = 1.8;
    root.add(label);

    root.rotation.x = Math.PI / 2.5;
    root.position.set(0, 0, 1.5);

  // =========================================================================
  // 5. CRAFTING MATERIALS & SURVIVAL TOOLS
  // =========================================================================
  } else if (itemId === 'wood_plank') {
    // 2x4 Construction Timber Board
    const plank = new THREE.Mesh(new THREE.BoxGeometry(2.8, 14.0, 1.2), woodStockMat);
    plank.position.y = 4;
    root.add(plank);

    root.rotation.x = Math.PI / 2.2;
    root.position.set(0, 0, 1.5);

  } else if (itemId === 'nails') {
    // Box of Nails
    const box = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.5, 2.5), woodLightMat);
    box.position.y = 1.25;
    root.add(box);

    // Steel Nails protruding
    for (let n = -1; n <= 1; n += 0.7) {
      const nail = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 2.5, 4), steelShinyMat);
      nail.position.set(n, 2.5, (n * 0.3));
      root.add(nail);
    }

    root.rotation.x = Math.PI / 2.5;
    root.position.set(0, 0, 1.5);

  } else if (itemId === 'scrap_metal') {
    // Heavy Industrial Steel Angle / Plate
    const plate = new THREE.Mesh(new THREE.BoxGeometry(4.5, 6.5, 0.8), darkMetalMat);
    plate.position.y = 3;
    root.add(plate);

    // Rivet Holes / Bolts
    [-1.5, 1.5].forEach(rx => {
      [1.5, 4.5].forEach(ry => {
        const rivet = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.0, 6), steelShinyMat);
        rivet.rotation.x = Math.PI / 2;
        rivet.position.set(rx, ry, 0);
        root.add(rivet);
      });
    });

    root.rotation.x = Math.PI / 2.4;
    root.position.set(0, 0, 1.5);

  } else if (itemId === 'duct_tape') {
    // Silver Duct Tape Roll
    const tapeRoll = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 2.2, 12), tapeMat);
    tapeRoll.rotation.x = Math.PI / 2;
    tapeRoll.position.y = 2.4;
    root.add(tapeRoll);

    // Cardboard core
    const core = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 2.3, 10), woodLightMat);
    core.rotation.x = Math.PI / 2;
    core.position.y = 2.4;
    root.add(core);

    root.rotation.x = Math.PI / 2.5;
    root.position.set(0, 0, 1.5);

  } else if (itemId === 'alcohol') {
    // 70% Disinfectant Alcohol Bottle
    const bottle = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 5.5, 8), glassAmberMat);
    bottle.position.y = 2.75;
    root.add(bottle);

    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.2, 8), fireRedMat);
    cap.position.y = 5.8;
    root.add(cap);

    const label = new THREE.Mesh(new THREE.CylinderGeometry(1.64, 1.64, 2.6, 8), medicalWhiteMat);
    label.position.y = 2.75;
    root.add(label);

    root.rotation.x = Math.PI / 2.4;
    root.position.set(0, 0, 1.5);

  } else if (itemId === 'electronics') {
    // PCB Circuit Board with Chips & Capacitors
    const pcb = new THREE.Mesh(new THREE.BoxGeometry(4.5, 5.5, 0.3), pcbGreenMat);
    pcb.position.y = 2.75;
    root.add(pcb);

    // Microchip
    const chip = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.0, 0.5), darkMetalMat);
    chip.position.set(0, 2.75, 0.3);
    root.add(chip);

    // Capacitors
    [-1.3, 1.3].forEach(cx => {
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.8, 6), brassMat);
      cap.position.set(cx, 4.5, 0.4);
      root.add(cap);
    });

    root.rotation.x = Math.PI / 2.4;
    root.position.set(0, 0, 1.5);

  } else if (itemId === 'car_battery') {
    // Heavy 12V Car Battery
    const battery = new THREE.Mesh(new THREE.BoxGeometry(5.2, 4.0, 3.2), batteryCaseMat);
    battery.position.y = 2.0;
    root.add(battery);

    // Red Positive & Black Negative Posts
    const redPost = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.9, 6), fireRedMat);
    redPost.position.set(-1.6, 4.3, 0);
    root.add(redPost);

    const blackPost = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.9, 6), darkMetalMat);
    blackPost.position.set(1.6, 4.3, 0);
    root.add(blackPost);

    // Carry Handle
    const handle = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.3, 0.4), fireRedMat);
    handle.position.set(0, 4.8, 0);
    root.add(handle);

    root.rotation.x = Math.PI / 2.5;
    root.position.set(0, 0, 1.5);

  // =========================================================================
  // 6. DEPLOYABLE STRUCTURES & KITS (Building Materials)
  // =========================================================================
  } else if (item.category === 'structure' || item.structureType) {
    // Deployable Engineering Kit / Tool Pack
    const kit = new THREE.Mesh(new THREE.BoxGeometry(5.2, 4.0, 2.8), woodStockMat);
    kit.position.y = 2.0;
    root.add(kit);

    // Steel reinforcements & Blueprint strap
    const strap = new THREE.Mesh(new THREE.BoxGeometry(5.4, 1.0, 3.0), tapeMat);
    strap.position.y = 2.0;
    root.add(strap);

    const blueprint = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 6.2, 8), waterPlasticMat);
    blueprint.rotation.z = Math.PI / 2;
    blueprint.position.set(0, 4.5, 0);
    root.add(blueprint);

    root.rotation.x = Math.PI / 2.5;
    root.position.set(0, 0, 1.5);

  // =========================================================================
  // 7. GENERIC / FALLBACK FOR ANY OTHER ITEM
  // =========================================================================
  } else {
    // High-tech Tactical Survival Parcel / Gear Case
    const gearCase = new THREE.Mesh(new THREE.BoxGeometry(4.6, 3.4, 2.6), darkMetalMat);
    gearCase.position.y = 1.7;
    root.add(gearCase);

    const latch = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 2.8), brassMat);
    latch.position.y = 1.7;
    root.add(latch);

    root.rotation.x = Math.PI / 2.5;
    root.position.set(0, 0, 1.5);
  }

  // Update animation hook for dynamic muzzle flashes and fire effects
  updateState = (dt, time, isAttacking, attackPhase) => {
    if (muzzleFlashMesh && muzzleLight) {
      const flashMat = muzzleFlashMesh.material as THREE.MeshBasicMaterial;
      if (isAttacking && attackPhase > 0.05) {
        if (flashMat) flashMat.opacity = 0.95;
        muzzleLight.intensity = 2.8;
      } else {
        if (flashMat) flashMat.opacity = 0;
        muzzleLight.intensity = 0;
      }
    }
  };

  return {
    itemData: item,
    mesh: root,
    muzzlePosition,
    hasMuzzleFlash,
    isTwoHanded,
    muzzleFlashMesh,
    muzzleLight,
    updateState,
  };
}
