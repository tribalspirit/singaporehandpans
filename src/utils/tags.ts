const TAG_SEPARATOR_REGEX = /,/;
const WHITESPACE_TRIM_REGEX = /^\s+|\s+$/g;
const HYPHEN_TO_SPACE_REGEX = /-/g;

const normalizeTags = (tags: string | string[] | undefined): string[] => {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  if (typeof tags === 'string') {
    return tags
      .split(TAG_SEPARATOR_REGEX)
      .map((t) => t.replace(WHITESPACE_TRIM_REGEX, ''))
      .filter(Boolean);
  }
  return [];
};

/**
 * Event tags carry two different taxonomies in one flat list — one format tag
 * plus up to three level tags — and rendering them as an undifferentiated run
 * of chips said very little (a class tagged both `beginner` and `advanced` has
 * told the reader nothing). These two helpers collapse the list into the two
 * marks a card actually needs: one category, one level.
 */

/**
 * Display name per format tag.
 *
 * `performance` is the CMS option; `Concert` is what readers call it. The last
 * three keys are not in the CMS option list at all but do appear in live
 * free-text data, so they are mapped rather than dropped.
 */
const CATEGORY_BY_TAG: Record<string, string> = {
  workshop: 'Workshop',
  performance: 'Concert',
  community: 'Community',
  private: 'Private',
  masterclass: 'Masterclass',
  concert: 'Concert',
  course: 'Course',
};

/**
 * Bucket for events carrying no recognised format tag. Shared so the archive's
 * filter and the row markup that it filters on cannot drift apart.
 */
export const UNCATEGORISED = 'other';

/**
 * Plural display names, stated rather than derived. Appending an `s` produced
 * "Masterclasss", "Communitys" and "Privates" — the last two are a mass noun
 * and an adjective, so they read correctly unchanged.
 */
const CATEGORY_PLURAL: Record<string, string> = {
  Workshop: 'Workshops',
  Concert: 'Concerts',
  Course: 'Courses',
  Masterclass: 'Masterclasses',
  Community: 'Community',
  Private: 'Private',
};

/** Ascending, so a two-level span can be named after its lower bound. */
const LEVEL_ORDER = ['beginner', 'intermediate', 'advanced'] as const;

const canonical = (tag: string) =>
  tag.replace(WHITESPACE_TRIM_REGEX, '').toLowerCase();

const capitalize = (word: string) =>
  word.charAt(0).toUpperCase() + word.slice(1);

/**
 * The single category chip for an event — `Workshop`, `Concert`, `Community` —
 * or `null` when the event carries no format tag. Level tags are ignored.
 */
/**
 * Precedence when an event carries more than one format tag, most specific
 * first. Without it the chip was decided by whichever tag the author happened
 * to list first, so the same event could render either label.
 */
const CATEGORY_PRECEDENCE = [
  'Masterclass',
  'Concert',
  'Course',
  'Workshop',
  'Private',
  'Community',
] as const;

export function getEventCategory(
  tags: string | string[] | undefined
): string | null {
  const present = new Set(
    normalizeTags(tags)
      .map((tag) => CATEGORY_BY_TAG[canonical(tag)])
      .filter(Boolean)
  );
  if (present.size === 0) return null;

  return (
    CATEGORY_PRECEDENCE.find((category) => present.has(category)) ??
    [...present][0]
  );
}

/**
 * A category's plural, for filter chips and counts. An unrecognised category
 * is returned unchanged rather than guessed at.
 */
export function getCategoryPlural(category: string): string {
  return CATEGORY_PLURAL[category] ?? category;
}

/**
 * The level tags collapsed to one string — `All levels`, `Intermediate+`,
 * `Beginner` — or `null` when none are present.
 *
 * A span reaching both ends of the range is `All levels` however it was
 * tagged: `beginner`+`advanced` without `intermediate` still means "anyone".
 */
export function getLevelLabel(
  tags: string | string[] | undefined
): string | null {
  const present = new Set(normalizeTags(tags).map(canonical));
  const levels = LEVEL_ORDER.filter((level) => present.has(level));

  if (levels.length === 0) return null;
  if (levels.length === 1) return capitalize(levels[0]);
  if (levels.length === LEVEL_ORDER.length) return 'All levels';

  const [low, high] = levels;
  const spansFullRange =
    low === LEVEL_ORDER[0] && high === LEVEL_ORDER[LEVEL_ORDER.length - 1];
  return spansFullRange ? 'All levels' : `${capitalize(low)}+`;
}

export {
  normalizeTags,
  TAG_SEPARATOR_REGEX,
  WHITESPACE_TRIM_REGEX,
  HYPHEN_TO_SPACE_REGEX,
};
