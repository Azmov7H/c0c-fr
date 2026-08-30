// Server-only helper: base URL of the external backend.
// Used by BFF route handlers (src/app/api/**) to call the backend directly.
// NOT imported from client components (server runtime only).
export const SERVER_API_URL =
    process.env.API_URL || 'http://localhost:5001';
