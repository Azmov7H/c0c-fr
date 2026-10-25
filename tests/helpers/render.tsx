/*
 * Shared React Testing Library helper (T18).
 *
 * `renderWithProviders` mounts a component inside the providers most feature
 * components assume: TanStack Query and the Radix tooltip scope. The
 * QueryClient is fresh per call with retry disabled and staleTime 0 so a test
 * never depends on cache timing.
 *
 * Tests that need routing should mock `next/navigation` (vi.mock) the way the
 * existing feature tests do — a real Next.js router cannot run inside jsdom.
 */
import type { ReactElement, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';

export function createTestQueryClient(): QueryClient {
    return new QueryClient({
        defaultOptions: {
            queries: { retry: false, staleTime: 0, gcTime: 0 },
            mutations: { retry: false },
        },
    });
}

type ProviderRenderOptions = { queryClient?: QueryClient } & Omit<RenderOptions, 'wrapper'>;

export function renderWithProviders(
    ui: ReactElement,
    options: ProviderRenderOptions = {}
): RenderResult & { queryClient: QueryClient } {
    const queryClient = options.queryClient ?? createTestQueryClient();
    const { queryClient: _omit, ...renderOptions } = options;

    const result = render(ui, {
        ...renderOptions,
        wrapper: ({ children }: { children?: ReactNode }) => (
            <QueryClientProvider client={queryClient}>
                <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
            </QueryClientProvider>
        ),
    });

    return { ...result, queryClient };
}
