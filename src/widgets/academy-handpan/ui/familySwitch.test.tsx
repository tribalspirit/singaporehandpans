// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
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
 */

afterEach(cleanup);

describe('switching scale family', () => {
  it('survives a switch to a family with different keys and shells', async () => {
    const user = userEvent.setup();
    const errors: unknown[] = [];
    const spy = vi.spyOn(console, 'error').mockImplementation((...args) => {
      errors.push(args[0]);
    });

    render(<HandpanWidget />);

    const familySelect = screen.getByLabelText(/select scale family/i);

    // Kurd defaults to D/9; Golden Gate offers only C/8.
    await user.selectOptions(familySelect, 'golden-gate');
    await user.selectOptions(familySelect, 'kurd');
    await user.selectOptions(familySelect, 'akebono');

    spy.mockRestore();

    const hookErrors = errors.filter((error) =>
      String(error).includes('Rendered fewer hooks')
    );
    expect(hookErrors).toEqual([]);

    // And the widget is still rendering something usable afterwards.
    expect(screen.getByLabelText(/select scale family/i)).toBeDefined();
  });
});
