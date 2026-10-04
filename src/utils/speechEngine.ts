export interface VoiceOption {
  voice: SpeechSynthesisVoice;
  name: string;
  lang: string;
}

export class SpeechEngine {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private analyser: AnalyserNode | null = null;
  private audioCtx: AudioContext | null = null;
  private mediaStreamSource: MediaStreamAudioSourceNode | null = null;
  private isSpeaking = false;
  private onWordHighlightCallback: ((word: string, charIndex: number) => void) | null = null;
  private onEndCallback: (() => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    return this.synth.getVoices();
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public speak(
    text: string,
    options: {
      voiceName?: string;
      pitch?: number;
      rate?: number;
      onWord?: (word: string, charIndex: number) => void;
      onEnd?: () => void;
    } = {}
  ) {
    if (!this.synth) return;
    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    if (options.pitch !== undefined) utterance.pitch = options.pitch;
    if (options.rate !== undefined) utterance.rate = options.rate;

    const voices = this.getVoices();
    if (options.voiceName) {
      const selected = voices.find(v => v.name === options.voiceName);
      if (selected) utterance.voice = selected;
    } else {
      // Pick best English voice if available
      const englishVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Premium')));
      if (englishVoice) utterance.voice = englishVoice;
    }

    this.onWordHighlightCallback = options.onWord || null;
    this.onEndCallback = options.onEnd || null;

    utterance.onboundary = (event: SpeechSynthesisEvent) => {
      if (event.name === 'word' && this.onWordHighlightCallback) {
        const spokenWord = text.substring(event.charIndex, event.charIndex + (event.charLength || 6));
        this.onWordHighlightCallback(spokenWord, event.charIndex);
      }
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      if (this.onEndCallback) this.onEndCallback();
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      this.isSpeaking = false;
      this.currentUtterance = null;
      if (this.onEndCallback) this.onEndCallback();
    };

    this.currentUtterance = utterance;
    this.isSpeaking = true;
    this.synth.speak(utterance);
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
    }
    this.isSpeaking = false;
    this.currentUtterance = null;
  }

  public pause() {
    if (this.synth && this.synth.speaking) {
      this.synth.pause();
    }
  }

  public resume() {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
    }
  }
}

export const speechEngine = new SpeechEngine();

// Microphone voice recorder helper
export class MicRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private animationId: number | null = null;

  public async startRecording(onVolumeChange?: (volume: number) => void): Promise<void> {
    this.audioChunks = [];
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Setup analyser for live waveform
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    this.audioCtx = new AudioCtx();
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 256;
    this.source = this.audioCtx.createMediaStreamSource(this.stream);
    this.source.connect(this.analyser);

    if (onVolumeChange) {
      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      const checkVolume = () => {
        if (!this.analyser) return;
        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        onVolumeChange(avg / 255); // 0 to 1
        this.animationId = requestAnimationFrame(checkVolume);
      };
      checkVolume();
    }

    // Try mime types
    const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
    let supportedMime = '';
    for (const m of mimeTypes) {
      if (MediaRecorder.isTypeSupported(m)) {
        supportedMime = m;
        break;
      }
    }

    this.mediaRecorder = new MediaRecorder(this.stream, supportedMime ? { mimeType: supportedMime } : undefined);

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        this.audioChunks.push(e.data);
      }
    };

    this.mediaRecorder.start(250);
  }

  public async stopRecording(): Promise<{ blob: Blob; base64: string; url: string; mimeType: string }> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        return reject(new Error('Recorder not started'));
      }

      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }

      this.mediaRecorder.onstop = async () => {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const blob = new Blob(this.audioChunks, { type: mimeType });
        const url = URL.createObjectURL(blob);

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          resolve({ blob, base64, url, mimeType });
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);

        // Clean up tracks
        if (this.stream) {
          this.stream.getTracks().forEach(t => t.stop());
          this.stream = null;
        }
        if (this.audioCtx) {
          this.audioCtx.close();
          this.audioCtx = null;
        }
      };

      this.mediaRecorder.stop();
    });
  }

  public cancel() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
    }
  }
}
