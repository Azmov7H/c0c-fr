import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

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
    remotePatterns: [],
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

export default withBundleAnalyzer(nextConfig);
