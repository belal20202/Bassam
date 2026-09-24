/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

export type ParticleType =
  | 'DUST'
  | 'SPARK'
  | 'WATER_SPRAY'
  | 'COIN_BURST'
  | 'SPEED_TRAIL'
  | 'SHOCKWAVE'
  | 'WEATHER_DUST'
  | 'WEATHER_MIST';

export interface PooledParticle {
  active: boolean;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  size: number;
  maxSize: number;
  opacity: number;
  maxLife: number;
  life: number;
  rotation: number;
  rotSpeed: number;
  type: ParticleType;
}

/**
 * High-Performance Zero-Allocation Particle FX Engine for Bassam Runner
 * Uses a static object pool with O(1) swap-removal to completely eliminate
 * GC pauses and stuttering on mobile and desktop.
 */
export class ParticleFXManager {
  private scene: THREE.Scene;
  private maxParticles: number = 600;
  private pool: PooledParticle[] = [];
  public activeCount: number = 0;

  // Geometry & Buffer attributes for Batch Rendering
  private particleGeometry: THREE.BufferGeometry;
  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;
  private opacities: Float32Array;

  private pointsMesh: THREE.Points;
  private particleMaterial: THREE.ShaderMaterial;

  // Radial Glow Texture Generator
  private static glowTexture: THREE.Texture | null = null;
  private static dustTexture: THREE.Texture | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    this.positions = new Float32Array(this.maxParticles * 3);
    this.colors = new Float32Array(this.maxParticles * 3);
    this.sizes = new Float32Array(this.maxParticles);
    this.opacities = new Float32Array(this.maxParticles);

    // Pre-allocate the particle pool
    for (let i = 0; i < this.maxParticles; i++) {
      this.pool.push({
        active: false,
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        color: new THREE.Color(),
        size: 0,
        maxSize: 0,
        opacity: 0,
        maxLife: 1,
        life: 0,
        rotation: 0,
        rotSpeed: 0,
        type: 'DUST',
      });
    }

    this.particleGeometry = new THREE.BufferGeometry();
    this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.particleGeometry.setAttribute('customColor', new THREE.BufferAttribute(this.colors, 3));
    this.particleGeometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));
    this.particleGeometry.setAttribute('opacity', new THREE.BufferAttribute(this.opacities, 1));

    // Custom Particle Shader for smooth bloom, glow, and fading
    this.particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        pointTexture: { value: ParticleFXManager.getGlowTexture() },
      },
      vertexShader: `
        attribute float size;
        attribute float opacity;
        attribute vec3 customColor;
        varying vec3 vColor;
        varying float vOpacity;
        void main() {
          vColor = customColor;
          vOpacity = opacity;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (260.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D pointTexture;
        varying vec3 vColor;
        varying float vOpacity;
        void main() {
          vec4 tex = texture2D(pointTexture, gl_PointCoord);
          if (tex.a * vOpacity < 0.01) discard;
          gl_FragColor = vec4(vColor * tex.rgb, tex.a * vOpacity);
        }
      `,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
    });

    this.pointsMesh = new THREE.Points(this.particleGeometry, this.particleMaterial);
    this.pointsMesh.frustumCulled = false;
    this.scene.add(this.pointsMesh);
  }

  // Create smooth radial soft glow circle texture on canvas
  public static getGlowTexture(): THREE.Texture {
    if (this.glowTexture) return this.glowTexture;

    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
      gradient.addColorStop(0.2, 'rgba(255, 240, 200, 0.85)');
      gradient.addColorStop(0.5, 'rgba(255, 180, 50, 0.4)');
      gradient.addColorStop(0.8, 'rgba(255, 100, 0, 0.1)');
      gradient.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 64, 64);
    }

    this.glowTexture = new THREE.CanvasTexture(canvas);
    return this.glowTexture;
  }

  public static getDustTexture(): THREE.Texture {
    if (this.dustTexture) return this.dustTexture;

    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
      gradient.addColorStop(0.0, 'rgba(215, 195, 160, 0.8)');
      gradient.addColorStop(0.4, 'rgba(180, 160, 130, 0.45)');
      gradient.addColorStop(0.8, 'rgba(140, 120, 100, 0.15)');
      gradient.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 64, 64);
    }

    this.dustTexture = new THREE.CanvasTexture(canvas);
    return this.dustTexture;
  }

  /**
   * Internal zero-allocation particle spawn helper
   */
  private spawn(
    x: number, y: number, z: number,
    vx: number, vy: number, vz: number,
    r: number, g: number, b: number,
    size: number, maxSize: number, opacity: number, maxLife: number,
    type: ParticleType, rotSpeed: number = 0
  ) {
    if (this.activeCount >= this.maxParticles) return;

    const p = this.pool[this.activeCount];
    p.active = true;
    p.position.set(x, y, z);
    p.velocity.set(vx, vy, vz);
    p.color.setRGB(r, g, b);
    p.size = size;
    p.maxSize = maxSize;
    p.opacity = opacity;
    p.maxLife = maxLife;
    p.life = 0;
    p.rotation = Math.random() * Math.PI * 2;
    p.rotSpeed = rotSpeed;
    p.type = type;

    this.activeCount++;
  }

  // ==================== EMITTERS ====================

  /**
   * 1. Slide Street Dust & Friction Sparks
   */
  public emitSlideDustAndSparks(
    playerPos: THREE.Vector3,
    laneX: number,
    isWet: boolean = false,
    speed: number = 20
  ) {
    const originY = 0.08;
    const originZ = playerPos.z - 0.25;

    const dustPuffCount = isWet ? 3 : 5;
    for (let i = 0; i < dustPuffCount; i++) {
      if (this.activeCount >= this.maxParticles) break;

      const spreadX = (Math.random() - 0.5) * 0.9;
      const spreadZ = (Math.random() - 0.5) * 0.6;
      const velX = spreadX * 2.2 + (Math.random() - 0.5) * 0.8;
      const velY = 0.4 + Math.random() * 0.9;
      const velZ = -speed * 0.25 - Math.random() * 2.0;

      const r = isWet ? 0.69 : 0.83;
      const g = isWet ? 0.77 : 0.64;
      const b = isWet ? 0.87 : 0.45;

      this.spawn(
        laneX + spreadX, originY, originZ + spreadZ,
        velX, velY, velZ,
        r, g, b,
        0.35 + Math.random() * 0.35,
        1.2 + Math.random() * 0.8,
        isWet ? 0.6 : 0.75,
        0.55 + Math.random() * 0.3,
        isWet ? 'WATER_SPRAY' : 'DUST',
        (Math.random() - 0.5) * 4
      );
    }

    const sparkCount = isWet ? 1 : 4;
    for (let i = 0; i < sparkCount; i++) {
      if (this.activeCount >= this.maxParticles) break;

      const velX = (Math.random() - 0.5) * 4.5;
      const velY = 1.0 + Math.random() * 2.5;
      const velZ = -speed * 0.35 + (Math.random() - 0.5) * 4;

      const isGold = Math.random() > 0.3;
      const r = isGold ? 1.0 : 1.0;
      const g = isGold ? 0.72 : 0.30;
      const b = isGold ? 0.01 : 0.0;

      this.spawn(
        laneX + (Math.random() - 0.5) * 0.5, originY + 0.05, originZ,
        velX, velY, velZ,
        r, g, b,
        0.2 + Math.random() * 0.2,
        0.35,
        1.0,
        0.25 + Math.random() * 0.2,
        'SPARK',
        0
      );
    }
  }

  /**
   * 2. Footstep Ground Dust & Water Splashes
   */
  public emitFootstep(pos: THREE.Vector3, isLeftFoot: boolean, isWet: boolean = false) {
    const footOffset = isLeftFoot ? -0.22 : 0.22;
    const count = isWet ? 4 : 2;

    for (let i = 0; i < count; i++) {
      if (this.activeCount >= this.maxParticles) break;

      const r = isWet ? 0.58 : 0.66;
      const g = isWet ? 0.64 : 0.56;
      const b = isWet ? 0.72 : 0.47;

      this.spawn(
        pos.x + footOffset + (Math.random() - 0.5) * 0.1,
        0.02,
        pos.z - 0.45,
        (Math.random() - 0.5) * 0.8,
        0.2 + Math.random() * 0.3,
        -1.8 - Math.random() * 1.5,
        r, g, b,
        0.15 + Math.random() * 0.15,
        0.45,
        0.25,
        0.25,
        isWet ? 'WATER_SPRAY' : 'DUST',
        (Math.random() - 0.5) * 2
      );
    }
  }

  /**
   * 3. Coin Collection Golden Bloom Burst
   */
  public emitCoinCollectBurst(coinPos: THREE.Vector3) {
    // 1. Central golden flash
    this.spawn(
      coinPos.x, coinPos.y, coinPos.z,
      0, 0.5, 0,
      1.0, 0.95, 0.69,
      1.2, 2.4, 1.0, 0.25,
      'COIN_BURST', 0
    );

    // 2. Sparkling Dinar Star Shards
    const shardCount = 14;
    for (let i = 0; i < shardCount; i++) {
      if (this.activeCount >= this.maxParticles) break;

      const angle = (i / shardCount) * Math.PI * 2 + Math.random() * 0.2;
      const speed = 3.5 + Math.random() * 4.0;
      const velY = (Math.random() - 0.3) * 3.5;

      const isGold = i % 2 === 0;
      const r = isGold ? 1.0 : 1.0;
      const g = isGold ? 0.82 : 0.63;
      const b = isGold ? 0.40 : 0.0;

      this.spawn(
        coinPos.x + (Math.random() - 0.5) * 0.2,
        coinPos.y + (Math.random() - 0.5) * 0.2,
        coinPos.z + (Math.random() - 0.5) * 0.2,
        Math.cos(angle) * speed,
        velY,
        Math.sin(angle) * speed,
        r, g, b,
        0.3 + Math.random() * 0.25,
        0.7,
        1.0,
        0.45 + Math.random() * 0.25,
        'COIN_BURST',
        (Math.random() - 0.5) * 8
      );
    }
  }

  /**
   * 4. Jump Landing Ground Shockwave Dust
   */
  public emitLandingImpact(pos: THREE.Vector3, isWet: boolean = false) {
    const ringCount = 16;
    for (let i = 0; i < ringCount; i++) {
      if (this.activeCount >= this.maxParticles) break;

      const angle = (i / ringCount) * Math.PI * 2;
      const speed = 2.5 + Math.random() * 2.0;

      const r = isWet ? 0.58 : 0.79;
      const g = isWet ? 0.77 : 0.73;
      const b = isWet ? 0.99 : 0.61;

      this.spawn(
        pos.x + Math.cos(angle) * 0.3,
        0.05,
        pos.z + Math.sin(angle) * 0.3,
        Math.cos(angle) * speed,
        0.3 + Math.random() * 0.4,
        Math.sin(angle) * speed,
        r, g, b,
        0.35 + Math.random() * 0.2,
        1.2,
        0.7,
        0.45,
        'SHOCKWAVE',
        0
      );
    }
  }

  /**
   * 5. Turbo Speed Trail
   */
  public emitTurboTrail(pos: THREE.Vector3) {
    if (this.activeCount >= this.maxParticles) return;

    const isRed = Math.random() > 0.5;
    const r = isRed ? 0.94 : 0.96;
    const g = isRed ? 0.27 : 0.62;
    const b = isRed ? 0.27 : 0.04;

    this.spawn(
      pos.x + (Math.random() - 0.5) * 0.6,
      pos.y + 0.8 + (Math.random() - 0.5) * 0.8,
      pos.z - 0.4,
      (Math.random() - 0.5) * 0.5,
      (Math.random() - 0.5) * 0.5,
      -15 - Math.random() * 5,
      r, g, b,
      0.4, 0.8, 0.9, 0.22,
      'SPEED_TRAIL', 0
    );
  }

  /**
   * 6. City Runner Slipstream & Wind Ribbons
   */
  public emitCityRunnerSlipstream(pos: THREE.Vector3, speed: number) {
    if (this.activeCount >= this.maxParticles) return;

    const lateral = (Math.random() - 0.5) * 0.7;
    const altitude = 0.5 + Math.random() * 1.0;

    this.spawn(
      pos.x + lateral,
      pos.y + altitude,
      pos.z - 0.3,
      lateral * 0.8,
      (Math.random() - 0.5) * 0.4,
      -speed * 0.6,
      0.88, 0.95, 1.0,
      0.25, 0.5, 0.35, 0.2,
      'SPEED_TRAIL', 0
    );
  }

  /**
   * 7. Ambient Weather Effects
   */
  public emitAmbientWeather(pos: THREE.Vector3, weather: string, delta: number) {
    if (this.activeCount >= this.maxParticles) return;

    if (weather === 'BAGHDAD_DUST_STORM') {
      const count = 3;
      for (let i = 0; i < count; i++) {
        if (this.activeCount >= this.maxParticles) break;
        this.spawn(
          pos.x + (Math.random() - 0.5) * 20,
          0.3 + Math.random() * 4,
          pos.z + 10 + Math.random() * 25,
          -4 - Math.random() * 6,
          (Math.random() - 0.5) * 1.5,
          -12 - Math.random() * 8,
          0.96, 0.65, 0.14,
          0.4, 1.4, 0.6, 0.8,
          'WEATHER_DUST', (Math.random() - 0.5) * 2
        );
      }
    } else if (weather === 'LIGHT_RAIN_MIST' || weather === 'BAGHDAD_STORM') {
      if (Math.random() < 0.4) {
        this.spawn(
          pos.x + (Math.random() - 0.5) * 12,
          0.1 + Math.random() * 0.8,
          pos.z + 5 + Math.random() * 15,
          (Math.random() - 0.5) * 2,
          0.1,
          -10,
          0.75, 0.85, 0.95,
          0.6, 1.8, 0.35, 0.6,
          'WEATHER_MIST', 0
        );
      }
    }
  }

  /**
   * 8. Heritage Lantern Warmth
   */
  public emitHeritageLanternGlow(pos: THREE.Vector3, biome: string) {
    if (this.activeCount >= this.maxParticles) return;

    if (biome === 'BAGHDAD' || biome === 'BABYLON' || biome === 'KARBALA' || biome === 'NAJAF') {
      if (Math.random() < 0.25) {
        const side = Math.random() > 0.5 ? 1 : -1;
        this.spawn(
          pos.x + side * (3.8 + Math.random() * 1.5),
          1.8 + Math.random() * 1.8,
          pos.z + 8 + Math.random() * 12,
          (Math.random() - 0.5) * 0.4,
          0.3 + Math.random() * 0.5,
          -2 - Math.random() * 2,
          1.0, 0.78, 0.28,
          0.2, 0.45, 0.55, 1.2,
          'COIN_BURST', 0
        );
      }
    }
  }

  /**
   * ==================== MAIN UPDATE ====================
   * Performs O(1) in-place updates without array splice or object creations.
   */
  public update(delta: number) {
    let i = 0;
    while (i < this.activeCount) {
      const p = this.pool[i];
      p.life += delta;

      if (p.life >= p.maxLife) {
        // Swap with last active item for O(1) removal
        this.activeCount--;
        if (i < this.activeCount) {
          const last = this.pool[this.activeCount];
          // Copy last to i
          p.active = last.active;
          p.position.copy(last.position);
          p.velocity.copy(last.velocity);
          p.color.copy(last.color);
          p.size = last.size;
          p.maxSize = last.maxSize;
          p.opacity = last.opacity;
          p.maxLife = last.maxLife;
          p.life = last.life;
          p.rotation = last.rotation;
          p.rotSpeed = last.rotSpeed;
          p.type = last.type;

          last.active = false;
        } else {
          p.active = false;
        }
        continue;
      }

      const lifeRatio = p.life / p.maxLife;

      // Update position
      p.position.addScaledVector(p.velocity, delta);

      // Physics based on particle type
      if (p.type === 'DUST' || p.type === 'WATER_SPRAY') {
        p.velocity.x *= 0.92;
        p.velocity.z *= 0.92;
        p.size = p.maxSize * Math.sin(lifeRatio * Math.PI * 0.8);
        p.opacity = (1 - lifeRatio) * 0.7;
      } else if (p.type === 'WEATHER_DUST') {
        p.size = p.maxSize * Math.sin(lifeRatio * Math.PI);
        p.opacity = Math.sin(lifeRatio * Math.PI) * 0.6;
      } else if (p.type === 'WEATHER_MIST') {
        p.opacity = (1 - lifeRatio) * 0.6;
        if (p.position.y <= 0.05) {
          p.position.y = 0.05;
          p.velocity.set(0, 0, 0);
          p.size = p.maxSize * 1.5;
        }
      } else if (p.type === 'SPARK') {
        p.velocity.y -= delta * 9.8;
        if (p.position.y < 0.02) {
          p.position.y = 0.02;
          p.velocity.y *= -0.4;
        }
        p.opacity = 1 - lifeRatio;
      } else if (p.type === 'COIN_BURST') {
        p.velocity.multiplyScalar(0.91);
        p.size = p.maxSize * (1 - lifeRatio * 0.4);
        p.opacity = 1 - lifeRatio;
      } else if (p.type === 'SHOCKWAVE') {
        p.velocity.multiplyScalar(0.9);
        p.size = p.maxSize * Math.sqrt(lifeRatio);
        p.opacity = (1 - lifeRatio) * 0.6;
      } else if (p.type === 'SPEED_TRAIL') {
        p.opacity = 1 - lifeRatio;
      }

      i++;
    }

    // Update GPU Buffers
    for (let j = 0; j < this.activeCount; j++) {
      const p = this.pool[j];
      this.positions[j * 3] = p.position.x;
      this.positions[j * 3 + 1] = p.position.y;
      this.positions[j * 3 + 2] = p.position.z;

      this.colors[j * 3] = p.color.r;
      this.colors[j * 3 + 1] = p.color.g;
      this.colors[j * 3 + 2] = p.color.b;

      this.sizes[j] = p.size;
      this.opacities[j] = p.opacity;
    }

    // Clear unused slots
    for (let j = this.activeCount; j < this.maxParticles; j++) {
      this.sizes[j] = 0;
      this.opacities[j] = 0;
    }

    this.particleGeometry.attributes.position.needsUpdate = true;
    this.particleGeometry.attributes.customColor.needsUpdate = true;
    this.particleGeometry.attributes.size.needsUpdate = true;
    this.particleGeometry.attributes.opacity.needsUpdate = true;
    this.particleGeometry.setDrawRange(0, this.activeCount);
  }

  public clearAll() {
    for (let i = 0; i < this.maxParticles; i++) {
      this.pool[i].active = false;
    }
    this.activeCount = 0;
    this.update(0);
  }

  public dispose() {
    this.clearAll();
    this.scene.remove(this.pointsMesh);
    this.particleGeometry.dispose();
    this.particleMaterial.dispose();
  }
}
