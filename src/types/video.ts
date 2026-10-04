export type AspectRatio = '9:16' | '16:9' | '1:1';

export type CameraMotion = 'zoom_in' | 'zoom_out' | 'pan_left' | 'pan_right' | 'drift';

export type TransitionType = 'crossfade' | 'zoom' | 'slide' | 'glitch' | 'flash';

export type CaptionTheme = 'viral_yellow' | 'modern_clean' | 'cyber_neon' | 'punchy_red' | 'cinema_box';

export type VisualizerStyle = 'bars' | 'wave' | 'circle' | 'minimal' | 'off';

export type BGMTrackId = 'none' | 'cosmic' | 'lofi' | 'cyber' | 'piano' | 'suspense';

export interface Scene {
  id: string;
  title: string;
  text: string;
  duration: number; // in seconds
  visualPrompt: string;
  keywords: string[];
  cameraMotion: CameraMotion;
  style: string;
  imageUrl: string;
  badge: string;
  transition: TransitionType;
}

export interface VideoProject {
  id: string;
  title: string;
  summary: string;
  aspectRatio: AspectRatio;
  scenes: Scene[];
  captionTheme: CaptionTheme;
  captionPosition: 'bottom' | 'center' | 'top';
  visualizerStyle: VisualizerStyle;
  bgmTrack: BGMTrackId;
  bgmVolume: number; // 0 to 1
  voicePitch: number; // 0.8 to 1.3
  voiceRate: number; // 0.8 to 1.3
  voiceName: string;
  originalAudioBlob?: Blob | null;
  originalAudioUrl?: string | null;
}

export interface BGMTrack {
  id: BGMTrackId;
  title: string;
  genre: string;
  description: string;
  bpm: number;
}
