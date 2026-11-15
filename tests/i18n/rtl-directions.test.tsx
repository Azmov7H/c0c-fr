// @vitest-environment jsdom
/**
 * AR-021 — the direction variants.
 *
 * The QA gallery (`/en/qa/rtl`) is the review artifact a human looks at;
 * this suite is its machine-checked shadow. It proves three things about the
 * primitives the gallery renders:
 *
 *   1. the MARKUP is direction-neutral — the same classes in both
 *      directions, because the direction is carried by the DOCUMENT (the
 *      `dir` attribute), never baked into the classes;
 *   2. the rendered markup carries no PHYSICAL utility — the rendered
 *      counterpart of the `check-rtl.mjs` gate (AR-020), which scans the
 *      source;
 *   3. the icons that must mirror carry the mirror class, and the ones that
 *      must not, do not.
 *
 * jsdom has no layout engine, so it cannot see a flipped pixel: the visual
 * truth comes from Playwright (`tests/e2e/specs/rtl-a11y.spec.ts`). What it
 * CAN see — and what actually breaks in practice — is a class list that
 * differs between the two directions, which is why the assertions below are
 * about classes.
 */
import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';

import { DirIcon } from '../../src/components/icons/dir-icon';
import { RtlQaGallery } from '../../src/components/qa/rtl-qa-gallery';
import { RTL_QA_SAMPLES } from '../../src/components/qa/rtl-qa-content';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '../../src/components/ui/breadcrumb';
import { Button } from '../../src/components/ui/button';
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from '../../src/components/ui/pagination';
import { Progress } from '../../src/components/ui/progress';
import { physicalUtilitiesInClasses } from '../../scripts/rtl-utilities.mjs';

const mocks = { pathname: '/en/qa/rtl' };

vi.mock('next/navigation', () => ({
    usePathname: () => mocks.pathname,
}));

/**
 * The physical utilities of a rendered element.
 *
 * The matcher is the SAME one the CI gate uses (AR-020, AR-021): a gate and
 * a test that look for the same thing with two different implementations are
 * two different definitions of "the same thing" — and they drift.
 */
function physicalUtilities(container: HTMLElement): string[] {
    return physicalUtilitiesInClasses(
        Array.from(container.querySelectorAll('*'))
            .map((element) => element.getAttribute('class') ?? '')
            .join(' ')
    );
}

/**
 * The generated ids React and Radix produce differ from render to render;
 * they say nothing about the direction, so they are normalized away before
 * anything is compared.
 */
function normalize(html: string): string {
    return html
        .replace(/id="[^"]*"/g, 'id="ID"')
        .replace(/aria-labelledby="[^"]*"/g, 'aria-labelledby="ID"')
        .replace(/aria-describedby="[^"]*"/g, 'aria-describedby="ID"')
        .replace(/for="[^"]*"/g, 'for="ID"');
}

function classNamesOf(container: HTMLElement): string[] {
    return Array.from(container.querySelectorAll('*')).map(
        (element) => element.getAttribute('class') ?? ''
    );
}

/** A representative row of the patched primitives, in one direction. */
function Sample() {
    return (
        <div className="flex items-center gap-2 p-4">
            <Button variant="outline">
                <DirIcon name="ChevronRight" className="me-2 size-4" />
                Next
            </Button>
            <Pagination>
                <PaginationContent>
                    <PaginationItem>
                        <PaginationLink href="#" aria-label="Previous">
                            <DirIcon name="ChevronLeft" />
                        </PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                        <PaginationLink href="#" isActive>
                            2
                        </PaginationLink>
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="#">Projects</BreadcrumbLink>
                        <BreadcrumbSeparator />
                    </BreadcrumbItem>
                    <BreadcrumbItem>
                        <BreadcrumbPage>Scripts</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <Progress value={62} />
        </div>
    );
}

function renderIn(direction: 'ltr' | 'rtl') {
    const { container } = render(<div dir={direction}>{<Sample />}</div>);
    const pane = container.firstElementChild as HTMLElement;
    return { container, pane, html: normalize(pane.innerHTML) };
}

describe('the markup is direction-neutral', () => {
    beforeEach(() => {
        mocks.pathname = '/en/qa/rtl';
    });

    it('renders the same classes in both directions', () => {
        const ltr = renderIn('ltr');
        const rtl = renderIn('rtl');

        expect(classNamesOf(rtl.pane)).toEqual(classNamesOf(ltr.pane));
    });

    it('renders the same markup in both directions', () => {
        const ltr = renderIn('ltr');
        const rtl = renderIn('rtl');

        expect(rtl.html).toBe(ltr.html);
    });

    it('snapshots both directions', () => {
        // The pair is the point: the two snapshots must stay identical, and a
        // diff in either one is a diff in the product.
        expect(renderIn('ltr').html).toMatchSnapshot('ltr');
        expect(renderIn('rtl').html).toMatchSnapshot('rtl');
    });

    it('carries no physical utility in the rendered markup', () => {
        const { pane } = renderIn('rtl');

        expect(physicalUtilities(pane)).toEqual([]);
    });
});

describe('the icons', () => {
    it('a directional icon carries the mirror class', () => {
        const { container } = render(<DirIcon name="ChevronRight" />);
        const icon = container.querySelector('svg');

        expect(icon?.getAttribute('class')).toContain('rtl:rotate-180');
    });

    it('the mirror class is the only direction-specific thing in the markup', () => {
        // The class is inert in English — that is why the English rendering
        // does not change — and it is the ONLY thing the direction touches.
        const { container } = render(<DirIcon name="ChevronRight" />);
        const icon = container.querySelector('svg');
        const classes = (icon?.getAttribute('class') ?? '').split(' ');

        expect(classes.filter((name) => name.includes('rtl'))).toEqual(['rtl:rotate-180']);
    });
});

describe('the progress bar', () => {
    it('fills by WIDTH, not by a transform', () => {
        // A transform shifts the bar to the left — in English. A width is
        // placed at the INLINE START edge of its container, so the same style
        // fills from the start in both directions (AR-021).
        const { container } = render(<Progress value={62} />);
        const indicator = container.querySelector('[data-slot="progress-indicator"]');

        expect(indicator?.getAttribute('style')).toContain('width: 62%');
        expect(indicator?.getAttribute('style')).not.toContain('transform');
    });
});

describe('the QA gallery', () => {
    it('renders both directions side by side', () => {
        const { container } = render(<RtlQaGallery />);

        const ltr = container.querySelector('[data-qa-pane="ltr"]');
        const rtl = container.querySelector('[data-qa-pane="rtl"]');

        expect(ltr).not.toBeNull();
        expect(rtl).not.toBeNull();
        expect(ltr?.getAttribute('dir')).toBe('ltr');
        expect(rtl?.getAttribute('dir')).toBe('rtl');
        expect(ltr?.getAttribute('lang')).toBe('en');
        expect(rtl?.getAttribute('lang')).toBe('ar');
    });

    it('renders the same components in both panes', () => {
        const { container } = render(<RtlQaGallery />);
        const ltr = container.querySelector('[data-qa-pane="ltr"]') as HTMLElement;
        const rtl = container.querySelector('[data-qa-pane="rtl"]') as HTMLElement;

        // The panes differ in the COPY and in nothing else: the same number of
        // sections, the same slots, the same components.
        expect(rtl.querySelectorAll('section').length).toBe(
            ltr.querySelectorAll('section').length
        );
        expect(rtl.querySelectorAll('[data-slot]').length).toBe(
            ltr.querySelectorAll('[data-slot]').length
        );
    });

    it('carries no physical utility in either pane', () => {
        const { container } = render(<RtlQaGallery />);

        for (const pane of Array.from(container.querySelectorAll('[data-qa-pane]'))) {
            expect(
                physicalUtilities(pane as HTMLElement),
                `the ${pane.getAttribute('data-qa-pane')} pane carries a physical utility`
            ).toEqual([]);
        }
    });

    it('carries the Arabic copy in the RTL pane and the English copy in the LTR pane', () => {
        const { container } = render(<RtlQaGallery />);
        const rtl = container.querySelector('[data-qa-pane="rtl"]') as HTMLElement;
        const ltr = container.querySelector('[data-qa-pane="ltr"]') as HTMLElement;

        expect(rtl.textContent).toContain(RTL_QA_SAMPLES.ar.buttons.primary);
        expect(ltr.textContent).toContain(RTL_QA_SAMPLES.en.buttons.primary);
        expect(rtl.textContent).not.toContain(RTL_QA_SAMPLES.en.buttons.primary);
    });

    it('follows the URL locale for the page chrome', () => {
        mocks.pathname = '/ar/qa/rtl';
        const { container } = render(<RtlQaGallery />);

        expect(container.textContent).toContain(RTL_QA_SAMPLES.ar.pageTitle);
    });
});
