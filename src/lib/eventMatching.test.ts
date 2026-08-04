import { describe, it, expect } from 'vitest';
import { extractTeacherName, findRunsAgainMatch } from './eventMatching';

describe('extractTeacherName', () => {
  it('reads the teacher from a "with <Name>" title', () => {
    expect(extractTeacherName('Master Handpan with Dany Rud')).toBe('Dany Rud');
  });

  it('handles a single-word name', () => {
    expect(extractTeacherName('Sound Journey with Radika')).toBe('Radika');
  });

  it('keeps accented and hyphenated names intact', () => {
    expect(extractTeacherName('Handpan Masterclass with Peter Bognár')).toBe(
      'Peter Bognár'
    );
    expect(extractTeacherName('Rhythm Lab with Jean-Luc Martin')).toBe(
      'Jean-Luc Martin'
    );
  });

  it('stops at a trailing clause rather than swallowing the rest of the title', () => {
    expect(
      extractTeacherName(
        'Handpan Masterclass with Takao Minemoto for Singapore Handpan Community'
      )
    ).toBe('Takao Minemoto');
  });

  it('stops at punctuation', () => {
    expect(
      extractTeacherName(
        'Vocal Alchemy with Marlia Coeur — Shapeshifting Sound'
      )
    ).toBe('Marlia Coeur');
  });

  it('ignores a lowercase word after "with"', () => {
    expect(extractTeacherName('Handpan for beginners with friends')).toBeNull();
  });

  it('returns null when the title has no "with" clause', () => {
    expect(extractTeacherName('Handpan First Touch Workshop')).toBeNull();
    expect(extractTeacherName('')).toBeNull();
    expect(extractTeacherName(undefined)).toBeNull();
  });
});

/** Minimal shape `findRunsAgainMatch` needs — mirrors `EventListItem`. */
const item = (title: string, tags: string[], slug = 'x') => ({
  story: { slug, content: { title, tags } },
});

describe('findRunsAgainMatch', () => {
  const upcoming = [
    item(
      'Handpan First Touch Workshop',
      ['workshop', 'beginner'],
      'first-touch'
    ),
    item('Live Concert by Marlia Coeur', ['performance'], 'marlia-concert'),
    item('Community Handpan Gathering', ['community'], 'gathering'),
  ];

  it('matches a past event to the same class running again', () => {
    const past = item('Handpan First Touch Workshop with Yana An', [
      'workshop',
      'beginner',
    ]);
    expect(findRunsAgainMatch(past, upcoming)?.story.slug).toBe('first-touch');
  });

  it('will not match across categories, however similar the titles', () => {
    const past = item('Handpan First Touch Workshop', ['performance']);
    expect(findRunsAgainMatch(past, upcoming)).toBeNull();
  });

  it('will not match two unrelated events in the same category', () => {
    const past = item('Konnakol Rhythm Intensive', ['workshop', 'advanced']);
    expect(findRunsAgainMatch(past, upcoming)).toBeNull();
  });

  it('ignores stopwords so "for"/"with"/"the" cannot carry a match', () => {
    const past = item('The Art of the Handpan for Everyone', ['community']);
    expect(findRunsAgainMatch(past, upcoming)).toBeNull();
  });

  it('returns null when the past event carries no category', () => {
    expect(
      findRunsAgainMatch(item('Handpan First Touch Workshop', []), upcoming)
    ).toBeNull();
  });

  it('returns null against an empty upcoming list', () => {
    expect(
      findRunsAgainMatch(item('Handpan First Touch Workshop', ['workshop']), [])
    ).toBeNull();
  });

  it('will not pair different levels of the same series by the same teacher', () => {
    // Category, teacher and the generic noun are all shared by construction,
    // so title overlap alone reads as a match — but sending a beginner to an
    // intermediate class is worse than offering them nothing.
    const beginner = item('Beginner Handpan Workshop with Dany Rud', [
      'workshop',
      'beginner',
    ]);
    const intermediate = [
      item(
        'Intermediate Handpan Workshop with Dany Rud',
        ['workshop', 'intermediate'],
        'intermediate'
      ),
    ];
    expect(findRunsAgainMatch(beginner, intermediate)).toBeNull();
  });

  it('still pairs when one side simply carries no level tag', () => {
    const past = item('Handpan First Touch Workshop with Yana An', [
      'workshop',
      'beginner',
    ]);
    const untagged = [
      item('Handpan First Touch Workshop', ['workshop'], 'untagged'),
    ];
    expect(findRunsAgainMatch(past, untagged)?.story.slug).toBe('untagged');
  });

  it('picks the strongest match when several share a category', () => {
    const crowded = [
      item('Handpan Gathering', ['community'], 'weak'),
      item('Community Handpan Gathering', ['community'], 'strong'),
    ];
    const past = item('Community Handpan Gathering', ['community']);
    expect(findRunsAgainMatch(past, crowded)?.story.slug).toBe('strong');
  });
});
