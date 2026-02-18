/**
 * Gallery Migration Script
 *
 * Migrates legacy gallery_item stories into gallery_album + gallery_media
 * folder structure.
 *
 * Usage: npm run gallery:migrate
 *
 * Requires env vars: STORYBLOK_MANAGEMENT_TOKEN, STORYBLOK_SPACE_ID
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

const VIDEO_EXT_REGEX = /\.(mp4|webm|mov)(\?|$)/i;
const SLUG_REGEX = /[^a-z0-9]+/g;

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
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(jsonBody);
          } else {
            reject(
              new Error(
                `API Error: ${res.statusCode} - ${JSON.stringify(jsonBody)}`
              )
            );
          }
        } catch (error) {
          reject(new Error(`Parse Error: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => reject(error));
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

function toSlug(str) {
  return str.toLowerCase().replace(SLUG_REGEX, '-').replace(/^-|-$/g, '');
}

function isVideo(filename) {
  return VIDEO_EXT_REGEX.test(filename || '');
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchAllGalleryItems() {
  console.log('📥 Fetching all gallery_item stories...');
  let page = 1;
  let allStories = [];

  for (;;) {
    const result = await makeRequest(
      'GET',
      `stories?starts_with=gallery/&per_page=100&page=${page}`
    );
    const stories = result.stories || [];
    const galleryItems = stories.filter(
      (s) => s.content && s.content.component === 'gallery_item'
    );
    allStories = allStories.concat(galleryItems);
    if (stories.length < 100) break;
    page++;
  }

  console.log(`  Found ${allStories.length} gallery_item stories`);
  return allStories;
}

function groupByPrimaryTag(items) {
  const groups = {};

  items.forEach((item) => {
    let tags = item.content.tags;
    if (typeof tags === 'string') {
      tags = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
    }
    if (!Array.isArray(tags)) tags = [];

    const primaryTag = tags.length > 0 ? tags[0] : 'general';
    if (!groups[primaryTag]) {
      groups[primaryTag] = [];
    }
    groups[primaryTag].push(item);
  });

  return groups;
}

async function ensureFolder(parentId, name, slug) {
  console.log(`  📁 Ensuring folder: gallery/albums/${slug}`);

  try {
    const result = await makeRequest('POST', 'stories', {
      story: {
        name,
        slug,
        parent_id: parentId,
        is_folder: true,
      },
    });
    return result.story.id;
  } catch (error) {
    if (
      error.message.includes('already exists') ||
      error.message.includes('422')
    ) {
      // Folder already exists, find it
      const result = await makeRequest(
        'GET',
        `stories?starts_with=gallery/albums/${slug}&is_folder=true`
      );
      const folder = result.stories?.find((s) => s.slug === slug);
      if (folder) return folder.id;
    }
    throw error;
  }
}

async function getOrCreateAlbumsFolder() {
  console.log('📁 Ensuring gallery/albums folder exists...');

  // First find the gallery folder
  const galleryResult = await makeRequest(
    'GET',
    'stories?starts_with=gallery&is_folder=true&per_page=100'
  );
  let galleryFolder = galleryResult.stories?.find(
    (s) => s.slug === 'gallery' && s.is_folder
  );

  if (!galleryFolder) {
    console.log('  Creating gallery folder...');
    const result = await makeRequest('POST', 'stories', {
      story: {
        name: 'Gallery',
        slug: 'gallery',
        is_folder: true,
        parent_id: 0,
      },
    });
    galleryFolder = result.story;
  }

  // Now find or create albums subfolder
  const albumsResult = await makeRequest(
    'GET',
    'stories?starts_with=gallery/albums&is_folder=true&per_page=100'
  );
  let albumsFolder = albumsResult.stories?.find(
    (s) => s.slug === 'albums' && s.is_folder
  );

  if (!albumsFolder) {
    console.log('  Creating gallery/albums folder...');
    const result = await makeRequest('POST', 'stories', {
      story: {
        name: 'Albums',
        slug: 'albums',
        parent_id: galleryFolder.id,
        is_folder: true,
      },
    });
    albumsFolder = result.story;
  }

  return albumsFolder.id;
}

async function main() {
  console.log(
    '🔄 Gallery Migration: gallery_item → gallery_album + gallery_media\n'
  );

  // Step 1: Fetch and backup
  const items = await fetchAllGalleryItems();

  if (items.length === 0) {
    console.log('\n⚠️  No gallery_item stories found. Nothing to migrate.');
    return;
  }

  const backupPath = path.join(__dirname, '..', 'backup-gallery-items.json');
  fs.writeFileSync(backupPath, JSON.stringify(items, null, 2));
  console.log(`💾 Backup saved to ${backupPath}\n`);

  // Step 2: Group by primary tag
  const groups = groupByPrimaryTag(items);
  console.log(
    `📂 Grouped into ${Object.keys(groups).length} albums:`,
    Object.keys(groups).join(', ')
  );
  console.log('');

  // Step 3: Ensure album folder structure
  const albumsFolderId = await getOrCreateAlbumsFolder();

  const ledger = {
    timestamp: new Date().toISOString(),
    totalItems: items.length,
    albums: [],
    duplicates: [],
    warnings: [],
  };

  const seenFilenames = new Set();

  for (const [tag, tagItems] of Object.entries(groups)) {
    const albumSlug = toSlug(tag);
    const albumName =
      tag.charAt(0).toUpperCase() + tag.slice(1).replace(/-/g, ' ');

    console.log(`\n📸 Creating album: ${albumName} (${tagItems.length} items)`);

    // Create album folder
    let albumFolderId;
    try {
      albumFolderId = await ensureFolder(albumsFolderId, albumName, albumSlug);
    } catch (error) {
      console.error(`  ❌ Failed to create album folder: ${error.message}`);
      ledger.warnings.push(
        `Failed to create folder for album ${albumName}: ${error.message}`
      );
      continue;
    }
    await delay(200);

    // Create gallery_album story
    const firstItem = tagItems[0];
    const coverImage = firstItem?.content?.media || null;

    try {
      await makeRequest('POST', 'stories', {
        story: {
          name: albumName,
          slug: albumSlug,
          parent_id: albumsFolderId,
          content: {
            component: 'gallery_album',
            title: albumName,
            description: `Photos from ${albumName.toLowerCase()} at Singapore Handpan Studio.`,
            cover_image: coverImage,
            tags: tag !== 'general' ? tag : '',
            featured: false,
            sort_order: 0,
          },
        },
        publish: 1,
      });
      console.log(`  ✅ Created album story: ${albumName}`);
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log(`  ⚠️  Album story already exists: ${albumName}`);
      } else {
        console.error(`  ❌ Failed to create album story: ${error.message}`);
        ledger.warnings.push(
          `Failed to create album story ${albumName}: ${error.message}`
        );
      }
    }
    await delay(200);

    // Create gallery_media stories
    let mediaCreated = 0;
    for (const item of tagItems) {
      const filename = item.content?.media?.filename || '';

      // Deduplication check
      if (filename && seenFilenames.has(filename)) {
        console.log(`  ⏭️  Skipping duplicate: ${item.content.title}`);
        ledger.duplicates.push({
          title: item.content.title,
          filename,
          originalId: item.id,
        });
        continue;
      }
      if (filename) seenFilenames.add(filename);

      const mediaType = isVideo(filename) ? 'video' : 'image';
      const mediaSlug = toSlug(item.content.title || `media-${item.id}`);

      try {
        await makeRequest('POST', 'stories', {
          story: {
            name: item.content.title || item.name,
            slug: mediaSlug,
            parent_id: albumFolderId,
            content: {
              component: 'gallery_media',
              title: item.content.title || item.name,
              media: item.content.media,
              media_type: mediaType,
              description: item.content.description || '',
              tags: item.content.tags || '',
              alt_text: item.content.alt_text || '',
              photographer: item.content.photographer || '',
              date_taken: item.content.date_taken || '',
              sort_order: item.content.sort_order || 0,
            },
          },
          publish: 1,
        });
        mediaCreated++;
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`  ⚠️  Media already exists: ${item.content.title}`);
        } else {
          console.error(
            `  ❌ Failed to create media: ${item.content.title} - ${error.message}`
          );
          ledger.warnings.push(
            `Failed to create media ${item.content.title}: ${error.message}`
          );
        }
      }
      await delay(200);
    }

    console.log(`  📊 Created ${mediaCreated}/${tagItems.length} media items`);
    ledger.albums.push({
      name: albumName,
      slug: albumSlug,
      totalItems: tagItems.length,
      mediaCreated,
    });
  }

  // Write ledger
  const ledgerPath = path.join(__dirname, '..', 'migration-ledger.json');
  fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2));
  console.log(`\n📋 Migration ledger saved to ${ledgerPath}`);

  console.log('\n✅ Migration complete!');
  console.log(`  Albums created: ${ledger.albums.length}`);
  console.log(`  Total items processed: ${ledger.totalItems}`);
  console.log(`  Duplicates skipped: ${ledger.duplicates.length}`);
  console.log(`  Warnings: ${ledger.warnings.length}`);
  console.log(
    '\n⚠️  Old gallery_item stories were NOT deleted. Remove them manually after verification.'
  );
}

main().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
