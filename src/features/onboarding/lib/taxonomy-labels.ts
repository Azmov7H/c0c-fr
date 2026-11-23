import type { useTranslations } from 'next-intl';

import { isArabic } from '@/i18n/exceptions';
import type { AppLocale } from '@/i18n/routing';

import type enOnboarding from '../../../../messages/en/onboarding.json';

/**
 * AR-029 — the backend taxonomy stays the SOURCE OF TRUTH.
 *
 * `GET /users/onboarding/options` is fetched at runtime (never hardcoded here).
 * Its labels are English, so this file is only a TRANSLATION OVERLAY: a known
 * backend value gets its `onboarding.taxonomy.*` line; an unknown/new value
 * falls straight back to the backend label, which means the backend can add a
 * niche or rename a subtopic WITHOUT a frontend deploy.
 *
 * English deliberately skips the overlay entirely: `/en` renders the label the
 * API sent, verbatim. That is both the regression floor and the no-drift rule.
 */

export type OnboardingTranslator = ReturnType<typeof useTranslations<'onboarding'>>;

export type TaxonomyGroup =
    | 'niches'
    | 'subtopics'
    | 'experience'
    | 'goals'
    | 'steps'
    | 'platforms';

type NicheKey = keyof (typeof enOnboarding)['taxonomy']['niches'];
type SubtopicKey = keyof (typeof enOnboarding)['taxonomy']['subtopics'];
type ExperienceKey = keyof (typeof enOnboarding)['taxonomy']['experience'];
type GoalKey = keyof (typeof enOnboarding)['taxonomy']['goals'];
type StepKey = keyof (typeof enOnboarding)['taxonomy']['steps'];
type PlatformKey = keyof (typeof enOnboarding)['taxonomy']['platforms'];

type NamespaceKey =
    | `taxonomy.niches.${NicheKey}`
    | `taxonomy.subtopics.${SubtopicKey}`
    | `taxonomy.experience.${ExperienceKey}`
    | `taxonomy.goals.${GoalKey}`
    | `taxonomy.steps.${StepKey}`
    | `taxonomy.platforms.${PlatformKey}`;

/** Backend VALUE (slug, subtopic string, …) → catalog key. */
const KEY_MAPS: Record<TaxonomyGroup, Record<string, NamespaceKey>> = {
    niches: {
        tech: 'taxonomy.niches.tech',
        gaming: 'taxonomy.niches.gaming',
        finance: 'taxonomy.niches.finance',
        'health-fitness': 'taxonomy.niches.healthFitness',
        food: 'taxonomy.niches.food',
        education: 'taxonomy.niches.education',
        entertainment: 'taxonomy.niches.entertainment',
        lifestyle: 'taxonomy.niches.lifestyle',
        business: 'taxonomy.niches.business',
        science: 'taxonomy.niches.science',
        diy: 'taxonomy.niches.diy',
        sports: 'taxonomy.niches.sports',
    },
    subtopics: {
        'AI & ML': 'taxonomy.subtopics.aiMl',
        'Web development': 'taxonomy.subtopics.webDevelopment',
        'Mobile apps': 'taxonomy.subtopics.mobileApps',
        Gadgets: 'taxonomy.subtopics.gadgets',
        Cybersecurity: 'taxonomy.subtopics.cybersecurity',
        'Game reviews': 'taxonomy.subtopics.gameReviews',
        'Gameplay walkthroughs': 'taxonomy.subtopics.gameplayWalkthroughs',
        Esports: 'taxonomy.subtopics.esports',
        'Indie games': 'taxonomy.subtopics.indieGames',
        Mods: 'taxonomy.subtopics.mods',
        'Personal finance': 'taxonomy.subtopics.personalFinance',
        'Stock picks': 'taxonomy.subtopics.stockPicks',
        Crypto: 'taxonomy.subtopics.crypto',
        'Real estate': 'taxonomy.subtopics.realEstate',
        'Side hustles': 'taxonomy.subtopics.sideHustles',
        Workouts: 'taxonomy.subtopics.workouts',
        Nutrition: 'taxonomy.subtopics.nutrition',
        'Mental health': 'taxonomy.subtopics.mentalHealth',
        Running: 'taxonomy.subtopics.running',
        'Home fitness': 'taxonomy.subtopics.homeFitness',
        Recipes: 'taxonomy.subtopics.recipes',
        'Meal prep': 'taxonomy.subtopics.mealPrep',
        'Street food': 'taxonomy.subtopics.streetFood',
        Baking: 'taxonomy.subtopics.baking',
        Restaurants: 'taxonomy.subtopics.restaurants',
        'Study tips': 'taxonomy.subtopics.studyTips',
        Productivity: 'taxonomy.subtopics.productivity',
        'Language learning': 'taxonomy.subtopics.languageLearning',
        'Career advice': 'taxonomy.subtopics.careerAdvice',
        Tutorials: 'taxonomy.subtopics.tutorials',
        'Film & TV': 'taxonomy.subtopics.filmTv',
        Music: 'taxonomy.subtopics.music',
        Comedy: 'taxonomy.subtopics.comedy',
        'Celebrity news': 'taxonomy.subtopics.celebrityNews',
        Anime: 'taxonomy.subtopics.anime',
        'Day in my life': 'taxonomy.subtopics.dayInMyLife',
        Travel: 'taxonomy.subtopics.travel',
        'Home organisation': 'taxonomy.subtopics.homeOrganisation',
        Fashion: 'taxonomy.subtopics.fashion',
        Beauty: 'taxonomy.subtopics.beauty',
        Startups: 'taxonomy.subtopics.startups',
        Freelancing: 'taxonomy.subtopics.freelancing',
        Marketing: 'taxonomy.subtopics.marketing',
        'E-commerce': 'taxonomy.subtopics.ecommerce',
        'Productivity systems': 'taxonomy.subtopics.productivitySystems',
        Space: 'taxonomy.subtopics.space',
        Biology: 'taxonomy.subtopics.biology',
        Physics: 'taxonomy.subtopics.physics',
        Animals: 'taxonomy.subtopics.animals',
        Climate: 'taxonomy.subtopics.climate',
        Woodworking: 'taxonomy.subtopics.woodworking',
        Electronics: 'taxonomy.subtopics.electronics',
        Crafts: 'taxonomy.subtopics.crafts',
        '3D printing': 'taxonomy.subtopics.threeDPrinting',
        'Home repair': 'taxonomy.subtopics.homeRepair',
        Football: 'taxonomy.subtopics.football',
        Basketball: 'taxonomy.subtopics.basketball',
        MMA: 'taxonomy.subtopics.mma',
        Marathons: 'taxonomy.subtopics.marathons',
        'Strength training': 'taxonomy.subtopics.strengthTraining',
    },
    experience: {
        beginner: 'taxonomy.experience.beginner',
        intermediate: 'taxonomy.experience.intermediate',
        advanced: 'taxonomy.experience.advanced',
    },
    goals: {
        grow_audience: 'taxonomy.goals.growAudience',
        monetise: 'taxonomy.goals.monetise',
        build_brand: 'taxonomy.goals.buildBrand',
        client_work: 'taxonomy.goals.clientWork',
        explore: 'taxonomy.goals.explore',
    },
    steps: {
        niche: 'taxonomy.steps.niche',
        subtopics: 'taxonomy.steps.subtopics',
        platforms: 'taxonomy.steps.platforms',
        experience: 'taxonomy.steps.experience',
        goals: 'taxonomy.steps.goals',
        review: 'taxonomy.steps.review',
    },
    platforms: {
        youtube: 'taxonomy.platforms.youtube',
        tiktok: 'taxonomy.platforms.tiktok',
        instagram: 'taxonomy.platforms.instagram',
    },
};

/**
 * The label to render for one backend taxonomy value.
 *
 * @param locale     the URL locale (the source of truth, AR-D-01)
 * @param t          the `onboarding` translator bound to the current locale
 * @param group      which taxonomy vocabulary the value belongs to
 * @param value      the backend value (slug / subtopic string / step key)
 * @param backendLabel the label the API sent — the fallback for unknown values
 */
export function localizeTaxonomyLabel(
    locale: AppLocale,
    t: OnboardingTranslator,
    group: TaxonomyGroup,
    value: string,
    backendLabel: string
): string {
    // English (and any future non-Arabic locale) renders the API's own label
    // verbatim — the no-drift rule. Only Arabic consults the overlay.
    if (!isArabic(locale)) return backendLabel;
    const key = KEY_MAPS[group][value];
    if (!key) return backendLabel;
    return t.has(key) ? t(key) : backendLabel;
}

/**
 * Localizes a whole `{ value, label }` option list (niches, subtopics,
 * platforms, experience, goals). The backend VALUE stays untouched — only the
 * visible label is translated — so selections and API payloads never change.
 */
export function localizeOptions(
    locale: AppLocale,
    t: OnboardingTranslator,
    group: TaxonomyGroup,
    options: readonly { value: string; label: string }[]
): { value: string; label: string }[] {
    return options.map((option) => ({
        value: option.value,
        label: localizeTaxonomyLabel(locale, t, group, option.value, option.label),
    }));
}
