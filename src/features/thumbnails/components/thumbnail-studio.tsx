'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/shared/page-header';
import { TwoPanelLayout } from '@/components/shared/two-panel-layout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Image as ImageIcon, Sparkles, Download, Loader2, Box, Film, Minimize2,
} from 'lucide-react';

const STYLE_IDS = ['3d-render', 'cinematic', 'minimalist'] as const;
const STYLE_ICONS = { '3d-render': Box, cinematic: Film, minimalist: Minimize2 } as const;

export function ThumbnailStudio() {
  const t = useTranslations('thumbnails');
  void [
    t('styles.3d-render.label'),
    t('styles.3d-render.description'),
    t('styles.cinematic.label'),
    t('styles.cinematic.description'),
    t('styles.minimalist.label'),
    t('styles.minimalist.description'),
  ];
  const [prompt, setPrompt] = useState('');
  const [stylePreset, setStylePreset] = useState<(typeof STYLE_IDS)[number]>('3d-render');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setResult(null);
    await new Promise((r) => setTimeout(r, 2500));
    setResult('/placeholder.png');
    setIsGenerating(false);
  };

  const renderConfig = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>{t('studio.prompt')}</Label>
        <Textarea
          placeholder={t('studio.promptPlaceholder')}
          className="min-h-[120px] resize-none"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <p className="text-[10px] text-muted-foreground text-end">{t('studio.chars', { count: prompt.length })}</p>
      </div>

      <div className="space-y-3">
        <Label>{t('studio.stylePreset')}</Label>
        <RadioGroup value={stylePreset} onValueChange={(v) => setStylePreset(v as (typeof STYLE_IDS)[number])} className="gap-3">
          {STYLE_IDS.map((styleId) => {
            const Icon = STYLE_ICONS[styleId];
            const selected = stylePreset === styleId;
            return (
              <label
                key={styleId}
                htmlFor={`style-${styleId}`}
                className={cn(
                  'flex items-center gap-3 rounded-xl border p-3.5 cursor-pointer transition-all',
                  selected ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/40 hover:bg-accent/30'
                )}
              >
                <RadioGroupItem value={styleId} id={`style-${styleId}`} />
                <Icon className={cn('h-4 w-4 shrink-0', selected ? 'text-primary' : 'text-muted-foreground')} />
                <div>
                  <p className="text-sm font-medium">{t(`styles.${styleId}.label`)}</p>
                  <p className="text-[11px] text-muted-foreground">{t(`styles.${styleId}.description`)}</p>
                </div>
              </label>
            );
          })}
        </RadioGroup>
      </div>

      <Button onClick={handleGenerate} disabled={!prompt.trim() || isGenerating} className="w-full gap-2">
        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {isGenerating ? t('studio.rendering') : t('studio.generate')}
      </Button>
    </div>
  );

  const renderOutput = () => (
    <div className="space-y-4">
      {isGenerating ? (
        <div className="aspect-video rounded-xl border bg-muted/30 flex flex-col items-center justify-center gap-4 animate-pulse">
          <Loader2 className="h-10 w-10 animate-spin text-primary/60" />
          <p className="text-sm text-muted-foreground">{t('generator.neuralAssembly')}</p>
        </div>
      ) : result ? (
        <div className="space-y-3">
          <div className="relative aspect-video rounded-xl overflow-hidden border shadow-lg group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={result} alt={t('studio.resultAlt')} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <Button size="sm" variant="secondary" className="gap-2">
                <Download className="h-4 w-4" /> {t('studio.download')}
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] capitalize">{t(`styles.${stylePreset}.label`)}</Badge>
            <p className="text-xs text-muted-foreground truncate">&quot;{prompt}&quot;</p>
          </div>
        </div>
      ) : (
        <div className="aspect-video rounded-xl border border-dashed bg-muted/20 flex flex-col items-center justify-center gap-3">
          <ImageIcon className="h-12 w-12 text-muted-foreground/25" />
          <div className="text-center">
            <p className="text-sm font-medium">{t('studio.emptyTitle')}</p>
            <p className="text-xs text-muted-foreground mt-1">{t('studio.emptyDescription')}</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <PageHeader
        title={t('page.title')}
        description={t('page.description')}
        actions={
          <Badge variant="outline" className="gap-1.5 px-3 py-1 border-primary/20 bg-primary/5 text-primary">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" /> {t('page.aiPowered')}
          </Badge>
        }
      />
      <TwoPanelLayout
        leftContent={renderConfig()}
        rightContent={renderOutput()}
        leftTitle={t('studio.visualCore')}
        leftDescription={t('studio.visualCoreDescription')}
        rightTitle={t('studio.theRender')}
        rightDescription={t('studio.renderMeta')}
      />
    </div>
  );
}
