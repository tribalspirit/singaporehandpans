/**
 * Storyblok Sample Content Creator
 * Creates sample content for Singapore Handpan Studio
 */

import https from 'https';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MANAGEMENT_TOKEN = process.env.STORYBLOK_MANAGEMENT_TOKEN;
const SPACE_ID = process.env.STORYBLOK_SPACE_ID;

if (!MANAGEMENT_TOKEN || !SPACE_ID) {
  console.error('❌ Missing STORYBLOK_MANAGEMENT_TOKEN or STORYBLOK_SPACE_ID in .env file');
  process.exit(1);
}

/**
 * Make API request to Storyblok Management API
 */
function makeRequest(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'mapi.storyblok.com',
      port: 443,
      path: `/v1/spaces/${SPACE_ID}/${endpoint}`,
      method: method,
      headers: {
        'Authorization': MANAGEMENT_TOKEN,
        'Content-Type': 'application/json'
      }
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
            reject(new Error(`API Error: ${res.statusCode} - ${JSON.stringify(jsonBody)}`));
          }
        } catch (error) {
          reject(new Error(`Parse Error: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Sample content definitions
 */
// Generate future dates for sample events
const getNextMonth = (daysFromNow) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString();
};

const sampleContent = {
  events: [
    {
      name: 'Beginner Handpan Workshop',
      slug: 'beginner-handpan-workshop',
      content: {
        component: 'event',
        title: 'Beginner Handpan Workshop',
        description: 'Join us for an introduction to the beautiful world of handpan music. Perfect for complete beginners who want to learn the basics in a supportive environment.',
        date: getNextMonth(14), // 2 weeks from now
        location: 'Singapore Handpan Studio',
        price: 'S$120',
        booking_url: 'https://calendly.com/singaporehandpan/workshop',
        tags: 'workshop,beginner', // Multi-option as comma-separated string
        status: 'upcoming',
        max_participants: 6,
        seo_title: 'Beginner Handpan Workshop Singapore - Learn Handpan Music',
        seo_description: 'Join our beginner-friendly handpan workshop in Singapore. Learn the basics of this beautiful instrument with experienced instructors.'
      }
    },
    {
      name: 'Community Handpan Gathering',
      slug: 'community-handpan-gathering',
      content: {
        component: 'event',
        title: 'Community Handpan Gathering',
        description: 'A relaxed gathering for handpan enthusiasts to play together, share music, and connect with fellow musicians in Singapore.',
        date: getNextMonth(21), // 3 weeks from now
        location: 'Singapore Handpan Studio',
        price: 'Free',
        tags: 'community', // Single tag
        status: 'upcoming',
        max_participants: 15,
        seo_title: 'Community Handpan Gathering Singapore - Free Event',
        seo_description: 'Join fellow handpan enthusiasts for a free community gathering. Share music and connect with other musicians in Singapore.'
      }
    },
    {
      name: 'Intermediate Rhythms Workshop',
      slug: 'intermediate-rhythms-workshop',
      content: {
        component: 'event',
        title: 'Intermediate Rhythms Workshop',
        description: 'Take your handpan playing to the next level with advanced rhythm patterns, polyrhythms, and improvisational techniques.',
        date: getNextMonth(28), // 4 weeks from now
        location: 'Singapore Handpan Studio',
        price: 'S$150',
        booking_url: 'https://calendly.com/singaporehandpan/intermediate',
        tags: 'workshop,intermediate',
        status: 'upcoming',
        max_participants: 4,
        seo_title: 'Intermediate Handpan Workshop Singapore - Advanced Rhythms',
        seo_description: 'Advance your handpan skills with our intermediate workshop. Learn polyrhythms, improvisation, and complex patterns.'
      }
    }
  ],
  
  gallery: [
    {
      name: 'Handpan Collection Display',
      slug: 'handpan-collection-display',
      content: {
        component: 'gallery_item',
        title: 'Our Beautiful Handpan Collection',
        description: 'A showcase of the various handpan instruments available at our studio, each with its unique scale and tonal character.',
        tags: 'instruments,studio', // Comma-separated for multi-option
        featured: true,
        alt_text: 'Collection of handpan drums displayed in the Singapore Handpan Studio',
        sort_order: 1
        // Note: media field requires uploading an image via Storyblok UI
      }
    },
    {
      name: 'Event in Session',
      slug: 'event-in-session',
      content: {
        component: 'gallery_item',
        title: 'Event in Session',
        description: 'Students learning handpan techniques during one of our community events.',
        tags: 'event,students',
        featured: false,
        alt_text: 'Students playing handpan during an event session',
        sort_order: 2
      }
    }
  ],
  
  pages: [
    {
      name: 'About Singapore Handpan Studio',
      slug: 'about-singapore-handpan-studio',
      content: {
        component: 'page',
        title: 'About Singapore Handpan Studio',
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Singapore Handpan Studio was born from a deep love for the ethereal, meditative sounds of the handpan drum. Founded in Singapore, our studio has become a sanctuary for music lovers seeking peace, healing, and creative expression.'
                }
              ]
            }
          ]
        },
        excerpt: 'Learn about our story, mission, and passion for sharing the healing sounds of handpan music with the Singapore community.',
        published: true,
        show_in_menu: false,
        seo_title: 'About Singapore Handpan Studio - Our Story & Mission',
        seo_description: 'Discover the story behind Singapore Handpan Studio. Learn about our mission to share the healing sounds of handpan music through events, academy, and community.'
      }
    }
  ]
};

/**
 * Get folder ID by name
 */
async function getFolderId(folderName) {
  try {
    const stories = await makeRequest('GET', 'stories');
    const folder = stories.stories.find(story => 
      story.is_folder && story.name.toLowerCase() === folderName.toLowerCase()
    );
    return folder ? folder.id : 0;
  } catch (error) {
    console.warn(`⚠️  Could not find folder ${folderName}, using root`);
    return 0;
  }
}

/**
 * Create a story/content item
 */
async function createStory(storyData, parentId = 0) {
  try {
    const payload = {
      story: {
        name: storyData.name,
        slug: storyData.slug,
        content: storyData.content,
        parent_id: parentId,
        is_folder: false
      },
      publish: 1
    };

    console.log(`📄 Creating content: ${storyData.name}`);
    const result = await makeRequest('POST', 'stories', payload);
    console.log(`✅ Created content: ${storyData.name} (ID: ${result.story.id})`);
    return result.story;
    
  } catch (error) {
    if (error.message.includes('already exists') || error.message.includes('422')) {
      console.log(`⚠️  Content ${storyData.name} already exists, skipping...`);
    } else {
      console.error(`❌ Failed to create content ${storyData.name}:`, error.message);
    }
  }
}

/**
 * Main execution
 */
async function createSampleContent() {
  console.log('🎨 Creating sample content for Singapore Handpan Studio...\n');

  try {
    // Get folder IDs
    const eventsFolder = await getFolderId('Events');
    const galleryFolder = await getFolderId('Gallery');
    const pagesFolder = await getFolderId('Pages');

    // Create Events
    console.log('🎪 Creating sample events...');
    for (const event of sampleContent.events) {
      await createStory(event, eventsFolder);
    }

    // Create Gallery Items
    console.log('\n🖼️  Creating sample gallery items...');
    for (const galleryItem of sampleContent.gallery) {
      await createStory(galleryItem, galleryFolder);
    }

    // Create Pages
    console.log('\n📄 Creating sample pages...');
    for (const page of sampleContent.pages) {
      await createStory(page, pagesFolder);
    }

    console.log('\n🎉 Sample content creation completed!');
    console.log('\nNext steps:');
    console.log('1. Visit your Storyblok space to see the new content');
    console.log('2. Add images to gallery items and events');
    console.log('3. Ensure all events have status="upcoming" and Save');
    console.log('4. Customize the content to match your studio');
    console.log('5. Publish content when ready');

  } catch (error) {
    console.error('❌ Sample content creation failed:', error.message);
    process.exit(1);
  }
}

createSampleContent();
