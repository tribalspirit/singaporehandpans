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
import { stopArpeggio } from '../audio/scheduler';
import {
  initializeAudio,
  isAudioInitialized,
  warmAudioModule,
} from '../audio/engine';
import { playArpeggio } from '../audio/scheduler';

/*
 * Audio is an external system, stubbed at its module boundary.
 *
 * These are tests about what the interface offers, not about sound. Tabbing
 * into the views prefetches Tone, and real Tone in jsdom has no usable
 * `Transport` — exercising it here would test the mock's fidelity rather than
 * the widget. Playback itself is covered by the audio suites.
 */
vi.mock('../audio/engine', () => ({
  initializeAudio: vi.fn().mockResolvedValue(undefined),
  isAudioInitialized: vi.fn().mockReturnValue(true),
  warmAudioModule: vi.fn().mockResolvedValue(undefined),
  playNote: vi.fn(),
  playChord: vi.fn(),
}));
vi.mock('../audio/scheduler', () => ({
  playArpeggio: vi.fn(),
  stopArpeggio: vi.fn(),
  isArpeggioPlaying: vi.fn().mockReturnValue(false),
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
    vi.mocked(stopArpeggio).mockClear();

    // Kurd opens on D; E is another key it publishes.
    await user.click(screen.getByRole('button', { name: /^E$/ }));

    expect(stopArpeggio).toHaveBeenCalled();
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
    vi.mocked(stopArpeggio).mockClear();

    await user.click(screen.getByRole('button', { name: /^Kurd/ }));

    expect(stopArpeggio).toHaveBeenCalled();
  });

  /**
   * Every control that makes a sound must prefetch Tone before the click that
   * needs it.
   *
   * Tone is ~340 KB and out of the initial bundle, so a cold control starts
   * the import inside `initializeAudio` and the browser's user activation can
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
    vi.mocked(initializeAudio).mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          releaseAudio = () => resolve();
        })
    );
    vi.mocked(isAudioInitialized).mockReturnValueOnce(false);

    render(<HandpanWidget />);
    await user.click(screen.getByRole('button', { name: /^change$/i }));
    vi.mocked(playArpeggio).mockClear();

    await user.click(
      screen.getByRole('button', { name: /^preview celtic minor$/i })
    );
    expect(playArpeggio).not.toHaveBeenCalled();

    // The user moves on while the module is still loading.
    await user.click(screen.getByRole('button', { name: /^E$/ }));

    await act(async () => {
      releaseAudio();
      await Promise.resolve();
    });

    expect(playArpeggio).not.toHaveBeenCalled();
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
    vi.mocked(isAudioInitialized).mockReturnValueOnce(false);
    vi.mocked(initializeAudio).mockRejectedValueOnce(
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
