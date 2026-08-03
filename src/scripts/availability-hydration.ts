/**
 * Client-side availability hydration
 * Fetches live availability from /api/acuity/availability and updates badges + CTAs
 */
document.addEventListener('DOMContentLoaded', () => {
  // Selected by appointment type, not class id: a recurring series carries no
  // class id (its first instance has already run), so selecting on that would
  // skip exactly the cards that need the live lookup. The appointment type is
  // present whenever Acuity is configured at all, and the per-element guard
  // below still requires it.
  const elements = document.querySelectorAll<HTMLElement>(
    '[data-acuity-appointment-type-id]'
  );
  if (!elements.length) return;

  const labels: Record<string, string> = {
    available: 'Available',
    few_spots: 'Few Spots Left',
    sold_out: 'Sold Out',
  };

  elements.forEach(async (el) => {
    const classId = el.dataset.acuityClassId;
    const appointmentTypeId = el.dataset.acuityAppointmentTypeId;
    if (!appointmentTypeId) return;

    try {
      const params = new URLSearchParams({ appointmentTypeId });
      if (classId) params.set('classId', classId);
      // A recurring series sends no classId (its first instance has long since
      // run). It sends the exact start of its next session instead, so the API
      // resolves that one slot rather than summing the month — which would
      // report a later open session's seats against a sold-out "Next".
      if (el.dataset.acuityMonth) params.set('month', el.dataset.acuityMonth);
      if (el.dataset.acuityTime) params.set('time', el.dataset.acuityTime);

      const res = await fetch(`/api/acuity/availability?${params}`);
      if (!res.ok) return;

      const data = await res.json();
      const { status, slotsAvailable } = data;
      // null means the session could not be resolved — unknown, not empty.
      // Leave the CMS-authored badge and booking link untouched.
      if (!status) return;

      // Update badge
      const badge = el.querySelector<HTMLElement>('[data-availability-badge]');
      if (badge) {
        badge.textContent = labels[status] || status;
        badge.className = badge.className.replace(
          /--(?:available|few_spots|sold_out)/,
          `--${status}`
        );
      }

      // Update dot
      const dot = el.querySelector<HTMLElement>('[data-availability-dot]');
      if (dot) {
        dot.className = dot.className.replace(
          /--(?:available|few_spots|sold_out)/,
          `--${status}`
        );
      }

      // Update spots remaining text
      const spotsEl = el.querySelector<HTMLElement>('[data-spots-remaining]');
      if (spotsEl && slotsAvailable > 0) {
        spotsEl.textContent = `${slotsAvailable} spot${slotsAvailable === 1 ? '' : 's'} left`;
      }

      // Reconcile the CTA in BOTH directions. It used to only ever disable, so
      // a card rendered sold-out from a stale CMS value stayed unbookable even
      // when the live lookup found seats. That could not happen while every
      // occurrence was its own story, but a series keeps one story — and its
      // availability_status is only ever refreshed by a webhook carrying the
      // first instance's class id, which later sessions never match.
      const cta = el.querySelector<HTMLElement>('[data-booking-cta]');
      const bookingUrl = el.dataset.bookingUrl;
      // An explicit editorial sold-out always wins over live data.
      const forcedSoldOut = el.dataset.soldOutOverride === 'true';

      if (cta) {
        const baseClass = cta.dataset.ctaClass || '';
        const disabledClass = cta.dataset.ctaDisabledClass || '';
        const shouldDisable = status === 'sold_out' || forcedSoldOut;
        const isDisabled = cta.tagName === 'SPAN';

        // The element is swapped rather than mutated: a bookable CTA must be a
        // real <a href>, and an href-less <a> is not keyboard accessible, so
        // the two states cannot be the same tag.
        if (shouldDisable !== isDisabled && (shouldDisable || bookingUrl)) {
          const next = document.createElement(shouldDisable ? 'span' : 'a');
          next.className = shouldDisable
            ? `${baseClass} ${disabledClass}`.trim()
            : baseClass;
          next.textContent = shouldDisable ? 'Sold Out' : 'Book Now';
          next.dataset.bookingCta = '';
          if (baseClass) next.dataset.ctaClass = baseClass;
          if (disabledClass) next.dataset.ctaDisabledClass = disabledClass;
          if (!shouldDisable && bookingUrl) {
            next.setAttribute('href', bookingUrl);
            next.setAttribute('target', '_blank');
            next.setAttribute('rel', 'noopener noreferrer');
          }
          cta.replaceWith(next);
        }
      }
    } catch {
      // Silently fail — Storyblok data remains as fallback
    }
  });
});
