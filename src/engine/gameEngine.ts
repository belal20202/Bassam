/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { BiomeType, GameSettings, PlayerData, PowerUpType, RunStats, ActivePowerUp, PlayerCustomization, WeatherType } from '../types';
import { HammoudiCharacter } from './character';
import { CharacterController, GroundHitResult } from './characterController';
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
  public characterController: CharacterController;
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
  private cameraLandingOffset: number = 0;
  private cameraBaseOffset: THREE.Vector3 = new THREE.Vector3(0, 3.8, -6.5);
  private cameraLookTarget: THREE.Vector3 = new THREE.Vector3(0, 1.6, 6);

  // Time & Animation
  private lastTime: number = 0;
  private animationFrameId: number | null = null;
  private crashTimeoutId: number | null = null;
  public isCrashing: boolean = false;
  private callbacks: GameEngineCallbacks;

  // Biome Rotation Distance Counter
  private lastBiomeIndex: number = 0;
  private biomesList: BiomeType[] = ALL_BIOMES;
  public lastLostBiome: BiomeType | null = null;
  private lastWeatherBracket: number = 0;
  private allWeathers: WeatherType[] = [
    'SUNNY_MORNING',
    'NOON_BRIGHT',
    'GOLDEN_SUNSET',
    'LIGHT_RAIN_MIST',
    'BAGHDAD_STORM',
    'BAGHDAD_DUST_STORM',
    'SNOW_FLURRY',
    'KARRADA_NIGHT',
  ];

  constructor(canvas: HTMLCanvasElement, playerData: PlayerData, callbacks: GameEngineCallbacks) {
    this.playerData = playerData;
    this.callbacks = callbacks;

    // 1. Three.js Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(65, canvas.clientWidth / canvas.clientHeight, 0.1, 400);

    // 2. WebGL Renderer with mobile thermal & performance optimization
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
      stencil: false,
      depth: true,
    });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    // Optimized pixel ratio to prevent thermal throttling and phone overheating on high-DPI screens
    const maxDpr = playerData.settings.graphicsQuality === 'ULTRA' ? 1.5 : 1.25;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxDpr));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.BasicShadowMap; // Ultra-efficient shadow computation

    // 3. World & Character
    this.character = new HammoudiCharacter();
    this.character.applyCustomization(playerData.customization);
    this.characterController = new CharacterController(this.character);
    this.scene.add(this.character.group);

    this.worldManager = new WorldManager(this.scene);
    this.particleFX = new ParticleFXManager(this.scene);

    // Synchronize initial environment texture wear and Baghdad lighting
    this.character.updateEnvironment(this.worldManager.currentWeather, this.worldManager.currentBiome);

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

  public setCallbacks(callbacks: GameEngineCallbacks) {
    this.callbacks = callbacks;
  }

  // ==================== GAME LIFECYCLE ====================
  public startRun(isHeadstart: boolean = false) {
    // Clear any existing loops or crash timers to prevent overlapping sessions
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.crashTimeoutId !== null) {
      clearTimeout(this.crashTimeoutId);
      this.crashTimeoutId = null;
    }

    this.isRunning = true;
    this.isPaused = false;
    this.isCrashing = false;
    this.hasRevivedInCurrentRun = false;
    this.distanceRan = 0;
    this.coinsCollectedInRun = 0;
    this.coinStreakCombo = 0;
    this.dodgeStreak = 0;
    this.scoreMultiplier = 1;
    this.shieldHitRemaining = 0;
    this.cameraShakeIntensity = 0;
    this.cameraRoll = 0;
    this.lastBiomeIndex = 0;
    this.wasInAir = false;
    this.footstepTimer = 0;
    this.activePowerUps.clear();
    
    // Pick a fresh random starting Iraqi governorate (guaranteed different from the one just lost in previous session)
    let lastLost: BiomeType | undefined = this.lastLostBiome || undefined;
    try {
      const saved = localStorage.getItem('bassam_last_lost_governorate');
      if (saved) lastLost = saved as BiomeType;
    } catch (_) {}

    const startingBiome = getRandomBiome(lastLost);
    this.runStats = this.getInitialRunStats(startingBiome);

    this.character.resetToStart();
    this.character.applyCustomization(this.playerData.customization);
    this.worldManager.resetWorld(startingBiome);
    this.particleFX.clearAll();

    // Calculate base speed with skill bonuses
    const speedBonus = getSkillValue('speed', this.playerData.skills.speed) / 100;
    this.baseSpeed = 18 * (1 + speedBonus * 0.4);
    this.currentSpeed = this.baseSpeed;

    // Start background energetic music and dynamic Baghdad atmospheric ambient audio
    audioManager.stopMusic();
    audioManager.stopAmbient();
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
    this.isCrashing = false;
    if (this.crashTimeoutId !== null) {
      clearTimeout(this.crashTimeoutId);
      this.crashTimeoutId = null;
    }
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    audioManager.stopMusic();
    audioManager.stopAmbient();
    this.activePowerUps.clear();
    this.startMenuPreview();
  }

  public startMenuPreview() {
    this.isRunning = false;
    this.isPaused = false;
    this.isCrashing = false;
    if (this.crashTimeoutId !== null) {
      clearTimeout(this.crashTimeoutId);
      this.crashTimeoutId = null;
    }
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.character.resetToStart();
    this.character.currentAction = 'IDLE';
    this.character.group.position.set(0, 0, 0);
    this.character.group.rotation.set(0, 0, 0);
    this.camera.position.set(0, 1.45, 3.1);
    this.camera.lookAt(0, 1.0, 0);
    this.cameraRoll = 0;
    this.cameraShakeIntensity = 0;
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

    // Cap delta to prevent huge jumps and stutter on mobile devices
    if (delta > 0.05) delta = 0.05;

    this.update(delta);
    this.render();

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private update(delta: number) {
    if (this.isCrashing) {
      this.character.update(delta, 0, 1, 0, 0);
      this.particleFX.update(delta);
      this.updateCamera(delta, 0);
      return;
    }

    // 1. Time slow power-up modifier
    const timeSlowActive = this.activePowerUps.has('TIME_SLOW');
    const worldDelta = timeSlowActive ? delta * 0.6 : delta;

    // 2. Dynamic Progressive Difficulty & Speed Scaling based on distance
    this.adaptiveDifficultyFactor = Math.min(
      1.0 + (this.distanceRan / 400) * 0.35,
      3.2
    );

    const isTurbo = this.activePowerUps.has('TURBO_SPEED');
    const distanceSpeedGain = Math.min((this.distanceRan / 500) * 2.2, 14.0);
    this.currentSpeed = isTurbo ? 40 : (this.baseSpeed + distanceSpeedGain);

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

    // Dynamic Landing Rebound Check: detect touchdown from air
    if (this.wasInAir && this.character.isGrounded) {
      this.wasInAir = false;
      this.character.triggerLandingRebound();
      this.triggerCameraShake(0.06);
      this.cameraLandingOffset = -0.07;
      audioManager.playLanding();
    } else if (!this.character.isGrounded) {
      this.wasInAir = true;
    }

    // Apply High-Precision Inverse Kinematics (IK) for realistic ground & obstacle contact
    const groundHit = this.sampleBaghdadTerrain(this.character.laneX, this.character.group.position.z);
    this.characterController.updateLegIK(groundHit);

    // 5. Update World Chunks & Dynamic Biome Rotation (Every 1500 meters exactly)
    const currentBiomeIdx = Math.floor(this.distanceRan / 1500) % this.biomesList.length;
    if (currentBiomeIdx !== this.lastBiomeIndex) {
      this.lastBiomeIndex = currentBiomeIdx;
      const nextBiome = this.biomesList[currentBiomeIdx];
      this.worldManager.setBiome(nextBiome);
      audioManager.setBiome(nextBiome);
      this.character.updateEnvironment(this.worldManager.currentWeather, nextBiome);
      this.runStats.biomeChangedCount += 1;
      if (!this.runStats.visitedBiomes.includes(nextBiome)) {
        this.runStats.visitedBiomes.push(nextBiome);
      }
      if (this.callbacks.onBiomeChange) {
        this.callbacks.onBiomeChange(nextBiome);
      }
    }

    // Dynamic Random Weather Transition every 1000 meters as requested
    const currentBracket = Math.floor(Math.max(0, this.distanceRan) / 1000);
    if (currentBracket !== this.lastWeatherBracket && currentBracket > 0) {
      this.lastWeatherBracket = currentBracket;
      const availableWeathers = this.allWeathers.filter((w) => w !== this.worldManager.currentWeather);
      const nextRandomWeather = availableWeathers[Math.floor(Math.random() * availableWeathers.length)];
      this.worldManager.setWeather(nextRandomWeather);
      this.character.updateEnvironment(nextRandomWeather, this.worldManager.currentBiome);
      if (this.callbacks.onWeatherChange) {
        this.callbacks.onWeatherChange(nextRandomWeather);
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
    } else if (this.currentSpeed > 16 && this.character.currentAction === 'RUN') {
      // Dynamic City Runner Slipstream & Wind Ribbons (آثار سرعة عداء بغداد)
      this.particleFX.emitCityRunnerSlipstream(this.character.group.position, this.currentSpeed);
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

    // 3. Check Obstacle Hits with Fair & Highly Accurate Hitboxes
    for (const obs of this.worldManager.obstacleManager.obstacles) {
      if (obs.isCollided) continue;

      const halfDepth = obs.depth / 2;
      const obsZ = obs.mesh.position.z;

      // If obstacle is already safely behind the player by its half-depth
      if (pZ > obsZ + halfDepth + 0.2) {
        continue;
      }

      // If obstacle is far ahead, skip checking
      if (obsZ - pZ > 10) continue;

      const dx = Math.abs(pX - obs.mesh.position.x);
      const dz = Math.abs(pZ - obsZ);

      // Fair & accurate hitbox margins: avoid unfair grazing collision
      const lateralThreshold = (obs.width / 2) * 0.72 + 0.16;
      const depthThreshold = halfDepth * 0.70 + 0.22;

      // Check if player's X-Z footprint intersects the obstacle's bounding volume
      if (dx < lateralThreshold && dz < depthThreshold) {
        // If Turbo Speed is active, smash through obstacles!
        if (isTurbo) {
          obs.isCollided = true;
          this.particleFX.emitCoinCollectBurst(obs.mesh.position.clone());
          continue;
        }

        // Check if player can safely jump over this obstacle
        if (obs.canJump) {
          const isJumping = !this.character.isGrounded || this.character.currentAction === 'JUMP' || pY > 0.08;
          if (isJumping || this.activePowerUps.has('SUPER_JUMP')) {
            // Safely in the air above the obstacle
            continue;
          }
        }

        // Check if player can safely slide under this obstacle (e.g., hanging wires or beams)
        if (obs.canSlide) {
          const isCurrentlySliding = isSliding || this.character.currentAction === 'SLIDE' || this.character.slideTimer > 0;
          if (isCurrentlySliding) {
            // Safely ducking/sliding underneath
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
    if (this.isCrashing) return;
    this.isCrashing = true;
    this.currentSpeed = 0; // stop moving forward immediately into further obstacles!

    this.lastLostBiome = this.worldManager.currentBiome;
    try {
      localStorage.setItem('bassam_last_lost_governorate', this.worldManager.currentBiome);
    } catch (_) {}
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
    if (this.crashTimeoutId !== null) {
      clearTimeout(this.crashTimeoutId);
    }
    this.crashTimeoutId = window.setTimeout(() => {
      this.crashTimeoutId = null;
      this.isCrashing = false;
      this.stopRun();
      this.callbacks.onGameOver(this.runStats);
    }, 700);
  }

  /**
   * Samples Baghdad road terrain elevation, curbs, sidewalks, and ramps for Inverse Kinematics
   */
  public sampleBaghdadTerrain(x: number, z: number): GroundHitResult {
    let groundY = 0;
    const normal = new THREE.Vector3(0, 1, 0);

    for (const obs of this.worldManager.obstacleManager.obstacles) {
      if (obs.isCollided) continue;
      const oZ = obs.mesh.position.z;
      const halfDepth = obs.depth * 0.5;
      if (z >= oZ - halfDepth && z <= oZ + halfDepth) {
        const oX = obs.mesh.position.x;
        const halfWidth = obs.width * 0.5;
        if (Math.abs(x - oX) <= halfWidth) {
          const topY = obs.mesh.position.y + obs.height * 0.5;
          if (topY > groundY && topY <= 1.8) {
            groundY = topY;
            if ((obs as any).isRamp) {
              const progress = Math.max(0, Math.min(1, (z - (oZ - halfDepth)) / obs.depth));
              groundY = progress * obs.height;
              normal.set(0, 0.94, -0.34).normalize();
            }
          }
        }
      }
    }

    const isWet = this.worldManager.currentWeather === 'LIGHT_RAIN_MIST' ||
      this.worldManager.currentWeather === 'BAGHDAD_STORM' ||
      this.worldManager.currentWeather === 'KARRADA_NIGHT';

    return {
      height: groundY,
      normal,
      isObstacle: groundY > 0,
      surfaceType: groundY > 0 ? 'RAMP' : 'ASPHALT',
    };
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

    // Smoothly follow player position everywhere they go (X, Y, Z)
    if (Math.abs(this.cameraLandingOffset) > 0.001) {
      this.cameraLandingOffset = THREE.MathUtils.lerp(this.cameraLandingOffset, 0, delta * 9.0);
    }

    const targetCamX = pPos.x * 0.70; // Smooth camera tracking following player's lane transitions
    const targetCamY = pPos.y + this.cameraBaseOffset.y + this.cameraLandingOffset;
    const targetCamZ = pPos.z + this.cameraBaseOffset.z;

    this.camera.position.x += (targetCamX - this.camera.position.x) * Math.min(delta * 12, 1);
    this.camera.position.y += (targetCamY - this.camera.position.y) * Math.min(delta * 8.5, 1);
    this.camera.position.z = targetCamZ;

    // Apply Camera Shake offset on vertical and horizontal axes during impacts
    if (this.cameraShakeIntensity > 0) {
      this.camera.position.x += (Math.random() - 0.5) * this.cameraShakeIntensity * 0.25;
      this.camera.position.y += (Math.random() - 0.5) * this.cameraShakeIntensity * 0.3;
      this.cameraShakeIntensity -= delta * 2.5;
      if (this.cameraShakeIntensity < 0) this.cameraShakeIntensity = 0;
    }

    // Look ahead smoothly focused on player's trajectory
    this.camera.lookAt(
      pPos.x * 0.45,
      pPos.y + this.cameraLookTarget.y,
      pPos.z + this.cameraLookTarget.z
    );
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

  // Dynamic Weather Progression every 1000m continuously as requested
  public getWeatherForDistance(distance: number): WeatherType {
    const cycle: WeatherType[] = [
      'SUNNY_MORNING',      // 0m - 1000m: شمس صباحية مشرقة (علامة الشمس)
      'BAGHDAD_DUST_STORM', // 1000m - 2000m: عاصفة ترابية (علامة العاصفة)
      'GOLDEN_SUNSET',      // 2000m - 3000m: غروب ذهبي ساحر
      'LIGHT_RAIN_MIST',    // 3000m - 4000m: رذاذ منعش وأمطار (علامة الأمطار)
      'SNOW_FLURRY',        // 4000m - 5000m: ثلوج شتوية نقية (علامة الثلوج)
      'BAGHDAD_STORM',      // 5000m - 6000m: عاصفة مطرية ورعدية (علامة العاصفة والأمطار)
      'KARRADA_NIGHT',      // 6000m - 7000m: ليل جميل وهادئ (علامة الليل الجميل)
    ];

    const slotIndex = Math.floor(Math.max(0, distance) / 1000) % cycle.length;
    return cycle[slotIndex];
  }

  public dispose() {
    this.stopRun();
    this.particleFX.dispose();
    this.renderer.dispose();
  }
}
