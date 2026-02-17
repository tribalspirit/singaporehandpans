import type { APIRoute } from 'astro';
import {
  getClassAvailability,
  computeAvailabilityStatus,
} from '../../../lib/acuity-client';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const classId = url.searchParams.get('classId');
  const appointmentTypeId = url.searchParams.get('appointmentTypeId');
  const month = url.searchParams.get('month');

  if (!appointmentTypeId) {
    return new Response(
      JSON.stringify({
        error: 'Missing required parameter: appointmentTypeId',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Default to current month if not specified
  const targetMonth = month || new Date().toISOString().slice(0, 7);

  try {
    const slots = await getClassAvailability(appointmentTypeId, targetMonth);

    // Find the specific class slot if classId is provided, otherwise aggregate
    let slotsAvailable = 0;
    if (classId) {
      const matchingSlot = slots.find((s) => String(s.id) === classId);
      slotsAvailable = matchingSlot?.slotsAvailable ?? 0;
    } else {
      // Sum available slots across all instances this month
      slotsAvailable = slots.reduce((sum, s) => sum + s.slotsAvailable, 0);
    }

    const status = computeAvailabilityStatus(slotsAvailable);

    return new Response(
      JSON.stringify({
        classId: classId || null,
        appointmentTypeId,
        month: targetMonth,
        slotsAvailable,
        status,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=30',
        },
      }
    );
  } catch (error) {
    console.error('Acuity availability error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch availability' }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
