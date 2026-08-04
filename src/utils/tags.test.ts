import { describe, it, expect } from 'vitest';
import { normalizeTags, getEventCategory, getLevelLabel } from './tags';

describe('normalizeTags', () => {
  it('returns an empty array for missing tags', () => {
    expect(normalizeTags(undefined)).toEqual([]);
    expect(normalizeTags('')).toEqual([]);
  });

  it('splits a comma-separated string and trims each entry', () => {
    expect(normalizeTags('workshop, beginner ,advanced')).toEqual([
      'workshop',
      'beginner',
      'advanced',
    ]);
  });

  it('passes an array through', () => {
    expect(normalizeTags(['workshop', 'beginner'])).toEqual([
      'workshop',
      'beginner',
    ]);
  });
});

describe('getEventCategory', () => {
  it('maps the CMS format tags to display categories', () => {
    expect(getEventCategory(['workshop', 'beginner'])).toBe('Workshop');
    expect(getEventCategory(['community'])).toBe('Community');
    expect(getEventCategory(['private'])).toBe('Private');
  });

  it('renders a performance as a Concert', () => {
    expect(getEventCategory(['performance'])).toBe('Concert');
  });

  it('accepts free-text values the CMS option list does not offer', () => {
    expect(getEventCategory(['masterclass', 'advanced'])).toBe('Masterclass');
    expect(getEventCategory(['concert'])).toBe('Concert');
  });

  it('is case and whitespace insensitive', () => {
    expect(getEventCategory([' Workshop '])).toBe('Workshop');
  });

  it('returns the first category present, ignoring level tags', () => {
    expect(getEventCategory(['beginner', 'intermediate', 'workshop'])).toBe(
      'Workshop'
    );
  });

  it('returns null when no category tag is present', () => {
    expect(getEventCategory(['beginner'])).toBeNull();
    expect(getEventCategory([])).toBeNull();
    expect(getEventCategory(undefined)).toBeNull();
  });
});

describe('getLevelLabel', () => {
  it('collapses the full spread to All levels', () => {
    expect(
      getLevelLabel(['workshop', 'beginner', 'intermediate', 'advanced'])
    ).toBe('All levels');
  });

  it('reads intermediate plus advanced as Intermediate+', () => {
    expect(getLevelLabel(['intermediate', 'advanced'])).toBe('Intermediate+');
  });

  it('reads beginner plus intermediate as Beginner+', () => {
    expect(getLevelLabel(['beginner', 'intermediate'])).toBe('Beginner+');
  });

  it('capitalises a single level', () => {
    expect(getLevelLabel(['workshop', 'beginner'])).toBe('Beginner');
    expect(getLevelLabel(['advanced'])).toBe('Advanced');
  });

  it('treats beginner plus advanced without intermediate as All levels', () => {
    // A class tagged both ends has said nothing more specific than "anyone".
    expect(getLevelLabel(['beginner', 'advanced'])).toBe('All levels');
  });

  it('returns null when no level tag is present', () => {
    expect(getLevelLabel(['workshop'])).toBeNull();
    expect(getLevelLabel(undefined)).toBeNull();
  });
});
