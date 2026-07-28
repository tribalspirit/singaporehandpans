/**
 * Shop facade — selects the active shop backend at build time.
 *
 * `PUBLIC_SHOP_IMPL` chooses which catalog/checkout implementation the /shop
 * surface uses:
 *   - 'shopify' (default): external Shopify Storefront API   [production]
 *   - 'hitpay':            Storyblok catalog + HitPay checkout [preview/dev]
 *
 * `PUBLIC_ENABLE_SHOP` remains the master on/off switch for the whole section.
 * Both are Astro `PUBLIC_*` vars, inlined at build time, so the choice is made
 * per deploy — letting production run Shopify while preview runs HitPay from a
 * single, shared codebase.
 *
 * Pages and islands import from this facade, never from a concrete client.
 * The two clients share one `ShopProduct`/`ShopCollection` contract
 * (see shopTypes.ts); the Storyblok `token` argument is used only by HitPay and
 * harmlessly ignored by Shopify.
 */
import * as shopify from './shopifyClient';
import * as hitpay from './shopClient';
import type { ShopProduct, ShopCollection } from './shopTypes';

export type { ShopProduct, ShopCollection } from './shopTypes';

export type ShopImpl = 'shopify' | 'hitpay';

export const SHOP_IMPL: ShopImpl =
  import.meta.env.PUBLIC_SHOP_IMPL === 'hitpay' ? 'hitpay' : 'shopify';

/** Master on/off switch for the entire shop section. */
export function isShopEnabled(): boolean {
  return import.meta.env.PUBLIC_ENABLE_SHOP === 'true';
}

/** True when the Storyblok catalog + HitPay checkout implementation is active. */
export function isHitpayShop(): boolean {
  return SHOP_IMPL === 'hitpay';
}

/**
 * Resolve a product's `shopUrl` to an absolute URL for canonical/structured
 * data. HitPay product URLs are relative (prefix with the site origin); Shopify
 * URLs are already absolute external links and must be used verbatim — prefixing
 * them would produce `https://site.comhttps://store...`.
 */
export function toAbsoluteShopUrl(shopUrl: string, siteBase: string): string {
  return /^https?:\/\//i.test(shopUrl) ? shopUrl : `${siteBase}${shopUrl}`;
}

type AllCollectionsResult = {
  collections: ShopCollection[];
  allProducts: ShopProduct[];
  collectionProductMap: Record<string, string[]>;
};

export function fetchAllProducts(token?: string): Promise<ShopProduct[]> {
  return isHitpayShop()
    ? hitpay.fetchAllProducts(token)
    : shopify.fetchAllProducts();
}

export function fetchAllCollections(
  token?: string
): Promise<AllCollectionsResult> {
  return isHitpayShop()
    ? hitpay.fetchAllCollections(token)
    : shopify.fetchAllCollections();
}

export function fetchCollectionByHandle(
  handle: string,
  token?: string
): Promise<{ collection: ShopCollection | null; products: ShopProduct[] }> {
  return isHitpayShop()
    ? hitpay.fetchCollectionByHandle(token, handle)
    : shopify.fetchCollectionByHandle(handle);
}

/**
 * Product detail pages exist only in the HitPay implementation (Shopify links
 * out to its hosted store). Callers must gate on `isHitpayShop()` first.
 */
export function fetchProductBySlug(
  slug: string,
  token?: string
): Promise<ShopProduct | null> {
  return hitpay.fetchProductBySlug(token, slug);
}
