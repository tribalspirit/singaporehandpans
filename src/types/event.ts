export interface EventContent {
  title: string;
  description: string;
  /**
   * Start date and time, stored by Storyblok as a naive `'YYYY-MM-DD HH:mm'`
   * string with no timezone. Never pass it to `new Date()` directly — use
   * `parseSingaporeDate` / `getEventTiming` from `src/lib/eventDates.ts`, which
   * anchor it to Singapore time instead of the runtime's zone.
   */
  date: string;
  /** End date/time for multi-day events; for a series, the end of session one. */
  end_date?: string;
  /** Repeat pattern. Absent or unknown values are treated as `'none'`. */
  recurrence?: 'none' | 'weekly' | 'biweekly' | 'monthly';
  /** Last date a repeating class runs. Blank means open-ended. */
  recurrence_until?: string;
  location: string;
  price?: string;
  booking_url?: string;
  image?: {
    filename: string;
    alt?: string;
  };
  tags?: string | string[];
  /**
   * Only `'cancelled'` is meaningful (it drives `eventStatus` in the JSON-LD).
   * Upcoming vs past is derived from the dates — every story in the space reads
   * `'upcoming'`, including long-finished ones, so this must never be filtered on.
   */
  status?: string;
  availability_status?: 'available' | 'few_spots' | 'sold_out';
  max_participants?: number;
  seo_title?: string;
  seo_description?: string;
  // Acuity Scheduling fields
  acuity_type?: 'workshop' | 'private';
  acuity_appointment_type_id?: string;
  acuity_class_id?: string;
  sold_out_override?: boolean;
  spots_remaining?: number;
  duration?: number;
}

export interface EventStory {
  /** Storyblok returns a number; the hardcoded CMS fallbacks use a string. */
  id: number | string;
  name: string;
  slug: string;
  uuid?: string;
  full_slug?: string;
  published_at?: string | null;
  first_published_at?: string | null;
  content: EventContent;
}
