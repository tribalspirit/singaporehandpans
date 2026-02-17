# Acuity Scheduling Integration

Guide for integrating Acuity Scheduling for workshop bookings and private sessions.

## Prerequisites

- Acuity Scheduling account
- Appointment types created in Acuity
- Storyblok CMS configured

## Setup

### 1. Get Your Acuity Credentials

1. Log into [Acuity Scheduling](https://acuityscheduling.com/)
2. Go to **Integrations** > **API Credentials**
3. Note your **User ID** and **API Key**
4. Your **Owner ID** is in your scheduling page URL: `https://app.acuityscheduling.com/schedule.php?owner=YOUR_OWNER_ID`

### 2. Environment Variables

Add to your `.env` file:

```bash
# Client-side (embedded in HTML)
PUBLIC_ACUITY_OWNER_ID=your_owner_id
PUBLIC_ACUITY_WORKSHOP_URL=https://app.acuityscheduling.com/schedule.php?owner=YOUR_ID
PUBLIC_ACUITY_PRIVATE_URL=https://app.acuityscheduling.com/schedule.php?owner=YOUR_ID

# Server-side (API access)
ACUITY_USER_ID=your_user_id
ACUITY_API_KEY=your_api_key
ACUITY_WEBHOOK_SECRET=your_webhook_secret
```

### 3. Create Appointment Types in Acuity

For workshops:

1. Create a **Group Class** appointment type
2. Set capacity, duration, and pricing
3. Note the **Appointment Type ID** (from URL when editing)

For private sessions:

1. Create a regular appointment type
2. Configure available times
3. Note the **Appointment Type ID**

### 4. Configure Events in Storyblok

For each event in Storyblok, fill in these Acuity fields:

| Field                        | Description                                            |
| ---------------------------- | ------------------------------------------------------ |
| `acuity_type`                | "workshop" or "private"                                |
| `acuity_appointment_type_id` | The Acuity appointment type ID                         |
| `acuity_class_id`            | The specific class instance ID (for capacity tracking) |
| `sold_out_override`          | Force sold-out display (overrides Acuity data)         |
| `booking_url`                | Fallback URL if Acuity embed fails                     |

### 5. Set Up Webhooks

1. In Acuity, go to **Integrations** > **API** > **Webhooks**
2. Add a webhook URL: `https://yourdomain.com/api/acuity/webhook?secret=YOUR_SECRET`
3. Select events: **New Appointment**, **Changed**, **Canceled**, **Rescheduled**

## Architecture

### Booking Flow

1. **Static build**: Events rendered with Storyblok `availability_status` (stale but fast)
2. **Client hydration**: `availability-hydration.ts` fetches `/api/acuity/availability` for live data
3. **Webhook sync**: Acuity POSTs to `/api/acuity/webhook` on booking changes, updates Storyblok

### Components

- `AcuityEmbed.astro` — Inline iframe or button link to Acuity scheduling
- `acuity-client.ts` — Server-side API client (basic auth)
- `storyblok-management.ts` — Updates Storyblok event stories via Management API
- `availability-hydration.ts` — Client-side script to update badges

### API Endpoints

| Endpoint                   | Method | Purpose                              |
| -------------------------- | ------ | ------------------------------------ |
| `/api/acuity/availability` | GET    | Query live availability from Acuity  |
| `/api/acuity/webhook`      | POST   | Receive Acuity booking notifications |

## Testing

### Local Development

1. Set environment variables in `.env`
2. Run `npm run dev`
3. Visit `/contacts` — should show Acuity embed iframe
4. Visit an event page with `acuity_appointment_type_id` set — should show embed

### API Endpoints

```bash
# Test availability
curl "http://localhost:4321/api/acuity/availability?appointmentTypeId=12345&month=2026-03"

# Test webhook (simulate booking)
curl -X POST "http://localhost:4321/api/acuity/webhook?secret=YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"action":"scheduled","id":1,"calendarID":1,"appointmentTypeID":12345,"classID":67890}'
```

## Troubleshooting

### Embed Not Loading

- Verify `PUBLIC_ACUITY_OWNER_ID` is correct
- Check browser console for errors
- Ensure Acuity account is active

### Availability Not Updating

- Check `ACUITY_USER_ID` and `ACUITY_API_KEY` are correct
- Verify webhook URL is reachable from Acuity
- Check server logs for API errors

### Sold Out Not Showing

- Verify `acuity_class_id` matches the Acuity class instance
- Check if `sold_out_override` is accidentally set
- Test `/api/acuity/availability` endpoint directly

## Finding Acuity IDs

### Owner ID

URL: `https://app.acuityscheduling.com/schedule.php?owner=**12345678**`

### Appointment Type ID

1. Go to Acuity > **Appointment Types**
2. Click to edit an appointment type
3. ID is in the URL: `/appointment-types/**12345**/edit`

### Class ID

1. Go to Acuity > **Availability** > **Classes**
2. Click a specific class instance
3. ID is in the URL or API response
