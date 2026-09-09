/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

export interface Particle {
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
  type: 'DUST' | 'SPARK' | 'WATER_SPRAY' | 'COIN_BURST' | 'SPEED_TRAIL' | 'SHOCKWAVE' | 'WEATHER_DUST' | 'WEATHER_MIST';
}

export class ParticleFXManager {
  private scene: THREE.Scene;
  private particles: Particle[] = [];
  private maxParticles: number = 800;

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

    this.particleGeometry = new THREE.BufferGeometry();
    this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.particleGeometry.setAttribute('customColor', new THREE.BufferAttribute(this.colors, 3));
    this.particleGeometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));
    this.particleGeometry.setAttribute('opacity', new THREE.BufferAttribute(this.opacities, 1));

    // Custom Particle Shader for ultra-smooth bloom, glow, and fading
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

  // Create soft smoky dust texture
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

  // ==================== EMITTERS ====================

  /**
   * 1. Slide Street Dust & Friction Sparks (غبار وانزلاق الشوارع)
   */
  public emitSlideDustAndSparks(
    playerPos: THREE.Vector3,
    laneX: number,
    isWet: boolean = false,
    speed: number = 20
  ) {
    const originY = 0.08;
    const originZ = playerPos.z - 0.25;

    // Dust Puffs count
    const dustPuffCount = isWet ? 3 : 5;
    for (let i = 0; i < dustPuffCount; i++) {
      if (this.particles.length >= this.maxParticles) break;

      const spreadX = (Math.random() - 0.5) * 0.9;
      const spreadZ = (Math.random() - 0.5) * 0.6;
      const velX = spreadX * 2.2 + (Math.random() - 0.5) * 0.8;
      const velY = 0.4 + Math.random() * 0.9;
      const velZ = -speed * 0.25 - Math.random() * 2.0;

      // Color: Baghdad Sand Dust / Wet Road Spray
      const color = isWet
        ? new THREE.Color(0xb0c4de) // Soft cool water mist
        : new THREE.Color(0xd4a373).lerp(new THREE.Color(0x94a3b8), Math.random() * 0.4);

      this.particles.push({
        position: new THREE.Vector3(laneX + spreadX, originY, originZ + spreadZ),
        velocity: new THREE.Vector3(velX, velY, velZ),
        color,
        size: 0.35 + Math.random() * 0.35,
        maxSize: 1.2 + Math.random() * 0.8,
        opacity: isWet ? 0.6 : 0.75,
        maxLife: 0.55 + Math.random() * 0.3,
        life: 0,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 4,
        type: isWet ? 'WATER_SPRAY' : 'DUST',
      });
    }

    // Asphalt Friction Sparks (only on dry or moderately wet road)
    const sparkCount = isWet ? 1 : 4;
    for (let i = 0; i < sparkCount; i++) {
      if (this.particles.length >= this.maxParticles) break;

      const velX = (Math.random() - 0.5) * 4.5;
      const velY = 1.0 + Math.random() * 2.5;
      const velZ = -speed * 0.35 + (Math.random() - 0.5) * 4;

      const sparkColor = Math.random() > 0.3
        ? new THREE.Color(0xffb703) // Bright Gold/Orange
        : new THREE.Color(0xff4d00); // Incandescent Red

      this.particles.push({
        position: new THREE.Vector3(laneX + (Math.random() - 0.5) * 0.5, originY + 0.05, originZ),
        velocity: new THREE.Vector3(velX, velY, velZ),
        color: sparkColor,
        size: 0.2 + Math.random() * 0.2,
        maxSize: 0.35,
        opacity: 1.0,
        maxLife: 0.25 + Math.random() * 0.2,
        life: 0,
        rotation: 0,
        rotSpeed: 0,
        type: 'SPARK',
      });
    }
  }

  /**
   * 2. Footstep Ground Dust & Water Splashes (غبار خطوات الركض)
   */
  public emitFootstep(
    pos: THREE.Vector3,
    isLeftFoot: boolean,
    isWet: boolean = false
  ) {
    const footOffset = isLeftFoot ? -0.22 : 0.22;
    const count = isWet ? 4 : 2;

    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;

      const color = isWet
        ? new THREE.Color(0xcadcfa)
        : new THREE.Color(0xc2a679);

      this.particles.push({
        position: new THREE.Vector3(
          pos.x + footOffset + (Math.random() - 0.5) * 0.15,
          0.04,
          pos.z - 0.1
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 1.5,
          0.3 + Math.random() * 0.5,
          -1.5 - Math.random() * 1.5
        ),
        color,
        size: 0.2 + Math.random() * 0.2,
        maxSize: 0.65,
        opacity: 0.5,
        maxLife: 0.35,
        life: 0,
        rotation: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 3,
        type: isWet ? 'WATER_SPRAY' : 'DUST',
      });
    }
  }

  /**
   * 3. Coin Collection Golden Bloom Burst (توهج وانفجار العملات)
   */
  public emitCoinCollectBurst(coinPos: THREE.Vector3) {
    // 1. Central golden flash
    if (this.particles.length < this.maxParticles) {
      this.particles.push({
        position: coinPos.clone(),
        velocity: new THREE.Vector3(0, 0.5, 0),
        color: new THREE.Color(0xfff3b0), // Radiant bright white-gold
        size: 1.2,
        maxSize: 2.4,
        opacity: 1.0,
        maxLife: 0.25,
        life: 0,
        rotation: 0,
        rotSpeed: 0,
        type: 'COIN_BURST',
      });
    }

    // 2. Sparkling Dinar Star Shards
    const shardCount = 14;
    for (let i = 0; i < shardCount; i++) {
      if (this.particles.length >= this.maxParticles) break;

      const angle = (i / shardCount) * Math.PI * 2 + Math.random() * 0.2;
      const speed = 3.5 + Math.random() * 4.0;
      const velY = (Math.random() - 0.3) * 3.5;

      const color = i % 2 === 0
        ? new THREE.Color(0xffd166) // Pure Gold
        : new THREE.Color(0xffa200); // Amber Dinar

      this.particles.push({
        position: coinPos.clone().add(new THREE.Vector3(
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.2
        )),
        velocity: new THREE.Vector3(
          Math.cos(angle) * speed,
          velY,
          Math.sin(angle) * speed
        ),
        color,
        size: 0.3 + Math.random() * 0.25,
        maxSize: 0.7,
        opacity: 1.0,
        maxLife: 0.45 + Math.random() * 0.25,
        life: 0,
        rotation: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 8,
        type: 'COIN_BURST',
      });
    }
  }

  /**
   * 4. Jump Landing Ground Shockwave Dust (هبوط القفز)
   */
  public emitLandingImpact(pos: THREE.Vector3, isWet: boolean = false) {
    const ringCount = 16;
    for (let i = 0; i < ringCount; i++) {
      if (this.particles.length >= this.maxParticles) break;

      const angle = (i / ringCount) * Math.PI * 2;
      const speed = 2.5 + Math.random() * 2.0;

      const color = isWet
        ? new THREE.Color(0x93c5fd)
        : new THREE.Color(0xcaba9c);

      this.particles.push({
        position: new THREE.Vector3(
          pos.x + Math.cos(angle) * 0.3,
          0.05,
          pos.z + Math.sin(angle) * 0.3
        ),
        velocity: new THREE.Vector3(
          Math.cos(angle) * speed,
          0.3 + Math.random() * 0.4,
          Math.sin(angle) * speed
        ),
        color,
        size: 0.35 + Math.random() * 0.2,
        maxSize: 1.2,
        opacity: 0.7,
        maxLife: 0.45,
        life: 0,
        rotation: 0,
        rotSpeed: 0,
        type: 'SHOCKWAVE',
      });
    }
  }

  /**
   * 5. Turbo Speed Trail (خطوط السرعة النفاثة)
   */
  public emitTurboTrail(pos: THREE.Vector3) {
    if (this.particles.length >= this.maxParticles) return;

    // Red/Orange/Cyan energetic plasma particles
    const color = Math.random() > 0.5
      ? new THREE.Color(0xef4444)
      : new THREE.Color(0xf59e0b);

    this.particles.push({
      position: new THREE.Vector3(
        pos.x + (Math.random() - 0.5) * 0.6,
        pos.y + 0.8 + (Math.random() - 0.5) * 0.8,
        pos.z - 0.4
      ),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5,
        -15 - Math.random() * 5
      ),
      color,
      size: 0.4,
      maxSize: 0.8,
      opacity: 0.9,
      maxLife: 0.22,
      life: 0,
      rotation: 0,
      rotSpeed: 0,
      type: 'SPEED_TRAIL',
    });
  }

  /**
   * 6. Dynamic Ambient Weather Atmosphere Particles (عواصف رملية، غبار بغدادي، رذاذ مطر، وأنوار النيون)
   */
  public emitAmbientWeather(
    playerPos: THREE.Vector3,
    weather: string,
    delta: number
  ) {
    if (this.particles.length >= this.maxParticles - 40) return;

    if (weather === 'BAGHDAD_DUST_STORM') {
      // Swirling sand/dust particles blowing across the road
      const count = 3;
      for (let i = 0; i < count; i++) {
        const spawnZ = playerPos.z + 10 + Math.random() * 45;
        const spawnX = (Math.random() - 0.5) * 22;
        const spawnY = 0.5 + Math.random() * 6.0;

        const sandColor = Math.random() > 0.4
          ? new THREE.Color(0xd97706) // Golden Sand
          : new THREE.Color(0xb45309); // Amber Dust

        this.particles.push({
          position: new THREE.Vector3(spawnX, spawnY, spawnZ),
          velocity: new THREE.Vector3(
            -3.5 - Math.random() * 4.0, // Cross-wind
            (Math.random() - 0.5) * 0.8,
            -8.0 - Math.random() * 6.0
          ),
          color: sandColor,
          size: 0.6 + Math.random() * 0.6,
          maxSize: 1.8 + Math.random() * 1.0,
          opacity: 0.45 + Math.random() * 0.35,
          maxLife: 1.2 + Math.random() * 0.8,
          life: 0,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 4,
          type: 'WEATHER_DUST',
        });
      }
    } else if (weather === 'LIGHT_RAIN_MIST' || weather === 'BAGHDAD_STORM') {
      // Falling raindrops & ground mist
      const count = weather === 'BAGHDAD_STORM' ? 4 : 2;
      for (let i = 0; i < count; i++) {
        const spawnZ = playerPos.z + 5 + Math.random() * 35;
        const spawnX = (Math.random() - 0.5) * 16;
        const spawnY = 3.5 + Math.random() * 6.0;

        this.particles.push({
          position: new THREE.Vector3(spawnX, spawnY, spawnZ),
          velocity: new THREE.Vector3(
            -0.8 - Math.random() * 1.0,
            -12.0 - Math.random() * 6.0,
            -6.0
          ),
          color: new THREE.Color(0x93c5fd),
          size: 0.25,
          maxSize: 0.4,
          opacity: 0.65,
          maxLife: 0.6,
          life: 0,
          rotation: 0,
          rotSpeed: 0,
          type: 'WEATHER_MIST',
        });
      }
    } else if (weather === 'GOLDEN_SUNSET') {
      // Golden glowing atmospheric dust motes (ذرات الغبار الذهبي عند غروب الشمس)
      if (Math.random() < 0.45) {
        const spawnZ = playerPos.z + 6 + Math.random() * 28;
        const spawnX = (Math.random() - 0.5) * 14;
        const spawnY = 0.8 + Math.random() * 4.0;

        // Warm golden amber gradients
        const goldShades = [0xffd166, 0xf6bd60, 0xf77f00, 0xffbe0b];
        const chosenGold = goldShades[Math.floor(Math.random() * goldShades.length)];

        this.particles.push({
          position: new THREE.Vector3(spawnX, spawnY, spawnZ),
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 0.35,
            0.15 + Math.random() * 0.25,
            -1.5 - Math.random() * 1.5
          ),
          color: new THREE.Color(chosenGold),
          size: 0.45 + Math.random() * 0.35,
          maxSize: 0.85 + Math.random() * 0.4,
          opacity: 0.65,
          maxLife: 1.8 + Math.random() * 0.8,
          life: 0,
          rotation: Math.random() * Math.PI,
          rotSpeed: (Math.random() - 0.5) * 1.5,
          type: 'WEATHER_DUST',
        });
      }
    } else if (weather === 'KARRADA_NIGHT') {
      // Neon night atmosphere sparkles
      if (Math.random() < 0.35) {
        const spawnZ = playerPos.z + 8 + Math.random() * 30;
        const spawnX = (Math.random() - 0.5) * 16;
        const spawnY = 1.0 + Math.random() * 5.0;

        const neonColors = [0xec4899, 0xa855f7, 0x06b6d4, 0x3b82f6];
        const chosenColor = neonColors[Math.floor(Math.random() * neonColors.length)];

        this.particles.push({
          position: new THREE.Vector3(spawnX, spawnY, spawnZ),
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 0.5,
            0.3 + Math.random() * 0.4,
            -2.5 - Math.random() * 2.0
          ),
          color: new THREE.Color(chosenColor),
          size: 0.3,
          maxSize: 0.6,
          opacity: 0.6,
          maxLife: 1.2,
          life: 0,
          rotation: 0,
          rotSpeed: 0,
          type: 'WEATHER_DUST',
        });
      }
    }
  }

  /**
   * 7. Heritage Lantern Glow Particles (توهج خفيف للفوانيس التراثية في المناطق القديمة)
   * High performance, single batch draw call for heritage alleys (Mutanabbi, Rasheed, Kadhimiya)
   */
  public emitHeritageLanternGlow(playerPos: THREE.Vector3, biome: string) {
    if (this.particles.length >= this.maxParticles - 30) return;

    // Only active in historic heritage biomes
    const isHeritage = 
      biome.includes('MUTANABBI') || 
      biome.includes('RASHEED') || 
      biome.includes('KADHIMIYA') ||
      biome.includes('QISHLA');

    if (!isHeritage) return;

    // Subtle, gentle warm lantern firefly glow
    if (Math.random() < 0.25) {
      const side = Math.random() > 0.5 ? 1 : -1;
      const spawnX = side * (4.2 + Math.random() * 2.8);
      const spawnY = 2.4 + Math.random() * 1.8; // Lantern height along walls/posts
      const spawnZ = playerPos.z + 12 + Math.random() * 25;

      const lanternWarmth = Math.random() > 0.4 ? 0xffaa33 : 0xff7711;

      this.particles.push({
        position: new THREE.Vector3(spawnX, spawnY, spawnZ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.2,
          -1.0 - Math.random() * 1.0
        ),
        color: new THREE.Color(lanternWarmth),
        size: 0.6 + Math.random() * 0.4,
        maxSize: 1.1 + Math.random() * 0.5,
        opacity: 0.45,
        maxLife: 2.0 + Math.random() * 0.8,
        life: 0,
        rotation: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 0.8,
        type: 'WEATHER_DUST',
      });
    }
  }

  // ==================== UPDATE & RENDER BATCH ====================
  public update(delta: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += delta;

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      const lifeRatio = p.life / p.maxLife;

      // Update position
      p.position.addScaledVector(p.velocity, delta);

      // Physics based on particle type
      if (p.type === 'DUST' || p.type === 'WATER_SPRAY') {
        p.velocity.x *= 0.92; // Air friction
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
        p.velocity.y -= delta * 9.8; // Gravity
        if (p.position.y < 0.02) {
          p.position.y = 0.02;
          p.velocity.y *= -0.4; // Bounce off asphalt
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
    }

    // Update GPU Buffers
    const count = this.particles.length;
    for (let i = 0; i < count; i++) {
      const p = this.particles[i];
      this.positions[i * 3] = p.position.x;
      this.positions[i * 3 + 1] = p.position.y;
      this.positions[i * 3 + 2] = p.position.z;

      this.colors[i * 3] = p.color.r;
      this.colors[i * 3 + 1] = p.color.g;
      this.colors[i * 3 + 2] = p.color.b;

      this.sizes[i] = p.size;
      this.opacities[i] = p.opacity;
    }

    // Clear unused slots
    for (let i = count; i < this.maxParticles; i++) {
      this.sizes[i] = 0;
      this.opacities[i] = 0;
    }

    this.particleGeometry.attributes.position.needsUpdate = true;
    this.particleGeometry.attributes.customColor.needsUpdate = true;
    this.particleGeometry.attributes.size.needsUpdate = true;
    this.particleGeometry.attributes.opacity.needsUpdate = true;
    this.particleGeometry.setDrawRange(0, count);
  }

  public clearAll() {
    this.particles = [];
    this.update(0);
  }

  public dispose() {
    this.clearAll();
    this.scene.remove(this.pointsMesh);
    this.particleGeometry.dispose();
    this.particleMaterial.dispose();
  }
}
