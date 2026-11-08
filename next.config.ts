import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";
import { withSentryConfig } from "@sentry/nextjs/config";

const withBundleAnalyzer = bundleAnalyzer({
  // `ANALYZE=true pnpm build` writes the interactive treemap to .next/analyze.
  enabled: process.env.ANALYZE === "true",
  openAnalyzer: false,
});

const API_URL = process.env.API_URL || "http://localhost:5001";

/**
 * Static security headers (T09 / R-12). The CSP is deliberately NOT here: it
 * needs a per-request nonce and is set by src/proxy.ts (report-only
 * first, enforced via CSP_ENFORCE=true).
 *
 * HSTS ships WITHOUT `preload`: preload is effectively irreversible and
 * requires a confirmed, HTTPS-only domain — D3 (deployment target) is still
 * open. Add `; preload` only after the domain is confirmed eligible and every
 * subdomain is committed to HTTPS.
 */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
];

const nextConfig: NextConfig = {
  // Don't advertise the framework; the response is otherwise identical.
  poweredByHeader: false,

  // T21: emit .next/standalone — a server.js plus the exact node_modules it
  // needs — so the Docker runtime stage carries no dev dependencies or
  // sources. Harmless on Vercel (ignored there; Vercel builds its own output).
  output: 'standalone',

  // T21: browser source maps for readable production stack traces. The maps
  // are emitted by `next build`; uploading them to Sentry is a deploy-time
  // step that needs SENTRY_AUTH_TOKEN/ORG/PROJECT (see README — owner-side,
  // because the token is a secret this repo must not carry).
  productionBrowserSourceMaps: true,

  // T21: keep the Sentry server SDK external. Its Node entrypoint requires
  // `@sentry/server-runtime-injection/register` at module load; bundling the
  // SDK into a server chunk leaves that bare require without a package tree,
  // so the standalone image cannot resolve it. Externalising it makes Next
  // trace the real node_modules tree into .next/standalone.
  serverExternalPackages: ['@sentry/nextjs', '@sentry/server-runtime-injection'],

  experimental: {
    /**
     * T20: these are barrel packages — importing one icon or one formatter
     * otherwise parses the whole export surface. Next rewrites the imports to
     * per-module paths at build time.
     */
    optimizePackageImports: ["lucide-react", "date-fns", "radix-ui"],
  },

  images: {
    /**
     * No remote hosts are allowed (R-13). `hostname: '**'` turned the image
     * optimiser into an SSRF primitive that would fetch any HTTPS URL the app
     * was handed. Every asset the UI renders today is same-origin (bundled or
     * BFF-proxied), which needs no entry here.
     *
     * When the media CDN lands (D3), add each real host explicitly — never
     * '**', never a wildcard subdomain of a user-controlled domain, never
     * http:. Force downloads instead of rendering active content.
     */
    // M2-T26 (R-13): exactly one explicit Cloudinary host. Never '**'.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
    contentDispositionType: 'attachment',
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${API_URL}/api/v1/:path*`,
      },
    ];
  },
};

const withAnalyzer = withBundleAnalyzer(nextConfig);

// T21: source-map upload is opt-in at deploy time. Without a token the build
// is exactly the same as before (maps are still emitted by
// `productionBrowserSourceMaps`); with one, Sentry's build plugin uploads them
// and deletes the public copies so production source is not served.
const sentryOrg = process.env.SENTRY_ORG;
const sentryProject = process.env.SENTRY_PROJECT;
const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN;

export default sentryOrg && sentryProject && sentryAuthToken
  ? withSentryConfig(withAnalyzer, {
      org: sentryOrg,
      project: sentryProject,
      authToken: sentryAuthToken,
      silent: true,
      telemetry: false,
      widenClientFileUpload: true,
      sourcemaps: { deleteSourcemapsAfterUpload: true },
    })
  : withAnalyzer;
