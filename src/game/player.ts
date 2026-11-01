import * as THREE from 'three';
import { getTerrainHeight } from './world';
import { soundEngine } from './audio';

export class PahadiPlayer {
  public group: THREE.Group;
  public yaw = 0;
  public velocityY = 0;
  public onGround = true;
  public isRunning = false;
  public stepTimer = 0;

  private legL: THREE.Mesh;
  private legR: THREE.Mesh;
  private armL: THREE.Mesh;
  private armR: THREE.Mesh;
  private headGroup: THREE.Group;

  constructor(startX = 0, startZ = 15) {
    this.group = new THREE.Group();
    const startY = getTerrainHeight(startX, startZ);
    this.group.position.set(startX, startY, startZ);

    // Materials
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xd7996f,
      roughness: 0.8,
    });
    const jacketMat = new THREE.MeshStandardMaterial({
      color: 0x1565c0, // Traditional blue Nehru jacket / Pahadi kurta
      roughness: 0.7,
    });
    const pantsMat = new THREE.MeshStandardMaterial({
      color: 0x37474f,
      roughness: 0.85,
    });
    const shoesMat = new THREE.MeshStandardMaterial({
      color: 0x212121,
      roughness: 0.9,
    });
    const topiMat = new THREE.MeshStandardMaterial({
      color: 0x4e342e, // Traditional Pahadi woolen cap
      roughness: 0.9,
    });
    const topiBandMat = new THREE.MeshStandardMaterial({
      color: 0x00897b, // Green/velvet band of Uttarakhand / Himachali cap
      roughness: 0.6,
    });

    // 1. Torso & Jacket
    const torso = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 1.1, 0.45),
      jacketMat
    );
    torso.position.y = 1.45;
    torso.castShadow = true;
    this.group.add(torso);

    // 2. Head & Pahadi Topi
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 2.3, 0);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 12, 10),
      skinMat
    );
    head.castShadow = true;
    this.headGroup.add(head);

    // Traditional round Pahadi Cap (Himachali / Garhwali / Kumaoni Topi)
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.34, 0.35, 0.28, 14),
      topiMat
    );
    cap.position.y = 0.22;
    this.headGroup.add(cap);

    // Velvet colored band with traditional flower/feather motif
    const capBand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.355, 0.355, 0.12, 14),
      topiBandMat
    );
    capBand.position.y = 0.18;
    this.headGroup.add(capBand);

    this.group.add(this.headGroup);

    // 3. Arms
    const armGeo = new THREE.BoxGeometry(0.22, 0.85, 0.24);
    this.armL = new THREE.Mesh(armGeo, jacketMat);
    this.armL.position.set(-0.56, 1.45, 0);
    this.armL.castShadow = true;
    this.group.add(this.armL);

    this.armR = new THREE.Mesh(armGeo, jacketMat);
    this.armR.position.set(0.56, 1.45, 0);
    this.armR.castShadow = true;
    this.group.add(this.armR);

    // 4. Legs & Shoes
    const legGeo = new THREE.BoxGeometry(0.28, 0.85, 0.3);
    this.legL = new THREE.Mesh(legGeo, pantsMat);
    this.legL.position.set(-0.24, 0.55, 0);
    this.legL.castShadow = true;
    this.group.add(this.legL);

    this.legR = new THREE.Mesh(legGeo, pantsMat);
    this.legR.position.set(0.24, 0.55, 0);
    this.legR.castShadow = true;
    this.group.add(this.legR);

    // Shoes
    const shoeGeo = new THREE.BoxGeometry(0.28, 0.18, 0.42);
    const shoeL = new THREE.Mesh(shoeGeo, shoesMat);
    shoeL.position.set(0, -0.42, 0.05);
    this.legL.add(shoeL);

    const shoeR = new THREE.Mesh(shoeGeo, shoesMat);
    shoeR.position.set(0, -0.42, 0.05);
    this.legR.add(shoeR);
  }

  public jump() {
    if (this.onGround) {
      this.velocityY = 7.5;
      this.onGround = false;
      soundEngine.playJump();
    }
  }

  public update(dt: number, forward: number, turn: number, sprint: boolean) {
    this.isRunning = sprint && forward > 0;
    const speed = this.isRunning ? 9.5 : 5.2;

    // Turning
    if (Math.abs(turn) > 0.05) {
      this.yaw += turn * dt * 3.0;
      this.group.rotation.y = this.yaw;
    }

    // Walking / Running movement
    const isMoving = Math.abs(forward) > 0.05;
    if (isMoving) {
      this.group.position.x += Math.sin(this.yaw) * forward * speed * dt;
      this.group.position.z += Math.cos(this.yaw) * forward * speed * dt;

      // Bound player inside map
      this.group.position.x = Math.max(-210, Math.min(210, this.group.position.x));
      this.group.position.z = Math.max(-210, Math.min(210, this.group.position.z));

      // Footstep sound cadence
      this.stepTimer += dt * (this.isRunning ? 12 : 7);
      if (this.stepTimer > Math.PI) {
        this.stepTimer = 0;
        soundEngine.playFootstep();
      }
    }

    // Limb swinging animation
    const swingFreq = this.isRunning ? 0.016 : 0.011;
    const swing = isMoving ? Math.sin(performance.now() * swingFreq) * (this.isRunning ? 0.8 : 0.5) : 0;
    this.legL.rotation.x = swing;
    this.legR.rotation.x = -swing;
    this.armL.rotation.x = -swing * 0.75;
    this.armR.rotation.x = swing * 0.75;

    // Idle breathing
    if (!isMoving && this.onGround) {
      this.headGroup.position.y = 2.3 + Math.sin(performance.now() * 0.003) * 0.02;
    }

    // Gravity & Ground snap
    const terrainY = getTerrainHeight(this.group.position.x, this.group.position.z);
    this.velocityY -= 19 * dt;
    this.group.position.y += this.velocityY * dt;

    if (this.group.position.y <= terrainY) {
      this.group.position.y = terrainY;
      this.velocityY = 0;
      this.onGround = true;
    }
  }
}
