// eslint-disable-next-line @typescript-eslint/triple-slash-reference -- Astro convention for generated types
/// <reference path="../.astro/types.d.ts" />

/** Cloudflare runtime bindings/secrets available via `Astro.locals.runtime.env`. */
interface CloudflareEnv {
  STORYBLOK_TOKEN?: string;
  HITPAY_API_KEY?: string;
  HITPAY_SALT?: string;
  HITPAY_API_URL?: string;
  RESEND_API_KEY?: string;
  SHOP_ORDER_EMAIL?: string;
  SHOP_EMAIL_FROM?: string;
}

type CloudflareRuntime = import('@astrojs/cloudflare').Runtime<CloudflareEnv>;

declare namespace App {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface Locals extends CloudflareRuntime {}
}
