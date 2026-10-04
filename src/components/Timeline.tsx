import React from 'react';
import {
  Plus,
  Trash2,
  Copy,
  ArrowLeft,
  ArrowRight,
  Clock,
  Sparkles,
  Layers,
  Subtitles,
  Music
} from 'lucide-react';
import { Scene, VideoProject } from '../types/video';

interface TimelineProps {
  project: VideoProject;
  activeSceneIndex: number;
  onSelectScene: (index: number) => void;
  onEditScene: (scene: Scene, index: number) => void;
  onAddScene: () => void;
  onDeleteScene: (index: number) => void;
  onDuplicateScene: (index: number) => void;
  onMoveScene: (fromIndex: number, toIndex: number) => void;
  onUpdateDuration: (index: number, newDuration: number) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  project,
  activeSceneIndex,
  onSelectScene,
  onEditScene,
  onAddScene,
  onDeleteScene,
  onDuplicateScene,
  onMoveScene,
  onUpdateDuration,
}) => {
  const totalDuration = project.scenes.reduce((sum, s) => sum + s.duration, 0);

  return (
    <div className="w-full bg-[#0d111a] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
      {/* Timeline Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">Multi-Track Timeline</h3>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
            {project.scenes.length} Scenes • {totalDuration.toFixed(1)}s Total
          </span>
        </div>

        <button
          onClick={onAddScene}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Scene</span>
        </button>
      </div>

      {/* Visual Scenes Track */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          <span>Track 1: Visual Scenes</span>
        </div>

        <div className="flex items-stretch gap-3 overflow-x-auto pb-3 pt-1 scrollbar-thin">
          {project.scenes.map((scene, index) => {
            const isSelected = activeSceneIndex === index;

            return (
              <div
                key={scene.id}
                onClick={() => onSelectScene(index)}
                className={`group relative flex-shrink-0 w-64 bg-[#141a27] border rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                  isSelected
                    ? 'border-cyan-400 ring-2 ring-cyan-400/40 shadow-xl shadow-cyan-500/15 scale-[1.01]'
                    : 'border-slate-800 hover:border-slate-700 hover:bg-[#182030]'
                }`}
              >
                {/* Scene Thumbnail + Badge */}
                <div className="relative h-28 w-full bg-slate-900 overflow-hidden">
                  <img
                    src={scene.imageUrl}
                    alt={scene.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#141a27] via-transparent to-black/40" />

                  {/* Scene Number Badge */}
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-[10px] font-bold text-white font-mono border border-white/10">
                    {scene.badge || `0${index + 1}`}
                  </span>

                  {/* Transition Pill */}
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-cyan-950/80 backdrop-blur-sm text-[10px] font-semibold text-cyan-300 border border-cyan-500/30 capitalize">
                    {scene.transition}
                  </span>

                  {/* Camera Motion badge */}
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm text-[10px] text-slate-300 capitalize">
                    {scene.cameraMotion.replace('_', ' ')}
                  </span>
                </div>

                {/* Spoken Text Preview */}
                <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                  <p className="text-xs text-slate-200 font-medium line-clamp-2 leading-relaxed">
                    "{scene.text}"
                  </p>

                  {/* Duration Stepper & Actions */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    {/* Duration Stepper */}
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 font-mono"
                    >
                      <Clock className="w-3 h-3 text-cyan-400" />
                      <button
                        onClick={() => onUpdateDuration(index, Math.max(1.5, scene.duration - 0.5))}
                        className="text-slate-400 hover:text-white px-1 font-bold"
                      >
                        -
                      </button>
                      <span className="text-white text-[11px] font-bold">{scene.duration}s</span>
                      <button
                        onClick={() => onUpdateDuration(index, scene.duration + 0.5)}
                        className="text-slate-400 hover:text-white px-1 font-bold"
                      >
                        +
                      </button>
                    </div>

                    {/* Quick scene controls */}
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {index > 0 && (
                        <button
                          onClick={() => onMoveScene(index, index - 1)}
                          title="Move Left"
                          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                        >
                          <ArrowLeft className="w-3 h-3" />
                        </button>
                      )}
                      {index < project.scenes.length - 1 && (
                        <button
                          onClick={() => onMoveScene(index, index + 1)}
                          title="Move Right"
                          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                        >
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={() => onDuplicateScene(index)}
                        title="Duplicate Scene"
                        className="p-1 text-slate-400 hover:text-cyan-400 rounded hover:bg-slate-800"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => onEditScene(scene, index)}
                        title="Edit Details"
                        className="p-1 text-slate-400 hover:text-cyan-400 rounded hover:bg-slate-800"
                      >
                        <Sparkles className="w-3 h-3" />
                      </button>
                      {project.scenes.length > 1 && (
                        <button
                          onClick={() => onDeleteScene(index)}
                          title="Delete Scene"
                          className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Audio & Caption Meta Tracks Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
        {/* Voice Track Info */}
        <div className="flex items-center gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 flex-shrink-0">
            <Subtitles className="w-4 h-4" />
          </div>
          <div className="overflow-hidden">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Subtitles & Voiceover
            </span>
            <p className="text-xs text-white truncate font-medium">
              Theme: <span className="text-cyan-300 capitalize">{project.captionTheme.replace('_', ' ')}</span> • Pos: <span className="text-cyan-300 capitalize">{project.captionPosition}</span>
            </p>
          </div>
        </div>

        {/* Music Track Info */}
        <div className="flex items-center gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0">
            <Music className="w-4 h-4" />
          </div>
          <div className="overflow-hidden">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Background Soundtrack
            </span>
            <p className="text-xs text-white truncate font-medium">
              Track: <span className="text-indigo-300 capitalize">{project.bgmTrack}</span> • Vol: <span className="text-indigo-300">{Math.round(project.bgmVolume * 100)}%</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
