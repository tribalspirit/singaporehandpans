// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HandpanWidget from './HandpanWidget';

/**
 * The props a host page sets, proved to reach the rendered widget.
 *
 * `widgetProps.test.ts` covers what a value resolves to; this covers that the
 * resolved value is actually the state the widget opens in. The two used to be
 * the same thing only because there were no props at all.
 */
vi.mock('../audio/createAudioEngine', () => ({
  createAudioEngine: () => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    isInitialized: vi.fn().mockReturnValue(true),
    playNote: vi.fn(),
    playChord: vi.fn(),
    playArpeggio: vi.fn(),
    stopArpeggio: vi.fn(),
    dispose: vi.fn(),
  }),
}));
vi.mock('../audio/engine', () => ({
  warmAudioModule: vi.fn().mockResolvedValue(undefined),
}));

afterEach(cleanup);

describe('HandpanWidget props', () => {
  it('opens on the default instrument when given no props', () => {
    render(<HandpanWidget />);

    expect(screen.getByText('D Kurd · 9 notes')).toBeDefined();
  });

  it('opens on the instrument the host page asked for', () => {
    render(<HandpanWidget familyId="pygmy" scaleKey="f" noteCount={9} />);

    expect(screen.getByText('F Pygmy · 9 notes')).toBeDefined();
  });

  it('opens on the view the host page asked for', () => {
    render(<HandpanWidget view="chords" />);

    expect(
      screen.getByRole('tab', { name: /chords/i }).getAttribute('aria-selected')
    ).toBe('true');
  });

  /**
   * Read off the pad itself rather than the picker, which is behind "Change".
   * The accessible name carries pitch in both modes — that is the point of it —
   * so the mode is visible only in the label the pad draws.
   */
  it('opens with the pad labels the host page asked for', () => {
    const { unmount } = render(<HandpanWidget />);
    expect(screen.getByRole('button', { name: /ding/i }).textContent).toBe(
      'D3'
    );
    unmount();

    render(<HandpanWidget notation="number" />);
    const ding = screen.getByRole('button', { name: /ding/i });
    expect(ding.textContent).toBe('1');
    expect(ding.getAttribute('aria-label')).toContain('D3');
  });

  /**
   * The summary line must describe the pan that is drawn.
   *
   * Ionian published 9, 10 and 13; Sabye — what it became — offers 9 only, so a
   * request for 13 is migrated down. The widget drew nine pads under a line
   * reading "13 notes" until the resolved selection reported the shell the
   * instrument actually has.
   */
  it('describes the instrument it drew, not the one that was asked for', () => {
    render(<HandpanWidget familyId="ionian" scaleKey="D" noteCount={13} />);

    const pads = screen.getAllByRole('button', { name: /^Pad \d+,/ });
    expect(screen.getByText(`D Sabye · ${pads.length} notes`)).toBeDefined();
    expect(pads).toHaveLength(9);
  });

  /**
   * A merged-away id must leave the picker agreeing with the pan.
   *
   * The picker lists canonical families only and marks one selected on an exact
   * id match, so opening "Change" after `familyId="equinox"` showed no family
   * selected at all while the widget was rendering Integral.
   */
  it('marks the family selected after opening on a merged-away id', async () => {
    const user = userEvent.setup();
    render(<HandpanWidget familyId="equinox" />);

    expect(screen.getByText('G Integral · 9 notes')).toBeDefined();

    await user.click(screen.getByRole('button', { name: /^change$/i }));
    const selected = screen
      .getAllByRole('button', { pressed: true })
      .map((el) => el.textContent);

    expect(selected.some((text) => text?.startsWith('Integral'))).toBe(true);
  });

  /** A bad attribute must still render an instrument, not an empty widget. */
  it('falls back to the default rather than rendering nothing', () => {
    render(<HandpanWidget familyId="lydian" scaleKey="Z" noteCount={-1} />);

    expect(screen.getByText('D Kurd · 9 notes')).toBeDefined();
  });
});
