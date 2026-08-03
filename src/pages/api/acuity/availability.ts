import type { APIRoute } from 'astro';
import {
  getClassAvailability,
  computeAvailabilityStatus,
  resolveSlotAvailability,
} from '../../../lib/acuity-client';

export const prerender = false;

function jsonResponse(body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=30',
    },
  });
}

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const classId = url.searchParams.get('classId');
  const appointmentTypeId = url.searchParams.get('appointmentTypeId');
  const month = url.searchParams.get('month');
  // Start of the specific session a recurring card advertises. A series cannot
  // use classId (that names its first instance, long since run), and summing
  // the month would report a later open session's seats against a sold-out
  // "Next" — so the session is resolved by its start instant instead.
  const time = url.searchParams.get('time');

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
    const slotsAvailable = resolveSlotAvailability(slots, { classId, time });

    // An unresolved session is unknown, not empty. Reporting zero here is what
    // made a recurring series advertise itself as sold out; a null status tells
    // the client to leave the CMS-authored availability alone.
    if (slotsAvailable === null) {
      return jsonResponse({
        classId: classId || null,
        appointmentTypeId,
        month: targetMonth,
        slotsAvailable: null,
        status: null,
      });
    }

    return jsonResponse({
      classId: classId || null,
      appointmentTypeId,
      month: targetMonth,
      slotsAvailable,
      status: computeAvailabilityStatus(slotsAvailable),
    });
  } catch (error) {
    console.error('Acuity availability error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch availability' }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
