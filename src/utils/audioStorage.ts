import { AudioUploadItem, VisibilitySetting } from '../types/audio';

const DB_NAME = 'voxclip_audio_db';
const DB_VERSION = 1;
const STORE_NAME = 'audio_uploads';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('visibility', 'visibility', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Generate realistic waveform peaks from an AudioBuffer or mock if raw
export async function extractWaveform(blob: Blob, peakCount = 48): Promise<number[]> {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    const channelData = audioBuffer.getChannelData(0);
    const blockSize = Math.floor(channelData.length / peakCount);
    const peaks: number[] = [];

    for (let i = 0; i < peakCount; i++) {
      let sum = 0;
      const start = i * blockSize;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(channelData[start + j] || 0);
      }
      const val = Math.min(1, (sum / blockSize) * 2.8);
      peaks.push(Math.max(0.12, Number(val.toFixed(2))));
    }

    ctx.close();
    return peaks;
  } catch (err) {
    // Generate organic pseudo-peaks if decode fails
    const peaks: number[] = [];
    for (let i = 0; i < peakCount; i++) {
      const v = 0.2 + 0.6 * Math.abs(Math.sin(i * 0.45) * Math.cos(i * 0.2));
      peaks.push(Number(v.toFixed(2)));
    }
    return peaks;
  }
}

export async function getAudioDuration(blob: Blob): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.src = URL.createObjectURL(blob);
    audio.onloadedmetadata = () => {
      resolve(audio.duration || 15);
    };
    audio.onerror = () => {
      resolve(15);
    };
  });
}

export async function saveAudioUpload(item: AudioUploadItem): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(item);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getAllAudioUploads(): Promise<AudioUploadItem[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => {
      const results: AudioUploadItem[] = req.result || [];
      // Sort newest first
      results.sort((a, b) => b.createdAt - a.createdAt);
      resolve(results);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteAudioUpload(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function updateAudioVisibility(id: string, visibility: VisibilitySetting): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);
    req.onsuccess = () => {
      const item = req.result;
      if (item) {
        item.visibility = visibility;
        store.put(item);
      }
      resolve();
    };
    req.onerror = () => reject(req.error);
  });
}

// Generate seeded demo uploads if database is initially empty
export async function seedInitialAudioData(): Promise<AudioUploadItem[]> {
  const existing = await getAllAudioUploads();
  if (existing.length > 0) return existing;

  // Synthesize a brief tone audio blob for the seeds
  const generatePlaceholderBlob = (freq = 440, duration = 3): Blob => {
    // Generate minimal audio/wav header + sine samples
    const sampleRate = 22050;
    const numSamples = sampleRate * duration;
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    // RIFF identifier
    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // PCM format
    view.setUint16(20, 1, true); // mono
    view.setUint16(22, 1, true); // 1 channel
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true); // block align
    view.setUint16(34, 16, true); // bits per sample
    writeString(36, 'data');
    view.setUint32(40, numSamples * 2, true);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const sample = Math.sin(2 * Math.PI * freq * t) * 0.25;
      view.setInt16(44 + i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    }

    return new Blob([buffer], { type: 'audio/wav' });
  };

  const seeds: AudioUploadItem[] = [
    {
      id: 'audio-seed-1',
      title: 'Cosmic Awakening Narration',
      description: 'A deep philosophical narration exploring human perception and astronomical wonders. Perfect for YouTube Shorts or documentary style reels.',
      visibility: 'public',
      audioUrl: '',
      audioBlob: generatePlaceholderBlob(320, 21),
      mimeType: 'audio/wav',
      fileName: 'cosmic_awakening_vox.wav',
      fileSize: 926000,
      duration: 21,
      createdAt: Date.now() - 3600000 * 4,
      waveformPeaks: [0.3, 0.45, 0.8, 0.95, 0.6, 0.4, 0.7, 0.85, 0.9, 0.65, 0.35, 0.75, 0.88, 0.92, 0.6, 0.45, 0.3, 0.7, 0.85, 0.9, 0.5, 0.35, 0.8, 0.6, 0.4, 0.7, 0.9, 0.8, 0.65, 0.5],
      tags: ['Voiceover', 'Cosmic', 'Philosophy', 'Narration'],
      transcript: 'You are never actually living in the present moment. Your brain takes eighty milliseconds to process reality. What else is hidden in plain sight?'
    },
    {
      id: 'audio-seed-2',
      title: 'Startup Pitch Memo (Internal)',
      description: 'Confidential voice memo summarizing Q3 metrics and product vision update for team leadership.',
      visibility: 'private',
      audioUrl: '',
      audioBlob: generatePlaceholderBlob(440, 15),
      mimeType: 'audio/wav',
      fileName: 'q3_vision_memo.wav',
      fileSize: 660000,
      duration: 15,
      createdAt: Date.now() - 3600000 * 18,
      waveformPeaks: [0.2, 0.5, 0.7, 0.6, 0.85, 0.9, 0.75, 0.4, 0.3, 0.65, 0.8, 0.7, 0.6, 0.5, 0.85, 0.95, 0.6, 0.4, 0.5, 0.7],
      tags: ['Private', 'Internal', 'Voice Memo'],
      transcript: 'Our retention jumped thirty percent after launching the kinetic captions engine. The focus now is instant audio-to-scene conversion.'
    },
    {
      id: 'audio-seed-3',
      title: 'Mindful Morning Breathing Guide',
      description: 'Calm guided audio clip for mindful breathing and stress reduction. Shared via unlisted direct link with beta testers.',
      visibility: 'unlisted',
      audioUrl: '',
      audioBlob: generatePlaceholderBlob(280, 28),
      mimeType: 'audio/wav',
      fileName: 'mindful_breathing_clip.wav',
      fileSize: 1240000,
      duration: 28,
      createdAt: Date.now() - 3600000 * 48,
      waveformPeaks: [0.15, 0.25, 0.4, 0.55, 0.7, 0.6, 0.45, 0.3, 0.2, 0.35, 0.6, 0.75, 0.8, 0.65, 0.5, 0.35, 0.2, 0.4, 0.6, 0.5],
      tags: ['Mindfulness', 'Meditation', 'Unlisted'],
      transcript: 'Inhale deeply through your nose for four seconds. Hold the stillness. And release all tension as you exhale completely.'
    }
  ];

  for (const seed of seeds) {
    seed.audioUrl = URL.createObjectURL(seed.audioBlob!);
    await saveAudioUpload(seed);
  }

  return seeds;
}
