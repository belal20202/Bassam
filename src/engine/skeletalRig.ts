/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

/**
 * Secondary Physics Spring Bone for procedural organic movement (Hair, Backpack, Drawstrings)
 */
export class SpringBone {
  public target: THREE.Object3D;
  public restRotation: THREE.Euler;
  public currentVelocity: THREE.Vector3 = new THREE.Vector3();
  public currentOffset: THREE.Vector3 = new THREE.Vector3();
  public stiffness: number;
  public damping: number;
  public maxAngle: number;

  constructor(target: THREE.Object3D, stiffness: number = 180, damping: number = 12, maxAngle: number = 0.35) {
    this.target = target;
    this.restRotation = target.rotation.clone();
    this.stiffness = stiffness;
    this.damping = damping;
    this.maxAngle = maxAngle;
  }

  public update(delta: number, externalForce: THREE.Vector3) {
    // Hooke's Law with damping: F = -k*x - c*v + F_ext
    const springForce = this.currentOffset.clone().multiplyScalar(-this.stiffness);
    const dampingForce = this.currentVelocity.clone().multiplyScalar(-this.damping);
    const totalForce = springForce.add(dampingForce).add(externalForce);

    this.currentVelocity.addScaledVector(totalForce, delta);
    this.currentOffset.addScaledVector(this.currentVelocity, delta);

    // Clamp maximum spring displacement
    this.currentOffset.x = Math.max(-this.maxAngle, Math.min(this.maxAngle, this.currentOffset.x));
    this.currentOffset.y = Math.max(-this.maxAngle, Math.min(this.maxAngle, this.currentOffset.y));
    this.currentOffset.z = Math.max(-this.maxAngle, Math.min(this.maxAngle, this.currentOffset.z));

    // Apply rotation
    this.target.rotation.set(
      this.restRotation.x + this.currentOffset.x,
      this.restRotation.y + this.currentOffset.y,
      this.restRotation.z + this.currentOffset.z
    );
  }
}

/**
 * Articulated 5-finger rig interface
 */
export interface ArticulatedHandRig {
  handGroup: THREE.Group;
  wrist: THREE.Group;
  thumb: { cmc: THREE.Group; mcp: THREE.Group; ip: THREE.Group };
  index: { mcp: THREE.Group; pip: THREE.Group; dip: THREE.Group };
  middle: { mcp: THREE.Group; pip: THREE.Group; dip: THREE.Group };
  ring: { mcp: THREE.Group; pip: THREE.Group; dip: THREE.Group };
  pinky: { mcp: THREE.Group; pip: THREE.Group; dip: THREE.Group };
}

export type HandPoseType = 'RUNNER_RELAXED' | 'SPRINT_DRIVE' | 'JUMP_SPLAY' | 'SLIDE_BRACE';

/**
 * Dynamic Facial Rigging & Expression Blend Controller
 */
export class DynamicFacialRigController {
  public leftUpperLid: THREE.Mesh;
  public rightUpperLid: THREE.Mesh;
  public leftEyebrow: THREE.Group;
  public rightEyebrow: THREE.Group;
  public mouthGroup: THREE.Group;
  public lipsMesh: THREE.Mesh;
  public jawMesh: THREE.Mesh;

  // Blink state
  private blinkTimer: number = 0;
  private isBlinking: boolean = false;
  private blinkDuration: number = 0.16;

  // Athletic breathing state
  private breathPhase: number = 0;

  constructor(
    leftUpperLid: THREE.Mesh,
    rightUpperLid: THREE.Mesh,
    leftEyebrow: THREE.Group,
    rightEyebrow: THREE.Group,
    mouthGroup: THREE.Group,
    lipsMesh: THREE.Mesh,
    jawMesh: THREE.Mesh
  ) {
    this.leftUpperLid = leftUpperLid;
    this.rightUpperLid = rightUpperLid;
    this.leftEyebrow = leftEyebrow;
    this.rightEyebrow = rightEyebrow;
    this.mouthGroup = mouthGroup;
    this.lipsMesh = lipsMesh;
    this.jawMesh = jawMesh;
  }

  public update(delta: number, runSpeed: number, exertionLevel: number, nearMiss: boolean = false) {
    // 1. Natural Blinking (Randomized ~2.8 to 4.2 seconds)
    this.blinkTimer += delta;
    if (this.blinkTimer > 3.2 && !this.isBlinking) {
      this.isBlinking = true;
      this.blinkTimer = 0;
    }

    if (this.isBlinking) {
      const p = this.blinkTimer / this.blinkDuration;
      if (p >= 1.0) {
        this.isBlinking = false;
        this.leftUpperLid.scale.y = 1.0;
        this.rightUpperLid.scale.y = 1.0;
      } else {
        const lidClose = Math.sin(p * Math.PI);
        const lidScale = 1.0 + lidClose * 1.35;
        this.leftUpperLid.scale.y = lidScale;
        this.rightUpperLid.scale.y = lidScale;
      }
    }

    // 2. Athletic Exertion Breathing (Mouth respiration scaling with sprint velocity)
    const breathSpeed = 4.0 + (runSpeed / 20.0) * 3.5;
    this.breathPhase += delta * breathSpeed;
    const breathAmp = (Math.sin(this.breathPhase) * 0.5 + 0.5) * exertionLevel;

    // Mouth parts naturally for athletic ventilation
    const baseGap = Math.min(0.018, 0.004 + (runSpeed / 30.0) * 0.012);
    this.mouthGroup.position.y = -0.038 - breathAmp * baseGap;
    this.jawMesh.rotation.x = -0.12 - breathAmp * 0.06;

    // 3. Dynamic Brow Expressions (Athletic concentration vs near-miss surprise)
    if (nearMiss) {
      // Brows raised in momentary reflex
      this.leftEyebrow.position.y = 0.075;
      this.rightEyebrow.position.y = 0.075;
      this.leftEyebrow.rotation.z = -0.04;
      this.rightEyebrow.rotation.z = 0.04;
    } else {
      // Focused runner arch with micro-twitches
      const browFocus = Math.min(0.18, (runSpeed / 35.0) * 0.14);
      this.leftEyebrow.position.y = 0.065 - browFocus * 0.02;
      this.rightEyebrow.position.y = 0.065 - browFocus * 0.02;
      this.leftEyebrow.rotation.z = -0.12 - browFocus * 0.05;
      this.rightEyebrow.rotation.z = 0.12 + browFocus * 0.05;
    }
  }
}

/**
 * DynamicSkeletalRig integrates full-body forward kinematics,
 * dynamic facial controller, articulated hand poses, and secondary spring physics.
 */
export class DynamicSkeletalRig {
  public facialController: DynamicFacialRigController | null = null;
  public springBones: SpringBone[] = [];

  // Hand Rigs
  public handLeftRig: ArticulatedHandRig | null = null;
  public handRightRig: ArticulatedHandRig | null = null;

  public registerSpringBone(bone: THREE.Object3D, stiffness?: number, damping?: number, maxAngle?: number): SpringBone {
    const sb = new SpringBone(bone, stiffness, damping, maxAngle);
    this.springBones.push(sb);
    return sb;
  }

  public applyHandPose(hand: ArticulatedHandRig, pose: HandPoseType, side: number) {
    switch (pose) {
      case 'RUNNER_RELAXED': {
        // Soft aerodynamic curl - natural runner posture
        hand.wrist.rotation.set(0, 0, 0);
        // Thumb sits relaxed against index
        hand.thumb.cmc.rotation.set(0.2, side * 0.35, side * 0.28);
        hand.thumb.mcp.rotation.x = -0.32;
        hand.thumb.ip.rotation.x = -0.25;

        // Graduated flex from index to pinky
        hand.index.mcp.rotation.x = -0.58;
        hand.index.pip.rotation.x = -0.75;
        hand.index.dip.rotation.x = -0.42;

        hand.middle.mcp.rotation.x = -0.68;
        hand.middle.pip.rotation.x = -0.85;
        hand.middle.dip.rotation.x = -0.48;

        hand.ring.mcp.rotation.x = -0.78;
        hand.ring.pip.rotation.x = -0.92;
        hand.ring.dip.rotation.x = -0.52;

        hand.pinky.mcp.rotation.x = -0.85;
        hand.pinky.pip.rotation.x = -1.02;
        hand.pinky.dip.rotation.x = -0.58;
        break;
      }

      case 'SPRINT_DRIVE': {
        // Forward power pumping grip
        hand.wrist.rotation.set(0.12, 0, side * 0.08);
        hand.thumb.cmc.rotation.set(0.3, side * 0.45, side * 0.35);
        hand.thumb.mcp.rotation.x = -0.45;
        hand.thumb.ip.rotation.x = -0.35;

        hand.index.mcp.rotation.x = -0.82;
        hand.index.pip.rotation.x = -0.95;
        hand.index.dip.rotation.x = -0.55;

        hand.middle.mcp.rotation.x = -0.92;
        hand.middle.pip.rotation.x = -1.05;
        hand.middle.dip.rotation.x = -0.60;

        hand.ring.mcp.rotation.x = -0.98;
        hand.ring.pip.rotation.x = -1.10;
        hand.ring.dip.rotation.x = -0.65;

        hand.pinky.mcp.rotation.x = -1.05;
        hand.pinky.pip.rotation.x = -1.15;
        hand.pinky.dip.rotation.x = -0.70;
        break;
      }

      case 'JUMP_SPLAY': {
        // Fingers open slightly in aerodynamic flight balance
        hand.wrist.rotation.set(-0.15, 0, side * -0.1);
        hand.thumb.cmc.rotation.set(0.1, side * 0.55, side * 0.45);
        hand.thumb.mcp.rotation.x = -0.15;
        hand.thumb.ip.rotation.x = -0.05;

        hand.index.mcp.rotation.set(-0.25, 0, side * -0.08);
        hand.index.pip.rotation.x = -0.22;
        hand.index.dip.rotation.x = -0.12;

        hand.middle.mcp.rotation.set(-0.28, 0, 0);
        hand.middle.pip.rotation.x = -0.25;
        hand.middle.dip.rotation.x = -0.15;

        hand.ring.mcp.rotation.set(-0.32, 0, side * 0.06);
        hand.ring.pip.rotation.x = -0.28;
        hand.ring.dip.rotation.x = -0.18;

        hand.pinky.mcp.rotation.set(-0.38, 0, side * 0.12);
        hand.pinky.pip.rotation.x = -0.32;
        hand.pinky.dip.rotation.x = -0.20;
        break;
      }

      case 'SLIDE_BRACE': {
        // Palms angled downward to stabilize slide on Baghdadi pavement
        hand.wrist.rotation.set(0.35, 0, side * 0.15);
        hand.thumb.cmc.rotation.set(0.2, side * 0.4, side * 0.3);
        hand.thumb.mcp.rotation.x = -0.25;
        hand.thumb.ip.rotation.x = -0.15;

        hand.index.mcp.rotation.x = -0.42;
        hand.index.pip.rotation.x = -0.50;
        hand.index.dip.rotation.x = -0.30;

        hand.middle.mcp.rotation.x = -0.46;
        hand.middle.pip.rotation.x = -0.55;
        hand.middle.dip.rotation.x = -0.35;

        hand.ring.mcp.rotation.x = -0.50;
        hand.ring.pip.rotation.x = -0.60;
        hand.ring.dip.rotation.x = -0.38;

        hand.pinky.mcp.rotation.x = -0.55;
        hand.pinky.pip.rotation.x = -0.65;
        hand.pinky.dip.rotation.x = -0.42;
        break;
      }
    }
  }

  public update(delta: number, runSpeed: number, verticalAcc: number, lateralVel: number, isNearMiss: boolean = false) {
    // 1. Update Facial Rig
    if (this.facialController) {
      this.facialController.update(delta, runSpeed, 0.8, isNearMiss);
    }

    // 2. Secondary Physics Inertial Forces
    const extForce = new THREE.Vector3(
      -lateralVel * 0.08,               // lateral inertia (sways when changing lanes)
      -verticalAcc * 0.05,               // vertical bounce inertia (footstrike impact)
      (runSpeed / 25.0) * 0.12          // forward drag / wind inertia
    );

    for (const sb of this.springBones) {
      sb.update(delta, extForce);
    }
  }
}
