/**
 * بسام (Bassam Runner) - Master Audio Engine
 * 100% Procedural Web Audio API Sound & Music Synthesizer
 * Original Arabic melodic hooks, lively percussive beats, and game SFX.
 * Zero external audio files required - works 100% offline with zero latency.
 */

const AudioManager = {
  ctx: null,
  isInitialized: false,
  musicGain: null,
  sfxGain: null,
  masterGain: null,
  musicTimer: null,
  isMusicPlaying: false,
  musicStep: 0,

  // Initialize Web Audio Context upon user interaction
  init() {
    if (this.isInitialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);

      // SFX Gain
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.connect(this.masterGain);

      // Music Gain
      this.musicGain = this.ctx.createGain();
      this.musicGain.connect(this.masterGain);

      this.applySettings();
      this.isInitialized = true;
    } catch (e) {
      console.warn("Web Audio API not supported in this browser:", e);
    }
  },

  // Ensure AudioContext is running (handles mobile auto-play policy)
  resume() {
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  },

  // Apply volume & mute settings from SaveManager
  applySettings() {
    if (!this.masterGain) return;
    const settings = SaveManager.data ? SaveManager.data.settings : { sfx: true, music: true, volume: 80 };
    const masterVol = (settings.volume || 80) / 100;

    this.masterGain.gain.setValueAtTime(masterVol, this.ctx.currentTime);
    this.sfxGain.gain.setValueAtTime(settings.sfx ? 0.9 : 0.0, this.ctx.currentTime);
    this.musicGain.gain.setValueAtTime(settings.music ? 0.45 : 0.0, this.ctx.currentTime);
  },

  // ==========================================
  // PROCEDURAL SOUND EFFECTS (SFX)
  // ==========================================

  // Jump sound: rising pitch swoosh
  playJump() {
    if (!this.ctx || !SaveManager.data?.settings.sfx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(580, t + 0.18);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.22);
  },

  // Slide sound: whoosh / ground sweep
  playSlide() {
    if (!this.ctx || !SaveManager.data?.settings.sfx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(450, t);
    filter.frequency.exponentialRampToValueAtTime(180, t + 0.25);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.linearRampToValueAtTime(0.01, t + 0.25);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
  },

  // Coin collect: bright, rich chime
  playCoin() {
    if (!this.ctx || !SaveManager.data?.settings.sfx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(987.77, t); // B5
    osc.frequency.setValueAtTime(1318.51, t + 0.06); // E6

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.2);
  },

  // Power-up collect: melodic ascending sparkle
  playPowerup() {
    if (!this.ctx || !SaveManager.data?.settings.sfx) return;
    this.resume();
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      const t = this.ctx.currentTime + idx * 0.06;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.15);
    });
  },

  // Shield break: electric buzz deflection
  playShieldBreak() {
    if (!this.ctx || !SaveManager.data?.settings.sfx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.3);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.3);
  },

  // Crash / Game over impact: low explosion thud
  playCrash() {
    if (!this.ctx || !SaveManager.data?.settings.sfx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.45);

    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.5);
  },

  // Generic UI Button Click
  playClick() {
    if (!this.ctx || !SaveManager.data?.settings.sfx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.05);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.05);
  },

  // Purchase / Unlock Success Fanfare
  playPurchase() {
    if (!this.ctx || !SaveManager.data?.settings.sfx) return;
    this.resume();
    const chords = [523.25, 659.25, 783.99, 1046.50]; // C Major
    chords.forEach((f, i) => {
      const t = this.ctx.currentTime + i * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(f, t);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.25);
    });
  },

  // ==========================================
  // PROCEDURAL ARABIC BACKGROUND MUSIC
  // Lively rhythmic beat with Bayati / Hijaz melodic motif
  // ==========================================

  startMusic() {
    if (!this.ctx || this.isMusicPlaying) return;
    this.init();
    this.resume();
    this.isMusicPlaying = true;
    this.musicStep = 0;

    const tempo = 135; // BPM
    const stepIntervalMs = (60 / tempo / 4) * 1000; // 16th note steps

    // Hijaz/Bayati scale frequencies (Root D: 293.66 Hz)
    const melodyScale = [
      293.66, // D4
      311.13, // Eb4
      369.99, // F#4
      392.00, // G4
      440.00, // A4
      466.16, // Bb4
      554.37, // C#5
      587.33  // D5
    ];

    // 16-step rhythmic melody sequence
    const melodyPattern = [
      0, null, 2, 3, 4, null, 3, 2,
      1, 2, 1, 0, null, 4, 2, 0
    ];

    // Percussion track: 1=Kick (Dumbek Dum), 2=Snare/Clap (Tek), 0=None
    const drumPattern = [
      1, 0, 0, 0, 2, 0, 0, 1,
      0, 1, 2, 0, 1, 0, 2, 0
    ];

    this.musicTimer = setInterval(() => {
      if (!this.isMusicPlaying || !SaveManager.data?.settings.music) return;
      const t = this.ctx.currentTime;
      const step = this.musicStep % 16;

      // 1. Drum / Percussion Voice
      const drumType = drumPattern[step];
      if (drumType === 1) {
        // Dum (Bass tone)
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(110, t);
        osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(t);
        osc.stop(t + 0.12);
      } else if (drumType === 2) {
        // Tek (Crisp rim sound)
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(500, t);
        osc.frequency.exponentialRampToValueAtTime(200, t + 0.05);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(t);
        osc.stop(t + 0.05);
      }

      // 2. Melody Voice (Oud-style plucked string simulation)
      const noteIdx = melodyPattern[step];
      if (noteIdx !== null && noteIdx !== undefined) {
        const freq = melodyScale[noteIdx];
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Plucked timbre
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.22, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.16);

        osc.connect(gain);
        gain.connect(this.musicGain);

        osc.start(t);
        osc.stop(t + 0.16);
      }

      this.musicStep++;
    }, stepIntervalMs);
  },

  stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
};
