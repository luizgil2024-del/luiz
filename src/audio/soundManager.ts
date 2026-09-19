// Procedural Web Audio API Sound Synthesizer for Zombie Survival
class SoundManager {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  private ambientOsc: OscillatorNode | null = null;
  private ambientGain: GainNode | null = null;
  private heartbeatInterval: number | null = null;

  public volume: number = 0.8;
  private masterGain: GainNode | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      if (!this.masterGain) {
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.enabled ? this.volume : 0, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
  }

  public getMasterOut(): AudioNode {
    this.initCtx();
    if (this.masterGain) return this.masterGain;
    if (this.ctx) {
      try {
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.enabled ? this.volume : 0, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
        return this.masterGain;
      } catch {
        // Fallback safely
      }
    }
    return (null as unknown as AudioNode);
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.enabled ? this.volume : 0, this.ctx.currentTime);
    }
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.enabled ? this.volume : 0, this.ctx.currentTime);
    }
  }

  public playTestSound() {
    if (!this.enabled || this.volume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(540, t);
    osc.frequency.exponentialRampToValueAtTime(820, t + 0.08);
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc.connect(gain);
    gain.connect(this.getMasterOut());
    osc.start(t);
    osc.stop(t + 0.13);
  }

  public playGunshot(type: 'pistol' | 'shotgun' | 'rifle') {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // White noise explosion burst
    const bufferSize = this.ctx.sampleRate * (type === 'shotgun' ? 0.35 : type === 'rifle' ? 0.25 : 0.15);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    // Filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(type === 'shotgun' ? 1200 : 2500, t);
    filter.frequency.exponentialRampToValueAtTime(100, t + (type === 'shotgun' ? 0.35 : 0.18));

    // Gain envelope
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(type === 'shotgun' ? 0.8 : 0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + (type === 'shotgun' ? 0.35 : 0.2));

    // Bass punch
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(type === 'shotgun' ? 140 : 220, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.15);
    oscGain.gain.setValueAtTime(0.7, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.getMasterOut());

    osc.connect(oscGain);
    oscGain.connect(this.getMasterOut());

    noise.start(t);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  public playDoorCreak(isOpen: boolean) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';

    if (isOpen) {
      osc.frequency.setValueAtTime(160, t);
      osc.frequency.exponentialRampToValueAtTime(320, t + 0.25);
    } else {
      osc.frequency.setValueAtTime(280, t);
      osc.frequency.exponentialRampToValueAtTime(140, t + 0.2);
    }

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.getMasterOut());

    osc.start(t);
    osc.stop(t + 0.25);
  }

  public playMeleeSwing() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.12);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.getMasterOut());
    osc.start(t);
    osc.stop(t + 0.13);
  }

  public playHit() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.08);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

    osc.connect(gain);
    gain.connect(this.getMasterOut());
    osc.start(t);
    osc.stop(t + 0.09);
  }

  public playPunch() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Whoosh + Heavy low impact punch
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);

    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.14);

    // Crunch noise
    const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.08, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.getMasterOut());

    osc.connect(gain);
    gain.connect(this.getMasterOut());

    whiteNoise.start(t);
    osc.start(t);
    osc.stop(t + 0.14);
  }

  public playZombieGroan(isAggro = false) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    filter.type = 'bandpass';
    filter.frequency.value = isAggro ? 450 : 250;
    filter.Q.value = 3;

    const startFreq = isAggro ? 180 + Math.random() * 40 : 110 + Math.random() * 20;
    const endFreq = isAggro ? 280 + Math.random() * 60 : 70;
    const duration = isAggro ? 0.35 : 0.6;

    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.linearRampToValueAtTime(endFreq, t + duration);

    gain.gain.setValueAtTime(isAggro ? 0.25 : 0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.getMasterOut());

    osc.start(t);
    osc.stop(t + duration);
  }

  public playZombieDeath() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.4);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc.connect(gain);
    gain.connect(this.getMasterOut());
    osc.start(t);
    osc.stop(t + 0.4);
  }

  public playReload() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Click 1 (magazine out)
    const osc1 = this.ctx.createOscillator();
    const g1 = this.ctx.createGain();
    osc1.frequency.setValueAtTime(800, t);
    osc1.frequency.exponentialRampToValueAtTime(200, t + 0.05);
    g1.gain.setValueAtTime(0.3, t);
    g1.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
    osc1.connect(g1);
    g1.connect(this.getMasterOut());
    osc1.start(t);
    osc1.stop(t + 0.06);

    // Click 2 (magazine in)
    const osc2 = this.ctx.createOscillator();
    const g2 = this.ctx.createGain();
    osc2.frequency.setValueAtTime(600, t + 0.18);
    osc2.frequency.exponentialRampToValueAtTime(1200, t + 0.23);
    g2.gain.setValueAtTime(0.35, t + 0.18);
    g2.gain.exponentialRampToValueAtTime(0.01, t + 0.23);
    osc2.connect(g2);
    g2.connect(this.getMasterOut());
    osc2.start(t + 0.18);
    osc2.stop(t + 0.25);
  }

  public playFootstep(isInterior = false) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = isInterior ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(isInterior ? 110 : 80, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.06);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.getMasterOut());
    osc.start(t);
    osc.stop(t + 0.07);
  }

  public playLoot() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, t); // C5
    osc.frequency.setValueAtTime(659.25, t + 0.08); // E5
    osc.frequency.setValueAtTime(783.99, t + 0.16); // G5

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    osc.connect(gain);
    gain.connect(this.getMasterOut());
    osc.start(t);
    osc.stop(t + 0.3);
  }

  public playEquipItem() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Snappy tactile gear switch
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(780, t);
    osc.frequency.exponentialRampToValueAtTime(280, t + 0.05);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.getMasterOut());
    osc.start(t);
    osc.stop(t + 0.06);

    // Subtle holster / weapon thud
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(200, t);
    osc2.frequency.exponentialRampToValueAtTime(90, t + 0.07);

    gain2.gain.setValueAtTime(0.08, t);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    osc2.connect(gain2);
    gain2.connect(this.getMasterOut());
    osc2.start(t);
    osc2.stop(t + 0.07);
  }

  public playCraftHammer() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.08);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

    osc.connect(gain);
    gain.connect(this.getMasterOut());
    osc.start(t);
    osc.stop(t + 0.09);
  }

  public playEatDrink(isDrink = false) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    if (isDrink) {
      osc.frequency.setValueAtTime(350, t);
      osc.frequency.exponentialRampToValueAtTime(550, t + 0.1);
    } else {
      osc.frequency.setValueAtTime(200, t);
      osc.frequency.exponentialRampToValueAtTime(140, t + 0.1);
    }

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

    osc.connect(gain);
    gain.connect(this.getMasterOut());
    osc.start(t);
    osc.stop(t + 0.16);
  }

  public playBarricadeHit() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    osc.connect(gain);
    gain.connect(this.getMasterOut());
    osc.start(t);
    osc.stop(t + 0.13);
  }

  public playLevelUp() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);
      g.gain.setValueAtTime(0.2, t + idx * 0.08);
      g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.25);
      osc.connect(g);
      g.connect(this.getMasterOut());
      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.26);
    });
  }

  public updateNightAmbiance(isNight: boolean) {
    if (!this.enabled) {
      if (this.ambientOsc) {
        this.ambientOsc.stop();
        this.ambientOsc = null;
      }
      return;
    }
    this.initCtx();
    if (!this.ctx) return;

    if (isNight && !this.ambientOsc) {
      this.ambientOsc = this.ctx.createOscillator();
      this.ambientGain = this.ctx.createGain();
      this.ambientOsc.type = 'sine';
      this.ambientOsc.frequency.setValueAtTime(55, this.ctx.currentTime); // Low eerie drone

      this.ambientGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      this.ambientGain.gain.linearRampToValueAtTime(0.04, this.ctx.currentTime + 3);

      this.ambientOsc.connect(this.ambientGain);
      this.ambientGain.connect(this.getMasterOut());
      this.ambientOsc.start();
    } else if (!isNight && this.ambientOsc && this.ambientGain) {
      this.ambientGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 2);
      setTimeout(() => {
        if (this.ambientOsc) {
          this.ambientOsc.stop();
          this.ambientOsc = null;
        }
      }, 2000);
    }
  }

  public updateHeartbeat(lowHealth: boolean) {
    if (lowHealth && !this.heartbeatInterval) {
      this.heartbeatInterval = window.setInterval(() => {
        if (!this.enabled) return;
        this.initCtx();
        if (!this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(70, t);
        osc.frequency.exponentialRampToValueAtTime(35, t + 0.15);
        g.gain.setValueAtTime(0.3, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc.connect(g);
        g.connect(this.getMasterOut());
        osc.start(t);
        osc.stop(t + 0.16);
      }, 800);
    } else if (!lowHealth && this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

export const soundManager = new SoundManager();
