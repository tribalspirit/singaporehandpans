import { describe, it, expect } from 'vitest';
import { isStudioLocation } from './eventLocation';

describe('isStudioLocation', () => {
  it('recognises the full CMS value, studio name and address together', () => {
    expect(
      isStudioLocation(
        "Singapore Handpan Studio 195 Pearl's Hill Terrace 03-07"
      )
    ).toBe(true);
  });

  it('recognises the studio name on its own', () => {
    expect(isStudioLocation('Singapore Handpan Studio')).toBe(true);
  });

  it('recognises the address on its own', () => {
    expect(isStudioLocation("195 Pearl's Hill Ter, #03-07")).toBe(true);
    expect(isStudioLocation('195 Pearls Hill Terrace 03-07')).toBe(true);
  });

  it('is case and whitespace insensitive', () => {
    expect(isStudioLocation('  singapore   handpan studio  ')).toBe(true);
  });

  it('rejects the genuine off-site venues', () => {
    expect(isStudioLocation('Capybara Bathing Singapore')).toBe(false);
    expect(isStudioLocation('Radin Mas Community Club')).toBe(false);
    expect(isStudioLocation('Our Tampines Hub')).toBe(false);
  });

  it('treats a missing location as the default, so no empty row renders', () => {
    expect(isStudioLocation(undefined)).toBe(true);
    expect(isStudioLocation('')).toBe(true);
    expect(isStudioLocation('   ')).toBe(true);
  });
});
