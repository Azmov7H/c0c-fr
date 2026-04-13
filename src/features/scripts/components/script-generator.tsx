'use client';

import { useState } from 'react';
import { FeatureHeader } from '@/components/shared/feature-header';
import { TwoPanelLayout } from '@/components/shared/two-panel-layout';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, Sparkles, Copy, Download, RotateCcw } from 'lucide-react';

const PLATFORMS = ['youtube-shorts', 'tiktok', 'instagram-reels', 'youtube-long'] as const;
const TONES = ['Educational', 'Hype', 'Storytelling', 'Conversational'] as const;

export function ScriptGenerator() {
  const [idea, setIdea] = useState('');
  const [platform, setPlatform] = useState<string>('youtube-shorts');
  const [tone, setTone] = useState<string>('Educational');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!idea.trim()) return;
    setIsGenerating(true);
    // Simulate AI generation — replace with actual API call
    await new Promise((r) => setTimeout(r, 2000));
    setGeneratedScript(
      `HOOK (0-3s):\n"Stop scrolling. What if I told you ${idea.toLowerCase().slice(0, 50)}..."\n\nBODY (3-45s):\nHere's the thing most people don't realize...\n[Explain the core concept with examples]\n\nCTA (45-60s):\n"Follow for more ${platform} content like this!"`
    );
    setIsGenerating(false);
  };

  const leftContent = (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label htmlFor="script-idea">Your Idea / Brief</Label>
        <Textarea
          id="script-idea"
          placeholder="Describe your video concept, topic, or key message..."
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          className="min-h-[140px] resize-none"
        />
      </div>

      <div className="space-y-3">
        <Label>Platform</Label>
        <Select value={platform} onValueChange={setPlatform}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="youtube-shorts">YouTube Shorts</SelectItem>
            <SelectItem value="tiktok">TikTok</SelectItem>
            <SelectItem value="instagram-reels">Instagram Reels</SelectItem>
            <SelectItem value="youtube-long">YouTube Long-form</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label>Tone</Label>
        <div className="flex flex-wrap gap-2">
          {TONES.map((t) => (
            <Badge
              key={t}
              variant={tone === t ? 'default' : 'outline'}
              className="cursor-pointer transition-all"
              onClick={() => setTone(t)}
            >
              {t}
            </Badge>
          ))}
        </div>
      </div>

      <Button onClick={handleGenerate} disabled={isGenerating || !idea.trim()} className="w-full">
        {isGenerating ? (
          <Sparkles className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4 mr-2" />
        )}
        {isGenerating ? 'Generating...' : 'Generate Script'}
      </Button>
    </div>
  );

  const rightContent = generatedScript ? (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline">Script Generated</Badge>
          <Badge variant="outline">{platform}</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setGeneratedScript(null)}>
            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Regenerate
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigator.clipboard.writeText(generatedScript)}
          >
            <Copy className="w-3.5 h-3.5 mr-1" /> Copy
          </Button>
          <Button variant="ghost" size="sm">
            <Download className="w-3.5 h-3.5 mr-1" /> Export
          </Button>
        </div>
      </div>
      <div className="p-6 rounded-xl border bg-muted/20 font-mono text-sm whitespace-pre-wrap leading-relaxed">
        {generatedScript}
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center h-full text-center p-12">
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
        <FileText className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-2">No Script Yet</h3>
      <p className="text-muted-foreground text-sm max-w-sm">
        Enter your idea on the left and hit Generate to create an AI-powered video script.
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      <FeatureHeader
        title="Script Generator"
        description="AI-powered script generation with platform-specific formatting and tone control."
      />
      <TwoPanelLayout
        leftTitle="Script Canvas"
        leftDescription="Define your idea, platform, and tone"
        leftIcon={FileText}
        leftContent={leftContent}
        rightTitle="Generated Output"
        rightDescription="Your AI-crafted video script"
        rightContent={rightContent}
      />
    </div>
  );
}
