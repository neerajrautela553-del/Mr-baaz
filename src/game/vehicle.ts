import * as THREE from 'three';
import { getTerrainHeight } from './world';
import { soundEngine } from './audio';

export class PahadiJeep {
  public group: THREE.Group;
  public wheels: THREE.Mesh[] = [];
  public frontWheelsGroup: THREE.Group[] = [];
  public headLights: THREE.SpotLight[] = [];
  public headLightMeshes: THREE.Mesh[] = [];
  public tailLights: THREE.Mesh[] = [];
  public lightsOn = false;

  public velocity = 0;
  public steerAngle = 0;
  public engineRPM = 0;
  public isBraking = false;
  public isReversing = false;

  private bodyMesh: THREE.Mesh;
  private brakeMat: THREE.MeshStandardMaterial;
  private brakeActiveMat: THREE.MeshStandardMaterial;

  constructor(startX = 6, startZ = 12) {
    this.group = new THREE.Group();
    const startY = getTerrainHeight(startX, startZ);
    this.group.position.set(startX, startY + 0.5, startZ);

    // Materials
    const paintMat = new THREE.MeshStandardMaterial({
      color: 0xd32f2f, // Crimson Pahadi 4x4 Red
      roughness: 0.35,
      metalness: 0.5,
    });
    const blackTrimMat = new THREE.MeshStandardMaterial({
      color: 0x212121,
      roughness: 0.8,
      metalness: 0.2,
    });
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x81d4fa,
      roughness: 0.1,
      metalness: 0.1,
      transparent: true,
      opacity: 0.65,
    });
    const wheelRubberMat = new THREE.MeshStandardMaterial({
      color: 0x181818,
      roughness: 0.9,
    });
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xb0bec5,
      roughness: 0.3,
      metalness: 0.8,
    });
    const yellowLightMat = new THREE.MeshStandardMaterial({
      color: 0xfff59d,
      roughness: 0.2,
      emissive: 0xffeb3b,
      emissiveIntensity: 0.4,
    });
    this.brakeMat = new THREE.MeshStandardMaterial({
      color: 0x7f0000,
      roughness: 0.5,
    });
    this.brakeActiveMat = new THREE.MeshStandardMaterial({
      color: 0xff1744,
      emissive: 0xff1744,
      emissiveIntensity: 0.9,
    });

    // 1. Lower Chassis
    const chassis = new THREE.Mesh(
      new THREE.BoxGeometry(2.3, 0.45, 4.4),
      blackTrimMat
    );
    chassis.position.y = 0.55;
    chassis.castShadow = true;
    this.group.add(chassis);

    // 2. Main 4x4 Body
    this.bodyMesh = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.9, 4.2),
      paintMat
    );
    this.bodyMesh.position.y = 1.05;
    this.bodyMesh.castShadow = true;
    this.group.add(this.bodyMesh);

    // 3. Cabin & Canopy
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 0.95, 2.3),
      paintMat
    );
    cabin.position.set(0, 1.85, -0.4);
    cabin.castShadow = true;
    this.group.add(cabin);

    // Windshield
    const windshield = new THREE.Mesh(
      new THREE.BoxGeometry(1.85, 0.8, 0.08),
      glassMat
    );
    windshield.position.set(0, 1.85, 0.8);
    windshield.rotation.x = -0.22;
    this.group.add(windshield);

    // Side windows
    [-0.98, 0.98].forEach((wx) => {
      const sideWin = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.7, 1.8),
        glassMat
      );
      sideWin.position.set(wx, 1.85, -0.4);
      this.group.add(sideWin);
    });

    // 4. Heavy-duty Mountain Bull-Bar Bumper
    const bumper = new THREE.Mesh(
      new THREE.BoxGeometry(2.35, 0.4, 0.35),
      blackTrimMat
    );
    bumper.position.set(0, 0.7, 2.3);
    bumper.castShadow = true;
    this.group.add(bumper);

    const bullBar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 2.0, 8),
      blackTrimMat
    );
    bullBar.rotation.z = Math.PI / 2;
    bullBar.position.set(0, 1.05, 2.35);
    this.group.add(bullBar);

    // 5. Roof Luggage Rack with Spare Offroad Tire
    const rack = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.15, 2.0),
      blackTrimMat
    );
    rack.position.set(0, 2.38, -0.4);
    this.group.add(rack);

    const spareTire = new THREE.Mesh(
      new THREE.CylinderGeometry(0.48, 0.48, 0.32, 14),
      wheelRubberMat
    );
    spareTire.position.set(0, 2.6, -0.4);
    this.group.add(spareTire);

    // 6. Wheels (Front steering groups & Rear fixed wheels)
    const wheelPositions = [
      { x: -1.22, z: 1.35, isFront: true },
      { x: 1.22, z: 1.35, isFront: true },
      { x: -1.22, z: -1.35, isFront: false },
      { x: 1.22, z: -1.35, isFront: false },
    ];

    wheelPositions.forEach((pos) => {
      const wheelHub = new THREE.Group();
      wheelHub.position.set(pos.x, 0.45, pos.z);

      const tire = new THREE.Mesh(
        new THREE.CylinderGeometry(0.48, 0.48, 0.32, 14),
        wheelRubberMat
      );
      tire.rotation.z = Math.PI / 2;
      tire.castShadow = true;

      const rim = new THREE.Mesh(
        new THREE.CylinderGeometry(0.26, 0.26, 0.34, 10),
        rimMat
      );
      rim.rotation.z = Math.PI / 2;
      tire.add(rim);

      wheelHub.add(tire);
      this.group.add(wheelHub);
      this.wheels.push(tire);

      if (pos.isFront) {
        this.frontWheelsGroup.push(wheelHub);
      }
    });

    // 7. Headlights & Spotlights
    [-0.72, 0.72].forEach((hx) => {
      const lampMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 0.1, 10),
        yellowLightMat
      );
      lampMesh.rotation.x = Math.PI / 2;
      lampMesh.position.set(hx, 1.05, 2.12);
      this.group.add(lampMesh);
      this.headLightMeshes.push(lampMesh);

      const spot = new THREE.SpotLight(0xfff1cf, 0, 45, Math.PI / 5, 0.4, 1.2);
      spot.position.set(hx, 1.1, 2.2);
      spot.target.position.set(hx, 0.2, 25);
      this.group.add(spot);
      this.group.add(spot.target);
      this.headLights.push(spot);
    });

    // 8. Rear Tail Lights
    [-0.85, 0.85].forEach((tx) => {
      const tail = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.18, 0.08),
        this.brakeMat
      );
      tail.position.set(tx, 1.05, -2.12);
      this.group.add(tail);
      this.tailLights.push(tail);
    });
  }

  public toggleLights(): boolean {
    this.lightsOn = !this.lightsOn;
    this.headLights.forEach((spot) => {
      spot.intensity = this.lightsOn ? 3.5 : 0;
    });
    return this.lightsOn;
  }

  public update(dt: number, throttle: number, steer: number, handbrake: boolean) {
    const maxSpeed = 22; // m/s (~79 km/h)
    const accelRate = 14;
    const brakeRate = 26;
    const dragRate = 0.96;

    // Steering response
    const targetSteer = steer * 0.52; // max ~30 deg
    this.steerAngle += (targetSteer - this.steerAngle) * Math.min(1, dt * 10);
    this.frontWheelsGroup.forEach((fg) => {
      fg.rotation.y = this.steerAngle;
    });

    // Acceleration & Braking
    this.isBraking = handbrake || (this.velocity > 0.5 && throttle < -0.1);
    this.isReversing = throttle < -0.1 && this.velocity <= 0.5;

    if (handbrake) {
      this.velocity *= Math.pow(0.85, dt * 60);
      if (Math.abs(this.velocity) < 0.1) this.velocity = 0;
    } else if (throttle !== 0) {
      this.velocity += throttle * accelRate * dt;
      this.velocity = Math.max(-8, Math.min(maxSpeed, this.velocity));
    } else {
      // Natural rolling resistance
      this.velocity *= Math.pow(dragRate, dt * 60);
      if (Math.abs(this.velocity) < 0.05) this.velocity = 0;
    }

    // Brake lights visualization
    const tailMat = this.isBraking ? this.brakeActiveMat : this.brakeMat;
    this.tailLights.forEach((tl) => {
      tl.material = tailMat;
    });

    // Car heading rotation
    if (Math.abs(this.velocity) > 0.1) {
      const turnMultiplier = (this.velocity / maxSpeed) * (this.steerAngle * 2.2);
      this.group.rotation.y += turnMultiplier * dt * 2.6;
    }

    // Move forward along car heading (Z axis is forward for our model)
    const heading = this.group.rotation.y;
    this.group.position.x += Math.sin(heading) * this.velocity * dt;
    this.group.position.z += Math.cos(heading) * this.velocity * dt;

    // Bound car inside Himalayan map bounds
    this.group.position.x = Math.max(-210, Math.min(210, this.group.position.x));
    this.group.position.z = Math.max(-210, Math.min(210, this.group.position.z));

    // Ground following with smooth suspension
    const targetGroundY = getTerrainHeight(this.group.position.x, this.group.position.z);
    this.group.position.y += (targetGroundY - this.group.position.y) * Math.min(1, dt * 12);

    // Roll/tilt vehicle on mountain slopes
    const groundFront = getTerrainHeight(
      this.group.position.x + Math.sin(heading) * 2,
      this.group.position.z + Math.cos(heading) * 2
    );
    const groundBack = getTerrainHeight(
      this.group.position.x - Math.sin(heading) * 2,
      this.group.position.z - Math.cos(heading) * 2
    );
    const pitch = (groundBack - groundFront) * 0.18;
    this.group.rotation.x += (pitch - this.group.rotation.x) * Math.min(1, dt * 8);

    // Rotate wheels with velocity
    const wheelRot = (this.velocity / 0.48) * dt;
    this.wheels.forEach((w) => {
      w.rotation.x += wheelRot;
    });

    // Subtle engine vibration
    this.bodyMesh.position.y = 1.05 + Math.sin(performance.now() * 0.035) * (0.01 + Math.abs(this.velocity) * 0.003);

    // Update sound engine
    const normSpeed = this.velocity / maxSpeed;
    soundEngine.updateEngine(normSpeed, Math.abs(throttle) > 0.1);
  }
}
