export const config = {
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1',
    appName: 'AI Content Engine',
    appDescription: 'Transform raw concepts into high-performing scripts, thumbnails, and audio in seconds.',
} as const;
