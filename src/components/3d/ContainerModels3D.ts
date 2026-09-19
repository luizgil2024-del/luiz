import * as THREE from 'three';
import { Container } from '../../types/game';

export interface Container3DInstance {
  containerData: Container;
  mesh: THREE.Group;
  updateState: (isSearched: boolean) => void;
}

// Reusable materials & geometries cache for high performance
const woodDarkMat = new THREE.MeshStandardMaterial({
  color: '#5c2d0c',
  roughness: 0.75,
  metalness: 0.05,
});

const woodPlankMat = new THREE.MeshStandardMaterial({
  color: '#783b14',
  roughness: 0.7,
  metalness: 0.05,
});

const ironBracketMat = new THREE.MeshStandardMaterial({
  color: '#334155',
  roughness: 0.35,
  metalness: 0.85,
});

const brassLockMat = new THREE.MeshStandardMaterial({
  color: '#d97706',
  roughness: 0.25,
  metalness: 0.9,
});

const rivetMat = new THREE.MeshStandardMaterial({
  color: '#94a3b8',
  roughness: 0.3,
  metalness: 0.8,
});

const fridgeBodyMat = new THREE.MeshStandardMaterial({
  color: '#f1f5f9',
  roughness: 0.25,
  metalness: 0.15,
});

const chromeHandleMat = new THREE.MeshStandardMaterial({
  color: '#cbd5e1',
  roughness: 0.15,
  metalness: 0.95,
});

const darkGasketMat = new THREE.MeshStandardMaterial({
  color: '#0f172a',
  roughness: 0.9,
});

const steelFrameMat = new THREE.MeshStandardMaterial({
  color: '#1e293b',
  roughness: 0.45,
  metalness: 0.75,
});

const steelSheetMat = new THREE.MeshStandardMaterial({
  color: '#475569',
  roughness: 0.4,
  metalness: 0.7,
});

const whiteEnamelMat = new THREE.MeshStandardMaterial({
  color: '#f8fafc',
  roughness: 0.3,
  metalness: 0.1,
});

const medicalRedMat = new THREE.MeshStandardMaterial({
  color: '#dc2626',
  roughness: 0.4,
  metalness: 0.1,
});

const mahoganyMat = new THREE.MeshStandardMaterial({
  color: '#653012',
  roughness: 0.6,
  metalness: 0.05,
});

const goldHandleMat = new THREE.MeshStandardMaterial({
  color: '#eab308',
  roughness: 0.25,
  metalness: 0.85,
});

// Helper for tiny rivet bolts
const rivetGeo = new THREE.DodecahedronGeometry(0.65);

export function createDetailedContainer3D(c: Container): Container3DInstance {
  const cGroup = new THREE.Group();
  cGroup.position.set(c.x + c.width / 2, 0, c.y + c.height / 2);

  let lidGroup: THREE.Group | null = null;
  let drawerMesh: THREE.Mesh | null = null;

  const w = Math.max(16, c.width * 0.85);
  const d = Math.max(14, c.height * 0.85);

  if (c.type === 'fridge') {
    // ==========================================
    // GELADEIRA REALISTA (Duas portas, puxadores, ímãs, ventilação)
    // ==========================================
    const h = 34;
    const bodyDepth = d;
    const bodyW = w;

    // Main Fridge Cabinet Body
    const mainCabinet = new THREE.Mesh(new THREE.BoxGeometry(bodyW, h, bodyDepth * 0.9), fridgeBodyMat);
    mainCabinet.position.set(0, h / 2, -bodyDepth * 0.05);
    mainCabinet.castShadow = true;
    mainCabinet.receiveShadow = true;
    cGroup.add(mainCabinet);

    // Gasket black divider seam
    const gasket = new THREE.Mesh(new THREE.BoxGeometry(bodyW + 0.2, 0.8, bodyDepth + 0.2), darkGasketMat);
    gasket.position.set(0, h * 0.65, 0);
    cGroup.add(gasket);

    // Freezer Upper Door
    const freezerDoorH = h * 0.32;
    const freezerDoor = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.98, freezerDoorH, 2.2), fridgeBodyMat);
    freezerDoor.position.set(0, h - freezerDoorH / 2 - 0.5, bodyDepth * 0.42);
    freezerDoor.castShadow = true;
    cGroup.add(freezerDoor);

    // Freezer Handle
    const freezerHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 7, 8), chromeHandleMat);
    freezerHandle.rotation.z = Math.PI / 2;
    freezerHandle.position.set(bodyW * 0.32, h - freezerDoorH / 2 - 0.5, bodyDepth * 0.42 + 1.8);
    cGroup.add(freezerHandle);

    // Main Refrigerator Lower Door (Articulated on hinge if opened)
    const mainDoorH = h * 0.62;
    const mainDoorPivot = new THREE.Group();
    mainDoorPivot.position.set(-bodyW * 0.48, 0, bodyDepth * 0.4);

    const mainDoor = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.96, mainDoorH, 2.2), fridgeBodyMat);
    mainDoor.position.set(bodyW * 0.48, mainDoorH / 2 + 1.2, 0);
    mainDoor.castShadow = true;
    mainDoorPivot.add(mainDoor);

    // Long Vertical Chrome Handle
    const fridgeHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 14, 8), chromeHandleMat);
    fridgeHandle.position.set(bodyW * 0.88, mainDoorH / 2 + 1.2, 1.8);
    mainDoorPivot.add(fridgeHandle);

    // Magnetic Notes on Door
    const noteYellow = new THREE.Mesh(
      new THREE.PlaneGeometry(3.5, 4),
      new THREE.MeshStandardMaterial({ color: '#fef08a', roughness: 0.9 })
    );
    noteYellow.position.set(bodyW * 0.4, mainDoorH * 0.72, 1.2);
    noteYellow.rotation.z = 0.08;
    mainDoorPivot.add(noteYellow);

    const noteCyan = new THREE.Mesh(
      new THREE.PlaneGeometry(3, 3),
      new THREE.MeshStandardMaterial({ color: '#67e8f9', roughness: 0.9 })
    );
    noteCyan.position.set(bodyW * 0.62, mainDoorH * 0.68, 1.2);
    noteCyan.rotation.z = -0.12;
    mainDoorPivot.add(noteCyan);

    cGroup.add(mainDoorPivot);
    lidGroup = mainDoorPivot;

    // Bottom ventilation kickplate
    const ventPlate = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.92, 2.5, bodyDepth * 0.8), darkGasketMat);
    ventPlate.position.set(0, 1.25, 0);
    cGroup.add(ventPlate);

  } else if (c.type === 'cabinet') {
    // ==========================================
    // ARMÁRIO & GAVETEIRO (Madeira Nobre, Puxadores de Bronze, Tampo Saliente)
    // ==========================================
    const h = 22;

    // Base plinth
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(w * 0.96, 2, d * 0.94), woodDarkMat);
    plinth.position.y = 1;
    cGroup.add(plinth);

    // Main cabinet body
    const cabinetBody = new THREE.Mesh(new THREE.BoxGeometry(w * 0.94, h - 3.5, d * 0.92), mahoganyMat);
    cabinetBody.position.y = (h - 3.5) / 2 + 2;
    cabinetBody.castShadow = true;
    cabinetBody.receiveShadow = true;
    cGroup.add(cabinetBody);

    // Overhanging bevel countertop on top
    const counterTop = new THREE.Mesh(new THREE.BoxGeometry(w, 2, d), woodPlankMat);
    counterTop.position.y = h;
    counterTop.castShadow = true;
    cGroup.add(counterTop);

    // Pull-out Top Drawer
    const drawerH = 5.5;
    const drawerG = new THREE.Mesh(new THREE.BoxGeometry(w * 0.88, drawerH, d * 0.88), woodPlankMat);
    drawerG.position.set(0, h - drawerH / 2 - 1.5, 0);
    drawerG.castShadow = true;
    cGroup.add(drawerG);
    drawerMesh = drawerG;

    // Drawer Brass Handles
    [-w * 0.22, w * 0.22].forEach(hx => {
      const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 1.2, 8), goldHandleMat);
      knob.rotation.x = Math.PI / 2;
      knob.position.set(hx, 0, d * 0.44 + 0.6);
      drawerG.add(knob);
    });

    // Lower cabinet door panels
    const lowerDoorH = 10;
    const leftDoor = new THREE.Mesh(new THREE.BoxGeometry(w * 0.42, lowerDoorH, 1.2), woodPlankMat);
    leftDoor.position.set(-w * 0.23, 7.5, d * 0.44);
    cGroup.add(leftDoor);

    const rightDoor = new THREE.Mesh(new THREE.BoxGeometry(w * 0.42, lowerDoorH, 1.2), woodPlankMat);
    rightDoor.position.set(w * 0.23, 7.5, d * 0.44);
    cGroup.add(rightDoor);

    // Lower Door Knobs
    [-w * 0.08, w * 0.08].forEach(kx => {
      const doorKnob = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 8), goldHandleMat);
      doorKnob.position.set(kx, 8.5, d * 0.44 + 1.2);
      cGroup.add(doorKnob);
    });

    // Decorative countertop prop (Coffee mug or small vintage radio)
    const mugMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.3 });
    const mug = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1, 2.5, 10), mugMat);
    mug.position.set(-w * 0.25, h + 2.25, -d * 0.15);
    mug.castShadow = true;
    cGroup.add(mug);

  } else if (c.type === 'shelf') {
    // ==========================================
    // GÔNDOLA DE SUPERMERCADO / ESTANTE INDUSTRIAL COM ITENS
    // ==========================================
    const h = 28;

    // 4 Corner Steel Upright Posts
    const postGeo = new THREE.BoxGeometry(1.5, h, 1.5);
    [-w * 0.45, w * 0.45].forEach(px => {
      [-d * 0.45, d * 0.45].forEach(pz => {
        const post = new THREE.Mesh(postGeo, steelFrameMat);
        post.position.set(px, h / 2, pz);
        post.castShadow = true;
        cGroup.add(post);
      });
    });

    // 3 Tiered Steel Shelves
    const shelfGeo = new THREE.BoxGeometry(w, 1.2, d);
    [2, h * 0.5, h - 1].forEach((sy, tierIdx) => {
      const shelfMesh = new THREE.Mesh(shelfGeo, steelSheetMat);
      shelfMesh.position.y = sy;
      shelfMesh.castShadow = true;
      shelfMesh.receiveShadow = true;
      cGroup.add(shelfMesh);

      // Add realistic 3D loot/goods props on the shelves
      if (tierIdx === 1) {
        // Canned food cans (Red, Yellow, Green tins)
        const canColors = ['#ef4444', '#eab308', '#22c55e', '#ef4444'];
        [-w * 0.3, -w * 0.1, w * 0.1, w * 0.3].forEach((cx, ci) => {
          const canMat = new THREE.MeshStandardMaterial({
            color: canColors[ci],
            roughness: 0.4,
            metalness: 0.4,
          });
          const can = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 3.2, 10), canMat);
          can.position.set(cx, sy + 2.2, 0);
          can.castShadow = true;
          cGroup.add(can);

          // Shiny metal tin lid
          const lid = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.45, 0.4, 10), chromeHandleMat);
          lid.position.set(cx, sy + 3.8, 0);
          cGroup.add(lid);
        });
      } else if (tierIdx === 2) {
        // Cereal boxes & medical boxes
        const box1Mat = new THREE.MeshStandardMaterial({ color: '#ca8a04', roughness: 0.8 });
        const box1 = new THREE.Mesh(new THREE.BoxGeometry(4, 5.5, 2.5), box1Mat);
        box1.position.set(-w * 0.22, sy + 3.35, 0);
        box1.castShadow = true;
        cGroup.add(box1);

        const box2Mat = new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.8 });
        const box2 = new THREE.Mesh(new THREE.BoxGeometry(3.5, 5, 2.5), box2Mat);
        box2.position.set(w * 0.15, sy + 3.1, 0);
        box2.castShadow = true;
        cGroup.add(box2);
      }
    });

  } else if (c.type === 'firstaid') {
    // ==========================================
    // MALETA / ARMARINHO DE PRIMEIROS SOCORROS
    // ==========================================
    const h = 15;
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), whiteEnamelMat);
    body.position.y = h / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    cGroup.add(body);

    // Raised Red Cross Emblem on Front
    const crossV = new THREE.Mesh(new THREE.BoxGeometry(2.5, 8, 0.8), medicalRedMat);
    crossV.position.set(0, h / 2, d / 2 + 0.4);
    cGroup.add(crossV);

    const crossH = new THREE.Mesh(new THREE.BoxGeometry(8, 2.5, 0.8), medicalRedMat);
    crossH.position.set(0, h / 2, d / 2 + 0.4);
    cGroup.add(crossH);

    // Chrome carrying top handle
    const handleBar = new THREE.Mesh(new THREE.BoxGeometry(7, 1.2, 1.2), chromeHandleMat);
    handleBar.position.set(0, h + 1.2, 0);
    cGroup.add(handleBar);

    // Side metal toggle latches
    [-w * 0.35, w * 0.35].forEach(lx => {
      const latch = new THREE.Mesh(new THREE.BoxGeometry(1.5, 3.5, 0.6), chromeHandleMat);
      latch.position.set(lx, h / 2, d / 2 + 0.3);
      cGroup.add(latch);
    });

  } else if (c.type === 'locker') {
    // ==========================================
    // ARMÁRIO DE AÇO MILITAR / VESTIÁRIO COM GRELHAS
    // ==========================================
    const h = 38;
    const lockerMat = new THREE.MeshStandardMaterial({
      color: '#1e3a2b',
      roughness: 0.35,
      metalness: 0.75,
    });

    const lockerBody = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), lockerMat);
    lockerBody.position.y = h / 2;
    lockerBody.castShadow = true;
    lockerBody.receiveShadow = true;
    cGroup.add(lockerBody);

    // Stamped Louver Ventilation Slits on Top
    const slitMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.9 });
    for (let i = 0; i < 3; i++) {
      const slit = new THREE.Mesh(new THREE.BoxGeometry(w * 0.5, 0.7, 0.4), slitMat);
      slit.position.set(0, h - 5 - i * 1.8, d / 2 + 0.2);
      cGroup.add(slit);
    }

    // Stamped Louver Ventilation Slits on Bottom
    for (let i = 0; i < 3; i++) {
      const slit = new THREE.Mesh(new THREE.BoxGeometry(w * 0.5, 0.7, 0.4), slitMat);
      slit.position.set(0, 6 + i * 1.8, d / 2 + 0.2);
      cGroup.add(slit);
    }

    // Recessed Handle Cup & Lock Dial
    const lockCup = new THREE.Mesh(new THREE.BoxGeometry(3, 8, 0.8), ironBracketMat);
    lockCup.position.set(w * 0.28, h * 0.52, d / 2 + 0.4);
    cGroup.add(lockCup);

    const lockDial = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.8, 12), chromeHandleMat);
    lockDial.rotation.x = Math.PI / 2;
    lockDial.position.set(w * 0.28, h * 0.52, d / 2 + 0.9);
    cGroup.add(lockDial);

    // Number Plate
    const numPlate = new THREE.Mesh(new THREE.BoxGeometry(4.5, 2, 0.3), brassLockMat);
    numPlate.position.set(0, h - 11, d / 2 + 0.2);
    cGroup.add(numPlate);

  } else {
    // ==========================================
    // BAÚ DE MADEIRA E FERRO DETALHADO (Supply Chest / Crate)
    // ==========================================
    const baseH = 14;
    const lidH = 4.5;

    // 1. Base Runners (skids underneath lifting it)
    [-d * 0.35, d * 0.35].forEach(sz => {
      const runner = new THREE.Mesh(new THREE.BoxGeometry(w + 1, 1.8, 2.5), woodDarkMat);
      runner.position.set(0, 0.9, sz);
      runner.castShadow = true;
      cGroup.add(runner);
    });

    // 2. Main Wooden Box Body with deep rich oak tone
    const chestBox = new THREE.Mesh(new THREE.BoxGeometry(w, baseH, d), woodPlankMat);
    chestBox.position.y = baseH / 2 + 1.8;
    chestBox.castShadow = true;
    chestBox.receiveShadow = true;
    cGroup.add(chestBox);

    // Recessed horizontal wood plank grooves
    [-baseH * 0.22, baseH * 0.22].forEach(py => {
      const grooveFront = new THREE.Mesh(new THREE.BoxGeometry(w - 3, 0.8, 0.6), woodDarkMat);
      grooveFront.position.set(0, baseH / 2 + 1.8 + py, d / 2 + 0.1);
      cGroup.add(grooveFront);
    });

    // 3. Iron Corner Angle Brackets on 4 corners with Rivets
    [-w / 2, w / 2].forEach(cx => {
      [-d / 2, d / 2].forEach(cz => {
        const cornerPlate = new THREE.Mesh(new THREE.BoxGeometry(2.6, baseH + 1, 2.6), ironBracketMat);
        cornerPlate.position.set(cx > 0 ? cx - 1.1 : cx + 1.1, baseH / 2 + 1.8, cz > 0 ? cz - 1.1 : cz + 1.1);
        cornerPlate.castShadow = true;
        cGroup.add(cornerPlate);

        // Domed Rivets on the corner bracket
        [-baseH * 0.35, 0, baseH * 0.35].forEach(ry => {
          const rMesh = new THREE.Mesh(rivetGeo, rivetMat);
          const offX = cx > 0 ? cx + 0.3 : cx - 0.3;
          const offZ = cz > 0 ? cz + 0.3 : cz - 0.3;
          rMesh.position.set(offX, baseH / 2 + 1.8 + ry, offZ);
          cGroup.add(rMesh);
        });
      });
    });

    // 4. Horizontal Iron Reinforcement Straps wrapped around chest
    [-d * 0.25, d * 0.25].forEach(sx => {
      const strap = new THREE.Mesh(new THREE.BoxGeometry(1.8, baseH + 0.2, d + 0.4), ironBracketMat);
      strap.position.set(sx, baseH / 2 + 1.8, 0);
      cGroup.add(strap);
    });

    // 5. Heavy-Duty Side Bail Handles (Left & Right)
    [-w / 2 - 0.6, w / 2 + 0.6].forEach((hx, hi) => {
      const handlePlate = new THREE.Mesh(new THREE.BoxGeometry(0.8, 4, 6), ironBracketMat);
      handlePlate.position.set(hx, baseH * 0.6 + 1.8, 0);
      cGroup.add(handlePlate);

      const handleRing = new THREE.Mesh(new THREE.TorusGeometry(2, 0.45, 8, 12, Math.PI), ironBracketMat);
      handleRing.rotation.y = hi === 0 ? -Math.PI / 2 : Math.PI / 2;
      handleRing.rotation.x = Math.PI / 4;
      handleRing.position.set(hx > 0 ? hx + 0.8 : hx - 0.8, baseH * 0.6 + 1.8, 0);
      cGroup.add(handleRing);
    });

    // 6. Front Golden-Brass Lock Plate & Padlock
    const lockPlate = new THREE.Mesh(new THREE.BoxGeometry(3.5, 5, 0.6), brassLockMat);
    lockPlate.position.set(0, baseH + 1.2, d / 2 + 0.3);
    cGroup.add(lockPlate);

    const padlockBody = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.8, 1.2), brassLockMat);
    padlockBody.position.set(0, baseH + 0.2, d / 2 + 1.1);
    padlockBody.castShadow = true;
    cGroup.add(padlockBody);

    const padlockShackle = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.3, 8, 12, Math.PI), chromeHandleMat);
    padlockShackle.rotation.z = Math.PI;
    padlockShackle.position.set(0, baseH + 2.2, d / 2 + 1.1);
    cGroup.add(padlockShackle);

    // 7. Articulated Hinged Chest Lid
    const lidPivot = new THREE.Group();
    // Place pivot at rear top edge of chest box
    lidPivot.position.set(0, baseH + 1.8, -d / 2);

    const lidMesh = new THREE.Mesh(new THREE.BoxGeometry(w + 0.6, lidH, d + 0.6), woodPlankMat);
    lidMesh.position.set(0, lidH / 2, d / 2);
    lidMesh.castShadow = true;
    lidMesh.receiveShadow = true;
    lidPivot.add(lidMesh);

    // Beveled lid crown cap
    const lidCap = new THREE.Mesh(new THREE.BoxGeometry(w - 1, 1.2, d - 1), woodDarkMat);
    lidCap.position.set(0, lidH + 0.6, d / 2);
    lidPivot.add(lidCap);

    // Iron straps running across the lid
    [-d * 0.25, d * 0.25].forEach(sx => {
      const lidStrap = new THREE.Mesh(new THREE.BoxGeometry(1.8, lidH + 0.4, d + 0.8), ironBracketMat);
      lidStrap.position.set(sx, lidH / 2, d / 2);
      lidPivot.add(lidStrap);
    });

    // Rear heavy iron strap hinges
    [-w * 0.28, w * 0.28].forEach(hx => {
      const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 3.5, 10), ironBracketMat);
      hinge.rotation.z = Math.PI / 2;
      hinge.position.set(hx, 0, 0);
      lidPivot.add(hinge);
    });

    cGroup.add(lidPivot);
    lidGroup = lidPivot;
  }

  // Initial state check
  if (c.searched) {
    if (lidGroup) {
      lidGroup.rotation.x = -0.65; // Ajar lid
    }
    if (drawerMesh) {
      drawerMesh.position.z = 4.0; // Open drawer
    }
  }

  const updateState = (isSearched: boolean) => {
    if (lidGroup) {
      lidGroup.rotation.x = isSearched ? -0.65 : 0;
    }
    if (drawerMesh) {
      drawerMesh.position.z = isSearched ? 4.0 : 0;
    }
  };

  return {
    containerData: c,
    mesh: cGroup,
    updateState,
  };
}
