import { describe, expect, test } from 'vitest';
import { isSafeHref, renderRichText } from './richtext';

/** Minimal helpers to build Storyblok rich-text nodes. */
function doc(...content: unknown[]) {
  return { type: 'doc', content };
}
function paragraph(...content: unknown[]) {
  return { type: 'paragraph', content };
}
function text(value: string, marks?: unknown[]) {
  return marks
    ? { type: 'text', text: value, marks }
    : { type: 'text', text: value };
}
function link(attrs: Record<string, unknown>) {
  return { type: 'link', attrs };
}

describe('renderRichText', () => {
  test('returns empty string for empty, missing or malformed input', () => {
    expect(renderRichText(undefined)).toBe('');
    expect(renderRichText(null)).toBe('');
    expect(renderRichText({})).toBe('');
    expect(renderRichText({ type: 'doc', content: [] })).toBe('');
    expect(renderRichText('not an object')).toBe('');
  });

  test('renders paragraphs and text', () => {
    const html = renderRichText(doc(paragraph(text('Hello world'))));
    expect(html).toContain('<p>');
    expect(html).toContain('Hello world');
  });

  test('renders bold and italic marks', () => {
    const html = renderRichText(
      doc(
        paragraph(
          text('bold', [{ type: 'bold' }]),
          text('italic', [{ type: 'italic' }])
        )
      )
    );
    expect(html).toMatch(/<(strong|b)>bold<\/(strong|b)>/);
    expect(html).toMatch(/<(em|i)>italic<\/(em|i)>/);
  });

  test('renders ordered and bullet lists', () => {
    const list = {
      type: 'bullet_list',
      content: [
        { type: 'list_item', content: [paragraph(text('one'))] },
        { type: 'list_item', content: [paragraph(text('two'))] },
      ],
    };
    const html = renderRichText(doc(list));
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>');
    expect(html).toContain('one');
  });

  test('renders headings', () => {
    const html = renderRichText(
      doc({ type: 'heading', attrs: { level: 2 }, content: [text('Title')] })
    );
    expect(html).toContain('<h2>');
    expect(html).toContain('Title');
  });

  test('external link gets rel="noopener noreferrer" and target _blank', () => {
    const html = renderRichText(
      doc(
        paragraph(
          text('site', [link({ href: 'https://example.com', linktype: 'url' })])
        )
      )
    );
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('target="_blank"');
  });

  test('javascript: href is stripped, text preserved', () => {
    const html = renderRichText(
      doc(
        paragraph(
          // eslint-disable-next-line no-script-url
          text('evil', [link({ href: 'javascript:alert(1)', linktype: 'url' })])
        )
      )
    );
    expect(html).not.toContain('javascript:');
    expect(html).not.toContain('<a ');
    expect(html).toContain('evil');
  });

  test('email link is rendered as mailto and treated as internal (no target)', () => {
    const html = renderRichText(
      doc(
        paragraph(
          text('mail', [link({ href: 'hi@studio.sg', linktype: 'email' })])
        )
      )
    );
    expect(html).toContain('href="mailto:hi@studio.sg"');
    expect(html).not.toContain('target="_blank"');
  });
});

describe('isSafeHref', () => {
  test('allows http, https, mailto and relative/anchor links', () => {
    expect(isSafeHref('https://example.com')).toBe(true);
    expect(isSafeHref('http://example.com')).toBe(true);
    expect(isSafeHref('mailto:a@b.com')).toBe(true);
    expect(isSafeHref('/about')).toBe(true);
    expect(isSafeHref('#section')).toBe(true);
  });

  test('rejects javascript:, data: and empty', () => {
    // eslint-disable-next-line no-script-url
    expect(isSafeHref('javascript:alert(1)')).toBe(false);
    expect(isSafeHref('data:text/html,<script>')).toBe(false);
    expect(isSafeHref('')).toBe(false);
    expect(isSafeHref('   ')).toBe(false);
  });
});
