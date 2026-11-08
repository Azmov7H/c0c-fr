// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Form } from '@/components/ui/form';
import { StepConfiguration, StepReview, StepPlatformTone } from './new-project-steps';
import { projectFormSchema, type ProjectFormValues } from '../lib/project-schemas';
import { readProjectDraft, writeProjectDraft } from '../lib/project-draft';

const BLANK: ProjectFormValues = { title: 'T', description: '', idea: 'I', platform: 'youtube', tone: 'casual' };

function Harness({ children }: { children: (form: UseFormReturn<ProjectFormValues>) => React.ReactNode }) {
    const form = useForm<ProjectFormValues>({
        resolver: zodResolver(projectFormSchema),
        defaultValues: { ...BLANK, contentFormat: 'short' },
    });
    return <Form {...form}>{children(form)}</Form>;
}

describe('StepConfiguration (P04.3)', () => {
    it('offers only format + duration; voice options are pending, not guessed', () => {
        render(<Harness>{(form) => <StepConfiguration form={form} />}</Harness>);
        expect(screen.getByText('Content format')).toBeTruthy();
        expect(screen.getByText('Long-form')).toBeTruthy();
        expect(screen.getByText('Short-form')).toBeTruthy();
        expect(screen.getByText(/not available until the text-to-speech provider is verified/)).toBeTruthy();
        expect(screen.queryByLabelText('Language')).toBeNull();
        expect(screen.queryByLabelText('Dialect')).toBeNull();
        expect(screen.queryByLabelText('Voice')).toBeNull();
    });

    it('review shows format + duration', () => {
        render(
            <Harness>
                {(form) => {
                    form.setValue('platform', 'facebook');
                    form.setValue('contentFormat', 'short');
                    form.setValue('durationSeconds', 60);
                    return <StepReview form={form} onEdit={() => {}} />;
                }}
            </Harness>
        );
        expect(screen.getByText('Short-form')).toBeTruthy();
        expect(screen.getByText('60s')).toBeTruthy();
    });

    it('platform step includes Facebook', () => {
        render(<Harness>{(form) => <StepPlatformTone form={form} />}</Harness>);
        expect(screen.getByText('Facebook')).toBeTruthy();
        expect(screen.getByText('Reels')).toBeTruthy();
    });
});

describe('draft autosave (P04.3)', () => {
    it('round-trips contentFormat + durationSeconds + facebook', () => {
        const store = new Map<string, string>();
        const storage = {
            getItem: (k: string) => store.get(k) ?? null,
            setItem: (k: string, v: string) => void store.set(k, v),
            removeItem: (k: string) => void store.delete(k),
        } as Storage;
        writeProjectDraft(
            storage,
            { title: 'T', platform: 'facebook', contentFormat: 'long', durationSeconds: 600 } as never,
            3
        );
        const draft = readProjectDraft(storage);
        expect(draft!.step).toBe(3);
        expect(draft!.values.platform).toBe('facebook');
        expect(draft!.values.contentFormat).toBe('long');
        expect(draft!.values.durationSeconds).toBe(600);
    });
});
