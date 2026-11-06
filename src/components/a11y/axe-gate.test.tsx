// @vitest-environment jsdom
import { render } from '@testing-library/react';
import * as axe from 'axe-core';
import { describe, expect, it } from 'vitest';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FilterBar } from '@/components/shared/filter-bar';

/**
 * T22 — axe CI gate: zero serious/critical violations on the shared
 * primitives that compose every route (buttons, inputs, badges, filter bar).
 * Runs on every `vitest run` (CI `test` job), so a regression fails CI.
 *
 * `color-contrast` is excluded: jsdom has no layout engine, so axe cannot
 * compute rendered contrast here. Contrast is verified separately by the
 * token check in docs/a11y-audit.md (T22 §1 re-verification).
 */
describe('axe gate (T22)', () => {
    it('has no serious or critical violations on shared primitives', async () => {
        const { container } = render(
            <div>
                <Button type="button">Save</Button>
                <Button type="button" variant="outline" size="icon" aria-label="Close">
                    ×
                </Button>
                <div className="space-y-2">
                    <Label htmlFor="axe-name">Name</Label>
                    <Input id="axe-name" placeholder="e.g. Project" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="axe-notes">Notes</Label>
                    <Textarea id="axe-notes" placeholder="Details..." />
                </div>
                <Badge
                    variant="secondary"
                    role="button"
                    tabIndex={0}
                    aria-label="Remove Comedy filter"
                >
                    Comedy
                </Badge>
                <FilterBar
                    searchValue=""
                    onSearchChange={() => {}}
                    searchPlaceholder="Search projects..."
                    filters={[
                        {
                            id: 'status',
                            label: 'Status',
                            value: 'All',
                            onChange: () => {},
                            options: [{ label: 'All', value: 'All' }],
                        },
                    ]}
                />
            </div>,
        );

        const results = await axe.run(container, {
            resultTypes: ['violations'],
            rules: { 'color-contrast': { enabled: false } },
        });

        const bad = results.violations.filter(
            (v) => v.impact === 'serious' || v.impact === 'critical',
        );

        expect(
            bad.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s)`),
        ).toEqual([]);
    }, 20_000);
});
