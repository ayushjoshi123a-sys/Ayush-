import React, { useState, useRef, useEffect } from 'react';
import {
  Globe,
  Lock,
  Link2,
  Play,
  Pause,
  Video,
  Trash2,
  Search,
  Upload,
  Clock,
  HardDrive,
  Copy,
  Check,
  MoreVertical,
  ChevronDown
} from 'lucide-react';
import { AudioUploadItem, VisibilitySetting } from '../types/audio';
import { deleteAudioUpload, updateAudioVisibility } from '../utils/audioStorage';

interface AudioLibraryProps {
  audios: AudioUploadItem[];
  onOpenUploadModal: () => void;
  onSelectForVideo: (audio: AudioUploadItem) => void;
  onRefreshAudios: () => void;
}

export const AudioLibrary: React.FC<AudioLibraryProps> = ({
  audios,
  onOpenUploadModal,
  onSelectForVideo,
  onRefreshAudios
}) => {
  const [filterVisibility, setFilterVisibility] = useState<'all' | VisibilitySetting>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);

  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Filtered audios
  const filteredAudios = audios.filter((item) => {
    const matchesFilter = filterVisibility === 'all' || item.visibility === filterVisibility;
    const matchesQuery =
      searchQuery === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesQuery;
  });

  const handlePlayToggle = (item: AudioUploadItem) => {
    if (!audioPlayerRef.current) return;

    if (activePlayingId === item.id) {
      if (audioPlayerRef.current.paused) {
        audioPlayerRef.current.play();
      } else {
        audioPlayerRef.current.pause();
        setActivePlayingId(null);
      }
    } else {
      setActivePlayingId(item.id);
      audioPlayerRef.current.src = item.audioUrl || (item.audioBlob ? URL.createObjectURL(item.audioBlob) : '');
      audioPlayerRef.current.play().catch(e => console.warn('Audio play error:', e));
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioPlayerRef.current) {
      setCurrentTime(audioPlayerRef.current.currentTime);
    }
  };

  const handleAudioEnded = () => {
    setActivePlayingId(null);
    setCurrentTime(0);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this audio track?')) {
      if (activePlayingId === id) {
        audioPlayerRef.current?.pause();
        setActivePlayingId(null);
      }
      await deleteAudioUpload(id);
      onRefreshAudios();
    }
  };

  const handleChangeVisibility = async (id: string, newVisibility: VisibilitySetting) => {
    await updateAudioVisibility(id, newVisibility);
    setOpenMenuId(null);
    onRefreshAudios();
  };

  const handleCopyLink = (item: AudioUploadItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/#audio-${item.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getVisibilityBadge = (visibility: VisibilitySetting) => {
    switch (visibility) {
      case 'public':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
            <Globe className="w-3 h-3" />
            Public
          </span>
        );
      case 'unlisted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/25">
            <Link2 className="w-3 h-3" />
            Unlisted
          </span>
        );
      case 'private':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/25">
            <Lock className="w-3 h-3" />
            Private
          </span>
        );
    }
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="space-y-6">
      {/* Hidden audio element for library preview */}
      <audio
        ref={audioPlayerRef}
        onTimeUpdate={handleAudioTimeUpdate}
        onEnded={handleAudioEnded}
        className="hidden"
      />

      {/* Top Banner & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-gradient-to-r from-slate-900 via-[#101726] to-slate-900 border border-slate-800 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-[11px] font-bold tracking-wider uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-md">
              Audio Storage & Voiceover Hub
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
            Uploaded Audio Library
          </h2>
          <p className="text-sm text-slate-400 mt-0.5 max-w-xl">
            Manage your uploaded voice recordings, configure Public, Private, or Unlisted visibility, and instantly generate synchronized video scenes with kinetic captions.
          </p>
        </div>

        <button
          onClick={onOpenUploadModal}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all flex-shrink-0"
        >
          <Upload className="w-4 h-4" />
          <span>Upload New Audio</span>
        </button>
      </div>

      {/* Controls: Search & Visibility Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search audio by title, description or tags..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
          />
        </div>

        {/* Visibility Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-950/90 rounded-xl border border-slate-800/80 overflow-x-auto">
          {(['all', 'public', 'unlisted', 'private'] as const).map((tab) => {
            const count =
              tab === 'all'
                ? audios.length
                : audios.filter((a) => a.visibility === tab).length;

            return (
              <button
                key={tab}
                onClick={() => setFilterVisibility(tab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                  filterVisibility === tab
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {tab === 'public' && <Globe className="w-3 h-3 text-emerald-400" />}
                {tab === 'unlisted' && <Link2 className="w-3 h-3 text-amber-400" />}
                {tab === 'private' && <Lock className="w-3 h-3 text-violet-400" />}
                <span>{tab}</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-black/30 rounded-full">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Audio Cards Grid */}
      {filteredAudios.length === 0 ? (
        <div className="text-center py-16 px-4 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400">
            <Upload className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">No audio uploads found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            {searchQuery || filterVisibility !== 'all'
              ? 'Try adjusting your search query or visibility filter'
              : 'Upload your first voice memo, narration, or speech file to get started.'}
          </p>
          <button
            onClick={onOpenUploadModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Audio Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAudios.map((item) => {
            const isPlaying = activePlayingId === item.id;

            return (
              <div
                key={item.id}
                className={`group relative bg-gradient-to-b from-[#131825] to-[#0d1019] border rounded-2xl p-5 transition-all duration-200 flex flex-col justify-between ${
                  isPlaying
                    ? 'border-cyan-400/80 shadow-xl shadow-cyan-500/10 ring-1 ring-cyan-400/30'
                    : 'border-slate-800 hover:border-slate-700 hover:shadow-lg'
                }`}
              >
                <div>
                  {/* Top Bar: Visibility Badge + Menu */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      {getVisibilityBadge(item.visibility)}
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        {formatDuration(item.duration)}
                      </span>
                    </div>

                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === item.id ? null : item.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Dropdown Menu for Visibility & Delete */}
                      {openMenuId === item.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 top-8 z-30 w-48 bg-[#182030] border border-slate-700 rounded-xl shadow-2xl p-1.5 space-y-1 text-xs"
                        >
                          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Change Visibility
                          </div>
                          <button
                            onClick={() => handleChangeVisibility(item.id, 'public')}
                            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                              item.visibility === 'public'
                                ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                                : 'text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <Globe className="w-3.5 h-3.5 text-emerald-400" />
                            Public
                          </button>
                          <button
                            onClick={() => handleChangeVisibility(item.id, 'unlisted')}
                            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                              item.visibility === 'unlisted'
                                ? 'bg-amber-500/20 text-amber-300 font-semibold'
                                : 'text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <Link2 className="w-3.5 h-3.5 text-amber-400" />
                            Unlisted
                          </button>
                          <button
                            onClick={() => handleChangeVisibility(item.id, 'private')}
                            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                              item.visibility === 'private'
                                ? 'bg-violet-500/20 text-violet-300 font-semibold'
                                : 'text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <Lock className="w-3.5 h-3.5 text-violet-400" />
                            Private
                          </button>

                          <div className="border-t border-slate-700/80 my-1" />

                          <button
                            onClick={(e) => handleDelete(item.id, e)}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 text-left transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete Audio
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-white mb-1.5 line-clamp-1 group-hover:text-cyan-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                    {item.description || 'No description provided.'}
                  </p>

                  {/* Waveform Player Section */}
                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 mb-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handlePlayToggle(item)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
                          isPlaying
                            ? 'bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/30 scale-105'
                            : 'bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-white'
                        }`}
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                      </button>

                      {/* Visual Waveform Bars */}
                      <div className="flex-1 flex items-center gap-[2px] h-8 overflow-hidden">
                        {(item.waveformPeaks || [0.3, 0.6, 0.8, 0.4, 0.7, 0.9, 0.5, 0.3]).map((peak, idx) => {
                          const progressRatio = isPlaying && item.duration ? currentTime / item.duration : 0;
                          const barRatio = idx / (item.waveformPeaks?.length || 8);
                          const isPassed = barRatio <= progressRatio;

                          return (
                            <div
                              key={idx}
                              className={`flex-1 rounded-full transition-all duration-150 ${
                                isPassed
                                  ? 'bg-gradient-to-t from-cyan-400 to-blue-500'
                                  : 'bg-slate-700/60'
                              }`}
                              style={{
                                height: `${Math.max(14, peak * 100)}%`
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {item.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 bg-slate-800/80 rounded-md text-[10px] font-medium text-slate-300 border border-slate-700/50"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Meta & Actions */}
                <div className="pt-3 border-t border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <HardDrive className="w-3 h-3" />
                      {formatFileSize(item.fileSize)}
                    </span>
                    <span>{formatDate(item.createdAt)}</span>
                  </div>

                  {/* Main Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectForVideo(item)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 transition-all hover:scale-[1.01]"
                    >
                      <Video className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Make Video</span>
                    </button>

                    <button
                      onClick={(e) => handleCopyLink(item, e)}
                      title="Copy Share Link"
                      className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 hover:text-white transition-colors"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
