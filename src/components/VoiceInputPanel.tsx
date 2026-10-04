import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Upload,
  Sparkles,
  FileText,
  Play,
  Pause,
  ArrowRight,
  Globe,
  Lock,
  Link2,
  Wand2,
  Loader2,
  Volume2
} from 'lucide-react';
import { VideoProject, Scene } from '../types/video';
import { AudioUploadItem } from '../types/audio';
import { MicRecorder, speechEngine } from '../utils/speechEngine';
import { SAMPLE_PROJECTS } from '../data/presets';

interface VoiceInputPanelProps {
  onLoadProject: (project: VideoProject) => void;
  uploadedAudios: AudioUploadItem[];
  onOpenUploadModal: () => void;
}

export const VoiceInputPanel: React.FC<VoiceInputPanelProps> = ({
  onLoadProject,
  uploadedAudios,
  onOpenUploadModal
}) => {
  const [activeTab, setActiveTab] = useState<'record' | 'upload' | 'script' | 'presets'>('record');

  // Mic recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [micVolume, setMicVolume] = useState(0);
  const [recordedAudio, setRecordedAudio] = useState<{ blob: Blob; url: string; base64: string } | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const recorderRef = useRef<MicRecorder | null>(null);
  const timerRef = useRef<any>(null);

  // Script generator state
  const [topicPrompt, setTopicPrompt] = useState('Why 99% of people never achieve their true potential');
  const [scriptTone, setScriptTone] = useState<'viral' | 'stoic' | 'mystery' | 'documentary' | 'science'>('viral');
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [generatedScript, setGeneratedScript] = useState('');
  const [suggestedVoice, setSuggestedVoice] = useState('Narrator Deep');
  const [isTestingVoice, setIsTestingVoice] = useState(false);

  // Audio preview for recorded sound
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingRecorded, setIsPlayingRecorded] = useState(false);

  // 1. Microphone recording handlers
  const startRecording = async () => {
    try {
      setRecordedAudio(null);
      setRecordingSeconds(0);
      const recorder = new MicRecorder();
      recorderRef.current = recorder;

      await recorder.startRecording((vol) => {
        setMicVolume(vol);
      });

      setIsRecording(true);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Mic access failed:', err);
      alert('Could not access microphone. Please ensure microphone permissions are granted in your browser.');
    }
  };

  const stopRecording = async () => {
    if (!recorderRef.current) return;
    clearInterval(timerRef.current);
    setIsRecording(false);

    try {
      const result = await recorderRef.current.stopRecording();
      setRecordedAudio(result);
    } catch (err) {
      console.error('Stop recording failed:', err);
    }
  };

  // Convert recorded voice to video scenes via API
  const handleConvertRecordingToVideo = async () => {
    if (!recordedAudio) return;
    setIsTranscribing(true);

    try {
      // Step A: Transcribe audio
      const transRes = await fetch('/api/ai/transcribe-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: recordedAudio.base64,
          mimeType: recordedAudio.blob.type || 'audio/webm'
        })
      });

      const transData = await transRes.json();
      const transcript = transData.transcript || 'Spoken voice recording with cinematic scene pacing.';

      // Step B: Break down into synchronized video scenes
      const sceneRes = await fetch('/api/ai/analyze-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          title: 'My Voice Narration Video',
          tone: 'engaging'
        })
      });

      const sceneData = await sceneRes.json();

      const newProject: VideoProject = {
        id: `proj-${Date.now()}`,
        title: sceneData.title || 'My Voice Narration Video',
        summary: sceneData.summary || 'AI-generated video scenes synchronized to recorded voice.',
        aspectRatio: '9:16',
        captionTheme: 'viral_yellow',
        captionPosition: 'center',
        visualizerStyle: 'bars',
        bgmTrack: 'lofi',
        bgmVolume: 0.2,
        voicePitch: 1.0,
        voiceRate: 1.05,
        voiceName: '',
        originalAudioBlob: recordedAudio.blob,
        originalAudioUrl: recordedAudio.url,
        scenes: sceneData.scenes || []
      };

      onLoadProject(newProject);
    } catch (err) {
      console.error('Failed to analyze voice:', err);
      // Fallback
      fallbackProjectFromText('Your recorded voice brings this story to life with vivid visuals.', recordedAudio.blob, recordedAudio.url);
    } finally {
      setIsTranscribing(false);
    }
  };

  // 2. Select uploaded audio from user's library
  const handleSelectUploadedAudio = async (item: AudioUploadItem) => {
    setIsTranscribing(true);
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

      const sceneData = await res.json();

      const newProject: VideoProject = {
        id: `proj-${Date.now()}`,
        title: item.title,
        summary: item.description || sceneData.summary,
        aspectRatio: '9:16',
        captionTheme: 'viral_yellow',
        captionPosition: 'center',
        visualizerStyle: 'bars',
        bgmTrack: 'cosmic',
        bgmVolume: 0.22,
        voicePitch: 1.0,
        voiceRate: 1.05,
        voiceName: '',
        originalAudioBlob: item.audioBlob,
        originalAudioUrl: item.audioUrl || (item.audioBlob ? URL.createObjectURL(item.audioBlob) : ''),
        scenes: sceneData.scenes || []
      };

      onLoadProject(newProject);
    } catch (e) {
      console.error('Failed to convert uploaded audio:', e);
      fallbackProjectFromText(item.title + '. ' + item.description, item.audioBlob, item.audioUrl);
    } finally {
      setIsTranscribing(false);
    }
  };

  // 3. AI Script Generator
  const handleGenerateScript = async () => {
    if (!topicPrompt.trim()) return;
    setIsGeneratingScript(true);

    try {
      const res = await fetch('/api/ai/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicPrompt,
          style: scriptTone,
          format: 'short'
        })
      });

      const data = await res.json();
      setGeneratedScript(data.script || '');
      setSuggestedVoice(data.suggestedVoice || 'Narrator Deep');
    } catch (e) {
      console.error('Script generation error:', e);
      setGeneratedScript(
        'The greatest illusion in life is that you have endless time. Every second you let drift away without intention is gone forever. Wake up. Lock in. Build something that outlasts you.'
      );
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleConvertScriptToVideo = async () => {
    if (!generatedScript.trim()) return;
    setIsTranscribing(true);

    try {
      const res = await fetch('/api/ai/analyze-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: generatedScript,
          title: topicPrompt,
          tone: scriptTone
        })
      });

      const data = await res.json();

      const newProject: VideoProject = {
        id: `proj-${Date.now()}`,
        title: data.title || topicPrompt,
        summary: data.summary || 'AI-generated voice video from script',
        aspectRatio: '9:16',
        captionTheme: scriptTone === 'viral' ? 'viral_yellow' : scriptTone === 'mystery' ? 'cyber_neon' : 'punchy_red',
        captionPosition: 'center',
        visualizerStyle: 'bars',
        bgmTrack: scriptTone === 'mystery' ? 'suspense' : scriptTone === 'science' ? 'cosmic' : 'lofi',
        bgmVolume: 0.25,
        voicePitch: 1.0,
        voiceRate: 1.05,
        voiceName: '',
        scenes: data.scenes || []
      };

      onLoadProject(newProject);
    } catch (e) {
      console.error(e);
      fallbackProjectFromText(generatedScript);
    } finally {
      setIsTranscribing(false);
    }
  };

  const testVoicePlayback = () => {
    if (isTestingVoice) {
      speechEngine.stop();
      setIsTestingVoice(false);
    } else {
      setIsTestingVoice(true);
      speechEngine.speak(generatedScript.slice(0, 100) || topicPrompt, {
        onEnd: () => setIsTestingVoice(false)
      });
    }
  };

  const fallbackProjectFromText = (text: string, blob?: Blob, url?: string) => {
    const defaultProject = SAMPLE_PROJECTS[0];
    onLoadProject({
      ...defaultProject,
      title: 'Custom Voice Video',
      originalAudioBlob: blob,
      originalAudioUrl: url,
      scenes: defaultProject.scenes.map((s, i) => ({
        ...s,
        text: i === 0 ? text : s.text
      }))
    });
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="bg-[#0f1422] border border-slate-800 rounded-3xl p-6 shadow-2xl">
      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-4 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('record')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'record'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Mic className="w-4 h-4 text-cyan-300" />
          <span>Record Voice</span>
        </button>

        <button
          onClick={() => setActiveTab('upload')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'upload'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Upload className="w-4 h-4 text-cyan-300" />
          <span>Uploaded Audios ({uploadedAudios.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('script')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'script'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Wand2 className="w-4 h-4 text-cyan-300" />
          <span>AI Voice Script</span>
        </button>

        <button
          onClick={() => setActiveTab('presets')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'presets'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Sparkles className="w-4 h-4 text-cyan-300" />
          <span>Instant Presets</span>
        </button>
      </div>

      {/* TAB 1: RECORD LIVE VOICE */}
      {activeTab === 'record' && (
        <div className="space-y-6">
          <div className="text-center max-w-md mx-auto space-y-2">
            <h3 className="text-lg font-bold text-white">Record Your Voice Narration</h3>
            <p className="text-xs text-slate-400">
              Speak naturally into your microphone. VoxClip automatically detects your words, splits your speech into timed scenes, and generates voice-relevant cinematic visuals!
            </p>
          </div>

          {/* Recording Visualizer & Button */}
          <div className="flex flex-col items-center justify-center p-8 bg-slate-950/60 border border-slate-800/90 rounded-2xl space-y-6">
            {/* Decibel / Volume Waveform */}
            <div className="flex items-center gap-1.5 h-14">
              {Array.from({ length: 24 }).map((_, i) => {
                const height = isRecording
                  ? Math.max(12, Math.min(100, micVolume * 160 * (0.4 + Math.sin(i * 0.4) * 0.5)))
                  : 8;

                return (
                  <div
                    key={i}
                    className={`w-1.5 rounded-full transition-all duration-75 ${
                      isRecording ? 'bg-gradient-to-t from-cyan-500 to-red-500' : 'bg-slate-700/50'
                    }`}
                    style={{ height: `${height}%` }}
                  />
                );
              })}
            </div>

            {/* Timer Counter */}
            <div className="font-mono text-2xl font-bold tracking-wider text-white">
              {formatTimer(recordingSeconds)}
            </div>

            {/* Mic Record Button */}
            {!isRecording ? (
              <button
                onClick={startRecording}
                disabled={isTranscribing}
                className="flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-base bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-xl shadow-rose-500/30 hover:scale-105 active:scale-95 transition-all"
              >
                <Mic className="w-5 h-5 animate-pulse" />
                <span>Start Recording Voice</span>
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-base bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-xl shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all"
              >
                <MicOff className="w-5 h-5" />
                <span>Finish & Process Recording</span>
              </button>
            )}

            {/* Playback & Convert to Video */}
            {recordedAudio && !isRecording && (
              <div className="w-full max-w-md bg-slate-900/90 border border-slate-700 rounded-2xl p-4 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (!audioPreviewRef.current) return;
                        if (isPlayingRecorded) {
                          audioPreviewRef.current.pause();
                          setIsPlayingRecorded(false);
                        } else {
                          audioPreviewRef.current.play();
                          setIsPlayingRecorded(true);
                        }
                      }}
                      className="p-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold"
                    >
                      {isPlayingRecorded ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <div>
                      <span className="text-xs font-semibold text-white block">Recording Ready</span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {recordingSeconds}s captured
                      </span>
                    </div>
                  </div>

                  <audio
                    ref={audioPreviewRef}
                    src={recordedAudio.url}
                    onEnded={() => setIsPlayingRecorded(false)}
                    className="hidden"
                  />

                  <button
                    onClick={startRecording}
                    className="text-xs text-slate-400 hover:text-white px-2.5 py-1"
                  >
                    Re-record
                  </button>
                </div>

                <button
                  onClick={handleConvertRecordingToVideo}
                  disabled={isTranscribing}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isTranscribing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Transcribing & Generating Voice Scenes...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Voice-Relevant Video</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: UPLOADED AUDIOS LIST */}
      {activeTab === 'upload' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Select from Uploaded Audios</h3>
              <p className="text-xs text-slate-400">
                Click any audio to extract spoken parts and build matching video scenes.
              </p>
            </div>
            <button
              onClick={onOpenUploadModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload New File</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
            {uploadedAudios.map((audio) => (
              <div
                key={audio.id}
                onClick={() => handleSelectUploadedAudio(audio)}
                className="group p-3.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-cyan-400/60 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-3"
              >
                <div className="overflow-hidden space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                      {audio.title}
                    </span>
                    {audio.visibility === 'public' && (
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-0.5">
                        <Globe className="w-2.5 h-2.5" /> Public
                      </span>
                    )}
                    {audio.visibility === 'unlisted' && (
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-0.5">
                        <Link2 className="w-2.5 h-2.5" /> Unlisted
                      </span>
                    )}
                    {audio.visibility === 'private' && (
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20 flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" /> Private
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">
                    {audio.description || audio.fileName}
                  </p>
                </div>

                <button
                  disabled={isTranscribing}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-500/20 text-cyan-300 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors flex-shrink-0"
                >
                  Use Audio
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: AI SCRIPT STUDIO */}
      {activeTab === 'script' && (
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">Generate Spoken Narration Script</h3>
            <p className="text-xs text-slate-400">
              Provide a concept or viral topic. Gemini generates spoken narration optimized for rhythm and visual hooks.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={topicPrompt}
                onChange={(e) => setTopicPrompt(e.target.value)}
                placeholder="e.g. Why deep space is completely silent, The psychology of confidence"
                className="flex-1 px-4 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
              <button
                onClick={handleGenerateScript}
                disabled={isGeneratingScript}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors flex-shrink-0 disabled:opacity-50"
              >
                {isGeneratingScript ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>Write Script</span>
              </button>
            </div>

            {/* Tone Selector */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <span className="text-[11px] text-slate-400 uppercase font-bold mr-1">Vibe:</span>
              {[
                { id: 'viral', label: '⚡ Viral Hook' },
                { id: 'stoic', label: '🏆 Stoic Motivation' },
                { id: 'mystery', label: '🕵️ Mystery / Suspense' },
                { id: 'documentary', label: '🌌 Documentary' },
                { id: 'science', label: '🧠 Mind-Blowing Fact' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setScriptTone(t.id as any)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    scriptTone === t.id
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Script Editor Area */}
            {generatedScript && (
              <div className="space-y-3 animate-fadeIn">
                <textarea
                  value={generatedScript}
                  onChange={(e) => setGeneratedScript(e.target.value)}
                  rows={4}
                  className="w-full p-3.5 bg-slate-950/90 border border-slate-700/80 rounded-xl text-xs text-white leading-relaxed focus:outline-none focus:border-cyan-400 resize-none font-medium"
                />

                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={testVoicePlayback}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-xs text-slate-300 hover:text-white"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{isTestingVoice ? 'Stop Testing Voice' : 'Test Spoken Voice'}</span>
                  </button>

                  <button
                    onClick={handleConvertScriptToVideo}
                    disabled={isTranscribing}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isTranscribing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>Turn Script into Video</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: INSTANT PRESETS */}
      {activeTab === 'presets' && (
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">Instant Viral Voice Presets</h3>
            <p className="text-xs text-slate-400">
              Pick a ready-made voiceover project with synchronized scenes, Ken Burns camera motion, and kinetic captions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {SAMPLE_PROJECTS.map((preset) => (
              <div
                key={preset.id}
                onClick={() => onLoadProject(preset)}
                className="group p-4 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-cyan-400 rounded-2xl cursor-pointer transition-all space-y-3 flex flex-col justify-between"
              >
                <div>
                  <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 text-[10px] font-bold uppercase tracking-wider border border-cyan-500/20 inline-block mb-2">
                    {preset.aspectRatio} • {preset.scenes.length} Scenes
                  </span>
                  <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                    {preset.title}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                    {preset.summary}
                  </p>
                </div>

                <button className="w-full py-2 rounded-xl text-xs font-bold bg-slate-800 group-hover:bg-cyan-500 group-hover:text-slate-950 text-white transition-colors">
                  Load Template
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
