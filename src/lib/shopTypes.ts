/**
 * Shared shop domain types.
 *
 * Both shop implementations (Shopify Storefront and Storyblok+HitPay) produce
 * these exact shapes so pages and islands consume one contract regardless of
 * the active backend. Fields only one backend can supply are optional:
 * `images`, `brand`, `featured`, and `seoDescription` are populated by the
 * Storyblok/HitPay implementation and absent under Shopify.
 */

export type ShopMoney = { amount: number; currencyCode: string };
export type ShopImage = { url: string; altText?: string };

export type ShopProduct = {
  id: string;
  title: string;
  handle: string;
  productType: string;
  description: string;
  availableForSale: boolean;
  priceMin: ShopMoney;
  priceMax?: ShopMoney;
  image?: ShopImage;
  /** Absolute (external Shopify) or relative (internal HitPay) product URL. */
  shopUrl: string;
  tags: string[];
  // Storyblok/HitPay-only extras (absent under Shopify):
  images?: ShopImage[];
  brand?: string;
  featured?: boolean;
  seoDescription?: string;
};

export type ShopCollection = {
  id: string;
  title: string;
  handle: string;
  description: string;
  image?: ShopImage;
  productCount: number;
};
