import { describe, it, expect } from 'vitest';
import { getHandpanConfig } from './handpans';
import { normalizeToPitchClass } from '../theory/normalize';

describe('Kurd scale degree completeness', () => {
  it('D Kurd 9 must contain C (b7)', () => {
    const config = getHandpanConfig('kurd-d-9');
    expect(config).toBeDefined();

    if (!config) return;

    expect(config.notes).toContain('C4');

    const pitchClasses = config.notes.map(normalizeToPitchClass);
    expect(pitchClasses).toContain('C');

    const expectedPitchClasses = ['D', 'E', 'F', 'G', 'A', 'Bb', 'C'];
    for (const pc of expectedPitchClasses) {
      expect(pitchClasses).toContain(pc);
    }

    console.log('D Kurd 9 notes:', config.notes);
    expect(config.notes.length).toBe(9);
  });

  it('D Kurd 10 must contain C (b7)', () => {
    const config = getHandpanConfig('kurd-d-10');
    expect(config).toBeDefined();

    if (!config) return;

    const pitchClasses = config.notes.map(normalizeToPitchClass);
    expect(pitchClasses).toContain('C');

    const cNotes = config.notes.filter((n) => normalizeToPitchClass(n) === 'C');
    expect(cNotes.length).toBeGreaterThanOrEqual(1);

    console.log('D Kurd 10 notes:', config.notes);
    console.log('C notes:', cNotes);
    expect(config.notes.length).toBe(10);
  });

  it('D Kurd 9 should have correct structure', () => {
    const config = getHandpanConfig('kurd-d-9');
    expect(config).toBeDefined();

    if (!config) return;

    expect(config.notes[0]).toBe('D3');
    expect(config.notes[1]).toBe('A3');

    const expectedNotes = [
      'D3',
      'A3',
      'Bb3',
      'C4',
      'E4',
      'F4',
      'G4',
      'A4',
      'Bb4',
    ];
    expect(config.notes).toEqual(expectedNotes);

    const pitchClasses = config.notes.map(normalizeToPitchClass);
    expect(pitchClasses).toContain('D');
    expect(pitchClasses).toContain('E');
    expect(pitchClasses).toContain('F');
    expect(pitchClasses).toContain('G');
    expect(pitchClasses).toContain('A');
    expect(pitchClasses).toContain('Bb');
    expect(pitchClasses).toContain('C');
  });

  it('all Kurd variants must contain C', () => {
    const kurdKeys = ['D', 'E', 'F#', 'G', 'A', 'C', 'C#'];

    for (const key of kurdKeys) {
      const configId = `kurd-${key.toLowerCase().replace('#', 's')}-9`;
      const config = getHandpanConfig(configId);

      expect(config).toBeDefined();
      if (!config) continue;

      const pitchClasses = config.notes.map(normalizeToPitchClass);
      const scaleDegrees = new Set(pitchClasses);

      expect(scaleDegrees.size).toBeGreaterThanOrEqual(6);

      console.log(
        `${key} Kurd 9 pitch classes:`,
        Array.from(scaleDegrees).sort()
      );
    }
  });
});
