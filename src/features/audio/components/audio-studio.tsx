'use client';

import { useState } from 'react';
import { FeatureHeader } from '@/components/shared/feature-header';
import { TwoPanelLayout } from '@/components/shared/two-panel-layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import {
  Music, Zap, Flame, Waves, Mic2, Play, Sparkles, Loader2,
} from 'lucide-react';

const MOODS = [
  { id: 'energetic', label: 'Energetic & Fast', icon: Zap, description: 'High tempo, impactful beats' },
  { id: 'suspenseful', label: 'Suspenseful Epic', icon: Flame, description: 'Deep bass, cinematic tension' },
  { id: 'chill', label: 'Lo-fi & Chill', icon: Waves, description: 'Relaxed vibes, atmospheric' },
  { id: 'educational', label: 'Educational', icon: Mic2, description: 'Clear, unobtrusive ambient' },
];

const MOCK_TRACKS = [
  { title: 'Neon Pulse', genre: 'Synthwave', bpm: 128, duration: '3:42', mood: 'energetic' },
  { title: 'Dark Horizon', genre: 'Cinematic', bpm: 90, duration: '4:15', mood: 'suspenseful' },
  { title: 'Rainy Thoughts', genre: 'Lo-fi', bpm: 72, duration: '2:58', mood: 'chill' },
  { title: 'Focus Flow', genre: 'Ambient', bpm: 65, duration: '5:10', mood: 'educational' },
];

export function AudioStudio() {
  const [mood, setMood] = useState('energetic');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    await new Promise((r) => setTimeout(r, 2000));
    setIsGenerating(false);
  };

  const leftContent = (
    <div className="space-y-6">
      <RadioGroup value={mood} onValueChange={setMood} className="grid grid-cols-1 gap-3">
        {MOODS.map((m) => (
          <div
            key={m.id}
            className={cn(
              'flex items-start space-x-3 border rounded-xl p-3 cursor-pointer transition-all',
              mood === m.id
                ? 'border-primary bg-primary/5 shadow-glow'
                : 'border-border/50 hover:border-primary/30 hover:bg-muted/30'
            )}
            onClick={() => setMood(m.id)}
          >
            <div className={cn(
              'p-2 rounded-lg shrink-0 transition-colors',
              mood === m.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            )}>
              <m.icon className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <Label className="cursor-pointer font-semibold text-sm block">{m.label}</Label>
              <p className="text-[10px] text-muted-foreground">{m.description}</p>
            </div>
            <RadioGroupItem value={m.id} className="sr-only" />
          </div>
        ))}
      </RadioGroup>

      <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
        {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
        {isGenerating ? 'Generating...' : 'Generate Audio'}
      </Button>
    </div>
  );

  const rightContent = isGenerating ? (
    <div className="flex flex-col items-center justify-center h-full text-center p-12">
      <Music className="w-16 h-16 text-primary animate-bounce mb-4" />
      <h3 className="text-xl font-semibold mb-2">Synthesizing...</h3>
      <p className="text-muted-foreground text-sm">Our engine is crafting the perfect soundscape.</p>
    </div>
  ) : (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Suggested Tracks</h4>
        <Badge variant="outline" className="text-[10px]">AI Matched</Badge>
      </div>
      {MOCK_TRACKS.map((track, i) => (
        <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:bg-muted/40 transition-colors group cursor-pointer">
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="icon" className="rounded-lg h-10 w-10 shrink-0">
              <Play className="w-4 h-4 translate-x-0.5 fill-current" />
            </Button>
            <div>
              <p className="font-semibold text-sm">{track.title}</p>
              <p className="text-xs text-muted-foreground">{track.genre} · {track.bpm} BPM</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-mono">{track.duration}</p>
            <Badge variant="secondary" className="text-[10px] mt-1">{track.mood}</Badge>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <FeatureHeader
        title="Audio Effects"
        description="Generate AI-powered music, sound effects, and audio landscapes."
      />
      <TwoPanelLayout
        leftTitle="Sonic Architecture"
        leftDescription="Select mood and generate"
        leftIcon={Music}
        leftContent={leftContent}
        rightTitle="Curated Tracks"
        rightDescription="AI-matched audio for your project"
        rightContent={rightContent}
      />
    </div>
  );
}
