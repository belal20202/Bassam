/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BiomeType } from '../types';

interface BiomeMusicalTheme {
  name: string;
  maqamName: string;
  tempoBPM: number;
  melodyScale: number[];
  bassScale: number[];
  rhythmStyle: 'CHOBI' | 'SAMAI' | 'BALADI' | 'SYNTHWAVE' | 'HERITAGE';
  leadInstrument: 'OUD' | 'NAY' | 'SYNTH' | 'QANUN' | 'BRASS';
  melodyDensity: number; // 1 to 4
}

export class AudioManager {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private isMusicPlaying: boolean = false;
  private musicInterval: any = null;
  private beatStep: number = 0;
  
  // Dynamic Biome Environmental Ambient Audio System
  private isAmbientPlaying: boolean = false;
  private ambientBedSource: AudioBufferSourceNode | null = null;
  private ambientBedFilter: BiquadFilterNode | null = null;
  private ambientBedGain: GainNode | null = null;
  private ambientSpotTimer: any = null;
  
  public musicVolume: number = 0.7;
  public sfxVolume: number = 0.85;

  private currentBiome: BiomeType = 'KARKH_MANSOUR';
  private targetSpeedMultiplier: number = 1.0;

  // Biome-specific Baghdad regional themes and authentic Maqamat
  private biomeThemes: Record<BiomeType, BiomeMusicalTheme> = {
    // 1. حي المنصور - إيقاع الجوبي البغدادي الحديث والحيوي
    KARKH_MANSOUR: {
      name: 'حي المنصور',
      maqamName: 'مقام البيات البغدادي الإيقاعي',
      tempoBPM: 126,
      melodyScale: [293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25, 587.33, 659.25],
      bassScale: [73.42, 82.41, 98.00, 110.00, 123.47],
      rhythmStyle: 'CHOBI',
      leadInstrument: 'SYNTH',
      melodyDensity: 2,
    },
    // 2. شارع المتنبي والقشلة - مقام الراست العريق مع العود والقانون
    RUSAFA_MUTANABBI_QISHLA: {
      name: 'شارع المتنبي والقشلة',
      maqamName: 'مقام الراست البغدادي الأصيل',
      tempoBPM: 118,
      melodyScale: [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25, 587.33],
      bassScale: [65.41, 73.42, 87.31, 98.00, 110.00],
      rhythmStyle: 'SAMAI',
      leadInstrument: 'OUD',
      melodyDensity: 1,
    },
    // 3. الكاظمية التراثية - مقام الحجاز الروحاني مع طبل الدهلة والرنين
    KARKH_KADHIMIYA: {
      name: 'الكاظمية التراثية',
      maqamName: 'مقام الحجاز الروحاني التراثي',
      tempoBPM: 116,
      melodyScale: [293.66, 311.13, 369.99, 392.00, 440.00, 466.16, 523.25, 587.33, 622.25],
      bassScale: [73.42, 77.78, 92.50, 98.00, 110.00],
      rhythmStyle: 'HERITAGE',
      leadInstrument: 'NAY',
      melodyDensity: 2,
    },
    // 4. شارع الرشيد وساحة التحرير - إيقاع وطني ملحمي ونحاسيات
    RUSAFA_RASHEED_TAHRIR: {
      name: 'شارع الرشيد والتحرير',
      maqamName: 'مقام العجم الملحمي الحماسي',
      tempoBPM: 128,
      melodyScale: [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25, 659.25],
      bassScale: [65.41, 73.42, 87.31, 98.00, 130.81],
      rhythmStyle: 'BALADI',
      leadInstrument: 'BRASS',
      melodyDensity: 2,
    },
    // 5. جسر الجادرية ونهر دجلة - أنغام العود العذبة مع نسيم دجلة
    KARKH_JADRIYA_BRIDGE: {
      name: 'جسر الجادرية ودجلة',
      maqamName: 'مقام النهاوند العذب',
      tempoBPM: 120,
      melodyScale: [261.63, 293.66, 311.13, 349.23, 392.00, 415.30, 493.88, 523.25, 622.25],
      bassScale: [65.41, 73.42, 77.78, 87.31, 98.00],
      rhythmStyle: 'SAMAI',
      leadInstrument: 'OUD',
      melodyDensity: 2,
    },
    // 6. الكرادة وليالي النيون - سينثويف بغدادي ليلي متوهج
    RUSAFA_KARRADA_NIGHT: {
      name: 'الكرادة وليالي النيون',
      maqamName: 'سينث الكرادة الليلي المتوهج',
      tempoBPM: 130,
      melodyScale: [329.63, 392.00, 440.00, 493.88, 587.33, 659.25, 783.99, 880.00],
      bassScale: [82.41, 98.00, 110.00, 123.47, 146.83],
      rhythmStyle: 'SYNTHWAVE',
      leadInstrument: 'SYNTH',
      melodyDensity: 3,
    },
    // 7. الأعظمية وكورنيش أبي نواس - تراث دجلة وشعر أبي نواس
    RUSAFA_ADHAMIYA_RIVER: {
      name: 'الأعظمية وأبي نواس',
      maqamName: 'مقام السيكاه البغدادي الشجي',
      tempoBPM: 122,
      melodyScale: [277.18, 311.13, 349.23, 392.00, 415.30, 466.16, 554.37, 622.25],
      bassScale: [69.30, 77.78, 87.31, 98.00, 103.83],
      rhythmStyle: 'HERITAGE',
      leadInstrument: 'QANUN',
      melodyDensity: 2,
    },
    // 8. اليرموك والدورة - نبض الشوارع السريعة والحداثة
    KARKH_YARMOUK_DORA: {
      name: 'اليرموك والدورة',
      maqamName: 'مقام الكرد الديناميكي السريع',
      tempoBPM: 128,
      melodyScale: [293.66, 311.13, 349.23, 392.00, 440.00, 466.16, 523.25, 587.33, 622.25],
      bassScale: [73.42, 77.78, 87.31, 98.00, 110.00],
      rhythmStyle: 'CHOBI',
      leadInstrument: 'SYNTH',
      melodyDensity: 2,
    },
    // 9. شارع فلسطين وزيونة - احتفالية الدبكة والجوبي البغدادي
    RUSAFA_PALESTINE_ZAYOUNA: {
      name: 'شارع فلسطين وزيونة',
      maqamName: 'جوبي بغداد الاحتفالي الصاخب',
      tempoBPM: 132,
      melodyScale: [293.66, 329.63, 369.99, 392.00, 440.00, 493.88, 554.37, 587.33],
      bassScale: [73.42, 82.41, 92.50, 98.00, 110.00],
      rhythmStyle: 'CHOBI',
      leadInstrument: 'BRASS',
      melodyDensity: 3,
    },
    // 10. العامرية وحي الخضراء
    KARKH_AMIRIYAH_KHADRAA: {
      name: 'العامرية وحي الخضراء',
      maqamName: 'مقام الحجاز كار المبهج',
      tempoBPM: 125,
      melodyScale: [261.63, 277.18, 329.63, 349.23, 392.00, 415.30, 493.88, 523.25],
      bassScale: [65.41, 69.30, 82.41, 87.31, 98.00],
      rhythmStyle: 'BALADI',
      leadInstrument: 'SYNTH',
      melodyDensity: 2,
    },
    // 11. السيدية والبياع
    KARKH_SAYDIYA_BAYAA: {
      name: 'السيدية والبياع',
      maqamName: 'إيقاع الأسواق البغدادية النابضة',
      tempoBPM: 126,
      melodyScale: [293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25, 587.33],
      bassScale: [73.42, 82.41, 87.31, 98.00, 110.00],
      rhythmStyle: 'CHOBI',
      leadInstrument: 'OUD',
      melodyDensity: 2,
    },
    // 12. الغزالية والشعلة
    KARKH_GHAZALIYA_SHUULA: {
      name: 'الغزالية والشعلة',
      maqamName: 'مقام الصبا الشجي التراثي',
      tempoBPM: 124,
      melodyScale: [293.66, 311.13, 349.23, 369.99, 440.00, 466.16, 523.25, 587.33],
      bassScale: [73.42, 77.78, 87.31, 92.50, 110.00],
      rhythmStyle: 'HERITAGE',
      leadInstrument: 'NAY',
      melodyDensity: 2,
    },
    // 13. حي الجامعة وشارع الربيع
    KARKH_HAI_ALJAMIA: {
      name: 'حي الجامعة والربيع',
      maqamName: 'مقام اللامي البغدادي الفريد',
      tempoBPM: 127,
      melodyScale: [293.66, 311.13, 349.23, 392.00, 415.30, 466.16, 523.25, 587.33],
      bassScale: [73.42, 77.78, 87.31, 98.00, 103.83],
      rhythmStyle: 'CHOBI',
      leadInstrument: 'SYNTH',
      melodyDensity: 2,
    },
    // 14. الصالحية وجسر السنك
    RUSAFA_SALIHIYA_SINAK: {
      name: 'الصالحية وجسر السنك',
      maqamName: 'مقام البنجكاه التراثي العريق',
      tempoBPM: 119,
      melodyScale: [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 466.16, 523.25],
      bassScale: [65.41, 73.42, 82.41, 87.31, 98.00],
      rhythmStyle: 'SAMAI',
      leadInstrument: 'QANUN',
      melodyDensity: 1,
    },
    // 15. الباب الشرقي وشارع السعدون
    RUSAFA_BAB_SHARQI_SAADOUN: {
      name: 'الباب الشرقي والسعدون',
      maqamName: 'مقام الدشت المبهج',
      tempoBPM: 125,
      melodyScale: [293.66, 329.63, 369.99, 392.00, 440.00, 493.88, 523.25, 587.33],
      bassScale: [73.42, 82.41, 92.50, 98.00, 110.00],
      rhythmStyle: 'BALADI',
      leadInstrument: 'BRASS',
      melodyDensity: 2,
    },
    // 16. الزعفرانية وضفاف نهر ديالى
    RUSAFA_ZAAFARANIYA_DIYALA: {
      name: 'الزعفرانية ونهر ديالى',
      maqamName: 'مقام الحكيمي الريفي الأصيل',
      tempoBPM: 120,
      melodyScale: [261.63, 293.66, 329.63, 369.99, 392.00, 440.00, 493.88, 523.25],
      bassScale: [65.41, 73.42, 82.41, 92.50, 98.00],
      rhythmStyle: 'HERITAGE',
      leadInstrument: 'NAY',
      melodyDensity: 1,
    },
  };

  constructor() {
    // Lazy init audio context on first gesture
  }

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.musicGain = this.ctx.createGain();
        this.sfxGain = this.ctx.createGain();
        this.ambientGain = this.ctx.createGain();

        this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
        this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
        this.ambientGain.gain.setValueAtTime(this.sfxVolume * 0.55, this.ctx.currentTime);

        this.musicGain.connect(this.masterGain);
        this.sfxGain.connect(this.masterGain);
        this.ambientGain.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolumes(music: number, sfx: number) {
    this.musicVolume = music;
    this.sfxVolume = sfx;
    if (this.ctx && this.musicGain && this.sfxGain && this.ambientGain) {
      this.musicGain.gain.setValueAtTime(music, this.ctx.currentTime);
      this.sfxGain.gain.setValueAtTime(sfx, this.ctx.currentTime);
      this.ambientGain.gain.setValueAtTime(sfx * 0.55, this.ctx.currentTime);
    }
  }

  // Set active biome and transition soundtrack style & ambient atmosphere dynamically
  public setBiome(biome: BiomeType) {
    if (this.currentBiome !== biome) {
      this.currentBiome = biome;
      if (this.isMusicPlaying) {
        // Smoothly restart loop on next bar with new tempo & scale
        this.restartMusicWithCurrentSettings();
      }
      if (this.isAmbientPlaying) {
        this.updateAmbientForBiome(biome);
      }
    }
  }

  // ==================== DYNAMIC BIOME AMBIENT AUDIO SYSTEM ====================
  public startAmbient() {
    this.initContext();
    if (this.isAmbientPlaying || !this.ctx || !this.ambientGain) return;
    this.isAmbientPlaying = true;

    // 1. Continuous Environmental Pink/Brown Noise Bed (Filtered dynamically by location)
    this.startAmbientBed();

    // 2. Schedule Regional Spot Sounds (Horns in Mansour, Tea Clinking in Rasheed/Mutanabbi, etc.)
    this.scheduleNextAmbientSpotSound();
  }

  public stopAmbient() {
    this.isAmbientPlaying = false;
    if (this.ambientSpotTimer) {
      clearTimeout(this.ambientSpotTimer);
      this.ambientSpotTimer = null;
    }
    if (this.ambientBedSource) {
      try {
        this.ambientBedSource.stop();
        this.ambientBedSource.disconnect();
      } catch (_) {}
      this.ambientBedSource = null;
    }
    this.ambientBedFilter = null;
    this.ambientBedGain = null;
  }

  public pauseAmbient() {
    if (this.ctx && this.ambientGain) {
      this.ambientGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
    }
  }

  public resumeAmbient() {
    if (this.ctx && this.ambientGain) {
      this.ambientGain.gain.setTargetAtTime(this.sfxVolume * 0.55, this.ctx.currentTime, 0.2);
    }
  }

  private startAmbientBed() {
    if (!this.ctx || !this.ambientGain) return;

    // Create a 5-second seamless looped pink/brown noise buffer for natural ambient flow
    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate * 5;
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Brown/Pink integrated noise curve
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 3.5;
    }

    this.ambientBedSource = this.ctx.createBufferSource();
    this.ambientBedSource.buffer = buffer;
    this.ambientBedSource.loop = true;

    this.ambientBedFilter = this.ctx.createBiquadFilter();
    this.ambientBedFilter.type = 'lowpass';
    this.ambientBedFilter.frequency.setValueAtTime(320, this.ctx.currentTime);

    this.ambientBedGain = this.ctx.createGain();
    this.ambientBedGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

    this.ambientBedSource.connect(this.ambientBedFilter);
    this.ambientBedFilter.connect(this.ambientBedGain);
    this.ambientBedGain.connect(this.ambientGain);

    this.ambientBedSource.start(0);

    // Apply immediate settings for current location
    this.updateAmbientForBiome(this.currentBiome);
  }

  private updateAmbientForBiome(biome: BiomeType) {
    if (!this.ctx || !this.ambientBedFilter || !this.ambientBedGain) return;
    const t = this.ctx.currentTime;

    // Adapt continuous atmospheric filtering to location character
    switch (biome) {
      case 'KARKH_MANSOUR':
      case 'KARKH_YARMOUK_DORA':
      case 'KARKH_AMIRIYAH_KHADRAA':
      case 'KARKH_HAI_ALJAMIA':
        // Urban Highway & Wide Avenues: Deeper rumble & mid air displacement
        this.ambientBedFilter.frequency.setTargetAtTime(420, t, 0.6);
        this.ambientBedGain.gain.setTargetAtTime(0.24, t, 0.6);
        break;

      case 'RUSAFA_MUTANABBI_QISHLA':
      case 'RUSAFA_RASHEED_TAHRIR':
      case 'RUSAFA_BAB_SHARQI_SAADOUN':
      case 'RUSAFA_SALIHIYA_SINAK':
        // Heritage Old Baghdad: Warm acoustic souq resonance
        this.ambientBedFilter.frequency.setTargetAtTime(580, t, 0.6);
        this.ambientBedGain.gain.setTargetAtTime(0.22, t, 0.6);
        break;

      case 'KARKH_JADRIYA_BRIDGE':
      case 'KARKH_KADHIMIYA':
      case 'RUSAFA_ADHAMIYA_RIVER':
      case 'RUSAFA_ZAAFARANIYA_DIYALA':
        // Tigris Riverbank & Breezes: Soft open river whisper
        this.ambientBedFilter.frequency.setTargetAtTime(280, t, 0.6);
        this.ambientBedGain.gain.setTargetAtTime(0.19, t, 0.6);
        break;

      case 'RUSAFA_KARRADA_NIGHT':
      case 'RUSAFA_PALESTINE_ZAYOUNA':
        // Electric Night & Bustling Commercial Districts: Bright vibrant hum
        this.ambientBedFilter.frequency.setTargetAtTime(500, t, 0.6);
        this.ambientBedGain.gain.setTargetAtTime(0.25, t, 0.6);
        break;

      case 'KARKH_SAYDIYA_BAYAA':
      case 'KARKH_GHAZALIYA_SHUULA':
      default:
        // Vibrant Local Bazaars
        this.ambientBedFilter.frequency.setTargetAtTime(450, t, 0.6);
        this.ambientBedGain.gain.setTargetAtTime(0.23, t, 0.6);
        break;
    }
  }

  private scheduleNextAmbientSpotSound() {
    if (!this.isAmbientPlaying) return;

    // Trigger spot sound every 2.8 to 5.2 seconds for lively Baghdad atmosphere
    const delay = 2800 + Math.random() * 2400;
    this.ambientSpotTimer = setTimeout(() => {
      if (this.isAmbientPlaying) {
        this.triggerBiomeSpotSound(this.currentBiome);
        this.scheduleNextAmbientSpotSound();
      }
    }, delay);
  }

  private triggerBiomeSpotSound(biome: BiomeType) {
    if (!this.ctx || !this.ambientGain) return;
    const t = this.ctx.currentTime;

    switch (biome) {
      // 1. MANSOUR & MODERN DISTRICTS: Baghdad Taxi Horns & Road Pass-by
      case 'KARKH_MANSOUR':
      case 'KARKH_YARMOUK_DORA':
      case 'KARKH_AMIRIYAH_KHADRAA':
      case 'KARKH_HAI_ALJAMIA': {
        const rand = Math.random();
        if (rand < 0.65) {
          this.playBaghdadTaxiHorn(t);
        } else {
          this.playDistantEngineRev(t);
        }
        break;
      }

      // 2. HERITAGE SOUQS (Mutanabbi, Rasheed, Bab Sharqi): Tea Spoon Clink & Copper Hammering
      case 'RUSAFA_MUTANABBI_QISHLA':
      case 'RUSAFA_RASHEED_TAHRIR':
      case 'RUSAFA_BAB_SHARQI_SAADOUN':
      case 'RUSAFA_SALIHIYA_SINAK': {
        const rand = Math.random();
        if (rand < 0.55) {
          this.playBaghdadiTeaGlassClink(t);
        } else {
          this.playSafafirCopperClink(t);
        }
        break;
      }

      // 3. TIGRIS RIVER & BRIDGES (Jadriya, Adhamiya, Kadhimiya): Water Ripples & Pigeons Cooing
      case 'KARKH_JADRIYA_BRIDGE':
      case 'KARKH_KADHIMIYA':
      case 'RUSAFA_ADHAMIYA_RIVER':
      case 'RUSAFA_ZAAFARANIYA_DIYALA': {
        const rand = Math.random();
        if (rand < 0.55) {
          this.playTigrisPigeonsCooing(t);
        } else {
          this.playRiverBreezeLap(t);
        }
        break;
      }

      // 4. NIGHT AVENUES (Karrada, Palestine St): Neon Hum & Distant City Energy
      case 'RUSAFA_KARRADA_NIGHT':
      case 'RUSAFA_PALESTINE_ZAYOUNA': {
        const rand = Math.random();
        if (rand < 0.6) {
          this.playNeonSignHum(t);
        } else {
          this.playBaghdadTaxiHorn(t);
        }
        break;
      }

      // 5. LIVELY BAZAARS (Bayaa, Shuula): Market Vendor Chime & Street Energy
      case 'KARKH_SAYDIYA_BAYAA':
      case 'KARKH_GHAZALIYA_SHUULA':
      default: {
        const rand = Math.random();
        if (rand < 0.5) {
          this.playVendorChime(t);
        } else {
          this.playBaghdadiTeaGlassClink(t);
        }
        break;
      }
    }
  }

  // ==================== AUTHENTIC IRAQI REGIONAL SPOT FX SYNTHESIS ====================

  /**
   * Authentic Baghdad Taxi Double Horn (طوط طوط التاكسي الأصفر في المنصور)
   */
  private playBaghdadTaxiHorn(t: number) {
    if (!this.ctx || !this.ambientGain) return;
    const baseFreq = 440 + Math.random() * 60; // 440-500Hz dual tone
    const hornBeeps = [0, 0.12]; // Classic quick double beep

    hornBeeps.forEach((offset) => {
      const osc1 = this.ctx!.createOscillator();
      const osc2 = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const filter = this.ctx!.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(baseFreq * 1.2, t + offset);
      filter.Q.setValueAtTime(3.0, t + offset);

      osc1.type = 'sawtooth';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(baseFreq, t + offset);
      osc2.frequency.setValueAtTime(baseFreq * 1.25, t + offset); // Major third interval

      gain.gain.setValueAtTime(0.001, t + offset);
      gain.gain.linearRampToValueAtTime(0.14, t + offset + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.085);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.ambientGain!);

      osc1.start(t + offset);
      osc2.start(t + offset);
      osc1.stop(t + offset + 0.09);
      osc2.stop(t + offset + 0.09);
    });
  }

  /**
   * Distant Car Passing / Engine Rev in Baghdad Avenues
   */
  private playDistantEngineRev(t: number) {
    if (!this.ctx || !this.ambientGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(160, t);
    filter.frequency.linearRampToValueAtTime(340, t + 0.4);
    filter.frequency.linearRampToValueAtTime(120, t + 0.9);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(65, t);
    osc.frequency.linearRampToValueAtTime(115, t + 0.4);
    osc.frequency.linearRampToValueAtTime(55, t + 0.9);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.12, t + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.95);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambientGain);

    osc.start(t);
    osc.stop(t + 1.0);
  }

  /**
   * Traditional Iraqi Tea Spoon Clinking against Glass Istikan (رنة استكان الشاي العراقي المهيل في المتنبي والقشلة)
   */
  private playBaghdadiTeaGlassClink(t: number) {
    if (!this.ctx || !this.ambientGain) return;
    const clinks = [0, 0.09]; // Double glass chime

    clinks.forEach((offset) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const glassFreq = 3150 + Math.random() * 300;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(glassFreq, t + offset);
      osc.frequency.exponentialRampToValueAtTime(glassFreq * 1.05, t + offset + 0.02);

      gain.gain.setValueAtTime(0.16, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.0005, t + offset + 0.18);

      osc.connect(gain);
      gain.connect(this.ambientGain!);

      osc.start(t + offset);
      osc.stop(t + offset + 0.2);
    });
  }

  /**
   * Traditional Copper Craft Hammering in Souq Al-Safafir (رنين ورش النحاس في سوق الصفافير التراثي)
   */
  private playSafafirCopperClink(t: number) {
    if (!this.ctx || !this.ambientGain) return;
    const hits = [0, 0.14, 0.28];

    hits.forEach((offset, idx) => {
      const osc1 = this.ctx!.createOscillator();
      const osc2 = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const copperBase = 1850 + (idx % 2) * 220;

      osc1.type = 'triangle';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(copperBase, t + offset);
      osc2.frequency.setValueAtTime(copperBase * 1.62, t + offset); // Harmonic chime

      gain.gain.setValueAtTime(0.15, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.22);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ambientGain!);

      osc1.start(t + offset);
      osc2.start(t + offset);
      osc1.stop(t + offset + 0.24);
      osc2.stop(t + offset + 0.24);
    });
  }

  /**
   * Baghdad Pigeons Cooing on Tigris Riverbank (هديل حمام دجلة في الجادرية والأعظمية)
   */
  private playTigrisPigeonsCooing(t: number) {
    if (!this.ctx || !this.ambientGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, t);

    osc.type = 'sine';
    // Gentle undulating coo (270Hz -> 310Hz -> 250Hz -> 290Hz)
    osc.frequency.setValueAtTime(270, t);
    osc.frequency.linearRampToValueAtTime(320, t + 0.18);
    osc.frequency.linearRampToValueAtTime(260, t + 0.35);
    osc.frequency.linearRampToValueAtTime(300, t + 0.55);
    osc.frequency.linearRampToValueAtTime(240, t + 0.75);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.13, t + 0.15);
    gain.gain.linearRampToValueAtTime(0.08, t + 0.4);
    gain.gain.linearRampToValueAtTime(0.11, t + 0.55);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.85);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambientGain);

    osc.start(t);
    osc.stop(t + 0.9);
  }

  /**
   * River Breeze & Water Wave Ripple (نسيم وموجات دجلة)
   */
  private playRiverBreezeLap(t: number) {
    if (!this.ctx || !this.ambientGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(180, t);
    filter.frequency.linearRampToValueAtTime(350, t + 0.4);
    filter.frequency.linearRampToValueAtTime(160, t + 0.8);
    filter.Q.setValueAtTime(1.8, t);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(95, t);
    osc.frequency.linearRampToValueAtTime(130, t + 0.4);
    osc.frequency.linearRampToValueAtTime(80, t + 0.8);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.11, t + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.85);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambientGain);

    osc.start(t);
    osc.stop(t + 0.9);
  }

  /**
   * Karrada Night Neon Sign Electric Hum
   */
  private playNeonSignHum(t: number) {
    if (!this.ctx || !this.ambientGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(120, t);
    filter.Q.setValueAtTime(4.0, t);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, t);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.09, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambientGain);

    osc.start(t);
    osc.stop(t + 0.65);
  }

  /**
   * Street Vendor / Shop Chime in Bazaars
   */
  private playVendorChime(t: number) {
    if (!this.ctx || !this.ambientGain) return;
    const notes = [1200, 1600];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.1);
      gain.gain.setValueAtTime(0.12, t + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.1 + 0.25);

      osc.connect(gain);
      gain.connect(this.ambientGain!);

      osc.start(t + idx * 0.1);
      osc.stop(t + idx * 0.1 + 0.27);
    });
  }

  // ==================== MUSIC ENGINE ====================
  public startMusic(speedMultiplier: number = 1.0) {
    this.initContext();
    this.targetSpeedMultiplier = speedMultiplier;
    if (this.isMusicPlaying) return;
    this.isMusicPlaying = true;
    this.beatStep = 0;

    this.runMusicLoop();
  }

  private restartMusicWithCurrentSettings() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    if (this.isMusicPlaying) {
      this.runMusicLoop();
    }
  }

  private runMusicLoop() {
    const theme = this.biomeThemes[this.currentBiome] || this.biomeThemes.KARKH_MANSOUR;
    const effectiveBPM = theme.tempoBPM * this.targetSpeedMultiplier;
    const stepTime = (60 / effectiveBPM) / 4; // 16th notes

    this.musicInterval = setInterval(() => {
      if (!this.ctx || !this.isMusicPlaying || !this.musicGain) return;
      const t = this.ctx.currentTime;
      const activeTheme = this.biomeThemes[this.currentBiome] || this.biomeThemes.KARKH_MANSOUR;

      // 1. Percussion Layer based on Rhythm Style
      this.playPercussionForStyle(activeTheme.rhythmStyle, this.beatStep, t);

      // 2. Heavy Driving Bassline
      if (this.beatStep % 4 === 0 || this.beatStep % 16 === 14) {
        const bassIdx = (Math.floor(this.beatStep / 8) + (this.beatStep % 3)) % activeTheme.bassScale.length;
        this.playBassNote(t, activeTheme.bassScale[bassIdx]);
      }

      // 3. Authentic Regional Maqam Melody with Distinct Heritage Instrument Synthesis
      const shouldPlayMelody = (this.beatStep % 4 === 0) || 
        (activeTheme.melodyDensity >= 2 && this.beatStep % 4 === 2) ||
        (activeTheme.melodyDensity >= 3 && (this.beatStep % 16 === 7 || this.beatStep % 16 === 15));

      if (shouldPlayMelody) {
        const noteIdx = (Math.floor(this.beatStep / 4) * 2 + (this.beatStep % 3)) % activeTheme.melodyScale.length;
        const freq = activeTheme.melodyScale[noteIdx];

        switch (activeTheme.leadInstrument) {
          case 'OUD':
            this.playOudPluck(t, freq);
            break;
          case 'NAY':
            this.playNayFlute(t, freq);
            break;
          case 'QANUN':
            this.playQanunNote(t, freq);
            break;
          case 'BRASS':
            this.playBrassLead(t, freq);
            break;
          case 'SYNTH':
          default:
            this.playSynthMelody(t, freq);
            break;
        }
      }

      this.beatStep = (this.beatStep + 1) % 64;
    }, stepTime * 1000);
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  // ==================== PERCUSSION SYNTHESIS ====================
  private playPercussionForStyle(style: string, step: number, t: number) {
    const s16 = step % 16;
    if (style === 'CHOBI') {
      // Syncopated Iraqi Chobi pulse (0, 3, 6, 10, 12)
      if (s16 === 0 || s16 === 3 || s16 === 8 || s16 === 11) {
        this.playDarbukaDoom(t);
      }
      if (s16 === 4 || s16 === 12 || s16 === 14) {
        this.playDarbukaTak(t);
      }
      if (step % 2 === 0) {
        this.playRiqqJingle(t, (s16 === 2 || s16 === 10) ? 0.08 : 0.035);
      }
    } else if (style === 'HERITAGE') {
      // Deep spiritual Doholla & ancient riqq
      if (s16 === 0 || s16 === 8) {
        this.playDohollaDoom(t);
      }
      if (s16 === 4 || s16 === 12) {
        this.playDarbukaTak(t);
      }
      if (step % 4 === 0) {
        this.playRiqqJingle(t, 0.05);
      }
    } else if (style === 'SYNTHWAVE') {
      // 80s Cyberpunk 4-on-the-floor kick & snappy snare
      if (step % 4 === 0) {
        this.playElectronicKick(t);
      }
      if (s16 === 4 || s16 === 12) {
        this.playSnappySnare(t);
      }
      if (step % 2 === 0) {
        this.playHiHat(t, 0.05);
      }
    } else if (style === 'SAMAI') {
      // Mellow, elegant heritage cadence
      if (s16 === 0 || s16 === 6 || s16 === 10) {
        this.playDarbukaDoom(t);
      }
      if (s16 === 4 || s16 === 12) {
        this.playDarbukaTak(t);
      }
      if (step % 4 === 2) {
        this.playRiqqJingle(t, 0.04);
      }
    } else {
      // Baladi / Marching driving pulse
      if (s16 === 0 || s16 === 2 || s16 === 8) {
        this.playDarbukaDoom(t);
      }
      if (s16 === 4 || s16 === 12 || s16 === 14) {
        this.playDarbukaTak(t);
      }
      if (step % 2 === 0) {
        this.playRiqqJingle(t, 0.05);
      }
    }
  }

  private playDarbukaDoom(time: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(135, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.12);
    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + 0.2);
  }

  private playDohollaDoom(time: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(95, time);
    osc.frequency.exponentialRampToValueAtTime(32, time + 0.25);
    gain.gain.setValueAtTime(0.42, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + 0.32);
  }

  private playElectronicKick(time: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(38, time + 0.1);
    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + 0.16);
  }

  private playDarbukaTak(time: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(620, time);
    osc.frequency.exponentialRampToValueAtTime(180, time + 0.06);
    gain.gain.setValueAtTime(0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.07);
    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + 0.08);
  }

  private playSnappySnare(time: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(240, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.08);
    gain.gain.setValueAtTime(0.22, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + 0.11);
  }

  private playRiqqJingle(time: number, vol: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(4200, time);
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + 0.05);
  }

  private playHiHat(time: number, vol: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(6800, time);
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + 0.04);
  }

  private playBassNote(time: number, freq: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, time);
    gain.gain.setValueAtTime(0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + 0.26);
  }

  // ==================== INSTRUMENT SYNTHESIS ====================
  // 1. Classical Acoustic Oud (عزف عود بغدادي أصيل)
  private playOudPluck(time: number, freq: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, time);
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(freq * 1.002, time); // warm acoustic chorus

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1600, time);
    filter.frequency.exponentialRampToValueAtTime(350, time + 0.18);

    gain.gain.setValueAtTime(0.16, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + 0.24);
    osc2.stop(time + 0.24);
  }

  // 2. Heritage Nay Flute (ناي بغدادي شجي وروحاني)
  private playNayFlute(time: number, freq: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    // Gentle Arabic ornamental micro-vibrato
    osc.frequency.linearRampToValueAtTime(freq * 1.015, time + 0.08);
    osc.frequency.linearRampToValueAtTime(freq, time + 0.18);

    gain.gain.setValueAtTime(0.02, time);
    gain.gain.linearRampToValueAtTime(0.13, time + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.24);
  }

  // 3. Iraqi Qanun Tremolo (قانون بغدادي رنان)
  private playQanunNote(time: number, freq: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(0.15, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.16);
  }

  // 4. Heroic Brass / Horn Lead (نحاسيات ملحمية)
  private playBrassLead(time: number, freq: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, time);
    filter.frequency.linearRampToValueAtTime(2200, time + 0.06);
    filter.frequency.exponentialRampToValueAtTime(600, time + 0.2);

    gain.gain.setValueAtTime(0.12, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.24);
  }

  // 5. Modern Pop Synth Lead (سينث عداء بغداد الحديث)
  private playSynthMelody(time: number, freq: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(0.12, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.17);
  }

  // ==================== SFX ENGINE ====================
  public playJump() {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(580, t + 0.15);
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.23);
  }

  public playSlide() {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.25);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  public playSwipe() {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(280, t + 0.09);
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.11);
  }

  private lastCoinScheduleTime: number = 0;

  public playCoin(combo: number = 0) {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    
    // Resume audio context if browser suspended it
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const now = this.ctx.currentTime;
    // Stagger closely-spaced magnet coin sounds by 0.035s so every coin chimes distinctly
    const startTime = Math.max(now, this.lastCoinScheduleTime + 0.035);
    this.lastCoinScheduleTime = startTime;

    // Reset schedule time if gap is large
    if (startTime > now + 0.3) {
      this.lastCoinScheduleTime = now;
    }

    const baseFreq = 1046.50; // High C6 crisp golden chime
    const pitchOffset = Math.min((combo % 12) * 35, 420);

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    osc1.frequency.setValueAtTime(baseFreq + pitchOffset, startTime);
    osc1.frequency.setValueAtTime((baseFreq + pitchOffset) * 1.5, startTime + 0.04);

    osc2.frequency.setValueAtTime((baseFreq + pitchOffset) * 2, startTime);

    gain.gain.setValueAtTime(0.32, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.16);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + 0.18);
    osc2.stop(startTime + 0.18);
  }

  public playPowerUp() {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C - E - G - C major chord
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.05);
      gain.gain.setValueAtTime(0.2, t + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.05 + 0.3);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t + idx * 0.05);
      osc.stop(t + idx * 0.05 + 0.35);
    });
  }

  public playCrash() {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.4);
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.5);
  }

  public playShieldDeflect() {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(700, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.12);
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.28);
  }

  public playButtonClick() {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(900, t + 0.04);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.07);
  }

  public playLevelUp() {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880, 1108.73];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);
      gain.gain.setValueAtTime(0.25, t + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.3);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.32);
    });
  }

  public playMissionClaim() {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, t);
    osc.frequency.setValueAtTime(783.99, t + 0.08);
    osc.frequency.setValueAtTime(1046.50, t + 0.16);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.45);
  }

  public playTurbo() {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.4);
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.65);
  }

  public playTimeSlow() {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.5);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.65);
  }

  public playThunder() {
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    
    // Low rumbling filtered noise buffer for realistic Baghdad thunder
    const bufferSize = this.ctx.sampleRate * 2.2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, t);
    filter.frequency.linearRampToValueAtTime(60, t + 1.8);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.45, t + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 2.0);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
    noise.stop(t + 2.1);
  }
}

export const audioManager = new AudioManager();
