import React from 'react';
import {
  Video,
  Music,
  Share2,
  Sparkles,
  Smartphone,
  Tv,
  Square,
  Upload,
  Settings
} from 'lucide-react';
import { AspectRatio } from '../types/video';

interface HeaderProps {
  currentTab: 'studio' | 'library' | 'presets';
  onTabChange: (tab: 'studio' | 'library' | 'presets') => void;
  aspectRatio: AspectRatio;
  onAspectRatioChange: (ratio: AspectRatio) => void;
  onOpenUploadModal: () => void;
  onOpenExportModal: () => void;
  onOpenSettingsModal: () => void;
  projectTitle: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  aspectRatio,
  onAspectRatioChange,
  onOpenUploadModal,
  onOpenExportModal,
  onOpenSettingsModal,
  projectTitle
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#0a0d14]/95 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-6">
          <div
            onClick={() => onTabChange('studio')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black tracking-tight text-white font-['Space_Grotesk']">
                  VoxClip
                </span>
                <span className="px-1.5 py-0.2 bg-cyan-500/20 text-cyan-400 text-[10px] font-bold rounded uppercase tracking-wider border border-cyan-500/30">
                  AI Studio
                </span>
              </div>
              <p className="text-[10px] text-slate-400 -mt-0.5 hidden sm:block">
                Voice-Driven Video Maker
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 p-1 bg-slate-900/90 rounded-xl border border-slate-800">
            <button
              onClick={() => onTabChange('studio')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'studio'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Video Studio</span>
            </button>

            <button
              onClick={() => onTabChange('library')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'library'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>Audio Uploads & Library</span>
            </button>

            <button
              onClick={() => onTabChange('presets')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'presets'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Viral Templates</span>
            </button>
          </nav>
        </div>

        {/* Center: Title in Studio */}
        {currentTab === 'studio' && (
          <div className="hidden xl:flex items-center gap-2 text-xs text-slate-300 bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-800/80 max-w-sm truncate">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse flex-shrink-0" />
            <span className="font-semibold truncate">{projectTitle}</span>
          </div>
        )}

        {/* Actions: Aspect Ratio, Upload Audio, Export */}
        <div className="flex items-center gap-2">
          {/* Aspect Ratio Picker (Studio only) */}
          {currentTab === 'studio' && (
            <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
              <button
                onClick={() => onAspectRatioChange('9:16')}
                title="9:16 Portrait (TikTok, Shorts, Reels)"
                className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                  aspectRatio === '9:16'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onAspectRatioChange('16:9')}
                title="16:9 Landscape (YouTube, Cinema)"
                className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                  aspectRatio === '16:9'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onAspectRatioChange('1:1')}
                title="1:1 Square (Feed)"
                className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                  aspectRatio === '1:1'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Square className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Quick Upload Audio Button */}
          <button
            onClick={onOpenUploadModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/80 transition-all hover:scale-[1.02]"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Upload Audio</span>
          </button>

          {/* Style & BGM Settings */}
          {currentTab === 'studio' && (
            <button
              onClick={onOpenSettingsModal}
              title="Video & Caption Styling"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/80 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          {/* Export Video Button */}
          {currentTab === 'studio' && (
            <button
              onClick={onOpenExportModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Export Video</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile nav bar */}
      <div className="flex md:hidden items-center justify-around gap-1 pt-2 mt-2 border-t border-slate-800/60">
        <button
          onClick={() => onTabChange('studio')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold ${
            currentTab === 'studio' ? 'text-cyan-400' : 'text-slate-400'
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          <span>Studio</span>
        </button>
        <button
          onClick={() => onTabChange('library')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold ${
            currentTab === 'library' ? 'text-cyan-400' : 'text-slate-400'
          }`}
        >
          <Music className="w-3.5 h-3.5" />
          <span>Audios</span>
        </button>
        <button
          onClick={() => onTabChange('presets')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold ${
            currentTab === 'presets' ? 'text-cyan-400' : 'text-slate-400'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Templates</span>
        </button>
      </div>
    </header>
  );
};
