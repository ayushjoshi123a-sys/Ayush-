import { BGMTrackId, BGMTrack } from '../types/video';

export const BGM_TRACKS: BGMTrack[] = [
  {
    id: 'none',
    title: 'No Background Music',
    genre: 'Voice Only',
    description: 'Clean spoken voice with no soundtrack',
    bpm: 0,
  },
  {
    id: 'cosmic',
    title: 'Deep Cosmic Ambient',
    genre: 'Atmospheric Drone',
    description: 'Warm analog synthesizer pads with ethereal cosmic shimmer',
    bpm: 70,
  },
  {
    id: 'lofi',
    title: 'Lo-Fi Chill Chords',
    genre: 'Lo-Fi Chillhop',
    description: 'Warm vinyl rhodes chords with mellow rhythmic pulse',
    bpm: 80,
  },
  {
    id: 'cyber',
    title: 'Cyberpunk Arp Pulse',
    genre: 'Synthwave',
    description: 'Dynamic electronic bassline and neon melodic arpeggios',
    bpm: 110,
  },
  {
    id: 'piano',
    title: 'Inspirational Chords',
    genre: 'Cinematic Minimal',
    description: 'Emotional uplifting chord progressions that build momentum',
    bpm: 90,
  },
  {
    id: 'suspense',
    title: 'Dark Suspense Void',
    genre: 'Cinematic Thriller',
    description: 'Low sub-bass rumble with haunting tension frequencies',
    bpm: 60,
  },
];

export class ProceduralAudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private currentTrack: BGMTrackId = 'none';
  private masterGain: GainNode | null = null;
  private duckingGain: GainNode | null = null;
  private activeNodes: Array<OscillatorNode | GainNode | AudioBufferSourceNode> = [];
  private intervalTimer: any = null;
  private destinationNode: MediaStreamAudioDestinationNode | null = null;

  constructor() {}

  public getAudioContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public getExportAudioDestination(): MediaStreamAudioDestinationNode {
    const ctx = this.getAudioContext();
    if (!this.destinationNode) {
      this.destinationNode = ctx.createMediaStreamDestination();
    }
    return this.destinationNode;
  }

  public start(trackId: BGMTrackId, volume = 0.3) {
    this.stop();
    if (trackId === 'none') {
      this.currentTrack = 'none';
      return;
    }

    const ctx = this.getAudioContext();
    this.currentTrack = trackId;
    this.isPlaying = true;

    // Master volume
    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(volume, ctx.currentTime);

    // Voice ducking gain
    this.duckingGain = ctx.createGain();
    this.duckingGain.gain.setValueAtTime(1.0, ctx.currentTime);

    this.duckingGain.connect(this.masterGain);
    this.masterGain.connect(ctx.destination);

    // Also connect to export destination if initialized
    if (this.destinationNode) {
      this.masterGain.connect(this.destinationNode);
    }

    if (trackId === 'cosmic') {
      this.playCosmicPad(ctx, this.duckingGain);
    } else if (trackId === 'lofi') {
      this.playLofiChords(ctx, this.duckingGain);
    } else if (trackId === 'cyber') {
      this.playCyberArp(ctx, this.duckingGain);
    } else if (trackId === 'piano') {
      this.playInspirationalChords(ctx, this.duckingGain);
    } else if (trackId === 'suspense') {
      this.playSuspenseDrone(ctx, this.duckingGain);
    }
  }

  public setVolume(volume: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime, 0.05);
    }
  }

  public duck(isDucked: boolean) {
    if (this.duckingGain && this.ctx) {
      const target = isDucked ? 0.25 : 1.0;
      this.duckingGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.1);
    }
  }

  public stop() {
    this.isPlaying = false;
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
    this.activeNodes.forEach(node => {
      try {
        if ('stop' in node) {
          (node as OscillatorNode).stop();
        }
        node.disconnect();
      } catch (e) {}
    });
    this.activeNodes = [];

    if (this.duckingGain) {
      try {
        this.duckingGain.disconnect();
      } catch (e) {}
      this.duckingGain = null;
    }
    if (this.masterGain) {
      try {
        this.masterGain.disconnect();
      } catch (e) {}
      this.masterGain = null;
    }
  }

  // --- Track Generator Implementations ---

  private playCosmicPad(ctx: AudioContext, target: GainNode) {
    const freqs = [130.81, 196.0, 261.63, 329.63, 392.0]; // C3, G3, C4, E4, G4
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, ctx.currentTime);

    // LFO for filter movement
    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.15, ctx.currentTime);
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(250, ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();
    this.activeNodes.push(lfo);

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq + (Math.random() - 0.5) * 1.5, ctx.currentTime);
      oscGain.gain.setValueAtTime(0.12, ctx.currentTime);

      osc.connect(oscGain);
      oscGain.connect(filter);
      osc.start();
      this.activeNodes.push(osc, oscGain);
    });

    filter.connect(target);
  }

  private playLofiChords(ctx: AudioContext, target: GainNode) {
    const chords = [
      [146.83, 220.0, 261.63, 329.63], // Dm7
      [196.0, 246.94, 293.66, 392.0],  // G7
      [130.81, 196.0, 246.94, 329.63], // Cmaj7
      [220.0, 261.63, 329.63, 392.0],  // Am7
    ];
    let chordIdx = 0;

    const playChordStep = () => {
      if (!this.isPlaying) return;
      const currentChord = chords[chordIdx % chords.length];
      chordIdx++;

      currentChord.forEach(freq => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        const now = ctx.currentTime;
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

        osc.connect(gain);
        gain.connect(target);
        osc.start(now);
        osc.stop(now + 1.85);
      });
    };

    playChordStep();
    this.intervalTimer = setInterval(playChordStep, 1900);
  }

  private playCyberArp(ctx: AudioContext, target: GainNode) {
    const scale = [110, 130.81, 146.83, 164.81, 196, 220, 261.63, 329.63]; // A minor
    let noteIdx = 0;

    // Bass drone
    const bass = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bass.type = 'sawtooth';
    bass.frequency.setValueAtTime(55, ctx.currentTime);
    bassGain.gain.setValueAtTime(0.18, ctx.currentTime);

    const bassFilter = ctx.createBiquadFilter();
    bassFilter.type = 'lowpass';
    bassFilter.frequency.setValueAtTime(200, ctx.currentTime);

    bass.connect(bassGain);
    bassGain.connect(bassFilter);
    bassFilter.connect(target);
    bass.start();
    this.activeNodes.push(bass, bassGain);

    const playArpNote = () => {
      if (!this.isPlaying) return;
      const freq = scale[noteIdx % scale.length];
      noteIdx = (noteIdx + 3) % scale.length;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq * 2, ctx.currentTime);
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, ctx.currentTime);
      filter.Q.setValueAtTime(4, ctx.currentTime);

      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(target);
      osc.start(now);
      osc.stop(now + 0.25);
    };

    this.intervalTimer = setInterval(playArpNote, 220);
  }

  private playInspirationalChords(ctx: AudioContext, target: GainNode) {
    const progression = [
      [261.63, 329.63, 392.0, 523.25], // C
      [196.0, 246.94, 293.66, 392.0],  // G
      [220.0, 261.63, 329.63, 440.0],  // Am
      [174.61, 220.0, 261.63, 349.23], // F
    ];
    let step = 0;

    const playProgression = () => {
      if (!this.isPlaying) return;
      const chord = progression[step % progression.length];
      step++;

      chord.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        const now = ctx.currentTime + i * 0.06;
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.18, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);

        osc.connect(gain);
        gain.connect(target);
        osc.start(now);
        osc.stop(now + 2.3);
      });
    };

    playProgression();
    this.intervalTimer = setInterval(playProgression, 2400);
  }

  private playSuspenseDrone(ctx: AudioContext, target: GainNode) {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const subOsc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(65.41, ctx.currentTime); // C2
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(67.0, ctx.currentTime); // Dissonant microtone

    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(32.7, ctx.currentTime); // C1 sub

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(180, ctx.currentTime);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);

    osc1.connect(filter);
    osc2.connect(filter);
    subOsc.connect(filter);
    filter.connect(gain);
    gain.connect(target);

    osc1.start();
    osc2.start();
    subOsc.start();
    this.activeNodes.push(osc1, osc2, subOsc, gain);
  }
}

export const audioSynthesizer = new ProceduralAudioEngine();
