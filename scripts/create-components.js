/**
 * Storyblok Component Creator Script
 * Creates individual components or updates existing ones
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
 * List all available component definitions
 */
function listAvailableComponents() {
  const componentsDir = path.join(__dirname, '..', 'storyblok', 'components');
  const files = fs.readdirSync(componentsDir);
  return files
    .filter(file => file.endsWith('.json'))
    .map(file => path.basename(file, '.json'));
}

/**
 * Create or update a specific component
 */
async function createComponent(componentName) {
  const componentPath = path.join(__dirname, '..', 'storyblok', 'components', `${componentName}.json`);
  
  if (!fs.existsSync(componentPath)) {
    throw new Error(`Component definition not found: ${componentPath}`);
  }

  const componentDef = JSON.parse(fs.readFileSync(componentPath, 'utf8'));
  
  try {
    // Try to create new component
    console.log(`📦 Creating component: ${componentDef.display_name}`);
    const result = await makeRequest('POST', 'components', { component: componentDef });
    console.log(`✅ Created component: ${componentDef.display_name} (ID: ${result.component.id})`);
    return result.component;
    
  } catch (error) {
    // If component exists, try to update it
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
        } else {
          throw new Error('Component exists but could not be found for update');
        }
      } catch (updateError) {
        console.error(`❌ Failed to update component ${componentDef.display_name}:`, updateError.message);
        throw updateError;
      }
    } else {
      console.error(`❌ Failed to create component ${componentDef.display_name}:`, error.message);
      throw error;
    }
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const componentName = args[0];

  if (!componentName) {
    console.log('🔧 Storyblok Component Creator\n');
    console.log('Usage: npm run storyblok:components <component-name>\n');
    console.log('Available components:');
    const availableComponents = listAvailableComponents();
    availableComponents.forEach(comp => {
      console.log(`  - ${comp}`);
    });
    console.log('\nTo create all components: npm run storyblok:setup');
    return;
  }

  if (componentName === 'all') {
    console.log('📦 Creating all components...\n');
    const availableComponents = listAvailableComponents();
    
    for (const comp of availableComponents) {
      try {
        await createComponent(comp);
      } catch (error) {
        console.error(`Failed to create ${comp}:`, error.message);
      }
    }
    
    console.log('\n🎉 All components processed!');
    return;
  }

  try {
    await createComponent(componentName);
    console.log(`\n🎉 Component ${componentName} processed successfully!`);
  } catch (error) {
    console.error(`❌ Failed to process component ${componentName}:`, error.message);
    process.exit(1);
  }
}

main();
