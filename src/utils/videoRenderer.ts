import { VideoProject, Scene } from '../types/video';
import { audioSynthesizer } from './audioSynthesizer';

export interface RenderProgress {
  progress: number; // 0 to 100
  currentScene: number;
  totalScenes: number;
  status: string;
}

export class VideoRenderer {
  private isRendering = false;
  private cancelRequested = false;

  public async exportVideo(
    project: VideoProject,
    onProgress: (progress: RenderProgress) => void
  ): Promise<{ blob: Blob; url: string }> {
    this.isRendering = true;
    this.cancelRequested = false;

    // Dimensions based on aspect ratio
    let width = 720;
    let height = 1280; // 9:16 default
    if (project.aspectRatio === '16:9') {
      width = 1280;
      height = 720;
    } else if (project.aspectRatio === '1:1') {
      width = 1080;
      height = 1080;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // 1. Preload scene images
    onProgress({ progress: 5, currentScene: 1, totalScenes: project.scenes.length, status: 'Pre-loading visual assets...' });
    const loadedImages: HTMLImageElement[] = [];

    for (let i = 0; i < project.scenes.length; i++) {
      const scene = project.scenes[i];
      const img = new Image();
      img.crossOrigin = 'anonymous';

      const imgPromise = new Promise<HTMLImageElement>((resolve) => {
        img.onload = () => resolve(img);
        img.onerror = () => {
          // Generate fallback visual canvas
          const fbCanvas = document.createElement('canvas');
          fbCanvas.width = width;
          fbCanvas.height = height;
          const fbCtx = fbCanvas.getContext('2d')!;
          const grad = fbCtx.createLinearGradient(0, 0, width, height);
          grad.addColorStop(0, '#0f172a');
          grad.addColorStop(0.5, '#1e1b4b');
          grad.addColorStop(1, '#020617');
          fbCtx.fillStyle = grad;
          fbCtx.fillRect(0, 0, width, height);
          const fallbackImg = new Image();
          fallbackImg.src = fbCanvas.toDataURL();
          fallbackImg.onload = () => resolve(fallbackImg);
        };
      });

      img.src = scene.imageUrl;
      const loaded = await imgPromise;
      loadedImages.push(loaded);
    }

    // Total duration calculation
    const totalDuration = project.scenes.reduce((sum, s) => sum + s.duration, 0);

    // 2. Setup Audio recording stream
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioDest = audioCtx.createMediaStreamDestination();

    // Start BGM if requested
    if (project.bgmTrack !== 'none') {
      audioSynthesizer.start(project.bgmTrack, project.bgmVolume);
      // Wait a moment for audio graph to settle
    }

    // 3. Setup Canvas stream and MediaRecorder
    const canvasStream = canvas.captureStream(30);
    const combinedTracks: MediaStreamTrack[] = [
      ...canvasStream.getVideoTracks(),
      ...audioDest.stream.getAudioTracks(),
    ];
    const combinedStream = new MediaStream(combinedTracks);

    const mimeTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4',
    ];
    let selectedMime = 'video/webm';
    for (const m of mimeTypes) {
      if (MediaRecorder.isTypeSupported(m)) {
        selectedMime = m;
        break;
      }
    }

    const recordedChunks: Blob[] = [];
    const mediaRecorder = new MediaRecorder(combinedStream, {
      mimeType: selectedMime,
      videoBitsPerSecond: 4_500_000,
    });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };

    mediaRecorder.start(200);

    // 4. Render Frame Loop
    const fps = 30;
    const totalFrames = Math.ceil(totalDuration * fps);
    let currentFrame = 0;

    let sceneStartTime = 0;
    let sceneIndex = 0;

    return new Promise((resolve, reject) => {
      const renderNextStep = () => {
        if (this.cancelRequested) {
          mediaRecorder.stop();
          audioSynthesizer.stop();
          return reject(new Error('Export cancelled'));
        }

        if (currentFrame >= totalFrames) {
          mediaRecorder.onstop = () => {
            audioSynthesizer.stop();
            const videoBlob = new Blob(recordedChunks, { type: selectedMime });
            const videoUrl = URL.createObjectURL(videoBlob);
            this.isRendering = false;
            resolve({ blob: videoBlob, url: videoUrl });
          };
          mediaRecorder.stop();
          return;
        }

        const currentTime = currentFrame / fps;

        // Find current scene
        let accumulated = 0;
        for (let i = 0; i < project.scenes.length; i++) {
          if (currentTime < accumulated + project.scenes[i].duration || i === project.scenes.length - 1) {
            sceneIndex = i;
            sceneStartTime = accumulated;
            break;
          }
          accumulated += project.scenes[i].duration;
        }

        const currentScene = project.scenes[sceneIndex];
        const sceneLocalTime = currentTime - sceneStartTime;
        const sceneProgress = Math.min(1, Math.max(0, sceneLocalTime / currentScene.duration));
        const img = loadedImages[sceneIndex] || loadedImages[0];

        // Draw Scene Frame
        this.drawSceneFrame(
          ctx,
          width,
          height,
          currentScene,
          img,
          sceneProgress,
          project,
          sceneIndex,
          currentTime
        );

        currentFrame++;
        const percent = Math.min(99, Math.round((currentFrame / totalFrames) * 100));

        if (currentFrame % 5 === 0) {
          onProgress({
            progress: percent,
            currentScene: sceneIndex + 1,
            totalScenes: project.scenes.length,
            status: `Rendering frame ${currentFrame}/${totalFrames} (${percent}%)`,
          });
        }

        // Run next frame with requestAnimationFrame / setTimeout
        requestAnimationFrame(renderNextStep);
      };

      renderNextStep();
    });
  }

  private drawSceneFrame(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    scene: Scene,
    img: HTMLImageElement,
    progress: number,
    project: VideoProject,
    sceneIndex: number,
    globalTime: number
  ) {
    ctx.save();
    ctx.clearRect(0, 0, width, height);

    // 1. Ken Burns Camera Motion
    ctx.save();
    let scale = 1.0;
    let translateX = 0;
    let translateY = 0;

    switch (scene.cameraMotion) {
      case 'zoom_in':
        scale = 1.05 + progress * 0.15;
        break;
      case 'zoom_out':
        scale = 1.2 - progress * 0.15;
        break;
      case 'pan_left':
        scale = 1.15;
        translateX = (1 - progress * 2) * (width * 0.05);
        break;
      case 'pan_right':
        scale = 1.15;
        translateX = (progress * 2 - 1) * (width * 0.05);
        break;
      case 'drift':
      default:
        scale = 1.08 + Math.sin(progress * Math.PI) * 0.05;
        translateY = Math.cos(progress * Math.PI) * 15;
        break;
    }

    ctx.translate(width / 2, height / 2);
    ctx.scale(scale, scale);
    ctx.translate(-width / 2 + translateX, -height / 2 + translateY);

    // Draw background image centered with cover aspect ratio
    const imgRatio = img.width / (img.height || 1);
    const canvasRatio = width / height;
    let sWidth = img.width;
    let sHeight = img.height;
    let sx = 0;
    let sy = 0;

    if (imgRatio > canvasRatio) {
      sWidth = img.height * canvasRatio;
      sx = (img.width - sWidth) / 2;
    } else {
      sHeight = img.width / canvasRatio;
      sy = (img.height - sHeight) / 2;
    }

    try {
      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, width, height);
    } catch (e) {
      // Fallback background
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, width, height);
    }
    ctx.restore();

    // 2. Cinematic Vignette & Lighting
    const grad = ctx.createRadialGradient(
      width / 2,
      height / 2,
      width * 0.25,
      width / 2,
      height / 2,
      width * 0.85
    );
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.15)');
    grad.addColorStop(0.65, 'rgba(0, 0, 0, 0.45)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.88)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Subtle dark gradient for subtitles at bottom/center
    const subtitleGrad = ctx.createLinearGradient(0, height * 0.45, 0, height);
    subtitleGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    subtitleGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.4)');
    subtitleGrad.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
    ctx.fillStyle = subtitleGrad;
    ctx.fillRect(0, height * 0.45, width, height * 0.55);

    // 3. Floating Ambient Particles (gives cinematic movement)
    this.drawParticles(ctx, width, height, globalTime);

    // 4. Chapter / Scene Badge at top
    this.drawBadge(ctx, width, height, scene.badge || `0${sceneIndex + 1} // SCENE`);

    // 5. Audio Waveform Overlay
    if (project.visualizerStyle !== 'off') {
      this.drawWaveform(ctx, width, height, project.visualizerStyle, globalTime);
    }

    // 6. Kinetic Subtitle Engine
    this.drawCaptions(ctx, width, height, scene, progress, project.captionTheme, project.captionPosition);

    // 7. Transition effect if near start of scene (< 0.4s)
    if (progress < 0.12 && sceneIndex > 0) {
      this.drawTransition(ctx, width, height, scene.transition, progress / 0.12);
    }

    ctx.restore();
  }

  private drawParticles(ctx: CanvasRenderingContext2D, width: number, height: number, time: number) {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    const particleCount = 20;
    for (let i = 0; i < particleCount; i++) {
      const speed = 15 + (i % 5) * 10;
      const x = (i * 97 + time * speed) % width;
      const y = (i * 137 + Math.sin(time + i) * 30 + height) % height;
      const radius = 1 + (i % 3) * 0.8;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawBadge(ctx: CanvasRenderingContext2D, width: number, _height: number, text: string) {
    ctx.save();
    const paddingX = 14;
    const paddingY = 8;
    ctx.font = '600 13px "Space Grotesk", sans-serif';
    const textWidth = ctx.measureText(text.toUpperCase()).width;
    const boxW = textWidth + paddingX * 2;
    const boxH = 28;
    const x = width / 2 - boxW / 2;
    const y = 48;

    // Glowing badge pill
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, boxW, boxH, 14);
    ctx.fill();
    ctx.stroke();

    // Red recording dot inside badge
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(x + 14, y + boxH / 2, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Badge text
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text.toUpperCase(), x + 24, y + boxH / 2);
    ctx.restore();
  }

  private drawWaveform(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    style: string,
    time: number
  ) {
    ctx.save();
    const y = height * 0.84;

    if (style === 'bars') {
      const barCount = 36;
      const totalWidth = width * 0.7;
      const barWidth = totalWidth / barCount - 3;
      const startX = (width - totalWidth) / 2;

      for (let i = 0; i < barCount; i++) {
        const offset = i * 0.2;
        const heightMultiplier = Math.sin(time * 6 + offset) * 0.5 + Math.cos(time * 4 - offset) * 0.5;
        const barHeight = 8 + Math.abs(heightMultiplier) * 36;
        const bx = startX + i * (barWidth + 3);

        const grad = ctx.createLinearGradient(0, y - barHeight / 2, 0, y + barHeight / 2);
        grad.addColorStop(0, '#06b6d4');
        grad.addColorStop(1, '#8b5cf6');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(bx, y - barHeight / 2, barWidth, barHeight, 2);
        ctx.fill();
      }
    } else if (style === 'wave') {
      ctx.beginPath();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 10;

      const waveWidth = width * 0.8;
      const startX = (width - waveWidth) / 2;

      for (let x = 0; x <= waveWidth; x += 5) {
        const angle = (x / 20) + time * 8;
        const waveY = y + Math.sin(angle) * 16 * Math.sin(x / waveWidth * Math.PI);
        if (x === 0) ctx.moveTo(startX + x, waveY);
        else ctx.lineTo(startX + x, waveY);
      }
      ctx.stroke();
    } else if (style === 'circle') {
      const centerX = width / 2;
      const centerY = height * 0.5;
      const radius = 60 + Math.sin(time * 5) * 6;

      ctx.beginPath();
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
      ctx.lineWidth = 2;
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
      ctx.arc(centerX, centerY, radius + 15, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawCaptions(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    scene: Scene,
    progress: number,
    theme: string,
    position: 'bottom' | 'center' | 'top'
  ) {
    const words = scene.text.split(' ');
    if (words.length === 0) return;

    // Highlight current active word based on speech progress
    const activeWordIndex = Math.min(words.length - 1, Math.floor(progress * words.length));

    ctx.save();
    let yPos = height * 0.72;
    if (position === 'center') yPos = height * 0.52;
    if (position === 'top') yPos = height * 0.28;

    // Word wrap into lines
    const fontSize = width < 800 ? 32 : 42;
    ctx.font = `900 ${fontSize}px "Space Grotesk", "Plus Jakarta Sans", sans-serif`;
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
      // Calculate start X for word-by-word positioning
      const lineMetrics = ctx.measureText(line.text);
      let wordStartX = width / 2 - lineMetrics.width / 2;

      line.words.forEach((item) => {
        const wordText = item.word;
        const wordWidth = ctx.measureText(wordText).width;
        const spaceWidth = ctx.measureText(' ').width;
        const isActive = item.globalIndex === activeWordIndex;
        const isKeyword = scene.keywords.some(
          (k) => wordText.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(wordText.toLowerCase())
        );

        ctx.save();
        const wordCenterX = wordStartX + wordWidth / 2;
        const wordCenterY = startY + lineHeight / 2;

        if (isActive) {
          // Subtle scale punch on active word
          ctx.translate(wordCenterX, wordCenterY);
          ctx.scale(1.12, 1.12);
          ctx.translate(-wordCenterX, -wordCenterY);
        }

        // Draw Subtitle Style Themes
        if (theme === 'viral_yellow') {
          // Alex Hormozi style: Thick black stroke + electric yellow on active
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 8;
          ctx.lineJoin = 'miter';
          ctx.strokeText(wordText.toUpperCase(), wordCenterX, wordCenterY);

          if (isActive) {
            ctx.fillStyle = '#facc15'; // Vibrant yellow
            ctx.shadowColor = '#eab308';
            ctx.shadowBlur = 15;
          } else if (isKeyword) {
            ctx.fillStyle = '#4ade80'; // Emerald green
          } else {
            ctx.fillStyle = '#ffffff';
          }
          ctx.fillText(wordText.toUpperCase(), wordCenterX, wordCenterY);
        } else if (theme === 'cyber_neon') {
          ctx.strokeStyle = '#050505';
          ctx.lineWidth = 6;
          ctx.strokeText(wordText, wordCenterX, wordCenterY);

          if (isActive) {
            ctx.fillStyle = '#22d3ee';
            ctx.shadowColor = '#06b6d4';
            ctx.shadowBlur = 20;
          } else {
            ctx.fillStyle = '#e2e8f0';
          }
          ctx.fillText(wordText, wordCenterX, wordCenterY);
        } else if (theme === 'punchy_red') {
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 8;
          ctx.strokeText(wordText.toUpperCase(), wordCenterX, wordCenterY);

          if (isActive) {
            ctx.fillStyle = '#ef4444';
            ctx.shadowColor = '#dc2626';
            ctx.shadowBlur = 18;
          } else {
            ctx.fillStyle = '#ffffff';
          }
          ctx.fillText(wordText.toUpperCase(), wordCenterX, wordCenterY);
        } else if (theme === 'cinema_box') {
          // Pill background behind active word
          if (isActive) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
            ctx.beginPath();
            ctx.roundRect(wordStartX - 6, wordCenterY - fontSize / 2 - 2, wordWidth + 12, fontSize + 4, 6);
            ctx.fill();
            ctx.fillStyle = '#0f172a';
          } else {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 8;
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

  private drawTransition(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    transition: string,
    progress: number
  ) {
    const alpha = 1 - progress; // 1 to 0
    ctx.save();
    if (transition === 'flash') {
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.85})`;
      ctx.fillRect(0, 0, width, height);
    } else if (transition === 'glitch') {
      const sliceH = height / 8;
      for (let i = 0; i < 8; i++) {
        if (Math.random() > 0.4) {
          ctx.fillStyle = i % 2 === 0 ? `rgba(6, 182, 212, ${alpha * 0.4})` : `rgba(239, 68, 68, ${alpha * 0.4})`;
          const shift = (Math.random() - 0.5) * 40 * alpha;
          ctx.fillRect(shift, i * sliceH, width, sliceH);
        }
      }
    } else if (transition === 'slide') {
      ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.7})`;
      ctx.fillRect(0, 0, width * alpha, height);
    }
    ctx.restore();
  }

  public cancel() {
    this.cancelRequested = true;
    this.isRendering = false;
  }

  // Export cover snapshot as image URL
  public captureSnapshot(project: VideoProject, sceneIndex = 0): string {
    const canvas = document.createElement('canvas');
    canvas.width = project.aspectRatio === '16:9' ? 1280 : project.aspectRatio === '1:1' ? 1080 : 720;
    canvas.height = project.aspectRatio === '16:9' ? 720 : project.aspectRatio === '1:1' ? 1080 : 1280;
    const ctx = canvas.getContext('2d')!;

    const scene = project.scenes[sceneIndex] || project.scenes[0];
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(1, '#020617');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(project.title, canvas.width / 2, canvas.height * 0.45);

    // Subtitle
    ctx.fillStyle = '#38bdf8';
    ctx.font = '500 24px sans-serif';
    ctx.fillText(scene?.text || '', canvas.width / 2, canvas.height * 0.55);

    return canvas.toDataURL('image/png');
  }
}

export const videoRenderer = new VideoRenderer();
