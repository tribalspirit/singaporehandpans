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

export { normalizeTags, TAG_SEPARATOR_REGEX, WHITESPACE_TRIM_REGEX, HYPHEN_TO_SPACE_REGEX };



