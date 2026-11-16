// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';

import en from '../../../messages/en/legal.json';

/**
 * AR-024 — the legal pages, rendered.
 *
 * The pages are server components, so the server seam is mocked with a real
 * translator over the real English catalog. What is asserted here is the
 * RENDERED document: the sentences the pages showed before the extraction
 * are still the sentences they show — the floor, stated as a test.
 */
vi.mock('@/i18n/server', async () => {
    const { createTranslator } = await import('next-intl');
    const translator = createTranslator({
        locale: 'en',
        messages: { legal: en },
        namespace: 'legal',
    });
    return {
        getTranslations: async (namespace: string) => {
            if (namespace !== 'legal') {
                throw new Error(`unexpected namespace: ${namespace}`);
            }
            return translator;
        },
    };
});

import PrivacyPage, {
    generateMetadata as privacyMetadata,
} from '@/app/[locale]/(marketing)/privacy/page';
import TermsPage, {
    generateMetadata as termsMetadata,
} from '@/app/[locale]/(marketing)/terms/page';

afterEach(cleanup);

describe('the privacy page', () => {
    it('renders the document the page rendered before the extraction', async () => {
        const { container } = render(await PrivacyPage());

        expect(container.querySelector('h1')?.textContent).toBe('Privacy Policy');
        expect(container.querySelector('strong')?.textContent).toBe(
            'Template — pending legal review.'
        );
        expect(container.textContent).toContain(
            'This is a minimal placeholder so the footer link resolves. It is not a binding policy, and the bracketed fields below are fill-ins, not facts.'
        );
        expect(container.textContent).toContain('What we collect');
        expect(container.textContent).toContain(
            'Account details you provide (name, email address), the content you create in the product, and basic usage data needed to run the service and enforce plan quotas.'
        );
        expect(container.textContent).toContain('How it is used');
        expect(container.textContent).toContain(
            'To operate your account, generate the assets you request, and keep the service secure. We do not sell personal data.'
        );
        expect(container.textContent).toContain('Questions about this policy: [CONTACT EMAIL].');
        expect(container.textContent).toContain(
            'Governing entity: [COMPANY LEGAL NAME], [JURISDICTION]. Effective date: [DATE].'
        );
    });

    it('keeps the document shape', async () => {
        const { container } = render(await PrivacyPage());

        expect(container.querySelectorAll('section')).toHaveLength(3);
        expect(
            Array.from(container.querySelectorAll('h2')).map((heading) =>
                heading.textContent
            )
        ).toEqual(['What we collect', 'How it is used', 'Contact']);
        expect(container.querySelector('p.text-xs')?.textContent).toBe(
            'Governing entity: [COMPANY LEGAL NAME], [JURISDICTION]. Effective date: [DATE].'
        );
    });

    it('describes itself in the search result', async () => {
        const metadata = await privacyMetadata();
        expect(metadata.title).toBe('Privacy Policy');
        expect(metadata.description).toBe(
            'How AI Content Engine handles account and usage data.'
        );
    });
});

describe('the terms page', () => {
    it('renders the document the page rendered before the extraction', async () => {
        const { container } = render(await TermsPage());

        expect(container.querySelector('h1')?.textContent).toBe('Terms of Service');
        expect(container.querySelector('strong')?.textContent).toBe(
            'Template — pending legal review.'
        );
        expect(container.textContent).toContain(
            'This is a minimal placeholder so the footer link resolves. Bracketed fields are fill-ins, not facts.'
        );
        expect(container.textContent).toContain('The service');
        expect(container.textContent).toContain(
            'AI Content Engine generates creative assets (thumbnails, scripts, sound effects, images) for your video projects. You keep the rights to the content you create, subject to the provider terms that govern the generation models.'
        );
        expect(container.textContent).toContain('Fair use');
        expect(container.textContent).toContain(
            'Do not use the service to generate unlawful content or to attack the platform. Plan quotas are enforced per account.'
        );
        expect(container.textContent).toContain('Questions about these terms: [CONTACT EMAIL].');
        expect(container.textContent).toContain(
            'Governing entity: [COMPANY LEGAL NAME], [JURISDICTION]. Effective date: [DATE].'
        );
    });

    it('keeps the document shape', async () => {
        const { container } = render(await TermsPage());

        expect(container.querySelectorAll('section')).toHaveLength(3);
        expect(
            Array.from(container.querySelectorAll('h2')).map((heading) =>
                heading.textContent
            )
        ).toEqual(['The service', 'Fair use', 'Contact']);
    });

    it('describes itself in the search result', async () => {
        const metadata = await termsMetadata();
        expect(metadata.title).toBe('Terms of Service');
        expect(metadata.description).toBe('The terms for using AI Content Engine.');
    });
});
