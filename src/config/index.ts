export const config = {
    // Client always talks to its own origin; Next.js rewrites /api/v1/* -> backend (API_URL server-side).
    apiUrl: '/api/v1',
    appName: 'AI Content Engine',
    appDescription: 'Transform raw concepts into high-performing scripts, thumbnails, and audio in seconds.',
} as const;
