import { describe, expect, test } from 'vitest';
import { parseYouTubeId, youTubeEmbedUrl, youTubeThumbnail } from './youtube';

describe('parseYouTubeId', () => {
  const ID = 'dQw4w9WgXcQ';

  test('parses watch?v= URLs, including extra params', () => {
    expect(parseYouTubeId(`https://www.youtube.com/watch?v=${ID}`)).toBe(ID);
    expect(parseYouTubeId(`https://youtube.com/watch?v=${ID}&t=42s`)).toBe(ID);
  });

  test('parses youtu.be short links', () => {
    expect(parseYouTubeId(`https://youtu.be/${ID}`)).toBe(ID);
    expect(parseYouTubeId(`https://youtu.be/${ID}?t=10`)).toBe(ID);
  });

  test('parses /embed/, /shorts/, /v/, /live/ paths', () => {
    expect(parseYouTubeId(`https://www.youtube.com/embed/${ID}`)).toBe(ID);
    expect(parseYouTubeId(`https://www.youtube.com/shorts/${ID}`)).toBe(ID);
    expect(parseYouTubeId(`https://www.youtube.com/v/${ID}`)).toBe(ID);
    expect(parseYouTubeId(`https://www.youtube.com/live/${ID}`)).toBe(ID);
  });

  test('parses nocookie and mobile hosts', () => {
    expect(parseYouTubeId(`https://www.youtube-nocookie.com/embed/${ID}`)).toBe(
      ID
    );
    expect(parseYouTubeId(`https://m.youtube.com/watch?v=${ID}`)).toBe(ID);
  });

  test('accepts a bare 11-char id', () => {
    expect(parseYouTubeId(ID)).toBe(ID);
  });

  test('returns null for invalid input', () => {
    expect(parseYouTubeId('')).toBeNull();
    expect(parseYouTubeId('not a url')).toBeNull();
    expect(parseYouTubeId('https://vimeo.com/12345')).toBeNull();
    expect(
      parseYouTubeId('https://www.youtube.com/watch?v=tooShort')
    ).toBeNull();
    expect(parseYouTubeId('https://example.com/embed/abc')).toBeNull();
  });
});

describe('youTube url helpers', () => {
  test('build nocookie embed + thumbnail URLs', () => {
    expect(youTubeEmbedUrl('abc12345678')).toBe(
      'https://www.youtube-nocookie.com/embed/abc12345678'
    );
    expect(youTubeThumbnail('abc12345678')).toBe(
      'https://i.ytimg.com/vi/abc12345678/hqdefault.jpg'
    );
  });
});
