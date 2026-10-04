import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize GoogleGenAI
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Helper: Curated visual backgrounds matching theme & prompt
const THEME_VISUALS: Record<string, string[]> = {
  space: [
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?q=80&w=1200&auto=format&fit=crop',
  ],
  tech: [
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200&auto=format&fit=crop',
  ],
  psychology: [
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?q=80&w=1200&auto=format&fit=crop',
  ],
  nature: [
    'https://images.unsplash.com/photo-1511497584788-87676104235f?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop',
  ],
  history: [
    'https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1564507592333-c60657eea523?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1461360370896-922624d12aa1?q=80&w=1200&auto=format&fit=crop',
  ],
  motivation: [
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1519751138087-5bf79df62d5b?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200&auto=format&fit=crop',
  ],
  mystery: [
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1200&auto=format&fit=crop',
  ]
};

function getThemedFallbackImage(category: string, index: number): string {
  const cat = category.toLowerCase();
  for (const [key, urls] of Object.entries(THEME_VISUALS)) {
    if (cat.includes(key) || key.includes(cat)) {
      return urls[index % urls.length];
    }
  }
  const defaultList = THEME_VISUALS.tech;
  return defaultList[index % defaultList.length];
}

// 1. Analyze voice text into voice-relevant scenes
app.post('/api/ai/analyze-voice', async (req: Request, res: Response) => {
  try {
    const { transcript, title, tone = 'engaging' } = req.body;

    if (!transcript || typeof transcript !== 'string' || transcript.trim().length === 0) {
      return res.status(400).json({ error: 'Voice transcript or text is required.' });
    }

    if (!ai) {
      // Offline fallback: intelligent sentence splitting
      const sentences = transcript
        .split(/(?<=[.?!])\s+/)
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0);

      const scenes = sentences.map((sentence: string, i: number) => {
        const words = sentence.split(' ');
        const duration = Math.max(3, Math.min(8, Math.round(words.length / 2.5)));
        const keywords = words.slice(0, 3).filter((w: string) => w.length > 3);
        const motions = ['zoom_in', 'zoom_out', 'pan_left', 'pan_right', 'drift'];
        const styles = ['cyber_neon', 'cinematic_dark', 'nature_vibrant', 'space_cosmic', 'minimal_editorial'];

        return {
          id: `scene-${i + 1}`,
          title: `Scene ${i + 1}`,
          text: sentence,
          duration,
          visualPrompt: `Cinematic high quality visual representation of: ${sentence.slice(0, 60)}`,
          keywords: keywords.length ? keywords : [words[0] || 'FOCUS'],
          cameraMotion: motions[i % motions.length],
          style: styles[i % styles.length],
          imageUrl: getThemedFallbackImage(styles[i % styles.length], i),
          badge: `0${i + 1} // INTRO`,
          transition: i === 0 ? 'fade' : 'crossfade'
        };
      });

      return res.json({
        title: title || 'Voice Story Video',
        scenes,
        summary: 'Synchronized scenes generated from your voice.',
        tone
      });
    }

    const prompt = `You are an elite video director, voiceover producer, and motion designer.
Analyze this spoken voice transcript and break it down into synchronized video scenes that perfectly illustrate what the voice is saying at that exact moment.

Voice Transcript:
"""
${transcript.trim()}
"""

Desired Tone: ${tone}

Break the narration into 3 to 7 sequential scenes. For EACH scene:
1. "text": The exact chunk of speech spoken during this scene.
2. "duration": Natural speaking duration in seconds (usually 3.0 to 7.0 seconds based on speaking speed).
3. "visualPrompt": A vivid, cinematic, photorealistic description of what visually appears on screen to complement the spoken voice (e.g. "Extreme close-up of a human eye reflecting neon digital circuits, anamorphic lens flare, 8k resolution, cinematic lighting").
4. "keywords": 1 to 3 punchy keywords from this line that should be dynamically highlighted in the video subtitles.
5. "cameraMotion": Choose one of: "zoom_in", "zoom_out", "pan_left", "pan_right", "drift".
6. "theme": Choose the closest category: "space", "tech", "psychology", "nature", "history", "motivation", "mystery".
7. "badge": A short stylish 2-4 word video badge/chapter label (e.g., "01 // THE HOOK", "02 // DISCOVERY", "03 // THE PUNCHLINE").
8. "transition": Choose one of: "crossfade", "zoom", "slide", "glitch", "flash".

Provide a compelling title and summary as well.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            summary: { type: Type.STRING },
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  duration: { type: Type.NUMBER },
                  visualPrompt: { type: Type.STRING },
                  keywords: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  cameraMotion: { type: Type.STRING },
                  theme: { type: Type.STRING },
                  badge: { type: Type.STRING },
                  transition: { type: Type.STRING }
                },
                required: ['text', 'duration', 'visualPrompt', 'keywords', 'cameraMotion', 'theme', 'badge', 'transition']
              }
            }
          },
          required: ['title', 'scenes', 'summary']
        }
      }
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    const scenesWithAssets = (parsed.scenes || []).map((sc: any, idx: number) => ({
      ...sc,
      id: `scene-${idx + 1}`,
      title: sc.badge || `Scene ${idx + 1}`,
      duration: Math.max(2.5, Math.min(12, Number(sc.duration) || 4)),
      imageUrl: getThemedFallbackImage(sc.theme || 'tech', idx),
      cameraMotion: sc.cameraMotion || 'zoom_in',
      transition: sc.transition || 'crossfade',
      badge: sc.badge || `PART 0${idx + 1}`
    }));

    res.json({
      title: parsed.title || title || 'Voice Story Video',
      summary: parsed.summary || 'AI-generated storyboard from voice',
      scenes: scenesWithAssets,
      tone
    });
  } catch (error: any) {
    console.error('Error analyzing voice:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze voice script' });
  }
});

// 2. Generate script from topic
app.post('/api/ai/generate-script', async (req: Request, res: Response) => {
  try {
    const { topic, format = 'short', style = 'viral' } = req.body;

    if (!topic || typeof topic !== 'string') {
      return res.status(400).json({ error: 'Topic is required.' });
    }

    if (!ai) {
      return res.json({
        topic,
        script: `Did you know that everything you experience as reality is actually a simulation constructed by your brain? Every color, every sound, even time itself is delayed by 80 milliseconds. When you look at the stars tonight, remember: you're not just looking into space. You're looking backward in time. What if tomorrow you wake up to a reality you never noticed before?`,
        suggestedVoice: 'Narrator Deep',
        estimatedDuration: 22
      });
    }

    const prompt = `Write a viral, compelling, voiceover narration script about the topic: "${topic}".
Format: ${format} (approx 20-45 seconds when spoken aloud).
Style: ${style} (e.g. viral hook, mind-bending fact, storytelling, motivational, documentary).

Rules:
- The very first sentence MUST be an irresistible spoken hook that stops someone from scrolling.
- Use natural spoken pauses, rhythm, and punchy cadence suited for voice recording or text-to-speech.
- Include a thought-provoking conclusion or call-to-action.
- Avoid stage directions like [Music swells] or (laughs); write only the pure spoken words.
- Also suggest a voice persona (e.g., "Deep Mystery", "Energetic Creator", "Calm Philosopher", "Dramatic Storyteller") and estimated speaking duration in seconds.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            script: { type: Type.STRING },
            suggestedVoice: { type: Type.STRING },
            estimatedDuration: { type: Type.NUMBER },
            hook: { type: Type.STRING }
          },
          required: ['title', 'script', 'suggestedVoice', 'estimatedDuration']
        }
      }
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error generating script:', error);
    res.status(500).json({ error: error.message || 'Failed to generate script' });
  }
});

// 3. Transcribe audio from user recording/upload
app.post('/api/ai/transcribe-voice', async (req: Request, res: Response) => {
  try {
    const { audioBase64, mimeType = 'audio/webm' } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: 'Audio data is required' });
    }

    if (!ai) {
      return res.json({
        transcript: 'This is a sample transcribed voice from your recording. In a full production run, your spoken audio is automatically converted into text and matched to cinematic visuals.',
        confidence: 0.95
      });
    }

    const cleanBase64 = audioBase64.replace(/^data:audio\/[^;]+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          inlineData: {
            mimeType: mimeType.split(';')[0],
            data: cleanBase64
          }
        },
        {
          text: 'Listen carefully to this audio recording. Provide an accurate, verbatim transcription of the spoken voice. Do not include sound effect descriptions or timestamps in the transcript. Output valid JSON with "transcript" and "confidence".'
        }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            transcript: { type: Type.STRING },
            confidence: { type: Type.NUMBER }
          },
          required: ['transcript']
        }
      }
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Error transcribing audio:', error);
    res.status(500).json({ error: error.message || 'Failed to transcribe audio' });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`VoxClip server running on port ${port}`);
  });
}

startServer();
