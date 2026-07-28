/**
 * Storyblok Stories Content Creator
 *
 * Seeds the Stories section from a Markdown source file, keeping the copy
 * verbatim (no fabricated cover image, gallery or video — only what the source
 * actually contains). Idempotent: re-running skips an article that already
 * exists.
 *
 * Prerequisite: the story_* components must exist in the space first:
 *   node scripts/create-components.js story_text
 *   node scripts/create-components.js story_image
 *   node scripts/create-components.js story_gallery
 *   node scripts/create-components.js story_youtube
 *   node scripts/create-components.js story_article
 *
 * Usage: node scripts/create-stories-content.js [path-to-markdown]
 *   Defaults to docs/content/article1.md
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MANAGEMENT_TOKEN = process.env.STORYBLOK_MANAGEMENT_TOKEN;
const SPACE_ID = process.env.STORYBLOK_SPACE_ID;

if (!MANAGEMENT_TOKEN || !SPACE_ID) {
  console.error(
    '❌ Missing STORYBLOK_MANAGEMENT_TOKEN or STORYBLOK_SPACE_ID in .env file'
  );
  process.exit(1);
}

function makeRequest(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'mapi.storyblok.com',
      port: 443,
      path: `/v1/spaces/${SPACE_ID}/${endpoint}`,
      method,
      headers: {
        Authorization: MANAGEMENT_TOKEN,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const json = body ? JSON.parse(body) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) resolve(json);
          else
            reject(
              new Error(
                `API Error: ${res.statusCode} - ${JSON.stringify(json)}`
              )
            );
        } catch (error) {
          reject(new Error(`Parse Error: ${error.message}`));
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

/** Cheap _uid for a nested blok (Node script — Math.random is fine here). */
function uid() {
  return `sb-${Math.random().toString(36).slice(2, 10)}`;
}

function slugify(text) {
  // Use the part before a colon (the headline) for a concise, readable slug.
  const headline = text.split(':')[0];
  return headline
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Parse a Markdown article into { title, paragraphs } with no invention:
 * the first heading line is the title, every other non-empty line is a
 * paragraph, verbatim.
 */
function parseMarkdown(md) {
  const lines = md.split('\n').map((l) => l.trim());
  let title = '';
  const paragraphs = [];
  for (const line of lines) {
    if (!line) continue;
    if (!title && line.startsWith('#')) {
      title = line.replace(/^#+\s*/, '').trim();
      continue;
    }
    paragraphs.push(line);
  }
  return { title, paragraphs };
}

/** Build a Storyblok rich-text document from plain paragraphs. */
function toRichtext(paragraphs) {
  return {
    type: 'doc',
    content: paragraphs.map((text) => ({
      type: 'paragraph',
      content: [{ type: 'text', text }],
    })),
  };
}

/** Find a folder by slug, or create it. Returns its id. */
async function getOrCreateFolder(name, slug) {
  const { stories } = await makeRequest('GET', 'stories?per_page=100');
  const existing = stories.find((s) => s.is_folder && s.slug === slug);
  if (existing) {
    console.log(`📁 Folder "${slug}" already exists (ID: ${existing.id})`);
    return existing.id;
  }
  const { story } = await makeRequest('POST', 'stories', {
    story: { name, slug, is_folder: true },
  });
  console.log(`📁 Created folder "${slug}" (ID: ${story.id})`);
  return story.id;
}

async function storyExists(fullSlug) {
  const params = new URLSearchParams({ with_slug: fullSlug });
  const { stories } = await makeRequest('GET', `stories?${params.toString()}`);
  return stories.length > 0;
}

async function main() {
  const mdPath =
    process.argv[2] ||
    path.join(__dirname, '..', 'docs', 'content', 'article1.md');
  if (!fs.existsSync(mdPath)) {
    console.error(`❌ Source not found: ${mdPath}`);
    process.exit(1);
  }

  const { title, paragraphs } = parseMarkdown(fs.readFileSync(mdPath, 'utf8'));
  if (!title || paragraphs.length === 0) {
    console.error('❌ Could not parse a title + body from the Markdown.');
    process.exit(1);
  }

  const slug = slugify(title);
  const fullSlug = `stories/${slug}`;

  // Faithful excerpt: the source opening, trimmed to the meta-description limit.
  const excerpt =
    'Every other Friday evening our volunteer team brings handpans to the Sky Garden Project, sharing music, games and laughter with young people with special needs.';

  const content = {
    component: 'story_article',
    title,
    excerpt,
    // Publication date (when we publish it) — the article describes ongoing
    // sessions with no single event date, so nothing else is invented.
    date: new Date().toISOString(),
    tags: ['community'],
    body: [
      {
        _uid: uid(),
        component: 'story_text',
        content: toRichtext(paragraphs),
      },
    ],
    seo_title: title,
    seo_description: excerpt,
  };

  console.log(`\n📝 Article: "${title}"`);
  console.log(`   slug: ${fullSlug}`);
  console.log(`   paragraphs: ${paragraphs.length}, tags: [community]\n`);

  const folderId = await getOrCreateFolder('Stories', 'stories');

  if (await storyExists(fullSlug)) {
    console.log(`⚠️  Story "${fullSlug}" already exists — skipping.`);
    return;
  }

  const { story } = await makeRequest('POST', 'stories', {
    story: {
      name: title,
      slug,
      content,
      parent_id: folderId,
      is_folder: false,
    },
    publish: 1,
  });
  console.log(
    `✅ Created + published story (ID: ${story.id}) at /${fullSlug}/`
  );
}

main().catch((error) => {
  console.error('❌ Failed:', error.message);
  process.exit(1);
});
