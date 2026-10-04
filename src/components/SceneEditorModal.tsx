import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Camera,
  Layers,
  Clock,
  Image,
  RefreshCw,
  Tag,
  Check
} from 'lucide-react';
import { Scene, CameraMotion, TransitionType } from '../types/video';

interface SceneEditorModalProps {
  scene: Scene | null;
  sceneIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedScene: Scene, index: number) => void;
}

const STOCK_THEMES: Record<string, string[]> = {
  Space: [
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=1200&auto=format&fit=crop',
  ],
  Tech: [
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop',
  ],
  Psychology: [
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?q=80&w=1200&auto=format&fit=crop',
  ],
  Motivation: [
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1519751138087-5bf79df62d5b?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop',
  ],
  Nature: [
    'https://images.unsplash.com/photo-1511497584788-87676104235f?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
  ]
};

export const SceneEditorModal: React.FC<SceneEditorModalProps> = ({
  scene,
  sceneIndex,
  isOpen,
  onClose,
  onSave
}) => {
  if (!isOpen || !scene) return null;

  const [text, setText] = useState(scene.text);
  const [badge, setBadge] = useState(scene.badge || `0${sceneIndex + 1} // SCENE`);
  const [visualPrompt, setVisualPrompt] = useState(scene.visualPrompt);
  const [duration, setDuration] = useState(scene.duration);
  const [cameraMotion, setCameraMotion] = useState<CameraMotion>(scene.cameraMotion);
  const [transition, setTransition] = useState<TransitionType>(scene.transition);
  const [imageUrl, setImageUrl] = useState(scene.imageUrl);
  const [keywords, setKeywords] = useState<string[]>(scene.keywords || []);
  const [keywordInput, setKeywordInput] = useState('');
  const [customImageUrl, setCustomImageUrl] = useState('');

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim().toUpperCase())) {
      setKeywords([...keywords, keywordInput.trim().toUpperCase()]);
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (kw: string) => {
    setKeywords(keywords.filter(k => k !== kw));
  };

  const handleSave = () => {
    onSave(
      {
        ...scene,
        text: text.trim(),
        badge: badge.trim(),
        visualPrompt: visualPrompt.trim(),
        duration: Math.max(1.5, Number(duration) || 4),
        cameraMotion,
        transition,
        imageUrl: customImageUrl.trim() || imageUrl,
        keywords
      },
      sceneIndex
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#0f1422] border border-cyan-500/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#141a2a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Customize Scene {sceneIndex + 1}
              </h2>
              <p className="text-xs text-slate-400">Configure visual imagery, motion, and captions</p>
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
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Spoken Narration Text */}
          <div className="space-y-1.5">
            <label className="block font-semibold uppercase tracking-wider text-slate-300">
              Spoken Voice Lines <span className="text-cyan-400">*</span>
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              className="w-full p-3 bg-slate-950/80 border border-slate-700 rounded-xl text-white text-xs leading-relaxed focus:outline-none focus:border-cyan-400 resize-none"
            />
          </div>

          {/* Row: Badge + Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Chapter Badge
              </label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="e.g. 01 // THE QUESTION"
                className="w-full px-3.5 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                Duration ({duration}s)
              </label>
              <input
                type="range"
                min="1.5"
                max="12"
                step="0.5"
                value={duration}
                onChange={(e) => setDuration(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer mt-2"
              />
            </div>
          </div>

          {/* Camera Motion & Transition */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-cyan-400" />
                Camera Movement
              </label>
              <select
                value={cameraMotion}
                onChange={(e) => setCameraMotion(e.target.value as CameraMotion)}
                className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-400"
              >
                <option value="zoom_in">Slow Zoom In (Intimacy)</option>
                <option value="zoom_out">Slow Zoom Out (Reveal)</option>
                <option value="pan_left">Cinematic Pan Left</option>
                <option value="pan_right">Cinematic Pan Right</option>
                <option value="drift">Subtle Organic Drift</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                Scene Transition
              </label>
              <select
                value={transition}
                onChange={(e) => setTransition(e.target.value as TransitionType)}
                className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-400"
              >
                <option value="crossfade">Smooth Crossfade</option>
                <option value="zoom">Dynamic Zoom</option>
                <option value="slide">Slide In</option>
                <option value="glitch">Cyberpunk Glitch</option>
                <option value="flash">White Light Flash</option>
              </select>
            </div>
          </div>

          {/* Highlighted Keywords in Caption */}
          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-cyan-400" />
              Highlighted Subtitle Keywords
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {keywords.map((kw) => (
                <span
                  key={kw}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 rounded-lg text-[11px] font-bold"
                >
                  {kw}
                  <button
                    type="button"
                    onClick={() => handleRemoveKeyword(kw)}
                    className="text-cyan-400 hover:text-white"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddKeyword();
                  }
                }}
                placeholder="Add keyword (e.g. FOCUS, NEVER, 99%)"
                className="flex-1 px-3 py-1.5 bg-slate-950/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-400"
              />
              <button
                type="button"
                onClick={handleAddKeyword}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
              >
                Add
              </button>
            </div>
          </div>

          {/* Visual Scene Asset Picker */}
          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-300 mb-1 flex items-center gap-1.5">
              <Image className="w-3.5 h-3.5 text-cyan-400" />
              Visual Backdrop Imagery
            </label>

            {/* Current Selected Image */}
            <div className="relative h-32 w-full rounded-2xl overflow-hidden border border-slate-700 mb-3 bg-slate-950">
              <img
                src={customImageUrl || imageUrl}
                alt="Selected visual"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-3">
                <span className="text-[11px] text-slate-300 truncate font-mono">
                  {visualPrompt || 'Cinematic visual scene'}
                </span>
              </div>
            </div>

            {/* Theme Presets Swatches */}
            <div className="space-y-2">
              <span className="text-[11px] text-slate-400 font-semibold uppercase">
                Choose from Thematic Visuals:
              </span>
              <div className="grid grid-cols-6 gap-2">
                {Object.entries(STOCK_THEMES).flatMap(([theme, urls]) =>
                  urls.slice(0, 2).map((url, i) => (
                    <div
                      key={`${theme}-${i}`}
                      onClick={() => {
                        setImageUrl(url);
                        setCustomImageUrl('');
                      }}
                      className={`relative aspect-video rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                        imageUrl === url && !customImageUrl
                          ? 'border-cyan-400 ring-2 ring-cyan-400/40 scale-105'
                          : 'border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <img src={url} alt={theme} className="w-full h-full object-cover" />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Custom Image URL input */}
            <div className="mt-3">
              <input
                type="text"
                value={customImageUrl}
                onChange={(e) => setCustomImageUrl(e.target.value)}
                placeholder="Or paste any custom image URL (https://...)"
                className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-[#141a2a]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white rounded-xl text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:scale-105 active:scale-95 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Save Scene Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
