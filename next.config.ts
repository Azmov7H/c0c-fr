import type { NextConfig } from "next";

type RemotePattern = NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]>[number];

const API_URL = process.env.API_URL || "http://localhost:5001";

/**
 * Hosts `next/image` is permitted to fetch from.
 *
 * This was `hostname: '**'`, which lets the optimiser retrieve any HTTPS URL it is
 * handed — a server-side request forgery path into internal hosts, a bandwidth
 * amplification vector, and a way to launder attacker-controlled pixels through our
 * own origin. The list is explicit; add a host here when a new asset source is
 * introduced, rather than widening the pattern.
 */
const IMAGE_HOSTS: RemotePattern[] = [
  { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
  { protocol: "https", hostname: "cdn.sanity.io", pathname: "/**" },
  { protocol: "https", hostname: "**.cloudfront.net", pathname: "/**" },
];

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  // HSTS ships without `preload` on purpose: preload is effectively irreversible
  // for a domain and applies to every subdomain, so it needs confirming the
  // domain is eligible first.
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: IMAGE_HOSTS,
    contentDispositionType: "attachment",
  },

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },

  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${API_URL}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;