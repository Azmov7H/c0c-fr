import { describe, expect, it } from 'vitest';

import arOnboarding from '../../../messages/ar/onboarding.json';
import enOnboarding from '../../../messages/en/onboarding.json';
import { hardcodedCopy } from '../../../tests/helpers/hardcoded-copy';

/**
 * AR-029 — the onboarding wizard.
 *
 * The same proofs the earlier extractions made:
 *
 *   1. the SURFACE reads its copy from the catalog — the shared scanner fails
 *      on English still written in the source;
 *   2. the ENGLISH is verbatim what the wizard rendered before the extraction;
 *   3. the ARABIC is really Arabic — nothing empty, nothing a copy of English;
 *   4. every placeholder survives, and no value uses a bare `#` (which would
 *      flip the Latin digits the locale deliberately keeps);
 *   5. every `@dynamic` taxonomy key resolves and covers the whole backend
 *      vocabulary — an added backend value falls back to its API label.
 */
const SURFACE = [
    'src/features/onboarding/components/onboarding-wizard.tsx',
    'src/features/onboarding/components/step-panels.tsx',
    'src/features/onboarding/components/skip-dialog.tsx',
    'src/features/onboarding/components/wizard-progress.tsx',
    'src/features/onboarding/components/onboarding-completion.tsx',
    'src/features/onboarding/components/option-grid.tsx',
    'src/app/[locale]/(dashboard)/onboarding/page.tsx',
];

/** A TypeScript generic in a `.tsx` file looks like JSX text to the scanner. */
const ALLOWED = ['const COLUMN_CLASS'];

type Catalog = typeof enOnboarding;

/** The English the wizard rendered before AR-029 — the regression floor. */
const FLOOR = {
    metadata: {
        title: 'Get started',
        description: 'Tell us what you make so your workspace starts personalised.',
    },
    header: {
        personaliseTitle: 'Let us personalise your workspace',
        personaliseDescription: 'A few quick questions so your dashboard starts useful instead of empty.',
        editTitle: 'Update your interests',
    },
    progress: {
        stepOf: 'Step {current} of {total}',
        stepFallback: 'Step {step}',
        finish: 'Finish',
        ariaLabel: 'Onboarding progress: step {current} of {total}',
    },
    wizard: {
        back: 'Back',
        continue: 'Continue',
        saving: 'Saving…',
        tryAgain: 'Try again',
        finishing: 'Finishing…',
        finishOnboarding: 'Finish onboarding',
        saveAndReturn: 'Save and return',
        toFinish: 'To finish, add {items}.',
        stillNeeded: 'Still needed: {items}.',
        reassurance: 'Your answers are safe — try again.',
        errors: {
            chooseOption: 'Choose an option to continue.',
            saveFailed: 'We could not save that answer.',
            completeFailed: 'We could not finish onboarding.',
            skipFailed: 'We could not skip right now. Try again.',
            emptyTaxonomy: 'The topic list came back empty.',
        },
    },
    steps: {
        fallbackTitle: 'Step {step}',
        niche: { description: 'Pick the one that fits you best.', label: 'Niche', search: 'Search niches' },
        subtopics: {
            description: 'Choose {min}–{max}. You have picked {count}.',
            label: 'Subtopics',
            search: 'Search subtopics',
        },
        platforms: { description: 'Pick up to {max}.', label: 'Platforms' },
        experience: {
            description: 'This tunes the depth of what we suggest first.',
            label: 'Experience level',
        },
        goals: { description: 'Pick everything that applies.', label: 'Goals' },
        review: {
            description: 'Check everything over — you can change any answer before finishing.',
            edit: 'Edit',
        },
    },
    review: {
        niche: 'Niche',
        subtopics: 'Subtopics',
        platforms: 'Platforms',
        experience: 'Experience',
        goals: 'Goals',
        empty: '—',
    },
    skip: {
        trigger: 'Skip for now',
        title: 'Skip personalisation?',
        description:
            'Your dashboard will use generic defaults instead of your interests, and skipping forfeits the starter allowance for your first project. You can update your interests later from Account settings.',
        keepGoing: 'Keep going',
        skipping: 'Skipping…',
        confirm: 'Skip onboarding',
    },
    completion: {
        projectTitle: 'Your first draft project is ready',
        title: 'You are all set',
        projectDescription: 'We started one from your choices — open it, rename it, and make it yours.',
        description: 'Your dashboard is personalised with what you picked.',
        openProject: 'Open my first project',
        goToDashboard: 'Go to dashboard',
    },
    skeleton: { loading: 'Loading onboarding' },
    validation: {
        chooseOneNiche: 'Choose one niche to continue.',
        chooseListedNiche: 'Choose one of the listed niches.',
        chooseSubtopics: 'Choose between {min} and {max} subtopics.',
        subtopicFromList: 'Every subtopic must come from the list.',
        choosePlatforms: 'Choose between {min} and {max} platforms.',
        pickExperience: 'Pick your experience level.',
        pickListedExperience: 'Pick one of the listed experience levels.',
        pickAtLeastOneGoal: 'Pick at least one goal.',
        goalFromList: 'Every goal must come from the list.',
        missingNiche: 'a niche',
        missingSubtopics: '{min}–{max} subtopics',
        missingPlatform: 'at least one platform',
        missingExperience: 'your experience level',
        missingGoal: 'at least one goal',
    },
    taxonomy: {
        niches: {
            tech: 'Tech & Software',
            gaming: 'Gaming',
            finance: 'Finance & Investing',
            healthFitness: 'Health & Fitness',
            food: 'Food & Cooking',
            education: 'Education & Study',
            entertainment: 'Entertainment',
            lifestyle: 'Lifestyle & Vlogging',
            business: 'Business & Marketing',
            science: 'Science & Nature',
            diy: 'DIY & Making',
            sports: 'Sports',
        },
        subtopics: {
            aiMl: 'AI & ML',
            webDevelopment: 'Web development',
            mobileApps: 'Mobile apps',
            gadgets: 'Gadgets',
            cybersecurity: 'Cybersecurity',
            gameReviews: 'Game reviews',
            gameplayWalkthroughs: 'Gameplay walkthroughs',
            esports: 'Esports',
            indieGames: 'Indie games',
            mods: 'Mods',
            personalFinance: 'Personal finance',
            stockPicks: 'Stock picks',
            crypto: 'Crypto',
            realEstate: 'Real estate',
            sideHustles: 'Side hustles',
            workouts: 'Workouts',
            nutrition: 'Nutrition',
            mentalHealth: 'Mental health',
            running: 'Running',
            homeFitness: 'Home fitness',
            recipes: 'Recipes',
            mealPrep: 'Meal prep',
            streetFood: 'Street food',
            baking: 'Baking',
            restaurants: 'Restaurants',
            studyTips: 'Study tips',
            productivity: 'Productivity',
            languageLearning: 'Language learning',
            careerAdvice: 'Career advice',
            tutorials: 'Tutorials',
            filmTv: 'Film & TV',
            music: 'Music',
            comedy: 'Comedy',
            celebrityNews: 'Celebrity news',
            anime: 'Anime',
            dayInMyLife: 'Day in my life',
            travel: 'Travel',
            homeOrganisation: 'Home organisation',
            fashion: 'Fashion',
            beauty: 'Beauty',
            startups: 'Startups',
            freelancing: 'Freelancing',
            marketing: 'Marketing',
            ecommerce: 'E-commerce',
            productivitySystems: 'Productivity systems',
            space: 'Space',
            biology: 'Biology',
            physics: 'Physics',
            animals: 'Animals',
            climate: 'Climate',
            woodworking: 'Woodworking',
            electronics: 'Electronics',
            crafts: 'Crafts',
            threeDPrinting: '3D printing',
            homeRepair: 'Home repair',
            football: 'Football',
            basketball: 'Basketball',
            mma: 'MMA',
            marathons: 'Marathons',
            strengthTraining: 'Strength training',
        },
        experience: {
            beginner: 'Just starting out',
            intermediate: 'Some experience',
            advanced: 'Experienced creator',
        },
        goals: {
            growAudience: 'Grow my audience',
            monetise: 'Monetise my channel',
            buildBrand: 'Build a personal brand',
            clientWork: 'Work for clients',
            explore: 'Just exploring',
        },
        steps: {
            niche: 'What do you make content about?',
            subtopics: 'Which subtopics interest you?',
            platforms: 'Where do you publish?',
            experience: 'How experienced are you?',
            goals: 'What are you aiming for?',
            review: 'Review your choices',
        },
        platforms: { youtube: 'YouTube', tiktok: 'TikTok', instagram: 'Instagram' },
    },
} satisfies Omit<Catalog, '@dynamic'>;

function flatten(value: unknown, prefix = ''): Record<string, string> {
    const out: Record<string, string> = {};
    if (typeof value !== 'object' || value === null) return { [prefix]: String(value) };
    for (const [key, child] of Object.entries(value)) {
        if (prefix === '' && key.startsWith('@')) continue;
        Object.assign(out, flatten(child, prefix ? `${prefix}.${key}` : key));
    }
    return out;
}

const PLACEHOLDER = /\{(\w+)\}/g;
function placeholders(value: string): string[] {
    return [...value.matchAll(PLACEHOLDER)].map((match) => match[1]).sort();
}

describe('AR-029 the onboarding extraction', () => {
    it('the surface has no English copy left in the source', () => {
        const leftovers = SURFACE.flatMap((file) =>
            hardcodedCopy(file, { allowed: ALLOWED }).map((text) => `${file}: ${text}`)
        );
        expect(leftovers).toEqual([]);
    });

    it('the English is the copy the wizard rendered before the extraction', () => {
        expect(flatten(enOnboarding)).toEqual(flatten(FLOOR));
    });

    it('the Arabic is really Arabic: nothing empty, nothing a copy of English', () => {
        const english = flatten(enOnboarding);
        const arabic = flatten(arOnboarding);
        expect(Object.keys(arabic).sort(), 'keys').toEqual(Object.keys(english).sort());
        for (const [key, value] of Object.entries(arabic)) {
            expect(value, `${key} is empty`).not.toBe('');
            // Platform brand names are deliberately shared by design.
            const sharedByDesign =
                /^taxonomy\.platforms\./.test(key) || /^[\s,.…—]*$/.test(value);
            if (!sharedByDesign) {
                expect(value, `${key} is the English string`).not.toBe(english[key]);
            }
        }
    });

    it('every placeholder survives the translation', () => {
        const english = flatten(enOnboarding);
        const arabic = flatten(arOnboarding);
        for (const [key, value] of Object.entries(english)) {
            expect(placeholders(arabic[key]), key).toEqual(placeholders(value));
        }
    });

    it('no catalog value uses a bare # (it would switch the digits)', () => {
        for (const catalog of [enOnboarding, arOnboarding]) {
            for (const [key, value] of Object.entries(flatten(catalog))) {
                expect(value, key).not.toMatch(/(^|[^{])#/);
            }
        }
    });

    it('every @dynamic taxonomy key resolves in both catalogs', () => {
        const english = flatten(enOnboarding);
        const arabic = flatten(arOnboarding);
        const dynamic = enOnboarding['@dynamic'];
        expect(dynamic.length).toBeGreaterThan(0);
        expect(arOnboarding['@dynamic']).toEqual(dynamic);
        for (const key of dynamic) {
            expect(english[key], `en.${key}`).toBeTruthy();
            expect(arabic[key], `ar.${key}`).toBeTruthy();
        }

        // The reverse direction catches a taxonomy label added to a catalog
        // but forgotten in @dynamic (which would make extract-usage warn).
        for (const key of Object.keys(english)) {
            if (key.startsWith('taxonomy.')) {
                expect(dynamic, `${key} must be listed under @dynamic`).toContain(key);
            }
        }
    });

    it('the English taxonomy labels equal the backend labels verbatim', () => {
        // The backend is the source of truth; the English catalog is only
        // allowed to mirror it. An English "translation" here would make /en
        // drift from the API and break the no-drift rule.
        expect(enOnboarding.taxonomy.experience).toEqual({
            beginner: 'Just starting out',
            intermediate: 'Some experience',
            advanced: 'Experienced creator',
        });
        expect(enOnboarding.taxonomy.platforms).toEqual({
            youtube: 'YouTube',
            tiktok: 'TikTok',
            instagram: 'Instagram',
        });
        expect(enOnboarding.taxonomy.steps.niche).toBe('What do you make content about?');
        expect(enOnboarding.taxonomy.niches.tech).toBe('Tech & Software');
        expect(enOnboarding.taxonomy.subtopics.webDevelopment).toBe('Web development');
    });
});
