/**
 * Web Audio API based ambient warm lo-fi pad synthesizer and vinyl crackle emulator.
 * Generates soft relaxing ambient chords when playing if no custom audio track is provided.
 */

class AmbientSynth {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private gainNode: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private filter: BiquadFilterNode | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public play() {
    this.initCtx();
    if (!this.ctx || this.isPlaying) return;

    try {
      this.isPlaying = true;
      const now = this.ctx.currentTime;

      // Master output gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.01, now);
      this.masterGain.gain.exponentialRampToValueAtTime(0.25, now + 1.2);
      this.masterGain.connect(this.ctx.destination);

      // Lowpass Filter for warm acoustic feel
      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.setValueAtTime(450, now);
      this.filter.connect(this.masterGain);

      // Warm chord notes (Fmaj9 / Cmaj7 inspired chord frequencies)
      const freqs = [174.61, 220.00, 261.63, 329.63, 392.00]; // F3, A3, C4, E4, G4

      this.oscillators = freqs.map((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const oscGain = this.ctx!.createGain();

        // Warm triangle + subtle sine blend
        osc.type = i % 2 === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, now);

        // Slight detune for analog warmth
        osc.detune.setValueAtTime((i - 2) * 4 + (Math.random() * 3 - 1.5), now);

        oscGain.gain.setValueAtTime(0.12 / freqs.length, now);

        osc.connect(oscGain);
        oscGain.connect(this.filter!);
        osc.start(now);
        return osc;
      });

      // Subtle vinyl crackle generator
      this.createVinylCrackle(now);
    } catch (e) {
      console.warn('Audio synth start error:', e);
    }
  }

  private createVinylCrackle(now: number) {
    if (!this.ctx || !this.masterGain) return;

    try {
      const bufferSize = this.ctx.sampleRate * 2; // 2 seconds of noise
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        // Random clicks & gentle dust noise
        if (Math.random() < 0.0008) {
          data[i] = (Math.random() * 2 - 1) * 0.4;
        } else {
          data[i] = (Math.random() * 2 - 1) * 0.015;
        }
      }

      this.noiseNode = this.ctx.createBufferSource();
      this.noiseNode.buffer = buffer;
      this.noiseNode.loop = true;

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.04, now);

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(1200, now);
      noiseFilter.Q.setValueAtTime(1.5, now);

      this.noiseNode.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.masterGain);

      this.noiseNode.start(now);
    } catch (e) {
      console.warn('Vinyl noise creation failed:', e);
    }
  }

  public pause() {
    if (!this.ctx || !this.isPlaying) return;

    try {
      const now = this.ctx.currentTime;
      if (this.masterGain) {
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
        this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
      }

      setTimeout(() => {
        this.oscillators.forEach(osc => {
          try { osc.stop(); osc.disconnect(); } catch {}
        });
        this.oscillators = [];

        if (this.noiseNode) {
          try { this.noiseNode.stop(); this.noiseNode.disconnect(); } catch {}
          this.noiseNode = null;
        }
        this.isPlaying = false;
      }, 500);
    } catch (e) {
      console.warn('Audio synth pause error:', e);
      this.isPlaying = false;
    }
  }

  public toggle(playState: boolean) {
    if (playState) {
      this.play();
    } else {
      this.pause();
    }
  }
}

export const ambientSynth = new AmbientSynth();
