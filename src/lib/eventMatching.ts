/**
 * Relating one event to another.
 *
 * The archive was a dead end: someone reading about a workshop they missed got
 * no next date and no route back to what is open. `findRunsAgainMatch` pairs a
 * finished event with the same class running again so the row can offer
 * "Runs again →" instead of "Details →".
 *
 * Both helpers are deliberately conservative — a missed match degrades to the
 * previous behaviour, whereas a wrong match sends a warm lead to the wrong
 * class. Pure and side-effect free.
 */

import { getEventCategory, getLevelLabel } from '../utils/tags';

/** The shape both helpers need; `EventListItem` satisfies it structurally. */
export interface MatchableEvent {
  story: {
    slug: string;
    content: {
      title: string;
      tags?: string | string[];
    };
  };
}

/**
 * A teacher's name follows "with" and is capitalised; the clause that follows
 * ("for Singapore Handpan Community") is not. Capped at three words so a long
 * capitalised run cannot be swallowed whole.
 */
const TEACHER_REGEX =
  /\b[Ww]ith\s+(\p{Lu}[\p{L}'’-]*(?:\s+\p{Lu}[\p{L}'’-]*){0,2})/u;

/**
 * Words that carry no signal when comparing two titles.
 *
 * `handpan` is included deliberately: every event on this site is a handpan
 * event, so matching on it would relate everything to everything. The format
 * nouns below are excluded for the same reason once removed a level further —
 * a category match is already required before titles are compared, so two
 * candidates both saying "workshop" have agreed on nothing new.
 */
const TITLE_STOPWORDS = new Set([
  'a',
  'an',
  'and',
  'at',
  'by',
  'for',
  'in',
  'of',
  'on',
  'the',
  'to',
  'with',
  'handpan',
  'workshop',
  'workshops',
  'masterclass',
  'class',
  'classes',
  'course',
  'lesson',
  'lessons',
  'session',
  'sessions',
  'concert',
  'event',
]);

/** Below this share of shared words, two titles are different classes. */
const MATCH_THRESHOLD = 0.5;

const WORD_SPLIT_REGEX = /[^\p{L}\p{N}]+/u;

/**
 * The teacher named in a title — `Master Handpan with Dany Rud` → `Dany Rud` —
 * or `null`.
 *
 * A best-effort read of free text, not a data field. Callers must render
 * without it. A `teacher` field in Storyblok would replace this outright.
 */
/**
 * Words that follow "with" but name a thing, not a person. Capitalised in
 * titles, so the pattern alone cannot tell them apart — "masterclasses with
 * Dany Rud, Kirill Osherov, Konnakol" shipped to the live archive.
 */
const NOT_A_TEACHER = new Set([
  'konnakol',
  'handpan',
  'handpans',
  'frame',
  'drum',
  'drums',
  'voice',
  'guitar',
  'friends',
  'us',
]);

export function extractTeacherName(
  title: string | undefined | null
): string | null {
  if (!title) return null;

  const name = TEACHER_REGEX.exec(title)?.[1];
  if (!name) return null;

  // Reject when every word names a thing. A real name alongside one of these
  // ("Handpan with Dany Rud") still reads correctly.
  const words = name.toLowerCase().split(WORD_SPLIT_REGEX).filter(Boolean);
  if (words.every((word) => NOT_A_TEACHER.has(word))) return null;

  return name;
}

/** Significant lowercased words in a title, minus the teacher's name. */
function titleTokens(title: string): Set<string> {
  // The teacher is excluded from the score deliberately. Once stopwords and
  // the format noun are gone, "Handpan Workshop with Dany Rud" and "Rhythm
  // Workshop with Dany Rud" overlapped on the teacher alone and matched —
  // two unrelated classes joined because the same person taught both.
  const teacher = extractTeacherName(title)?.toLowerCase() ?? '';
  const teacherWords = new Set(teacher.split(WORD_SPLIT_REGEX).filter(Boolean));

  return new Set(
    title
      .toLowerCase()
      .split(WORD_SPLIT_REGEX)
      .filter(
        (word) =>
          word.length > 0 &&
          !TITLE_STOPWORDS.has(word) &&
          !teacherWords.has(word)
      )
  );
}

/** Jaccard similarity of two token sets — shared words over total words. */
function similarity(left: Set<string>, right: Set<string>): number {
  if (left.size === 0 || right.size === 0) return 0;

  let shared = 0;
  for (const word of left) if (right.has(word)) shared += 1;

  return shared / (left.size + right.size - shared);
}

/**
 * Two events are level-compatible unless both state a level and the levels
 * disagree. Category, teacher and format noun are all shared between the
 * beginner and intermediate runs of one series, so title overlap alone reads
 * as a match — and sending a beginner to an intermediate class is worse than
 * offering them nothing. An untagged level stays permissive: absent data is
 * not a disagreement.
 */
function levelsAgree(left: MatchableEvent, right: MatchableEvent): boolean {
  const a = getLevelLabel(left.story.content.tags);
  const b = getLevelLabel(right.story.content.tags);
  return a === null || b === null || a === b;
}

/**
 * The upcoming event that is the same class as `past`, or `null`.
 *
 * Requires an exact category match, compatible levels *and* strong title
 * overlap. Any one alone produces false pairings — category alone would match
 * every concert to every other one.
 */
export function findRunsAgainMatch<T extends MatchableEvent>(
  past: MatchableEvent,
  upcoming: readonly T[]
): T | null {
  const category = getEventCategory(past.story.content.tags);
  if (!category) return null;

  const pastTokens = titleTokens(past.story.content.title);

  let best: T | null = null;
  let bestScore = 0;

  for (const candidate of upcoming) {
    if (getEventCategory(candidate.story.content.tags) !== category) continue;
    if (!levelsAgree(past, candidate)) continue;

    const score = similarity(
      pastTokens,
      titleTokens(candidate.story.content.title)
    );
    if (score >= MATCH_THRESHOLD && score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  return best;
}
