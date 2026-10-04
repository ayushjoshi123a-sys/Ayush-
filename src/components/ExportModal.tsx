import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  Download,
  Share2,
  CheckCircle2,
  Sparkles,
  Image,
  FileText,
  Loader2,
  Film
} from 'lucide-react';
import { VideoProject } from '../types/video';
import { videoRenderer, RenderProgress } from '../utils/videoRenderer';

interface ExportModalProps {
  project: VideoProject;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  project,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const [isExporting, setIsExporting] = useState(false);
  const [progressData, setProgressData] = useState<RenderProgress>({
    progress: 0,
    currentScene: 1,
    totalScenes: project.scenes.length,
    status: 'Initializing frame engine...'
  });
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);
  const [exportedBlob, setExportedBlob] = useState<Blob | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  // Auto trigger export when opened if not yet exported
  useEffect(() => {
    let cancelled = false;

    const runExport = async () => {
      setIsExporting(true);
      setExportedVideoUrl(null);
      setExportedBlob(null);

      // Generate cover snapshot
      const thumb = videoRenderer.captureSnapshot(project);
      setThumbnailUrl(thumb);

      try {
        const result = await videoRenderer.exportVideo(project, (prog) => {
          if (!cancelled) {
            setProgressData(prog);
          }
        });

        if (!cancelled) {
          setExportedBlob(result.blob);
          setExportedVideoUrl(result.url);
          setIsExporting(false);

          // Confetti celebration
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      } catch (err) {
        console.error('Export failed:', err);
        setIsExporting(false);
      }
    };

    runExport();

    return () => {
      cancelled = true;
      videoRenderer.cancel();
    };
  }, [project]);

  const handleDownloadVideo = () => {
    if (!exportedVideoUrl) return;
    const cleanTitle = project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const a = document.createElement('a');
    a.href = exportedVideoUrl;
    a.download = `${cleanTitle}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadThumbnail = () => {
    if (!thumbnailUrl) return;
    const cleanTitle = project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const a = document.createElement('a');
    a.href = thumbnailUrl;
    a.download = `${cleanTitle}-cover.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadTranscript = () => {
    const fullTranscript = project.scenes
      .map((s, i) => `[Scene ${i + 1} - ${s.badge}]\n${s.text}\n`)
      .join('\n');

    const blob = new Blob([fullTranscript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const cleanTitle = project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cleanTitle}-transcript.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#0f1422] border border-cyan-500/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#141a2a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Export Video</h2>
              <p className="text-xs text-slate-400">Rendering frame-accurate synchronized video</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {isExporting ? (
            <div className="space-y-6 text-center py-6">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 animate-pulse" />
                <div
                  className="w-full h-full rounded-full border-4 border-transparent border-t-cyan-400 animate-spin"
                  style={{ animationDuration: '0.8s' }}
                />
                <div className="absolute inset-0 flex items-center justify-center font-mono font-bold text-sm text-cyan-300">
                  {progressData.progress}%
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">
                  Rendering Video Scenes...
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  {progressData.status}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 rounded-full transition-all duration-150"
                  style={{ width: `${progressData.progress}%` }}
                />
              </div>

              <p className="text-[11px] text-slate-500">
                Combining Ken Burns motion, particles, sound ducking, and kinetic subtitles.
              </p>
            </div>
          ) : exportedVideoUrl ? (
            <div className="space-y-5 animate-fadeIn">
              {/* Success Banner */}
              <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400">
                <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-bold">Video Successfully Rendered!</h4>
                  <p className="text-xs text-emerald-400/80">
                    High-definition video with synchronized voice & kinetic subtitles is ready.
                  </p>
                </div>
              </div>

              {/* Video Player Preview */}
              <div className="rounded-2xl overflow-hidden border border-slate-800 bg-black aspect-video relative">
                <video
                  src={exportedVideoUrl}
                  controls
                  autoPlay
                  loop
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Aspect Ratio</span>
                  <span className="font-bold text-white font-mono">{project.aspectRatio}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Scenes</span>
                  <span className="font-bold text-white font-mono">{project.scenes.length}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Size</span>
                  <span className="font-bold text-white font-mono">
                    {exportedBlob ? formatFileSize(exportedBlob.size) : 'Ready'}
                  </span>
                </div>
              </div>

              {/* Download Actions */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={handleDownloadVideo}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 text-white shadow-xl shadow-cyan-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Video (.webm)</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleDownloadThumbnail}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                  >
                    <Image className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Download Cover</span>
                  </button>

                  <button
                    onClick={handleDownloadTranscript}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Export Script</span>
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
