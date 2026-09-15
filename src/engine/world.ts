/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { BiomeType, PowerUpType, WeatherType } from '../types';
import { ObstacleManager, ObstacleType } from './obstacles';
import { audioManager } from './audio';

export interface TrackChunk {
  group: THREE.Group;
  startZ: number;
  length: number;
  biome: BiomeType;
}

interface WeatherProfile {
  nameAr: string;
  skyColor: THREE.Color;
  fogColor: THREE.Color;
  fogNear: number;
  fogFar: number;
  sunColor: THREE.Color;
  sunIntensity: number;
  sunPos: THREE.Vector3;
  hemiSkyColor: THREE.Color;
  hemiGroundColor: THREE.Color;
  hemiIntensity: number;
  ambientColor: THREE.Color;
  ambientIntensity: number;
  rainIntensity: number; // 0 to 1
  roadRoughness: number; // Wetness effect
  roadMetalness: number;
}

export const ALL_BIOMES: BiomeType[] = [
  'BAGHDAD',
  'BASRA',
  'NINEVEH',
  'ERBIL',
  'SULAYMANIYAH',
  'DUHOK',
  'KIRKUK',
  'BABYLON',
  'KARBALA',
  'NAJAF',
  'ANBAR',
  'DIYALA',
  'SALADIN',
  'WASIT',
  'MAYSAN',
  'DHI_QAR',
  'MUTHANNA',
  'DIWANIYAH',
];

export function getRandomBiome(excludeBiome?: BiomeType): BiomeType {
  const available = excludeBiome ? ALL_BIOMES.filter((b) => b !== excludeBiome) : ALL_BIOMES;
  const index = Math.floor(Math.random() * available.length);
  return available[index];
}

export class WorldManager {
  public scene: THREE.Scene;
  public obstacleManager: ObstacleManager;

  public chunks: TrackChunk[] = [];
  public currentBiome: BiomeType = getRandomBiome();
  public currentWeather: WeatherType = 'SUNNY_MORNING';
  public chunkLength: number = 50;
  public visibleChunks: number = 5; // Optimized ~250m view distance to keep phone cool
  public nextChunkZ: number = 0;

  // Environment lights
  public dirLight: THREE.DirectionalLight;
  public hemiLight: THREE.HemisphereLight;
  public ambientLight: THREE.AmbientLight;

  // Dynamic Weather Interpolators
  private currentSkyColor: THREE.Color = new THREE.Color(0x60a5fa);
  private currentFogColor: THREE.Color = new THREE.Color(0x93c5fd);
  private currentSunColor: THREE.Color = new THREE.Color(0xffedd5);
  private currentHemiSkyColor: THREE.Color = new THREE.Color(0xf0fdf4);
  private currentHemiGroundColor: THREE.Color = new THREE.Color(0x1e293b);
  private currentAmbientColor: THREE.Color = new THREE.Color(0xffffff);

  private targetWeatherProfile: WeatherProfile;
  private weatherProfiles: Record<WeatherType, WeatherProfile>;

  // Rain & Splash Particle System (Optimized for smooth performance)
  private rainParticles: THREE.Points | null = null;
  private rainPositions: Float32Array | null = null;
  private rainVelocities: Float32Array | null = null;
  private rainCount: number = 110;
  private rainMat: THREE.PointsMaterial | null = null;
  private currentRainOpacity: number = 0;

  // Ground Splash Particles
  private splashParticles: THREE.Points | null = null;
  private splashPositions: Float32Array | null = null;
  private splashCount: number = 20;

  // Dust & Sandstorm Particle System
  private dustParticles: THREE.Points | null = null;
  private dustPositions: Float32Array | null = null;
  private dustVelocities: Float32Array | null = null;
  private dustCount: number = 80;
  private dustMat: THREE.PointsMaterial | null = null;
  private currentDustOpacity: number = 0;

  // Lightning Flash Effect for Storms
  private lightningTimer: number = 0;
  private isFlashing: boolean = false;
  private flashIntensity: number = 0;

  // Shared Geometries & Materials for high performance
  private roadGeo: THREE.PlaneGeometry;
  private roadMat: THREE.MeshStandardMaterial;
  private sidewalkMat: THREE.MeshStandardMaterial;
  private palmTrunkMat: THREE.MeshStandardMaterial;
  private palmLeavesMat: THREE.MeshStandardMaterial;
  private buildingMaterials: THREE.MeshStandardMaterial[];
  private puddleGeo: THREE.PlaneGeometry;
  public puddleMat: THREE.MeshStandardMaterial;
  private streetGlowMat: THREE.MeshBasicMaterial;

  // Modern Architecture & Nature Materials
  private glassTowerMat: THREE.MeshStandardMaterial;
  private darkGlassMat: THREE.MeshStandardMaterial;
  private modernWhiteMat: THREE.MeshStandardMaterial;
  private modernWoodMat: THREE.MeshStandardMaterial;
  private windowGlowMat: THREE.MeshBasicMaterial;
  private beaconMat: THREE.MeshBasicMaterial;
  private flowerPlanterMat: THREE.MeshStandardMaterial;
  private flowerFoliageMat: THREE.MeshStandardMaterial;
  private flowerRedMat: THREE.MeshStandardMaterial;
  private flowerYellowMat: THREE.MeshStandardMaterial;
  private flowerPinkMat: THREE.MeshStandardMaterial;
  private gardenTreeCanopyMat: THREE.MeshStandardMaterial;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.obstacleManager = new ObstacleManager(scene);

    // Define Weather Profiles (Moderate, eye-friendly, and crisp)
    this.weatherProfiles = {
      SUNNY_MORNING: {
        nameAr: 'صباح مشمس منعش',
        skyColor: new THREE.Color(0x7dd3fc),
        fogColor: new THREE.Color(0xbae6fd),
        fogNear: 85,
        fogFar: 300,
        sunColor: new THREE.Color(0xffedd5),
        sunIntensity: 1.5,
        sunPos: new THREE.Vector3(22, 45, 25),
        hemiSkyColor: new THREE.Color(0xf0fdf4),
        hemiGroundColor: new THREE.Color(0x334155),
        hemiIntensity: 0.75,
        ambientColor: new THREE.Color(0xffffff),
        ambientIntensity: 0.35,
        rainIntensity: 0,
        roadRoughness: 0.85,
        roadMetalness: 0.04,
      },
      NOON_BRIGHT: {
        nameAr: 'شمس الظهيرة المشرقة',
        skyColor: new THREE.Color(0x38bdf8),
        fogColor: new THREE.Color(0x93c5fd),
        fogNear: 95,
        fogFar: 320,
        sunColor: new THREE.Color(0xfef08a),
        sunIntensity: 1.6,
        sunPos: new THREE.Vector3(12, 55, 20),
        hemiSkyColor: new THREE.Color(0xffffff),
        hemiGroundColor: new THREE.Color(0x1e293b),
        hemiIntensity: 0.8,
        ambientColor: new THREE.Color(0xffffff),
        ambientIntensity: 0.4,
        rainIntensity: 0,
        roadRoughness: 0.9,
        roadMetalness: 0.02,
      },
      GOLDEN_SUNSET: {
        nameAr: 'شفق الغروب الذهبي الساحر',
        skyColor: new THREE.Color(0xf97316),
        fogColor: new THREE.Color(0xfdba74),
        fogNear: 70,
        fogFar: 280,
        sunColor: new THREE.Color(0xe11d48),
        sunIntensity: 1.45,
        sunPos: new THREE.Vector3(38, 22, -15),
        hemiSkyColor: new THREE.Color(0xffedd5),
        hemiGroundColor: new THREE.Color(0x451a03),
        hemiIntensity: 0.7,
        ambientColor: new THREE.Color(0xfcd34d),
        ambientIntensity: 0.38,
        rainIntensity: 0,
        roadRoughness: 0.65,
        roadMetalness: 0.16,
      },
      LIGHT_RAIN_MIST: {
        nameAr: 'رذاذ منعش وضباب خفيف',
        skyColor: new THREE.Color(0x64748b),
        fogColor: new THREE.Color(0x94a3b8),
        fogNear: 65,
        fogFar: 260,
        sunColor: new THREE.Color(0xf1f5f9),
        sunIntensity: 1.1,
        sunPos: new THREE.Vector3(15, 35, 20),
        hemiSkyColor: new THREE.Color(0x94a3b8),
        hemiGroundColor: new THREE.Color(0x1e293b),
        hemiIntensity: 0.68,
        ambientColor: new THREE.Color(0xe2e8f0),
        ambientIntensity: 0.45,
        rainIntensity: 0.35,
        roadRoughness: 0.35,
        roadMetalness: 0.22,
      },
      BAGHDAD_STORM: {
        nameAr: 'أمطار رعدية منعشة',
        skyColor: new THREE.Color(0x334155),
        fogColor: new THREE.Color(0x475569),
        fogNear: 55,
        fogFar: 240,
        sunColor: new THREE.Color(0xcfd8dc),
        sunIntensity: 0.9,
        sunPos: new THREE.Vector3(10, 30, 15),
        hemiSkyColor: new THREE.Color(0x64748b),
        hemiGroundColor: new THREE.Color(0x1e293b),
        hemiIntensity: 0.6,
        ambientColor: new THREE.Color(0xb0bec5),
        ambientIntensity: 0.45,
        rainIntensity: 0.5,
        roadRoughness: 0.25,
        roadMetalness: 0.35,
      },
      BAGHDAD_DUST_STORM: {
        nameAr: 'نسيم الصحراء الدافئ',
        skyColor: new THREE.Color(0xd97706),
        fogColor: new THREE.Color(0xfbbf24),
        fogNear: 65,
        fogFar: 260,
        sunColor: new THREE.Color(0xfef08a),
        sunIntensity: 1.1,
        sunPos: new THREE.Vector3(12, 28, 15),
        hemiSkyColor: new THREE.Color(0xfde68a),
        hemiGroundColor: new THREE.Color(0x451a03),
        hemiIntensity: 0.65,
        ambientColor: new THREE.Color(0xf59e0b),
        ambientIntensity: 0.45,
        rainIntensity: 0,
        roadRoughness: 0.85,
        roadMetalness: 0.08,
      },
      SNOW_FLURRY: {
        nameAr: 'ثلوج شتوية بيضاء',
        skyColor: new THREE.Color(0xdbeafe),
        fogColor: new THREE.Color(0xeff6ff),
        fogNear: 60,
        fogFar: 250,
        sunColor: new THREE.Color(0xffffff),
        sunIntensity: 1.1,
        sunPos: new THREE.Vector3(12, 35, 15),
        hemiSkyColor: new THREE.Color(0xe0f2fe),
        hemiGroundColor: new THREE.Color(0x94a3b8),
        hemiIntensity: 0.75,
        ambientColor: new THREE.Color(0xf8fafc),
        ambientIntensity: 0.45,
        rainIntensity: 0.4,
        roadRoughness: 0.3,
        roadMetalness: 0.1,
      },
      KARRADA_NIGHT: {
        nameAr: 'أضواء النيون الليلية',
        skyColor: new THREE.Color(0x090d16),
        fogColor: new THREE.Color(0x0f172a),
        fogNear: 60,
        fogFar: 260,
        sunColor: new THREE.Color(0x818cf8),
        sunIntensity: 0.85,
        sunPos: new THREE.Vector3(15, 30, 10),
        hemiSkyColor: new THREE.Color(0x312e81),
        hemiGroundColor: new THREE.Color(0x020617),
        hemiIntensity: 0.65,
        ambientColor: new THREE.Color(0x6366f1),
        ambientIntensity: 0.35,
        rainIntensity: 0,
        roadRoughness: 0.55,
        roadMetalness: 0.2,
      },
    };

    this.targetWeatherProfile = this.weatherProfiles[this.currentWeather];

    // 1. Lighting Setup
    this.hemiLight = new THREE.HemisphereLight(0xf0fdf4, 0x1e293b, 0.75);
    this.scene.add(this.hemiLight);

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xffedd5, 1.5);
    this.dirLight.position.set(22, 45, 25);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 160;
    const d = 32;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.scene.add(this.dirLight);

    // Fog Setup
    this.scene.fog = new THREE.Fog(0xbae6fd, 75, 280);
    this.scene.background = this.currentSkyColor;

    // 2. Performance Materials
    this.roadGeo = new THREE.PlaneGeometry(10, this.chunkLength);
    this.roadGeo.rotateX(-Math.PI / 2);

    this.roadMat = new THREE.MeshStandardMaterial({
      color: 0x27272a, // dark asphalt
      roughness: 0.85,
      metalness: 0.04,
    });

    this.sidewalkMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.9,
    });

    this.palmTrunkMat = new THREE.MeshStandardMaterial({
      color: 0x78350f,
      roughness: 0.9,
    });

    this.palmLeavesMat = new THREE.MeshStandardMaterial({
      color: 0x15803d,
      roughness: 0.7,
    });

    this.buildingMaterials = [
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.8 }), // Modern white
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.85 }), // Baghdad sandstone
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.2, metalness: 0.7 }), // Blue glass
      new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 }), // Concrete grey
      new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.9 }), // Heritage brick
    ];

    // Modern Skyscrapers & Villas Materials
    this.glassTowerMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.15, metalness: 0.85 });
    this.darkGlassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2, metalness: 0.75 });
    this.modernWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 });
    this.modernWoodMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.85 });
    this.windowGlowMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    this.beaconMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

    // Trees & Flowers Materials
    this.flowerPlanterMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 });
    this.flowerFoliageMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.8 });
    this.flowerRedMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.6 });
    this.flowerYellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.6 });
    this.flowerPinkMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.6 });
    this.gardenTreeCanopyMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 });

    // Wet Puddle Reflection Material (Mirror-like water surface reflecting skies, lamps, & neon)
    this.puddleGeo = new THREE.PlaneGeometry(2.4, 3.6, 6, 6);
    this.puddleGeo.rotateX(-Math.PI / 2);
    this.puddleMat = new THREE.MeshStandardMaterial({
      color: 0x18202c,
      roughness: 0.04,
      metalness: 0.88,
      transparent: true,
      opacity: 0.88,
    });

    // High-Clarity Street Light Ground Glow Pools (إضاءة شوارع متطورة وعالية الوضوح)
    this.streetGlowMat = new THREE.MeshBasicMaterial({
      color: 0xfff3a0,
      transparent: true,
      opacity: 0.38,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.initWeatherSystems();
  }

  private initWeatherSystems() {
    // 1. High-Density Rain Streaks
    const rainGeo = new THREE.BufferGeometry();
    this.rainPositions = new Float32Array(this.rainCount * 3);
    this.rainVelocities = new Float32Array(this.rainCount);

    for (let i = 0; i < this.rainCount * 3; i += 3) {
      this.rainPositions[i] = (Math.random() - 0.5) * 55; // Spread across lanes & buildings
      this.rainPositions[i + 1] = Math.random() * 45; // Altitude
      this.rainPositions[i + 2] = (Math.random() - 0.5) * 110; // Forward depth
      this.rainVelocities[i / 3] = 40 + Math.random() * 25; // Variable downward velocity
    }

    rainGeo.setAttribute('position', new THREE.BufferAttribute(this.rainPositions, 3));

    this.rainMat = new THREE.PointsMaterial({
      color: 0xc7d2fe,
      size: 0.18,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });

    this.rainParticles = new THREE.Points(rainGeo, this.rainMat);
    this.scene.add(this.rainParticles);

    // 2. Ground Splash Particles
    const splashGeo = new THREE.BufferGeometry();
    this.splashPositions = new Float32Array(this.splashCount * 3);
    for (let i = 0; i < this.splashCount * 3; i += 3) {
      this.splashPositions[i] = (Math.random() - 0.5) * 10;
      this.splashPositions[i + 1] = 0.05;
      this.splashPositions[i + 2] = (Math.random() - 0.5) * 20;
    }
    splashGeo.setAttribute('position', new THREE.BufferAttribute(this.splashPositions, 3));

    const splashMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.12,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });

    this.splashParticles = new THREE.Points(splashGeo, splashMat);
    this.scene.add(this.splashParticles);

    // 3. Ambient Dust & Sandstorm Particles (Baghdad Dust Storm & Golden Sunset Haze)
    const dustGeo = new THREE.BufferGeometry();
    this.dustPositions = new Float32Array(this.dustCount * 3);
    this.dustVelocities = new Float32Array(this.dustCount * 2); // [lateralSpeed, swirlPhase]

    for (let i = 0; i < this.dustCount * 3; i += 3) {
      this.dustPositions[i] = (Math.random() - 0.5) * 45;
      this.dustPositions[i + 1] = 0.2 + Math.random() * 8.5;
      this.dustPositions[i + 2] = (Math.random() - 0.5) * 80;
      this.dustVelocities[(i / 3) * 2] = 4 + Math.random() * 8; // Horizontal wind speed
      this.dustVelocities[(i / 3) * 2 + 1] = Math.random() * Math.PI * 2; // Swirl phase
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(this.dustPositions, 3));

    this.dustMat = new THREE.PointsMaterial({
      color: 0xf59e0b, // Warm Amber/Golden Dust
      size: 0.16,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });

    this.dustParticles = new THREE.Points(dustGeo, this.dustMat);
    this.scene.add(this.dustParticles);
  }

  // ==================== DYNAMIC WEATHER ENGINE ====================
  public setWeather(weather: WeatherType) {
    this.currentWeather = weather;
    this.targetWeatherProfile = this.weatherProfiles[weather];
  }

  public getCurrentWeather(): WeatherType {
    return this.currentWeather;
  }

  public getWeatherName(weather?: WeatherType): string {
    const w = weather || this.currentWeather;
    return this.weatherProfiles[w]?.nameAr || 'طقس بغداد';
  }

  // ==================== BIOME CONFIGURATION ====================
  public setBiome(biome: BiomeType) {
    this.currentBiome = biome;
    // Weather is dynamically driven every 1000m by gameEngine.getWeatherForDistance
    // to provide continuous variety across all runs as requested by the player.
  }

  // ==================== PROCEDURAL CHUNK CREATION ====================
  public createChunk(startZ: number, biome: BiomeType, difficultyFactor: number = 1.0): TrackChunk {
    const group = new THREE.Group();
    group.position.z = startZ + this.chunkLength / 2;

    // 1. Asphalt Road
    const road = new THREE.Mesh(this.roadGeo, this.roadMat);
    road.receiveShadow = true;
    group.add(road);

    // 2. Lane Dividers (White Dashed lines at x = -1.25 and x = 1.25)
    const stripeCount = 6;
    const stripeGeo = new THREE.PlaneGeometry(0.12, 3.2);
    stripeGeo.rotateX(-Math.PI / 2);
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    for (let i = 0; i < stripeCount; i++) {
      const zOffset = -this.chunkLength / 2 + (i + 0.5) * (this.chunkLength / stripeCount);
      const stripeL = new THREE.Mesh(stripeGeo, stripeMat);
      stripeL.position.set(-1.25, 0.01, zOffset);
      const stripeR = new THREE.Mesh(stripeGeo, stripeMat);
      stripeR.position.set(1.25, 0.01, zOffset);
      group.add(stripeL, stripeR);
    }

    // 3. Sidewalks (Left & Right)
    const sidewalkGeo = new THREE.BoxGeometry(3.5, 0.25, this.chunkLength);
    const swL = new THREE.Mesh(sidewalkGeo, this.sidewalkMat);
    swL.position.set(-6.75, 0.125, 0);
    swL.receiveShadow = true;

    const swR = new THREE.Mesh(sidewalkGeo, this.sidewalkMat);
    swR.position.set(6.75, 0.125, 0);
    swR.receiveShadow = true;
    group.add(swL, swR);

    // 4. Modern Sidewalk Landscaping: Alternating Palms & Lush Flowering Trees
    const palmInterval = 25;
    for (let z = -this.chunkLength / 2 + 8; z < this.chunkLength / 2; z += palmInterval) {
      if (Math.random() > 0.4) {
        const treeL = this.createLushGardenTree();
        treeL.position.set(-6.6, 0.25, z);
        const treeR = this.createPalmTree();
        treeR.position.set(6.6, 0.25, z + 5);
        group.add(treeL, treeR);
      } else {
        const palmL = this.createPalmTree();
        palmL.position.set(-6.6, 0.25, z);
        const treeR = this.createLushGardenTree();
        treeR.position.set(6.6, 0.25, z + 5);
        group.add(palmL, treeR);
      }
    }

    // Modern Flowerbeds & Planters along both sidewalks
    const planterZOffsets = [-15, 10];
    for (const pZ of planterZOffsets) {
      const planterL = this.createFlowerPlanter();
      planterL.position.set(-5.6, 0.25, pZ);
      const planterR = this.createFlowerPlanter();
      planterR.position.set(5.6, 0.25, pZ);
      group.add(planterL, planterR);
    }

    // 5. Developed Architecture: Modern Skyscrapers & High-End Villas
    const buildingCount = 2;
    const bldgSpacing = this.chunkLength / buildingCount;
    for (let i = 0; i < buildingCount; i++) {
      const z = -this.chunkLength / 2 + (i + 0.5) * bldgSpacing;
      // Left side building (Skyscraper or Modern Villa)
      const bldgL = this.createDevelopedBuilding(biome);
      bldgL.position.set(-14.5 - Math.random() * 2, 0, z);
      // Right side building
      const bldgR = this.createDevelopedBuilding(biome);
      bldgR.position.set(14.5 + Math.random() * 2, 0, z);
      group.add(bldgL, bldgR);
    }

    // 6. Roads are clean and unobstructed (Side lighting removed as requested)

    // 7. Reflective Wet Asphalt Puddles (placed in lanes with natural variation)
    const puddleLanes = [-2.5, 0, 2.5];
    const puddleZOffsets = [-15, 5, 18];
    for (let i = 0; i < 3; i++) {
      const pLane = puddleLanes[i];
      const pZ = puddleZOffsets[i];
      const puddle = new THREE.Mesh(this.puddleGeo, this.puddleMat);
      puddle.position.set(pLane + (Math.random() - 0.5) * 0.4, 0.012, pZ);
      puddle.rotation.z = (Math.random() - 0.5) * 0.4;
      puddle.scale.set(0.8 + Math.random() * 0.4, 0.8 + Math.random() * 0.5, 1);
      group.add(puddle);
    }

    // 8. Spawn Obstacles, Coins & Power-ups along this chunk with adaptive difficulty
    this.populateChunkContent(startZ, biome, difficultyFactor);

    this.scene.add(group);
    const chunkObj: TrackChunk = { group, startZ, length: this.chunkLength, biome };
    this.chunks.push(chunkObj);
    return chunkObj;
  }

  private createPalmTree(): THREE.Group {
    const palm = new THREE.Group();

    // Palm Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.18, 0.28, 5.5, 8);
    const trunk = new THREE.Mesh(trunkGeo, this.palmTrunkMat);
    trunk.position.y = 2.75;
    trunk.castShadow = true;
    palm.add(trunk);

    // Palm Crown (Fronds)
    const frondGeo = new THREE.ConeGeometry(1.9, 0.9, 7);
    const frond1 = new THREE.Mesh(frondGeo, this.palmLeavesMat);
    frond1.position.y = 5.6;
    frond1.rotation.z = 0.2;
    frond1.castShadow = true;

    const frond2 = new THREE.Mesh(frondGeo, this.palmLeavesMat);
    frond2.position.y = 5.8;
    frond2.rotation.z = -0.2;
    frond2.castShadow = true;

    palm.add(frond1, frond2);
    return palm;
  }

  private createStreetLamp(): THREE.Group {
    const lamp = new THREE.Group();
    // Modern architectural graphite pole
    const poleGeo = new THREE.CylinderGeometry(0.08, 0.12, 6.0, 10);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.3 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 3.0;
    pole.castShadow = true;

    // Curved luminaire arch
    const archGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.6, 8);
    const arch = new THREE.Mesh(archGeo, poleMat);
    arch.position.set(0.65, 5.8, 0);
    arch.rotation.z = -Math.PI / 3.2;

    // Modern LED Luminaire Head (Slim aerofoil)
    const headGeo = new THREE.BoxGeometry(0.7, 0.12, 0.32);
    const head = new THREE.Mesh(headGeo, poleMat);
    head.position.set(1.25, 5.5, 0);

    // Ultra-bright LED Light emitter bar (illuminating the asphalt)
    const ledBarGeo = new THREE.BoxGeometry(0.55, 0.03, 0.22);
    const ledBarMat = new THREE.MeshBasicMaterial({ color: 0xfffbeb });
    const ledBar = new THREE.Mesh(ledBarGeo, ledBarMat);
    ledBar.position.set(1.25, 5.43, 0);

    // Volumetric Soft Light Cone (conical illumination projecting downwards with clear visibility)
    const coneGeo = new THREE.ConeGeometry(2.4, 5.2, 16, 1, true);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xffedd5,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const lightCone = new THREE.Mesh(coneGeo, coneMat);
    lightCone.position.set(1.25, 2.7, 0);

    lamp.add(pole, arch, head, ledBar, lightCone);
    return lamp;
  }

  // Sidewalk Flower Planters with Vibrant Blossom Clusters (أحواض زهور وورود)
  private createFlowerPlanter(): THREE.Group {
    const planter = new THREE.Group();

    // Dark Stone Planter Box
    const boxGeo = new THREE.BoxGeometry(0.7, 0.4, 2.4);
    const box = new THREE.Mesh(boxGeo, this.flowerPlanterMat);
    box.position.y = 0.2;
    box.castShadow = true;
    planter.add(box);

    // Soil & Dense Green Hedge
    const hedgeGeo = new THREE.BoxGeometry(0.62, 0.35, 2.3);
    const hedge = new THREE.Mesh(hedgeGeo, this.flowerFoliageMat);
    hedge.position.y = 0.38;
    planter.add(hedge);

    // Colorful Flower Clusters (Roses, Marigolds, Petunias)
    const flowerGeo = new THREE.SphereGeometry(0.12, 6, 6);
    const colors = [this.flowerRedMat, this.flowerYellowMat, this.flowerPinkMat];
    for (let i = 0; i < 6; i++) {
      const flowerMesh = new THREE.Mesh(flowerGeo, colors[i % colors.length]);
      flowerMesh.position.set(
        (Math.random() - 0.5) * 0.4,
        0.58 + Math.random() * 0.08,
        -0.8 + i * 0.32
      );
      planter.add(flowerMesh);
    }

    return planter;
  }

  // Lush Urban Trees with Round Canopies and Blossoms (أشجار وورود)
  private createLushGardenTree(): THREE.Group {
    const tree = new THREE.Group();

    // Tree Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 4.5, 8);
    const trunk = new THREE.Mesh(trunkGeo, this.palmTrunkMat);
    trunk.position.y = 2.25;
    trunk.castShadow = true;
    tree.add(trunk);

    // Main Crown
    const isFlowering = Math.random() > 0.5;
    const crownMat = isFlowering ? this.flowerPinkMat : this.gardenTreeCanopyMat;

    const crownGeo = new THREE.SphereGeometry(1.6, 8, 8);
    const crown1 = new THREE.Mesh(crownGeo, crownMat);
    crown1.position.y = 4.8;
    crown1.castShadow = true;
    tree.add(crown1);

    const crown2 = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), crownMat);
    crown2.position.set(0.4, 5.6, -0.3);
    crown2.castShadow = true;
    tree.add(crown2);

    return tree;
  }

  // 1. Modern High-Rise Skyscraper with Stepped Setbacks, Corner Columns & Crown Spire
  private createSkyscraper(): THREE.Group {
    const tower = new THREE.Group();
    const width = 12 + Math.random() * 3;
    const depth = 12 + Math.random() * 3;
    const totalHeight = 55 + Math.random() * 35; // 55m to 90m tall

    const tier1H = totalHeight * 0.48;
    const tier2H = totalHeight * 0.34;
    const tier3H = totalHeight * 0.18;

    // --- Tier 1 (Base Podium) ---
    const t1Geo = new THREE.BoxGeometry(width, tier1H, depth);
    const t1 = new THREE.Mesh(t1Geo, this.glassTowerMat);
    t1.position.y = tier1H / 2;
    t1.castShadow = true;
    t1.receiveShadow = true;
    tower.add(t1);

    // Sculpted Corner Aerodynamic Columns for Tier 1
    const colGeo1 = new THREE.CylinderGeometry(0.55, 0.55, tier1H, 10);
    const halfW = width / 2;
    const halfD = depth / 2;
    const corners = [
      [-halfW, -halfD],
      [halfW, -halfD],
      [-halfW, halfD],
      [halfW, halfD],
    ];
    corners.forEach(([cx, cz]) => {
      const col = new THREE.Mesh(colGeo1, this.modernWhiteMat);
      col.position.set(cx, tier1H / 2, cz);
      tower.add(col);
    });

    // Tier 1 Glowing Floor Rings
    const bandCount1 = Math.floor(tier1H / 5.5);
    const bandGeo1 = new THREE.BoxGeometry(width * 1.02, 0.4, depth * 1.02);
    for (let i = 1; i <= bandCount1; i++) {
      const band = new THREE.Mesh(bandGeo1, this.windowGlowMat);
      band.position.y = i * 5.5;
      tower.add(band);
    }

    // --- Tier 2 (Mid Tower Setback) ---
    const w2 = width * 0.82;
    const d2 = depth * 0.82;
    const t2Geo = new THREE.BoxGeometry(w2, tier2H, d2);
    const t2 = new THREE.Mesh(t2Geo, this.glassTowerMat);
    t2.position.y = tier1H + tier2H / 2;
    t2.castShadow = true;
    tower.add(t2);

    // Tier 2 White Corner Columns
    const colGeo2 = new THREE.CylinderGeometry(0.45, 0.45, tier2H, 10);
    const halfW2 = w2 / 2;
    const halfD2 = d2 / 2;
    [
      [-halfW2, -halfD2],
      [halfW2, -halfD2],
      [-halfW2, halfD2],
      [halfW2, halfD2],
    ].forEach(([cx, cz]) => {
      const col = new THREE.Mesh(colGeo2, this.modernWhiteMat);
      col.position.set(cx, tier1H + tier2H / 2, cz);
      tower.add(col);
    });

    // Tier 2 Floor Bands
    const bandCount2 = Math.floor(tier2H / 5.5);
    const bandGeo2 = new THREE.BoxGeometry(w2 * 1.025, 0.38, d2 * 1.025);
    for (let i = 1; i <= bandCount2; i++) {
      const band = new THREE.Mesh(bandGeo2, this.windowGlowMat);
      band.position.y = tier1H + i * 5.5;
      tower.add(band);
    }

    // --- Tier 3 (Crown Penthouse) ---
    const w3 = w2 * 0.78;
    const d3 = d2 * 0.78;
    const t3Geo = new THREE.BoxGeometry(w3, tier3H, d3);
    const t3 = new THREE.Mesh(t3Geo, this.modernWhiteMat);
    t3.position.y = tier1H + tier2H + tier3H / 2;
    t3.castShadow = true;
    tower.add(t3);

    // Glowing Crown Light Rings
    const crownRingGeo = new THREE.BoxGeometry(w3 * 1.04, 0.65, d3 * 1.04);
    const crownRing = new THREE.Mesh(crownRingGeo, this.windowGlowMat);
    crownRing.position.y = tier1H + tier2H + tier3H * 0.75;
    tower.add(crownRing);

    // Multi-tier Rooftop Spire & Warning Beacon
    const spireY = tier1H + tier2H + tier3H;
    const spireGeo = new THREE.CylinderGeometry(0.08, 0.25, 11, 8);
    const spire = new THREE.Mesh(spireGeo, this.modernWhiteMat);
    spire.position.set(0, spireY + 5.5, 0);
    tower.add(spire);

    const beaconGeo = new THREE.SphereGeometry(0.45, 8, 8);
    const beacon = new THREE.Mesh(beaconGeo, this.beaconMat);
    beacon.position.set(0, spireY + 11.2, 0);
    tower.add(beacon);

    return tower;
  }

  // 2. Modern Contemporary White Villa with Pitched Roofs, Curved Balconies & Colonnades
  private createModernVilla(): THREE.Group {
    const villa = new THREE.Group();
    const width = 13 + Math.random() * 3;
    const depth = 11 + Math.random() * 3;
    const baseHeight = 4.8;

    // Ground Floor: Pure Crisp Architectural White (بيضاء بالكامل)
    const groundGeo = new THREE.BoxGeometry(width, baseHeight, depth);
    const ground = new THREE.Mesh(groundGeo, this.modernWhiteMat);
    ground.position.y = baseHeight / 2;
    ground.castShadow = true;
    ground.receiveShadow = true;
    villa.add(ground);

    // Classical Sculpted White Entrance Pillars (أعمدة بيضاء منحوتة وليست مكعبة)
    const pillarGeo = new THREE.CylinderGeometry(0.3, 0.35, baseHeight, 12);
    const p1 = new THREE.Mesh(pillarGeo, this.modernWhiteMat);
    p1.position.set(-width * 0.32, baseHeight / 2, depth * 0.5 + 0.5);
    const p2 = new THREE.Mesh(pillarGeo, this.modernWhiteMat);
    p2.position.set(-width * 0.12, baseHeight / 2, depth * 0.5 + 0.5);
    villa.add(p1, p2);

    // Cantilevered Upper Floor (Pure White)
    const upperGeo = new THREE.BoxGeometry(width * 0.88, baseHeight, depth * 0.92);
    const upper = new THREE.Mesh(upperGeo, this.modernWhiteMat);
    upper.position.set(width * 0.06, baseHeight * 1.5, 0);
    upper.castShadow = true;
    upper.receiveShadow = true;
    villa.add(upper);

    // Sculpted Sloped Architectural Roof (سقف معماري مائل أبيض أنيق وليس مجرد مكعب)
    const roofWidth = width * 0.94;
    const roofDepth = depth * 0.96;
    const roofGeo = new THREE.ConeGeometry(roofWidth * 0.72, 3.2, 4);
    roofGeo.rotateY(Math.PI / 4);
    const roof = new THREE.Mesh(roofGeo, this.modernWhiteMat);
    roof.position.set(width * 0.06, baseHeight * 2.0 + 1.6, 0);
    roof.scale.set(1.0, 1.0, roofDepth / roofWidth);
    roof.castShadow = true;
    villa.add(roof);

    // Curved Sculpted Balcony with Glass Balustrade
    const balcBaseGeo = new THREE.CylinderGeometry(width * 0.32, width * 0.32, 0.3, 16, 1, false, 0, Math.PI);
    balcBaseGeo.rotateY(-Math.PI / 2);
    const balcBase = new THREE.Mesh(balcBaseGeo, this.modernWhiteMat);
    balcBase.position.set(width * 0.2, baseHeight, depth * 0.46);
    villa.add(balcBase);

    const glassRailGeo = new THREE.CylinderGeometry(width * 0.31, width * 0.31, 0.8, 16, 1, true, 0, Math.PI);
    glassRailGeo.rotateY(-Math.PI / 2);
    const glassRail = new THREE.Mesh(glassRailGeo, this.glassTowerMat);
    glassRail.position.set(width * 0.2, baseHeight + 0.45, depth * 0.46);
    villa.add(glassRail);

    // Panoramic Illuminated French Windows
    const windowGeo = new THREE.BoxGeometry(width * 0.38, baseHeight * 0.65, 0.35);
    const windowMesh = new THREE.Mesh(windowGeo, this.windowGlowMat);
    windowMesh.position.set(width * 0.2, baseHeight * 1.48, depth * 0.47);
    villa.add(windowMesh);

    // Elegant White Architectural Sunshades (Louvers)
    for (let l = 0; l < 4; l++) {
      const louver = new THREE.Mesh(new THREE.BoxGeometry(width * 0.42, 0.1, 0.6), this.modernWhiteMat);
      louver.position.set(width * 0.2, baseHeight * 1.25 + l * 0.55, depth * 0.49);
      villa.add(louver);
    }

    return villa;
  }

  // 3. Distinctive Modern Restaurant & Cafe with Pure White Stucco & Warm Terraces
  private createModernRestaurant(): THREE.Group {
    const restaurant = new THREE.Group();
    const width = 13.5;
    const height = 9.0;
    const depth = 11.0;

    // Main Building Structure: Pure Crisp Architectural White (بيضاء بالكامل)
    const mainGeo = new THREE.BoxGeometry(width, height, depth);
    const mainMesh = new THREE.Mesh(mainGeo, this.modernWhiteMat);
    mainMesh.position.y = height / 2;
    mainMesh.castShadow = true;
    mainMesh.receiveShadow = true;
    restaurant.add(mainMesh);

    // Architectural Sloped White Parapet Crown (محدد معماري علوي أنيق)
    const parapetGeo = new THREE.BoxGeometry(width * 1.05, 0.8, depth * 1.05);
    const parapet = new THREE.Mesh(parapetGeo, this.modernWhiteMat);
    parapet.position.y = height + 0.4;
    restaurant.add(parapet);

    // Warm Illuminated Floor-to-Ceiling Dining Picture Window
    const windowGeo = new THREE.BoxGeometry(width * 0.65, 3.8, 0.4);
    const windowMesh = new THREE.Mesh(windowGeo, this.windowGlowMat);
    windowMesh.position.set(-width * 0.12, 2.8, depth * 0.51);
    restaurant.add(windowMesh);

    // Pure White Sculpted Facade Framing
    const frameGeo = new THREE.BoxGeometry(width * 0.70, 4.2, 0.3);
    const frame = new THREE.Mesh(frameGeo, this.modernWhiteMat);
    frame.position.set(-width * 0.12, 2.8, depth * 0.49);
    restaurant.add(frame);

    // Outdoor Dining Terrace (Flushing out toward sidewalk)
    const terraceGeo = new THREE.BoxGeometry(width * 0.75, 0.25, 3.8);
    const terraceMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.5 });
    const terrace = new THREE.Mesh(terraceGeo, terraceMat);
    terrace.position.set(-width * 0.1, 0.125, depth * 0.5 + 1.9);
    terrace.receiveShadow = true;
    restaurant.add(terrace);

    // Outdoor Dining Tables
    const tableMat = new THREE.MeshStandardMaterial({ color: 0xcfd8dc, metalness: 0.4 });
    const table1 = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.75, 12), tableMat);
    table1.position.set(-width * 0.28, 0.5, depth * 0.5 + 1.8);
    const table2 = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.75, 12), tableMat);
    table2.position.set(width * 0.08, 0.5, depth * 0.5 + 1.8);
    restaurant.add(table1, table2);

    // Modern Cafe Terrace Parasol / Umbrella
    const umbrellaPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.4, 8), tableMat);
    umbrellaPole.position.set(-width * 0.28, 1.3, depth * 0.5 + 1.8);
    const umbrellaCanopy = new THREE.Mesh(
      new THREE.ConeGeometry(1.4, 0.55, 12),
      new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.6 }) // Vibrant bistro red canopy
    );
    umbrellaCanopy.position.set(-width * 0.28, 2.4, depth * 0.5 + 1.8);
    restaurant.add(umbrellaPole, umbrellaCanopy);

    // Distinctive Restaurant Marquee Signboard (لوحة مطعم عصرية مضيئة)
    const signBoardGeo = new THREE.BoxGeometry(width * 0.65, 1.1, 0.35);
    const signBoard = new THREE.Mesh(signBoardGeo, this.modernWhiteMat);
    signBoard.position.set(-width * 0.12, 5.4, depth * 0.52);

    // Glowing Neon Restaurant Sign Text Plate
    const signGlowGeo = new THREE.BoxGeometry(width * 0.58, 0.55, 0.4);
    const signGlowMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b }); // Golden Amber Neon
    const signGlow = new THREE.Mesh(signGlowGeo, signGlowMat);
    signGlow.position.set(-width * 0.12, 5.4, depth * 0.54);
    restaurant.add(signBoard, signGlow);

    // Striped Bistro Awning over Entrance
    const awningGeo = new THREE.BoxGeometry(4.2, 0.12, 1.6);
    const awningMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5 });
    const awning = new THREE.Mesh(awningGeo, awningMat);
    awning.position.set(width * 0.32, 3.4, depth * 0.5 + 0.7);
    awning.rotation.x = 0.25;
    restaurant.add(awning);

    return restaurant;
  }

  // 4. Distinctive Modern Boutique / Retail Shop with Pure White Facade & Glass Showcase
  private createModernShop(): THREE.Group {
    const shop = new THREE.Group();
    const width = 12.5;
    const height = 8.5;
    const depth = 10.5;

    // Main Architectural Structure: Pure Crisp Architectural White
    const mainGeo = new THREE.BoxGeometry(width, height, depth);
    const mainMesh = new THREE.Mesh(mainGeo, this.modernWhiteMat);
    mainMesh.position.y = height / 2;
    mainMesh.castShadow = true;
    mainMesh.receiveShadow = true;
    shop.add(mainMesh);

    // Architectural Sloped Crown Moulding
    const crownMouldGeo = new THREE.BoxGeometry(width * 1.04, 0.6, depth * 1.04);
    const crownMould = new THREE.Mesh(crownMouldGeo, this.modernWhiteMat);
    crownMould.position.y = height + 0.3;
    shop.add(crownMould);

    // Expansive Illuminated Showcase Display Storefront
    const displayWindowGeo = new THREE.BoxGeometry(width * 0.72, 3.6, 0.4);
    const displayWindow = new THREE.Mesh(displayWindowGeo, this.windowGlowMat);
    displayWindow.position.set(-width * 0.08, 2.4, depth * 0.51);
    shop.add(displayWindow);

    // Interior Merchandise Display Pedestals inside showcase
    const pedestalMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.5 });
    const ped1 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 1.1, 10), pedestalMat);
    ped1.position.set(-width * 0.25, 1.1, depth * 0.5 + 0.1);
    const ped2 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 1.4, 10), pedestalMat);
    ped2.position.set(width * 0.1, 1.25, depth * 0.5 + 0.1);
    shop.add(ped1, ped2);

    // Distinctive Illuminated Store Marquee Blade
    const signBladeGeo = new THREE.BoxGeometry(width * 0.75, 1.0, 0.35);
    const signBlade = new THREE.Mesh(signBladeGeo, this.modernWhiteMat);
    signBlade.position.set(-width * 0.08, 4.8, depth * 0.53);

    // Glowing Electric-Cyan Neon Brand Banner
    const neonBrandGeo = new THREE.BoxGeometry(width * 0.68, 0.5, 0.4);
    const neonBrandMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 }); // Vibrant Electric Cyan
    const neonBrand = new THREE.Mesh(neonBrandGeo, neonBrandMat);
    neonBrand.position.set(-width * 0.08, 4.8, depth * 0.55);
    shop.add(signBlade, neonBrand);

    // Sleek Pure White Architectural Entrance Canopy Blade
    const canopyGeo = new THREE.BoxGeometry(3.6, 0.14, 1.8);
    const canopy = new THREE.Mesh(canopyGeo, this.modernWhiteMat);
    canopy.position.set(width * 0.34, 3.3, depth * 0.5 + 0.85);
    shop.add(canopy);

    // Upper Level Contemporary Glass Louvers
    for (let f = -3; f <= 3; f++) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.4, 0.5), this.glassTowerMat);
      fin.position.set(f * 1.5, 6.6, depth * 0.51);
      shop.add(fin);
    }

    return shop;
  }

  // Distribution: High-Rise Skyscrapers, Modern Luxury Villas, Distinctive Restaurants, Distinctive Shops
  private createDevelopedBuilding(biome: BiomeType): THREE.Group {
    const roll = Math.random();
    if (roll < 0.32) {
      // 32% Modern High-Rise Skyscrapers
      return this.createSkyscraper();
    } else if (roll < 0.58) {
      // 26% Modern Contemporary Luxury Villas
      return this.createModernVilla();
    } else if (roll < 0.80) {
      // 22% Distinctive Modern Restaurants & Cafes
      return this.createModernRestaurant();
    } else {
      // 20% Distinctive Modern Retail Shops & Boutiques
      return this.createModernShop();
    }
  }

  // ==================== CHUNK CONTENT SPAWNING ====================
  private populateChunkContent(startZ: number, biome: BiomeType, difficultyFactor: number = 1.0) {
    if (startZ < 60) return; // Keep starting meters clear for run startup

    const lanes: (-2.5 | 0 | 2.5)[] = [-2.5, 0, 2.5];

    // Authentic Baghdad Street Challenge Patterns
    const patterns = [
      // Pattern 1: Moving Tuk-Tuk + Generator Hanging Wires
      () => {
        const tuktukLane = lanes[Math.floor(Math.random() * lanes.length)];
        const otherLanes = lanes.filter((l) => l !== tuktukLane);
        this.obstacleManager.createObstacle('TUKTUK', tuktukLane, startZ + 16);
        this.obstacleManager.createObstacle('GENERATOR_WIRES', otherLanes[0], startZ + 22);
        this.obstacleManager.spawnCoinLine(otherLanes[1], startZ + 10, 6);
      },
      // Pattern 2: Baghdad Concrete Jersey Barrier + Tea Cart Jump
      () => {
        const sabbaLane = lanes[Math.floor(Math.random() * lanes.length)];
        const otherLanes = lanes.filter((l) => l !== sabbaLane);
        this.obstacleManager.createObstacle('CONCRETE_BARRIER', sabbaLane, startZ + 14);
        this.obstacleManager.createObstacle('TEA_CART', otherLanes[0], startZ + 20);
        this.obstacleManager.spawnCoinArc(otherLanes[0], startZ + 16, 5, 2.2);
      },
      // Pattern 3: Market Fruit Stand + Low Slide Beam + Coin arc
      () => {
        const fruitLane = lanes[Math.floor(Math.random() * lanes.length)];
        const otherLanes = lanes.filter((l) => l !== fruitLane);
        this.obstacleManager.createObstacle('FRUIT_STAND', fruitLane, startZ + 15);
        this.obstacleManager.createObstacle('BEAM_SLIDE', otherLanes[0], startZ + 18);
        this.obstacleManager.spawnCoinArc(fruitLane, startZ + 10, 5, 2.2);
      },
      // Pattern 4: Roadwork Gravel Mound + Concrete Barrier + Oncoming Taxi
      () => {
        const moundLane = lanes[Math.floor(Math.random() * lanes.length)];
        const otherLanes = lanes.filter((l) => l !== moundLane);
        this.obstacleManager.createObstacle('SAND_GRAVEL_MOUND', moundLane, startZ + 14);
        this.obstacleManager.createObstacle('TAXI', otherLanes[0], startZ + 22);
        this.obstacleManager.spawnCoinLine(otherLanes[1], startZ + 10, 6);
      },
      // Pattern 5: Generator Hanging Wires + Barrier Jump Combo (Quick Slide then Jump)
      () => {
        const activeLane = lanes[Math.floor(Math.random() * lanes.length)];
        this.obstacleManager.createObstacle('GENERATOR_WIRES', activeLane, startZ + 12);
        this.obstacleManager.createObstacle('BARRIER_JUMP', activeLane, startZ + 24);
        this.obstacleManager.spawnCoinLine(activeLane, startZ + 30, 4);
      },
      // Pattern 6: Double Oncoming Vehicles (Tuk-Tuk & Taxi - high dodge precision)
      () => {
        const freeLane = lanes[Math.floor(Math.random() * lanes.length)];
        const blockedLanes = lanes.filter((l) => l !== freeLane);
        this.obstacleManager.createObstacle('TUKTUK', blockedLanes[0], startZ + 15);
        this.obstacleManager.createObstacle('TAXI', blockedLanes[1], startZ + 24);
        this.obstacleManager.spawnCoinLine(freeLane, startZ + 12, 6);
      },
      // Pattern 7: Big Baghdad Bus + Pothole + Moving Taxi
      () => {
        const busLane = lanes[Math.floor(Math.random() * lanes.length)];
        const otherLanes = lanes.filter((l) => l !== busLane);
        this.obstacleManager.createObstacle('BUS', busLane, startZ + 15);
        this.obstacleManager.createObstacle('POTHOLE', otherLanes[0], startZ + 22);
        this.obstacleManager.spawnCoinArc(otherLanes[0], startZ + 18, 5, 2.2);
      },
      // Pattern 8: Power-up spawn with protective coin escort
      () => {
        const powerTypes: PowerUpType[] = ['MAGNET', 'SHIELD', 'MULTIPLIER', 'TURBO_SPEED', 'SUPER_JUMP', 'TIME_SLOW'];
        const chosenPower = powerTypes[Math.floor(Math.random() * powerTypes.length)];
        const powerLane = lanes[Math.floor(Math.random() * lanes.length)];
        this.obstacleManager.createPowerUp(chosenPower, powerLane, startZ + 20);
        this.obstacleManager.spawnCoinLine(powerLane, startZ + 10, 5);
      },
    ];

    // Pick 1 balanced challenge pattern per chunk
    const p1 = patterns[Math.floor(Math.random() * patterns.length)];
    p1();

    // Dynamic secondary challenge scaling as distance and difficulty increase
    const secondaryChance = Math.min(0.25 + (difficultyFactor - 1.0) * 0.35, 0.85);
    if (startZ > 200 && Math.random() < secondaryChance) {
      const p2 = patterns[Math.floor(Math.random() * patterns.length)];
      p2();
    }

    // High distance extra lane-block challenge for elite runners (past 1200m)
    if (startZ > 1200 && difficultyFactor > 1.6 && Math.random() < 0.45) {
      const extraObsTypes: ObstacleType[] = ['CONCRETE_BARRIER', 'BARRIER_JUMP', 'GENERATOR_WIRES', 'POTHOLE', 'TEA_CART'];
      const chosenObs = extraObsTypes[Math.floor(Math.random() * extraObsTypes.length)];
      const chosenLane = lanes[Math.floor(Math.random() * lanes.length)];
      this.obstacleManager.createObstacle(chosenObs, chosenLane, startZ + 36);
    }
  }

  // ==================== UPDATE & TRACK RECYCLING ====================
  public update(playerZ: number, delta: number, difficultyFactor: number = 1.0) {
    // 1. Maintain visible forward chunks
    while (this.nextChunkZ < playerZ + this.visibleChunks * this.chunkLength) {
      this.createChunk(this.nextChunkZ, this.currentBiome, difficultyFactor);
      this.nextChunkZ += this.chunkLength;
    }

    // 2. Recycle old chunks behind player and release GPU buffers to prevent overheating
    for (let i = this.chunks.length - 1; i >= 0; i--) {
      const chunk = this.chunks[i];
      if (chunk.startZ + chunk.length < playerZ - 35) {
        this.scene.remove(chunk.group);
        chunk.group.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) {
            const mesh = obj as THREE.Mesh;
            // Only dispose geometries not shared on class instance
            if (
              mesh.geometry &&
              mesh.geometry !== this.roadGeo &&
              mesh.geometry !== this.puddleGeo
            ) {
              mesh.geometry.dispose();
            }
          }
        });
        this.chunks.splice(i, 1);
      }
    }

    // 3. Move directional light to follow player for consistent shadow volume
    const targetSunPos = this.targetWeatherProfile.sunPos;
    this.dirLight.position.set(targetSunPos.x, targetSunPos.y, playerZ + targetSunPos.z);
    this.dirLight.target.position.set(0, 0, playerZ);
    this.dirLight.target.updateMatrixWorld();

    // 4. Smooth Gradual Weather & Lighting Interpolation (Lerp)
    const lerpSpeed = Math.min(delta * 1.8, 1.0);

    // Sky & Fog
    this.currentSkyColor.lerp(this.targetWeatherProfile.skyColor, lerpSpeed);
    this.scene.background = this.currentSkyColor;

    this.currentFogColor.lerp(this.targetWeatherProfile.fogColor, lerpSpeed);
    if (this.scene.fog && this.scene.fog instanceof THREE.Fog) {
      this.scene.fog.color.copy(this.currentFogColor);
      this.scene.fog.near += (this.targetWeatherProfile.fogNear - this.scene.fog.near) * lerpSpeed;
      this.scene.fog.far += (this.targetWeatherProfile.fogFar - this.scene.fog.far) * lerpSpeed;
    }

    // Directional Sun Light
    this.currentSunColor.lerp(this.targetWeatherProfile.sunColor, lerpSpeed);
    this.dirLight.color.copy(this.currentSunColor);
    this.dirLight.intensity += (this.targetWeatherProfile.sunIntensity - this.dirLight.intensity) * lerpSpeed;

    // Hemisphere Light
    this.currentHemiSkyColor.lerp(this.targetWeatherProfile.hemiSkyColor, lerpSpeed);
    this.currentHemiGroundColor.lerp(this.targetWeatherProfile.hemiGroundColor, lerpSpeed);
    this.hemiLight.color.copy(this.currentHemiSkyColor);
    this.hemiLight.groundColor.copy(this.currentHemiGroundColor);
    this.hemiLight.intensity += (this.targetWeatherProfile.hemiIntensity - this.hemiLight.intensity) * lerpSpeed;

    // Ambient Light
    this.currentAmbientColor.lerp(this.targetWeatherProfile.ambientColor, lerpSpeed);
    this.ambientLight.color.copy(this.currentAmbientColor);
    this.ambientLight.intensity += (this.targetWeatherProfile.ambientIntensity - this.ambientLight.intensity) * lerpSpeed;

    // Road Surface Wetness / Reflections Transition
    this.roadMat.roughness += (this.targetWeatherProfile.roadRoughness - this.roadMat.roughness) * lerpSpeed;
    this.roadMat.metalness += (this.targetWeatherProfile.roadMetalness - this.roadMat.metalness) * lerpSpeed;

    // Wet Puddles Specular Gloss & Reflection Color Modulation
    const isWet = this.targetWeatherProfile.rainIntensity > 0 || this.currentWeather === 'KARRADA_NIGHT';
    const targetPuddleOpacity = isWet ? 0.95 : 0.65;
    const targetPuddleRoughness = isWet ? 0.02 : 0.12;
    this.puddleMat.opacity += (targetPuddleOpacity - this.puddleMat.opacity) * lerpSpeed;
    this.puddleMat.roughness += (targetPuddleRoughness - this.puddleMat.roughness) * lerpSpeed;
    this.puddleMat.color.lerp(this.targetWeatherProfile.skyColor, lerpSpeed * 0.5);

    // Street Light Glow pools brightness (richer at dusk/night)
    const isNightOrSunset = this.currentWeather === 'KARRADA_NIGHT' || this.currentWeather === 'GOLDEN_SUNSET';
    const targetGlowOpacity = isNightOrSunset ? 0.35 : 0.12;
    this.streetGlowMat.opacity += (targetGlowOpacity - this.streetGlowMat.opacity) * lerpSpeed;

    // 5. Update Dynamic Rain System
    const targetRainOpacity = this.targetWeatherProfile.rainIntensity > 0 ? 0.75 : 0;
    this.currentRainOpacity += (targetRainOpacity - this.currentRainOpacity) * Math.min(delta * 2.5, 1.0);

    if (this.rainMat) {
      this.rainMat.opacity = this.currentRainOpacity;
      if (this.rainParticles) {
        this.rainParticles.visible = this.currentRainOpacity > 0.02;
      }
    }

    if (this.rainParticles && this.rainParticles.visible && this.rainPositions && this.rainVelocities) {
      this.rainParticles.position.z = playerZ;
      const count = this.rainPositions.length / 3;

      for (let i = 0; i < count; i++) {
        const fallSpeed = this.rainVelocities[i];
        this.rainPositions[i * 3 + 1] -= delta * fallSpeed; // Fall down
        this.rainPositions[i * 3 + 2] -= delta * 12; // Stream backward due to runner velocity

        if (this.rainPositions[i * 3 + 1] < 0.1) {
          this.rainPositions[i * 3 + 1] = 40 + Math.random() * 5;
          this.rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 100;
        }
      }
      this.rainParticles.geometry.attributes.position.needsUpdate = true;
    }

    // 6. Ground Splash Update
    if (this.splashParticles && this.targetWeatherProfile.rainIntensity > 0.3) {
      this.splashParticles.visible = true;
      this.splashParticles.position.z = playerZ;
      (this.splashParticles.material as THREE.PointsMaterial).opacity = this.currentRainOpacity * 0.6;
    } else if (this.splashParticles) {
      this.splashParticles.visible = false;
    }

    // 7. Dynamic Dust & Sandstorm System Update
    const isDusty = this.currentWeather === 'BAGHDAD_DUST_STORM';
    const isHazeSunset = this.currentWeather === 'GOLDEN_SUNSET';
    const targetDustOpacity = isDusty ? 0.75 : (isHazeSunset ? 0.28 : 0);
    this.currentDustOpacity += (targetDustOpacity - this.currentDustOpacity) * Math.min(delta * 2.0, 1.0);

    if (this.dustMat) {
      this.dustMat.opacity = this.currentDustOpacity;
      if (this.dustParticles) {
        this.dustParticles.visible = this.currentDustOpacity > 0.02;
      }
    }

    if (this.dustParticles && this.dustParticles.visible && this.dustPositions && this.dustVelocities) {
      this.dustParticles.position.z = playerZ;
      const count = this.dustPositions.length / 3;

      for (let i = 0; i < count; i++) {
        const lateralSpeed = this.dustVelocities[i * 2];
        let phase = this.dustVelocities[i * 2 + 1];
        phase += delta * 1.8;
        this.dustVelocities[i * 2 + 1] = phase;

        // Swirling sideways wind
        this.dustPositions[i * 3] += Math.sin(phase) * delta * lateralSpeed;
        // Rising and drifting vertical turbulence
        this.dustPositions[i * 3 + 1] += Math.cos(phase * 0.7) * delta * 1.2;
        // Streaming with runner velocity
        this.dustPositions[i * 3 + 2] -= delta * 10;

        // Wrap around boundary bounds
        if (this.dustPositions[i * 3 + 2] < -40) {
          this.dustPositions[i * 3 + 2] = 40 + Math.random() * 10;
        }
        if (this.dustPositions[i * 3 + 1] < 0.1 || this.dustPositions[i * 3 + 1] > 10) {
          this.dustPositions[i * 3 + 1] = 0.5 + Math.random() * 6;
        }
        if (Math.abs(this.dustPositions[i * 3]) > 25) {
          this.dustPositions[i * 3] = (Math.random() - 0.5) * 20;
        }
      }
      this.dustParticles.geometry.attributes.position.needsUpdate = true;
    }

    // 8. Dynamic Lightning for Storms
    if (this.currentWeather === 'BAGHDAD_STORM') {
      this.lightningTimer -= delta;
      if (this.lightningTimer <= 0) {
        this.triggerLightningFlash();
        this.lightningTimer = 4 + Math.random() * 8; // Every 4-12 seconds
      }

      if (this.isFlashing) {
        this.flashIntensity -= delta * 6;
        if (this.flashIntensity <= 0) {
          this.isFlashing = false;
          this.flashIntensity = 0;
        }
        this.dirLight.intensity = this.targetWeatherProfile.sunIntensity + this.flashIntensity * 3.5;
        this.ambientLight.intensity = this.targetWeatherProfile.ambientIntensity + this.flashIntensity * 2.0;
      }
    }
  }

  private triggerLightningFlash() {
    this.isFlashing = true;
    this.flashIntensity = 1.0;
    audioManager.playThunder();
  }

  public resetWorld(forcedBiome?: BiomeType) {
    this.chunks.forEach((c) => this.scene.remove(c.group));
    this.chunks = [];
    this.nextChunkZ = 0;
    this.obstacleManager.clearAll();
    const startingBiome = forcedBiome || getRandomBiome();
    this.setBiome(startingBiome);
  }
}
