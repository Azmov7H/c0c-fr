'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Copy, Download, FileText, Loader2, RotateCcw, Sparkles } from 'lucide-react';

import { PageHeader } from '@/components/shared/page-header';
import { TwoPanelLayout } from '@/components/shared/two-panel-layout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProjects } from '@/features/projects/hooks/use-projects';
import { Link } from '@/i18n/navigation';
import { toApiError } from '@/lib/api-error';

import { useGenerateScript } from '../hooks/use-scripts';
import { scriptSceneLabel } from '../lib/script-labels';
import type { Script } from '../types';

/** The persisted script is the only output; no client-side placeholder text. */
const scriptTextOf = (script: Script): string =>
  script.sections
    .slice()
    .sort((left, right) => left.order - right.order)
    .map((section) => {
      const narration = section.narration?.trim()
        ? `\n${section.narration.trim()}`
        : '';
      // Export keeps the persisted label token byte-stable; only the panel
      // renders localized labels (AR-032).
      return `${section.label}: ${section.content}${narration}`;
    })
    .join('\n\n');

export function ScriptGenerator() {
  const t = useTranslations('scripts');
  const { data, isLoading, error, refetch } = useProjects({ limit: 50 });
  const projects = data?.data ?? [];
  const [pickedId, setPickedId] = useState<string>();
  const generate = useGenerateScript();

  const projectId = pickedId ?? projects[0]?._id;
  const project = projects.find((item) => item._id === projectId);
  // A script from another project is never shown under a different brief.
  const script = generate.data?.projectId === projectId ? generate.data : undefined;

  const handleGenerate = () => {
    if (!projectId) return;
    generate.mutate(projectId);
  };

  const copyScript = () => {
    if (script) void navigator.clipboard.writeText(scriptTextOf(script));
  };

  const exportScript = () => {
    if (!script) return;
    const url = URL.createObjectURL(
      new Blob([scriptTextOf(script)], { type: 'text/plain;charset=utf-8' })
    );
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `script-${script.id}.txt`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const leftContent = (
    <div className="space-y-6">
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>{t('generator.loadErrorTitle')}</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>{toApiError(error, t('generator.loadError')).message}</p>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              {t('generator.retry')}
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {!isLoading && !error && projects.length === 0 ? (
        <Alert>
          <AlertTitle>{t('generator.noProjects')}</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>{t('generator.noProjectsDescription')}</p>
            <Button asChild variant="outline" size="sm">
              <Link href="/projects/new">{t('generator.createProject')}</Link>
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-3">
        <Label htmlFor="script-project">{t('generator.projectLabel')}</Label>
        <Select
          value={projectId}
          onValueChange={setPickedId}
          disabled={isLoading || projects.length === 0}
        >
          <SelectTrigger id="script-project">
            <SelectValue placeholder={t('generator.projectPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            {projects.map((item) => (
              <SelectItem key={item._id} value={item._id}>
                {item.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {project ? (
        <div className="space-y-2 rounded-xl border border-border/50 p-4" dir="auto">
          <h3 className="text-sm font-semibold">{t('generator.briefLabel')}</h3>
          <p className="text-sm text-muted-foreground">{project.idea}</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{project.platform}</Badge>
            <Badge variant="outline">{project.tone}</Badge>
          </div>
        </div>
      ) : null}

      <Button onClick={handleGenerate} disabled={!projectId || generate.isPending} className="w-full">
        {generate.isPending ? (
          <Loader2 className="size-4 me-2 animate-spin" aria-hidden="true" />
        ) : (
          <Sparkles className="size-4 me-2" aria-hidden="true" />
        )}
        {generate.isPending ? t('generator.generating') : t('generator.generate')}
      </Button>
    </div>
  );

  const rightContent = script ? (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{t('generator.generatedBadge')}</Badge>
          <Badge variant="outline">
            {t('generator.sectionSummary', {
              scenes: script.sections.length,
              words: script.wordCount,
            })}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleGenerate} disabled={generate.isPending}>
            <RotateCcw className="size-3.5 me-1" aria-hidden="true" /> {t('generator.regenerate')}
          </Button>
          <Button variant="ghost" size="sm" onClick={copyScript}>
            <Copy className="size-3.5 me-1" aria-hidden="true" /> {t('generator.copy')}
          </Button>
          <Button variant="ghost" size="sm" onClick={exportScript}>
            <Download className="size-3.5 me-1" aria-hidden="true" /> {t('generator.export')}
          </Button>
        </div>
      </div>

      {script.sections.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('generator.noSections')}</p>
      ) : (
        <div className="space-y-3">
          {script.sections
            .slice()
            .sort((left, right) => left.order - right.order)
            .map((section) => (
              <div key={`${section.order}-${section.label}`} dir="auto" className="rounded-xl border p-4">
                <p className="text-sm font-semibold">{scriptSceneLabel(t, section.label)}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm">{section.content}</p>
              </div>
            ))}
        </div>
      )}
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center h-full text-center p-12">
      <div className="size-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
        <FileText className="size-8 text-primary" />
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
