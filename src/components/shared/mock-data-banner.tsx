'use client';

import { FlaskConical } from 'lucide-react';

import { isMockData } from '@/lib/dev-mocks';

/**
 * Visible marker for pages backed by demo data. Renders nothing in production,
 * where the mock data itself is empty — so a banner can never be the only thing
 * standing between a screenshot and a misreading.
 */
export function MockDataBanner({ note }: { note?: string }) {
    if (!isMockData) return null;

    return (
        <div
            role="status"
            className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs font-medium text-warning"
        >
            <FlaskConical className="h-3.5 w-3.5 shrink-0" />
            <span>
                Demo data — this page is not connected to the backend yet.
                {note ? ` ${note}` : ''}
            </span>
        </div>
    );
}
