import type { APIRoute } from 'astro';
import {
  getClassAvailability,
  computeAvailabilityStatus,
} from '../../../lib/acuity-client';
import {
  findEventByAcuityId,
  updateEventAvailability,
} from '../../../lib/storyblok-management';

export const prerender = false;

interface AcuityWebhookPayload {
  action: 'scheduled' | 'rescheduled' | 'canceled' | 'changed';
  id: number;
  calendarID: number;
  appointmentTypeID: number;
  classID?: number;
}

export const POST: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const secret = url.searchParams.get('secret');
  const expectedSecret = import.meta.env.ACUITY_WEBHOOK_SECRET;

  if (!expectedSecret || secret !== expectedSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const payload: AcuityWebhookPayload = await request.json();
    const { action, appointmentTypeID, classID } = payload;

    if (!classID) {
      // Not a class-based appointment, nothing to sync
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(
      `Acuity webhook: ${action} for class ${classID} (type ${appointmentTypeID})`
    );

    // Find the matching Storyblok event
    const story = await findEventByAcuityId(String(classID));
    if (!story) {
      console.warn(`No Storyblok event found for Acuity class ID: ${classID}`);
      return new Response(
        JSON.stringify({ ok: true, message: 'No matching event found' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Query current availability from Acuity
    const currentMonth = new Date().toISOString().slice(0, 7);
    const slots = await getClassAvailability(
      String(appointmentTypeID),
      currentMonth
    );
    const matchingSlot = slots.find((s) => s.id === classID);
    const slotsAvailable = matchingSlot?.slotsAvailable ?? 0;

    const availabilityStatus = computeAvailabilityStatus(slotsAvailable);

    // Update Storyblok
    await updateEventAvailability(story.id, {
      availability_status: availabilityStatus,
      spots_remaining: slotsAvailable,
    });

    console.log(
      `Updated event "${story.name}": ${availabilityStatus} (${slotsAvailable} spots)`
    );

    return new Response(
      JSON.stringify({
        ok: true,
        storyId: story.id,
        availabilityStatus,
        slotsAvailable,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Acuity webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Webhook processing failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
