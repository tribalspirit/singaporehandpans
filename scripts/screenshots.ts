import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:4321';
const SCREENSHOTS_DIR = 'screenshots';

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 812 },
};

const pages = [
  { path: '/', name: 'home' },
  { path: '/about', name: 'about' },
  { path: '/academy', name: 'academy' },
  { path: '/academy/memorization', name: 'academy-memorization' },
  { path: '/events', name: 'events' },
  {
    path: '/events/beginner-handpan-workshop',
    name: 'event-beginner-workshop',
  },
  {
    path: '/events/community-handpan-gathering',
    name: 'event-community-gathering',
  },
  { path: '/gallery', name: 'gallery' },
  { path: '/contacts', name: 'contacts' },
];

const captureScreenshot = async (
  page: any,
  url: string,
  screenshotPath: string
) => {
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(500);

    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
    });

    console.log(`✓ ${screenshotPath}`);
  } catch (error) {
    console.error(`✗ Failed to capture ${url}:`, error.message);
  }
};

(async () => {
  console.log('🎬 Starting screenshot capture...\n');

  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  for (const [device, viewport] of Object.entries(VIEWPORTS)) {
    console.log(`\n📱 Capturing ${device} screenshots (${viewport.width}x${viewport.height})...`);

    const deviceDir = path.join(SCREENSHOTS_DIR, device);
    fs.mkdirSync(deviceDir, { recursive: true });

    const context = await browser.newContext({
      viewport,
      userAgent:
        device === 'mobile'
          ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15'
          : undefined,
    });

    const page = await context.newPage();

    for (const { path: pagePath, name } of pages) {
      const url = `${BASE_URL}${pagePath}`;
      const screenshotPath = path.join(deviceDir, `${name}.png`);
      await captureScreenshot(page, url, screenshotPath);
    }

    await context.close();
  }

  await browser.close();

  console.log('\n✨ Screenshot capture complete!');
  console.log(
    `📁 Screenshots saved in: ${path.resolve(SCREENSHOTS_DIR)}\n`
  );
})();

