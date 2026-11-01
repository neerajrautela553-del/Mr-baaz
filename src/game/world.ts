import * as THREE from 'three';
import { Landmark } from './types';

// Math helpers
export function getTerrainHeight(x: number, z: number): number {
  // Safe zone for village center
  const distFromCenter = Math.hypot(x, z);
  const villageFactor = Math.min(1, Math.max(0, (distFromCenter - 25) / 50));

  // River gorge running north-south around x = -65
  let riverBed = 0;
  if (x > -85 && x < -45 && z > -70 && z < 140) {
    const rx = (x + 65) / 20; // -1 to 1
    riverBed = Math.max(0, 1 - rx * rx) * -7.5;
  }

  // Rolling Himalayan topography
  const wave1 = Math.sin(x * 0.02) * Math.cos(z * 0.02) * 6;
  const wave2 = Math.sin(x * 0.045 + 1.2) * Math.sin(z * 0.035) * 3.5;
  const hillSlope = (-z * 0.08) + (x * 0.04); // Rises northward towards snowy peaks

  // Summit peak for Mandir around (35, -110)
  const distToMandir = Math.hypot(x - 35, z + 110);
  const mandirPeak = Math.max(0, (50 - distToMandir) * 0.42);

  const rawH = (wave1 + wave2 + hillSlope + mandirPeak) * villageFactor + riverBed;
  return Math.max(-5, rawH);
}

// Procedural materials helper
export function createPahadiMaterials() {
  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x5a3d28,
    roughness: 0.85,
    metalness: 0.05,
  });
  const darkWoodMat = new THREE.MeshStandardMaterial({
    color: 0x3d2719,
    roughness: 0.9,
    metalness: 0.02,
  });
  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x7c7e7d,
    roughness: 0.95,
    metalness: 0.02,
  });
  const slateRoofMat = new THREE.MeshStandardMaterial({
    color: 0x47494e, // Himalayan slate stone tile roof
    roughness: 0.7,
    metalness: 0.15,
  });
  const templeGoldMat = new THREE.MeshStandardMaterial({
    color: 0xe5a93b,
    roughness: 0.3,
    metalness: 0.8,
  });
  const roadMat = new THREE.MeshStandardMaterial({
    color: 0x38393b,
    roughness: 0.92,
    metalness: 0.05,
  });
  const roadLineMat = new THREE.MeshStandardMaterial({
    color: 0xf3d250,
    roughness: 0.5,
  });
  const pineMat1 = new THREE.MeshStandardMaterial({
    color: 0x1e4827,
    roughness: 0.8,
  });
  const pineMat2 = new THREE.MeshStandardMaterial({
    color: 0x2b5e34,
    roughness: 0.85,
  });
  const buranshMat = new THREE.MeshStandardMaterial({
    color: 0xb91c1c, // Vibrant Rhododendron crimson
    roughness: 0.6,
  });
  const snowMat = new THREE.MeshStandardMaterial({
    color: 0xf5f7fa,
    roughness: 0.4,
    metalness: 0.1,
  });
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x3882a5,
    roughness: 0.15,
    metalness: 0.2,
    transparent: true,
    opacity: 0.82,
  });
  const creamWallMat = new THREE.MeshStandardMaterial({
    color: 0xd9cbb2,
    roughness: 0.9,
  });
  const flagMat = new THREE.MeshStandardMaterial({
    color: 0xe65100, // Sacred Bhagwa saffron
    roughness: 0.6,
  });

  return {
    woodMat,
    darkWoodMat,
    stoneMat,
    slateRoofMat,
    templeGoldMat,
    roadMat,
    roadLineMat,
    pineMat1,
    pineMat2,
    buranshMat,
    snowMat,
    waterMat,
    creamWallMat,
    flagMat,
  };
}

export function buildPahadiHouse(
  x: number,
  z: number,
  scale = 1,
  rotationY = 0,
  mats: ReturnType<typeof createPahadiMaterials>
): THREE.Group {
  const y = getTerrainHeight(x, z);
  const house = new THREE.Group();
  house.position.set(x, y, z);
  house.rotation.y = rotationY;
  house.scale.setScalar(scale);

  // 1. Plinth / Stone foundation
  const plinth = new THREE.Mesh(
    new THREE.BoxGeometry(8.2, 0.6, 6.4),
    mats.stoneMat
  );
  plinth.position.y = 0.3;
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  house.add(plinth);

  // 2. Ground floor (traditional stone & wood masonry)
  const groundFloor = new THREE.Mesh(
    new THREE.BoxGeometry(7.6, 2.4, 5.8),
    mats.creamWallMat
  );
  groundFloor.position.y = 0.6 + 1.2;
  groundFloor.castShadow = true;
  groundFloor.receiveShadow = true;
  house.add(groundFloor);

  // 3. Wooden corner pillars and horizontal beams (Kothi-bana earthquake-resistant Pahadi architecture)
  const pillarGeo = new THREE.BoxGeometry(0.35, 2.5, 0.35);
  [
    [-3.8, 0, -2.9],
    [3.8, 0, -2.9],
    [-3.8, 0, 2.9],
    [3.8, 0, 2.9],
  ].forEach(([px, , pz]) => {
    const pillar = new THREE.Mesh(pillarGeo, mats.woodMat);
    pillar.position.set(px, 1.85, pz);
    pillar.castShadow = true;
    house.add(pillar);
  });

  // 4. Traditional upper balcony / Chhajja (carved overhang)
  const balconyFloor = new THREE.Mesh(
    new THREE.BoxGeometry(8.4, 0.25, 6.6),
    mats.darkWoodMat
  );
  balconyFloor.position.y = 3.1;
  balconyFloor.castShadow = true;
  house.add(balconyFloor);

  // 5. Second floor
  const topFloor = new THREE.Mesh(
    new THREE.BoxGeometry(7.2, 2.2, 5.4),
    mats.woodMat
  );
  topFloor.position.y = 4.3;
  topFloor.castShadow = true;
  topFloor.receiveShadow = true;
  house.add(topFloor);

  // 6. Carved balcony railing on front
  const railing = new THREE.Mesh(
    new THREE.BoxGeometry(8.2, 0.8, 0.1),
    mats.darkWoodMat
  );
  railing.position.set(0, 3.6, 3.25);
  railing.castShadow = true;
  house.add(railing);

  // 7. Traditional sloped slate roof (2-tiered pitched roof)
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(6.2, 2.6, 4),
    mats.slateRoofMat
  );
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(1.15, 0.85, 0.95);
  roof.position.y = 6.4;
  roof.castShadow = true;
  house.add(roof);

  // 8. Stone chimney with subtle tilt
  const chimney = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 1.5, 0.7),
    mats.stoneMat
  );
  chimney.position.set(2.2, 6.7, -1.2);
  chimney.castShadow = true;
  house.add(chimney);

  // 9. Front door and windows
  const door = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 1.9, 0.1),
    mats.darkWoodMat
  );
  door.position.set(0, 1.55, 2.92);
  door.castShadow = true;
  house.add(door);

  const winGeo = new THREE.BoxGeometry(0.9, 0.9, 0.08);
  [-2.2, 2.2].forEach((wx) => {
    const win = new THREE.Mesh(winGeo, mats.darkWoodMat);
    win.position.set(wx, 1.8, 2.92);
    house.add(win);
  });

  return house;
}

export function buildSummitMandir(
  x: number,
  z: number,
  mats: ReturnType<typeof createPahadiMaterials>
): { group: THREE.Group; bell: THREE.Mesh } {
  const y = getTerrainHeight(x, z);
  const mandir = new THREE.Group();
  mandir.position.set(x, y, z);

  // 1. Terraced stone plinth with steps
  const plinth1 = new THREE.Mesh(
    new THREE.BoxGeometry(14, 0.8, 14),
    mats.stoneMat
  );
  plinth1.position.y = 0.4;
  plinth1.castShadow = true;
  plinth1.receiveShadow = true;
  mandir.add(plinth1);

  const plinth2 = new THREE.Mesh(
    new THREE.BoxGeometry(11, 0.8, 11),
    mats.stoneMat
  );
  plinth2.position.y = 1.2;
  plinth2.castShadow = true;
  plinth2.receiveShadow = true;
  mandir.add(plinth2);

  // 2. Temple Garbhagriha (Main sanctum)
  const sanctum = new THREE.Mesh(
    new THREE.BoxGeometry(7, 4.5, 7),
    mats.stoneMat
  );
  sanctum.position.y = 3.85;
  sanctum.castShadow = true;
  sanctum.receiveShadow = true;
  mandir.add(sanctum);

  // 3. Wooden carved pillars in front (Mandapa)
  const pGeo = new THREE.CylinderGeometry(0.28, 0.28, 4.2, 12);
  [
    [-3.8, 0, 4.8],
    [-1.3, 0, 4.8],
    [1.3, 0, 4.8],
    [3.8, 0, 4.8],
  ].forEach(([px, , pz]) => {
    const p = new THREE.Mesh(pGeo, mats.woodMat);
    p.position.set(px, 3.7, pz);
    p.castShadow = true;
    mandir.add(p);
  });

  // 4. Tiered Pagoda / Shikara Roof
  const roofTier1 = new THREE.Mesh(
    new THREE.ConeGeometry(6.8, 2.2, 4),
    mats.slateRoofMat
  );
  roofTier1.rotation.y = Math.PI / 4;
  roofTier1.position.y = 6.9;
  roofTier1.castShadow = true;
  mandir.add(roofTier1);

  const roofTier2 = new THREE.Mesh(
    new THREE.ConeGeometry(5.0, 2.0, 4),
    mats.slateRoofMat
  );
  roofTier2.rotation.y = Math.PI / 4;
  roofTier2.position.y = 8.5;
  roofTier2.castShadow = true;
  mandir.add(roofTier2);

  const roofTier3 = new THREE.Mesh(
    new THREE.ConeGeometry(3.2, 2.2, 4),
    mats.slateRoofMat
  );
  roofTier3.rotation.y = Math.PI / 4;
  roofTier3.position.y = 10.2;
  roofTier3.castShadow = true;
  mandir.add(roofTier3);

  // 5. Golden Kalash / Pinnacle (Uttarakhand Shikhara crest)
  const kalashBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.6, 0.8, 0.8, 12),
    mats.templeGoldMat
  );
  kalashBase.position.y = 11.6;
  kalashBase.castShadow = true;
  mandir.add(kalashBase);

  const kalashTop = new THREE.Mesh(
    new THREE.ConeGeometry(0.45, 1.2, 12),
    mats.templeGoldMat
  );
  kalashTop.position.y = 12.5;
  kalashTop.castShadow = true;
  mandir.add(kalashTop);

  // 6. Sacred fluttering red/orange Dhwaja (Flag)
  const flagPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 3.2, 8),
    mats.templeGoldMat
  );
  flagPole.position.set(0, 13.5, 0);
  mandir.add(flagPole);

  const flag = new THREE.Mesh(
    new THREE.ConeGeometry(0.7, 1.4, 3),
    mats.flagMat
  );
  flag.rotation.z = Math.PI / 2;
  flag.rotation.y = Math.PI / 2;
  flag.position.set(0.6, 14.2, 0);
  mandir.add(flag);

  // 7. Hanging Brass Bell (Interactive Mandir Ghanti)
  const bellFrame = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 0.15, 0.2),
    mats.darkWoodMat
  );
  bellFrame.position.set(0, 4.4, 4.8);
  mandir.add(bellFrame);

  const bell = new THREE.Mesh(
    new THREE.ConeGeometry(0.42, 0.65, 14),
    mats.templeGoldMat
  );
  bell.rotation.x = Math.PI;
  bell.position.set(0, 3.8, 4.8);
  bell.castShadow = true;
  mandir.add(bell);

  // Warm diya sanctuary light
  const diyaLight = new THREE.PointLight(0xffa726, 1.8, 15);
  diyaLight.position.set(0, 2.6, 3.2);
  mandir.add(diyaLight);

  return { group: mandir, bell };
}

export function buildChaiTapri(
  x: number,
  z: number,
  mats: ReturnType<typeof createPahadiMaterials>
): THREE.Group {
  const y = getTerrainHeight(x, z);
  const tapri = new THREE.Group();
  tapri.position.set(x, y, z);

  // Wooden platform
  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(6.5, 0.25, 5),
    mats.woodMat
  );
  deck.position.y = 0.12;
  deck.receiveShadow = true;
  tapri.add(deck);

  // Wooden shelter posts
  const postGeo = new THREE.CylinderGeometry(0.12, 0.12, 2.6, 8);
  [
    [-2.8, 0, -2.1],
    [2.8, 0, -2.1],
    [-2.8, 0, 2.1],
    [2.8, 0, 2.1],
  ].forEach(([px, , pz]) => {
    const post = new THREE.Mesh(postGeo, mats.woodMat);
    post.position.set(px, 1.3, pz);
    post.castShadow = true;
    tapri.add(post);
  });

  // Slanted tin/corrugated sheet roof
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(7, 0.1, 5.6),
    mats.slateRoofMat
  );
  roof.position.set(0, 2.7, 0);
  roof.rotation.x = -0.12;
  roof.castShadow = true;
  tapri.add(roof);

  // Chai counter table
  const counter = new THREE.Mesh(
    new THREE.BoxGeometry(3.8, 1.0, 1.1),
    mats.darkWoodMat
  );
  counter.position.set(0, 0.6, -0.6);
  counter.castShadow = true;
  tapri.add(counter);

  // Steaming brass / aluminum Chai kettle
  const kettle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.28, 0.45, 12),
    mats.templeGoldMat
  );
  kettle.position.set(-0.8, 1.32, -0.6);
  kettle.castShadow = true;
  tapri.add(kettle);

  // Pahadi chai glasses in wire stand
  for (let i = 0; i < 4; i++) {
    const glass = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.06, 0.18, 8),
      mats.templeGoldMat
    );
    glass.position.set(0.2 + i * 0.22, 1.18, -0.6);
    tapri.add(glass);
  }

  // Benches for travelers
  const benchGeo = new THREE.BoxGeometry(3.5, 0.45, 0.6);
  const bench1 = new THREE.Mesh(benchGeo, mats.woodMat);
  bench1.position.set(0, 0.35, 1.6);
  bench1.castShadow = true;
  tapri.add(bench1);

  // Chai stall signboard
  const signBoard = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 0.6, 0.08),
    mats.woodMat
  );
  signBoard.position.set(0, 2.35, 2.2);
  tapri.add(signBoard);

  return tapri;
}

export function buildPineTree(
  x: number,
  z: number,
  scale = 1,
  mats: ReturnType<typeof createPahadiMaterials>
): THREE.Group {
  const y = getTerrainHeight(x, z);
  const tree = new THREE.Group();
  tree.position.set(x, y, z);
  tree.scale.setScalar(scale);

  // Trunk
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.38, 2.5, 8),
    mats.darkWoodMat
  );
  trunk.position.y = 1.25;
  trunk.castShadow = true;
  tree.add(trunk);

  // 4 Tiers of dense Himalayan pine needles
  const tiers = [
    { r: 2.1, h: 2.4, y: 2.4, mat: mats.pineMat1 },
    { r: 1.7, h: 2.2, y: 3.5, mat: mats.pineMat2 },
    { r: 1.3, h: 2.0, y: 4.6, mat: mats.pineMat1 },
    { r: 0.85, h: 1.8, y: 5.6, mat: mats.pineMat2 },
  ];

  tiers.forEach((t) => {
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(t.r, t.h, 7),
      t.mat
    );
    cone.position.y = t.y;
    cone.castShadow = true;
    tree.add(cone);
  });

  return tree;
}

export function buildBuranshBush(
  x: number,
  z: number,
  mats: ReturnType<typeof createPahadiMaterials>
): THREE.Group {
  const y = getTerrainHeight(x, z);
  const bush = new THREE.Group();
  bush.position.set(x, y, z);

  const foliage = new THREE.Mesh(
    new THREE.DodecahedronGeometry(1.2, 1),
    mats.pineMat2
  );
  foliage.position.y = 0.9;
  foliage.castShadow = true;
  bush.add(foliage);

  // Crimson flower clusters
  for (let i = 0; i < 7; i++) {
    const ang = (i / 7) * Math.PI * 2;
    const flw = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 6, 6),
      mats.buranshMat
    );
    flw.position.set(
      Math.cos(ang) * 0.85,
      0.9 + (i % 3) * 0.25,
      Math.sin(ang) * 0.85
    );
    bush.add(flw);
  }

  return bush;
}

// Himalayan Mountain Sheep / Goat (Cute low-poly)
export function buildPahadiGoat(
  x: number,
  z: number,
  mats: ReturnType<typeof createPahadiMaterials>
): { group: THREE.Group; head: THREE.Group } {
  const y = getTerrainHeight(x, z);
  const goat = new THREE.Group();
  goat.position.set(x, y, z);

  const fleeceMat = new THREE.MeshStandardMaterial({
    color: 0xedebe4,
    roughness: 0.9,
  });
  const hornMat = new THREE.MeshStandardMaterial({
    color: 0x5a483a,
    roughness: 0.6,
  });

  // Body
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.75, 1.4),
    fleeceMat
  );
  body.position.y = 0.75;
  body.castShadow = true;
  goat.add(body);

  // 4 Legs
  const legGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 6);
  [
    [-0.32, 0.3, -0.45],
    [0.32, 0.3, -0.45],
    [-0.32, 0.3, 0.45],
    [0.32, 0.3, 0.45],
  ].forEach(([lx, ly, lz]) => {
    const leg = new THREE.Mesh(legGeo, mats.darkWoodMat);
    leg.position.set(lx, ly, lz);
    leg.castShadow = true;
    goat.add(leg);
  });

  // Head group (can animate nodding/grazing)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.15, 0.75);

  const headMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.42, 0.55),
    fleeceMat
  );
  headGroup.add(headMesh);

  // Curved horns
  [-0.18, 0.18].forEach((hx) => {
    const horn = new THREE.Mesh(
      new THREE.ConeGeometry(0.07, 0.4, 5),
      hornMat
    );
    horn.rotation.x = -0.5;
    horn.rotation.z = hx > 0 ? 0.4 : -0.4;
    horn.position.set(hx, 0.28, -0.05);
    headGroup.add(horn);
  });

  goat.add(headGroup);
  return { group: goat, head: headGroup };
}

// Suspension Bridge over mountain river gorge
export function buildSuspensionBridge(
  mats: ReturnType<typeof createPahadiMaterials>
): THREE.Group {
  const bridge = new THREE.Group();
  const y = getTerrainHeight(-65, 20) + 5.5;
  bridge.position.set(-65, y, 20);

  // Twin support stone pillars at both banks
  const towerGeo = new THREE.BoxGeometry(1.6, 8.5, 1.6);
  [-16, 16].forEach((tz) => {
    [-2.2, 2.2].forEach((tx) => {
      const tower = new THREE.Mesh(towerGeo, mats.stoneMat);
      tower.position.set(tx, 0, tz);
      tower.castShadow = true;
      bridge.add(tower);
    });

    const crossBeam = new THREE.Mesh(
      new THREE.BoxGeometry(5.4, 0.5, 0.8),
      mats.darkWoodMat
    );
    crossBeam.position.set(0, 3.8, tz);
    bridge.add(crossBeam);
  });

  // Walkway planks
  const plankGeo = new THREE.BoxGeometry(3.6, 0.18, 0.6);
  for (let z = -15; z <= 15; z += 0.75) {
    // Sag in middle
    const sag = Math.cos((z / 15) * (Math.PI / 2)) * -0.6;
    const plank = new THREE.Mesh(plankGeo, mats.woodMat);
    plank.position.set(0, sag - 0.8, z);
    plank.castShadow = true;
    bridge.add(plank);
  }

  return bridge;
}

// Uttarakhand Road Milestones (KM Stone)
export function buildMilestone(
  x: number,
  z: number,
  headingAngle: number,
  titleHi: string,
  km: number,
  mats: ReturnType<typeof createPahadiMaterials>
): THREE.Group {
  const y = getTerrainHeight(x, z);
  const stone = new THREE.Group();
  stone.position.set(x, y, z);
  stone.rotation.y = headingAngle;

  // White base
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(0.75, 1.1, 0.45),
    mats.creamWallMat
  );
  base.position.y = 0.55;
  base.castShadow = true;
  stone.add(base);

  // Yellow rounded dome top (State Highway Uttarakhand style)
  const dome = new THREE.Mesh(
    new THREE.CylinderGeometry(0.36, 0.36, 0.45, 12, 1, false, 0, Math.PI),
    mats.roadLineMat
  );
  dome.rotation.z = Math.PI / 2;
  dome.position.set(0, 1.1, 0);
  dome.castShadow = true;
  stone.add(dome);

  return stone;
}

// Landmarks register
export const WORLD_LANDMARKS: Landmark[] = [
  {
    id: 'mandir',
    nameHi: 'शिखर मंदिर (Mandir)',
    nameEn: 'Summit Himalayan Temple',
    pos: [35, 24, -110],
    type: 'temple',
  },
  {
    id: 'chai_tapri',
    nameHi: 'पहाड़ी चाय टपरी',
    nameEn: 'Pahadi Tea Stall',
    pos: [-8, 0.5, 18],
    type: 'chai',
  },
  {
    id: 'bridge',
    nameHi: 'झूला पुल (Suspension Bridge)',
    nameEn: 'Jhula River Bridge',
    pos: [-65, 3.5, 20],
    type: 'bridge',
  },
  {
    id: 'viewpoint',
    nameHi: 'त्रिशूल व्यू पॉइंट',
    nameEn: 'Trishul Peak Viewpoint',
    pos: [80, 15, -45],
    type: 'viewpoint',
  },
  {
    id: 'orchard',
    nameHi: 'सेब का बागीचा',
    nameEn: 'Apple Orchard',
    pos: [-25, 4, -40],
    type: 'orchard',
  },
  {
    id: 'village_square',
    nameHi: 'गांव का चौक',
    nameEn: 'Village Square',
    pos: [0, 0, 0],
    type: 'village',
  },
];
