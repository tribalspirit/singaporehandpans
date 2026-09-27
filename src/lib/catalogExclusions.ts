/**
 * Shopify product handles that must never reach the public catalog.
 *
 * Small shops routinely create a one-off "product" so a named customer can pay
 * a quoted amount, usually by duplicating a real product — so it inherits that
 * product's handle, type and collection, and carries the customer's name as its
 * title. It has to be published to the storefront for the customer to reach the
 * payment page, which means the Storefront API returns it like any other
 * product and it lands in the shop grid, the sitemap and the structured data.
 *
 * The handles live in `catalogExclusions.json` rather than here because
 * `scripts/migrate-shop-catalog.js` is plain JavaScript run outside the Astro
 * build and cannot import this module. One list, two consumers.
 *
 * This filter is a safety net over the storefront, not a fix: the product stays
 * reachable at its own Shopify URL. Unpublishing it from the Online Store sales
 * channel is the actual remedy.
 */
import exclusions from './catalogExclusions.json';

export const EXCLUDED_SHOPIFY_HANDLES: ReadonlySet<string> = new Set(
  exclusions.excludedShopifyHandles
);

export function isExcludedShopifyHandle(handle: string): boolean {
  return EXCLUDED_SHOPIFY_HANDLES.has(handle);
}
