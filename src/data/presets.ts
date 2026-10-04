import { VideoProject } from '../types/video';

export const SAMPLE_PROJECTS: VideoProject[] = [
  {
    id: 'preset-time-illusion',
    title: 'The 80-Millisecond Illusion of Time',
    summary: 'A mind-bending revelation of how human consciousness constructs reality after the fact.',
    aspectRatio: '9:16',
    captionTheme: 'viral_yellow',
    captionPosition: 'center',
    visualizerStyle: 'bars',
    bgmTrack: 'cosmic',
    bgmVolume: 0.28,
    voicePitch: 1.0,
    voiceRate: 1.05,
    voiceName: '',
    scenes: [
      {
        id: 'scene-1',
        title: '01 // THE DELAY',
        text: 'You are never actually living in the present moment.',
        duration: 3.5,
        visualPrompt: 'Cinematic silhouette of a person looking at neon holographic clock face melting into infinity',
        keywords: ['NEVER', 'PRESENT', 'MOMENT'],
        cameraMotion: 'zoom_in',
        style: 'psychology',
        imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200&auto=format&fit=crop',
        badge: '01 // THE DELAY',
        transition: 'crossfade'
      },
      {
        id: 'scene-2',
        title: '02 // THE BRAIN LATENCY',
        text: 'Your brain takes exactly eighty milliseconds to process raw sensory data.',
        duration: 4.2,
        visualPrompt: 'Glowing neural pathways and biological synapses transmitting high voltage light pulses in dark void',
        keywords: ['EIGHTY', 'MILLISECONDS', 'BRAIN'],
        cameraMotion: 'drift',
        style: 'tech',
        imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1200&auto=format&fit=crop',
        badge: '02 // THE LATENCY',
        transition: 'zoom'
      },
      {
        id: 'scene-3',
        title: '03 // STARRY REVELATION',
        text: 'When you gaze at the night sky, you are looking thousands of years into the past.',
        duration: 4.5,
        visualPrompt: 'Ultra high definition deep space nebula with spiral galaxies and glittering golden starlight',
        keywords: ['NIGHT SKY', 'THOUSANDS', 'PAST'],
        cameraMotion: 'zoom_out',
        style: 'space',
        imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop',
        badge: '03 // COSMIC MIRROR',
        transition: 'crossfade'
      },
      {
        id: 'scene-4',
        title: '04 // CONSTRUCTED REALITY',
        text: 'Reality is not what is happening. It is what your consciousness stitched together.',
        duration: 4.6,
        visualPrompt: 'Geometric fractured mirrors reflecting abstract human figures surrounded by quantum particles',
        keywords: ['REALITY', 'CONSCIOUSNESS', 'STITCHED'],
        cameraMotion: 'pan_right',
        style: 'psychology',
        imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop',
        badge: '04 // THE MATRIX',
        transition: 'glitch'
      },
      {
        id: 'scene-5',
        title: '05 // THE QUESTION',
        text: 'So ask yourself: what else is your mind hiding from you right now?',
        duration: 4.0,
        visualPrompt: 'Dramatic moody cinematic lighting on a silhouette overlooking a massive futuristic neon metropolis at dusk',
        keywords: ['WHAT ELSE', 'HIDING', 'RIGHT NOW'],
        cameraMotion: 'zoom_in',
        style: 'mystery',
        imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
        badge: '05 // FINAL HOOK',
        transition: 'flash'
      }
    ]
  },
  {
    id: 'preset-deep-focus',
    title: 'Why Deep Focus is a Rare Superpower',
    summary: 'A motivational breakdown on the scarcity and immense leverage of uninterrupted focus.',
    aspectRatio: '9:16',
    captionTheme: 'punchy_red',
    captionPosition: 'center',
    visualizerStyle: 'wave',
    bgmTrack: 'lofi',
    bgmVolume: 0.25,
    voicePitch: 1.0,
    voiceRate: 1.05,
    voiceName: '',
    scenes: [
      {
        id: 'scene-1',
        title: '01 // ATTENTION CRISIS',
        text: 'The average person switches tasks every forty-seven seconds.',
        duration: 3.8,
        visualPrompt: 'Fast moving digital phone notifications flooding a dark cyberpunk bedroom in blue and red neon',
        keywords: ['SWITCHES', '47 SECONDS', 'CRISIS'],
        cameraMotion: 'pan_left',
        style: 'tech',
        imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1200&auto=format&fit=crop',
        badge: '01 // DISTRACTION',
        transition: 'crossfade'
      },
      {
        id: 'scene-2',
        title: '02 // THE SUPERPOWER',
        text: 'If you can sit in complete silence and work on one problem for two hours...',
        duration: 4.2,
        visualPrompt: 'Minimalist brutalist concrete room with a single glowing desk and focused creator silhouette',
        keywords: ['COMPLETE SILENCE', 'ONE PROBLEM', 'TWO HOURS'],
        cameraMotion: 'zoom_in',
        style: 'minimal',
        imageUrl: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?q=80&w=1200&auto=format&fit=crop',
        badge: '02 // DEEP WORK',
        transition: 'zoom'
      },
      {
        id: 'scene-3',
        title: '03 // UNFAIR ADVANTAGE',
        text: 'You instantly outperform ninety-nine percent of your competition.',
        duration: 4.0,
        visualPrompt: 'Runner standing at the apex of an epic mountain peak during sunrise with golden clouds below',
        keywords: ['OUTPERFORM', '99 PERCENT', 'ADVANTAGE'],
        cameraMotion: 'drift',
        style: 'motivation',
        imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1200&auto=format&fit=crop',
        badge: '03 // THE TOP 1%',
        transition: 'crossfade'
      },
      {
        id: 'scene-4',
        title: '04 // LOCK IN',
        text: 'Do not chase hacks. Guard your attention like your life depends on it.',
        duration: 4.4,
        visualPrompt: 'Monolithic obsidian hourglass with golden sand falling in slow motion against deep black space',
        keywords: ['GUARD', 'ATTENTION', 'LIFE DEPENDS'],
        cameraMotion: 'zoom_in',
        style: 'motivation',
        imageUrl: 'https://images.unsplash.com/photo-1519751138087-5bf79df62d5b?q=80&w=1200&auto=format&fit=crop',
        badge: '04 // DIRECTIVE',
        transition: 'flash'
      }
    ]
  },
  {
    id: 'preset-black-holes',
    title: 'The Terrifying Anatomy of a Black Hole',
    summary: 'Cinematic journey towards the cosmic boundary where light and physics shatter.',
    aspectRatio: '16:9',
    captionTheme: 'cyber_neon',
    captionPosition: 'bottom',
    visualizerStyle: 'circle',
    bgmTrack: 'suspense',
    bgmVolume: 0.35,
    voicePitch: 0.95,
    voiceRate: 0.98,
    voiceName: '',
    scenes: [
      {
        id: 'scene-1',
        title: '01 // EVENT HORIZON',
        text: 'At the boundary of a supermassive black hole, space itself moves faster than light.',
        duration: 4.8,
        visualPrompt: 'Hyper-detailed accretion disk of a supermassive black hole with blazing plasma rings and relativistic beaming',
        keywords: ['FASTER', 'LIGHT', 'BLACK HOLE'],
        cameraMotion: 'zoom_in',
        style: 'space',
        imageUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1200&auto=format&fit=crop',
        badge: '01 // THE VOID',
        transition: 'crossfade'
      },
      {
        id: 'scene-2',
        title: '02 // TIME DILATION',
        text: 'If you fell inside, the entire future history of the universe would flash before your eyes.',
        duration: 4.9,
        visualPrompt: 'Kaleidoscope of swirling galaxies, dying stars and cosmic supernovae warping around a dark sphere',
        keywords: ['FUTURE', 'UNIVERSE', 'FLASH'],
        cameraMotion: 'pan_right',
        style: 'space',
        imageUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=1200&auto=format&fit=crop',
        badge: '02 // ETERNITY',
        transition: 'zoom'
      },
      {
        id: 'scene-3',
        title: '03 // SINGULARITY',
        text: 'Inside the singularity, our equations break down completely. Space and time simply cease to exist.',
        duration: 5.2,
        visualPrompt: 'A point of infinite darkness surrounded by mathematical glowing formulas dissolving into pure white energy',
        keywords: ['SINGULARITY', 'EQUATIONS BREAK', 'CEASE'],
        cameraMotion: 'drift',
        style: 'space',
        imageUrl: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?q=80&w=1200&auto=format&fit=crop',
        badge: '03 // BEYOND PHYSICS',
        transition: 'flash'
      }
    ]
  }
];
