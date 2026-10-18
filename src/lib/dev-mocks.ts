/**
 * The single gate for demo data (T08).
 *
 * Before this, `MOCK_ASSETS`, `MOCK_TRACKS` and `MOCK_EVENTS` sat unguarded at
 * module scope in three feature components, so a screenshot of a dev server and
 * one of production were indistinguishable — which is how a fake `sk-…` key and
 * a hardcoded "All Systems Operational" survived review.
 *
 * Two rules:
 *   1. Pages render `<MockDataBanner />` whenever they display this data.
 *   2. The literals themselves are behind the flag, so a production build
 *      drops the arrays rather than shipping unreachable demo content.
 *
 * `process.env.NODE_ENV` is replaced at build time, so in production these
 * evaluate to `[]` and the data is eliminated by the optimizer.
 */
export const isMockData = process.env.NODE_ENV !== 'production';

export const MOCK_EVENTS = isMockData
    ? [
          { id: '1', title: 'YouTube Shorts Batch', date: '2026-04-14', status: 'editing', platform: 'YouTube' },
          { id: '2', title: 'TikTok Trend Response', date: '2026-04-15', status: 'scripting', platform: 'TikTok' },
          { id: '3', title: 'Instagram Reel Campaign', date: '2026-04-17', status: 'scheduled', platform: 'Instagram' },
          { id: '4', title: 'Long-form Deep Dive', date: '2026-04-20', status: 'idea', platform: 'YouTube' },
          { id: '5', title: 'Product Review Video', date: '2026-04-22', status: 'scripting', platform: 'TikTok' },
      ]
    : [];

export const MOCK_ASSETS = isMockData
    ? [
          { id: '1', name: 'hero-banner.png', type: 'image', url: '/placeholder.png', size: '2.4 MB', date: '2026-04-10', tags: ['banner', 'hero'] },
          { id: '2', name: 'intro-clip.mp4', type: 'video', url: '', size: '14.1 MB', date: '2026-04-09', tags: ['intro', 'clip'] },
          { id: '3', name: 'bg-music.mp3', type: 'audio', url: '', size: '3.2 MB', date: '2026-04-08', tags: ['music', 'background'] },
          { id: '4', name: 'thumbnail-v1.png', type: 'image', url: '/placeholder.png', size: '890 KB', date: '2026-04-07', tags: ['thumbnail'] },
          { id: '5', name: 'outro-transition.mp4', type: 'video', url: '', size: '5.6 MB', date: '2026-04-06', tags: ['outro'] },
          { id: '6', name: 'sfx-whoosh.mp3', type: 'audio', url: '', size: '120 KB', date: '2026-04-05', tags: ['sfx', 'transition'] },
      ]
    : [];

export const MOCK_TRACKS = isMockData
    ? [
          { title: 'Neon Pulse', genre: 'Synthwave', bpm: 128, duration: '3:42', mood: 'energetic' },
          { title: 'Dark Horizon', genre: 'Cinematic', bpm: 90, duration: '4:15', mood: 'suspenseful' },
          { title: 'Rainy Thoughts', genre: 'Lo-fi', bpm: 72, duration: '2:58', mood: 'chill' },
          { title: 'Focus Flow', genre: 'Ambient', bpm: 65, duration: '5:10', mood: 'educational' },
      ]
    : [];
