export interface ScaleCatalogEntry {
  id: string;
  name: string;
  aliases?: string[];
  moodTags: string[];
  typicalKeys?: string[];
  description: string;
}

export const HANDPAN_SCALE_CATALOG: ScaleCatalogEntry[] = [
  {
    id: 'kurd',
    name: 'Kurd',
    aliases: ['D Kurd', 'Kurd Minor', 'Integral Minor'],
    moodTags: ['versatile', 'balanced', 'atmospheric', 'open'],
    typicalKeys: ['D', 'A'],
    description: 'The most popular handpan scale. Versatile and balanced, perfect for beginners. Creates an open, atmospheric sound.',
  },
  {
    id: 'celtic-minor',
    name: 'Celtic Minor',
    aliases: ['Amara', 'Celtic'],
    moodTags: ['deep', 'enchanting', 'soul-soothing', 'mystical'],
    typicalKeys: ['D', 'E', 'B'],
    description: 'A hexatonic scale with a deep, enchanting quality. Often compared to Kurd but with a more mystical character.',
  },
  {
    id: 'pygmy',
    name: 'Pygmy',
    aliases: ['Pygmy Minor'],
    moodTags: ['tribal', 'rhythmic', 'energetic', 'primal'],
    typicalKeys: ['D', 'A'],
    description: 'A rhythmic, energetic scale with a tribal feel. Great for percussive playing and rhythmic patterns.',
  },
  {
    id: 'equinox',
    name: 'Equinox',
    aliases: ['F# Equinox'],
    moodTags: ['bright', 'joyous', 'uplifting', 'rare'],
    typicalKeys: ['F#'],
    description: 'A rare minor scale known for its bright and joyous expression. Uniquely uplifting among minor scales.',
  },
  {
    id: 'hijaz',
    name: 'Hijaz',
    aliases: ['D Hijaz', 'Hijaz Minor'],
    moodTags: ['exotic', 'oriental', 'profound', 'classical'],
    typicalKeys: ['D', 'A'],
    description: 'Derived from classical Arabic music. Recognized for its unique, exotic sound with a profound musical legacy.',
  },
  {
    id: 'magic-voyage',
    name: 'Magic Voyage',
    aliases: ['Magic Travel', 'Voyage'],
    moodTags: ['melodic', 'flowing', 'dreamy', 'adventurous'],
    typicalKeys: ['D', 'A'],
    description: 'A melodic scale that creates a flowing, dreamy atmosphere. Perfect for storytelling and meditative playing.',
  },
  {
    id: 'annaziska',
    name: 'AnnaZiska',
    aliases: ['Integral', 'Integral Minor'],
    moodTags: ['balanced', 'harmonious', 'versatile', 'open'],
    typicalKeys: ['D', 'C#'],
    description: 'A hexatonic variation that omits the 4th scale degree, creating a balanced and harmonious sound.',
  },
  {
    id: 'mystic',
    name: 'Mystic',
    aliases: ['Mystic Minor'],
    moodTags: ['mysterious', 'contemplative', 'introspective', 'spiritual'],
    typicalKeys: ['D'],
    description: 'A beginner-friendly D minor family scale with a mysterious, contemplative character. Great for introspective playing.',
  },
  {
    id: 'ionian',
    name: 'Ionian',
    aliases: ['Major'],
    moodTags: ['bright', 'happy', 'uplifting', 'classic'],
    typicalKeys: ['C', 'D', 'G'],
    description: 'The classic major scale. Bright, happy, and uplifting. Less common on handpans but offers a cheerful alternative.',
  },
  {
    id: 'dorian',
    name: 'Dorian',
    aliases: ['Dorian Mode'],
    moodTags: ['jazzy', 'sophisticated', 'minor-like', 'versatile'],
    typicalKeys: ['D', 'A'],
    description: 'A minor-like mode with a raised 6th. More sophisticated and jazzy than pure minor scales.',
  },
  {
    id: 'lydian',
    name: 'Lydian',
    aliases: ['Lydian Mode'],
    moodTags: ['dreamy', 'ethereal', 'floating', 'mystical'],
    typicalKeys: ['F', 'C'],
    description: 'A major mode with a raised 4th. Creates a dreamy, floating quality with an ethereal character.',
  },
  {
    id: 'mixolydian',
    name: 'Mixolydian',
    aliases: ['Mixolydian Mode'],
    moodTags: ['bluesy', 'rock', 'folk', 'grounded'],
    typicalKeys: ['G', 'D'],
    description: 'A major mode with a lowered 7th. Bluesy and grounded, popular in rock and folk music.',
  },
  {
    id: 'aeolian',
    name: 'Aeolian',
    aliases: ['Natural Minor', 'Minor'],
    moodTags: ['melancholic', 'emotional', 'expressive', 'classic'],
    typicalKeys: ['A', 'D', 'E'],
    description: 'The natural minor scale. Melancholic and emotional, offering deep expressive possibilities.',
  },
];

export function getScaleCatalogEntry(id: string): ScaleCatalogEntry | undefined {
  return HANDPAN_SCALE_CATALOG.find((entry) => entry.id === id || entry.aliases?.includes(id));
}

export function searchScaleCatalog(query: string): ScaleCatalogEntry[] {
  const lowerQuery = query.toLowerCase();
  return HANDPAN_SCALE_CATALOG.filter(
    (entry) =>
      entry.name.toLowerCase().includes(lowerQuery) ||
      entry.aliases?.some((alias) => alias.toLowerCase().includes(lowerQuery)) ||
      entry.moodTags.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
      entry.description.toLowerCase().includes(lowerQuery)
  );
}

