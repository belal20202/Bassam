/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { PlayerCustomization } from '../types';
import { SHOP_ITEMS } from '../data/items';

export type CharacterAction = 'RUN' | 'JUMP' | 'SLIDE' | 'STUMBLE' | 'CRASH' | 'IDLE';

export class BassamCharacter {
  public group: THREE.Group;

  // Body Skeleton & Groups
  public rootBone: THREE.Group;
  public hipsGroup: THREE.Group;
  public hips: THREE.Mesh;
  public spineGroup: THREE.Group;
  public chestGroup: THREE.Group;
  public chest: THREE.Mesh;
  public innerShirt: THREE.Mesh;
  public hoodieCollar: THREE.Group;
  public backpackGroup: THREE.Group;
  public smartwatchMesh: THREE.Group;

  public headGroup: THREE.Group;
  public head: THREE.Mesh;
  public hairGroup: THREE.Group;
  public faceGroup: THREE.Group;

  // Limbs
  public leftShoulder: THREE.Group;
  public rightShoulder: THREE.Group;
  public leftArm: THREE.Group;
  public rightArm: THREE.Group;
  public leftForearm: THREE.Group;
  public rightForearm: THREE.Group;
  public leftHand: THREE.Mesh;
  public rightHand: THREE.Mesh;

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

  // Accessories
  public shemaghMesh: THREE.Group | null = null;
  public sunglassesMesh: THREE.Group | null = null;
  public headphonesMesh: THREE.Group | null = null;

  // Dynamic Materials for live skinning & shop equips
  private skinMat: THREE.MeshStandardMaterial;
  private hairMat: THREE.MeshStandardMaterial;
  private jacketShellMat: THREE.MeshStandardMaterial;
  private jacketBackMat: THREE.MeshStandardMaterial;
  private jacketSleeveMat: THREE.MeshStandardMaterial;
  private hoodInteriorMat: THREE.MeshStandardMaterial;
  private innerShirtMat: THREE.MeshStandardMaterial;
  private pantsMat: THREE.MeshStandardMaterial;
  private pantsStripesMat: THREE.MeshStandardMaterial;
  private shoeUpperMat: THREE.MeshStandardMaterial;
  private shoeMidsoleMat: THREE.MeshStandardMaterial;
  private shoeOutsoleMat: THREE.MeshStandardMaterial;
  private shoeAirBubbleMat: THREE.MeshPhysicalMaterial;
  private shoeAccentMat: THREE.MeshStandardMaterial;
  private backpackMat: THREE.MeshStandardMaterial;
  private zipperMat: THREE.MeshStandardMaterial;
  private redAccentMat: THREE.MeshStandardMaterial;
  private watchScreenMat: THREE.MeshBasicMaterial;

  // Powerup FX Meshes
  public shieldMesh: THREE.Mesh;
  public magnetAura: THREE.Group;
  public turboJetMesh: THREE.Group;
  public trailParticles: THREE.Points;
  private trailPositions: Float32Array;
  private trailColors: Float32Array;
  private trailCount: number = 80;

  // Animation state
  public currentAction: CharacterAction = 'RUN';
  public animTime: number = 0;
  public gaitPhase: number = 0;
  public jumpY: number = 0;
  public jumpVelocity: number = 0;
  public isGrounded: boolean = true;
  public jumpDuration: number = 0;
  public slideTimer: number = 0;
  public slideDuration: number = 0.85;
  public laneX: number = 0;
  public targetLaneX: number = 0;
  public laneChangeSpeed: number = 19;
  public rollAngle: number = 0;
  public landingSquash: number = 0;

  // Collision dimensions
  public hitboxHeight: number = 1.8;
  public hitboxRadius: number = 0.55;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'Hammoudi';

    // 1. High-Fidelity Realistic Materials Setup
    // Warm, authentic Arab skin tone
    this.skinMat = new THREE.MeshStandardMaterial({
      color: 0xdf9b6d,
      roughness: 0.6,
      metalness: 0.05,
    });

    // Dark espresso textured hair with subtle sheen
    this.hairMat = new THREE.MeshStandardMaterial({
      color: 0x14100e,
      roughness: 0.85,
      metalness: 0.1,
    });

    // Light heather grey / off-white athletic running jacket shell
    this.jacketShellMat = new THREE.MeshStandardMaterial({
      color: 0xd4d4d8,
      roughness: 0.55,
      metalness: 0.08,
    });

    // Contrast charcoal raglan sleeves
    this.jacketSleeveMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.6,
      metalness: 0.08,
    });

    // Crimson red hood interior lining
    this.hoodInteriorMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b,
      roughness: 0.65,
    });

    // Inner athletic crewneck compression shirt
    this.innerShirtMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.7,
    });

    // Charcoal black athletic running joggers
    this.pantsMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.65,
    });

    // Dark red racing side stripes on joggers
    this.pantsStripesMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      roughness: 0.4,
    });

    // Modern running sneakers materials
    this.shoeUpperMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.45,
    });

    this.shoeMidsoleMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.35,
    });

    this.shoeOutsoleMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.8,
    });

    this.shoeAirBubbleMat = new THREE.MeshPhysicalMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.7,
      roughness: 0.1,
      metalness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });

    this.shoeAccentMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      roughness: 0.3,
    });

    // Compact tactical runner backpack
    this.backpackMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.55,
      metalness: 0.15,
    });

    // Metallic hardware / zips
    this.zipperMat = new THREE.MeshStandardMaterial({
      color: 0x383838,
      roughness: 0.25,
      metalness: 0.8,
    });

    // Red signature athletic accents
    this.redAccentMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      roughness: 0.35,
    });

    // Glowing smartwatch OLED UI screen
    this.watchScreenMat = new THREE.MeshBasicMaterial({
      color: 0x00f5ff,
    });

    // Build the high-resolution Back Panel Texture with Hammoudi's Arabic Name Badge
    this.jacketBackMat = this.createBackJacketMaterial();

    // 2. Root & Pelvis/Hips
    this.rootBone = new THREE.Group();
    this.rootBone.position.y = 0.95;
    this.group.add(this.rootBone);

    this.hipsGroup = new THREE.Group();
    this.rootBone.add(this.hipsGroup);

    // Hips / Pelvis with athletic contour
    const hipGeo = new THREE.CylinderGeometry(0.24, 0.21, 0.22, 14);
    this.hips = new THREE.Mesh(hipGeo, this.pantsMat);
    this.hips.castShadow = true;
    this.hipsGroup.add(this.hips);

    // 3. Spine & Athletic Upper Torso
    this.spineGroup = new THREE.Group();
    this.spineGroup.position.y = 0.14;
    this.hipsGroup.add(this.spineGroup);

    this.chestGroup = new THREE.Group();
    this.spineGroup.add(this.chestGroup);

    // Main Athletic Jacket Chest Body
    const chestGeo = new THREE.BoxGeometry(0.48, 0.46, 0.28);
    this.chest = new THREE.Mesh(chestGeo, this.jacketShellMat);
    this.chest.position.y = 0.23;
    this.chest.castShadow = true;
    this.chestGroup.add(this.chest);

    // Inner Black Crewneck Shirt (visible at collar & zip opening)
    const innerShirtGeo = new THREE.BoxGeometry(0.26, 0.44, 0.05);
    this.innerShirt = new THREE.Mesh(innerShirtGeo, this.innerShirtMat);
    this.innerShirt.position.set(0, 0.23, 0.125);
    this.chestGroup.add(this.innerShirt);

    // Front Central Full-Zip
    const zipGeo = new THREE.BoxGeometry(0.024, 0.44, 0.02);
    const zipMesh = new THREE.Mesh(zipGeo, this.zipperMat);
    zipMesh.position.set(0, 0.23, 0.145);
    this.chestGroup.add(zipMesh);

    // Red Chest Logo (Left Chest Stylized Runner Emblem)
    const chestLogoGeo = new THREE.ConeGeometry(0.035, 0.05, 3);
    const chestLogo = new THREE.Mesh(chestLogoGeo, this.redAccentMat);
    chestLogo.position.set(-0.13, 0.31, 0.145);
    chestLogo.rotation.z = Math.PI;
    this.chestGroup.add(chestLogo);

    // Back Aerodynamic Panel with Gold "حمودي" Name Badge
    const backBadgeGeo = new THREE.PlaneGeometry(0.42, 0.42);
    const backBadgeMesh = new THREE.Mesh(backBadgeGeo, this.jacketBackMat);
    backBadgeMesh.position.set(0, 0.23, -0.142);
    backBadgeMesh.rotation.y = Math.PI; // Face rear camera
    this.chestGroup.add(backBadgeMesh);

    // Athletic Folded Hood around the neck with Crimson Red Interior
    this.hoodieCollar = new THREE.Group();
    this.hoodieCollar.position.set(0, 0.45, -0.04);

    const hoodOuterGeo = new THREE.TorusGeometry(0.18, 0.055, 10, 18, Math.PI * 1.3);
    const hoodOuter = new THREE.Mesh(hoodOuterGeo, this.jacketShellMat);
    hoodOuter.rotation.x = Math.PI / 2.8;
    hoodOuter.rotation.z = Math.PI * 0.85;

    const hoodInnerGeo = new THREE.TorusGeometry(0.165, 0.045, 10, 18, Math.PI * 1.3);
    const hoodInner = new THREE.Mesh(hoodInnerGeo, this.hoodInteriorMat);
    hoodInner.rotation.x = Math.PI / 2.8;
    hoodInner.rotation.z = Math.PI * 0.85;
    hoodInner.position.y = 0.01;

    this.hoodieCollar.add(hoodOuter, hoodInner);
    this.chestGroup.add(this.hoodieCollar);

    // Ultra-Compact Tactical Sports Backpack
    this.backpackGroup = this.createBackpack();
    this.chestGroup.add(this.backpackGroup);

    // 4. Neck & Sculpted Arabic Head
    this.headGroup = new THREE.Group();
    this.headGroup.position.y = 0.5;
    this.spineGroup.add(this.headGroup);

    // Neck
    const neckGeo = new THREE.CylinderGeometry(0.095, 0.115, 0.13, 12);
    const neck = new THREE.Mesh(neckGeo, this.skinMat);
    neck.position.y = 0.055;
    this.headGroup.add(neck);

    // Anatomical Head
    const headGeo = new THREE.SphereGeometry(0.195, 18, 18);
    headGeo.scale(0.94, 1.14, 1.04);
    this.head = new THREE.Mesh(headGeo, this.skinMat);
    this.head.position.y = 0.24;
    this.head.castShadow = true;
    this.headGroup.add(this.head);

    // Jawline & Chin Contour
    const jawGeo = new THREE.BoxGeometry(0.16, 0.1, 0.14);
    const jaw = new THREE.Mesh(jawGeo, this.skinMat);
    jaw.position.set(0, 0.15, 0.08);
    jaw.rotation.x = -0.15;
    this.headGroup.add(jaw);

    // Modern Textured Wavy Quiff Hairstyle & Fade
    this.hairGroup = this.createModernArabHairstyle();
    this.headGroup.add(this.hairGroup);

    // Realistic Facial Features (Eyes, Eyebrows, Nose, Lips, Beard Stubble)
    this.faceGroup = this.createFacialFeatures();
    this.headGroup.add(this.faceGroup);

    // 5. Athletic Arms & Smartwatch with Joint Articulation
    const leftArmComponents = this.createArticulatedArm(-1);
    this.leftShoulder = leftArmComponents.shoulder;
    this.leftArm = leftArmComponents.arm;
    this.leftForearm = leftArmComponents.forearm;
    this.leftHand = leftArmComponents.hand;
    this.chestGroup.add(this.leftShoulder);

    const rightArmComponents = this.createArticulatedArm(1);
    this.rightShoulder = rightArmComponents.shoulder;
    this.rightArm = rightArmComponents.arm;
    this.rightForearm = rightArmComponents.forearm;
    this.rightHand = rightArmComponents.hand;
    this.chestGroup.add(this.rightShoulder);

    // 6. Running Legs & 3D Sculpted Sneakers with Joint Articulation
    const leftLegComponents = this.createArticulatedLeg(-1);
    this.leftHipJoint = leftLegComponents.hipJoint;
    this.leftLeg = leftLegComponents.thigh;
    this.leftKneeJoint = leftLegComponents.kneeJoint;
    this.leftShinGroup = leftLegComponents.shin;
    this.leftAnkleJoint = leftLegComponents.ankleJoint;
    this.leftShoeGroup = leftLegComponents.shoe;
    this.hipsGroup.add(this.leftHipJoint);

    const rightLegComponents = this.createArticulatedLeg(1);
    this.rightHipJoint = rightLegComponents.hipJoint;
    this.rightLeg = rightLegComponents.thigh;
    this.rightKneeJoint = rightLegComponents.kneeJoint;
    this.rightShinGroup = rightLegComponents.shin;
    this.rightAnkleJoint = rightLegComponents.ankleJoint;
    this.rightShoeGroup = rightLegComponents.shoe;
    this.hipsGroup.add(this.rightHipJoint);

    // 7. Shield FX Mesh (Hexagonal Forcefield)
    const shieldGeo = new THREE.IcosahedronGeometry(1.25, 2);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.4,
      wireframe: true,
      blending: THREE.AdditiveBlending,
    });
    this.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    this.shieldMesh.position.set(0, 0.4, 0);
    this.shieldMesh.visible = false;
    this.rootBone.add(this.shieldMesh);

    // 8. Magnet Orbital Aura
    this.magnetAura = new THREE.Group();
    const ringGeo = new THREE.TorusGeometry(0.9, 0.04, 8, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    const ring1 = new THREE.Mesh(ringGeo, ringMat);
    const ring2 = new THREE.Mesh(ringGeo, ringMat);
    ring2.rotation.x = Math.PI / 2;
    this.magnetAura.add(ring1, ring2);
    this.magnetAura.position.set(0, 0.3, 0);
    this.magnetAura.visible = false;
    this.rootBone.add(this.magnetAura);

    // 9. Turbo Thruster Jetpack
    this.turboJetMesh = new THREE.Group();
    const jetBodyGeo = new THREE.BoxGeometry(0.3, 0.35, 0.12);
    const jetBody = new THREE.Mesh(jetBodyGeo, new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 }));
    const thrusterGeo = new THREE.ConeGeometry(0.06, 0.22, 10);
    const thrusterMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
    const thrusterL = new THREE.Mesh(thrusterGeo, thrusterMat);
    thrusterL.position.set(-0.1, -0.22, 0);
    thrusterL.rotation.x = Math.PI;
    const thrusterR = new THREE.Mesh(thrusterGeo, thrusterMat);
    thrusterR.position.set(0.1, -0.22, 0);
    thrusterR.rotation.x = Math.PI;
    this.turboJetMesh.add(jetBody, thrusterL, thrusterR);
    this.turboJetMesh.position.set(0, 0.22, -0.22);
    this.turboJetMesh.visible = false;
    this.spineGroup.add(this.turboJetMesh);

    // 10. Running Particle Trail
    const pGeo = new THREE.BufferGeometry();
    this.trailPositions = new Float32Array(this.trailCount * 3);
    this.trailColors = new Float32Array(this.trailCount * 3);
    for (let i = 0; i < this.trailCount * 3; i++) {
      this.trailPositions[i] = 0;
      this.trailColors[i] = 1.0;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(this.trailPositions, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(this.trailColors, 3));

    const pMat = new THREE.PointsMaterial({
      color: 0xfbbf24,
      size: 0.22,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    });
    this.trailParticles = new THREE.Points(pGeo, pMat);
    this.group.add(this.trailParticles);
  }

  /**
   * High-Resolution Canvas Texture for Back of Jacket & Backpack (Bassam - بسام) with Iraqi Heritage Trims
   */
  private createBackJacketMaterial(): THREE.MeshStandardMaterial {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Sleek athletic dark carbon/heather base with Iraqi heritage embroidery
      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, 0, 512, 512);

      // Arabesque ornamental border trim
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 4;
      ctx.strokeRect(16, 16, 480, 480);

      ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
      ctx.lineWidth = 2;
      ctx.strokeRect(26, 26, 460, 460);

      // Central Aerodynamic Racing & Sayah Trim Spine
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.moveTo(150, 0);
      ctx.lineTo(362, 0);
      ctx.lineTo(330, 512);
      ctx.lineTo(182, 512);
      ctx.closePath();
      ctx.fill();

      // Golden Iraqi embroidery lines along Sayah vest
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(148, 0);
      ctx.lineTo(180, 512);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(364, 0);
      ctx.lineTo(332, 512);
      ctx.stroke();

      // Iraqi Flag Accent ribbon on upper back
      const flagY = 48;
      ctx.fillStyle = '#dc2626'; // Red
      ctx.fillRect(206, flagY, 100, 12);
      ctx.fillStyle = '#ffffff'; // White
      ctx.fillRect(206, flagY + 12, 100, 12);
      ctx.fillStyle = '#18181b'; // Black
      ctx.fillRect(206, flagY + 24, 100, 12);

      // Green Takbir badge in center of flag
      ctx.fillStyle = '#15803d';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('الله ★ اكبر', 256, flagY + 22);

      // Golden Chevron Speed Wings
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(190, 115);
      ctx.lineTo(256, 145);
      ctx.lineTo(322, 115);
      ctx.stroke();

      // Premium Golden Plaque Badge for "بسام" (Bassam)
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.roundRect(160, 160, 192, 230, 24);
      ctx.fill();

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 5;
      ctx.stroke();

      // Inner glow border
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(168, 168, 176, 214);

      // Top Tag: عداء بغداد
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 20px "Cairo", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('بسام • عداء بغداد', 256, 202);

      // Name Calligraphy: بسام (Bassam) - Realistic Athletic Iraqi Hero
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 68px "Cairo", sans-serif';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 18;
      ctx.fillText('بسام', 256, 276);
      ctx.shadowBlur = 0;

      // Developer credit: بلال النعيمي
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 17px "Cairo", sans-serif';
      ctx.fillText('تصميم وتطوير: بلال النعيمي', 256, 316);

      // Version & Made in Iraq
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 16px "Cairo", sans-serif';
      ctx.fillText('الإصدار 1.3 • صنع في العراق 🇮🇶', 256, 348);

      // Edition: 2026
      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 15px monospace';
      ctx.fillText('★ 2026 ★', 256, 376);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 8;

    return new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.4,
      metalness: 0.25,
    });
  }

  /**
   * Realistic Modern Iraqi Taper Fade Hairstyle (Textured Crop / Quiff)
   */
  private createModernArabHairstyle(): THREE.Group {
    const hair = new THREE.Group();

    // 1. Skull Base & Mid-Fade Underlayer
    const fadeBaseGeo = new THREE.SphereGeometry(0.21, 20, 20);
    fadeBaseGeo.scale(0.96, 0.98, 1.12);
    const fadeBase = new THREE.Mesh(fadeBaseGeo, this.hairMat);
    fadeBase.position.set(0, 0.29, -0.01);
    hair.add(fadeBase);

    // 2. Voluminous Textured Top (Athletic Crop / Modern Pompadour Quiff)
    const topGeo = new THREE.SphereGeometry(0.215, 18, 18);
    topGeo.scale(0.92, 0.65, 1.05);
    const topHair = new THREE.Mesh(topGeo, this.hairMat);
    topHair.position.set(0, 0.38, 0.03);
    topHair.rotation.x = -0.12;
    topHair.castShadow = true;
    hair.add(topHair);

    // 3. Natural Textured Locks on Crown and Forehead
    const lockMat = this.hairMat;
    const lockGeo = new THREE.BoxGeometry(0.06, 0.04, 0.12);
    const lockConfigs = [
      { x: 0.0, y: 0.41, z: 0.08, rx: -0.25, ry: 0.0, rz: 0.0 },
      { x: -0.07, y: 0.40, z: 0.07, rx: -0.22, ry: -0.15, rz: 0.12 },
      { x: 0.07, y: 0.40, z: 0.07, rx: -0.22, ry: 0.15, rz: -0.12 },
      { x: -0.05, y: 0.41, z: -0.02, rx: -0.1, ry: -0.1, rz: 0.08 },
      { x: 0.05, y: 0.41, z: -0.02, rx: -0.1, ry: 0.1, rz: -0.08 },
      { x: 0.0, y: 0.40, z: -0.08, rx: 0.1, ry: 0.0, rz: 0.0 },
    ];

    lockConfigs.forEach((c) => {
      const lock = new THREE.Mesh(lockGeo, lockMat);
      lock.position.set(c.x, c.y, c.z);
      lock.rotation.set(c.rx, c.ry, c.rz);
      hair.add(lock);
    });

    // 4. Clean Tapered Temple Sideburns
    const sideburnGeo = new THREE.BoxGeometry(0.025, 0.13, 0.06);
    const sideL = new THREE.Mesh(sideburnGeo, this.hairMat);
    sideL.position.set(-0.182, 0.22, 0.06);
    sideL.rotation.z = -0.1;

    const sideR = new THREE.Mesh(sideburnGeo, this.hairMat);
    sideR.position.set(0.182, 0.22, 0.06);
    sideR.rotation.z = 0.1;
    hair.add(sideL, sideR);

    // 5. Clean Tapered Nape (Back of Neck Fade)
    const napeGeo = new THREE.BoxGeometry(0.20, 0.11, 0.06);
    const nape = new THREE.Mesh(napeGeo, this.hairMat);
    nape.position.set(0, 0.19, -0.16);
    nape.rotation.x = -0.3;
    hair.add(nape);

    return hair;
  }

  /**
   * Sculpted Realistic Face with Human Proportions
   * (Detailed Anatomical Eyes, Hazel Iris, Upper/Lower Eyelids, Refined Nose, Athletic Jaw & Ears)
   */
  private createFacialFeatures(): THREE.Group {
    const face = new THREE.Group();

    // 1. Realistic Eyes
    const eyeWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xf4f4f5,
      roughness: 0.2,
    });
    const irisMat = new THREE.MeshStandardMaterial({
      color: 0x542b0c, // Deep warm Baghdad hazel-brown iris
      roughness: 0.15,
    });
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x09090b });
    const corneaGlossMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const createRealisticEye = (side: number) => {
      const eyeGroup = new THREE.Group();

      // Eyeball / Sclera
      const scleraGeo = new THREE.SphereGeometry(0.038, 14, 14);
      scleraGeo.scale(1.15, 0.95, 0.75);
      const sclera = new THREE.Mesh(scleraGeo, eyeWhiteMat);

      // Realistic Iris with radial depth
      const irisGeo = new THREE.CircleGeometry(0.022, 16);
      const iris = new THREE.Mesh(irisGeo, irisMat);
      iris.position.set(0, 0, 0.031);

      // Pupil
      const pupilGeo = new THREE.CircleGeometry(0.010, 14);
      const pupil = new THREE.Mesh(pupilGeo, pupilMat);
      pupil.position.set(0, 0, 0.032);

      // Cornea Specular Glint
      const specGeo = new THREE.CircleGeometry(0.005, 8);
      const spec = new THREE.Mesh(specGeo, corneaGlossMat);
      spec.position.set(0.006, 0.007, 0.033);

      // Upper Eyelid fold (skin crease)
      const upperLidGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.012, 10, 1, false, 0, Math.PI);
      const lidMat = this.skinMat;
      const upperLid = new THREE.Mesh(upperLidGeo, lidMat);
      upperLid.rotation.z = Math.PI / 2;
      upperLid.rotation.y = Math.PI / 2;
      upperLid.position.set(0, 0.025, 0.025);

      // Lower Eyelid subtle contour
      const lowerLid = upperLid.clone();
      lowerLid.rotation.z = -Math.PI / 2;
      lowerLid.position.set(0, -0.023, 0.022);

      eyeGroup.add(sclera, iris, pupil, spec, upperLid, lowerLid);
      eyeGroup.position.set(side * 0.074, 0.245, 0.176);
      return eyeGroup;
    };

    face.add(createRealisticEye(-1), createRealisticEye(1));

    // 2. Realistic Athletic Masculine Eyebrows
    const browMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.9,
    });
    const browGeo = new THREE.BoxGeometry(0.068, 0.015, 0.022);

    const browL = new THREE.Mesh(browGeo, browMat);
    browL.position.set(-0.074, 0.288, 0.188);
    browL.rotation.z = -0.12;

    const browR = new THREE.Mesh(browGeo, browMat);
    browR.position.set(0.074, 0.288, 0.188);
    browR.rotation.z = 0.12;

    face.add(browL, browR);

    // 3. Realistic Sculpted Nose (Bridge, tip, and nostrils)
    const noseGroup = new THREE.Group();
    // Bridge
    const bridgeGeo = new THREE.BoxGeometry(0.028, 0.075, 0.035);
    const bridge = new THREE.Mesh(bridgeGeo, this.skinMat);
    bridge.position.set(0, 0.22, 0.198);
    bridge.rotation.x = -0.22;

    // Tip
    const tipGeo = new THREE.SphereGeometry(0.024, 10, 10);
    tipGeo.scale(1.0, 0.85, 1.15);
    const tip = new THREE.Mesh(tipGeo, this.skinMat);
    tip.position.set(0, 0.195, 0.218);

    // Nostril wings
    const nostrilGeo = new THREE.SphereGeometry(0.014, 8, 8);
    const nostrilL = new THREE.Mesh(nostrilGeo, this.skinMat);
    nostrilL.position.set(-0.024, 0.19, 0.208);
    const nostrilR = new THREE.Mesh(nostrilGeo, this.skinMat);
    nostrilR.position.set(0.024, 0.19, 0.208);

    noseGroup.add(bridge, tip, nostrilL, nostrilR);
    face.add(noseGroup);

    // 4. Realistic Natural Lips
    const lipMat = new THREE.MeshStandardMaterial({
      color: 0x9f4430, // Natural muted lip tone
      roughness: 0.5,
    });
    // Upper lip with philtrum notch
    const upperLipGeo = new THREE.BoxGeometry(0.046, 0.011, 0.016);
    const upperLip = new THREE.Mesh(upperLipGeo, lipMat);
    upperLip.position.set(0, 0.155, 0.194);

    // Lower lip
    const lowerLipGeo = new THREE.BoxGeometry(0.044, 0.014, 0.018);
    const lowerLip = new THREE.Mesh(lowerLipGeo, lipMat);
    lowerLip.position.set(0, 0.141, 0.192);

    face.add(upperLip, lowerLip);

    // 5. Realistic Human Ears (Left & Right)
    const earMat = this.skinMat;
    const earGeo = new THREE.BoxGeometry(0.03, 0.09, 0.045);
    const earL = new THREE.Mesh(earGeo, earMat);
    earL.position.set(-0.192, 0.23, 0.02);
    earL.rotation.y = 0.25;

    const earR = new THREE.Mesh(earGeo, earMat);
    earR.position.set(0.192, 0.23, 0.02);
    earR.rotation.y = -0.25;

    face.add(earL, earR);

    // 6. Realistic Defined Jawline & Chin
    const jawMat = this.skinMat;
    const chinGeo = new THREE.BoxGeometry(0.085, 0.038, 0.065);
    const chin = new THREE.Mesh(chinGeo, jawMat);
    chin.position.set(0, 0.115, 0.165);
    face.add(chin);

    return face;
  }

  /**
   * Articulated Running Arm with Bicep, Forearm, and Smartwatch
   */
  private createArticulatedArm(side: number) {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.28, 0.38, 0);

    const arm = new THREE.Group();
    shoulder.add(arm);

    // Upper Arm (Sleeve)
    const upperGeo = new THREE.CylinderGeometry(0.065, 0.055, 0.24, 10);
    const upper = new THREE.Mesh(upperGeo, this.jacketSleeveMat);
    upper.position.y = -0.12;
    upper.castShadow = true;
    arm.add(upper);

    // Shoulder cap accent
    const capGeo = new THREE.SphereGeometry(0.075, 10, 10);
    const cap = new THREE.Mesh(capGeo, this.jacketShellMat);
    cap.position.y = -0.02;
    arm.add(cap);

    // Elbow / Forearm Joint
    const forearm = new THREE.Group();
    forearm.position.set(0, -0.24, 0);
    arm.add(forearm);

    // Forearm Mesh (Skin / Rolled up sleeve)
    const foreGeo = new THREE.CylinderGeometry(0.052, 0.045, 0.22, 10);
    const fore = new THREE.Mesh(foreGeo, this.skinMat);
    fore.position.y = -0.11;
    fore.castShadow = true;
    forearm.add(fore);

    // Hand (Relaxed Runner Fist)
    const handGeo = new THREE.BoxGeometry(0.07, 0.08, 0.065);
    const hand = new THREE.Mesh(handGeo, this.skinMat);
    hand.position.set(0, -0.24, 0);
    hand.castShadow = true;
    forearm.add(hand);

    // Smartwatch on Left Wrist (side === -1)
    if (side === -1) {
      this.smartwatchMesh = new THREE.Group();
      const bandGeo = new THREE.CylinderGeometry(0.056, 0.056, 0.04, 12);
      const bandMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8 });
      const band = new THREE.Mesh(bandGeo, bandMat);

      const screenGeo = new THREE.BoxGeometry(0.042, 0.048, 0.015);
      const screen = new THREE.Mesh(screenGeo, this.watchScreenMat);
      screen.position.set(0, 0, 0.052);

      this.smartwatchMesh.add(band, screen);
      this.smartwatchMesh.position.set(0, -0.18, 0);
      forearm.add(this.smartwatchMesh);
    }

    return { shoulder, arm, forearm, hand };
  }

  /**
   * Articulated Running Leg with Thigh, Shin, and 3D Sculpted Sneakers
   */
  private createArticulatedLeg(side: number) {
    const hipJoint = new THREE.Group();
    hipJoint.position.set(side * 0.13, -0.08, 0);

    const thigh = new THREE.Group();
    hipJoint.add(thigh);

    // Upper Thigh (Athletic Joggers)
    const thighGeo = new THREE.CylinderGeometry(0.092, 0.072, 0.36, 12);
    const thighMesh = new THREE.Mesh(thighGeo, this.pantsMat);
    thighMesh.position.y = -0.18;
    thighMesh.castShadow = true;
    thigh.add(thighMesh);

    // Dynamic Red Runner Side Stripe
    const stripeGeo = new THREE.BoxGeometry(0.018, 0.36, 0.04);
    const stripe = new THREE.Mesh(stripeGeo, this.pantsStripesMat);
    stripe.position.set(side * 0.09, -0.18, 0);
    thigh.add(stripe);

    // Knee Joint
    const kneeJoint = new THREE.Group();
    kneeJoint.position.set(0, -0.36, 0);
    thigh.add(kneeJoint);

    const shin = new THREE.Group();
    kneeJoint.add(shin);

    // Lower Shin (Tapered Joggers)
    const shinGeo = new THREE.CylinderGeometry(0.07, 0.052, 0.35, 12);
    const shinMesh = new THREE.Mesh(shinGeo, this.pantsMat);
    shinMesh.position.y = -0.175;
    shinMesh.castShadow = true;
    shin.add(shinMesh);

    // Ribbed Ankle Cuff
    const cuffGeo = new THREE.CylinderGeometry(0.054, 0.054, 0.045, 10);
    const cuff = new THREE.Mesh(cuffGeo, this.pantsMat);
    cuff.position.y = -0.33;
    shin.add(cuff);

    // Ankle Joint & Sculpted Running Sneaker
    const ankleJoint = new THREE.Group();
    ankleJoint.position.set(0, -0.35, 0);
    shin.add(ankleJoint);

    const shoe = this.createRunningSneaker();
    ankleJoint.add(shoe);

    return { hipJoint, thigh, kneeJoint, shin, ankleJoint, shoe };
  }

  /**
   * Multi-layered Performance Running Sneaker with Air Bubble Cushioning
   */
  private createRunningSneaker(): THREE.Group {
    const shoe = new THREE.Group();

    // 1. Main Upper Shoe Body
    const upperGeo = new THREE.BoxGeometry(0.12, 0.09, 0.26);
    const upper = new THREE.Mesh(upperGeo, this.shoeUpperMat);
    upper.position.set(0, -0.04, 0.04);
    upper.castShadow = true;
    shoe.add(upper);

    // 2. Toe Cap Spring
    const toeGeo = new THREE.SphereGeometry(0.062, 10, 10);
    toeGeo.scale(0.96, 0.7, 1.2);
    const toe = new THREE.Mesh(toeGeo, this.shoeUpperMat);
    toe.position.set(0, -0.05, 0.15);
    shoe.add(toe);

    // 3. Thick Foam Midsole (White)
    const midGeo = new THREE.BoxGeometry(0.128, 0.038, 0.28);
    const midsole = new THREE.Mesh(midGeo, this.shoeMidsoleMat);
    midsole.position.set(0, -0.085, 0.04);
    shoe.add(midsole);

    // 4. Visible Translucent Heel Air Bubble Cushion
    const airGeo = new THREE.BoxGeometry(0.122, 0.024, 0.1);
    const airBubble = new THREE.Mesh(airGeo, this.shoeAirBubbleMat);
    airBubble.position.set(0, -0.085, -0.05);
    shoe.add(airBubble);

    // 5. High-Traction Outsole (Dark)
    const outGeo = new THREE.BoxGeometry(0.13, 0.018, 0.285);
    const outsole = new THREE.Mesh(outGeo, this.shoeOutsoleMat);
    outsole.position.set(0, -0.105, 0.04);
    shoe.add(outsole);

    // 6. Dynamic Red Swoop Accent
    const swoopGeo = new THREE.BoxGeometry(0.134, 0.016, 0.14);
    const swoop = new THREE.Mesh(swoopGeo, this.shoeAccentMat);
    swoop.position.set(0, -0.04, 0.02);
    shoe.add(swoop);

    // 7. Tongue & Laces
    const tongueGeo = new THREE.BoxGeometry(0.07, 0.05, 0.12);
    const tongue = new THREE.Mesh(tongueGeo, this.shoeAccentMat);
    tongue.position.set(0, 0.01, 0.05);
    tongue.rotation.x = -0.3;
    shoe.add(tongue);

    return shoe;
  }

  /**
   * Tactical Aerodynamic Runner Backpack
   */
  private createBackpack(): THREE.Group {
    const pack = new THREE.Group();
    pack.position.set(0, 0.22, -0.18);

    const packBodyGeo = new THREE.BoxGeometry(0.24, 0.32, 0.09);
    const packBody = new THREE.Mesh(packBodyGeo, this.backpackMat);
    packBody.castShadow = true;
    pack.add(packBody);

    // Red contrast zipper line
    const packZipGeo = new THREE.BoxGeometry(0.18, 0.015, 0.095);
    const packZip = new THREE.Mesh(packZipGeo, this.redAccentMat);
    packZip.position.y = 0.08;
    pack.add(packZip);

    // Rear LED safety reflector
    const ledGeo = new THREE.BoxGeometry(0.08, 0.03, 0.015);
    const ledMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const led = new THREE.Mesh(ledGeo, ledMat);
    led.position.set(0, -0.1, -0.05);
    pack.add(led);

    // Rear Name Badge Mesh on Backpack (Bassam - بسام)
    const packBadgeGeo = new THREE.PlaneGeometry(0.22, 0.22);
    const packBadgeMesh = new THREE.Mesh(packBadgeGeo, this.jacketBackMat);
    packBadgeMesh.position.set(0, 0.02, -0.048);
    packBadgeMesh.rotation.y = Math.PI; // Face rear camera
    pack.add(packBadgeMesh);

    return pack;
  }

  // ==================== LIVE CUSTOMIZATION / SHOP ====================
  public applyCustomization(customization: PlayerCustomization) {
    // 1. Outfit Customization (Supporting all 20 distinctive styles)
    const outfit = SHOP_ITEMS.find((i) => i.id === customization.equippedOutfit);
    if (outfit) {
      this.jacketShellMat.color.set(outfit.colorHex);
      this.jacketSleeveMat.color.set(outfit.secondaryColorHex || '#18181b');
      this.hoodInteriorMat.color.set(outfit.secondaryColorHex || '#991b1b');
      this.innerShirtMat.color.set(outfit.secondaryColorHex ? outfit.secondaryColorHex : '#18181b');
      this.pantsMat.color.set(outfit.secondaryColorHex ? '#18181b' : '#27272a');
      this.pantsStripesMat.color.set(outfit.colorHex);
    }

    // 2. Shoes Customization
    const shoes = SHOP_ITEMS.find((i) => i.id === customization.equippedShoes);
    if (shoes) {
      this.shoeUpperMat.color.set(shoes.colorHex);
      if (shoes.id === 'shoes_classic_runner') {
        this.shoeUpperMat.color.set(0x18181b);
        this.shoeAccentMat.color.set(0xef4444);
        this.shoeMidsoleMat.color.set(0xffffff);
      } else if (shoes.id === 'shoes_lightning_bolt') {
        this.shoeUpperMat.color.set(0x18181b);
        this.shoeAccentMat.color.set(0xf59e0b);
        this.shoeMidsoleMat.color.set(0xfef08a);
      } else if (shoes.id === 'shoes_ocean_surge') {
        this.shoeUpperMat.color.set(0x0284c7);
        this.shoeAccentMat.color.set(0x06b6d4);
        this.shoeMidsoleMat.color.set(0xffffff);
      } else if (shoes.id === 'shoes_phoenix_flame') {
        this.shoeUpperMat.color.set(0xef4444);
        this.shoeAccentMat.color.set(0xf97316);
        this.shoeMidsoleMat.color.set(0x18181b);
      } else {
        this.shoeUpperMat.color.set(shoes.colorHex);
        this.shoeAccentMat.color.set(shoes.colorHex);
      }
    }

    // 3. Trail Customization
    const trail = SHOP_ITEMS.find((i) => i.id === customization.equippedTrail);
    if (trail) {
      (this.trailParticles.material as THREE.PointsMaterial).color.set(trail.colorHex);
    }

    // 4. Accessories
    if (this.shemaghMesh) {
      this.headGroup.remove(this.shemaghMesh);
      this.shemaghMesh = null;
    }
    if (this.sunglassesMesh) {
      this.faceGroup.remove(this.sunglassesMesh);
      this.sunglassesMesh = null;
    }
    if (this.headphonesMesh) {
      this.headGroup.remove(this.headphonesMesh);
      this.headphonesMesh = null;
    }

    if (customization.equippedAccessory === 'acc_modern_shemagh') {
      this.shemaghMesh = new THREE.Group();
      const shemaghGeo = new THREE.TorusGeometry(0.25, 0.08, 10, 20);
      const shemaghMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.8 });
      const shemaghTorus = new THREE.Mesh(shemaghGeo, shemaghMat);
      shemaghTorus.position.set(0, 0.04, 0.02);
      shemaghTorus.rotation.x = Math.PI / 2;
      this.shemaghMesh.add(shemaghTorus);
      this.headGroup.add(this.shemaghMesh);
    } else if (customization.equippedAccessory === 'acc_sport_shades') {
      this.sunglassesMesh = new THREE.Group();
      const shadesGeo = new THREE.BoxGeometry(0.28, 0.06, 0.06);
      const shadesMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.1,
        metalness: 0.9,
      });
      const shadesMesh = new THREE.Mesh(shadesGeo, shadesMat);
      shadesMesh.position.set(0, 0.25, 0.2);
      this.sunglassesMesh.add(shadesMesh);
      this.faceGroup.add(this.sunglassesMesh);
    } else if (customization.equippedAccessory === 'acc_pro_headphones') {
      this.headphonesMesh = new THREE.Group();
      const bandGeo = new THREE.TorusGeometry(0.23, 0.03, 8, 18, Math.PI);
      const bandMat = new THREE.MeshStandardMaterial({ color: 0x6366f1, metalness: 0.6 });
      const band = new THREE.Mesh(bandGeo, bandMat);
      band.position.set(0, 0.26, 0);

      const earGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.05, 14);
      const earL = new THREE.Mesh(earGeo, bandMat);
      earL.position.set(-0.22, 0.24, 0);
      earL.rotation.z = Math.PI / 2;
      const earR = new THREE.Mesh(earGeo, bandMat);
      earR.position.set(0.22, 0.24, 0);
      earR.rotation.z = Math.PI / 2;

      this.headphonesMesh.add(band, earL, earR);
      this.headGroup.add(this.headphonesMesh);
    }
  }

  // ==================== FLUID BIOMECHANICS & ANIMATION ENGINE ====================
  public update(
    delta: number,
    runSpeed: number,
    balanceSkillLevel: number,
    jumpSkillBonus: number,
    slideSkillBonus: number
  ) {
    // 1. Running Cadence Frequency
    const speedRatio = Math.max(1, runSpeed / 12);
    this.animTime += delta * speedRatio;
    this.gaitPhase = this.animTime * 11.5;

    // 2. Smooth Lane Change Physics with Natural Bank Angle
    const laneSpeed = this.laneChangeSpeed * (1 + (balanceSkillLevel - 1) * 0.08);
    this.laneX += (this.targetLaneX - this.laneX) * Math.min(delta * laneSpeed, 1);
    this.group.position.x = this.laneX;

    const laneDiff = this.targetLaneX - this.laneX;
    // In camera view looking towards +Z:
    // World X = -2.5 is Screen LEFT, World X = +2.5 is Screen RIGHT.
    // When moving towards Left (-X), laneDiff < 0 -> lean left (positive Z rotation tilts top to Left).
    // When moving towards Right (+X), laneDiff > 0 -> lean right (negative Z rotation tilts top to Right).
    this.rollAngle += (-laneDiff * 0.12 - this.rollAngle) * Math.min(delta * 14, 1);
    this.group.rotation.z = this.rollAngle;
    // Face smoothly into the movement direction (positive yaw towards right, negative towards left)
    this.group.rotation.y = laneDiff * 0.065;

    // 3. Jump & Parabolic Gravity Physics
    if (!this.isGrounded) {
      const gravity = -32;
      this.jumpVelocity += gravity * delta;
      this.jumpY += this.jumpVelocity * delta;

      if (this.jumpY <= 0) {
        this.jumpY = 0;
        this.jumpVelocity = 0;
        this.isGrounded = true;
        this.landingSquash = 0.12; // Landing cushion compression
        if (this.currentAction === 'JUMP') {
          this.currentAction = 'RUN';
        }
      }
      this.group.position.y = this.jumpY;
    }

    // Landing cushion squash recovery
    if (this.landingSquash > 0) {
      this.landingSquash = Math.max(0, this.landingSquash - delta * 1.2);
    }

    // 4. Slide Timer Physics
    if (this.currentAction === 'SLIDE') {
      this.slideTimer -= delta;
      this.hitboxHeight = 0.85; // Low duck profile
      if (this.slideTimer <= 0) {
        this.currentAction = 'RUN';
        this.hitboxHeight = 1.8;
      }
    } else {
      this.hitboxHeight = 1.8;
    }

    // 5. High-Fidelity Biomechanical Bone Synthesis
    this.animateBones(delta);

    // 6. Power-Up Meshes Update
    if (this.shieldMesh.visible) {
      this.shieldMesh.rotation.y += delta * 2;
      this.shieldMesh.rotation.x += delta * 1.5;
    }
    if (this.magnetAura.visible) {
      this.magnetAura.rotation.z += delta * 4;
      const scale = 1 + Math.sin(this.animTime * 6) * 0.08;
      this.magnetAura.scale.set(scale, scale, scale);
    }

    // 7. Particle Trail Update
    this.updateTrail(delta);
  }

  private animateBones(delta: number) {
    if (this.currentAction === 'RUN') {
      const phase = this.gaitPhase;
      const sinP = Math.sin(phase);
      const cosP = Math.cos(phase);
      const sin2P = Math.sin(phase * 2); // 2x frequency for vertical bounce per stride

      // 1. Natural Pelvis Vertical Double-Bounce & Lateral Sway
      // Human runners bounce down at foot contact and rise at mid-stride
      const verticalBounce = Math.abs(cosP) * 0.07 - this.landingSquash;
      this.rootBone.position.y = 0.95 + verticalBounce;

      // Pelvic Lateral Roll and Yaw (Twist with swinging leg)
      this.hipsGroup.rotation.z = sinP * 0.04;
      this.hipsGroup.rotation.y = sinP * 0.06;

      // 2. Counter-Torso Rotation on Spine
      // Spine twists opposite to the hips to balance running momentum
      this.spineGroup.rotation.y = -sinP * 0.07;
      this.spineGroup.rotation.x = 0.14; // Forward athletic runner lean
      this.spineGroup.rotation.z = -sinP * 0.03;

      // Head Stabilizer: Looks forward along the road
      this.headGroup.rotation.x = -0.1;
      this.headGroup.rotation.y = sinP * 0.02;

      // 3. Multi-Joint Leg Kinematics (Thigh, Knee, Ankle)
      // Left Leg
      this.leftHipJoint.rotation.x = sinP * 0.82;
      // Knee bends on backstroke (when thigh moves back) and uncurls forward
      const leftKneeBend = Math.max(0, -sinP) * 1.15;
      this.leftKneeJoint.rotation.x = leftKneeBend;
      // Ankle rolls for ground contact spring
      this.leftAnkleJoint.rotation.x = -sinP * 0.25;

      // Right Leg (Opposite phase)
      this.rightHipJoint.rotation.x = -sinP * 0.82;
      const rightKneeBend = Math.max(0, sinP) * 1.15;
      this.rightKneeJoint.rotation.x = rightKneeBend;
      this.rightAnkleJoint.rotation.x = sinP * 0.25;

      // 4. Natural Arm Swings (Elbows flexed ~80°, natural shoulder dips)
      // Left Arm swings opposite to Left Leg
      this.leftShoulder.rotation.x = -sinP * 0.72;
      this.leftShoulder.rotation.z = -0.15 - Math.abs(cosP) * 0.05;
      this.leftForearm.rotation.x = -0.45 + Math.abs(sinP) * 0.25; // Elbow flexes forward

      // Right Arm
      this.rightShoulder.rotation.x = sinP * 0.72;
      this.rightShoulder.rotation.z = 0.15 + Math.abs(cosP) * 0.05;
      this.rightForearm.rotation.x = -0.45 + Math.abs(sinP) * 0.25;
    } else if (this.currentAction === 'JUMP') {
      // Dynamic Airborne Stride Pose
      this.rootBone.position.y = 0.95;
      this.spineGroup.rotation.x = -0.08;
      this.spineGroup.rotation.y = 0;
      this.hipsGroup.rotation.z = 0;

      // Lead leg up, trailing leg extended aerodynamically
      this.leftHipJoint.rotation.x = -0.75;
      this.leftKneeJoint.rotation.x = 1.0;
      this.leftAnkleJoint.rotation.x = -0.2;

      this.rightHipJoint.rotation.x = 0.45;
      this.rightKneeJoint.rotation.x = 0.3;
      this.rightAnkleJoint.rotation.x = 0.4;

      // Arms raised for dynamic airborne balance
      this.leftShoulder.rotation.x = 0.95;
      this.leftShoulder.rotation.z = -0.35;
      this.leftForearm.rotation.x = -0.6;

      this.rightShoulder.rotation.x = 0.85;
      this.rightShoulder.rotation.z = 0.35;
      this.rightForearm.rotation.x = -0.6;
    } else if (this.currentAction === 'SLIDE') {
      // Low Athletic Sprint Slide
      this.rootBone.position.y = 0.42; // Drop low center of gravity
      this.spineGroup.rotation.x = -0.78; // Lean back smoothly
      this.spineGroup.rotation.y = 0.1;

      // Extended front leg, tucked back leg
      this.leftHipJoint.rotation.x = -1.25;
      this.leftKneeJoint.rotation.x = 0.2;

      this.rightHipJoint.rotation.x = -0.95;
      this.rightKneeJoint.rotation.x = 1.35;

      // Arms out for slide stability
      this.leftShoulder.rotation.x = -0.85;
      this.leftShoulder.rotation.z = -0.55;
      this.rightShoulder.rotation.x = 0.45;
      this.rightShoulder.rotation.z = 0.45;
    } else if (this.currentAction === 'CRASH') {
      // Realistic Stumble & Tumble
      this.rootBone.position.y = 0.28;
      this.spineGroup.rotation.x = -1.0;
      this.hipsGroup.rotation.z = 0.3;
      this.leftHipJoint.rotation.x = 0.8;
      this.rightHipJoint.rotation.x = -0.7;
      this.leftShoulder.rotation.z = -1.2;
      this.rightShoulder.rotation.z = 1.2;
    } else if (this.currentAction === 'IDLE') {
      // Relaxed Breathing Cycle & Weight Shifting
      const breath = Math.sin(this.animTime * 2.2);
      const weightShift = Math.sin(this.animTime * 0.9);

      this.rootBone.position.y = 0.95 + breath * 0.012;
      this.spineGroup.position.y = 0.14 + breath * 0.015;
      this.spineGroup.rotation.x = breath * 0.02;
      this.spineGroup.rotation.y = weightShift * 0.04;

      this.hipsGroup.rotation.z = weightShift * 0.02;

      this.leftHipJoint.rotation.x = 0;
      this.rightHipJoint.rotation.x = 0;
      this.leftKneeJoint.rotation.x = 0;
      this.rightKneeJoint.rotation.x = 0;

      // Relaxed arms hanging naturally by sides
      this.leftShoulder.rotation.x = 0.04 + breath * 0.02;
      this.leftShoulder.rotation.z = -0.1;
      this.leftForearm.rotation.x = -0.15;

      this.rightShoulder.rotation.x = 0.04 + breath * 0.02;
      this.rightShoulder.rotation.z = 0.1;
      this.rightForearm.rotation.x = -0.15;

      this.headGroup.rotation.x = -0.02;
      this.headGroup.rotation.y = weightShift * 0.03;
    }
  }

  private updateTrail(delta: number) {
    const pos = this.trailPositions;
    for (let i = (this.trailCount - 1) * 3; i >= 3; i -= 3) {
      pos[i] = pos[i - 3];
      pos[i + 1] = pos[i - 2];
      pos[i + 2] = pos[i - 1] - delta * 16;
    }

    pos[0] = (Math.random() - 0.5) * 0.4;
    pos[1] = -0.85 + (Math.random() - 0.5) * 0.2;
    pos[2] = -0.2;

    this.trailParticles.geometry.attributes.position.needsUpdate = true;
  }

  // ==================== PLAYER CONTROLS ====================
  public moveLeft() {
    if (this.currentAction === 'CRASH') return;
    const currentLaneIndex = Math.round(this.targetLaneX / 2.5);
    // Moving Left moves towards negative X (screen left)
    if (currentLaneIndex > -1) {
      this.targetLaneX = (currentLaneIndex - 1) * 2.5;
    }
  }

  public moveRight() {
    if (this.currentAction === 'CRASH') return;
    const currentLaneIndex = Math.round(this.targetLaneX / 2.5);
    // Moving Right moves towards positive X (screen right)
    if (currentLaneIndex < 1) {
      this.targetLaneX = (currentLaneIndex + 1) * 2.5;
    }
  }

  public jump(jumpSkillBonus: number = 0) {
    if (this.currentAction === 'CRASH') return;
    if (this.isGrounded) {
      this.isGrounded = false;
      const baseJumpVel = 13.2;
      this.jumpVelocity = baseJumpVel * (1 + jumpSkillBonus);
      this.currentAction = 'JUMP';
    }
  }

  public slide(slideSkillBonus: number = 0) {
    if (this.currentAction === 'CRASH') return;
    if (!this.isGrounded) {
      // Fast drop down
      this.jumpVelocity = -30;
    }
    this.currentAction = 'SLIDE';
    this.slideDuration = 0.85 * (1 + slideSkillBonus);
    this.slideTimer = this.slideDuration;
  }

  public resetToStart() {
    this.group.position.set(0, 0, 0);
    this.laneX = 0;
    this.targetLaneX = 0;
    this.jumpY = 0;
    this.jumpVelocity = 0;
    this.isGrounded = true;
    this.currentAction = 'RUN';
    this.shieldMesh.visible = false;
    this.magnetAura.visible = false;
    this.turboJetMesh.visible = false;
  }
}

// Backward-compatible alias for codebase compatibility
export { BassamCharacter as HammoudiCharacter };
