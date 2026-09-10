// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HandpanRenderer from './HandpanRenderer';
import {
  buildHandpanConfigFromFamily,
  getHandpanFamilyById,
} from '../config/handpanFamilies';

/**
 * DOM-level coverage for the instrument diagram.
 *
 * The widget previously had no component tests at all, so its accessibility
 * contract — that a pad's accessible name carries pitch, sequence number, shell
 * and role no matter which notation is displayed — was only ever verified by
 * hand. These tests make that contract executable.
 *
 * The environment is set per-file so the existing node-environment suites are
 * untouched.
 */

function dKurd9() {
  const family = getHandpanFamilyById('kurd');
  if (!family) throw new Error('kurd family missing');
  return buildHandpanConfigFromFamily(family, 'D', 9);
}

afterEach(cleanup);

describe('HandpanRenderer', () => {
  it('renders one button per pad', () => {
    const config = dKurd9();
    render(<HandpanRenderer config={config} />);

    expect(screen.getAllByRole('button')).toHaveLength(config.layout.length);
  });

  it('shows pitch names in note notation', () => {
    render(<HandpanRenderer config={dKurd9()} notation="note" />);

    const ding = screen.getByRole('button', { name: /Pad 1, D3/ });
    expect(within(ding).getByText('D3')).toBeDefined();
  });

  it('shows sequence numbers in numeric notation', () => {
    render(<HandpanRenderer config={dKurd9()} notation="number" />);

    const ding = screen.getByRole('button', { name: /Pad 1, D3/ });
    expect(within(ding).getByText('1')).toBeDefined();
    expect(within(ding).queryByText('D3')).toBeNull();
  });

  /** The core accessibility guarantee: notation is visual only. */
  it('keeps identical accessible names across both notations', () => {
    const config = dKurd9();

    const { unmount } = render(
      <HandpanRenderer config={config} notation="note" />
    );
    const noteNames = screen
      .getAllByRole('button')
      .map((button) => button.getAttribute('aria-label'));
    unmount();

    render(<HandpanRenderer config={config} notation="number" />);
    const numberNames = screen
      .getAllByRole('button')
      .map((button) => button.getAttribute('aria-label'));

    expect(numberNames).toEqual(noteNames);
  });

  it('names each pad with pitch, number, shell and role', () => {
    render(<HandpanRenderer config={dKurd9()} />);

    const ding = screen.getByRole('button', { name: /ding/ });
    const label = ding.getAttribute('aria-label') ?? '';

    expect(label).toContain('Pad 1');
    expect(label).toContain('D3');
    expect(label).toContain('top shell');
    expect(label).toContain('ding');
  });

  it('discloses that the layout is schematic, not a maker layout', () => {
    render(<HandpanRenderer config={dKurd9()} />);

    const note = screen.getByText(/Schematic layout/i);
    expect(note.textContent).toMatch(/not a verified maker layout/i);
  });

  it('links the diagram to its schematic disclosure for assistive tech', () => {
    const { container } = render(<HandpanRenderer config={dKurd9()} />);

    const described = container.querySelector('[aria-describedby]');
    const targetId = described?.getAttribute('aria-describedby');

    expect(targetId).toBeTruthy();
    expect(container.querySelector(`#${targetId}`)).not.toBeNull();
  });

  it('reports the clicked pad to its caller', async () => {
    const user = userEvent.setup();
    const onPadClick = vi.fn();
    render(<HandpanRenderer config={dKurd9()} onPadClick={onPadClick} />);

    await user.click(screen.getByRole('button', { name: /Pad 1, D3/ }));

    expect(onPadClick).toHaveBeenCalledTimes(1);
    expect(onPadClick.mock.calls[0][0].note).toBe('D3');
  });

  it('is reachable by keyboard alone', async () => {
    const user = userEvent.setup();
    const onPadClick = vi.fn();
    render(<HandpanRenderer config={dKurd9()} onPadClick={onPadClick} />);

    await user.tab();
    expect(document.activeElement).toBe(screen.getAllByRole('button')[0]);

    await user.keyboard('{Enter}');
    expect(onPadClick).toHaveBeenCalledTimes(1);
  });
});
