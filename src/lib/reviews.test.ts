import { describe, it, expect } from 'vitest';
import {
  formatReviewMonth,
  formatRatingLabel,
  selectFeaturedReviews,
  excerptReviewText,
  reviewStarLabel,
  summariseReviews,
  latestReviewMonth,
  reviewParagraphs,
  type StudioReview,
} from './reviews';

/**
 * Like `eventFormat.test.ts`, nothing here may depend on the host's locale or
 * timezone: month names are hand-rolled because Workers ship a trimmed ICU
 * build, so `toLocaleDateString` output is not guaranteed to match a
 * developer's machine.
 */

const review = (over: Partial<StudioReview> = {}): StudioReview => ({
  id: 'a-player',
  author: 'A Player',
  rating: 5,
  date: '2026-07',
  text: 'A short review.',
  ...over,
});

describe('formatReviewMonth', () => {
  it('renders a year-month as a month and year', () => {
    expect(formatReviewMonth('2026-07')).toBe('July 2026');
  });

  it('drops the day, since Google only ever shows the month', () => {
    expect(formatReviewMonth('2026-07-28')).toBe('July 2026');
  });

  it('renders the first and last month without an off-by-one', () => {
    expect(formatReviewMonth('2025-01')).toBe('January 2025');
    expect(formatReviewMonth('2025-12')).toBe('December 2025');
  });

  it('returns null for a month outside 1-12', () => {
    expect(formatReviewMonth('2026-13')).toBeNull();
    expect(formatReviewMonth('2026-00')).toBeNull();
  });

  it('returns null for text a date cannot be read from', () => {
    expect(formatReviewMonth('')).toBeNull();
    expect(formatReviewMonth('a month ago')).toBeNull();
    expect(formatReviewMonth('2026')).toBeNull();
  });
});

describe('formatRatingLabel', () => {
  it('always states one decimal, so 5 does not read as a bare integer', () => {
    expect(formatRatingLabel(5)).toBe('5.0');
  });

  it('keeps a rating that is already one decimal', () => {
    expect(formatRatingLabel(4.9)).toBe('4.9');
    expect(formatRatingLabel(4.5)).toBe('4.5');
  });

  it('rounds a computed average to one decimal', () => {
    expect(formatRatingLabel(4.94)).toBe('4.9');
    expect(formatRatingLabel(4.96)).toBe('5.0');
  });
});

describe('reviewStarLabel', () => {
  it('spells out the rating, since the stars are decorative', () => {
    expect(reviewStarLabel(5)).toBe('Rated 5 out of 5');
    expect(reviewStarLabel(4)).toBe('Rated 4 out of 5');
  });
});

describe('selectFeaturedReviews', () => {
  const reviews: StudioReview[] = [
    review({ id: 'one' }),
    review({ id: 'two', featured: true }),
    review({ id: 'three' }),
    review({ id: 'four', featured: true }),
  ];

  it('puts flagged reviews first, in data order', () => {
    expect(selectFeaturedReviews(reviews, 2).map((r) => r.id)).toEqual([
      'two',
      'four',
    ]);
  });

  it('tops up from the remainder once the flagged ones run out', () => {
    expect(selectFeaturedReviews(reviews, 3).map((r) => r.id)).toEqual([
      'two',
      'four',
      'one',
    ]);
  });

  it('never returns more than the limit', () => {
    expect(selectFeaturedReviews(reviews, 1)).toHaveLength(1);
  });

  it('returns everything, flagged first, when the limit exceeds the supply', () => {
    expect(selectFeaturedReviews(reviews, 10).map((r) => r.id)).toEqual([
      'two',
      'four',
      'one',
      'three',
    ]);
  });

  it('returns nothing for a non-positive limit', () => {
    expect(selectFeaturedReviews(reviews, 0)).toEqual([]);
    expect(selectFeaturedReviews(reviews, -1)).toEqual([]);
  });

  it('does not mutate the source array', () => {
    const source = [...reviews];
    selectFeaturedReviews(source, 2);
    expect(source.map((r) => r.id)).toEqual(['one', 'two', 'three', 'four']);
  });
});

describe('excerptReviewText', () => {
  const quote = 'Yana is such a truly wonderful teacher';

  it('leaves a review that already fits completely alone', () => {
    expect(excerptReviewText('Short and sweet.', 40)).toBe('Short and sweet.');
  });

  it('cuts on a word boundary rather than mid-word', () => {
    // 25 lands inside "wonderful", so the excerpt stops before that word.
    expect(excerptReviewText(quote, 25)).toBe('Yana is such a truly…');
  });

  it('keeps a word that the limit ends exactly on', () => {
    // 30 is the last character of "wonderful" — nothing is cut short.
    expect(excerptReviewText(quote, 30)).toBe(
      'Yana is such a truly wonderful…'
    );
  });

  it('takes a sentence that ends exactly on the limit', () => {
    // The space after "gamma." is the first character past the budget, so the
    // lookahead has to see one character further than the cut itself.
    expect(
      excerptReviewText(
        'Alpha beta gamma. Delta epsilon zeta continues on.',
        17
      )
    ).toBe('Alpha beta gamma.');
  });

  it('does not leave punctuation stranded before the ellipsis', () => {
    expect(
      excerptReviewText('Great place, lovely people, warm sound', 13)
    ).toBe('Great place…');
  });

  it('collapses the newlines Google reviews carry into single spaces', () => {
    expect(excerptReviewText('First line.\n\nSecond line.', 100)).toBe(
      'First line. Second line.'
    );
  });

  it('falls back to a hard cut when the first word outruns the limit', () => {
    expect(excerptReviewText('Incomprehensibilities abound', 10)).toBe(
      'Incomprehe…'
    );
  });

  it('prefers a whole sentence when one fits most of the budget', () => {
    expect(
      excerptReviewText(
        'First sentence here. Second sentence runs on and on beyond the limit.',
        40
      )
    ).toBe('First sentence here.');
  });

  it('falls back to a word cut when the only sentence end is far too early', () => {
    // Cutting at "Yes." would throw away three usable lines.
    expect(
      excerptReviewText(
        'Yes. And then a very long continuation that keeps going past the limit.',
        40
      )
    ).toBe('Yes. And then a very long continuation…');
  });

  it('keeps a whole sentence intact, with no ellipsis after it', () => {
    expect(
      excerptReviewText(
        'What a wonderful afternoon! It went on much longer than this though.',
        30
      )
    ).toBe('What a wonderful afternoon!');
  });

  it('returns nothing for a non-positive limit', () => {
    // Without a guard, slice(0, -1) reads the negative as an offset from the
    // END and returns a confident-looking but meaningless excerpt.
    expect(excerptReviewText('Some words here', 0)).toBe('');
    expect(excerptReviewText('Some words here', -1)).toBe('');
  });

  it('does not cut an emoji in half on the hard-cut path', () => {
    // No space anywhere, so the cut cannot fall back to a word boundary and
    // lands between the two halves of the surrogate pair.
    expect(excerptReviewText('aaaa\u{1F497}bbbb', 5)).toBe('aaaa\u2026');
  });

  it('returns an empty string unchanged', () => {
    expect(excerptReviewText('', 20)).toBe('');
  });
});

describe('summariseReviews', () => {
  const published = [review({ id: 'a' }), review({ id: 'b', rating: 4 })];

  it('reports the listing-wide figures, not the published subset', () => {
    // The point of the aggregate: two reviews are quoted verbatim, but the
    // listing holds 57. Showing "2 reviews" would undersell the studio.
    const summary = summariseReviews(published, { rating: 4.9, count: 57 });
    expect(summary.rating).toBe(4.9);
    expect(summary.ratingLabel).toBe('4.9');
    expect(summary.count).toBe(57);
    expect(summary.shown).toBe(2);
  });

  it('falls back to the published average when no aggregate is known', () => {
    const summary = summariseReviews(published, null);
    expect(summary.rating).toBe(4.5);
    expect(summary.ratingLabel).toBe('4.5');
    expect(summary.count).toBe(2);
    expect(summary.shown).toBe(2);
  });

  it('never claims a count below what the page actually shows', () => {
    const summary = summariseReviews(published, { rating: 5, count: 1 });
    expect(summary.count).toBe(2);
  });

  it('survives an empty review set', () => {
    const summary = summariseReviews([], null);
    expect(summary.shown).toBe(0);
    expect(summary.count).toBe(0);
    expect(summary.rating).toBe(0);
  });
});

describe('latestReviewMonth', () => {
  it('returns the newest month in the set', () => {
    expect(
      latestReviewMonth([
        review({ date: '2026-02' }),
        review({ date: '2026-09' }),
        review({ date: '2025-11' }),
      ])
    ).toBe('September 2026');
  });

  it('compares a full date against a year-month correctly', () => {
    expect(
      latestReviewMonth([
        review({ date: '2026-09-28' }),
        review({ date: '2026-08' }),
      ])
    ).toBe('September 2026');
  });

  it('ignores dates it cannot read rather than ranking them highest', () => {
    // 'a month ago' sorts above any ISO date as a string, so an unparseable
    // value would win the reduce and blank the line out.
    expect(
      latestReviewMonth([
        review({ date: 'a month ago' }),
        review({ date: '2026-03' }),
      ])
    ).toBe('March 2026');
  });

  it('returns null when nothing is dated', () => {
    expect(latestReviewMonth([review({ date: 'recently' })])).toBeNull();
    expect(latestReviewMonth([])).toBeNull();
  });
});

describe('reviewParagraphs', () => {
  it('splits on blank lines, which is how the longer reviews are stored', () => {
    expect(reviewParagraphs('One.\n\nTwo.\n\nThree.')).toEqual([
      'One.',
      'Two.',
      'Three.',
    ]);
  });

  it('returns a single-paragraph review as one entry', () => {
    expect(reviewParagraphs('Just the one.')).toEqual(['Just the one.']);
  });

  it('tolerates the ragged whitespace a paste from Google carries', () => {
    expect(reviewParagraphs('One.\n   \n\n  Two.  \n\n')).toEqual([
      'One.',
      'Two.',
    ]);
  });

  it('does not treat a single newline as a paragraph break', () => {
    expect(reviewParagraphs('One.\nStill one.')).toEqual(['One.\nStill one.']);
  });

  it('returns nothing for empty text', () => {
    expect(reviewParagraphs('')).toEqual([]);
  });
});
