/**
 * Whether a state-changing POST plausibly came from our own pages.
 *
 * Both shop endpoints have side effects worth protecting — one spends a HitPay
 * API call, the other sends mail through the studio's Resend account — so a
 * bare `curl` should not reach them.
 *
 * `Origin` alone is not enough to demand. The Fetch standard requires it on
 * any non-GET request, but Safari omitted it on *same-origin* form submissions
 * for years, and a shop that 403s Safari buyers mid-checkout is a worse
 * outcome than the abuse being prevented. So `Referer` is accepted as a
 * fallback: every browser sends one of the two on a form POST, and a plain
 * scripted request sends neither.
 *
 * This is a speed bump, not a control. Both headers are trivially forged by
 * anything that bothers to. The real control is a Cloudflare WAF rate-limit
 * rule on `/api/shop/*` — see docs/deployment/CLOUDFLARE.md.
 */
export function isSameOriginSubmission(
  request: Request,
  origin: string
): boolean {
  const originHeader = request.headers.get('origin');
  if (originHeader) {
    return originHeader === origin;
  }

  const referer = request.headers.get('referer');
  if (!referer) return false;

  // Compared as a parsed origin, not a prefix: the string `https://ours.com`
  // is also a prefix of `https://ours.com.attacker.example`.
  try {
    return new URL(referer).origin === origin;
  } catch {
    return false;
  }
}
