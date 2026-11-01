/**
 * Procedural Web Audio API sound engine for MR BAAZ 3D.
 * 100% procedural sound synthesis - zero external audio files.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private engineGain: GainNode | null = null;
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private isEngineRunning = false;
  private radioOsc: OscillatorNode | null = null;
  private radioGain: GainNode | null = null;
  private radioPlaying = false;
  private radioTimer: number | null = null;
  public isMuted = false;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setValueAtTime(muted ? 0 : 0.15, this.ctx.currentTime);
    }
    if (this.radioGain && this.ctx) {
      this.radioGain.gain.setValueAtTime(muted ? 0 : 0.08, this.ctx.currentTime);
    }
  }

  // Start engine continuous sound when driving
  public startEngine() {
    if (this.isEngineRunning) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      this.engineOsc1 = this.ctx.createOscillator();
      this.engineOsc2 = this.ctx.createOscillator();
      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineGain = this.ctx.createGain();

      this.engineOsc1.type = 'sawtooth';
      this.engineOsc1.frequency.setValueAtTime(45, this.ctx.currentTime);

      this.engineOsc2.type = 'triangle';
      this.engineOsc2.frequency.setValueAtTime(90, this.ctx.currentTime);

      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(320, this.ctx.currentTime);
      this.engineFilter.Q.setValueAtTime(2, this.ctx.currentTime);

      this.engineGain.gain.setValueAtTime(this.isMuted ? 0 : 0.12, this.ctx.currentTime);

      this.engineOsc1.connect(this.engineFilter);
      this.engineOsc2.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);

      this.engineOsc1.start();
      this.engineOsc2.start();
      this.isEngineRunning = true;
    } catch {
      // Audio context might be restricted before user gesture
    }
  }

  // Update engine pitch & filter according to vehicle speed / throttle
  public updateEngine(speedNormalized: number, isAccelerating: boolean) {
    if (!this.isEngineRunning || !this.ctx || !this.engineOsc1 || !this.engineOsc2 || !this.engineFilter) return;

    const baseFreq = 42 + Math.abs(speedNormalized) * 95 + (isAccelerating ? 25 : 0);
    const now = this.ctx.currentTime;
    this.engineOsc1.frequency.setTargetAtTime(baseFreq, now, 0.1);
    this.engineOsc2.frequency.setTargetAtTime(baseFreq * 1.5, now, 0.1);
    this.engineFilter.frequency.setTargetAtTime(280 + Math.abs(speedNormalized) * 550, now, 0.12);
  }

  // Stop vehicle engine sound
  public stopEngine() {
    if (!this.isEngineRunning) return;
    try {
      if (this.engineOsc1) {
        this.engineOsc1.stop();
        this.engineOsc1.disconnect();
        this.engineOsc1 = null;
      }
      if (this.engineOsc2) {
        this.engineOsc2.stop();
        this.engineOsc2.disconnect();
        this.engineOsc2 = null;
      }
      this.isEngineRunning = false;
    } catch {
      this.isEngineRunning = false;
    }
  }

  // Mountain Pahadi two-tone melodic horn ('Peep Peep!')
  public playHorn() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(392, now); // G4
    osc2.frequency.setValueAtTime(523.25, now); // C5

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.5);
    osc2.stop(now + 0.5);
  }

  // Hill Mandir temple brass bell chime with rich harmonic overtones
  public playTempleBell() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const harmonics = [880, 1760, 2640, 3520, 528];
    const decayTimes = [2.2, 1.8, 1.2, 0.8, 2.5];
    const now = this.ctx.currentTime;

    harmonics.forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = i === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.18 / (i + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decayTimes[i]);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + decayTimes[i] + 0.1);
    });
  }

  // Footstep sounds for walking/running
  public playFootstep(isOnRoad = false) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = isOnRoad ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(isOnRoad ? 160 : 90, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isOnRoad ? 800 : 350, now);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  // Jump sound
  public playJump() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(380, now + 0.16);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  // Mission milestone chime / pickup sound
  public playSuccess() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = now + idx * 0.09;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.15, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(start);
      osc.stop(start + 0.4);
    });
  }

  // Toggle procedural Pahadi mountain flute/melody radio
  public toggleRadio(): boolean {
    this.initCtx();
    if (!this.ctx) return false;

    if (this.radioPlaying) {
      if (this.radioTimer) {
        window.clearTimeout(this.radioTimer);
        this.radioTimer = null;
      }
      if (this.radioGain && this.ctx) {
        this.radioGain.gain.setValueAtTime(0, this.ctx.currentTime);
      }
      this.radioPlaying = false;
      return false;
    }

    this.radioPlaying = true;
    this.playPahadiMelodyLoop();
    return true;
  }

  public isRadioOn(): boolean {
    return this.radioPlaying;
  }

  // Procedural Pahadi hill flute notes sequence (traditional Pahadi folk scale: Raga Bhupali / Pahadi)
  private playPahadiMelodyLoop() {
    if (!this.radioPlaying || !this.ctx || this.isMuted) return;

    // Frequencies: Sa, Re, Ga, Pa, Dha, Sa' (Pahadi scale in C: C4, D4, E4, G4, A4, C5, D5)
    const notes = [
      261.63, 293.66, 329.63, 392.00, 440.00,
      523.25, 440.00, 392.00, 329.63, 392.00,
      440.00, 523.25, 587.33, 523.25, 440.00,
      392.00, 329.63, 293.66, 261.63, 329.63,
    ];
    const durations = [
      0.35, 0.25, 0.35, 0.45, 0.3,
      0.5, 0.25, 0.35, 0.3, 0.4,
      0.3, 0.45, 0.6, 0.3, 0.35,
      0.45, 0.35, 0.3, 0.6, 0.4,
    ];

    let noteIdx = 0;
    const playNext = () => {
      if (!this.radioPlaying || !this.ctx) return;
      const now = this.ctx.currentTime;
      const freq = notes[noteIdx % notes.length];
      const dur = durations[noteIdx % durations.length];

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Flute warmth
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq * 1.5, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.09, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + dur + 0.05);

      noteIdx++;
      this.radioTimer = window.setTimeout(playNext, dur * 950);
    };

    playNext();
  }
}

export const soundEngine = new SoundEngine();
