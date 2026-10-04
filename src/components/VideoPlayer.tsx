import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Sparkles,
  Repeat
} from 'lucide-react';
import { VideoProject, Scene } from '../types/video';
import { audioSynthesizer } from '../utils/audioSynthesizer';
import { speechEngine } from '../utils/speechEngine';

interface VideoPlayerProps {
  project: VideoProject;
  activeSceneIndex: number;
  onSceneChange: (index: number) => void;
  onEditScene: (scene: Scene, index: number) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  project,
  activeSceneIndex,
  onSceneChange,
  onEditScene
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLooping, setIsLooping] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Map<string, HTMLImageElement>>(new Map());

  const totalDuration = project.scenes.reduce((sum, s) => sum + s.duration, 0);

  // Pre-load scene images into memory for zero lag
  useEffect(() => {
    const map = new Map<string, HTMLImageElement>();
    project.scenes.forEach((sc) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = sc.imageUrl;
      map.set(sc.id, img);
    });
    setLoadedImages(map);
  }, [project.scenes]);

  // Find active scene index based on playback time
  const getSceneAtTime = useCallback(
    (time: number): { scene: Scene; index: number; localTime: number } => {
      let accumulated = 0;
      for (let i = 0; i < project.scenes.length; i++) {
        const sc = project.scenes[i];
        if (time < accumulated + sc.duration || i === project.scenes.length - 1) {
          return {
            scene: sc,
            index: i,
            localTime: Math.max(0, time - accumulated),
          };
        }
        accumulated += sc.duration;
      }
      const lastIndex = project.scenes.length - 1;
      return {
        scene: project.scenes[lastIndex],
        index: lastIndex,
        localTime: project.scenes[lastIndex].duration,
      };
    },
    [project.scenes]
  );

  // Synchronize active scene selection with parent
  useEffect(() => {
    const current = getSceneAtTime(currentTime);
    if (current.index !== activeSceneIndex) {
      onSceneChange(current.index);
    }
  }, [currentTime, getSceneAtTime, activeSceneIndex, onSceneChange]);

  // Main Render Loop (Draws Canvas)
  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const { scene, index: sceneIndex, localTime } = getSceneAtTime(currentTime);
    const progress = Math.min(1, Math.max(0, localTime / (scene?.duration || 4)));
    const img = scene ? loadedImages.get(scene.id) : null;

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    // 1. Ken Burns Camera Movement
    ctx.save();
    let scale = 1.0;
    let translateX = 0;
    let translateY = 0;

    const motion = scene?.cameraMotion || 'zoom_in';
    switch (motion) {
      case 'zoom_in':
        scale = 1.04 + progress * 0.14;
        break;
      case 'zoom_out':
        scale = 1.18 - progress * 0.14;
        break;
      case 'pan_left':
        scale = 1.15;
        translateX = (1 - progress * 2) * (width * 0.04);
        break;
      case 'pan_right':
        scale = 1.15;
        translateX = (progress * 2 - 1) * (width * 0.04);
        break;
      case 'drift':
      default:
        scale = 1.08 + Math.sin(progress * Math.PI) * 0.04;
        translateY = Math.cos(progress * Math.PI) * 12;
        break;
    }

    ctx.translate(width / 2, height / 2);
    ctx.scale(scale, scale);
    ctx.translate(-width / 2 + translateX, -height / 2 + translateY);

    if (img && img.complete && img.naturalWidth > 0) {
      const imgRatio = img.naturalWidth / img.naturalHeight;
      const canvasRatio = width / height;
      let sWidth = img.naturalWidth;
      let sHeight = img.naturalHeight;
      let sx = 0;
      let sy = 0;

      if (imgRatio > canvasRatio) {
        sWidth = img.naturalHeight * canvasRatio;
        sx = (img.naturalWidth - sWidth) / 2;
      } else {
        sHeight = img.naturalWidth / canvasRatio;
        sy = (img.naturalHeight - sHeight) / 2;
      }

      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, width, height);
    } else {
      // Elegant futuristic dark fallback gradient
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#090d16');
      grad.addColorStop(0.5, '#121828');
      grad.addColorStop(1, '#05070c');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }
    ctx.restore();

    // 2. Cinematic Vignette
    const vignette = ctx.createRadialGradient(
      width / 2,
      height / 2,
      width * 0.28,
      width / 2,
      height / 2,
      width * 0.88
    );
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0.12)');
    vignette.addColorStop(0.65, 'rgba(0, 0, 0, 0.48)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.88)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    // Dark gradient backdrop for captions
    const subGrad = ctx.createLinearGradient(0, height * 0.4, 0, height);
    subGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    subGrad.addColorStop(0.55, 'rgba(0, 0, 0, 0.45)');
    subGrad.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
    ctx.fillStyle = subGrad;
    ctx.fillRect(0, height * 0.4, width, height * 0.6);

    // 3. Subtle floating particles
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    for (let i = 0; i < 22; i++) {
      const speed = 12 + (i % 6) * 8;
      const x = (i * 91 + currentTime * speed) % width;
      const y = (i * 127 + Math.sin(currentTime + i) * 25 + height) % height;
      ctx.beginPath();
      ctx.arc(x, y, 1.2 + (i % 2) * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 4. Chapter / Scene Badge at top
    if (scene) {
      ctx.save();
      const badgeText = (scene.badge || `PART 0${sceneIndex + 1}`).toUpperCase();
      ctx.font = '600 13px "Space Grotesk", sans-serif';
      const textWidth = ctx.measureText(badgeText).width;
      const boxW = textWidth + 30;
      const boxH = 28;
      const bx = width / 2 - boxW / 2;
      const by = 36;

      ctx.fillStyle = 'rgba(10, 15, 25, 0.85)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(bx, by, boxW, boxH, 14);
      ctx.fill();
      ctx.stroke();

      // Recording dot
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(bx + 14, by + boxH / 2, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeText, bx + 24, by + boxH / 2);
      ctx.restore();
    }

    // 5. Audio Waveform Overlay
    if (project.visualizerStyle !== 'off') {
      ctx.save();
      const wy = height * 0.85;
      const barCount = 36;
      const totalWidth = width * 0.72;
      const barWidth = totalWidth / barCount - 3;
      const startX = (width - totalWidth) / 2;

      for (let i = 0; i < barCount; i++) {
        const offset = i * 0.25;
        const wave = Math.sin(currentTime * 8 + offset) * 0.5 + Math.cos(currentTime * 5 - offset) * 0.5;
        const bHeight = isPlaying ? 8 + Math.abs(wave) * 36 : 6;
        const bx = startX + i * (barWidth + 3);

        const barGrad = ctx.createLinearGradient(0, wy - bHeight / 2, 0, wy + bHeight / 2);
        barGrad.addColorStop(0, '#06b6d4');
        barGrad.addColorStop(1, '#8b5cf6');

        ctx.fillStyle = barGrad;
        ctx.beginPath();
        ctx.roundRect(bx, wy - bHeight / 2, barWidth, bHeight, 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 6. Kinetic Subtitle Engine
    if (scene && scene.text) {
      const words = scene.text.split(' ');
      const activeWordIndex = Math.min(words.length - 1, Math.floor(progress * words.length));

      ctx.save();
      let yPos = height * 0.68;
      if (project.captionPosition === 'center') yPos = height * 0.52;
      if (project.captionPosition === 'top') yPos = height * 0.26;

      const fontSize = width < 800 ? 32 : 40;
      ctx.font = `900 ${fontSize}px "Space Grotesk", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const maxLineWidth = width * 0.88;
      const lines: Array<{ text: string; words: Array<{ word: string; globalIndex: number }> }> = [];
      let currentLineWords: Array<{ word: string; globalIndex: number }> = [];
      let currentLineText = '';

      words.forEach((word, idx) => {
        const testLine = currentLineText ? `${currentLineText} ${word}` : word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxLineWidth && currentLineWords.length > 0) {
          lines.push({ text: currentLineText, words: currentLineWords });
          currentLineWords = [{ word, globalIndex: idx }];
          currentLineText = word;
        } else {
          currentLineWords.push({ word, globalIndex: idx });
          currentLineText = testLine;
        }
      });
      if (currentLineWords.length > 0) {
        lines.push({ text: currentLineText, words: currentLineWords });
      }

      const lineHeight = fontSize * 1.35;
      const totalBlockHeight = lines.length * lineHeight;
      let startY = yPos - totalBlockHeight / 2;

      lines.forEach((line) => {
        const lineMetrics = ctx.measureText(line.text);
        let wordStartX = width / 2 - lineMetrics.width / 2;

        line.words.forEach((item) => {
          const wordText = item.word;
          const wordWidth = ctx.measureText(wordText).width;
          const spaceWidth = ctx.measureText(' ').width;
          const isActive = item.globalIndex === activeWordIndex;
          const isKeyword = (scene.keywords || []).some(
            (k) =>
              wordText.toLowerCase().includes(k.toLowerCase()) ||
              k.toLowerCase().includes(wordText.toLowerCase())
          );

          ctx.save();
          const wordCenterX = wordStartX + wordWidth / 2;
          const wordCenterY = startY + lineHeight / 2;

          if (isActive) {
            ctx.translate(wordCenterX, wordCenterY);
            ctx.scale(1.1, 1.1);
            ctx.translate(-wordCenterX, -wordCenterY);
          }

          if (project.captionTheme === 'viral_yellow') {
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 7;
            ctx.strokeText(wordText.toUpperCase(), wordCenterX, wordCenterY);

            if (isActive) {
              ctx.fillStyle = '#facc15';
              ctx.shadowColor = '#eab308';
              ctx.shadowBlur = 14;
            } else if (isKeyword) {
              ctx.fillStyle = '#4ade80';
            } else {
              ctx.fillStyle = '#ffffff';
            }
            ctx.fillText(wordText.toUpperCase(), wordCenterX, wordCenterY);
          } else if (project.captionTheme === 'punchy_red') {
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 7;
            ctx.strokeText(wordText.toUpperCase(), wordCenterX, wordCenterY);
            ctx.fillStyle = isActive ? '#ef4444' : '#ffffff';
            ctx.fillText(wordText.toUpperCase(), wordCenterX, wordCenterY);
          } else if (project.captionTheme === 'cyber_neon') {
            ctx.strokeStyle = '#020617';
            ctx.lineWidth = 6;
            ctx.strokeText(wordText, wordCenterX, wordCenterY);
            ctx.fillStyle = isActive ? '#22d3ee' : '#e2e8f0';
            if (isActive) {
              ctx.shadowColor = '#06b6d4';
              ctx.shadowBlur = 18;
            }
            ctx.fillText(wordText, wordCenterX, wordCenterY);
          } else {
            // modern_clean
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.lineWidth = 5;
            ctx.strokeText(wordText, wordCenterX, wordCenterY);
            ctx.fillStyle = isActive ? '#38bdf8' : '#ffffff';
            ctx.fillText(wordText, wordCenterX, wordCenterY);
          }

          ctx.restore();
          wordStartX += wordWidth + spaceWidth;
        });

        startY += lineHeight;
      });
      ctx.restore();
    }

    ctx.restore();
  }, [currentTime, getSceneAtTime, loadedImages, project, isPlaying]);

  // Request Animation Frame playback loop
  useEffect(() => {
    let animId: number;
    let lastStamp: number | null = null;

    const tick = (stamp: number) => {
      if (lastStamp !== null && isPlaying) {
        const delta = (stamp - lastStamp) / 1000;
        setCurrentTime((prev) => {
          const next = prev + delta;
          if (next >= totalDuration) {
            if (isLooping) {
              return 0;
            } else {
              setIsPlaying(false);
              audioSynthesizer.stop();
              speechEngine.stop();
              return totalDuration;
            }
          }
          return next;
        });
      }
      lastStamp = stamp;
      drawFrame();
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, totalDuration, isLooping, drawFrame]);

  // Play / Pause handler with audio integration
  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      audioSynthesizer.stop();
      speechEngine.stop();
      if (audioRef.current) audioRef.current.pause();
    } else {
      if (currentTime >= totalDuration - 0.2) {
        setCurrentTime(0);
      }
      setIsPlaying(true);

      // Start BGM procedural music if enabled
      if (!isMuted && project.bgmTrack !== 'none') {
        audioSynthesizer.start(project.bgmTrack, project.bgmVolume);
      }

      // Voice Narration:
      if (project.originalAudioUrl && audioRef.current) {
        audioRef.current.currentTime = currentTime;
        audioRef.current.play().catch(e => console.warn(e));
      } else {
        // Use SpeechEngine for active scene narration
        const current = getSceneAtTime(currentTime);
        if (current.scene) {
          speechEngine.speak(current.scene.text, {
            voiceName: project.voiceName,
            pitch: project.voicePitch,
            rate: project.voiceRate,
          });
        }
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
    const current = getSceneAtTime(val);
    if (isPlaying) {
      speechEngine.speak(current.scene.text, {
        voiceName: project.voiceName,
        pitch: project.voicePitch,
        rate: project.voiceRate,
      });
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 10);
    return `${m}:${s < 10 ? '0' : ''}${s}.${ms}`;
  };

  // Dimensions based on aspect ratio
  const getContainerDimensions = () => {
    if (project.aspectRatio === '9:16') {
      return 'aspect-[9/16] max-h-[580px] w-auto';
    } else if (project.aspectRatio === '16:9') {
      return 'aspect-[16/9] w-full max-w-3xl';
    } else {
      return 'aspect-square max-h-[500px] w-auto';
    }
  };

  const currentSceneData = getSceneAtTime(currentTime);

  return (
    <div className="flex flex-col items-center w-full space-y-4">
      {/* Hidden audio element if original audio exists */}
      {project.originalAudioUrl && (
        <audio ref={audioRef} src={project.originalAudioUrl} className="hidden" />
      )}

      {/* Main Video Viewport */}
      <div className="relative flex items-center justify-center w-full">
        <div
          className={`relative rounded-3xl overflow-hidden shadow-2xl shadow-cyan-950/40 border-2 border-slate-800 bg-[#080b12] group ${getContainerDimensions()}`}
        >
          <canvas
            ref={canvasRef}
            width={project.aspectRatio === '16:9' ? 1280 : project.aspectRatio === '1:1' ? 1080 : 720}
            height={project.aspectRatio === '16:9' ? 720 : project.aspectRatio === '1:1' ? 1080 : 1280}
            className="w-full h-full object-contain cursor-pointer"
            onClick={togglePlay}
          />

          {/* Center Play Overlay Icon when paused */}
          {!isPlaying && (
            <div
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/35 backdrop-blur-[2px] cursor-pointer transition-opacity"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-xl shadow-cyan-500/30 hover:scale-110 active:scale-95 transition-all">
                <Play className="w-8 h-8 ml-1" />
              </div>
            </div>
          )}

          {/* Quick Scene Inspector Action Pill */}
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEditScene(currentSceneData.scene, currentSceneData.index)}
              className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-xs font-semibold hover:border-cyan-400 hover:text-cyan-300 transition-all flex items-center gap-1.5 shadow-lg"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Edit Scene</span>
            </button>
          </div>
        </div>
      </div>

      {/* Video Control Bar */}
      <div className="w-full max-w-3xl bg-[#0f1422] border border-slate-800/90 rounded-2xl p-4 shadow-xl space-y-3">
        {/* Scrubber Progress Bar */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-medium text-cyan-400 min-w-[50px]">
            {formatTime(currentTime)}
          </span>

          <div className="relative flex-1 flex items-center">
            <input
              type="range"
              min="0"
              max={totalDuration || 1}
              step="0.05"
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
            />
          </div>

          <span className="text-xs font-mono font-medium text-slate-400 min-w-[50px] text-right">
            {formatTime(totalDuration)}
          </span>
        </div>

        {/* Playback Controls & Utility Toggles */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20 hover:scale-105 active:scale-95 transition-all"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>

            <button
              onClick={() => {
                setCurrentTime(0);
                if (audioRef.current) audioRef.current.currentTime = 0;
              }}
              title="Restart from beginning"
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsLooping(!isLooping)}
              title="Toggle Loop"
              className={`p-2 rounded-lg transition-colors ${
                isLooping ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Repeat className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsMuted(!isMuted)}
              title="Mute / Unmute"
              className={`p-2 rounded-lg transition-colors ${
                isMuted ? 'text-rose-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Current Scene Indicator */}
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span className="font-semibold text-white">
              Scene {currentSceneData.index + 1} of {project.scenes.length}
            </span>
            <span className="hidden sm:inline px-2 py-0.5 rounded-md bg-slate-800 text-[11px] text-cyan-300">
              {currentSceneData.scene?.cameraMotion}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
