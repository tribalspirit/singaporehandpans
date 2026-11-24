// eslint-disable-next-line @typescript-eslint/triple-slash-reference -- Astro convention for generated types
/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  /**
   * The Handpan Tab Editor's origin, read at build time for the Academy's
   * card that links to its Library. Parsed by `src/lib/tabEditor.ts`; unset
   * or invalid leaves the card out.
   */
  readonly PUBLIC_TAB_EDITOR_ORIGIN?: string;
}

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
