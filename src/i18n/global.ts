import { routing } from './routing';
import common from '../../messages/en/common.json';
import navigation from '../../messages/en/navigation.json';
import landing from '../../messages/en/landing.json';
import auth from '../../messages/en/auth.json';
import pricing from '../../messages/en/pricing.json';
import legal from '../../messages/en/legal.json';
import dashboard from '../../messages/en/dashboard.json';
import projects from '../../messages/en/projects.json';
import advertisements from '../../messages/en/advertisements.json';
import workspace from '../../messages/en/workspace.json';
import scripts from '../../messages/en/scripts.json';
import titles from '../../messages/en/titles.json';
import hashtags from '../../messages/en/hashtags.json';
import audio from '../../messages/en/audio.json';
import thumbnails from '../../messages/en/thumbnails.json';
import media from '../../messages/en/media.json';
import trends from '../../messages/en/trends.json';
import analytics from '../../messages/en/analytics.json';
import planner from '../../messages/en/planner.json';
import seo from '../../messages/en/seo.json';
import team from '../../messages/en/team.json';
import settings from '../../messages/en/settings.json';
import billing from '../../messages/en/billing.json';
import onboarding from '../../messages/en/onboarding.json';
import dataState from '../../messages/en/dataState.json';
import notifications from '../../messages/en/notifications.json';
import errors from '../../messages/en/errors.json';

/**
 * AR-003/AR-010 — type augmentation for the i18n surface.
 *
 * `Locale` makes every locale typed as `'en' | 'ar'` (not `string`), so a
 * typo in a locale argument is a compile error.
 *
 * `Messages` makes every message key typed from the ENGLISH catalog — the
 * root locale is always complete (I18N-ARCHITECTURE §5), so the English
 * catalog is the type of record. A key that does not exist in `en` cannot be
 * referenced at all, and a key that exists in `en` but not in `ar` is caught
 * by the AR02 parity gate rather than by the compiler.
 *
 * The shape mirrors the runtime exactly: one entry per namespace, each typed
 * from its own file. AR-010 adds the namespaces that are scaffolded but not
 * yet filled — their types are empty until their surface is extracted, and
 * the keys appear the moment the catalog grows.
 */
declare module 'next-intl' {
    interface AppConfig {
        Locale: (typeof routing.locales)[number];
        Messages: {
            common: typeof common;
            navigation: typeof navigation;
            landing: typeof landing;
            auth: typeof auth;
            pricing: typeof pricing;
            legal: typeof legal;
            dashboard: typeof dashboard;
            projects: typeof projects;
            advertisements: typeof advertisements;
            workspace: typeof workspace;
            scripts: typeof scripts;
            titles: typeof titles;
            hashtags: typeof hashtags;
            audio: typeof audio;
            thumbnails: typeof thumbnails;
            media: typeof media;
            trends: typeof trends;
            analytics: typeof analytics;
            planner: typeof planner;
            seo: typeof seo;
            team: typeof team;
            settings: typeof settings;
            billing: typeof billing;
            onboarding: typeof onboarding;
            dataState: typeof dataState;
            notifications: typeof notifications;
            errors: typeof errors;
        };
    }
}
