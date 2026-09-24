/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { PlayerCustomization, CharacterAppearance, DEFAULT_CHARACTER_PROFILE, BiomeType, WeatherType } from '../types';
import { SHOP_ITEMS } from '../data/items';
import { CharacterTextureManager } from './characterTextures';
import { DynamicSkeletalRig, ArticulatedHandRig } from './skeletalRig';

export const CHARACTER_DESIGN_VERSION = 2;

export type CharacterAction =
  | 'IDLE'
  | 'RUN'
  | 'FAST_RUN'
  | 'JUMP'
  | 'FALL'
  | 'LAND'
  | 'SLIDE'
  | 'LANE_LEFT'
  | 'LANE_RIGHT'
  | 'DODGE'
  | 'HIT'
  | 'STUMBLE'
  | 'DEATH'
  | 'CRASH';

/**
 * Procedural Texture & PBR Material Generator for Bassam
 */
export class HighPrecisionTextureEngine {
  /**
   * Athletic Runner Techwear Hoodie Texture with Baghdad Heritage & Iraqi Flag Badge
   */
  public static createHoodieTexture(primaryColor: string, secondaryColor: string): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Base athletic techwear fabric
    const baseGrad = ctx.createLinearGradient(0, 0, 0, 512);
    baseGrad.addColorStop(0, primaryColor);
    baseGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, 512, 512);

    // Subtle technical grid pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 512; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }

    // Bold Aerodynamic Chevron Speed Stripes across chest
    ctx.strokeStyle = secondaryColor;
    ctx.lineWidth = 14;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(40, 110);
    ctx.lineTo(256, 175);
    ctx.lineTo(472, 110);
    ctx.stroke();

    // Luminescent neon cyan accent line
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(40, 126);
    ctx.lineTo(256, 191);
    ctx.lineTo(472, 126);
    ctx.stroke();

    // Center Gold Zipper Track
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(250, 160, 12, 352);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    for (let z = 165; z < 505; z += 8) {
      ctx.beginPath();
      ctx.moveTo(251, z);
      ctx.lineTo(261, z);
      ctx.stroke();
    }

    // Gold Zipper Slider
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(248, 200, 16, 22);

    // Iraqi National Flag Ribbon Badge (Red, White, Black with Green Takbir)
    const ribbonY = 190;
    ctx.fillStyle = '#ef4444'; // Red
    ctx.fillRect(65, ribbonY, 75, 8);
    ctx.fillStyle = '#ffffff'; // White
    ctx.fillRect(65, ribbonY + 8, 75, 8);
    ctx.fillStyle = '#0f172a'; // Black
    ctx.fillRect(65, ribbonY + 16, 75, 8);

    // Green Takbir Arabic calligraphy accent in center
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 7px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('الله أكبر', 102, ribbonY + 14);

    // Golden 8-pointed Mesopotamian Star of Ishtar Emblem
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(410, 200, 14, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  /**
   * Expressive, High-Detail Stylized Iris Texture (256x256)
   * Featuring multi-tone amber hazel depth, glowing crescent reflex, and sparkling catchlights
   */
  public static createIrisTexture(hexColor: string): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    const cx = 128;
    const cy = 128;
    const r = 120;

    // 1. Outer Limbal Ring (Bold, crisp boundary)
    ctx.fillStyle = '#140a04';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // 2. Multi-tone Iris Gradient
    const isBlueIris = hexColor.toLowerCase().includes('0ea5e9') || hexColor.toLowerCase().includes('38bdf8') || hexColor.toLowerCase().includes('0284c7');
    const irisGrad = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
    if (isBlueIris) {
      irisGrad.addColorStop(0, '#082f49'); // Deep shadow
      irisGrad.addColorStop(0.35, '#0369a1');
      irisGrad.addColorStop(0.70, hexColor);
      irisGrad.addColorStop(1.0, '#38bdf8'); // Glowing azure/cyan
    } else {
      irisGrad.addColorStop(0, '#1a0d05');
      irisGrad.addColorStop(0.35, '#3b1c0a');
      irisGrad.addColorStop(0.70, hexColor);
      irisGrad.addColorStop(1.0, '#f59e0b');
    }
    ctx.fillStyle = irisGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r - 6, 0, Math.PI * 2);
    ctx.fill();

    // 3. Radiant Iris Striae (Intricate rays of warm light)
    ctx.save();
    ctx.translate(cx, cy);
    for (let angle = 0; angle < Math.PI * 2; angle += 0.12) {
      ctx.strokeStyle = isBlueIris 
        ? (Math.sin(angle * 3) > 0 ? 'rgba(125, 211, 252, 0.50)' : 'rgba(56, 189, 248, 0.40)')
        : (Math.sin(angle * 3) > 0 ? 'rgba(251, 191, 36, 0.45)' : 'rgba(217, 119, 6, 0.35)');
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * 32, Math.sin(angle) * 32);
      ctx.lineTo(Math.cos(angle) * (r - 10), Math.sin(angle) * (r - 10));
      ctx.stroke();
    }
    ctx.restore();

    // 4. Luminous Lower Crescent Reflection (Signature animated movie eye glow)
    const crescentGrad = ctx.createRadialGradient(cx, cy + 50, 10, cx, cy + 50, 75);
    if (isBlueIris) {
      crescentGrad.addColorStop(0, 'rgba(186, 230, 253, 0.90)');
      crescentGrad.addColorStop(0.55, 'rgba(56, 189, 248, 0.60)');
      crescentGrad.addColorStop(1, 'transparent');
    } else {
      crescentGrad.addColorStop(0, 'rgba(254, 240, 138, 0.85)');
      crescentGrad.addColorStop(0.55, 'rgba(245, 158, 11, 0.50)');
      crescentGrad.addColorStop(1, 'transparent');
    }
    ctx.fillStyle = crescentGrad;
    ctx.beginPath();
    ctx.arc(cx, cy + 25, 75, 0.15 * Math.PI, 0.85 * Math.PI, false);
    ctx.fill();

    // 5. Deep Obsidian Pupil
    const pupilGrad = ctx.createRadialGradient(cx, cy - 8, 4, cx, cy, 46);
    pupilGrad.addColorStop(0, '#0a0502');
    pupilGrad.addColorStop(1, '#180c05');
    ctx.fillStyle = pupilGrad;
    ctx.beginPath();
    ctx.arc(cx, cy - 4, 46, 0, Math.PI * 2);
    ctx.fill();

    // 6. Sparkling Glossy Specular Catchlights (Animated Reflections)
    // Primary large glossy catchlight (Top-Left)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(cx - 36, cy - 36, 26, 22, -Math.PI * 0.25, 0, Math.PI * 2);
    ctx.fill();

    // Secondary smaller catchlight (Bottom-Right)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.arc(cx + 42, cy + 38, 14, 0, Math.PI * 2);
    ctx.fill();

    // Tiny diamond glint (Center-Right)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.beginPath();
    ctx.arc(cx + 25, cy - 20, 6, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }
}

/**
 * Facial Rig Components
 */
export interface FacialRig {
  faceGroup: THREE.Group;
  leftEyeGroup: THREE.Group;
  rightEyeGroup: THREE.Group;
  leftUpperLid: THREE.Mesh;
  rightUpperLid: THREE.Mesh;
  leftEyelash: THREE.Mesh;
  rightEyelash: THREE.Mesh;
  leftEyebrowBone: THREE.Group;
  rightEyebrowBone: THREE.Group;
  noseGroup: THREE.Group;
  mouthGroup: THREE.Group;
  lipsMesh: THREE.Mesh;
  teethMesh: THREE.Mesh;
}

/**
 * ============================================================================
 * BAGHDAD RUNNER «بسام» (BASSAM) - SUBWAY SURFERS STYLE 3D CHARACTER
 * Fully sculpted realistic/stylized body, modern street haircut, expressive face,
 * chunky runner sneakers, and fluid biomechanics with landing rebound physics.
 * ============================================================================
 */
export class BassamCharacter {
  public group: THREE.Group;

  // Character Profile & Identity
  public characterName: string = 'بسام';
  public age: number = 22;
  public appearance: CharacterAppearance = { ...DEFAULT_CHARACTER_PROFILE.appearance };

  // Master Skeletal Hierarchy
  public rootBone: THREE.Group;
  public pelvisBone: THREE.Group;
  public pelvisMesh: THREE.Mesh;
  public spineLowerBone: THREE.Group;
  public chestBone: THREE.Group;
  public chestMesh: THREE.Mesh;
  public neckBone: THREE.Group;
  public headBone: THREE.Group;
  public headMesh: THREE.Mesh;

  // Facial Elements
  public facialRig: FacialRig;
  public lipsMesh: THREE.Mesh;
  public earL: THREE.Group;
  public earR: THREE.Group;
  public hairGroup: THREE.Group;
  public hairFringe: THREE.Group;
  public runnerCapGroup: THREE.Group;
  public drapedHood: THREE.Mesh;
  public drawstringL: THREE.Mesh;
  public drawstringR: THREE.Mesh;
  public kangarooPocket: THREE.Mesh;
  public backpackGroup: THREE.Group;

  // Upper Limbs
  public clavicleLeftBone: THREE.Group;
  public clavicleRightBone: THREE.Group;
  public shoulderLeftBone: THREE.Group;
  public shoulderRightBone: THREE.Group;
  public bicepLeftMesh: THREE.Mesh;
  public bicepRightMesh: THREE.Mesh;
  public elbowLeftBone: THREE.Group;
  public elbowRightBone: THREE.Group;
  public forearmLeftMesh: THREE.Mesh;
  public forearmRightMesh: THREE.Mesh;
  public wristLeftBone: THREE.Group;
  public wristRightBone: THREE.Group;
  public biometricWatch: THREE.Group;

  // Hands Rigs
  public handLeftRig: ArticulatedHandRig;
  public handRightRig: ArticulatedHandRig;

  // Lower Limbs Skeleton
  public hipLeftBone: THREE.Group;
  public hipRightBone: THREE.Group;
  public thighLeftBone: THREE.Group;
  public thighRightBone: THREE.Group;
  public thighLeftMesh: THREE.Mesh;
  public thighRightMesh: THREE.Mesh;
  public kneeLeftBone: THREE.Group;
  public kneeRightBone: THREE.Group;
  public shinLeftBone: THREE.Group;
  public shinRightBone: THREE.Group;
  public ankleLeftBone: THREE.Group;
  public ankleRightBone: THREE.Group;
  public shoeLeftGroup: THREE.Group;
  public shoeRightGroup: THREE.Group;

  // Systems & Managers
  public textureManager: CharacterTextureManager;
  public skeletalRig: DynamicSkeletalRig;

  // Backward Compatibility Aliases
  public leftShoulder: THREE.Group;
  public rightShoulder: THREE.Group;
  public leftArm: THREE.Group;
  public rightArm: THREE.Group;
  public leftForearm: THREE.Group;
  public rightForearm: THREE.Group;
  public leftHand: THREE.Group;
  public rightHand: THREE.Group;
  public leftFingers: THREE.Group;
  public rightFingers: THREE.Group;
  public leftThumb: THREE.Group;
  public rightThumb: THREE.Group;
  public pelvisGroup: THREE.Group;
  public spineGroup: THREE.Group;
  public chestGroup: THREE.Group;
  public neckGroup: THREE.Group;
  public headGroup: THREE.Group;
  public faceGroup: THREE.Group;
  public leftHipJoint: THREE.Group;
  public rightHipJoint: THREE.Group;
  public leftLeg: THREE.Group;
  public rightLeg: THREE.Group;
  public leftKneeJoint: THREE.Group;
  public rightKneeJoint: THREE.Group;
  public leftShinGroup: THREE.Group;
  public rightShinGroup: THREE.Group;
  public leftAnkleJoint: THREE.Group;
  public rightAnkleJoint: THREE.Group;
  public leftShoeGroup: THREE.Group;
  public rightShoeGroup: THREE.Group;

  // Shop & Customization Mounts
  public thobeSkirt: THREE.Mesh;
  public shemaghMesh: THREE.Group | null = null;
  public sunglassesMesh: THREE.Group | null = null;
  public headphonesMesh: THREE.Group | null = null;
  public tacticalMaskMesh: THREE.Group | null = null;
  public scarfMesh: THREE.Group | null = null;
  public undershirtMesh: THREE.Mesh;
  public crossbodyGroup: THREE.Group;

  // PBR Materials
  public skinMat: THREE.MeshStandardMaterial;
  public faceMat: THREE.MeshStandardMaterial;
  public handsMat: THREE.MeshStandardMaterial;
  public eyeIrisMat: THREE.MeshStandardMaterial;
  public hoodieMat: THREE.MeshStandardMaterial;
  public pantsMat: THREE.MeshStandardMaterial;
  public shoeMat: THREE.MeshStandardMaterial;
  public shoeSoleMat: THREE.MeshStandardMaterial;
  public hairMat: THREE.MeshStandardMaterial;
  public capMat: THREE.MeshStandardMaterial;
  public backpackMat: THREE.MeshStandardMaterial;
  public goldTrimMat: THREE.MeshStandardMaterial;
  public undershirtMat: THREE.MeshStandardMaterial;
  public strapMat: THREE.MeshStandardMaterial;
  public gloveMat: THREE.MeshStandardMaterial;
  public cordMat: THREE.MeshStandardMaterial;

  // Power-Up Meshes
  public shieldMesh: THREE.Mesh;
  public magnetAura: THREE.Group;
  public turboJetMesh: THREE.Group;

  // Dust Particle System
  public footstepDustParticles: THREE.Points;
  private footstepPositions: Float32Array;
  private footstepLife: Float32Array;
  private footstepVel: Float32Array;
  private nextDustIdx: number = 0;

  // Kinematic & Animation State
  public currentAction: CharacterAction = 'RUN';
  public laneX: number = 0;
  public targetLaneX: number = 0;
  public isGrounded: boolean = true;
  public jumpY: number = 0;
  public jumpVelocity: number = 0;
  public gravity: number = -38.0;
  public slideTimer: number = 0;
  public slideDuration: number = 0.85;
  public rollAngle: number = 0;
  public stumbleTimer: number = 0;
  public stumbleDuration: number = 0.45;
  public crashTumbleTime: number = 0;
  public laneShiftIntensity: number = 0;

  // Landing Rebound Physics (ارتداد خفيف عند الهبوط من القفز)
  public landingReboundTime: number = 0;
  public readonly landingReboundDuration: number = 0.32; // 320ms spring rebound
  public landingSquash: number = 0;

  // Natural Procedural Timing
  private animTime: number = 0;
  private gaitPhase: number = 0;
  private blinkTimer: number = 0;
  private isBlinking: boolean = false;
  private blinkProgress: number = 0;

  // Hitbox & Physics Bounds
  public hitboxHeight: number = 1.76;
  public hitboxRadius: number = 0.36;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'Bassam_SubwaySurfers_Rig';

    this.textureManager = new CharacterTextureManager();
    this.skeletalRig = new DynamicSkeletalRig();

    // 1. Materials with bright fair Caucasian/Arabic light skin palette requested by user
    const initialSkinColor = this.appearance.skinTone ? new THREE.Color(this.appearance.skinTone) : new THREE.Color(0xf5cbaf);
    this.skinMat = new THREE.MeshStandardMaterial({
      color: initialSkinColor, // بشرة بيضاء نقية مع تورّد طبيعي
      roughness: 0.42,
      metalness: 0.02,
    });

    this.faceMat = this.skinMat;
    this.handsMat = this.skinMat;

    this.eyeIrisMat = new THREE.MeshStandardMaterial({
      map: HighPrecisionTextureEngine.createIrisTexture(this.appearance.eyeColor.hex || '#0ea5e9'),
      roughness: 0.08,
      metalness: 0.05,
    });

    this.hoodieMat = new THREE.MeshStandardMaterial({
      map: this.textureManager.textures.jacketAlbedo,
      roughness: 0.62,
      metalness: 0.06,
    });

    this.pantsMat = new THREE.MeshStandardMaterial({
      map: this.textureManager.textures.joggersAlbedo,
      roughness: 0.68,
      metalness: 0.05,
    });

    this.shoeMat = new THREE.MeshStandardMaterial({
      map: this.textureManager.textures.sneakersAlbedo,
      roughness: 0.40,
      metalness: 0.10,
    });

    this.shoeSoleMat = new THREE.MeshStandardMaterial({
      color: 0xa3e635, // Neon Lime Rubber Sole from reference image
      roughness: 0.35,
      metalness: 0.04,
    });

    this.hairMat = new THREE.MeshStandardMaterial({
      color: 0x5c341b, // Rich warm chestnut brown hair from reference image
      roughness: 0.48,
      metalness: 0.10,
    });

    this.capMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.60,
      metalness: 0.10,
    });

    this.backpackMat = new THREE.MeshStandardMaterial({
      map: this.textureManager.textures.backpackAlbedo,
      roughness: 0.55,
      metalness: 0.10,
    });

    this.goldTrimMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      metalness: 0.85,
      roughness: 0.20,
    });

    this.undershirtMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, // Crisp clean white cotton undershirt
      roughness: 0.72,
      metalness: 0.02,
    });

    this.strapMat = new THREE.MeshStandardMaterial({
      color: 0xd946ef, // Vibrant Magenta Purple crossbody strap
      roughness: 0.48,
      metalness: 0.08,
    });

    this.gloveMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Tactical Charcoal Black fingerless gloves
      roughness: 0.65,
      metalness: 0.10,
    });

    this.cordMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15, // Bright Neon Yellow Drawstring Cords
      roughness: 0.40,
      metalness: 0.10,
    });

    // 2. Build Master Skeletal Structure with Solid Subway Surfers Proportions
    this.rootBone = new THREE.Group();
    this.rootBone.name = 'Root_Bone';
    this.group.add(this.rootBone);

    // Pelvis (Hips) - Solid, well-defined athletic runner hips
    this.pelvisBone = new THREE.Group();
    this.pelvisBone.position.set(0, 0.96, 0);
    this.rootBone.add(this.pelvisBone);

    const pelvisGeo = new THREE.CylinderGeometry(0.185, 0.160, 0.18, 20);
    this.pelvisMesh = new THREE.Mesh(pelvisGeo, this.pantsMat);
    this.pelvisMesh.castShadow = true;
    this.pelvisMesh.receiveShadow = true;
    this.pelvisBone.add(this.pelvisMesh);

    // Layered White Athletic Undershirt Hem (طبقة التيشيرت الأبيض البارزة أسفل الهودي كالصور تماماً)
    const undershirtGeo = new THREE.CylinderGeometry(0.194, 0.188, 0.048, 24);
    this.undershirtMesh = new THREE.Mesh(undershirtGeo, this.undershirtMat);
    this.undershirtMesh.position.set(0, 0.040, 0);
    this.pelvisBone.add(this.undershirtMesh);

    // Ribbed Waistband connecting hoodie and undershirt
    const waistbandGeo = new THREE.CylinderGeometry(0.198, 0.194, 0.042, 22);
    const waistbandMesh = new THREE.Mesh(waistbandGeo, this.hoodieMat);
    waistbandMesh.position.set(0, 0.085, 0);
    this.pelvisBone.add(waistbandMesh);

    // Spine
    this.spineLowerBone = new THREE.Group();
    this.spineLowerBone.position.set(0, 0.10, 0);
    this.pelvisBone.add(this.spineLowerBone);

    // Chest & Athletic Torso - Solid, sculpted Techwear Hoodie
    this.chestBone = new THREE.Group();
    this.chestBone.position.set(0, 0.17, 0);
    this.spineLowerBone.add(this.chestBone);

    const chestGeo = new THREE.CylinderGeometry(0.235, 0.185, 0.32, 22);
    this.chestMesh = new THREE.Mesh(chestGeo, this.hoodieMat);
    this.chestMesh.position.set(0, 0.13, 0);
    this.chestMesh.castShadow = true;
    this.chestMesh.receiveShadow = true;
    this.chestBone.add(this.chestMesh);

    // Smooth Ergonomically Curved Kangaroo Pouch (جيب الكنغر الرياضي المقوس بانسيابية بدون زوايا حادة)
    const pocketGeo = new THREE.CylinderGeometry(0.130, 0.145, 0.13, 20, 1, false, 0, Math.PI);
    pocketGeo.scale(1.0, 0.95, 0.55);
    this.kangarooPocket = new THREE.Mesh(pocketGeo, this.hoodieMat);
    this.kangarooPocket.position.set(0, 0.04, 0.135);
    this.kangarooPocket.castShadow = true;
    this.chestBone.add(this.kangarooPocket);

    // Kangaroo Pocket Side Openings with Smooth Curved Rims
    const pocketRimMat = new THREE.MeshStandardMaterial({
      color: 0x0891b2,
      roughness: 0.55,
    });
    const rimGeo = new THREE.TorusGeometry(0.038, 0.007, 8, 16, Math.PI * 0.7);
    const rimL = new THREE.Mesh(rimGeo, pocketRimMat);
    rimL.rotation.y = -Math.PI * 0.35;
    rimL.position.set(-0.11, 0.03, 0.12);
    this.chestBone.add(rimL);

    const rimR = new THREE.Mesh(rimGeo, pocketRimMat);
    rimR.rotation.y = Math.PI * 0.35;
    rimR.position.set(0.11, 0.03, 0.12);
    this.chestBone.add(rimR);

    // Raised Ribbed Hoodie Collar around the neck
    const collarGeo = new THREE.TorusGeometry(0.105, 0.032, 14, 24);
    const collarMesh = new THREE.Mesh(collarGeo, this.hoodieMat);
    collarMesh.rotation.x = Math.PI * 0.5;
    collarMesh.position.set(0, 0.28, 0);
    this.chestBone.add(collarMesh);

    // Draped Hoodie on the upper back
    const hoodGeo = new THREE.TorusGeometry(0.145, 0.052, 14, 24);
    this.drapedHood = new THREE.Mesh(hoodGeo, this.hoodieMat);
    this.drapedHood.rotation.x = Math.PI * 0.42;
    this.drapedHood.position.set(0, 0.25, -0.055);
    this.chestBone.add(this.drapedHood);

    // Bright Neon Yellow Hoodie Drawstrings with Golden Metallic Aglets (from reference image)
    const cordGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.19, 10);
    this.drawstringL = new THREE.Mesh(cordGeo, this.cordMat);
    this.drawstringL.position.set(-0.055, 0.17, 0.14);
    this.chestBone.add(this.drawstringL);

    this.drawstringR = new THREE.Mesh(cordGeo, this.cordMat);
    this.drawstringR.position.set(0.055, 0.17, 0.14);
    this.chestBone.add(this.drawstringR);

    // Aglet tips
    const agletGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.025, 10);
    const agletL = new THREE.Mesh(agletGeo, this.goldTrimMat);
    agletL.position.set(0, -0.095, 0);
    this.drawstringL.add(agletL);

    const agletR = new THREE.Mesh(agletGeo, this.goldTrimMat);
    agletR.position.set(0, -0.095, 0);
    this.drawstringR.add(agletR);

    // Crossbody Runner Messenger Sling Strap & Golden Clasp (حزام الكروس المائل والميدالية الذهبية من الصورة)
    this.crossbodyGroup = this.createCrossbodyStrapAndBag();
    this.chestBone.add(this.crossbodyGroup);

    // Urban Runner Backpack / Back Pack Mount
    this.backpackGroup = this.createBackpack();
    this.chestBone.add(this.backpackGroup);

    // Neck
    this.neckBone = new THREE.Group();
    this.neckBone.position.set(0, 0.29, 0);
    this.chestBone.add(this.neckBone);

    const neckGeo = new THREE.CylinderGeometry(0.068, 0.078, 0.12, 16);
    const neckMesh = new THREE.Mesh(neckGeo, this.skinMat);
    neckMesh.position.set(0, 0.06, -0.004);
    neckMesh.castShadow = true;
    this.neckBone.add(neckMesh);

    // Head Bone
    this.headBone = new THREE.Group();
    this.headBone.position.set(0, 0.11, 0);
    this.neckBone.add(this.headBone);

    // 1. Sculpted Stylized Human Head Geometry (Cranium, Forehead, Jawline, Cheeks & Chin)
    const craniumGeo = new THREE.SphereGeometry(0.122, 28, 24);
    craniumGeo.scale(0.96, 1.08, 1.02);
    this.headMesh = new THREE.Mesh(craniumGeo, this.skinMat);
    this.headMesh.position.set(0, 0.12, -0.005);
    this.headMesh.castShadow = true;
    this.headBone.add(this.headMesh);

    // Frontal Forehead & Brow Contour (Natural youthful forehead line)
    const foreheadGeo = new THREE.SphereGeometry(0.082, 18, 16);
    foreheadGeo.scale(1.10, 0.72, 0.85);
    const foreheadMesh = new THREE.Mesh(foreheadGeo, this.skinMat);
    foreheadMesh.position.set(0, 0.165, 0.046);
    this.headBone.add(foreheadMesh);

    // Sculpted Mandibular Jawline (Angled natural jaw contour connecting below ears)
    const jawLGeo = new THREE.CylinderGeometry(0.024, 0.020, 0.10, 12);
    jawLGeo.rotateZ(0.38);
    jawLGeo.rotateX(0.18);
    const jawL = new THREE.Mesh(jawLGeo, this.skinMat);
    jawL.position.set(-0.062, 0.045, 0.018);
    this.headBone.add(jawL);

    const jawRGeo = new THREE.CylinderGeometry(0.024, 0.020, 0.10, 12);
    jawRGeo.rotateZ(-0.38);
    jawRGeo.rotateX(0.18);
    const jawR = new THREE.Mesh(jawRGeo, this.skinMat);
    jawR.position.set(0.062, 0.045, 0.018);
    this.headBone.add(jawR);

    // Zygomatic Cheekbones (Defined, handsome athletic Arab facial contours)
    const cheekGeo = new THREE.SphereGeometry(0.034, 14, 14);
    cheekGeo.scale(1.0, 0.85, 0.95);
    const cheekL = new THREE.Mesh(cheekGeo, this.skinMat);
    cheekL.position.set(-0.062, 0.068, 0.044);
    const cheekR = new THREE.Mesh(cheekGeo, this.skinMat);
    cheekR.position.set(0.062, 0.068, 0.044);
    this.headBone.add(cheekL, cheekR);

    // Sculpted Athletic Chin with clean rounded curvature
    const chinGeo = new THREE.SphereGeometry(0.040, 18, 18);
    chinGeo.scale(0.92, 0.72, 0.98);
    const chinMesh = new THREE.Mesh(chinGeo, this.skinMat);
    chinMesh.position.set(0, 0.018, 0.060);
    this.headBone.add(chinMesh);

    // 2. Sculpted Stylized Ears
    this.earL = this.createStylizedEar(-1);
    this.earR = this.createStylizedEar(1);
    this.headBone.add(this.earL, this.earR);

    // 3. Modern Streetwear Haircut & Optional Subway Cap
    const { hairGroup, hairFringe, runnerCapGroup } = this.createModernStreetHair();
    this.hairGroup = hairGroup;
    this.hairFringe = hairFringe;
    this.runnerCapGroup = runnerCapGroup;
    this.headBone.add(this.hairGroup);

    // 4. Expressive Stylized Facial Rig (Eyes, Nose, Mouth, Teeth)
    this.facialRig = this.createStylizedFacialRig();
    this.headBone.add(this.facialRig.faceGroup);
    this.lipsMesh = this.facialRig.lipsMesh;

    // 5. Stylized Wearable Accessories (Shemagh, Sunglasses, Headphones, Scarf)
    this.shemaghMesh = this.createShemaghMesh();
    this.headBone.add(this.shemaghMesh);

    this.sunglassesMesh = this.createSunglassesMesh();
    this.headBone.add(this.sunglassesMesh);

    this.headphonesMesh = this.createHeadphonesMesh();
    this.headBone.add(this.headphonesMesh);

    this.scarfMesh = this.createRoyalScarfMesh();
    this.neckBone.add(this.scarfMesh);

    // Upper Limbs - Solid Athletic Sleeves & Anatomical Hands
    this.clavicleLeftBone = new THREE.Group();
    this.clavicleLeftBone.position.set(-0.16, 0.25, 0);
    this.chestBone.add(this.clavicleLeftBone);

    this.clavicleRightBone = new THREE.Group();
    this.clavicleRightBone.position.set(0.16, 0.25, 0);
    this.chestBone.add(this.clavicleRightBone);

    const leftArmComponents = this.createArmChain(-1);
    this.shoulderLeftBone = leftArmComponents.shoulderBone;
    this.bicepLeftMesh = leftArmComponents.bicepMesh;
    this.elbowLeftBone = leftArmComponents.elbowBone;
    this.forearmLeftMesh = leftArmComponents.forearmMesh;
    this.wristLeftBone = leftArmComponents.wristBone;
    this.handLeftRig = leftArmComponents.handRig;
    this.biometricWatch = leftArmComponents.watchGroup;
    this.clavicleLeftBone.add(this.shoulderLeftBone);

    const rightArmComponents = this.createArmChain(1);
    this.shoulderRightBone = rightArmComponents.shoulderBone;
    this.bicepRightMesh = rightArmComponents.bicepMesh;
    this.elbowRightBone = rightArmComponents.elbowBone;
    this.forearmRightMesh = rightArmComponents.forearmMesh;
    this.wristRightBone = rightArmComponents.wristBone;
    this.handRightRig = rightArmComponents.handRig;
    this.clavicleRightBone.add(this.shoulderRightBone);

    // Lower Limbs - Athletic Joggers & Chunky Subway Sneakers
    const leftLegComponents = this.createLegChain(-1);
    this.hipLeftBone = leftLegComponents.hipBone;
    this.thighLeftMesh = leftLegComponents.thighMesh;
    this.kneeLeftBone = leftLegComponents.kneeBone;
    this.shinLeftBone = leftLegComponents.shinBone;
    this.ankleLeftBone = leftLegComponents.ankleBone;
    this.shoeLeftGroup = leftLegComponents.shoeGroup;
    this.pelvisBone.add(this.hipLeftBone);

    const rightLegComponents = this.createLegChain(1);
    this.hipRightBone = rightLegComponents.hipBone;
    this.thighRightMesh = rightLegComponents.thighMesh;
    this.kneeRightBone = rightLegComponents.kneeBone;
    this.shinRightBone = rightLegComponents.shinBone;
    this.ankleRightBone = rightLegComponents.ankleBone;
    this.shoeRightGroup = rightLegComponents.shoeGroup;
    this.pelvisBone.add(this.hipRightBone);

    // Arabic Thobe Skirt (Hidden by default)
    const thobeGeo = new THREE.CylinderGeometry(0.18, 0.36, 0.92, 18, 1, true);
    const thobeMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.85,
      side: THREE.DoubleSide,
    });
    this.thobeSkirt = new THREE.Mesh(thobeGeo, thobeMat);
    this.thobeSkirt.position.set(0, -0.45, 0);
    this.thobeSkirt.visible = false;
    this.pelvisBone.add(this.thobeSkirt);

    // Backward compatibility aliases
    this.leftShoulder = this.clavicleLeftBone;
    this.rightShoulder = this.clavicleRightBone;
    this.leftArm = this.shoulderLeftBone;
    this.rightArm = this.shoulderRightBone;
    this.leftForearm = this.elbowLeftBone;
    this.rightForearm = this.elbowRightBone;
    this.leftHand = this.wristLeftBone;
    this.rightHand = this.wristRightBone;
    this.leftFingers = this.handLeftRig.index.mcp;
    this.rightFingers = this.handRightRig.index.mcp;
    this.leftThumb = this.handLeftRig.thumb.cmc;
    this.rightThumb = this.handRightRig.thumb.cmc;

    this.pelvisGroup = this.pelvisBone;
    this.spineGroup = this.spineLowerBone;
    this.chestGroup = this.chestBone;
    this.neckGroup = this.neckBone;
    this.headGroup = this.headBone;
    this.faceGroup = this.facialRig.faceGroup;

    this.leftHipJoint = this.hipLeftBone;
    this.rightHipJoint = this.hipRightBone;
    this.leftLeg = this.hipLeftBone;
    this.rightLeg = this.hipRightBone;
    this.leftKneeJoint = this.kneeLeftBone;
    this.rightKneeJoint = this.kneeRightBone;
    this.leftShinGroup = this.shinLeftBone;
    this.rightShinGroup = this.shinRightBone;
    this.leftAnkleJoint = this.ankleLeftBone;
    this.rightAnkleJoint = this.ankleRightBone;
    this.leftShoeGroup = this.shoeLeftGroup;
    this.rightShoeGroup = this.shoeRightGroup;

    this.thighLeftBone = this.hipLeftBone;
    this.thighRightBone = this.hipRightBone;

    // Power-Up Indicators
    this.shieldMesh = this.createShieldMesh();
    this.rootBone.add(this.shieldMesh);

    this.magnetAura = this.createMagnetAura();
    this.rootBone.add(this.magnetAura);

    this.turboJetMesh = this.createTurboJetMesh();
    this.rootBone.add(this.turboJetMesh);

    // Dust Particles (Footsteps & Landing Rebounds)
    const particleCount = 50;
    const pGeo = new THREE.BufferGeometry();
    this.footstepPositions = new Float32Array(particleCount * 3);
    this.footstepLife = new Float32Array(particleCount);
    this.footstepVel = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      this.footstepLife[i] = 0;
      this.footstepPositions[i * 3 + 1] = -100;
    }

    pGeo.setAttribute('position', new THREE.BufferAttribute(this.footstepPositions, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0xd4a373,
      size: 0.16,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    });
    this.footstepDustParticles = new THREE.Points(pGeo, pMat);
    this.group.add(this.footstepDustParticles);

    this.initializeCharacter();
  }

  /**
   * Anatomical Stylized Small Neat Ear (أذن صغيرة متناسقة وأنيقة)
   */
  private createStylizedEar(side: number): THREE.Group {
    const ear = new THREE.Group();
    // Scaled down to neat, proportional ear sizing (0.75 ratio)
    ear.position.set(side * 0.120, 0.115, -0.010);
    ear.rotation.y = side * 0.18; // 10-degree natural subtle tilt

    // Outer Helix rim (neat, tight curve)
    const earGeo = new THREE.TorusGeometry(0.017, 0.0042, 8, 16, Math.PI * 1.30);
    const earMesh = new THREE.Mesh(earGeo, this.skinMat);
    earMesh.rotation.z = side * 0.18;
    ear.add(earMesh);

    // Inner Antihelix ridge & fossa
    const innerGeo = new THREE.TorusGeometry(0.0095, 0.0030, 6, 12, Math.PI * 1.05);
    const innerMesh = new THREE.Mesh(innerGeo, this.skinMat);
    innerMesh.position.set(side * -0.003, 0.0015, 0.0015);
    innerMesh.rotation.z = side * 0.22;
    ear.add(innerMesh);

    // Delicate Tragus
    const tragusGeo = new THREE.SphereGeometry(0.0042, 8, 8);
    tragusGeo.scale(0.8, 1.1, 0.8);
    const tragusMesh = new THREE.Mesh(tragusGeo, this.skinMat);
    tragusMesh.position.set(side * 0.0045, -0.003, 0.005);
    ear.add(tragusMesh);

    // Soft rounded small Lobule (شحمة أذن صغيرة وجميلة)
    const lobeGeo = new THREE.SphereGeometry(0.0062, 8, 8);
    lobeGeo.scale(0.80, 1.15, 0.70);
    const lobeMesh = new THREE.Mesh(lobeGeo, this.skinMat);
    lobeMesh.position.set(0, -0.014, 0);
    ear.add(lobeMesh);

    return ear;
  }

  /**
   * Modern Streetwear Urban Haircut with Dynamic Fringe & Optional Runner Cap
   */
  private createModernStreetHair(): {
    hairGroup: THREE.Group;
    hairFringe: THREE.Group;
    runnerCapGroup: THREE.Group;
  } {
    const hairGroup = new THREE.Group();
    hairGroup.position.set(0, 0.13, -0.01);

    // Main Scalp Base with Clean Tapered Fade
    const scalpGeo = new THREE.SphereGeometry(0.134, 22, 22, 0, Math.PI * 2, 0, Math.PI * 0.64);
    scalpGeo.scale(0.98, 1.05, 1.08);
    const scalpMesh = new THREE.Mesh(scalpGeo, this.hairMat);
    scalpMesh.position.set(0, 0.026, 0);
    hairGroup.add(scalpMesh);

    // Volumetric Sculpted Crown Locks (Modern textured fade top with distinctive layered styling)
    const crownGeo = new THREE.SphereGeometry(0.132, 20, 20);
    crownGeo.scale(0.96, 0.85, 1.15);
    const crownMesh = new THREE.Mesh(crownGeo, this.hairMat);
    crownMesh.position.set(0, 0.105, 0.015);
    crownMesh.castShadow = true;
    hairGroup.add(crownMesh);

    // Iconic Volumetric Front Wave Quiff (تموج الشعر الأمامي الكثيف المرفوع والمنحني لليمين كالصور تماماً)
    const waveGeo = new THREE.TorusGeometry(0.065, 0.024, 12, 20, Math.PI * 0.85);
    waveGeo.scale(1.2, 0.8, 1.4);
    const waveMesh = new THREE.Mesh(waveGeo, this.hairMat);
    waveMesh.position.set(0.015, 0.125, 0.085);
    waveMesh.rotation.x = Math.PI * 0.28;
    waveMesh.rotation.y = -Math.PI * 0.15;
    waveMesh.rotation.z = -0.35;
    waveMesh.castShadow = true;
    hairGroup.add(waveMesh);

    // Dynamic Swept Hair Locks across the crown (Rich textured locks)
    const lockDefs = [
      { x: -0.052, y: 0.13, z: 0.06, scale: 0.040, rotZ: 0.28 },
      { x: -0.024, y: 0.145, z: 0.075, scale: 0.046, rotZ: 0.12 },
      { x: 0.005, y: 0.150, z: 0.080, scale: 0.048, rotZ: -0.05 },
      { x: 0.030, y: 0.142, z: 0.065, scale: 0.044, rotZ: -0.18 },
      { x: 0.058, y: 0.125, z: 0.050, scale: 0.038, rotZ: -0.34 },
    ];

    lockDefs.forEach((ld) => {
      const lockGeo = new THREE.ConeGeometry(ld.scale, ld.scale * 2.3, 8);
      lockGeo.rotateX(Math.PI * 0.35);
      lockGeo.rotateZ(ld.rotZ);
      const lock = new THREE.Mesh(lockGeo, this.hairMat);
      lock.position.set(ld.x, ld.y, ld.z);
      lock.castShadow = true;
      hairGroup.add(lock);
    });

    // Sideburns framing the jaw
    const createSideburn = (side: number) => {
      const sbGeo = new THREE.ConeGeometry(0.016, 0.075, 6);
      sbGeo.rotateZ(side * -0.25);
      const sbMesh = new THREE.Mesh(sbGeo, this.hairMat);
      sbMesh.position.set(side * 0.115, -0.015, 0.048);
      sbMesh.rotation.x = 0.20;
      return sbMesh;
    };
    hairGroup.add(createSideburn(-1), createSideburn(1));

    // Dynamic Front Fringe (Sways with wind & running strides)
    const hairFringe = new THREE.Group();
    hairFringe.position.set(0, 0.090, 0.115);

    const fringeStrands = [
      { x: -0.052, len: 0.070, angle: 0.20, z: 0.002 },
      { x: -0.028, len: 0.084, angle: 0.09, z: 0.010 },
      { x: -0.005, len: 0.092, angle: -0.05, z: 0.015 },
      { x: 0.020, len: 0.086, angle: -0.14, z: 0.012 },
      { x: 0.045, len: 0.072, angle: -0.24, z: 0.004 },
    ];

    fringeStrands.forEach((cfg) => {
      const strandGroup = new THREE.Group();
      strandGroup.position.set(cfg.x, 0, cfg.z);

      const sGeo = new THREE.ConeGeometry(0.017, cfg.len, 8);
      sGeo.rotateX(Math.PI * 0.52);
      sGeo.rotateZ(cfg.angle);
      const sMesh = new THREE.Mesh(sGeo, this.hairMat);
      sMesh.position.set(0, -cfg.len * 0.25, 0.012);
      sMesh.castShadow = true;
      strandGroup.add(sMesh);

      hairFringe.add(strandGroup);
    });
    hairGroup.add(hairFringe);

    // =========================================================================
    // LAYERED SCULPTED REAR LOCKS (Distinctive silhouette from Behind-the-Back camera!)
    // =========================================================================
    const rearLocks = [
      // Top row (occipital crown transition)
      { x: 0, y: 0.095, z: -0.126, rX: 0.040, rY: 0.090, rotX: -0.48, rotZ: 0 },
      { x: -0.046, y: 0.090, z: -0.118, rX: 0.034, rY: 0.082, rotX: -0.42, rotZ: 0.22 },
      { x: 0.046, y: 0.090, z: -0.118, rX: 0.034, rY: 0.082, rotX: -0.42, rotZ: -0.22 },
      // Mid row
      { x: -0.065, y: 0.045, z: -0.098, rX: 0.030, rY: 0.075, rotX: -0.35, rotZ: 0.28 },
      { x: 0.065, y: 0.045, z: -0.098, rX: 0.030, rY: 0.075, rotX: -0.35, rotZ: -0.28 },
      { x: -0.026, y: 0.035, z: -0.116, rX: 0.032, rY: 0.072, rotX: -0.36, rotZ: 0.12 },
      { x: 0.026, y: 0.035, z: -0.116, rX: 0.032, rY: 0.072, rotX: -0.36, rotZ: -0.12 },
      // Lower row (nape taper points)
      { x: -0.016, y: -0.015, z: -0.104, rX: 0.024, rY: 0.060, rotX: -0.24, rotZ: 0.08 },
      { x: 0.016, y: -0.015, z: -0.104, rX: 0.024, rY: 0.060, rotX: -0.24, rotZ: -0.08 },
      { x: 0, y: -0.025, z: -0.100, rX: 0.022, rY: 0.052, rotX: -0.20, rotZ: 0 },
    ];

    rearLocks.forEach((rl) => {
      const lockGeo = new THREE.ConeGeometry(rl.rX, rl.rY, 8);
      lockGeo.rotateX(rl.rotX);
      if (rl.rotZ) lockGeo.rotateZ(rl.rotZ);
      const lock = new THREE.Mesh(lockGeo, this.hairMat);
      lock.position.set(rl.x, rl.y, rl.z);
      lock.castShadow = true;
      hairGroup.add(lock);
    });

    // Modern Runner Baseball Cap (Optional accessory toggleable in shop)
    const runnerCapGroup = new THREE.Group();
    runnerCapGroup.position.set(0, 0.06, 0);

    const capDomeGeo = new THREE.SphereGeometry(0.138, 18, 18, 0, Math.PI * 2, 0, Math.PI * 0.52);
    capDomeGeo.scale(0.98, 1.02, 1.05);
    const capDome = new THREE.Mesh(capDomeGeo, this.capMat);
    capDome.castShadow = true;
    runnerCapGroup.add(capDome);

    // Flat/Curved Visor pointing backward (Signature Jake/Subway Surfers look)
    const visorGeo = new THREE.BoxGeometry(0.16, 0.014, 0.11);
    const visor = new THREE.Mesh(visorGeo, this.capMat);
    visor.position.set(0, 0.02, -0.14);
    visor.rotation.x = -0.18;
    visor.castShadow = true;
    runnerCapGroup.add(visor);

    // Snapback sizing strap on back
    const strapGeo = new THREE.CylinderGeometry(0.135, 0.135, 0.022, 16, 1, true, -Math.PI * 0.35, Math.PI * 0.7);
    const strap = new THREE.Mesh(strapGeo, this.goldTrimMat);
    strap.position.set(0, -0.01, 0.02);
    runnerCapGroup.add(strap);

    // Distinctive hair is shown openly as requested by user; cap can be toggled via shop/accessories
    runnerCapGroup.visible = false;
    hairGroup.add(runnerCapGroup);

    return { hairGroup, hairFringe, runnerCapGroup };
  }

  /**
   * Expressive Stylized Facial Rig (Eyes, Eyelids, Eyelashes, Eyebrows, Nose, Mouth, Teeth)
   */
  private createStylizedFacialRig(): FacialRig {
    const faceGroup = new THREE.Group();
    faceGroup.position.set(0, 0.114, 0.108);

    // =========================================================================
    // 1. EXPRESSIVE STYLIZED EYES
    // =========================================================================
    const leftEyeGroup = new THREE.Group();
    leftEyeGroup.position.set(-0.044, 0.034, 0);
    faceGroup.add(leftEyeGroup);

    const rightEyeGroup = new THREE.Group();
    rightEyeGroup.position.set(0.044, 0.034, 0);
    faceGroup.add(rightEyeGroup);

    // Sclera with soft ambient shading
    const scleraGeo = new THREE.SphereGeometry(0.025, 18, 18);
    scleraGeo.scale(1.02, 0.95, 0.94);
    const scleraMat = new THREE.MeshStandardMaterial({
      color: 0xfcfcfc,
      roughness: 0.12,
      metalness: 0.02,
    });

    const eyeL = new THREE.Mesh(scleraGeo, scleraMat);
    const eyeR = new THREE.Mesh(scleraGeo, scleraMat);
    leftEyeGroup.add(eyeL);
    rightEyeGroup.add(eyeR);

    // Vibrant High-Res Irises
    const irisGeo = new THREE.CircleGeometry(0.016, 24);
    const irisL = new THREE.Mesh(irisGeo, this.eyeIrisMat);
    irisL.position.set(0, 0, 0.023);
    leftEyeGroup.add(irisL);

    const irisR = new THREE.Mesh(irisGeo, this.eyeIrisMat);
    irisR.position.set(0, 0, 0.023);
    rightEyeGroup.add(irisR);

    // Smooth Eyelids for natural organic blinking
    const lidGeo = new THREE.SphereGeometry(0.026, 16, 14, 0, Math.PI * 2, 0, Math.PI * 0.50);
    const leftUpperLid = new THREE.Mesh(lidGeo, this.skinMat);
    leftUpperLid.rotation.x = -Math.PI * 0.5;
    leftEyeGroup.add(leftUpperLid);

    const rightUpperLid = new THREE.Mesh(lidGeo, this.skinMat);
    rightUpperLid.rotation.x = -Math.PI * 0.5;
    rightEyeGroup.add(rightUpperLid);

    // Upper Eyelash / Eyeliner Wing
    const lashMat = new THREE.MeshBasicMaterial({ color: 0x140e0a });
    const lashGeo = new THREE.TorusGeometry(0.025, 0.0030, 6, 20, Math.PI * 0.90);

    const leftEyelash = new THREE.Mesh(lashGeo, lashMat);
    leftEyelash.rotation.x = Math.PI * 0.5;
    leftEyelash.rotation.z = -0.15;
    leftUpperLid.add(leftEyelash);

    const rightEyelash = new THREE.Mesh(lashGeo, lashMat);
    rightEyelash.rotation.x = Math.PI * 0.5;
    rightEyelash.rotation.z = -0.15;
    rightUpperLid.add(rightEyelash);

    // Stylized Eyebrows (Heroic, confident, naturally arched curve - ZERO BOXES)
    const leftEyebrowBone = new THREE.Group();
    leftEyebrowBone.position.set(-0.044, 0.062, 0.020);
    faceGroup.add(leftEyebrowBone);

    const rightEyebrowBone = new THREE.Group();
    rightEyebrowBone.position.set(0.044, 0.062, 0.020);
    faceGroup.add(rightEyebrowBone);

    // Smooth Curved Expressive Eyebrow Arc (قوس حاجب ناعم ومنحني طبيعي ثلاثي الأبعاد)
    const browGeo = new THREE.TorusGeometry(0.038, 0.0055, 8, 18, Math.PI * 0.44);
    browGeo.scale(1.25, 0.65, 0.9);
    const browMeshL = new THREE.Mesh(browGeo, this.hairMat);
    browMeshL.rotation.z = 0.40;
    browMeshL.rotation.x = 0.18;
    browMeshL.rotation.y = -0.22;
    leftEyebrowBone.add(browMeshL);

    const browMeshR = new THREE.Mesh(browGeo, this.hairMat);
    browMeshR.rotation.z = -0.40;
    browMeshR.rotation.x = 0.18;
    browMeshR.rotation.y = 0.22;
    rightEyebrowBone.add(browMeshR);

    // =========================================================================
    // 2. REFINED STYLIZED NOSE
    // =========================================================================
    const noseGroup = new THREE.Group();
    noseGroup.position.set(0, 0.010, 0.030);
    faceGroup.add(noseGroup);

    // Sculpted nasal bridge
    const bridgeGeo = new THREE.CylinderGeometry(0.006, 0.009, 0.036, 10);
    bridgeGeo.rotateX(Math.PI * 0.18);
    const bridgeMesh = new THREE.Mesh(bridgeGeo, this.skinMat);
    bridgeMesh.position.set(0, 0.009, 0.004);
    noseGroup.add(bridgeMesh);

    // Defined rounded nose tip catching soft light
    const tipGeo = new THREE.SphereGeometry(0.0085, 14, 14);
    tipGeo.scale(0.90, 0.95, 1.15);
    const tipMesh = new THREE.Mesh(tipGeo, this.skinMat);
    tipMesh.position.set(0, -0.006, 0.014);
    noseGroup.add(tipMesh);

    // Subtle ambient shadow under nose
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x8a4e2e,
      transparent: true,
      opacity: 0.30,
    });
    const shadowGeo = new THREE.PlaneGeometry(0.014, 0.005);
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.position.set(0, -0.013, 0.008);
    shadowMesh.rotation.x = -Math.PI * 0.35;
    noseGroup.add(shadowMesh);

    // Anatomical alar nostrils (خياشيم الأنف الدقيقة المتناسقة)
    const nostrilGeo = new THREE.SphereGeometry(0.0040, 8, 8);
    nostrilGeo.scale(1.2, 0.8, 1.0);
    const nostrilMat = new THREE.MeshBasicMaterial({ color: 0x542918 });
    const nostrilL = new THREE.Mesh(nostrilGeo, nostrilMat);
    nostrilL.position.set(-0.0055, -0.010, 0.011);
    const nostrilR = new THREE.Mesh(nostrilGeo, nostrilMat);
    nostrilR.position.set(0.0055, -0.010, 0.011);
    noseGroup.add(nostrilL, nostrilR);

    // Soft natural youthful rosy cheek glow (تورّد طبيعي للوجنتين على البشرة الفاتحة)
    const blushMat = new THREE.MeshBasicMaterial({
      color: 0xf472b6,
      transparent: true,
      opacity: 0.22,
    });
    const blushGeo = new THREE.CircleGeometry(0.022, 16);
    const blushL = new THREE.Mesh(blushGeo, blushMat);
    blushL.position.set(-0.062, 0.008, 0.014);
    blushL.rotation.y = -0.28;
    const blushR = new THREE.Mesh(blushGeo, blushMat);
    blushR.position.set(0.062, 0.008, 0.014);
    blushR.rotation.y = 0.28;
    faceGroup.add(blushL, blushR);

    // =========================================================================
    // 3. CHARISMATIC RUNNER SMILE & TEETH
    // =========================================================================
    const mouthGroup = new THREE.Group();
    mouthGroup.position.set(0, -0.030, 0.028);
    faceGroup.add(mouthGroup);

    // Philtrum indentation (النثرة الطبيعية أعلى الشفة العليا)
    const philtrumGeo = new THREE.PlaneGeometry(0.005, 0.010);
    const philtrumMat = new THREE.MeshBasicMaterial({
      color: 0xc27a68,
      transparent: true,
      opacity: 0.25,
    });
    const philtrumMesh = new THREE.Mesh(philtrumGeo, philtrumMat);
    philtrumMesh.position.set(0, 0.008, 0.003);
    mouthGroup.add(philtrumMesh);

    // Sculpted upper lip curve (Cupid's bow with soft rose vermillion)
    const lipGeo = new THREE.TorusGeometry(0.022, 0.0040, 8, 18, Math.PI * 0.82);
    const lipMat = new THREE.MeshStandardMaterial({
      color: 0xd87668, // Natural fresh rose lip tone
      roughness: 0.38,
      metalness: 0.01,
    });
    const lipsMesh = new THREE.Mesh(lipGeo, lipMat);
    lipsMesh.rotation.x = Math.PI * 0.38;
    lipsMesh.rotation.z = -Math.PI * 0.09;
    mouthGroup.add(lipsMesh);

    // Clean white teeth arch showing confident smile
    const teethGeo = new THREE.PlaneGeometry(0.020, 0.006);
    const teethMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const teethMesh = new THREE.Mesh(teethGeo, teethMat);
    teethMesh.position.set(0, -0.002, 0.004);
    mouthGroup.add(teethMesh);

    // Soft curved lower lip volume (شفة سفلية ناعمة مقوسة طبيعية بدون أي مربعات)
    const lowerLipGeo = new THREE.CylinderGeometry(0.0035, 0.0032, 0.018, 12);
    lowerLipGeo.rotateZ(Math.PI * 0.5);
    const lowerLipMesh = new THREE.Mesh(lowerLipGeo, lipMat);
    lowerLipMesh.position.set(0, -0.008, 0.005);
    mouthGroup.add(lowerLipMesh);

    return {
      faceGroup,
      leftEyeGroup,
      rightEyeGroup,
      leftUpperLid,
      rightUpperLid,
      leftEyelash,
      rightEyelash,
      leftEyebrowBone,
      rightEyebrowBone,
      noseGroup,
      mouthGroup,
      lipsMesh,
      teethMesh,
    };
  }

  /**
   * Arm Chain with Articulated Athletic Runner Hand
   */
  private createArmChain(side: number): {
    shoulderBone: THREE.Group;
    bicepMesh: THREE.Mesh;
    elbowBone: THREE.Group;
    forearmMesh: THREE.Mesh;
    wristBone: THREE.Group;
    handRig: ArticulatedHandRig;
    watchGroup: THREE.Group;
  } {
    const shoulderBone = new THREE.Group();
    shoulderBone.position.set(side * 0.08, 0, 0);

    // Deltoid
    const deltoidGeo = new THREE.SphereGeometry(0.076, 16, 16);
    const deltoid = new THREE.Mesh(deltoidGeo, this.hoodieMat);
    shoulderBone.add(deltoid);

    // Seamless shoulder socket cap (تكامل مفصل الكتف لمنع أي انفصال)
    const shoulderSocket = new THREE.Mesh(new THREE.SphereGeometry(0.064, 14, 14), this.hoodieMat);
    shoulderBone.add(shoulderSocket);

    // Bicep Sleeve
    const bicepGeo = new THREE.CylinderGeometry(0.060, 0.052, 0.26, 16);
    const bicepMesh = new THREE.Mesh(bicepGeo, this.hoodieMat);
    bicepMesh.position.set(0, -0.13, 0);
    bicepMesh.castShadow = true;
    shoulderBone.add(bicepMesh);

    // Elbow Joint with Smooth Anatomical Volume and Fabric Crease
    const elbowBone = new THREE.Group();
    elbowBone.position.set(0, -0.26, 0);
    shoulderBone.add(elbowBone);

    // Solid joint sphere fill to prevent any gap during bending (مفصل الكوع المندمج بدون فراغات)
    const elbowSphere = new THREE.Mesh(new THREE.SphereGeometry(0.053, 14, 14), this.hoodieMat);
    elbowBone.add(elbowSphere);

    const creaseGeo = new THREE.TorusGeometry(0.052, 0.010, 8, 16);
    const creaseMesh = new THREE.Mesh(creaseGeo, this.hoodieMat);
    creaseMesh.rotation.x = Math.PI * 0.5;
    elbowBone.add(creaseMesh);

    // Forearm Sleeve
    const forearmGeo = new THREE.CylinderGeometry(0.050, 0.044, 0.24, 16);
    const forearmMesh = new THREE.Mesh(forearmGeo, this.hoodieMat);
    forearmMesh.position.set(0, -0.12, 0);
    forearmMesh.castShadow = true;
    elbowBone.add(forearmMesh);

    // Wrist Joint with Ribbed Cuff
    const wristBone = new THREE.Group();
    wristBone.position.set(0, -0.24, 0);
    elbowBone.add(wristBone);

    const cuffGeo = new THREE.CylinderGeometry(0.046, 0.046, 0.028, 16);
    const cuffMesh = new THREE.Mesh(cuffGeo, this.hoodieMat);
    wristBone.add(cuffMesh);

    // Digital Runner Sports Watch on Wrist (ساعة عداء رياضية فيروزية رقمية على كلا المعصمين كالصور)
    const watchGroup = new THREE.Group();
    const strapGeo = new THREE.CylinderGeometry(0.048, 0.048, 0.034, 18);
    const strapMat = new THREE.MeshStandardMaterial({
      color: 0x00c7d9, // Vibrant Cyan Watch Casing matching reference image
      roughness: 0.35,
      metalness: 0.20,
    });
    const strap = new THREE.Mesh(strapGeo, strapMat);
    watchGroup.add(strap);

    // Beveled Watch Face & Digital Display (مقياس دائري بيضاوي ناعم بدون حواف مكعبة)
    const screenGeo = new THREE.CylinderGeometry(0.020, 0.020, 0.010, 16);
    screenGeo.rotateX(Math.PI * 0.5);
    const screenMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      emissive: 0x0284c7,
      emissiveIntensity: 0.8,
      roughness: 0.15,
    });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(0, 0, 0.048);
    watchGroup.add(screen);

    // Watch side button
    const btnGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.008, 10);
    btnGeo.rotateZ(Math.PI * 0.5);
    const btn = new THREE.Mesh(btnGeo, this.goldTrimMat);
    btn.position.set(side * 0.049, 0, 0);
    watchGroup.add(btn);

    wristBone.add(watchGroup);

    // Stylized Athletic Hand with Integrated Realistic Anatomy (كف يد طبيعي مدمج بدون أي مربعات)
    const handGroup = new THREE.Group();
    wristBone.add(handGroup);

    // Smooth Anatomical Palm Core (كف يد طبيعي مقوس بدون مكعبات أو مربعات)
    const palmGeo = new THREE.CylinderGeometry(0.026, 0.024, 0.056, 16);
    palmGeo.scale(1.10, 1.0, 0.72);
    const palmMesh = new THREE.Mesh(palmGeo, this.skinMat);
    palmMesh.position.set(0, -0.030, 0);
    palmMesh.castShadow = true;
    handGroup.add(palmMesh);

    // Tactical Charcoal Black Fingerless Glove Overlay (قفاز رياضي بدون أصابع مطابق للصورة)
    const gloveGeo = new THREE.CylinderGeometry(0.027, 0.025, 0.040, 16);
    gloveGeo.scale(1.12, 1.0, 0.74);
    const gloveMesh = new THREE.Mesh(gloveGeo, this.gloveMat);
    gloveMesh.position.set(0, -0.022, 0);
    handGroup.add(gloveMesh);

    // Circular knuckle cutouts on back of glove revealing fair skin underneath
    for (let k = 0; k < 4; k++) {
      const cutout = new THREE.Mesh(new THREE.SphereGeometry(0.0052, 8, 8), this.skinMat);
      cutout.position.set(side * (-0.016 + k * 0.011), -0.038, 0.014);
      handGroup.add(cutout);
    }

    // Rounded palm heel (تكامل قاعدة الكف)
    const palmHeelGeo = new THREE.SphereGeometry(0.024, 12, 10);
    palmHeelGeo.scale(1.15, 0.70, 0.85);
    const palmHeel = new THREE.Mesh(palmHeelGeo, this.skinMat);
    palmHeel.position.set(0, -0.010, 0);
    handGroup.add(palmHeel);

    // Integrated 5 Fingers Rig (4 fingers + articulated thumb with knuckles & fingertips)
    const makeFinger = (xOffset: number, zOffset: number, lengthScale: number = 1.0) => {
      const mcp = new THREE.Group();
      mcp.position.set(xOffset, -0.058, zOffset);
      handGroup.add(mcp);

      // Knuckle joint (مفصل الأصبع الأساسي الدائري المندمج)
      const knuckleGeo = new THREE.SphereGeometry(0.0075, 8, 8);
      const knuckle = new THREE.Mesh(knuckleGeo, this.skinMat);
      knuckle.position.set(0, 0, 0);
      mcp.add(knuckle);

      // Proximal Phalanx
      const fGeo = new THREE.CylinderGeometry(0.0070, 0.0065, 0.026 * lengthScale, 8);
      const fMesh = new THREE.Mesh(fGeo, this.skinMat);
      fMesh.position.set(0, -0.013 * lengthScale, 0);
      fMesh.castShadow = true;
      mcp.add(fMesh);

      // PIP joint (مفصل الأصبع الأوسط)
      const pip = new THREE.Group();
      pip.position.set(0, -0.026 * lengthScale, 0);
      mcp.add(pip);

      const pipKnuckle = new THREE.Mesh(new THREE.SphereGeometry(0.0062, 8, 8), this.skinMat);
      pip.add(pipKnuckle);

      const midGeo = new THREE.CylinderGeometry(0.0062, 0.0058, 0.020 * lengthScale, 8);
      const midMesh = new THREE.Mesh(midGeo, this.skinMat);
      midMesh.position.set(0, -0.010 * lengthScale, 0);
      midMesh.castShadow = true;
      pip.add(midMesh);

      // DIP joint and rounded fingertip (الأنملة ورأس الأصبع الدائري)
      const dip = new THREE.Group();
      dip.position.set(0, -0.020 * lengthScale, 0);
      pip.add(dip);

      const tipGeo = new THREE.SphereGeometry(0.0055, 8, 8);
      tipGeo.scale(1.0, 1.35, 1.0);
      const tipMesh = new THREE.Mesh(tipGeo, this.skinMat);
      tipMesh.position.set(0, -0.008 * lengthScale, 0);
      tipMesh.castShadow = true;
      dip.add(tipMesh);

      return { mcp, pip, dip };
    };

    // 4 Articulated fingers with natural human anatomical proportions
    const index = makeFinger(side * -0.018, 0.014, 0.95);
    const middle = makeFinger(side * -0.006, 0.016, 1.05); // Longest finger
    const ring = makeFinger(side * 0.006, 0.014, 0.98);
    const pinky = makeFinger(side * 0.018, 0.012, 0.82); // Smallest finger

    // Articulated Thumb with Thenar Eminence (إبهام متكامل مع بروز كعبرة الكف)
    const thumbCmc = new THREE.Group();
    thumbCmc.position.set(side * -0.026, -0.022, -0.008);
    handGroup.add(thumbCmc);

    // Thenar muscle pad
    const thenarGeo = new THREE.SphereGeometry(0.014, 10, 10);
    thenarGeo.scale(1.1, 0.9, 0.9);
    const thenarMesh = new THREE.Mesh(thenarGeo, this.skinMat);
    thenarMesh.position.set(side * -0.006, -0.008, 0.004);
    thumbCmc.add(thenarMesh);

    const thumbMcp = new THREE.Group();
    thumbMcp.position.set(side * -0.012, -0.016, 0.006);
    thumbCmc.add(thumbMcp);

    const thumbProximalGeo = new THREE.CylinderGeometry(0.0082, 0.0076, 0.024, 8);
    const thumbProximal = new THREE.Mesh(thumbProximalGeo, this.skinMat);
    thumbProximal.position.set(0, -0.012, 0);
    thumbMcp.add(thumbProximal);

    const thumbIp = new THREE.Group();
    thumbIp.position.set(0, -0.024, 0);
    thumbMcp.add(thumbIp);

    const thumbTipGeo = new THREE.SphereGeometry(0.0072, 8, 8);
    thumbTipGeo.scale(1.0, 1.3, 1.0);
    const thumbTipMesh = new THREE.Mesh(thumbTipGeo, this.skinMat);
    thumbTipMesh.position.set(0, -0.008, 0);
    thumbTipMesh.castShadow = true;
    thumbIp.add(thumbTipMesh);

    const handRig: ArticulatedHandRig = {
      handGroup,
      wrist: wristBone,
      thumb: { cmc: thumbCmc, mcp: thumbMcp, ip: thumbIp },
      index,
      middle,
      ring,
      pinky,
    };

    return {
      shoulderBone,
      bicepMesh,
      elbowBone,
      forearmMesh,
      wristBone,
      handRig,
      watchGroup,
    };
  }

  /**
   * Leg Chain with Athletic Joggers & Chunky Subway Sneakers
   */
  private createLegChain(side: number): {
    hipBone: THREE.Group;
    thighMesh: THREE.Mesh;
    kneeBone: THREE.Group;
    shinBone: THREE.Group;
    ankleBone: THREE.Group;
    shoeGroup: THREE.Group;
  } {
    const hipBone = new THREE.Group();
    hipBone.position.set(side * 0.115, -0.09, 0);

    // Seamless hip socket ball to ensure smooth pelvic connection (تكامل مفصل الحوض والفخذ)
    const hipJointBall = new THREE.Mesh(new THREE.SphereGeometry(0.078, 14, 14), this.pantsMat);
    hipBone.add(hipJointBall);

    // Thigh - Athletic jogger thigh
    const thighGeo = new THREE.CylinderGeometry(0.076, 0.060, 0.40, 18);
    const thighMesh = new THREE.Mesh(thighGeo, this.pantsMat);
    thighMesh.position.set(0, -0.20, 0);
    thighMesh.castShadow = true;
    hipBone.add(thighMesh);

    // Knee Joint with Fabric Crease and Volumetric Joint Cap (تكامل مفصل الركبة بدون فراغات)
    const kneeBone = new THREE.Group();
    kneeBone.position.set(0, -0.40, 0);
    hipBone.add(kneeBone);

    // Knee patella & socket filler ball
    const kneeJointBall = new THREE.Mesh(new THREE.SphereGeometry(0.063, 14, 14), this.pantsMat);
    kneeBone.add(kneeJointBall);

    const kneeCrease = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.010, 8, 16), this.pantsMat);
    kneeCrease.rotation.x = Math.PI * 0.5;
    kneeBone.add(kneeCrease);

    // Shin / Lower Leg - Tapered Jogger Calf
    const shinBone = new THREE.Group();
    kneeBone.add(shinBone);

    const shinGeo = new THREE.CylinderGeometry(0.060, 0.048, 0.40, 18);
    const shinMesh = new THREE.Mesh(shinGeo, this.pantsMat);
    shinMesh.position.set(0, -0.20, 0);
    shinMesh.castShadow = true;
    shinBone.add(shinMesh);

    // Ankle Joint with Ribbed Jogger Cuff
    const ankleBone = new THREE.Group();
    ankleBone.position.set(0, -0.40, 0);
    shinBone.add(ankleBone);

    const cuffGeo = new THREE.CylinderGeometry(0.052, 0.052, 0.035, 16);
    const cuff = new THREE.Mesh(cuffGeo, this.pantsMat);
    ankleBone.add(cuff);

    // =========================================================================
    // CHUNKY AERODYNAMIC RUNNER SNEAKERS (ZERO BOXES - 100% SCULPTED ORGANIC CURVES)
    // =========================================================================
    const shoeGroup = new THREE.Group();
    ankleBone.add(shoeGroup);

    // 1. Thick Shock-Absorption Neon Lime Rubber Outsole with Aerodynamic Rocker (نعل ليموني سميك منحني ممتص للصدمات)
    // A. Heel Cushioning Pod (Flared rounded rear sole)
    const heelPodGeo = new THREE.CylinderGeometry(0.052, 0.056, 0.040, 16);
    heelPodGeo.scale(1.0, 1.0, 1.15);
    const heelPod = new THREE.Mesh(heelPodGeo, this.shoeSoleMat);
    heelPod.position.set(0, -0.075, -0.015);
    heelPod.castShadow = true;
    shoeGroup.add(heelPod);

    // B. Forefoot Spring & Toe Rocker Pod (انحناء مقدمة الحذاء للركض السريع)
    const forefootPodGeo = new THREE.CylinderGeometry(0.054, 0.050, 0.038, 16);
    forefootPodGeo.scale(1.0, 1.0, 1.25);
    const forefootPod = new THREE.Mesh(forefootPodGeo, this.shoeSoleMat);
    forefootPod.position.set(0, -0.074, 0.090);
    forefootPod.castShadow = true;
    shoeGroup.add(forefootPod);

    // C. Sculpted Upturned Rubber Toe Bumper (مصد أصابع مطاطي ليموني دائري)
    const toeGeo = new THREE.SphereGeometry(0.046, 14, 14);
    toeGeo.scale(1.08, 0.65, 0.95);
    const toeBumper = new THREE.Mesh(toeGeo, this.shoeSoleMat);
    toeBumper.position.set(0, -0.052, 0.145);
    shoeGroup.add(toeBumper);

    // 2. Sculpted Dynamic Sneaker Upper in Vibrant Cyan & Magenta (جسم الحذاء الفيروزي المنحني مع كعب فوشي)
    const upperGeo = new THREE.CylinderGeometry(0.048, 0.052, 0.072, 16);
    upperGeo.scale(1.05, 1.0, 1.35);
    const upper = new THREE.Mesh(upperGeo, this.shoeMat);
    upper.position.set(0, -0.032, 0.045);
    upper.castShadow = true;
    shoeGroup.add(upper);

    // Magenta / Purple Heel Stabilizer Cup (كعب الحذاء الرياضي الفوشي المطابق للصورة)
    const heelCupGeo = new THREE.TorusGeometry(0.045, 0.016, 8, 16, Math.PI);
    heelCupGeo.rotateX(Math.PI * 0.5);
    heelCupGeo.rotateY(Math.PI);
    const heelCup = new THREE.Mesh(heelCupGeo, this.strapMat);
    heelCup.position.set(0, -0.026, -0.015);
    shoeGroup.add(heelCup);

    // 3. Ergonomic Padded Sneaker Tongue rising in front of ankle
    const tongueGeo = new THREE.CylinderGeometry(0.026, 0.028, 0.070, 12);
    tongueGeo.scale(1.0, 1.0, 0.60);
    tongueGeo.rotateX(-0.35);
    const tongue = new THREE.Mesh(tongueGeo, this.shoeMat);
    tongue.position.set(0, 0.005, 0.052);
    shoeGroup.add(tongue);

    // 4. Vibrant Neon Yellow Criss-Cross Shoelaces (أربطة الحذاء الصفراء النيونية ثلاثية الأبعاد)
    const laceMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15, // Bright Neon Yellow
      roughness: 0.35,
    });

    for (let l = 0; l < 3; l++) {
      const zPos = 0.038 + l * 0.028;
      const yPos = -0.005 + l * 0.010;

      // Cross strand 1
      const lace1Geo = new THREE.CylinderGeometry(0.0035, 0.0035, 0.046, 8);
      lace1Geo.rotateZ(0.45);
      lace1Geo.rotateX(0.12);
      const lace1 = new THREE.Mesh(lace1Geo, laceMat);
      lace1.position.set(0, yPos, zPos);
      shoeGroup.add(lace1);

      // Cross strand 2
      const lace2Geo = new THREE.CylinderGeometry(0.0035, 0.0035, 0.046, 8);
      lace2Geo.rotateZ(-0.45);
      lace2Geo.rotateX(0.12);
      const lace2 = new THREE.Mesh(lace2Geo, laceMat);
      lace2.position.set(0, yPos, zPos);
      shoeGroup.add(lace2);
    }

    // Top Runner Knot Bow
    const knotGeo = new THREE.SphereGeometry(0.006, 8, 8);
    const knot = new THREE.Mesh(knotGeo, laceMat);
    knot.position.set(0, 0.026, 0.082);
    shoeGroup.add(knot);

    return {
      hipBone,
      thighMesh,
      kneeBone,
      shinBone,
      ankleBone,
      shoeGroup,
    };
  }

  /**
   * Aerodynamic Urban Runner Sling Pack (Compact, streamlined - does not obscure the athletic back)
   */
  private createBackpack(): THREE.Group {
    const backpack = new THREE.Group();
    backpack.position.set(0, 0.13, -0.105);

    // Streamlined compact pack body - sculpted aerodynamic contour
    const packGeo = new THREE.CylinderGeometry(0.088, 0.098, 0.22, 18);
    packGeo.scale(0.85, 1.0, 0.42);
    const packMesh = new THREE.Mesh(packGeo, this.backpackMat);
    packMesh.castShadow = true;
    backpack.add(packMesh);

    // Subtle diagonal techwear zipper accent
    const zipGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.14, 8);
    zipGeo.rotateZ(0.35);
    const zipMesh = new THREE.Mesh(zipGeo, this.goldTrimMat);
    zipMesh.position.set(0.015, 0.02, -0.024);
    backpack.add(zipMesh);

    // Metallic golden runner emblem
    const emblem = new THREE.Mesh(new THREE.CircleGeometry(0.018, 16), this.goldTrimMat);
    emblem.position.set(0, -0.035, -0.026);
    emblem.rotation.y = Math.PI;
    backpack.add(emblem);

    return backpack;
  }

  /**
   * Crossbody Runner Messenger Sling Strap & Golden Clasp & Hip Sling Pack
   * Exact match to user's uploaded reference image
   */
  private createCrossbodyStrapAndBag(): THREE.Group {
    const group = new THREE.Group();

    // 1. Diagonal Chest Strap (from right shoulder down across chest to left hip)
    const strapMat = new THREE.MeshStandardMaterial({
      color: 0xd946ef, // Vibrant Magenta Purple
      roughness: 0.48,
      metalness: 0.08,
    });

    const strapEdgeMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e, // Hot Pink piping
      roughness: 0.40,
    });

    // Front diagonal strap segment (smooth flattened wide ribbon)
    const frontStrapGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.42, 12);
    frontStrapGeo.scale(0.35, 1.0, 1.25);
    const frontStrap = new THREE.Mesh(frontStrapGeo, strapMat);
    frontStrap.position.set(-0.015, 0.12, 0.165);
    frontStrap.rotation.z = 0.58;
    frontStrap.rotation.y = -0.15;
    group.add(frontStrap);

    // Front strap border trims
    const trimGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.42, 8);
    const trim1 = new THREE.Mesh(trimGeo, strapEdgeMat);
    trim1.position.set(-0.015 + 0.018, 0.12, 0.166);
    trim1.rotation.z = 0.58;
    group.add(trim1);

    const trim2 = new THREE.Mesh(trimGeo, strapEdgeMat);
    trim2.position.set(-0.015 - 0.018, 0.12, 0.166);
    trim2.rotation.z = 0.58;
    group.add(trim2);

    // 2. Shiny Golden Circular Clasp Medallion at center of chest (from reference image)
    const claspGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.010, 20);
    claspGeo.rotateX(Math.PI * 0.5);
    const claspMesh = new THREE.Mesh(claspGeo, this.goldTrimMat);
    claspMesh.position.set(-0.045, 0.09, 0.178);
    group.add(claspMesh);

    // Golden inner runner star relief
    const starCore = new THREE.Mesh(new THREE.SphereGeometry(0.009, 10, 10), this.goldTrimMat);
    starCore.position.set(-0.045, 0.09, 0.184);
    group.add(starCore);

    // 3. Compact Curved Runner Sling Pack resting at the left hip
    const pouchGeo = new THREE.CylinderGeometry(0.075, 0.085, 0.14, 18);
    pouchGeo.scale(0.85, 1.0, 1.20);
    const pouchMat = new THREE.MeshStandardMaterial({
      color: 0x00c7d9, // Vibrant Cyan body matching hoodie
      roughness: 0.55,
    });
    const pouch = new THREE.Mesh(pouchGeo, pouchMat);
    pouch.position.set(-0.21, -0.12, 0.08);
    pouch.rotation.z = 0.22;
    pouch.rotation.y = 0.35;
    group.add(pouch);

    // Flap with magenta accent
    const flapGeo = new THREE.CylinderGeometry(0.078, 0.078, 0.040, 18, 1, false, 0, Math.PI);
    flapGeo.scale(0.88, 1.0, 1.25);
    const flap = new THREE.Mesh(flapGeo, strapMat);
    flap.position.set(-0.21, -0.06, 0.08);
    flap.rotation.z = 0.22;
    flap.rotation.y = 0.35;
    group.add(flap);

    return group;
  }

  /**
   * Power-Up Meshes
   */
  private createShieldMesh(): THREE.Mesh {
    const geo = new THREE.SphereGeometry(0.95, 24, 24);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.35,
      roughness: 0.1,
    });
    const shield = new THREE.Mesh(geo, mat);
    shield.position.set(0, 0.95, 0);
    shield.visible = false;
    return shield;
  }

  private createMagnetAura(): THREE.Group {
    const group = new THREE.Group();
    group.position.set(0, 1.85, 0);

    const ringGeo = new THREE.TorusGeometry(0.34, 0.025, 8, 24);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.8,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI * 0.5;
    group.add(ring);

    group.visible = false;
    return group;
  }

  private createTurboJetMesh(): THREE.Group {
    const group = new THREE.Group();
    group.position.set(0, 0.09, -0.20);

    const coneGeo = new THREE.ConeGeometry(0.08, 0.25, 12);
    const jetMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const jetL = new THREE.Mesh(coneGeo, jetMat);
    jetL.rotation.x = Math.PI * 0.5;
    jetL.position.set(-0.15, 0, 0);
    group.add(jetL);

    const jetR = new THREE.Mesh(coneGeo, jetMat);
    jetR.rotation.x = Math.PI * 0.5;
    jetR.position.set(0.15, 0, 0);
    group.add(jetR);

    group.visible = false;
    return group;
  }

  /**
   * Iraqi Traditional Shemagh & Royal Agal Accessory
   */
  private createShemaghMesh(): THREE.Group {
    const group = new THREE.Group();
    group.position.set(0, 0.14, 0);

    // Draped white cloth over head
    const clothGeo = new THREE.SphereGeometry(0.146, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.58);
    const clothMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.85,
      metalness: 0.05,
    });
    const cloth = new THREE.Mesh(clothGeo, clothMat);
    group.add(cloth);

    // Double Ring Royal Black Agal (العقال المرعز الأسود)
    const agalMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.35,
      metalness: 0.2,
    });
    const agalGeo1 = new THREE.TorusGeometry(0.138, 0.012, 10, 24);
    agalGeo1.rotateX(Math.PI * 0.5);
    const agal1 = new THREE.Mesh(agalGeo1, agalMat);
    agal1.position.set(0, 0.045, -0.005);
    group.add(agal1);

    const agalGeo2 = new THREE.TorusGeometry(0.135, 0.012, 10, 24);
    agalGeo2.rotateX(Math.PI * 0.5);
    const agal2 = new THREE.Mesh(agalGeo2, agalMat);
    agal2.position.set(0, 0.065, -0.005);
    group.add(agal2);

    // Hanging folds at back and sides
    const flapGeo = new THREE.BoxGeometry(0.24, 0.28, 0.03);
    const flap = new THREE.Mesh(flapGeo, clothMat);
    flap.position.set(0, -0.06, -0.12);
    flap.rotation.x = -0.15;
    group.add(flap);

    group.visible = false;
    return group;
  }

  /**
   * Polarized Desert Sunglasses (نظارات شمس الصحراء)
   */
  private createSunglassesMesh(): THREE.Group {
    const group = new THREE.Group();
    group.position.set(0, 0.125, 0.118);

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.8,
      roughness: 0.2,
    });

    const lensMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.9,
      roughness: 0.05,
      transparent: true,
      opacity: 0.85,
    });

    // Left & Right Lenses
    const lensGeo = new THREE.BoxGeometry(0.042, 0.024, 0.008);
    const leftLens = new THREE.Mesh(lensGeo, lensMat);
    leftLens.position.set(-0.038, 0, 0);
    group.add(leftLens);

    const rightLens = new THREE.Mesh(lensGeo, lensMat);
    rightLens.position.set(0.038, 0, 0);
    group.add(rightLens);

    // Bridge
    const bridgeGeo = new THREE.BoxGeometry(0.024, 0.004, 0.006);
    const bridge = new THREE.Mesh(bridgeGeo, frameMat);
    bridge.position.set(0, 0.006, 0);
    group.add(bridge);

    // Temples (Arms)
    const armGeo = new THREE.BoxGeometry(0.004, 0.006, 0.12);
    const leftArm = new THREE.Mesh(armGeo, frameMat);
    leftArm.position.set(-0.062, 0.004, -0.06);
    group.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, frameMat);
    rightArm.position.set(0.062, 0.004, -0.06);
    group.add(rightArm);

    group.visible = false;
    return group;
  }

  /**
   * Pro Streetwear Headphones (سماعات البودكاست والموسيقى)
   */
  private createHeadphonesMesh(): THREE.Group {
    const group = new THREE.Group();
    group.position.set(0, 0.13, 0);

    const bandMat = new THREE.MeshStandardMaterial({
      color: 0x1e1b4b,
      roughness: 0.3,
      metalness: 0.7,
    });

    const cushionMat = new THREE.MeshStandardMaterial({
      color: 0x6366f1,
      roughness: 0.5,
    });

    // Headband
    const bandGeo = new THREE.TorusGeometry(0.145, 0.012, 8, 20, Math.PI);
    bandGeo.rotateZ(Math.PI * 0.5);
    bandGeo.rotateY(Math.PI * 0.5);
    const band = new THREE.Mesh(bandGeo, bandMat);
    band.position.set(0, 0.03, 0);
    group.add(band);

    // Left Ear Cup
    const cupGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.024, 16);
    cupGeo.rotateZ(Math.PI * 0.5);
    const leftCup = new THREE.Mesh(cupGeo, cushionMat);
    leftCup.position.set(-0.138, 0, 0);
    group.add(leftCup);

    // Right Ear Cup
    const rightCup = new THREE.Mesh(cupGeo, cushionMat);
    rightCup.position.set(0.138, 0, 0);
    group.add(rightCup);

    group.visible = false;
    return group;
  }

  /**
   * Warm Arabian Royal Scarf (الشال الكشميري العربي)
   */
  private createRoyalScarfMesh(): THREE.Group {
    const group = new THREE.Group();
    group.position.set(0, 0, 0);

    const scarfMat = new THREE.MeshStandardMaterial({
      color: 0xb45309,
      roughness: 0.8,
      metalness: 0.1,
    });

    // Coil around neck
    const neckWrapGeo = new THREE.TorusGeometry(0.11, 0.036, 10, 24);
    neckWrapGeo.rotateX(Math.PI * 0.5);
    const neckWrap = new THREE.Mesh(neckWrapGeo, scarfMat);
    neckWrap.position.set(0, 0.02, 0);
    group.add(neckWrap);

    // Draping tail down the chest
    const tailGeo = new THREE.BoxGeometry(0.08, 0.24, 0.022);
    const tail = new THREE.Mesh(tailGeo, scarfMat);
    tail.position.set(-0.045, -0.09, 0.115);
    tail.rotation.z = -0.12;
    group.add(tail);

    group.visible = false;
    return group;
  }

  /**
   * Initialize & Profile
   * Scaled to 1.08x baseline for solid Subway Surfers presence and high visual readability
   */
  public initializeCharacter(config?: { name?: string; age?: number; appearance?: Partial<CharacterAppearance> }) {
    if (config?.name) this.characterName = config.name;
    if (config?.age) this.age = config.age;
    if (config?.appearance) {
      this.appearance = { ...this.appearance, ...config.appearance };
      if (config.appearance.skinTone) {
        this.skinMat.color.set(config.appearance.skinTone);
        this.skinMat.needsUpdate = true;
      }
    }

    // Solid, Subway Surfers proportion scale factor (1.08)
    const subwayScale = 1.08;
    const heightRatio = (this.appearance.heightMeters / 1.78) * subwayScale;
    this.group.scale.set(heightRatio, heightRatio, heightRatio);
  }

  public applyAppearance(appearance: Partial<CharacterAppearance>) {
    this.initializeCharacter({ appearance });
  }

  public setEyeColor(colorHex: string, label: string = 'بني طبيعي') {
    this.appearance.eyeColor.hex = colorHex;
    this.appearance.eyeColor.label = label;
    this.eyeIrisMat.map = HighPrecisionTextureEngine.createIrisTexture(colorHex);
    this.eyeIrisMat.map.needsUpdate = true;
  }

  /**
   * Shop & Outfit Customization
   */
  public applyCustomization(customization: PlayerCustomization) {
    const outfitId = customization?.equippedOutfit || 'outfit_classic_sport';
    const outfit = SHOP_ITEMS.find((i) => i.id === outfitId);
    const primary = outfit?.colorHex || '#00c7d9';
    const secondary = outfit?.secondaryColorHex || '#d946ef';

    const shoeId = customization?.equippedShoes || 'shoes_classic_runner';
    const shoeItem = SHOP_ITEMS.find((i) => i.id === shoeId);
    const shoePrimary = shoeItem?.colorHex || '#00c7d9';
    const shoeSecondary = shoeItem?.secondaryColorHex || '#a3e635';

    this.textureManager.setColors(primary, secondary, '#1e293b', shoePrimary);
    this.textureManager.regenerateTextures();

    this.hoodieMat.map = this.textureManager.textures.jacketAlbedo;
    this.hoodieMat.needsUpdate = true;

    this.pantsMat.map = this.textureManager.textures.joggersAlbedo;
    this.pantsMat.needsUpdate = true;

    this.shoeMat.map = this.textureManager.textures.sneakersAlbedo;
    this.shoeMat.needsUpdate = true;

    this.shoeSoleMat.color.set(shoeSecondary);
    this.shoeSoleMat.needsUpdate = true;

    this.strapMat.color.set(secondary);
    this.strapMat.needsUpdate = true;

    this.backpackMat.map = this.textureManager.textures.backpackAlbedo;
    this.backpackMat.needsUpdate = true;

    // Handle Thobe Outfits
    if (customization.equippedOutfit.includes('thobe') || customization.equippedOutfit.includes('jalabiya')) {
      this.thobeSkirt.visible = true;
      (this.thobeSkirt.material as THREE.MeshStandardMaterial).color.set(primary);
    } else {
      this.thobeSkirt.visible = false;
    }

    // Handle Wearable Accessories
    const acc = customization.equippedAccessory;
    if (this.shemaghMesh) this.shemaghMesh.visible = (acc === 'acc_modern_shemagh');
    if (this.sunglassesMesh) this.sunglassesMesh.visible = (acc === 'acc_sport_shades');
    if (this.headphonesMesh) this.headphonesMesh.visible = (acc === 'acc_pro_headphones');
    if (this.scarfMesh) this.scarfMesh.visible = (acc === 'acc_royal_scarf');

    // If Shemagh is equipped, hide the top hair locks to avoid clipping
    if (acc === 'acc_modern_shemagh') {
      this.hairFringe.visible = false;
    } else {
      this.hairFringe.visible = true;
    }
  }

  public updateEnvironment(weather: WeatherType, biome: BiomeType) {
    this.textureManager.updateEnvironment(weather, biome);

    this.hoodieMat.map = this.textureManager.textures.jacketAlbedo;
    this.hoodieMat.needsUpdate = true;

    this.pantsMat.map = this.textureManager.textures.joggersAlbedo;
    this.pantsMat.needsUpdate = true;

    this.shoeMat.map = this.textureManager.textures.sneakersAlbedo;
    this.shoeMat.needsUpdate = true;
  }

  /**
   * Trigger the Landing Rebound (ارتداد خفيف عند الهبوط من القفز)
   */
  public triggerLandingRebound() {
    this.landingReboundTime = this.landingReboundDuration;
    this.emitLandingDustBurst();
  }

  /**
   * ============================================================================
   * REALISTIC & FLUID SUBWAY SURFERS RUNNING BIOMECHANICS WITH LANDING REBOUND
   * ============================================================================
   */
  public updateAnimation(delta: number, runSpeed: number = 14, speedRatio: number = 1.0) {
    this.animTime += delta;

    // 1. Organic Eye Blinking Cycle (~3.2s interval)
    this.blinkTimer += delta;
    if (this.blinkTimer > 3.2 + Math.sin(this.animTime * 0.4) * 0.6) {
      this.isBlinking = true;
      this.blinkTimer = 0;
      this.blinkProgress = 0;
    }

    if (this.isBlinking) {
      this.blinkProgress += delta * 14;
      const lidAngle = Math.sin(this.blinkProgress * Math.PI) * Math.PI * 0.48;
      this.facialRig.leftUpperLid.rotation.x = -Math.PI * 0.5 + lidAngle;
      this.facialRig.rightUpperLid.rotation.x = -Math.PI * 0.5 + lidAngle;

      if (this.blinkProgress >= 1.0) {
        this.isBlinking = false;
        this.facialRig.leftUpperLid.rotation.x = -Math.PI * 0.5;
        this.facialRig.rightUpperLid.rotation.x = -Math.PI * 0.5;
      }
    }

    // 2. Secondary Dynamics: Drawstrings & Hair Fringe with Wind & Momentum
    const cordSway = Math.sin(this.animTime * 13) * 0.10 * speedRatio;
    this.drawstringL.rotation.z = cordSway;
    this.drawstringR.rotation.z = -cordSway;
    this.drawstringL.rotation.x = 0.14 * speedRatio;
    this.drawstringR.rotation.x = 0.14 * speedRatio;

    const hairSway = Math.sin(this.animTime * 15) * 0.07 * speedRatio;
    this.hairFringe.rotation.x = hairSway + 0.09 * speedRatio;

    // 3. Actions Kinematics
    switch (this.currentAction) {
      case 'RUN':
      case 'FAST_RUN': {
        const isFastSprint = this.currentAction === 'FAST_RUN' || runSpeed >= 22;
        // Step cadence scales realistically with speed
        const cadenceMultiplier = isFastSprint ? 0.68 : 0.58;
        this.gaitPhase += delta * runSpeed * cadenceMultiplier;

        const sinG = Math.sin(this.gaitPhase);
        const cosG = Math.cos(this.gaitPhase);

        // A. Pelvic Kinematics:
        // - Vertical Stride Bounce (Double frequency: lowest at foot-plant, highest at flight apex)
        const bounceAmplitude = isFastSprint ? 0.040 : 0.052;
        const strideBounce = (Math.sin(this.gaitPhase * 2 - Math.PI * 0.5) * 0.5 + 0.5) * bounceAmplitude * speedRatio;

        // - Landing Rebound Spring Damping (ارتداد الهبوط عند ملامسة الأرض)
        let reboundOffset = 0;
        let reboundKneeBend = 0;
        let reboundSquashY = 0;
        let reboundSquashXZ = 0;

        if (this.landingReboundTime > 0) {
          this.landingReboundTime -= delta;
          const p = Math.max(0, 1.0 - this.landingReboundTime / this.landingReboundDuration);
          const spring = Math.sin(p * Math.PI * 1.5) * Math.exp(-p * 3.2);
          reboundOffset = -spring * 0.12;
          reboundKneeBend = Math.max(0, -spring) * 0.35;
          reboundSquashY = -spring * 0.08;
          reboundSquashXZ = spring * 0.04;

          if (this.landingReboundTime <= 0) {
            this.landingReboundTime = 0;
          }
        }

        this.pelvisBone.position.y = 0.96 + strideBounce + reboundOffset;

        // Apply landing squash scale to root group
        const baseScale = (this.appearance.heightMeters / 1.78) * 1.08;
        this.group.scale.y = baseScale * (1 + reboundSquashY);
        this.group.scale.x = baseScale * (1 + reboundSquashXZ);
        this.group.scale.z = baseScale * (1 + reboundSquashXZ);

        // - Pelvic Yaw (Rotates forward toward stepping leg)
        this.pelvisBone.rotation.y = sinG * (isFastSprint ? 0.09 : 0.11) * speedRatio;

        // - Pelvic Roll (Trendelenburg tilt toward stance leg)
        this.pelvisBone.rotation.z = cosG * 0.036 * speedRatio;

        // - Pelvic Pitch (Aggressive athletic forward tilt when sprinting)
        this.pelvisBone.rotation.x = isFastSprint ? 0.12 : 0.06;

        // B. Torso & Chest Counter-Rotation:
        this.chestBone.rotation.y = -sinG * (isFastSprint ? 0.11 : 0.13) * speedRatio;
        this.chestBone.rotation.z = -cosG * 0.024 * speedRatio;
        // Forward athletic lean: deep forward sprint posture at high speed
        this.chestBone.rotation.x = isFastSprint ? 0.28 : 0.15;

        // C. Head Stabilization (Focused eyes on the road ahead):
        this.headBone.rotation.y = sinG * 0.025;
        this.headBone.rotation.z = -this.chestBone.rotation.z * 0.75;
        this.headBone.rotation.x = isFastSprint ? -0.16 : -0.09;

        // D. Leg Stride Cycle (Fluid & Physically Accurate):
        // Left Leg
        const leftHipAngle = -sinG * (isFastSprint ? 0.92 : 0.80) * speedRatio;
        this.hipLeftBone.rotation.x = leftHipAngle;
        this.hipLeftBone.rotation.y = -sinG * 0.04;
        this.hipLeftBone.rotation.z = 0.02;

        if (sinG < 0) {
          // Forward drive: knee flexes up high
          this.kneeLeftBone.rotation.x = Math.abs(sinG) * (isFastSprint ? 1.05 : 0.85) + reboundKneeBend;
        } else {
          // Push-off recovery: heel kicks back
          this.kneeLeftBone.rotation.x = Math.pow(sinG, 1.3) * (isFastSprint ? 1.50 : 1.35) + reboundKneeBend;
        }

        this.ankleLeftBone.rotation.x = -cosG * 0.28;

        // Right Leg (180° out of phase)
        const rightHipAngle = sinG * (isFastSprint ? 0.92 : 0.80) * speedRatio;
        this.hipRightBone.rotation.x = rightHipAngle;
        this.hipRightBone.rotation.y = sinG * 0.04;
        this.hipRightBone.rotation.z = -0.02;

        if (sinG > 0) {
          this.kneeRightBone.rotation.x = Math.abs(sinG) * (isFastSprint ? 1.05 : 0.85) + reboundKneeBend;
        } else {
          this.kneeRightBone.rotation.x = Math.pow(-sinG, 1.3) * (isFastSprint ? 1.50 : 1.35) + reboundKneeBend;
        }

        this.ankleRightBone.rotation.x = cosG * 0.28;

        // E. Arm Pumping (Opposite to legs, bent at athletic runner angle):
        const armAmp = (isFastSprint ? 0.92 : 0.74) * speedRatio;
        const leftArmAngle = sinG * armAmp;
        this.shoulderLeftBone.rotation.x = leftArmAngle;
        this.shoulderLeftBone.rotation.z = -0.08 - Math.max(0, -leftArmAngle) * 0.12;
        this.shoulderLeftBone.rotation.y = sinG * 0.08;

        this.elbowLeftBone.rotation.x = (isFastSprint ? -1.48 : -1.35) - Math.max(0, leftArmAngle) * 0.35;

        const rightArmAngle = -sinG * armAmp;
        this.shoulderRightBone.rotation.x = rightArmAngle;
        this.shoulderRightBone.rotation.z = 0.08 + Math.max(0, -rightArmAngle) * 0.12;
        this.shoulderRightBone.rotation.y = -sinG * 0.08;

        this.elbowRightBone.rotation.x = (isFastSprint ? -1.48 : -1.35) - Math.max(0, rightArmAngle) * 0.35;

        // F. Smooth Lateral Banking on Lane Shifts (Critically Damped)
        const targetRoll = (this.laneX - this.targetLaneX) * 0.11;
        this.rollAngle = THREE.MathUtils.lerp(this.rollAngle, targetRoll, delta * 14);
        this.group.rotation.z = this.rollAngle;
        this.group.rotation.y = -this.rollAngle * 0.35;

        // Footstep dust
        if (strideBounce < 0.012 && this.animTime - this.nextDustIdx > 0.15) {
          this.emitFootstepDust();
          this.nextDustIdx = this.animTime;
        }
        break;
      }

      case 'JUMP': {
        this.jumpVelocity += this.gravity * delta;
        this.jumpY += this.jumpVelocity * delta;

        // If descending, smoothly transition into FALL pose
        if (this.jumpVelocity <= 0) {
          this.currentAction = 'FALL';
        }

        this.group.position.y = this.jumpY;

        // Dynamic Athletic Leap Pose (Knees tucked forward, arms poised for aerodynamic flight)
        this.hipLeftBone.rotation.x = -1.05;
        this.kneeLeftBone.rotation.x = 1.55;
        this.ankleLeftBone.rotation.x = 0.35;

        this.hipRightBone.rotation.x = -0.55;
        this.kneeRightBone.rotation.x = 1.25;
        this.ankleRightBone.rotation.x = -0.20;

        // Arms swept back for aerodynamic glide
        this.shoulderLeftBone.rotation.x = 0.65;
        this.shoulderLeftBone.rotation.z = -0.28;
        this.elbowLeftBone.rotation.x = -0.65;

        this.shoulderRightBone.rotation.x = 0.65;
        this.shoulderRightBone.rotation.z = 0.28;
        this.elbowRightBone.rotation.x = -0.65;

        this.chestBone.rotation.x = 0.22;
        this.pelvisBone.rotation.set(0, 0, 0);
        this.headBone.rotation.x = -0.14;
        break;
      }

      case 'FALL': {
        this.jumpVelocity += this.gravity * delta;
        this.jumpY += this.jumpVelocity * delta;

        // Check ground touchdown
        if (this.jumpY <= 0) {
          this.jumpY = 0;
          this.jumpVelocity = 0;
          this.isGrounded = true;
          this.currentAction = 'LAND';
          this.triggerLandingRebound();
          break;
        }

        this.group.position.y = this.jumpY;

        // Descending Air Pose: legs extend downward with flexed knees preparing for ground impact
        this.hipLeftBone.rotation.x = -0.35;
        this.kneeLeftBone.rotation.x = 0.45;
        this.ankleLeftBone.rotation.x = -0.15;

        this.hipRightBone.rotation.x = -0.25;
        this.kneeRightBone.rotation.x = 0.45;
        this.ankleRightBone.rotation.x = -0.15;

        // Arms spread slightly outward for aerodynamic equilibrium
        this.shoulderLeftBone.rotation.x = 0.20;
        this.shoulderLeftBone.rotation.z = -0.38;
        this.elbowLeftBone.rotation.x = -0.45;

        this.shoulderRightBone.rotation.x = 0.20;
        this.shoulderRightBone.rotation.z = 0.38;
        this.elbowRightBone.rotation.x = -0.45;

        this.chestBone.rotation.x = 0.10;
        this.headBone.rotation.x = -0.06;

        // Updraft wind lifts fringe and cords slightly
        this.hairFringe.rotation.x = 0.22;
        this.drawstringL.rotation.x = -0.10;
        this.drawstringR.rotation.x = -0.10;
        break;
      }

      case 'LAND': {
        // Landing shock absorption state
        if (this.landingReboundTime > 0) {
          this.landingReboundTime -= delta;
          const p = Math.max(0, 1.0 - this.landingReboundTime / this.landingReboundDuration);
          const spring = Math.sin(p * Math.PI * 1.5) * Math.exp(-p * 3.2);

          this.pelvisBone.position.y = 0.96 - spring * 0.14;
          const kneeBend = Math.max(0, -spring) * 0.42;
          this.kneeLeftBone.rotation.x = kneeBend;
          this.kneeRightBone.rotation.x = kneeBend;
          this.hipLeftBone.rotation.x = -kneeBend * 0.6;
          this.hipRightBone.rotation.x = -kneeBend * 0.6;

          this.chestBone.rotation.x = 0.18 + Math.max(0, -spring) * 0.15;

          const baseScale = (this.appearance.heightMeters / 1.78) * 1.08;
          this.group.scale.y = baseScale * (1 - spring * 0.08);
          this.group.scale.x = baseScale * (1 + spring * 0.04);
          this.group.scale.z = baseScale * (1 + spring * 0.04);

          if (this.landingReboundTime <= 0) {
            this.landingReboundTime = 0;
            this.currentAction = 'RUN';
          }
        } else {
          this.currentAction = 'RUN';
        }
        break;
      }

      case 'SLIDE': {
        this.slideTimer -= delta;
        if (this.slideTimer <= 0) {
          this.currentAction = 'RUN';
          this.pelvisBone.position.y = 0.96;
          this.chestBone.rotation.x = 0;
        } else {
          // Dynamic Low Parkour Slide
          this.pelvisBone.position.y = 0.40;
          this.chestBone.rotation.x = -0.68;
          this.chestBone.rotation.y = 0.15;

          // Extended lead leg
          this.hipLeftBone.rotation.x = -1.50;
          this.kneeLeftBone.rotation.x = 0.06;
          this.ankleLeftBone.rotation.x = 0.32;

          // Tucked rear leg
          this.hipRightBone.rotation.x = 0.48;
          this.hipRightBone.rotation.z = -0.22;
          this.kneeRightBone.rotation.x = 1.70;

          // Bracing arms skimming asphalt
          this.shoulderLeftBone.rotation.x = 0.78;
          this.shoulderLeftBone.rotation.z = -0.38;
          this.elbowLeftBone.rotation.x = -0.45;

          this.shoulderRightBone.rotation.x = 0.58;
          this.shoulderRightBone.rotation.z = 0.28;
          this.elbowRightBone.rotation.x = -0.65;
        }
        break;
      }

      case 'LANE_LEFT':
      case 'LANE_RIGHT':
      case 'DODGE': {
        const isLeft = this.currentAction === 'LANE_LEFT' || this.laneX > this.targetLaneX;
        const leanSign = isLeft ? -1 : 1;

        // Dynamic lateral banking with foot push-off
        const targetRoll = leanSign * 0.18;
        this.rollAngle = THREE.MathUtils.lerp(this.rollAngle, targetRoll, delta * 18);
        this.group.rotation.z = this.rollAngle;
        this.group.rotation.y = -leanSign * 0.12;

        this.chestBone.rotation.z = -this.rollAngle * 0.8;
        this.chestBone.rotation.x = 0.16;

        // Leading leg drives outward
        if (isLeft) {
          this.hipLeftBone.rotation.z = 0.15;
          this.hipRightBone.rotation.z = 0.05;
        } else {
          this.hipRightBone.rotation.z = -0.15;
          this.hipLeftBone.rotation.z = -0.05;
        }

        // Return to RUN once lane alignment is nearly reached
        if (Math.abs(this.laneX - this.targetLaneX) < 0.15) {
          this.currentAction = 'RUN';
        }
        break;
      }

      case 'HIT':
      case 'STUMBLE': {
        this.stumbleTimer -= delta;
        if (this.stumbleTimer <= 0) {
          this.stumbleTimer = 0;
          this.currentAction = 'RUN';
        } else {
          // Stumble recoil: torso snaps back, arms flail for balance
          const stagger = Math.sin(this.animTime * 24) * 0.08;
          this.chestBone.rotation.x = -0.38;
          this.chestBone.rotation.y = stagger;
          this.headBone.rotation.x = 0.22;

          this.shoulderLeftBone.rotation.x = -0.45;
          this.shoulderLeftBone.rotation.z = -0.65;
          this.shoulderRightBone.rotation.x = -0.45;
          this.shoulderRightBone.rotation.z = 0.65;

          this.hipLeftBone.rotation.x = 0.35 + stagger;
          this.hipRightBone.rotation.x = -0.25 - stagger;
          this.kneeLeftBone.rotation.x = 0.55;
          this.kneeRightBone.rotation.x = 0.55;
        }
        break;
      }

      case 'DEATH':
      case 'CRASH': {
        this.crashTumbleTime += delta;
        // Dynamic tumbling roll on impact
        this.chestBone.rotation.x = -0.65;
        this.headBone.rotation.x = 0.35;
        this.hipLeftBone.rotation.x = 0.65;
        this.hipRightBone.rotation.x = -0.55;
        this.kneeLeftBone.rotation.x = 1.4;
        this.kneeRightBone.rotation.x = 0.9;

        // Roll group slightly to simulate tumbling onto pavement
        this.group.rotation.x = Math.min(Math.PI * 0.45, this.crashTumbleTime * 5.0);
        this.group.position.y = Math.max(0, this.group.position.y - delta * 4.5);
        break;
      }

      case 'IDLE': {
        // Realistic Idle (Lively runner breathing, subtle weight shift, alert eyes)
        const breath = Math.sin(this.animTime * 2.2) * 0.020;
        const sway = Math.sin(this.animTime * 1.1) * 0.016;

        this.chestBone.position.y = 0.14 + breath;
        this.pelvisBone.position.y = 0.96 + breath * 0.5;
        this.pelvisBone.rotation.z = sway;

        this.chestBone.rotation.x = 0.04;
        this.chestBone.rotation.y = -sway * 0.8;
        this.headBone.rotation.y = sway * 0.5;

        this.shoulderLeftBone.rotation.x = -0.12 + breath * 0.4;
        this.shoulderLeftBone.rotation.z = -0.08;
        this.shoulderRightBone.rotation.x = -0.12 + breath * 0.4;
        this.shoulderRightBone.rotation.z = 0.08;

        this.elbowLeftBone.rotation.x = -0.42;
        this.elbowRightBone.rotation.x = -0.42;

        this.hipLeftBone.rotation.x = 0;
        this.hipRightBone.rotation.x = 0;
        this.kneeLeftBone.rotation.x = 0.05;
        this.kneeRightBone.rotation.x = 0.05;
        this.group.rotation.set(0, 0, 0);
        break;
      }
    }

    // 4. Dynamic Hand & Fingers Articulation (حركة أصابع اليدين الحيوية الواقعية)
    this.applyDynamicHandPoses(speedRatio);

    // Update Dust Particles
    this.updateFootstepDust(delta);
  }

  /**
   * Anatomically Articulated Hand and Finger Poses based on movement state
   */
  private applyDynamicHandPoses(speedRatio: number) {
    if (!this.handLeftRig || !this.handRightRig) return;

    const isRunning =
      this.currentAction === 'RUN' ||
      this.currentAction === 'FAST_RUN' ||
      this.currentAction === 'LANE_LEFT' ||
      this.currentAction === 'LANE_RIGHT' ||
      this.currentAction === 'DODGE';

    const isAirborne =
      this.currentAction === 'JUMP' ||
      this.currentAction === 'FALL' ||
      this.currentAction === 'LAND';

    const isStumblingOrCrashing =
      this.currentAction === 'HIT' ||
      this.currentAction === 'STUMBLE' ||
      this.currentAction === 'DEATH' ||
      this.currentAction === 'CRASH';

    if (isRunning) {
      // Natural athletic sprinter cup: fingers curved naturally, relaxed thumb
      const runCurl = 0.58 + Math.sin(this.animTime * 8) * 0.08 * speedRatio;
      const fingers = [
        this.handLeftRig.index,
        this.handLeftRig.middle,
        this.handLeftRig.ring,
        this.handLeftRig.pinky,
        this.handRightRig.index,
        this.handRightRig.middle,
        this.handRightRig.ring,
        this.handRightRig.pinky,
      ];

      fingers.forEach((f, i) => {
        const offset = (i % 4) * 0.05;
        f.mcp.rotation.x = runCurl + offset;
        f.pip.rotation.x = runCurl * 0.85;
        f.dip.rotation.x = runCurl * 0.55;
      });

      // Relaxed thumb resting over index finger
      this.handLeftRig.thumb.cmc.rotation.z = -0.32;
      this.handLeftRig.thumb.mcp.rotation.x = 0.42;
      this.handRightRig.thumb.cmc.rotation.z = 0.32;
      this.handRightRig.thumb.mcp.rotation.x = 0.42;

    } else if (isAirborne) {
      // Hands splayed open for aerodynamic balance and poise
      const fingers = [
        this.handLeftRig.index,
        this.handLeftRig.middle,
        this.handLeftRig.ring,
        this.handLeftRig.pinky,
        this.handRightRig.index,
        this.handRightRig.middle,
        this.handRightRig.ring,
        this.handRightRig.pinky,
      ];

      fingers.forEach((f) => {
        f.mcp.rotation.x = 0.18;
        f.pip.rotation.x = 0.14;
        f.dip.rotation.x = 0.10;
      });

      this.handLeftRig.thumb.cmc.rotation.z = -0.48;
      this.handLeftRig.thumb.mcp.rotation.x = 0.15;
      this.handRightRig.thumb.cmc.rotation.z = 0.48;
      this.handRightRig.thumb.mcp.rotation.x = 0.15;

    } else if (this.currentAction === 'SLIDE') {
      // Bracing palm & fingers skimming asphalt surface
      const fingers = [
        this.handLeftRig.index,
        this.handLeftRig.middle,
        this.handLeftRig.ring,
        this.handLeftRig.pinky,
        this.handRightRig.index,
        this.handRightRig.middle,
        this.handRightRig.ring,
        this.handRightRig.pinky,
      ];

      fingers.forEach((f) => {
        f.mcp.rotation.x = -0.22;
        f.pip.rotation.x = 0.28;
        f.dip.rotation.x = 0.20;
      });

    } else if (isStumblingOrCrashing) {
      // Flailing protective reflex hand pose
      const fingers = [
        this.handLeftRig.index,
        this.handLeftRig.middle,
        this.handLeftRig.ring,
        this.handLeftRig.pinky,
        this.handRightRig.index,
        this.handRightRig.middle,
        this.handRightRig.ring,
        this.handRightRig.pinky,
      ];

      fingers.forEach((f) => {
        f.mcp.rotation.x = -0.30;
        f.pip.rotation.x = 0.45;
        f.dip.rotation.x = 0.35;
      });

      this.handLeftRig.thumb.cmc.rotation.z = -0.55;
      this.handRightRig.thumb.cmc.rotation.z = 0.55;

    } else {
      // IDLE: relaxed natural hand curve
      const idleBreath = Math.sin(this.animTime * 2.2) * 0.05;
      const fingers = [
        this.handLeftRig.index,
        this.handLeftRig.middle,
        this.handLeftRig.ring,
        this.handLeftRig.pinky,
        this.handRightRig.index,
        this.handRightRig.middle,
        this.handRightRig.ring,
        this.handRightRig.pinky,
      ];

      fingers.forEach((f) => {
        f.mcp.rotation.x = 0.35 + idleBreath;
        f.pip.rotation.x = 0.30;
        f.dip.rotation.x = 0.20;
      });
    }
  }

  private emitFootstepDust() {
    const pos = this.footstepPositions;
    const vel = this.footstepVel;
    const life = this.footstepLife;
    const charPos = this.group.position;

    for (let i = 0; i < 4; i++) {
      const idx = (Math.floor(this.animTime * 20) + i) % 50;
      life[idx] = 0.42;
      pos[idx * 3] = charPos.x + (Math.random() - 0.5) * 0.24;
      pos[idx * 3 + 1] = 0.04;
      pos[idx * 3 + 2] = charPos.z - 0.15;

      vel[idx * 3] = (Math.random() - 0.5) * 0.35;
      vel[idx * 3 + 1] = 0.28 + Math.random() * 0.25;
      vel[idx * 3 + 2] = -0.45 - Math.random() * 0.4;
    }
  }

  private emitLandingDustBurst() {
    const pos = this.footstepPositions;
    const vel = this.footstepVel;
    const life = this.footstepLife;
    const charPos = this.group.position;

    for (let i = 0; i < 12; i++) {
      const idx = (Math.floor(this.animTime * 20) + i) % 50;
      life[idx] = 0.55;
      const angle = (i / 12) * Math.PI * 2;
      const r = 0.15 + Math.random() * 0.20;

      pos[idx * 3] = charPos.x + Math.cos(angle) * r;
      pos[idx * 3 + 1] = 0.04;
      pos[idx * 3 + 2] = charPos.z + Math.sin(angle) * r;

      vel[idx * 3] = Math.cos(angle) * (0.8 + Math.random() * 0.6);
      vel[idx * 3 + 1] = 0.35 + Math.random() * 0.35;
      vel[idx * 3 + 2] = Math.sin(angle) * (0.8 + Math.random() * 0.6);
    }
  }

  private updateFootstepDust(delta: number) {
    const pos = this.footstepPositions;
    const vel = this.footstepVel;
    const life = this.footstepLife;

    let hasActive = false;
    for (let i = 0; i < 50; i++) {
      if (life[i] > 0) {
        life[i] -= delta;
        pos[i * 3] += vel[i * 3] * delta;
        pos[i * 3 + 1] += vel[i * 3 + 1] * delta;
        pos[i * 3 + 2] += vel[i * 3 + 2] * delta;
        hasActive = true;
      } else {
        pos[i * 3 + 1] = -100;
      }
    }

    if (hasActive && this.footstepDustParticles.geometry.attributes.position) {
      this.footstepDustParticles.geometry.attributes.position.needsUpdate = true;
    }
  }

  // Jump Action Trigger
  public jump(skillBonus: number = 0) {
    if (this.isGrounded) {
      this.currentAction = 'JUMP';
      this.jumpVelocity = 11.8 * (1 + skillBonus * 0.25);
      this.isGrounded = false;
      this.slideTimer = 0;
    }
  }

  // Slide Action Trigger
  public slide(skillBonus: number = 0) {
    this.currentAction = 'SLIDE';
    this.slideDuration = 0.85 * (1 + skillBonus * 0.3);
    this.slideTimer = this.slideDuration;

    if (!this.isGrounded) {
      this.jumpVelocity = -24; // Fast athletic drop into slide
    }
  }

  public changeLane(direction: -1 | 1) {
    const currentLaneIdx = Math.round(this.targetLaneX / 2.5);
    const nextLaneIdx = Math.max(-1, Math.min(1, currentLaneIdx + direction));
    this.targetLaneX = nextLaneIdx * 2.5;

    // Trigger dynamic lateral banking animation if grounded
    if (this.isGrounded && (this.currentAction === 'RUN' || this.currentAction === 'FAST_RUN')) {
      this.currentAction = direction < 0 ? 'LANE_LEFT' : 'LANE_RIGHT';
    }
  }

  public moveLeft() {
    this.changeLane(-1);
  }

  public moveRight() {
    this.changeLane(1);
  }

  public dodge(direction: -1 | 1) {
    this.currentAction = 'DODGE';
    this.changeLane(direction);
  }

  public stumble(duration: number = 0.45) {
    this.currentAction = 'STUMBLE';
    this.stumbleTimer = duration;
  }

  public hit(duration: number = 0.45) {
    this.currentAction = 'HIT';
    this.stumbleTimer = duration;
  }

  public die() {
    this.currentAction = 'DEATH';
    this.crashTumbleTime = 0;
  }

  /**
   * Main game loop update method called by GameEngine
   */
  public update(
    delta: number,
    runSpeed: number,
    _balanceSkill: number = 1.0,
    _jumpBonus: number = 0,
    _slideBonus: number = 0
  ) {
    // Smooth lane lateral interpolation with critically damped easing (subway smoothness)
    this.laneX = THREE.MathUtils.lerp(this.laneX, this.targetLaneX, delta * 14.0);
    this.group.position.x = this.laneX;

    const speedRatio = Math.max(0.5, Math.min(2.5, runSpeed / 14.0));
    this.updateAnimation(delta, runSpeed, speedRatio);
  }

  public crash() {
    this.currentAction = 'CRASH';
  }

  public resetToStart() {
    this.currentAction = 'RUN';
    this.animTime = 0;
    this.gaitPhase = 0;
    this.jumpY = 0;
    this.jumpVelocity = 0;
    this.isGrounded = true;
    this.slideTimer = 0;
    this.landingReboundTime = 0;
    this.laneX = 0;
    this.targetLaneX = 0;
    this.rollAngle = 0;
    this.group.position.set(0, 0, 0);
    this.group.rotation.set(0, 0, 0);
    const baseScale = (this.appearance.heightMeters / 1.78) * 1.08;
    this.group.scale.set(baseScale, baseScale, baseScale);
  }
}

// Backwards-compatible export aliases
export {
  BassamCharacter as HammoudiCharacter,
  BassamCharacter as GameCharacter,
  HighPrecisionTextureEngine as HammoudiTextureGenerator,
  HighPrecisionTextureEngine as BassamTextureGenerator,
};
