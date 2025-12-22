# Calendly Integration Setup

Quick guide for integrating Calendly booking into your site.

## Prerequisites

- Calendly account (free tier works)
- Event types created in Calendly

## Quick Setup

### 1. Get Your Calendly URLs

1. Log into [Calendly](https://calendly.com/)
2. Go to your event types
3. Copy the booking URL for each event type

Example URLs:
- `https://calendly.com/your-username/workshop`
- `https://calendly.com/your-username/private-session`

### 2. Add to Environment Variables

Add to your `.env` file:

```bash
PUBLIC_CALENDLY_EVENT_URL=https://calendly.com/your-username/workshop
PUBLIC_CALENDLY_PRIVATE_URL=https://calendly.com/your-username/private-session
```

### 3. Configure Events in Storyblok

For each event in Storyblok:
1. Edit the event
2. Add Calendly URL to **Booking URL** field
3. Save and Publish

The "Book Now" button will now link to your Calendly booking page.

## Embedded vs. Redirect

### Current Implementation: Redirect (Simplest)
- User clicks "Book Now"
- Opens Calendly in new tab
- ✅ Simple, reliable
- ✅ No additional setup
- ✅ Mobile-friendly

### Optional: Inline Embed
To embed Calendly directly on your site:

1. Install Calendly widget:
```bash
npm install react-calendly
```

2. Update `CalendlyEmbed.astro` component
3. Add embed widget to contacts page

## Customization

### Branded Calendly (Paid Plans)

Customize appearance:
1. Calendly → Account → **Branding**
2. Upload logo
3. Set brand colors
4. Add custom questions

### Event Type Setup

For each event type:
- **Duration**: Set appropriate length
- **Location**: Add studio address or video link
- **Questions**: Ask relevant questions
- **Notifications**: Configure email reminders
- **Limits**: Set max bookings per day

## Multiple Event Types

Create different Calendly events for:
- Beginner workshops (60 min)
- Intermediate workshops (90 min)
- Private sessions (45 min)
- Group sessions (120 min)

Link each to appropriate events in Storyblok.

## Testing

1. Visit `/contacts` or `/events` page
2. Click "Book Now" button
3. Should open Calendly booking page
4. Test booking flow (don't submit)

## Troubleshooting

### Button Doesn't Work
- Check URL is correct in Storyblok
- Verify environment variable is set
- Restart dev server after changing `.env`

### Wrong Event Type Opens
- Check booking_url field in Storyblok
- Ensure correct URL for each event

### Mobile Issues
- Calendly is mobile-responsive by default
- Test on actual device for best results

## Resources

- [Calendly Documentation](https://help.calendly.com/)
- [Calendly API](https://developer.calendly.com/)
- [Embed Options](https://help.calendly.com/hc/en-us/articles/223147027)



