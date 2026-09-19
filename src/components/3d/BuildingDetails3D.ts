import * as THREE from 'three';
import { Building } from '../../types/game';

// Shared Materials for Windows and Doors
const windowFrameMat = new THREE.MeshStandardMaterial({
  color: '#382212',
  roughness: 0.7,
  metalness: 0.1,
});

const windowGlassMat = new THREE.MeshStandardMaterial({
  color: '#7dd3fc',
  transparent: true,
  opacity: 0.35,
  roughness: 0.1,
  metalness: 0.8,
});

const brokenGlassMat = new THREE.MeshStandardMaterial({
  color: '#bae6fd',
  transparent: true,
  opacity: 0.55,
  roughness: 0.1,
  metalness: 0.7,
});

const doorWoodMat = new THREE.MeshStandardMaterial({
  color: '#5c2d0c',
  roughness: 0.65,
  metalness: 0.05,
});

const doorBevelMat = new THREE.MeshStandardMaterial({
  color: '#783b14',
  roughness: 0.7,
  metalness: 0.05,
});

const brassHandleMat = new THREE.MeshStandardMaterial({
  color: '#eab308',
  roughness: 0.2,
  metalness: 0.9,
});

const ironHingeMat = new THREE.MeshStandardMaterial({
  color: '#1e293b',
  roughness: 0.35,
  metalness: 0.85,
});

const boardBarricadeMat = new THREE.MeshStandardMaterial({
  color: '#92400e',
  roughness: 0.85,
});

const nailMat = new THREE.MeshStandardMaterial({
  color: '#cbd5e1',
  roughness: 0.25,
  metalness: 0.9,
});

/**
 * Creates 3D window frames, mullions, glass panes, and broken glass shards
 */
export function createBuildingWindows3D(b: Building): THREE.Group {
  const group = new THREE.Group();
  if (!b.windows || b.windows.length === 0) return group;

  const windowElevation = 20; // Height off ground
  const windowH = 18; // Window height

  b.windows.forEach(w => {
    const isHorizontal = w.width > w.height;
    const wWidth = isHorizontal ? w.width : 5;
    const wDepth = isHorizontal ? 5 : w.height;
    const wSpan = isHorizontal ? w.width : w.height;

    const wGroup = new THREE.Group();
    wGroup.position.set(w.x + w.width / 2, windowElevation, w.y + w.height / 2);

    // 1. Outer Frame Casing (Top, Bottom, Left, Right)
    const sillThickness = 2.4;
    const frameDepth = isHorizontal ? 7 : 7;

    // Bottom Sill
    const bottomSill = new THREE.Mesh(
      new THREE.BoxGeometry(isHorizontal ? wSpan + 2 : frameDepth, sillThickness, isHorizontal ? frameDepth : wSpan + 2),
      windowFrameMat
    );
    bottomSill.position.y = -windowH / 2;
    bottomSill.castShadow = true;
    wGroup.add(bottomSill);

    // Top Header
    const topHeader = new THREE.Mesh(
      new THREE.BoxGeometry(isHorizontal ? wSpan + 1 : frameDepth, sillThickness, isHorizontal ? frameDepth : wSpan + 1),
      windowFrameMat
    );
    topHeader.position.y = windowH / 2;
    topHeader.castShadow = true;
    wGroup.add(topHeader);

    // Left Jamb
    const leftJamb = new THREE.Mesh(
      new THREE.BoxGeometry(isHorizontal ? sillThickness : frameDepth, windowH, isHorizontal ? frameDepth : sillThickness),
      windowFrameMat
    );
    leftJamb.position.set(isHorizontal ? -wSpan / 2 : 0, 0, isHorizontal ? 0 : -wSpan / 2);
    leftJamb.castShadow = true;
    wGroup.add(leftJamb);

    // Right Jamb
    const rightJamb = new THREE.Mesh(
      new THREE.BoxGeometry(isHorizontal ? sillThickness : frameDepth, windowH, isHorizontal ? frameDepth : sillThickness),
      windowFrameMat
    );
    rightJamb.position.set(isHorizontal ? wSpan / 2 : 0, 0, isHorizontal ? 0 : wSpan / 2);
    rightJamb.castShadow = true;
    wGroup.add(rightJamb);

    // 2. Central Sash Mullions (Cross Bars)
    const mullionV = new THREE.Mesh(
      new THREE.BoxGeometry(isHorizontal ? 1.2 : 2.5, windowH - 2, isHorizontal ? 2.5 : 1.2),
      windowFrameMat
    );
    wGroup.add(mullionV);

    const mullionH = new THREE.Mesh(
      new THREE.BoxGeometry(isHorizontal ? wSpan - 2 : 2.5, 1.2, isHorizontal ? 2.5 : wSpan - 2),
      windowFrameMat
    );
    wGroup.add(mullionH);

    // 3. Glass Panes or Broken Shards
    if (!w.isBroken) {
      // Intact Glass Pane
      const glass = new THREE.Mesh(
        new THREE.BoxGeometry(isHorizontal ? wSpan - 2 : 0.8, windowH - 2, isHorizontal ? 0.8 : wSpan - 2),
        windowGlassMat
      );
      wGroup.add(glass);
    } else {
      // Shattered Window with Jagged Shards around Frame
      for (let i = -2; i <= 2; i++) {
        if (i === 0) continue;
        const shard = new THREE.Mesh(new THREE.ConeGeometry(2, 5, 3), brokenGlassMat);
        shard.position.set(isHorizontal ? i * (wSpan / 6) : 0, -windowH / 2 + 3, isHorizontal ? 0 : i * (wSpan / 6));
        shard.rotation.z = (i * 0.3);
        wGroup.add(shard);
      }

      // Fallen glass shards on floor beneath window
      for (let j = 0; j < 5; j++) {
        const fallen = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.2, 1.5), brokenGlassMat);
        fallen.position.set(
          (Math.random() - 0.5) * (wSpan * 0.7),
          -windowElevation + 0.15,
          (Math.random() - 0.5) * 8
        );
        wGroup.add(fallen);
      }
    }

    group.add(wGroup);
  });

  return group;
}

/**
 * Creates an exquisite 3D door leaf with recessed woodwork panels,
 * brass lever handle, iron butt hinges, and barricade planks if reinforced.
 */
export function createDetailedDoorLeaf3D(
  doorW: number,
  doorH: number,
  doorD: number,
  barricadeHp?: number
): THREE.Group {
  const doorLeafGroup = new THREE.Group();

  // 1. Main Solid Wood Door Slab
  const doorSlab = new THREE.Mesh(new THREE.BoxGeometry(doorW, doorH, doorD), doorWoodMat);
  doorSlab.position.set(doorW / 2, doorH / 2, doorD / 2);
  doorSlab.castShadow = true;
  doorSlab.receiveShadow = true;
  doorLeafGroup.add(doorSlab);

  // 2. Recessed Colonial Wood Panels (Upper and Lower)
  const isHorizontal = doorW > doorD;
  const panelW = isHorizontal ? doorW * 0.35 : 1.2;
  const panelD = isHorizontal ? 1.2 : doorD * 0.35;

  // Upper panel
  const panelTop = new THREE.Mesh(new THREE.BoxGeometry(panelW, doorH * 0.32, panelD), doorBevelMat);
  panelTop.position.set(doorW / 2, doorH * 0.7, doorD / 2 + (isHorizontal ? 0.6 : 0));
  doorLeafGroup.add(panelTop);

  // Lower panel
  const panelBottom = new THREE.Mesh(new THREE.BoxGeometry(panelW, doorH * 0.32, panelD), doorBevelMat);
  panelBottom.position.set(doorW / 2, doorH * 0.28, doorD / 2 + (isHorizontal ? 0.6 : 0));
  doorLeafGroup.add(panelBottom);

  // 3. Brass Lever Handle with Backplate and Keyhole
  const handleBackplate = new THREE.Mesh(
    new THREE.BoxGeometry(isHorizontal ? 2.2 : 0.6, 7, isHorizontal ? 0.6 : 2.2),
    brassHandleMat
  );
  const handleX = isHorizontal ? doorW * 0.85 : doorW / 2;
  const handleZ = isHorizontal ? doorD / 2 : doorD * 0.85;
  handleBackplate.position.set(handleX, doorH * 0.5, handleZ + (isHorizontal ? 2.1 : 0));
  doorLeafGroup.add(handleBackplate);

  const leverHandle = new THREE.Mesh(
    new THREE.BoxGeometry(isHorizontal ? 4.5 : 1, 1, isHorizontal ? 1 : 4.5),
    brassHandleMat
  );
  leverHandle.position.set(handleX - (isHorizontal ? 1 : 0), doorH * 0.5 + 1.2, handleZ + (isHorizontal ? 3.0 : 0));
  doorLeafGroup.add(leverHandle);

  // 4. Heavy Iron Butt Hinges (Pivot Side)
  [doorH * 0.22, doorH * 0.78].forEach(hy => {
    const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 3.5, 8), ironHingeMat);
    hinge.position.set(isHorizontal ? 2 : doorW / 2, hy, isHorizontal ? doorD / 2 : 2);
    doorLeafGroup.add(hinge);
  });

  // 5. If door is barricaded, show rugged wooden planks nailed across the door
  if (barricadeHp !== undefined && barricadeHp > 0) {
    [doorH * 0.35, doorH * 0.65].forEach((py, pi) => {
      const plank = new THREE.Mesh(
        new THREE.BoxGeometry(isHorizontal ? doorW * 1.1 : 2.2, 4.5, isHorizontal ? 2.2 : doorD * 1.1),
        boardBarricadeMat
      );
      plank.position.set(doorW / 2, py, doorD / 2 + (isHorizontal ? 2.8 : 0));
      plank.rotation.z = pi === 0 ? 0.08 : -0.06;
      plank.castShadow = true;
      doorLeafGroup.add(plank);

      // Driven steel nails
      [-doorW * 0.3, doorW * 0.3].forEach(nx => {
        const nail = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.4, 6), nailMat);
        nail.rotation.x = Math.PI / 2;
        nail.position.set(doorW / 2 + nx, py, doorD / 2 + (isHorizontal ? 4.1 : 0));
        doorLeafGroup.add(nail);
      });
    });
  }

  return doorLeafGroup;
}
