/**
 * The studio's Google reviews, transcribed verbatim.
 *
 * WHY A LOCAL MODULE RATHER THAN AN API
 * The Places API caps `places.reviews` at five per place — Google's own "most
 * relevant" selection — so it cannot back a page like `/reviews/` however much
 * is paid for it. The complete set is only reachable through the Business
 * Profile API (`accounts.locations.reviews.list`), which needs OAuth as the
 * listing's owner. Until that is set up, a committed file is both cheaper and
 * more honest: what the site claims is reviewable in the diff.
 *
 * ORDER
 * Editorial, not chronological. `selectFeaturedReviews` reads flagged entries
 * first in array order, so the first `featured: true` entry below is the lead
 * quote on the homepage and the opening entry on `/reviews/`. Every review
 * displays its own date, so the array order promises nothing about recency.
 *
 * HOW TO ADD ONE
 * 1. Open the listing (`GOOGLE_REVIEWS_URL` below).
 * 2. Copy the text VERBATIM — no tidying of grammar, spelling, emoji or tone,
 *    and no cherry-picking a flattering half of a mixed review. These are other
 *    people's words, republishing them edited breaches Google's terms, and
 *    shortening for the homepage is `excerptReviewText`'s job, which marks the
 *    cut with an ellipsis. Separate paragraphs with a blank line (`\n\n`).
 * 3. Resolve Google's relative date ("7 months ago") to a `YYYY-MM` month, so
 *    the page does not age.
 * 4. Update `GOOGLE_REVIEW_AGGREGATE` to the rating and count the listing then
 *    shows. Those two numbers are what the site displays; the entries here are
 *    only the ones quoted in full.
 * 5. Flag at most three with `featured: true` — those are the homepage widget.
 */
import type { ReviewAggregate, StudioReview } from '../lib/reviews';

/**
 * The listing's Place ID, confirmed from Google's place-details payload
 * (CID 8307370990084872295). Google builds its own review URLs from this, which
 * is the only reliable way to deep-link both to the reviews pane and to the
 * review form.
 */
const GOOGLE_PLACE_ID = 'ChIJ82BwitIZ2jERZ9hksea1SXM';

/** Opens the listing's reviews. */
export const GOOGLE_REVIEWS_URL = `https://search.google.com/local/reviews?placeid=${GOOGLE_PLACE_ID}`;

/** Opens the review form with the rating stars ready. */
export const GOOGLE_WRITE_REVIEW_URL = `https://search.google.com/local/writereview?placeid=${GOOGLE_PLACE_ID}`;

/**
 * The studio-wide figures as the listing states them — not computed from the
 * entries below, which are a curated subset of 52. The histogram behind this is
 * 52 five-star reviews and nothing else, which is why the rating is a flat 5.0.
 *
 * Re-check this whenever a review is added; `summariseReviews` will not let the
 * count fall below the number actually shown, but it cannot detect a count that
 * has simply gone stale.
 */
export const GOOGLE_REVIEW_AGGREGATE: ReviewAggregate | null = {
  rating: 5,
  count: 52,
};

/**
 * Nothing here may be paraphrased or invented: every character is someone's
 * actual review, as published on the listing.
 *
 * Dates are derived from the timestamps in Google's payload rather than read off
 * the page, which shows only a relative age ("11 months ago"). They are accurate
 * to the month in every case checked against the relative age, but a given month
 * may be out by one — correct any that matter against the Business Profile.
 */
export const STUDIO_REVIEWS: StudioReview[] = [
  {
    id: 'dorothy-p',
    author: 'Dorothy P',
    rating: 5,
    date: '2025-10',
    text: "Yana has built an amazing community around the love of handpan where anyone interested can come try out all the different kinds of handpans and learn together. She really tailors the experience and recommends what is best fit for each individual, giving them a gentle space to grow and explore. There is a lot of soul in the circles held - this isn't your usual music lesson, and your journey isn't linear, which makes it all the more wonderful. The studio is a sun drenched, cozy space that has housed many a fun session and rehearsals, and much more with visiting players from around the world! Great for anyone who wants to explore more on handpans.",
    featured: true,
  },
  {
    id: 'leyi-xu',
    author: 'Leyi Xu',
    rating: 5,
    date: '2025-10',
    text: "I'm truly blessed to have met Yana and started my handpan journey with her and the community's support. Yana is loving, caring, and she has the super power to make things not only happen but beyond expectations. It's not easy to find someone who inspires you nowadays but I get sparkles from Yana every time I see her. The studio is cosy and intimate, with amazing choice of instruments, please come and check it out if you are in Singapore!",
    featured: true,
  },
  {
    id: 'erica-chan',
    author: 'Erica Chan',
    rating: 5,
    date: '2026-02',
    text: "I attended handpan classes. They even organized amazing outdoor handpan sessions at east coast park and Handpan retreat trip to Bali, learning from many great teachers and watch Malte Marten together - it's super cool and meeting very nice people too! They even have private chef cooking vegetarian lunch options provided - super nice! Amazing experience. I even bought my handpan from Teacher Yana - there are a wide variety of handpan you can try out before you confirm which one you wanna buy, which is very useful for me. Highly recommend if you want to learn handpan.",
    featured: true,
  },
  {
    id: 'svetlana-rao',
    author: 'Svetlana Rao',
    rating: 5,
    date: '2026-04',
    text: "I just want to express my deepest gratitude to Yana for such a beautiful and enriching handpan experience.💗\n\nFrom the moment you step into the studio, you feel genuinely welcomed — there is a warmth in the space that instantly puts you at ease. Yana is not only an incredibly skilled and professional teacher, but also someone who teaches with true presence. She is attentive to every single participant, making each person feel seen, supported, and valued.\n\nWhat truly stands out is her devotion. It's rare to meet someone so deeply passionate about what they do. Yana's love for the handpan is undeniable, and it translates into every class, every interaction, and every opportunity she creates for her students.\n\nShe goes above and beyond — consistently bringing in exceptional teachers for masterclasses, curating experiences with so much care and intention, purely out of her passion for sharing this instrument and this art.\n\nIf you are even slightly curious about learning the handpan, I wholeheartedly recommend Yana and the Singapore Handpan Studio. It's more than just a place to learn — it's a space to feel inspired, supported, and truly connected to the music.",
  },
  {
    id: 'melvin-lim',
    author: 'Melvin Lim',
    rating: 5,
    date: '2026-01',
    text: "I took my first series of handpan lessons with Yana in October 2025, and I've found myself drawn back to her cozy handpan studio time and again as I continue my handpan journey. Yana's lessons are easy to follow, and her calm, gentle presence is a beautiful reminder to relax, stay present, and flow naturally while playing the handpan.\n\nThere is truly no shortage of things to learn. Yana regularly brings in renowned teachers from around the world, offering opportunities for players of all levels to go deeper and refine their skills and techniques. She also hosts events that combine the handpan with other instruments, which is perfect for anyone looking to expand their musical horizons.\n\nOn top of that, Yana also offers private group lessons, which are a wonderful way to experience the handpan together with friends, family, or colleagues. These sessions feel relaxed, supportive, and fun, making them ideal whether you're all completely new or looking to grow together musically.\n\nShe also offers handpan rentals and has quality instruments from various makers available for purchase, making it easy to continue practicing and deepening your connection with the instrument beyond the studio.",
  },
];
