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
  lane: number;          // -2.5, 0, or 2.5
  z: number;             // world z position
  width: number;
  height: number;
  depth: number;
  canJump: boolean;
  canSlide: boolean;
  isMoving: boolean;
  moveSpeed: number;
  isCollided: boolean;
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

export class ObstacleManager {
  public obstacles: ObstacleInstance[] = [];
  public coins: CoinInstance[] = [];
  public powerUps: PowerUpItemInstance[] = [];

  private scene: THREE.Scene;
  private coinGeometry: THREE.CylinderGeometry;
  private coinMaterial: THREE.MeshStandardMaterial;
  private coinGlowGeo: THREE.PlaneGeometry;
  private coinGlowMat: THREE.MeshBasicMaterial;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Golden Iraqi Dinar Coin geometry & high-luster material
    this.coinGeometry = new THREE.CylinderGeometry(0.38, 0.38, 0.08, 20);
    this.coinGeometry.rotateX(Math.PI / 2);
    this.coinMaterial = new THREE.MeshStandardMaterial({
      color: 0xfbbf24, // Bright Gold
      metalness: 0.9,
      roughness: 0.18,
      emissive: 0xd97706,
      emissiveIntensity: 0.35,
    });

    // Luminous Bloom Glow Corona for Coins
    this.coinGlowGeo = new THREE.PlaneGeometry(1.5, 1.5);
    this.coinGlowMat = new THREE.MeshBasicMaterial({
      map: ParticleFXManager.getGlowTexture(),
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }

  // ==================== GENERATE OBSTACLES ====================
  public createObstacle(type: ObstacleType, lane: number, z: number): ObstacleInstance {
    const group = new THREE.Group();
    group.position.set(lane, 0, z);

    let width = 1.8;
    let height = 1.2;
    let depth = 2.0;
    let canJump = true;
    let canSlide = false;
    let isMoving = false;
    let moveSpeed = 0;

    switch (type) {
      case 'TAXI': {
        width = 1.9;
        height = 1.25;
        depth = 3.2;
        canJump = true; // Allow jumping and skipping over cars
        isMoving = z > 300 && Math.random() < 0.55;
        moveSpeed = isMoving ? 7.5 : 0;

        // Yellow Car Body
        const bodyGeo = new THREE.BoxGeometry(1.8, 0.75, 3.4);
        const taxiMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3, metalness: 0.2 });
        const body = new THREE.Mesh(bodyGeo, taxiMat);
        body.position.y = 0.55;
        body.castShadow = true;
        group.add(body);

        // Cabin / Windows
        const cabinGeo = new THREE.BoxGeometry(1.5, 0.6, 1.8);
        const glassMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.1, metalness: 0.8 });
        const cabin = new THREE.Mesh(cabinGeo, glassMat);
        cabin.position.set(0, 1.15, -0.2);
        group.add(cabin);

        // Taxi Roof Light
        const lightGeo = new THREE.BoxGeometry(0.6, 0.15, 0.2);
        const lightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const roofLight = new THREE.Mesh(lightGeo, lightMat);
        roofLight.position.set(0, 1.52, -0.2);
        group.add(roofLight);

        // Headlights
        const headGeo = new THREE.SphereGeometry(0.12, 8, 8);
        const headMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
        const hlL = new THREE.Mesh(headGeo, headMat);
        hlL.position.set(-0.65, 0.55, 1.71);
        const hlR = new THREE.Mesh(headGeo, headMat);
        hlR.position.set(0.65, 0.55, 1.71);
        group.add(hlL, hlR);

        // Wheels
        const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 12);
        wheelGeo.rotateZ(Math.PI / 2);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
        
        const wFL = new THREE.Mesh(wheelGeo, wheelMat);
        wFL.position.set(-0.95, 0.3, 1.0);
        const wFR = new THREE.Mesh(wheelGeo, wheelMat);
        wFR.position.set(0.95, 0.3, 1.0);
        const wBL = new THREE.Mesh(wheelGeo, wheelMat);
        wBL.position.set(-0.95, 0.3, -1.0);
        const wBR = new THREE.Mesh(wheelGeo, wheelMat);
        wBR.position.set(0.95, 0.3, -1.0);
        group.add(wFL, wFR, wBL, wBR);
        break;
      }

      case 'BUS': {
        width = 2.2;
        height = 2.8;
        depth = 6.5;
        canJump = false;

        // Big Baghdad Red Bus
        const busMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.4, metalness: 0.1 });
        const busBody = new THREE.Mesh(new THREE.BoxGeometry(2.1, 2.4, 6.2), busMat);
        busBody.position.y = 1.45;
        busBody.castShadow = true;
        group.add(busBody);

        // Windows strip
        const winMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.9 });
        const winL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.8, 5.4), winMat);
        winL.position.set(-1.06, 1.8, 0);
        const winR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.8, 5.4), winMat);
        winR.position.set(1.06, 1.8, 0);
        const winF = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.9, 0.05), winMat);
        winF.position.set(0, 1.8, 3.12);
        group.add(winL, winR, winF);
        break;
      }

      case 'BARRIER_JUMP': {
        width = 2.0;
        height = 0.95;
        depth = 0.4;
        canJump = true;
        canSlide = false;

        // Striped Traffic Barrier
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
        const barMat = new THREE.MeshStandardMaterial({ color: 0xe11d48 }); // Crimson orange
        
        const poleL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.9, 8), poleMat);
        poleL.position.set(-0.85, 0.45, 0);
        const poleR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.9, 8), poleMat);
        poleR.position.set(0.85, 0.45, 0);
        
        const board = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.4, 0.08), barMat);
        board.position.y = 0.65;
        board.castShadow = true;

        // White stripes
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.41, 0.09), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        stripe.position.set(0, 0.65, 0);

        group.add(poleL, poleR, board, stripe);
        break;
      }

      case 'BEAM_SLIDE': {
        width = 2.4;
        height = 2.4;
        depth = 0.6;
        canJump = false;
        canSlide = true; // Must slide under!

        const steelMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.6, roughness: 0.4 });
        const postMat = new THREE.MeshStandardMaterial({ color: 0x334155 });

        // Left & Right Support Posts
        const postL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.4, 0.2), postMat);
        postL.position.set(-1.15, 1.2, 0);
        const postR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.4, 0.2), postMat);
        postR.position.set(1.15, 1.2, 0);

        // Low Clearance Beam (leaves 0.95m clearance underneath)
        const beam = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 0.3), steelMat);
        beam.position.set(0, 1.8, 0);
        beam.castShadow = true;

        // Hazard Chevron stripes
        const warningMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const stripe1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.81, 0.31), warningMat);
        stripe1.position.set(-0.5, 1.8, 0);
        const stripe2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.81, 0.31), warningMat);
        stripe2.position.set(0.5, 1.8, 0);

        group.add(postL, postR, beam, stripe1, stripe2);
        break;
      }

      case 'WOOD_CRATES': {
        width = 1.9;
        height = 1.0;
        depth = 1.2;
        canJump = true;
        canSlide = false;

        const woodMat = new THREE.MeshStandardMaterial({ color: 0xa16207, roughness: 0.85 });
        const crate1 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), woodMat);
        crate1.position.set(-0.45, 0.45, 0);
        crate1.castShadow = true;

        const crate2 = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.85, 0.85), woodMat);
        crate2.position.set(0.45, 0.425, 0);
        crate2.castShadow = true;

        group.add(crate1, crate2);
        break;
      }

      case 'TUKTUK': {
        width = 1.6;
        height = 1.35;
        depth = 2.6;
        canJump = true;
        canSlide = false;
        isMoving = z > 200 && Math.random() < 0.65;
        moveSpeed = isMoving ? 9.0 : 0;

        // Tuk-Tuk Chassis & Cabin
        const chassisMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.35, metalness: 0.3 }); // Baghdad Red/Yellow Tuk-Tuk
        const cabBody = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 2.2), chassisMat);
        cabBody.position.y = 0.65;
        cabBody.castShadow = true;
        group.add(cabBody);

        // Canopy Roof & Pillars
        const roofMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.8 }); // Blue canvas roof
        const roof = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 2.3), roofMat);
        roof.position.y = 1.55;
        group.add(roof);

        // Steel Frame Pillars
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
        const postFL = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 6), frameMat);
        postFL.position.set(-0.65, 1.1, 0.9);
        const postFR = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 6), frameMat);
        postFR.position.set(0.65, 1.1, 0.9);
        const postBL = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 6), frameMat);
        postBL.position.set(-0.65, 1.1, -0.9);
        const postBR = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 6), frameMat);
        postBR.position.set(0.65, 1.1, -0.9);
        group.add(postFL, postFR, postBL, postBR);

        // Windshield
        const winGeo = new THREE.BoxGeometry(1.3, 0.6, 0.04);
        const winMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.85 });
        const windshield = new THREE.Mesh(winGeo, winMat);
        windshield.position.set(0, 1.1, 0.9);
        group.add(windshield);

        // Bright Center Headlight
        const headLight = new THREE.Mesh(
          new THREE.CylinderGeometry(0.18, 0.18, 0.15, 12),
          new THREE.MeshBasicMaterial({ color: 0xfef08a })
        );
        headLight.rotateX(Math.PI / 2);
        headLight.position.set(0, 0.65, 1.15);
        group.add(headLight);

        // Wheels (1 Front Center, 2 Rear)
        const wheelGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.16, 12);
        wheelGeo.rotateZ(Math.PI / 2);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });

        const frontWheel = new THREE.Mesh(wheelGeo, wheelMat);
        frontWheel.position.set(0, 0.26, 0.9);
        const rearWheelL = new THREE.Mesh(wheelGeo, wheelMat);
        rearWheelL.position.set(-0.75, 0.26, -0.7);
        const rearWheelR = new THREE.Mesh(wheelGeo, wheelMat);
        rearWheelR.position.set(0.75, 0.26, -0.7);
        group.add(frontWheel, rearWheelL, rearWheelR);
        break;
      }

      case 'GENERATOR_WIRES': {
        width = 2.5;
        height = 2.5;
        depth = 0.5;
        canJump = false;
        canSlide = true; // Requires sliding under low sagging electrical cables!

        const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.4 });
        const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.5, 8), poleMat);
        postL.position.set(-1.2, 1.25, 0);
        const postR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.5, 8), poleMat);
        postR.position.set(1.2, 1.25, 0);

        // Heavy generator distribution junction box
        const boxMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.6 });
        const juncBox = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.6, 0.3), boxMat);
        juncBox.position.set(-1.2, 1.9, 0.1);
        
        // Red / Yellow warning indicator pilot lamp on box
        const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
        lamp.position.set(-1.2, 2.1, 0.26);

        // Low Sagging Wires Cluster (Leaves ~0.95m clearance for sliding)
        const wireMat = new THREE.MeshBasicMaterial({ color: 0x09090b });
        const wire1 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.45, 8), wireMat);
        wire1.rotateZ(Math.PI / 2);
        wire1.position.set(0, 1.8, 0);

        const wire2 = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.45, 8), wireMat);
        wire2.rotateZ(Math.PI / 2);
        wire2.position.set(0, 1.6, 0.05);

        const wire3 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.45, 8), wireMat);
        wire3.rotateZ(Math.PI / 2);
        wire3.position.set(0, 1.4, -0.05);

        // Yellow warning label in center of cables
        const tag = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.02), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
        tag.position.set(0, 1.4, 0);

        group.add(postL, postR, juncBox, lamp, wire1, wire2, wire3, tag);
        break;
      }

      case 'CONCRETE_BARRIER': {
        width = 2.2;
        height = 1.3;
        depth = 0.9;
        canJump = false; // Heavy roadblock - must dodge or super jump
        canSlide = false;

        // Realistic Baghdad Concrete Jersey Barrier (صبة كونكريتية)
        const concMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.95, metalness: 0.05 });
        const base = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.5, 0.8), concMat);
        base.position.y = 0.25;
        base.castShadow = true;

        const top = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.7, 0.45), concMat);
        top.position.y = 0.8;
        top.castShadow = true;

        // Rebar lifting hooks on top
        const rebarMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
        const hookL = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 6, 12), rebarMat);
        hookL.position.set(-0.6, 1.22, 0);
        const hookR = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 6, 12), rebarMat);
        hookR.position.set(0.6, 1.22, 0);

        // Black and Yellow Chevron Safety Reflectors
        const chevron1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.46), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
        chevron1.position.set(-0.45, 0.8, 0);
        const chevron2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.46), new THREE.MeshBasicMaterial({ color: 0x09090b }));
        chevron2.position.set(0.45, 0.8, 0);

        group.add(base, top, hookL, hookR, chevron1, chevron2);
        break;
      }

      case 'TEA_CART': {
        width = 1.7;
        height = 1.1;
        depth = 1.3;
        canJump = true; // Can jump over!
        canSlide = false;

        // Baghdad Chai Samovar Cart (عربانة شاي وسماور)
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
        const cartBody = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.6, 1.0), woodMat);
        cartBody.position.y = 0.55;
        cartBody.castShadow = true;

        // Stainless Steel / Brass Countertop
        const counterMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.85, roughness: 0.2 });
        const counter = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.08, 1.05), counterMat);
        counter.position.y = 0.89;

        // Traditional Brass Samovar Urn
        const samovarGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.55, 12);
        const samovarMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.9, roughness: 0.15 });
        const samovar = new THREE.Mesh(samovarGeo, samovarMat);
        samovar.position.set(0.25, 1.2, 0);

        // Small teapot on top of samovar (قوري شاي)
        const teapotGeo = new THREE.SphereGeometry(0.1, 8, 8);
        const teapotMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, metalness: 0.3 });
        const teapot = new THREE.Mesh(teapotGeo, teapotMat);
        teapot.position.set(0.25, 1.55, 0);

        // Small Iraqi Tea Glasses (استكانات شاي)
        const glassMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.1, opacity: 0.85, transparent: true });
        const cup1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.12, 8), glassMat);
        cup1.position.set(-0.35, 0.98, 0.2);
        const cup2 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.12, 8), glassMat);
        cup2.position.set(-0.2, 0.98, 0.2);

        // Cart Wheels
        const wheelGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.08, 12);
        wheelGeo.rotateZ(Math.PI / 2);
        const wMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.9 });
        const wL = new THREE.Mesh(wheelGeo, wMat);
        wL.position.set(-0.76, 0.24, 0);
        const wR = new THREE.Mesh(wheelGeo, wMat);
        wR.position.set(0.76, 0.24, 0);

        group.add(cartBody, counter, samovar, teapot, cup1, cup2, wL, wR);
        break;
      }

      case 'FRUIT_STAND': {
        width = 1.9;
        height = 1.25;
        depth = 1.4;
        canJump = true;
        canSlide = false;

        // Market Vendor Wooden Stand with Striped Fabric
        const standMat = new THREE.MeshStandardMaterial({ color: 0xa16207, roughness: 0.85 });
        const table = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.55, 1.2), standMat);
        table.position.y = 0.45;
        table.castShadow = true;

        // Fruit boxes (Red Apples, Oranges, Watermelons)
        const orangeMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.6 });
        const greenMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5 });
        const crateOranges = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.2, 0.5), orangeMat);
        crateOranges.position.set(-0.4, 0.8, 0);
        const crateMelons = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.2, 0.5), greenMat);
        crateMelons.position.set(0.4, 0.8, 0);

        // Little market striped awning
        const awningMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.7 });
        const awning = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 1.3), awningMat);
        awning.position.set(0, 1.25, 0);
        awning.rotation.x = -0.15;

        group.add(table, crateOranges, crateMelons, awning);
        break;
      }

      case 'SAND_GRAVEL_MOUND': {
        width = 2.0;
        height = 0.85;
        depth = 1.8;
        canJump = true;
        canSlide = false;

        // Roadwork Gravel Mound (كومة حصى ورمل)
        const sandMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.95 });
        const mound = new THREE.Mesh(new THREE.ConeGeometry(1.2, 0.85, 8), sandMat);
        mound.position.y = 0.425;
        mound.castShadow = true;

        // Red Caution Flag
        const flagPole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.03, 0.03, 1.1, 6),
          new THREE.MeshStandardMaterial({ color: 0x475569 })
        );
        flagPole.position.set(0.4, 0.95, 0);
        const flag = new THREE.Mesh(
          new THREE.BoxGeometry(0.3, 0.2, 0.02),
          new THREE.MeshBasicMaterial({ color: 0xdc2626 })
        );
        flag.position.set(0.55, 1.4, 0);

        group.add(mound, flagPole, flag);
        break;
      }

      case 'POTHOLE': {
        width = 1.8;
        height = 0.1;
        depth = 2.2;
        canJump = true;
        canSlide = false;

        const holeGeo = new THREE.PlaneGeometry(1.6, 2.0);
        holeGeo.rotateX(-Math.PI / 2);
        const holeMat = new THREE.MeshBasicMaterial({ color: 0x09090b });
        const hole = new THREE.Mesh(holeGeo, holeMat);
        hole.position.y = 0.02;

        // Hazard cones
        const coneGeo = new THREE.ConeGeometry(0.18, 0.6, 8);
        const coneMat = new THREE.MeshStandardMaterial({ color: 0xf97316 });
        const coneL = new THREE.Mesh(coneGeo, coneMat);
        coneL.position.set(-0.9, 0.3, 0.8);
        const coneR = new THREE.Mesh(coneGeo, coneMat);
        coneR.position.set(0.9, 0.3, -0.8);

        group.add(hole, coneL, coneR);
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
    };

    this.obstacles.push(instance);
    return instance;
  }

  // ==================== SPAWN COINS ====================
  public createCoin(lane: number, z: number, y: number = 0.8): CoinInstance {
    const group = new THREE.Group();
    group.position.set(lane, y, z);

    // 1. Golden Coin Cylinder Core
    const coinCore = new THREE.Mesh(this.coinGeometry, this.coinMaterial);
    group.add(coinCore);

    // 2. Embossed Ring Detail for Iraqi Dinar aesthetic
    const innerRingGeo = new THREE.TorusGeometry(0.24, 0.02, 8, 16);
    const innerRingMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      metalness: 0.95,
      roughness: 0.1,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.4,
    });
    const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    coinCore.add(innerRing);

    // 3. Glowing Bloom Corona Halo Billboard
    const glowHalo = new THREE.Mesh(this.coinGlowGeo, this.coinGlowMat.clone());
    glowHalo.position.set(0, 0, 0);
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

    // Outer Glowing Crystal Orb
    const orbGeo = new THREE.OctahedronGeometry(0.42, 1);
    const orbMat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.8,
      roughness: 0.15,
      metalness: 0.85,
    });
    const orb = new THREE.Mesh(orbGeo, orbMat);
    group.add(orb);

    // Outer Orbit Ring
    const ringGeo = new THREE.TorusGeometry(0.65, 0.03, 8, 20);
    const ringMat = new THREE.MeshBasicMaterial({ color, wireframe: true });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    // Power-up Glow Bloom Billboard
    const glowMat = new THREE.MeshBasicMaterial({
      map: ParticleFXManager.getGlowTexture(),
      color,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const glowHalo = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.0), glowMat);
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

  // ==================== UPDATE & CLEANUP ====================
  public update(delta: number, playerZ: number, magnetActive: boolean, playerPos: THREE.Vector3, magnetRadius: number) {
    const time = performance.now() * 0.003;

    // 1. Rotate, Pulse Bloom & Attract Coins
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];
      if (coin.isCollected) {
        this.scene.remove(coin.mesh);
        this.coins.splice(i, 1);
        continue;
      }

      // Rotate golden coin disk
      coin.coinCore.rotation.z += delta * 4;

      // Pulse Bloom Glow Corona
      coin.pulsePhase += delta * 5;
      const pulseScale = 1.0 + Math.sin(coin.pulsePhase) * 0.2;
      coin.glowHalo.scale.set(pulseScale, pulseScale, pulseScale);
      (coin.glowHalo.material as THREE.MeshBasicMaterial).opacity = 0.65 + Math.sin(coin.pulsePhase) * 0.2;

      // Gentle floating bob
      coin.mesh.position.y = coin.baseY + Math.sin(time + coin.pulsePhase) * 0.08;

      // Magnet Attraction Physics
      if (magnetActive) {
        const dist = coin.mesh.position.distanceTo(playerPos);
        if (dist < magnetRadius) {
          const dir = new THREE.Vector3().subVectors(playerPos, coin.mesh.position).normalize();
          coin.mesh.position.addScaledVector(dir, delta * 32);
        }
      }

      // Cleanup coins passed far behind
      if (coin.mesh.position.z < playerZ - 15) {
        this.scene.remove(coin.mesh);
        this.coins.splice(i, 1);
      }
    }

    // 2. Animate Power-Ups
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const p = this.powerUps[i];
      if (p.isCollected) {
        this.scene.remove(p.mesh);
        this.powerUps.splice(i, 1);
        continue;
      }

      p.mesh.rotation.y += delta * 3;
      p.mesh.position.y = p.y + Math.sin(time * 2) * 0.15;

      const pPulse = 1.0 + Math.sin(time * 3) * 0.25;
      p.glowHalo.scale.set(pPulse, pPulse, pPulse);

      if (p.mesh.position.z < playerZ - 15) {
        this.scene.remove(p.mesh);
        this.powerUps.splice(i, 1);
      }
    }

    // 3. Update moving obstacles (oncoming traffic) & cleanup behind player
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      if (obs.isMoving && !obs.isCollided) {
        obs.z -= obs.moveSpeed * delta;
        obs.mesh.position.z = obs.z;
      }
      if (obs.mesh.position.z < playerZ - 20) {
        this.scene.remove(obs.mesh);
        this.obstacles.splice(i, 1);
      }
    }
  }

  public clearAll() {
    this.obstacles.forEach(o => this.scene.remove(o.mesh));
    this.coins.forEach(c => this.scene.remove(c.mesh));
    this.powerUps.forEach(p => this.scene.remove(p.mesh));
    this.obstacles = [];
    this.coins = [];
    this.powerUps = [];
  }
}
