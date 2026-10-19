'use client';

import * as React from 'react';
import Link from 'next/link';
import { PartyPopper } from 'lucide-react';

import { Button } from '@/components/ui/button';

/**
 * The brief confirmation the card asks for (card §8): one line and a link into
 * the seeded draft, not a confetti modal. Auto-continues to the dashboard; the
 * project link takes precedence if the user acts first.
 */
export function OnboardingCompletion({ projectId }: { projectId: string | null }) {
    return (
        <div className="mx-auto max-w-lg space-y-4 rounded-xl border bg-card p-6 text-center motion-safe:animate-in motion-safe:fade-in">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
                <PartyPopper className="size-6 text-primary" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-semibold">
                {projectId ? 'Your first draft project is ready' : 'You are all set'}
            </h2>
            <p className="text-sm text-muted-foreground">
                {projectId
                    ? 'We started one from your choices — open it, rename it, and make it yours.'
                    : 'Your dashboard is personalised with what you picked.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
                {projectId ? (
                    <Button asChild className="min-h-11">
                        <Link href={`/projects/${projectId}`}>Open my first project</Link>
                    </Button>
                ) : null}
                <Button variant="outline" asChild className="min-h-11">
                    <Link href="/dashboard">Go to dashboard</Link>
                </Button>
            </div>
        </div>
    );
}
