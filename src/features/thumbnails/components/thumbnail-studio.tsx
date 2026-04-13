'use client';

import { useState } from 'react';
import { FeatureHeader } from '@/components/shared/feature-header';
import { TwoPanelLayout } from '@/components/shared/two-panel-layout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Image as ImageIcon, Palette, Sparkles, Download, Loader2, Box, Film, Minimize2,
} from 'lucide-react';

const STYLES = [
  { id: '3d-render', label: '3D Render', icon: Box, description: 'Soft shadows, clay-like depth' },
  { id: 'cinematic', label: 'Cinematic', icon: Film, description: 'High contrast, dramatic lighting' },
  { id: 'minimalist', label: 'Minimalist', icon: Minimize2, description: 'Flat vector, clean lines' },
];

export function ThumbnailStudio() {
  const [prompt, setPrompt] = useState('');
  const [stylePreset, setStylePreset] = useState('3d-render');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    await new Promise((r) => setTimeout(r, 2500));
    setGeneratedUrl('/placeholder.png'); // Placeholder — replace with real generation
    setIsGenerating(false);
  };

  const leftContent = (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label htmlFor="thumb-prompt">Prompt</Label>
        <Textarea
          id="thumb-prompt"
          placeholder="A cybernetic detective in a neon-lit alleyway..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-[120px] resize-none"
        />
        <p className="text-[10px] text-muted-foreground text-right">{prompt.length} chars</p>
      </div>

      <div className="space-y-3">
        <Label>Style Preset</Label>
        <RadioGroup value={stylePreset} onValueChange={setStylePreset} className="grid grid-cols-1 gap-3">
          {STYLES.map((style) => (
            <div
              key={style.id}
              className={cn(
                'flex items-center space-x-3 border rounded-xl p-3 cursor-pointer transition-all',
                stylePreset === style.id
                  ? 'border-primary bg-primary/5 shadow-glow'
                  : 'border-border/50 hover:border-primary/30 hover:bg-muted/30'
              )}
              onClick={() => setStylePreset(style.id)}
            >
              <div className={cn(
                'p-2 rounded-lg shrink-0 transition-colors',
                stylePreset === style.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              )}>
                <style.icon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <Label className="cursor-pointer font-semibold text-sm block">{style.label}</Label>
                <p className="text-[10px] text-muted-foreground">{style.description}</p>
              </div>
              <RadioGroupItem value={style.id} className="sr-only" />
            </div>
          ))}
        </RadioGroup>
      </div>

      <Button onClick={handleGenerate} disabled={isGenerating || !prompt.trim()} className="w-full">
        {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
        {isGenerating ? 'Rendering...' : 'Generate Thumbnail'}
      </Button>
    </div>
  );

  const rightContent = generatedUrl ? (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant="outline">{stylePreset}</Badge>
        <Button variant="outline" size="sm">
          <Download className="w-3.5 h-3.5 mr-1" /> Download
        </Button>
      </div>
      <div className="aspect-video rounded-xl bg-muted/40 flex items-center justify-center overflow-hidden">
        <div className="w-full h-full bg-gradient-to-br from-primary/20 via-muted to-purple-500/20 flex items-center justify-center">
          <ImageIcon className="w-16 h-16 text-muted-foreground/30" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground italic">&quot;{prompt}&quot;</p>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center h-full text-center p-12">
      <div className="w-16 h-16 bg-muted/30 rounded-2xl flex items-center justify-center mb-4">
        <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
      </div>
      <h3 className="text-xl font-semibold mb-2">No Thumbnail Yet</h3>
      <p className="text-muted-foreground text-sm max-w-sm">
        Describe your thumbnail vision and let AI bring it to life.
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      <FeatureHeader
        title="Thumbnail Studio"
        description="Create eye-catching thumbnails with AI-powered generation."
      />
      <TwoPanelLayout
        leftTitle="Visual Core"
        leftDescription="Define your thumbnail directive"
        leftIcon={Palette}
        leftContent={leftContent}
        rightTitle="The Render"
        rightDescription="3840 x 2160 (Lossless)"
        rightContent={rightContent}
      />
    </div>
  );
}
