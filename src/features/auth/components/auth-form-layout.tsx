import * as React from 'react';
import { Sparkles } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * One layout for every auth card (T12 acceptance: login and signup share a
 * single layout component, not two divergent copies). Server-renderable — the
 * interactive parts arrive as children.
 */
interface AuthFormLayoutProps {
    /** Figma-style page headline above the card. */
    heading: string;
    subheading: string;
    /** Card title + description. */
    title: string;
    description: string;
    children: React.ReactNode;
    /** Optional bar under the card (link to the opposite flow). */
    footer?: React.ReactNode;
    className?: string;
}

export function AuthFormLayout({
    heading,
    subheading,
    title,
    description,
    children,
    footer,
    className,
}: AuthFormLayoutProps) {
    return (
        <div className="relative min-h-screen flex items-center justify-center bg-background overflow-hidden px-4 py-12">
            <div
                className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none"
                aria-hidden="true"
            >
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse motion-reduce:animate-none" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-info/10 rounded-full blur-[120px] animate-pulse delay-700 motion-reduce:animate-none" />
            </div>

            <div
                className={cn(
                    'w-full max-w-[460px] z-10 animate-in fade-in zoom-in-95 duration-500 motion-reduce:animate-none',
                    className
                )}
            >
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center p-3 bg-primary ring-8 ring-primary/10 rounded-2xl mb-6 shadow-glow">
                        <Sparkles className="h-8 w-8 text-primary-foreground" aria-hidden="true" />
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-foreground">{heading}</h1>
                    <p className="text-muted-foreground mt-2 font-medium">{subheading}</p>
                </div>

                <Card className="glass border-border/50 shadow-premium overflow-hidden">
                    <CardHeader className="space-y-1 pb-4">
                        <CardTitle className="text-xl font-bold">{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">{children}</CardContent>
                    {footer ? (
                        <div className="bg-muted/30 p-6 text-center border-t border-border/50">{footer}</div>
                    ) : null}
                </Card>

                <p className="text-center text-[10px] text-muted-foreground mt-8 uppercase tracking-[0.2em] font-bold opacity-50">
                    &copy; 2026 Arch-AI Content Engine
                </p>
            </div>
        </div>
    );
}
