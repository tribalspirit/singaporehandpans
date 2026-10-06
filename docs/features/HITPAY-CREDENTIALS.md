# HitPay Credentials — What We Need From You

**Who this is for:** the business owner / product owner of Singapore Handpan Studio.
**Time needed:** about 15 minutes for Part 1. Part 2 depends on how fast HitPay verifies the business.

## Why we need this

The online shop takes payment through HitPay. When a customer clicks "Pay", our website hands the
order over to HitPay, and HitPay shows its own secure payment page (PayNow QR and credit cards).
For our website to talk to your HitPay account, it needs three short text values from the HitPay
dashboard — an address, a key, and a "salt". Without them the shop cannot take money. We need a
**test (sandbox)** set now so we can build and test safely with fake money, and a **live
(production)** set later, just before launch.

---

> ## ⚠️ SECURITY — please read before you send anything
>
> These three values are **secrets**. Anyone who has them can create charges on your HitPay
> account and impersonate payment confirmations.
>
> - **Do NOT** send them in a normal email, WhatsApp, Telegram, Slack, or a Google Doc link.
> - **DO** send them through a password manager share (1Password, Bitwarden, Dashlane — a
>   "share item" or "one-time secret link"), or another encrypted channel we agree on.
> - If you are unsure how, tell us and we will send you a one-time secret link you can paste into.
> - Once we have them, we store them as **encrypted Cloudflare Pages secrets**. They are never
>   written into the website's code, never committed to the code repository, and never visible in
>   the browser.
> - If a value is ever exposed by accident, tell us — HitPay lets you regenerate the key, and we
>   swap it over in minutes.

**What we do with these:** we use them only on our server, to create a payment on HitPay and to
verify that HitPay's "payment successful" message is genuine. **Our website never sees, handles or
stores card numbers.** The card form lives on HitPay's own page, on HitPay's servers.

---

## The three values we need (for each environment)

| Name             | What it is                                                                               | Example / where it comes from                                                                                                             |
| ---------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `HITPAY_API_URL` | Which HitPay system to talk to                                                           | `https://api.sandbox.hit-pay.com` (test) or `https://api.hit-pay.com` (live) — **we already know these, you do not need to look them up** |
| `HITPAY_API_KEY` | The key that proves the request came from your business                                  | Copied from the HitPay dashboard                                                                                                          |
| `HITPAY_SALT`    | A second secret used to check that "payment successful" messages really came from HitPay | Shown on the same dashboard page as the API key                                                                                           |

---

# Part 1 — Sandbox (needed now)

Sandbox is HitPay's free practice environment. It uses fake money and fake cards, so nothing here
can cost you anything. **It is a completely separate account from your real HitPay account** — a
different signup, a different login, different keys. You cannot convert one into the other.

1. Open **<https://dashboard.sandbox.hit-pay.com/register>** in your browser.
2. Register a sandbox account. Use a business email you can access. You do **not** need to submit
   company documents or bank details for sandbox — it is a test environment.
3. Confirm your email if HitPay asks you to, then log in at
   **<https://dashboard.sandbox.hit-pay.com>**.
4. In the dashboard, go to **Settings → API Keys**.
   - HitPay has renamed this area more than once. If you do not see it there, look for
     **Settings → Payment Gateway → API Keys**, or a **Developers** section in the left-hand
     menu. All three names refer to the same page. (See "Things we could not confirm" at the
     bottom — the exact label depends on which dashboard version your account is on.)
5. On that page, click the button to **generate / create an API key** if one is not already shown.
6. Copy down two things from that page:
   - the **API key** (a long string of letters and numbers), and
   - the **Salt** (a second, separate long string — sometimes labelled "Salt value").
     Take both from the **same** page; they are a matched pair.
7. Send them to us using the secure method described in the security box above, using the
   fill-in block at the end of this document.

That is all we need for Part 1. You do not need to configure anything else in the sandbox
dashboard — our website tells HitPay where to send confirmations on every single order.

### Optional: try a test payment yourself

Once we have the shop running against sandbox, we will send you a test link. HitPay's published
test cards are:

- Visa, succeeds: `4242 4242 4242 4242`
- Visa, declined: `4000 0000 0000 0002`
- Mastercard: `5555 5555 5555 4444`
- American Express: `3782 822463 10005`

Any future expiry date and any 3-digit code will do. For PayNow, the sandbox shows a QR code and
simulates a successful payment when you scan it — no real money moves.

---

# Part 2 — Production (needed at launch)

Do this when we are close to going live. Start the verification early, because HitPay's approval
is not instant.

1. Sign up for (or log in to) your real HitPay business account at **<https://www.hitpayapp.com>**.
2. Complete HitPay's business verification (KYC): business details, identity documents, and the
   bank account you want payouts sent to. HitPay's published guidance is that approval typically
   takes **1–3 business days**. API keys are only available once the business is verified.
3. Log in to the live dashboard and go to the same place as in Part 1:
   **Settings → API Keys** (or **Settings → Payment Gateway → API Keys** / the **Developers**
   section, depending on your dashboard version).
4. Generate the live **API key**, and copy the live **Salt** from the same page.
5. Check which payment methods are switched on for your account — we specifically need
   **PayNow** and **cards** enabled, since those are what the shop offers.
6. Send us the live values using the secure method above. **Do not** send them before we ask —
   we will tell you when the launch window is set.

Live keys are different from sandbox keys and will not work in reverse. We keep the two sets in
separate Cloudflare environments (preview vs production), so a test order can never hit your real
account and vice versa.

---

## About the webhook address

After someone pays, HitPay calls our website back to tell it the order is paid. Our site sends
that address to HitPay with each individual order, so **normally there is nothing for you to set
up**. The address we use is:

```
https://singaporehandpans.com/api/shop/hitpay-webhook
```

If, at any point, the HitPay dashboard asks you to register, whitelist, or approve a callback /
webhook URL, paste that exact address. During testing the address will instead be a preview
address ending in `.pages.dev` — we will send you the exact one if it is ever needed.

---

## Copy this block, fill it in, and send it securely

**Part 1 — Sandbox (send now)**

```
HITPAY_API_URL = https://api.sandbox.hit-pay.com
HITPAY_API_KEY = ____________________________________________
HITPAY_SALT    = ____________________________________________

Sandbox dashboard login email: ______________________________
```

**Part 2 — Production (send at launch, only when we ask)**

```
HITPAY_API_URL = https://api.hit-pay.com
HITPAY_API_KEY = ____________________________________________
HITPAY_SALT    = ____________________________________________

Live dashboard login email: _________________________________
Payment methods enabled (PayNow / Cards / other): ___________
```

Leave `HITPAY_API_URL` exactly as printed — those are fixed HitPay addresses, not something you
look up.

---

## Things we could not confirm from HitPay's official documentation

Written honestly so nobody wastes time hunting for a menu that does not exist:

- **The exact menu label for the API key page.** HitPay's current developer documentation says
  **Settings → API Keys**; their own sandbox blog post and their older help-centre article both
  say **Settings → Payment Gateway → API Keys**; their webhooks page refers to a **Developers**
  page. These appear to be the same screen under different dashboard versions. Look for whichever
  exists in your account, and send us a screenshot of the menu if none of them match.
- **Whether the Salt appears on that same screen in the newest dashboard.** HitPay documents two
  different salts: a per-webhook salt (for their newer, dashboard-registered webhooks) and a
  single salt tied to your business API key (used by payment requests, which is what our shop
  uses). We need the **API-key salt**, shown next to the API key. If you see two salts, send us
  both and label them, and we will pick the right one.
- **Whether sandbox signup requires any verification at all.** HitPay describes sandbox as fully
  isolated and free, but does not state the exact signup fields. If it asks for something you are
  not comfortable providing, stop and tell us.

---

## Questions?

Send us a screenshot of the dashboard page you are stuck on — with the secret values blurred or
cropped out — and we will point you to the right button.

_Reference for the dev team: `.env.example`, `src/lib/hitpay.ts`,
`src/pages/api/shop/checkout.ts`, `src/pages/api/shop/hitpay-webhook.ts`._
