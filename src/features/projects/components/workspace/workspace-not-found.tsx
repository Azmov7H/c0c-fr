'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { FolderX } from 'lucide-react';

import { Button } from '@/components/ui/button';

/**
 * T16 security copy: a non-member gets the same 404 as a missing project from the
 * API. The UI must not add "permission" language, which would confirm the project
 * exists and defeat the existence-hiding policy.
 */
export function WorkspaceNotFound() {
    const t = useTranslations('workspace');
    return (
        <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
            <FolderX className="size-12 text-muted-foreground" aria-hidden="true" />
            <h1 className="mt-4 text-2xl font-bold">{t('notFound.title')}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
                {t('notFound.description')}
            </p>
            <Button asChild className="mt-6 h-11">
                <Link href="/projects">{t('notFound.back')}</Link>
            </Button>
        </div>
    );
}
