/**
 * Migrate the Shopify product catalog into Storyblok (content types `product`
 * and `shop_collection`), so the shop can run on the Storyblok + HitPay
 * implementation selected by PUBLIC_SHOP_IMPL=hitpay.
 *
 * What it does:
 *   1. Reads the live catalog from the Shopify Storefront API.
 *   2. Derives a brand slug per product (Shopify's `vendor` is unreliable — it
 *      is mostly the reseller, so the maker is parsed from the title).
 *   3. Splits colour variants into one Storyblok product each, because the
 *      `product` schema carries a single price and HitPay checkout is
 *      single-item.
 *   4. Uploads every distinct Shopify image into Storyblok assets once and
 *      reuses the asset across split variants.
 *   5. Creates/updates the `shop`, `shop/products` and `shop/collections`
 *      folders, the collection stories, and the product stories.
 *
 * Idempotent: existing stories are matched by full_slug and updated in place,
 * and images already uploaded in a previous run are reused via the asset
 * filename cache, so re-running does not duplicate content.
 *
 * Usage:
 *   node scripts/migrate-shop-catalog.js --dry-run   # report only, no writes
 *   node scripts/migrate-shop-catalog.js             # perform the migration
 *   node scripts/migrate-shop-catalog.js --prune     # also unpublish products
 *                                                    # no longer in Shopify
 *
 * Requires STORYBLOK_MANAGEMENT_TOKEN, STORYBLOK_SPACE_ID,
 * PUBLIC_SHOPIFY_STORE_DOMAIN and PUBLIC_SHOPIFY_STOREFRONT_TOKEN in .env.
 * Uses Node 18+ global fetch / FormData / Blob.
 */

import dotenv from 'dotenv';

dotenv.config();

const MAPI = 'https://mapi.storyblok.com/v1';
const SHOPIFY_API_VERSION = '2024-01';
const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');
const PRUNE = process.argv.includes('--prune');

// Must match the paths shopClient.ts reads from.
const PRODUCTS_PATH = 'shop/products/';
const CURRENCY = 'SGD';

/**
 * Written into the `title` of an automatically chosen collection cover, so a
 * later run can tell its own pick apart from an image an editor uploaded and
 * refresh the former without overwriting the latter.
 */
const AUTO_COVER_MARK = 'auto: collection cover';
const COLLECTIONS_PATH = 'shop/collections/';

const TOKEN = process.env.STORYBLOK_MANAGEMENT_TOKEN;
const SPACE = process.env.STORYBLOK_SPACE_ID;
const SHOP_DOMAIN = process.env.PUBLIC_SHOPIFY_STORE_DOMAIN;
const SHOP_TOKEN = process.env.PUBLIC_SHOPIFY_STOREFRONT_TOKEN;

if (!TOKEN || !SPACE) {
  console.error('❌ Missing STORYBLOK_MANAGEMENT_TOKEN or STORYBLOK_SPACE_ID');
  process.exit(1);
}
// Required, not optional: existing story content is read through the delivery
// API, and updates merge over it. Without this token the merge would start from
// an empty map and every PUT would strip CMS-only fields (collection images,
// editor-curated `featured` and `seo_description`) instead of preserving them.
if (!process.env.STORYBLOK_TOKEN) {
  console.error(
    '❌ Missing STORYBLOK_TOKEN — needed to read existing content before updating it'
  );
  process.exit(1);
}
if (!SHOP_DOMAIN || !SHOP_TOKEN) {
  console.error(
    '❌ Missing PUBLIC_SHOPIFY_STORE_DOMAIN or PUBLIC_SHOPIFY_STOREFRONT_TOKEN'
  );
  process.exit(1);
}

/**
 * Brand slugs must match a story slug under shop/collections/ — shopClient.ts
 * maps products to collections by `brand === collection.slug`.
 */
const COLLECTIONS = [
  {
    slug: 'mag',
    title: 'MAG Instruments',
    description:
      'Hand-tuned instruments from MAG Instruments — deep, singing sustain across Kurd, Aegean and mutant scales.',
  },
  {
    slug: 'battiloro',
    title: 'Battiloro',
    description:
      'Italian-made Battiloro handpans, known for their warm attack and precise, stable tuning.',
  },
  {
    slug: 'sew',
    title: 'SEW Handpan',
    description:
      'SEW Handpan ember and stainless steel instruments — bright, articulate and responsive.',
  },
  {
    slug: 'sirvan',
    title: 'Sirvan',
    description:
      'Sirvan stainless steel handpans, built for clarity and long, even sustain.',
  },
  {
    slug: 'sg-pan',
    title: 'SG Pan',
    description:
      'SG Pan instruments — an accessible entry point into the handpan for new players.',
  },
  {
    slug: 'rav',
    title: 'RAV',
    description:
      'RAV Vast tongue drums — melodic, forgiving and easy to pick up on the first day.',
  },
  {
    slug: 'hardcase',
    title: 'Hardcase Technologies',
    description:
      'Protective cases and bags from Hardcase Technologies, made to travel with your instrument.',
  },
  {
    slug: 'studio',
    title: 'Studio Accessories',
    description:
      'Stands and accessories selected by Singapore Handpan Studio for everyday playing and display.',
  },
];

/**
 * Brand detection, most specific first. Shopify's `vendor` is "Singapore
 * Handpan Studio" for most items (the reseller), so the maker is matched from
 * the product title and only then from the vendor.
 */
const BRAND_RULES = [
  { brand: 'hardcase', test: /hardcase\s*technologies/i },
  { brand: 'battiloro', test: /battiloro/i },
  { brand: 'mag', test: /mag\s*instruments/i },
  { brand: 'sew', test: /\bsew\b/i },
  { brand: 'sirvan', test: /sirvan/i },
  { brand: 'rav', test: /\brav\b/i },
  { brand: 'sg-pan', test: /sg\s*pan/i },
];

/** Shopify productType -> Storyblok product_type option. */
const PRODUCT_TYPE_MAP = {
  Handpan: 'Handpan',
  'Handpan Bag': 'Case',
  'Handpan Stands': 'Stand',
  'RAV Vast Tongue Drum': 'Tongue Drum',
};

/** Products flagged for the homepage rail — in-stock flagships across brands. */
const FEATURED_SLUGS = new Set([
  'handpan-e-amara-mutant-20-notes-by-mag-instruments',
  'handpan-tanit-c-aegean-10-notes-by-battiloro-handpan',
  'sew-handpan-d-kurd-14-notes-ember-steel',
  'rav-vast-b-celtic-double-ding',
]);

const warnings = [];
const stats = { uploaded: 0, reused: 0 };

function mapi(method, endpoint, body) {
  return fetch(`${MAPI}/spaces/${SPACE}/${endpoint}`, {
    method,
    headers: { Authorization: TOKEN, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  }).then(async (res) => {
    const text = await res.text();
    const json = text ? JSON.parse(text) : {};
    if (!res.ok) {
      throw new Error(
        `${method} ${endpoint} -> ${res.status}: ${text.slice(0, 300)}`
      );
    }
    return json;
  });
}

/** Storyblok MAPI is rate limited; space out write calls. */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Ceiling on generated slugs, matching MAX_SLUG_LENGTH in
 * src/pages/api/shop/checkout.ts. A longer slug produces a product that browses
 * and renders fine but whose Buy form is rejected by the checkout endpoint —
 * visible but unbuyable, with nothing on the page to explain why.
 */
const MAX_SLUG_LENGTH = 120;

/** Trim to the length cap on a hyphen boundary so words are not cut mid-token. */
function capSlug(slug) {
  if (slug.length <= MAX_SLUG_LENGTH) return slug;
  const cut = slug.slice(0, MAX_SLUG_LENGTH);
  const lastDash = cut.lastIndexOf('-');
  const capped = (
    lastDash > MAX_SLUG_LENGTH / 2 ? cut.slice(0, lastDash) : cut
  ).replace(/-+$/, '');
  warnings.push(
    `Slug exceeded ${MAX_SLUG_LENGTH} chars and was trimmed: ${capped}`
  );
  return capped;
}

function slugify(value) {
  return value
    .normalize('NFKD')
    .replace(/[‐-―]/g, '-') // unicode dashes -> hyphen
    .replace(/[^\w\s-]/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function decodeEntities(text) {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, '&'); // last, so &amp;lt; does not become <
}

/**
 * Strip Shopify's description HTML down to the plain text the textarea holds.
 *
 * The product page renders this with `white-space: pre-line`, so every newline
 * here is a visible line break — the conversion has to produce final layout,
 * not just tag-free text.
 *
 * List items are flattened first, deliberately. Shopify writes
 * `<li><p><span>text</span></p></li>` with newlines between the tags, so
 * treating `</li>` as a plain break left the bullet stranded on its own line
 * with a blank line after every item.
 */
function htmlToText(html) {
  if (!html) return '';

  const withBullets = html.replace(
    /<li[^>]*>([\s\S]*?)<\/li>/gi,
    (_, inner) =>
      `\n• ${inner
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()}\n`
  );

  return (
    decodeEntities(
      withBullets
        .replace(/<\s*(br|\/p|\/div|\/h[1-6]|\/ul|\/ol|\/tr)\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
    )
      .replace(/[ \t]+/g, ' ')
      .split('\n')
      .map((line) => line.trim())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      // Consecutive bullets are one list — no blank line between them, and none
      // between a lead-in line like "Features:" and the first bullet.
      .replace(/\n\n(?=• )/g, '\n')
      .replace(/(^|\n)• *(?=\n|$)/g, '$1') // drop empty bullets
      .trim()
  );
}

function detectBrand(title, vendor) {
  const haystack = `${title} ${vendor}`;
  const rule = BRAND_RULES.find(({ test }) => test.test(haystack));
  if (rule) return rule.brand;
  // Unbranded studio stock (stands) falls back to the studio collection. Warn,
  // so a genuinely new maker is not silently filed under Studio Accessories.
  warnings.push(
    `No brand rule matched "${title}" (vendor "${vendor}") — defaulted to studio`
  );
  return 'studio';
}

function detectProductType(shopifyType) {
  const mapped = PRODUCT_TYPE_MAP[shopifyType];
  if (mapped) return mapped;
  warnings.push(
    `Unmapped Shopify productType "${shopifyType}" — defaulted to Accessory`
  );
  return 'Accessory';
}

/** Trim Shopify housekeeping noise from a customer-facing title. */
function cleanTitle(title) {
  return title
    .replace(/\s*\(copy\)\s*$/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function seoDescription(text) {
  if (!text) return '';
  const flat = text.replace(/\s+/g, ' ').trim();
  if (flat.length <= 160) return flat;
  const cut = flat.slice(0, 157);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > 80 ? lastSpace : 157)}…`;
}

const CATALOG_QUERY = `query Catalog($cursor: String) {
  products(first: 100, after: $cursor) {
    pageInfo { hasNextPage endCursor }
    edges { node {
      handle title productType vendor availableForSale descriptionHtml
      images(first: 50) {
        pageInfo { hasNextPage }
        edges { node { url altText width height } }
      }
      variants(first: 100) {
        pageInfo { hasNextPage }
        edges { node {
          title availableForSale price { amount currencyCode }
          image { url altText width height }
        } }
      }
    } }
  }
}`;

async function shopifyRequest(variables) {
  const res = await fetch(
    `https://${SHOP_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOP_TOKEN,
      },
      body: JSON.stringify({ query: CATALOG_QUERY, variables }),
    }
  );
  if (!res.ok) throw new Error(`Shopify API ${res.status}`);
  const json = await res.json();
  if (json.errors) {
    throw new Error(
      `Shopify errors: ${JSON.stringify(json.errors).slice(0, 300)}`
    );
  }
  return json.data.products;
}

/**
 * Walk the whole product connection. Paginating rather than taking a single
 * large page matters for correctness, not just scale: a silently truncated
 * catalog would leave the omitted products stale, and `--prune` would treat
 * them as deleted from Shopify and unpublish them.
 */
async function fetchShopifyCatalog() {
  const nodes = [];
  let cursor = null;

  for (let page = 1; page <= 50; page += 1) {
    const { edges, pageInfo } = await shopifyRequest({ cursor });
    const batch = edges.map((edge) => edge.node);

    // Refuse to continue on a truncated variant list rather than silently
    // dropping variants: the missing ones would never become stories, and a
    // later --prune would read them as deleted and unpublish live products.
    // An incomplete gallery is a quality problem, not a correctness one, so
    // warn rather than abort — unlike the variant case immediately below.
    batch
      .filter((node) => node.images.pageInfo.hasNextPage)
      .forEach((node) =>
        warnings.push(
          `"${node.title}" has more than 50 images; only the first 50 were copied`
        )
      );

    const truncated = batch.filter(
      (node) => node.variants.pageInfo.hasNextPage
    );
    if (truncated.length) {
      throw new Error(
        `Products with more than 100 variants are not supported: ${truncated
          .map((node) => node.handle)
          .join(', ')}`
      );
    }

    nodes.push(...batch);
    if (!pageInfo.hasNextPage) return nodes;
    cursor = pageInfo.endCursor;
  }

  throw new Error(
    `Shopify catalog exceeded the 50-page ceiling after ${nodes.length} products`
  );
}

/**
 * Flatten Shopify products into Storyblok product records, splitting colour
 * variants into one record each so every entry has a single price and its own
 * stock flag.
 */
function buildProductRecords(shopifyProducts) {
  return shopifyProducts.flatMap((node) => {
    const title = cleanTitle(node.title);
    const brand = detectBrand(title, node.vendor);
    const productType = detectProductType(node.productType);
    const description = htmlToText(node.descriptionHtml);
    const images = node.images.edges.map((edge) => ({
      url: edge.node.url,
      alt: edge.node.altText || title,
      width: edge.node.width,
      height: edge.node.height,
    }));
    const variants = node.variants.edges.map((edge) => edge.node);

    // Shopify's handle is authoritative for single-variant products unless it
    // disagrees with the title (the catalog has one such mismatch), in which
    // case the title wins — these are brand-new site URLs with no SEO history.
    const titleSlug = slugify(title);
    const baseSlug = titleSlug || slugify(node.handle);
    if (slugify(node.handle) !== titleSlug) {
      warnings.push(
        `Slug differs from Shopify handle: "${node.handle}" -> "${baseSlug}" (title: "${title}")`
      );
    }

    const isSplit = variants.length > 1;
    if (!isSplit) {
      const variant = variants[0];
      return [
        {
          slug: capSlug(baseSlug),
          name: title,
          price: variant ? variantPrice(variant, title) : 0,
          inStock: node.availableForSale,
          brand,
          productType,
          description,
          images,
        },
      ];
    }

    return variants.map((variant) => {
      const variantSlug = capSlug(`${baseSlug}-${slugify(variant.title)}`);
      return {
        slug: variantSlug,
        name: `${title} — ${variant.title}`,
        price: variantPrice(variant, title),
        inStock: variant.availableForSale,
        brand,
        productType,
        description,
        images: orderImagesForVariant(images, variant, title),
      };
    });
  });
}

/**
 * Read a variant's price, refusing anything that is not SGD.
 *
 * The Storyblok field is `price_sgd` and checkout charges its number as SGD, so
 * a store-currency or Shopify Markets change that started returning USD would
 * silently mis-charge every customer. There is no conversion to do here — the
 * right response is to stop and have someone look.
 */
function variantPrice(variant, title) {
  const { amount, currencyCode } = variant.price;
  if (currencyCode !== CURRENCY) {
    throw new Error(
      `"${title}" is priced in ${currencyCode}, not ${CURRENCY}. ` +
        'price_sgd would be charged as SGD — aborting rather than mis-charging.'
    );
  }
  return Number(amount);
}

/**
 * Lead a split variant's image set with that variant's own photo.
 *
 * Every colour story would otherwise inherit the product-level array in its
 * original order, so the EVATEK Woodbine and Mustang stories would both show
 * the black bag as their card and hero image. The remaining photos are kept, in
 * order, as secondary shots.
 */
function orderImagesForVariant(images, variant, fallbackAlt) {
  const url = variant.image?.url;
  if (!url) return images;

  const own = images.find((image) => image.url === url) ?? {
    url,
    alt: variant.image.altText || `${fallbackAlt} — ${variant.title}`,
    width: variant.image.width,
    height: variant.image.height,
  };

  return [own, ...images.filter((image) => image.url !== url)];
}

/**
 * Deterministic Storyblok filename for a Shopify image URL. Stable across runs,
 * which is what lets an already-uploaded asset be recognised and reused.
 */
function assetFileName(sourceUrl) {
  return `${slugify(
    decodeURIComponent(
      new URL(sourceUrl).pathname.split('/').pop() || 'product'
    )
      .replace(/\.[a-z0-9]+$/i, '')
      .slice(0, 60)
  )}.jpg`;
}

/**
 * Fail loudly if two records resolve to the same slug.
 *
 * Slugs come from titles, so two products titled identically — or normalising
 * identically once `(Copy)` and punctuation are stripped, or after the length
 * cap trims them — collide. Upserting keys on full_slug, so the second record
 * would silently overwrite the first: one product lost, the other showing the
 * wrong price and stock, with nothing in the output to say so.
 */
function assertUniqueSlugs(records) {
  const seen = new Map();
  const clashes = [];

  records.forEach((record) => {
    const previous = seen.get(record.slug);
    if (previous) clashes.push(`${record.slug} (${previous} / ${record.name})`);
    else seen.set(record.slug, record.name);
  });

  if (clashes.length) {
    throw new Error(
      `Duplicate product slugs would overwrite each other:\n   ${clashes.join('\n   ')}`
    );
  }
}

/** Storyblok 3-step signed upload; returns an asset object for content fields. */
async function uploadImage(image, assetCache) {
  const cleanName = assetFileName(image.url);

  // Exact match on the source URL is authoritative. The filename fallback only
  // applies to legacy assets that carry no `source`: Shopify image URLs are
  // version-stamped (?v=...), so an image replaced under the same filename gets
  // a new URL, and falling back on filename alone would silently re-publish the
  // superseded image instead of downloading the replacement.
  const bySource = assetCache.get(image.url);
  const byName = assetCache.get(cleanName);
  const cached = bySource ?? (byName && !byName.source ? byName : undefined);

  if (cached) {
    stats.reused += 1;
    // Backfill `source` on assets uploaded before it was recorded, so future
    // runs match on the exact URL rather than falling back to the filename.
    return cached.source ? cached : { ...cached, source: image.url };
  }

  const binary = await fetch(image.url);
  if (!binary.ok) throw new Error(`Image fetch failed: ${image.url}`);
  const buffer = Buffer.from(await binary.arrayBuffer());

  const signed = await mapi('POST', 'assets', {
    filename: cleanName,
    validate_upload: 1,
  });

  const form = new FormData();
  for (const [key, value] of Object.entries(signed.fields))
    form.append(key, value);
  form.append('file', new Blob([buffer]), cleanName);
  const s3 = await fetch(signed.post_url, { method: 'POST', body: form });
  if (!s3.ok) {
    const detail = await s3.text().catch(() => '');
    throw new Error(
      `S3 upload failed for ${cleanName}: ${s3.status} ${detail.slice(0, 200)}`
    );
  }

  const finished = await mapi('GET', `assets/${signed.id}/finish_upload`);
  const asset = {
    id: signed.id,
    filename: finished.filename || signed.pretty_url,
    name: '',
    title: '',
    alt: image.alt,
    focus: '',
    // Records which Shopify image this came from, so a later run can reuse the
    // asset instead of uploading a duplicate.
    source: image.url,
    copyright: '',
    fieldtype: 'asset',
    meta_data:
      image.width && image.height
        ? { width: image.width, height: image.height }
        : {},
    is_external_url: false,
  };

  assetCache.set(image.url, asset);
  assetCache.set(cleanName, asset);
  stats.uploaded += 1;
  console.log(`  ⬆️  ${cleanName}`);
  await sleep(120);
  return asset;
}

/**
 * Pre-populate the asset cache from products migrated by an earlier run, so
 * re-running reuses the images already in Storyblok instead of uploading a
 * fresh copy of every one and orphaning the originals.
 *
 * Assets are matched on the `source` field (the Shopify URL, written at upload
 * time) and, for assets uploaded before `source` was recorded, on the stable
 * filename derived from that URL.
 */
/**
 * Read existing stories, with content, via the delivery API. The management
 * API's listing omits `content`, which both the asset cache and the
 * CMS-field-preserving merge in `upsertStory` need. Paginated — reading only
 * the first page would silently re-upload images and drop editor-authored
 * fields for everything after it.
 */
async function fetchStories(path, contentType, version = 'draft') {
  const deliveryToken = process.env.STORYBLOK_TOKEN;
  if (!deliveryToken) return null;

  const stories = [];
  for (let page = 1; page <= 50; page += 1) {
    const res = await fetch(
      `https://api.storyblok.com/v2/cdn/stories?token=${deliveryToken}` +
        `&version=${version}&starts_with=${path}&content_type=${contentType}` +
        `&per_page=100&page=${page}`
    );
    if (!res.ok) throw new Error(`delivery API ${res.status}`);
    const { stories: batch = [] } = await res.json();
    stories.push(...batch);
    if (batch.length < 100) break;
  }
  return stories;
}

/**
 * Map full_slug -> existing content, so `upsertStory` can merge rather than
 * replace. Without it, an editor-set `shop_collection.image` — a field the
 * migration never writes — would be wiped on the next run.
 */
/**
 * Confirm the delivery token addresses the same space the management token
 * writes to.
 *
 * A valid preview token for a *different* space answers 200 with that space's
 * (unrelated, usually empty) content, so nothing else here would notice: the
 * merge base would come back empty and every update would strip CMS-authored
 * fields from the real space. This is the one remaining way that can happen.
 */
async function assertSpacesMatch() {
  const res = await fetch(
    `https://api.storyblok.com/v2/cdn/spaces/me?token=${process.env.STORYBLOK_TOKEN}`
  );
  if (!res.ok) {
    throw new Error(
      `Could not verify STORYBLOK_TOKEN (delivery API ${res.status})`
    );
  }
  const { space } = await res.json();
  if (String(space?.id) !== String(SPACE)) {
    throw new Error(
      `STORYBLOK_TOKEN belongs to space ${space?.id}, but STORYBLOK_SPACE_ID is ${SPACE}. ` +
        'Reading one space while writing another would overwrite CMS-authored fields.'
    );
  }
}

async function fetchExistingContent() {
  const byFullSlug = new Map();
  try {
    const groups = await Promise.all([
      fetchStories(PRODUCTS_PATH, 'product'),
      fetchStories(COLLECTIONS_PATH, 'shop_collection'),
    ]);
    groups.forEach((stories) =>
      (stories ?? []).forEach((story) => {
        if (story.content) byFullSlug.set(story.full_slug, story.content);
      })
    );
  } catch (error) {
    // Fatal. An empty map is indistinguishable from "nothing exists yet", so
    // carrying on would send every PUT with no merge base and strip the exact
    // CMS-only fields this map exists to protect — collection images and
    // editor-curated featured/SEO. An expired preview token, a token pointing
    // at another space, or a transient Storyblok outage all land here.
    throw new Error(
      `Could not read existing content (${error.message}). ` +
        'Refusing to continue — updates would overwrite CMS-authored fields.'
    );
  }
  return byFullSlug;
}

/**
 * Images each product currently has *published*, keyed by slug.
 *
 * Used only for products the run skips because they carry unpublished edits.
 * Their draft content may contain artwork nobody has approved, and a collection
 * cover is published immediately — so the cover must be chosen from what is
 * already live, never from the draft.
 */
async function fetchPublishedProductState() {
  const bySlug = new Map();
  const stories =
    (await fetchStories(PRODUCTS_PATH, 'product', 'published')) ?? [];
  stories.forEach((story) => {
    bySlug.set(story.slug, {
      images: story.content?.images ?? [],
      inStock: story.content?.in_stock !== false,
      featured: story.content?.featured === true,
    });
  });
  return bySlug;
}

async function seedAssetCache(assetCache) {
  if (!process.env.STORYBLOK_TOKEN) {
    console.log(
      'ℹ️  STORYBLOK_TOKEN not set — existing images cannot be reused.'
    );
    return;
  }

  try {
    const stories = (await fetchStories(PRODUCTS_PATH, 'product')) ?? [];

    stories.forEach((story) => {
      (story.content?.images ?? []).forEach((asset) => {
        if (!asset?.filename) return;
        if (asset.source) assetCache.set(asset.source, asset);
        assetCache.set(asset.filename.split('/').pop(), asset);
      });
    });

    if (assetCache.size) {
      console.log(
        `♻️  Reusing ${assetCache.size} already-uploaded image refs.`
      );
    }
  } catch (error) {
    // Non-fatal: worst case is re-uploading images.
    console.warn(`⚠️  Could not seed asset cache: ${error.message}`);
  }
}

/**
 * Choose the cover photo for each collection: the first image of a
 * representative product in it.
 *
 * Availability outranks being featured. A featured product can sell out, and
 * fronting a brand with something nobody can buy is worse than fronting it with
 * an ordinary item that is in stock — so `featured` only breaks ties among
 * products of the same availability. Ordering is by slug rather than catalog
 * order so the pick is stable between runs and does not shuffle the shop page.
 *
 * Without this every collection card falls back to the generic outline icon in
 * shop/index.astro, which is what the "Browse by Brand" grid was showing.
 */
function pickCollectionCovers(
  records,
  imagesBySlug,
  stockBySlug,
  featuredBySlug,
  existingContent
) {
  // `stockBySlug` overrides Shopify's value for products whose stock was not
  // written this run, so ranking reflects what the site actually serves.
  const inStock = (record) =>
    stockBySlug?.has(record.slug)
      ? stockBySlug.get(record.slug)
      : record.inStock;

  // `featured` is editor-owned and only seeded on create, so the persisted
  // value is what counts. Ranking on the FEATURED_SLUGS seed instead would
  // ignore an editor's change — fronting a brand with a product they
  // unfeatured, or overlooking the one they promoted.
  const isFeatured = (record) => {
    // Skipped products expose their *published* flag, for the same reason as
    // stock: a draft change to `featured` must not move a collection cover and
    // publish it while the product itself is being held back.
    if (featuredBySlug?.has(record.slug))
      return featuredBySlug.get(record.slug);
    const stored = existingContent?.get(`${PRODUCTS_PATH}${record.slug}`);
    return stored ? stored.featured === true : FEATURED_SLUGS.has(record.slug);
  };

  const rank = (record) =>
    (inStock(record) ? 0 : 2) + (isFeatured(record) ? 0 : 1);
  const covers = new Map();

  [...records]
    .sort((a, b) => rank(a) - rank(b) || a.slug.localeCompare(b.slug))
    .forEach((record) => {
      if (covers.has(record.brand)) return;
      const cover = (imagesBySlug.get(record.slug) ?? [])[0];
      if (cover) covers.set(record.brand, cover);
    });

  return covers;
}

async function migrateCollections(
  collections,
  parentId,
  existing,
  existingContent,
  covers
) {
  for (const collection of collections) {
    const fullSlug = `${COLLECTIONS_PATH}${collection.slug}`;
    const current = existingContent?.get(fullSlug)?.image;
    const cover = covers?.get(collection.slug);

    /*
     * Three cases, distinguished by the marker written into the asset's `title`:
     *   - no image        -> seed one
     *   - auto-seeded     -> re-seed, so a cover whose product has since sold
     *                        out or been deleted gets re-ranked instead of
     *                        advertising something unavailable forever
     *   - editor's image  -> leave alone; a curated choice outranks the
     *                        automatic one
     * Without the marker the second and third cases are indistinguishable.
     */
    const isAuto = current?.title === AUTO_COVER_MARK;
    const mayReplace = !current?.filename || isAuto;
    // An empty patch would let the merge carry the old image forward, so when an
    // auto cover can no longer be justified — its product deleted, or nothing
    // left in the collection has a photo — it is cleared explicitly rather than
    // left advertising something that is gone.
    let image = {};
    if (mayReplace && cover) {
      image = { image: { ...cover, title: AUTO_COVER_MARK } };
    } else if (isAuto && !cover) {
      image = { image: null };
    }

    await upsertStory({
      fullSlug,
      name: collection.title,
      slug: collection.slug,
      parentId,
      existing,
      existingContent,
      content: {
        component: 'shop_collection',
        title: collection.title,
        description: collection.description,
        ...image,
      },
    });
  }
}

/**
 * Report product stories that no longer correspond to anything in Shopify —
 * left behind when a product is deleted, renamed (slugs derive from titles, so
 * a rename creates a new story), or loses a variant.
 *
 * This matters beyond tidiness: `/api/shop/checkout` reads price and stock from
 * *published* CMS content, so an orphan stays purchasable at its old price.
 *
 * Orphans are only reported by default, never removed. Products may legitimately
 * be authored directly in Storyblok — that is the point of moving the catalog
 * into the CMS — and those must not be destroyed by a Shopify sync. Pass
 * `--prune` to unpublish the orphans (content is retained, just not sellable).
 */
async function reconcileOrphanProducts(records, existing) {
  const desired = new Set(
    records.map((record) => `${PRODUCTS_PATH}${record.slug}`)
  );
  const orphans = [...existing.entries()].filter(
    ([fullSlug, story]) =>
      fullSlug.startsWith(PRODUCTS_PATH) &&
      !story.is_folder &&
      !desired.has(fullSlug)
  );

  if (!orphans.length) return;

  console.log(
    `\n⚠️  ${orphans.length} product story(ies) not present in Shopify:`
  );
  for (const [fullSlug, story] of orphans) {
    // `published` alone decides whether a live version is being served. A story
    // with unpublished draft edits still serves its last published version, so
    // it remains purchasable and must not be reported as a harmless draft.
    const label = story.published
      ? story.unpublished_changes
        ? '  [PUBLISHED (with draft edits) — still purchasable]'
        : '  [PUBLISHED — still purchasable]'
      : '  [draft]';
    console.log(`   ${fullSlug}${label}`);

    if (!PRUNE || DRY_RUN) continue;
    if (!story.published) continue;

    await mapi('GET', `stories/${story.id}/unpublish`);
    console.log('     ↳ unpublished');
    await sleep(180);
  }

  if (!PRUNE) {
    console.log(
      '   Re-run with --prune to unpublish these, or remove them in Storyblok.'
    );
  }
}

async function migrateProducts(
  records,
  parentId,
  existing,
  assetCache,
  existingContent,
  publishedState
) {
  const imagesBySlug = new Map();
  const stockBySlug = new Map();
  const featuredBySlug = new Map();

  for (const record of records) {
    const fullSlug = `${PRODUCTS_PATH}${record.slug}`;

    // Checked before uploading, not inside upsertStory: images pushed for a
    // story that is then skipped are referenced by nothing, so seedAssetCache
    // never sees them and every later run uploads them again.
    if (hasUnpublishedEdits(existing, fullSlug)) {
      reportSkippedDraft(fullSlug);
      // Contribute the product's *published* images so the cover ranking is
      // unchanged by an in-flight draft — a collection whose best
      // representative happens to be mid-edit should not silently demote and
      // flip back next run. Published, not draft: a collection cover is
      // published immediately, so drafting new artwork must not push it live.
      const live = publishedState?.get(record.slug);
      if (live?.images?.length) imagesBySlug.set(record.slug, live.images);
      // Rank it on the stock the site is actually serving, too. Its `in_stock`
      // is deliberately not written this run, so ranking on Shopify's newer
      // value could front a collection with something the live page still
      // shows as sold out.
      if (live) {
        stockBySlug.set(record.slug, live.inStock);
        featuredBySlug.set(record.slug, live.featured);
      }
      continue;
    }

    const images = [];
    if (!DRY_RUN) {
      for (const image of record.images) {
        images.push(await uploadImage(image, assetCache));
      }
    }
    imagesBySlug.set(record.slug, images);

    // `featured` and `seo_description` are merchandising controls owned by the
    // editor — the schema calls the latter an override, and the homepage rail
    // treats the former as an editorial pick. Seed them when first creating a
    // product, then leave them alone: re-imposing them on every sync would undo
    // curation each time the catalog is refreshed. Everything else is
    // Shopify-sourced and is meant to be overwritten.
    const isNew = !existingContent?.has(fullSlug);
    const editorial = isNew
      ? {
          featured: FEATURED_SLUGS.has(record.slug),
          seo_description: seoDescription(record.description),
        }
      : {};

    await upsertStory({
      fullSlug,
      name: record.name,
      slug: record.slug,
      parentId,
      existing,
      existingContent,
      dryRunImageCount: record.images.length,
      content: {
        component: 'product',
        name: record.name,
        price_sgd: record.price,
        description: record.description,
        images,
        brand: record.brand,
        product_type: record.productType,
        in_stock: record.inStock,
        ...editorial,
      },
    });
  }

  return { imagesBySlug, stockBySlug, featuredBySlug };
}

async function fetchExistingShopStories() {
  const byFullSlug = new Map();
  // 50 pages, matching the other paginated reads. A story missing from this map
  // is treated as new and sent down the create path, which duplicates a slug
  // that already exists rather than updating it.
  for (let page = 1; page <= 50; page += 1) {
    const { stories } = await mapi(
      'GET',
      `stories?starts_with=shop/&per_page=100&page=${page}`
    );
    if (!stories?.length) break;
    stories.forEach((story) => byFullSlug.set(story.full_slug, story));
    if (stories.length < 100) break;
  }
  // The `shop` root folder itself is not matched by starts_with=shop/.
  try {
    const { stories } = await mapi('GET', 'stories?with_slug=shop&per_page=1');
    stories?.forEach((story) => byFullSlug.set(story.full_slug, story));
  } catch {
    /* root folder may not exist yet */
  }
  return byFullSlug;
}

async function ensureFolder(slug, name, parentId, existing) {
  const found = existing.get(slug);
  if (found) return found.id;
  if (DRY_RUN) {
    console.log(`  [dry-run] would create folder ${slug}`);
    return null;
  }
  const { story } = await mapi('POST', 'stories', {
    story: {
      name,
      slug: slug.split('/').pop(),
      is_folder: true,
      parent_id: parentId ?? undefined,
      content: {},
    },
  });
  console.log(`  📁 created folder ${slug}`);
  await sleep(150);
  return story.id;
}

/**
 * True when a story has editor changes saved but not published. The migration
 * must not touch these: the merge base is draft content, so writing would fold
 * the unpublished edits into the payload and `publish: 1` would push them live.
 */
function hasUnpublishedEdits(existing, fullSlug) {
  return Boolean(existing.get(fullSlug)?.unpublished_changes);
}

function reportSkippedDraft(fullSlug) {
  warnings.push(
    `Skipped ${fullSlug} — it has unpublished editor changes. ` +
      'Publish or discard them in Storyblok, then re-run to sync it.'
  );
  console.log(`  ⏭️  skipped ${fullSlug} (unpublished editor changes)`);
}

async function upsertStory({
  fullSlug,
  name,
  slug,
  parentId,
  content,
  existing,
  existingContent,
  dryRunImageCount = 0,
}) {
  const found = existing.get(fullSlug);

  // Never publish an editor's work-in-progress. The merge base is draft
  // content, so a story with saved-but-unpublished edits would have those edits
  // folded into this payload and pushed live by `publish: 1` — a catalog sync
  // silently publishing something nobody approved. Skip it and say so; the
  // product syncs on the next run once the draft is published or discarded.
  if (hasUnpublishedEdits(existing, fullSlug)) {
    reportSkippedDraft(fullSlug);
    return;
  }

  // Merge over whatever is already there so fields the migration does not
  // manage survive. `shop_collection.image` is the concrete case: it exists in
  // the schema for editors to set and is never written here, so a replacing
  // PUT would silently wipe it on every run.
  const merged = { ...(existingContent?.get(fullSlug) ?? {}), ...content };
  const payload = {
    story: { name, slug, content: merged, parent_id: parentId ?? undefined },
    publish: 1,
  };

  if (DRY_RUN) {
    console.log(`  [dry-run] would ${found ? 'update' : 'create'} ${fullSlug}`);
    if (VERBOSE && content.component === 'product') {
      console.log(
        `      price=${content.price_sgd} type=${content.product_type} ` +
          `brand=${content.brand} stock=${content.in_stock} ` +
          `imgs=${content.images.length || dryRunImageCount} ` +
          `desc=${content.description.length}ch`
      );
      // Omitted for existing products, whose editor-set value is preserved.
      console.log(
        content.seo_description === undefined
          ? '      seo=<kept from CMS>'
          : `      seo="${content.seo_description.slice(0, 100)}"`
      );
    }
    return;
  }

  if (found) {
    await mapi('PUT', `stories/${found.id}`, payload);
    console.log(`  ♻️  updated ${fullSlug}`);
  } else {
    await mapi('POST', 'stories', payload);
    console.log(`  ✅ created ${fullSlug}`);
  }
  await sleep(180);
}

async function main() {
  console.log(
    `\n🛒 Shopify → Storyblok catalog migration${DRY_RUN ? ' (DRY RUN)' : ''}\n`
  );

  await assertSpacesMatch();
  const shopifyProducts = await fetchShopifyCatalog();
  console.log(`Fetched ${shopifyProducts.length} products from Shopify.`);

  const records = buildProductRecords(shopifyProducts);
  assertUniqueSlugs(records);
  console.log(
    `Expanded to ${records.length} Storyblok products (colour variants split).\n`
  );

  const usedBrands = new Set(records.map((record) => record.brand));
  /*
   * Every known brand is processed, not just those with Shopify products this
   * run. A brand whose last Shopify product is deleted still needs its
   * collection maintained — otherwise a stale automatic cover is never
   * refreshed or cleared, and the tile keeps advertising a product that is
   * gone. Collections with no products at all are filtered out downstream by
   * shopClient, so this cannot surface an empty one.
   */
  const collections = COLLECTIONS;
  const orphanBrands = [...usedBrands].filter(
    (brand) => !COLLECTIONS.some((collection) => collection.slug === brand)
  );
  orphanBrands.forEach((brand) =>
    warnings.push(`Brand "${brand}" has no collection definition`)
  );

  console.log('Products per collection:');
  collections.forEach((collection) => {
    const count = records.filter((r) => r.brand === collection.slug).length;
    console.log(`  ${collection.slug.padEnd(12)} ${count}`);
  });
  console.log();

  const existing = await fetchExistingShopStories();
  const existingContent = await fetchExistingContent();

  // Folders
  const shopId = await ensureFolder('shop', 'Shop', null, existing);
  const productsId = await ensureFolder(
    'shop/products',
    'Products',
    shopId,
    existing
  );
  const collectionsId = await ensureFolder(
    'shop/collections',
    'Collections',
    shopId,
    existing
  );

  // Products first: their uploaded images are what the collection covers are
  // chosen from, so collections cannot be written until the assets exist.
  console.log('\nProducts:');
  const assetCache = new Map();
  if (!DRY_RUN) await seedAssetCache(assetCache);
  const { imagesBySlug, stockBySlug, featuredBySlug } = await migrateProducts(
    records,
    productsId,
    existing,
    assetCache,
    existingContent,
    await fetchPublishedProductState()
  );
  await reconcileOrphanProducts(records, existing);

  console.log('\nCollections:');
  await migrateCollections(
    collections,
    collectionsId,
    existing,
    existingContent,
    pickCollectionCovers(
      records,
      imagesBySlug,
      stockBySlug,
      featuredBySlug,
      existingContent
    )
  );

  console.log(
    `\n✨ Done — ${collections.length} collections, ${records.length} products.`
  );
  console.log(
    `   ${stats.uploaded} images uploaded, ${stats.reused} reused from Storyblok.`
  );

  if (warnings.length) {
    console.log('\n⚠️  Warnings:');
    [...new Set(warnings)].forEach((warning) => console.log(`   - ${warning}`));
  }
}

main().catch((error) => {
  console.error(`\n❌ Migration failed: ${error.message}`);
  process.exit(1);
});
