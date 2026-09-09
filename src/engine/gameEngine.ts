/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { BiomeType, GameSettings, PlayerData, PowerUpType, RunStats, ActivePowerUp, PlayerCustomization, WeatherType } from '../types';
import { HammoudiCharacter } from './character';
import { WorldManager, getRandomBiome, ALL_BIOMES } from './world';
import { ParticleFXManager } from './particleFX';
import { audioManager } from './audio';
import { getSkillValue } from '../data/skills';

export interface GameEngineCallbacks {
  onHUDUpdate: (
    distance: number,
    coins: number,
    activePowerUps: ActivePowerUp[],
    biome: BiomeType,
    scoreMultiplier: number,
    weather: WeatherType
  ) => void;
  onGameOver: (stats: RunStats) => void;
  onBiomeChange?: (biome: BiomeType) => void;
  onWeatherChange?: (weather: WeatherType) => void;
}

export class GameEngine {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public character: HammoudiCharacter;
  public worldManager: WorldManager;
  public particleFX: ParticleFXManager;

  // Running state
  public isRunning: boolean = false;
  public isPaused: boolean = false;
  public playerData: PlayerData;
  public runStats: RunStats;

  // Speed and Physics (Challenging & Fast-paced)
  public currentSpeed: number = 24; // Challenging base running speed
  public baseSpeed: number = 24;
  public maxSpeed: number = 46;
  public distanceRan: number = 0;
  public coinsCollectedInRun: number = 0;
  public scoreMultiplier: number = 1;
  public coinStreakCombo: number = 0;
  private wasInAir: boolean = false;
  private footstepTimer: number = 0;

  // Active Power-ups
  public activePowerUps: Map<PowerUpType, ActivePowerUp> = new Map();
  public shieldHitRemaining: number = 0;
  public hasRevivedInCurrentRun: boolean = false;

  // Dynamic Adaptive Difficulty System
  public adaptiveDifficultyFactor: number = 1.0;
  public dodgeStreak: number = 0;

  // Camera Shake & Dynamics
  private cameraShakeIntensity: number = 0;
  private cameraRoll: number = 0;
  private cameraBaseOffset: THREE.Vector3 = new THREE.Vector3(0, 3.8, -6.5);
  private cameraLookTarget: THREE.Vector3 = new THREE.Vector3(0, 1.6, 6);

  // Time & Animation
  private lastTime: number = 0;
  private animationFrameId: number | null = null;
  private callbacks: GameEngineCallbacks;

  // Biome Rotation Distance Counter
  private lastBiomeIndex: number = 0;
  private biomesList: BiomeType[] = ALL_BIOMES;
  public lastLostBiome: BiomeType | null = null;

  constructor(canvas: HTMLCanvasElement, playerData: PlayerData, callbacks: GameEngineCallbacks) {
    this.playerData = playerData;
    this.callbacks = callbacks;

    // 1. Three.js Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(65, canvas.clientWidth / canvas.clientHeight, 0.1, 400);

    // 2. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: playerData.settings.graphicsQuality !== 'LOW',
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, playerData.settings.graphicsQuality === 'HIGH' ? 2 : 1.2));
    this.renderer.shadowMap.enabled = playerData.settings.graphicsQuality !== 'LOW';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 3. World & Character
    this.character = new HammoudiCharacter();
    this.character.applyCustomization(playerData.customization);
    this.scene.add(this.character.group);

    this.worldManager = new WorldManager(this.scene);
    this.particleFX = new ParticleFXManager(this.scene);

    // Initialize run stats
    this.runStats = this.getInitialRunStats();

    // Initial positioning and start menu idle loop
    this.startMenuPreview();
  }

  private getInitialRunStats(startingBiome?: BiomeType): RunStats {
    const biome = startingBiome || getRandomBiome();
    return {
      distance: 0,
      coinsCollected: 0,
      score: 0,
      xpEarned: 0,
      obstaclesDodged: 0,
      powerUpsUsed: 0,
      jumpsPerformed: 0,
      slidesPerformed: 0,
      biomeChangedCount: 0,
      visitedBiomes: [biome],
      isNewRecord: false,
    };
  }

  public setQuality(quality: 'MEDIUM' | 'ULTRA') {
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality === 'ULTRA' ? 2 : 1.3));
    this.renderer.shadowMap.enabled = true;
    this.character.applyCustomization(this.playerData.customization);
  }

  public resize(width: number, height: number) {
    if (height === 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  // ==================== GAME LIFECYCLE ====================
  public startRun(isHeadstart: boolean = false) {
    this.isRunning = true;
    this.isPaused = false;
    this.hasRevivedInCurrentRun = false;
    this.distanceRan = 0;
    this.coinsCollectedInRun = 0;
    this.coinStreakCombo = 0;
    this.scoreMultiplier = 1;
    this.activePowerUps.clear();
    
    // Pick a fresh random starting Iraqi governorate (excluding the one just lost in previous session)
    const startingBiome = getRandomBiome(this.lastLostBiome || undefined);
    this.runStats = this.getInitialRunStats(startingBiome);

    this.character.resetToStart();
    this.character.applyCustomization(this.playerData.customization);
    this.worldManager.resetWorld(startingBiome);
    this.particleFX.clearAll();
    this.wasInAir = false;
    this.footstepTimer = 0;

    // Calculate base speed with skill bonuses
    const speedBonus = getSkillValue('speed', this.playerData.skills.speed) / 100;
    this.baseSpeed = 18 * (1 + speedBonus * 0.4);
    this.currentSpeed = this.baseSpeed;

    // Start background energetic music and dynamic Baghdad atmospheric ambient audio
    audioManager.startMusic(1.0);
    audioManager.startAmbient();

    // Apply headstart rocket booster if active
    if (isHeadstart) {
      this.activatePowerUp('TURBO_SPEED', 8);
    }

    this.lastTime = performance.now();
    this.loop();
  }

  public resumeRun() {
    this.isPaused = false;
    audioManager.resumeAmbient();
    this.lastTime = performance.now();
    this.loop();
  }

  public pauseRun() {
    this.isPaused = true;
    audioManager.pauseAmbient();
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public stopRun() {
    this.isRunning = false;
    this.isPaused = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    audioManager.stopMusic();
    audioManager.stopAmbient();
    this.startMenuPreview();
  }

  public startMenuPreview() {
    this.isRunning = false;
    this.isPaused = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.character.currentAction = 'IDLE';
    this.character.group.position.set(0, 0, 0);
    this.character.group.rotation.set(0, 0, 0);
    this.lastTime = performance.now();
    this.menuLoop();
  }

  private menuLoop = () => {
    if (this.isRunning) return;

    const now = performance.now();
    let delta = (now - this.lastTime) / 1000;
    if (delta > 0.1) delta = 0.1;
    this.lastTime = now;

    this.character.update(delta, 0, 1, 0, 0);

    // Position camera gracefully in front of Hammoudi for menu background
    this.camera.position.set(0, 1.45, 3.1);
    this.camera.lookAt(0, 1.0, 0);

    this.render();
    this.animationFrameId = requestAnimationFrame(this.menuLoop);
  };

  public revive() {
    // Revive Hammoudi with 3.5 seconds of invulnerability shield (Allowed only once per run)
    this.hasRevivedInCurrentRun = true;
    this.isRunning = true;
    this.isPaused = false;
    this.character.currentAction = 'RUN';
    this.activatePowerUp('SHIELD', 3.5);
    this.lastTime = performance.now();
    this.loop();
  }

  public updateCustomization(customization: PlayerCustomization) {
    this.playerData.customization = customization;
    this.character.applyCustomization(customization);
  }

  // ==================== MAIN LOOP ====================
  private loop = () => {
    if (!this.isRunning || this.isPaused) return;

    const now = performance.now();
    let delta = (now - this.lastTime) / 1000;
    this.lastTime = now;

    // Cap delta to prevent huge jumps on tab switch
    if (delta > 0.1) delta = 0.1;

    this.update(delta);
    this.render();

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private update(delta: number) {
    // 1. Time slow power-up modifier
    const timeSlowActive = this.activePowerUps.has('TIME_SLOW');
    const worldDelta = timeSlowActive ? delta * 0.6 : delta;

    // 2. Comfortable and Accessible Speed Scaling
    this.adaptiveDifficultyFactor = Math.min(
      1.0 + (this.distanceRan / 1200) * 0.2,
      2.0
    );

    const isTurbo = this.activePowerUps.has('TURBO_SPEED');
    const baseProgress = Math.min(this.distanceRan / 2000, 1.0) * 7.5;
    this.currentSpeed = isTurbo ? 38 : (this.baseSpeed + baseProgress);

    // 3. Move Character forward with exact meter calculations
    const forwardStep = this.currentSpeed * worldDelta;
    this.character.group.position.z += forwardStep;
    this.distanceRan = this.character.group.position.z;
    this.runStats.distance = this.distanceRan;

    // 4. Update Character physics & bones
    const balanceSkill = this.playerData.skills.balance;
    const jumpSkillBonus = getSkillValue('jump', this.playerData.skills.jump) / 100;
    const slideSkillBonus = getSkillValue('slide', this.playerData.skills.slide) / 100;
    const superJumpActive = this.activePowerUps.has('SUPER_JUMP');

    this.character.update(
      delta,
      this.currentSpeed,
      balanceSkill,
      superJumpActive ? jumpSkillBonus + 0.6 : jumpSkillBonus,
      slideSkillBonus
    );

    // 5. Update World Chunks & Dynamic Biome Rotation (Every 1500 meters exactly)
    const currentBiomeIdx = Math.floor(this.distanceRan / 1500) % this.biomesList.length;
    if (currentBiomeIdx !== this.lastBiomeIndex) {
      this.lastBiomeIndex = currentBiomeIdx;
      const nextBiome = this.biomesList[currentBiomeIdx];
      this.worldManager.setBiome(nextBiome);
      audioManager.setBiome(nextBiome);
      this.runStats.biomeChangedCount += 1;
      if (!this.runStats.visitedBiomes.includes(nextBiome)) {
        this.runStats.visitedBiomes.push(nextBiome);
      }
      if (this.callbacks.onBiomeChange) {
        this.callbacks.onBiomeChange(nextBiome);
      }
    }

    // Dynamic Distance-Based Baghdad Weather Transition (Dust storm, sunset, rain, night, clear)
    const targetWeather = this.getWeatherForDistance(this.distanceRan);
    if (targetWeather !== this.worldManager.currentWeather) {
      this.worldManager.setWeather(targetWeather);
      if (this.callbacks.onWeatherChange) {
        this.callbacks.onWeatherChange(targetWeather);
      }
    }

    this.worldManager.update(this.character.group.position.z, worldDelta, this.adaptiveDifficultyFactor);

    // 6. Update Active Power-ups Countdown
    this.updatePowerUps(delta);

    // 7. Update Obstacles, Coins & Magnet Physics
    const magnetActive = this.activePowerUps.has('MAGNET');
    const magnetSkillBonus = getSkillValue('magnet', this.playerData.skills.magnet);
    const magnetRadius = magnetActive ? (8 + magnetSkillBonus * 0.5) : 0;
    
    this.worldManager.obstacleManager.update(
      worldDelta,
      this.character.group.position.z,
      magnetActive,
      this.character.group.position,
      magnetRadius
    );

    // Track successfully dodged obstacles as they pass behind the runner
    const pZ = this.character.group.position.z;
    for (const obs of this.worldManager.obstacleManager.obstacles) {
      if (!obs.isCollided && obs.mesh.position.z < pZ - 2.5 && !(obs as any).isPassed) {
        (obs as any).isPassed = true;
        this.dodgeStreak += 1;
        this.runStats.obstaclesDodged += 1;
      }
    }

    // 8. Dynamic Particle Systems & Visual FX
    const isWet = this.worldManager.currentWeather === 'LIGHT_RAIN_MIST' ||
      this.worldManager.currentWeather === 'BAGHDAD_STORM' ||
      this.worldManager.currentWeather === 'KARRADA_NIGHT';

    // Slide Dust & Asphalt Friction Sparks
    if (this.character.currentAction === 'SLIDE') {
      this.particleFX.emitSlideDustAndSparks(
        this.character.group.position,
        this.character.laneX,
        isWet,
        this.currentSpeed
      );
    }

    // Jump Landing Shockwave & Dust
    if (this.wasInAir && this.character.jumpY <= 0.06 && this.character.currentAction !== 'JUMP') {
      this.particleFX.emitLandingImpact(this.character.group.position, isWet);
      this.wasInAir = false;
    } else if (this.character.jumpY > 0.3) {
      this.wasInAir = true;
    }

    // Footstep Ground Dust / Water Spray while running
    if (this.character.currentAction === 'RUN' && this.character.jumpY <= 0.05) {
      this.footstepTimer += delta * (this.currentSpeed / 5.0);
      if (this.footstepTimer >= 1.0) {
        this.footstepTimer = 0;
        this.particleFX.emitFootstep(this.character.group.position, Math.random() > 0.5, isWet);
      }
    }

    // Turbo Speed Jet Trail & Plasma Sparks
    if (isTurbo) {
      this.particleFX.emitTurboTrail(this.character.group.position);
    }

    // Dynamic Weather Atmospheric Particle Effects (العواصف الرملية، المطر، غبار بغداد وأضواء النيون)
    this.particleFX.emitAmbientWeather(
      this.character.group.position,
      this.worldManager.currentWeather,
      delta
    );

    // Subtle Heritage Lantern Warmth in Old Baghdad Districts (فوانيس المتنبي، الرشيد، والكاظمية)
    this.particleFX.emitHeritageLanternGlow(
      this.character.group.position,
      this.worldManager.currentBiome
    );

    // Update Particle Batch Buffers
    this.particleFX.update(delta);

    // 9. Collision Detection
    this.checkCollisions();

    // 10. Camera Dynamic Follow & Shake
    this.updateCamera(delta, forwardStep);

    // 11. Update HUD Callback
    const activeList = Array.from(this.activePowerUps.values());
    this.callbacks.onHUDUpdate(
      Math.round(this.distanceRan),
      this.coinsCollectedInRun,
      activeList,
      this.worldManager.currentBiome,
      this.scoreMultiplier,
      this.worldManager.currentWeather
    );
  }

  // ==================== POWER-UPS MANAGEMENT ====================
  public activatePowerUp(type: PowerUpType, customDuration?: number) {
    let duration = customDuration;

    if (!duration) {
      if (type === 'MAGNET') {
        duration = getSkillValue('magnet', this.playerData.skills.magnet);
      } else if (type === 'SHIELD') {
        duration = getSkillValue('shield', this.playerData.skills.shield);
      } else if (type === 'TURBO_SPEED') {
        duration = getSkillValue('speed', this.playerData.skills.speed);
      } else if (type === 'MULTIPLIER') {
        duration = getSkillValue('energy', this.playerData.skills.energy);
      } else if (type === 'TIME_SLOW') {
        duration = getSkillValue('balance', this.playerData.skills.balance);
      } else {
        duration = 3.0;
      }
    }

    if (type === 'MAGNET') {
      this.character.magnetAura.visible = true;
    } else if (type === 'SHIELD') {
      this.character.shieldMesh.visible = true;
      this.shieldHitRemaining = this.playerData.skills.shield >= 7 ? 2 : 1;
    } else if (type === 'TURBO_SPEED') {
      this.character.turboJetMesh.visible = true;
      audioManager.playTurbo();
    } else if (type === 'MULTIPLIER') {
      this.scoreMultiplier = 2;
    } else if (type === 'TIME_SLOW') {
      audioManager.playTimeSlow();
    }

    const item: ActivePowerUp = {
      type,
      duration,
      remainingTime: duration,
      level: 1,
    };

    this.activePowerUps.set(type, item);
    this.runStats.powerUpsUsed += 1;
    audioManager.playPowerUp();
  }

  private updatePowerUps(delta: number) {
    for (const [type, power] of this.activePowerUps.entries()) {
      power.remainingTime -= delta;
      if (power.remainingTime <= 0) {
        // Deactivate visual meshes
        if (type === 'MAGNET') this.character.magnetAura.visible = false;
        if (type === 'SHIELD') this.character.shieldMesh.visible = false;
        if (type === 'TURBO_SPEED') this.character.turboJetMesh.visible = false;
        if (type === 'MULTIPLIER') this.scoreMultiplier = 1;

        this.activePowerUps.delete(type);
      }
    }
  }

  // ==================== COLLISION DETECTION ====================
  private checkCollisions() {
    const pPos = this.character.group.position;
    const pX = this.character.laneX;
    const pY = this.character.jumpY;
    const pZ = pPos.z;
    const isSliding = this.character.currentAction === 'SLIDE';
    const isTurbo = this.activePowerUps.has('TURBO_SPEED');
    const isShielded = this.activePowerUps.has('SHIELD');

    // 1. Check Coins (Dynamic 3D distance & Magnet-pulled coin support)
    for (const coin of this.worldManager.obstacleManager.coins) {
      if (coin.isCollected) continue;
      const dx = Math.abs(pX - coin.mesh.position.x);
      const dy = Math.abs((pY + 0.8) - coin.mesh.position.y);
      const dz = Math.abs(pZ - coin.mesh.position.z);

      if ((dx < 1.35 && dy < 1.6 && dz < 1.6) || (dx * dx + dy * dy + dz * dz < 2.8)) {
        coin.isCollected = true;
        this.particleFX.emitCoinCollectBurst(coin.mesh.position);
        const multiplier = this.activePowerUps.has('MULTIPLIER') ? 2 : 1;
        // Each collected coin in Baghdad equals 250 Iraqi Dinars (د.ع)
        const coinValueIQD = 250 * multiplier;
        this.coinsCollectedInRun += coinValueIQD;
        this.runStats.coinsCollected = this.coinsCollectedInRun;
        this.coinStreakCombo += 1;
        audioManager.playCoin(this.coinStreakCombo);
      }
    }

    // 2. Check Power-Up Pickups
    for (const p of this.worldManager.obstacleManager.powerUps) {
      if (p.isCollected) continue;
      const dx = Math.abs(pX - p.mesh.position.x);
      const dy = Math.abs((pY + 0.8) - p.mesh.position.y);
      const dz = Math.abs(pZ - p.mesh.position.z);

      if (dx < 1.35 && dy < 1.6 && dz < 1.6) {
        p.isCollected = true;
        this.activatePowerUp(p.type);
      }
    }

    // 3. Check Obstacle Hits with Fair & Precision Hitboxes
    for (const obs of this.worldManager.obstacleManager.obstacles) {
      if (obs.isCollided || (obs as any).isCleared) continue;

      // If obstacle is already behind the player, mark cleared immediately
      if (pZ >= obs.mesh.position.z) {
        (obs as any).isCleared = true;
        continue;
      }

      // If player is safely jumping over a jumpable obstacle or sliding under a slideable obstacle
      if (pZ >= obs.mesh.position.z - 0.9) {
        if (obs.canJump && (!this.character.isGrounded || pY > 0.12 || this.character.currentAction === 'JUMP')) {
          (obs as any).isCleared = true;
          continue;
        }
        if (obs.canSlide && (isSliding || this.character.slideTimer > 0 || this.character.currentAction === 'SLIDE')) {
          (obs as any).isCleared = true;
          continue;
        }
      }

      // If obstacle is far ahead, skip checking
      if (obs.mesh.position.z - pZ > 12) continue;

      const dx = Math.abs(pX - obs.mesh.position.x);
      const dz = Math.abs(pZ - obs.mesh.position.z);

      // Lateral tolerance: if player is in a different lane (separation > 0.72m), never hit
      if (dx > 0.72) {
        if (pZ > obs.mesh.position.z - 0.5) {
          (obs as any).isCleared = true;
        }
        continue;
      }

      // If player has Super Jump power-up or high clearance:
      if (pY > 1.2 || (this.activePowerUps.has('SUPER_JUMP') && pY > 0.8)) {
        (obs as any).isCleared = true;
        continue;
      }

      // Tight, fair collision thresholds
      const halfWidth = (obs.width / 2) * 0.50;
      const halfDepth = (obs.depth / 2) * 0.48;

      if (dx < halfWidth && dz < halfDepth) {
        // Vertical collision checks with high precision:
        if (obs.canJump) {
          if (!this.character.isGrounded || pY > 0.12 || this.character.currentAction === 'JUMP') {
            (obs as any).isCleared = true;
            continue;
          }
        }

        if (obs.canSlide) {
          if (isSliding || this.character.slideTimer > 0 || this.character.currentAction === 'SLIDE') {
            (obs as any).isCleared = true;
            continue;
          }
        }

        // Collision Occurred!
        obs.isCollided = true;

        if (isShielded) {
          // Shield absorbs the impact!
          audioManager.playShieldDeflect();
          this.triggerCameraShake(0.4);
          this.shieldHitRemaining -= 1;
          if (this.shieldHitRemaining <= 0) {
            this.activePowerUps.delete('SHIELD');
            this.character.shieldMesh.visible = false;
          }
          continue;
        }

        // Fatal crash: Game Over
        this.handlePlayerCrash();
        return;
      }
    }
  }

  private handlePlayerCrash() {
    this.lastLostBiome = this.worldManager.currentBiome;
    this.character.currentAction = 'CRASH';
    audioManager.playCrash();
    this.triggerCameraShake(0.9);

    // Calculate XP & Score earned
    const energyBonus = getSkillValue('energy', this.playerData.skills.energy) / 100;
    const baseXP = Math.round((this.distanceRan * 0.4 + this.coinsCollectedInRun * 2) * (1 + energyBonus));
    this.runStats.xpEarned = baseXP;
    this.runStats.score = Math.round(this.distanceRan + this.coinsCollectedInRun * 10);
    this.runStats.isNewRecord = this.distanceRan > this.playerData.highScoreDistance;

    // Slight delay before opening game over screen to let tumbling animation play
    setTimeout(() => {
      this.stopRun();
      this.callbacks.onGameOver(this.runStats);
    }, 700);
  }

  // ==================== CAMERA & FX ====================
  public triggerCameraShake(intensity: number) {
    if (this.playerData.settings.cameraShake) {
      this.cameraShakeIntensity = intensity;
    }
  }

  private updateCamera(delta: number, forwardStep: number) {
    const pPos = this.character.group.position;
    const isTurbo = this.activePowerUps.has('TURBO_SPEED');

    // Dynamic FOV zoom for speed sensation
    const targetFOV = isTurbo ? 76 : (65 + Math.min(this.currentSpeed / 30, 8));
    this.camera.fov += (targetFOV - this.camera.fov) * Math.min(delta * 4, 1);
    this.camera.updateProjectionMatrix();

    // Smooth Camera target position behind Bassam
    const targetCamX = this.character.laneX * 0.65;
    const targetCamY = pPos.y + this.cameraBaseOffset.y;
    const targetCamZ = pPos.z + this.cameraBaseOffset.z;

    this.camera.position.x += (targetCamX - this.camera.position.x) * Math.min(delta * 10, 1);
    this.camera.position.y += (targetCamY - this.camera.position.y) * Math.min(delta * 8, 1);
    this.camera.position.z = targetCamZ;

    // Apply Camera Shake offset
    if (this.cameraShakeIntensity > 0) {
      this.camera.position.x += (Math.random() - 0.5) * this.cameraShakeIntensity;
      this.camera.position.y += (Math.random() - 0.5) * this.cameraShakeIntensity;
      this.cameraShakeIntensity -= delta * 2.5;
      if (this.cameraShakeIntensity < 0) this.cameraShakeIntensity = 0;
    }

    // Dynamic Camera Bank Roll when changing lanes
    // Moving Left (targetLaneX < laneX): tilts view smoothly into the left turn
    // Moving Right (targetLaneX > laneX): tilts view smoothly into the right turn
    const laneDiff = this.character.targetLaneX - this.character.laneX;
    const targetCamRoll = -laneDiff * 0.035;
    this.cameraRoll += (targetCamRoll - this.cameraRoll) * Math.min(delta * 12, 1);

    // Look ahead at Bassam's running path
    this.camera.lookAt(
      pPos.x * 0.4,
      pPos.y + this.cameraLookTarget.y,
      pPos.z + this.cameraLookTarget.z
    );

    // Apply dynamic camera tilt around gaze axis
    if (Math.abs(this.cameraRoll) > 0.0001) {
      this.camera.rotateZ(this.cameraRoll);
    }
  }

  private render() {
    this.renderer.render(this.scene, this.camera);
  }

  // ==================== USER CONTROLS ====================
  public handleSwipeLeft() {
    const invert = this.playerData.settings.invertControls ?? true;
    if (invert) {
      this.character.moveRight();
    } else {
      this.character.moveLeft();
    }
    audioManager.playSwipe();
  }

  public handleSwipeRight() {
    const invert = this.playerData.settings.invertControls ?? true;
    if (invert) {
      this.character.moveLeft();
    } else {
      this.character.moveRight();
    }
    audioManager.playSwipe();
  }

  public handleSwipeUp() {
    const jumpSkillBonus = getSkillValue('jump', this.playerData.skills.jump) / 100;
    const superJump = this.activePowerUps.has('SUPER_JUMP');
    this.character.jump(superJump ? jumpSkillBonus + 0.6 : jumpSkillBonus);
    this.runStats.jumpsPerformed += 1;
    audioManager.playJump();
  }

  public handleSwipeDown() {
    const slideSkillBonus = getSkillValue('slide', this.playerData.skills.slide) / 100;
    this.character.slide(slideSkillBonus);
    this.runStats.slidesPerformed += 1;
    audioManager.playSlide();
  }

  // Dynamic Weather Progression based on distance run through Baghdad (1000m, 2500m, 3500m, 5000m, 6500m, 8000m)
  public getWeatherForDistance(distance: number): WeatherType {
    const cycleLength = 8000;
    const posInCycle = distance % cycleLength;

    if (posInCycle < 1000) {
      return 'SUNNY_MORNING'; // 0m - 1000m: صباح بغدادي مشمس
    } else if (posInCycle < 2500) {
      return 'BAGHDAD_DUST_STORM'; // 1000m - 2500m: غبار بغداد وعاصفة ترابية دافئة
    } else if (posInCycle < 3500) {
      return 'GOLDEN_SUNSET'; // 2500m - 3500m: غروب دجلة الذهبي
    } else if (posInCycle < 5000) {
      return 'LIGHT_RAIN_MIST'; // 3500m - 5000m: رذاذ وضباب دجلة المنعش
    } else if (posInCycle < 6500) {
      return 'BAGHDAD_STORM'; // 5000m - 6500m: أمطار رعدية مع لمعان البرق
    } else {
      return 'KARRADA_NIGHT'; // 6500m - 8000m+: ليل الكرادة وأنوار النيون
    }
  }

  public dispose() {
    this.stopRun();
    this.particleFX.dispose();
    this.renderer.dispose();
  }
}
