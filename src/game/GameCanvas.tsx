import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  getTerrainHeight,
  createPahadiMaterials,
  buildPahadiHouse,
  buildSummitMandir,
  buildChaiTapri,
  buildPineTree,
  buildBuranshBush,
  buildPahadiGoat,
  buildSuspensionBridge,
  buildMilestone,
  WORLD_LANDMARKS,
} from './world';
import { PahadiJeep } from './vehicle';
import { PahadiPlayer } from './player';
import { soundEngine } from './audio';
import { ControlMode, CameraMode, TimeOfDay, Quest, GameStats } from './types';
import { INITIAL_QUESTS } from './quests';

// Module-scope reusable math vectors (Zero GC allocation in tick)
const _cameraDesired = new THREE.Vector3();
const _targetLook = new THREE.Vector3();
const _tempPos = new THREE.Vector3();

interface GameCanvasProps {
  controlMode: ControlMode;
  cameraMode: CameraMode;
  timeOfDay: TimeOfDay;
  isRadioOn: boolean;
  isMuted: boolean;
  activeQuestId: string | null;
  onStatsUpdate: (stats: GameStats) => void;
  onShowMessage: (text: string) => void;
  onModeChange: (mode: ControlMode) => void;
  onQuestCompleted: (questId: string, reward: number) => void;
  // Mobile virtual joystick and action inputs passed from UI
  joystickInput: { x: number; y: number };
  keyboardInputRef: React.MutableRefObject<{
    forward: number;
    turn: number;
    jump: boolean;
    sprint: boolean;
    handbrake: boolean;
    horn: boolean;
  }>;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  controlMode,
  cameraMode,
  timeOfDay,
  isRadioOn,
  isMuted,
  activeQuestId,
  onStatsUpdate,
  onShowMessage,
  onModeChange,
  onQuestCompleted,
  joystickInput,
  keyboardInputRef,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // References to keep game instances between React renders without re-mounting canvas
  const jeepRef = useRef<PahadiJeep | null>(null);
  const playerRef = useRef<PahadiPlayer | null>(null);
  const bellMeshRef = useRef<THREE.Mesh | null>(null);
  const goatsRef = useRef<{ group: THREE.Group; head: THREE.Group }[]>([]);
  const questsRef = useRef<Quest[]>(INITIAL_QUESTS);
  const statsRef = useRef<GameStats>({
    score: 0,
    completedQuests: 0,
    totalQuests: INITIAL_QUESTS.length,
    distanceTraveledKm: 0,
    speedKmh: 0,
    activeQuestId: INITIAL_QUESTS[0].id,
  });

  const controlModeRef = useRef(controlMode);
  controlModeRef.current = controlMode;
  const cameraModeRef = useRef(cameraMode);
  cameraModeRef.current = cameraMode;
  const timeOfDayRef = useRef(timeOfDay);
  timeOfDayRef.current = timeOfDay;

  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const starsRef = useRef<THREE.Points | null>(null);

  // Trigger horn
  const handleHorn = useCallback(() => {
    soundEngine.playHorn();
  }, []);

  // Enter/Exit Vehicle logic
  const handleToggleDrive = useCallback(() => {
    const player = playerRef.current;
    const jeep = jeepRef.current;
    if (!player || !jeep) return;

    if (controlModeRef.current === 'WALK') {
      const dist = player.group.position.distanceTo(jeep.group.position);
      if (dist < 6.5) {
        onModeChange('DRIVE');
        player.group.visible = false;
        soundEngine.startEngine();
        onShowMessage('Gaadi mein baith gaye! 🚙 (Press E / Tap DRIVE to exit)');
      } else {
        onShowMessage('Gaadi ke paas jao (Get closer to Jeep to drive)');
      }
    } else {
      // Exit jeep
      onModeChange('WALK');
      soundEngine.stopEngine();
      player.group.position.copy(jeep.group.position);
      // Offset to driver side
      player.group.position.x += 2.6;
      player.group.position.y = getTerrainHeight(player.group.position.x, player.group.position.z);
      player.group.visible = true;
      onShowMessage('Gaadi se bahar aa gaye (Exited Jeep)');
    }
  }, [onModeChange, onShowMessage]);

  // Main Three.js Scene Setup (Runs once)
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL to pace rendering and scale safely
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const initialSky = 0x8ec3eb;
    scene.background = new THREE.Color(initialSky);
    scene.fog = new THREE.FogExp2(initialSky, 0.0055);

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.2,
      750
    );

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // Studio environment map reflection
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Lighting rig: Directional Sun + Hemisphere fill
    const hemiLight = new THREE.HemisphereLight(0xe8f4f8, 0x3d4e32, 2.2);
    scene.add(hemiLight);
    hemiLightRef.current = hemiLight;

    const sun = new THREE.DirectionalLight(0xfff5dd, 2.6);
    sun.position.set(-60, 110, 50);
    sun.castShadow = !isSoftwareGl;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near = 10;
    sun.shadow.camera.far = 320;
    const shadowD = 90;
    sun.shadow.camera.left = -shadowD;
    sun.shadow.camera.right = shadowD;
    sun.shadow.camera.top = shadowD;
    sun.shadow.camera.bottom = -shadowD;
    sun.shadow.bias = -0.0005;
    scene.add(sun);
    sunLightRef.current = sun;

    // Procedural starry night sky
    const starCount = 350;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 500;
      starPos[i * 3 + 1] = 60 + Math.random() * 220;
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 500;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.5,
      transparent: true,
      opacity: 0,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);
    starsRef.current = stars;

    // Materials Library
    const mats = createPahadiMaterials();

    // 1. Terrain Mesh
    const terrainGeo = new THREE.PlaneGeometry(450, 450, 90, 90);
    terrainGeo.rotateX(-Math.PI / 2);
    const posAttr = terrainGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      posAttr.setY(i, getTerrainHeight(x, z));
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x4f7c45, // Lush Himalayan meadow green
      roughness: 0.88,
      metalness: 0.05,
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.receiveShadow = true;
    scene.add(terrainMesh);

    // 2. Mountain River in Gorge
    const riverGeo = new THREE.PlaneGeometry(28, 220);
    riverGeo.rotateX(-Math.PI / 2);
    const riverMesh = new THREE.Mesh(riverGeo, mats.waterMat);
    riverMesh.position.set(-65, -4.6, 35);
    scene.add(riverMesh);

    // 3. Winding Mountain Road
    const roadControlPoints = [
      new THREE.Vector3(-85, getTerrainHeight(-85, 45) + 0.15, 45),
      new THREE.Vector3(-65, getTerrainHeight(-65, 30) + 0.15, 30),
      new THREE.Vector3(-35, getTerrainHeight(-35, 24) + 0.15, 24),
      new THREE.Vector3(-5, getTerrainHeight(-5, 16) + 0.15, 16),
      new THREE.Vector3(25, getTerrainHeight(25, 12) + 0.15, 12),
      new THREE.Vector3(55, getTerrainHeight(55, -8) + 0.15, -8),
      new THREE.Vector3(45, getTerrainHeight(45, -38) + 0.15, -38),
      new THREE.Vector3(20, getTerrainHeight(20, -75) + 0.15, -75),
      new THREE.Vector3(35, getTerrainHeight(35, -105) + 0.15, -105),
    ];
    const roadCurve = new THREE.CatmullRomCurve3(roadControlPoints);
    const roadMesh = new THREE.Mesh(
      new THREE.TubeGeometry(roadCurve, 120, 3.8, 8, false),
      mats.roadMat
    );
    roadMesh.receiveShadow = true;
    scene.add(roadMesh);

    // Dashed center markers along road
    for (let t = 0.02; t < 0.98; t += 0.035) {
      const p = roadCurve.getPoint(t);
      const tangent = roadCurve.getTangent(t);
      const marker = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 0.04, 1.8),
        mats.roadLineMat
      );
      marker.position.set(p.x, p.y + 0.08, p.z);
      marker.lookAt(p.clone().add(tangent));
      scene.add(marker);
    }

    // 4. Distant Snow-Capped Himalayan Summits
    const peakPositions = [
      { x: -160, z: -180, r: 42, h: 95 },
      { x: -100, z: -210, r: 52, h: 125 },
      { x: -30, z: -200, r: 48, h: 110 },
      { x: 40, z: -215, r: 58, h: 135 }, // Nanda Devi inspired
      { x: 110, z: -195, r: 50, h: 115 },
      { x: 170, z: -175, r: 45, h: 90 },
    ];
    peakPositions.forEach((peak) => {
      const peakMesh = new THREE.Mesh(
        new THREE.ConeGeometry(peak.r, peak.h, 6),
        mats.stoneMat
      );
      peakMesh.position.set(peak.x, peak.h * 0.42, peak.z);
      peakMesh.rotation.y = 0.4;
      scene.add(peakMesh);

      // Snow Cap
      const snowCap = new THREE.Mesh(
        new THREE.ConeGeometry(peak.r * 0.52, peak.h * 0.35, 6),
        mats.snowMat
      );
      snowCap.position.set(peak.x, peak.h * 0.78, peak.z);
      snowCap.rotation.y = 0.4;
      scene.add(snowCap);
    });

    // 5. Traditional Village Houses
    const houseCoords = [
      { x: -18, z: 8, scale: 1.05, rot: 0.1 },
      { x: -32, z: -12, scale: 0.95, rot: -0.3 },
      { x: 12, z: -18, scale: 1.0, rot: 0.4 },
      { x: 28, z: -24, scale: 0.9, rot: -0.15 },
      { x: -8, z: 32, scale: 0.85, rot: 0.5 },
      { x: 38, z: 2, scale: 0.95, rot: -0.5 },
    ];
    houseCoords.forEach((hc) => {
      buildPahadiHouse(hc.x, hc.z, hc.scale, hc.rot, mats);
      scene.add(buildPahadiHouse(hc.x, hc.z, hc.scale, hc.rot, mats));
    });

    // 6. Summit Temple (Mandir)
    const mandirBuild = buildSummitMandir(35, -110, mats);
    scene.add(mandirBuild.group);
    bellMeshRef.current = mandirBuild.bell;

    // 7. Village Chai Tapri
    const chaiTapri = buildChaiTapri(-8, 18, mats);
    scene.add(chaiTapri);

    // 8. Suspension Bridge over Gorge
    const bridge = buildSuspensionBridge(mats);
    scene.add(bridge);

    // 9. Road Milestones
    const milestones = [
      { x: -62, z: 28, angle: 0.6, nameHi: 'अलमोड़ा', km: 22 },
      { x: 2, z: 15, angle: -0.2, nameHi: 'नैनीताल', km: 14 },
      { x: 50, z: -15, angle: -0.8, nameHi: 'केदारनाथ', km: 86 },
    ];
    milestones.forEach((m) => {
      scene.add(buildMilestone(m.x, m.z, m.angle, m.nameHi, m.km, mats));
    });

    // 10. Himalayan Pine Trees & Rhododendron
    for (let i = 0; i < 95; i++) {
      const tx = (Math.random() - 0.5) * 320;
      const tz = (Math.random() - 0.5) * 320;
      // Leave road and village center clear
      if (Math.hypot(tx, tz) < 22 || (tx > -75 && tx < -50 && tz > -30 && tz < 50)) continue;
      const tree = buildPineTree(tx, tz, 0.7 + Math.random() * 0.7, mats);
      scene.add(tree);
    }

    // Rhododendron (Buransh) crimson bushes
    for (let i = 0; i < 35; i++) {
      const bx = (Math.random() - 0.5) * 260;
      const bz = (Math.random() - 0.5) * 260;
      if (Math.hypot(bx, bz) < 18) continue;
      scene.add(buildBuranshBush(bx, bz, mats));
    }

    // 11. Mountain Goats / Sheep
    const goatsList: { group: THREE.Group; head: THREE.Group }[] = [];
    const goatCoords = [
      { x: -22, z: -38 },
      { x: -28, z: -44 },
      { x: 22, z: -55 },
      { x: 58, z: 35 },
    ];
    goatCoords.forEach((gc) => {
      const g = buildPahadiGoat(gc.x, gc.z, mats);
      scene.add(g.group);
      goatsList.push(g);
    });
    goatsRef.current = goatsList;

    // 12. 4x4 Mountain Jeep
    const jeep = new PahadiJeep(4, 12);
    scene.add(jeep.group);
    jeepRef.current = jeep;

    // 13. Pahadi Player
    const player = new PahadiPlayer(0, 16);
    scene.add(player.group);
    playerRef.current = player;

    // Initial camera position
    camera.position.set(0, 8, 25);
    camera.lookAt(player.group.position);

    // Initial greeting
    onShowMessage('MR BAAZ 3D • देवभूमि उत्तराखंड में स्वागत है! 🏔️');

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation & Physics Loop
    let frameId = 0;
    const clock = new THREE.Clock();
    let bellSwingAngle = 0;
    let bellRinging = false;
    let lastBellTime = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    let statsTicker = 0;

    function tick() {
      const dt = Math.min(clock.getDelta(), 0.05);

      const isDrive = controlModeRef.current === 'DRIVE';
      const kInput = keyboardInputRef.current;

      // Merge keyboard + virtual joystick input
      let forward = -joystickInput.y;
      let turn = joystickInput.x;

      if (kInput.forward !== 0) forward = kInput.forward;
      if (kInput.turn !== 0) turn = kInput.turn;

      // Active actor update
      if (isDrive && jeep) {
        jeep.update(dt, forward, turn, kInput.handbrake);
      } else if (player) {
        if (kInput.jump) {
          player.jump();
          kInput.jump = false;
        }
        player.update(dt, forward, turn, kInput.sprint);
      }

      // Bell swinging animation if rang
      if (bellMeshRef.current && bellRinging) {
        bellSwingAngle = Math.sin(performance.now() * 0.015) * 0.45;
        bellMeshRef.current.rotation.z = bellSwingAngle;
      }

      // Sheep grazing animation
      goatsList.forEach((goat, idx) => {
        goat.head.rotation.x = Math.sin(performance.now() * 0.002 + idx) * 0.25;
      });

      // Camera Follow System with silky exponential damping
      const activeObj = isDrive && jeep ? jeep.group : player.group;
      _targetLook.set(
        activeObj.position.x,
        activeObj.position.y + (isDrive ? 1.6 : 1.7),
        activeObj.position.z
      );

      const camMode = cameraModeRef.current;
      let dist = 10.5;
      let height = 5.2;

      if (camMode === 'CLOSE') {
        dist = isDrive ? 6.5 : 4.5;
        height = isDrive ? 2.8 : 2.5;
      } else if (camMode === 'WIDE') {
        dist = 18;
        height = 9.5;
      } else if (camMode === 'HOOD' && isDrive) {
        dist = 0.4;
        height = 1.95;
      }

      const heading = activeObj.rotation.y;
      _cameraDesired.set(
        _targetLook.x - Math.sin(heading) * dist,
        _targetLook.y + height,
        _targetLook.z - Math.cos(heading) * dist
      );

      // Smooth camera interpolation
      camera.position.lerp(_cameraDesired, 1 - Math.pow(0.001, dt));
      camera.lookAt(_targetLook.x, _targetLook.y + 0.3, _targetLook.z);

      // Check distance to Summit Mandir Bell for automatic/manual chiming
      const actorPos = activeObj.position;
      const distToBell = Math.hypot(actorPos.x - 35, actorPos.z - (-110));
      if (distToBell < 5.5 && performance.now() - lastBellTime > 4000) {
        lastBellTime = performance.now();
        bellRinging = true;
        soundEngine.playTempleBell();
        onShowMessage('🛕 जय बद्री-केदार! पवित्र घंटी बजी (Temple Bell Rang!)');
        setTimeout(() => {
          bellRinging = false;
          if (bellMeshRef.current) bellMeshRef.current.rotation.z = 0;
        }, 3000);
      }

      // Check active quest completion
      const activeQ = questsRef.current.find((q) => !q.completed);
      if (activeQ) {
        const d = Math.hypot(actorPos.x - activeQ.targetPos[0], actorPos.z - activeQ.targetPos[2]);
        if (d < activeQ.targetRadius) {
          activeQ.completed = true;
          soundEngine.playSuccess();
          statsRef.current.score += activeQ.rewardPoints;
          statsRef.current.completedQuests += 1;
          onShowMessage(`🎉 MISSION ACCOMPLISHED: ${activeQ.titleHi} (+${activeQ.rewardPoints} pts)!`);
          onQuestCompleted(activeQ.id, activeQ.rewardPoints);
        }
      }

      // Update statistics throttled
      statsTicker += dt;
      if (statsTicker > 0.15) {
        statsTicker = 0;
        const currentSpeed = isDrive && jeep ? Math.round(Math.abs(jeep.velocity) * 3.6) : (player.isRunning ? 34 : 18);
        statsRef.current.speedKmh = currentSpeed;
        statsRef.current.distanceTraveledKm += (currentSpeed * dt) / 3600;
        onStatsUpdate({ ...statsRef.current });
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      terrainGeo.dispose();
      terrainMat.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update Time of Day (Day, Sunset, Night)
  useEffect(() => {
    const scene = sceneRef.current;
    const sun = sunLightRef.current;
    const hemi = hemiLightRef.current;
    const stars = starsRef.current;
    if (!scene || !sun || !hemi || !stars) return;

    if (timeOfDay === 'DAY') {
      const daySky = new THREE.Color(0x8ec3eb);
      scene.background = daySky;
      scene.fog = new THREE.FogExp2(0x8ec3eb, 0.0055);
      sun.color.setHex(0xfff5dd);
      sun.intensity = 2.6;
      sun.position.set(-60, 110, 50);
      hemi.color.setHex(0xe8f4f8);
      hemi.groundColor.setHex(0x3d4e32);
      hemi.intensity = 2.2;
      (stars.material as THREE.PointsMaterial).opacity = 0;
    } else if (timeOfDay === 'SUNSET') {
      const sunsetSky = new THREE.Color(0xf69c6f); // Alpenglow rose amber
      scene.background = sunsetSky;
      scene.fog = new THREE.FogExp2(0xf69c6f, 0.006);
      sun.color.setHex(0xff7043);
      sun.intensity = 2.2;
      sun.position.set(-100, 35, 30);
      hemi.color.setHex(0xffb74d);
      hemi.groundColor.setHex(0x272b22);
      hemi.intensity = 1.6;
      (stars.material as THREE.PointsMaterial).opacity = 0.3;
    } else {
      // NIGHT
      const nightSky = new THREE.Color(0x0c1424);
      scene.background = nightSky;
      scene.fog = new THREE.FogExp2(0x0c1424, 0.007);
      sun.color.setHex(0x5c6bc0);
      sun.intensity = 0.6;
      sun.position.set(-20, 80, -40);
      hemi.color.setHex(0x283593);
      hemi.groundColor.setHex(0x101518);
      hemi.intensity = 0.8;
      (stars.material as THREE.PointsMaterial).opacity = 0.95;
      // Auto turn on jeep headlights at night
      if (jeepRef.current && !jeepRef.current.lightsOn) {
        jeepRef.current.toggleLights();
      }
    }
  }, [timeOfDay]);

  // Sync mute state
  useEffect(() => {
    soundEngine.setMute(isMuted);
  }, [isMuted]);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full overflow-hidden select-none bg-slate-900"
    />
  );
};
