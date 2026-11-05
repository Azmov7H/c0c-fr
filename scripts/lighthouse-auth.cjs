/**
 * LHCI auth hook.
 *
 * The dashboard and project routes only render when the proxy sees a session
 * cookie. CI runs the production server with `AUTH_MIDDLEWARE_MODE=presence`,
 * where the value is not verified, so a fixed dummy value is enough and no
 * backend or database is needed.
 *
 * LHCI reuses one browser across URLs, so the cookie must also be removed for
 * the public routes — otherwise `/login` sees a session and redirects to the
 * dashboard instead of measuring the login page.
 */
const AUTH_COOKIE = {
    name: 'auth_session',
    value: 'lhci-presence-cookie',
    domain: 'localhost',
    path: '/',
};

module.exports = async (browser, context) => {
    const isProtected = /^http:\/\/localhost:3100\/(dashboard|projects)(\/|$)/.test(context.url);
    const page = await browser.newPage();
    try {
        if (isProtected) {
            if (typeof page.setCookie === 'function') {
                await page.setCookie(AUTH_COOKIE);
            } else if (typeof browser.setCookie === 'function') {
                await browser.setCookie(AUTH_COOKIE);
            }
        } else if (typeof page.deleteCookie === 'function') {
            await page.deleteCookie({
                name: AUTH_COOKIE.name,
                domain: AUTH_COOKIE.domain,
                path: AUTH_COOKIE.path,
            });
        }
    } finally {
        await page.close();
    }
};
