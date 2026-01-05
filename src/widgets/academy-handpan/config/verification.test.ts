import { describe, it, expect } from 'vitest';
import { HANDPAN_CONFIGS } from './handpans';

describe('Handpan Scale Verification', () => {
  it('should generate multiple configs', () => {
    expect(HANDPAN_CONFIGS.length).toBeGreaterThan(0);
  });

  it('should use D3 octave for D Kurd ding', () => {
    const dKurdConfigs = HANDPAN_CONFIGS.filter(
      (c) => c.familyId === 'kurd' && c.tonicPc === 'D'
    );
    expect(dKurdConfigs.length).toBeGreaterThan(0);

    for (const config of dKurdConfigs) {
      expect(config.ding).toBe('D3');
      expect(config.notes[0]).toBe('D3');
    }
  });

  it('should make Pygmy distinct from Kurd', () => {
    const dKurd9 = HANDPAN_CONFIGS.find(
      (c) => c.familyId === 'kurd' && c.tonicPc === 'D' && c.noteCount === 9
    );
    const dPygmy9 = HANDPAN_CONFIGS.find(
      (c) => c.familyId === 'pygmy' && c.tonicPc === 'D' && c.noteCount === 9
    );

    expect(dKurd9).toBeDefined();
    expect(dPygmy9).toBeDefined();

    if (dKurd9 && dPygmy9) {
      const kurdNotes = dKurd9.notes.join(',');
      const pygmyNotes = dPygmy9.notes.join(',');

      expect(kurdNotes).not.toBe(pygmyNotes);
    }
  });

  it('should use D3 octave for all D-based scales', () => {
    const dScales = HANDPAN_CONFIGS.filter((c) => c.tonicPc === 'D');

    for (const config of dScales) {
      expect(config.ding).toBe('D3');
      expect(config.notes[0]).toBe('D3');
    }
  });

  it('should generate configs for multiple keys per family', () => {
    const kurdConfigs = HANDPAN_CONFIGS.filter((c) => c.familyId === 'kurd');
    const uniqueKeys = new Set(kurdConfigs.map((c) => c.tonicPc));

    expect(uniqueKeys.size).toBeGreaterThan(1);
  });

  it('should generate configs for multiple note counts per family-key', () => {
    const dKurdConfigs = HANDPAN_CONFIGS.filter(
      (c) => c.familyId === 'kurd' && c.tonicPc === 'D'
    );
    const uniqueNoteCounts = new Set(dKurdConfigs.map((c) => c.noteCount));

    expect(uniqueNoteCounts.size).toBeGreaterThan(1);
  });

  it('should have correct config structure', () => {
    const config = HANDPAN_CONFIGS[0];

    expect(config.id).toBeDefined();
    expect(config.name).toBeDefined();
    expect(config.familyId).toBeDefined();
    expect(config.tonicPc).toBeDefined();
    expect(config.ding).toBeDefined();
    expect(config.noteCount).toBeDefined();
    expect(config.notes).toBeInstanceOf(Array);
    expect(config.layout).toBeInstanceOf(Array);
    expect(config.scaleName).toBeDefined();
    expect(config.scaleDescription).toBeDefined();
  });

  it('should have all families represented', () => {
    const familyIds = new Set(HANDPAN_CONFIGS.map((c) => c.familyId));

    const expectedFamilies = [
      'kurd',
      'celtic-minor',
      'integral',
      'mystic',
      'pygmy',
      'la-sirena',
      'ursa-minor',
      'aegean',
      'oxalis',
      'hijaz',
      'harmonic-minor',
      'onoleo',
      'equinox',
      'magic-voyage',
      'ionian',
      'dorian',
      'lydian',
      'mixolydian',
      'aeolian',
    ];

    for (const family of expectedFamilies) {
      expect(familyIds.has(family)).toBe(true);
    }
  });
});
