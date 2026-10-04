import React, { useState, useRef } from 'react';
import {
  Upload,
  Music,
  Lock,
  Globe,
  Link2,
  X,
  Play,
  Pause,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { VisibilitySetting, AudioUploadItem } from '../types/audio';
import { extractWaveform, getAudioDuration, saveAudioUpload } from '../utils/audioStorage';

interface AudioUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (item: AudioUploadItem, shouldGenerateVideo: boolean) => void;
}

export const AudioUploadModal: React.FC<AudioUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<VisibilitySetting>('public');
  const [tags, setTags] = useState<string[]>(['Voiceover', 'Narration']);
  const [tagInput, setTagInput] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [autoCreateVideo, setAutoCreateVideo] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (!isOpen) return null;

  const handleFileSelection = async (selectedFile: File) => {
    if (!selectedFile.type.startsWith('audio/') && !selectedFile.name.match(/\.(mp3|wav|m4a|ogg|aac|flac|webm)$/i)) {
      setErrorMsg('Please select a valid audio file (.mp3, .wav, .m4a, .webm, .ogg).');
      return;
    }

    setErrorMsg(null);
    setFile(selectedFile);

    const url = URL.createObjectURL(selectedFile);
    setAudioUrl(url);

    // Auto fill title if empty or default
    if (!title || title.trim() === '') {
      const cleanName = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      // Capitalize words
      const capitalized = cleanName
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      setTitle(capitalized);
    }

    try {
      const dur = await getAudioDuration(selectedFile);
      setDuration(dur);
    } catch (e) {
      setDuration(10);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const togglePlayAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration) setDuration(audioRef.current.duration);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg('Please select or record an audio file first.');
      return;
    }

    if (!title.trim()) {
      setErrorMsg('Please provide a title for your audio upload.');
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);

    try {
      // Extract waveform peaks for audio visualizer
      const waveformPeaks = await extractWaveform(file, 40);

      const newItem: AudioUploadItem = {
        id: `upload-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        title: title.trim(),
        description: description.trim(),
        visibility,
        audioUrl: audioUrl || URL.createObjectURL(file),
        audioBlob: file,
        mimeType: file.type || 'audio/webm',
        fileName: file.name,
        fileSize: file.size,
        duration: duration || 10,
        createdAt: Date.now(),
        waveformPeaks,
        tags
      };

      await saveAudioUpload(newItem);

      setIsUploading(false);
      onUploadSuccess(newItem, autoCreateVideo);
      onClose();
    } catch (err: any) {
      console.error('Upload failed:', err);
      setErrorMsg(err.message || 'Failed to save audio upload.');
      setIsUploading(false);
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#0f131d] border border-cyan-500/20 rounded-2xl shadow-2xl shadow-cyan-950/40 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#141926]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">Upload Audio Track</h2>
              <p className="text-xs text-slate-400">Add voiceover or audio clip with custom visibility</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          {errorMsg && (
            <div className="flex items-center gap-3 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. File Drop Zone or Selected Preview */}
          {!file ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
                dragOver
                  ? 'border-cyan-400 bg-cyan-500/10 scale-[1.01]'
                  : 'border-slate-700/80 bg-slate-900/40 hover:border-slate-600 hover:bg-slate-800/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.m4a,.ogg,.aac,.flac,.webm"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelection(e.target.files[0]);
                  }
                }}
              />
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Music className="w-7 h-7" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1">
                Drop your audio file here, or <span className="text-cyan-400 underline">browse</span>
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mb-2">
                Supports MP3, WAV, M4A, WEBM, AAC, FLAC (Voice memos, podcast snippets, narration)
              </p>
              <span className="inline-block px-2.5 py-1 text-[11px] font-medium bg-slate-800 text-slate-300 rounded-md border border-slate-700">
                Max file size: 50MB
              </span>
            </div>
          ) : (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                  <button
                    type="button"
                    onClick={togglePlayAudio}
                    className="w-12 h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-cyan-500/20 hover:scale-105 transition-transform flex-shrink-0"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </button>
                  <div className="overflow-hidden">
                    <p className="text-sm font-semibold text-white truncate">{file.name}</p>
                    <p className="text-xs text-slate-400">
                      {formatFileSize(file.size)} • {formatSeconds(duration)} duration
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setAudioUrl(null);
                    setIsPlaying(false);
                  }}
                  className="text-xs text-slate-400 hover:text-rose-400 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Change File
                </button>
              </div>

              {/* Mini Audio Player Waveform / Progress */}
              <div className="space-y-1 pt-1">
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-100"
                    style={{
                      width: duration ? `${(currentTime / duration) * 100}%` : '0%'
                    }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>{formatSeconds(currentTime)}</span>
                  <span>{formatSeconds(duration)}</span>
                </div>
              </div>

              {audioUrl && (
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={handleAudioEnded}
                  className="hidden"
                />
              )}
            </div>
          )}

          {/* 2. Title & Description Inputs */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Audio Title <span className="text-cyan-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., The Secret of Deep Sleep, Ep 14 Intro, Voice Memo"
                className="w-full px-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-sm transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Provide details about what this voice recording is about, context for video generation, or chapter breakdown..."
                className="w-full px-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-sm resize-none transition-all"
              />
            </div>
          </div>

          {/* 3. VISIBILITY SETTINGS (Core Requirement: Public, Private, Unlisted) */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Visibility Settings <span className="text-cyan-400">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Public */}
              <label
                onClick={() => setVisibility('public')}
                className={`relative flex flex-col p-3.5 rounded-xl border cursor-pointer transition-all ${
                  visibility === 'public'
                    ? 'border-cyan-400 bg-cyan-500/10 ring-1 ring-cyan-400'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                    <Globe className="w-4 h-4" />
                    <span>Public</span>
                  </div>
                  {visibility === 'public' && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                </div>
                <p className="text-[12px] text-slate-400 leading-snug">
                  Anyone can listen, discover, and use this voice track in the public video community.
                </p>
              </label>

              {/* Unlisted */}
              <label
                onClick={() => setVisibility('unlisted')}
                className={`relative flex flex-col p-3.5 rounded-xl border cursor-pointer transition-all ${
                  visibility === 'unlisted'
                    ? 'border-amber-400 bg-amber-500/10 ring-1 ring-amber-400'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                    <Link2 className="w-4 h-4" />
                    <span>Unlisted</span>
                  </div>
                  {visibility === 'unlisted' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                </div>
                <p className="text-[12px] text-slate-400 leading-snug">
                  Anyone with the direct link can access, but won't be listed in search or public feeds.
                </p>
              </label>

              {/* Private */}
              <label
                onClick={() => setVisibility('private')}
                className={`relative flex flex-col p-3.5 rounded-xl border cursor-pointer transition-all ${
                  visibility === 'private'
                    ? 'border-violet-400 bg-violet-500/10 ring-1 ring-violet-400'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-violet-400 font-semibold text-sm">
                    <Lock className="w-4 h-4" />
                    <span>Private</span>
                  </div>
                  {visibility === 'private' && <CheckCircle2 className="w-4 h-4 text-violet-400" />}
                </div>
                <p className="text-[12px] text-slate-400 leading-snug">
                  Only you can access this audio in your workspace. Fully confidential and secure.
                </p>
              </label>
            </div>
          </div>

          {/* 4. Tags / Categories */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Tags / Keywords
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-slate-400 hover:text-rose-400"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add tag (e.g. Story, Tech, Philosophy) and press Enter"
                className="flex-1 px-3.5 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-medium text-slate-200 transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* 5. Auto Create Video Checkbox */}
          <div className="p-4 bg-gradient-to-r from-cyan-950/40 to-blue-950/30 border border-cyan-800/40 rounded-xl flex items-start gap-3">
            <input
              type="checkbox"
              id="autoCreateVideo"
              checked={autoCreateVideo}
              onChange={(e) => setAutoCreateVideo(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400 bg-slate-900 border-slate-700"
            />
            <label htmlFor="autoCreateVideo" className="text-xs cursor-pointer select-none">
              <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Immediately generate voice-relevant video storyboard
              </span>
              <p className="text-slate-400 mt-0.5">
                Automatically transcribe spoken words, split speech into timed scenes, generate relevant visuals, and launch the video studio!
              </p>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/60 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!file || !title.trim() || isUploading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing Upload...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Save & Upload Audio</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
