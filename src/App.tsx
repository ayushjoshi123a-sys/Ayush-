import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { VideoPlayer } from './components/VideoPlayer';
import { Timeline } from './components/Timeline';
import { VoiceInputPanel } from './components/VoiceInputPanel';
import { AudioLibrary } from './components/AudioLibrary';
import { AudioUploadModal } from './components/AudioUploadModal';
import { SceneEditorModal } from './components/SceneEditorModal';
import { StyleSettingsModal } from './components/StyleSettingsModal';
import { ExportModal } from './components/ExportModal';
import { VideoProject, Scene, AspectRatio } from './types/video';
import { AudioUploadItem } from './types/audio';
import { SAMPLE_PROJECTS } from './data/presets';
import { getAllAudioUploads, seedInitialAudioData } from './utils/audioStorage';
import { Sparkles, Film, Mic, Upload } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'studio' | 'library' | 'presets'>('studio');
  const [project, setProject] = useState<VideoProject>(SAMPLE_PROJECTS[0]);
  const [activeSceneIndex, setActiveSceneIndex] = useState<number>(0);
  const [uploadedAudios, setUploadedAudios] = useState<AudioUploadItem[]>([]);

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [editingSceneData, setEditingSceneData] = useState<{ scene: Scene; index: number } | null>(null);

  // Load uploaded audios on startup
  const refreshAudios = async () => {
    try {
      const audios = await seedInitialAudioData();
      setUploadedAudios(audios);
    } catch (e) {
      console.warn('Audio storage init:', e);
    }
  };

  useEffect(() => {
    refreshAudios();
  }, []);

  // Handle successful audio upload
  const handleUploadSuccess = async (newItem: AudioUploadItem, shouldGenerateVideo: boolean) => {
    await refreshAudios();

    if (shouldGenerateVideo) {
      // Analyze and convert into video
      try {
        const text = newItem.transcript || newItem.description || newItem.title;
        const res = await fetch('/api/ai/analyze-voice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transcript: text,
            title: newItem.title,
            tone: 'engaging'
          })
        });

        const data = await res.json();

        const newProject: VideoProject = {
          id: `proj-${Date.now()}`,
          title: newItem.title,
          summary: newItem.description || data.summary || 'Video generated from uploaded voice clip.',
          aspectRatio: '9:16',
          captionTheme: 'viral_yellow',
          captionPosition: 'center',
          visualizerStyle: 'bars',
          bgmTrack: 'cosmic',
          bgmVolume: 0.25,
          voicePitch: 1.0,
          voiceRate: 1.05,
          voiceName: '',
          originalAudioBlob: newItem.audioBlob,
          originalAudioUrl: newItem.audioUrl || (newItem.audioBlob ? URL.createObjectURL(newItem.audioBlob) : ''),
          scenes: data.scenes || []
        };

        setProject(newProject);
        setActiveSceneIndex(0);
        setCurrentTab('studio');
      } catch (err) {
        console.error('Auto convert error:', err);
      }
    }
  };

  // Convert selected library audio to video
  const handleSelectAudioForVideo = async (item: AudioUploadItem) => {
    try {
      const text = item.transcript || item.description || item.title;
      const res = await fetch('/api/ai/analyze-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: text,
          title: item.title,
          tone: 'engaging'
        })
      });

      const data = await res.json();

      const newProject: VideoProject = {
        id: `proj-${Date.now()}`,
        title: item.title,
        summary: item.description || data.summary || 'Video from audio library',
        aspectRatio: '9:16',
        captionTheme: 'viral_yellow',
        captionPosition: 'center',
        visualizerStyle: 'bars',
        bgmTrack: 'lofi',
        bgmVolume: 0.22,
        voicePitch: 1.0,
        voiceRate: 1.05,
        voiceName: '',
        originalAudioBlob: item.audioBlob,
        originalAudioUrl: item.audioUrl || (item.audioBlob ? URL.createObjectURL(item.audioBlob) : ''),
        scenes: data.scenes || []
      };

      setProject(newProject);
      setActiveSceneIndex(0);
      setCurrentTab('studio');
    } catch (e) {
      console.error(e);
    }
  };

  // Timeline & Scene Handlers
  const handleUpdateScene = (updatedScene: Scene, index: number) => {
    const updatedScenes = [...project.scenes];
    updatedScenes[index] = updatedScene;
    setProject({ ...project, scenes: updatedScenes });
  };

  const handleAddScene = () => {
    const newIndex = project.scenes.length + 1;
    const newScene: Scene = {
      id: `scene-${Date.now()}`,
      title: `0${newIndex} // NEW SCENE`,
      text: 'Add your voiceover narration lines here to illustrate this moment.',
      duration: 4.0,
      visualPrompt: 'Cinematic visual scene with volumetric atmospheric lighting',
      keywords: ['VOICE', 'MOMENT'],
      cameraMotion: 'zoom_in',
      style: 'tech',
      imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop',
      badge: `0${newIndex} // CHAPTER`,
      transition: 'crossfade'
    };
    setProject({
      ...project,
      scenes: [...project.scenes, newScene]
    });
    setActiveSceneIndex(project.scenes.length);
  };

  const handleDeleteScene = (index: number) => {
    if (project.scenes.length <= 1) return;
    const updated = project.scenes.filter((_, i) => i !== index);
    setProject({ ...project, scenes: updated });
    if (activeSceneIndex >= updated.length) {
      setActiveSceneIndex(updated.length - 1);
    }
  };

  const handleDuplicateScene = (index: number) => {
    const target = project.scenes[index];
    const duplicated: Scene = {
      ...target,
      id: `scene-${Date.now()}`,
      title: `${target.title} (Copy)`,
    };
    const updated = [...project.scenes];
    updated.splice(index + 1, 0, duplicated);
    setProject({ ...project, scenes: updated });
    setActiveSceneIndex(index + 1);
  };

  const handleMoveScene = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= project.scenes.length) return;
    const updated = [...project.scenes];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setProject({ ...project, scenes: updated });
    setActiveSceneIndex(toIndex);
  };

  const handleUpdateDuration = (index: number, newDuration: number) => {
    const updated = [...project.scenes];
    updated[index].duration = Math.max(1.5, Math.min(15, newDuration));
    setProject({ ...project, scenes: updated });
  };

  const handleAspectRatioChange = (aspectRatio: AspectRatio) => {
    setProject({ ...project, aspectRatio });
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* App Header */}
      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        aspectRatio={project.aspectRatio}
        onAspectRatioChange={handleAspectRatioChange}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        projectTitle={project.title}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6">
        {/* VIEW 1: VIDEO STUDIO */}
        {currentTab === 'studio' && (
          <div className="space-y-6">
            {/* Top Row: Video Player (Center) + Project Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left/Main Column: Canvas Video Player */}
              <div className="lg:col-span-8 flex flex-col items-center">
                <VideoPlayer
                  project={project}
                  activeSceneIndex={activeSceneIndex}
                  onSceneChange={setActiveSceneIndex}
                  onEditScene={(scene, idx) => setEditingSceneData({ scene, index: idx })}
                />
              </div>

              {/* Right Column: Voice & Project Controls / Active Scene Quick Peek */}
              <div className="lg:col-span-4 space-y-4">
                {/* Project Card */}
                <div className="p-5 bg-[#0f1422] border border-slate-800 rounded-3xl space-y-3 shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                      Active Storyboard
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      {project.scenes.length} Scenes
                    </span>
                  </div>

                  <h1 className="text-base font-bold text-white tracking-tight leading-snug">
                    {project.title}
                  </h1>

                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                    {project.summary}
                  </p>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <button
                      onClick={() => setIsSettingsModalOpen(true)}
                      className="text-cyan-400 hover:text-cyan-300 font-semibold"
                    >
                      Configure Captions & Audio
                    </button>
                    <button
                      onClick={() => setIsExportModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors shadow-md"
                    >
                      Export
                    </button>
                  </div>
                </div>

                {/* Active Scene Highlights */}
                {project.scenes[activeSceneIndex] && (
                  <div className="p-5 bg-[#0f1422] border border-slate-800 rounded-3xl space-y-3 shadow-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Film className="w-3.5 h-3.5 text-cyan-400" />
                        Scene {activeSceneIndex + 1}: {project.scenes[activeSceneIndex].badge}
                      </span>
                      <button
                        onClick={() =>
                          setEditingSceneData({
                            scene: project.scenes[activeSceneIndex],
                            index: activeSceneIndex
                          })
                        }
                        className="text-xs text-cyan-400 hover:underline font-semibold"
                      >
                        Edit
                      </button>
                    </div>

                    <p className="text-xs text-slate-200 italic bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 leading-relaxed">
                      "{project.scenes[activeSceneIndex].text}"
                    </p>

                    <div className="text-[11px] text-slate-400 space-y-1">
                      <div className="flex justify-between">
                        <span>Duration:</span>
                        <span className="font-mono text-white font-bold">
                          {project.scenes[activeSceneIndex].duration}s
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Camera Motion:</span>
                        <span className="capitalize text-white font-medium">
                          {project.scenes[activeSceneIndex].cameraMotion.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Transition:</span>
                        <span className="capitalize text-cyan-300 font-medium">
                          {project.scenes[activeSceneIndex].transition}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Row: Multi-Track Timeline */}
            <Timeline
              project={project}
              activeSceneIndex={activeSceneIndex}
              onSelectScene={setActiveSceneIndex}
              onEditScene={(scene, idx) => setEditingSceneData({ scene, index: idx })}
              onAddScene={handleAddScene}
              onDeleteScene={handleDeleteScene}
              onDuplicateScene={handleDuplicateScene}
              onMoveScene={handleMoveScene}
              onUpdateDuration={handleUpdateDuration}
            />

            {/* Voice Input Panel in Studio */}
            <VoiceInputPanel
              onLoadProject={(newProj) => {
                setProject(newProj);
                setActiveSceneIndex(0);
              }}
              uploadedAudios={uploadedAudios}
              onOpenUploadModal={() => setIsUploadModalOpen(true)}
            />
          </div>
        )}

        {/* VIEW 2: AUDIO UPLOADS & LIBRARY */}
        {currentTab === 'library' && (
          <AudioLibrary
            audios={uploadedAudios}
            onOpenUploadModal={() => setIsUploadModalOpen(true)}
            onSelectForVideo={handleSelectAudioForVideo}
            onRefreshAudios={refreshAudios}
          />
        )}

        {/* VIEW 3: INSTANT VIRAL PRESETS */}
        {currentTab === 'presets' && (
          <div className="space-y-6">
            <div className="p-6 bg-gradient-to-r from-slate-900 via-[#101726] to-slate-900 border border-slate-800 rounded-3xl shadow-xl">
              <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-md inline-block mb-1">
                Curated Viral Templates
              </span>
              <h2 className="text-xl md:text-2xl font-black text-white">
                Trending Voice & Storyboard Presets
              </h2>
              <p className="text-sm text-slate-400 mt-1 max-w-xl">
                Select any voiceover project to instantly preview, customize scenes, or replace with your own voice.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {SAMPLE_PROJECTS.map((preset) => (
                <div
                  key={preset.id}
                  className="bg-[#0f1422] border border-slate-800 hover:border-cyan-400/80 rounded-3xl overflow-hidden shadow-xl transition-all duration-200 flex flex-col justify-between group"
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-slate-950">
                    <img
                      src={preset.scenes[0]?.imageUrl}
                      alt={preset.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f1422] via-transparent to-black/30" />
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[11px] font-bold text-white border border-white/10">
                      {preset.aspectRatio}
                    </span>
                    <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-cyan-950/80 backdrop-blur-md text-[11px] font-semibold text-cyan-300 border border-cyan-500/30">
                      {preset.scenes.length} Scenes
                    </span>
                  </div>

                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {preset.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {preset.summary}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setProject(preset);
                        setActiveSceneIndex(0);
                        setCurrentTab('studio');
                      }}
                      className="w-full py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Use This Template</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* MODALS */}
      {/* 1. Audio Upload Modal (Public / Private / Unlisted) */}
      <AudioUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* 2. Scene Inspector & Visual Editor */}
      <SceneEditorModal
        scene={editingSceneData?.scene || null}
        sceneIndex={editingSceneData?.index || 0}
        isOpen={!!editingSceneData}
        onClose={() => setEditingSceneData(null)}
        onSave={handleUpdateScene}
      />

      {/* 3. Style & BGM Settings */}
      <StyleSettingsModal
        project={project}
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onUpdateProject={(updated) => setProject({ ...project, ...updated })}
      />

      {/* 4. Export Video Modal */}
      <ExportModal
        project={project}
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
}
