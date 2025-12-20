/**
 * Storyblok Automation Setup Script
 * Automatically creates all components and content types for Singapore Handpan Studio
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MANAGEMENT_TOKEN = process.env.STORYBLOK_MANAGEMENT_TOKEN;
const SPACE_ID = process.env.STORYBLOK_SPACE_ID;

if (!MANAGEMENT_TOKEN) {
  console.error('❌ STORYBLOK_MANAGEMENT_TOKEN not found in .env file');
  console.log('Get your token from: https://app.storyblok.com/#!/me/account?tab=token');
  process.exit(1);
}

if (!SPACE_ID) {
  console.error('❌ STORYBLOK_SPACE_ID not found in .env file');
  console.log('Find your Space ID in Storyblok Settings > General');
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
 * Create a component from JSON definition
 */
async function createComponent(componentName) {
  const componentPath = path.join(__dirname, '..', 'storyblok', 'components', `${componentName}.json`);
  
  if (!fs.existsSync(componentPath)) {
    throw new Error(`Component definition not found: ${componentPath}`);
  }

  const componentDef = JSON.parse(fs.readFileSync(componentPath, 'utf8'));
  
  try {
    console.log(`📦 Creating component: ${componentDef.display_name}`);
    const result = await makeRequest('POST', 'components', { component: componentDef });
    console.log(`✅ Created component: ${componentDef.display_name} (ID: ${result.component.id})`);
    return result.component;
  } catch (error) {
    if (error.message.includes('already exists') || error.message.includes('422')) {
      console.log(`⚠️  Component ${componentDef.display_name} already exists, updating...`);
      try {
        // Get existing component ID
        const existingComponents = await makeRequest('GET', 'components');
        const existingComponent = existingComponents.components.find(c => c.name === componentDef.name);
        
        if (existingComponent) {
          const updateResult = await makeRequest('PUT', `components/${existingComponent.id}`, { component: componentDef });
          console.log(`✅ Updated component: ${componentDef.display_name}`);
          return updateResult.component;
        }
      } catch (updateError) {
        console.error(`❌ Failed to update component ${componentDef.display_name}:`, updateError.message);
      }
    } else {
      console.error(`❌ Failed to create component ${componentDef.display_name}:`, error.message);
    }
  }
}

/**
 * Create a folder in Storyblok
 */
async function createFolder(name, slug = null) {
  try {
    const folderData = {
      story: {
        name: name,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
        is_folder: true,
        parent_id: 0
      }
    };

    console.log(`📁 Creating folder: ${name}`);
    const result = await makeRequest('POST', 'stories', folderData);
    console.log(`✅ Created folder: ${name} (ID: ${result.story.id})`);
    return result.story;
  } catch (error) {
    if (error.message.includes('already exists') || error.message.includes('422')) {
      console.log(`⚠️  Folder ${name} already exists`);
    } else {
      console.error(`❌ Failed to create folder ${name}:`, error.message);
    }
  }
}

/**
 * Main setup function
 */
async function setupStoryblok() {
  console.log('🚀 Setting up Storyblok for Singapore Handpan Studio...\n');

  try {
    // Test API connection
    console.log('🔗 Testing API connection...');
    await makeRequest('GET', 'components');
    console.log('✅ API connection successful\n');

    // Create components
    console.log('📦 Creating components...');
    const components = ['text_block', 'page', 'event', 'gallery_item'];
    
    for (const componentName of components) {
      await createComponent(componentName);
    }

    console.log('\n📁 Creating content folders...');
    const folders = [
      { name: 'Events', slug: 'events' },
      { name: 'Gallery', slug: 'gallery' },
      { name: 'Pages', slug: 'pages' }
    ];

    for (const folder of folders) {
      await createFolder(folder.name, folder.slug);
    }

    console.log('\n🎉 Storyblok setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Visit your Storyblok space to see the new components');
    console.log('2. Run "npm run storyblok:content" to create sample content');
    console.log('3. Add images to events through the Storyblok interface');
    console.log('4. Ensure all events have status set to "upcoming" and click Save');
    console.log('5. Publish content when ready');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup
setupStoryblok();
