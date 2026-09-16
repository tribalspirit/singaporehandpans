// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HandpanWidget from './HandpanWidget';

/**
 * The layout caveat must be present in the view that shows the pan.
 *
 * It previously lived in the About tab, which meant it was not merely hidden
 * but absent from the page until someone opened that tab — the default view
 * presented a plausible-looking instrument with nothing to say its note
 * positions are computed rather than a maker's. The catalogue deliberately
 * ships schematic layouts, so the caveat has to travel with the diagram.
 */

afterEach(cleanup);

describe('layout caveat', () => {
  it('is present without opening any tab', () => {
    render(<HandpanWidget />);

    expect(
      screen.getByRole('button', { name: /about this layout/i })
    ).toBeDefined();
  });

  it('states that positions are representative, not a maker layout', () => {
    render(<HandpanWidget />);

    const note = screen.getByText(/representative/i);
    expect(note.textContent).toMatch(/vary depending on the maker/i);
  });

  /**
   * Collapsed hides it visually only. `display: none` would drop it from the
   * accessibility tree and the button's aria-describedby would resolve to
   * nothing, losing the announcement a screen reader gets for free.
   */
  it('keeps the caveat in the accessibility tree while collapsed', () => {
    render(<HandpanWidget />);

    const toggle = screen.getByRole('button', { name: /about this layout/i });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');

    const describedBy = toggle.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)?.textContent).toMatch(
      /representative/i
    );
  });

  it('expands and collapses on activation', async () => {
    const user = userEvent.setup();
    render(<HandpanWidget />);

    const toggle = screen.getByRole('button', { name: /about this layout/i });

    await user.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');

    await user.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });
});
