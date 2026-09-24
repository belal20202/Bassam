/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { BassamCharacter, CharacterAction } from './character';
import { WorldManager } from './world';
import { ObstacleInstance } from './obstacles';

export interface GroundContactSample {
  height: number;
  normal: THREE.Vector3;
  isObstacle: boolean;
  surfaceType: 'ASPHALT' | 'RAMP' | 'OBSTACLE_ROOF' | 'CURB';
}

export type GroundHitResult = GroundContactSample;

export interface IKSolverResult {
  hipAngleX: number;
  hipAngleY: number;
  hipAngleZ: number;
  kneeAngleX: number;
  ankleAngleX: number;
  ankleAngleZ: number;
  footPlantY: number;
}

const _scratchDir = new THREE.Vector3();
const _hipWorldL = new THREE.Vector3();
const _hipWorldR = new THREE.Vector3();
const _leftIKResult: IKSolverResult = {
  hipAngleX: 0,
  hipAngleY: 0,
  hipAngleZ: 0,
  kneeAngleX: 0,
  ankleAngleX: 0,
  ankleAngleZ: 0,
  footPlantY: 0,
};
const _rightIKResult: IKSolverResult = {
  hipAngleX: 0,
  hipAngleY: 0,
  hipAngleZ: 0,
  kneeAngleX: 0,
  ankleAngleX: 0,
  ankleAngleZ: 0,
  footPlantY: 0,
};

/**
 * CharacterController implements modern player locomotion, lane switching,
 * jump/slide physical trajectories, and two-bone analytical Inverse Kinematics (IK)
 * to guarantee realistic foot placement and ground alignment in virtual Baghdad.
 */
export class CharacterController {
  public character: BassamCharacter;
  public worldManager: WorldManager | null = null;

  // Locomotion & Lanes (-2.5, 0, 2.5)
  public currentLane: number = 0; // -1 (left), 0 (center), 1 (right)
  public targetLaneX: number = 0;
  public currentLaneX: number = 0;
  public laneChangeVelocity: number = 0;
  public laneSmoothTime: number = 0.12;

  // Stride & Running Kinematics
  public runPhase: number = 0;
  public strideFrequency: number = 2.8; // Steps per second baseline
  public verticalPelvisOffset: number = 0;

  // IK Segment Lengths (Anatomically matched to Hammoudi 1.78m)
  public readonly thighLength: number = 0.44;
  public readonly shinLength: number = 0.44;
  public readonly footHeight: number = 0.08;

  // IK Targets & Ground Contact
  public leftFootTarget: THREE.Vector3 = new THREE.Vector3();
  public rightFootTarget: THREE.Vector3 = new THREE.Vector3();
  public leftFootGround: GroundContactSample = {
    height: 0,
    normal: new THREE.Vector3(0, 1, 0),
    isObstacle: false,
    surfaceType: 'ASPHALT',
  };
  public rightFootGround: GroundContactSample = {
    height: 0,
    normal: new THREE.Vector3(0, 1, 0),
    isObstacle: false,
    surfaceType: 'ASPHALT',
  };

  // Foot Stance & Planting Weights (0 = pure FK swing, 1 = locked IK ground plant)
  public leftFootPlantWeight: number = 0;
  public rightFootPlantWeight: number = 0;

  constructor(character: BassamCharacter, worldManager?: WorldManager) {
    this.character = character;
    if (worldManager) this.worldManager = worldManager;
  }

  public setWorldManager(wm: WorldManager) {
    this.worldManager = wm;
  }

  // =========================================================================
  // 1. GROUND & OBSTACLE SURFACE SAMPLER
  // =========================================================================
  public sampleGroundSurface(worldX: number, worldZ: number): GroundContactSample {
    let maxHeight = 0;
    const normal = new THREE.Vector3(0, 1, 0);
    let surfaceType: 'ASPHALT' | 'RAMP' | 'OBSTACLE_ROOF' | 'CURB' = 'ASPHALT';
    let isObstacle = false;

    // A. Sidewalk / Road Curbs in Baghdad (outside central 3-lane carriageway)
    if (Math.abs(worldX) > 3.6) {
      maxHeight = 0.22;
      surfaceType = 'CURB';
    }

    // B. Obstacles and Rooftop Ramps
    if (this.worldManager) {
      const obstacles = this.worldManager.obstacleManager.obstacles;
      for (const obs of obstacles) {
        if (obs.isCollided) continue;
        const dx = Math.abs(worldX - obs.lane);
        const dz = worldZ - obs.z;

        // Check if inside bounding box in X and Z
        const halfW = obs.width * 0.55;
        const halfD = obs.depth * 0.55;

        if (dx <= halfW && Math.abs(dz) <= halfD) {
          isObstacle = true;
          if (obs.type === 'RAMP_BUS') {
            // Inclined Ramp on Bus Roof (z = -halfD to +halfD climbs from 0 to 2.4m)
            const t = (dz + halfD) / (obs.depth || 1.0);
            const rampH = Math.max(0, Math.min(obs.height, t * obs.height));
            if (rampH > maxHeight) {
              maxHeight = rampH;
              surfaceType = 'RAMP';
              // Ramp slope normal
              normal.set(0, 1, -0.38).normalize();
            }
          } else if (obs.type === 'BUS' || obs.type === 'TAXI' || obs.type === 'CONCRETE_BARRIER') {
            const roofH = obs.height * 0.95;
            if (roofH > maxHeight) {
              maxHeight = roofH;
              surfaceType = 'OBSTACLE_ROOF';
              normal.set(0, 1, 0);
            }
          }
        }
      }
    }

    return { height: maxHeight, normal, isObstacle, surfaceType };
  }

  // =========================================================================
  // 2. TWO-BONE ANALYTICAL INVERSE KINEMATICS (IK) SOLVER
  // =========================================================================
  /**
   * Solves 2-bone leg IK (Thigh + Shin) in the sagittal and coronal planes:
   * Returns rotation angles for hip, knee, and ankle.
   */
  public solveTwoBoneLegIK(
    hipWorldPos: THREE.Vector3,
    footTargetWorld: THREE.Vector3,
    groundNormal: THREE.Vector3,
    outResult: IKSolverResult
  ): IKSolverResult {
    const L1 = this.thighLength;
    const L2 = this.shinLength;

    // Vector from hip to target foot (zero allocations)
    _scratchDir.subVectors(footTargetWorld, hipWorldPos);
    let dist = _scratchDir.length();

    // Clamp distance to avoid hyperbolic singularities
    const maxDist = L1 + L2 - 0.002;
    const minDist = Math.abs(L1 - L2) + 0.04;
    dist = Math.max(minDist, Math.min(maxDist, dist));

    // Law of Cosines
    const cosAlpha = (L1 * L1 + dist * dist - L2 * L2) / (2 * L1 * dist);
    const alpha = Math.acos(Math.max(-1, Math.min(1, cosAlpha)));

    const cosBeta = (L1 * L1 + L2 * L2 - dist * dist) / (2 * L1 * L2);
    const beta = Math.acos(Math.max(-1, Math.min(1, cosBeta)));

    // Angle of target vector relative to vertical (-Y)
    const pitchToTarget = Math.atan2(_scratchDir.z, -_scratchDir.y);
    const rollToTarget = Math.atan2(_scratchDir.x, -_scratchDir.y);

    // Knee bends backwards (-Z in character local coordinates)
    const kneeBend = Math.PI - beta;

    // Hip angle combines line of sight with triangle offset alpha
    const hipAngleX = pitchToTarget - alpha;
    const hipAngleZ = rollToTarget;

    // Ankle orientation to align shoe sole flush with ground surface normal
    const anklePitch = -Math.atan2(groundNormal.z, groundNormal.y);
    const ankleRoll = Math.atan2(groundNormal.x, groundNormal.y);

    outResult.hipAngleX = hipAngleX;
    outResult.hipAngleY = 0;
    outResult.hipAngleZ = hipAngleZ;
    outResult.kneeAngleX = kneeBend;
    outResult.ankleAngleX = anklePitch;
    outResult.ankleAngleZ = ankleRoll;
    outResult.footPlantY = footTargetWorld.y;

    return outResult;
  }

  // =========================================================================
  // 3. MAIN CONTROLLER UPDATE & IK GROUND RESOLUTION
  // =========================================================================
  public update(delta: number, runSpeed: number, balanceSkill: number = 0) {
    const char = this.character;
    const charPos = char.group.position;

    // A. Smooth Lane Transition with athletic lateral body banking
    const dx = this.targetLaneX - this.currentLaneX;
    const lateralVel = dx * 16.0;
    this.currentLaneX += dx * Math.min(1.0, delta * 14.0);
    char.laneX = this.currentLaneX;

    // Lateral bank roll (leaning into sharp turns on Baghdad streets)
    const bankAngle = (-dx * 0.14) * (1 - balanceSkill * 0.03);
    char.group.rotation.z = THREE.MathUtils.lerp(char.group.rotation.z, bankAngle, delta * 12.0);

    // B. Stride Cadence & Running Cycle
    if (char.currentAction === 'RUN') {
      const stepSpeed = (runSpeed / 4.2) * (1 + balanceSkill * 0.02);
      this.runPhase += delta * stepSpeed;

      const sinP = Math.sin(this.runPhase);
      const cosP = Math.cos(this.runPhase);

      // Pelvis natural athletic bounce (double-bounce per gait cycle)
      const pelvisBounce = -Math.abs(sinP) * 0.045;
      this.verticalPelvisOffset = pelvisBounce;

      // Calculate Left & Right Stride Foot Landing Predictions
      const strideLen = 0.42 * (runSpeed / 18.0);
      const leftFootX = this.currentLaneX - 0.12;
      const rightFootX = this.currentLaneX + 0.12;
      const footZBase = charPos.z;

      const leftZ = footZBase + sinP * strideLen;
      const rightZ = footZBase - sinP * strideLen;

      // Sample ground elevation under both feet
      this.leftFootGround = this.sampleGroundSurface(leftFootX, leftZ);
      this.rightFootGround = this.sampleGroundSurface(rightFootX, rightZ);

      // Foot Plant Weight: Foot is firmly grounded when moving backwards relative to hip
      // sinP > 0: Left leg in stance/drive phase, Right leg in flight/swing
      this.leftFootPlantWeight = THREE.MathUtils.clamp((sinP + 0.3) * 1.5, 0, 1);
      this.rightFootPlantWeight = THREE.MathUtils.clamp((-sinP + 0.3) * 1.5, 0, 1);

      // Set IK Targets
      const maxGroundUnderFeet = Math.max(this.leftFootGround.height, this.rightFootGround.height);
      const baseHipY = 0.90 + this.verticalPelvisOffset + Math.max(char.jumpY, maxGroundUnderFeet);

      _hipWorldL.set(leftFootX, baseHipY, footZBase);
      _hipWorldR.set(rightFootX, baseHipY, footZBase);

      // Foot target positions
      this.leftFootTarget.set(
        leftFootX,
        this.leftFootGround.height + this.footHeight + (sinP < 0 ? Math.abs(sinP) * 0.18 : 0),
        leftZ
      );

      this.rightFootTarget.set(
        rightFootX,
        this.rightFootGround.height + this.footHeight + (sinP > 0 ? Math.abs(sinP) * 0.18 : 0),
        rightZ
      );

      // Solve Two-Bone Inverse Kinematics for Left & Right Leg (zero allocations)
      const leftIK = this.solveTwoBoneLegIK(_hipWorldL, this.leftFootTarget, this.leftFootGround.normal, _leftIKResult);
      const rightIK = this.solveTwoBoneLegIK(_hipWorldR, this.rightFootTarget, this.rightFootGround.normal, _rightIKResult);

      // Apply IK blend to Character bones
      this.applyIKToBones(leftIK, rightIK, this.leftFootPlantWeight, this.rightFootPlantWeight);
    } else {
      // Idle, Jump, or Slide: default forward kinematics with adaptive ground height
      const centerGround = this.sampleGroundSurface(this.currentLaneX, charPos.z);
      if (char.jumpY <= 0.05 && centerGround.height > 0) {
        char.group.position.y = THREE.MathUtils.lerp(char.group.position.y, centerGround.height, delta * 15.0);
      }
    }
  }

  /**
   * Blend analytical IK rotations onto Hammoudi's bone hierarchy
   */
  private applyIKToBones(
    leftIK: IKSolverResult,
    rightIK: IKSolverResult,
    weightL: number,
    weightR: number
  ) {
    const char = this.character;

    // Blend Left Leg: Hip, Knee, Ankle
    if (weightL > 0.05) {
      char.thighLeftBone.rotation.x = THREE.MathUtils.lerp(
        char.thighLeftBone.rotation.x,
        leftIK.hipAngleX,
        weightL * 0.75
      );
      char.shinLeftBone.rotation.x = THREE.MathUtils.lerp(
        char.shinLeftBone.rotation.x,
        leftIK.kneeAngleX,
        weightL * 0.85
      );
      // Align ankle with ground slope
      char.ankleLeftBone.rotation.x = THREE.MathUtils.lerp(
        char.ankleLeftBone.rotation.x,
        leftIK.ankleAngleX,
        weightL * 0.8
      );
      char.ankleLeftBone.rotation.z = THREE.MathUtils.lerp(
        char.ankleLeftBone.rotation.z,
        leftIK.ankleAngleZ,
        weightL * 0.8
      );
    }

    // Blend Right Leg: Hip, Knee, Ankle
    if (weightR > 0.05) {
      char.thighRightBone.rotation.x = THREE.MathUtils.lerp(
        char.thighRightBone.rotation.x,
        rightIK.hipAngleX,
        weightR * 0.75
      );
      char.shinRightBone.rotation.x = THREE.MathUtils.lerp(
        char.shinRightBone.rotation.x,
        rightIK.kneeAngleX,
        weightR * 0.85
      );
      // Align ankle with ground slope
      char.ankleRightBone.rotation.x = THREE.MathUtils.lerp(
        char.ankleRightBone.rotation.x,
        rightIK.ankleAngleX,
        weightR * 0.8
      );
      char.ankleRightBone.rotation.z = THREE.MathUtils.lerp(
        char.ankleRightBone.rotation.z,
        rightIK.ankleAngleZ,
        weightR * 0.8
      );
    }
  }

  // =========================================================================
  // 4. USER ACTIONS & LANE SHIFTS
  // =========================================================================
  public changeLane(direction: -1 | 1) {
    const newLane = Math.max(-1, Math.min(1, this.currentLane + direction));
    if (newLane !== this.currentLane) {
      this.currentLane = newLane;
      this.targetLaneX = newLane * 2.5; // 2.5 meters per lane in Baghdad
    }
  }

  public moveLeft() {
    this.changeLane(-1);
  }

  public moveRight() {
    this.changeLane(1);
  }

  public jump(bonusMultiplier: number = 0) {
    this.character.jump(bonusMultiplier);
  }

  public slide(bonusMultiplier: number = 0) {
    this.character.slide(bonusMultiplier);
  }

  /**
   * Applies Inverse Kinematics leg placement based on ground hit sample
   */
  public updateLegIK(customGround?: GroundContactSample) {
    if (customGround) {
      this.leftFootGround = customGround;
      this.rightFootGround = customGround;
    }
    const char = this.character;
    const charPos = char.group.position;
    const leftFootX = char.laneX - 0.12;
    const rightFootX = char.laneX + 0.12;
    const baseHipY = 0.90 + this.verticalPelvisOffset + Math.max(char.jumpY, this.leftFootGround.height);
    _hipWorldL.set(leftFootX, baseHipY, charPos.z);
    _hipWorldR.set(rightFootX, baseHipY, charPos.z);

    this.leftFootTarget.set(leftFootX, this.leftFootGround.height + this.footHeight, charPos.z);
    this.rightFootTarget.set(rightFootX, this.rightFootGround.height + this.footHeight, charPos.z);

    const leftIK = this.solveTwoBoneLegIK(_hipWorldL, this.leftFootTarget, this.leftFootGround.normal, _leftIKResult);
    const rightIK = this.solveTwoBoneLegIK(_hipWorldR, this.rightFootTarget, this.rightFootGround.normal, _rightIKResult);

    this.applyIKToBones(leftIK, rightIK, 0.85, 0.85);
  }

  public reset() {
    this.currentLane = 0;
    this.targetLaneX = 0;
    this.currentLaneX = 0;
    this.runPhase = 0;
    this.verticalPelvisOffset = 0;
    this.leftFootPlantWeight = 0;
    this.rightFootPlantWeight = 0;
  }
}
