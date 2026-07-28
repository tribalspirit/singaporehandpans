/**
 * Parse a YouTube URL (or bare id) into an 11-character video id.
 *
 * Supports `watch?v=`, `youtu.be/`, `/embed/`, `/shorts/`, `/v/`, `/live/`,
 * extra query params, and `youtube-nocookie.com`. Returns `null` for anything
 * that is not a valid YouTube video reference, so callers never interpolate an
 * unvalidated URL into an iframe `src`.
 */

const YOUTUBE_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;
const PATH_ID_PREFIXES = new Set(['embed', 'shorts', 'v', 'live']);
const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtube-nocookie.com',
]);

export function parseYouTubeId(input: string): string | null {
  if (!input || typeof input !== 'string') return null;
  const raw = input.trim();
  if (!raw) return null;

  // Bare id.
  if (YOUTUBE_ID_REGEX.test(raw)) return raw;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./i, '').toLowerCase();
  let id: string | null = null;

  if (host === 'youtu.be') {
    id = url.pathname.split('/').filter(Boolean)[0] ?? null;
  } else if (YOUTUBE_HOSTS.has(host)) {
    if (url.pathname === '/watch') {
      id = url.searchParams.get('v');
    } else {
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts.length >= 2 && PATH_ID_PREFIXES.has(parts[0])) {
        id = parts[1];
      }
    }
  }

  return id && YOUTUBE_ID_REGEX.test(id) ? id : null;
}

/** Privacy-enhanced embed URL for a validated video id. */
export function youTubeEmbedUrl(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${id}`;
}

/** Thumbnail URL for a validated video id (used by the click-to-load facade). */
export function youTubeThumbnail(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}
