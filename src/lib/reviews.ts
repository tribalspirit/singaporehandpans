/**
 * Display helpers for the studio's Google reviews. Pure and side-effect free,
 * like `eventFormat.ts`.
 *
 * Month names are hand-rolled rather than delegated to `toLocaleDateString`
 * for the same reason as `eventFormat.ts`: Cloudflare Workers ship a trimmed
 * ICU build, so locale output is not guaranteed to match a developer's machine.
 *
 * The review data itself lives in `src/constants/reviews.ts` — this module only
 * knows how to present it.
 */

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

/** Typographic ellipsis — one glyph, so it cannot be split across a line. */
const ELLIPSIS = '…';

/**
 * Punctuation that reads as a mistake immediately before an ellipsis. A comma
 * or colon left hanging ("Great place,…") looks like a typo; a full stop is
 * left alone because "Great place.…" never arises — a sentence that ended is
 * already a clean cut.
 */
const STRANDED_PUNCTUATION = /[.,;:\-–—]+$/;

export interface StudioReview {
  /** Stable slug, used for list keys and as the review's anchor id. */
  id: string;
  /** Reviewer name exactly as it appears on the listing. */
  author: string;
  /** Whole stars, 1-5. */
  rating: number;
  /**
   * `YYYY-MM` or `YYYY-MM-DD`. Google publishes relative dates ("3 months
   * ago"), which go stale on a static page, so they are resolved to a month at
   * transcription time and only ever rendered as a month.
   */
  date: string;
  /**
   * The review verbatim. Never edited for tone, length or grammar — these are
   * other people's words, and the excerpting below is the only shortening the
   * site does.
   */
  text: string;
  /** Hand-picked for the homepage widget. */
  featured?: boolean;
}

/** The studio-wide figures as the listing states them. */
export interface ReviewAggregate {
  rating: number;
  count: number;
}

export interface ReviewSummary {
  /** The rating to display. */
  rating: number;
  /** `rating` to one decimal, for display. */
  ratingLabel: string;
  /** Total reviews on the listing — usually more than the site publishes. */
  count: number;
  /** How many reviews are quoted verbatim on the site. */
  shown: number;
}

/** `2026-07` / `2026-07-28` -> `July 2026`, or null if unparseable. */
export function formatReviewMonth(date: string): string | null {
  const match = /^(\d{4})-(\d{2})(?:-\d{2})?$/.exec(date.trim());
  if (!match) return null;

  const [, year, month] = match;
  const index = Number(month) - 1;
  if (index < 0 || index >= MONTHS.length) return null;

  return `${MONTHS[index]} ${year}`;
}

/**
 * `5` -> `5.0`, `4.94` -> `4.9`. Always one decimal: a bare "5" reads as a
 * count rather than a score when it sits next to a row of stars.
 */
export function formatRatingLabel(rating: number): string {
  return rating.toFixed(1);
}

/**
 * The text alternative for a star row. The stars themselves are decorative
 * SVG, so this is the only thing a screen reader announces for the rating.
 */
export function reviewStarLabel(rating: number): string {
  return `Rated ${rating} out of 5`;
}

/**
 * The reviews for the homepage widget: flagged ones first in data order, then
 * topped up from the rest so the widget never renders short if someone forgets
 * to flag enough of them.
 */
export function selectFeaturedReviews(
  reviews: readonly StudioReview[],
  limit: number
): StudioReview[] {
  if (limit <= 0) return [];

  const flagged = reviews.filter((review) => review.featured);
  const rest = reviews.filter((review) => !review.featured);

  return [...flagged, ...rest].slice(0, limit);
}

/**
 * The reviews' own paragraph breaks. The longer ones run to four or five
 * paragraphs, and collapsing them into a single block turns a structured
 * account into a wall of prose that nobody finishes reading.
 */
export function reviewParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
}

/**
 * How much of the budget a sentence-boundary cut must use before it is
 * preferred over a word-boundary one. Below this the excerpt throws away so
 * much of the available room that a mid-sentence cut reads better — "Yes…" in
 * place of three usable lines.
 */
const SENTENCE_CUT_THRESHOLD = 0.5;

/** A sentence end: terminal punctuation followed by a space. */
const SENTENCE_END = /[.!?](?=\s)/g;

/** The leading half of an emoji left behind by a cut between surrogates. */
const LONE_HIGH_SURROGATE = /[\uD800-\uDBFF]$/;

/**
 * Shortens a quote to roughly `maxChars`, preferring a sentence boundary and
 * falling back to a word boundary.
 *
 * Used only by the homepage widget, where three quotes share a band and one
 * 1,400-character review would dwarf the other two. The full text is always one
 * click away on `/reviews/`, and `-webkit-line-clamp` is deliberately not used
 * instead: a clamp hides text that is still in the DOM, so the visible quote
 * would end mid-word with no ellipsis to say so.
 *
 * Ending on a whole sentence matters more here than squeezing the last few
 * words in: these are the only words of the studio's that someone else wrote,
 * and "…I get sparkles from Yana every time I" is a worse advertisement than the
 * same quote one clause shorter.
 */
export function excerptReviewText(text: string, maxChars: number): string {
  /*
   * No room means nothing to show, the same contract `selectFeaturedReviews`
   * keeps for a non-positive limit. Without this, `slice(0, maxChars)` below
   * would read a negative as an offset from the END of the string and return a
   * confidently wrong excerpt instead of an empty one.
   */
  if (maxChars <= 0) return '';

  const normalised = text.replace(/\s+/g, ' ').trim();
  if (normalised.length <= maxChars) return normalised;

  const head = normalised.slice(0, maxChars);

  // A space at the cut means the limit landed exactly on a word's last
  // character, so nothing needs trimming back.
  const endsOnBoundary = normalised.charAt(maxChars) === ' ';
  const lastSpace = head.lastIndexOf(' ');

  /*
   * No space at all: a single word longer than the limit. A hard cut is the
   * only option left — better a clipped word than a 1,400-character line.
   *
   * That cut is the one place a slice can land between the two halves of a
   * surrogate pair, which would leave a lone high surrogate to render as a
   * replacement glyph. The reviews carry emoji (see Svetlana Rao's), so the
   * dangling half is dropped rather than published.
   */
  const wordCut = (
    endsOnBoundary || lastSpace === -1 ? head : head.slice(0, lastSpace)
  ).replace(LONE_HIGH_SURROGATE, '');

  /*
   * Matched against one character more than the budget, not against `head`:
   * `SENTENCE_END` looks ahead for the space after the full stop, and when a
   * sentence ends exactly on the limit that space is the first character
   * *outside* `head` — so matching `head` alone would miss the cleanest cut
   * available and fall back to an ellipsis. The extra character can never be
   * taken, since a match there would need a space beyond it to look ahead to.
   */
  const probe = normalised.slice(0, maxChars + 1);
  const sentenceEnd = [...probe.matchAll(SENTENCE_END)].at(-1)?.index;
  const sentenceCut =
    sentenceEnd !== undefined &&
    sentenceEnd + 1 >= maxChars * SENTENCE_CUT_THRESHOLD
      ? head.slice(0, sentenceEnd + 1)
      : null;

  /*
   * A cut on a whole sentence keeps its own punctuation and takes no ellipsis.
   * An ellipsis stands in for an omission inside a quotation or for a sentence
   * trailing off; quoting someone's first two sentences and stopping is neither,
   * and "grow and explore.…" is just untidy. Nothing is misrepresented either
   * way — the words are verbatim and the full review is one click away.
   */
  if (sentenceCut) return sentenceCut;

  return wordCut.trimEnd().replace(STRANDED_PUNCTUATION, '') + ELLIPSIS;
}

/**
 * The figures for the rating block.
 *
 * `aggregate` carries what the listing says, because the site quotes a curated
 * handful of a much larger set — computing the average from those few would
 * both misstate the score and undercount the reviews. It is only computed from
 * the published reviews when no aggregate is on record.
 *
 * `count` can never fall below `shown`: a page displaying four reviews under
 * the words "3 reviews" is visibly wrong, and a stale hand-maintained
 * aggregate is the likeliest way to get there.
 */
export function summariseReviews(
  reviews: readonly StudioReview[],
  aggregate: ReviewAggregate | null
): ReviewSummary {
  const shown = reviews.length;

  const average =
    shown === 0
      ? 0
      : reviews.reduce((total, review) => total + review.rating, 0) / shown;

  const rating = aggregate ? aggregate.rating : average;
  const count = aggregate ? Math.max(aggregate.count, shown) : shown;

  return { rating, ratingLabel: formatRatingLabel(rating), count, shown };
}

/**
 * The month of the most recent review, for the "last updated" line on
 * `/reviews/`.
 *
 * A page of undated praise reads as though it could have been written years
 * ago, and the reviews are transcribed by hand — so the freshness signal has to
 * come from the data itself rather than from a build date, which would claim
 * the set was checked every time the site deployed.
 *
 * Compared as plain strings, with no date parsing. That orders the months
 * correctly, which is all this needs. It is NOT a total order within a single
 * month — `'2026-07' < '2026-07-05'` — but since the result is rendered as a
 * month either way, the two forms are interchangeable at the point it matters.
 */
export function latestReviewMonth(
  reviews: readonly StudioReview[]
): string | null {
  const dated = reviews
    .map((review) => review.date)
    .filter((date) => formatReviewMonth(date) !== null);

  if (dated.length === 0) return null;

  const latest = dated.reduce((max, date) => (date > max ? date : max));
  return formatReviewMonth(latest);
}
