'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/shared/page-header';
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

const TONES = ['Educational', 'Hype', 'Storytelling', 'Conversational'] as const;
type Tone = (typeof TONES)[number];

function toneLabel(t: ReturnType<typeof useTranslations<'scripts'>>, tone: Tone): string {
  switch (tone) {
    case 'Educational':
      return t('generator.tones.Educational');
    case 'Hype':
      return t('generator.tones.Hype');
    case 'Storytelling':
      return t('generator.tones.Storytelling');
    case 'Conversational':
      return t('generator.tones.Conversational');
  }
}

export function ScriptGenerator() {
  const t = useTranslations('scripts');
  const [idea, setIdea] = useState('');
  const [platform, setPlatform] = useState<string>('youtube-shorts');
  const [tone, setTone] = useState<Tone>('Educational');
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
        <Label htmlFor="script-idea">{t('generator.ideaLabel')}</Label>
        <Textarea
          id="script-idea"
          dir="auto"
          placeholder={t('generator.ideaPlaceholder')}
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          className="min-h-[140px] resize-none"
        />
      </div>

      <div className="space-y-3">
        <Label>{t('generator.platform')}</Label>
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
        <Label>{t('generator.tone')}</Label>
        <div className="flex flex-wrap gap-2">
          {TONES.map((toneOption) => {
            const label = toneLabel(t, toneOption);
            return (
              <Badge
                key={toneOption}
                variant={tone === toneOption ? 'default' : 'outline'}
                className="cursor-pointer transition-all"
                onClick={() => setTone(toneOption)}
                role="button"
                tabIndex={0}
                aria-pressed={tone === toneOption}
                aria-label={t('generator.toneAria', { tone: label })}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setTone(toneOption); } }}
              >
                {label}
              </Badge>
            );
          })}
        </div>
      </div>

      <Button onClick={handleGenerate} disabled={isGenerating || !idea.trim()} className="w-full">
        {isGenerating ? (
          <Sparkles className="w-4 h-4 me-2 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4 me-2" />
        )}
        {isGenerating ? t('generator.generating') : t('generator.generate')}
      </Button>
    </div>
  );

  const rightContent = generatedScript ? (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{t('generator.generatedBadge')}</Badge>
          <Badge variant="outline">{platform}</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setGeneratedScript(null)}>
            <RotateCcw className="w-3.5 h-3.5 me-1" /> {t('generator.regenerate')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigator.clipboard.writeText(generatedScript)}
          >
            <Copy className="w-3.5 h-3.5 me-1" /> {t('generator.copy')}
          </Button>
          <Button variant="ghost" size="sm">
            <Download className="w-3.5 h-3.5 me-1" /> {t('generator.export')}
          </Button>
        </div>
      </div>
      <div dir="auto" className="p-6 rounded-xl border bg-muted/20 font-mono text-sm whitespace-pre-wrap leading-relaxed">
        {generatedScript}
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center h-full text-center p-12">
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
        <FileText className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{t('generator.emptyTitle')}</h3>
      <p className="text-muted-foreground text-sm max-w-sm">
        {t('generator.emptyDescription')}
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('generator.pageTitle')}
        description={t('generator.pageDescription')}
      />
      <TwoPanelLayout
        leftTitle={t('generator.canvasTitle')}
        leftDescription={t('generator.canvasDescription')}
        leftIcon={FileText}
        leftContent={leftContent}
        rightTitle={t('generator.outputTitle')}
        rightDescription={t('generator.outputDescription')}
        rightContent={rightContent}
      />
    </div>
  );
}
