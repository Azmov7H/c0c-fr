/*
 * Setup for the node project: BFF routes, middleware, pure libs.
 * No DOM globals are cleared here — node tests must stay isolated from jsdom.
 */
process.env.VITEST_NODE_PROJECT = '1';
