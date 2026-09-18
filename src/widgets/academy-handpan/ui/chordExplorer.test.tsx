// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  render,
  screen,
  cleanup,
  within,
  act,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HandpanWidget from './HandpanWidget';
import { warmAudioModule } from '../audio/engine';
import {
  getFamilyPreviewOptions,
  resolveHandpanConfig,
} from '../config/handpanSelectorModel';
import { sortNotesByPitch } from '../theory/utils';

/*
 * Audio is an external system, stubbed at its module boundary.
 *
 * These are tests about what the interface offers, not about sound. Tabbing
 * into the views prefetches Tone, and real Tone in jsdom has no usable audio
 * context — exercising it here would test the mock's fidelity rather than the
 * widget. Playback itself is covered by the audio suites.
 *
 * `createAudioEngine` hands back the same stub every call, so a test can hold
 * one set of spies. Nothing here renders two widgets; the isolation between
 * instances is a property of the real engine, tested there.
 */
const audio = vi.hoisted(() => ({
  initialize: vi.fn().mockResolvedValue(undefined),
  isInitialized: vi.fn().mockReturnValue(true),
  playNote: vi.fn(),
  playChord: vi.fn(),
  playArpeggio: vi.fn(),
  stopArpeggio: vi.fn(),
  dispose: vi.fn(),
}));

vi.mock('../audio/createAudioEngine', () => ({
  createAudioEngine: () => audio,
}));
vi.mock('../audio/engine', () => ({
  warmAudioModule: vi.fn().mockResolvedValue(undefined),
}));

/**
 * The redesign's load-bearing claims, held as tests.
 *
 * Each case names the defect it prevents: the widget asked for three
 * configuration decisions before it made a sound, buried Play in a secondary
 * card, carried meaning in colour alone, and shoved the page down whenever a
 * chord was selected.
 */

afterEach(cleanup);

describe('Chord Explorer first paint', () => {
  /** Finding 1 and 9: one line describing the instrument, not three selects. */
  it('states the instrument in one line with configuration collapsed', () => {
    render(<HandpanWidget />);

    expect(screen.getByText('D Kurd · 9 notes')).toBeDefined();
    expect(screen.getByRole('button', { name: /^change$/i })).toBeDefined();

    // The pickers exist, but only once asked for.
    expect(
      screen.queryByRole('radiogroup', { name: /pad labels/i })
    ).toBeNull();
  });

  /** Finding 2: the action that satisfies the page's job is a real button. */
  it('offers Play scale as a top-level action', () => {
    render(<HandpanWidget />);

    expect(screen.getByRole('button', { name: /play scale/i })).toBeDefined();
  });

  /** Finding 6: the ~20 advanced voicings are not the default view. */
  it('does not render advanced voicings until asked', async () => {
    const user = userEvent.setup();
    render(<HandpanWidget />);

    await user.click(screen.getByRole('tab', { name: /chords/i }));

    const basic = screen.getByRole('tab', { name: /basic/i });
    expect(basic.getAttribute('aria-selected')).toBe('true');

    const advanced = screen.getByRole('tab', { name: /advanced/i });
    expect(advanced.getAttribute('aria-selected')).toBe('false');

    // The panel stays mounted so its analysis is not recomputed on every
    // switch, but it is hidden: not visible, not reachable by keyboard.
    const advancedPanel = document.getElementById(
      advanced.getAttribute('aria-controls')!
    );
    expect(advancedPanel?.hasAttribute('hidden')).toBe(true);
  });

  /**
   * Finding 5: tonic and relative major were pale indigo and pale yellow fills
   * decoded by a legend. The words now ride on the tiles, and the legend is
   * gone rather than merely supplemented.
   */
  it('labels chord degrees in text instead of colour', async () => {
    const user = userEvent.setup();
    render(<HandpanWidget />);
    await user.click(screen.getByRole('tab', { name: /chords/i }));

    const tonic = screen.getByRole('button', { name: /^Dm tonic/ });
    expect(within(tonic).getByText('tonic')).toBeDefined();
    expect(
      within(
        screen.getByRole('button', { name: /^F relative major/ })
      ).getByText('relative major')
    ).toBeDefined();

    expect(screen.queryByText(/■ Tonic/)).toBeNull();
    expect(screen.queryByText(/■ Relative Major/)).toBeNull();
  });

  /**
   * Case carries the quality, so getting it wrong states something false about
   * the scale. D Kurd is natural minor: i ii° III iv v VI VII.
   */
  it('cases the degree labels by the triad quality', async () => {
    const user = userEvent.setup();
    render(<HandpanWidget />);
    await user.click(screen.getByRole('tab', { name: /chords/i }));

    for (const [chord, degree] of [
      ['E°', 'ii°'],
      ['Gm', 'iv'],
      ['Am', 'v'],
      ['Bb', 'VI'],
      ['C', 'VII'],
    ]) {
      const tile = screen.getByRole('button', {
        name: new RegExp(
          `^${chord.replace('°', '°')} ${degree.replace('°', '°')} `
        ),
      });
      expect(within(tile).getByText(degree)).toBeDefined();
    }
  });

  /**
   * Finding 10: selecting a chord injected a control block above the list and
   * pushed everything down. The bar is always present; only its contents
   * change.
   */
  it('keeps the chord action bar present whether or not a chord is selected', async () => {
    const user = userEvent.setup();
    render(<HandpanWidget />);

    expect(
      screen.getByText(/pick a chord to hear it and see it on the pan/i)
    ).toBeDefined();
    const playBefore = screen.getByRole('button', { name: /^play$/i });
    expect(playBefore).toHaveProperty('disabled', true);

    await user.click(screen.getByRole('tab', { name: /chords/i }));
    await user.click(screen.getByRole('button', { name: /^Dm tonic/ }));

    expect(
      screen.queryByText(/pick a chord to hear it and see it on the pan/i)
    ).toBeNull();
    expect(screen.getByRole('button', { name: /^play$/i })).toHaveProperty(
      'disabled',
      false
    );
  });

  /**
   * Finding 11: the speed slider and the roll/strum choice are kept for the
   * players who want them, but behind the bar's options disclosure rather than
   * permanently occupying the action row.
   */
  it('keeps playback options available behind a disclosure', async () => {
    const user = userEvent.setup();
    render(<HandpanWidget />);

    const toggle = screen.getByRole('button', { name: /playback options/i });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');

    // Present but hidden, so neither control occupies the action row nor sits
    // in the tab order until it is asked for.
    const popover = document.getElementById(
      toggle.getAttribute('aria-controls')!
    );
    expect(popover?.hasAttribute('hidden')).toBe(true);

    await user.click(toggle);

    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(popover?.hasAttribute('hidden')).toBe(false);
    expect(screen.getByRole('radiogroup', { name: /sound/i })).toBeDefined();
    expect(screen.getByRole('slider')).toBeDefined();
  });

  /**
   * Changing the instrument must silence the instrument you left.
   *
   * The stop effect was keyed on `scaleName`, which is the *family* name and
   * so survives a key or pad-count switch untouched — leaving an arpeggio for
   * D sounding over a pan now drawn in E, driving `activeNote` for pads that
   * are no longer on screen.
   */
  it('stops playback when the key changes', async () => {
    const user = userEvent.setup();
    render(<HandpanWidget />);

    await user.click(screen.getByRole('button', { name: /^change$/i }));
    vi.mocked(audio.stopArpeggio).mockClear();

    // Kurd opens on D; E is another key it publishes.
    await user.click(screen.getByRole('button', { name: /^E$/ }));

    expect(audio.stopArpeggio).toHaveBeenCalled();
  });

  /**
   * And re-selecting the family already shown leaves the selection unchanged,
   * so nothing downstream reacts — the stop has to be explicit, or an in-flight
   * preview keeps firing `onStep` and relights pads with no user action.
   */
  it('stops playback when the shown family is re-selected', async () => {
    const user = userEvent.setup();
    render(<HandpanWidget />);

    await user.click(screen.getByRole('button', { name: /^change$/i }));
    vi.mocked(audio.stopArpeggio).mockClear();

    await user.click(screen.getByRole('button', { name: /^Kurd/ }));

    expect(audio.stopArpeggio).toHaveBeenCalled();
  });

  /**
   * Every control that makes a sound must prefetch Tone before the click that
   * needs it.
   *
   * Tone is ~340 KB and out of the initial bundle, so a cold control starts
   * the import inside `initialize` and the browser's user activation can
   * expire mid-download — on stricter engines the first press is simply
   * silent. The family preview buttons sit in the header and the chord Play
   * button sits outside the views, so neither is covered by the wrappers that
   * warm the pan and the chord list.
   */
  describe('prefetches audio from every sound-producing control', () => {
    it('warms on the scale note buttons', async () => {
      const user = userEvent.setup();
      render(<HandpanWidget />);
      vi.mocked(warmAudioModule).mockClear();

      await user.click(screen.getByRole('button', { name: /^play D3$/i }));

      expect(warmAudioModule).toHaveBeenCalled();
    });

    /**
     * Browsing the theory views must stay free. Warming the whole region meant
     * opening a tab, or reading the About panel, pulled the entire audio module
     * for a reader who never intended to make a sound.
     */
    it('does not warm when browsing the tabs or the theory views', async () => {
      const user = userEvent.setup();
      render(<HandpanWidget />);
      vi.mocked(warmAudioModule).mockClear();

      await user.click(screen.getByRole('tab', { name: /chords/i }));
      await user.click(screen.getByRole('tab', { name: /about/i }));
      await user.click(
        screen.getByRole('button', { name: /about this layout/i })
      );
      await user.click(screen.getByRole('tab', { name: /chords/i }));
      await user.click(screen.getByRole('button', { name: /^Dm tonic/ }));

      expect(warmAudioModule).not.toHaveBeenCalled();
    });

    it('warms on the family preview buttons', async () => {
      const user = userEvent.setup();
      render(<HandpanWidget />);

      await user.click(screen.getByRole('button', { name: /^change$/i }));
      vi.mocked(warmAudioModule).mockClear();

      await user.hover(screen.getByRole('button', { name: /^preview kurd$/i }));
      await user.click(screen.getByRole('button', { name: /^preview kurd$/i }));

      expect(warmAudioModule).toHaveBeenCalled();
    });

    it('warms on the chord action bar Play button', async () => {
      const user = userEvent.setup();
      render(<HandpanWidget />);

      // Pick a chord so the bar's Play is enabled, then reset the counter so
      // only the bar's own warming can satisfy the assertion.
      await user.click(screen.getByRole('tab', { name: /chords/i }));
      await user.click(screen.getByRole('button', { name: /^Dm tonic/ }));
      vi.mocked(warmAudioModule).mockClear();

      await user.click(screen.getByRole('button', { name: /^play$/i }));

      expect(warmAudioModule).toHaveBeenCalled();
    });

    /** And the cold pickers beside them stay cold. */
    it('does not warm on the pickers that make no sound', async () => {
      const user = userEvent.setup();
      render(<HandpanWidget />);

      await user.click(screen.getByRole('button', { name: /^change$/i }));
      vi.mocked(warmAudioModule).mockClear();

      await user.click(screen.getByRole('button', { name: /^E$/ }));
      await user.click(screen.getByRole('radio', { name: /numbers/i }));

      expect(warmAudioModule).not.toHaveBeenCalled();
    });
  });

  /**
   * The other direction: a live request that fails *must* still tidy up.
   *
   * Scheduling throws only after `isPlaying` has gone true, so without the
   * cleanup the control stays on Stop forever over silence. Guarding that
   * cleanup by generation had to keep this working — with nothing asserting it,
   * a guard that simply never cleared would have passed the suite.
   */
  it('unlights its own control when scheduling throws', async () => {
    const user = userEvent.setup();
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.mocked(audio.playArpeggio).mockImplementationOnce(() => {
      throw new Error('scheduling failed');
    });

    render(<HandpanWidget />);
    await user.click(screen.getByRole('button', { name: /^play scale$/i }));

    await waitFor(() =>
      expect(screen.queryAllByRole('button', { name: /^stop$/i })).toHaveLength(
        0
      )
    );
    expect(screen.getByRole('button', { name: /^play scale$/i })).toBeDefined();
    errors.mockRestore();
  });

  /**
   * A stale request that fails must not tidy up after the live one.
   *
   * The generation check guards the success path, but a rejection jumps
   * straight to `catch`, and the cleanup there was unconditional — so an older
   * attempt failing after a newer one had started playing cleared the newer
   * one's highlights and flipped its control back to Play, while its audio went
   * on sounding.
   */
  it('leaves live playback alone when an older attempt fails', async () => {
    const user = userEvent.setup();

    let failFirst: ((error: Error) => void) | undefined;
    let releaseSecond: (() => void) | undefined;
    vi.mocked(audio.isInitialized)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false);
    vi.mocked(audio.initialize)
      .mockImplementationOnce(
        () =>
          new Promise<void>((_resolve, reject) => {
            failFirst = reject;
          })
      )
      .mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            releaseSecond = resolve;
          })
      );
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<HandpanWidget />);
    await user.click(screen.getByRole('tab', { name: /chords/i }));

    await user.click(screen.getByRole('button', { name: /^Dm tonic/ }));
    await user.click(screen.getByRole('button', { name: /^play$/i }));

    await user.click(screen.getByRole('button', { name: /^F relative major/ }));
    await user.click(screen.getByRole('button', { name: /^play$/i }));

    await waitFor(() => expect(releaseSecond).toBeDefined());

    // Playing is shown by the controls swapping to Stop — both the scale action
    // and the chord bar do it, so count them rather than picking one.
    const stopControls = () =>
      screen.queryAllByRole('button', { name: /^stop$/i }).length;

    await act(async () => {
      releaseSecond?.();
      await Promise.resolve();
    });
    const playingControls = stopControls();
    expect(playingControls).toBeGreaterThan(0);

    // The abandoned one now fails; the live playback must be untouched.
    await act(async () => {
      failFirst?.(new Error('Starting the audio context timed out'));
      await Promise.resolve();
    });

    expect(stopControls()).toBe(playingControls);
    errors.mockRestore();
  });

  /**
   * The same rule for chords: the selected one is the one that sounds.
   *
   * Play a chord while the audio context is still starting, pick another and
   * play that, and the first attempt could settle last — stopping the second
   * chord and sounding itself while the panel still highlights the second.
   * `playScale` and the family preview each grew their own staleness check;
   * chord playback had none.
   */
  it('plays the chord that is selected when two starts overlap', async () => {
    const user = userEvent.setup();

    // `*Once` throughout, so the stubs restore themselves however this ends.
    // A failure part-way used to leave the shared mocks overridden and take
    // every later test in the file down with it.
    let releaseFirst: (() => void) | undefined;
    let releaseSecond: (() => void) | undefined;
    vi.mocked(audio.isInitialized)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false);
    vi.mocked(audio.initialize)
      .mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            releaseFirst = resolve;
          })
      )
      .mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            releaseSecond = resolve;
          })
      );

    render(<HandpanWidget />);
    await user.click(screen.getByRole('tab', { name: /chords/i }));

    await user.click(screen.getByRole('button', { name: /^Dm tonic/ }));
    await user.click(screen.getByRole('button', { name: /^play$/i }));

    await user.click(screen.getByRole('button', { name: /^F relative major/ }));
    await user.click(screen.getByRole('button', { name: /^play$/i }));

    // Waited for rather than assumed: under load a click can still be settling.
    await waitFor(() => expect(releaseSecond).toBeDefined());
    vi.mocked(audio.playArpeggio).mockClear();

    // The second request wins the race; the first settles afterwards.
    await act(async () => {
      releaseSecond?.();
      await Promise.resolve();
    });
    await act(async () => {
      releaseFirst?.();
      await Promise.resolve();
    });

    expect(audio.playArpeggio).toHaveBeenCalledTimes(1);
  });

  /**
   * Two previews in a row: only the one the visitor is waiting on may sound.
   *
   * Each gesture now gets its own initialisation attempt, so an earlier one can
   * settle *after* a later one. The second preview starts, and the first then
   * resolves, stops it and plays itself — while the lit button still names the
   * second. `handlePreviewFamily` read the preview generation without ever
   * incrementing it, so both requests believed they were current.
   */
  it('lets the later of two pending previews win', async () => {
    const user = userEvent.setup();

    // `*Once` throughout, so the stubs restore themselves however this ends.
    let releaseFirst: (() => void) | undefined;
    let releaseSecond: (() => void) | undefined;
    vi.mocked(audio.isInitialized)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(false);
    vi.mocked(audio.initialize)
      .mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            releaseFirst = resolve;
          })
      )
      .mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            releaseSecond = resolve;
          })
      );

    render(<HandpanWidget />);
    await user.click(screen.getByRole('button', { name: /^change$/i }));
    vi.mocked(audio.playArpeggio).mockClear();

    await user.click(screen.getByRole('button', { name: /^preview kurd$/i }));
    await user.click(
      screen.getByRole('button', { name: /^preview celtic minor$/i })
    );
    await waitFor(() => expect(releaseSecond).toBeDefined());
    expect(audio.playArpeggio).not.toHaveBeenCalled();

    // The second click's attempt wins the race; the first settles afterwards.
    await act(async () => {
      releaseSecond?.();
      await Promise.resolve();
    });
    await act(async () => {
      releaseFirst?.();
      await Promise.resolve();
    });

    // Exactly one preview sounds, and it is the one the visitor last asked
    // for — a fix that silenced the later preview instead would also leave a
    // single call, so the notes are checked rather than just the count.
    expect(audio.playArpeggio).toHaveBeenCalledTimes(1);

    const celtic = getFamilyPreviewOptions().find(
      (option) => option.name.toLowerCase() === 'celtic minor'
    );
    const expected = sortNotesByPitch([
      ...(resolveHandpanConfig({
        familyId: celtic!.id,
        key: celtic!.preview.key,
        noteCount: celtic!.preview.noteCount,
      })?.notes ?? []),
    ]);

    expect(expected.length).toBeGreaterThan(0);
    expect(vi.mocked(audio.playArpeggio).mock.calls[0][0].notes).toEqual(
      expected
    );
  });

  /**
   * A preview that loses the race must not play.
   *
   * `playScale` awaits the audio module. On a cold load that await outlives the
   * user's next choice, and the change handlers cannot stop an arpeggio that
   * has not been scheduled yet — so the resolved call would sound the previous
   * family over the newly chosen instrument.
   */
  it('abandons a pending family preview when the selection changes', async () => {
    const user = userEvent.setup();

    // Hold the audio module unresolved so the preview is still in flight.
    let releaseAudio: () => void = () => {};
    vi.mocked(audio.initialize).mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          releaseAudio = () => resolve();
        })
    );
    vi.mocked(audio.isInitialized).mockReturnValueOnce(false);

    render(<HandpanWidget />);
    await user.click(screen.getByRole('button', { name: /^change$/i }));
    vi.mocked(audio.playArpeggio).mockClear();

    await user.click(
      screen.getByRole('button', { name: /^preview celtic minor$/i })
    );
    expect(audio.playArpeggio).not.toHaveBeenCalled();

    // The user moves on while the module is still loading.
    await user.click(screen.getByRole('button', { name: /^E$/ }));

    await act(async () => {
      releaseAudio();
      await Promise.resolve();
    });

    expect(audio.playArpeggio).not.toHaveBeenCalled();
  });

  /**
   * The action bar must never print an internal identifier.
   *
   * A diatonic triad's `name` is synthetic — "D-triad-1" — so Tonal returned
   * no type and no intervals, and the detail line fell through to that raw id,
   * rendering it under the chord's own name.
   */
  it('shows a real chord type in the action bar, never the internal id', async () => {
    const user = userEvent.setup();
    render(<HandpanWidget />);

    await user.click(screen.getByRole('tab', { name: /chords/i }));
    await user.click(screen.getByRole('button', { name: /^Dm tonic/ }));

    expect(screen.queryByText(/-triad-\d/)).toBeNull();
    expect(screen.getByText('minor')).toBeDefined();
  });

  /**
   * A preview that never starts must not leave its button lit.
   *
   * On the failure path `isPlaying` never goes true, so it never transitions
   * back to false either, and the effect that normally unlights the button has
   * nothing to react to.
   */
  it('unlights the preview button when audio fails to start', async () => {
    const user = userEvent.setup();
    vi.mocked(audio.isInitialized).mockReturnValueOnce(false);
    vi.mocked(audio.initialize).mockRejectedValueOnce(
      new Error('Starting the audio context timed out')
    );
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<HandpanWidget />);
    await user.click(screen.getByRole('button', { name: /^change$/i }));

    const preview = screen.getByRole('button', { name: /^preview kurd$/i });
    await user.click(preview);

    await waitFor(() =>
      expect(preview.getAttribute('data-playing')).toBeNull()
    );
    errorSpy.mockRestore();
  });

  /** Finding 3: the layout caveat is reachable without a pointer. */
  it('exposes the layout caveat as a button, and to assistive tech at all times', async () => {
    const user = userEvent.setup();
    render(<HandpanWidget />);

    await user.click(screen.getByRole('tab', { name: /about/i }));

    const toggle = screen.getByRole('button', { name: /about this layout/i });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');

    // Described at all times, so it is announced without being activated.
    const describedBy = toggle.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)?.textContent).toMatch(
      /positions vary/i
    );

    await user.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });
});
