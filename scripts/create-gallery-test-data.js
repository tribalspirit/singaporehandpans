/**
 * Gallery Test Data Creator
 *
 * Creates sample gallery_album and gallery_media stories for testing
 * the new album-based gallery. Media fields are left empty — upload
 * actual images/videos via the Storyblok UI afterwards.
 *
 * Usage: node scripts/create-gallery-test-data.js
 */

import https from 'https';
import dotenv from 'dotenv';

dotenv.config();

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

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ──────────────────────────────────────────────
// Test data
// ──────────────────────────────────────────────

const albums = [
  {
    name: 'Workshop Moments',
    slug: 'workshop-moments',
    content: {
      component: 'gallery_album',
      title: 'Workshop Moments',
      description:
        'Highlights from our beginner and intermediate handpan workshops — learning, laughter, and first notes.',
      tags: 'workshop',
      featured: true,
      sort_order: 1,
      seo_title: 'Workshop Moments - Singapore Handpan Gallery',
      seo_description:
        'Photos and videos from handpan workshops at Singapore Handpan Studio.',
    },
    media: [
      {
        name: 'First Notes',
        slug: 'first-notes',
        content: {
          component: 'gallery_media',
          title: 'First Notes',
          media_type: 'image',
          description:
            'A beginner student striking their very first note on the handpan.',
          tags: 'workshop,students',
          alt_text: 'Student playing handpan for the first time',
          photographer: 'SG Handpan Studio',
          sort_order: 1,
        },
      },
      {
        name: 'Group Practice Circle',
        slug: 'group-practice-circle',
        content: {
          component: 'gallery_media',
          title: 'Group Practice Circle',
          media_type: 'image',
          description:
            'Students gathered in a circle during a group practice session.',
          tags: 'workshop,community',
          alt_text: 'Group of students practicing handpan in a circle',
          photographer: 'SG Handpan Studio',
          sort_order: 2,
        },
      },
      {
        name: 'Rhythm Exercises',
        slug: 'rhythm-exercises',
        content: {
          component: 'gallery_media',
          title: 'Rhythm Exercises',
          media_type: 'image',
          description:
            'Close-up of hands during a rhythm exercise at the intermediate workshop.',
          tags: 'workshop',
          alt_text: 'Hands playing rhythm patterns on a handpan',
          sort_order: 3,
        },
      },
      {
        name: 'Workshop Highlights Reel',
        slug: 'workshop-highlights-reel',
        content: {
          component: 'gallery_media',
          title: 'Workshop Highlights Reel',
          media_type: 'video',
          description:
            'A short montage of moments from our recent beginner workshops.',
          tags: 'workshop',
          alt_text: 'Video highlights from handpan workshops',
          video_duration: '1:45',
          sort_order: 4,
        },
      },
    ],
  },
  {
    name: 'Our Instruments',
    slug: 'our-instruments',
    content: {
      component: 'gallery_album',
      title: 'Our Instruments',
      description:
        'A closer look at the handpans in our collection — different makers, scales, and finishes.',
      tags: 'instruments',
      featured: true,
      sort_order: 2,
      seo_title: 'Handpan Instruments Collection - Singapore Handpan Gallery',
      seo_description:
        'Browse our curated collection of handpan instruments from various makers.',
    },
    media: [
      {
        name: 'D Kurd Handpan',
        slug: 'd-kurd-handpan',
        content: {
          component: 'gallery_media',
          title: 'D Kurd Handpan',
          media_type: 'image',
          description:
            'Our D Kurd 9-note handpan — one of the most popular scales for beginners.',
          tags: 'instruments',
          alt_text: 'D Kurd scale handpan on a wooden stand',
          sort_order: 1,
        },
      },
      {
        name: 'Celtic Minor',
        slug: 'celtic-minor',
        content: {
          component: 'gallery_media',
          title: 'Celtic Minor',
          media_type: 'image',
          description:
            'A hauntingly beautiful Celtic Minor handpan with gold-fired finish.',
          tags: 'instruments',
          alt_text: 'Celtic Minor handpan with gold finish',
          sort_order: 2,
        },
      },
      {
        name: 'Handpan Sound Demo',
        slug: 'handpan-sound-demo',
        content: {
          component: 'gallery_media',
          title: 'Handpan Sound Demo',
          media_type: 'video',
          description:
            'Hear the difference between our Kurd, Celtic Minor, and Integral scales.',
          tags: 'instruments',
          alt_text: 'Video comparing sounds of different handpan scales',
          video_duration: '3:20',
          sort_order: 3,
        },
      },
      {
        name: 'Full Collection Overhead',
        slug: 'full-collection-overhead',
        content: {
          component: 'gallery_media',
          title: 'Full Collection Overhead',
          media_type: 'image',
          description:
            'An overhead shot of our complete handpan collection laid out in the studio.',
          tags: 'instruments,studio',
          alt_text: 'Overhead view of multiple handpans arranged in studio',
          photographer: 'SG Handpan Studio',
          sort_order: 4,
        },
      },
      {
        name: 'New Arrivals Unboxing',
        slug: 'new-arrivals-unboxing',
        content: {
          component: 'gallery_media',
          title: 'New Arrivals Unboxing',
          media_type: 'image',
          description:
            'Unboxing day! Fresh handpans arriving at the studio from various makers.',
          tags: 'instruments,behind-scenes',
          alt_text: 'Unboxing new handpan instruments at the studio',
          sort_order: 5,
        },
      },
    ],
  },
  {
    name: 'Studio Life',
    slug: 'studio-life',
    content: {
      component: 'gallery_album',
      title: 'Studio Life',
      description:
        'Behind-the-scenes glimpses of daily life at Singapore Handpan Studio.',
      tags: 'studio,behind-scenes',
      featured: false,
      sort_order: 3,
      seo_title: 'Studio Life - Singapore Handpan Gallery',
      seo_description: 'Go behind the scenes at Singapore Handpan Studio.',
    },
    media: [
      {
        name: 'Morning Setup',
        slug: 'morning-setup',
        content: {
          component: 'gallery_media',
          title: 'Morning Setup',
          media_type: 'image',
          description:
            'Setting up the studio for a day of workshops and jam sessions.',
          tags: 'studio,behind-scenes',
          alt_text: 'Studio being prepared for the day',
          sort_order: 1,
        },
      },
      {
        name: 'Tuning Session',
        slug: 'tuning-session',
        content: {
          component: 'gallery_media',
          title: 'Tuning Session',
          media_type: 'image',
          description:
            'Checking and fine-tuning instruments before a workshop.',
          tags: 'behind-scenes,instruments',
          alt_text: 'Handpan being tuned with a chromatic tuner',
          sort_order: 2,
        },
      },
      {
        name: 'Studio Tour',
        slug: 'studio-tour',
        content: {
          component: 'gallery_media',
          title: 'Studio Tour',
          media_type: 'video',
          description: 'A quick tour of our cosy studio space in Singapore.',
          tags: 'studio',
          alt_text: 'Video tour of Singapore Handpan Studio',
          video_duration: '2:10',
          sort_order: 3,
        },
      },
    ],
  },
  {
    name: 'Community Jams',
    slug: 'community-jams',
    content: {
      component: 'gallery_album',
      title: 'Community Jams',
      description:
        'Free-form jam sessions and community gatherings where everyone is welcome.',
      tags: 'community,performance',
      featured: false,
      sort_order: 4,
      seo_title: 'Community Jams - Singapore Handpan Gallery',
      seo_description:
        'Photos from handpan community jams and gatherings in Singapore.',
    },
    media: [
      {
        name: 'Sunset Jam',
        slug: 'sunset-jam',
        content: {
          component: 'gallery_media',
          title: 'Sunset Jam',
          media_type: 'image',
          description:
            'An outdoor jam session at East Coast Park during golden hour.',
          tags: 'community,performance',
          alt_text: 'Handpan players jamming at sunset in a park',
          photographer: 'SG Handpan Studio',
          sort_order: 1,
        },
      },
      {
        name: 'Community Gathering Group Photo',
        slug: 'community-gathering-group-photo',
        content: {
          component: 'gallery_media',
          title: 'Community Gathering Group Photo',
          media_type: 'image',
          description: 'Group photo from our monthly community gathering.',
          tags: 'community',
          alt_text: 'Group photo of handpan community members',
          sort_order: 2,
        },
      },
      {
        name: 'Jam Session Clips',
        slug: 'jam-session-clips',
        content: {
          component: 'gallery_media',
          title: 'Jam Session Clips',
          media_type: 'video',
          description:
            'Snippets from recent jam sessions featuring community members.',
          tags: 'community,performance',
          alt_text: 'Video clips of community jam sessions',
          video_duration: '4:15',
          sort_order: 3,
        },
      },
    ],
  },
];

// ──────────────────────────────────────────────
// Folder helpers
// ──────────────────────────────────────────────

async function findOrCreateFolder(parentId, name, slug) {
  // Check if it already exists
  try {
    const result = await makeRequest(
      'GET',
      `stories?with_parent=${parentId}&per_page=100`
    );
    const existing = (result.stories || []).find(
      (s) => s.is_folder && s.slug === slug
    );
    if (existing) return existing.id;
  } catch {
    // ignore lookup failure, attempt create
  }

  const result = await makeRequest('POST', 'stories', {
    story: { name, slug, parent_id: parentId, is_folder: true },
  });
  return result.story.id;
}

async function createStory(storyData, parentId) {
  try {
    const result = await makeRequest('POST', 'stories', {
      story: {
        name: storyData.name,
        slug: storyData.slug,
        content: storyData.content,
        parent_id: parentId,
        is_folder: false,
      },
      publish: 1,
    });
    return result.story;
  } catch (error) {
    if (
      error.message.includes('already exists') ||
      error.message.includes('422')
    ) {
      console.log(`  ⚠️  Already exists: ${storyData.name}`);
      return null;
    }
    throw error;
  }
}

// ──────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────

async function main() {
  console.log('🖼️  Creating gallery test data...\n');

  // Ensure gallery/ and gallery/albums/ folders exist
  const galleryFolderId = await findOrCreateFolder(0, 'Gallery', 'gallery');
  console.log(`📁 Gallery folder: ${galleryFolderId}`);
  await delay(250);

  const albumsFolderId = await findOrCreateFolder(
    galleryFolderId,
    'Albums',
    'albums'
  );
  console.log(`📁 Albums folder: ${albumsFolderId}\n`);
  await delay(250);

  let totalAlbums = 0;
  let totalMedia = 0;

  for (const album of albums) {
    console.log(`📸 Album: ${album.name} (${album.media.length} items)`);

    // Create album-slug folder to hold media children
    const albumFolderId = await findOrCreateFolder(
      albumsFolderId,
      album.name,
      album.slug
    );
    await delay(250);

    // Create the gallery_album story inside the album folder
    const albumStory = await createStory(album, albumFolderId);
    if (albumStory) {
      console.log(`  ✅ Album story created (ID: ${albumStory.id})`);
      totalAlbums++;
    }
    await delay(250);

    // Create gallery_media stories inside the album folder
    for (const media of album.media) {
      const mediaStory = await createStory(media, albumFolderId);
      if (mediaStory) {
        const icon = media.content.media_type === 'video' ? '🎬' : '🖼️';
        console.log(`  ${icon} ${media.name} (ID: ${mediaStory.id})`);
        totalMedia++;
      }
      await delay(250);
    }

    console.log('');
  }

  console.log('✅ Done!');
  console.log(`  Albums created: ${totalAlbums}`);
  console.log(`  Media items created: ${totalMedia}`);
  console.log(
    '\n📝 Next step: upload images/videos to each media item in Storyblok.'
  );
}

main().catch((err) => {
  console.error('❌ Failed:', err);
  process.exit(1);
});
