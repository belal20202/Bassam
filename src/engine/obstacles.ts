/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { PowerUpType } from '../types';
import { ParticleFXManager } from './particleFX';

export type ObstacleType = 
  | 'TAXI'              // Yellow Baghdad Taxi
  | 'BUS'               // Baghdad Transit Bus
  | 'TUKTUK'            // Baghdad Tuk-Tuk / Stoota (Fast & moving)
  | 'GENERATOR_WIRES'   // Hanging private generator wires (Slide under)
  | 'CONCRETE_BARRIER'  // Heavy concrete security barrier / Sabba (Dodge)
  | 'TEA_CART'          // Traditional Iraqi tea samovar cart (Jump / Dodge)
  | 'FRUIT_STAND'       // Popular market vegetable/fruit stall with awning
  | 'SAND_GRAVEL_MOUND' // Construction sand pile (Jump)
  | 'BARRIER_JUMP'      // Traffic barrier to jump over
  | 'BEAM_SLIDE'        // Low steel beam to slide under
  | 'WOOD_CRATES'       // Stacked wooden crates
  | 'POTHOLE'           // Road work hole
  | 'RAMP_BUS';         // Driveable roof ramp

export interface ObstacleInstance {
  mesh: THREE.Group;
  type: ObstacleType;
  lane: number;
  z: number;
  width: number;
  height: number;
  depth: number;
  canJump: boolean;
  canSlide: boolean;
  isMoving: boolean;
  moveSpeed: number;
  isCollided: boolean;
  isPassed?: boolean;
  isRamp?: boolean;
}

export interface CoinInstance {
  mesh: THREE.Group;
  coinCore: THREE.Mesh;
  glowHalo: THREE.Mesh;
  lane: number;
  z: number;
  y: number;
  isCollected: boolean;
  baseY: number;
  pulsePhase: number;
}

export interface PowerUpItemInstance {
  mesh: THREE.Group;
  glowHalo: THREE.Mesh;
  type: PowerUpType;
  lane: number;
  z: number;
  y: number;
  isCollected: boolean;
}

/**
 * Ultra-Optimized Obstacle & Collectible Manager with Master Geometry Caching & Object Pooling
 * Eliminates all memory allocations, GC pauses, and frame stuttering.
 */
export class ObstacleManager {
  public obstacles: ObstacleInstance[] = [];
  public coins: CoinInstance[] = [];
  public powerUps: PowerUpItemInstance[] = [];

  // Object Pools
  private obstaclePool: Map<ObstacleType, ObstacleInstance[]> = new Map();
  private coinPool: CoinInstance[] = [];
  private powerUpPool: Map<PowerUpType, PowerUpItemInstance[]> = new Map();

  private scene: THREE.Scene;

  // Master Shared Geometries
  private coinGeometry: THREE.CylinderGeometry;
  private coinRingGeometry: THREE.TorusGeometry;
  private coinGlowGeo: THREE.PlaneGeometry;
  private coinMaterial: THREE.MeshStandardMaterial;
  private coinRingMat: THREE.MeshStandardMaterial;
  private coinGlowMat: THREE.MeshBasicMaterial;

  // Vehicle Geometries
  private taxiBodyGeo: THREE.BoxGeometry;
  private taxiCabinGeo: THREE.BoxGeometry;
  private taxiLightGeo: THREE.BoxGeometry;
  private headlightGeo: THREE.SphereGeometry;
  private wheelGeo: THREE.CylinderGeometry;

  private busBodyGeo: THREE.BoxGeometry;
  private busWinSideGeo: THREE.BoxGeometry;
  private busWinFrontGeo: THREE.BoxGeometry;

  private tuktukBodyGeo: THREE.BoxGeometry;
  private tuktukRoofGeo: THREE.BoxGeometry;
  private tuktukPoleGeo: THREE.CylinderGeometry;

  // Barrier Geometries
  private barrierPoleGeo: THREE.CylinderGeometry;
  private barrierBoardGeo: THREE.BoxGeometry;
  private barrierStripeGeo: THREE.BoxGeometry;
  private beamSlideGeo: THREE.BoxGeometry;
  private concreteBarrierGeo: THREE.BoxGeometry;
  private cratesGeo: THREE.BoxGeometry;
  private sandMoundGeo: THREE.ConeGeometry;
  private teaCartBodyGeo: THREE.BoxGeometry;
  private teaPotGeo: THREE.CylinderGeometry;
  private fruitStandBodyGeo: THREE.BoxGeometry;
  private fruitAwningGeo: THREE.ConeGeometry;

  // Shared Materials
  private taxiMat: THREE.MeshStandardMaterial;
  private busMat: THREE.MeshStandardMaterial;
  private tuktukMat: THREE.MeshStandardMaterial;
  private glassMat: THREE.MeshStandardMaterial;
  private tireMat: THREE.MeshStandardMaterial;
  private whiteMat: THREE.MeshBasicMaterial;
  private yellowLightMat: THREE.MeshBasicMaterial;
  private concreteMat: THREE.MeshStandardMaterial;
  private barrierCrimsonMat: THREE.MeshStandardMaterial;
  private barrierPoleMat: THREE.MeshStandardMaterial;
  private metalBeamMat: THREE.MeshStandardMaterial;
  private warningStripesMat: THREE.MeshStandardMaterial;
  private woodMat: THREE.MeshStandardMaterial;
  private sandMat: THREE.MeshStandardMaterial;
  private teaMetalMat: THREE.MeshStandardMaterial;
  private fruitMat: THREE.MeshStandardMaterial;

  // Scratch Vector for Zero-Allocation magnet math
  private _scratchVec = new THREE.Vector3();

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Coins
    this.coinGeometry = new THREE.CylinderGeometry(0.38, 0.38, 0.08, 18);
    this.coinGeometry.rotateX(Math.PI / 2);
    this.coinRingGeometry = new THREE.TorusGeometry(0.24, 0.02, 8, 16);
    this.coinGlowGeo = new THREE.PlaneGeometry(1.5, 1.5);

    this.coinMaterial = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      metalness: 0.92,
      roughness: 0.16,
      emissive: 0xd97706,
      emissiveIntensity: 0.45,
    });

    this.coinRingMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      metalness: 0.95,
      roughness: 0.1,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.4,
    });

    this.coinGlowMat = new THREE.MeshBasicMaterial({
      map: ParticleFXManager.getGlowTexture(),
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    // Vehicles Geometries
    this.taxiBodyGeo = new THREE.BoxGeometry(1.8, 0.75, 3.4);
    this.taxiCabinGeo = new THREE.BoxGeometry(1.5, 0.6, 1.8);
    this.taxiLightGeo = new THREE.BoxGeometry(0.6, 0.15, 0.2);
    this.headlightGeo = new THREE.SphereGeometry(0.12, 8, 8);
    this.wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 12);
    this.wheelGeo.rotateZ(Math.PI / 2);

    this.busBodyGeo = new THREE.BoxGeometry(2.1, 2.4, 6.2);
    this.busWinSideGeo = new THREE.BoxGeometry(0.05, 0.8, 5.4);
    this.busWinFrontGeo = new THREE.BoxGeometry(1.9, 0.9, 0.05);

    this.tuktukBodyGeo = new THREE.BoxGeometry(1.3, 0.7, 2.2);
    this.tuktukRoofGeo = new THREE.BoxGeometry(1.25, 0.1, 1.9);
    this.tuktukPoleGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.9, 6);

    // Barriers & Street Geometries
    this.barrierPoleGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.9, 8);
    this.barrierBoardGeo = new THREE.BoxGeometry(1.9, 0.4, 0.08);
    this.barrierStripeGeo = new THREE.BoxGeometry(0.4, 0.41, 0.09);
    this.beamSlideGeo = new THREE.BoxGeometry(2.4, 0.25, 0.25);
    this.concreteBarrierGeo = new THREE.BoxGeometry(1.8, 1.1, 0.6);
    this.cratesGeo = new THREE.BoxGeometry(1.4, 1.2, 1.4);
    this.sandMoundGeo = new THREE.ConeGeometry(1.6, 0.85, 12);
    this.teaCartBodyGeo = new THREE.BoxGeometry(1.4, 0.9, 1.0);
    this.teaPotGeo = new THREE.CylinderGeometry(0.16, 0.22, 0.5, 8);
    this.fruitStandBodyGeo = new THREE.BoxGeometry(1.6, 0.8, 1.2);
    this.fruitAwningGeo = new THREE.ConeGeometry(1.8, 0.5, 4);
    this.fruitAwningGeo.rotateY(Math.PI / 4);

    // Shared Materials
    this.taxiMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3, metalness: 0.25 });
    this.busMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.4, metalness: 0.15 });
    this.tuktukMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.35, metalness: 0.2 });
    this.glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.85 });
    this.tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
    this.whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.yellowLightMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    this.concreteMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.85 });
    this.barrierCrimsonMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.5 });
    this.barrierPoleMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5 });
    this.metalBeamMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.7, roughness: 0.3 });
    this.warningStripesMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.5 });
    this.woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
    this.sandMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.95 });
    this.teaMetalMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.85, roughness: 0.2 });
    this.fruitMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.6 });
  }

  // ==================== CREATE & POOL OBSTACLES ====================
  public createObstacle(type: ObstacleType, lane: number, z: number): ObstacleInstance {
    // Check pool first for zero-allocation recycling
    let poolList = this.obstaclePool.get(type);
    if (poolList && poolList.length > 0) {
      const pooled = poolList.pop()!;
      pooled.lane = lane;
      pooled.z = z;
      pooled.isCollided = false;
      pooled.isPassed = false;
      pooled.mesh.position.set(lane, 0, z);
      pooled.mesh.visible = true;
      this.scene.add(pooled.mesh);
      this.obstacles.push(pooled);
      return pooled;
    }

    const group = new THREE.Group();
    group.position.set(lane, 0, z);

    let width = 1.8;
    let height = 1.2;
    let depth = 2.0;
    let canJump = true;
    let canSlide = false;
    let isMoving = false;
    let moveSpeed = 0;
    let isRamp = false;

    switch (type) {
      case 'TAXI': {
        width = 1.9;
        height = 1.25;
        depth = 3.2;
        canJump = true;
        isMoving = z > 300 && Math.random() < 0.55;
        moveSpeed = isMoving ? 7.5 : 0;

        const body = new THREE.Mesh(this.taxiBodyGeo, this.taxiMat);
        body.position.y = 0.55;
        body.castShadow = true;

        const cabin = new THREE.Mesh(this.taxiCabinGeo, this.glassMat);
        cabin.position.set(0, 1.15, -0.2);

        const roofLight = new THREE.Mesh(this.taxiLightGeo, this.whiteMat);
        roofLight.position.set(0, 1.52, -0.2);

        const hlL = new THREE.Mesh(this.headlightGeo, this.yellowLightMat);
        hlL.position.set(-0.65, 0.55, 1.71);
        const hlR = new THREE.Mesh(this.headlightGeo, this.yellowLightMat);
        hlR.position.set(0.65, 0.55, 1.71);

        const wFL = new THREE.Mesh(this.wheelGeo, this.tireMat);
        wFL.position.set(-0.95, 0.3, 1.0);
        const wFR = new THREE.Mesh(this.wheelGeo, this.tireMat);
        wFR.position.set(0.95, 0.3, 1.0);
        const wBL = new THREE.Mesh(this.wheelGeo, this.tireMat);
        wBL.position.set(-0.95, 0.3, -1.0);
        const wBR = new THREE.Mesh(this.wheelGeo, this.tireMat);
        wBR.position.set(0.95, 0.3, -1.0);

        group.add(body, cabin, roofLight, hlL, hlR, wFL, wFR, wBL, wBR);
        break;
      }

      case 'BUS': {
        width = 2.2;
        height = 2.8;
        depth = 6.5;
        canJump = false;

        const busBody = new THREE.Mesh(this.busBodyGeo, this.busMat);
        busBody.position.y = 1.45;
        busBody.castShadow = true;

        const winL = new THREE.Mesh(this.busWinSideGeo, this.glassMat);
        winL.position.set(-1.06, 1.8, 0);
        const winR = new THREE.Mesh(this.busWinSideGeo, this.glassMat);
        winR.position.set(1.06, 1.8, 0);
        const winF = new THREE.Mesh(this.busWinFrontGeo, this.glassMat);
        winF.position.set(0, 1.8, 3.12);

        group.add(busBody, winL, winR, winF);
        break;
      }

      case 'TUKTUK': {
        width = 1.4;
        height = 1.6;
        depth = 2.4;
        canJump = true;
        isMoving = true;
        moveSpeed = 9.0;

        const body = new THREE.Mesh(this.tuktukBodyGeo, this.tuktukMat);
        body.position.y = 0.55;
        body.castShadow = true;

        const roof = new THREE.Mesh(this.tuktukRoofGeo, this.tuktukMat);
        roof.position.set(0, 1.5, 0);

        const p1 = new THREE.Mesh(this.tuktukPoleGeo, this.barrierPoleMat);
        p1.position.set(-0.55, 1.0, 0.85);
        const p2 = new THREE.Mesh(this.tuktukPoleGeo, this.barrierPoleMat);
        p2.position.set(0.55, 1.0, 0.85);
        const p3 = new THREE.Mesh(this.tuktukPoleGeo, this.barrierPoleMat);
        p3.position.set(-0.55, 1.0, -0.85);
        const p4 = new THREE.Mesh(this.tuktukPoleGeo, this.barrierPoleMat);
        p4.position.set(0.55, 1.0, -0.85);

        group.add(body, roof, p1, p2, p3, p4);
        break;
      }

      case 'BARRIER_JUMP': {
        width = 2.0;
        height = 0.95;
        depth = 0.4;
        canJump = true;
        canSlide = false;

        const poleL = new THREE.Mesh(this.barrierPoleGeo, this.barrierPoleMat);
        poleL.position.set(-0.85, 0.45, 0);
        const poleR = new THREE.Mesh(this.barrierPoleGeo, this.barrierPoleMat);
        poleR.position.set(0.85, 0.45, 0);

        const board = new THREE.Mesh(this.barrierBoardGeo, this.barrierCrimsonMat);
        board.position.y = 0.65;
        board.castShadow = true;

        const stripe = new THREE.Mesh(this.barrierStripeGeo, this.whiteMat);
        stripe.position.set(0, 0.65, 0);

        group.add(poleL, poleR, board, stripe);
        break;
      }

      case 'BEAM_SLIDE':
      case 'GENERATOR_WIRES': {
        width = 2.4;
        height = 1.9;
        depth = 0.4;
        canJump = false;
        canSlide = true;

        const poleL = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.0, 8), this.barrierPoleMat);
        poleL.position.set(-1.15, 1.0, 0);
        const poleR = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.0, 8), this.barrierPoleMat);
        poleR.position.set(1.15, 1.0, 0);

        const beam = new THREE.Mesh(this.beamSlideGeo, this.metalBeamMat);
        beam.position.y = 1.7;
        beam.castShadow = true;

        group.add(poleL, poleR, beam);
        break;
      }

      case 'CONCRETE_BARRIER': {
        width = 1.9;
        height = 1.2;
        depth = 0.7;
        canJump = false;
        canSlide = false;

        const barrier = new THREE.Mesh(this.concreteBarrierGeo, this.concreteMat);
        barrier.position.y = 0.55;
        barrier.castShadow = true;
        group.add(barrier);
        break;
      }

      case 'WOOD_CRATES': {
        width = 1.5;
        height = 1.3;
        depth = 1.5;
        canJump = true;
        canSlide = false;

        const crates = new THREE.Mesh(this.cratesGeo, this.woodMat);
        crates.position.y = 0.65;
        crates.castShadow = true;
        group.add(crates);
        break;
      }

      case 'SAND_GRAVEL_MOUND': {
        width = 1.8;
        height = 0.85;
        depth = 1.8;
        canJump = true;
        canSlide = false;

        const mound = new THREE.Mesh(this.sandMoundGeo, this.sandMat);
        mound.position.y = 0.42;
        mound.castShadow = true;
        group.add(mound);
        break;
      }

      case 'TEA_CART': {
        width = 1.5;
        height = 1.35;
        depth = 1.1;
        canJump = true;
        canSlide = false;

        const cart = new THREE.Mesh(this.teaCartBodyGeo, this.metalBeamMat);
        cart.position.y = 0.45;
        cart.castShadow = true;

        const pot = new THREE.Mesh(this.teaPotGeo, this.teaMetalMat);
        pot.position.set(0, 1.15, 0);

        group.add(cart, pot);
        break;
      }

      case 'FRUIT_STAND': {
        width = 1.7;
        height = 1.5;
        depth = 1.3;
        canJump = false;
        canSlide = false;

        const stall = new THREE.Mesh(this.fruitStandBodyGeo, this.woodMat);
        stall.position.y = 0.4;
        stall.castShadow = true;

        const awning = new THREE.Mesh(this.fruitAwningGeo, this.fruitMat);
        awning.position.y = 1.3;

        group.add(stall, awning);
        break;
      }

      case 'RAMP_BUS': {
        width = 2.2;
        height = 2.4;
        depth = 7.0;
        canJump = true;
        isRamp = true;

        const rampBus = new THREE.Mesh(this.busBodyGeo, this.busMat);
        rampBus.position.y = 1.2;
        rampBus.castShadow = true;
        group.add(rampBus);
        break;
      }

      default:
        break;
    }

    this.scene.add(group);

    const instance: ObstacleInstance = {
      mesh: group,
      type,
      lane,
      z,
      width,
      height,
      depth,
      canJump,
      canSlide,
      isMoving,
      moveSpeed,
      isCollided: false,
      isRamp,
    };

    this.obstacles.push(instance);
    return instance;
  }

  // ==================== SPAWN COINS ====================
  public createCoin(lane: number, z: number, y: number = 0.8): CoinInstance {
    if (this.coinPool.length > 0) {
      const coin = this.coinPool.pop()!;
      coin.lane = lane;
      coin.z = z;
      coin.y = y;
      coin.baseY = y;
      coin.isCollected = false;
      coin.mesh.position.set(lane, y, z);
      coin.mesh.visible = true;
      this.scene.add(coin.mesh);
      this.coins.push(coin);
      return coin;
    }

    const group = new THREE.Group();
    group.position.set(lane, y, z);

    const coinCore = new THREE.Mesh(this.coinGeometry, this.coinMaterial);
    group.add(coinCore);

    const innerRing = new THREE.Mesh(this.coinRingGeometry, this.coinRingMat);
    coinCore.add(innerRing);

    const glowHalo = new THREE.Mesh(this.coinGlowGeo, this.coinGlowMat);
    group.add(glowHalo);

    this.scene.add(group);

    const instance: CoinInstance = {
      mesh: group,
      coinCore,
      glowHalo,
      lane,
      z,
      y,
      baseY: y,
      pulsePhase: Math.random() * Math.PI * 2,
      isCollected: false,
    };

    this.coins.push(instance);
    return instance;
  }

  public spawnCoinArc(lane: number, startZ: number, count: number = 5, arcHeight: number = 2.2) {
    const spacing = 2.2;
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const y = 0.8 + Math.sin(t * Math.PI) * arcHeight;
      this.createCoin(lane, startZ + i * spacing, y);
    }
  }

  public spawnCoinLine(lane: number, startZ: number, count: number = 6) {
    const spacing = 2.0;
    for (let i = 0; i < count; i++) {
      this.createCoin(lane, startZ + i * spacing, 0.8);
    }
  }

  // ==================== SPAWN POWERUPS ====================
  public createPowerUp(type: PowerUpType, lane: number, z: number): PowerUpItemInstance {
    let poolList = this.powerUpPool.get(type);
    if (poolList && poolList.length > 0) {
      const p = poolList.pop()!;
      p.lane = lane;
      p.z = z;
      p.isCollected = false;
      p.mesh.position.set(lane, 1.2, z);
      p.mesh.visible = true;
      this.scene.add(p.mesh);
      this.powerUps.push(p);
      return p;
    }

    const group = new THREE.Group();
    group.position.set(lane, 1.2, z);

    let color = 0x38bdf8;
    switch (type) {
      case 'MAGNET': color = 0xf59e0b; break;
      case 'SHIELD': color = 0x06b6d4; break;
      case 'MULTIPLIER': color = 0xa855f7; break;
      case 'TURBO_SPEED': color = 0xef4444; break;
      case 'SUPER_JUMP': color = 0x10b981; break;
      case 'TIME_SLOW': color = 0x6366f1; break;
    }

    const sphereGeo = new THREE.SphereGeometry(0.42, 14, 14);
    const sphereMat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.65,
      metalness: 0.3,
      roughness: 0.2,
      transparent: true,
      opacity: 0.88,
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    group.add(sphere);

    const glowHalo = new THREE.Mesh(this.coinGlowGeo, this.coinGlowMat);
    glowHalo.scale.set(1.4, 1.4, 1.4);
    group.add(glowHalo);

    this.scene.add(group);

    const instance: PowerUpItemInstance = {
      mesh: group,
      glowHalo,
      type,
      lane,
      z,
      y: 1.2,
      isCollected: false,
    };

    this.powerUps.push(instance);
    return instance;
  }

  // ==================== UPDATE & POOL RECYCLING ====================
  public update(
    delta: number,
    playerZ: number,
    magnetActive: boolean = false,
    playerPos: THREE.Vector3 = new THREE.Vector3(),
    magnetRadius: number = 8
  ) {
    const time = performance.now() * 0.003;

    // 1. Coins update and recycling
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];
      if (coin.isCollected || coin.mesh.position.z < playerZ - 15) {
        this.scene.remove(coin.mesh);
        this.coinPool.push(coin);
        this.coins.splice(i, 1);
        continue;
      }

      coin.coinCore.rotation.z += delta * 4;
      coin.pulsePhase += delta * 5;
      const pulseScale = 1.0 + Math.sin(coin.pulsePhase) * 0.2;
      coin.glowHalo.scale.set(pulseScale, pulseScale, pulseScale);

      coin.mesh.position.y = coin.baseY + Math.sin(time + coin.pulsePhase) * 0.08;

      if (magnetActive) {
        const dist = coin.mesh.position.distanceTo(playerPos);
        if (dist < magnetRadius) {
          this._scratchVec.subVectors(playerPos, coin.mesh.position).normalize();
          coin.mesh.position.addScaledVector(this._scratchVec, delta * 34);
        }
      }
    }

    // 2. Power-ups update and recycling
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const p = this.powerUps[i];
      if (p.isCollected || p.mesh.position.z < playerZ - 15) {
        this.scene.remove(p.mesh);
        let poolList = this.powerUpPool.get(p.type);
        if (!poolList) {
          poolList = [];
          this.powerUpPool.set(p.type, poolList);
        }
        poolList.push(p);
        this.powerUps.splice(i, 1);
        continue;
      }

      p.mesh.rotation.y += delta * 3;
      p.mesh.position.y = p.y + Math.sin(time * 2) * 0.15;
      const pPulse = 1.0 + Math.sin(time * 3) * 0.25;
      p.glowHalo.scale.set(pPulse, pPulse, pPulse);
    }

    // 3. Obstacles update and recycling
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      if (obs.isMoving && !obs.isCollided) {
        obs.z -= obs.moveSpeed * delta;
        obs.mesh.position.z = obs.z;
      }
      if (obs.mesh.position.z < playerZ - 20) {
        this.scene.remove(obs.mesh);
        let poolList = this.obstaclePool.get(obs.type);
        if (!poolList) {
          poolList = [];
          this.obstaclePool.set(obs.type, poolList);
        }
        poolList.push(obs);
        this.obstacles.splice(i, 1);
      }
    }
  }

  public clearAll() {
    for (const o of this.obstacles) {
      this.scene.remove(o.mesh);
      let poolList = this.obstaclePool.get(o.type);
      if (!poolList) {
        poolList = [];
        this.obstaclePool.set(o.type, poolList);
      }
      poolList.push(o);
    }
    for (const c of this.coins) {
      this.scene.remove(c.mesh);
      this.coinPool.push(c);
    }
    for (const p of this.powerUps) {
      this.scene.remove(p.mesh);
      let poolList = this.powerUpPool.get(p.type);
      if (!poolList) {
        poolList = [];
        this.powerUpPool.set(p.type, poolList);
      }
      poolList.push(p);
    }
    this.obstacles = [];
    this.coins = [];
    this.powerUps = [];
  }
}
