import { describe, it, expect } from 'vitest';
import {
  DEFAULT_ARPEGGIO_BPM,
  MAX_ARPEGGIO_BPM,
  MIN_ARPEGGIO_BPM,
  resolveWidgetProps,
} from './widgetProps';
import {
  getInitialSelection,
  resolveHandpanConfig,
} from '../config/handpanSelectorModel';

/**
 * These props cross a trust boundary.
 *
 * A host page sets them as HTML attributes, so every value arrives as a string
 * written by someone who has not read this catalog — misspelled, wrongly cased,
 * or naming a scale that was excluded for want of a source. None of that may
 * produce an empty instrument or a control the visitor cannot get back from.
 */

const DEFAULTS = getInitialSelection();

describe('resolveWidgetProps', () => {
  it('opens on the catalog default when asked for nothing', () => {
    const resolved = resolveWidgetProps();

    expect(resolved.selection).toEqual(DEFAULTS);
    expect(resolved.notation).toBe('note');
    expect(resolved.view).toBe('listen');
    expect(resolved.playbackMode).toBe('arpeggio');
    expect(resolved.arpeggioBpm).toBe(DEFAULT_ARPEGGIO_BPM);
  });

  it('honours a selection the catalog can render', () => {
    const resolved = resolveWidgetProps({
      familyId: 'pygmy',
      scaleKey: 'F',
      noteCount: 9,
    });

    expect(resolved.selection).toEqual({
      familyId: 'pygmy',
      key: 'F',
      noteCount: 9,
    });
  });

  it('accepts a key however the host page spelled it', () => {
    for (const scaleKey of ['f#', 'F#', ' f# ', 'F♯']) {
      expect(
        resolveWidgetProps({ familyId: 'kurd', scaleKey }).selection.key,
        scaleKey
      ).toBe('F#');
    }
  });

  it('accepts a pad count passed as an attribute string', () => {
    expect(
      resolveWidgetProps({ familyId: 'kurd', noteCount: '10' }).selection
        .noteCount
    ).toBe(10);
  });

  it('keeps a good family when the key is nonsense', () => {
    const resolved = resolveWidgetProps({ familyId: 'pygmy', scaleKey: 'H' });

    expect(resolved.selection.familyId).toBe('pygmy');
    expect(resolved.selection.key).not.toBe('H');
    expect(resolveHandpanConfig(resolved.selection)).not.toBeNull();
  });

  it('keeps a good family when the pad count is one it never published', () => {
    const resolved = resolveWidgetProps({ familyId: 'kurd', noteCount: 99 });

    expect(resolved.selection.familyId).toBe('kurd');
    expect(resolveHandpanConfig(resolved.selection)).not.toBeNull();
  });

  it('falls back when the family is unknown or was excluded', () => {
    for (const familyId of ['not-a-scale', 'lydian', '']) {
      expect(
        resolveWidgetProps({ familyId }).selection.familyId,
        familyId
      ).toBe(DEFAULTS.familyId);
    }
  });

  /**
   * A merged-away id must keep its own former default rather than inheriting
   * the survivor's — the same rule the selector follows for a restored id.
   */
  it('opens a merged-away family on the selection it used to publish', () => {
    const resolved = resolveWidgetProps({ familyId: 'equinox' });

    expect(resolved.selection.familyId).toBe('equinox');
    expect(resolved.selection.key).toBe('G');
    expect(resolveHandpanConfig(resolved.selection)).not.toBeNull();
  });

  /**
   * A merged family may be asked for a shell the survivor never published:
   * Ionian offered 9, 10 and 13, and Sabye — what it became — offers 9 only.
   * `resolveHandpanConfig` migrates that request down to 9, so returning the
   * requested 13 would leave the widget rendering a 9-pad instrument while its
   * summary line and shell selector both claimed 13.
   */
  it('reports the shell count the instrument actually has', () => {
    const resolved = resolveWidgetProps({
      familyId: 'ionian',
      scaleKey: 'D',
      noteCount: 13,
    });

    const config = resolveHandpanConfig(resolved.selection);
    expect(config).not.toBeNull();
    expect(resolved.selection.noteCount).toBe(config?.noteCount);
    expect(resolved.selection.noteCount).toBe(config?.notes.length);
  });

  it('always yields a selection that resolves to an instrument', () => {
    const nonsense = [
      { familyId: 'kurd', scaleKey: 'Z', noteCount: -4 },
      { familyId: '../../etc/passwd', scaleKey: '<script>', noteCount: 'NaN' },
      { familyId: null, scaleKey: null, noteCount: null },
    ];

    for (const request of nonsense) {
      const resolved = resolveWidgetProps(request);
      expect(
        resolveHandpanConfig(resolved.selection),
        JSON.stringify(request)
      ).not.toBeNull();
    }
  });

  it('reads the presentation props it knows and ignores the rest', () => {
    const resolved = resolveWidgetProps({
      notation: 'number',
      view: 'CHORDS',
      playbackMode: 'simultaneous',
    });

    expect(resolved.notation).toBe('number');
    expect(resolved.view).toBe('chords');
    expect(resolved.playbackMode).toBe('simultaneous');

    const rejected = resolveWidgetProps({
      notation: 'solfege',
      view: 'settings',
      playbackMode: 'backwards',
    });

    expect(rejected.notation).toBe('note');
    expect(rejected.view).toBe('listen');
    expect(rejected.playbackMode).toBe('arpeggio');
  });

  /**
   * Clamped, not rejected: the bounds are the tempo slider's own, so a value
   * outside them would render a control the visitor could not return to.
   */
  it('clamps the tempo into the range the slider offers', () => {
    expect(resolveWidgetProps({ arpeggioBpm: 10 }).arpeggioBpm).toBe(
      MIN_ARPEGGIO_BPM
    );
    expect(resolveWidgetProps({ arpeggioBpm: 10000 }).arpeggioBpm).toBe(
      MAX_ARPEGGIO_BPM
    );
    expect(resolveWidgetProps({ arpeggioBpm: '90' }).arpeggioBpm).toBe(90);
    expect(resolveWidgetProps({ arpeggioBpm: 'fast' }).arpeggioBpm).toBe(
      DEFAULT_ARPEGGIO_BPM
    );
  });

  /**
   * An absent attribute reaches a custom element as `null`, and an author may
   * well write `arpeggio-bpm=""`. `Number` turns both into 0, which clamps to
   * the slowest tempo the slider offers — so "I did not set this" would have
   * meant 60 BPM rather than the default.
   */
  it('treats an unset tempo as unset rather than as zero', () => {
    for (const arpeggioBpm of [null, undefined, '', '   ']) {
      expect(
        resolveWidgetProps({ arpeggioBpm }).arpeggioBpm,
        JSON.stringify(arpeggioBpm)
      ).toBe(DEFAULT_ARPEGGIO_BPM);
    }
  });

  /** The same blank-is-absent rule, for the fields that pick an instrument. */
  it('treats a blank selection attribute as unset', () => {
    const resolved = resolveWidgetProps({
      familyId: '   ',
      scaleKey: '',
      noteCount: '',
    });

    expect(resolved.selection).toEqual(DEFAULTS);
  });
});
