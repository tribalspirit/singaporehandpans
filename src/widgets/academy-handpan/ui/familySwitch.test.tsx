// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HandpanWidget from './HandpanWidget';

/**
 * Switching families must not crash the widget.
 *
 * Families do not all offer the same keys and shells: Golden Gate is C at 8
 * notes only, Akebono and Sabye 9 only. On the render right after a family
 * change the previous key/count are still in state, so the new family cannot
 * resolve a config and the component takes its "no configuration" early return.
 *
 * Any hook declared below that return is skipped on exactly that render, and
 * React throws "Rendered fewer hooks than expected". The catalog additions in
 * this branch made the mismatch far easier to hit.
 *
 * The family control is a list of buttons inside the scale sheet rather than a
 * select in the header — three equally weighted selects above the instrument
 * were the first thing a visitor met, before anything had made a sound.
 */

afterEach(cleanup);

type User = ReturnType<typeof userEvent.setup>;

async function openScaleSheet(user: User) {
  await user.click(screen.getByRole('button', { name: /^change$/i }));
}

function familyButton(name: RegExp) {
  return screen.getByRole('button', { name });
}

async function chooseFamily(user: User, name: RegExp) {
  await user.click(familyButton(name));
}

describe('switching scale family', () => {
  it('survives a switch to a family with different keys and shells', async () => {
    const user = userEvent.setup();
    const errors: unknown[] = [];
    const spy = vi.spyOn(console, 'error').mockImplementation((...args) => {
      errors.push(args[0]);
    });

    render(<HandpanWidget />);
    await openScaleSheet(user);

    // Kurd defaults to D/9; Golden Gate offers only C/8.
    await chooseFamily(user, /^Golden Gate/);
    await chooseFamily(user, /^Kurd/);
    await chooseFamily(user, /^Akebono/);

    spy.mockRestore();

    const hookErrors = errors.filter((error) =>
      String(error).includes('Rendered fewer hooks')
    );
    expect(hookErrors).toEqual([]);

    // And the widget is still rendering something usable afterwards.
    expect(familyButton(/^Kurd/)).toBeDefined();
  });

  /**
   * A keyboard user must not lose their place.
   *
   * Setting the family alone left one render with the previous key and shell,
   * which resolves to nothing and takes the "no configuration" early return.
   * That unmounted the controls and dropped focus to the document body, forcing
   * the user to restart navigation. Family and selection are applied together
   * now, so the config never passes through an unresolvable state.
   */
  it('keeps focus on the selector across an incompatible switch', async () => {
    const user = userEvent.setup();
    render(<HandpanWidget />);
    await openScaleSheet(user);

    // Kurd defaults to D/9; Golden Gate offers only C/8.
    await chooseFamily(user, /^Golden Gate/);

    expect(document.activeElement).toBe(familyButton(/^Golden Gate/));
  });

  it('never leaves the widget without a resolvable configuration', async () => {
    const user = userEvent.setup();
    render(<HandpanWidget />);
    await openScaleSheet(user);

    for (const family of [
      /^Golden Gate/,
      /^Akebono/,
      /^Sabye/,
      /^Aegean/,
      /^Kurd/,
    ]) {
      await chooseFamily(user, family);
      // The fallback copy only renders when nothing resolves.
      expect(
        screen.queryByText(/No handpan configuration available/i)
      ).toBeNull();
    }
  });

  /**
   * Comparing one key across families is the main reason to switch at all, and
   * resetting to each family's default key made it impossible.
   */
  it('keeps the current key when the new family publishes it', async () => {
    const user = userEvent.setup();
    render(<HandpanWidget />);
    await openScaleSheet(user);

    // Kurd opens on D; Celtic Minor is also tuned to D.
    await chooseFamily(user, /^Celtic Minor/);

    expect(screen.getByText(/^D /)).toBeDefined();
    expect(screen.queryByRole('status')).toHaveProperty('textContent', '');
  });

  /**
   * A live region has to be exposed *before* its content changes.
   *
   * Hiding the empty notice with `display: none` took it out of the
   * accessibility tree, so the switch that both revealed and filled it in one
   * render announced nothing — silent for exactly the users it is written for.
   * It is clipped while empty instead, which keeps it exposed and still takes
   * no layout space.
   */
  it('keeps the status region in the accessibility tree while empty', () => {
    render(<HandpanWidget />);

    const status = screen.getByRole('status');
    expect(status.textContent).toBe('');
    expect(status.hasAttribute('hidden')).toBe(false);
    expect(status.getAttribute('aria-live')).toBe('polite');
  });

  /**
   * And when it genuinely cannot, the move is announced rather than applied in
   * silence — the user's key disappearing with no explanation was the defect.
   */
  it('says so when the new family cannot offer the current key', async () => {
    const user = userEvent.setup();
    render(<HandpanWidget />);
    await openScaleSheet(user);

    // Kurd opens on D; Golden Gate is C only.
    await chooseFamily(user, /^Golden Gate/);

    const status = screen.getByRole('status');
    expect(within(status).getByText(/not tuned to D/i)).toBeDefined();
    expect(within(status).getByText(/showing C instead/i)).toBeDefined();
  });
});
