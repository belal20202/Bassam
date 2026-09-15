/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { PlayerCustomization, CharacterAppearance, DEFAULT_CHARACTER_PROFILE, BiomeType, WeatherType } from '../types';
import { SHOP_ITEMS } from '../data/items';
import { CharacterTextureManager } from './characterTextures';
import { DynamicSkeletalRig, ArticulatedHandRig } from './skeletalRig';

export type CharacterAction = 'RUN' | 'JUMP' | 'SLIDE' | 'STUMBLE' | 'CRASH' | 'IDLE';

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

    // 2. Multi-tone Iris Gradient (Deep shadow at top, radiant amber/hazel below)
    const irisGrad = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
    irisGrad.addColorStop(0, '#1a0d05'); // Eyelid cast shadow
    irisGrad.addColorStop(0.35, '#3b1c0a');
    irisGrad.addColorStop(0.70, hexColor);
    irisGrad.addColorStop(1.0, '#f59e0b'); // Warm glowing lower iris
    ctx.fillStyle = irisGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r - 6, 0, Math.PI * 2);
    ctx.fill();

    // 3. Radiant Iris Striae (Intricate rays of warm light)
    ctx.save();
    ctx.translate(cx, cy);
    for (let angle = 0; angle < Math.PI * 2; angle += 0.12) {
      ctx.strokeStyle = Math.sin(angle * 3) > 0 ? 'rgba(251, 191, 36, 0.45)' : 'rgba(217, 119, 6, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * 32, Math.sin(angle) * 32);
      ctx.lineTo(Math.cos(angle) * (r - 10), Math.sin(angle) * (r - 10));
      ctx.stroke();
    }
    ctx.restore();

    // 4. Luminous Lower Crescent Reflection (Signature animated movie eye glow)
    const crescentGrad = ctx.createRadialGradient(cx, cy + 50, 10, cx, cy + 50, 75);
    crescentGrad.addColorStop(0, 'rgba(254, 240, 138, 0.85)');
    crescentGrad.addColorStop(0.55, 'rgba(245, 158, 11, 0.50)');
    crescentGrad.addColorStop(1, 'transparent');
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

    // 1. Materials with warm, rich stylized palette
    this.skinMat = new THREE.MeshStandardMaterial({
      color: 0xdfa37a, // Warm Middle-Eastern golden tan skin tone
      roughness: 0.50,
      metalness: 0.03,
    });

    this.faceMat = this.skinMat;
    this.handsMat = this.skinMat;

    this.eyeIrisMat = new THREE.MeshStandardMaterial({
      map: HighPrecisionTextureEngine.createIrisTexture(this.appearance.eyeColor.hex),
      roughness: 0.10,
      metalness: 0.05,
    });

    this.hoodieMat = new THREE.MeshStandardMaterial({
      map: this.textureManager.textures.jacketAlbedo,
      roughness: 0.65,
      metalness: 0.08,
    });

    this.pantsMat = new THREE.MeshStandardMaterial({
      map: this.textureManager.textures.joggersAlbedo,
      roughness: 0.70,
      metalness: 0.06,
    });

    this.shoeMat = new THREE.MeshStandardMaterial({
      map: this.textureManager.textures.sneakersAlbedo,
      roughness: 0.45,
      metalness: 0.12,
    });

    this.shoeSoleMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.32,
      metalness: 0.05,
    });

    this.hairMat = new THREE.MeshStandardMaterial({
      color: 0x16100d, // Natural dark espresso-black hair
      roughness: 0.52,
      metalness: 0.12,
    });

    this.capMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.60,
      metalness: 0.10,
    });

    this.backpackMat = new THREE.MeshStandardMaterial({
      map: this.textureManager.textures.backpackAlbedo,
      roughness: 0.58,
      metalness: 0.12,
    });

    this.goldTrimMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.85,
      roughness: 0.25,
    });

    // 2. Build Master Skeletal Structure with Solid Subway Surfers Proportions
    this.rootBone = new THREE.Group();
    this.rootBone.name = 'Root_Bone';
    this.group.add(this.rootBone);

    // Pelvis (Hips) - Solid, well-defined athletic runner hips
    this.pelvisBone = new THREE.Group();
    this.pelvisBone.position.set(0, 0.96, 0);
    this.rootBone.add(this.pelvisBone);

    const pelvisGeo = new THREE.CylinderGeometry(0.185, 0.160, 0.18, 18);
    this.pelvisMesh = new THREE.Mesh(pelvisGeo, this.pantsMat);
    this.pelvisMesh.castShadow = true;
    this.pelvisMesh.receiveShadow = true;
    this.pelvisBone.add(this.pelvisMesh);

    // Ribbed Waistband connecting hoodie and pants
    const waistbandGeo = new THREE.CylinderGeometry(0.190, 0.186, 0.045, 18);
    const waistbandMesh = new THREE.Mesh(waistbandGeo, this.hoodieMat);
    waistbandMesh.position.set(0, 0.08, 0);
    this.pelvisBone.add(waistbandMesh);

    // Spine
    this.spineLowerBone = new THREE.Group();
    this.spineLowerBone.position.set(0, 0.10, 0);
    this.pelvisBone.add(this.spineLowerBone);

    // Chest & Athletic Torso - Solid, sculpted Techwear Hoodie
    this.chestBone = new THREE.Group();
    this.chestBone.position.set(0, 0.17, 0);
    this.spineLowerBone.add(this.chestBone);

    const chestGeo = new THREE.CylinderGeometry(0.235, 0.185, 0.32, 20);
    this.chestMesh = new THREE.Mesh(chestGeo, this.hoodieMat);
    this.chestMesh.position.set(0, 0.13, 0);
    this.chestMesh.castShadow = true;
    this.chestMesh.receiveShadow = true;
    this.chestBone.add(this.chestMesh);

    // Sculpted Kangaroo Front Pouch Pocket
    const pocketGeo = new THREE.BoxGeometry(0.22, 0.13, 0.08);
    this.kangarooPocket = new THREE.Mesh(pocketGeo, this.hoodieMat);
    this.kangarooPocket.position.set(0, 0.03, 0.155);
    this.kangarooPocket.castShadow = true;
    this.chestBone.add(this.kangarooPocket);

    // Raised Ribbed Hoodie Collar around the neck
    const collarGeo = new THREE.TorusGeometry(0.105, 0.032, 12, 24);
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

    // Hoodie Drawstrings with Golden Metallic Aglets
    const cordGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.19, 8);
    this.drawstringL = new THREE.Mesh(cordGeo, this.goldTrimMat);
    this.drawstringL.position.set(-0.055, 0.17, 0.14);
    this.chestBone.add(this.drawstringL);

    this.drawstringR = new THREE.Mesh(cordGeo, this.goldTrimMat);
    this.drawstringR.position.set(0.055, 0.17, 0.14);
    this.chestBone.add(this.drawstringR);

    // Aglet tips
    const agletGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.025, 8);
    const agletL = new THREE.Mesh(agletGeo, this.goldTrimMat);
    agletL.position.set(0, -0.095, 0);
    this.drawstringL.add(agletL);

    const agletR = new THREE.Mesh(agletGeo, this.goldTrimMat);
    agletR.position.set(0, -0.095, 0);
    this.drawstringR.add(agletR);

    // Urban Runner Backpack
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

    // 1. Sculpted Handsome Stylized Head Geometry (Clean jawline, cheek contour & chin)
    const headGeo = new THREE.SphereGeometry(0.128, 28, 28);
    headGeo.scale(0.97, 1.12, 1.04);
    this.headMesh = new THREE.Mesh(headGeo, this.skinMat);
    this.headMesh.position.set(0, 0.12, -0.005);
    this.headMesh.castShadow = true;
    this.headBone.add(this.headMesh);

    // Sculpted Athletic Chin & Jaw
    const chinGeo = new THREE.SphereGeometry(0.044, 18, 18);
    chinGeo.scale(0.90, 0.72, 1.0);
    const chinMesh = new THREE.Mesh(chinGeo, this.skinMat);
    chinMesh.position.set(0, 0.018, 0.058);
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
   * Anatomical Stylized Ear
   */
  private createStylizedEar(side: number): THREE.Group {
    const ear = new THREE.Group();
    ear.position.set(side * 0.124, 0.118, -0.012);
    ear.rotation.y = side * 0.20; // 12-degree natural angle

    // Outer Helix rim
    const earGeo = new THREE.TorusGeometry(0.024, 0.006, 8, 16, Math.PI * 1.35);
    const earMesh = new THREE.Mesh(earGeo, this.skinMat);
    earMesh.rotation.z = side * 0.20;
    ear.add(earMesh);

    // Inner Antihelix ridge & fossa
    const innerGeo = new THREE.TorusGeometry(0.014, 0.004, 6, 12, Math.PI * 1.1);
    const innerMesh = new THREE.Mesh(innerGeo, this.skinMat);
    innerMesh.position.set(side * -0.004, 0.002, 0.002);
    innerMesh.rotation.z = side * 0.25;
    ear.add(innerMesh);

    // Tragus
    const tragusGeo = new THREE.SphereGeometry(0.006, 8, 8);
    tragusGeo.scale(0.8, 1.2, 0.8);
    const tragusMesh = new THREE.Mesh(tragusGeo, this.skinMat);
    tragusMesh.position.set(side * 0.006, -0.004, 0.007);
    ear.add(tragusMesh);

    // Soft rounded Lobule
    const lobeGeo = new THREE.SphereGeometry(0.009, 8, 8);
    lobeGeo.scale(0.85, 1.2, 0.75);
    const lobeMesh = new THREE.Mesh(lobeGeo, this.skinMat);
    lobeMesh.position.set(0, -0.020, 0);
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

    // Volumetric Sculpted Crown Locks (Modern textured fade top)
    const crownGeo = new THREE.SphereGeometry(0.128, 18, 18);
    crownGeo.scale(0.96, 0.78, 1.12);
    const crownMesh = new THREE.Mesh(crownGeo, this.hairMat);
    crownMesh.position.set(0, 0.095, 0.015);
    crownMesh.castShadow = true;
    hairGroup.add(crownMesh);

    // Dynamic Swept Hair Locks across the crown
    const lockDefs = [
      { x: -0.045, y: 0.12, z: 0.06, scale: 0.038, rotZ: 0.25 },
      { x: -0.015, y: 0.13, z: 0.07, scale: 0.042, rotZ: 0.10 },
      { x: 0.020, y: 0.13, z: 0.06, scale: 0.040, rotZ: -0.15 },
      { x: 0.050, y: 0.11, z: 0.05, scale: 0.035, rotZ: -0.30 },
    ];

    lockDefs.forEach((ld) => {
      const lockGeo = new THREE.ConeGeometry(ld.scale, ld.scale * 2.2, 8);
      lockGeo.rotateX(Math.PI * 0.35);
      lockGeo.rotateZ(ld.rotZ);
      const lock = new THREE.Mesh(lockGeo, this.hairMat);
      lock.position.set(ld.x, ld.y, ld.z);
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
      strandGroup.add(sMesh);

      hairFringe.add(strandGroup);
    });
    hairGroup.add(hairFringe);

    // Subway Surfers Iconic Runner Snapback Cap (Tilted backwards)
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

    // Start with cap enabled for authentic Subway Surfers flavor
    runnerCapGroup.visible = true;
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

    // Stylized Eyebrows (Heroic, confident arch)
    const leftEyebrowBone = new THREE.Group();
    leftEyebrowBone.position.set(-0.044, 0.062, 0.020);
    faceGroup.add(leftEyebrowBone);

    const rightEyebrowBone = new THREE.Group();
    rightEyebrowBone.position.set(0.044, 0.062, 0.020);
    faceGroup.add(rightEyebrowBone);

    const browGeo = new THREE.BoxGeometry(0.045, 0.008, 0.012);
    const browMeshL = new THREE.Mesh(browGeo, this.hairMat);
    browMeshL.rotation.z = -0.14;
    leftEyebrowBone.add(browMeshL);

    const browMeshR = new THREE.Mesh(browGeo, this.hairMat);
    browMeshR.rotation.z = 0.14;
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

    // =========================================================================
    // 3. CHARISMATIC RUNNER SMILE & TEETH
    // =========================================================================
    const mouthGroup = new THREE.Group();
    mouthGroup.position.set(0, -0.030, 0.028);
    faceGroup.add(mouthGroup);

    // Sculpted upper lip curve (Cupid's bow)
    const lipGeo = new THREE.TorusGeometry(0.022, 0.0040, 8, 18, Math.PI * 0.82);
    const lipMat = new THREE.MeshStandardMaterial({
      color: 0xc46955,
      roughness: 0.40,
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

    // Soft lower lip volume
    const lowerLipGeo = new THREE.BoxGeometry(0.018, 0.0042, 0.007);
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

    // Bicep Sleeve
    const bicepGeo = new THREE.CylinderGeometry(0.060, 0.052, 0.26, 16);
    const bicepMesh = new THREE.Mesh(bicepGeo, this.hoodieMat);
    bicepMesh.position.set(0, -0.13, 0);
    bicepMesh.castShadow = true;
    shoulderBone.add(bicepMesh);

    // Elbow Joint with Fabric Crease
    const elbowBone = new THREE.Group();
    elbowBone.position.set(0, -0.26, 0);
    shoulderBone.add(elbowBone);

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

    // Smart Fitness Watch on Left Wrist
    const watchGroup = new THREE.Group();
    if (side === -1) {
      const strapGeo = new THREE.CylinderGeometry(0.048, 0.048, 0.034, 16);
      const strapMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 });
      const strap = new THREE.Mesh(strapGeo, strapMat);
      watchGroup.add(strap);

      const screenGeo = new THREE.BoxGeometry(0.028, 0.022, 0.012);
      const screenMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.7,
        roughness: 0.2,
      });
      const screen = new THREE.Mesh(screenGeo, screenMat);
      screen.position.set(0, 0, 0.048);
      watchGroup.add(screen);
    }
    wristBone.add(watchGroup);

    // Stylized Athletic Hand in Runner Grip (Curved fist)
    const handGroup = new THREE.Group();
    wristBone.add(handGroup);

    const palmGeo = new THREE.BoxGeometry(0.058, 0.062, 0.042);
    const palmMesh = new THREE.Mesh(palmGeo, this.skinMat);
    palmMesh.position.set(0, -0.032, 0);
    handGroup.add(palmMesh);

    // Curled Fingers Rig
    const makeFinger = (xOffset: number, zOffset: number) => {
      const mcp = new THREE.Group();
      mcp.position.set(xOffset, -0.056, zOffset);
      handGroup.add(mcp);

      const fGeo = new THREE.CylinderGeometry(0.009, 0.008, 0.030, 8);
      const fMesh = new THREE.Mesh(fGeo, this.skinMat);
      fMesh.position.set(0, -0.015, 0);
      mcp.add(fMesh);

      const pip = new THREE.Group();
      pip.position.set(0, -0.030, 0);
      mcp.add(pip);

      const dip = new THREE.Group();
      dip.position.set(0, -0.024, 0);
      pip.add(dip);

      return { mcp, pip, dip };
    };

    const index = makeFinger(side * -0.018, 0.015);
    const middle = makeFinger(side * -0.006, 0.015);
    const ring = makeFinger(side * 0.006, 0.015);
    const pinky = makeFinger(side * 0.018, 0.015);

    const thumbCmc = new THREE.Group();
    thumbCmc.position.set(side * -0.028, -0.024, -0.010);
    handGroup.add(thumbCmc);

    const thumbMcp = new THREE.Group();
    thumbCmc.add(thumbMcp);

    const thumbIp = new THREE.Group();
    thumbMcp.add(thumbIp);

    const thumbMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.010, 0.009, 0.032, 8), this.skinMat);
    thumbMesh.position.set(side * -0.011, -0.014, 0);
    thumbMesh.rotation.z = side * 0.45;
    thumbMcp.add(thumbMesh);

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

    // Thigh - Athletic jogger thigh
    const thighGeo = new THREE.CylinderGeometry(0.076, 0.060, 0.40, 18);
    const thighMesh = new THREE.Mesh(thighGeo, this.pantsMat);
    thighMesh.position.set(0, -0.20, 0);
    thighMesh.castShadow = true;
    hipBone.add(thighMesh);

    // Knee Joint with Fabric Crease
    const kneeBone = new THREE.Group();
    kneeBone.position.set(0, -0.40, 0);
    hipBone.add(kneeBone);

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
    // CHUNKY SUBWAY SURFERS RUNNER SNEAKERS
    // =========================================================================
    const shoeGroup = new THREE.Group();
    ankleBone.add(shoeGroup);

    // 1. Thick Shock-Absorption White Rubber Outsole (0.04m thick with grip profile)
    const soleGeo = new THREE.BoxGeometry(0.108, 0.040, 0.24);
    const sole = new THREE.Mesh(soleGeo, this.shoeSoleMat);
    sole.position.set(0, -0.075, 0.042);
    sole.castShadow = true;
    shoeGroup.add(sole);

    // 2. Sneaker Leather / Mesh Upper
    const upperGeo = new THREE.BoxGeometry(0.102, 0.075, 0.22);
    const upper = new THREE.Mesh(upperGeo, this.shoeMat);
    upper.position.set(0, -0.030, 0.040);
    upper.castShadow = true;
    shoeGroup.add(upper);

    // 3. Rounded Rubber Toe Cap / Bumper
    const toeGeo = new THREE.SphereGeometry(0.050, 12, 12);
    toeGeo.scale(1.0, 0.65, 0.95);
    const toeBumper = new THREE.Mesh(toeGeo, this.shoeSoleMat);
    toeBumper.position.set(0, -0.048, 0.142);
    shoeGroup.add(toeBumper);

    // 4. White Shoelace Criss-Cross & Sneaker Tongue
    const tongueGeo = new THREE.BoxGeometry(0.055, 0.065, 0.08);
    const tongue = new THREE.Mesh(tongueGeo, this.shoeSoleMat);
    tongue.position.set(0, 0.005, 0.045);
    tongue.rotation.x = -0.32;
    shoeGroup.add(tongue);

    const lacesGeo = new THREE.BoxGeometry(0.058, 0.008, 0.075);
    const laces = new THREE.Mesh(lacesGeo, this.shoeSoleMat);
    laces.position.set(0, 0.010, 0.060);
    shoeGroup.add(laces);

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
   * Urban Runner Backpack
   */
  private createBackpack(): THREE.Group {
    const backpack = new THREE.Group();
    backpack.position.set(0, 0.14, -0.14);

    // Main pack body
    const packGeo = new THREE.BoxGeometry(0.24, 0.32, 0.14);
    const packMesh = new THREE.Mesh(packGeo, this.backpackMat);
    packMesh.castShadow = true;
    backpack.add(packMesh);

    // Front pocket with golden Mesopotamian star
    const pocketGeo = new THREE.BoxGeometry(0.18, 0.18, 0.06);
    const pocket = new THREE.Mesh(pocketGeo, this.backpackMat);
    pocket.position.set(0, -0.040, -0.095);
    backpack.add(pocket);

    const starEmblem = new THREE.Mesh(new THREE.CircleGeometry(0.030, 16), this.goldTrimMat);
    starEmblem.position.set(0, -0.040, -0.126);
    starEmblem.rotation.y = Math.PI;
    backpack.add(starEmblem);

    return backpack;
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
   * Initialize & Profile
   * Scaled to 1.08x baseline for solid Subway Surfers presence and high visual readability
   */
  public initializeCharacter(config?: { name?: string; age?: number; appearance?: Partial<CharacterAppearance> }) {
    if (config?.name) this.characterName = config.name;
    if (config?.age) this.age = config.age;
    if (config?.appearance) this.appearance = { ...this.appearance, ...config.appearance };

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
    const outfit = SHOP_ITEMS.find((i) => i.id === customization.equippedOutfit);
    const primary = outfit?.colorHex || '#1d4ed8';
    const secondary = outfit?.secondaryColorHex || '#f59e0b';

    this.textureManager.setColors(primary, secondary, '#0f172a', primary);
    this.textureManager.regenerateTextures();

    this.hoodieMat.map = this.textureManager.textures.jacketAlbedo;
    this.hoodieMat.needsUpdate = true;

    this.pantsMat.map = this.textureManager.textures.joggersAlbedo;
    this.pantsMat.needsUpdate = true;

    this.shoeMat.map = this.textureManager.textures.sneakersAlbedo;
    this.shoeMat.needsUpdate = true;

    this.backpackMat.map = this.textureManager.textures.backpackAlbedo;
    this.backpackMat.needsUpdate = true;

    // Handle Thobe Outfits
    if (customization.equippedOutfit.includes('thobe') || customization.equippedOutfit.includes('jalabiya')) {
      this.thobeSkirt.visible = true;
      (this.thobeSkirt.material as THREE.MeshStandardMaterial).color.set(primary);
    } else {
      this.thobeSkirt.visible = false;
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
      case 'RUN': {
        // Step cadence scales realistically with speed
        this.gaitPhase += delta * runSpeed * 0.60;

        const sinG = Math.sin(this.gaitPhase);
        const cosG = Math.cos(this.gaitPhase);

        // A. Pelvic Kinematics:
        // - Vertical Stride Bounce (Double frequency: lowest at foot-plant, highest at flight apex)
        const strideBounce = (Math.sin(this.gaitPhase * 2 - Math.PI * 0.5) * 0.5 + 0.5) * 0.055 * speedRatio;

        // - Landing Rebound Spring Damping (ارتداد الهبوط عند ملامسة الأرض)
        let reboundOffset = 0;
        let reboundKneeBend = 0;
        let reboundSquashY = 0;
        let reboundSquashXZ = 0;

        if (this.landingReboundTime > 0) {
          this.landingReboundTime -= delta;
          const p = Math.max(0, 1.0 - this.landingReboundTime / this.landingReboundDuration);
          // Elastic spring response: initial compression then damped rebound oscillation
          const spring = Math.sin(p * Math.PI * 1.5) * Math.exp(-p * 3.2);
          reboundOffset = -spring * 0.12; // Dip down then rebound up
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
        this.pelvisBone.rotation.y = sinG * 0.11 * speedRatio;

        // - Pelvic Roll (Trendelenburg tilt toward stance leg)
        this.pelvisBone.rotation.z = cosG * 0.038 * speedRatio;

        // - Pelvic Pitch
        this.pelvisBone.rotation.x = 0.06;

        // B. Torso & Chest Counter-Rotation:
        // - Chest yaw turns opposite to pelvis for athletic balance
        this.chestBone.rotation.y = -sinG * 0.13 * speedRatio;
        // - Chest roll compensates pelvic tilt to keep upper torso stable
        this.chestBone.rotation.z = -cosG * 0.026 * speedRatio;
        // - Forward athletic lean (Subway Surfers signature posture)
        this.chestBone.rotation.x = 0.15;

        // C. Head Stabilization (Eyes focused ahead):
        this.headBone.rotation.y = sinG * 0.03;
        this.headBone.rotation.z = -this.chestBone.rotation.z * 0.8;
        this.headBone.rotation.x = -0.09;

        // D. Leg Stride Cycle (Fluid & Physically Accurate):
        // Left Leg
        const leftHipAngle = -sinG * 0.80 * speedRatio;
        this.hipLeftBone.rotation.x = leftHipAngle;
        this.hipLeftBone.rotation.y = -sinG * 0.04;
        this.hipLeftBone.rotation.z = 0.02;

        if (sinG < 0) {
          // Forward drive: knee flexes up
          this.kneeLeftBone.rotation.x = Math.abs(sinG) * 0.85 + reboundKneeBend;
        } else {
          // Push-off recovery: heel kicks up toward glutes
          this.kneeLeftBone.rotation.x = Math.pow(sinG, 1.3) * 1.35 + reboundKneeBend;
        }

        this.ankleLeftBone.rotation.x = -cosG * 0.28;

        // Right Leg (180° out of phase)
        const rightHipAngle = sinG * 0.80 * speedRatio;
        this.hipRightBone.rotation.x = rightHipAngle;
        this.hipRightBone.rotation.y = sinG * 0.04;
        this.hipRightBone.rotation.z = -0.02;

        if (sinG > 0) {
          this.kneeRightBone.rotation.x = Math.abs(sinG) * 0.85 + reboundKneeBend;
        } else {
          this.kneeRightBone.rotation.x = Math.pow(-sinG, 1.3) * 1.35 + reboundKneeBend;
        }

        this.ankleRightBone.rotation.x = cosG * 0.28;

        // E. Arm Pumping (Opposite to legs, bent at 85°-95°):
        const leftArmAngle = sinG * 0.74 * speedRatio;
        this.shoulderLeftBone.rotation.x = leftArmAngle;
        this.shoulderLeftBone.rotation.z = -0.08 - Math.max(0, -leftArmAngle) * 0.12;
        this.shoulderLeftBone.rotation.y = sinG * 0.08;

        this.elbowLeftBone.rotation.x = -1.35 - Math.max(0, leftArmAngle) * 0.35;

        const rightArmAngle = -sinG * 0.74 * speedRatio;
        this.shoulderRightBone.rotation.x = rightArmAngle;
        this.shoulderRightBone.rotation.z = 0.08 + Math.max(0, -rightArmAngle) * 0.12;
        this.shoulderRightBone.rotation.y = -sinG * 0.08;

        this.elbowRightBone.rotation.x = -1.35 - Math.max(0, rightArmAngle) * 0.35;

        // F. Smooth Lateral Banking on Lane Shifts (Critically Damped)
        const targetRoll = (this.laneX - this.targetLaneX) * 0.11;
        this.rollAngle = THREE.MathUtils.lerp(this.rollAngle, targetRoll, delta * 14);
        this.group.rotation.z = this.rollAngle;
        this.group.rotation.y = -this.rollAngle * 0.35; // Slight steering yaw

        // Footstep dust
        if (strideBounce < 0.012 && this.animTime - this.nextDustIdx > 0.16) {
          this.emitFootstepDust();
          this.nextDustIdx = this.animTime;
        }
        break;
      }

      case 'JUMP': {
        this.jumpVelocity += this.gravity * delta;
        this.jumpY += this.jumpVelocity * delta;

        if (this.jumpY <= 0) {
          this.jumpY = 0;
          this.jumpVelocity = 0;
          this.isGrounded = true;
          this.currentAction = 'RUN';
          // Trigger the landing rebound effect!
          this.triggerLandingRebound();
        }

        this.group.position.y = this.jumpY;

        // Dynamic Athletic Leap Pose (Knees tucked, arms poised for balance)
        this.hipLeftBone.rotation.x = -0.95;
        this.kneeLeftBone.rotation.x = 1.45;
        this.ankleLeftBone.rotation.x = 0.35;

        this.hipRightBone.rotation.x = -0.45;
        this.kneeRightBone.rotation.x = 1.15;
        this.ankleRightBone.rotation.x = -0.20;

        // Arms swept back for aerodynamic glide
        this.shoulderLeftBone.rotation.x = 0.65;
        this.shoulderLeftBone.rotation.z = -0.25;
        this.elbowLeftBone.rotation.x = -0.65;

        this.shoulderRightBone.rotation.x = 0.65;
        this.shoulderRightBone.rotation.z = 0.25;
        this.elbowRightBone.rotation.x = -0.65;

        this.chestBone.rotation.x = 0.22;
        this.pelvisBone.rotation.set(0, 0, 0);
        this.headBone.rotation.x = -0.14;
        break;
      }

      case 'SLIDE': {
        this.slideTimer -= delta;
        if (this.slideTimer <= 0) {
          this.currentAction = 'RUN';
          this.pelvisBone.position.y = 0.96;
          this.chestBone.rotation.x = 0;
        } else {
          // Dynamic Low Subway Parkour Slide
          this.pelvisBone.position.y = 0.42;
          this.chestBone.rotation.x = -0.65;
          this.chestBone.rotation.y = 0.14;

          // Extended lead leg
          this.hipLeftBone.rotation.x = -1.45;
          this.kneeLeftBone.rotation.x = 0.08;
          this.ankleLeftBone.rotation.x = 0.30;

          // Tucked rear leg
          this.hipRightBone.rotation.x = 0.45;
          this.hipRightBone.rotation.z = -0.20;
          this.kneeRightBone.rotation.x = 1.65;

          // Bracing arms skimming asphalt
          this.shoulderLeftBone.rotation.x = 0.75;
          this.shoulderLeftBone.rotation.z = -0.35;
          this.elbowLeftBone.rotation.x = -0.45;

          this.shoulderRightBone.rotation.x = 0.55;
          this.shoulderRightBone.rotation.z = 0.25;
          this.elbowRightBone.rotation.x = -0.65;
        }
        break;
      }

      case 'IDLE': {
        // Lively Subway Surfers Idle (Breathing, relaxed runner posture, weight shift)
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

      case 'CRASH': {
        this.chestBone.rotation.x = -0.55;
        this.hipLeftBone.rotation.x = 0.45;
        this.hipRightBone.rotation.x = -0.45;
        this.group.position.y = Math.max(0, this.group.position.y - delta * 4);
        break;
      }
    }

    // Update Dust Particles
    this.updateFootstepDust(delta);
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
  }

  public moveLeft() {
    this.changeLane(-1);
  }

  public moveRight() {
    this.changeLane(1);
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
