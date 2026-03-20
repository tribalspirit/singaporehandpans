import { chromium, type Page, type BrowserContext } from 'playwright';
import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const BASE_URL = 'http://localhost:4321';
const OUTPUT_DIR = 'audit-reports';
const SCREENSHOTS_DIR = path.join(OUTPUT_DIR, 'screenshots');

const VIEWPORTS: Record<string, { width: number; height: number }> = {
  'mobile-portrait': { width: 375, height: 812 },
  'mobile-portrait-14': { width: 390, height: 844 },
  'mobile-landscape': { width: 812, height: 375 },
  'tablet-portrait': { width: 768, height: 1024 },
  'tablet-landscape': { width: 1024, height: 768 },
  'small-desktop': { width: 1280, height: 720 },
  desktop: { width: 1440, height: 900 },
  'wide-desktop': { width: 1920, height: 1080 },
};

const PAGES = [
  { path: '/', name: 'home' },
  { path: '/about', name: 'about' },
  { path: '/academy', name: 'academy' },
  { path: '/events', name: 'events' },
  { path: '/gallery', name: 'gallery' },
  { path: '/contacts', name: 'contacts' },
  { path: '/shop', name: 'shop' },
  { path: '/privacy', name: 'privacy' },
  { path: '/terms', name: 'terms' },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuditIssue {
  page: string;
  url: string;
  viewport: string;
  viewportSize: string;
  severity: 'critical' | 'warning' | 'info';
  category:
    | 'touch-target'
    | 'contrast'
    | 'overflow'
    | 'spacing'
    | 'image'
    | 'typography'
    | 'layout';
  description: string;
  selector: string;
  computedValues: Record<string, string | number>;
  screenshotPath: string;
}

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

function parseArgs() {
  const args = process.argv.slice(2);
  let pageFilter: string[] | null = null;
  let viewportFilter: string[] | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--pages' && args[i + 1]) {
      pageFilter = args[++i].split(',').map((s) => s.trim());
    }
    if (args[i] === '--viewports' && args[i + 1]) {
      viewportFilter = args[++i].split(',').map((s) => s.trim());
    }
  }

  const pages = pageFilter
    ? PAGES.filter((p) => pageFilter!.includes(p.name))
    : PAGES;

  const viewports = viewportFilter
    ? Object.fromEntries(
        Object.entries(VIEWPORTS).filter(([k]) => viewportFilter!.includes(k))
      )
    : VIEWPORTS;

  return { pages, viewports };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isMobileOrTablet(viewport: string): boolean {
  return viewport.startsWith('mobile') || viewport.startsWith('tablet');
}

/**
 * Wait for the dev server to be reachable (up to 30 s).
 */
async function waitForServer(url: string, timeoutMs = 30_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (res.ok || res.status < 500) return;
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(
    `Dev server at ${url} did not respond within ${timeoutMs / 1000}s`
  );
}

// ---------------------------------------------------------------------------
// Audit checks — executed inside page.evaluate()
// ---------------------------------------------------------------------------

/**
 * All checks run inside the browser. The function is serialised by Playwright
 * so it must be self-contained (no closures over Node variables).
 */
function browserAuditChecks(isMobileTouchDevice: boolean) {
  const issues: Array<{
    severity: 'critical' | 'warning' | 'info';
    category: string;
    description: string;
    selector: string;
    computedValues: Record<string, string | number>;
  }> = [];

  // ---- helpers ----

  function isVisible(el: Element): boolean {
    const style = window.getComputedStyle(el);
    if (style.display === 'none') return false;
    if (style.visibility === 'hidden') return false;
    if (style.opacity === '0') return false;
    if (el.getAttribute('aria-hidden') === 'true') return false;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return false;
    return true;
  }

  function uniqueSelector(el: Element): string {
    if (el.id) return `#${el.id}`;
    const classes = Array.from(el.classList)
      .filter((c) => !c.startsWith('astro-'))
      .slice(0, 3);
    const tag = el.tagName.toLowerCase();
    const classStr = classes.length ? `.${classes.join('.')}` : '';
    const text = el.textContent?.trim().slice(0, 30) || '';
    const textPart = text ? `[text="${text}"]` : '';
    return `${tag}${classStr}${textPart}`;
  }

  function parseColor(
    color: string
  ): { r: number; g: number; b: number; a: number } | null {
    const rgba = color.match(
      /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/
    );
    if (!rgba) return null;
    return {
      r: parseInt(rgba[1]),
      g: parseInt(rgba[2]),
      b: parseInt(rgba[3]),
      a: rgba[4] !== undefined ? parseFloat(rgba[4]) : 1,
    };
  }

  function luminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map((c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  function contrastRatio(
    fg: { r: number; g: number; b: number },
    bg: { r: number; g: number; b: number }
  ): number {
    const l1 = luminance(fg.r, fg.g, fg.b) + 0.05;
    const l2 = luminance(bg.r, bg.g, bg.b) + 0.05;
    return l1 > l2 ? l1 / l2 : l2 / l1;
  }

  function getEffectiveBg(
    el: Element
  ): { r: number; g: number; b: number } | null {
    let current: Element | null = el;
    while (current) {
      const style = window.getComputedStyle(current);
      const bg = parseColor(style.backgroundColor);
      if (bg && bg.a > 0.1) {
        // blend with white if semi-transparent
        const a = bg.a;
        return {
          r: Math.round(bg.r * a + 255 * (1 - a)),
          g: Math.round(bg.g * a + 255 * (1 - a)),
          b: Math.round(bg.b * a + 255 * (1 - a)),
        };
      }
      // check for background-image (gradients, images)
      if (
        style.backgroundImage &&
        style.backgroundImage !== 'none' &&
        !style.backgroundImage.startsWith('linear-gradient')
      ) {
        return null; // can't compute — flag for manual review
      }
      current = current.parentElement;
    }
    return { r: 255, g: 255, b: 255 }; // default white
  }

  // ---- 1. Touch target sizing ----

  const interactiveSelectors =
    'button, a, [role="button"], input, select, textarea, .btn, summary';
  document.querySelectorAll(interactiveSelectors).forEach((el) => {
    if (!isVisible(el)) return;
    const rect = el.getBoundingClientRect();
    const minSize = isMobileTouchDevice ? 44 : 32;
    const severity = isMobileTouchDevice ? 'critical' : 'warning';

    if (rect.width < minSize || rect.height < minSize) {
      issues.push({
        severity: severity as 'critical' | 'warning',
        category: 'touch-target',
        description: `Interactive element is ${Math.round(rect.width)}x${Math.round(rect.height)}px (minimum ${minSize}x${minSize}px)`,
        selector: uniqueSelector(el),
        computedValues: {
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          minRequired: minSize,
        },
      });
    }
  });

  // ---- 2. Contrast / visibility ----

  const textElements =
    'button, a, h1, h2, h3, h4, h5, h6, p, span, .btn, label';
  document.querySelectorAll(textElements).forEach((el) => {
    if (!isVisible(el)) return;
    // skip elements with children that are not text-only
    if (el.children.length > 2) return;

    const style = window.getComputedStyle(el);
    const fg = parseColor(style.color);
    if (!fg) return;

    const bg = getEffectiveBg(el);
    if (!bg) {
      // element is over a background image — flag for manual review
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        issues.push({
          severity: 'warning',
          category: 'contrast',
          description: `Element over background image — contrast needs manual review`,
          selector: uniqueSelector(el),
          computedValues: {
            color: style.color,
            note: 'background-image detected',
          },
        });
      }
      return;
    }

    const ratio = contrastRatio(fg, bg);
    const fontSize = parseFloat(style.fontSize);
    const isBold =
      parseInt(style.fontWeight) >= 700 || style.fontWeight === 'bold';
    const isLargeText = fontSize >= 24 || (fontSize >= 18.66 && isBold);
    const minRatio = isLargeText ? 3 : 4.5;

    if (ratio < minRatio) {
      issues.push({
        severity: ratio < 2 ? 'critical' : 'warning',
        category: 'contrast',
        description: `Contrast ratio ${ratio.toFixed(2)}:1 (minimum ${minRatio}:1 for ${isLargeText ? 'large' : 'normal'} text)`,
        selector: uniqueSelector(el),
        computedValues: {
          contrastRatio: parseFloat(ratio.toFixed(2)),
          color: style.color,
          backgroundColor: style.backgroundColor,
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          required: minRatio,
        },
      });
    }
  });

  // ---- 3. Horizontal overflow ----

  const docEl = document.documentElement;
  if (docEl.scrollWidth > docEl.clientWidth + 2) {
    issues.push({
      severity: 'critical',
      category: 'overflow',
      description: `Page has horizontal overflow: scrollWidth=${docEl.scrollWidth}px, clientWidth=${docEl.clientWidth}px`,
      selector: 'html',
      computedValues: {
        scrollWidth: docEl.scrollWidth,
        clientWidth: docEl.clientWidth,
        overflow: docEl.scrollWidth - docEl.clientWidth,
      },
    });
  }

  document
    .querySelectorAll('section, .container, main, [class*="grid"]')
    .forEach((el) => {
      if (!isVisible(el)) return;
      const htmlEl = el as HTMLElement;
      if (htmlEl.scrollWidth > htmlEl.clientWidth + 2) {
        issues.push({
          severity: 'warning',
          category: 'overflow',
          description: `Element overflows horizontally: scrollWidth=${htmlEl.scrollWidth}px, clientWidth=${htmlEl.clientWidth}px`,
          selector: uniqueSelector(el),
          computedValues: {
            scrollWidth: htmlEl.scrollWidth,
            clientWidth: htmlEl.clientWidth,
          },
        });
      }
    });

  // ---- 4. Spacing consistency ----

  document.querySelectorAll('.container, .section, section').forEach((el) => {
    if (!isVisible(el)) return;
    const style = window.getComputedStyle(el);
    const pl = parseFloat(style.paddingLeft);
    const pr = parseFloat(style.paddingRight);

    // flag asymmetric horizontal padding (more than 4px difference)
    if (Math.abs(pl - pr) > 4) {
      issues.push({
        severity: 'warning',
        category: 'spacing',
        description: `Asymmetric horizontal padding: left=${pl}px, right=${pr}px`,
        selector: uniqueSelector(el),
        computedValues: { paddingLeft: pl, paddingRight: pr },
      });
    }

    // flag very small padding on mobile
    if (isMobileTouchDevice && (pl < 8 || pr < 8)) {
      const htmlEl = el as HTMLElement;
      // only flag containers that have content
      if (htmlEl.clientWidth > 100) {
        issues.push({
          severity: 'warning',
          category: 'spacing',
          description: `Very small padding on mobile: left=${pl}px, right=${pr}px`,
          selector: uniqueSelector(el),
          computedValues: { paddingLeft: pl, paddingRight: pr },
        });
      }
    }
  });

  // ---- 5. Image containment ----

  document.querySelectorAll('img').forEach((el) => {
    if (!isVisible(el)) return;
    const img = el as HTMLImageElement;
    if (!img.naturalWidth || !img.naturalHeight) return;

    const rect = img.getBoundingClientRect();
    const naturalRatio = img.naturalWidth / img.naturalHeight;
    const displayRatio = rect.width / rect.height;

    // check if image overflows its container
    const parent = img.parentElement;
    if (parent) {
      const parentRect = parent.getBoundingClientRect();
      if (rect.right > parentRect.right + 2 || rect.left < parentRect.left - 2) {
        issues.push({
          severity: 'warning',
          category: 'image',
          description: `Image overflows its container horizontally`,
          selector: uniqueSelector(el),
          computedValues: {
            imageWidth: Math.round(rect.width),
            containerWidth: Math.round(parentRect.width),
          },
        });
      }
    }

    // check aspect ratio distortion (only if object-fit is not set)
    const style = window.getComputedStyle(img);
    if (
      style.objectFit === 'fill' ||
      style.objectFit === '' ||
      style.objectFit === 'none'
    ) {
      const ratioDiff = Math.abs(naturalRatio - displayRatio) / naturalRatio;
      if (ratioDiff > 0.05) {
        issues.push({
          severity: 'info',
          category: 'image',
          description: `Image aspect ratio distorted by ${(ratioDiff * 100).toFixed(1)}%`,
          selector: uniqueSelector(el),
          computedValues: {
            naturalRatio: parseFloat(naturalRatio.toFixed(3)),
            displayRatio: parseFloat(displayRatio.toFixed(3)),
            objectFit: style.objectFit || 'unset',
          },
        });
      }
    }
  });

  // ---- 6. Text readability ----

  document
    .querySelectorAll('p, span, a, li, td, th, label, .btn')
    .forEach((el) => {
      if (!isVisible(el)) return;
      const style = window.getComputedStyle(el);
      const fontSize = parseFloat(style.fontSize);
      const minSize = isMobileTouchDevice ? 12 : 10;

      if (fontSize < minSize && fontSize > 0) {
        issues.push({
          severity: 'warning',
          category: 'typography',
          description: `Text too small: ${fontSize}px (minimum ${minSize}px)`,
          selector: uniqueSelector(el),
          computedValues: { fontSize, minRequired: minSize },
        });
      }
    });

  // ---- 7. Interactive elements clipped by overflow:hidden ----

  document.querySelectorAll(interactiveSelectors).forEach((el) => {
    if (!isVisible(el)) return;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    let ancestor: Element | null = el.parentElement;
    while (ancestor && ancestor !== document.documentElement) {
      const style = window.getComputedStyle(ancestor);
      if (style.overflow === 'hidden' || style.overflowX === 'hidden') {
        const ancestorRect = ancestor.getBoundingClientRect();
        const clippedRight = rect.right > ancestorRect.right + 1;
        const clippedLeft = rect.left < ancestorRect.left - 1;
        const clippedTop = rect.top < ancestorRect.top - 1;
        const clippedBottom = rect.bottom > ancestorRect.bottom + 1;

        if (clippedRight || clippedLeft || clippedTop || clippedBottom) {
          issues.push({
            severity: 'critical',
            category: 'layout',
            description: `Interactive element clipped by overflow:hidden ancestor`,
            selector: uniqueSelector(el),
            computedValues: {
              ancestor: uniqueSelector(ancestor),
              clippedSides: [
                clippedLeft && 'left',
                clippedRight && 'right',
                clippedTop && 'top',
                clippedBottom && 'bottom',
              ]
                .filter(Boolean)
                .join(', '),
            },
          });
          break;
        }
      }
      ancestor = ancestor.parentElement;
    }
  });

  return issues;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function auditPage(
  context: BrowserContext,
  pageDef: (typeof PAGES)[number],
  viewportName: string,
  viewport: { width: number; height: number }
): Promise<AuditIssue[]> {
  const page: Page = await context.newPage();
  const url = `${BASE_URL}${pageDef.path}`;
  const screenshotDir = path.join(SCREENSHOTS_DIR, viewportName);
  fs.mkdirSync(screenshotDir, { recursive: true });
  const screenshotPath = path.join(screenshotDir, `${pageDef.name}.png`);
  const relScreenshotPath = path.relative(OUTPUT_DIR, screenshotPath);

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });
    await page.waitForTimeout(500);

    // Take screenshot
    await page.screenshot({ path: screenshotPath, fullPage: true });

    // Run audit checks
    const isMobile = isMobileOrTablet(viewportName);
    const rawIssues = await page.evaluate(browserAuditChecks, isMobile);

    return rawIssues.map((issue) => ({
      page: pageDef.name,
      url: pageDef.path,
      viewport: viewportName,
      viewportSize: `${viewport.width}x${viewport.height}`,
      severity: issue.severity as AuditIssue['severity'],
      category: issue.category as AuditIssue['category'],
      description: issue.description,
      selector: issue.selector,
      computedValues: issue.computedValues,
      screenshotPath: relScreenshotPath,
    }));
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`  ✗ Failed to audit ${url} at ${viewportName}: ${msg}`);
    return [];
  } finally {
    await page.close();
  }
}

function generateMarkdownReport(issues: AuditIssue[]): string {
  const lines: string[] = [];
  const now = new Date().toISOString();

  lines.push(`# Layout Audit Report`);
  lines.push('');
  lines.push(`Generated: ${now}`);
  lines.push('');

  // Summary
  const critical = issues.filter((i) => i.severity === 'critical').length;
  const warning = issues.filter((i) => i.severity === 'warning').length;
  const info = issues.filter((i) => i.severity === 'info').length;

  lines.push(`## Summary`);
  lines.push('');
  lines.push(`| Severity | Count |`);
  lines.push(`|----------|-------|`);
  lines.push(`| Critical | ${critical} |`);
  lines.push(`| Warning  | ${warning} |`);
  lines.push(`| Info     | ${info} |`);
  lines.push(`| **Total** | **${issues.length}** |`);
  lines.push('');

  // Category breakdown
  const categories = new Map<string, number>();
  issues.forEach((i) => {
    categories.set(i.category, (categories.get(i.category) || 0) + 1);
  });

  lines.push(`## By Category`);
  lines.push('');
  lines.push(`| Category | Count |`);
  lines.push(`|----------|-------|`);
  categories.forEach((count, cat) => {
    lines.push(`| ${cat} | ${count} |`);
  });
  lines.push('');

  // Group by page
  const byPage = new Map<string, AuditIssue[]>();
  issues.forEach((i) => {
    const list = byPage.get(i.page) || [];
    list.push(i);
    byPage.set(i.page, list);
  });

  lines.push(`## Issues by Page`);
  lines.push('');

  byPage.forEach((pageIssues, pageName) => {
    lines.push(`### ${pageName} (${pageIssues.length} issues)`);
    lines.push('');

    // Group by viewport within page
    const byViewport = new Map<string, AuditIssue[]>();
    pageIssues.forEach((i) => {
      const list = byViewport.get(i.viewport) || [];
      list.push(i);
      byViewport.set(i.viewport, list);
    });

    byViewport.forEach((vpIssues, vpName) => {
      lines.push(`#### ${vpName} (${vpIssues[0].viewportSize})`);
      lines.push('');
      lines.push(
        `| Severity | Category | Description | Selector |`
      );
      lines.push(
        `|----------|----------|-------------|----------|`
      );
      vpIssues.forEach((i) => {
        const sev =
          i.severity === 'critical'
            ? '🔴 critical'
            : i.severity === 'warning'
              ? '🟡 warning'
              : '🔵 info';
        lines.push(
          `| ${sev} | ${i.category} | ${i.description} | \`${i.selector}\` |`
        );
      });
      lines.push('');
    });
  });

  return lines.join('\n');
}

async function main() {
  const { pages, viewports } = parseArgs();

  console.log('🔍 Layout Audit — Starting...\n');
  console.log(
    `  Pages:    ${pages.map((p) => p.name).join(', ')}`
  );
  console.log(
    `  Viewports: ${Object.keys(viewports).join(', ')}`
  );
  console.log('');

  // Wait for dev server
  console.log(`⏳ Waiting for dev server at ${BASE_URL}...`);
  await waitForServer(BASE_URL);
  console.log('✓ Dev server is ready\n');

  // Ensure output dirs
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const allIssues: AuditIssue[] = [];

  for (const [vpName, vpSize] of Object.entries(viewports)) {
    console.log(
      `📱 ${vpName} (${vpSize.width}x${vpSize.height})`
    );

    const isMobile = isMobileOrTablet(vpName);
    const context = await browser.newContext({
      viewport: vpSize,
      userAgent: isMobile
        ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15'
        : undefined,
      isMobile,
      hasTouch: isMobile,
    });

    for (const pageDef of pages) {
      process.stdout.write(`  ${pageDef.name}... `);
      const issues = await auditPage(context, pageDef, vpName, vpSize);
      allIssues.push(...issues);
      const crit = issues.filter((i) => i.severity === 'critical').length;
      const warn = issues.filter((i) => i.severity === 'warning').length;
      console.log(
        `${issues.length} issues (${crit} critical, ${warn} warnings)`
      );
    }

    await context.close();
    console.log('');
  }

  await browser.close();

  // Write reports
  const jsonPath = path.join(OUTPUT_DIR, 'layout-audit-latest.json');
  const mdPath = path.join(OUTPUT_DIR, 'layout-audit-latest.md');

  fs.writeFileSync(jsonPath, JSON.stringify(allIssues, null, 2));
  fs.writeFileSync(mdPath, generateMarkdownReport(allIssues));

  // Print summary
  const critical = allIssues.filter((i) => i.severity === 'critical').length;
  const warning = allIssues.filter((i) => i.severity === 'warning').length;
  const info = allIssues.filter((i) => i.severity === 'info').length;

  console.log('━'.repeat(50));
  console.log(`✨ Audit complete!`);
  console.log(`   🔴 ${critical} critical  🟡 ${warning} warnings  🔵 ${info} info`);
  console.log(`   Total: ${allIssues.length} issues across ${pages.length} pages × ${Object.keys(viewports).length} viewports`);
  console.log('');
  console.log(`📄 Reports:`);
  console.log(`   ${path.resolve(mdPath)}`);
  console.log(`   ${path.resolve(jsonPath)}`);
  console.log(`📸 Screenshots: ${path.resolve(SCREENSHOTS_DIR)}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
