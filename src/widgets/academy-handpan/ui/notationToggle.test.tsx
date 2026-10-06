// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HandpanWidget from './HandpanWidget';

/**
 * The labelling control is a segmented pair of radios, not a dropdown.
 *
 * Two mutually exclusive options do not need open-then-pick: both stay visible
 * and switching is one click. Native radios are used so arrow-key navigation
 * and grouping semantics come from the platform rather than being rebuilt on
 * divs — these tests hold that, since a styled custom toggle would silently
 * lose them.
 *
 * The control now lives inside the scale sheet rather than in the header: it
 * describes how the instrument is drawn, which is a setting, not one of the
 * three decisions a first-time visitor should meet before any sound. Opening
 * the sheet is therefore part of reaching it.
 */

afterEach(cleanup);

async function openScaleSheet(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /^change$/i }));
}

function notationGroup() {
  return screen.getByRole('radiogroup', { name: /pad labels/i });
}

describe('notation toggle', () => {
  it('offers both options as visible radios rather than a dropdown', async () => {
    const user = userEvent.setup();
    render(<HandpanWidget />);
    await openScaleSheet(user);

    const group = notationGroup();
    expect(within(group).getByRole('radio', { name: /notes/i })).toBeDefined();
    expect(
      within(group).getByRole('radio', { name: /numbers/i })
    ).toBeDefined();

    // No select for labelling any more.
    expect(screen.queryByLabelText(/select note labelling/i)).toBeNull();
  });

  it('starts on note names', async () => {
    const user = userEvent.setup();
    render(<HandpanWidget />);
    await openScaleSheet(user);

    const notes = within(notationGroup()).getByRole('radio', {
      name: /notes/i,
    }) as HTMLInputElement;

    expect(notes.checked).toBe(true);
  });

  it('switches pad labels to numbers and back', async () => {
    const user = userEvent.setup();
    render(<HandpanWidget />);
    await openScaleSheet(user);

    const ding = screen.getByRole('button', { name: /Pad 1, D3/ });
    expect(within(ding).getByText('D3')).toBeDefined();

    await user.click(
      within(notationGroup()).getByRole('radio', { name: /numbers/i })
    );
    expect(
      within(screen.getByRole('button', { name: /Pad 1, D3/ })).getByText('1')
    ).toBeDefined();

    await user.click(
      within(notationGroup()).getByRole('radio', { name: /notes/i })
    );
    expect(
      within(screen.getByRole('button', { name: /Pad 1, D3/ })).getByText('D3')
    ).toBeDefined();
  });

  /**
   * Arrow-key movement between radios is the browser's job, and jsdom does not
   * implement it — asserting it here would prove nothing. What is asserted is
   * the structure that earns it: real focusable radio inputs sharing one group
   * name. A div-based toggle would pass neither.
   *
   * The behaviour itself is verified in a browser.
   */
  it('is built from focusable radios in a single group', async () => {
    const user = userEvent.setup();
    render(<HandpanWidget />);
    await openScaleSheet(user);

    const radios = within(notationGroup()).getAllByRole(
      'radio'
    ) as HTMLInputElement[];

    expect(radios).toHaveLength(2);
    expect(new Set(radios.map((radio) => radio.name)).size).toBe(1);

    for (const radio of radios) {
      expect(radio.tagName).toBe('INPUT');
      expect(radio.disabled).toBe(false);
      radio.focus();
      expect(document.activeElement).toBe(radio);
    }
  });

  /** The accessible name must stay complete whichever label is displayed. */
  it('keeps pad accessible names intact in numeric mode', async () => {
    const user = userEvent.setup();
    render(<HandpanWidget />);
    await openScaleSheet(user);

    await user.click(
      within(notationGroup()).getByRole('radio', { name: /numbers/i })
    );

    expect(
      screen.getByRole('button', { name: /Pad 1, D3, top shell, ding/ })
    ).toBeDefined();
  });
});
