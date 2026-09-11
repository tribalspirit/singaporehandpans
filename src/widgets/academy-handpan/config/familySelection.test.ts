import { describe, it, expect } from 'vitest';
import {
  getSelectionForFamily,
  getKeyOptions,
  resolveHandpanConfig,
} from './handpanSelectorModel';

/**
 * Switching family used to reset key and shell to that family's defaults
 * unconditionally, so comparing one key across families — the main reason to
 * switch at all — lost the key on every switch, silently.
 */
describe('getSelectionForFamily', () => {
  it('keeps both key and shell when the new family publishes them', () => {
    // Kurd and Celtic Minor are both tuned to D at 9 notes.
    const result = getSelectionForFamily('celtic-minor', {
      key: 'D',
      noteCount: 9,
    });

    expect(result.key).toBe('D');
    expect(result.noteCount).toBe(9);
    expect(result.movedFromKey).toBeUndefined();
  });

  it('keeps the key and falls back on the shell when only the shell differs', () => {
    // Akebono publishes 9 notes only; ask for D at a shell it does not have.
    const result = getSelectionForFamily('akebono', {
      key: 'D',
      noteCount: 13,
    });

    expect(result.key).toBe('D');
    expect(result.movedFromKey).toBeUndefined();
    expect(
      resolveHandpanConfig({
        familyId: 'akebono',
        key: result.key,
        noteCount: result.noteCount,
      })
    ).not.toBeNull();
  });

  it('reports the move when the new family has no such key', () => {
    // Golden Gate is C only.
    expect(getKeyOptions('golden-gate')).not.toContain('D');

    const result = getSelectionForFamily('golden-gate', {
      key: 'D',
      noteCount: 9,
    });

    expect(result.key).toBe('C');
    expect(result.movedFromKey).toBe('D');
  });

  it('always returns a selection that actually resolves', () => {
    const families = ['kurd', 'golden-gate', 'akebono', 'sabye', 'aegean'];

    for (const from of families) {
      for (const to of families) {
        const start = getSelectionForFamily(from, { key: 'D', noteCount: 9 });
        const next = getSelectionForFamily(to, start);

        expect(
          resolveHandpanConfig({
            familyId: to,
            key: next.key,
            noteCount: next.noteCount,
          }),
          `${from} -> ${to} produced an unresolvable selection`
        ).not.toBeNull();
      }
    }
  });
});
