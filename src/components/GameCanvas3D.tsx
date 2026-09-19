import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GameEngine } from '../game/gameEngine';
import { CROSSWALKS, MAP_HEIGHT, MAP_WIDTH, STREETS, STREET_PROPS } from '../game/mapData';
import { StructureType, Zombie } from '../types/game';
import { createDetailedContainer3D, Container3DInstance } from './3d/ContainerModels3D';
import { createDetailedStructure3D, Structure3DInstance } from './3d/StructureModels3D';
import { createDetailedDoorLeaf3D, createBuildingWindows3D } from './3d/BuildingDetails3D';
import { createDetailedHeldItem3D, HeldItem3DInstance } from './3d/HeldItemModels3D';
import { soundManager } from '../audio/soundManager';

interface GameCanvas3DProps {
  engine: GameEngine;
  selectedBuildType: StructureType | null;
  cameraSensitivity?: number;
  onOpenContainer: (containerId: string) => void;
  onStructurePlaced: () => void;
}

export const GameCanvas3D: React.FC<GameCanvas3DProps> = ({
  engine,
  selectedBuildType,
  cameraSensitivity = 1.0,
  onOpenContainer,
  onStructurePlaced,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectedBuildTypeRef = useRef(selectedBuildType);
  useEffect(() => {
    selectedBuildTypeRef.current = selectedBuildType;
  }, [selectedBuildType]);

  const onStructurePlacedRef = useRef(onStructurePlaced);
  useEffect(() => {
    onStructurePlacedRef.current = onStructurePlaced;
  }, [onStructurePlaced]);

  const onOpenContainerRef = useRef(onOpenContainer);
  useEffect(() => {
    onOpenContainerRef.current = onOpenContainer;
  }, [onOpenContainer]);

  const cameraSensitivityRef = useRef(cameraSensitivity);
  useEffect(() => {
    cameraSensitivityRef.current = cameraSensitivity;
  }, [cameraSensitivity]);
  const [cameraMode, setCameraMode] = useState<'isometric' | 'action' | 'first_person' | 'tactical'>('isometric');
  const cameraModeRef = useRef(cameraMode);
  useEffect(() => {
    cameraModeRef.current = cameraMode;
  }, [cameraMode]);

  const [nearbyPrompt, setNearbyPrompt] = useState<{ text: string; icon: string; x: number; y: number } | null>(null);
  const lastPromptKeyRef = useRef<string | null>(null);
  const [meleeHintVisible, setMeleeHintVisible] = useState(true);
  const [showHudInfo, setShowHudInfo] = useState(true);
  const [showCameraOption, setShowCameraOption] = useState(true);

  // Mouse position and dragging state in 3D world space
  const mouseWorldPos = useRef<{ x: number; z: number }>({ x: 0, z: 0 });
  const isRightMouseDown = useRef(false);
  const lastMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const firstPersonPitch = useRef<number>(0);
  const camOrbitAngle = useRef<number>(engine.player.angle);
  const camPitchAngle = useRef<number>(0.75);
  const mouseDownTime = useRef<number>(0);
  const hasMovedWhileDown = useRef<boolean>(false);

  const camDistanceRef = useRef(260);
  const targetCamDistRef = useRef(260);
  const camLookTarget = useRef({ x: engine.player.x, y: 14, z: engine.player.y });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // --- 1. THREE.JS SCENE, CAMERA & RENDERER ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0f172a');
    scene.fog = new THREE.FogExp2('#0f172a', 0.0012);

    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 3500);
    camera.position.set(engine.player.x, 260, engine.player.y + 200);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    container.appendChild(renderer.domElement);

    // Raycasting plane for mouse aiming on ground (Y = 0)
    const raycaster = new THREE.Raycaster();
    const mouseNorm = new THREE.Vector2();
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const planeIntersect = new THREE.Vector3();

    // --- 2. LIGHTING (DAY/NIGHT & ATMOSPHERE) ---
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.55);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight('#fff8e7', 1.1);
    sunLight.position.set(1000, 600, 1000);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 50;
    sunLight.shadow.camera.far = 1800;
    const shadowD = 650;
    sunLight.shadow.camera.left = -shadowD;
    sunLight.shadow.camera.right = shadowD;
    sunLight.shadow.camera.top = shadowD;
    sunLight.shadow.camera.bottom = -shadowD;
    sunLight.shadow.bias = -0.0006;
    scene.add(sunLight);

    // Player Flashlight (SpotLight)
    const flashlight = new THREE.SpotLight('#ffffff', 2.8, 380, Math.PI / 5.5, 0.45, 1.2);
    flashlight.position.set(engine.player.x, 18, engine.player.y);
    flashlight.castShadow = true;
    flashlight.shadow.mapSize.width = 512;
    flashlight.shadow.mapSize.height = 512;
    flashlight.shadow.bias = -0.001;
    scene.add(flashlight);
    const flashlightTarget = new THREE.Object3D();
    scene.add(flashlightTarget);
    flashlight.target = flashlightTarget;

    // --- 3. 3D TERRAIN, ROADS & CROSSWALKS ---
    // Base grass ground
    const groundGeo = new THREE.PlaneGeometry(MAP_WIDTH + 800, MAP_HEIGHT + 800);
    const groundMat = new THREE.MeshStandardMaterial({
      color: '#26382b',
      roughness: 0.9,
      metalness: 0.1,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.set(MAP_WIDTH / 2, -0.05, MAP_HEIGHT / 2);
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // Streets
    const streetMat = new THREE.MeshStandardMaterial({
      color: '#1f2429',
      roughness: 0.85,
      metalness: 0.15,
    });
    const curbMat = new THREE.MeshStandardMaterial({
      color: '#475569',
      roughness: 0.7,
    });
    const roadMarkMat = new THREE.MeshBasicMaterial({ color: '#eab308' }); // Yellow dashed line
    const whiteMarkMat = new THREE.MeshBasicMaterial({ color: '#f8fafc' }); // White lines/crosswalk

    STREETS.forEach(st => {
      const roadGeo = new THREE.PlaneGeometry(st.width, st.height);
      const roadMesh = new THREE.Mesh(roadGeo, streetMat);
      roadMesh.rotation.x = -Math.PI / 2;
      roadMesh.position.set(st.x + st.width / 2, 0.05, st.y + st.height / 2);
      roadMesh.receiveShadow = true;
      scene.add(roadMesh);

      // Sidewalk curbs
      const curbThickness = 6;
      const curbHeight = 0.8;
      if (st.isVertical) {
        // Left & right curbs
        const leftCurb = new THREE.Mesh(
          new THREE.BoxGeometry(curbThickness, curbHeight, st.height),
          curbMat
        );
        leftCurb.position.set(st.x - curbThickness / 2, curbHeight / 2, st.y + st.height / 2);
        leftCurb.castShadow = true;
        leftCurb.receiveShadow = true;
        scene.add(leftCurb);

        const rightCurb = new THREE.Mesh(
          new THREE.BoxGeometry(curbThickness, curbHeight, st.height),
          curbMat
        );
        rightCurb.position.set(st.x + st.width + curbThickness / 2, curbHeight / 2, st.y + st.height / 2);
        rightCurb.castShadow = true;
        rightCurb.receiveShadow = true;
        scene.add(rightCurb);

        // Center dashed yellow lines
        const dashLen = 30;
        const gapLen = 25;
        const total = st.height;
        for (let y = 0; y < total; y += dashLen + gapLen) {
          const dash = new THREE.Mesh(new THREE.PlaneGeometry(3, dashLen), roadMarkMat);
          dash.rotation.x = -Math.PI / 2;
          dash.position.set(st.x + st.width / 2, 0.08, st.y + y + dashLen / 2);
          scene.add(dash);
        }
      } else {
        // Horizontal road curbs
        const topCurb = new THREE.Mesh(
          new THREE.BoxGeometry(st.width, curbHeight, curbThickness),
          curbMat
        );
        topCurb.position.set(st.x + st.width / 2, curbHeight / 2, st.y - curbThickness / 2);
        topCurb.castShadow = true;
        topCurb.receiveShadow = true;
        scene.add(topCurb);

        const bottomCurb = new THREE.Mesh(
          new THREE.BoxGeometry(st.width, curbHeight, curbThickness),
          curbMat
        );
        bottomCurb.position.set(st.x + st.width / 2, curbHeight / 2, st.y + st.height + curbThickness / 2);
        bottomCurb.castShadow = true;
        bottomCurb.receiveShadow = true;
        scene.add(bottomCurb);

        // Horizontal dashed lines
        const dashLen = 30;
        const gapLen = 25;
        for (let x = 0; x < st.width; x += dashLen + gapLen) {
          const dash = new THREE.Mesh(new THREE.PlaneGeometry(dashLen, 3), roadMarkMat);
          dash.rotation.x = -Math.PI / 2;
          dash.position.set(st.x + x + dashLen / 2, 0.08, st.y + st.height / 2);
          scene.add(dash);
        }
      }
    });

    // Crosswalks (Zebra stripes)
    CROSSWALKS.forEach(cw => {
      const isVert = cw.height > cw.width;
      const stripeCount = 6;
      if (isVert) {
        const stripeH = cw.height / (stripeCount * 2);
        for (let i = 0; i < stripeCount; i++) {
          const stripe = new THREE.Mesh(new THREE.PlaneGeometry(cw.width - 4, stripeH), whiteMarkMat);
          stripe.rotation.x = -Math.PI / 2;
          stripe.position.set(cw.x + cw.width / 2, 0.09, cw.y + i * stripeH * 2 + stripeH / 2);
          scene.add(stripe);
        }
      } else {
        const stripeW = cw.width / (stripeCount * 2);
        for (let i = 0; i < stripeCount; i++) {
          const stripe = new THREE.Mesh(new THREE.PlaneGeometry(stripeW, cw.height - 4), whiteMarkMat);
          stripe.rotation.x = -Math.PI / 2;
          stripe.position.set(cw.x + i * stripeW * 2 + stripeW / 2, 0.09, cw.y + cw.height / 2);
          scene.add(stripe);
        }
      }
    });

    // --- 4. 3D BUILDINGS (WALLS, FLOORS, DOORS, WINDOWS & ADAPTIVE ROOFS) ---
    const buildingRoofs: { buildingId: string; mesh: THREE.Mesh; material: THREE.MeshStandardMaterial }[] = [];
    const doorMeshes: { doorData: any; mesh: THREE.Group; initialRotation: number }[] = [];

    const wallHeight = 42;
    const wallThick = 6;

    engine.buildings.forEach(b => {
      const bGroup = new THREE.Group();

      // Interior Floor
      const floorMat = new THREE.MeshStandardMaterial({
        color: b.floorColor,
        roughness: 0.8,
      });
      const floorGeo = new THREE.PlaneGeometry(b.width, b.height);
      const floorMesh = new THREE.Mesh(floorGeo, floorMat);
      floorMesh.rotation.x = -Math.PI / 2;
      floorMesh.position.set(b.x + b.width / 2, 0.1, b.y + b.height / 2);
      floorMesh.receiveShadow = true;
      bGroup.add(floorMesh);

      // Building Walls Material
      const wallMat = new THREE.MeshStandardMaterial({
        color: b.wallColor,
        roughness: 0.85,
      });

      // Top Wall (Z = b.y)
      // Check doors on top wall
      const topDoors = b.doors.filter(d => Math.abs(d.y - b.y) < 30);
      if (topDoors.length === 0) {
        const topWall = new THREE.Mesh(new THREE.BoxGeometry(b.width, wallHeight, wallThick), wallMat);
        topWall.position.set(b.x + b.width / 2, wallHeight / 2, b.y);
        topWall.castShadow = true;
        topWall.receiveShadow = true;
        bGroup.add(topWall);
      } else {
        const d = topDoors[0];
        const leftW = d.x - b.x;
        if (leftW > 0) {
          const wallL = new THREE.Mesh(new THREE.BoxGeometry(leftW, wallHeight, wallThick), wallMat);
          wallL.position.set(b.x + leftW / 2, wallHeight / 2, b.y);
          wallL.castShadow = true;
          wallL.receiveShadow = true;
          bGroup.add(wallL);
        }
        const rightW = b.x + b.width - (d.x + d.width);
        if (rightW > 0) {
          const wallR = new THREE.Mesh(new THREE.BoxGeometry(rightW, wallHeight, wallThick), wallMat);
          wallR.position.set(d.x + d.width + rightW / 2, wallHeight / 2, b.y);
          wallR.castShadow = true;
          wallR.receiveShadow = true;
          bGroup.add(wallR);
        }
        // Lintel above door
        const lintelH = 14;
        const lintel = new THREE.Mesh(new THREE.BoxGeometry(d.width, lintelH, wallThick), wallMat);
        lintel.position.set(d.x + d.width / 2, wallHeight - lintelH / 2, b.y);
        lintel.castShadow = true;
        bGroup.add(lintel);
      }

      // Bottom Wall (Z = b.y + b.height)
      const bottomDoors = b.doors.filter(d => Math.abs(d.y - (b.y + b.height)) < 30);
      if (bottomDoors.length === 0) {
        const bottomWall = new THREE.Mesh(new THREE.BoxGeometry(b.width, wallHeight, wallThick), wallMat);
        bottomWall.position.set(b.x + b.width / 2, wallHeight / 2, b.y + b.height);
        bottomWall.castShadow = true;
        bottomWall.receiveShadow = true;
        bGroup.add(bottomWall);
      } else {
        const d = bottomDoors[0];
        const leftW = d.x - b.x;
        if (leftW > 0) {
          const wallL = new THREE.Mesh(new THREE.BoxGeometry(leftW, wallHeight, wallThick), wallMat);
          wallL.position.set(b.x + leftW / 2, wallHeight / 2, b.y + b.height);
          wallL.castShadow = true;
          wallL.receiveShadow = true;
          bGroup.add(wallL);
        }
        const rightW = b.x + b.width - (d.x + d.width);
        if (rightW > 0) {
          const wallR = new THREE.Mesh(new THREE.BoxGeometry(rightW, wallHeight, wallThick), wallMat);
          wallR.position.set(d.x + d.width + rightW / 2, wallHeight / 2, b.y + b.height);
          wallR.castShadow = true;
          wallR.receiveShadow = true;
          bGroup.add(wallR);
        }
        const lintelH = 14;
        const lintel = new THREE.Mesh(new THREE.BoxGeometry(d.width, lintelH, wallThick), wallMat);
        lintel.position.set(d.x + d.width / 2, wallHeight - lintelH / 2, b.y + b.height);
        lintel.castShadow = true;
        bGroup.add(lintel);
      }

      // Left Wall (X = b.x)
      const leftDoors = b.doors.filter(d => Math.abs(d.x - b.x) < 30);
      if (leftDoors.length === 0) {
        const leftWall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallHeight, b.height), wallMat);
        leftWall.position.set(b.x, wallHeight / 2, b.y + b.height / 2);
        leftWall.castShadow = true;
        leftWall.receiveShadow = true;
        bGroup.add(leftWall);
      } else {
        const d = leftDoors[0];
        const topH = d.y - b.y;
        if (topH > 0) {
          const wallT = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallHeight, topH), wallMat);
          wallT.position.set(b.x, wallHeight / 2, b.y + topH / 2);
          wallT.castShadow = true;
          bGroup.add(wallT);
        }
        const bottomH = b.y + b.height - (d.y + d.height);
        if (bottomH > 0) {
          const wallB = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallHeight, bottomH), wallMat);
          wallB.position.set(b.x, wallHeight / 2, d.y + d.height + bottomH / 2);
          wallB.castShadow = true;
          bGroup.add(wallB);
        }
        const lintelH = 14;
        const lintel = new THREE.Mesh(new THREE.BoxGeometry(wallThick, lintelH, d.height), wallMat);
        lintel.position.set(b.x, wallHeight - lintelH / 2, d.y + d.height / 2);
        lintel.castShadow = true;
        bGroup.add(lintel);
      }

      // Right Wall (X = b.x + b.width)
      const rightDoors = b.doors.filter(d => Math.abs(d.x - (b.x + b.width)) < 30);
      if (rightDoors.length === 0) {
        const rightWall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallHeight, b.height), wallMat);
        rightWall.position.set(b.x + b.width, wallHeight / 2, b.y + b.height / 2);
        rightWall.castShadow = true;
        rightWall.receiveShadow = true;
        bGroup.add(rightWall);
      } else {
        const d = rightDoors[0];
        const topH = d.y - b.y;
        if (topH > 0) {
          const wallT = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallHeight, topH), wallMat);
          wallT.position.set(b.x + b.width, wallHeight / 2, b.y + topH / 2);
          wallT.castShadow = true;
          bGroup.add(wallT);
        }
        const bottomH = b.y + b.height - (d.y + d.height);
        if (bottomH > 0) {
          const wallB = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallHeight, bottomH), wallMat);
          wallB.position.set(b.x + b.width, wallHeight / 2, d.y + d.height + bottomH / 2);
          wallB.castShadow = true;
          bGroup.add(wallB);
        }
        const lintelH = 14;
        const lintel = new THREE.Mesh(new THREE.BoxGeometry(wallThick, lintelH, d.height), wallMat);
        lintel.position.set(b.x + b.width, wallHeight - lintelH / 2, d.y + d.height / 2);
        lintel.castShadow = true;
        bGroup.add(lintel);
      }

      // 3D Windows with sills, casing frames, glass panes, and broken glass shards
      bGroup.add(createBuildingWindows3D(b));

      // 3D Door leaves (recessed panels, brass lever handle, hinges, and barricade planks)
      b.doors.forEach(d => {
        const doorPivot = new THREE.Group();
        const isHorizontal = d.width > d.height;

        doorPivot.position.set(d.x, 0, d.y);

        const doorW = isHorizontal ? d.width : 4;
        const doorD = isHorizontal ? 4 : d.height;
        const doorLeaf = createDetailedDoorLeaf3D(doorW, 28, doorD, d.barricadeHp);
        doorPivot.add(doorLeaf);

        if (d.isOpen) {
          doorPivot.rotation.y = isHorizontal ? -Math.PI / 2.2 : Math.PI / 2.2;
        }

        bGroup.add(doorPivot);
        doorMeshes.push({ doorData: d, mesh: doorPivot, initialRotation: 0 });
      });

      // Adaptive Roof: fades to invisible when player is inside!
      const roofMat = new THREE.MeshStandardMaterial({
        color: b.roofColor,
        roughness: 0.6,
        transparent: true,
        opacity: 0.96,
      });
      const roofGeo = new THREE.BoxGeometry(b.width + 12, 6, b.height + 12);
      const roofMesh = new THREE.Mesh(roofGeo, roofMat);
      roofMesh.position.set(b.x + b.width / 2, wallHeight + 3, b.y + b.height / 2);
      roofMesh.castShadow = true;
      roofMesh.receiveShadow = true;
      bGroup.add(roofMesh);

      buildingRoofs.push({ buildingId: b.id, mesh: roofMesh, material: roofMat });

      scene.add(bGroup);
    });

    // --- 5. 3D TREES, STREETLAMPS & PROPS ---
    const streetLights: THREE.PointLight[] = [];

    // Street Furniture & Lamps (Architectural Lampposts and Cast-Iron Fire Hydrants)
    STREET_PROPS.forEach(p => {
      if (p.type === 'lamppost') {
        const lampGroup = new THREE.Group();
        lampGroup.position.set(p.x, 0, p.y);

        const postMat = new THREE.MeshStandardMaterial({ color: '#1e293b', metalness: 0.8, roughness: 0.35 });

        // Fluted Pedestal Base
        const base = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 4.5, 6, 8), postMat);
        base.position.y = 3;
        base.castShadow = true;
        lampGroup.add(base);

        // Tapered column pole
        const post = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 2.2, 56, 8), postMat);
        post.position.y = 34;
        post.castShadow = true;
        lampGroup.add(post);

        // Arched gooseneck arm
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 14, 6), postMat);
        arm.rotation.z = Math.PI / 3.2;
        arm.position.set(5, 61, 0);
        lampGroup.add(arm);

        // Glass luminaire lantern housing
        const lanternMat = new THREE.MeshBasicMaterial({ color: '#fef08a' });
        const lantern = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 2.4, 7.5, 8), lanternMat);
        lantern.position.set(10.5, 58, 0);
        lampGroup.add(lantern);

        // Architectural cap on top of lantern
        const cap = new THREE.Mesh(new THREE.ConeGeometry(4.2, 2.8, 8), postMat);
        cap.position.set(10.5, 62.8, 0);
        lampGroup.add(cap);

        // Point light for night
        const pLight = new THREE.PointLight('#fef08a', 0, 240, 1.8);
        pLight.position.set(10.5, 55, 0);
        lampGroup.add(pLight);
        streetLights.push(pLight);

        scene.add(lampGroup);
      } else if (p.type === 'hydrant') {
        const hydGroup = new THREE.Group();
        hydGroup.position.set(p.x, 0, p.y);

        const hydMat = new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.35, metalness: 0.2 });
        const metalMat = new THREE.MeshStandardMaterial({ color: '#64748b', roughness: 0.3, metalness: 0.8 });

        // Base Flange
        const flange = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 1.8, 8), metalMat);
        flange.position.y = 0.9;
        flange.castShadow = true;
        hydGroup.add(flange);

        // Main Cast Barrel
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 3.2, 13, 10), hydMat);
        barrel.position.y = 8.4;
        barrel.castShadow = true;
        hydGroup.add(barrel);

        // Top Bonnet & Pentagonal Nut
        const bonnet = new THREE.Mesh(new THREE.SphereGeometry(3, 8, 8), hydMat);
        bonnet.position.y = 14.5;
        hydGroup.add(bonnet);

        const nut = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 2, 5), metalMat);
        nut.position.y = 17;
        hydGroup.add(nut);

        // Dual side discharge nozzles
        [-3.2, 3.2].forEach(nx => {
          const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 2.2, 8), metalMat);
          nozzle.rotation.z = Math.PI / 2;
          nozzle.position.set(nx, 10, 0);
          hydGroup.add(nozzle);
        });

        scene.add(hydGroup);
      }
    });

    // Scattered 3D Trees (Trunks + Multi-tiered Leafy Canopies)
    const treePositions = [
      { x: 300, y: 350 }, { x: 400, y: 220 }, { x: 520, y: 400 },
      { x: 1120, y: 300 }, { x: 1250, y: 450 }, { x: 1750, y: 320 },
      { x: 2150, y: 420 }, { x: 2300, y: 250 }, { x: 2650, y: 380 },
      { x: 350, y: 1400 }, { x: 400, y: 1600 }, { x: 1100, y: 1450 },
      { x: 1800, y: 1550 }, { x: 2200, y: 1400 }, { x: 2600, y: 1600 },
      { x: 500, y: 2450 }, { x: 1200, y: 2450 }, { x: 1600, y: 2450 },
      { x: 2700, y: 2400 }, { x: 2850, y: 2200 },
    ];

    const trunkMat = new THREE.MeshStandardMaterial({ color: '#451a03', roughness: 0.9 });
    const leavesMat1 = new THREE.MeshStandardMaterial({ color: '#166534', roughness: 0.8 });
    const leavesMat2 = new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.8 });

    treePositions.forEach(pos => {
      const treeGroup = new THREE.Group();
      treeGroup.position.set(pos.x, 0, pos.y);

      // Trunk
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(3, 4.5, 24, 8), trunkMat);
      trunk.position.y = 12;
      trunk.castShadow = true;
      treeGroup.add(trunk);

      // Foliage layers (Cone / Dodecahedron)
      const tier1 = new THREE.Mesh(new THREE.ConeGeometry(24, 32, 8), leavesMat1);
      tier1.position.y = 34;
      tier1.castShadow = true;
      treeGroup.add(tier1);

      const tier2 = new THREE.Mesh(new THREE.ConeGeometry(18, 26, 8), leavesMat2);
      tier2.position.y = 50;
      tier2.castShadow = true;
      treeGroup.add(tier2);

      scene.add(treeGroup);
    });

    // --- 6. 3D VEHICLES (CARS, TRUCKS, POLICE CRUISER) ---
    const vehicleMeshes: { vehicleData: any; mesh: THREE.Group }[] = [];
    const carMatTire = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.9 });
    const carMatGlass = new THREE.MeshStandardMaterial({ color: '#38bdf8', roughness: 0.2, transparent: true, opacity: 0.7 });

    engine.vehicles.forEach(v => {
      const carGroup = new THREE.Group();
      carGroup.position.set(v.x, 0, v.y);
      carGroup.rotation.y = -v.angle;

      const bodyMat = new THREE.MeshStandardMaterial({ color: v.color, roughness: 0.4, metalness: 0.3 });

      // Lower Chassis
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(42, 11, 24), bodyMat);
      chassis.position.y = 9;
      chassis.castShadow = true;
      chassis.receiveShadow = true;
      carGroup.add(chassis);

      // Cabin / Roof
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(24, 9, 21), carMatGlass);
      cabin.position.set(-2, 17, 0);
      cabin.castShadow = true;
      carGroup.add(cabin);

      // Roof top
      const roof = new THREE.Mesh(new THREE.BoxGeometry(22, 2, 20), bodyMat);
      roof.position.set(-2, 22, 0);
      carGroup.add(roof);

      // 4 Wheels
      const wheelGeo = new THREE.CylinderGeometry(4.5, 4.5, 3.5, 12);
      const wheelPositions = [
        { x: 13, z: 12 }, { x: 13, z: -12 },
        { x: -13, z: 12 }, { x: -13, z: -12 },
      ];
      wheelPositions.forEach(wp => {
        const w = new THREE.Mesh(wheelGeo, carMatTire);
        w.rotation.x = Math.PI / 2;
        w.position.set(wp.x, 4.5, wp.z);
        w.castShadow = true;
        carGroup.add(w);
      });

      // Police Cruiser Lightbar
      if (v.model === 'police') {
        const lightbarMat = new THREE.MeshBasicMaterial({ color: '#ef4444' });
        const lightbar = new THREE.Mesh(new THREE.BoxGeometry(5, 3, 14), lightbarMat);
        lightbar.position.set(-2, 24, 0);
        carGroup.add(lightbar);
      }

      scene.add(carGroup);
      vehicleMeshes.push({ vehicleData: v, mesh: carGroup });
    });

    // --- 7. 3D CONTAINERS & LOOT CRATES ---
    const containerInstances: Container3DInstance[] = [];
    engine.containers.forEach(c => {
      const inst = createDetailedContainer3D(c);
      scene.add(inst.mesh);
      containerInstances.push(inst);
    });

    // --- 8. 3D PLAYER CHARACTER MODEL ---
    const playerGroup = new THREE.Group();
    playerGroup.position.set(engine.player.x, 0, engine.player.y);

    // Player Shadow disc
    const shadowGeo = new THREE.CircleGeometry(9, 16);
    const shadowMat = new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.45 });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.1;
    playerGroup.add(shadowMesh);

    // Legs with combat boots
    const pantsMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.8 });
    const bootMat = new THREE.MeshStandardMaterial({ color: '#020617', roughness: 0.5 });

    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-3.5, 12, 0);
    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(3.5, 12, 4), pantsMat);
    leftLeg.position.y = -6;
    leftLeg.castShadow = true;
    leftLegGroup.add(leftLeg);
    const leftBoot = new THREE.Mesh(new THREE.BoxGeometry(4, 4.5, 6), bootMat);
    leftBoot.position.set(0, -10.5, 1.2);
    leftLegGroup.add(leftBoot);
    playerGroup.add(leftLegGroup);

    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(3.5, 12, 0);
    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(3.5, 12, 4), pantsMat);
    rightLeg.position.y = -6;
    rightLeg.castShadow = true;
    rightLegGroup.add(rightLeg);
    const rightBoot = new THREE.Mesh(new THREE.BoxGeometry(4, 4.5, 6), bootMat);
    rightBoot.position.set(0, -10.5, 1.2);
    rightLegGroup.add(rightBoot);
    playerGroup.add(rightLegGroup);

    // Torso with survival jacket & tactical armor vest
    const torsoMat = new THREE.MeshStandardMaterial({ color: '#2563eb', roughness: 0.7 });
    const vestMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.6 });
    const torso = new THREE.Mesh(new THREE.BoxGeometry(11, 14, 7), torsoMat);
    torso.position.y = 19;
    torso.castShadow = true;
    playerGroup.add(torso);

    const vest = new THREE.Mesh(new THREE.BoxGeometry(11.8, 11, 8.2), vestMat);
    vest.position.y = 19;
    vest.castShadow = true;
    playerGroup.add(vest);

    // Military Backpack
    const packMat = new THREE.MeshStandardMaterial({ color: '#064e3b', roughness: 0.85 });
    const backpack = new THREE.Mesh(new THREE.BoxGeometry(9.5, 12, 6.5), packMat);
    backpack.position.set(0, 19, -5.5);
    backpack.castShadow = true;
    playerGroup.add(backpack);

    // Head with tactical cap & visor
    const skinMat = new THREE.MeshStandardMaterial({ color: '#fcd34d', roughness: 0.6 });
    const head = new THREE.Mesh(new THREE.SphereGeometry(4.2, 12, 12), skinMat);
    head.position.y = 29;
    head.castShadow = true;
    playerGroup.add(head);

    const capMat = new THREE.MeshStandardMaterial({ color: '#1e3a8a', roughness: 0.7 });
    const cap = new THREE.Mesh(new THREE.SphereGeometry(4.4, 12, 12), capMat);
    cap.position.set(0, 29.8, 0);
    playerGroup.add(cap);

    const visor = new THREE.Mesh(new THREE.BoxGeometry(5.5, 1.2, 4.5), capMat);
    visor.position.set(0, 29.2, 3.8);
    playerGroup.add(visor);

    // Arms & Hands
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-6.8, 23, 0);
    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(3, 11, 3.5), torsoMat);
    leftArm.position.y = -5.5;
    leftArm.castShadow = true;
    leftArmGroup.add(leftArm);
    const leftHand = new THREE.Mesh(new THREE.SphereGeometry(1.8, 8, 8), skinMat);
    leftHand.position.y = -11.5;
    leftArmGroup.add(leftHand);
    playerGroup.add(leftArmGroup);

    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(6.8, 23, 0);
    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(3, 11, 3.5), torsoMat);
    rightArm.position.y = -5.5;
    rightArm.castShadow = true;
    rightArmGroup.add(rightArm);
    const rightHand = new THREE.Mesh(new THREE.SphereGeometry(1.8, 8, 8), skinMat);
    rightHand.position.y = -11.5;
    rightArmGroup.add(rightHand);

    // Dynamic 3D Held Item Anchor in Right Hand
    const rightHandAnchor = new THREE.Group();
    rightHandAnchor.position.set(0, -11.5, 0.5);
    rightArmGroup.add(rightHandAnchor);
    playerGroup.add(rightArmGroup);

    scene.add(playerGroup);

    // First-Person 3D Viewmodel Rig attached directly to Camera
    const fpRig = new THREE.Group();
    fpRig.visible = false;
    camera.add(fpRig);
    scene.add(camera);

    const fpArmMat = new THREE.MeshStandardMaterial({ color: '#2563eb', roughness: 0.7 });
    const fpArm = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 4.5, 8), fpArmMat);
    fpArm.rotation.x = Math.PI / 2.6;
    fpArm.position.set(2.2, -2.1, -4.2);
    fpRig.add(fpArm);

    const fpHand = new THREE.Mesh(new THREE.SphereGeometry(0.75, 8, 8), skinMat);
    fpHand.position.set(2.2, -1.4, -5.8);
    fpRig.add(fpHand);

    const fpHandAnchor = new THREE.Group();
    fpHandAnchor.position.set(2.2, -1.4, -5.8);
    fpRig.add(fpHandAnchor);

    // Active Held Item tracking instances
    const heldItemCache = new Map<string, { tp: HeldItem3DInstance; fp: HeldItem3DInstance }>();
    let currentHeldItemInstance: HeldItem3DInstance | null = null;
    let fpCurrentHeldItemInstance: HeldItem3DInstance | null = null;
    let lastHeldItemId: string | null = '__none__';

    // --- 9. 3D ZOMBIE MESH POOL (SHARED GEOMETRIES & MATERIALS) ---
    const zombieMeshMap = new Map<string, THREE.Group>();
    const zLegGeo = new THREE.BoxGeometry(3.2, 12, 3.5);
    const zTorsoNormalGeo = new THREE.BoxGeometry(10.5, 13.5, 6.5);
    const zTorsoBloaterGeo = new THREE.BoxGeometry(15, 13.5, 12);
    const zHeadGeo = new THREE.SphereGeometry(4, 8, 8);
    const zArmGeo = new THREE.BoxGeometry(2.8, 3, 13);
    const zEyeGeo = new THREE.SphereGeometry(0.8, 6, 6);

    const zSkinBloaterMat = new THREE.MeshStandardMaterial({ color: '#3f6212', roughness: 0.9 });
    const zSkinDefaultMat = new THREE.MeshStandardMaterial({ color: '#4d6348', roughness: 0.9 });
    const zClothSprinterMat = new THREE.MeshStandardMaterial({ color: '#991b1b', roughness: 0.9 });
    const zClothWalkerMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.9 });
    const zEyeMat = new THREE.MeshBasicMaterial({ color: '#ef4444' });

    const createZombie3DMesh = (z: Zombie) => {
      const zGroup = new THREE.Group();
      zGroup.position.set(z.x, 0, z.y);

      const isBloater = z.type === 'bloater';
      const isSprinter = z.type === 'sprinter';
      const scale = isBloater ? 1.35 : isSprinter ? 0.95 : 1.0;
      zGroup.scale.set(scale, scale, scale);

      const zSkinMat = isBloater ? zSkinBloaterMat : zSkinDefaultMat;
      const zClothMat = isSprinter ? zClothSprinterMat : zClothWalkerMat;

      // Shadow
      const zShadow = new THREE.Mesh(shadowGeo, shadowMat);
      zShadow.rotation.x = -Math.PI / 2;
      zShadow.position.y = 0.1;
      zGroup.add(zShadow);

      // Legs
      const zLeftLeg = new THREE.Mesh(zLegGeo, zClothMat);
      zLeftLeg.position.set(-3, 6, 0);
      zLeftLeg.castShadow = true;
      zGroup.add(zLeftLeg);

      const zRightLeg = new THREE.Mesh(zLegGeo, zClothMat);
      zRightLeg.position.set(3, 6, 0);
      zRightLeg.castShadow = true;
      zGroup.add(zRightLeg);

      // Torso
      const zTorso = new THREE.Mesh(isBloater ? zTorsoBloaterGeo : zTorsoNormalGeo, zClothMat);
      zTorso.position.y = 18;
      zTorso.castShadow = true;
      zGroup.add(zTorso);

      // Head
      const zHead = new THREE.Mesh(zHeadGeo, zSkinMat);
      zHead.position.set(0, 28, 1);
      zHead.castShadow = true;
      zGroup.add(zHead);

      // Reaching Arms
      const armL = new THREE.Mesh(zArmGeo, zSkinMat);
      armL.position.set(-5.5, 20, 7.5);
      armL.castShadow = true;
      zGroup.add(armL);

      const armR = new THREE.Mesh(zArmGeo, zSkinMat);
      armR.position.set(5.5, 20, 7.5);
      armR.castShadow = true;
      zGroup.add(armR);

      // Glowing red eyes
      const eyeL = new THREE.Mesh(zEyeGeo, zEyeMat);
      eyeL.position.set(-1.4, 28.5, 4.8);
      zGroup.add(eyeL);
      const eyeR = new THREE.Mesh(zEyeGeo, zEyeMat);
      eyeR.position.set(1.4, 28.5, 4.8);
      zGroup.add(eyeR);

      scene.add(zGroup);
      return zGroup;
    };

    // --- 10. 3D BULLETS & TRACERS ---
    const bulletMeshes: THREE.Mesh[] = [];
    const bulletGeo = new THREE.CylinderGeometry(0.8, 0.8, 8, 6);
    const bulletMat = new THREE.MeshBasicMaterial({ color: '#fde047' });

    // --- 10. 3D RAIDER & PLACED STRUCTURE MESH POOLS ---
    const raiderMeshMap = new Map<string, THREE.Group>();
    const structureInstanceMap = new Map<string, Structure3DInstance>();

    // Shared Raider Geometries & Materials
    const rLegGeo = new THREE.BoxGeometry(3.5, 12, 4);
    const rTorsoGeo = new THREE.BoxGeometry(11, 14, 7);
    const rHeadGeo = new THREE.SphereGeometry(4, 8, 8);
    const rBandanaGeo = new THREE.CylinderGeometry(4.2, 4.2, 2.5, 8);
    const rMat = new THREE.MeshStandardMaterial({ color: '#7f1d1d', roughness: 0.8 });
    const rPants = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.8 });
    const bandMat = new THREE.MeshBasicMaterial({ color: '#dc2626' });

    // Ghost structure preview for building mode
    const ghostMat = new THREE.MeshBasicMaterial({ color: '#22c55e', transparent: true, opacity: 0.5 });
    const ghostMesh = new THREE.Mesh(new THREE.BoxGeometry(24, 16, 24), ghostMat);
    ghostMesh.visible = false;
    scene.add(ghostMesh);

    const createRaider3DMesh = (r: any) => {
      const rGroup = new THREE.Group();
      rGroup.position.set(r.x, 0, r.y);

      // Shadow
      const rShadow = new THREE.Mesh(shadowGeo, shadowMat);
      rShadow.rotation.x = -Math.PI / 2;
      rShadow.position.y = 0.1;
      rGroup.add(rShadow);

      // Torso & Legs
      const rLegL = new THREE.Mesh(rLegGeo, rPants);
      rLegL.position.set(-3, 6, 0);
      rGroup.add(rLegL);
      const rLegR = new THREE.Mesh(rLegGeo, rPants);
      rLegR.position.set(3, 6, 0);
      rGroup.add(rLegR);

      const rTorso = new THREE.Mesh(rTorsoGeo, rMat);
      rTorso.position.y = 19;
      rTorso.castShadow = true;
      rGroup.add(rTorso);

      const rHead = new THREE.Mesh(rHeadGeo, skinMat);
      rHead.position.y = 29;
      rHead.castShadow = true;
      rGroup.add(rHead);

      // Red Bandana
      const bandana = new THREE.Mesh(rBandanaGeo, bandMat);
      bandana.position.y = 28.5;
      rGroup.add(bandana);

      scene.add(rGroup);
      return rGroup;
    };

    // --- 11. 3D COMBAT BLOOD DECALS & PARTICLES ---
    const bloodDecals: THREE.Mesh[] = [];
    const bloodDecalGeo = new THREE.CircleGeometry(8, 12);
    const bloodDecalMat = new THREE.MeshBasicMaterial({ color: '#7f1d1d', transparent: true, opacity: 0.75 });

    // 3D Close-Range Melee Impact Ring (Shockwave on punches)
    const impactRingGeo = new THREE.RingGeometry(4, 8, 16);
    const impactRingMat = new THREE.MeshBasicMaterial({
      color: '#facc15',
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    const impactRing = new THREE.Mesh(impactRingGeo, impactRingMat);
    impactRing.rotation.x = -Math.PI / 2;
    scene.add(impactRing);

    // --- 12. INPUT EVENT HANDLERS ---
    const keys: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
      keys[e.key] = true;
      keys[e.code] = true;
      if (e.key) {
        keys[e.key.toLowerCase()] = true;
        keys[e.key.toUpperCase()] = true;
      }

      // Attack / Shoot / Punch with Spacebar
      if (e.code === 'Space') {
        engine.triggerAttack();
        const activeItem = engine.player.quickSlots[engine.player.activeSlotIndex];
        if (!activeItem || activeItem.category !== 'weapon' || activeItem.weaponType === 'melee') {
          showMeleeShockwave();
        }
      }

      // Quick Melee Punch / Bash [F]
      if (e.key === 'f' || e.key === 'F') {
        engine.triggerQuickMelee();
        showMeleeShockwave();
      }

      // Quick Slots (1-5)
      if (['1', '2', '3', '4', '5'].includes(e.key)) {
        const slotIdx = parseInt(e.key) - 1;
        engine.player.activeSlotIndex = slotIdx;
      }

      // Reload [R]
      if (e.key === 'r' || e.key === 'R') {
        engine.triggerReload();
      }

      // Flashlight Toggle [T] or [L]
      if (e.key === 't' || e.key === 'T' || e.key === 'l' || e.key === 'L') {
        engine.player.flashlightOn = !engine.player.flashlightOn;
      }

      // Interact / Loot [E]
      if (e.key === 'e' || e.key === 'E') {
        findAndInteractNearby();
      }

      // Toggle Camera View Mode [V]
      if (e.key === 'v' || e.key === 'V') {
        setCameraMode(prev => {
          if (prev === 'isometric') return 'action';
          if (prev === 'action') return 'first_person';
          if (prev === 'first_person') return 'tactical';
          return 'isometric';
        });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key] = false;
      keys[e.code] = false;
      if (e.key) {
        keys[e.key.toLowerCase()] = false;
        keys[e.key.toUpperCase()] = false;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      // Rotating the 3D camera requires holding and dragging the RIGHT mouse button (e.button === 2)
      if (!isRightMouseDown.current) return;

      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      const distMoved = Math.hypot(dx, dy);
      if (distMoved > 3) {
        hasMovedWhileDown.current = true;
      }
      lastMousePos.current = { x: e.clientX, y: e.clientY };

      const px = engine.player.x;
      const pz = engine.player.y;

      const sens = Math.max(0.1, cameraSensitivityRef.current);

      if (cameraModeRef.current === 'first_person') {
        // First-Person 3D camera look (Yaw + Pitch)
        camOrbitAngle.current += dx * 0.005 * sens;
        engine.player.angle = camOrbitAngle.current;
        firstPersonPitch.current = Math.max(-0.68, Math.min(0.68, firstPersonPitch.current - dy * 0.004 * sens));
      } else {
        // Orbit 3D Camera around player with Right Mouse Drag
        camOrbitAngle.current += dx * 0.006 * sens;
        engine.player.angle = camOrbitAngle.current;
        if (cameraModeRef.current !== 'tactical') {
          // Adjust camera elevation/pitch angle
          camPitchAngle.current = Math.max(0.32, Math.min(1.28, camPitchAngle.current + dy * 0.004 * sens));
        }
      }

      mouseWorldPos.current.x = px + Math.cos(engine.player.angle) * 250;
      mouseWorldPos.current.z = pz + Math.sin(engine.player.angle) * 250;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) { // Botão Esquerdo do Mouse: Atacar (Disparar arma / Golpear / Soco) ou Construir
        e.preventDefault();
        const activeBuild = selectedBuildTypeRef.current;
        if (activeBuild) {
          const success = engine.placeStructure(
            activeBuild,
            mouseWorldPos.current.x,
            mouseWorldPos.current.z
          );
          if (success) {
            onStructurePlacedRef.current();
          }
        } else {
          // Attack: shoots if weapon equipped, swings melee, or punches
          engine.triggerAttack();
          const activeItem = engine.player.quickSlots[engine.player.activeSlotIndex];
          if (!activeItem || activeItem.category !== 'weapon' || activeItem.weaponType === 'melee') {
            showMeleeShockwave();
          }
        }
      } else if (e.button === 2) { // Botão Direito do Mouse: Mover e Girar a Câmera 3D
        e.preventDefault();
        isRightMouseDown.current = true;
        lastMousePos.current = { x: e.clientX, y: e.clientY };
        mouseDownTime.current = Date.now();
        hasMovedWhileDown.current = false;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 2) { // Botão Direito solto
        const wasDown = isRightMouseDown.current;
        isRightMouseDown.current = false;
        const clickDuration = Date.now() - mouseDownTime.current;

        // Se foi apenas um clique rápido no botão direito sem arrastar a câmera, pode desferir soco rápido
        if (wasDown && (!hasMovedWhileDown.current && clickDuration < 200)) {
          engine.triggerQuickMelee();
          showMeleeShockwave();
        }
      }
    };

    let lastWheelTime = 0;
    const handleWheel = (e: WheelEvent) => {
      // Don't intercept when hovering scrollable modal lists or text inputs
      const target = e.target as HTMLElement | null;
      if (target && target.closest('.overflow-y-auto, .overflow-auto, [data-scrollable="true"], input, textarea, select')) {
        return;
      }

      e.preventDefault();

      // Holding Ctrl or Alt allows camera distance zoom
      if (e.ctrlKey || e.altKey) {
        targetCamDistRef.current = Math.max(150, Math.min(450, targetCamDistRef.current + e.deltaY * 0.08));
        return;
      }

      // Mouse wheel scroll changes the equipped item in player hand
      const now = performance.now();
      if (now - lastWheelTime < 50) {
        return;
      }

      const numSlots = engine.player.quickSlots.length || 5;
      const prevSlot = engine.player.activeSlotIndex;

      // Scroll down (deltaY > 0) -> next slot; scroll up (deltaY < 0) -> previous slot
      if (e.deltaY > 0) {
        engine.player.activeSlotIndex = (engine.player.activeSlotIndex + 1) % numSlots;
      } else if (e.deltaY < 0) {
        engine.player.activeSlotIndex = (engine.player.activeSlotIndex - 1 + numSlots) % numSlots;
      }

      if (engine.player.activeSlotIndex !== prevSlot) {
        lastWheelTime = now;
        soundManager.playEquipItem();
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const showMeleeShockwave = () => {
      impactRing.position.set(
        engine.player.x + Math.cos(engine.player.angle) * 35,
        0.5,
        engine.player.y + Math.sin(engine.player.angle) * 35
      );
      impactRingMat.opacity = 0.9;
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
        onOpenContainerRef.current(nearC.id);
      }
    };

    const getNearbyContainer = () => {
      for (const c of engine.containers) {
        const dist = Math.hypot(engine.player.x - (c.x + c.width / 2), engine.player.y - (c.y + c.height / 2));
        if (dist < 75) return c;
      }
      return null;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('contextmenu', handleContextMenu);

    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // --- 13. MAIN 3D ANIMATION LOOP ---
    let animationId: number;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      animationId = requestAnimationFrame(animate);

      const dt = Math.min(currentTime - lastTime, 100);
      lastTime = currentTime;

      // If right mouse is not held, ensure mouseWorldPos tracks the forward vision vector
      // so WASD movement keeps facing angle steady
      if (!isRightMouseDown.current) {
        mouseWorldPos.current.x = engine.player.x + Math.cos(engine.player.angle) * 200;
        mouseWorldPos.current.z = engine.player.y + Math.sin(engine.player.angle) * 200;
      }

      // 1. Update Game Engine
      engine.update(dt, keys, mouseWorldPos.current.x, mouseWorldPos.current.z);

      const px = engine.player.x;
      const pz = engine.player.y; // 2D y is 3D z

      // 2. Update Dynamic Lighting & Sky based on Game Time (0 - 24 hours)
      const h = engine.timeState.timeHours;
      const isNight = engine.timeState.isNight;

      // Sun angle around day
      const sunAngle = ((h - 6) / 24) * Math.PI * 2;
      sunLight.position.set(
        px + Math.cos(sunAngle) * 700,
        Math.max(120, Math.sin(sunAngle) * 800),
        pz + Math.sin(sunAngle) * 700
      );
      sunLight.target.position.set(px, 0, pz);
      sunLight.target.updateMatrixWorld();

      if (isNight) {
        (scene.background as THREE.Color).set('#030712');
        (scene.fog as THREE.FogExp2).color.set('#030712');
        ambientLight.color.set('#1e293b');
        ambientLight.intensity = 0.22;
        sunLight.color.set('#38bdf8'); // Moonlight
        sunLight.intensity = 0.3;

        // Streetlights turn on
        streetLights.forEach(sl => {
          sl.intensity = 2.4;
        });
      } else {
        // Daytime
        const daylightColor = h < 8 || h > 17 ? '#fed7aa' : '#ffffff';
        const skyCol = h < 8 || h > 17 ? '#334155' : '#475569';
        (scene.background as THREE.Color).set(skyCol);
        (scene.fog as THREE.FogExp2).color.set(skyCol);
        ambientLight.color.set(daylightColor);
        ambientLight.intensity = 0.65;
        sunLight.color.set('#fffbeb');
        sunLight.intensity = 1.35;

        // Streetlights turn off
        streetLights.forEach(sl => {
          sl.intensity = 0;
        });
      }

      // 3. Update Camera Mode (First Person vs Third Person / Isometric / Tactical)
      const currentCamMode = cameraModeRef.current;
      if (currentCamMode === 'first_person') {
        // First Person: hide player body model, show first-person viewmodel hands
        playerGroup.visible = false;
        fpRig.visible = true;

        const lookDirX = Math.cos(engine.player.angle) * Math.cos(firstPersonPitch.current);
        const lookDirY = Math.sin(firstPersonPitch.current);
        const lookDirZ = Math.sin(engine.player.angle) * Math.cos(firstPersonPitch.current);

        // Position camera directly at player's eye level (22 units high)
        camera.position.set(px, 22, pz);
        camera.lookAt(px + lookDirX * 100, 22 + lookDirY * 100, pz + lookDirZ * 100);

        // Flashlight aligns directly with eye gaze
        flashlight.visible = engine.player.flashlightOn;
        flashlight.position.set(px, 22, pz);
        flashlightTarget.position.set(px + lookDirX * 220, 22 + lookDirY * 220, pz + lookDirZ * 220);
        flashlightTarget.updateMatrixWorld();
      } else {
        // Third Person / Isometric: player model visible, hide first-person hands
        playerGroup.visible = true;
        fpRig.visible = false;

        // Flashlight spotlight
        flashlight.visible = engine.player.flashlightOn;
        flashlight.position.set(px, 20, pz);
        const aimDirX = Math.cos(engine.player.angle);
        const aimDirZ = Math.sin(engine.player.angle);
        flashlightTarget.position.set(px + aimDirX * 180, 5, pz + aimDirZ * 180);
        flashlightTarget.updateMatrixWorld();

        // Update Camera smoothly tracking player with orbital angle rotated by Left Mouse Button
        camDistanceRef.current += (targetCamDistRef.current - camDistanceRef.current) * 0.1;
        const dist = camDistanceRef.current;
        const orbitAngle = camOrbitAngle.current;

        let targetCamX = px;
        let targetCamY = 240;
        let targetCamZ = pz;

        if (currentCamMode === 'action') {
          // Action 3D: close third-person follow behind the character
          const actionDist = dist * 0.65;
          const pitch = Math.max(0.2, Math.min(0.75, camPitchAngle.current));
          targetCamX = px - Math.cos(orbitAngle) * Math.cos(pitch) * actionDist;
          targetCamY = Math.max(35, Math.sin(pitch) * actionDist);
          targetCamZ = pz - Math.sin(orbitAngle) * Math.cos(pitch) * actionDist;
        } else if (currentCamMode === 'tactical') {
          // Tactical 3D: overhead angle
          const tacDist = dist * 1.35;
          targetCamX = px - Math.cos(orbitAngle) * 35;
          targetCamY = tacDist;
          targetCamZ = pz - Math.sin(orbitAngle) * 35;
        } else {
          // Isometric 3D: orbital isometric elevation rotated by Left Mouse Button
          const pitch = Math.max(0.42, Math.min(1.2, camPitchAngle.current));
          targetCamX = px - Math.cos(orbitAngle) * Math.cos(pitch) * dist;
          targetCamY = Math.max(65, Math.sin(pitch) * dist);
          targetCamZ = pz - Math.sin(orbitAngle) * Math.cos(pitch) * dist;
        }

        // Smooth camera position lerp
        camera.position.x += (targetCamX - camera.position.x) * 0.1;
        camera.position.y += (targetCamY - camera.position.y) * 0.1;
        camera.position.z += (targetCamZ - camera.position.z) * 0.1;

        // Smooth look-at target at the player's torso
        camLookTarget.current.x += (px - camLookTarget.current.x) * 0.12;
        camLookTarget.current.y += (14 - camLookTarget.current.y) * 0.12;
        camLookTarget.current.z += (pz - camLookTarget.current.z) * 0.12;
        camera.lookAt(camLookTarget.current.x, camLookTarget.current.y, camLookTarget.current.z);
      }

      // 4. Update Player 3D Model
      playerGroup.position.set(px, 0, pz);
      // Three.js rotation: in 2D angle 0 is +X, angle PI/2 is +Y (which is +Z in Three.js)
      playerGroup.rotation.y = -engine.player.angle + Math.PI / 2;

      // Leg stride animation
      const stride = (engine as any).stepDistance * 0.24;
      leftLegGroup.rotation.x = Math.sin(stride) * 0.65;
      rightLegGroup.rotation.x = -Math.sin(stride) * 0.65;

      // Arm attack & weapon animation
      const isAttacking = engine.player.isAttacking;
      const attackPhase = engine.player.attackTimer;

      // Update Equipped 3D Item in Player Hand
      const activeItem = engine.player.quickSlots[engine.player.activeSlotIndex] || null;
      const currentItemId = activeItem ? activeItem.id : 'unarmed';

      if (currentItemId !== lastHeldItemId) {
        lastHeldItemId = currentItemId;

        // Detach previous 3D mesh in character right hand
        if (currentHeldItemInstance) {
          rightHandAnchor.remove(currentHeldItemInstance.mesh);
          currentHeldItemInstance = null;
        }
        if (fpCurrentHeldItemInstance) {
          fpHandAnchor.remove(fpCurrentHeldItemInstance.mesh);
          fpCurrentHeldItemInstance = null;
        }

        let cached = heldItemCache.get(currentItemId);
        if (!cached) {
          const tpInst = createDetailedHeldItem3D(activeItem);
          const fpInst = createDetailedHeldItem3D(activeItem);
          fpInst.mesh.scale.set(0.38, 0.38, 0.38);
          cached = { tp: tpInst, fp: fpInst };
          heldItemCache.set(currentItemId, cached);
        }

        currentHeldItemInstance = cached.tp;
        rightHandAnchor.add(currentHeldItemInstance.mesh);

        fpCurrentHeldItemInstance = cached.fp;
        fpHandAnchor.add(fpCurrentHeldItemInstance.mesh);
      }

      // Update dynamic states (e.g. molotov flame flickering, muzzle flash lights)
      currentHeldItemInstance?.updateState?.(dt / 1000, Date.now() * 0.001, isAttacking, attackPhase);
      fpCurrentHeldItemInstance?.updateState?.(dt / 1000, Date.now() * 0.001, isAttacking, attackPhase);

      const isTwoHanded = !!currentHeldItemInstance?.isTwoHanded;

      if (isTwoHanded) {
        // Two-handed long firearm stance (Hunting Rifle, Shotgun Cal. 12)
        if (isAttacking && attackPhase > 0) {
          // Firearm recoil kickback
          rightArmGroup.position.set(5.5, 22.2, -0.6);
          rightArmGroup.rotation.set(-Math.PI / 2.05, -0.12, 0.08);
          leftArmGroup.position.set(-4.2, 21.8, 2.8);
          leftArmGroup.rotation.set(-Math.PI / 2.25, 0.52, -0.12);
        } else {
          // Steady tactical ready aim forward
          rightArmGroup.position.set(5.5, 22.0, 0.8);
          rightArmGroup.rotation.set(-Math.PI / 2.12 + Math.sin(stride) * 0.05, -0.14, 0.08);
          leftArmGroup.position.set(-4.5, 21.5, 2.5);
          leftArmGroup.rotation.set(-Math.PI / 2.3 + Math.sin(stride) * 0.05, 0.52, -0.15);
        }
      } else {
        // One-handed weapon, consumable, material or unarmed
        if (isAttacking && attackPhase > 0) {
          const isMelee = activeItem?.category === 'weapon' && activeItem.weaponType === 'melee';
          if (isMelee) {
            // Melee swing slash arc
            const swingT = Math.sin(Math.min(1.0, attackPhase / 0.35) * Math.PI);
            rightArmGroup.position.set(6.8, 23, 2.5);
            rightArmGroup.rotation.set(-Math.PI / 2.2 + swingT * 0.35, -swingT * 0.55, swingT * 0.2);
          } else {
            // Pistol aim & recoil or punch forward
            rightArmGroup.position.set(6.8, 23, 3.2);
            rightArmGroup.rotation.set(-Math.PI / 2.18, 0, 0);
          }
        } else {
          // Natural walking / standing stride swing
          rightArmGroup.position.set(6.8, 23, 0);
          rightArmGroup.rotation.set(Math.sin(stride) * 0.25 - 0.35, 0, 0);
        }
        leftArmGroup.position.set(-6.8, 23, 0);
        leftArmGroup.rotation.set(-Math.sin(stride) * 0.25 - 0.35, 0, 0);
      }

      // First-person viewmodel bobbing & attack recoil
      if (currentCamMode === 'first_person') {
        fpRig.position.x = Math.sin(stride) * 0.08;
        fpRig.position.y = -Math.abs(Math.sin(stride)) * 0.08;
        if (isAttacking && attackPhase > 0) {
          fpRig.position.z = 0.35;
          fpRig.rotation.x = -0.14;
        } else {
          fpRig.position.z = 0;
          fpRig.rotation.x = 0;
        }
      }

      // Shockwave fade
      if (impactRingMat.opacity > 0) {
        impactRingMat.opacity -= 0.05;
        impactRing.scale.addScalar(0.04);
      } else {
        impactRing.scale.set(1, 1, 1);
      }

      // 5. Update Building Roof Transparency (Interior visibility)
      const currentBId = engine.player.currentBuildingId;
      buildingRoofs.forEach(br => {
        const isInside = currentBId === br.buildingId;
        const targetOp = isInside ? 0.0 : 0.96;
        br.material.opacity += (targetOp - br.material.opacity) * 0.15;
        br.mesh.visible = br.material.opacity > 0.05;
      });

      // 6. Update Door Rotations (Swing open / closed)
      doorMeshes.forEach(dm => {
        const d = dm.doorData;
        const targetRot = d.isOpen ? (d.width > d.height ? -Math.PI / 2.2 : Math.PI / 2.2) : 0;
        dm.mesh.rotation.y += (targetRot - dm.mesh.rotation.y) * 0.15;
      });

      // 7. Update 3D Zombies
      const currentZombieIds = new Set(engine.zombies.map(z => z.id));

      // Remove dead/despawned zombies
      for (const [id, mesh] of zombieMeshMap.entries()) {
        if (!currentZombieIds.has(id)) {
          scene.remove(mesh);
          zombieMeshMap.delete(id);
        }
      }

      // Update / Spawn active zombies
      engine.zombies.forEach(z => {
        let zMesh = zombieMeshMap.get(z.id);
        if (!zMesh) {
          zMesh = createZombie3DMesh(z);
          zombieMeshMap.set(z.id, zMesh);
        }

        zMesh.position.set(z.x, 0, z.y);
        zMesh.rotation.y = -z.angle + Math.PI / 2;

        // Limb shuffle animation
        const zStride = Date.now() * 0.007 * z.speed;
        const legL = zMesh.children[1] as THREE.Mesh;
        const legR = zMesh.children[2] as THREE.Mesh;
        if (legL && legR) {
          legL.rotation.x = Math.sin(zStride) * 0.5;
          legR.rotation.x = -Math.sin(zStride) * 0.5;
        }

        // Sway reaching arms
        const armL = zMesh.children[4] as THREE.Mesh;
        const armR = zMesh.children[5] as THREE.Mesh;
        if (armL && armR) {
          armL.rotation.z = Math.sin(zStride * 0.8) * 0.12;
          armR.rotation.z = -Math.sin(zStride * 0.8) * 0.12;
        }
      });

      // 8. Update 3D Bullets
      while (bulletMeshes.length < engine.bullets.length) {
        const bMesh = new THREE.Mesh(bulletGeo, bulletMat);
        scene.add(bMesh);
        bulletMeshes.push(bMesh);
      }
      while (bulletMeshes.length > engine.bullets.length) {
        const bMesh = bulletMeshes.pop();
        if (bMesh) scene.remove(bMesh);
      }
      engine.bullets.forEach((b, i) => {
        const bMesh = bulletMeshes[i];
        if (bMesh) {
          bMesh.position.set(b.x, 15, b.y);
          const bAngle = Math.atan2(b.vy, b.vx);
          bMesh.rotation.y = -bAngle + Math.PI / 2;
        }
      });

      // 9. Update Blood Decals (Pooled)
      const MAX_DECALS_3D = 40;
      while (bloodDecals.length < Math.min(engine.decals.length, MAX_DECALS_3D)) {
        const decalMesh = new THREE.Mesh(bloodDecalGeo, bloodDecalMat);
        decalMesh.rotation.x = -Math.PI / 2;
        scene.add(decalMesh);
        bloodDecals.push(decalMesh);
      }
      const activeCount = Math.min(engine.decals.length, MAX_DECALS_3D);
      const startDecalIdx = Math.max(0, engine.decals.length - activeCount);
      for (let i = 0; i < activeCount; i++) {
        const d = engine.decals[startDecalIdx + i];
        const dm = bloodDecals[i];
        if (d && dm) {
          dm.position.set(d.x, 0.06, d.y);
          dm.visible = true;
        }
      }
      for (let i = activeCount; i < bloodDecals.length; i++) {
        bloodDecals[i].visible = false;
      }

      // Update Containers 3D visual state (open lid/door when searched)
      containerInstances.forEach(ci => {
        ci.updateState(ci.containerData.searched);
      });

      // 10. Update Placed Structures
      const currentStructIds = new Set(engine.placedStructures.map(s => s.id));
      for (const [id, inst] of structureInstanceMap.entries()) {
        if (!currentStructIds.has(id)) {
          scene.remove(inst.mesh);
          structureInstanceMap.delete(id);
        }
      }
      engine.placedStructures.forEach(st => {
        let inst = structureInstanceMap.get(st.id);
        if (!inst) {
          inst = createDetailedStructure3D(st);
          scene.add(inst.mesh);
          structureInstanceMap.set(st.id, inst);
        }
        inst.updateState?.(dt / 1000, Date.now() * 0.001);
      });

      // 11. Update Raiders
      const currentRaiderIds = new Set(engine.raiders.map(r => r.id));
      for (const [id, mesh] of raiderMeshMap.entries()) {
        if (!currentRaiderIds.has(id)) {
          scene.remove(mesh);
          raiderMeshMap.delete(id);
        }
      }
      engine.raiders.forEach(r => {
        let rMesh = raiderMeshMap.get(r.id);
        if (!rMesh) {
          rMesh = createRaider3DMesh(r);
          raiderMeshMap.set(r.id, rMesh);
        }
        rMesh.position.set(r.x, 0, r.y);
        rMesh.rotation.y = -r.angle + Math.PI / 2;
      });

      // 12. Ghost build structure preview
      const activeBuild = selectedBuildTypeRef.current;
      if (activeBuild) {
        ghostMesh.visible = true;
        ghostMesh.position.set(mouseWorldPos.current.x, 8, mouseWorldPos.current.z);
        if (activeBuild.startsWith('barricade')) {
          ghostMesh.scale.set(1.2, 1.0, 0.3);
        } else if (activeBuild === 'spike_trap') {
          ghostMesh.scale.set(0.9, 0.2, 0.9);
        } else if (activeBuild === 'campfire') {
          ghostMesh.scale.set(0.8, 0.5, 0.8);
        } else if (activeBuild === 'rain_collector') {
          ghostMesh.scale.set(0.7, 1.2, 0.7);
        } else if (activeBuild === 'spotlight') {
          ghostMesh.scale.set(0.5, 1.5, 0.5);
        } else {
          ghostMesh.scale.set(1, 1, 1);
        }
      } else {
        ghostMesh.visible = false;
      }

      // 10. Update Nearby UI Interaction Prompt (throttled to state changes)
      let foundPrompt: { text: string; icon: string; x: number; y: number } | null = null;

      // Nearby Doors
      for (const b of engine.buildings) {
        for (const d of b.doors) {
          const dMidX = d.x + d.width / 2;
          const dMidY = d.y + d.height / 2;
          if (Math.hypot(px - dMidX, pz - dMidY) < 65) {
            foundPrompt = {
              text: d.isOpen ? 'Pressione [E] para Fechar Porta' : 'Pressione [E] para Abrir Porta',
              icon: '🚪',
              x: dMidX,
              y: dMidY,
            };
            break;
          }
        }
        if (foundPrompt) break;
      }

      // Nearby Containers
      if (!foundPrompt) {
        const nearC = getNearbyContainer();
        if (nearC) {
          foundPrompt = {
            text: `[E] Saquear ${nearC.name}`,
            icon: '📦',
            x: nearC.x + nearC.width / 2,
            y: nearC.y + nearC.height / 2,
          };
        }
      }

      const promptKey = foundPrompt ? `${foundPrompt.text}_${foundPrompt.x}_${foundPrompt.y}` : null;
      if (promptKey !== lastPromptKeyRef.current) {
        lastPromptKeyRef.current = promptKey;
        setNearbyPrompt(foundPrompt);
      }

      // Render Three.js Scene
      renderer.render(scene, camera);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('wheel', handleWheel);
      container.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [engine]);

  return (
    <div id="game-canvas-3d-wrapper" className="relative w-full h-full overflow-hidden select-none">
      {/* Three.js Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-crosshair" />

      {/* Mira Reticular Central para Modo 1ª Pessoa (FPS) */}
      {cameraMode === 'first_person' && (
        <div className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center">
          <div className="relative w-7 h-7 flex items-center justify-center">
            {/* Ponto central brilhante */}
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
            {/* Linhas da mira */}
            <div className="absolute w-5 h-0.5 bg-amber-400/70 rounded-full" />
            <div className="absolute w-0.5 h-5 bg-amber-400/70 rounded-full" />
            {/* Indicador de 1ª pessoa discreto */}
            <div className="absolute top-8 whitespace-nowrap px-2 py-0.5 rounded-full bg-slate-950/80 border border-amber-500/40 text-[9px] font-semibold text-amber-300 backdrop-blur-sm shadow-md">
              Segure o Botão Direito para Girar a Visão
            </div>
          </div>
        </div>
      )}

      {/* Floating 3D Interaction Prompt */}
      {nearbyPrompt && (
        <div
          id="nearby-interaction-prompt"
          className="fixed top-28 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/95 border border-amber-500/80 text-amber-200 text-xs font-bold shadow-2xl backdrop-blur-md animate-bounce"
        >
          <span className="text-base">{nearbyPrompt.icon}</span>
          <span>{nearbyPrompt.text}</span>
        </div>
      )}

      {/* 3D Combat & Camera Controls HUD Badge or Toggle Button */}
      {!showHudInfo ? (
        <button
          id="btn-show-3d-hud"
          onClick={() => setShowHudInfo(true)}
          className="fixed top-4 left-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/85 hover:bg-slate-900 border border-slate-700/80 hover:border-amber-500/60 text-amber-300 font-semibold text-xs shadow-xl backdrop-blur-md transition-all cursor-pointer"
          title="Exibir informações e controles do Modo 3D"
        >
          <span>🎮</span>
          <span>Mostrar Informações 3D</span>
        </button>
      ) : (
        <div
          id="hud-3d-controls"
          className="fixed top-4 left-4 z-20 flex flex-col gap-2 p-3 rounded-2xl bg-slate-950/90 border border-slate-800 text-[11px] text-slate-300 shadow-2xl backdrop-blur-md max-w-sm"
        >
          <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 pb-2">
            <span className="font-bold text-amber-400 flex items-center gap-1.5">
              <span>🎮</span> MODO 3D ATIVADO
            </span>
            <div className="flex items-center gap-1.5">
              {/* Botão para ocultar/mostrar a opção de mudar de câmera */}
              <button
                id="btn-toggle-camera-option"
                onClick={() => setShowCameraOption(prev => !prev)}
                className="px-2 py-0.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white font-medium text-[10px] transition-all cursor-pointer flex items-center gap-1"
                title={showCameraOption ? "Ocultar opção de mudar de câmera" : "Mostrar opção de mudar de câmera"}
              >
                <span>📹</span>
                <span>{showCameraOption ? "Ocultar Câmera" : "Mostrar Câmera"}</span>
              </button>

              {/* Botão para ocultar todas as informações do modo 3D */}
              <button
                id="btn-hide-3d-hud"
                onClick={() => setShowHudInfo(false)}
                className="px-2 py-0.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 text-red-300 hover:text-red-200 font-semibold text-[10px] transition-all cursor-pointer flex items-center gap-1"
                title="Ocultar informações do modo 3D"
              >
                <span>✕</span>
                <span>Ocultar</span>
              </button>
            </div>
          </div>

          {/* Botão de mudar de câmera (visível se showCameraOption for true) */}
          {showCameraOption && (
            <div className="flex items-center justify-between gap-2 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <span className="text-amber-200/90 text-[10px] font-medium">Modo da Câmera:</span>
              <button
                id="btn-switch-camera-mode"
                onClick={() => setCameraMode(m => {
                  if (m === 'isometric') return 'action';
                  if (m === 'action') return 'first_person';
                  if (m === 'first_person') return 'tactical';
                  return 'isometric';
                })}
                className="px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-semibold text-[10px] transition-all cursor-pointer"
              >
                [V] {
                  cameraMode === 'isometric' ? 'Isométrica 3D' :
                  cameraMode === 'action' ? 'Ação (3ª Pessoa)' :
                  cameraMode === 'first_person' ? '1ª Pessoa (FPS)' :
                  'Tática (Aérea)'
                }
              </button>
            </div>
          )}

          <div className="flex flex-col gap-1.5 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-blue-500/30 text-blue-300 font-bold whitespace-nowrap">Botão Direito (Segurar)</span>
              <span className="text-amber-200 font-semibold">🔄 Mover / Girar a Câmera 3D</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-indigo-500/25 text-indigo-300 font-bold whitespace-nowrap">Botão Esquerdo / Espaço</span>
              <span className="text-white font-medium">⚔️ Atacar (Atirar / Golpear) ou Construir</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold whitespace-nowrap">W, A, S, D</span>
              <span className="text-slate-200">Andar pela visão (W: Frente | S: Ré | A: Esq. | D: Dir.)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold whitespace-nowrap">Tecla F</span>
              <span className="text-slate-300">👊 Soco / Empurrão Rápido</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold whitespace-nowrap">Scroll Mouse</span>
              <span>Zoom da Câmera</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold whitespace-nowrap">T ou L</span>
              <span>Ligar / Desligar Lanterna 3D</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
