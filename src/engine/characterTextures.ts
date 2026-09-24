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

  private primaryColor: string = '#00c7d9'; // Vibrant Cyan / Turquoise from reference image
  private secondaryColor: string = '#d946ef'; // Magenta / Purple accent
  private pantsColor: string = '#1e293b'; // Charcoal Dark Runner Joggers
  private shoesColor: string = '#00c7d9'; // Cyan Sneaker Upper with Lime Sole

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

    // Rich vibrant gradient for the oversized cyan/turquoise hoodie
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#00d2d3');
    grad.addColorStop(0.4, this.primaryColor);
    grad.addColorStop(1, '#0891b2');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Microscopic premium cotton fleece texture
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    for (let y = 0; y < 512; y += 4) {
      ctx.fillRect(0, y, 512, 1.2);
    }
    ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
    for (let x = 0; x < 512; x += 4) {
      ctx.fillRect(x, 0, 1.2, 512);
    }

    // Stylized Streetwear Chest Graphic "be st" in glowing neon cyan outline (from reference image)
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Outer glow for the logo
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12;
    ctx.font = '900 68px "Arial Rounded MT Bold", "Fredoka", sans-serif';
    ctx.strokeStyle = '#e0f2fe';
    ctx.lineWidth = 9;
    ctx.strokeText('be st', 256, 175);

    // Inner bright cyan stroke
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 5;
    ctx.strokeText('be st', 256, 175);

    // Core white neon highlight
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 66px "Arial Rounded MT Bold", "Fredoka", sans-serif';
    ctx.fillText('be st', 256, 175);
    ctx.restore();

    // Kangaroo Pocket curved outline and subtle shadow
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(110, 320);
    ctx.bezierCurveTo(150, 290, 362, 290, 402, 320);
    ctx.stroke();

    // Neon Yellow Hoodie Drawstring hanging lines
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(215, 60);
    ctx.bezierCurveTo(210, 140, 200, 180, 205, 220);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(297, 60);
    ctx.bezierCurveTo(302, 140, 312, 180, 307, 220);
    ctx.stroke();

    // Golden metallic aglets
    ctx.fillStyle = '#eab308';
    ctx.fillRect(201, 220, 8, 18);
    ctx.fillRect(303, 220, 8, 18);

    // Subtle Baghdad Runner emblem near the hem
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('بسام ⚡ BAGHDAD RUNNER', 256, 470);

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

    // Deep charcoal athletic runner fabric
    ctx.fillStyle = this.pantsColor;
    ctx.fillRect(0, 0, 256, 256);

    // Techwear micro-rib texture
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    for (let y = 0; y < 256; y += 4) {
      ctx.fillRect(0, y, 256, 1.2);
    }

    // Bold vibrant cyan/turquoise athletic speed stripes along the outer leg (from reference image)
    ctx.fillStyle = '#00d2d3';
    ctx.fillRect(232, 0, 16, 256);

    // Luminescent neon cyan inner border
    ctx.fillStyle = '#67e8f9';
    ctx.fillRect(228, 0, 4, 256);

    // Ergonomic knee articulation seam
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(128, 128, 44, -Math.PI * 0.45, Math.PI * 0.45);
    ctx.stroke();

    // Weather impact on cuffs
    if (this.currentState.wetness > 0.05) {
      const wet = this.currentState.wetness;
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

    // Upper Sneaker Body in vivid cyan/blue
    ctx.fillStyle = this.shoesColor;
    ctx.fillRect(0, 0, 256, 140);

    // Magenta / purple heel accent wrap (matching reference image)
    ctx.fillStyle = '#d946ef';
    ctx.fillRect(0, 40, 70, 100);

    // Neon Chartreuse / Lime Green Thick Sculpted Outsole (from reference image)
    const limeGrad = ctx.createLinearGradient(0, 140, 0, 256);
    limeGrad.addColorStop(0, '#bef264');
    limeGrad.addColorStop(0.5, '#a3e635');
    limeGrad.addColorStop(1, '#84cc16');
    ctx.fillStyle = limeGrad;
    ctx.fillRect(0, 140, 256, 116);

    // Neon Yellow Shoelace highlights
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 4;
    for (let y = 30; y < 110; y += 18) {
      ctx.beginPath();
      ctx.moveTo(110, y);
      ctx.lineTo(190, y + 10);
      ctx.moveTo(190, y);
      ctx.lineTo(110, y + 10);
      ctx.stroke();
    }

    // Dynamic wave contour between upper and midsole
    ctx.strokeStyle = '#bef264';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, 140);
    ctx.bezierCurveTo(70, 125, 170, 155, 256, 138);
    ctx.stroke();

    // Anti-slip grip tread grooves on outsole
    ctx.strokeStyle = '#4d7c0f';
    ctx.lineWidth = 3;
    for (let x = 12; x < 250; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, 205);
      ctx.lineTo(x + 8, 235);
      ctx.lineTo(x + 16, 205);
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
  // 4. CORDURA NYLON SLING BAG TEXTURE (512x512)
  // =========================================================================
  private createBackpackAlbedo(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Cyan base fabric with magenta contrast trims (matching reference image sling bag)
    ctx.fillStyle = '#00c7d9';
    ctx.fillRect(0, 0, 512, 512);

    // Diagonal magenta / purple athletic strap accents
    ctx.fillStyle = '#d946ef';
    ctx.fillRect(0, 60, 512, 38);
    ctx.fillRect(0, 414, 512, 38);

    // Neon pink trim piping
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(0, 98, 512, 8);
    ctx.fillRect(0, 406, 512, 8);

    // Golden runner clasp icon
    ctx.save();
    ctx.translate(256, 256);
    ctx.beginPath();
    ctx.arc(0, 0, 48, 0, Math.PI * 2);
    ctx.fillStyle = '#fbbf24';
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#d97706';
    ctx.stroke();

    ctx.fillStyle = '#1e1b4b';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚡', 0, 2);
    ctx.restore();

    // Environmental Patina on bag
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

    // Healthy warm natural peachy fair skin tone (#f5cbaf)
    ctx.fillStyle = '#f5cbaf';
    ctx.fillRect(0, 0, 512, 512);

    // Soft warm blush on cheeks for energetic, healthy runner look
    const cheekFlush = ctx.createRadialGradient(256, 256, 50, 256, 256, 230);
    cheekFlush.addColorStop(0, 'rgba(244, 114, 182, 0.22)');
    cheekFlush.addColorStop(0.7, 'rgba(251, 146, 60, 0.10)');
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

    ctx.fillStyle = 'rgb(125, 125, 125)';
    ctx.fillRect(0, 0, 256, 256);

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  // =========================================================================
  // 6. TACTICAL FINGERLESS RUNNER GLOVES & FAIR SKIN HANDS ALBEDO (512x512)
  // =========================================================================
  private createUltraHDHandsAlbedo(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Natural skin background
    ctx.fillStyle = '#f5cbaf';
    ctx.fillRect(0, 0, 512, 512);

    // Black tactical glove wrap across palm and back of hand
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 100, 512, 320);

    // Cutout circular knuckle holes revealing fair skin underneath (from reference image)
    ctx.fillStyle = '#f5cbaf';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(80 + i * 115, 230, 28, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cyan accent stitching on glove strap
    ctx.strokeStyle = '#00d2d3';
    ctx.lineWidth = 4;
    ctx.strokeRect(30, 370, 452, 40);

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
