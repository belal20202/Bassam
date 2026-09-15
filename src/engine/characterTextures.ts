/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { BiomeType, WeatherType } from '../types';

export interface EnvironmentTextureState {
  weather: WeatherType;
  biome: BiomeType;
  wetness: number;         // 0 (dry) to 1 (soaked/rain sheen)
  dust: number;            // 0 (clean) to 1 (dust storm sand patina)
  neonGlow: number;        // 0 (day) to 1 (night cyber/street luminescent reflection)
  frost: number;           // 0 (none) to 1 (snow flurry riming)
}

/**
 * Procedural PBR Texture Map Suite for High-Fidelity Character Rendering
 */
export interface CharacterTextureSet {
  jacketAlbedo: THREE.CanvasTexture;
  jacketRoughness: THREE.CanvasTexture;
  joggersAlbedo: THREE.CanvasTexture;
  sneakersAlbedo: THREE.CanvasTexture;
  backpackAlbedo: THREE.CanvasTexture;
  faceAlbedo: THREE.CanvasTexture;
  faceRoughness: THREE.CanvasTexture;
  handsAlbedo: THREE.CanvasTexture;
  handsRoughness: THREE.CanvasTexture;
}

/**
 * CharacterTextureManager handles environment-adaptive texture mapping
 * and ultra-high resolution procedural PBR textures for Hammoudi.
 */
export class CharacterTextureManager {
  private currentState: EnvironmentTextureState = {
    weather: 'SUNNY_MORNING',
    biome: 'BAGHDAD',
    wetness: 0.0,
    dust: 0.0,
    neonGlow: 0.0,
    frost: 0.0,
  };

  private primaryColor: string = '#1e3a8a';
  private secondaryColor: string = '#f59e0b';
  private pantsColor: string = '#0f172a';
  private shoesColor: string = '#e11d48';

  // Cached Canvas Textures
  public textures: CharacterTextureSet;
  private isDirty: boolean = true;

  constructor() {
    this.textures = this.generateAllTextures();
  }

  public setColors(primary: string, secondary: string, pants: string, shoes: string) {
    if (
      this.primaryColor !== primary ||
      this.secondaryColor !== secondary ||
      this.pantsColor !== pants ||
      this.shoesColor !== shoes
    ) {
      this.primaryColor = primary;
      this.secondaryColor = secondary;
      this.pantsColor = pants;
      this.shoesColor = shoes;
      this.isDirty = true;
    }
  }

  public updateEnvironment(weather: WeatherType, biome: BiomeType, force: boolean = false) {
    let targetWetness = 0;
    let targetDust = 0;
    let targetNeon = 0;
    let targetFrost = 0;

    switch (weather) {
      case 'LIGHT_RAIN_MIST':
        targetWetness = 0.65;
        break;
      case 'BAGHDAD_STORM':
        targetWetness = 1.0;
        break;
      case 'BAGHDAD_DUST_STORM':
        targetDust = 0.95;
        break;
      case 'KARRADA_NIGHT':
        targetNeon = 0.85;
        targetWetness = 0.15;
        break;
      case 'SNOW_FLURRY':
        targetFrost = 0.85;
        targetWetness = 0.25;
        break;
      case 'GOLDEN_SUNSET':
        targetDust = 0.15;
        break;
      case 'NOON_BRIGHT':
        targetDust = 0.1;
        break;
      case 'SUNNY_MORNING':
      default:
        targetWetness = 0.0;
        targetDust = 0.0;
        targetNeon = 0.0;
        targetFrost = 0.0;
        break;
    }

    // Biome influences (e.g. desert provinces have natural dust, rivers have humidity)
    if (biome === 'ANBAR' || biome === 'MUTHANNA' || biome === 'NAJAF') {
      targetDust = Math.max(targetDust, 0.45);
    } else if (biome === 'BASRA' || biome === 'MAYSAN' || biome === 'WASIT') {
      targetWetness = Math.max(targetWetness, 0.2);
    }

    const changed =
      this.currentState.weather !== weather ||
      this.currentState.biome !== biome ||
      Math.abs(this.currentState.wetness - targetWetness) > 0.05 ||
      Math.abs(this.currentState.dust - targetDust) > 0.05 ||
      Math.abs(this.currentState.neonGlow - targetNeon) > 0.05 ||
      Math.abs(this.currentState.frost - targetFrost) > 0.05;

    if (changed || force) {
      this.currentState = {
        weather,
        biome,
        wetness: targetWetness,
        dust: targetDust,
        neonGlow: targetNeon,
        frost: targetFrost,
      };
      this.regenerateTextures();
    }
  }

  public setDirectEnvironmentFactors(wetness: number, dust: number, neonGlow: number, frost: number) {
    this.currentState.wetness = Math.max(0, Math.min(1, wetness));
    this.currentState.dust = Math.max(0, Math.min(1, dust));
    this.currentState.neonGlow = Math.max(0, Math.min(1, neonGlow));
    this.currentState.frost = Math.max(0, Math.min(1, frost));
    this.regenerateTextures();
  }

  public regenerateTextures() {
    this.textures = this.generateAllTextures();
    this.isDirty = false;
  }

  private generateAllTextures(): CharacterTextureSet {
    return {
      jacketAlbedo: this.createJacketAlbedo(),
      jacketRoughness: this.createJacketRoughness(),
      joggersAlbedo: this.createJoggersAlbedo(),
      sneakersAlbedo: this.createSneakersAlbedo(),
      backpackAlbedo: this.createBackpackAlbedo(),
      faceAlbedo: this.createUltraHDFaceAlbedo(),
      faceRoughness: this.createFaceRoughness(),
      handsAlbedo: this.createUltraHDHandsAlbedo(),
      handsRoughness: this.createHandsRoughness(),
    };
  }

  // =========================================================================
  // 1. ENVIRONMENT-ADAPTIVE JACKET TEXTURE (512x512)
  // =========================================================================
  private createJacketAlbedo(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Base athletic techwear fabric
    ctx.fillStyle = this.primaryColor;
    ctx.fillRect(0, 0, 512, 512);

    // High-res microscopic fabric weave
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    for (let y = 0; y < 512; y += 4) {
      ctx.fillRect(0, y, 512, 1.5);
    }
    for (let x = 0; x < 512; x += 4) {
      ctx.fillRect(x, 0, 1.5, 512);
    }

    // Dynamic Chevron Speed Stripes
    ctx.strokeStyle = this.secondaryColor;
    ctx.lineWidth = 14;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(30, 110);
    ctx.lineTo(256, 175);
    ctx.lineTo(482, 110);
    ctx.stroke();

    // High-visibility retro-reflective piping (lights up bright in night/karrada)
    const neonIntensity = this.currentState.neonGlow;
    ctx.strokeStyle = neonIntensity > 0.3 ? '#38bdf8' : 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = neonIntensity > 0.3 ? 5 : 2.5;
    ctx.beginPath();
    ctx.moveTo(30, 128);
    ctx.lineTo(256, 193);
    ctx.lineTo(482, 128);
    ctx.stroke();

    // Waterproof Front Zipper
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(250, 160, 12, 352);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    for (let z = 165; z < 505; z += 6) {
      ctx.beginPath();
      ctx.moveTo(251, z);
      ctx.lineTo(261, z);
      ctx.stroke();
    }

    // Golden zipper pull
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(248, 205, 16, 26);
    ctx.fillStyle = '#d97706';
    ctx.fillRect(252, 231, 8, 16);

    // Iraqi National Flag Crest (أحمر، أبيض، أسود مع النجوم الذهبية)
    const ribbonY = 195;
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(70, ribbonY, 74, 8);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(70, ribbonY + 8, 74, 8);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(70, ribbonY + 16, 74, 8);

    // Star of Ishtar 8-point Mesopotamian emblem
    ctx.save();
    ctx.translate(107, ribbonY + 48);
    ctx.fillStyle = '#f59e0b';
    for (let r = 0; r < 4; r++) {
      ctx.rotate(Math.PI / 4);
      ctx.beginPath();
      ctx.moveTo(-4, -14);
      ctx.lineTo(4, -14);
      ctx.lineTo(0, 14);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#fbbf24';
    ctx.fill();
    ctx.restore();

    // Chest Typography: «عداء بغداد» & «حمودي»
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('عداء بغداد', 390, ribbonY + 22);

    ctx.fillStyle = this.secondaryColor;
    ctx.font = 'bold 28px Arial, sans-serif';
    ctx.fillText('حمودي', 390, ribbonY + 54);

    // -----------------------------------------------------------------------
    // Environmental Overlays (Weather Texture Mapping)
    // -----------------------------------------------------------------------
    // A. RAIN & WETNESS: Darkened saturated cloth, water droplets, specular runs
    if (this.currentState.wetness > 0.05) {
      const wet = this.currentState.wetness;
      ctx.fillStyle = `rgba(15, 23, 42, ${wet * 0.45})`;
      ctx.fillRect(0, 0, 512, 512);

      // Rain droplets on shoulders and chest
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      for (let i = 0; i < Math.floor(wet * 80); i++) {
        const rx = (Math.sin(i * 99) * 0.5 + 0.5) * 512;
        const ry = (Math.cos(i * 33) * 0.5 + 0.5) * 512;
        const rrad = 1.5 + (i % 3);
        ctx.beginPath();
        ctx.arc(rx, ry, rrad, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // B. DUST & SAND PATINA: Desert dust accumulation in seams and shoulders
    if (this.currentState.dust > 0.05) {
      const dust = this.currentState.dust;
      const dustGrad = ctx.createLinearGradient(0, 512, 0, 0);
      dustGrad.addColorStop(0, `rgba(217, 165, 102, ${dust * 0.55})`);
      dustGrad.addColorStop(0.6, `rgba(217, 165, 102, ${dust * 0.25})`);
      dustGrad.addColorStop(1, `rgba(217, 165, 102, ${dust * 0.40})`); // Dust settles on top of shoulders
      ctx.fillStyle = dustGrad;
      ctx.fillRect(0, 0, 512, 512);

      // Speckled sand grains
      ctx.fillStyle = 'rgba(180, 130, 80, 0.35)';
      for (let i = 0; i < Math.floor(dust * 120); i++) {
        const sx = (Math.sin(i * 123) * 0.5 + 0.5) * 512;
        const sy = (Math.cos(i * 456) * 0.5 + 0.5) * 512;
        ctx.fillRect(sx, sy, 2, 2);
      }
    }

    // C. FROST & SNOW: Frost riming around collar and shoulder seams
    if (this.currentState.frost > 0.05) {
      const frost = this.currentState.frost;
      ctx.fillStyle = `rgba(240, 249, 255, ${frost * 0.35})`;
      ctx.fillRect(0, 0, 512, 60); // Shoulder top frost
      ctx.fillRect(240, 160, 32, 200); // Zipper frost
    }

    // D. NIGHT NEON REFLECTION (Karrada Night)
    if (this.currentState.neonGlow > 0.05) {
      const neon = this.currentState.neonGlow;
      const neonGrad = ctx.createLinearGradient(0, 0, 512, 512);
      neonGrad.addColorStop(0, `rgba(56, 189, 248, ${neon * 0.25})`);
      neonGrad.addColorStop(0.5, 'transparent');
      neonGrad.addColorStop(1, `rgba(244, 63, 94, ${neon * 0.20})`);
      ctx.fillStyle = neonGrad;
      ctx.fillRect(0, 0, 512, 512);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }

  private createJacketRoughness(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Base roughness (dry tech fabric ~0.65)
    let baseRoughness = 0.65;
    if (this.currentState.wetness > 0.1) {
      baseRoughness = Math.max(0.15, baseRoughness - this.currentState.wetness * 0.45); // glossy when wet
    } else if (this.currentState.dust > 0.1) {
      baseRoughness = Math.min(0.95, baseRoughness + this.currentState.dust * 0.3); // matte dusty
    }

    const val = Math.round(baseRoughness * 255);
    ctx.fillStyle = `rgb(${val},${val},${val})`;
    ctx.fillRect(0, 0, 256, 256);

    // Reflective tape is smooth (low roughness)
    ctx.fillStyle = 'rgb(30, 30, 30)';
    ctx.fillRect(15, 60, 226, 6);

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  // =========================================================================
  // 2. ENVIRONMENT-ADAPTIVE JOGGERS (PANTS) TEXTURE (256x256)
  // =========================================================================
  private createJoggersAlbedo(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    ctx.fillStyle = this.pantsColor;
    ctx.fillRect(0, 0, 256, 256);

    // Carbon weave micro-texture
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    for (let y = 0; y < 256; y += 4) {
      for (let x = 0; x < 256; x += 8) {
        if ((x + y) % 8 === 0) ctx.fillRect(x, y, 4, 4);
      }
    }

    // Outer acceleration stripe
    ctx.fillStyle = this.secondaryColor;
    ctx.fillRect(238, 0, 12, 256);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(246, 0, 4, 256);

    // Articulated knee reinforcement contour
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(128, 128, 42, -Math.PI * 0.4, Math.PI * 0.4);
    ctx.stroke();

    // Lower cuff puddle splash or dust
    if (this.currentState.wetness > 0.05) {
      const wet = this.currentState.wetness;
      // Dark wet cuffs & muddy asphalt splashes
      const splashGrad = ctx.createLinearGradient(0, 256, 0, 160);
      splashGrad.addColorStop(0, `rgba(15, 23, 42, ${wet * 0.7})`);
      splashGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = splashGrad;
      ctx.fillRect(0, 160, 256, 96);
    } else if (this.currentState.dust > 0.05) {
      const dust = this.currentState.dust;
      const dustGrad = ctx.createLinearGradient(0, 256, 0, 160);
      dustGrad.addColorStop(0, `rgba(217, 165, 102, ${dust * 0.6})`);
      dustGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = dustGrad;
      ctx.fillRect(0, 160, 256, 96);
    }

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  // =========================================================================
  // 3. HIGH-FIDELITY SNEAKER TEXTURE WITH ENVIRONMENT TREAD (256x256)
  // =========================================================================
  private createSneakersAlbedo(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Upper Sneaker Body
    ctx.fillStyle = this.shoesColor;
    ctx.fillRect(0, 0, 256, 150);

    // Dynamic wave contour
    ctx.strokeStyle = this.secondaryColor;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(10, 110);
    ctx.bezierCurveTo(70, 70, 180, 140, 245, 95);
    ctx.stroke();

    // Rubber Midsole and Tread
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 150, 256, 106);

    // Herringbone anti-slip asphalt tread grooves
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3;
    for (let x = 10; x < 250; x += 18) {
      ctx.beginPath();
      ctx.moveTo(x, 195);
      ctx.lineTo(x + 9, 220);
      ctx.lineTo(x + 18, 195);
      ctx.stroke();
    }

    // Weather impact on sneaker soles
    if (this.currentState.wetness > 0.05) {
      ctx.fillStyle = `rgba(15, 23, 42, ${this.currentState.wetness * 0.4})`;
      ctx.fillRect(0, 180, 256, 76);
    } else if (this.currentState.dust > 0.05) {
      ctx.fillStyle = `rgba(217, 165, 102, ${this.currentState.dust * 0.55})`;
      ctx.fillRect(0, 180, 256, 76);
    }

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  // =========================================================================
  // 4. CORDURA NYLON BACKPACK TEXTURE (512x512)
  // =========================================================================
  private createBackpackAlbedo(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    ctx.fillStyle = this.primaryColor;
    ctx.fillRect(0, 0, 512, 512);

    // Cordura cross-weave
    ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
    for (let y = 0; y < 512; y += 6) ctx.fillRect(0, y, 512, 2.5);
    for (let x = 0; x < 512; x += 6) ctx.fillRect(x, 0, 2.5, 512);

    // High-vis reflective ribbon (Glows strongly at night)
    const isNight = this.currentState.neonGlow > 0.3;
    ctx.fillStyle = isNight ? '#38bdf8' : '#e2e8f0';
    ctx.fillRect(50, 180, 412, 16);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(50, 185, 412, 6);

    // Tactical webbing loops
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(80, 240, 352, 26);
    ctx.fillStyle = '#334155';
    for (let w = 90; w < 420; w += 48) {
      ctx.fillRect(w, 240, 6, 26);
    }

    // Embroidered Baghdad Runner patch
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(140, 300, 232, 95);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.strokeRect(140, 300, 232, 95);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 26px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('حمودي ⚡ عداء بغداد', 256, 358);

    // Environmental Patina on backpack
    if (this.currentState.dust > 0.1) {
      ctx.fillStyle = `rgba(217, 165, 102, ${this.currentState.dust * 0.45})`;
      ctx.fillRect(0, 0, 512, 512);
    }

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  // =========================================================================
  // 5. CLEAN STYLIZED FACE ALBEDO (512x512)
  // =========================================================================
  private createUltraHDFaceAlbedo(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Warm natural Middle-Eastern athletic skin tone base (#dfa27a)
    ctx.fillStyle = '#e2a67a';
    ctx.fillRect(0, 0, 512, 512);

    // Soft warm blush on cheeks for energetic, healthy runner look
    const cheekFlush = ctx.createRadialGradient(256, 256, 50, 256, 256, 230);
    cheekFlush.addColorStop(0, 'rgba(235, 130, 105, 0.20)');
    cheekFlush.addColorStop(0.7, 'rgba(225, 145, 115, 0.08)');
    cheekFlush.addColorStop(1, 'transparent');
    ctx.fillStyle = cheekFlush;
    ctx.fillRect(0, 0, 512, 512);

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  private createFaceRoughness(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    ctx.fillStyle = 'rgb(130, 130, 130)';
    ctx.fillRect(0, 0, 256, 256);

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  // =========================================================================
  // 6. CLEAN STYLIZED HANDS ALBEDO (512x512)
  // =========================================================================
  private createUltraHDHandsAlbedo(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    ctx.fillStyle = '#e2a67a';
    ctx.fillRect(0, 0, 512, 512);

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  private createHandsRoughness(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Natural skin roughness
    ctx.fillStyle = 'rgb(145, 145, 145)';
    ctx.fillRect(0, 0, 256, 256);

    // Fingernails are smooth and glossy (low roughness ~0.2)
    ctx.fillStyle = 'rgb(50, 50, 50)';
    for (let n = 0; n < 4; n++) {
      ctx.fillRect(60 + n * 35, 5, 14, 16);
    }

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }
}
