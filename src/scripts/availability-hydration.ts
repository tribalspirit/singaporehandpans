/**
 * Client-side availability hydration
 * Fetches live availability from /api/acuity/availability and updates badges + CTAs
 */
document.addEventListener('DOMContentLoaded', () => {
  const elements = document.querySelectorAll<HTMLElement>(
    '[data-acuity-class-id]'
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

      const res = await fetch(`/api/acuity/availability?${params}`);
      if (!res.ok) return;

      const data = await res.json();
      const { status, slotsAvailable } = data;

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

      // Disable CTA if sold out
      if (status === 'sold_out') {
        const cta = el.querySelector<HTMLElement>('[data-booking-cta]');
        if (cta) {
          cta.classList.add('home-event-card__cta--disabled');
          cta.setAttribute('aria-disabled', 'true');
          cta.removeAttribute('href');
          cta.textContent = 'Sold Out';
        }
      }
    } catch {
      // Silently fail — Storyblok data remains as fallback
    }
  });
});
