'use client';

/**
 * /signup is the canonical signup route (T11): every CTA on the landing page
 * and the marketing header points here, and this page is what makes those
 * links resolve.
 *
 * The form markup currently lives in the sibling /register page. T12 owns
 * the auth-surface rework (it moves the real page here and turns /register
 * into a permanent redirect). Until then this re-export keeps both routes
 * rendering the same working form with zero duplicated code — one source,
 * two entry points.
 */
export { default } from '../register/page';
