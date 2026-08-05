/**
 * Whether an event's `location` is the studio's own address.
 *
 * Nine of ten upcoming cards printed the identical studio address, so the row
 * carried no distinguishing information while pushing what does differ —
 * teacher, level, price — below the fold. The default is now stated once at
 * page level and the card shows a location only when it is somewhere else.
 *
 * `location` is free text in the CMS and is entered several ways ("Singapore
 * Handpan Studio", the bare address, or both concatenated), so this matches on
 * the two landmarks rather than comparing strings.
 */

import { STUDIO_NAME } from '../constants/contacts';

/** Lowercased, punctuation-free, single-spaced — so `Pearl's` matches `Pearls`. */
function canonical(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const STUDIO_NAME_KEY = canonical(STUDIO_NAME);

/** Both words must be present; "hill" alone would match half of Singapore. */
const ADDRESS_KEYWORDS = ['pearl', 'hill'];

export function isStudioLocation(location: string | undefined | null): boolean {
  // Nothing entered means nothing to distinguish, so it is the default. This
  // also stops an absent location rendering a bare map pin with no text.
  if (!location || !location.trim()) return true;

  const value = canonical(location);
  if (value.includes(STUDIO_NAME_KEY)) return true;

  return ADDRESS_KEYWORDS.every((keyword) => value.includes(keyword));
}
