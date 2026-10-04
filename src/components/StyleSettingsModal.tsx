import React from 'react';
import {
  X,
  Sliders,
  Type,
  Music,
  Activity,
  Volume2,
  Check
} from 'lucide-react';
import {
  VideoProject,
  CaptionTheme,
  VisualizerStyle,
  BGMTrackId
} from '../types/video';
import { BGM_TRACKS } from '../utils/audioSynthesizer';

interface StyleSettingsModalProps {
  project: VideoProject;
  isOpen: boolean;
  onClose: () => void;
  onUpdateProject: (updated: Partial<VideoProject>) => void;
}

export const StyleSettingsModal: React.FC<StyleSettingsModalProps> = ({
  project,
  isOpen,
  onClose,
  onUpdateProject
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-[#0f1422] border border-cyan-500/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#141a2a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Video & Subtitle Styling</h2>
              <p className="text-xs text-slate-400">Configure kinetic captions, soundtrack, and audio visualizer</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* 1. Kinetic Caption Themes */}
          <div className="space-y-2">
            <label className="block font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Type className="w-4 h-4 text-cyan-400" />
              Kinetic Subtitle Theme
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { id: 'viral_yellow', name: '🟡 Viral Yellow', desc: 'Hormozi / Reels pop' },
                { id: 'cyber_neon', name: '🔵 Cyber Neon', desc: 'Glowing cyan electric' },
                { id: 'punchy_red', name: '🔴 Punchy Red', desc: 'Bold attention grabber' },
                { id: 'cinema_box', name: '⚪ Cinema Box', desc: 'Translucent pills' },
                { id: 'modern_clean', name: '✨ Modern Clean', desc: 'Minimalist white' },
              ].map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => onUpdateProject({ captionTheme: theme.id as CaptionTheme })}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    project.captionTheme === theme.id
                      ? 'border-cyan-400 bg-cyan-500/10 ring-1 ring-cyan-400 shadow-md'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                  }`}
                >
                  <span className="font-bold text-white block mb-0.5">{theme.name}</span>
                  <span className="text-[11px] text-slate-400">{theme.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Subtitle Positioning */}
          <div className="space-y-2">
            <label className="block font-bold uppercase tracking-wider text-slate-300">
              Subtitle Position
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['bottom', 'center', 'top'] as const).map((pos) => (
                <button
                  key={pos}
                  onClick={() => onUpdateProject({ captionPosition: pos })}
                  className={`py-2 px-3 rounded-xl border text-center capitalize font-semibold transition-all ${
                    project.captionPosition === pos
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Audio Waveform Visualizer Style */}
          <div className="space-y-2">
            <label className="block font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-cyan-400" />
              On-Screen Audio Visualizer
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'bars', name: 'Bars' },
                { id: 'wave', name: 'Wave' },
                { id: 'circle', name: 'Pulse' },
                { id: 'off', name: 'Off' },
              ].map((style) => (
                <button
                  key={style.id}
                  onClick={() => onUpdateProject({ visualizerStyle: style.id as VisualizerStyle })}
                  className={`py-2 px-3 rounded-xl border text-center font-semibold transition-all ${
                    project.visualizerStyle === style.id
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {style.name}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Background Music & Soundtracks */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Music className="w-4 h-4 text-cyan-400" />
                Background Music (BGM)
              </label>
              <span className="text-slate-400 font-mono">
                Volume: {Math.round(project.bgmVolume * 100)}%
              </span>
            </div>

            {/* Volume slider */}
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={project.bgmVolume}
              onChange={(e) => onUpdateProject({ bgmVolume: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />

            {/* Tracks grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {BGM_TRACKS.map((track) => (
                <div
                  key={track.id}
                  onClick={() => onUpdateProject({ bgmTrack: track.id })}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    project.bgmTrack === track.id
                      ? 'border-cyan-400 bg-cyan-500/10 ring-1 ring-cyan-400'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white truncate">{track.title}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300">
                      {track.genre}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{track.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-800 bg-[#141a2a]">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:scale-105 active:scale-95 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Apply Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
