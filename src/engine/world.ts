/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { BiomeType, PowerUpType, WeatherType } from '../types';
import { ObstacleManager } from './obstacles';
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
  'EGYPT_CAIRO',
  'UAE_DUBAI',
  'SAUDI_RIYADH',
  'MOROCCO_MARRAKESH',
  'QATAR_DOHA',
  'JORDAN_AMMAN',
  'LEBANON_BEIRUT',
  'IRAQ_BAGHDAD',
  'KUWAIT_CITY',
  'OMAN_MUSCAT',
  'ALGERIA_ALGIERS',
  'TUNISIA_TUNIS',
  'JAPAN_TOKYO',
  'FRANCE_PARIS',
  'UK_LONDON',
  'USA_NEWYORK',
  'BRAZIL_RIO',
  'SPAIN_MADRID',
  'ITALY_ROME',
  'GERMANY_BERLIN',
];

export function getRandomBiome(): BiomeType {
  const index = Math.floor(Math.random() * ALL_BIOMES.length);
  return ALL_BIOMES[index];
}

export class WorldManager {
  public scene: THREE.Scene;
  public obstacleManager: ObstacleManager;

  public chunks: TrackChunk[] = [];
  public currentBiome: BiomeType = getRandomBiome();
  public currentWeather: WeatherType = 'SUNNY_MORNING';
  public chunkLength: number = 50;
  public visibleChunks: number = 8; // ~400 meters view distance
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

  // Rain & Splash Particle System
  private rainParticles: THREE.Points | null = null;
  private rainPositions: Float32Array | null = null;
  private rainVelocities: Float32Array | null = null;
  private rainCount: number = 300;
  private rainMat: THREE.PointsMaterial | null = null;
  private currentRainOpacity: number = 0;

  // Ground Splash Particles
  private splashParticles: THREE.Points | null = null;
  private splashPositions: Float32Array | null = null;
  private splashCount: number = 40;

  // Dust & Sandstorm Particle System (Baghdad Dust Storm & Golden Sunset Haze)
  private dustParticles: THREE.Points | null = null;
  private dustPositions: Float32Array | null = null;
  private dustVelocities: Float32Array | null = null;
  private dustCount: number = 220;
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

    // Street Light Ground Glow Pools
    this.streetGlowMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.18,
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
    
    // Match each Country Biome with appropriate atmospheric weather
    switch (biome) {
      case 'EGYPT_CAIRO':
        this.setWeather('GOLDEN_SUNSET');
        break;
      case 'UAE_DUBAI':
        this.setWeather('KARRADA_NIGHT');
        break;
      case 'SAUDI_RIYADH':
        this.setWeather('NOON_BRIGHT');
        break;
      case 'MOROCCO_MARRAKESH':
        this.setWeather('GOLDEN_SUNSET');
        break;
      case 'QATAR_DOHA':
        this.setWeather('SUNNY_MORNING');
        break;
      case 'JORDAN_AMMAN':
        this.setWeather('SUNNY_MORNING');
        break;
      case 'LEBANON_BEIRUT':
        this.setWeather('LIGHT_RAIN_MIST');
        break;
      case 'IRAQ_BAGHDAD':
        this.setWeather('SUNNY_MORNING');
        break;
      case 'KUWAIT_CITY':
        this.setWeather('NOON_BRIGHT');
        break;
      case 'OMAN_MUSCAT':
        this.setWeather('GOLDEN_SUNSET');
        break;
      case 'ALGERIA_ALGIERS':
        this.setWeather('SUNNY_MORNING');
        break;
      case 'TUNISIA_TUNIS':
        this.setWeather('LIGHT_RAIN_MIST');
        break;
      case 'JAPAN_TOKYO':
        this.setWeather('KARRADA_NIGHT');
        break;
      case 'FRANCE_PARIS':
        this.setWeather('LIGHT_RAIN_MIST');
        break;
      case 'UK_LONDON':
        this.setWeather('BAGHDAD_STORM');
        break;
      case 'USA_NEWYORK':
        this.setWeather('KARRADA_NIGHT');
        break;
      case 'BRAZIL_RIO':
        this.setWeather('SUNNY_MORNING');
        break;
      case 'SPAIN_MADRID':
        this.setWeather('GOLDEN_SUNSET');
        break;
      case 'ITALY_ROME':
        this.setWeather('SUNNY_MORNING');
        break;
      case 'GERMANY_BERLIN':
        this.setWeather('LIGHT_RAIN_MIST');
        break;
      default:
        this.setWeather('SUNNY_MORNING');
        break;
    }
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

    // 4. Palm Trees along sidewalks (Spaced cleanly for high frame rates)
    const palmInterval = 30;
    for (let z = -this.chunkLength / 2 + 10; z < this.chunkLength / 2; z += palmInterval) {
      const palmL = this.createPalmTree();
      palmL.position.set(-6.5, 0.25, z);
      const palmR = this.createPalmTree();
      palmR.position.set(6.5, 0.25, z + 6);
      group.add(palmL, palmR);
    }

    // 5. Procedural Baghdad Architectural Buildings (Spaced elegantly)
    const buildingCount = 2;
    const bldgSpacing = this.chunkLength / buildingCount;
    for (let i = 0; i < buildingCount; i++) {
      const z = -this.chunkLength / 2 + (i + 0.5) * bldgSpacing;
      // Left side building
      const bldgL = this.createBaghdadBuilding(biome);
      bldgL.position.set(-13 - Math.random() * 2, 0, z);
      // Right side building
      const bldgR = this.createBaghdadBuilding(biome);
      bldgR.position.set(13 + Math.random() * 2, 0, z);
      group.add(bldgL, bldgR);
    }

    // 6. Street Lamps with glowing light cones & ground reflection pools
    const lampL = this.createStreetLamp();
    lampL.position.set(-5.2, 0.25, 0);
    const lampR = this.createStreetLamp();
    lampR.position.set(5.2, 0.25, 0);
    lampR.rotation.y = Math.PI;
    group.add(lampL, lampR);

    // Warm street light reflection glow pools on the ground
    const glowPoolL = new THREE.Mesh(new THREE.PlaneGeometry(5.0, 5.0), this.streetGlowMat);
    glowPoolL.rotateX(-Math.PI / 2);
    glowPoolL.position.set(-3.5, 0.015, 0);
    const glowPoolR = new THREE.Mesh(new THREE.PlaneGeometry(5.0, 5.0), this.streetGlowMat);
    glowPoolR.rotateX(-Math.PI / 2);
    glowPoolR.position.set(3.5, 0.015, 0);
    group.add(glowPoolL, glowPoolR);

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
    const poleGeo = new THREE.CylinderGeometry(0.06, 0.08, 5.5, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 2.75;
    pole.castShadow = true;

    const armGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.2, 8);
    const arm = new THREE.Mesh(armGeo, poleMat);
    arm.position.set(0.5, 5.4, 0);
    arm.rotation.z = -Math.PI / 3;

    const headGeo = new THREE.BoxGeometry(0.3, 0.1, 0.2);
    const headMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0.9, 5.2, 0);

    lamp.add(pole, arm, head);
    return lamp;
  }

  private createBaghdadBuilding(biome: BiomeType): THREE.Group {
    const bldg = new THREE.Group();
    const width = 6 + Math.random() * 4;
    const depth = 8 + Math.random() * 4;
    const height = 10 + Math.random() * 20;

    const mat = this.buildingMaterials[Math.floor(Math.random() * this.buildingMaterials.length)];
    const geo = new THREE.BoxGeometry(width, height, depth);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = height / 2;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    bldg.add(mesh);

    // Traditional Shanashil / Baghdad Balcony Accents
    if (Math.random() > 0.4) {
      const shanashilGeo = new THREE.BoxGeometry(width * 0.7, 2.5, 1.2);
      const shanashilMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
      const shanashil = new THREE.Mesh(shanashilGeo, shanashilMat);
      shanashil.position.set(width * 0.45, height * 0.45, 0);
      bldg.add(shanashil);
    }

    return bldg;
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

    // Occasional gentle secondary challenge in advanced runs with generous spacing
    if (startZ > 500 && Math.random() < 0.35) {
      const p2 = patterns[Math.floor(Math.random() * patterns.length)];
      p2();
    }
  }

  // ==================== UPDATE & TRACK RECYCLING ====================
  public update(playerZ: number, delta: number, difficultyFactor: number = 1.0) {
    // 1. Maintain visible forward chunks
    while (this.nextChunkZ < playerZ + this.visibleChunks * this.chunkLength) {
      this.createChunk(this.nextChunkZ, this.currentBiome, difficultyFactor);
      this.nextChunkZ += this.chunkLength;
    }

    // 2. Recycle old chunks behind player
    for (let i = this.chunks.length - 1; i >= 0; i--) {
      const chunk = this.chunks[i];
      if (chunk.startZ + chunk.length < playerZ - 35) {
        this.scene.remove(chunk.group);
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
